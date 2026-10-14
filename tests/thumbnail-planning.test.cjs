const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const root = path.resolve(__dirname, "..");

function load(relative, mocks = {}) {
  const exports = {};
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
    assert(name in mocks, `Unexpected import ${name}`);
    return mocks[name];
  });
  return exports;
}
const overlay = load("lib/overlays.ts");
const presentation = load("lib/coachingPresentation.ts", {
  "./overlays": overlay,
});
const planning = load("lib/thumbnailPlanning.ts", {
  "./overlays": overlay,
  "./coachingPresentation": presentation,
});
const empty = { composition: "", sketch: "", values: "" };
const note = (patch = {}) => ({
  type: "point_marker",
  label: "Keep the focal area clear",
  x: 30,
  y: 40,
  priority: "high",
  shortInstruction: "Leave space around the main shape.",
  reason: "The eye needs one clear place to rest.",
  action:
    "Keep the supporting marks quiet and save a sharp accent for the focal area.",
  ...patch,
});

test("unknown subject and legacy text-only results use two useful studies", () => {
  const result = planning.planThumbnailStudies(empty);
  assert.deepEqual(
    result.map((item) => item.kind),
    ["big_shapes", "value_mass"],
  );
  assert(result.every((item) => item.layout === "abstract"));
  assert(result.every((item) => item.purpose && item.action));
  assert.equal(
    planning.planThumbnailStudies({ ...empty, overlays: null }).length,
    2,
  );
  assert.equal(
    planning.planThumbnailStudies({ ...empty, overlays: { bad: true } }).length,
    2,
  );
});

test("validated crop, values and simplification select exactly three relevant worksheets", () => {
  const result = planning.planThumbnailStudies({
    ...empty,
    title: "Coastal landscape",
    overlays: [
      note({
        type: "crop_box",
        width: 45,
        height: 40,
        category: "composition",
        action: "Test a tighter lower edge in the next small study.",
      }),
      note({
        type: "value_mass",
        width: 30,
        height: 35,
        category: "value_structure",
        action: "Connect the foreground shadows in one damp wash.",
      }),
      note({
        type: "simplify_region",
        width: 35,
        height: 20,
        category: "simplification",
        action: "Reduce the small background marks to one middle-value wash.",
      }),
    ],
  });
  assert.deepEqual(
    result.map((item) => item.kind),
    ["crop", "value_mass", "simplification"],
  );
  assert(result.every((item) => item.layout === "landscape"));
  assert.equal(
    result[0].action,
    "Test a tighter lower edge in the next small study.",
  );
  assert.equal(
    result[1].action,
    "Connect the foreground shadows in one damp wash.",
  );
});

test("eye-flow/horizon and legacy categories choose instructional composition studies", () => {
  const result = planning.planThumbnailStudies({
    ...empty,
    values: "Group light, middle, and dark.",
    overlays: [
      note({
        type: "eye_flow_arrow",
        category: "composition",
        points: [
          { x: 20, y: 70 },
          { x: 70, y: 35 },
        ],
      }),
      note({
        type: "composition_line",
        category: "composition",
        styleHint: "horizon",
        points: [
          { x: 10, y: 35 },
          { x: 90, y: 35 },
        ],
      }),
    ],
  });
  assert.deepEqual(
    result.map((item) => item.kind),
    ["eye_flow", "horizon", "value_mass"],
  );
  const legacy = planning.planThumbnailStudies({
    ...empty,
    overlays: [note({ type: "composition_crop", width: 40, height: 30 })],
  });
  assert.equal(legacy[0].kind, "crop");
});

test("text cues are conservative, deterministic, and bounded to three cards", () => {
  const input = {
    composition: "Test a crop and a leading line along the shoreline.",
    sketch: "Simplify supporting detail.",
    values: "Connect middle-value shadows.",
    title: "Beach study",
  };
  const result = planning.planThumbnailStudies(input);
  assert.deepEqual(result, planning.planThumbnailStudies(input));
  assert.equal(result.length, 3);
  assert.equal(result[0].kind, "crop");
  assert.equal(
    planning.thumbnailLayout({ ...empty, title: "Street with buildings" }),
    "street",
  );
  assert.equal(
    planning.thumbnailLayout({ ...empty, title: "Lake House" }),
    "landscape",
  );
  assert.equal(
    planning.thumbnailLayout({ ...empty, title: "Quiet scene" }),
    "abstract",
  );
  assert.equal(
    planning.thumbnailLayout({
      composition: null,
      sketch: undefined,
      values: 40,
    }),
    "abstract",
  );
});

test("invalid optional metadata cannot manufacture a planning action or hide fallback studies", () => {
  const input = {
    ...empty,
    overlays: [
      note({
        type: "crop_box",
        width: 30,
        height: 30,
        category: "unknown_category",
      }),
      note({
        action: "x".repeat(351),
        type: "value_mass",
        width: 30,
        height: 20,
      }),
      { type: "crop_box", x: 20, y: 20 },
    ],
  };
  assert.deepEqual(
    planning.planThumbnailStudies(input),
    planning.planThumbnailStudies(empty),
  );
});

test("templates use semantic advice but never copy saved image geometry", () => {
  const first = {
    ...empty,
    overlays: [note({ type: "crop_box", x: 5, y: 5, width: 50, height: 40 })],
  };
  const second = {
    ...empty,
    overlays: [note({ type: "crop_box", x: 20, y: 30, width: 70, height: 65 })],
  };
  assert.deepEqual(
    planning.planThumbnailStudies(first),
    planning.planThumbnailStudies(second),
  );
});

function element(tag) {
  return ({
    children,
    accessible,
    accessibilityRole,
    accessibilityLabel,
    accessibilityState,
    onPress,
    style,
    ...props
  }) =>
    React.createElement(
      tag,
      {
        ...props,
        role: accessibilityRole,
        "aria-label": accessibilityLabel,
        ...(tag === "div" ? {} : { style }),
      },
      children,
    );
}
const Component = load("components/ThumbnailPlanning.tsx", {
  react: React,
  "react/jsx-runtime": require("react/jsx-runtime"),
  "react-native": {
    View: element("div"),
    Text: element("p"),
    Pressable: element("button"),
  },
  "react-native-svg": {
    default: element("svg"),
    Ellipse: element("ellipse"),
    G: element("g"),
    Line: element("line"),
    Path: element("path"),
    Polygon: element("polygon"),
    Rect: element("rect"),
    Text: element("text"),
  },
  "../lib/thumbnailPlanning": planning,
  "./ImageStudyThumbnail": { default: () => null },
  "./ui": { colors: { accent: "#236963", ink: "#253C3C" }, styles: {} },
}).default;
const render = (input) =>
  renderToStaticMarkup(React.createElement(Component, input));

test("full legacy and saved sketch/value guidance stays available in the expandable notes", () => {
  const samples = load("data/mockResults.ts");
  for (const input of [
    samples.improveResult,
    samples.referenceResult,
    {
      composition: "Preserve one light group.",
      sketch: "Keep the two distant roofs as one shape; leave the gap open.",
      values: "Connect the foreground shadows before the wash loses its shine.",
    },
  ]) {
    let expanded;
    const jsx = {
      jsx: (type, props) => ({ type, props }),
      jsxs: (type, props) => ({ type, props }),
      Fragment: "Fragment",
    };
    const Notes = load("components/ThumbnailPlanning.tsx", {
      react: {
        useState: (initial) => {
          expanded ??= initial;
          return [
            expanded,
            (value) => {
              expanded = typeof value === "function" ? value(expanded) : value;
            },
          ];
        },
      },
      "react/jsx-runtime": jsx,
      "react-native": { View: "View", Text: "Text", Pressable: "Pressable" },
      "react-native-svg": {},
      "../lib/thumbnailPlanning": planning,
      "./ImageStudyThumbnail": { default: "ImageStudyThumbnail" },
      "./ui": { colors: {}, styles: {} },
    }).default;
    function nodes(tree) {
      if (!tree || typeof tree !== "object") return [];
      return [tree, ...[tree.props?.children].flat(Infinity).flatMap(nodes)];
    }
    function text(tree) {
      return nodes(tree)
        .filter((node) => node.type === "Text")
        .flatMap((node) => [node.props.children].flat(Infinity))
        .filter((value) => typeof value === "string");
    }
    const button = (tree) =>
      nodes(tree).find(
        (node) => node.props?.accessibilityLabel === "Sketch & value notes",
      );
    let tree = Notes(input);
    const diagramCount = nodes(tree).filter((node) => node.props?.kind).length;
    assert(diagramCount >= 2 && diagramCount <= 3);
    assert.equal(button(tree).props["aria-expanded"], false);
    assert.equal(button(tree).props.accessibilityState.expanded, false);
    assert(!text(tree).includes(input.sketch));
    button(tree).props.onPress();
    tree = Notes(input);
    assert.equal(button(tree).props["aria-expanded"], true);
    assert.equal(button(tree).props.accessibilityState.expanded, true);
    assert(text(tree).includes("Your sketch plan"));
    assert(text(tree).includes("Your value plan"));
    assert(text(tree).includes(input.sketch));
    assert(text(tree).includes(input.values));
    assert.equal(
      nodes(tree).filter((node) => node.props?.kind).length,
      diagramCount,
    );
    button(tree).props.onPress();
    tree = Notes(input);
    assert.equal(button(tree).props["aria-expanded"], false);
    assert(!text(tree).includes(input.values));
  }
});

test("missing sketch/value guidance does not show an empty expandable control", () => {
  const html = render(empty);
  assert(!html.includes("Sketch &amp; value notes"));
  const withNotes = render({ ...empty, sketch: "Keep the large shapes open." });
  assert(withNotes.includes("Sketch &amp; value notes"));
  assert(withNotes.includes('aria-expanded="false"'));
});

test("legacy/mock results render honest diagrams and clear purposes without new image outputs", () => {
  const html = render(empty);
  assert(html.includes("Thumbnail planning"));
  assert(
    html.includes(
      "Use these small studies to test composition and values before painting.",
    ),
  );
  assert.equal((html.match(/<svg\b/g) ?? []).length, 2);
  assert.equal((html.match(/Adapt this to your image/g) ?? []).length, 2);
  assert(html.includes("Big-shape plan"));
  assert(html.includes("Value mass study"));
  assert(html.includes("Plan the painting as big shapes first."));
  assert(html.includes("Group values; do not copy detail."));
  assert(html.includes("#E1E7DC"));
  assert(html.includes("#A9B4A7"));
  assert(
    !/<img\b|generated from|AI painting|Exact plan|Rendered reference/i.test(
      html,
    ),
  );
});

test("all template types render meaningful frame, arrow, value, merge and horizon diagrams", () => {
  const cases = [
    { ...empty, composition: "Test a crop." },
    {
      ...empty,
      composition: "Use a leading line along this street perspective.",
    },
    { ...empty, sketch: "Simplify secondary detail." },
    { ...empty, composition: "Test the shoreline horizon.", title: "Beach" },
  ];
  const html = cases.map(render).join(" ");
  for (const text of [
    "Crop study",
    "Eye-flow study",
    "Simplification study",
    "Horizon placement study",
    "Many marks",
    "One wash",
    "More sky",
    "More ground",
  ])
    assert(html.includes(text), text);
  assert(html.includes('stroke-dasharray="6 4"'));
  assert(html.includes('stroke-dasharray="5 3"'));
  assert(html.includes("One clear path toward the focal area"));
});

test("planning is local SVG rendering without extra analysis requests or secrets", () => {
  for (const file of [
    "lib/thumbnailPlanning.ts",
    "components/ThumbnailPlanning.tsx",
  ]) {
    const source = fs.readFileSync(path.join(root, file), "utf8");
    assert(
      !/fetch\s*\(|functions\.invoke|api\.openai|canvas|process\.env|image\/|\/images\//.test(
        source,
      ),
    );
  }
});
