const test = require("node:test");
const assert = require("node:assert/strict");
const { loadShared } = require("./helpers/shared-loader.cjs");
const evidence = loadShared("../shared/coachingEvidence.ts", "lib/overlays.ts");

// Sanitized textual live-output regressions; no private image assets are used.
for (const [raw, expected] of [
  [
    "Loose brushwork with some soft edges in sky clouds.",
    "Visible marks with some soft edges in sky clouds.",
  ],
  [
    "Soft washes create the mountain's misty effect but edges are unevenly controlled.",
    "Soft colour passages create the mountain's misty effect but edges vary unevenly in definition.",
  ],
  [
    "Continue using soft washes for distant elements to preserve recession.",
    "Preserve soft colour passages for distant elements to preserve recession.",
  ],
  [
    "The boat is painted with more defined brush strokes against broad colour bands.",
    "The boat has more defined visible marks against broad colour bands.",
  ],
  [
    "Combining loose washes for background with sharper brushwork separates the boat.",
    "Combining loose colour passages for background with sharper visible marks separates the boat.",
  ],
  [
    "Controlled brushwork defines the tower.",
    "Visible marks define the tower.",
  ],
  [
    "Unevenly controlled edges interrupt recession.",
    "Unevenly defined edges interrupt recession.",
  ],
  [
    "The edge is unevenly controlled near the roof.",
    "The edge varies unevenly in definition near the roof.",
  ],
  [
    "Carefully controlled watercolor brushwork defines the tower.",
    "Visible marks define the tower.",
  ],
  [
    "Defined brush strokes mark the boat.",
    "Defined visible marks mark the boat.",
  ],
  [
    "Sharper brushwork separates the boat.",
    "Sharper visible marks separate the boat.",
  ],
  [
    "The upper edges are evenly controlled near the tower.",
    "The upper edges have consistent definition near the tower.",
  ],
  [
    "Controlled edges separate the tower from the sky.",
    "Consistently defined edges separate the tower from the sky.",
  ],
])
  test(`observed-effect cleanup preserves supplied qualities: ${raw}`, () => {
    const actual = evidence.observationText(raw);
    assert.equal(actual, expected);
    assert.equal(evidence.unsupportedProcess(actual), false);
    assert.doesNotMatch(
      actual,
      /brushwork|brush\s*strokes|soft washes|using washes|controlled/i,
    );
  });

for (const raw of [
  "Loose brushwork creates atmosphere.",
  "Confident brushwork creates atmosphere.",
  "Controlled brush strokes define the boat.",
])
  test(`handling does not invent crispness or dark contours: ${raw}`, () => {
    const actual = evidence.observationText(raw);
    assert.match(actual, /visible marks/i);
    assert.doesNotMatch(
      actual,
      /crisp|sharp|dark|broad|small|brush|confident|controlled/i,
    );
  });

for (const raw of [
  "Confident handling creates atmosphere.",
  "Poorly controlled edges interrupt recession.",
  "Good technique control creates atmosphere.",
  "The painter used soft washes to establish recession.",
  "The brush was a small round.",
  "The original pigment was ultramarine.",
  "The edges could have been painted wet-on-wet.",
])
  test(`unsupported history/skill judgement is omitted: ${raw}`, () =>
    assert.equal(evidence.observationText(raw), ""));

for (const raw of [
  "Try wet-on-wet in a separate study; compare the distant softness.",
  "A wet-on-wet study could reproduce this softness.",
  "A wet-on-wet exercise could reproduce a similar soft transition on separate paper.",
  "On scrap watercolor paper, practise controlled brush strokes; compare edge clarity.",
  "Use a damp brush to soften the trees in a separate study.",
  "On a separate small study, try using layered washes and compare value grouping.",
])
  test(`explicit future reproduction methods remain allowed: ${raw}`, () => {
    assert.equal(evidence.observationText(raw), raw);
    assert.equal(evidence.unsupportedProcess(raw), false);
  });

test("a modal or later practice mention cannot excuse asserted original process", () => {
  assert.equal(
    evidence.observationText("Confident handling could create atmosphere."),
    "",
  );
  assert.equal(
    evidence.observationText(
      "Confident handling creates atmosphere; a study could test it.",
    ),
    "",
  );
});
test("valid observations survive a separate unsupported handling sentence", () => {
  assert.equal(
    evidence.observationText(
      "The mountain has soft contours. Confident handling creates atmosphere.",
    ),
    "The mountain has soft contours.",
  );
});
test("the wash-application conversion retains visible overlaps without invented control", () => {
  assert.equal(
    evidence.observationText(
      "The wash application is controlled with transparent layering.",
    ),
    "Visible colour passages have transparent-looking overlaps.",
  );
});
test("wet-on-wet removal is followed by observable wash wording", () => {
  assert.equal(
    evidence.observationText("Soft wet-on-wet washes create atmosphere."),
    "Soft colour passages create atmosphere.",
  );
});
