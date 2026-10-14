const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const root = path.resolve(__dirname, "..");
const source = fs.readFileSync(
  path.join(root, "components/BrushWashPlanCard.tsx"),
  "utf8",
);
const exportsForTest = {};
const code = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    jsx: ts.JsxEmit.ReactJSX,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText;
new Function("exports", "require", code)(exportsForTest, (name) => {
  if (name === "react" || name === "react/jsx-runtime") return require(name);
  if (name === "react-native")
    return {
      Text: (props) => React.createElement("span", null, props.children),
      View: (props) => React.createElement("div", null, props.children),
      StyleSheet: { create: (value) => value },
    };
  if (name === "./ui") return { styles: {}, colors: {} };
  throw new Error(`Unexpected import ${name}`);
});
const { usableBrushPlan, default: BrushWashPlanCard } = exportsForTest;
const render = (plan) =>
  renderToStaticMarkup(React.createElement(BrushWashPlanCard, { plan }));
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
