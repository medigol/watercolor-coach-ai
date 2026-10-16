// Original technical scene content; no user image or copied artwork.
module.exports = function providerDraftFixture() {
  const c = require("./canonical-fixture.cjs")().canonicalAnalysis;
  const result = {
    title: "Tower study",
    qualityAssessment: structuredClone(c.qualityAssessment),
    visualRoles: c.visualRoles.map(({ id, ...role }) => structuredClone(role)),
    compositionStructure: structuredClone(c.composition),
    brushPlan: null,
  };
  for (const [key, domain] of [
    ["overall", "overall"],
    ["composition", "composition"],
    ["colourValue", "colour_value"],
    ["technique", "technique"],
  ]) {
    const facts = c.facts.filter((f) => f.domain === domain);
    const insights = c.insights.filter((i) => i.domain === domain);
    result[key] = {
      facts: facts.map((f) => ({
        observation: f.observation,
        roleIndex:
          f.roleId === null
            ? null
            : c.visualRoles.findIndex((r) => r.id === f.roleId),
      })),
      insights: insights.map((i) => ({
        classification: i.classification,
        factRefs: i.factIds.map((id) => facts.findIndex((f) => f.id === id)),
        lesson: i.lesson,
        action: i.action,
      })),
      practice:
        "On a separate small study, compare two value groupings around the tower; keep the shapes fixed and choose the clearer focal light.",
      visualAids: c.visualEvidence
        .filter((v) => insights.some((i) => i.id === v.insightId))
        .map((v) => ({
          insightIndex: insights.findIndex((i) => i.id === v.insightId),
          label: v.note.label,
          regions: [structuredClone(v.note.region)],
          confidence: v.note.regionConfidence,
          timing: v.note.timing,
        })),
    };
    if (key === "colourValue") {
      const colour = require("./colour-fixture.cjs")();
      result[key].colourAnalysis = {
        ...colour,
        visibleColours: colour.visibleColours.map(({ roleId, ...item }) => ({
          ...item,
          roleIndex: c.visualRoles.findIndex((r) => r.id === roleId),
        })),
        technicalAssessment: {
          kind: colour.technicalAssessment.kind,
          explanation: colour.technicalAssessment.explanation,
          insightIndex: 0,
        },
      };
    }
  }
  return result;
};
