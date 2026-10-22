const test = require("node:test");
const assert = require("node:assert/strict");
const { loadShared } = require("./helpers/shared-loader.cjs");
const fixture = require("./helpers/canonical-fixture.cjs");
const { assessCoaching } = loadShared(
  "../shared/coachingAssessment.ts",
  "lib/overlays.ts",
);
const { workspaceTeaching } = loadShared(
  "../shared/coachingWorkspace.ts",
  "lib/overlays.ts",
);

const positive =
  "Clear focal separation and coherent value relationships support the atmosphere.";
const neutralStatus = "Review the observations and studies below.";
const strongStatus =
  "No major issue detected.";

function result(level = "competent", rationale = positive) {
  const r = fixture();
  r.canonicalAnalysis.qualityAssessment = {
    level,
    confidence: 0.86,
    rationale,
  };
  return r;
}

function material(r, classification = "clear_issue") {
  const fact = {
    id: "water-problem",
    domain: "overall",
    roleId: null,
    observation:
      "Disconnected water bands flatten spatial depth around the boat.",
  };
  const insight = {
    id: "water-integration",
    domain: "overall",
    classification,
    factIds: [fact.id],
    lesson: "Disconnected water bands weaken the boat's spatial integration.",
    action:
      "On a separate study, connect adjacent water values around the boat and compare spatial integration.",
  };
  r.canonicalAnalysis.facts.push(fact);
  r.canonicalAnalysis.insights.push(insight);
  return insight;
}

for (const level of ["competent", "developing"])
  test(`freeze assessment: clearly positive ${level} with factual strength may display Strong`, () => {
    const r = result(level);
    const before = structuredClone(r);
    assert.equal(assessCoaching(r, []).level, "strong");
    assert.deepEqual(
      r,
      before,
      "stored quality and canonical evidence stay unchanged",
    );
  });

test("freeze assessment: an original supported clear issue blocks upgrading even when omitted", () => {
  const r = result();
  material(r);
  assert.equal(assessCoaching(r, []).level, "competent");
});

test("freeze assessment: a surviving material optional recommendation blocks upgrading", () => {
  const r = result();
  const insight = material(r, "optional_refinement");
  assert.equal(assessCoaching(r, [insight]).level, "competent");
});

test("freeze assessment: omitted optional advice is not counted as a surviving recommendation", () => {
  const r = result();
  material(r, "optional_refinement");
  assert.equal(assessCoaching(r, []).level, "strong");
});

test("freeze assessment: removing advice alone cannot establish quality from an ambiguous rationale", () => {
  const r = result("competent", "The image contains a tower and open water.");
  assert.equal(assessCoaching(r, []).level, "competent");
});

test("freeze assessment: uncertain positive wording remains a reason not to normalize", () => {
  const r = result(
    "competent",
    "The focal hierarchy seems clear and possibly coherent.",
  );
  assert.equal(assessCoaching(r, []).level, "competent");
});

test("freeze assessment: a negated positive statement is not positive quality evidence", () => {
  const r = result("competent", "The value structure is not coherent.");
  assert.equal(assessCoaching(r, []).level, "competent");
});

test("freeze assessment: speculative success cannot establish an unequivocally positive rationale", () => {
  const r = result("competent", "The focal hierarchy could be clear.");
  assert.equal(assessCoaching(r, []).level, "competent");
});

test("freeze assessment: a non-problem fact alone is not a genuinely successful strength", () => {
  const r = result();
  r.canonicalAnalysis.facts = [
    {
      id: "plain",
      domain: "overall",
      roleId: null,
      observation: "A tower occupies part of the image.",
    },
  ];
  r.canonicalAnalysis.insights = [
    {
      id: "plain-strength",
      domain: "overall",
      classification: "strength",
      factIds: ["plain"],
      lesson: "The tower is present in the image.",
      action: "Preserve the tower.",
    },
  ];
  assert.equal(assessCoaching(r, []).level, "competent");
});

test("freeze assessment: a successful lesson needs a related factual property", () => {
  const r = result();
  r.canonicalAnalysis.facts = [
    {
      id: "plain",
      domain: "overall",
      roleId: null,
      observation: "The tower has warm colour.",
    },
  ];
  r.canonicalAnalysis.insights = [
    {
      id: "plain-strength",
      domain: "overall",
      classification: "strength",
      factIds: ["plain"],
      lesson: "Clear perspective gives the scene convincing structure.",
      action: "Preserve the perspective.",
    },
  ];
  assert.equal(assessCoaching(r, []).level, "competent");
});

test("freeze assessment: a factual successful relationship in the lesson remains sufficient", () => {
  const r = result();
  r.canonicalAnalysis.facts = [
    {
      id: "colour",
      domain: "overall",
      roleId: null,
      observation: "The tower has warm colour beside cool water.",
    },
  ];
  r.canonicalAnalysis.insights = [
    {
      id: "colour-strength",
      domain: "overall",
      classification: "strength",
      factIds: ["colour"],
      lesson: "Clear warm–cool separation supports the atmosphere.",
      action: "Preserve the temperature relationship.",
    },
  ];
  assert.equal(assessCoaching(r, []).level, "strong");
});

test("freeze assessment: a positive colour fact cannot establish unrelated perspective success", () => {
  const r = result();
  r.canonicalAnalysis.facts = [
    {
      id: "colour",
      domain: "overall",
      roleId: null,
      observation:
        "Warm tower light has effective colour separation from cool water.",
    },
  ];
  r.canonicalAnalysis.insights = [
    {
      id: "unrelated-strength",
      domain: "overall",
      classification: "strength",
      factIds: ["colour"],
      lesson: "Clear perspective gives convincing spatial structure.",
      action: "Preserve the perspective.",
    },
  ];
  assert.equal(assessCoaching(r, []).level, "competent");
});

test("freeze assessment: a positive fact about a different named subject does not support the strength", () => {
  const r = result();
  r.canonicalAnalysis.facts = [
    {
      id: "boat",
      domain: "overall",
      roleId: null,
      observation: "Clear boat edges support focal separation.",
    },
  ];
  r.canonicalAnalysis.insights = [
    {
      id: "unrelated-strength",
      domain: "overall",
      classification: "strength",
      factIds: ["boat"],
      lesson: "Clear tower edges give the architecture a readable outline.",
      action: "Preserve the tower edges.",
    },
  ];
  assert.equal(assessCoaching(r, []).level, "competent");
});

test("freeze assessment: low confidence blocks normalization despite positive successful content", () => {
  const r = result();
  r.canonicalAnalysis.qualityAssessment.confidence = 0.79;
  assert.equal(assessCoaching(r, []).level, "competent");
});

for (const level of ["strong", "highly_resolved"])
  test(`freeze assessment: ${level} is never downgraded`, () => {
    const r = result(level);
    const insight = material(r);
    assert.equal(assessCoaching(r, [insight]).level, level);
  });

test("freeze status: normalized Strong uses the existing Strong status", () => {
  const teaching = workspaceTeaching(result());
  assert.equal(teaching.assessment.level, "strong");
  assert.equal(teaching.status, strongStatus);
  assert.equal(teaching.recommendations.length, 0);
});

for (const level of ["competent", "developing"])
  test(`freeze status: non-upgraded ${level} without advice uses neutral observational copy`, () => {
    const teaching = workspaceTeaching(
      result(level, "The image contains a tower and open water."),
    );
    assert.equal(teaching.assessment.level, level);
    assert.equal(teaching.recommendations.length, 0);
    assert.equal(teaching.status, neutralStatus);
    assert.doesNotMatch(
      teaching.status,
      /handling|observed structure|priority|opportunity/i,
    );
  });

test("freeze status: non-material optional advice does not imply an undisclosed material issue", () => {
  const r = result("competent", "The focal separation seems clear.");
  const fact = {
    id: "wire-detail",
    domain: "overall",
    roleId: null,
    observation:
      "A few sharp wires compete slightly with the tower silhouette.",
  };
  const insight = {
    id: "wire-refinement",
    domain: "overall",
    classification: "optional_refinement",
    factIds: [fact.id],
    lesson: "A few wire edges slightly compete with the tower silhouette.",
    action:
      "Soften selected wire edges in a separate study; compare the tower's separation.",
  };
  r.canonicalAnalysis.facts.push(fact);
  r.canonicalAnalysis.insights.push(insight);
  const teaching = workspaceTeaching(r);
  assert.equal(teaching.assessment.level, "competent");
  assert.equal(teaching.recommendations.length, 1);
  assert.equal(teaching.status, neutralStatus);
});

test("freeze status: a supported material issue retains its actionable status", () => {
  const r = result("developing");
  material(r);
  const teaching = workspaceTeaching(r);
  assert.equal(teaching.assessment.level, "developing");
  assert.equal(teaching.status, "Main priority");
});

test("freeze status: a surviving material optional opportunity retains actionable copy", () => {
  const r = result();
  material(r, "optional_refinement");
  const teaching = workspaceTeaching(r);
  assert.equal(teaching.assessment.level, "competent");
  assert.equal(teaching.status, "Main opportunity to explore");
});
