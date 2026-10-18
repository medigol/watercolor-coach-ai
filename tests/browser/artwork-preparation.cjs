// Real browser local raster processing; original technical fixtures only.
// Provider semantics are mocked: these tests do NOT classify paintings.
const { chromium } = require("playwright"),
  fs = require("node:fs"),
  assert = require("node:assert/strict");
const base = process.argv[2] || "http://localhost:8091/watercolor-coach-ai",
  dir = process.argv[3] || "/tmp/artwork-preparation-browser";
fs.mkdirSync(dir, { recursive: true });
const uid = "10000000-0000-4000-8000-000000000001",
  user = {
    id: uid,
    aud: "authenticated",
    role: "authenticated",
    email: "learner@example.invalid",
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
  "signature",
]
  .map((x, i) =>
    i < 2 ? Buffer.from(JSON.stringify(x)).toString("base64url") : x,
  )
  .join(".");
let debugPage;
(async () => {
  const browser = await chromium.launch({
      executablePath: "/usr/bin/chromium",
      args: ["--no-sandbox"],
    }),
    page = await browser.newPage({
      viewport: { width: 390, height: 900 },
      hasTouch: true,
      deviceScaleFactor: 2,
    });
  debugPage = page;
  const errors = [],
    calls = { provider: 0, uploads: 0, writes: 0, removed: 0 },
    cases = [];
  let uploaded;
  page.on("pageerror", (e) => errors.push(e.message));
  await page.route("**/*", async (route) => {
    const req = route.request(),
      u = new URL(req.url());
    if (
      u.origin === new URL(base).origin ||
      ["blob:", "data:"].includes(u.protocol)
    )
      return route.continue();
    assert.equal(u.hostname, "watercolor-test.supabase.co");
    const reply = (body, status = 200) =>
      route.fulfill({
        status,
        contentType: "application/json",
        body: JSON.stringify(body),
      });
    if (u.pathname.endsWith("/token"))
      return reply({
        access_token: token,
        refresh_token: "test-only-refresh",
        expires_in: 3600,
        token_type: "bearer",
        user,
      });
    if (u.pathname.endsWith("/user")) return reply(user);
    if (u.pathname.endsWith("/profiles"))
      return reply({ display_name: "Learner" });
    if (u.pathname.endsWith("/usage_counters"))
      return reply({ free_results_used: 0, free_results_limit: 3 });
    if (
      u.pathname.includes("/storage/v1/object/artworks/") &&
      req.method() === "POST"
    ) {
      calls.uploads++;
      uploaded = req.postDataBuffer();
      return reply({ Key: u.pathname.split("/object/")[1] });
    }
    if (
      u.pathname.endsWith("/storage/v1/object/artworks") &&
      req.method() === "DELETE"
    ) {
      calls.removed++;
      return reply([]);
    }
    if (u.pathname.endsWith("/functions/v1/generate-feedback")) {
      calls.provider++;
      return reply({ code: "artwork_uncertain" }, 400);
    }
    throw Error("Unexpected endpoint " + u.pathname);
  });
  const button = (n) => page.getByRole("button", { name: n, exact: true });
  await page.goto(base + "/");
  await button("Sign in").waitFor();
  await page
    .getByRole("textbox", { name: "Email", exact: true })
    .fill(user.email);
  await page
    .locator('input[aria-label="Password"]:visible')
    .last()
    .fill("test-only-password");
  await button("Sign in").click();
  await button("Improve my painting").click();
  async function image(w, h, kind = "scene", type = "image/png") {
    const data = await page.evaluate(
      ({ w, h, kind, type }) => {
        const c = document.createElement("canvas");
        c.width = w;
        c.height = h;
        const x = c.getContext("2d");
        if (kind === "alpha") {
          x.clearRect(0, 0, w, h);
          x.fillStyle = "#47776b";
          x.fillRect(w * 0.2, h * 0.2, w * 0.6, h * 0.6);
        } else {
          x.fillStyle =
            kind === "blank" ? "#fff" : kind === "dark" ? "#182c30" : "#9ab7bc";
          x.fillRect(0, 0, w, h);
          if (kind === "surround") {
            x.fillStyle = "#313b3d";
            x.fillRect(0, 0, w, h);
            x.fillStyle = "#f4ecd8";
            x.fillRect(w * 0.15, h * 0.15, w * 0.7, h * 0.7);
            x.fillStyle = "#648477";
            x.fillRect(w * 0.3, h * 0.45, w * 0.4, h * 0.25);
          } else if (kind === "white-margin") {
            x.fillStyle = "#fff";
            x.fillRect(0, 0, w, h);
            x.fillStyle = "#708986";
            x.beginPath();
            x.moveTo(w * 0.2, h * 0.65);
            x.lineTo(w * 0.5, h * 0.3);
            x.lineTo(w * 0.8, h * 0.7);
            x.fill();
          } else if (!["blank", "dark"].includes(kind)) {
            x.fillStyle = "#547765";
            x.beginPath();
            x.moveTo(0, h * 0.6);
            x.lineTo(w * 0.5, h * 0.3);
            x.lineTo(w, h * 0.6);
            x.lineTo(w, h);
            x.lineTo(0, h);
            x.fill();
            x.fillStyle = "#d5a96a";
            x.fillRect(w * 0.55, h * 0.4, w * 0.15, h * 0.3);
          }
        }
        return c.toDataURL(type, 0.98).split(",")[1];
      },
      { w, h, kind, type },
    );
    return Buffer.from(data, "base64");
  }
  async function select(
    buffer,
    name = "technical.png",
    mimeType = "image/png",
  ) {
    const preview = page.getByRole("img", {name:"Confirmed artwork preview"});
    const previous = await preview.count() ? await preview.getAttribute("src") : null;
    const chooser = page.waitForEvent("filechooser");
    await page
      .getByRole("button", { name: /^Choose (painting|another image)$/ })
      .click();
    await (await chooser).setFiles({ buffer, name, mimeType });
    await page.waitForFunction(previous=>{
      const ready=[...document.querySelectorAll('[role="button"],button')].some(el=>el.textContent.trim()==='Choose another image');
      const im=document.querySelector('img[alt="Confirmed artwork preview"],img[aria-label="Confirmed artwork preview"]');
      return ready && ((im && im.getAttribute('src')!==previous) || document.body.innerText.includes('Select the whole painting'));
    },previous);
    await button("Choose another image").waitFor();
  }
  async function selectedSize() {
    return page
      .getByRole("img", { name: "Confirmed artwork preview" })
      .evaluate(async (el) => {
        const im = new Image();
        im.src = el.getAttribute("src");
        await im.decode();
        return {
          width: im.naturalWidth,
          height: im.naturalHeight,
          uri: im.src,
        };
      });
  }
  async function field(n, v) {
    const f = page.getByRole("textbox", {
      name: `Crop ${n} percent`,
      exact: true,
    });
    await f.fill(String(v));
    await f.press("Tab");
    await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
    assert.equal(Number(await f.inputValue()),Number(v));
  }
  async function confirm() {
    await button("Preview crop").click();
    await page
      .getByRole("img", { name: "Preview of artwork pixels to keep" })
      .waitFor();
    await button("Confirm crop").click();
    await page
      .getByRole("img", { name: "Confirmed artwork preview" })
      .waitFor();
    await button("Choose another image").waitFor();
  }
  for (const width of [375, 390, 430, 768, 1024, 1440, 1800])
    for (const [name, w, h] of [
      ["landscape", 800, 600],
      ["portrait", 600, 1000],
      ["square", 800, 800],
      ["wide", 1600, 300],
    ]) {
      await page.setViewportSize({ width, height: 950 });
      const before = { ...calls };
      await select(await image(w, h));
      const original = await selectedSize();
      assert.deepEqual([original.width, original.height], [w, h]);
      await button("Adjust crop").click();
      await field("left", 12.5);
      await field("top", 10);
      await field("right", 87.5);
      await field("bottom", 90);
      await confirm();
      const cropped = await selectedSize();
      assert.equal(
        await page.evaluate(async (uri) => {
          try {
            return (await fetch(uri)).ok;
          } catch {
            return false;
          }
        }, original.uri),
        false,
        "confirmed replacements release the old local output URL",
      );
      assert.deepEqual(
        [cropped.width, cropped.height],
        [
          Math.round(w * 0.875) - Math.round(w * 0.125),
          Math.round(h * 0.9) - Math.round(h * 0.1),
        ],
      );
      assert.deepEqual(calls, before);
      assert(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      );
      cases.push({
        width,
        name,
        dimensions: [cropped.width, cropped.height],
        calls: 0,
      });
      if (width === 390)
        await page.screenshot({ path: `${dir}/${name}-crop-390.png` });
    }
  await page.setViewportSize({ width: 390, height: 950 });
  for (const kind of ["white-margin", "blank", "dark"]) {
    const before = { ...calls };
    await select(await image(800, 600, kind));
    if (await button("Use full image").isVisible())
      await button("Use full image").click();
    const v = await selectedSize();
    assert.deepEqual([v.width, v.height], [800, 600]);
    assert.deepEqual(calls, before);
    cases.push({ kind, fullArtwork: true });
  }
  await select(await image(800, 600, "surround"));
  await page.getByText("Select the whole painting", { exact: true }).waitFor();
  assert.equal(
    await button("Analyse painting").getAttribute("aria-disabled"),
    "true",
  );
  await button("Reset selection").click();
  await page.waitForFunction(
    () =>
      document.querySelector('input[aria-label="Crop left percent"]')?.value ===
      "0",
  );
  assert.equal(
    await page.getByRole("textbox", { name: "Crop left percent" }).inputValue(),
    "0",
  );
  await field("left", 15);
  await field("top", 15);
  await field("right", 85);
  await field("bottom", 85);
  // Mouse dragging uses rendered frame coordinates; native uses same PanResponder.
  const handle = page.getByLabel(
    "Move crop top left; percentage controls below",
  );
  await handle.scrollIntoViewIfNeeded();
  let b = await handle.boundingBox();
  assert(b.width >= 44 && b.height >= 44);
  await page.mouse.move(b.x + 22, b.y + 22);
  await page.mouse.down();
  await page.mouse.move(b.x + 30, b.y + 28, { steps: 5 });
  await page.mouse.up();
  assert(
    Number(
      await page
        .getByRole("textbox", { name: "Crop left percent" })
        .inputValue(),
    ) > 15,
  );
  cases.push({ mouseDrag: true });
  // Actual touch events in Chromium (not a claim about Android/iOS devices).
  const cdp = await page.context().newCDPSession(page);
  b = await handle.boundingBox();
  const x = b.x + 22,
    y = b.y + 22;
  const beforeTouch = Number(
    await page.getByRole("textbox", { name: "Crop left percent" }).inputValue(),
  );
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x, y }],
  });
  for (let step = 1; step <= 4; step++) {
    await page.evaluate(() => new Promise(requestAnimationFrame));
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [{ x: x + step * 8, y: y + step * 6 }],
    });
  }
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  await page.waitForFunction(
    (before) =>
      Number(
        document.querySelector('input[aria-label="Crop left percent"]')?.value,
      ) > before,
    beforeTouch,
  );
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  cases.push({ touchDrag: true });
  await field("left", 15);
  await field("top", 15);
  await confirm();
  const final = await selectedSize();
  assert.deepEqual([final.width, final.height], [560, 420]);
  await button("Frame, wall or tools visible? Isolate artwork").click();
  assert.equal(await button("Use full image").count(), 0);
  await button("Reset selection").click();
  assert.equal(
    await button("Preview crop").getAttribute("aria-disabled"),
    "true",
  );
  await field("left", 15);
  await field("top", 15);
  await field("right", 85);
  await field("bottom", 85);
  await confirm();
  cases.push({ proposal: true, reset: true, surroundBypassBlocked: true });
  await select(await image(800, 600, "alpha"));
  if (await button("Use full image").isVisible())
    await button("Use full image").click();
  const alpha = await page
    .getByRole("img", { name: "Confirmed artwork preview" })
    .evaluate(async (el) => {
      const i = new Image();
      i.src = el.getAttribute("src");
      await i.decode();
      const c = document.createElement("canvas");
      c.width = i.naturalWidth;
      c.height = i.naturalHeight;
      const x = c.getContext("2d");
      x.drawImage(i, 0, 0);
      return [...x.getImageData(0, 0, 1, 1).data];
    });
  assert.deepEqual(alpha, [255, 255, 255, 255]);
  cases.push({ alphaWhiteMatte: true });
  // EXIF 6 injected into an original canvas JPEG; browser must orient once.
  const jpeg = await image(320, 480, "scene", "image/jpeg"),
    app1 = Buffer.from([
      255, 225, 0, 34, 69, 120, 105, 102, 0, 0, 73, 73, 42, 0, 8, 0, 0, 0, 1, 0,
      18, 1, 3, 0, 1, 0, 0, 0, 6, 0, 0, 0, 0, 0, 0, 0,
    ]);
  await select(
    Buffer.concat([jpeg.subarray(0, 2), app1, jpeg.subarray(2)]),
    "rotated.jpg",
    "image/jpeg",
  );
  const rotated = await selectedSize();
  assert.deepEqual([rotated.width, rotated.height], [480, 320]);
  const orientedPixel = await page
    .getByRole("img", { name: "Confirmed artwork preview" })
    .evaluate(async (el) => {
      const i = new Image();
      i.src = el.getAttribute("src");
      await i.decode();
      const c = document.createElement("canvas");
      c.width = i.naturalWidth;
      c.height = i.naturalHeight;
      const x = c.getContext("2d");
      x.drawImage(i, 0, 0);
      return [...x.getImageData(216, 200, 1, 1).data];
    });
  assert(
    orientedPixel[0] > 170 && orientedPixel[1] > 120 && orientedPixel[2] < 140,
    "EXIF orientation maps original pixels once, not just swapped dimensions",
  );
  cases.push({ exif6: true });
  // Invalid local bytes never reach upload or provider; picker decoding is also exercised.
  const bad = page.waitForEvent("filechooser");
  await page.getByRole("button", {name:/^Choose (painting|another image)$/}).click();
  await (
    await bad
  ).setFiles({
    name: "broken.png",
    mimeType: "image/png",
    buffer: Buffer.from("not an image"),
  });
  await page.getByRole("alert").waitFor();
  assert.equal(calls.provider, 0);
  assert.equal(calls.uploads, 0);
  assert.equal(
    await button("Analyse painting").getAttribute("aria-disabled"),
    "true",
  );
  cases.push({ invalidLocalZeroCalls: true });
  const bomb = Buffer.alloc(32);
  Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]).copy(bomb);
  bomb.writeUInt32BE(0x49484452, 12);
  bomb.writeUInt32BE(5000, 16);
  bomb.writeUInt32BE(5000, 20);
  const largeChooser = page.waitForEvent("filechooser");
  await page.getByRole("button", {name:/^Choose (painting|another image)$/}).click();
  await (
    await largeChooser
  ).setFiles({ name: "too-large.png", mimeType: "image/png", buffer: bomb });
  await page.getByRole("alert").filter({ hasText: "16 megapixels" }).waitFor();
  assert.equal(calls.provider, 0);
  assert.equal(calls.uploads, 0);
  cases.push({ headerBeforeDecode: true });

  await select(await image(800, 600));
  await button("Adjust crop").click();
  await field("left", 10);
  await field("top", 10);
  await field("right", 90);
  await field("bottom", 90);
  await confirm();
  const ready = await selectedSize();
  const expected = await page.evaluate(
    async (uri) =>
      Array.from(new Uint8Array(await (await fetch(uri)).arrayBuffer())),
    ready.uri,
  );
  await button("Analyse painting").click();
  await page.getByRole("alert").waitFor();
  assert.equal(calls.provider, 1);
  assert.equal(calls.uploads, 1);
  assert.equal(calls.removed, 1);
  assert.deepEqual(uploaded, Buffer.from(expected));
  assert.equal(uploaded.readUInt32BE(16), 640);
  assert.equal(uploaded.readUInt32BE(20), 480);
  cases.push({ uploadedOnlyConfirmedBytes: true, semanticCalls: 1, quota: 0 });
  assert.deepEqual(errors, []);
  fs.writeFileSync(
    dir + "/report.json",
    JSON.stringify(
      { cases, calls, errors, nativeDeviceVerified: false },
      null,
      2,
    ),
  );
  await browser.close();
  console.log(
    `PASS: ${cases.length} real-browser preparation checks; no paid calls; native device verification remains manual.`,
  );
})().catch(async (e) => {
  console.error(e);
  if (debugPage) {
    console.error(await debugPage.locator("body").innerText());
    await debugPage.screenshot({ path: dir + "/failure.png" });
  }
  process.exit(1);
});
