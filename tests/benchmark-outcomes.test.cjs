// Mock outcomes verify reporting arithmetic, never real-image model accuracy.
const test = require("node:test");
const assert = require("node:assert/strict");
const { statistics } = require("../scripts/benchmark/report.cjs");

function metric(expected, actual, extra = {}) {
  const c = {
    case_id: "C01",
    category: "challenging",
    ground_truth: expected,
    watercolor_status: "ambiguous",
    ...extra,
  };
  const row = { caseID: c.case_id, armID: "baseline_low", ...actual };
  return statistics([row], [c], [], [])[0];
}
for (const [expected, actual] of [
  ["accept", { outcome: "accepted" }],
  ["reject", { outcome: "rejected" }],
  ["uncertain", { outcome: "uncertain", reasonCode: "artwork_uncertain" }],
  ["crop-needed", { outcome: "uncertain", reasonCode: "crop_needed" }],
])
  test(`category accuracy matches ${expected} to its provider outcome`, () => {
    const m = metric(expected, actual).categoryMetrics[0];
    assert.equal(m.errors, 0);
    assert.equal(m.errorRate, 0);
  });

test("false acceptance remains an error for reject and required-crop controls", () => {
  for (const expected of ["reject", "crop-needed"]) {
    const m = metric(expected, { outcome: "accepted", canonicalValid: true });
    assert.equal(m.falseAcceptanceCount, 1);
    assert.equal(m.categoryMetrics[0].errors, 1);
  }
});
test("invalid and not-comparable responses are errors, never successful abstentions", () => {
  for (const outcome of ["invalid", "not_comparable"]) {
    const m = metric("accept", { outcome }, { abstention_acceptable: true });
    assert.equal(m.categoryMetrics[0].errors, 1);
  }
});
test("abstention is tolerated only when annotated before evaluation", () => {
  const actual = { outcome: "uncertain", reasonCode: "artwork_uncertain" };
  assert.equal(metric("accept", actual).categoryMetrics[0].errors, 1);
  assert.equal(
    metric("accept", actual, { abstention_acceptable: true }).categoryMetrics[0]
      .errors,
    0,
  );
});
test("unknown-medium uncertain ground truth cannot falsely score accepted art as an eligibility error", () => {
  const m = metric(
    "uncertain",
    { outcome: "accepted" },
    {
      ambiguous_ground_truth: true,
      abstention_acceptable: true,
    },
  );
  assert.equal(m.categoryMetrics[0].unscoredAmbiguous, 1);
  assert.equal(m.categoryMetrics[0].eligibilityScored, 0);
  assert.equal(m.categoryMetrics[0].errorRate, null);
  assert.equal(m.falseAcceptanceCount, 0);
  assert.equal(m.acceptanceRate, 1);
});
test("accepted critique with unknown medium remains eligible for independent artistic review", () => {
  const c = {
    case_id: "C01",
    category: "watercolor",
    ground_truth: "uncertain",
    watercolor_status: "ambiguous",
    ambiguous_ground_truth: true,
  };
  const row = {
    caseID: "C01",
    key: "test",
    armID: "baseline_low",
    outcome: "accepted",
    strictSchema: true,
    canonicalValid: true,
    finishReason: "stop",
    usage: { usd: 0.01 },
  };
  // Mock review rows verify routing only; no actual expert ratings are claimed.
  const reviews = ["R1", "R2"].map((reviewer) => ({
    blindID: "V1",
    reviewer,
    visuallyGrounded: true,
    uiUsable: true,
    hallucination: false,
    originalProcessClaim: false,
    scores: { A: 4, B: 4, C: 4, D: 4, E: 4, F: 4, G: 4 },
  }));
  const m = statistics([row], [c], reviews, [
    { blindID: "V1", armID: "baseline_low", key: "test" },
  ])[0];
  assert.equal(m.costUSD.reviewedUsableOutputs, 1);
  assert.equal(m.categoryMetrics[0].errorRate, null);
  assert.equal(m.watercolorRecall, null); // No invented confirmed-positive truth.
});
