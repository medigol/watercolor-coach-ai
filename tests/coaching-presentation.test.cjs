const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const root = path.resolve(__dirname, "..");
function load(file, mocks = {}) {
  const exports = {};
  const code = ts.transpileModule(
    fs.readFileSync(path.join(root, file), "utf8"),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        jsx: ts.JsxEmit.ReactJSX,
        target: ts.ScriptTarget.ES2022,
      },
    },
  ).outputText;
  new Function("exports", "require", code)(exports, (name) => {
    assert(name in mocks, `Unexpected import ${name}`);
    return mocks[name];
  });
  return exports;
}
const overlays = load("lib/overlays.ts");
const presentation = load("lib/coachingPresentation.ts", {
  "./overlays": overlays,
});
const note = (patch = {}) => ({
  type: "point_marker",
  label: "Compare this value group",
  x: 30,
  y: 40,
  priority: "high",
  shortInstruction: "Observe the relationship with nearby light shapes.",
  reason: "A connected middle value supports the focal light.",
  action: "Stop adding detail to the outer foreground.",
  timing: "current_painting",
  ...patch,
});

test("study presentation keeps supplied observations and optional ideas without forced criticism", () => {
  const observation = "The reserved light connects the sky and reflection.";
  assert.equal(presentation.studyText(observation), observation);
  assert.equal(
    presentation.studyText(
      `The main issue is the foreground. ${observation} Correct this weak shape.`,
    ),
    observation,
  );
  const optional =
    "One possible variation would be to test a lower horizon on a separate sheet.";
  assert.equal(presentation.studyText(optional), optional);
  assert.equal(
    presentation.studyText(
      "The painting is too busy. You should fix this.",
      "",
    ),
    "",
  );
  assert.equal(
    presentation.studyText("For your study: Move the house to the right.", ""),
    "",
  );
  assert.equal(presentation.studyText(null, ""), "");
  assert.equal(
    presentation.studyText("Correct this."),
    "Use this as a study of painting decisions and optional variations on a separate sheet.",
  );
  assert(
    !presentation.studyText("Fix the painting.").includes("This painting"),
  );
});

test("one-sentence summaries and exact dedupe preserve separate useful details", () => {
  const paragraph =
    "Keep one clear focal accent. Test a soft supporting wash. Stop before adding detail.";
  assert.equal(
    presentation.conciseText(paragraph),
    "Keep one clear focal accent.",
  );
  assert.equal(
    presentation.conciseText(paragraph, 2),
    "Keep one clear focal accent. Test a soft supporting wash.",
  );
  assert.equal(presentation.conciseText(null), "");
  assert.deepEqual(
    presentation.uniqueGuidance(
      [
        "Sky wash is soft.",
        " SKY WASH IS SOFT! ",
        "The focal edge is sharper.",
        null,
      ],
      ["sky wash is soft"],
    ),
    ["The focal edge is sharper."],
  );
  assert.deepEqual(
    presentation.uniqueGuidance(["Keep one accent.", "Keep one warm accent."]),
    ["Keep one accent.", "Keep one warm accent."],
  );
});

test("spacing, horizon, big-shape and value redesign can never be current-painting commands", () => {
  for (const action of [
    "Increase spacing between the figures.",
    "Change the horizon placement.",
    "Simplify the large background mass.",
    "Merge the major shadow shapes.",
    "Redesign the value masses.",
    "Reduce the foreground proportion.",
    "Move the house closer to the centre.",
    "Test a different crop.",
  ]) {
    assert(presentation.requiresNewStudy(action), action);
    assert.equal(presentation.currentActionSafe(action), false, action);
    assert.equal(presentation.coachingTiming(note({ action })), "next_study");
    const guidance = presentation.compositionGuidance({
      decision: { tryNow: action },
      mainAdvice: "One focal decision.",
      composition: "Test the next arrangement.",
    });
    assert(!guidance.tryNow.includes(action));
    assert.equal(guidance.nextStudy, action);
  }
});

test("known modest safe actions stay current; unknown/risky commands use cautious scrap guidance", () => {
  for (const action of [
    "Stop adding detail to the outer foreground.",
    "Soften one edge if the paper is still damp.",
    "Reduce the contrast with a light glaze if practical.",
    "Connect small shadows carefully after testing on scrap.",
    "Sharpen one small focal accent.",
    "Test the wash on scrap before touching the painting.",
  ])
    assert(presentation.currentActionSafe(action), action);
  for (const action of [
    "Improve the brushwork everywhere.",
    "Scrub away the foreground.",
    "Soften one edge if damp and darken the entire foreground.",
    "Rewet the dry glaze repeatedly.",
    "Lift the main subject out.",
  ]) {
    assert.equal(presentation.currentActionSafe(action), false, action);
    const guidance = presentation.compositionGuidance({
      decision: { tryNow: action },
      mainAdvice: "One focal decision.",
      composition: "Test an optional variation.",
    });
    assert(guidance.tryNow.includes("scrap paper"));
    assert(!guidance.tryNow.includes(action));
    assert.notEqual(
      presentation.timingLabel(note({ action })),
      "Try now on this painting",
    );
  }
});

test("composition fallback refers to main priority instead of duplicating its paragraph", () => {
  const mainAdvice = "Keep one focal accent beside the reserved light.";
  const guidance = presentation.compositionGuidance({
    mainAdvice,
    composition: "Try a quieter design.",
  });
  assert.equal(guidance.mainIssue, "See the main priority above.");
  assert.notEqual(guidance.mainIssue, mainAdvice);
});

function element(tag) {
  return ({ children }) => React.createElement(tag, null, children);
}
const Decision = load("components/CompositionDecisionCard.tsx", {
  "react/jsx-runtime": require("react/jsx-runtime"),
  "react-native": { Text: element("p"), View: element("div") },
  "../lib/coachingPresentation": presentation,
  "./ui": { colors: {}, styles: {} },
}).default;
test("explicit study composition shows learning labels and omits contradictory legacy corrections", () => {
  const html = renderToStaticMarkup(
    React.createElement(Decision, {
      study: true,
      mainAdvice: "The main issue is the foreground.",
      composition: "Correct the house placement.",
      decision: {
        mainIssue: "The main issue is the house.",
        reason: "This weakens the painting.",
        tryNow: "Move the house right.",
        nextStudy: "You should fix this.",
      },
      overlays: [note({ reason: "This weakens the painting." })],
    }),
  );
  for (const label of [
    "Observe this decision",
    "Study this effect",
    "Optional next study variation",
  ])
    assert(html.includes(label));
  assert(
    !/Main issue|Try now on this painting|weakens the painting|should fix|Move the house/.test(
      html,
    ),
  );
});
test("legacy constructive composition retains normal labels and safe source instructions", () => {
  const html = renderToStaticMarkup(
    React.createElement(Decision, {
      mainAdvice: "One focal decision.",
      composition: "Crop the foreground in the next study.",
      decision: {
        mainIssue: "The outer marks pull the eye away.",
        reason: "The focal contrast needs room to read.",
        tryNow: "Stop adding detail to the outer foreground.",
      },
    }),
  );
  for (const label of [
    "Main issue",
    "Why it matters",
    "Try now on this painting",
    "Try in the next study",
  ])
    assert(html.includes(label));
  assert(html.includes("Stop adding detail to the outer foreground."));
});

test("gerund structural advice cannot inherit current-painting timing from a safe clause", () => {
  for (const action of [
    "Consider moving the house to the right.",
    "Try repositioning the figures closer together.",
    "Consider changing the spacing between buildings.",
    "Test lowering the horizon in another thumbnail.",
    "Soften one edge if possible while moving the house to the right.",
    "Keep one focal accent small while redesigning the value masses.",
    "Soften one edge if possible while removing the boat.",
    "Consider resizing the roof in another study.",
    "Keep one focal accent small while widening the spacing between boats.",
  ]) {
    assert(presentation.requiresNewStudy(action), action);
    assert(!presentation.currentActionSafe(action), action);
    const supplied = note({ action, timing: "current_painting" });
    assert.equal(presentation.coachingTiming(supplied), "next_study");
    const decision = presentation.compositionGuidance({
      mainAdvice: "One priority.",
      composition: "A separate study.",
      decision: { tryNow: action },
    });
    assert(!decision.tryNow.includes(action));
    assert.equal(decision.nextStudy, action);
  }
  assert(
    !presentation.requiresNewStudy(
      "The eye is moving along the shoreline toward the house.",
    ),
  );
  assert(
    presentation.currentActionSafe(
      "Soften the distant edge after testing on scrap paper.",
    ),
  );
});
