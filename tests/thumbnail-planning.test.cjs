const { loadShared } = require("./helpers/shared-loader.cjs");
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
    if (!(name in mocks)) return loadShared(name, relative);
    return mocks[name];
  });
  return exports;
}
const overlay = load("lib/overlays.ts");
const presentation = load("lib/coachingPresentation.ts", {
  "./overlays": overlay,
});
const drawing = load("lib/overlayDrawing.ts", {
  "./overlays": overlay,
  "./imageGeometry": loadShared(
    "../shared/imageGeometry",
    "lib/overlayDrawing.ts",
  ),
});
const planning = load("lib/thumbnailPlanning.ts", {
  "./overlays": overlay,
  "./coachingPresentation": presentation,
  "./overlayDrawing": drawing,
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
    "In a separate study, test quiet supporting marks around one focal accent.",
  ...patch,
});

test("missing evidence does not manufacture worksheets", () => {
  for (const overlays of [undefined, null, { bad: true }])
    assert.deepEqual(planning.planThumbnailStudies({ ...empty, overlays }), []);
});

test("validated crop, values and simplification select at most two supported worksheets", () => {
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
        action: "Test connected foreground shadows in a separate wash study.",
      }),
      note({
        type: "simplify_region",
        width: 35,
        height: 20,
        category: "simplification",
        action: "In a separate study, test one connected background shape.",
      }),
    ],
  });
  assert.deepEqual(
    result.map((item) => item.kind),
    ["crop", "value_mass"],
  );
  assert(result.every((item) => item.layout === "landscape"));
  assert.equal(
    result[0].action,
    "Test a tighter lower edge in the next small study.",
  );
  assert.equal(
    result[1].action,
    "Test connected foreground shadows in a separate wash study.",
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
        label: "Horizon placement",
        action: "Test a lower horizon in a separate study.",
        points: [
          { x: 10, y: 35 },
          { x: 90, y: 35 },
        ],
      }),
    ],
  });
  assert.deepEqual(
    result.map((item) => item.kind),
    ["eye_flow", "horizon"],
  );
  const legacy = planning.planThumbnailStudies({
    ...empty,
    overlays: [note({ type: "composition_crop", width: 40, height: 30 })],
  });
  assert.equal(legacy[0].kind, "crop");
});

test("text cues are conservative, deterministic, and bounded to two cards", () => {
  const input = {
    composition: "Test a crop and a leading line along the shoreline.",
    sketch: "Simplify supporting detail.",
    values: "Connect middle-value shadows.",
    title: "Beach study",
  };
  const result = planning.planThumbnailStudies(input);
  assert.deepEqual(result, planning.planThumbnailStudies(input));
  assert.equal(result.length, 2);
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

test("global, uncertain, and inactive relationship notes never claim an image-backed study", () => {
  const cases = [
    ["crop", { type: "crop_box", width: 40, height: 30 }],
    [
      "value_mass",
      {
        type: "value_mass",
        category: "value_structure",
        width: 30,
        height: 20,
      },
    ],
    [
      "focal_point",
      { type: "focal_ring", category: "focal_point", width: 15, height: 10 },
    ],
    [
      "eye_flow",
      {
        type: "arrow",
        category: "composition",
        points: [
          { x: 20, y: 70 },
          { x: 60, y: 30 },
        ],
      },
    ],
  ];
  for (const [kind, geometry] of cases) {
    for (const metadata of [
      { scope: "global" },
      { scope: "local", regionConfidence: 0.4 },
      {
        scope: "multi_region",
        regionConfidence: 0.9,
        regions: [
          { x: 0.1, y: 0.2, width: 0.1, height: 0.2 },
          { x: 0.6, y: 0.3, width: 0.1, height: 0.1 },
        ],
      },
    ]) {
      const overlays = [note({ ...geometry, ...metadata })];
      assert.deepEqual(
        planning.imageStudyMarks(kind, overlays),
        [],
        `${kind}/${JSON.stringify(metadata)}`,
      );
      const studies = planning.planThumbnailStudies({
        ...empty,
        provider: "openai",
        uri: "private-image",
        overlays,
      });
      assert(studies.every((study) => study.marks.length === 0));
    }
  }
});

test("hidden focal and quiet companions cannot sneak into an otherwise visible image study", () => {
  const flow = note({
    type: "arrow",
    category: "composition",
    points: [
      { x: 20, y: 70 },
      { x: 60, y: 30 },
    ],
  });
  const hiddenFocal = note({
    type: "focal_ring",
    category: "focal_point",
    width: 15,
    height: 10,
    regionConfidence: 0.3,
  });
  const hiddenQuiet = note({
    type: "simplify_region",
    category: "simplification",
    width: 20,
    height: 15,
    scope: "global",
  });
  assert.deepEqual(
    planning.imageStudyMarks("eye_flow", [flow, hiddenFocal, hiddenQuiet]),
    [flow],
  );
  assert.deepEqual(
    planning.imageStudyMarks("crop", [
      note({ type: "crop_box", width: 40, height: 30 }),
      hiddenFocal,
    ]).length,
    1,
  );
});

test("thumbnail eligibility follows rendered geometry when explicit regions contradict saved paths", () => {
  for (const [kind, patch] of [
    ["eye_flow", { type: "arrow", category: "composition" }],
    [
      "eye_flow",
      { type: "guide_line", category: "composition", styleHint: "eye_flow" },
    ],
    ["edge_control", { type: "edge_mark", category: "edge_control" }],
  ]) {
    const conflicting = note({
      ...patch,
      scope: "local",
      regionConfidence: 0.9,
      region: { x: 0.1, y: 0.1, width: 0.2, height: 0.2 },
      points: [
        { x: 20, y: 70 },
        { x: 60, y: 30 },
      ],
    });
    const before = JSON.stringify(conflicting);
    assert.equal(drawing.markGeometry(conflicting, 1, 1).kind, "point_marker");
    assert.equal(overlay.usableOverlays([conflicting]).length, 1);
    assert.deepEqual(planning.imageStudyMarks(kind, [conflicting]), []);
    assert(
      planning
        .planThumbnailStudies({
          ...empty,
          provider: "openai",
          uri: "private-image",
          overlays: [conflicting],
        })
        .every((study) => study.marks.length === 0),
    );
    assert.equal(JSON.stringify(conflicting), before);
    const contained = {
      ...conflicting,
      region: { x: 0.1, y: 0.1, width: 0.7, height: 0.7 },
    };
    assert.equal(drawing.markGeometry(contained, 1, 1).kind, patch.type);
    assert.deepEqual(planning.imageStudyMarks(kind, [contained]), [contained]);
  }
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
  "../lib/coachingPresentation": presentation,
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
      "../lib/coachingPresentation": presentation,
      "./ImageStudyThumbnail": { default: "ImageStudyThumbnail" },
      "./ui": { colors: {}, styles: {} },
    }).default;
    function nodes(tree) {
      if (!tree || typeof tree !== "object") return [];
      const expandedTree =
        typeof tree.type === "function" ? tree.type(tree.props) : tree;
      return [
        expandedTree,
        ...[expandedTree.props?.children].flat(Infinity).flatMap(nodes),
      ];
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
    const diagramCount = nodes(tree).filter(
      (node) => node.props?.accessibilityRole === "image",
    ).length;
    assert(diagramCount <= 2); // Legacy full notes survive without filler diagrams.
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
      nodes(tree).filter((node) => node.props?.accessibilityRole === "image")
        .length,
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
  const html = render({
    ...empty,
    composition: "Compare a crop in a separate study.",
    values: "Test a value grouping study.",
  });
  assert(html.includes("Thumbnail planning"));
  assert(
    html.includes(
      "Use these small studies to test composition and values before painting.",
    ),
  );
  assert.equal((html.match(/<svg\b/g) ?? []).length, 2);
  assert.equal(
    (
      html.match(
        /Generic planning diagram · use when image overlay is unavailable/g,
      ) ?? []
    ).length,
    2,
  );
  assert(html.includes("Crop study"));
  assert(html.includes("Value mass study"));
  assert(html.includes("Try this framing before repainting."));
  assert(html.includes("Group values; do not copy detail."));
  assert(html.includes("Value mass study"));
  assert(html.includes("Crop study"));
  assert(
    !/<img\b|generated from|AI painting|Exact plan|Rendered reference/i.test(
      html,
    ),
  );
});

test("mock/unknown provider keeps generic worksheets even with URI and valid saved geometry", () => {
  for (const provider of ["mock", undefined]) {
    const html = render({
      ...empty,
      uri: "private-image",
      provider,
      overlays: [note({ type: "crop_box", width: 40, height: 30 })],
    });
    assert(
      html.includes(
        "Generic planning diagram · use when image overlay is unavailable",
      ),
    );
    assert(!html.includes("Study overlay on your image"));
    assert(!html.includes("private-image"));
    assert(html.includes('aria-hidden="true"'));
  }
});

test("live results with text-only geometry show generic aids instead of empty image overlays", () => {
  const html = render({
    ...empty,
    provider: "openai",
    uri: "private-image",
    overlays: [
      note({ type: "crop_box", width: 40, height: 30, scope: "global" }),
    ],
  });
  assert(
    html.includes(
      "Generic planning diagram · use when image overlay is unavailable",
    ),
  );
  assert(!html.includes("Study overlay on your image"));
  assert(!html.includes("private-image"));
});

test("a suppressed path falls back visibly instead of advertising an empty image study", () => {
  const html = render({
    ...empty,
    provider: "openai",
    uri: "private-image",
    overlays: [
      note({
        type: "arrow",
        category: "composition",
        scope: "local",
        region: { x: 0.1, y: 0.1, width: 0.2, height: 0.2 },
        regionConfidence: 0.9,
        points: [
          { x: 20, y: 70 },
          { x: 60, y: 30 },
        ],
      }),
    ],
  });
  assert(
    html.includes(
      "Generic planning diagram · use when image overlay is unavailable",
    ),
  );
  assert(!html.includes("Study overlay on your image"));
  assert(!html.includes("private-image"));
});

test("all template types render meaningful frame, arrow, value, merge and horizon diagrams", () => {
  const cases = [
    { ...empty, composition: "Test a crop." },
    {
      ...empty,
      composition: "Test an eye path along this street perspective.",
    },
    {
      ...empty,
      overlays: [
        note({
          type: "simplify_region",
          category: "simplification",
          width: 30,
          height: 20,
          action: "Test one simplified supporting wash in a study.",
        }),
      ],
    },
    {
      ...empty,
      overlays: [
        note({
          type: "composition_line",
          styleHint: "horizon",
          label: "Horizon placement",
          points: [
            { x: 10, y: 30 },
            { x: 90, y: 30 },
          ],
          action: "Test a lower horizon in a new study.",
        }),
      ],
      title: "Beach",
    },
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
