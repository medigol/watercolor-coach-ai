const fs = require("node:fs"),
  path = require("node:path");
const ts = require("typescript");
const { ROOT, hash, lockedProduction } = require("./production.cjs");
const {
  external,
  privateDir,
  writePrivate,
  localFile,
} = require("./safety.cjs");
const { readManifest, selectCases, roiMetrics } = require("./manifest.cjs");
// Execute the ACTUAL web preparation adapter in a network-blocked browser.
// Playwright is an optional developer tool, never a product dependency.
function browserModules() {
  const files = [
    "lib/prepareArtwork.ts",
    "shared/artworkPreparation.ts",
    "shared/imageGeometry.ts",
  ];
  return Object.fromEntries(
    files.map((f) => [
      f,
      ts.transpileModule(fs.readFileSync(path.join(ROOT, f), "utf8"), {
        compilerOptions: {
          module: ts.ModuleKind.CommonJS,
          target: ts.ScriptTarget.ES2022,
        },
      }).outputText,
    ]),
  );
}
async function prepare({ manifest, output, cases, chromiumPath }) {
  const p = lockedProduction(),
    m = readManifest(manifest),
    root = path.dirname(external(manifest, true)),
    out = privateDir(output);
  const metaFile = path.join(out, "prepared.json"),
    manifestHash = hash(JSON.stringify(m));
  const data = fs.existsSync(metaFile)
    ? JSON.parse(fs.readFileSync(metaFile, "utf8"))
    : {
        version: 1,
        experimentID: require("node:crypto").randomUUID(),
        manifestHash,
        production: p.identity,
        cases: [],
      };
  if (
    JSON.stringify(data.production) !== JSON.stringify(p.identity) ||
    data.cases.some(
      (old) =>
        hash(JSON.stringify(m.cases.find((c) => c.case_id === old.case_id))) !==
        old.annotationHash,
    )
  )
    throw Error(
      "Prepared experiment changed; choose a new private experiment directory",
    );
  data.manifestHash = manifestHash;
  let chromium;
  try {
    chromium = require("playwright").chromium;
  } catch {
    throw Error(
      "Local preparation requires developer Playwright and Chromium; see benchmark README (no API needed)",
    );
  }
  const browser = await chromium.launch({
    headless: true,
    ...(chromiumPath ? { executablePath: chromiumPath } : {}),
    args: ["--no-sandbox"],
  });
  try {
    const context = await browser.newContext();
    let networkRequests = 0;
    await context.route("**/*", (route) => {
      networkRequests++;
      return route.abort();
    }); // No network, even for hostile image metadata.
    const page = await context.newPage();
    const modules = browserModules();
    for (const c of selectCases(m.cases, cases)) {
      if (
        c.preparation === "manual" &&
        !p.geometry.validRect(c.confirmed_region)
      )
        throw Error(
          "Selected manual crop needs confirmed normalized rectangle",
        );
      if (c.preparation === "candidate" && c.candidate_confirmed !== true)
        throw Error(
          "Selected candidate requires explicit local human confirmation",
        );
      const sourceFile = localFile(root, c.file);
      if (fs.statSync(sourceFile).size > p.preparation.preparationLimits.bytes)
        throw Error("Source file exceeds production preparation limit");
      const source = fs.readFileSync(sourceFile),
        header = p.preparation.imageHeader(source);
      const old = data.cases.find((x) => x.case_id === c.case_id);
      if (old) {
        if (old.sourceHash !== hash(source))
          throw Error("Source changed after preparation");
        continue;
      }
      const result = await page.evaluate(
        async ({
          modules,
          b64,
          mime,
          choice,
          confirmed,
          candidateConfirmed,
        }) => {
          const cache = {};
          function load(file) {
            if (file === "react-native") return { Platform: { OS: "web" } };
            if (file === "expo-image-manipulator")
              return {
                SaveFormat: { PNG: "png" },
                manipulateAsync: () => {
                  throw Error(
                    "Native preparation is unavailable in browser benchmark",
                  );
                },
              };
            if (cache[file]) return cache[file];
            if (!modules[file])
              throw Error("Unexpected browser preparation import");
            const output = {};
            cache[file] = output;
            new Function("exports", "require", modules[file])(
              output,
              (name) => {
                if (!name.startsWith(".")) return load(name);
                const parts = file.split("/");
                parts.pop();
                for (const part of name.split("/"))
                  if (part === "..") parts.pop();
                  else if (part !== ".") parts.push(part);
                return load(parts.join("/").replace(/\.ts$/, "") + ".ts");
              },
            );
            return output;
          }
          const raw = Uint8Array.from(atob(b64), (x) => x.charCodeAt(0));
          const url = URL.createObjectURL(new Blob([raw], { type: mime }));
          let prep;
          try {
            prep = await load("lib/prepareArtwork.ts").prepareArtwork({
              uri: url,
            });
            const region =
              choice === "manual"
                ? confirmed
                : choice === "candidate" && candidateConfirmed
                  ? prep.proposal
                  : { x: 0, y: 0, width: 1, height: 1 };
            if (!region)
              throw Error(
                "No local boundary proposal; manually annotate/confirm instead",
              );
            const im = await prep.export(region);
            let binary = "";
            for (let i = 0; i < im.bytes.length; i += 8192)
              binary += String.fromCharCode(...im.bytes.subarray(i, i + 8192));
            return {
              base64: btoa(binary),
              sourceWidth: prep.width,
              sourceHeight: prep.height,
              width: im.width,
              height: im.height,
              mime: im.mimeType,
              proposal: prep.proposal,
              appliedRegion: region,
            };
          } finally {
            prep?.dispose();
            URL.revokeObjectURL(url);
          }
        },
        {
          modules,
          b64: source.toString("base64"),
          mime: header.mime,
          choice: c.preparation,
          confirmed: c.confirmed_region,
          candidateConfirmed: c.candidate_confirmed,
        },
      );
      const bytes = Buffer.from(result.base64, "base64");
      delete result.base64;
      const image =
        c.case_id + (result.mime === "image/jpeg" ? ".jpg" : ".png");
      p.preparation.imageHeader(bytes);
      writePrivate(path.join(out, image), bytes, true);
      data.cases.push({
        ...c,
        ...result,
        image,
        annotationHash: hash(JSON.stringify(c)),
        sourceHash: hash(source),
        imageHash: hash(bytes),
        sourceRawDimensions: { width: header.width, height: header.height },
        exifOrientation: header.orientation,
        autoCropMetrics: roiMetrics(
          result.proposal,
          c.expected_painting_region,
        ),
        appliedCropMetrics: roiMetrics(
          result.appliedRegion,
          c.expected_painting_region,
        ),
      });
      writePrivate(metaFile, data);
    }
    if (networkRequests)
      throw Error("Unexpected network attempted during local preparation");
    return {
      prepared: data.cases.length,
      manifestCases: 24,
      output: out,
      networkRequests,
    };
  } finally {
    await browser.close();
  }
}
module.exports = { prepare, browserModules };
