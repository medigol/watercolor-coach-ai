// Original technical scene text, no user artwork or copied artist material.
module.exports = function deepCoachingFixture(level = "strong") {
  const r = require("./provider-draft-fixture.cjs")();
  r.qualityAssessment = {
    level,
    confidence: 0.9,
    rationale:
      "The pale tower carries the strongest light against connected middle values, giving the scene a clear point of attention. The broad bank directs movement without becoming a second focal mass. Cooler, softer distant passages leave space around the warmer light; this unequal separation supports a calm atmosphere while selected crisp contours keep the architecture readable.",
  };
  Object.assign(r.overall.facts[0], {
    observation:
      "The pale tower is separated from the surrounding middle-value bank by a small reserved light.",
  });
  Object.assign(r.overall.insights[0], {
    lesson:
      "The light tower remains readable against connected middle values. Reserving the largest value separation for one small area concentrates attention without covering the whole scene in strong accents.",
    action:
      "Preserve the unequal value separation between the small tower light and the broader supporting middle values.",
  });
  Object.assign(r.composition.facts[0], {
    observation:
      "The broad bank rises from the lower left toward the tower while the open water leaves a quieter interval below it.",
  });
  Object.assign(r.composition.insights[0], {
    lesson:
      "The bank links the lower left to the tower. Its connected shape gives the small light a supporting visual weight, while the open water prevents an equally busy lower half.",
    action:
      "Preserve the relationship between the connected bank, the small light and the quieter open water.",
  });
  Object.assign(r.colourValue.facts[0], {
    observation:
      "The tower has a warm pale accent against cooler, muted blue-green water and distant shapes.",
  });
  Object.assign(r.colourValue.insights[0], {
    lesson:
      "The warm tower and cooler water separate by temperature as well as lightness. Keeping the broader colour muted lets the warm accent register clearly without making the whole painting more saturated.",
    action:
      "Preserve concentrated warm colour near the light and lower supporting chroma across the water.",
  });
  Object.assign(r.technique.facts[0], {
    observation:
      "The tower corner has a crisp contour beside broader, softer distant passages and broken foreground texture.",
  });
  Object.assign(r.technique.insights[0], {
    lesson:
      "The selected crisp tower corner provides a definite place to pause against broader soft passages. Unequal edge definition reinforces depth; the broken foreground texture adds surface interest without describing every small form.",
    action:
      "Preserve selected crisp focal contours against softer distance, with broad foreground texture remaining subordinate.",
  });
  r.overall.practice =
    "On a separate 15-minute postcard study, paint two versions of the tower and bank. Keep shapes, values and colours fixed; vary only the tower edge from crisp to partly lost. Compare both at arm’s length. Choose the version that holds attention at the light while retaining a calm transition into the distance. This tests edge hierarchy, not a fault in the current painting.";
  for (const key of ["composition", "colourValue", "technique"])
    r[key].practice = null;
  if (level === "developing") {
    r.overall.facts.push({
      observation:
        "Internal dark marks in the background bank compete with the focal tower light, flattening spatial separation.",
      roleIndex: 1,
    });
    r.overall.insights.push({
      classification: "clear_issue",
      factRefs: [1],
      lesson:
        "The bank internal darks compete with the tower and flatten depth. A narrower supporting value range would separate the focal light without requiring darker focal accents.",
      action:
        "On a separate study, compress internal bank values below focal contrast; keep shapes and edges fixed, compare which version separates the tower.",
    });
  }
  return r;
};
