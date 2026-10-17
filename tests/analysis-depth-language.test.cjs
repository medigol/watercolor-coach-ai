const test = require("node:test");
const assert = require("node:assert/strict");
const { loadShared } = require("./helpers/shared-loader.cjs");
const fixture = require("./helpers/canonical-fixture.cjs");
const colourFixture = require("./helpers/colour-fixture.cjs");
const providerFixture = require("./helpers/provider-draft-fixture.cjs");
const evidence = loadShared("../shared/coachingEvidence.ts", "lib/overlays.ts");
const analysis = loadShared("../shared/paintingAnalysis.ts", "lib/overlays.ts");
const provider = loadShared(
  "../shared/providerPaintingAnalysis.ts",
  "lib/overlays.ts",
);

for (const [source, expected] of [
  [
    "Soft, diffused edges and washes create atmospheric mountain background.",
    "Soft, diffused edges and colour passages create atmospheric mountain background.",
  ],
  [
    "The sky wash has a quiet middle-value range.",
    "The sky colour passage has a quiet middle-value range.",
  ],
  [
    "Use of washes connects the background shapes.",
    "Use of colour passages connects the background shapes.",
  ],
  [
    "Washes connect the background shapes without competing with the tower.",
    "Colour passages connect the background shapes without competing with the tower.",
  ],
  [
    "Preserve the sky wash and its softer boundary against the focal roof.",
    "Preserve the sky colour passage and its softer boundary against the focal roof.",
  ],
  [
    "The broad sky wash keeps contrast below the focal roof. Its diffused boundary supports distance while the selected roof contour remains distinct.",
    "The broad sky colour passage keeps contrast below the focal roof. Its diffused boundary supports distance while the selected roof contour remains distinct.",
  ],
]) {
  test(`original-image wash wording remains observational: ${source}`, () => {
    assert.equal(evidence.observationText(source), expected);
    assert.doesNotMatch(evidence.observationText(source), /\bwashes?\b/i);
    assert.equal(evidence.unsupportedProcess(expected), false);
  });
}

for (const source of [
  "Try a wash on a separate small study; compare the resulting softness.",
  "On a separate study, use a wet-on-wet wash beside a wet-on-dry passage.",
  "A wet-on-wet study could reproduce the soft transitions with a dilute wash.",
  "On scrap watercolor paper, compare two washes while holding the values constant.",
  "Paint a dilute wash in the next study and compare its soft boundary.",
]) {
  test(`future wash methods remain intact: ${source}`, () => {
    assert.equal(evidence.observationText(source), source);
  });
}

for (const source of [
  "Mix Ultramarine and Burnt Sienna for a neutral sky wash.",
  "Use Ultramarine and Burnt Sienna for a cool shadow wash.",
  "Start with roughly two parts Ultramarine to one part Burnt Sienna; dilute the wash with water.",
  "An approximate recreation mix for a cool sky wash.",
  "Dilute the wash with water to show more paper white.",
]) {
  test(`suggested pigment-mix language is not rewritten: ${source}`, () => {
    assert.equal(evidence.observationText(source), source);
  });
}

for (const [source, expected] of [
  [
    "Dry-brush texture is visible near the boat.",
    "Irregular texture is visible near the boat.",
  ],
  [
    "The irregular visible texture visible near the boat separates it from the smooth water.",
    "The irregular visible texture near the boat separates it from the smooth water.",
  ],
  [
    "Soft wet blending creates a distant passage.",
    "Soft blended colour transitions create a distant passage.",
  ],
  [
    "Soft, soft transitions keep the distant ridge quiet.",
    "Soft transitions keep the distant ridge quiet.",
  ],
  [
    "Dark dark dark contours define the boat.",
    "Dark contours define the boat.",
  ],
  [
    "Visible visible marks interrupt the broad colour passage.",
    "Visible marks interrupt the broad colour passage.",
  ],
]) {
  test(`only obvious duplicate display wording is normalized: ${source}`, () => {
    const cleaned = evidence.observationText(source);
    assert.equal(cleaned, expected);
    assert.equal(evidence.observationText(cleaned), cleaned);
  });
}

test("normalization does not change legitimate grammatical repetition or different qualities", () => {
  const source =
    "The value relationship shows that that darker passage remains subordinate. Soft, diffused transitions contrast with selected crisp contours.";
  assert.equal(evidence.observationText(source), source);
});

for (const source of [
  "Using layered washes.",
  "The sky wash was applied on wet paper.",
  "The painter used a sky wash.",
  "Mix a suggested neutral wash; the original painting was painted wet-on-wet.",
]) {
  test(`generic wash conversion cannot mask an unsupported process claim: ${source}`, () => {
    assert.equal(evidence.observationText(source), "");
  });
}

test("canonical technique teaching retains its supplied explanation and preservation without wash-process wording", () => {
  const source = fixture();
  const original = structuredClone(source);
  const baseline = analysis.cleanPaintingAnalysis(original, (notes) => notes);
  source.canonicalAnalysis.facts.find(
    (fact) => fact.id === "edges",
  ).observation =
    "Soft, diffused edges and washes connect the distant forms. The sharper tower corner separates the focal shape from that quieter field.";
  const technique = source.canonicalAnalysis.insights.find(
    (insight) => insight.id === "handling",
  );
  technique.lesson =
    "The diffused sky wash creates recession because its boundary carries less sharpness than the tower corner. This unequal edge relationship holds attention near the reserved light.";
  technique.action =
    "Preserve the sky wash and the selected crisp focal corner so the background stays subordinate.";
  source.expertViews.technique.practice =
    "On a separate study, try a wet-on-wet wash; vary only edge softness while keeping values consistent. Compare which boundary leaves the tower clearer.";
  const cleaned = analysis.cleanPaintingAnalysis(source, (notes) => notes);
  assert.ok(cleaned);
  const result = cleaned.canonicalAnalysis.insights.find(
    (insight) => insight.id === "handling",
  );
  assert.match(result.lesson, /diffused sky colour passage/);
  assert.match(result.lesson, /because its boundary carries less sharpness/);
  assert.match(result.lesson, /This unequal edge relationship/);
  assert.match(result.action, /Preserve the sky colour passage/);
  assert.equal(result.classification, "strength");
  assert.match(cleaned.expertViews.technique.practice, /wet-on-wet wash/);
  assert.equal(cleaned.canonicalAnalysis.version, 1);
  assert.deepEqual(
    cleaned.canonicalAnalysis.visualRoles,
    original.canonicalAnalysis.visualRoles,
  );
  assert.deepEqual(
    cleaned.canonicalAnalysis.composition,
    baseline.canonicalAnalysis.composition,
  );
});

test("known suggested-method context preserves wash wording without changing observational context", () => {
  const text = "Keep the wash light and reserve a small untouched paper shape.";
  assert.equal(evidence.suggestedMethodText(text), text);
  assert.match(evidence.observationText(text), /colour passage/);
});

test("suggested-method context retains all original-process history guards", () => {
  for (const text of [
    "The painter used a thin wash.",
    "The first wash was applied on wet paper.",
    "Try a dilute wash; the original painting was painted wet-on-wet.",
  ]) {
    assert.equal(evidence.suggestedMethodText(text), "", text);
  }
});

test("recreation-mix fields retain proposed wash language while colour observations remain visible-only", () => {
  const source = fixture();
  source.canonicalAnalysis.colourAnalysis = colourFixture();
  source.canonicalAnalysis.colourAnalysis.colourStrategy =
    "The cool wash supports the reserved warm focal accent.";
  const originalMixes = structuredClone(
    source.canonicalAnalysis.colourAnalysis.recreationMixes,
  );
  const cleaned = analysis.cleanPaintingAnalysis(source, (notes) => notes);
  assert.ok(cleaned);
  assert.deepEqual(
    cleaned.canonicalAnalysis.colourAnalysis.recreationMixes,
    originalMixes,
  );
  assert.match(
    cleaned.canonicalAnalysis.colourAnalysis.colourStrategy,
    /cool colour passage/,
  );
});

test("canonical future brush-stage wash instructions remain intact without admitting original history", () => {
  const source = fixture();
  const method = {
    stage: "Separate sky-wash study",
    brush: "Medium round brush",
    wash: "Tea-strength blue wash",
    technique: "wet_on_dry",
    timing: "Wait until the first wash is dry.",
    edges: "Keep supporting edges soft; reserve one crisp focal accent.",
    stop: "Stop before scattering small darks.",
  };
  source.canonicalAnalysis.brushPlan = [
    method,
    { ...method, timing: "The first wash was applied on wet paper." },
  ];
  const cleaned = analysis.cleanPaintingAnalysis(source, (notes) => notes);
  assert.ok(cleaned);
  assert.deepEqual(cleaned.canonicalAnalysis.brushPlan, [method]);
});

test("multi-sentence future wash practice survives provider normalization and saved canonical roundtrip", () => {
  const source = providerFixture();
  const practice =
    "On a separate small study, compare two sky washes varying only edge softness. Keep the wash light and the value range constant. Compare which edge makes the tower clearer.";
  for (const key of ["overall", "composition", "colourValue", "technique"])
    source[key].practice = practice;
  const normalized = provider.normalizeProviderPaintingAnalysis(source);
  assert.equal(normalized.ok, true);
  const cleaned = analysis.cleanPaintingAnalysis(
    normalized.result,
    (notes) => notes,
  );
  assert.ok(cleaned);
  const reopened = analysis.cleanPaintingAnalysis(
    structuredClone(cleaned),
    (notes) => notes,
  );
  assert.ok(reopened);
  for (const key of ["overall", "composition", "colourValue", "technique"]) {
    assert.equal(normalized.result.expertViews[key].practice, practice);
    assert.equal(cleaned.expertViews[key].practice, practice);
    assert.equal(reopened.expertViews[key].practice, practice);
  }
  assert.equal(reopened.canonicalAnalysis.version, 1);
});

test("known practice-field context never preserves an appended original-process assertion", () => {
  const source = providerFixture();
  const practice = "On a separate study, compare two sky washes.";
  source.technique.practice = `${practice} The first wash was applied on wet paper.`;
  const normalized = provider.normalizeProviderPaintingAnalysis(source);
  assert.equal(normalized.ok, true);
  const cleaned = analysis.cleanPaintingAnalysis(
    normalized.result,
    (notes) => notes,
  );
  assert.ok(cleaned);
  assert.equal(cleaned.expertViews.technique.practice, practice);
});

test("proposed note and practice methods keep wash terminology while visible evidence stays observational", () => {
  const instruction = "Connect the shapes with a soft middle-value wash.";
  const cleaned = evidence.evidenceFeedback({
    whatToFix: [instruction],
    practice: `Compare two sky washes. ${instruction}`,
    overlays: [
      {
        classification: "study_experiment",
        shortInstruction: instruction,
        action: instruction,
        evidence: "Soft, diffused edges and washes create atmospheric depth.",
        reason: "Broad washes connect the background shapes.",
      },
    ],
  });
  assert.equal(cleaned.whatToFix[0], instruction);
  assert.match(cleaned.practice, /sky washes/);
  assert.equal(cleaned.overlays[0].action, instruction);
  assert.equal(cleaned.overlays[0].shortInstruction, instruction);
  assert.match(cleaned.overlays[0].evidence, /colour passages/);
  assert.match(cleaned.overlays[0].reason, /colour passages/);
});

test("note preservation remains visible-only and future note context cannot admit execution history", () => {
  const cleaned = evidence.evidenceFeedback({
    overlays: [
      {
        classification: "strength",
        shortInstruction: "Preserve the washes around the tower.",
        action: "Preserve the washes around the tower.",
      },
      {
        classification: "study_experiment",
        shortInstruction: "Try a wash on separate paper.",
        action: "The painter used wet-on-wet washes.",
      },
    ],
  });
  assert.equal(cleaned.overlays.length, 1);
  assert.match(cleaned.overlays[0].action, /colour passages/);
  assert.doesNotMatch(cleaned.overlays[0].action, /washes/);
});
