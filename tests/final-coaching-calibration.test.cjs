const test = require("node:test"),
  assert = require("node:assert/strict");
const { loadShared } = require("./helpers/shared-loader.cjs");
const fixture = require("./helpers/canonical-fixture.cjs");
const workspace = loadShared(
  "../shared/coachingWorkspace.ts",
  "lib/overlays.ts",
);
const calibration = loadShared(
  "../shared/coachingCalibration.ts",
  "lib/overlays.ts",
);
const evidence = loadShared("../shared/coachingEvidence.ts", "lib/overlays.ts");
const language = loadShared("../shared/coachingLanguage.ts", "lib/overlays.ts");
const painting = loadShared("../shared/paintingAnalysis.ts", "lib/overlays.ts");
function advice(
  id,
  action,
  lesson = "The mountain's internal contrast affects atmospheric recession.",
  patch = {},
) {
  return {
    id,
    domain: "overall",
    classification: "optional_refinement",
    factIds: ["hierarchy"],
    lesson,
    action,
    ...patch,
  };
}
function result(items, level = "competent") {
  const r = fixture();
  r.canonicalAnalysis.qualityAssessment.level = level;
  const suppliedEvidence = {
    road: "The foreground road's value cue is weak and lacks a clear lead-in toward the focal subject.",
    integration:
      "Disconnected horizontal water bands isolate the boat's reflection, weakening spatial integration.",
    "boat-value":
      "The boat's weak value contrast with the water causes its focal contours to merge unintentionally.",
    "boat-edge":
      "The boat's weak value contrast with the water causes its focal contours to merge unintentionally.",
    "boat-drawing":
      "The boat's deck contour has inconsistent perspective alignment, weakening its plane relationship.",
  };
  for (const item of items) {
    const observation = suppliedEvidence[item.id];
    if (observation) {
      const id = `supplied-${item.id}`;
      r.canonicalAnalysis.facts.push({
        id,
        domain: item.domain,
        observation,
        roleId: null,
      });
      r.canonicalAnalysis.insights.push({ ...item, factIds: [id] });
    } else r.canonicalAnalysis.insights.push(item);
  }
  r.expertViews.overall.summaryId = items[0]?.id ?? "whole";
  r.expertViews.overall.insightIds = [r.expertViews.overall.summaryId];
  return r;
}
for (const action of [
  "Darken the distant mountain shadows to improve recession.",
  "Increase contrast in the background mountain for atmospheric depth.",
  "Add darker values to mountain shadows to improve atmospheric recession.",
  "Sharpen the background edges to increase depth.",
  "Make the distant mountain more saturated to improve depth.",
])
  test(`unsafe distant amplification is not promoted: ${action}`, () => {
    const i = advice("unsafe", action),
      r = result([i]);
    const before = structuredClone(r),
      t = workspace.workspaceTeaching(r);
    assert.deepEqual(t.recommendations, []);
    assert.deepEqual(t.studies, []);
    assert(t.omittedInsightIds.includes("unsafe"));
    assert.deepEqual(r, before);
  });
for (const [action, observation] of [
  [
    "On a separate study, darken selected mountain shadows, keeping them below focal contrast with soft atmospheric edges. Compare recession.",
    "Selected mountain shadows at the lower boundary merge and lack value separation while remaining below focal contrast.",
  ],
  [
    "On a separate study, compress the mountain's internal values; compare its depth behind the focal vehicle.",
    "Internal mountain darks compete with focal vehicle contrast and limit atmospheric recession.",
  ],
  [
    "On a separate study, retain the dark background silhouette and soften internal edges; compare depth.",
    "Sharp internal background edges flatten recession beneath the dark background silhouette.",
  ],
])
  test(`qualified/non-formulaic background guidance remains: ${action}`, () => {
    const r = result([advice("safe", action)]);
    r.canonicalAnalysis.facts.push({
      id: "mountain-evidence",
      domain: "overall",
      observation,
      roleId: null,
    });
    r.canonicalAnalysis.insights.at(-1).factIds = ["mountain-evidence"];
    assert.equal(
      workspace.workspaceTeaching(r).recommendations[0]?.insight.id,
      "safe",
    );
  });
test("focal strengthening is not mistaken for background darkening merely because the lesson mentions a mountain", () => {
  assert.equal(
    calibration.unsafeHierarchyAdvice(
      "Darken the van slightly.",
      "The mountain's recession makes the focal van readable.",
    ),
    false,
  );
});
const road = advice(
  "road",
  "Increase contrast along the road and centre line.",
  "The road could guide the eye more strongly.",
);
const relational = advice(
  "integration",
  "On scrap, connect adjacent water-band values near the boat's reflection; compare spatial integration.",
  "The independent horizontal bands separate the boat from its surrounding water.",
);
test("generic road strengthening cannot outrank a supplied specific relationship", () => {
  const t = workspace.workspaceTeaching(result([road, relational]));
  assert.deepEqual(
    t.recommendations.map((r) => r.insight.id),
    ["integration"],
  );
});
test("located foreground road cue with taper and focal limit is allowed", () => {
  const action =
    "On a separate study, strengthen only the nearer foreground road cue, taper its contrast toward the distance, and keep it below focal contrast. Compare the lead-in.";
  assert.equal(calibration.unsafeHierarchyAdvice(action, road.lesson), false);
});
test("a foreground road cue without taper or hierarchy is insufficient", () => {
  assert(
    calibration.unsafeHierarchyAdvice(
      "Increase contrast on the foreground road.",
      road.lesson,
    ),
  );
});
const focal1 = advice(
  "boat-value",
  "Increase boat/background value contrast for stronger focal impact.",
  "A darker boat would increase focal dominance.",
);
const focal2 = advice(
  "boat-edge",
  "Make the boat darker and sharper to strengthen its focal impact.",
  "Crisper boat edges would draw attention to the focal boat.",
);
test("same boat/same focal effect is deduplicated across value and edge mechanisms", () => {
  const t = workspace.workspaceTeaching(result([focal1, focal2]));
  assert.equal(t.recommendations.length, 1);
  assert.equal(t.recommendations[0].insight.id, "boat-value");
});
test("supplied spatial integration outranks repeated isolated focal amplification", () => {
  const t = workspace.workspaceTeaching(result([focal1, focal2, relational]));
  assert.deepEqual(
    t.recommendations.map((r) => r.insight.id),
    ["integration", "boat-value"],
  );
});
test("duplicate removal does not invent a replacement critique or change canonical facts", () => {
  const r = result([focal1, focal2]),
    before = structuredClone(r);
  const t = workspace.workspaceTeaching(r);
  assert.equal(t.recommendations.length, 1);
  assert.deepEqual(r, before);
  assert(
    t.recommendations.every(({ insight }) =>
      before.canonicalAnalysis.insights.some(
        (i) =>
          i.id === insight.id &&
          i.lesson === insight.lesson &&
          i.action === insight.action,
      ),
    ),
  );
});
test("same target with distinct mechanisms and genuinely different effects can survive", () => {
  const drawing = advice(
    "boat-drawing",
    "On scrap, clarify the boat's upper contour to describe the deck angle; compare its perspective alignment.",
    "The deck contour loses the boat's plane relationship.",
    { domain: "technique" },
  );
  const t = workspace.workspaceTeaching(result([focal1, drawing]));
  assert.equal(t.recommendations.length, 2);
});
test("independent focal subjects are not merged merely because both actions mention focal impact", () => {
  assert.equal(
    calibration.sameFocalRecommendation(
      focal1,
      advice(
        "vehicle",
        "Darken the van for stronger focal impact.",
        "The vehicle would have more focal dominance.",
      ),
    ),
    false,
  );
});
for (const [strength, action] of [
  [
    "Cool church shadows support the warm church light.",
    "Warm the church shadows to unify the palette.",
  ],
  [
    "The cool background separates the warm focal tower.",
    "Make the background warmer for palette unity.",
  ],
  [
    "Warm tower light separates from the cool water.",
    "Cool the tower light to harmonise the palette.",
  ],
  [
    "The church shadows are cool.",
    "Add warmth to the church shadows for unity.",
  ],
])
  test(`successful temperature is not casually reversed: ${action}`, () => {
    assert(evidence.conflictsWithStrength(action, [strength]));
  });
test("an arbitrary study prefix is not evidence for reversing cool shadows", () => {
  assert(
    evidence.conflictsWithStrength(
      "On a separate study, compare warmer church shadows for palette unity.",
      ["Cool church shadows support warm light."],
    ),
  );
});
const reflectionAction =
  "On a separate study, test reflected warmth at the lower shadow edge; compare the small accent while preserving the cool shadow hierarchy.";
test("explicit scoped reflected-warmth experiment remains when local reflection is observed", () => {
  assert.equal(
    evidence.temperatureConflict(
      reflectionAction,
      ["Cool church shadows support warm light."],
      ["Reflected warmth is visible at the lower shadow edge."],
    ),
    false,
  );
});
test("opposite-temperature change is still rejected in a reflected-warmth study without supplied reflection evidence", () => {
  const action =
    "On a separate study, make the church shadows warmer with reflected warmth at the lower edge; compare while keeping the cool shadow hierarchy.";
  assert(
    evidence.temperatureConflict(
      action,
      ["Cool church shadows support warm light."],
      [],
    ),
  );
  assert.equal(
    evidence.temperatureConflict(
      action,
      ["Cool church shadows support warm light."],
      ["Reflected warmth is visible at the lower shadow edge."],
    ),
    false,
  );
});
test("different explicit temperature subregions remain distinct", () => {
  assert.equal(
    evidence.temperatureConflict("Warm the lower shadows.", [
      "Cool upper shadows support the warm light.",
    ]),
    false,
  );
});
test("temperature conflict is also suppressed when reopening a legacy canonical result", () => {
  const i = advice(
    "warm",
    "Warm the water to unify the palette.",
    "A warmer water passage could unify the scene.",
    { factIds: ["colour"] },
  );
  const t = workspace.workspaceTeaching(result([i], "strong"));
  assert.deepEqual(t.recommendations, []);
  assert(t.omittedInsightIds.includes("warm"));
});
for (const [input, expected] of [
  [
    "Broad, loose horizontal washes form the water bands.",
    "Broad horizontal colour bands form the water bands.",
  ],
  [
    "The water has broad, loose horizontal washes with soft transitions.",
    "The water has broad horizontal colour bands with soft transitions.",
  ],
  [
    "Controlled brush strokes define the boat.",
    "Visible marks define the boat.",
  ],
  [
    "More controlled brush strokes could improve the boat's contours.",
    "Visible marks could improve the boat's contours.",
  ],
  [
    "The boat has darker, sharper contours against broad horizontal colour bands and soft transitions.",
    "The boat has darker, sharper contours against broad horizontal colour bands and soft transitions.",
  ],
])
  test(`process wording retains only supplied visible effects: ${input}`, () => {
    const actual = evidence.observationText(input);
    assert.equal(actual, expected);
    assert(!/controlled brush\s*strokes|loose horizontal washes/i.test(actual));
  });
test("suggested controlled brush/wash reproduction exercise stays allowed", () => {
  const text =
    "On scrap watercolor paper, test controlled brush strokes in two wash studies; compare edge clarity.";
  assert.equal(evidence.observationText(text), text);
});
test("quality rationale omits a standalone optional foreground-shadow critique", () => {
  assert.equal(
    language.qualityRationaleText(
      "Clear value organisation gives the architecture depth. The foreground-shadow gradation could be softer.",
    ),
    "Clear value organisation gives the architecture depth.",
  );
});
test("purposeful figure future study remains available with a scale/flow purpose", () => {
  const i = advice(
    "figures",
    "On a separate study, compare one tiny low-contrast figure at the lower-left approach with no figures; keep it subordinate to the tower for human scale.",
    "The open approach allows a small scale cue.",
    { domain: "composition", factIds: ["path"] },
  );
  const t = workspace.workspaceTeaching(result([i], "strong"));
  assert(t.studies.some((s) => s.id === "figures"));
  assert(!t.recommendations.some((r) => r.insight.id === "figures"));
});
test("central placement remains valid and What works remains exercise-free", () => {
  const r = result([], "strong");
  r.canonicalAnalysis.insights[0].action =
    "Preserve the focal value separation and central placement.";
  const t = workspace.workspaceTeaching(r);
  assert.equal(t.recommendations.length, 0);
  assert.equal(t.strengths[0].action, "Preserve the focal value separation.");
  assert(
    !t.strengths.some(
      (s) =>
        language.exerciseTeaching(s.lesson) ||
        language.exerciseTeaching(s.action),
    ),
  );
});
test("calibration leaves canonical roles/Composition Lock identical across four views", () => {
  const r = result([focal1, focal2]);
  const before = structuredClone(r.canonicalAnalysis);
  workspace.workspaceTeaching(r);
  for (const focus of ["overall", "composition", "colourValue", "technique"]) {
    const projected = painting.projectPaintingAnalysis(r, focus);
    assert.deepEqual(
      projected.coachingDecision.visualRoles,
      before.visualRoles.map(({ area, role }) => ({ area, role })),
    );
    assert.deepEqual(projected.compositionOverlay, before.composition.primary);
  }
});

test("current background subordination alone is not permission for unbounded darkening", () => {
  assert(
    calibration.unsafeHierarchyAdvice(
      "Darken the mountain shadows to improve recession.",
      "The mountain currently sits below focal contrast.",
    ),
  );
});
test("an explicit supplied limit on the proposed change can qualify depth advice", () => {
  assert.equal(
    calibration.unsafeHierarchyAdvice(
      "On scrap, darken selected mountain shadows and compare recession.",
      "Keep the proposed change subordinate to focal contrast with soft atmospheric edges.",
    ),
    false,
  );
});
test("a different focal target against the same background is not suppressed or deduplicated", () => {
  assert.equal(
    calibration.unsafeHierarchyAdvice(
      "Darken the van against the distant mountain.",
      "The mountain establishes depth.",
    ),
    false,
  );
  assert.equal(
    calibration.sameFocalRecommendation(
      advice(
        "boat",
        "Darken the boat against the water for focal impact.",
        "Focal dominance.",
      ),
      advice(
        "van",
        "Darken the van against the water for focal impact.",
        "Focal dominance.",
      ),
    ),
    false,
  );
});
