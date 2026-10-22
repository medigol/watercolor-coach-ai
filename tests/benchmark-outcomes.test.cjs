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
