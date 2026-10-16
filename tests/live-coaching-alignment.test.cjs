const test = require("node:test");
const assert = require("node:assert/strict");
const { loadShared } = require("./helpers/shared-loader.cjs");
const canonicalFixture = require("./helpers/canonical-fixture.cjs");
const alignment = loadShared(
  "../shared/coachingAlignment.ts",
  "lib/overlays.ts",
);
const calibration = loadShared(
  "../shared/coachingCalibration.ts",
  "lib/overlays.ts",
);
const { workspaceTeaching } = loadShared(
  "../shared/coachingWorkspace.ts",
  "lib/overlays.ts",
);

const fact = (id, observation) => ({
  id,
  observation,
  domain: "overall",
  roleId: null,
});
const advice = (id, factIds, lesson, action, patch = {}) => ({
  id,
  domain: "overall",
  classification: "optional_refinement",
  factIds,
  lesson,
  action,
  ...patch,
});
function result(facts, insights) {
  const r = canonicalFixture();
  // Every exercise below explicitly supplies its own linked evidence. The
  // unrelated technical scene cannot accidentally support a claimed defect.
  r.canonicalAnalysis.facts = facts;
  r.canonicalAnalysis.insights = insights;
  r.canonicalAnalysis.visualRoles = [];
  r.canonicalAnalysis.visualEvidence = [];
  r.canonicalAnalysis.qualityAssessment = {
    level: "competent",
    confidence: 0.7,
    rationale: "The supplied scene has a clear subject.",
  };
  for (const view of Object.values(r.expertViews))
    Object.assign(view, {
      summaryId: insights[0]?.id ?? "none",
      insightIds: insights.map((i) => i.id),
      practice: "",
    });
  return r;
}

for (const [name, observation, lesson, action] of [
  [
    "tower placement cannot establish compressed base shadows",
    "Church tower is placed slightly right of center and dominates vertically.",
    "The church tower's base and surrounding shadows feel compressed, limiting spatial depth.",
    "On a separate study, open the tower's base shadows and compare spatial depth.",
  ],
  [
    "visible warm colour cannot establish a perspective defect",
    "The church's warm ochre colour contrasts with the cool sky.",
    "The church perspective is inconsistent and weakens depth.",
    "Align the church perspective on a separate study.",
  ],
  [
    "general vehicle hierarchy cannot establish a road-value defect",
    "The vehicle's red focal shape stands apart from its muted surroundings.",
    "Road and foreground values are too uniform and flatten depth.",
    "On a separate study, compress the road values and compare depth.",
  ],
  [
    "an existing soft edge cannot establish insufficient softness",
    "Broad horizontal background bands have visible soft edges.",
    "Background edge softness supports the painting's calm mood.",
    "Soften the background edges further.",
  ],
  [
    "existing crisp contour cannot establish insufficient sharpness",
    "The boat has crisp contours against broad water passages.",
    "The boat contour is crisp and distinct.",
    "Sharpen the boat contour further.",
  ],
  [
    "existing muted colour cannot establish a need to reduce chroma",
    "The mountain has muted cool colour.",
    "The mountain's muted colour supports the atmosphere.",
    "Mute the mountain colour further.",
  ],
  [
    "existing saturation cannot establish a need for more saturation",
    "The boat has saturated red colour.",
    "Saturated boat colour separates the subject from water.",
    "Increase boat saturation further.",
  ],
  [
    "existing contrast cannot establish a need for more contrast",
    "The boat has high contrast against the water.",
    "Boat contrast establishes the focal shape.",
    "Increase the boat's contrast further.",
  ],
  [
    "existing dark mass cannot establish a need for darkening",
    "The boat is a dark value mass.",
    "The boat's dark value shape anchors the image.",
    "Darken the boat further.",
  ],
])
  test(`evidence alignment: ${name}`, () => {
    const f = fact("evidence", observation),
      i = advice("opportunity", [f.id], lesson, action);
    assert.equal(alignment.insightAlignment(i, [f]), "omit");
    assert.deepEqual(workspaceTeaching(result([f], [i])).recommendations, []);
  });

test("a matching supplied compressed-shadow fact can support the same local depth advice", () => {
  const f = fact(
    "base",
    "The compressed church base shadows obscure the lower structure and flatten spatial depth.",
  );
  const i = advice(
    "base-study",
    [f.id],
    "The church base shadows compress the lower structure and limit spatial depth.",
    "On a separate study, separate the church base shadow values; compare the depth of the lower structure.",
  );
  assert.equal(alignment.insightAlignment(i, [f]), "supported");
  assert.equal(
    workspaceTeaching(result([f], [i])).recommendations[0]?.insight.id,
    i.id,
  );
});
test("an explicitly competitive background edge supports selective softening", () => {
  const f = fact(
    "edge",
    "The sharp background mountain edge competes with the vehicle's focal contour.",
  );
  const i = advice(
    "edge-study",
    [f.id],
    "Mountain edge sharpness competes with the vehicle contour.",
    "On a separate study, soften selected mountain edges; compare the vehicle's focal separation.",
  );
  assert.equal(alignment.insightAlignment(i, [f]), "supported");
  assert.equal(
    workspaceTeaching(result([f], [i])).recommendations[0]?.insight.id,
    i.id,
  );
});
test("an already-soft passage permits an explicit comparison study without a defect claim", () => {
  const f = fact("soft", "Broad background bands have soft edges.");
  const i = advice(
    "variation",
    [f.id],
    "The soft background passages support a calm atmosphere.",
    "On a separate study, compare softer background edges with the current edges; judge which keeps the boat distinct.",
  );
  assert.equal(alignment.insightAlignment(i, [f]), "study");
  const t = workspaceTeaching(result([f], [i]));
  assert.deepEqual(t.recommendations, []);
  assert.equal(t.studies[0]?.classification, "study_experiment");
  assert(
    t.noteExcludedInsightIds.includes(i.id),
    "an old corrective marker cannot survive a study demotion",
  );
});
test("an unsupported explicit deficiency is omitted even when its action is framed as a study", () => {
  const f = fact("soft", "The background bands have soft edges.");
  const i = advice(
    "unfounded",
    [f.id],
    "The background edges are too sharp and flatten depth.",
    "On a separate study, compare softer background edges with current edges.",
  );
  assert.equal(alignment.insightAlignment(i, [f]), "omit");
});
test("a colour fact and a separate tower-placement fact cannot jointly manufacture perspective", () => {
  const facts = [
    fact("colour", "The sky's cool colour separates from warm architecture."),
    fact("position", "The church tower is slightly right of center."),
  ];
  const i = advice(
    "perspective",
    facts.map((f) => f.id),
    "The church tower's perspective is inconsistent.",
    "Align the tower perspective on a separate study.",
  );
  assert.equal(alignment.insightAlignment(i, facts), "omit");
});
test("a fact cannot borrow a different subject's edge deficiency across clauses", () => {
  const f = fact(
    "mixed",
    "The tower has clear middle values, while the mountain edge is overly sharp.",
  );
  const i = advice(
    "tower-edge",
    [f.id],
    "The tower edge is overly sharp and competes with the scene.",
    "Soften selected tower edges on a separate study.",
  );
  assert.equal(alignment.insightAlignment(i, [f]), "omit");
});
test("a fact cannot borrow an unrelated subject's drawing deficiency after a conjunction", () => {
  const f = fact(
    "mixed",
    "The boat has crisp contours and the church perspective is inconsistent.",
  );
  const i = advice(
    "boat-drawing",
    [f.id],
    "The boat perspective is inconsistent.",
    "Compare corrected boat perspective in a separate study.",
  );
  assert.equal(alignment.insightAlignment(i, [f]), "omit");
});
test("a uniform mid-tone road is descriptive rather than evidence of deficient lead-in", () => {
  const f = fact("road", "The road is a broad uniform mid-tone shape.");
  const i = advice(
    "road-change",
    [f.id],
    "The road is too uniform and weakens the lead-in.",
    "On a separate study, compare the road with reduced internal values.",
  );
  assert.equal(alignment.insightAlignment(i, [f]), "omit");
});
test("a successful dominant focal area is not automatically diagnosed as harm", () => {
  assert.equal(
    alignment.evidencedProblem(
      "The church tower dominates the vertical composition and establishes a clear focal hierarchy.",
    ),
    false,
  );
  assert.equal(
    alignment.evidencedProblem(
      "The vehicle is dominant against a quieter mountain.",
    ),
    false,
  );
  assert.equal(
    alignment.evidencedProblem(
      "No visible competition weakens the tower hierarchy.",
    ),
    false,
  );
});
test("intentional compressed background values are not automatically a problem", () => {
  assert.equal(
    alignment.evidencedProblem(
      "Compressed mountain middle values preserve atmospheric recession behind the vehicle.",
    ),
    false,
  );
});

const wires = fact(
  "wires",
  "Sharp wires crossing the upper tower silhouette compete with the focal tower's contour.",
);
const wireA = advice(
  "wire-general",
  [wires.id],
  "Some wires compete with the focal tower.",
  "Simplify some wires to reduce competition with the tower.",
);
const wireB = advice(
  "wire-specific",
  [wires.id],
  "Sharp wires crossing the upper tower silhouette compete with the focal tower's contour.",
  "On a separate study, soften only selected wire edges crossing the upper tower silhouette; compare its focal separation.",
);
test("same-target same-effect wire simplification and softening count as one teaching", () => {
  assert(alignment.sameTeaching(wireA, wireB));
  const r = result([wires], [wireB, wireA]),
    before = structuredClone(r);
  const t = workspaceTeaching(r);
  assert.deepEqual(
    t.recommendations.map((r) => r.insight.id),
    [wireB.id],
  );
  assert(t.omittedInsightIds.includes(wireA.id));
  assert(t.noteExcludedInsightIds.includes(wireA.id));
  assert.deepEqual(
    r,
    before,
    "deduplication cannot rewrite canonical facts, roles or geometry",
  );
});
test("more specific duplicate wire guidance wins even when provider supplied it second", () => {
  const t = workspaceTeaching(result([wires], [wireA, wireB]));
  assert.deepEqual(
    t.recommendations.map((r) => r.insight.id),
    [wireB.id],
  );
});
test("wire-count noise and wire-edge hierarchy are distinct supplied mechanisms and effects", () => {
  const noiseFact = fact(
    "wire-count",
    "Excess wire count makes the upper sky noisy.",
  );
  const noise = advice(
    "wire-noise",
    [noiseFact.id],
    "Excess wire count makes the upper sky noisy.",
    "On a separate study, reduce wire count in the upper sky; compare visual noise.",
  );
  assert.equal(alignment.sameTeaching(noise, wireB), false);
  assert.equal(
    workspaceTeaching(result([noiseFact, wires], [noise, wireB]))
      .recommendations.length,
    2,
  );
});
test("wire-edge guidance and an independent foreground balance adjustment both survive", () => {
  const f = fact(
    "foreground",
    "The large foreground shadow has excessive visual weight and unbalances the scene.",
  );
  const i = advice(
    "foreground-balance",
    [f.id],
    "The foreground shadow's visual weight unbalances the scene.",
    "On a separate study, reduce the foreground shadow mass; compare balance.",
  );
  assert.equal(alignment.sameTeaching(wireB, i), false);
  assert.equal(
    workspaceTeaching(result([wires, f], [wireB, i])).recommendations.length,
    2,
  );
});

const bandFact = fact(
  "bands",
  "Broad horizontal water bands frame an off-center boat with a calm rhythm.",
);
const bandStrength = advice(
  "bands-a",
  [bandFact.id],
  "Horizontal water bands and boat placement create a calm rhythm.",
  "Preserve the calm spacing between water bands and boat.",
  { classification: "strength" },
);
const bandParaphrase = advice(
  "bands-b",
  [bandFact.id],
  "The boat placement and horizontal water bands establish a calm rhythm.",
  "Keep the calm rhythm of horizontal bands around the boat.",
  { classification: "strength" },
);
test("What Works collapses paraphrases of the same band-and-boat teaching", () => {
  assert(alignment.sameTeaching(bandStrength, bandParaphrase, true));
  const t = workspaceTeaching(
    result([bandFact], [bandStrength, bandParaphrase]),
  );
  assert.equal(t.strengths.length, 1);
  assert(t.omittedInsightIds.includes(bandParaphrase.id));
});
test("distinct warm-cool colour teaching survives beside the band-and-placement strength", () => {
  const f = fact("colour", "A muted warm boat separates from cool blue water.");
  const i = advice(
    "colour-strength",
    [f.id],
    "The muted warm boat and cool water create temperature separation.",
    "Preserve the warm boat against cooler water.",
    { classification: "strength" },
  );
  assert.equal(alignment.sameTeaching(bandStrength, i, true), false);
  assert.equal(
    workspaceTeaching(result([bandFact, f], [bandStrength, bandParaphrase, i]))
      .strengths.length,
    2,
  );
});

for (const action of [
  "Introduce more value contrast in the road and foreground to enhance depth.",
  "Raise road contrast to strengthen the lead-in.",
  "Strengthen the street contrast for a stronger lead-in.",
  "Boost path chroma to guide the eye.",
  "Enhance the center-line visibility.",
  "Heighten contrast along the road.",
  "Accentuate the road edge.",
  "Intensify road contrast.",
  "Make the path stronger.",
  "Make the road darker.",
  "Make the street sharper.",
  "Make the path more saturated.",
  "Reinforce the directional edge.",
])
  test(`broad road amplification needs location, taper and focal limit: ${action}`, () => {
    assert(
      calibration.unsafeHierarchyAdvice(
        action,
        "The road leads toward the focal vehicle.",
      ),
    );
  });
test("a restrained near-foreground road cue with taper and focal hierarchy survives", () => {
  const f = fact(
    "road",
    "The near foreground road cue lacks value separation, while the distant path stays quiet below the focal vehicle contrast.",
  );
  const i = advice(
    "road-qualified",
    [f.id],
    "The near foreground road cue lacks value separation.",
    "On a separate study, introduce more value contrast only in the near foreground road cue, taper contrast toward the distance, and keep it below the focal vehicle contrast. Compare the lead-in.",
  );
  assert.equal(
    calibration.unsafeHierarchyAdvice(i.action, f.observation),
    false,
  );
  assert.equal(alignment.insightAlignment(i, [f]), "supported");
  assert.equal(
    workspaceTeaching(result([f], [i])).recommendations[0]?.insight.id,
    i.id,
  );
});
test("foreground localisation alone does not authorize road amplification", () => {
  assert(
    calibration.unsafeHierarchyAdvice(
      "Introduce more contrast only in the foreground road.",
      "The road has a weak lead-in.",
    ),
  );
});
test("road taper without a subordinate focal limit is still insufficient", () => {
  assert(
    calibration.unsafeHierarchyAdvice(
      "Strengthen the near road cue, then fade it toward the distance.",
      "The road has a weak lead-in.",
    ),
  );
});
test("a focal hierarchy limit without recession taper is still insufficient", () => {
  assert(
    calibration.unsafeHierarchyAdvice(
      "Increase contrast in the near foreground road, keeping it below focal contrast.",
      "The road has a weak lead-in.",
    ),
  );
});

test("a chroma problem cannot authorize an opposite edge correction in the same fact", () => {
  const facts = [
    {
      id: "f",
      domain: "technique",
      roleId: null,
      observation: "The boat is overly saturated with soft edges.",
    },
  ];
  const i = {
    id: "i",
    domain: "technique",
    classification: "optional_refinement",
    factIds: ["f"],
    lesson: "The boat edges are too sharp and weaken its spatial integration.",
    action: "Soften the boat contours in a separate study.",
  };
  assert.equal(alignment.insightAlignment(i, facts), "omit");
});
