const test = require("node:test");
const assert = require("node:assert/strict");
const { loadShared } = require("./helpers/shared-loader.cjs");
const evidence = loadShared("../shared/coachingEvidence.ts", "lib/overlays.ts");
const coaching = loadShared("../shared/coachingDecision.ts", "lib/overlays.ts");
const visual = loadShared("../shared/visualMetadata.ts", "lib/overlays.ts");
const decision = {
  primaryGoal: "Keep the house as the focal point.",
  primarySubjectOrArea: "house",
  areasToEmphasize: ["house"],
  areasToQuiet: ["background"],
  currentPaintingAction: null,
  nextStudyAction: null,
  supportingObservations: ["The roof is light against a cool tree mass."],
  compositionImplication: null,
  colourImplication: null,
  techniqueImplication: null,
  visualRoles: [
    { area: "house", role: "focal" },
    { area: "bridge", role: "supporting" },
    { area: "background", role: "quiet" },
  ],
};
for (const [focus, mainAdvice, practice] of [
  [
    "Overall",
    "The reserved light gives this quiet scene a readable centre.",
    "Compare one reserved light in a 15-minute study.",
  ],
  [
    "Composition",
    "The bridge diagonal carries the eye from the foreground to the house.",
    "Compare two bridge diagonals in small thumbnails.",
  ],
  [
    "Colour",
    "Warm roof light separates from a muted blue-green middle-value group.",
    "Test warm light against two cool middle values.",
  ],
  [
    "Technique",
    "The background shows diffused transitions beside the crisp roof edge.",
    "Practise one wet-on-wet transition on a separate sheet.",
  ],
])
  test(`${focus} retains its independent interpretation and exercise over the same descriptive facts`, () => {
    const result = coaching.coherentFeedback(
      {
        mainAdvice,
        practice,
        whatWorks: ["The house has a clear light-dark silhouette."],
        whatToFix: [],
        coachingDecision: decision,
      },
      "improve_painting",
    );
    assert.equal(result.mainAdvice, mainAdvice);
    assert.equal(result.practice, practice);
    assert.deepEqual(
      result.coachingDecision.supportingObservations,
      decision.supportingObservations,
    );
  });

for (const [strength, correction] of [
  [
    "Sharp edges on the house create a clear focal point.",
    "Edges around the house could be crisper.",
  ],
  ["The background has soft diffused edges.", "Sharpen the background edges."],
  ["The house has strong contrast.", "Reduce contrast on the house."],
  ["The background has muted colour.", "Increase chroma in the background."],
  [
    "The bridge uses economical selective detail.",
    "Add more detail on the bridge.",
  ],
])
  test(`successful property cannot become an unsupported defect: ${correction}`, () => {
    assert(evidence.conflictsWithStrength(correction, [strength]));
    const result = evidence.evidenceFeedback({
      whatWorks: [strength],
      whatToFix: [correction],
    });
    assert.deepEqual(result.whatWorks, [strength]);
    assert.deepEqual(result.whatToFix, []);
  });
test("different explicit subregions and optional future experiments remain valid", () => {
  const strengths = ["The upper roof has crisp edges."];
  assert(
    !evidence.conflictsWithStrength(
      "Soften the lower bridge edges.",
      strengths,
    ),
  );
  assert(
    !evidence.conflictsWithStrength(
      "In a separate study, compare softer roof edges.",
      strengths,
    ),
  );
});
test("observed appearance survives while original process/equipment claims do not", () => {
  assert.equal(
    evidence.observationText("Soft wet-on-wet washes create atmosphere."),
    "Soft washes create atmosphere.",
  );
  for (const claim of [
    "Effective use of wet-on-wet washes in the background.",
    "The artist used a size 12 round brush.",
    "The paper was evenly damp.",
    "The original pigment is ultramarine.",
  ])
    assert.equal(evidence.observationText(claim), "", claim);
  const practice =
    "A wet-on-wet study could be one way to practise this effect.";
  assert.equal(evidence.observationText(practice), practice);
});
test("Strength cards preserve successful decisions and reclassify hidden corrections", () => {
  for (const action of [
    "Enhance edges on the house.",
    "Deepen values on the roof.",
    "Increase contrast in the house.",
    "Sharpen the house.",
  ]) {
    const note = visual.sanitizeVisualMetadata({
      classification: "strength",
      action,
      shortInstruction: "Observe the roof light.",
      evidence: "The roof has the clearest small light-dark separation.",
    });
    assert.equal(note.classification, "study_experiment");
    assert.equal(note.timing, "next_study");
  }
  assert.equal(
    visual.sanitizeVisualMetadata({
      classification: "strength",
      action: "Preserve the existing roof edge.",
      shortInstruction: "Observe this successful edge.",
    }).classification,
    "strength",
  );
});
test("same atmospheric learning insight is deduplicated but another mechanism stays distinct", () => {
  assert(
    evidence.sameLearningInsight(
      "The soft distant shapes create atmospheric depth.",
      "Soft background forms recede and give depth.",
    ),
  );
  assert(
    !evidence.sameLearningInsight(
      "The soft distant shapes create atmospheric depth.",
      "A warm roof accent separates from cool water.",
    ),
  );
});
test("a named geometry subject cannot silently illustrate a different named action", () => {
  assert(
    !evidence.studyTargetAligned(
      "Roof edges",
      "Practise softer foreground trees.",
    ),
  );
  assert(
    evidence.studyTargetAligned("Roof edges", "Practise one roof transition."),
  );
});
test("optional role hierarchy still prevents equally emphasizing supporting and quiet areas", () => {
  assert(
    coaching.conflictsWithDecision(
      "Sharpen the bridge and darken the background.",
      decision,
    ),
  );
  assert(
    !coaching.conflictsWithDecision(
      "Keep the bridge subordinate and let it guide the eye toward the house.",
      decision,
    ),
  );
});
