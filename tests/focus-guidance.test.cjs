const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");
const { loadShared } = require("./helpers/shared-loader.cjs");
const root = path.resolve(__dirname, "..");
const file = "lib/focusGuidance.ts";
const output = {};
const code = ts.transpileModule(
  fs.readFileSync(path.join(root, file), "utf8"),
  {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  },
).outputText;
new Function("exports", "require", code)(output, (name) =>
  name === "./coachingDecision"
    ? loadShared("../shared/coachingDecision", file)
    : loadShared(name, file),
);
const { focusedMainAdvice, guidanceDomain } = output;
const decision = {
  primaryGoal: "Keep the house as the focal point.",
  primarySubjectOrArea: "house",
  areasToEmphasize: ["house"],
  areasToQuiet: ["trees"],
  compositionImplication: "The shoreline leads the eye toward the house.",
  colourImplication: "A warm roof contrasts with the cool distance.",
  techniqueImplication: "Practise a wet-on-dry accent on a separate sheet.",
};

test("Composition primary uses its supplied design implication instead of brush mechanics", () => {
  const result = focusedMainAdvice(
    "Use a damp brush on the trees.",
    decision,
    "Composition",
  );
  assert.equal(result.text, decision.compositionImplication);
  assert.equal(result.relatedDomain, "technique");
});
test("Technique primary does not turn a structural crop into a handling instruction", () => {
  const result = focusedMainAdvice(
    "In a new study, lower the horizon.",
    decision,
    "Watercolor technique",
  );
  assert.equal(result.text, decision.techniqueImplication);
  assert.equal(result.relatedDomain, "composition");
});
test("Colour primary prefers value/temperature guidance over a brush recipe", () => {
  const result = focusedMainAdvice(
    "Practise wet-on-wet in the distance.",
    decision,
    "Colour & contrast",
  );
  assert.equal(result.text, decision.colourImplication);
  assert.equal(result.relatedDomain, "technique");
});
test("Overall and observed effects retain valid supplied wording", () => {
  const text = "Softer tree edges keep the house visually dominant.";
  assert.deepEqual(focusedMainAdvice(text, decision, "Composition"), { text });
  assert.deepEqual(focusedMainAdvice(text, decision, "Overall feedback"), {
    text,
  });
});
test("Missing or conflicting alternative never invents an image observation", () => {
  const text = "Use a damp brush on the trees.";
  const safe = focusedMainAdvice(text, null, "Composition");
  assert.equal(safe.relatedDomain, "technique");
  assert.match(safe.text, /full note is available/i);
  const wrong = {
    ...decision,
    compositionImplication:
      "Increase contrast in the trees until they become the focal point.",
  };
  assert.equal(focusedMainAdvice(text, wrong, "Composition").text, safe.text);
});
test("Explicit saved recipes route once by domain; visible effects keep the supplied category", () => {
  assert.equal(
    guidanceDomain("Use a damp brush on the trees.", "composition"),
    "technique",
  );
  assert.equal(
    guidanceDomain("In a new study, move the house right.", "technique"),
    "composition",
  );
  assert.equal(
    guidanceDomain(
      "The muted blue distance supports the house.",
      "composition",
    ),
    "composition",
  );
});
