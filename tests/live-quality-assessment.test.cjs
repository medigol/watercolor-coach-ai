const test = require("node:test");
const assert = require("node:assert/strict");
const { loadShared } = require("./helpers/shared-loader.cjs");
const fixture = require("./helpers/canonical-fixture.cjs");
const { assessCoaching } = loadShared(
  "../shared/coachingAssessment.ts",
  "lib/overlays.ts",
);

function result(
  level = "competent",
  rationale = "Clear intent with balanced colour bands and a readable focal boat.",
) {
  const r = fixture();
  r.canonicalAnalysis.qualityAssessment = {
    level,
    confidence: 0.86,
    rationale,
  };
  return r;
}
function issue(r, observation, lesson, action, patch = {}) {
  const fact = {
    id: "supplied-problem",
    domain: "overall",
    roleId: null,
    observation,
  };
  const insight = {
    id: "supplied-opportunity",
    domain: "overall",
    classification: "clear_issue",
    factIds: [fact.id],
    lesson,
    action,
    ...patch,
  };
  r.canonicalAnalysis.facts.push(fact);
  r.canonicalAnalysis.insights.push(insight);
  return insight;
}

test("positive competent assessment with supplied successful facts can normalize to Strong without inventing advice", () => {
  const r = result(),
    before = structuredClone(r);
  assert.deepEqual(assessCoaching(r, []), {
    ...r.canonicalAnalysis.qualityAssessment,
    level: "strong",
  });
  assert.deepEqual(r, before);
});
test("confident developing assessment can normalize only when its supplied evidence and rationale are unequivocally positive", () => {
  const r = result("developing");
  assert.equal(assessCoaching(r, []).level, "strong");
});
test("fewer recommendations alone do not upgrade an ambiguous assessment", () => {
  const r = result(
    "competent",
    "The scene contains a boat and horizontal colour bands.",
  );
  assert.equal(assessCoaching(r, []).level, "competent");
});
test("uncertain positive rationale does not trigger normalization", () => {
  const r = result(
    "competent",
    "The value hierarchy seems clear, with possibly balanced colour bands.",
  );
  assert.equal(assessCoaching(r, []).level, "competent");
});
test("low assessment confidence remains unchanged despite positive supplied content", () => {
  const r = result();
  r.canonicalAnalysis.qualityAssessment.confidence = 0.79;
  assert.equal(assessCoaching(r, []).level, "competent");
});
test("confidence threshold is inclusive and does not alter supplied confidence", () => {
  const r = result();
  r.canonicalAnalysis.qualityAssessment.confidence = 0.8;
  assert.equal(assessCoaching(r, []).level, "strong");
  assert.equal(assessCoaching(r, []).confidence, 0.8);
});
test("positive rationale without supplied successful facts cannot establish Strong", () => {
  const r = result();
  r.canonicalAnalysis.insights.forEach(
    (i) => (i.classification = "stylistic_alternative"),
  );
  assert.equal(assessCoaching(r, []).level, "competent");
});
test("a supported material optional refinement prevents an automatic quality upgrade", () => {
  const r = result();
  const i = issue(
    r,
    "The disconnected water bands flatten spatial depth around the boat.",
    "Disconnected water bands weaken the boat's spatial integration.",
    "On a separate study, connect adjacent water values around the boat and compare its integration.",
    { classification: "optional_refinement" },
  );
  assert.equal(assessCoaching(r, [i]).level, "competent");
});
test("a capped or suppressed supported material issue still prevents upgrading by recommendation count", () => {
  const r = result();
  issue(
    r,
    "The background mountain's dark internal values compete with the vehicle's focal contrast.",
    "Mountain values compete with the vehicle's focal hierarchy.",
    "Compress the mountain's internal value range on a separate study.",
  );
  assert.equal(assessCoaching(r, []).level, "competent");
});
test("an unaligned original clear issue remains uncertainty rather than proof of Strong", () => {
  const r = result();
  r.canonicalAnalysis.insights.push({
    ...r.canonicalAnalysis.insights[0],
    id: "unaligned",
    classification: "clear_issue",
    lesson: "The church's perspective is inconsistent.",
    action: "Correct perspective in a separate study.",
  });
  assert.equal(assessCoaching(r, []).level, "competent");
});
test("hidden perspective criticism is removed while positive supplied explanation stays intact", () => {
  const r = result(
    "competent",
    "Clear light and a coherent focal hierarchy hold the scene together, though perspective and value transitions need refinement for depth.",
  );
  const q = assessCoaching(r, []);
  assert.equal(
    q.rationale,
    "Clear light and a coherent focal hierarchy hold the scene together.",
  );
  assert.equal(
    q.level,
    "competent",
    "removed criticism is not positive evidence for upgrading",
  );
});
test("unsupported standalone rationale limitation is omitted without invented replacement", () => {
  const r = result("competent", "The vehicle perspective needs refinement.");
  assert.equal(assessCoaching(r, []).rationale, "");
  assert.equal(assessCoaching(r, []).level, "competent");
});
test("appended optional edge criticism cannot hide inside positive rationale", () => {
  const r = result(
    "strong",
    "Coherent light and readable values establish depth, though some edges could be softer.",
  );
  assert.equal(
    assessCoaching(r, []).rationale,
    "Coherent light and readable values establish depth.",
  );
});
test("every property named in a rationale limitation requires matching surviving factual support", () => {
  const r = result(
    "competent",
    "Clear light establishes the subject. Perspective and value transitions need refinement for depth.",
  );
  const i = issue(
    r,
    "The building's inconsistent perspective flattens spatial depth.",
    "Perspective inconsistency weakens depth.",
    "Compare aligned building perspective in a separate study.",
  );
  assert.equal(
    assessCoaching(r, [i]).rationale,
    "Clear light establishes the subject.",
    "perspective support does not establish a value-transition defect",
  );
});
test("a supported actionable limitation can remain in rationale without harsh blanket removal", () => {
  const r = result(
    "competent",
    "Clear light establishes the subject. Inconsistent building perspective limits spatial depth.",
  );
  const i = issue(
    r,
    "The building's inconsistent perspective flattens spatial depth.",
    "Perspective inconsistency weakens depth.",
    "On a separate study, align the building's receding edges and compare spatial depth.",
  );
  assert.equal(
    assessCoaching(r, [i]).rationale,
    r.canonicalAnalysis.qualityAssessment.rationale,
  );
});
test("a matching insight omitted from displayed recommendations cannot preserve hidden critique", () => {
  const r = result(
    "competent",
    "Clear light establishes the subject. Inconsistent building perspective limits spatial depth.",
  );
  issue(
    r,
    "The building's inconsistent perspective flattens spatial depth.",
    "Perspective inconsistency weakens depth.",
    "Align building perspective on a separate study.",
  );
  assert.equal(
    assessCoaching(r, []).rationale,
    "Clear light establishes the subject.",
  );
});
test("proportion guidance cannot preserve an unsupported perspective limitation", () => {
  const r = result(
    "competent",
    "Clear light establishes the subject. Vehicle perspective needs refinement.",
  );
  const i = issue(
    r,
    "The vehicle proportions are inconsistent.",
    "Vehicle proportion weakens the subject's structure.",
    "Compare corrected vehicle proportions on a separate study.",
  );
  assert.equal(
    assessCoaching(r, [i]).rationale,
    "Clear light establishes the subject.",
  );
});
test("a chroma recommendation does not establish an alleged temperature problem", () => {
  const r = result(
    "competent",
    "Clear light establishes the subject. The supporting temperature needs refinement.",
  );
  const i = issue(
    r,
    "The supporting tree chroma competes with the focal boat.",
    "Tree saturation weakens the focal hierarchy.",
    "Reduce tree chroma on a separate study.",
  );
  assert.equal(
    assessCoaching(r, [i]).rationale,
    "Clear light establishes the subject.",
  );
});
test("descriptive property evidence alone cannot preserve an asserted rationale defect", () => {
  const r = result(
    "competent",
    "Clear light establishes the subject. The tower shadows need refinement.",
  );
  const i = issue(
    r,
    "The tower has broad middle-value shadows.",
    "The tower shadows could read more clearly.",
    "Adjust tower shadow values in a separate study.",
    { classification: "optional_refinement" },
  );
  assert.equal(
    assessCoaching(r, [i]).rationale,
    "Clear light establishes the subject.",
  );
});
test("supported subtle refinement does not mechanically label successful work defective", () => {
  const r = result();
  const i = issue(
    r,
    "A few sharp wires compete slightly with the tower silhouette.",
    "Some wires slightly compete with the tower edge.",
    "Soften selected wire edges in a separate study; compare the tower's separation.",
    { classification: "optional_refinement" },
  );
  assert.equal(assessCoaching(r, [i]).level, "strong");
});
for (const level of ["strong", "highly_resolved"])
  test(`presentation never automatically downgrades or promotes provider ${level}`, () => {
    const r = result(level);
    const i = issue(
      r,
      "Building perspective is inconsistent and weakens depth.",
      "Perspective weakens depth.",
      "Align perspective on a separate study.",
    );
    assert.equal(assessCoaching(r, [i]).level, level);
  });
test("assessment strips a dangling rationale fragment rather than completing it", () => {
  const r = result(
    "strong",
    "Clear light establishes the subject. The values and a",
  );
  assert.equal(
    assessCoaching(r, []).rationale,
    "Clear light establishes the subject.",
  );
});
test("person skill judgement does not replace visual rationale", () => {
  const r = result(
    "competent",
    "Clear light establishes the subject. The painter is highly skilled.",
  );
  assert.equal(
    assessCoaching(r, []).rationale,
    "Clear light establishes the subject.",
  );
  assert.equal(assessCoaching(r, []).level, "competent");
});
test("retained source rationale is concise and limited to two supplied clauses", () => {
  const r = result(
    "strong",
    "Clear light establishes the subject. Coherent values hold the scene. Balanced temperature supports the atmosphere.",
  );
  assert.equal(
    assessCoaching(r, []).rationale,
    "Clear light establishes the subject. Coherent values hold the scene.",
  );
});
test("an explicit absence of required correction remains a valid supplied assessment", () => {
  const r = result(
    "highly_resolved",
    "Clear light and coherent values hold the scene. No significant correction is needed.",
  );
  assert.equal(
    assessCoaching(r, []).rationale,
    r.canonicalAnalysis.qualityAssessment.rationale,
  );
});
