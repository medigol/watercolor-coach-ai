// Sanitized text only, paired with existing original technical geometry.
module.exports = function semanticFixture(kind = "church") {
  let r = require("./canonical-fixture.cjs")();
  if (kind !== "church")
    r = JSON.parse(
      JSON.stringify(r).replace(
        /\btower\b/gi,
        kind === "van" ? "vehicle" : "boat",
      ),
    );
  const c = r.canonicalAnalysis;
  c.qualityAssessment = {
    level: kind === "church" ? "competent" : "strong",
    confidence: 0.88,
    rationale:
      kind === "church"
        ? "The painting shows solid control of value contrasts. It effectively balances the focal tower and supporting bank, with coherent atmospheric perspective. There is room for improvement in spatial coherence and edge variation."
        : kind === "van"
          ? "The painting has solid foundational skills. Clear focal hierarchy and coherent value grouping support depth. There is room for improvement in spatial coherence and edge variation."
          : "The painting demonstrates solid foundational understanding. Coherent colour bands and clear focal separation support the atmosphere. There is room for improvement in depth and compositional clarity.",
  };
  Object.assign(c.insights[0], {
    lesson:
      kind === "church"
        ? "The tower light stands apart from the surrounding shapes and holds attention."
        : "Warm–cool contrast contrast gives the focal subject clear separation.",
    action: `Preserve the sharp light-shadow contrast on the ${kind === "church" ? "tower" : kind === "van" ? "vehicle" : "boat"} while refining edges to maintain focus.`,
  });
  c.visualEvidence[0].note.shortInstruction = c.insights[0].action;
  c.facts[3].observation =
    kind === "boat"
      ? "The boat is painted with more defined edges and darker pigment application, creating sharper contrast."
      : "Selected crisp contours separate the focal shape from softer distant passages.";
  c.insights[3].lesson =
    "The artist demonstrates technical mastery. Selected edge differences support clear depth.";
  c.insights[3].action =
    "Preserve selected crisp contours while improving background transitions.";
  c.insights.push({
    id: "preservation-alternative",
    domain: "composition",
    classification: "stylistic_alternative",
    factIds: ["path"],
    lesson: "The horizontal structure creates calm.",
    action: "Maintain the horizontal structure and off-centre placement.",
  });
  c.insights.push({
    id: "corrective-alternative",
    domain: "technique",
    classification: "stylistic_alternative",
    factIds: ["edges"],
    lesson:
      "The subject could be enhanced by stronger contrast or sharper edges.",
    action: "Increase edge sharpness or value contrast in a separate study.",
  });
  r.expertViews.overall.practice =
    "On a separate small study, paint two vehicle shapes focusing on perspective accuracy and proportion. Vary only the viewing angle, keeping values and edges constant. Compare the two versions with this painting to gauge improvement. Choose the version with a readable silhouette.";
  for (const key of ["composition", "colourValue", "technique"])
    r.expertViews[key].practice = "";
  return r;
};
