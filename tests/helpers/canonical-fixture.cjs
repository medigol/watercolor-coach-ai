// Original technical fixture. No live image, copied composition art, or secrets.
module.exports = function canonicalFixture() {
  const primary = {
    type: "diagonal",
    confidence: 0.9,
    shortExplanation: "The low bank leads toward the pale tower.",
    paths: [
      [
        { x: 0.12, y: 0.85 },
        { x: 0.4, y: 0.65 },
        { x: 0.67, y: 0.36 },
      ],
    ],
    focalPoint: { x: 0.67, y: 0.36 },
    secondaryPoints: null,
    masses: null,
    teaching: {
      elements: ["bank", "tower"],
      entry: "Lower left bank",
      path: "Bank toward tower",
      landing: "Pale tower",
      supportingMass: "Low bank",
      quietMass: "Open water",
      counterbalance: null,
      risk: null,
    },
  };
  return {
    title: "Tower study",
    canonicalAnalysis: {
      version: 1,
      qualityAssessment: {
        level: "highly_resolved",
        confidence: 0.86,
        rationale:
          "The reserved tower light reads clearly within quieter surroundings.",
      },
      visualRoles: [
        {
          id: "tower",
          area: "tower",
          role: "focal",
          region: { x: 0.56, y: 0.24, width: 0.2, height: 0.3 },
          confidence: 0.92,
        },
        {
          id: "bank",
          area: "bank",
          role: "supporting",
          region: { x: 0.08, y: 0.59, width: 0.27, height: 0.22 },
          confidence: 0.9,
        },
        {
          id: "water",
          area: "water",
          role: "quiet",
          region: { x: 0.05, y: 0.25, width: 0.38, height: 0.25 },
          confidence: 0.88,
        },
      ],
      facts: [
        {
          id: "hierarchy",
          domain: "overall",
          observation:
            "The pale tower stands apart from the broad quiet surroundings.",
          roleId: "tower",
        },
        {
          id: "path",
          domain: "composition",
          observation: "The low bank rises diagonally toward the tower.",
          roleId: "bank",
        },
        {
          id: "colour",
          domain: "colour_value",
          observation: "Warm tower light contrasts with the cool muted water.",
          roleId: "tower",
        },
        {
          id: "edges",
          domain: "technique",
          observation:
            "Soft distant transitions contrast with one crisp tower corner.",
          roleId: "tower",
        },
      ],
      composition: {
        observation: "The low bank leads toward the pale tower.",
        primary,
        secondary: null,
      },
      insights: [
        {
          id: "whole",
          domain: "overall",
          classification: "strength",
          factIds: ["hierarchy"],
          lesson: "One reserved light holds this quiet scene together.",
          action: "Preserve this simple hierarchy.",
        },
        {
          id: "design",
          domain: "composition",
          classification: "strength",
          factIds: ["path"],
          lesson:
            "The rising bank links the foreground with the point of attention.",
          action: "Keep the supporting bank subordinate.",
        },
        {
          id: "temperature",
          domain: "colour_value",
          classification: "strength",
          factIds: ["colour"],
          lesson:
            "Temperature separation makes the small light readable without extra saturation.",
          action: "Retain the muted supporting colour family.",
        },
        {
          id: "handling",
          domain: "technique",
          classification: "strength",
          factIds: ["edges"],
          lesson:
            "Selective edge contrast gives the light shape a clear landing.",
          action: "Preserve the surrounding softness.",
        },
      ],
      visualEvidence: [
        {
          insightId: "whole",
          roleId: "tower",
          note: {
            id: "roof",
            type: "focal_ring",
            category: "focal_point",
            label: "Tower light",
            x: 56,
            y: 24,
            width: 20,
            height: 30,
            region: { x: 0.56, y: 0.24, width: 0.2, height: 0.3 },
            regionConfidence: 0.92,
            scope: "local",
            priority: "high",
            shortInstruction: "Observe the reserved tower light.",
            timing: "next_study",
          },
        },
      ],
      palette: null,
      brushPlan: null,
    },
    expertViews: {
      overall: {
        summaryId: "whole",
        insightIds: ["whole"],
        practice: "Compare one reserved light in a 15-minute study.",
      },
      composition: {
        summaryId: "design",
        insightIds: ["design"],
        practice: "For 15 minutes, compare two small bank-to-tower thumbnails.",
      },
      colourValue: {
        summaryId: "temperature",
        insightIds: ["temperature"],
        practice:
          "Test one warm light beside two cool middle values for 15 minutes.",
      },
      technique: {
        summaryId: "handling",
        insightIds: ["handling"],
        practice:
          "In a 15-minute separate study, practise one wet-on-wet soft transition beside a dry crisp accent.",
      },
    },
  };
};
