// Optional controlled browser validation; supply Playwright on NODE_PATH.
const assert = require("node:assert/strict"),
  fs = require("node:fs");
const { chromium } = require("playwright");
(async () => {
  const base = process.argv[2] || "http://localhost:8093/watercolor-coach-ai";
  const browser = await chromium.launch({
    ...(fs.existsSync("/usr/bin/chromium")
      ? { executablePath: "/usr/bin/chromium" }
      : {}),
    args: ["--no-sandbox"],
  });
  try {
    const page = await browser.newPage();
    const errors = [],
      unexpected = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.route("**/*", async (route) => {
      if (new URL(route.request().url()).origin === new URL(base).origin)
        return route.continue();
      unexpected.push(route.request().url());
      await route.abort();
    });
    for (const route of [
      "/",
      "/artworks",
      "/practice",
      "/learn",
      "/learn/path",
      "/learn/curriculum",
      "/learn/styles",
      "/learn/onboarding",
      "/learn/lesson?id=water-brush",
      "/learn/progress",
      "/learn/videos",
      "/account",
      "/upload/improve-painting",
      "/upload/create-reference",
      "/result/improve-painting",
      "/result/create-reference",
    ]) {
      await page.goto(base + route);
      await page.getByText("Account setup needed", { exact: true }).waitFor();
      assert(await page.getByText(/EXPO_PUBLIC_SUPABASE_URL/).count());
    }
    assert.deepEqual(errors, []);
    assert.deepEqual(unexpected, []);
    console.log(
      "PASS: sixteen unconfigured Pages routes; safe setup screen; zero external requests; zero runtime errors.",
    );
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
