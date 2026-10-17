const test = require("node:test");
const assert = require("node:assert/strict");
const { loadShared } = require("./helpers/shared-loader.cjs");
const language = loadShared("../shared/coachingLanguage.ts", "lib/overlays.ts");

test("the live band exercise keeps value contrast and removes the second edge change", () => {
  const safe = language.separateStudyText(
    "Paint horizontal colour bands varying only value contrast; compare spatial depth with softer edges.",
  );
  assert.equal(
    safe,
    "On a separate small study, paint horizontal colour bands varying only value contrast; compare spatial depth.",
  );
  assert.match(safe, /only value contrast/);
  assert.doesNotMatch(safe, /softer edges/);
  assert.equal(language.separateStudyText(safe), safe);
});

for (const [label, input, expected] of [
  [
    "edge softness",
    "Vary only edge softness; compare recession with darker background values.",
    "Vary only edge softness; compare recession.",
  ],
  [
    "chroma",
    "Change one controlled variable: chroma; compare hierarchy using sharper edges.",
    "Change one controlled variable: chroma; compare hierarchy.",
  ],
  [
    "temperature",
    "Test a single variable: temperature; compare atmosphere with lower chroma.",
    "Test a single variable: temperature; compare atmosphere.",
  ],
  [
    "only-change phrasing",
    "Only change value contrast; compare separation by sharpening the distant edges.",
    "Only change value contrast; compare separation.",
  ],
  [
    "joined independent variables",
    "Paint bands varying only value contrast and edge softness; compare depth.",
    "Paint bands varying only value contrast; compare depth.",
  ],
  [
    "edge comparison without a comparative suffix",
    "Vary only value contrast; compare spatial depth using soft versus crisp edges.",
    "Vary only value contrast; compare spatial depth.",
  ],
  [
    "an against connector",
    "Vary only value contrast against softer edges; compare depth.",
    "Vary only value contrast; compare depth.",
  ],
  [
    "a comparison that names both variables",
    "Vary only value contrast; compare stronger values to softer edges.",
    "Vary only value contrast; compare stronger values.",
  ],
])
  test(`a claimed single-variable study preserves ${label} rather than another change`, () => {
    assert.equal(language.singleVariableStudyText(input), expected);
  });

for (const [label, input] of [
  [
    "value",
    "Vary only value contrast; compare the current and compressed value versions for clearer depth.",
  ],
  [
    "edge",
    "Vary only edge softness; compare softer versus current edges for focal separation.",
  ],
  [
    "chroma",
    "Vary only chroma; compare lower and current saturation for clearer hierarchy.",
  ],
  [
    "constant edges",
    "Vary only value contrast; keep edges consistent and compare spatial depth.",
  ],
  [
    "constant values",
    "Vary only edge softness; keep values unchanged and compare recession.",
  ],
  [
    "a fixed sharper edge treatment",
    "Vary only chroma, with the same sharper edges; compare hierarchy.",
  ],
])
  test(`valid single-variable practice retains ${label}`, () => {
    assert.equal(language.singleVariableStudyText(input), input);
  });

test("exercises without an explicit one-variable claim are not rewritten", () => {
  const text = "Compare value contrast with softer edges in a separate study.";
  assert.equal(language.singleVariableStudyText(text), text);
});

test("an unlocated controlled variable does not lead to an invented exercise", () => {
  const text =
    "Test one controlled variable; compare which version reads more clearly.";
  assert.equal(language.singleVariableStudyText(text), text);
  assert.equal(language.separateStudyText(""), "");
});

test("single-variable cleanup is a pure display projection of supplied practice text", () => {
  const source = Object.freeze({
    practice:
      "Paint bands varying only value contrast; compare spatial depth with softer edges.",
  });
  const safe = language.separateStudyText(source.practice);
  assert.match(safe, /compare spatial depth\.$/);
  assert.match(source.practice, /with softer edges\.$/);
});
