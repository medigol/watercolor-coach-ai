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
const models = load("lib/compositionModels.ts", { "./overlays": overlays });
const presentation = load("lib/coachingPresentation.ts", {
  "./overlays": overlays,
});
const input = { composition: "", values: "" };
const note = (patch = {}) => ({
  type: "point_marker",
  x: 30,
  y: 40,
  priority: "high",
  label: "Support one focal group",
  shortInstruction: "Keep the strongest contrast near the figures.",
  reason: "This gives the viewer one clear place to look.",
  action: "Quiet the supporting edges and save sharp marks for the focal area.",
  ...patch,
});

test("small static library covers all requested design ideas with short practical teaching fields", () => {
  assert.equal(models.compositionModelIds.length, 15);
  assert.equal(new Set(models.compositionModelIds).size, 15);
  for (const id of models.compositionModelIds) {
    const model = models.compositionModelLibrary[id];
    for (const field of [
      "name",
      "whenToUse",
      "application",
      "action",
      "description",
    ]) {
      assert.equal(typeof model[field], "string", `${id}/${field}`);
      assert(
        model[field].length > 10 && model[field].length <= 180,
        `${id}/${field}`,
      );
    }
  }
});

test("uncertain or invalid optional saved metadata uses two conservative instructor models", () => {
  const fallback = models.selectCompositionModels(input);
  assert.deepEqual(
    fallback.map((model) => model.id),
    ["big_shapes", "off_center"],
  );
  for (const invalid of [
    undefined,
    null,
    {},
    [{ type: "other" }],
    [note({ category: "unknown" })],
  ]) {
    assert.deepEqual(
      models.selectCompositionModels({ ...input, overlays: invalid }),
      fallback,
    );
  }
  assert.deepEqual(
    models.selectCompositionModels({ composition: undefined, values: 15 }),
    fallback,
  );
});

test("clear teaching phrases choose relevant model ideas, never more than two", () => {
  const cases = {
    s_curve: "Try a winding S-curve eye path.",
    diagonal: "Use one diagonal movement.",
    l_foreground: "Test an L-shaped foreground.",
    high_horizon: "Try a higher horizon.",
    low_horizon: "Try a lower horizon.",
    dominant_foreground: "Test one dominant foreground mass.",
    off_center: "Keep an off-centre focal point.",
    triangle: "Use a loose triangle grouping.",
    frame_in_frame: "Test a frame within a frame.",
    big_light_dark: "Preserve a big light shape with a small dark accent.",
    connected_shadow: "Connect related shadows.",
    quiet_background: "Keep a quiet background and a sharp focal area.",
    lead_in: "Follow the road perspective.",
    supporting_masses: "Balance a focal group with supporting masses.",
    big_shapes: "Start with big shapes.",
  };
  for (const [expected, composition] of Object.entries(cases)) {
    const selected = models.selectCompositionModels({ ...input, composition });
    assert(
      selected.some((model) => model.id === expected),
      expected,
    );
    assert(selected.length >= 1 && selected.length <= 2);
    assert.deepEqual(
      selected,
      models.selectCompositionModels({ ...input, composition }),
    );
  }
  const selected = models.selectCompositionModels({
    composition: Object.values(cases).join(" "),
    values: "",
  });
  assert.equal(selected.length, 2);
});

test("valid categories keep an application note while template geometry stays independent", () => {
  const saved = note({
    type: "value_mass",
    category: "value_structure",
    width: 35,
    height: 30,
  });
  const selected = models.selectCompositionModels({
    ...input,
    overlays: [saved],
  });
  assert.equal(selected[0].id, "connected_shadow");
  assert.equal(selected[0].application, saved.shortInstruction);
  assert(!("x" in selected[0]));
  assert(!("points" in selected[0]));
  assert(!("uri" in selected[0]));
  const changed = note({ ...saved, x: 5, y: 5, width: 50, height: 40 });
  assert.deepEqual(
    models.selectCompositionModels({ ...input, overlays: [changed] }),
    selected,
  );
});

test("high-confidence broad arrow/horizon directions choose ideas without exact-position claims", () => {
  const arrow = note({
    type: "eye_flow_arrow",
    category: "composition",
    points: [
      { x: 10, y: 80 },
      { x: 40, y: 60 },
      { x: 65, y: 35 },
    ],
  });
  assert.equal(
    models.selectCompositionModels({ ...input, overlays: [arrow] })[0].id,
    "diagonal",
  );
  const winding = note({
    ...arrow,
    points: [
      { x: 10, y: 85 },
      { x: 50, y: 65 },
      { x: 20, y: 45 },
      { x: 60, y: 25 },
    ],
  });
  assert.equal(
    models.selectCompositionModels({ ...input, overlays: [winding] })[0].id,
    "s_curve",
  );
  const high = note({
    type: "composition_line",
    category: "composition",
    styleHint: "horizon",
    points: [
      { x: 5, y: 25 },
      { x: 95, y: 25 },
    ],
  });
  assert.equal(
    models.selectCompositionModels({ ...input, overlays: [high] })[0].id,
    "high_horizon",
  );
  const low = {
    ...high,
    points: [
      { x: 5, y: 75 },
      { x: 95, y: 75 },
    ],
  };
  assert.equal(
    models.selectCompositionModels({ ...input, overlays: [low] })[0].id,
    "low_horizon",
  );
  const weak = {
    ...high,
    points: [
      { x: 50, y: 25 },
      { x: 51, y: 30 },
    ],
  };
  assert(
    !models
      .selectCompositionModels({ ...input, overlays: [weak] })
      .some((model) => model.id === "high_horizon"),
  );
});

function element(tag) {
  return ({
    children,
    accessible,
    accessibilityRole,
    accessibilityLabel,
    style,
    ...props
  }) =>
    React.createElement(
      tag,
      { ...props, role: accessibilityRole, "aria-label": accessibilityLabel },
      children,
    );
}
const component = load("components/CompositionModels.tsx", {
  "react/jsx-runtime": require("react/jsx-runtime"),
  "react-native": { View: element("div"), Text: element("p") },
  "react-native-svg": {
    default: element("svg"),
    Ellipse: element("ellipse"),
    G: element("g"),
    Line: element("line"),
    Path: element("path"),
    Polygon: element("polygon"),
    Rect: element("rect"),
  },
  "../lib/compositionModels": models,
  "../lib/coachingPresentation": presentation,
  "./ui": {
    styles: {},
    colors: { accent: "#236963", ochre: "#B38A50", ink: "#253C3C" },
  },
});

test("every model renders an instructional SVG with human image label and explicitly decorative SVG", () => {
  const diagrams = new Set();
  for (const id of models.compositionModelIds) {
    const html = renderToStaticMarkup(
      React.createElement(component.CompositionModelDiagram, { model: id }),
    );
    assert(html.includes('role="image"'));
    assert(
      html.includes(`aria-label="${models.compositionModelLibrary[id].name}:`),
    );
    assert(html.includes('aria-hidden="true"'));
    assert(html.includes("Instructor thumbnail; use this as a planning idea."));
    assert(!html.includes("<text"));
    assert(!html.includes("<img"));
    assert(
      (html.match(/<path\b|<polygon\b|<ellipse\b|<line\b|<rect\b/g) ?? [])
        .length >= 4,
      id,
    );
    diagrams.add(html);
  }
  assert.equal(diagrams.size, 15);
});

test("composition section uses honest teaching labels and concise use/application/action", () => {
  const html = renderToStaticMarkup(
    React.createElement(component.default, {
      ...input,
      composition: "Use one diagonal movement.",
    }),
  );
  for (const text of [
    "Composition model",
    "Diagonal movement",
    "When to use it",
    "Relate to your study",
    "Instructor thumbnail · Use this as a planning idea",
    "For your study: Use one diagonal movement.",
  ])
    assert(html.includes(text));
  assert.equal((html.match(/<svg\b/g) ?? []).length, 1);
  assert(
    !/Generated from your image|Exact match|AI painting|Rendered reference/.test(
      html,
    ),
  );
});

test("composition teaching is local and includes no datasets, pixel operations or extra analysis request", () => {
  for (const file of [
    "lib/compositionModels.ts",
    "components/CompositionModels.tsx",
  ]) {
    const source = fs.readFileSync(path.join(root, file), "utf8");
    assert(
      !/fetch\s*\(|functions\.invoke|api\.openai|canvas|process\.env|https?:|<Image\b|<img\b/.test(
        source,
      ),
    );
  }
});
