// Entirely synthetic contract fixture. No discovered video or real approval.
module.exports = function videoFixture() {
  const url = "https://www.youtube.com/watch?v=abcDEF123_-",
    date = "2026-01-01";
  const resource = {
    id: "synthetic-water",
    videoId: "abcDEF123_-",
    url,
    channelUrl: "https://www.youtube.com/@synthetic-test",
    creator: "SYNTHETIC QA creator — not an approved educator",
    title: "SYNTHETIC QA demonstration — no live content verification",
    language: "en",
    publishedAt: null,
    lessonIds: ["water-brush"],
    skillIds: ["water-control", "washes"],
    subjectTags: [],
    styleTags: [],
    difficulty: "foundation",
    purpose:
      "Validation fixture only, never shipped in the production catalogue",
    verifiedAt: date,
    verified: true,
    availability: "available",
    embeddable: true,
    active: true,
    replacementId: null,
    durationSeconds: 900,
    audience: {
      status: "not-made-for-kids",
      checkedAt: date,
      source: url,
      reviewer: "SYNTHETIC contract fixture; no real audience inspection",
    },
    captions: {
      presence: "unknown",
      languages: [],
      kind: "unknown",
      translation: "unverified",
      checkedAt: null,
      evidence: null,
    },
    review: {
      status: "owner-approved",
      scores: {
        technical: 23,
        alignment: 19,
        visibility: 14,
        explanation: 14,
        level: 9,
        pacing: 4,
        accessibility: 3,
        continuity: 5,
      },
      criticalIssues: [],
      evidence: [],
    },
    limitations: [
      "Synthetic API contract; no actual teaching or playback reviewed",
    ],
    segments: [],
  };
  for (const [id, start, end, title, objective, approach] of [
    [
      "synthetic-load",
      30,
      150,
      "Brush loading comparison",
      "Compare how a repeatable load changes the end puddle.",
      "load-comparison",
    ],
    [
      "synthetic-bead",
      180,
      300,
      "Bead and moisture comparison",
      "Distinguish excess delivered liquid from a pale mixture.",
      "moisture-comparison",
    ],
  ]) {
    resource.segments.push({
      id,
      resourceId: resource.id,
      lessonId: "water-brush",
      lessonVersion: 1,
      stepId: "set-up",
      skillIds: ["water-control"],
      start,
      end,
      durationSeconds: end - start,
      title,
      levels: ["beginner", "developing", "intermediate", "advanced"],
      objective,
      approach,
      watchFor:
        "The belly of the brush and the liquid left at the end of the stroke.",
      prompts: [
        "Notice the load before the stroke and the bead after it.",
        "Compare the second stroke without changing the mixture.",
      ],
      misconception: "A pale mixture can still deliver too much liquid.",
      explanation:
        "Compare delivery and concentration separately. One loading method is not a universal ideal; paper and brushes differ.",
      practice: {
        materials: ["Brush, paper, one colour, water and cloth"],
        action:
          "Repeat two small strokes. Adjust only the brush load on the second.",
        variable: "Brush load",
        constants: ["Same mixture, paper, brush and stroke length"],
        success: ["A difference in the end puddle that you can describe"],
        reflection: "What load would you repeat, and why?",
      },
      verifiedAt: date,
      verification: "verified",
      limitations: [
        "Synthetic instructional fixture, not a reviewed external demonstration",
      ],
    });
  }
  for (const [kind, method] of [
    ["metadata", "official-page"],
    ["content", "direct-viewing"],
    ["embed", "live-player"],
    ["editorial", "human-review"],
    ["owner", "human-review"],
  ])
    resource.review.evidence.push({
      kind,
      method,
      date,
      reviewer: "SYNTHETIC fixture, not a person",
      source: url,
      note: "Contract test only; no real inspection or approval",
    });
  for (const s of resource.segments)
    resource.review.evidence.push({
      kind: "segment",
      method: "direct-viewing",
      date,
      reviewer: "SYNTHETIC fixture",
      source: url,
      note: "Range validation only; not observed video boundaries",
      segmentId: s.id,
    });
  return resource;
};
