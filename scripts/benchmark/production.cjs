// Developer-only, pure production imports. Never load the Edge entrypoint/SDK.
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const ts = require("typescript");
const ROOT = path.resolve(__dirname, "../..");
const hash = (value) => crypto.createHash("sha256").update(value).digest("hex");
function production() {
  const cache = new Map(),
    sources = {};
  function load(file) {
    file = path.resolve(file);
    if (!file.endsWith(".ts")) file += ".ts";
    if (
      ![
        path.join(ROOT, "shared/"),
        path.join(ROOT, "supabase/functions/_shared/"),
      ].some((p) => file.startsWith(p))
    )
      throw Error("Non-pure production import blocked");
    if (cache.has(file)) return cache.get(file);
    const source = fs.readFileSync(file, "utf8"),
      output = {};
    sources[path.relative(ROOT, file)] = hash(source);
    cache.set(file, output);
    const code = ts.transpileModule(source, {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
      },
    }).outputText;
    new Function("exports", "require", code)(output, (name) => {
      if (!name.startsWith("."))
        throw Error("External production import blocked");
      return load(path.resolve(path.dirname(file), name));
    });
    return output;
  }
  const prompt = load(
    path.join(ROOT, "supabase/functions/_shared/prompts.ts"),
  ).paintingAnalysisPrompt;
  const contract = load(
    path.join(ROOT, "supabase/functions/_shared/contract.ts"),
  );
  const eligibility = load(
    path.join(ROOT, "shared/artworkEligibility.ts"),
  ).artworkEligibility;
  const normalize = load(
    path.join(ROOT, "shared/providerPaintingAnalysis.ts"),
  ).normalizeProviderPaintingAnalysis;
  const preparation = load(path.join(ROOT, "shared/artworkPreparation.ts"));
  const geometry = load(path.join(ROOT, "shared/imageGeometry.ts"));
  const entry = fs.readFileSync(
    path.join(ROOT, "supabase/functions/generate-feedback/index.ts"),
    "utf8",
  );
  // Extract, rather than paraphrase, the exact production user instruction.
  const ast = ts.createSourceFile(
    "index.ts",
    entry,
    ts.ScriptTarget.Latest,
    true,
  );
  const literals = [];
  function visit(n) {
    if (
      ts.isStringLiteral(n) &&
      n.text.startsWith("Assess artwork eligibility and,")
    )
      literals.push(n.text);
    ts.forEachChild(n, visit);
  }
  visit(ast);
  if (literals.length !== 1)
    throw Error("Production instruction changed; review benchmark lock");
  sources["supabase/functions/generate-feedback/index.ts"] = hash(entry);
  const schema = contract.providerFeedbackSchema("improve_painting");
  sources["lib/prepareArtwork.ts"] = hash(
    fs.readFileSync(path.join(ROOT, "lib/prepareArtwork.ts")),
  );
  const identity = {
    prompt: hash(prompt),
    user: hash(literals[0]),
    schema: hash(JSON.stringify(schema)),
    sources: Object.fromEntries(Object.entries(sources).sort()),
  };
  return {
    prompt,
    user: literals[0],
    schema,
    identity,
    contract,
    eligibility,
    normalize,
    preparation,
    geometry,
  };
}
function lockedProduction() {
  const p = production(),
    lock = JSON.parse(
      fs.readFileSync(
        path.join(ROOT, "docs/benchmark/production-lock.json"),
        "utf8",
      ),
    );
  if (JSON.stringify(p.identity) !== JSON.stringify(lock))
    throw Error(
      "Production hashes changed: review and explicitly refresh the benchmark lock before evaluation",
    );
  return p;
}
module.exports = { ROOT, hash, production, lockedProduction };
