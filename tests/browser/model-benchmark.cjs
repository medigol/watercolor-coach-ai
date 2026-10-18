// ORIGINAL technical rasters; no artwork recognition or paid provider traffic.
const { chromium } = require("playwright"),
  fs = require("node:fs"),
  path = require("node:path"),
  os = require("node:os"),
  assert = require("node:assert/strict");
const { prepare } = require("../../scripts/benchmark/prepare.cjs");
const { plan, run } = require("../../scripts/benchmark/runner.cjs");
const { hash } = require("../../scripts/benchmark/production.cjs");
(async () => {
  const root = fs.mkdtempSync(
    path.join(os.tmpdir(), "watercolor-benchmark-browser-"),
  );
  fs.chmodSync(root, 0o700);
  fs.mkdirSync(path.join(root, "originals"), { mode: 0o700 });
  const browser = await chromium.launch({
    executablePath: process.env.BENCH_CHROMIUM || "/usr/bin/chromium",
    args: ["--no-sandbox"],
  });
  const errors = [],
    requests = [];
  let page;
  try {
    page = await browser.newPage();
    page.on("pageerror", (e) => errors.push(e.message));
    await page.route("**/*", (r) => {
      requests.push(r.request().url());
      return r.abort();
    });
    const fixture = await page.evaluate(() => {
      function canvas(w, h, alpha = false) {
        const c = document.createElement("canvas");
        c.width = w;
        c.height = h;
        const x = c.getContext("2d");
        if (!alpha) {
          x.fillStyle = "#fff";
          x.fillRect(0, 0, w, h);
        }
        return [c, x];
      }
      const result = {};
      let [c, x] = canvas(420, 900);
      x.fillStyle = "#c04020";
      x.fillRect(0, 0, 420, 450);
      x.fillStyle = "#2040c0";
      x.fillRect(0, 450, 420, 450);
      result.C01 = c.toDataURL();
      [c, x] = canvas(800, 600);
      x.fillStyle = "#245070";
      x.fillRect(80, 60, 640, 480);
      result.C09 = c.toDataURL();
      [c, x] = canvas(600, 400);
      x.fillStyle = "#222";
      x.fillRect(0, 0, 600, 50);
      x.fillStyle = "#eee";
      x.fillRect(0, 50, 100, 350);
      x.fillStyle = "#386050";
      x.fillRect(170, 100, 300, 250);
      result.C13 = c.toDataURL();
      [c, x] = canvas(800, 400);
      x.fillStyle = "#c04020";
      x.fillRect(0, 0, 400, 400);
      x.fillStyle = "#2040c0";
      x.fillRect(400, 0, 400, 400);
      result.C03 = c.toDataURL("image/jpeg", 0.96);
      [c, x] = canvas(512, 512, true);
      x.fillStyle = "#387050";
      x.fillRect(200, 200, 100, 100);
      result.C05 = c.toDataURL();
      [c, x] = canvas(1600, 256);
      x.fillStyle = "#467080";
      x.fillRect(0, 0, 1600, 256);
      result.C07 = c.toDataURL();
      return result;
    });
    const manifest = structuredClone(
      require("../../docs/benchmark/manifest.example.json"),
    );
    for (const c of manifest.cases) {
      if (!fixture[c.case_id]) continue;
      let bytes = Buffer.from(fixture[c.case_id].split(",")[1], "base64");
      if (c.case_id === "C03") {
        // Original technical JPEG, EXIF orientation 6. No copied image asset.
        const app = Buffer.from([
          255, 225, 0, 34, 69, 120, 105, 102, 0, 0, 73, 73, 42, 0, 8, 0, 0, 0,
          1, 0, 18, 1, 3, 0, 1, 0, 0, 0, 6, 0, 0, 0, 0, 0, 0, 0,
        ]);
        bytes = Buffer.concat([bytes.subarray(0, 2), app, bytes.subarray(2)]);
      }
      c.file =
        "originals/" + c.case_id + (c.case_id === "C03" ? ".jpg" : ".png");
      fs.writeFileSync(path.join(root, c.file), bytes, { mode: 0o600 });
      c.source = "Original synthetic technical fixture";
      c.permission = "No API transmission authorized";
      if (c.case_id === "C09") {
        c.confirmed_region = { x: 0.1, y: 0.1, width: 0.8, height: 0.8 };
        c.expected_painting_region = { ...c.confirmed_region };
      }
    }
    const file = path.join(root, "manifest.json"),
      out = path.join(root, "prepared");
    fs.writeFileSync(file, JSON.stringify(manifest), { mode: 0o600 });
    const first = await prepare({
      manifest: file,
      output: out,
      cases: "C01,C09,C13",
      chromiumPath: process.env.BENCH_CHROMIUM || "/usr/bin/chromium",
    });
    assert.equal(first.prepared, 3);
    assert.equal(first.networkRequests, 0);
    // Later annotations for UNPREPARED cases may be completed without replaying
    // pilot slots or mutating any existing prepared case.
    manifest.cases.find((c) => c.case_id === "C03").notes =
      "Technical EXIF rotation case";
    fs.writeFileSync(file, JSON.stringify(manifest));
    const second = await prepare({
      manifest: file,
      output: out,
      cases: "C03,C05,C07",
      chromiumPath: process.env.BENCH_CHROMIUM || "/usr/bin/chromium",
    });
    assert.equal(second.prepared, 6);
    const data = JSON.parse(fs.readFileSync(path.join(out, "prepared.json")));
    const record = (id) => data.cases.find((c) => c.case_id === id);
    assert.equal(record("C09").width, 640);
    assert.equal(record("C09").height, 480);
    assert(record("C09").autoCropMetrics.iou > 0.9);
    assert.equal(record("C09").appliedCropMetrics.paintingCoverage, 1);
    assert.equal(record("C03").exifOrientation, 6);
    assert.equal(record("C03").sourceRawDimensions.width, 800);
    assert.equal(record("C03").sourceWidth, 400);
    assert.equal(record("C03").sourceHeight, 800);
    assert.equal(record("C13").width, 600);
    assert.equal(record("C13").height, 400); // UI not removed.
    for (const c of data.cases)
      assert.equal(hash(fs.readFileSync(path.join(out, c.image))), c.imageHash);
    async function sample(id, x, y) {
      const c = record(id),
        bytes = fs.readFileSync(path.join(out, c.image));
      return page.evaluate(
        async ({ b64, x, y }) => {
          const im = new Image();
          im.src = "data:image/png;base64," + b64;
          await im.decode();
          const c = document.createElement("canvas");
          c.width = im.width;
          c.height = im.height;
          const cx = c.getContext("2d");
          cx.drawImage(im, 0, 0);
          return [...cx.getImageData(x, y, 1, 1).data];
        },
        { b64: bytes.toString("base64"), x, y },
      );
    }
    assert.deepEqual(await sample("C05", 0, 0), [255, 255, 255, 255]);
    const top = await sample("C03", 200, 100),
      bottom = await sample("C03", 200, 700);
    assert(top[0] > top[2]);
    assert(bottom[2] > bottom[0]);
    assert.deepEqual(await sample("C13", 10, 10), [34, 34, 34, 255]);
    assert.equal(
      plan({ prepared: out, cases: "C01,C09,C13" }).calls.length,
      12,
    );
    let paid = 0;
    const dry = await run(
      { prepared: out },
      () => {
        paid++;
        throw Error("No network permitted");
      },
      { OPENAI_API_KEY: "unused-mock" },
    );
    assert.equal(paid, 0);
    assert.equal(dry.paidRequests, 0);
    manifest.cases.find((c) => c.case_id === "C01").notes =
      "Changed after immutable preparation";
    fs.writeFileSync(file, JSON.stringify(manifest));
    await assert.rejects(
      prepare({
        manifest: file,
        output: out,
        cases: "C01,C09,C13",
        chromiumPath: "/usr/bin/chromium",
      }),
    );
    assert.deepEqual(errors, []);
    assert.deepEqual(requests, []);
    console.log(
      JSON.stringify(
        {
          technicalFixtures: 6,
          checks: [
            "actual production preparation",
            "local proposal versus independent annotation",
            "manual crop pixels",
            "raw UI retained",
            "EXIF rotation pixels",
            "alpha white matte",
            "immutable hashes",
            "incremental pilot preparation",
            "mutation rejected",
            "free dry-run",
          ],
          providerCalls: 0,
          networkRequests: 0,
          browserErrors: 0,
          artisticAccuracy: "not evaluated",
          privateArtifacts: root,
        },
        null,
        2,
      ),
    );
  } finally {
    await browser.close();
  }
})().catch(() => {
  console.error("Technical benchmark browser validation failed");
  process.exitCode = 1;
});
