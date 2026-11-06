// Actual Expo application. Every backend response is deterministic and labelled;
// no production account, real photograph, provider call or payment is used.
const { chromium } = require("playwright"),
  fs = require("node:fs"),
  path = require("node:path"),
  assert = require("node:assert/strict");
const { png, hash, owner } = require("../helpers/reference-fixture.cjs");
const base = process.argv[2],
  out = process.argv[3] || "/tmp/photo-reference-studio/browser";
fs.mkdirSync(out, { recursive: true });
const model = "gpt-image-2-2026-04-21",
  records = new Map(),
  objects = new Map(),
  requests = [],
  unexpected = [],
  errors = [],
  matrix = [];
let enabled = false,
  remaining = 4,
  rejectedCode,
  uncertain = false,
  uploadFail = false,
  dispatches = 0,
  hold;
let user = {
  id: owner,
  aud: "authenticated",
  role: "authenticated",
  email: "reference-fixture@example.invalid",
  email_confirmed_at: new Date().toISOString(),
  app_metadata: { provider: "email", providers: ["email"] },
  user_metadata: {},
  created_at: new Date().toISOString(),
};
const token = (u) =>
  [{ alg: "HS256", typ: "JWT" }, {
    sub: u.id,
    aud: "authenticated",
    role: "authenticated",
    exp: Math.floor(Date.now() / 1000) + 3600,
  }, "synthetic"].map((v, i) =>
    i < 2 ? Buffer.from(JSON.stringify(v)).toString("base64url") : v
  ).join(".");
(async () => {
  const browser = await chromium.launch({
    executablePath: "/usr/bin/chromium",
    args: ["--no-sandbox"],
  });
  let page;
  try {
    const context = await browser.newContext({
      viewport: { width: 390, height: 900 },
      acceptDownloads: true,
    });
    page = await context.newPage();
    page.setDefaultTimeout(20000);
    page.on("pageerror", (e) => errors.push(e.message));
    await context.route("**/*", async (route) => {
      const req = route.request(), url = new URL(req.url());
      if (url.origin === new URL(base).origin) return route.continue();
      if (url.hostname !== "watercolor-test.supabase.co") {
        unexpected.push(url.href);
        return route.abort();
      }
      requests.push({ path: url.pathname, method: req.method() });
      const reply = (v, status = 200) =>
        route.fulfill({
          status,
          contentType: "application/json",
          body: JSON.stringify(v),
        });
      const p = url.pathname;
      if (req.method() === "OPTIONS") {
        return route.fulfill({
          status: 204,
          headers: {
            "access-control-allow-origin": "*",
            "access-control-allow-headers": "*",
          },
        });
      }
      if (p.endsWith("/user")) return reply(user);
      if (p.endsWith("/token")) {
        return reply({
          user,
          access_token: token(user),
          refresh_token: "synthetic",
          expires_in: 3600,
          token_type: "bearer",
        });
      }
      if (p.endsWith("/profiles")) {
        return reply({ display_name: "Reference QA" });
      }
      if (p.endsWith("/artworks")) return reply([]);
      if (p.endsWith("/reference_generations")) {
        const id = url.searchParams.get("id")?.replace(/^eq\./, "");
        return id
          ? reply(
            records.get(id)?.user_id === user.id
              ? records.get(id)
              : { message: "not found" },
            records.get(id)?.user_id === user.id ? 200 : 404,
          )
          : reply([...records.values()].filter((r) => r.user_id === user.id));
      }
      if (p.endsWith("/transform-reference")) {
        const r = req.postDataJSON();
        if (r.action === "capabilities") {
          return reply({ enabled, remaining: enabled ? remaining : 0 });
        }
        assert.equal(r.ownerId, user.id);
        assert.equal(r.paidConsent, true);
        assert(!records.has(r.id));
        if (rejectedCode) return reply({ code: rejectedCode }, 422);
        dispatches++;
        const record = {
          id: r.id,
          user_id: r.ownerId,
          status: uncertain ? "uncertain" : "completed",
          request_json: r,
          output_path: null,
          output_metadata: null,
          created_at: new Date().toISOString(),
        };
        if (!uncertain) {
          const size = require("../helpers/reference-loader.cjs")(
            "shared/referenceStudio.ts",
          ).outputSize(r).split("x").map(Number);
          const b = png(...size, "landscape");
          record.output_path = `${r.ownerId}/${r.id}/generated.png`;
          record.output_metadata = {
            width: size[0],
            height: size[1],
            bytes: b.length,
            sha256: hash(b),
            model,
          };
          objects.set(record.output_path, { bytes: b, type: "image/png" });
        }
        records.set(r.id, record);
        if (hold) await hold;
        return uncertain
          ? reply({ code: "completion_uncertain", id: r.id }, 202)
          : reply({ record });
      }
      if (p.includes("/storage/v1/object/")) {
        let object = decodeURIComponent(p.split("/reference-studio/")[1] || "");
        assert(object.startsWith(user.id + "/"));
        if (req.method() === "POST") {
          if (uploadFail) return reply({ error: "upload" }, 503);
          assert(!objects.has(object));
          objects.set(object, {
            bytes: req.postDataBuffer(),
            type: object.endsWith(".jpg") ? "image/jpeg" : "image/png",
          });
          return reply({ Key: "reference-studio/" + object });
        }
        const b = objects.get(object);
        return b
          ? route.fulfill({ contentType: b.type, body: b.bytes })
          : reply({ error: "not found" }, 404);
      }
      unexpected.push(req.method() + " " + p);
      return route.abort();
    });
    await page.addInitScript(({ user, access, origin }) => {
      if (location.origin === origin) {
        localStorage.setItem(
          "sb-watercolor-test-auth-token",
          JSON.stringify({
            user,
            access_token: access,
            refresh_token: "synthetic",
            expires_at: Math.floor(Date.now() / 1000) + 3600,
            token_type: "bearer",
          }),
        );
        localStorage.setItem(
          "watercolor:learning:v1:" + user.id,
          '{"untouched":"existing-progress-fixture"}',
        );
      }
    }, { user, access: token(user), origin: new URL(base).origin });
    const b = (name) => page.getByRole("button", { name, exact: true });
    async function fixtureBanner() {
      await page.getByRole("main", {
        name: "Painting Reference Studio",
        exact: true,
      }).evaluate((el) => {
        if (el.querySelector("[data-fixture-label]")) return;
        const p = document.createElement("p");
        p.dataset.fixtureLabel = "true";
        p.textContent = "LOCAL SYNTHETIC FIXTURE · NO REAL AI OUTPUT";
        p.style.cssText =
          "position:sticky;top:0;z-index:99;background:#fff2bd;color:#402c00;padding:8px;margin:0;font:700 12px system-ui";
        el.prepend(p);
      });
    }
    async function shot(name, width = 390, heading) {
      await page.setViewportSize({ width, height: 1000 });
      await fixtureBanner();
      if (heading) {
        await page.getByRole("heading", { name: heading, exact: true })
          .evaluate((e) => {
            e.scrollIntoView({ block: "start" });
            const main = e.closest("main");
            if (main) main.scrollTop = Math.max(0, main.scrollTop - 64);
          });
      } else {await page.getByRole("main", {
          name: "Painting Reference Studio",
          exact: true,
        }).evaluate((e) => e.scrollTop = 0);}
      await page.screenshot({ path: path.join(out, name + ".png") });
    }
    async function upload(kind = "landscape") {
      await page.locator("input[type=file]").setInputFiles({
        name: kind + "-SYNTHETIC.png",
        mimeType: "image/png",
        buffer: png(320, 240, kind),
      });
      await page.getByAltText(
        "Prepared reference input — local pixel adjustments, not AI transformation",
      ).waitFor();
    }
    async function scenario(name, fn) {
      await fn();
      matrix.push({ name, status: "PASS" });
      console.log("PASS " + name);
    }
    await page.goto(base + "/upload/create-reference");
    await page.getByRole("heading", {
      name: "Create a painting reference",
      exact: true,
    }).waitFor();
    await scenario(
      "Generation fails closed before configuration and without an actual decoded photo",
      async () => {
        assert(await b("Generate improved reference").isDisabled());
        await shot("01-upload-mobile");
        await upload();
        assert(await b("Generate improved reference").isDisabled());
        assert.equal(dispatches, 0);
        await shot("02-local-preparation-mobile");
      },
    );
    await scenario(
      "Malformed images are rejected before upload; original bytes survive local preparation",
      async () => {
        await page.locator("input[type=file]").setInputFiles({
          name: "fake.png",
          mimeType: "image/png",
          buffer: Buffer.alloc(40),
        });
        await page.getByRole("alert").filter({
          hasText: "Choose a JPEG or PNG",
        }).waitFor();
        assert.equal(objects.size, 0);
        await upload();
        const original = page.getByAltText("Original photograph — unchanged");
        const originalHash = await original.evaluate(async (e) => {
          const b = await (await fetch(e.src)).arrayBuffer();
          return [...new Uint8Array(await crypto.subtle.digest("SHA-256", b))]
            .map((n) => n.toString(16).padStart(2, "0")).join("");
        });
        assert.equal(originalHash, hash(png(320, 240)));
      },
    );
    await scenario(
      "JPEG EXIF orientation is normalised before processing while source bytes stay intact",
      async () => {
        const encoded = await page.evaluate(() => {
          const canvas = document.createElement("canvas");
          canvas.width = 64;
          canvas.height = 48;
          const c = canvas.getContext("2d");
          c.fillStyle = "#6a8178";
          c.fillRect(0, 0, 64, 48);
          return canvas.toDataURL("image/jpeg").split(",")[1];
        });
        const jpeg = Buffer.from(encoded, "base64"),
          exif = Buffer.from([
            255,
            225,
            0,
            34,
            69,
            120,
            105,
            102,
            0,
            0,
            73,
            73,
            42,
            0,
            8,
            0,
            0,
            0,
            1,
            0,
            18,
            1,
            3,
            0,
            1,
            0,
            0,
            0,
            6,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
          ]);
        const bytes = Buffer.concat([
          jpeg.subarray(0, 2),
          exif,
          jpeg.subarray(2),
        ]);
        await page.locator("input[type=file]").setInputFiles({
          name: "orientation-SYNTHETIC.jpg",
          mimeType: "image/jpeg",
          buffer: bytes,
        });
        await page.waitForFunction(() => {
          const e = document.querySelector(
            'img[alt^="Prepared reference input"]',
          );
          return e?.naturalWidth === 48 && e?.naturalHeight === 64;
        });
        assert.equal(dispatches, 0);
        assert.equal(objects.size, 0);
      },
    );
    enabled = true;
    await page.reload();
    await page.getByRole("heading", {
      name: "Create a painting reference",
      exact: true,
    }).waitFor();
    await upload();
    await scenario(
      "Local crop/rotation and actual value PNG export work without AI or image upload",
      async () => {
        await page.getByText("Crop, rotation and colour preparation", {
          exact: true,
        }).click();
        await b("Rotate 90°").click();
        await page.waitForFunction(() => {
          const e = document.querySelector(
            'img[alt^="Prepared reference input"]',
          );
          return e?.naturalWidth === 240 && e?.naturalHeight === 320;
        });
        await b("Reset preparation").click();
        await page.getByLabel("Crop width (%)", { exact: true }).fill("50");
        await page.waitForFunction(() => {
          const e = document.querySelector(
            'img[alt^="Prepared reference input"]',
          );
          return e?.naturalWidth === 160 && e?.naturalHeight === 240;
        });
        await b("Reset preparation").click();
        await page.getByText("Crop, rotation and colour preparation", {
          exact: true,
        }).click();
        const dl = page.waitForEvent("download");
        await b("Export this planning PNG").click();
        const f = await (await dl).path();
        const bytes = fs.readFileSync(f);
        assert.equal(bytes.toString("ascii", 1, 4), "PNG");
        assert.equal(dispatches, 0);
        assert.equal(objects.size, 0);
        await shot("03-value-study-mobile", 390, "Plan the large values");
        const planDownload = page.waitForEvent("download");
        await b("Export request details for approval").click();
        const plan = JSON.parse(
          fs.readFileSync(await (await planDownload).path()),
        );
        assert.equal(plan.schema, "reference-test-plan/v1");
        assert.equal(plan.configuration.ownerId, owner);
        assert.equal(plan.configuration.source.sha256, hash(png(320, 240)));
        assert.equal(plan.configuration.model, model);
        assert.equal(plan.configuration.images, 1);
        assert(!JSON.stringify(plan).includes("paidConsent"));
        assert.equal(dispatches, 0);
        await shot("17-request-approval-mobile", 390, "Prepared input");
        await shot("18-request-approval-desktop", 1440, "Prepared input");
      },
    );
    await scenario(
      "Intentions and bounded preserve/change controls reach one explicit request",
      async () => {
        await page.getByLabel("What should this reference help you do?")
          .selectOption("composition");
        await page.getByText("What to preserve and change", { exact: true })
          .click();
        await page.getByLabel("Specific objects, colours or lights to keep")
          .fill("Keep the old building and the main light.");
        await page.getByLabel("Optional short instruction").fill(
          "Remove the parked car only; keep the main subject.",
        );
        await shot(
          "04-artistic-controls-desktop",
          1440,
          "2. Your artistic intention",
        );
        await page.getByText("What to preserve and change", { exact: true })
          .click();
        assert(await b("Generate improved reference").isDisabled());
        await page.getByRole("checkbox", { name: /I authorise one image-edit/ })
          .check();
        let release;
        hold = new Promise((r) => release = r);
        await b("Generate improved reference").click();
        await page.getByRole("status").filter({
          hasText: "Generating one improved reference",
        }).waitFor();
        assert(await b("Generating one reference…").isDisabled());
        await shot("05-generating-mobile", 390, "3. Generate one reference");
        release();
        hold = undefined;
        await page.getByRole("heading", {
          name: "Your painting reference",
          exact: true,
        }).waitFor();
        assert.equal(dispatches, 1);
        const r = [...records.values()][0];
        assert.equal(r.request_json.direction.goal, "composition");
        assert(
          r.request_json.direction.preserve.details.includes("old building"),
        );
        assert.equal(r.request_json.source.sha256, hash(png(320, 240)));
        assert(r.output_metadata);
      },
    );
    await scenario(
      "Real fixture image bytes, before/after, planning, guidance and exports render; reload never generates",
      async () => {
        await page.getByAltText(
          "AI-edited reference — inspect fidelity before using it for painting",
        ).waitFor();
        await shot("06-reference-result-desktop", 1440, "Improved reference");
        await shot("07-comparison-mobile", 390, "Before / after");
        await b("5 value groups").click();
        await page.getByAltText(
          "5-value tonal study — computed from the selected reference",
        ).waitFor();
        await shot("08-planning-result-mobile", 390, "Plan the large values");
        await shot(
          "09-painting-guidance-desktop",
          1440,
          "Take the reference to paper",
        );
        const dl = page.waitForEvent("download");
        await b("Export improved reference PNG").click();
        assert.equal(
          hash(fs.readFileSync(await (await dl).path())),
          [...records.values()][0].output_metadata.sha256,
        );
        await page.reload();
        await page.getByRole("heading", {
          name: "Your painting reference",
          exact: true,
        }).waitFor();
        assert.equal(dispatches, 1);
        assert.equal(
          await page.evaluate(
            (k) => localStorage.getItem(k),
            "watercolor:learning:v1:" + owner,
          ),
          "{" + '"untouched":"existing-progress-fixture"}',
        );
      },
    );
    await scenario(
      "Refinement derives from the selected saved output, needs fresh consent and records lineage",
      async () => {
        const parent = [...records.values()][0];
        await b("Refine this reference · separate paid attempt").click();
        await page.getByAltText(
          "Prepared reference input — local pixel adjustments, not AI transformation",
        ).waitFor();
        assert(await b("Generate improved reference").isDisabled());
        await page.getByAltText("Selected parent reference — unchanged")
          .waitFor();
        await shot("13-refinement-source-mobile", 390, "1. Selected reference");
        await b("Prepare a separate attempt").click();
        await page.getByRole("checkbox", { name: /I authorise one image-edit/ })
          .check();
        uncertain = true;
        await b("Generate improved reference").click();
        await page.getByRole("heading", {
          name: "Your painting reference",
          exact: true,
        }).waitFor();
        await page.getByRole("status").filter({
          hasText: "Completion is uncertain",
        }).waitFor();
        assert.equal(dispatches, 2);
        const r = [...records.values()][1];
        assert.equal(r.request_json.parentId, parent.id);
        assert.equal(
          r.request_json.source.sha256,
          parent.output_metadata.sha256,
        );
        await b("Check status").click();
        await page.getByRole("status").filter({
          hasText: "Completion is uncertain",
        }).waitFor();
        await page.reload();
        await page.getByRole("status").filter({
          hasText: "Completion is uncertain",
        }).waitFor();
        assert.equal(dispatches, 2);
        await shot("10-uncertain-request-mobile");
        await page.goto(base + "/upload/create-reference");
        await b("Prepare a separate attempt").click();
        await page.getByRole("alert").filter({
          hasText: "This request is still unresolved",
        }).waitFor();
        assert.equal(await b("Check saved request").count(), 1);
        assert.equal(
          await page.evaluate(
            (k) => JSON.parse(sessionStorage.getItem(k)).receipt,
            "watercolor:reference-studio:v1:" + owner,
          ),
          r.id,
        );
        assert.equal(dispatches, 2);
        await shot(
          "14-receipt-retained-mobile",
          390,
          "3. Generate one reference",
        );
      },
    );
    await scenario(
      "Saved reference list is independent of legacy artwork records",
      async () => {
        await page.goto(base + "/artworks");
        await page.getByRole("button", {
          name: /Improve composition · completed/,
        }).waitFor();
        assert.equal(dispatches, 2);
        await page.getByRole("button", {
          name: /Improve composition · completed/,
        }).click();
        await page.getByRole("heading", {
          name: "Your painting reference",
          exact: true,
        }).waitFor();
        await shot("11-saved-reference-mobile");
      },
    );
    await scenario(
      "Seven widths, enlarged text, keyboard access and all four synthetic categories remain usable",
      async () => {
        await page.goto(base + "/upload/create-reference");
        await page.getByRole("heading", {
          name: "Create a painting reference",
          exact: true,
        }).waitFor();
        for (const width of [320, 375, 390, 430, 768, 1024, 1440]) {
          await page.setViewportSize({ width, height: 900 });
          assert(
            await page.evaluate(() =>
              document.documentElement.scrollWidth <= innerWidth + 1
            ),
          );
          await b("Choose photo").focus();
          assert(
            await b("Choose photo").evaluate((e) =>
              e === document.activeElement
            ),
          );
        }
        for (const kind of ["landscape", "urban", "botanical", "portrait"]) {
          await upload(kind);
          assert.equal(dispatches, 2);
        }
        await page.addStyleTag({
          content: ".reference-studio{font-size:32px!important}",
        });
        await page.setViewportSize({ width: 390, height: 1000 });
        assert(
          await page.evaluate(() =>
            document.documentElement.scrollWidth <= innerWidth + 1
          ),
        );
        await shot("12-enlarged-text-mobile");
      },
    );
    await scenario(
      "Zero allowance is explicit and local preparation/export remains available",
      async () => {
        remaining = 0;
        await page.reload();
        await upload();
        await page.getByText(
          "No image-edit attempts are available for this account.",
          { exact: false },
        ).waitFor();
        assert(await b("Generate improved reference").isDisabled());
        assert(await b("Export prepared PNG").isEnabled());
        await shot("15-no-allowance-mobile", 390, "3. Generate one reference");
        assert.equal(dispatches, 2);
        remaining = 4;
      },
    );
    await scenario(
      "Preparation rejection is actionable and retains a non-retrying request receipt",
      async () => {
        // An explicitly terminal SYNTHETIC record lets this fixture prepare a new
        // attempt; this is not a hosted reconciliation or a real provider result.
        const unresolved = [...records.values()][1];
        unresolved.status = "failed";
        await page.reload();
        await upload();
        await b("Prepare a separate attempt").click();
        await page.getByRole("checkbox", { name: /I authorise one image-edit/ })
          .check();
        rejectedCode = "preparation_unavailable";
        await b("Generate improved reference").click();
        await page.getByRole("alert").filter({
          hasText: "A smaller JPEG or PNG may be needed",
        }).waitFor();
        const receipt = await page.evaluate(
          (k) => JSON.parse(sessionStorage.getItem(k)).receipt,
          "watercolor:reference-studio:v1:" + owner,
        );
        assert(receipt && !records.has(receipt));
        assert.equal(dispatches, 2);
        await shot(
          "16a-smaller-photo-advice-mobile",
          390,
          "3. Generate one reference",
        );
        await b("Prepare a separate attempt").click();
        await page.getByRole("alert").filter({ hasText: "Its receipt is kept" })
          .waitFor();
        assert.equal(await b("Check saved request").count(), 1);
        await shot(
          "16-preparation-rejection-mobile",
          390,
          "3. Generate one reference",
        );
        rejectedCode = undefined;
      },
    );
    await scenario(
      "A second account cannot restore private direction, receipt or output from the first",
      async () => {
        const other = "10000000-0000-4000-8000-000000000002";
        user = { ...user, id: other, email: "second-fixture@example.invalid" };
        const second = await context.newPage();
        await second.addInitScript(
          ({ user, access }) =>
            localStorage.setItem(
              "sb-watercolor-test-auth-token",
              JSON.stringify({
                user,
                access_token: access,
                refresh_token: "synthetic",
                expires_at: Math.floor(Date.now() / 1000) + 3600,
                token_type: "bearer",
              }),
            ),
          { user, access: token(user) },
        );
        await second.goto(base + "/upload/create-reference");
        await second.getByRole("heading", {
          name: "Create a painting reference",
          exact: true,
        }).waitFor();
        assert.equal(
          await second.getByLabel("What should this reference help you do?")
            .inputValue(),
          "simplify",
        );
        assert.equal(
          await second.getByAltText("Original photograph — unchanged").count(),
          0,
        );
        await second.goto(
          base + "/result/create-reference?generation=" +
            [...records.keys()][0],
        );
        await second.getByRole("alert").filter({
          hasText: "could not be opened",
        }).waitFor();
        assert.equal(
          await second.getByAltText(
            "AI-edited reference — inspect fidelity before using it for painting",
          ).count(),
          0,
        );
        assert.equal(dispatches, 2);
        await second.close();
      },
    );
    assert.deepEqual(errors, []);
    assert.deepEqual(unexpected, []);
    assert(
      requests.every((r) =>
        !r.path.includes("/generate-feedback") &&
        !r.path.includes("/object/sign")
      ),
    );
    fs.writeFileSync(
      path.join(out, "report.json"),
      JSON.stringify(
        {
          status: "PASS",
          matrix,
          simulatedImageDispatches: dispatches,
          realProviderCalls: 0,
          productionWrites: 0,
          paidCalls: 0,
          fixtures: ["landscape", "urban", "botanical", "portrait"],
          artisticFidelityTested: false,
          errors,
          unexpected,
        },
        null,
        2,
      ),
    );
  } catch (e) {
    if (page) {
      await page.screenshot({ path: path.join(out, "FAILURE.png") });
      fs.writeFileSync(
        path.join(out, "failure-dom.txt"),
        await page.locator("body").innerText(),
      );
    }
    throw e;
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
