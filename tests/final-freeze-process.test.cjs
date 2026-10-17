const test = require("node:test");
const assert = require("node:assert/strict");
const { loadShared } = require("./helpers/shared-loader.cjs");
const fixture = require("./helpers/canonical-fixture.cjs");
const evidence = loadShared("../shared/coachingEvidence.ts", "lib/overlays.ts");
const analysis = loadShared("../shared/paintingAnalysis.ts", "lib/overlays.ts");

// Sanitized text only: the original method cannot be inferred from a final image.
for (const [raw, expected] of [
  [
    "Dry brush texture breaks up the foreground passage.",
    "Irregular visible texture breaks up the foreground passage.",
  ],
  [
    "The mountain has dry-brush texture beside smooth colour passages.",
    "The mountain has irregular visible texture beside smooth colour passages.",
  ],
  [
    "Drybrush texture is visible near the boat.",
    "Irregular texture is visible near the boat.",
  ],
  [
    "Wet blending creates a misty mountain passage.",
    "Soft blended colour transitions create a misty mountain passage.",
  ],
  [
    "Some areas of wet blending separate the distant forms.",
    "Some soft blended colour transitions separate the distant forms.",
  ],
  [
    "Wet blending is visible behind the tower.",
    "Soft blended colour transitions are visible behind the tower.",
  ],
  [
    "Edge control separates the focal architecture from the background.",
    "Edge variation separates the focal architecture from the background.",
  ],
  [
    "Maintain this edge control around the focal boat.",
    "Preserve this edge variation around the focal boat.",
  ],
  [
    "Preserve the edge variation technique beside the tower.",
    "Preserve the edge variation beside the tower.",
  ],
  [
    "The opaque colour application looks denser near the boat.",
    "Colour passages appear denser near the boat.",
  ],
  [
    "Opaque color application appears flat behind the boat.",
    "Colour passages appear flat behind the boat.",
  ],
  [
    "The opaque colour application is more solid-looking in the foreground.",
    "Colour passages appear more solid-looking in the foreground.",
  ],
]) {
  test(`freeze process guard retains only the supplied visible effect: ${raw}`, () => {
    assert.equal(evidence.unsupportedProcess(raw), true);
    assert.equal(evidence.observationText(raw), expected);
    assert.equal(evidence.unsupportedProcess(expected), false);
  });
}

for (const raw of [
  "Opaque colour application creates depth.",
  "The painter used dry-brush texture in the foreground.",
  "The mountain was painted with wet blending.",
  "Dry-brush handling creates atmosphere.",
  "On a separate study, try dry-brush texture; the painter used dry-brush in the foreground.",
  "On a separate study, try dry-brush texture; the original painting was painted with dry-brush.",
  "Try wet-on-wet in a separate study; the foreground was painted dry-brush.",
]) {
  test(`freeze process guard omits unsupported history or application: ${raw}`, () => {
    assert.equal(evidence.observationText(raw), "");
  });
}

test("unsupported opaque application does not erase a separate visible observation", () => {
  assert.equal(
    evidence.observationText(
      "The boat has a dark contour. Opaque colour application creates depth.",
    ),
    "The boat has a dark contour.",
  );
});

for (const raw of [
  "On a separate small study, try dry-brush texture beside a smooth passage.",
  "Try wet-on-wet in a separate study; compare the distant softness.",
  "On scrap watercolor paper, compare wet-on-dry edges with a soft transition.",
  "A dry-brush exercise could reproduce the irregular texture on separate paper.",
]) {
  test(`freeze process guard preserves explicit future methods: ${raw}`, () => {
    assert.equal(evidence.observationText(raw), raw);
    assert.equal(evidence.unsupportedProcess(raw), false);
  });
}

test("canonical saved-result cleaner removes process labels from technique evidence and preservation", () => {
  const source = fixture();
  source.canonicalAnalysis.facts.find(
    (fact) => fact.id === "edges",
  ).observation =
    "Dry-brush texture contrasts with wet blending behind the tower.";
  const handling = source.canonicalAnalysis.insights.find(
    (insight) => insight.id === "handling",
  );
  handling.lesson =
    "Edge variation technique separates the tower from the sky.";
  handling.action = "Maintain this edge control around the tower.";
  const cleaned = analysis.cleanPaintingAnalysis(source, (notes) => notes);
  assert.ok(cleaned);
  assert.equal(
    cleaned.canonicalAnalysis.facts.find((fact) => fact.id === "edges")
      .observation,
    "Irregular visible texture contrasts with soft blended colour transitions behind the tower.",
  );
  const result = cleaned.canonicalAnalysis.insights.find(
    (insight) => insight.id === "handling",
  );
  assert.equal(
    result.lesson,
    "Edge variation separates the tower from the sky.",
  );
  assert.equal(result.action, "Preserve this edge variation around the tower.");
  assert.equal(source.canonicalAnalysis.version, 1);
  assert.deepEqual(
    cleaned.canonicalAnalysis.visualRoles,
    source.canonicalAnalysis.visualRoles,
  );
});
