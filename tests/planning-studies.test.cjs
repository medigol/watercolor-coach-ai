const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const root = path.resolve(__dirname, "..");
const loaded = new Map();
const tag =
  (name) =>
  ({ children, accessibilityRole, accessibilityLabel, style, ...props }) =>
    React.createElement(
      name,
      { role: accessibilityRole, "aria-label": accessibilityLabel },
      children,
    );
function load(file) {
  if (loaded.has(file)) return loaded.get(file);
  const exports = {};
  loaded.set(file, exports);
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
    if (name === "react") return React;
    if (name === "react/jsx-runtime") return require(name);
    if (name === "react-native")
      return { View: tag("div"), Text: tag("p"), Pressable: tag("button") };
    if (name === "react-native-svg")
      return {
        default: tag("svg"),
        Ellipse: tag("ellipse"),
        G: tag("g"),
        Line: tag("line"),
        Path: tag("path"),
        Polygon: tag("polygon"),
        Rect: tag("rect"),
        Text: tag("text"),
      };
    if (name === "./ui") return { colors: {}, styles: {} };
    if (name === "./ImageStudyThumbnail")
      return {
        default: ({ kind }) =>
          React.createElement(
            "div",
            { "data-image-study": kind },
            "Study overlay on your image · Use as a guide, not tracing",
          ),
      };
    assert(name.startsWith("."), `Unexpected import ${name}`);
    const base = path.join(path.dirname(file), name);
    const next = [base, `${base}.ts`, `${base}.tsx`].find((candidate) =>
      fs.existsSync(path.join(root, candidate)),
    );
    assert(next, `Missing import ${name}`);
    return load(next);
  });
  return exports;
}
const { planPlanningStudies } = load("lib/planningStudies.ts");
const { default: PlanningStudies, SketchValueNotes } = load(
  "components/PlanningStudies.tsx",
);
const note = (patch) => ({
  label: "Support the roof light",
  priority: "high",
  x: 10,
  y: 15,
  shortInstruction: "Keep supporting areas quiet.",
  reason: "The roof light is the focal area.",
  action: "Practise quiet support around the small focal accent.",
  ...patch,
});
const crop = note({
  type: "crop_box",
  category: "composition",
  width: 75,
  height: 70,
});
const flow = note({
  type: "eye_flow_arrow",
  category: "composition",
  points: [
    { x: 20, y: 80 },
    { x: 65, y: 35 },
  ],
});
const value = note({
  type: "value_mass",
  category: "value_structure",
  width: 35,
  height: 30,
});
const focal = note({
  type: "focal_ring",
  category: "focal_point",
  width: 15,
  height: 20,
});
const edge = note({
  type: "edge_mark",
  category: "edge_control",
  points: [
    { x: 15, y: 55 },
    { x: 45, y: 50 },
  ],
});
const quiet = note({
  type: "simplify_region",
  category: "simplification",
  width: 25,
  height: 30,
});
const input = {
  composition: "Follow one eye path along the road toward the light roof.",
  sketch: "Simplify the supporting shapes.",
  values: "Connect the middle-value shadows.",
  uri: "private-signed-image",
  provider: "openai",
  overlays: [crop, flow, value, focal, edge, quiet],
};
const decision = {
  primaryGoal: "Keep the pavilion quiet so the boats carry the focal contrast.",
  primarySubjectOrArea: "pavilion",
  areasToEmphasize: ["boats"],
  areasToQuiet: ["pavilion"],
  currentPaintingAction: null,
  nextStudyAction:
    "In a separate study, mute the pavilion and retain one small boat accent.",
  supportingObservations: [],
  compositionImplication: null,
  colourImplication: null,
  techniqueImplication: null,
};

test("unified planning prefers relevant validated image studies and caps the combined systems", () => {
  for (const focus of [
    "Overall feedback",
    "Composition",
    "Colour & contrast",
    "Watercolor technique",
  ]) {
    const studies = planPlanningStudies({ ...input, focus });
    assert(studies.length >= 2 && studies.length <= 3, focus);
    assert.equal(
      studies.filter((study) => study.source === "image").length,
      2,
      focus,
    );
    assert(studies.filter((study) => study.type === "model").length <= 1);
    assert(
      studies
        .slice(0, 2)
        .every(
          (study) => study.type === "thumbnail" && study.source === "image",
        ),
    );
    assert.deepEqual(studies, planPlanningStudies({ ...input, focus }));
  }
});

test("the same controlled guidance ranks eye path, value, and edge studies differently by focus", () => {
  assert.equal(
    planPlanningStudies({ ...input, focus: "Composition" })[0].study.kind,
    "eye_flow",
  );
  assert.equal(
    planPlanningStudies({ ...input, focus: "Colour & contrast" })[0].study.kind,
    "value_mass",
  );
  assert.equal(
    planPlanningStudies({ ...input, focus: "Watercolor technique" })[0].study
      .kind,
    "edge_control",
  );
});

test("a generic model is omitted when its teaching idea is already covered", () => {
  const studies = planPlanningStudies({
    ...input,
    focus: "Colour & contrast",
    overlays: [value, focal],
    composition: "Connect related shadows.",
    sketch: "",
    values: "",
  });
  assert.equal(studies.length, 2);
  assert(studies.every((study) => study.type === "thumbnail"));
});

test("overall prioritises stronger saved evidence over a lower-priority structural variation", () => {
  const studies = planPlanningStudies({
    ...input,
    focus: "Overall feedback",
    overlays: [{ ...crop, priority: "low" }, focal],
  });
  assert.equal(studies[0].study.kind, "focal_point");
});

test("old, mock, unavailable-image, and malformed-geometry results keep honest bounded fallbacks", () => {
  for (const patch of [
    { provider: "mock" },
    { provider: undefined },
    { uri: undefined },
    { overlays: [note({ type: "crop_box", width: 99, height: 99 })] },
    { overlays: undefined, composition: "", sketch: "", values: "" },
  ]) {
    const props = { ...input, ...patch };
    const studies = planPlanningStudies(props);
    assert(studies.length >= 2 && studies.length <= 3);
    assert(studies.every((study) => study.source === "generic"));
    const html = renderToStaticMarkup(
      React.createElement(PlanningStudies, props),
    );
    assert(!html.includes("Study overlay on your image"));
    assert(!html.includes("private-signed-image"));
    assert(html.includes("Generic study aid · adapt it to your painting."));
    assert(
      !/generated from|Rendered reference|Exact match|Edited image/.test(html),
    );
  }
});

test("the production planning section unifies captions and never repeats full sketch/value notes", () => {
  const props = {
    ...input,
    overlays: [crop, flow],
    composition: "Try an off-centre focal group.",
    sketch: "Legacy full sketch instructions remain accessible elsewhere.",
    values: "Legacy full value instructions remain accessible elsewhere.",
  };
  const html = renderToStaticMarkup(
    React.createElement(PlanningStudies, props),
  );
  assert.equal((html.match(/data-image-study=/g) ?? []).length, 2);
  assert.equal(
    (html.match(/Teaching model · not an exact copy of your painting\./g) ?? [])
      .length,
    1,
  );
  assert(!html.includes("Thumbnail planning"));
  assert(!html.includes("Composition model"));
  assert(!html.includes(props.sketch));
  assert(!html.includes(props.values));
  const notes = renderToStaticMarkup(
    React.createElement(SketchValueNotes, props),
  );
  assert(notes.includes(props.sketch));
  assert(notes.includes(props.values));
  assert.equal(
    renderToStaticMarkup(
      React.createElement(SketchValueNotes, { sketch: "", values: "" }),
    ),
    "",
  );
});

test("strong-work studies are framed as optional variations", () => {
  const html = renderToStaticMarkup(
    React.createElement(PlanningStudies, { ...input, study: true }),
  );
  assert(html.includes("Optional study variation"));
  assert(!/Main issue|Try now|Fix this painting/.test(html));
});

test("canonical direction replaces conflicting study actions without inventing advice or marks", () => {
  const props = {
    ...input,
    coachingDecision: decision,
    overlays: [{ ...focal, action: "Sharpen the pavilion." }],
  };
  const cards = planPlanningStudies(props);
  const focused = cards.find(
    (card) => card.type === "thumbnail" && card.study.kind === "focal_point",
  );
  assert(focused);
  assert.equal(focused.study.action, decision.nextStudyAction);
  assert.equal(focused.study.marks.length, 0);
  assert.equal(focused.source, "generic");
  const html = renderToStaticMarkup(
    React.createElement(PlanningStudies, props),
  );
  assert(!html.includes("Sharpen the pavilion"));
  assert(html.includes(decision.nextStudyAction));
  const neutral = planPlanningStudies({
    ...props,
    coachingDecision: { ...decision, nextStudyAction: null },
  }).find(
    (card) => card.type === "thumbnail" && card.study.kind === "focal_point",
  );
  assert.equal(
    neutral.study.action,
    "Compare this layout with your coaching goal in a separate study.",
  );
});

test("a generic teaching model that contradicts the named canonical target is omitted", () => {
  const cards = planPlanningStudies({
    ...input,
    overlays: [],
    composition: "Sharpen the pavilion as an off-centre focal point.",
    coachingDecision: decision,
  });
  assert(cards.every((card) => card.type !== "model"));
});

test("a known distinct sub-area remains usable and older missing metadata keeps existing planning", () => {
  const action = "Sharpen the pavilion roof.";
  const props = {
    ...input,
    overlays: [{ ...focal, action }],
    coachingDecision: decision,
  };
  const focused = planPlanningStudies(props).find(
    (card) => card.type === "thumbnail" && card.study.kind === "focal_point",
  );
  assert.equal(focused.study.action, action);
  assert.equal(focused.source, "image");
  const withInvalid = planPlanningStudies({
    ...input,
    coachingDecision: { primaryGoal: "Incomplete old metadata" },
  });
  assert.deepEqual(withInvalid, planPlanningStudies(input));
});

test("unifying planning adds no image processing, calls, secrets, or writes", () => {
  for (const file of [
    "lib/planningStudies.ts",
    "components/PlanningStudies.tsx",
  ]) {
    const source = fs.readFileSync(path.join(root, file), "utf8");
    assert(
      !/fetch\s*\(|functions\.invoke|api\.openai|canvas|getImageData|process\.env|\.insert\(|\.rpc\(/.test(
        source,
      ),
    );
  }
});
