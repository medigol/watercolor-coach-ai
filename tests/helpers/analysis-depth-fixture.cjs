// Original technical-scene teaching only; no private painting or copied artwork.
module.exports = function analysisDepthFixture() {
  const result = require("./canonical-fixture.cjs")();
  const c = result.canonicalAnalysis;
  c.qualityAssessment = {
    level: "competent",
    confidence: 0.88,
    rationale:
      "Clear value separation keeps the pale tower readable against the quieter bank. The rising foreground links the lower shapes to the light, while muted cool surroundings leave room for the small warm accent. Selected crisp contours hold attention near the tower and softer distant transitions support atmospheric depth.",
  };
  c.visualRoles[1].area = "foreground road";
  c.composition.observation =
    "The foreground curve links the broad bank with the pale tower. Its diagonal movement lets the small light act as the landing while the bank remains subordinate.";
  c.composition.primary.shortExplanation =
    "Open water leaves a quiet interval between the bank and the light. That breathing room makes the direction easier to read; preserve the contrast between a connected supporting shape and one reserved focal light.";
  c.facts[1].observation =
    "The broad foreground road curves toward the tower and remains subordinate to the light; its contrast fades with distance.";
  Object.assign(c.insights[0], {
    lesson:
      "The pale tower stands apart from the broad middle values. This reserved light holds attention without needing many dark accents.",
    action:
      "Preserve the value separation between the light shape and its quieter surroundings in future work.",
  });
  Object.assign(c.insights[1], {
    lesson:
      "The broad road curve connects the foreground to the tower. Its subordinate contrast lets the light remain the destination.",
    action:
      "Preserve the road curve and slightly emphasize road contrast to strengthen visual flow.",
  });
  c.facts[3].observation =
    "Soft, diffused edges and washes create an atmospheric background, contrasting with one crisp tower corner.";
  Object.assign(c.insights[3], {
    lesson:
      "The crisp tower corner gives attention a clear landing against the softer distant transitions. This unequal edge definition lets the background recede without losing its large shapes.",
    action:
      "Preserve the selected focal contour and the softer distant transitions rather than defining every edge equally.",
  });
  c.colourAnalysis = require("./colour-fixture.cjs")();
  Object.assign(c.colourAnalysis, {
    colourStrategy:
      "Cool background colour supports depth. Warm focal accents concentrate chroma near the tower.",
    valueHierarchy:
      "Cool background values support depth. Connected middle tones keep internal contrast below the focal darks.",
    chromaHierarchy:
      "Muted supporting colour keeps the scene calm. The concentrated warm accent marks one place to pause.",
    temperatureRelationship:
      "Warm tower light contrasts with cooler water. Their temperature difference separates the light without requiring more detail.",
  });
  result.expertViews.overall.practice =
    "On a separate 15-minute small study, paint two versions of the same tower and bank, varying only value contrast. Keep the shapes, warm–cool relationship and edge treatment consistent. Compare the current contrast with a narrower supporting value range. View both at arm's length; choose the version where the reserved light remains readable without the bank becoming another focal accent.";
  for (const key of ["composition", "colourValue", "technique"])
    result.expertViews[key].practice = "";
  // Unsupported raw critique must not withhold a safe display-only Strong level.
  c.insights.push({
    id: "unsupported-depth-issue",
    domain: "overall",
    classification: "clear_issue",
    factIds: ["hierarchy"],
    lesson: "The tower perspective is inconsistent and limits depth.",
    action: "Compare aligned tower perspective on a separate study.",
  });
  return result;
};
