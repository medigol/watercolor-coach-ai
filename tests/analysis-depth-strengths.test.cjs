const test = require("node:test");
const assert = require("node:assert/strict");
const { loadShared } = require("./helpers/shared-loader.cjs");
const fixture = require("./helpers/canonical-fixture.cjs");
const draftFixture = require("./helpers/provider-draft-fixture.cjs");
const { workspaceTeaching } = loadShared(
  "../shared/coachingWorkspace.ts",
  "lib/overlays.ts",
);
const { hierarchySafePreservation, unsafeHierarchyAdvice } = loadShared(
  "../shared/coachingCalibration.ts",
  "lib/overlays.ts",
);
const { normalizeProviderPaintingAnalysis } = loadShared(
  "../shared/providerPaintingAnalysis.ts",
  "lib/overlays.ts",
);
const { cleanPaintingAnalysis, validPaintingAnalysis } = loadShared(
  "../shared/paintingAnalysis.ts",
  "lib/overlays.ts",
);

function withStrength(action, lesson, observation) {
  const value = fixture();
  value.canonicalAnalysis.insights = [
    {
      id: "relationship",
      domain: "composition",
      classification: "strength",
      factIds: ["path"],
      lesson,
      action,
    },
  ];
  value.canonicalAnalysis.facts = [
    { id: "path", domain: "composition", observation, roleId: null },
  ];
  return value;
}
const roadLesson =
  "The road curve leads toward the focal van without becoming a competing accent.";
const roadFact =
  "The foreground road follows a broad curve toward the focal van; its contrast fades with distance.";

test("road strength loses coordinated contrast emphasis but retains its supplied curve", () => {
  const value = withStrength(
    "Preserve and slightly emphasize road curve contrast to strengthen visual flow.",
    roadLesson,
    roadFact,
  );
  const before = structuredClone(value);
  const teaching = workspaceTeaching(value);
  assert.equal(teaching.strengths.length, 1);
  const strength = teaching.strengths[0];
  assert.equal(strength.classification, "strength");
  assert.equal(strength.lesson, roadLesson);
  assert.match(strength.action, /^Preserve road curve\./);
  assert.doesNotMatch(strength.action, /emphasi[sz]|contrast|strengthen/i);
  assert.deepEqual(teaching.recommendations, []);
  assert.deepEqual(value, before);
});

for (const action of [
  "Preserve the road curve and slightly emphasize its contrast.",
  "Keep the road direction; increase contrast along the path.",
  "Retain the road's curve. Strengthen road chroma to enhance the lead-in.",
])
  test(`separate unsafe amplification is removed while supplied road teaching remains: ${action}`, () => {
    const strength = workspaceTeaching(
      withStrength(action, roadLesson, roadFact),
    ).strengths[0];
    assert(strength);
    assert.match(
      strength.action,
      /(?:preserve|keep|retain).*road.*(?:curve|direction)/i,
    );
    assert.doesNotMatch(
      strength.action,
      /emphasi[sz]|increase|strengthen|chroma/i,
    );
    assert.equal(strength.classification, "strength");
  });

test("unsafe road-only amplification can lose the action without losing the factual strength", () => {
  const strength = workspaceTeaching(
    withStrength(
      "Preserve and slightly emphasize road contrast to strengthen visual flow.",
      roadLesson,
      roadFact,
    ),
  ).strengths[0];
  assert(strength);
  assert.equal(strength.action, "");
  assert.equal(strength.lesson, roadLesson);
});

for (const action of [
  "Preserve the road curve toward the focal van.",
  "Keep the path direction subordinate to the van.",
  "Retain the curve of the street and the quieter distant path.",
])
  test(`existing curve/direction preservation remains unchanged: ${action}`, () => {
    assert.equal(hierarchySafePreservation(action, roadLesson), action);
  });

test("preserving a road curve does not gain an unsafe contrast claim from a purpose clause", () => {
  const action = "Preserve the road curve to strengthen visual flow.";
  assert.equal(
    hierarchySafePreservation(action, roadLesson),
    "Preserve the road curve.",
  );
});

test("fully qualified foreground emphasis retains location, taper and focal limit", () => {
  const action =
    "Preserve and slightly emphasize only the near foreground road cue, taper its contrast toward the distance, and keep it below focal contrast.";
  assert.equal(unsafeHierarchyAdvice(action, roadLesson), false);
  const strength = workspaceTeaching(withStrength(action, roadLesson, roadFact))
    .strengths[0];
  assert(strength);
  assert.equal(strength.action, action);
});

for (const action of [
  "Preserve and slightly emphasize only the foreground road contrast.",
  "Preserve and emphasize the near road contrast, tapering it toward the distance.",
  "Preserve and emphasize the foreground road contrast, keeping it below focal contrast.",
])
  test(`partial road qualification cannot authorize emphasis: ${action}`, () => {
    assert(unsafeHierarchyAdvice(action, roadLesson));
    const strength = workspaceTeaching(
      withStrength(action, roadLesson, roadFact),
    ).strengths[0];
    assert(strength);
    assert.equal(strength.action, "");
  });

test("British emphasis spelling is guarded equally", () => {
  assert(
    unsafeHierarchyAdvice(
      "Preserve and slightly emphasise road curve contrast.",
      roadLesson,
    ),
  );
  assert.equal(
    hierarchySafePreservation(
      "Preserve and slightly emphasise road curve contrast.",
      roadLesson,
    ),
    "Preserve road curve.",
  );
});

test("unsafe atmospheric background emphasis preserves the supplied visible softness only", () => {
  const value = withStrength(
    "Preserve the soft mountain contours and emphasize mountain contrast for atmospheric depth.",
    "Soft mountain contours recede behind the crisp focal vehicle.",
    "Soft mountain contours contrast with the crisp van edge, establishing atmospheric depth.",
  );
  const strength = workspaceTeaching(value).strengths[0];
  assert(strength);
  assert.equal(strength.action, "Preserve the soft mountain contours.");
  assert.doesNotMatch(strength.action, /emphasi[sz]|contrast/i);
  assert.equal(strength.classification, "strength");
});

test("unqualified background-only emphasis is omitted without creating replacement advice", () => {
  const strength = workspaceTeaching(
    withStrength(
      "Preserve and emphasize background contrast for atmospheric depth.",
      "Soft background contours establish atmospheric recession behind the focal van.",
      "The distant mountain has soft contours behind the crisp focal van.",
    ),
  ).strengths[0];
  assert(strength);
  assert.equal(strength.action, "");
});

test("legitimate focal/background preservation is not treated as background amplification", () => {
  const action =
    "Preserve the stronger focal van contrast against the softer background mountain.";
  assert.equal(unsafeHierarchyAdvice(action, "The mountain recedes."), false);
  assert.equal(
    hierarchySafePreservation(action, "The mountain recedes."),
    action,
  );
  assert.equal(
    workspaceTeaching(
      withStrength(
        action,
        "The focal van remains sharper than the distant mountain, preserving depth.",
        "The van's crisp contour contrasts with softer mountain edges.",
      ),
    ).strengths[0]?.action,
    action,
  );
});

test("hierarchy-qualified atmospheric emphasis may remain below focal contrast", () => {
  const action =
    "Preserve and slightly emphasize selected mountain contours for depth, keeping them below focal contrast.";
  assert.equal(unsafeHierarchyAdvice(action, "The van remains focal."), false);
  assert.equal(
    hierarchySafePreservation(action, "The van remains focal."),
    action,
  );
});

test("central placement is not preserved as a universal formula beside valid hierarchy", () => {
  const value = withStrength(
    "Preserve central placement and the value separation between the van and background.",
    "The van's value separation keeps it readable against the broad background.",
    "The van is separated from the background by its lighter value.",
  );
  const strength = workspaceTeaching(value).strengths[0];
  assert(strength);
  assert.doesNotMatch(strength.action, /central placement/i);
  assert.match(
    strength.action,
    /value separation between the van and background/i,
  );
});

test("observation, effect and transferable preservation remain a strength without correction", () => {
  const value = withStrength(
    "Preserve the broad road direction while keeping its contrast below the focal van.",
    "The road curve links the lower foreground to the van. Its quieter contrast guides attention without creating a second focal point, so the directional relationship stays readable as distance increases.",
    roadFact,
  );
  const teaching = workspaceTeaching(value);
  assert.equal(teaching.strengths.length, 1);
  assert.equal(
    teaching.strengths[0].lesson,
    value.canonicalAnalysis.insights[0].lesson,
  );
  assert.equal(
    teaching.strengths[0].action,
    value.canonicalAnalysis.insights[0].action,
  );
  assert.deepEqual(teaching.recommendations, []);
});

test("deeper paraphrases of the same strength remain deduplicated", () => {
  const value = withStrength(
    "Preserve the road curve toward the van.",
    "The road curve guides attention toward the focal van. Its quiet edge gives direction without competing with the vehicle.",
    roadFact,
  );
  value.canonicalAnalysis.insights.push({
    ...value.canonicalAnalysis.insights[0],
    id: "relationship-copy",
    lesson:
      "The road curve leads attention toward the focal van. Its quieter edges guide the eye without competing with the vehicle.",
  });
  const teaching = workspaceTeaching(value);
  assert.equal(teaching.strengths.length, 1);
  assert(teaching.omittedInsightIds.includes("relationship-copy"));
});

test("shared background/depth wording does not collapse distinct colour and value principles", () => {
  const value = withStrength(
    "Preserve the warm focal colour against the cool background.",
    "Cool background colour supports depth. Warm focal accents concentrate chroma near the tower.",
    "Warm focal accents stand apart from the cooler background colour. Connected background middle values stay below focal darks.",
  );
  value.canonicalAnalysis.insights.push({
    ...value.canonicalAnalysis.insights[0],
    id: "value-relationship",
    lesson:
      "Cool background values support depth. Connected middle tones keep internal contrast below focal darks.",
    action: "Preserve the connected background values below focal darks.",
  });
  const teaching = workspaceTeaching(value);
  assert.equal(teaching.strengths.length, 2);
  assert.deepEqual(
    teaching.strengths.map((s) => s.id),
    ["relationship", "value-relationship"],
  );
});

test("minor aligned clear issue becomes an optional display refinement without material card copy", () => {
  const value = fixture();
  value.canonicalAnalysis.qualityAssessment = {
    level: "competent",
    confidence: 0.9,
    rationale:
      "The tower's reserved light establishes clear focal hierarchy. Connected shadow shapes and quieter surrounding values give the scene coherent depth.",
  };
  value.canonicalAnalysis.facts.push({
    id: "minor-wire-fact",
    domain: "composition",
    observation:
      "A few tiny wire edges slightly compete with the tower silhouette, a minor local interruption.",
    roleId: null,
  });
  value.canonicalAnalysis.insights.push({
    id: "minor-wire",
    domain: "composition",
    classification: "clear_issue",
    factIds: ["minor-wire-fact"],
    lesson:
      "A few tiny wire edges slightly compete with the tower silhouette, a minor local interruption.",
    action:
      "On a separate study, soften only those few wire edges near the tower; compare its silhouette while leaving the large value pattern unchanged.",
  });
  const before = structuredClone(value);
  const teaching = workspaceTeaching(value);
  assert.equal(teaching.assessment.level, "strong");
  assert.match(teaching.status, /^No major issue detected/);
  assert.equal(teaching.clear.length, 0);
  assert.equal(teaching.recommendations.length, 1);
  assert.equal(
    teaching.recommendations[0].insight.classification,
    "optional_refinement",
  );
  assert.equal(teaching.recommendations[0].label, "Optional refinement");
  assert(teaching.noteExcludedInsightIds.includes("minor-wire"));
  assert.deepEqual(value, before);
});

for (const [action, expected] of [
  [
    "Preserve and slightly emphasize road curve contrast to strengthen visual flow.",
    "Preserve road curve.",
  ],
  [
    "Keep the road direction; increase contrast along the path.",
    "Keep the road direction.",
  ],
  ["Increase road contrast to strengthen visual flow.", ""],
])
  test(`provider draft through canonical clean retains factual strength and only safe preservation: ${action}`, () => {
    const raw = draftFixture();
    raw.visualRoles[1].area = "road";
    raw.composition.facts[0].observation = roadFact;
    Object.assign(raw.composition.insights[0], {
      classification: "strength",
      lesson: roadLesson,
      action,
    });
    const before = structuredClone(raw);
    const normalized = normalizeProviderPaintingAnalysis(raw);
    assert(normalized.ok, JSON.stringify(normalized));
    const value = cleanPaintingAnalysis(normalized.result, () => []);
    assert(validPaintingAnalysis(value));
    const canonical = value.canonicalAnalysis.insights.find(
      (i) => i.id === "insight_composition_1",
    );
    assert(canonical);
    assert.equal(canonical.classification, "strength");
    assert.equal(canonical.lesson, roadLesson);
    assert(canonical.action.length > 0, "v1 required core action stays valid");
    const teaching = workspaceTeaching(value);
    const strength = teaching.strengths.find((i) => i.id === canonical.id);
    assert(strength);
    assert.equal(strength.action, expected);
    assert.equal(strength.lesson, roadLesson);
    assert.equal(strength.classification, "strength");
    assert(!teaching.studies.some((i) => i.id === canonical.id));
    assert.deepEqual(raw, before);
  });

test("extra domain strengths expose the same sanitized preservation projection", () => {
  const value = fixture();
  Object.assign(value.canonicalAnalysis.insights[3], {
    lesson:
      "Soft mountain contours create atmospheric depth behind the crisp focal tower.",
    action:
      "Preserve the soft mountain contours and emphasize mountain contrast for atmospheric depth.",
  });
  const teaching = workspaceTeaching(value);
  const extra = teaching.preservationInsights.find((i) => i.id === "handling");
  assert(extra);
  assert.equal(extra.action, "Preserve the soft mountain contours.");
  assert(!teaching.omittedInsightIds.includes("handling"));
});

test("extra domain preservation projection also avoids central-placement dogma", () => {
  const value = fixture();
  value.canonicalAnalysis.insights[3].action = "Preserve central placement.";
  const teaching = workspaceTeaching(value);
  const extra = teaching.preservationInsights.find((i) => i.id === "handling");
  assert(extra);
  assert.doesNotMatch(extra.action, /central placement/i);
  assert.match(
    extra.action,
    /Soft distant transitions contrast with one crisp tower corner/,
  );
});

for (const verb of ["increase", "sharpen", "darken"])
  test(`qualified road guidance stays canonical while Strength displays preservation only: ${verb}`, () => {
    const action = `Preserve the road curve and ${verb} only the near foreground road contrast; taper its contrast toward the distance and keep it below focal contrast.`;
    const raw = draftFixture();
    raw.visualRoles[1].area = "road";
    raw.composition.facts[0].observation = roadFact;
    Object.assign(raw.composition.insights[0], {
      classification: "strength",
      lesson: roadLesson,
      action,
    });
    const normalized = normalizeProviderPaintingAnalysis(raw);
    assert(normalized.ok);
    const value = cleanPaintingAnalysis(normalized.result, () => []);
    assert(validPaintingAnalysis(value));
    const insight = value.canonicalAnalysis.insights.find(
      (i) => i.id === "insight_composition_1",
    );
    assert.equal(insight.classification, "strength");
    assert.equal(insight.action, action);
    const teaching = workspaceTeaching(value);
    const strength = teaching.strengths.find((i) => i.id === insight.id);
    assert(strength);
    assert.equal(strength.action, "Preserve the road curve.");
  });

test("a false below-focal qualifier does not permit a competing road focal point", () => {
  const raw = draftFixture();
  raw.visualRoles[1].area = "road";
  raw.composition.facts[0].observation = roadFact;
  Object.assign(raw.composition.insights[0], {
    classification: "strength",
    lesson: roadLesson,
    action:
      "Keep road curve and sharpen near foreground road into an equal focal point; taper toward distance and keep below focal contrast.",
  });
  const normalized = normalizeProviderPaintingAnalysis(raw);
  assert(normalized.ok);
  const value = cleanPaintingAnalysis(normalized.result, () => []);
  assert(validPaintingAnalysis(value));
  const insight = value.canonicalAnalysis.insights.find(
    (i) => i.id === "insight_composition_1",
  );
  assert.notEqual(insight.classification, "strength");
  assert(!workspaceTeaching(value).strengths.some((i) => i.id === insight.id));
});

test("a canonical Quiet road cannot use the supporting-cue preservation exception", () => {
  const raw = draftFixture();
  raw.visualRoles[1].area = "road";
  raw.visualRoles[1].role = "quiet";
  raw.composition.facts[0].observation = roadFact;
  Object.assign(raw.composition.insights[0], {
    classification: "strength",
    lesson: roadLesson,
    action:
      "Preserve the road curve and sharpen only the near foreground road contrast; taper its contrast toward the distance and keep it below focal contrast.",
  });
  const normalized = normalizeProviderPaintingAnalysis(raw);
  assert(normalized.ok);
  const value = cleanPaintingAnalysis(normalized.result, () => []);
  assert(validPaintingAnalysis(value));
  const insight = value.canonicalAnalysis.insights.find(
    (i) => i.id === "insight_composition_1",
  );
  assert.notEqual(insight.classification, "strength");
});
