const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const root = path.resolve(__dirname, "..");
const modules = new Map();
function load(relative) {
  if (modules.has(relative)) return modules.get(relative);
  const exports = {};
  modules.set(relative, exports);
  const code = ts.transpileModule(
    fs.readFileSync(path.join(root, relative), "utf8"),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        jsx: ts.JsxEmit.ReactJSX,
        target: ts.ScriptTarget.ES2022,
      },
    },
  ).outputText;
  new Function("exports", "require", code)(exports, (name) => {
    if (name === "react" || name === "react/jsx-runtime") return require(name);
    if (name === "react-native")
      return {
        Text: (props) => React.createElement("span", null, props.children),
        View: (props) => React.createElement("div", null, props.children),
        StyleSheet: { create: (value) => value },
      };
    if (name === "./ui") return { styles: {}, colors: {} };
    const full = path.resolve(root, path.dirname(relative), name);
    const file = [".tsx", ".ts"]
      .map((ext) => full + ext)
      .find((f) => fs.existsSync(f));
    if (!file) throw new Error(`Unexpected import ${name}`);
    return load(path.relative(root, file));
  });
  return exports;
}
const {
  usableBrushPlan,
  isConciseBrushPlan,
  default: BrushWashPlanCard,
} = load("components/BrushWashPlanCard.tsx");
const render = (plan, props = {}) =>
  renderToStaticMarkup(
    React.createElement(BrushWashPlanCard, { plan, ...props }),
  );
const stage = {
  stage: "First sky wash",
  brush: "Large soft brush.",
  wash: "Tea-strength blue-grey.",
  technique: "wet_on_wet",
  timing: "Work while the paper has an even sheen.",
  edges: "Keep cloud edges soft; leave the light reflection open.",
  stop: "Leave it to dry before touching the darker shapes.",
};

test("brush and wash plan shows supplied handling, moisture, edges and stop cue", () => {
  const html = render([stage]);
  for (const text of [
    "Brush &amp; wash plan",
    "First sky wash",
    "Brush",
    "Wash",
    "Wet-on-wet",
    "Timing",
    "Edges",
    "Stop",
    stage.brush,
    stage.wash,
    stage.timing,
    stage.edges,
    stage.stop,
  ])
    assert(html.includes(text));
  assert(!/buy|purchase|brand|manufacturer|https?:\/\//i.test(html));
});

test("all supported techniques receive plain watercolor labels", () => {
  const html = render([
    stage,
    { ...stage, stage: "Connect the shadows", technique: "damp_on_damp" },
    { ...stage, stage: "Final focal accents", technique: "wet_on_dry" },
  ]);
  for (const label of ["Wet-on-wet", "Damp-on-damp", "Wet-on-dry"])
    assert(html.includes(label));
  assert(!html.includes("wet_on_wet"));
});

test("older saved results with no brush plan hide the optional section safely", () => {
  for (const absent of [undefined, null, [], "plan", {}, [null]]) {
    assert.deepEqual(usableBrushPlan(absent), []);
    assert.equal(render(absent), "");
  }
});

test("individual invalid stages are discarded without losing another valid stage", () => {
  const invalid = [
    { ...stage, technique: "soak_everything" },
    { ...stage, wash: null },
    { ...stage, stage: "x".repeat(61) },
    { ...stage, timing: "x".repeat(121) },
    { ...stage, stop: " " },
    { ...stage, unknown: "Unexpected field" },
    Object.fromEntries(
      Object.entries(stage).filter(([key]) => key !== "edges"),
    ),
  ];
  for (const item of invalid) {
    assert.deepEqual(usableBrushPlan([item, stage]), [stage]);
    const html = render([item, stage]);
    assert(html.includes("First sky wash"));
    assert(!html.includes("soak_everything"));
  }
});

test("brush plan bounds rendering to three supplied stages and trims safe text", () => {
  assert.equal(
    usableBrushPlan(Array.from({ length: 50 }, () => stage)).length,
    3,
  );
  const clean = usableBrushPlan([{ ...stage, brush: "  Large soft brush.  " }]);
  assert.equal(clean[0].brush, stage.brush);
  assert.equal(clean[0].stage, stage.stage);
});

test("one concise handling stage remains detectable for compact accordion summaries", () => {
  const brief = {
    stage: "Small wash study",
    brush: "Soft round brush",
    wash: "Tea-strength wash",
    technique: "wet_on_wet",
    timing: "Even paper sheen",
    edges: "Soft distance",
    stop: "Leave the light open",
  };
  assert.equal(isConciseBrushPlan([brief]), true);
  assert.equal(isConciseBrushPlan([brief, brief]), false);
  assert.equal(
    isConciseBrushPlan([
      { ...brief, brush: "x".repeat(120), wash: "x".repeat(120) },
    ]),
    false,
  );
  assert.equal(isConciseBrushPlan(undefined), false);
});

test("repeated handling notes render once without rewriting the surviving instruction", () => {
  const repeated = "Wait for the wash to dry.";
  const html = render([
    {
      ...stage,
      timing: repeated,
      edges: repeated.toUpperCase(),
      stop: repeated,
    },
  ]);
  assert.equal((html.match(/Wait for the wash to dry\./g) || []).length, 1);
  assert(!html.includes("WAIT FOR THE WASH TO DRY."));
  assert(html.includes("Timing"));
  assert(!html.includes(">Stop<"));
});

test("brush execution omits exact repeated main advice or practice while retaining distinct handling", () => {
  const advice = "Keep the sharpest marks near the small focal group.";
  const practice = "Test one connected wash on a separate sheet.";
  const html = render(
    [{ ...stage, timing: advice, edges: advice.toUpperCase(), stop: practice }],
    { omit: [advice, practice] },
  );
  assert(!html.includes(advice));
  assert(!html.includes(advice.toUpperCase()));
  assert(!html.includes(practice));
  assert(html.includes(stage.brush));
  assert(html.includes(stage.wash));
});

test("study handling uses learning framing and suppresses supplied harsh correction notes", () => {
  const html = render(
    [{ ...stage, edges: "Correct this weak edge on the current painting." }],
    { study: true },
  );
  assert(html.includes("How to practise this handling"));
  assert(
    html.includes(
      "For a separate study: a suggested way to practise this effect.",
    ),
  );
  assert(html.includes(stage.brush));
  assert(html.includes(stage.wash));
  assert(!html.includes("Correct this weak edge"));
  assert(!html.includes("Brush &amp; wash plan"));
  const nested = render([stage], { hideHeading: true });
  assert(!nested.includes("Brush &amp; wash plan"));
  assert(nested.includes("First sky wash"));
});

test("explicit new-study handling keeps useful supplied timing, edge and stop instructions", () => {
  const supplied = {
    ...stage,
    timing:
      "Wait until the first wash is dry. Let the paper settle before another layer.",
    edges:
      "Keep background edges soft; reserve firm marks for the focal group.",
    stop: "Stop after one small focal accent.",
  };
  const html = render([supplied], { study: true });
  assert(
    html.includes(
      "For a separate study: a suggested way to practise this effect.",
    ),
  );
  assert(html.includes(supplied.timing));
  assert(html.includes(supplied.edges));
  assert(html.includes(supplied.stop));
  assert(!html.includes("In a separate study,"));
  const guarded = render(
    [{ ...supplied, edges: "You should fix this weak edge." }],
    { study: true },
  );
  assert(!guarded.includes("You should fix this weak edge"));
  assert(guarded.includes(supplied.timing));
});

test("study handling retains preventive overworking stop cues without accepting diagnoses", () => {
  for (const stop of [
    "Stop before the middle wash is overworked.",
    "Stop before overworking the first wash.",
  ]) {
    const html = render([{ ...stage, stop }], { study: true });
    assert(html.includes(stop));
    assert(html.includes(">Stop<"));
  }
  for (const stop of [
    "This wash is overworked.",
    "Stop before overworking this weak edge.",
    "You should fix the overworked wash.",
  ]) {
    assert(!render([{ ...stage, stop }], { study: true }).includes(stop));
  }
});

test("brush plan describes a recommended method without claiming the original process", () => {
  const html = render([
    {
      ...stage,
      brush: "The artist used a size 8 round. Try a soft round brush.",
      timing:
        "The paper was fully wet. Work while your test sheet has an even sheen.",
      wash: "Tea-strength blue-grey.",
    },
  ]);
  assert(
    html.includes(
      "A suggested practice method, not a reconstruction of the original process.",
    ),
  );
  assert(html.includes("Try a soft round brush."));
  assert(html.includes("Work while your test sheet has an even sheen."));
  assert(html.includes("Tea-strength blue-grey."));
  assert(!html.includes("The artist used a size 8 round"));
  assert(!html.includes("The paper was fully wet"));
});

test("old original-process assertions are omitted without inventing replacement facts", () => {
  const html = render([
    {
      ...stage,
      brush: "A size 8 brush was used.",
      wash: "The painter used ultramarine.",
      timing: "The first wash was applied on wet paper.",
    },
  ]);
  assert(!html.includes("A size 8 brush was used"));
  assert(!html.includes("The painter used ultramarine"));
  assert(!html.includes("The first wash was applied"));
  assert(html.includes(stage.edges));
  assert(html.includes(stage.stop));
  assert(!html.includes("Soft round brush"));
});

test("brush density omits duplicate stages and repeated cross-section text", () => {
  const html = render(Array.from({ length: 10 }, () => stage));
  assert.equal((html.match(/First sky wash/g) || []).length, 1);
  const distinct = render(
    Array.from({ length: 5 }, (_, index) => ({
      ...stage,
      stage: `Stage ${index + 1}`,
      brush: `Soft brush for stage ${index + 1}.`,
    })),
  );
  assert.equal((distinct.match(/>Stage \d</g) || []).length, 3);
  assert(!distinct.includes("Stage 4"));
});
