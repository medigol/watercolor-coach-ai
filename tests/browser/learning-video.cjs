// Actual isolated Expo export with SYNTHETIC catalogue and mocked official API.
// No real video verification, frames, production account or paid provider calls.
const { chromium } = require("playwright"),
  fs = require("node:fs"),
  path = require("node:path"),
  assert = require("node:assert/strict");
const base = process.argv[2] || "http://127.0.0.1:8153/watercolor-coach-ai",
  dir = process.argv[3] || "/tmp/watercolour-video-browser";
fs.mkdirSync(dir, { recursive: true });
const user = {
  id: "10000000-0000-4000-8000-000000000001",
  aud: "authenticated",
  role: "authenticated",
  email: "video-test@example.invalid",
  email_confirmed_at: new Date().toISOString(),
  app_metadata: { provider: "email", providers: ["email"] },
  user_metadata: {},
  created_at: new Date().toISOString(),
};
const token = [
  { alg: "HS256", typ: "JWT" },
  {
    sub: user.id,
    aud: "authenticated",
    role: "authenticated",
    exp: Math.floor(Date.now() / 1000) + 3600,
  },
  "test",
]
  .map((v, i) =>
    i < 2 ? Buffer.from(JSON.stringify(v)).toString("base64url") : v,
  )
  .join(".");
const key = "watercolor:learning:v1:" + user.id;
(async () => {
  const browser = await chromium.launch({
    executablePath: "/usr/bin/chromium",
    args: ["--no-sandbox"],
  });
  const page = await browser.newPage({ viewport: { width: 390, height: 900 } }),
    errors = [],
    external = [],
    unexpected = [],
    matrix = [];
  const button = (name) => page.getByRole("button", { name, exact: true }),
    heading = (name) => page.getByRole("heading", { name, exact: true });
  page.setDefaultTimeout(15000);
  page.on("pageerror", (e) => errors.push(e.message));
  let failAPI = false;
  await page.route("**/*", async (route) => {
    const req = route.request(),
      u = new URL(req.url());
    if (u.origin === new URL(base).origin) return route.continue();
    const json = (v) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(v),
      });
    if (u.hostname === "watercolor-test.supabase.co") {
      if (u.pathname.endsWith("/token"))
        return json({
          access_token: token,
          refresh_token: "test-refresh",
          expires_in: 3600,
          token_type: "bearer",
          user,
        });
      if (u.pathname.endsWith("/user")) return json(user);
      if (u.pathname.endsWith("/profiles"))
        return json({ display_name: "Synthetic learner" });
      if (u.pathname.endsWith("/artworks") && req.method() === "GET")
        return json([]);
    }
    if (["www.youtube.com", "www.youtube-nocookie.com"].includes(u.hostname)) {
      external.push({ url: u.href, method: req.method() });
      if (u.pathname === "/iframe_api")
        return failAPI
          ? route.abort()
          : route.fulfill({
              contentType: "application/javascript",
              body: require("../helpers/mock-youtube.cjs"),
            });
      if (u.pathname.startsWith("/embed/"))
        return route.fulfill({
          contentType: "text/html",
          body: '<!doctype html><html lang="en"><meta charset="utf-8"><style>body{background:#253c3c;color:#fff;font:16px/1.5 system-ui;padding:12px}</style><p>SIMULATED PLAYER — SYNTHETIC QA ONLY</p><p>No real video or content verification.</p></html>',
        });
    }
    unexpected.push(req.method() + " " + u.href);
    return route.abort();
  });
  const saved = () =>
    page
      .getByRole("status")
      .filter({ hasText: /^Saved on this device\./ })
      .waitFor();
  const read = () =>
    page.evaluate((k) => JSON.parse(localStorage.getItem(k)), key);
  const shot = async (name) =>
    page.screenshot({ path: path.join(dir, name + ".png"), fullPage: true });
  const reveal = async () => {
    await button("Optional demonstration").click();
    await heading("Brush loading comparison").waitFor();
  };
  const assertNoOverflow = async () =>
    assert(
      await page
        .getByRole("main")
        .evaluate((n) => n.scrollWidth <= n.clientWidth + 1),
      "media content reflows without horizontal clipping",
    );
  try {
    await page.goto(base + "/");
    await button("Sign in").waitFor();
    await page
      .getByRole("textbox", { name: "Email", exact: true })
      .fill(user.email);
    await page
      .getByRole("textbox", { name: "Password", exact: true })
      .fill("synthetic-only");
    await button("Sign in").click();
    await button("Learn watercolour").waitFor();
    await page.goto(base + "/learn/lesson?id=water-brush");
    await button("Begin lesson").click();
    await page.getByRole("checkbox").first().check();
    await button("Complete step and continue").click();
    await heading("Prepare a repeatable brush load").waitFor();
    await saved();
    const before = await read();
    await reveal();
    assert.equal(
      external.length,
      0,
      "no third-party request before an explicit load",
    );
    await button("Load YouTube demonstration").scrollIntoViewIfNeeded();
    await page
      .getByTestId("demonstration-card")
      .evaluate((e) => e.scrollIntoView({ block: "start" }));
    await shot("01-before-loading-synthetic");
    await button("Caption preferences").click();
    await button("Prefer captions when available").click();
    await button("Persian preference").click();
    await page
      .getByText(
        "Caption availability and languages have not been confirmed for this video.",
        { exact: true },
      )
      .waitFor();
    await shot("02-caption-request-unknown-tracks");
    await button("Caption preferences").click();
    await button("Load YouTube demonstration").click();
    await button("Replay this demonstration").waitFor({ state: "visible" });
    await page.waitForFunction(() =>
      window.YT_TEST?.calls.some((c) => c[0] === "cue"),
    );
    assert.equal(
      await page
        .locator('script[src="https://www.youtube.com/iframe_api"]')
        .count(),
      1,
    );
    assert.equal(
      await page.evaluate(() => typeof window.onYouTubeIframeAPIReady),
      "undefined",
      "one-shot API callback is released",
    );
    const iframe = page.locator("iframe");
    const src = new URL(await iframe.getAttribute("src"));
    assert.equal(src.searchParams.get("cc_lang_pref"), "fa");
    assert.equal(src.searchParams.get("start"), "30");
    assert.equal(src.searchParams.get("end"), "150");
    assert.equal(src.searchParams.get("origin"), new URL(base).origin);
    assert.equal(
      await iframe.getAttribute("referrerpolicy"),
      "strict-origin-when-cross-origin",
    );
    await page.evaluate(() => window.YT_TEST.instances.at(-1).playVideo());
    assert.equal(
      await page
        .getByText("YouTube reports playback.", { exact: true })
        .count(),
      0,
      "click alone never claims playback",
    );
    await page.evaluate(() => window.YT_TEST.emit(1, 40));
    await page
      .getByText("YouTube reports playback.", { exact: true })
      .waitFor();
    await iframe.scrollIntoViewIfNeeded();
    await shot("03-loaded-simulated-player-390");
    await button("Compare another verified approach").click();
    await heading("Bead and moisture comparison").waitFor();
    assert.equal(await page.evaluate(() => window.YT_TEST.instances.length), 1);
    await button("Return to the main demonstration").click();
    await heading("Brush loading comparison").waitFor();
    await button("Choose verified segment").click();
    await shot("10-segment-choices-synthetic");
    await button("Bead and moisture comparison · 3:00–5:00").click();
    await page.waitForFunction(() =>
      window.YT_TEST.calls.some(
        (c) => c[0] === "cue" && c[1].startSeconds === 180,
      ),
    );
    assert.equal(
      await page.evaluate(() => window.YT_TEST.instances.length),
      1,
      "same player survives segment switching",
    );
    await button("Replay this demonstration").click();
    await page.waitForFunction(() =>
      window.YT_TEST.calls.some(
        (c) =>
          c[0] === "load" &&
          c[1].startSeconds === 180 &&
          c[1].endSeconds === 300,
      ),
    );
    await button("Replay this demonstration").scrollIntoViewIfNeeded();
    await shot("04-segment-b-replay");
    await page.evaluate(() => {
      const p = window.YT_TEST.instances.at(-1);
      p.state = 1;
      p.time = 500;
    });
    await page.getByText(/player moved outside this viewing window/).waitFor();
    await button("Replay this demonstration").click();
    assert.deepEqual(
      await read(),
      before,
      "video/caption/seek events never mutate learning progress",
    );
    for (const width of [320, 375, 390, 430, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: width < 1000 ? 900 : 1000 });
      await iframe.scrollIntoViewIfNeeded();
      const box = await iframe.boundingBox();
      assert(
        box.width >= 200 && box.height >= 200,
        "official minimum size in BOTH dimensions",
      );
      await assertNoOverflow();
      matrix.push({
        width,
        playerWidth: Math.round(box.width),
        playerHeight: Math.round(box.height),
      });
      if ([375, 390, 1440].includes(width)) await shot("05-player-" + width);
    }
    assert.equal(
      await page.evaluate(() => window.YT_TEST.instances.length),
      1,
      "responsive changes retain the existing player instance",
    );
    const reflow = [];
    for (const [w, h] of [
      [375, 600],
      [844, 390],
      [1024, 600],
      [390, 480],
    ]) {
      await page.setViewportSize({ width: w, height: h });
      await iframe.scrollIntoViewIfNeeded();
      await assertNoOverflow();
      await button("Replay this demonstration").scrollIntoViewIfNeeded();
      const target = await button("Replay this demonstration").boundingBox();
      assert(
        target.y >= 0 && target.y + target.height <= h - (w >= 1000 ? 0 : 80),
        "replay remains reachable in a short viewport",
      );
      reflow.push({ width: w, height: h, replayReachable: true });
    }
    await page.evaluate(() => {
      window.videoTextStyles = [...document.querySelectorAll('[role="main"] *')]
        .filter((e) =>
          [...e.childNodes].some(
            (n) => n.nodeType === Node.TEXT_NODE && n.textContent.trim(),
          ),
        )
        .map((e) => ({
          e,
          size: e.style.fontSize,
          line: e.style.lineHeight,
          computed: parseFloat(getComputedStyle(e).fontSize),
        }));
      for (const { e, computed } of window.videoTextStyles) {
        e.style.fontSize = computed * 2 + "px";
        e.style.lineHeight = "1.5";
      }
    });
    await assertNoOverflow();
    await button("Replay this demonstration").scrollIntoViewIfNeeded();
    await shot("11-text-enlargement-synthetic");
    await page.evaluate(() => {
      for (const { e, size, line } of window.videoTextStyles) {
        e.style.fontSize = size;
        e.style.lineHeight = line;
      }
      delete window.videoTextStyles;
    });
    await page.setViewportSize({ width: 1440, height: 1000 });
    // Explicit caption application is the only settings-driven player replacement.
    await button("Caption preferences").click();
    await button("Follow YouTube settings").click();
    await button("Apply caption preferences and reload player").click();
    await page.waitForFunction(() => window.YT_TEST.instances.length === 2);
    const defaultSrc = new URL(await iframe.getAttribute("src"));
    assert(!defaultSrc.searchParams.has("cc_load_policy"));
    assert(!defaultSrc.searchParams.has("cc_lang_pref"));
    assert.equal(
      await page.evaluate(
        () => window.YT_TEST.instances.filter((p) => !p.dead).length,
      ),
      1,
    );
    await page.evaluate(() => {
      window.openedForVideo = [];
      window.open = (url) => {
        window.openedForVideo.push(url);
        return { closed: false };
      };
    });
    await button("Watch full video on YouTube").click();
    assert.equal(
      await page.evaluate(() => window.openedForVideo.at(-1)),
      "https://www.youtube.com/watch?v=abcDEF123_-",
    );
    await button("Replay this demonstration").click();
    assert.deepEqual(await read(), before);
    await page.evaluate(() => window.YT_TEST.error(101));
    await page.getByText(/creator has restricted embedding/).waitFor();
    await button("Retry YouTube connection").scrollIntoViewIfNeeded();
    await shot("06-embedding-restricted-synthetic");
    assert.equal(await iframe.count(), 0);
    await button("Retry YouTube connection").click();
    await page.waitForFunction(
      () => window.YT_TEST.instances.filter((p) => !p.dead).length === 1,
    );
    await page.evaluate(() => window.YT_TEST.error(100));
    await page
      .getByText(/YouTube reports that this video is unavailable/)
      .waitFor();
    await button("Retry YouTube connection").scrollIntoViewIfNeeded();
    await shot("07-unavailable-synthetic");
    assert.deepEqual(await read(), before);
    await button("Return to the painting exercise").click();
    await heading("Prepare a repeatable brush load").waitFor();
    const check = await page.getByRole("checkbox").first().boundingBox();
    assert(check.y >= 0 && check.y + check.height < 920);
    assert.equal(
      await page.evaluate(() => document.activeElement.type),
      "checkbox",
      "return restores focus to the physical checklist",
    );
    await shot("08-returned-to-practice");
    await page.setViewportSize({ width: 390, height: 480 });
    await button("Notes for this step").click();
    const notes = page.getByRole("textbox", {
      name: "Optional note for this step",
    });
    await notes.focus();
    await notes.scrollIntoViewIfNeeded();
    const noteBounds = await notes.boundingBox();
    assert(
      noteBounds.y >= 0 && noteBounds.y + noteBounds.height <= 400,
      "note field remains reachable after returning from video",
    );
    await shot("12-notes-reduced-viewport");
    await button("Notes for this step").click();
    await page.setViewportSize({ width: 1440, height: 1000 });
    // Route cleanup and stale events cannot revive audio or modify progress.
    await reveal();
    await button("Load YouTube demonstration").click();
    await page.waitForFunction(
      () => window.YT_TEST.instances.filter((p) => !p.dead).length === 1,
    );
    await page.evaluate(()=>window.YT_TEST.emit(1,40));
    await page.getByRole("tab", { name: "Home", exact: true }).click();
    await button("Learn watercolour").waitFor();
    assert.equal(await iframe.count(), 0);
    assert.equal(
      await page.evaluate(
        () => window.YT_TEST.instances.filter((p) => !p.dead).length,
      ),
      0,
    );
    assert.deepEqual(await read(), before);
    await button("Learn watercolour").click();
    await heading("Continue your practice").waitFor();
    // Reload loses all player state/consent; the current lesson step is preserved.
    await page.goto(base + "/learn/lesson?id=water-brush");
    await heading("Prepare a repeatable brush load").waitFor();
    await reveal();
    assert.equal(await iframe.count(), 0);
    assert.deepEqual(await read(), before);
    // Offline API attempt; real error recovery, still a mocked network failure.
    failAPI = true;
    await button("Load YouTube demonstration").click();
    await page.getByText(/YouTube could not connect/).waitFor();
    await button("Retry YouTube connection").scrollIntoViewIfNeeded();
    await shot("09-network-failure-synthetic");
    assert.deepEqual(await read(), before);
    assert.deepEqual(errors, []);
    assert.deepEqual(unexpected, []);
    assert(
      external.every(
        (n) =>
          n.method === "GET" &&
          !n.url.includes(user.id) &&
          !n.url.includes("video-test"),
      ),
      "custom code sends no profile/progress fields",
    );
    fs.writeFileSync(
      path.join(dir, "report.json"),
      JSON.stringify(
        {
          status: "PASS",
          mode: "SYNTHETIC CATALOGUE + MOCKED OFFICIAL API, not live YouTube verification",
          matrix,
          reflow,
          textEnlargement: "200% user stylesheet; no clipping",
          zeroPreConsentRequests: true,
          absoluteSegmentBounds: true,
          replayRestoresEnd: true,
          samePlayerForSegments: true,
          defaultCaptionsNotForced: true,
          progressUnchanged: true,
          cleanup: true,
          errors,
          unexpected,
          requests: external,
          realVideosReviewed: 0,
          realPlayback: false,
          physicalDevice: false,
        },
        null,
        2,
      ),
    );
    console.log(
      "PASS: synthetic video integration; 7 widths; official minimum dimensions; consent; A/B/replay/end/seek; caption request/default; external return; failure/fallback; progress preservation; lifecycle cleanup. NOT real playback evidence.",
    );
  } catch (e) {
    console.error(e);
    await shot("failure");
    console.error((await page.locator("body").innerText()).slice(-4500));
    throw e;
  } finally {
    await browser.close();
  }
})().catch(() => (process.exitCode = 1));
