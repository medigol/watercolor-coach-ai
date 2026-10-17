const test = require("node:test");
const assert = require("node:assert/strict");
const { loadShared } = require("./helpers/shared-loader.cjs");
const fixture = require("./helpers/canonical-fixture.cjs");
const { assessCoaching } = loadShared(
  "../shared/coachingAssessment.ts",
  "lib/overlays.ts",
);
const { materialInsight } = loadShared(
  "../shared/coachingAlignment.ts",
  "lib/overlays.ts",
);

function result(level = "competent") {
  const r = fixture();
  r.canonicalAnalysis.qualityAssessment = {
    level,
    confidence: 0.86,
    rationale:
      "Clear value separation establishes the focal tower. Coherent temperature relationships support the atmosphere.",
  };
  return r;
}

function issue(r, observation, lesson, action) {
  const fact = {
    id: "depth-freeze-fact",
    domain: "overall",
    roleId: null,
    observation,
  };
  const insight = {
    id: "depth-freeze-issue",
    domain: "overall",
    classification: "clear_issue",
    factIds: [fact.id],
    lesson,
    action,
  };
  r.canonicalAnalysis.facts.push(fact);
  r.canonicalAnalysis.insights.push(insight);
  return insight;
}

test("analysis depth: an unsupported raw clear issue no longer blocks factual Strong normalization", () => {
  const r = result();
  issue(
    r,
    "The tower stands slightly right of centre.",
    "Compressed base shadows weaken the tower's spatial depth.",
    "On a separate study, clarify shadow depth around the tower base.",
  );
  assert.equal(assessCoaching(r, []).level, "strong");
});

test("analysis depth: a raw clear issue without linked problem evidence is not a material blocker", () => {
  const r = result();
  issue(
    r,
    "The background has broad soft edges.",
    "The background has soft edge transitions.",
    "On a separate study, compare softer versus current background edges.",
  );
  assert.equal(assessCoaching(r, []).level, "strong");
});

test("analysis depth: an issue with no surviving factual reference cannot block normalization", () => {
  const r = result();
  const i = issue(
    r,
    "The sky has clear value grouping.",
    "Building perspective is inconsistent.",
    "Align the building perspective in a separate study.",
  );
  i.factIds = ["missing-fact"];
  assert.equal(assessCoaching(r, []).level, "strong");
});

test("analysis depth: a supported material clear issue blocks Strong even when its advice is omitted", () => {
  const r = result();
  const i = issue(
    r,
    "Disconnected water bands flatten spatial depth around the boat.",
    "Disconnected water bands weaken the boat's spatial integration.",
    "Connect adjacent water values around the boat in a separate study.",
  );
  assert.equal(materialInsight(i, r.canonicalAnalysis.facts), true);
  assert.equal(assessCoaching(r, []).level, "competent");
});

test("analysis depth: a clear-issue label cannot make an explicitly slight local effect material", () => {
  const r = result();
  const i = issue(
    r,
    "A few wire edges slightly compete with the tower silhouette.",
    "A subtle wire-edge competition slightly reduces the tower's separation.",
    "On a separate study, soften selected wire edges and compare the tower's separation.",
  );
  assert.equal(materialInsight(i, r.canonicalAnalysis.facts), false);
  assert.equal(assessCoaching(r, []).level, "strong");
  assert.equal(assessCoaching(r, [i]).level, "strong");
});

test("analysis depth: a mild lesson cannot erase materially harmful linked facts", () => {
  const r = result();
  const i = issue(
    r,
    "The mountain's strong internal contrast competes with the focal vehicle and weakens hierarchy.",
    "A subtle mountain contrast refinement could strengthen the vehicle hierarchy.",
    "Compress mountain contrast in a separate study.",
  );
  assert.equal(materialInsight(i, r.canonicalAnalysis.facts), true);
  assert.equal(assessCoaching(r, []).level, "competent");
});

test("analysis depth: an explicit severe consequence remains material despite a slight modifier", () => {
  const r = result();
  const i = issue(
    r,
    "The slightly darker background obscures the focal vehicle and creates a major hierarchy problem.",
    "A subtle mountain contrast refinement could strengthen the vehicle hierarchy.",
    "Compress background contrast in a separate study.",
  );
  assert.equal(materialInsight(i, r.canonicalAnalysis.facts), true);
  assert.equal(assessCoaching(r, []).level, "competent");
});

test("analysis depth: local or selected wording alone cannot neutralize a material issue", () => {
  const r = result();
  const i = issue(
    r,
    "Selected mountain darks compete with the vehicle's focal contrast.",
    "Selected mountain darks weaken the vehicle hierarchy.",
    "On a separate small study, reduce selected mountain darks and compare the vehicle's separation.",
  );
  assert.equal(materialInsight(i, r.canonicalAnalysis.facts), true);
});

test("analysis depth: zero recommendations and low confidence still cannot establish Strong", () => {
  const r = result();
  r.canonicalAnalysis.qualityAssessment.confidence = 0.79;
  assert.equal(assessCoaching(r, []).level, "competent");
});

test("analysis depth: an uncertain positive rationale still blocks Strong", () => {
  const r = result();
  r.canonicalAnalysis.qualityAssessment.rationale =
    "The focal hierarchy seems clear and possibly coherent.";
  assert.equal(assessCoaching(r, []).level, "competent");
});

test("analysis depth: no advice and descriptive-only rationale do not prove quality", () => {
  const r = result();
  r.canonicalAnalysis.qualityAssessment.rationale =
    "The image contains a tower beside water.";
  assert.equal(assessCoaching(r, []).level, "competent");
});

test("analysis depth: normalization still requires a genuinely successful factual strength", () => {
  const r = result();
  r.canonicalAnalysis.insights = [];
  assert.equal(assessCoaching(r, []).level, "competent");
});

test("analysis depth: calibration remains display-only with canonical roles and geometry unchanged", () => {
  const r = result();
  issue(
    r,
    "The tower has warm light.",
    "The tower perspective is inconsistent.",
    "Correct the tower perspective in a separate study.",
  );
  const before = structuredClone(r);
  assert.equal(assessCoaching(r, []).level, "strong");
  assert.deepEqual(r, before);
  assert.equal(r.canonicalAnalysis.version, 1);
});

const rationale = [
  "Clear tower-to-water value separation establishes the focal hierarchy.",
  "Coherent warm light against cool surroundings supports the atmosphere.",
  "The rising bank connects foreground movement with the tower.",
  "Soft distant transitions leave the selected tower contour readable.",
];

test("analysis depth: Strong rationale can retain four supplied teaching sentences", () => {
  const r = result("strong");
  r.canonicalAnalysis.qualityAssessment.rationale = rationale.join(" ");
  assert.equal(assessCoaching(r, []).rationale, rationale.join(" "));
});

test("analysis depth: a concise accurate rationale is never padded to a minimum length", () => {
  const r = result("strong");
  r.canonicalAnalysis.qualityAssessment.rationale = rationale[0];
  assert.equal(assessCoaching(r, []).rationale, rationale[0]);
});

test("analysis depth: supplied rationale remains capped at four concise teaching sentences", () => {
  const r = result("strong");
  r.canonicalAnalysis.qualityAssessment.rationale = [
    ...rationale,
    "The open water keeps the supporting field quiet.",
  ].join(" ");
  assert.equal(assessCoaching(r, []).rationale, rationale.join(" "));
});

test("analysis depth: unsupported critique cannot hide in the newly retained third sentence", () => {
  const r = result();
  r.canonicalAnalysis.qualityAssessment.rationale = [
    ...rationale.slice(0, 2),
    "The vehicle perspective needs refinement.",
    rationale[3],
  ].join(" ");
  assert.equal(
    assessCoaching(r, []).rationale,
    [...rationale.slice(0, 2), rationale[3]].join(" "),
  );
});

test("analysis depth: an actionable supported limitation may remain alongside deeper supplied rationale", () => {
  const r = result();
  const limitation = "Inconsistent building perspective limits spatial depth.";
  const i = issue(
    r,
    "The building's inconsistent perspective flattens spatial depth.",
    "Inconsistent building perspective weakens spatial depth.",
    "On a separate study, align building perspective and compare spatial depth.",
  );
  r.canonicalAnalysis.qualityAssessment.rationale = [
    ...rationale.slice(0, 2),
    limitation,
  ].join(" ");
  assert.equal(
    assessCoaching(r, [i]).rationale,
    r.canonicalAnalysis.qualityAssessment.rationale,
  );
  assert.equal(
    assessCoaching(r, []).rationale,
    rationale.slice(0, 2).join(" "),
  );
});

test("analysis depth: a mismatched target cannot preserve hidden rationale criticism", () => {
  const r = result();
  const i = issue(
    r,
    "The boat perspective is inconsistent and weakens spatial depth.",
    "Inconsistent building perspective weakens spatial depth.",
    "On a separate study, align building perspective and compare spatial depth.",
  );
  r.canonicalAnalysis.qualityAssessment.rationale = `${rationale[0]} Building perspective needs refinement.`;
  assert.equal(assessCoaching(r, [i]).rationale, rationale[0]);
});

test("analysis depth: successful background value compression remains positive rationale evidence", () => {
  const r = result();
  r.canonicalAnalysis.qualityAssessment.rationale =
    "The compressed background values create strong atmospheric recession. Clear focal separation and coherent light support the calm mood.";
  const assessed = assessCoaching(r, []);
  assert.equal(assessed.level, "strong");
  assert.equal(
    assessed.rationale,
    r.canonicalAnalysis.qualityAssessment.rationale,
  );
});

test("analysis depth: a factual strength may teach successful value compression", () => {
  const r = result();
  r.canonicalAnalysis.facts = [
    {
      id: "compressed-values",
      domain: "overall",
      roleId: null,
      observation:
        "The compressed mountain values create strong atmospheric recession behind the tower.",
    },
  ];
  r.canonicalAnalysis.insights = [
    {
      id: "compressed-strength",
      domain: "overall",
      classification: "strength",
      factIds: ["compressed-values"],
      lesson:
        "Compressed mountain values support clear spatial depth behind the tower.",
      action: "Preserve the restrained background value range.",
    },
  ];
  assert.equal(assessCoaching(r, []).level, "strong");
});

test("analysis depth: compressed spatial shadows remain a limitation rather than a value-compression success", () => {
  const r = result();
  r.canonicalAnalysis.qualityAssessment.rationale = `${rationale[0]} The compressed base shadows limit spatial depth.`;
  assert.equal(assessCoaching(r, []).level, "competent");
  assert.equal(assessCoaching(r, []).rationale, rationale[0]);
});

test("analysis depth: supported compressed-shadow harm still blocks Strong and retains actionable rationale", () => {
  const r = result();
  const i = issue(
    r,
    "Compressed shadows around the tower base limit spatial depth.",
    "Compressed tower-base shadows weaken spatial depth.",
    "On a separate study, clarify shadow depth around the tower base.",
  );
  r.canonicalAnalysis.qualityAssessment.rationale = `${rationale[0]} Compressed shadows around the tower base limit spatial depth.`;
  const assessed = assessCoaching(r, [i]);
  assert.equal(assessed.level, "competent");
  assert.equal(
    assessed.rationale,
    r.canonicalAnalysis.qualityAssessment.rationale,
  );
});

test("analysis depth: value compression with supplied harmful consequence is not exempted", () => {
  const r = result();
  r.canonicalAnalysis.qualityAssessment.rationale = `${rationale[0]} The compressed background values flatten spatial depth.`;
  assert.equal(assessCoaching(r, []).level, "competent");
  assert.equal(assessCoaching(r, []).rationale, rationale[0]);
});

test("analysis depth: a positive compression phrase cannot mask another supplied limitation", () => {
  const r = result();
  r.canonicalAnalysis.qualityAssessment.rationale =
    "The compressed background values create strong recession but the road contrast competes with the focal tower.";
  assert.equal(assessCoaching(r, []).level, "competent");
  assert.equal(
    assessCoaching(r, []).rationale,
    "The compressed background values create strong recession.",
  );
});

test("an unrelated problematic linked fact cannot make a neutral placement claim material", () => {
  const r = result();
  const i = issue(
    r,
    "The tower placement remains central.",
    "The tower placement remains central.",
    "Compare the tower placement on a separate study.",
  );
  r.canonicalAnalysis.facts.push({
    id: "unrelated-noise",
    domain: "technique",
    roleId: null,
    observation:
      "The foreground wire detail is noisy and competes with the low bank.",
  });
  i.factIds.push("unrelated-noise");
  const before = structuredClone(r);
  assert.equal(materialInsight(i, r.canonicalAnalysis.facts), false);
  assert.equal(assessCoaching(r, []).level, "strong");
  assert.deepEqual(r, before);
});
