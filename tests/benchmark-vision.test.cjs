// Numeric accounting expectations from supplied official docs, not AI accuracy.
const test = require("node:test"),
  assert = require("node:assert/strict");
const {
  ARMS,
  selectArms,
  projected,
} = require("../scripts/benchmark/models.cjs");
const { imageTokenBound } = require("../scripts/benchmark/vision.cjs");
const { lockedProduction } = require("../scripts/benchmark/production.cjs");
for (const [size, expected41, expected54] of [
  [{ width: 915, height: 1280 }, 1880, 1392],
  [{ width: 857, height: 1280 }, 1750, 1296],
  [{ width: 591, height: 1280 }, 1232, 912],
])
  test(`documented patches and upward-rounded image bounds: ${size.width}x${size.height}`, () => {
    for (const a of ARMS.slice(0, 2)) {
      const r = imageTokenBound(a, size);
      assert.equal(r.maxImageTokens, expected41);
      assert.equal(r.method, "unresized_patch_count");
    }
    assert.equal(imageTokenBound(ARMS[2], size).maxImageTokens, expected54);
    assert.equal(imageTokenBound(ARMS[3], size), null);
  });
test("oversize image uses documented cap without inventing a resize or Luna rule", () => {
  assert.equal(
    imageTokenBound(ARMS[0], { width: 3072, height: 3072 }).maxImageTokens,
    6636,
  );
  assert.equal(
    imageTokenBound(ARMS[2], { width: 3072, height: 3072 }).maxImageTokens,
    3000,
  );
  assert.equal(
    imageTokenBound({ ...ARMS[2], detail: "low" }, { width: 800, height: 600 }),
    null,
  );
  assert.throws(() => imageTokenBound(ARMS[0], { width: 0, height: 600 }));
});
test("selection is canonical, explicit, preserves all-four default and rejects substitutions", () => {
  assert.equal(selectArms().length, 4);
  assert.deepEqual(
    selectArms("candidate_mini,baseline_high,baseline_low"),
    ARMS.slice(0, 3),
  );
  for (const ids of [
    "",
    "baseline_low,baseline_low",
    "gpt-4.1-mini",
    "candidate_unknown",
    " baseline_low",
    [],
    true,
  ])
    assert.throws(() => selectArms(ids));
});
test("prepared dimensions tighten image reservation; an understated attested cap fails closed", () => {
  const p = lockedProduction(),
    a = ARMS[0];
  const card = {
    arms: {
      baseline_low: {
        input: 0.4,
        cached: 0.4,
        cacheWrite: 0.4,
        output: 1.6,
        maxImageTokens: 20000,
      },
    },
  };
  const r = projected(p, a, Buffer.alloc(0), "image/jpeg", card, {
    width: 915,
    height: 1280,
  });
  assert.equal(r.imageBound, 1880);
  assert.equal(r.outputBound, 3000);
  assert.equal(r.inputBound, r.textBound + 1880);
  assert.equal(r.usd, (r.inputBound * 0.8 + 3000 * 1.6) / 1e6); // Full input + additive allowance, no cache discount.
  card.arms.baseline_low.maxImageTokens = 1879;
  assert.throws(
    () =>
      projected(p, a, Buffer.alloc(0), "image/jpeg", card, {
        width: 915,
        height: 1280,
      }),
    /below documented/,
  );
});
