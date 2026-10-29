// Offline editorial board only. No real player/content or production account.
const { chromium } = require("playwright"),
  fs = require("node:fs"),
  path = require("node:path"),
  assert = require("node:assert/strict");
const boardUrl =
    process.argv[3] || "http://127.0.0.1:8165/OWNER_REVIEW_BOARD.html",
  out = process.argv[2] || "/tmp/watercolour-final-handoff-validation/board";
fs.mkdirSync(out, { recursive: true });
(async () => {
  const browser = await chromium.launch({
    executablePath: "/usr/bin/chromium",
    args: ["--no-sandbox"],
  });
  const page = await browser.newPage({
      viewport: { width: 1440, height: 1000 },
      acceptDownloads: true,
    }),
    errors = [],
    external = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.route("**/*", (r) => {
    const u = r.request().url();
    if (u.startsWith(new URL(boardUrl).origin + "/") || u.startsWith("blob:"))
      return r.continue();
    external.push(u);
    return r.abort();
  });
  try {
    await page.goto(boardUrl);
    await page
      .getByRole("heading", {
        name: "Final video review",
      })
      .waitFor();
    await page
      .getByText(
        "Witnessed proposal: 47–702 seconds. This is not a verified final clip or full video duration.",
        { exact: true },
      )
      .waitFor();
    assert.equal(
      await page
        .getByLabel("Actually inspected final end (seconds)")
        .inputValue(),
      "",
    );
    assert.equal(await page.locator("iframe").count(), 0);
    await page.screenshot({
      path: path.join(out, "01-steve-already-screened.png"),
      fullPage: false,
    });
    await page.getByRole("button", { name: /paul-values/ }).click();
    await page.getByText(/Witnessed proposal: 37–852 seconds/).waitFor();
    await page.getByRole("button", { name: /louise-blend/ }).click();
    await page.getByText(/Owner start-only hint: 90 seconds/).waitFor();
    assert.equal(
      await page
        .getByLabel("Actually inspected final end (seconds)")
        .inputValue(),
      "",
    );
    await page.getByRole("button", { name: /cafe-cloud-tips/ }).click();
    await page
      .getByText(/CSV end 162s versus candidate JSON end 298s/)
      .waitFor();
    await page
      .getByText("No owner-observed start or end recorded.", { exact: true })
      .waitFor();
    await page.getByRole("button", { name: /javid-cityscape$/ }).click();
    await page.getByText(/Javid: optional intermediate\/advanced/).waitFor();
    await page
      .getByText(/No claim of viewing this particular video/i)
      .waitFor();
    await page.screenshot({
      path: path.join(out, "02-javid-advanced-plan.png"),
      fullPage: false,
    });
    await page.getByLabel("Research pathway").selectOption("beginner");
    assert.equal(await page.getByRole("button", { name: /javid-/ }).count(), 0);
    await page.getByLabel("Research pathway").selectOption("intermediate");
    assert.equal(await page.getByRole("button", { name: /javid-/ }).count(), 3);
    const sizes = [];
    for (const width of [320, 375, 390, 430, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      assert(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        "review board reflows",
      );
      sizes.push(width);
      if (width === 375)
        await page.screenshot({ path: path.join(out, "03-mobile-board.png") });
    }
    await page.getByRole("button", { name: /louise-blend/ }).click();
    await page.getByLabel("Verified total duration (seconds)").fill("100");
    await page
      .getByLabel("Actually inspected final start (seconds)")
      .fill("90");
    await page.getByLabel("Actually inspected final end (seconds)").fill("120");
    await page
      .getByRole("button", { name: "Export remaining-review worksheet" })
      .click();
    await page
      .getByRole("status")
      .filter({ hasText: /Cannot export: invalid time range/ })
      .waitFor();
    await page.getByLabel("Actually inspected final end (seconds)").fill("");
    await page
      .getByText("Additional actually inspected clips from this video", {
        exact: true,
      })
      .click();
    await page
      .getByRole("button", {
        name: "Add another inspected segment",
        exact: true,
      })
      .click();
    await page
      .getByText("Additional actually inspected clips from this video", {
        exact: true,
      })
      .click();
    await page
      .getByLabel("Additional clip 1 start (seconds)", { exact: true })
      .fill("30");
    await page
      .getByLabel("Additional clip 1 end (seconds)", { exact: true })
      .fill("90");
    const download = page.waitForEvent("download");
    await page
      .getByRole("button", { name: "Export remaining-review worksheet" })
      .click();
    const d = await download;
    const payload = JSON.parse(fs.readFileSync(await d.path(), "utf8"));
    assert.equal(payload.publicationApproval, false);
    assert.equal(
      payload.inspections.find((x) => x.candidateId === "louise-blend")
        .additionalSegments[0].endSeconds,
      90,
    );
    assert.equal(payload.ownerScreeningPreserved.length, 4);
    assert.equal(
      payload.inspections.find((x) => x.candidateId === "louise-blend")
        .finalEndSeconds,
      null,
    );
    assert(
      payload.inspections.every((x) =>
        Object.values(x.scores).every((n) => n === null),
      ),
    );
    await page.keyboard.press("Tab");
    await page
      .getByRole("button", { name: "Export remaining-review worksheet" })
      .focus();
    assert.equal(
      await page
        .getByRole("button", { name: "Export remaining-review worksheet" })
        .evaluate((e) => getComputedStyle(e).outlineWidth),
      "3px",
    );
    assert.deepEqual(errors, []);
    assert.deepEqual(external, []);
    fs.writeFileSync(
      path.join(out, "report.json"),
      JSON.stringify(
        {
          status: "PASS",
          widths: sizes,
          ownerAnswersPreserved: true,
          noGuessedEndpoints: true,
          conflictVisible: true,
          javidAdvancedOnly: true,
          draftExportNotApproval: true,
          invalidRangeBlocked: true,
          noThirdPartyRequests: true,
          errors,
          external,
          realPlayback: false,
        },
        null,
        2,
      ),
    );
    console.log(
      "PASS: offline review board; 7 widths; four owner answers preserved; witnessed/hint/final separation; Javid advanced plan; invalid export blocked; no third-party requests.",
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
