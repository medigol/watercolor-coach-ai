// Actual exported app, synthetic learner only. Every external request is mocked
// or rejected; no production account, artwork, YouTube or paid AI is contacted.
const { chromium } = require("playwright");
const fs = require("node:fs"),
  path = require("node:path"),
  assert = require("node:assert/strict");
const base = process.argv[2] || "http://127.0.0.1:8141/watercolor-coach-ai";
const dir = path.resolve(
  process.argv[3] || "/tmp/watercolour-learning-browser",
);
fs.mkdirSync(dir, { recursive: true });
const uid = "10000000-0000-4000-8000-000000000001",
  key = `watercolor:learning:v1:${uid}`;
const user = {
  id: uid,
  aud: "authenticated",
  role: "authenticated",
  email: "learning-test@example.invalid",
  email_confirmed_at: new Date().toISOString(),
  app_metadata: { provider: "email", providers: ["email"] },
  user_metadata: {},
  created_at: new Date().toISOString(),
};
const token = [
  { alg: "HS256", typ: "JWT" },
  {
    sub: uid,
    aud: "authenticated",
    role: "authenticated",
    exp: Math.floor(Date.now() / 1000) + 3600,
  },
  "test-signature",
]
  .map((v, i) =>
    i < 2 ? Buffer.from(JSON.stringify(v)).toString("base64url") : v,
  )
  .join(".");
(async () => {
  const browser = await chromium.launch({
    executablePath: "/usr/bin/chromium",
    args: ["--no-sandbox"],
  });
  const page = await browser.newPage({ viewport: { width: 375, height: 900 } }),
    errors = [],
    unexpected = [],
    network = [],
    matrix = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.setDefaultTimeout(15000);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.route("**/*", async (route) => {
    const req = route.request(),
      url = new URL(req.url());
    network.push({
      origin: url.origin,
      path: url.pathname,
      method: req.method(),
    });
    if (url.origin === new URL(base).origin) return route.continue();
    if (url.hostname !== "watercolor-test.supabase.co") {
      unexpected.push(url.origin);
      return route.abort();
    }
    const reply = (v, status = 200) =>
      route.fulfill({
        status,
        contentType: "application/json",
        body: JSON.stringify(v),
      });
    if (url.pathname.endsWith("/token"))
      return reply({
        access_token: token,
        refresh_token: "test-refresh",
        expires_in: 3600,
        token_type: "bearer",
        user,
      });
    if (url.pathname.endsWith("/user")) return reply(user);
    if (url.pathname.endsWith("/profiles"))
      return reply({ display_name: "Learner" });
    if (req.method() === "GET" && url.pathname.endsWith("/artworks"))
      return reply([]);
    unexpected.push(req.method() + " " + url.pathname);
    return route.abort();
  });
  const button = (name) => page.getByRole("button", { name, exact: true });
  const heading = (name) => page.getByRole("heading", { name, exact: true });
  const shot = async (name) => {
    const main = page.getByRole("main");
    if (await main.count())
      await main.evaluate((el) => {
        let p = el.parentElement;
        while (p) {
          if (["auto", "scroll"].includes(getComputedStyle(p).overflowY)) {
            p.scrollTop = 0;
            break;
          }
          p = p.parentElement;
        }
      });
    await page.screenshot({
      path: path.join(dir, name + ".png"),
      fullPage: true,
    });
  };
  const saved = async () => {
    await page
      .getByRole("status")
      .filter({ hasText: /^Saved on this device\./ })
      .waitFor();
  };
  const noOverflow = async () =>
    assert(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      "horizontal overflow",
    );
  const read = () =>
    page.evaluate((k) => JSON.parse(localStorage.getItem(k)), key);
  try {
    await page.goto(base + "/");
    await button("Sign in").waitFor();
    await page
      .getByRole("textbox", { name: "Email", exact: true })
      .fill(user.email);
    await page
      .locator('input[aria-label="Password"]:visible')
      .last()
      .fill("test-password-only");
    await button("Sign in").click();
    await button("Learn watercolour").click();
    await heading("Learn to see. Learn to paint.").waitFor();
    await shot("01-learn-first-visit");
    await button("Learning progress").click();
    await heading("A clean sheet").waitFor();
    await shot("10-empty-progress");
    await page.goto(base + "/learn");
    await button("Start structured learning").click();
    await heading("The foundation pathway").waitFor();
    assert.equal(
      (await read()).profile,
      null,
      "standard pathway needs no profile",
    );
    await button("Edit preferences").click();
    await heading("Where are you starting?").waitFor();
    await button("Intermediate").click();
    await button("Next preference").click();
    await button("Urban sketching").click();
    await button("Next preference").click();
    await button("Urban architecture").click();
    await button("Next preference").click();
    await button("Primary: Loose urban sketching").click();
    await button("Next preference").click();
    await button("15 minutes").click();
    await button("Show optional confidence questions").click();
    await heading("Water and brush control")
      .locator("..")
      .getByRole("button", { name: "Confident", exact: true })
      .click();
    await heading("Relative planes and convergence")
      .locator("..")
      .getByRole("button", { name: "New to me", exact: true })
      .click();
    await shot("04-personalisation");
    await button("Review my path").click();
    await button("Confirm my personal path").click();
    await saved();
    await heading("Urban sketching").waitFor();
    await shot("05-personal-path");
    assert.equal((await read()).profile.diagnostic.perspective, "new");
    assert(
      (await page.locator("body").innerText()).includes(
        "you marked perspective for practice",
      ),
    );
    await page.goto(base + "/learn/styles");
    await heading("Find a direction that moves you").waitFor();
    await button("Primary: Botanical observation").click();
    await button("Secondary: Loose urban sketching").click();
    await shot("03-style-explorer");
    await button("Use these styles in my path").click();
    await saved();
    assert.equal((await read()).profile.primaryStyle, "botanical");
    assert((await read()).profile.secondaryStyles.includes("urban"));
    await page.goto(base + "/learn/lesson?id=water-brush");
    await button("Begin lesson").click();
    await saved();
    await heading("Notice the three water decisions").waitFor();
    await shot("06-mobile-lesson");
    assert(await page.getByText(/No verified video is assigned/).count());
    assert.equal(await page.locator("iframe").count(), 0);
    const firstCheck = page.getByRole("checkbox").first();
    await firstCheck.focus();
    await firstCheck.press("Space");
    assert.equal(
      await firstCheck.isChecked(),
      true,
      "Space must operate the checklist",
    );
    await firstCheck.press("Space");
    assert.equal(await firstCheck.isChecked(), false);
    await page
      .getByRole("textbox", { name: "Optional note for this step" })
      .fill("Two water conditions to compare.");
    async function finishCurrent(final = false, kind = "lesson") {
      for (const check of await page.getByRole("checkbox").all())
        if (!(await check.isChecked()))
          await check.click();
      if (final) {
        await page
          .getByRole("textbox", { name: "My exercise reflection" })
          .fill(
            "The dry comparison showed a clearer boundary. Next time I will vary only the moisture.",
          );
        await button("Useful stretch").click();
        await button("Developing").click();
      }
      await button(
        final ? `Finish ${kind}` : "Complete step and continue",
      ).click();
      await saved();
    }
    await finishCurrent();
    await heading("Prepare a repeatable brush load").waitFor();
    await page.reload();
    await heading("Prepare a repeatable brush load").waitFor();
    assert.equal(
      (await read()).entries["water-brush"].notes.look,
      "Two water conditions to compare.",
    );
    await page.setViewportSize({ width: 1440, height: 1000 });
    await shot("07-desktop-lesson");
    await noOverflow();
    for (let n = 1; n < 5; n++) await finishCurrent(n === 4);
    await heading("Lesson completed").waitFor();
    await page.goto(base + "/learn");
    await heading("A little practice. A clear next step.").waitFor();
    await page.getByRole("img", { name: /soft pale distant hills/ }).waitFor();
    await shot("02-learn-returning");
    await page.setViewportSize({ width: 390, height: 900 });
    await page.goto(base + "/learn/lesson?id=quiet-landscape");
    await button("Begin project").click();
    await finishCurrent();
    await heading("Plan three major values").waitFor();
    await page.getByRole("checkbox").first().check();
    await page
      .getByRole("textbox", { name: "Optional note for this step" })
      .fill("Keep a broad quiet sky.");
    await saved();
    await page.reload();
    await heading("Plan three major values").waitFor();
    assert(await page.getByRole("checkbox").first().isChecked(),"partially completed project checklist must survive reload");
    assert.equal(
      (await read()).entries["quiet-landscape"].notes.values,
      "Keep a broad quiet sky.",
    );
    await shot("08-guided-project");
    for (let n = 1; n < 8; n++) await finishCurrent(n === 7, "project");
    await heading("Project completed").waitFor();
    await page.reload();
    await heading("Project completed").waitFor();
    await page.goto(base + "/learn/progress");
    await heading("Your practice, kept in view").waitFor();
    await shot("09-progress");
    await button("Revisit Water & brush control").click();
    await button("Review this completed study").click();
    await button("1. Notice the three water decisions · recorded").click();
    assert((await read()).entries["water-brush"].reflection);
    // Preference changes keep all prior completion and notes.
    await page.goto(base + "/learn/styles");
    await button("Primary: Expressive and gestural").click();
    await button("Use these styles in my path").click();
    await saved();
    assert((await read()).entries["quiet-landscape"].reflection);
    assert((await read()).entries["water-brush"].reflection);
    await button("Edit preferences").click();
    await button("Back to previous preference").click();
    await button("10 minutes").click();
    await button("Review my path").click();
    await button("Confirm my personal path").click();
    await saved();
    assert.equal((await read()).profile.minutes, 10);
    assert((await read()).entries["quiet-landscape"].reflection);
    for (const width of [320, 375, 390, 430, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 950 });
      for (const route of [
        "/learn",
        "/learn/styles",
        "/learn/path",
        "/learn/lesson?id=water-brush",
        "/learn/progress",
      ]) {
        await page.goto(base + route);
        await page.getByRole("main").waitFor();
        await page
          .getByRole("main")
          .getByRole("heading", { level: 1 })
          .waitFor();
        if (route.startsWith("/learn/lesson")) {
          await button("Review this completed study").click();
          const main = page.getByRole("main");
          const reference = await main
            .getByTestId("studio-reference")
            .boundingBox();
          const practice = await main
            .getByTestId("studio-practice")
            .boundingBox();
          const media = await main.getByTestId("studio-media").boundingBox();
          assert(reference && practice && media);
          if (width < 1000)
            assert(
              reference.y + reference.height <= practice.y + 1,
              "stacked teaching panels must not overlap",
            );
          else
            assert(
              reference.x + reference.width <= practice.x + 1,
              "desktop teaching columns must not overlap",
            );
          assert(
            practice.y + practice.height <= media.y + 1,
            "media must not cover reflection controls",
          );
        }
        await noOverflow();
        if (width === 1440 && route === "/learn/styles")
          await shot("03-style-explorer-desktop");
        const tiny = await page
          .getByRole("main")
          .getByRole("button")
          .evaluateAll((nodes) =>
            nodes
              .filter((n) => {
                const r = n.getBoundingClientRect();
                return (
                  r.width > 0 && r.height > 0 && (r.width < 44 || r.height < 44)
                );
              })
              .map((n) => n.textContent),
          );
        assert.deepEqual(tiny, []);
        matrix.push({ width, route, noOverflow: true, touchTargets: true });
      }
    }
    await page.goto(base + "/learn");
    await page.keyboard.press("Tab");
    await page.getByRole("main").getByRole("button").first().focus();
    const focus = await page.evaluate(() => {
      return {
        role: document.activeElement.getAttribute("role"),
        outline: getComputedStyle(document.activeElement).outlineWidth,
      };
    });
    assert.equal(focus.role, "button");
    assert.equal(focus.outline, "3px");
    await page.setViewportSize({ width: 768, height: 390 });
    await page.goto(base + "/learn/lesson?id=water-brush");
    await page.getByRole("main").getByRole("heading", { level: 1 }).waitFor();
    await noOverflow();
    const cdp = await page.context().newCDPSession(page);
    await cdp.send("Emulation.setDeviceMetricsOverride", {
      width: 720,
      height: 500,
      deviceScaleFactor: 2,
      mobile: false,
    });
    await page.goto(base + "/learn/styles");
    await page.getByRole("main").getByRole("heading", { level: 1 }).waitFor();
    await noOverflow();
    await shot("14-dpr2-reflow");
    await cdp.send("Emulation.clearDeviceMetricsOverride");
    await page.setViewportSize({ width: 1440, height: 950 });
    await page.goto(base + "/learn/lesson?id=missing-study");
    await heading("That study is not available").waitFor();
    await shot("11-unavailable-study");
    // Simulated storage failure must not become a fake successful save.
    await page.goto(base + "/learn/lesson?id=three-values");
    await button("Begin lesson").waitFor();
    const before = await read();
    await page.evaluate(() => {
      const original = Storage.prototype.setItem;
      window.restoreLearningStorage = () =>
        (Storage.prototype.setItem = original);
      Storage.prototype.setItem = function (k, v) {
        if (k.startsWith("watercolor:learning:"))
          throw new DOMException("Test quota", "QuotaExceededError");
        return original.call(this, k, v);
      };
    });
    await button("Begin lesson").click();
    await button("Retry local save").waitFor();
    assert.deepEqual(await read(), before);
    await shot("12-save-failure");
    await page.evaluate(() => window.restoreLearningStorage());
    await button("Retry local save").click();
    await saved();
    assert((await read()).entries["three-values"]);
    // Corrupt data is preserved until an explicit backup/recovery action.
    await page.evaluate(
      (k) => localStorage.setItem(k, "synthetic broken data"),
      key,
    );
    await page.reload();
    await heading("Your saved work is preserved").waitFor();
    await shot("13-invalid-saved-data");
    assert.equal(
      await page.evaluate((k) => localStorage.getItem(k), key),
      "synthetic broken data",
    );
    await button("Keep a local backup and start fresh").click();
    await saved();
    assert(
      await page.evaluate(
        (k) =>
          Object.keys(localStorage).some(
            (n) =>
              n.startsWith(k + ":backup:") &&
              localStorage.getItem(n) === "synthetic broken data",
          ),
        key,
      ),
    );
    // Existing deep link and account-protected product features remain reachable.
    await page.goto(base + "/practice");
    await heading("Learn to see. Learn to paint.").waitFor();
    await page.goto(base + "/");
    await button("Improve my painting").click();
    await page.getByText("Improve Painting", { exact: true }).first().waitFor();
    await page.goto(base + "/");
    await button("Create painting reference").click();
    await page
      .getByText("Create Painting Reference", { exact: true })
      .first()
      .waitFor();
    await page.goto(base + "/artworks");
    await page.getByText("My Artworks", { exact: true }).first().waitFor();
    assert.deepEqual(errors, []);
    assert.deepEqual(unexpected, []);
    assert(
      !network.some((n) => /functions\/v1|storage\/v1/.test(n.path)),
      "learning creates zero AI requests or artwork uploads",
    );
    fs.writeFileSync(
      path.join(dir, "report.json"),
      JSON.stringify(
        {
          status: "PASS",
          responsiveCases: matrix.length,
          matrix,
          runtimeErrors: errors,
          unexpectedNetwork: unexpected,
          providerCalls: 0,
          uploads: 0,
          artworkWrites: 0,
          localPersistence: true,
          resumeLesson: true,
          resumeProject: true,
          completionPreserved: true,
          storageFailureAndRecovery: true,
          keyboardFocus: true,
          landscapeViewport: { width: 768, height: 390, status: "PASS" },
          highDensityReflowEmulation: {
            cssWidth: 720,
            cssHeight: 500,
            deviceScaleFactor: 2,
            status: "PASS",
            physicalBrowserZoom: false,
          },
          verifiedVideos: 0,
          scope:
            "Synthetic browser interactions, not physical painting or learning-outcome proof",
          physicalDevice: false,
        },
        null,
        2,
      ),
    );
    console.log(
      "PASS: Learn journey; 35 responsive route cases; keyboard/targets; lesson and project completion/resume; preferences; local save failure/recovery; zero paid/external media/artwork requests.",
    );
  } catch (e) {
    console.error(e);
    fs.writeFileSync(
      path.join(dir, "failure-state.json"),
      (await page.evaluate((k) => localStorage.getItem(k), key)) || "null",
    );
    const diagnostic = await page
      .getByRole("button", { name: "Developing", exact: true })
      .evaluateAll((nodes) =>
        nodes.map((n) => {
          const r = n.getBoundingClientRect();
          const hit = document.elementFromPoint(
            r.x + r.width / 2,
            r.y + r.height / 2,
          );
          return {
            rect: r.toJSON(),
            hit: hit?.outerHTML.slice(0, 600),
            ancestors: [
              n.parentElement?.tagName,
              n.parentElement?.parentElement?.tagName,
            ],
          };
        }),
      );
    console.error(JSON.stringify(diagnostic));
    console.error((await page.locator("body").innerText()).slice(-6500));
    await shot("failure");
    throw e;
  } finally {
    await browser.close();
  }
})().catch(() => (process.exitCode = 1));
