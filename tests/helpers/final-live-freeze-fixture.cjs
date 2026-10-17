// Sanitized teaching over the existing original technical geometry, not user art.
module.exports = function cleanupFixture() {
  const r = require("./canonical-fixture.cjs")();
  const c = r.canonicalAnalysis;
  c.qualityAssessment = {
    level: "competent",
    confidence: 0.88,
    rationale:
      "Clear value separation establishes the focal tower. Coherent light and balanced masses give the scene readable depth.",
  };
  c.colourAnalysis = {
    visibleColours: [
      { label: "Warm tower light", approximateHex: "#bd8c63", roleId: "tower" },
    ],
    colourStrategy:
      "Uses a muted, analogous palette dominated by greens and browns with soft red accents.",
    valueHierarchy:
      "Value contrasts are generally low, with the house and background close in tone, limiting depth but preserving softness.",
    chromaHierarchy:
      "Muted supporting colour leaves the warm tower light readable.",
    temperatureRelationship:
      "Warm light against cool water supports the calm atmosphere.",
    technicalAssessment: {
      kind: "coherent",
      insightId: null,
      explanation: "Coherent value grouping supports the quiet atmosphere.",
    },
    recreationMixes: [
      {
        target: "Quiet neutral",
        pigments: ["Ultramarine", "Burnt Sienna"],
        startingRatio: "2:1",
        use: "Try a light neutral wash on scrap paper.",
      },
      {
        target: "Complex neutral",
        pigments: ["Yellow Ochre", "Ultramarine", "Burnt Sienna"],
        startingRatio: "2:2:1",
        use: "Test on scrap paper.",
      },
    ],
  };
  c.brushPlan = [
    {
      stage: "For a separate study: soft distant shapes",
      brush: "Medium round brush",
      wash: "damp_on_dry",
      technique: "wet_on_dry",
      timing: "Wait until the study is dry.",
      edges: "Try one crisp edge beside a soft passage.",
      stop: "Stop before the light disappears.",
    },
  ];
  return r;
};
