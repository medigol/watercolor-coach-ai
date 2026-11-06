const test = require("node:test"),
  assert = require("node:assert/strict"),
  { mediumOutputTokens, estimate } = require(
    "../scripts/reference-cost-estimate.cjs",
  );
test("official medium square calculator yields 1756 image output tokens", () => {
  assert.equal(mediumOutputTokens(1024, 1024), 1756);
  const r = estimate(1024, 1024);
  assert.equal(r.developerDocsStandard.outputOnlyUSD, .05268);
  assert.equal(
    r.ownerQuotedLowerRatesNotConfirmedForSynchronousEdits.outputOnlyUSD,
    .02634,
  );
  assert.equal(r.developerDocsStandard.totalUSD, null);
});
test("conditional edit estimate separates assumed inputs from observed usage", () => {
  const r = estimate(1024, 1024, 2000, 800);
  assert.equal(r.developerDocsStandard.totalUSD, .07268);
  assert.equal(
    r.ownerQuotedLowerRatesNotConfirmedForSynchronousEdits.totalUSD,
    .03634,
  );
  assert.equal(r.actualBill, false);
  assert.equal(r.providerRequests, 0);
});
test("calculator respects aspect and half-even grid rounding", () => {
  assert.equal(mediumOutputTokens(1184, 880), 1315);
  assert.equal(mediumOutputTokens(880, 1184), 1315);
  assert.notEqual(
    mediumOutputTokens(1536, 1024),
    mediumOutputTokens(1024, 1024),
  );
});
test("invalid resolution or unbounded token assumptions fail closed", () => {
  for (const wh of [[1000, 1000], [16, 16], [4096, 1024], [1024, 0]]) {
    assert.throws(() => mediumOutputTokens(...wh));
  }
  for (const n of [NaN, -1, Infinity, 1e10]) {
    assert.throws(() => estimate(1024, 1024, n, 1));
  }
});
