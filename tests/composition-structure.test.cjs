const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const root = path.resolve(__dirname, "..");
const modules = new Map();

function element(tag) {
  return ({
    children,
    accessible,
    accessibilityRole,
    accessibilityLabel,
    pointerEvents,
    testID,
    style,
    ...props
  }) =>
    React.createElement(
      tag,
      {
        ...props,
        role: accessibilityRole,
        "aria-label": accessibilityLabel,
        "data-testid": testID,
        style,
      },
      children,
    );
}
const mocks = {
  "react/jsx-runtime": require("react/jsx-runtime"),
  "react-native": { View: element("div") },
  "react-native-svg": Object.fromEntries(
    [
      ["default", "svg"],
      ["Circle", "circle"],
      ["G", "g"],
      ["Line", "line"],
      ["Path", "path"],
      ["Polygon", "polygon"],
    ].map(([name, tag]) => [name, element(tag)]),
  ),
};
function load(file) {
  const resolved = path.resolve(root, file);
  if (modules.has(resolved)) return modules.get(resolved);
  const exports = {};
  modules.set(resolved, exports);
  const code = ts.transpileModule(fs.readFileSync(resolved, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.ReactJSX,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  new Function("exports", "require", code)(exports, (name) => {
    if (name in mocks) return mocks[name];
    assert(name.startsWith("."), `Unexpected import: ${name}`);
    let dependency = path.resolve(path.dirname(resolved), name);
    if (!path.extname(dependency)) dependency += ".ts";
    return load(dependency);
  });
  return exports;
}
const geometry = load("lib/imageGeometry.ts");
const metadata = load("shared/visualMetadata.ts");
const library = load("lib/compositionArchetypes.ts");
const Component = load("components/CompositionStructure.tsx").default;
const p = (x, y) => ({ x, y });
const first = p(0.1, 0.8),
  middle = p(0.4, 0.6),
  last = p(0.75, 0.2);
const triangle = [p(0.15, 0.8), p(0.45, 0.2), p(0.8, 0.75)];
const mass = (points, role = "supporting") => ({ points, role });
const fixture = (patch = {}) => ({
  type: "diagonal",
  confidence: 0.9,
  shortExplanation: "The shoreline leads toward the small focal building.",
  paths: [[first, last]],
  focalPoint: last,
  secondaryPoints: null,
  masses: null,
  ...patch,
});
const render = (
  overlay,
  frame = { x: 0, y: 0, width: 400, height: 300, scale: 1 },
) => renderToStaticMarkup(React.createElement(Component, { overlay, frame }));

test("original archetype vocabulary has no scene assets or predetermined image coordinates", () => {
  assert.equal(library.compositionArchetypeIds.length, 17);
  assert.deepEqual(
    new Set(library.compositionArchetypeIds),
    new Set(metadata.compositionArchetypes),
  );
  for (const [id, entry] of Object.entries(library.compositionArchetypes)) {
    assert.equal(library.archetypeLabel(id), entry.label);
    assert(entry.label.length > 3 && entry.principle.length > 25);
    assert.deepEqual(Object.keys(entry).sort(), ["label", "principle"]);
  }
  assert.equal(library.archetypeLabel("mixed"), "Mixed structure");
});

test("diagonal uses only saved image-specific geometry, not a library template", () => {
  const plan = library.createCompositionStructurePlan(fixture());
  assert.deepEqual(plan.strokes, [
    { points: [first, last], closed: false, smooth: false },
  ]);
  assert.deepEqual(plan.anchors, [{ point: last, role: "focal" }]);
  assert.equal(plan.thirdsGrid, false);
  const shifted = fixture({ paths: [[p(0.3, 0.1), p(0.9, 0.5)]] });
  assert.notDeepEqual(
    library.createCompositionStructurePlan(shifted).strokes,
    plan.strokes,
  );
  const html = render(fixture());
  assert(html.includes('d="M40 240 L300 60"'));
  assert(!html.includes("<img"));
});

test("curved structure rounds only supplied path anchors and does not close a flow path", () => {
  const overlay = fixture({ type: "s_curve", paths: [[first, middle, last]] });
  const plan = library.createCompositionStructurePlan(overlay);
  assert.deepEqual(plan.strokes[0].points, [first, middle, last]);
  assert.equal(plan.strokes[0].smooth, true);
  const html = render(overlay);
  assert(html.includes('d="M40 240 Q160 180 230 120 L300 60"'));
});

test("triangle joins meaningful supplied anchors or follows a supplied polygon", () => {
  const anchors = fixture({
    type: "triangle",
    paths: null,
    focalPoint: triangle[0],
    secondaryPoints: triangle.slice(1),
  });
  const anchorPlan = library.createCompositionStructurePlan(anchors);
  assert.deepEqual(anchorPlan.strokes, [
    { points: triangle, closed: true, smooth: false },
  ]);
  assert(render(anchors).includes('d="M60 240 L180 60 L320 225 Z"'));
  const pathPlan = library.createCompositionStructurePlan(
    fixture({
      type: "triangle",
      paths: [[first, last], triangle],
    }),
  );
  assert.equal(pathPlan.strokes.length, 1);
  assert.deepEqual(pathPlan.strokes[0].points, triangle);
  const collinearFirstThree = library.createCompositionStructurePlan(
    fixture({
      type: "triangle",
      paths: null,
      focalPoint: p(0.1, 0.2),
      secondaryPoints: [p(0.2, 0.2), p(0.3, 0.2), p(0.4, 0.6)],
    }),
  );
  assert(geometry.validPolygon(collinearFirstThree.strokes[0].points));
});

test("thirds grid requires a confident saved focal point and has no default focal placement", () => {
  assert.equal(
    library.createCompositionStructurePlan(
      fixture({
        type: "rule_of_thirds",
        focalPoint: null,
      }),
    ),
    null,
  );
  const overlay = fixture({ type: "rule_of_thirds", paths: null });
  const plan = library.createCompositionStructurePlan(overlay);
  assert.equal(plan.thirdsGrid, true);
  assert.deepEqual(plan.anchors[0].point, last);
  const html = render(overlay);
  // Four geometry lines, each with a narrow pale halo for light/dark paintings.
  assert.equal((html.match(/<line\b/g) ?? []).length, 8);
  const gridLines = html.match(/<line\b[^>]+>/g) ?? [];
  assert.equal(new Set(gridLines).size, 4);
  assert(html.includes('cx="300" cy="60"'));
});

test("named archetypes use supplied paths, anchors, and masses without new generic illustrations", () => {
  const supporting = mass([p(0.1, 0.1), p(0.35, 0.2), p(0.2, 0.5)]);
  const focal = mass([p(0.65, 0.6), p(0.9, 0.6), p(0.9, 0.9)], "focal");
  const paths = [
    [first, middle, last, p(0.9, 0.75)],
    [p(0.2, 0.3), p(0.85, 0.5)],
  ];
  for (const id of library.compositionArchetypeIds.filter(
    (id) => id !== "none",
  )) {
    const overlay = fixture({
      type: id,
      paths,
      focalPoint: triangle[0],
      secondaryPoints: triangle.slice(1),
      masses: [supporting, focal],
    });
    const plan = library.createCompositionStructurePlan(overlay);
    assert(plan, id);
    assert.equal(plan.type, id);
    assert.equal(plan.explanation, overlay.shortExplanation);
    assert(
      render(overlay).includes(
        `Composition overlay: ${library.archetypeLabel(id)}.`,
      ),
    );
  }
});

test("none, weak confidence and incomplete geometry preserve text without drawing a false formula", () => {
  for (const overlay of [
    fixture({ type: "none" }),
    fixture({ confidence: 0.64 }),
    fixture({
      type: "triangle",
      paths: [[first, last]],
      secondaryPoints: null,
    }),
    fixture({ type: "cross", paths: [[first, last]] }),
    fixture({ type: "s_curve", paths: [[first, last]] }),
    fixture({ paths: [[p(1.2, 0.5), last]] }),
  ]) {
    const usable = metadata.usableCompositionOverlay(overlay);
    assert.equal(usable.shortExplanation, overlay.shortExplanation);
    assert.equal(library.createCompositionStructurePlan(overlay), null);
    assert.equal(render(overlay), "");
  }
  assert.equal(render(undefined), "");
  assert.equal(render({}), "");
});

test("mixed structure displays saved neutral geometry but never invents a dominant formula", () => {
  const overlay = fixture({ type: "mixed" });
  const plan = library.createCompositionStructurePlan(overlay);
  assert.equal(plan.label, "Mixed structure");
  assert.equal(plan.thirdsGrid, false);
  assert.deepEqual(plan.strokes[0].points, [first, last]);
  assert.equal(
    library.createCompositionStructurePlan(
      fixture({
        type: "mixed",
        paths: null,
        focalPoint: null,
      }),
    ),
    null,
  );
});

test("malformed optional geometry is dropped individually while valid saved geometry still renders", () => {
  const overlay = fixture({
    paths: [
      [first, last],
      [{ x: 10, y: 0.4 }, last],
    ],
    secondaryPoints: [middle, { x: 0.2, y: Number.NaN }],
    masses: [{ points: [first, last] }, mass(triangle, "quiet")],
  });
  const plan = library.createCompositionStructurePlan(overlay);
  assert.equal(plan.strokes.length, 1);
  assert.equal(plan.masses.length, 0); // Unrelated quiet polygon is not the diagonal lesson.
  assert.equal(plan.anchors.length, 1);
  assert.equal(plan.explanation, overlay.shortExplanation);
  assert(!render(overlay).includes("NaN"));
});
test("a current diagonal teaches one path and landing, without unrelated grids or polygons", () => {
  const plan = library.createCompositionStructurePlan(
    fixture({
      paths: [
        [first, last],
        [middle, last],
        [first, middle],
      ],
      secondaryPoints: [middle, first],
      masses: [
        mass(triangle, "quiet"),
        mass(triangle, "supporting"),
        mass(triangle, "focal"),
      ],
    }),
  );
  assert.equal(plan.strokes.length, 1);
  assert.equal(plan.anchors.length, 1);
  assert.equal(plan.masses.length, 1);
  assert.equal(plan.masses[0].role, "supporting");
  assert.equal(plan.thirdsGrid, false);
});

test("overlay and source frame share projection across source ratios and browser sizes", () => {
  for (const source of [
    { width: 1200, height: 900 },
    { width: 900, height: 1200 },
    { width: 1000, height: 1000 },
    { width: 1800, height: 600 },
  ])
    for (const width of [320, 375, 1440]) {
      const frame = geometry.containFrame(source, { width, height: 420 });
      const global = geometry.projectPoint(last, frame);
      const local = geometry.projectPoint(last, { ...frame, x: 0, y: 0 });
      assert.equal(local.x + frame.x, global.x);
      assert.equal(local.y + frame.y, global.y);
      const html = render(fixture(), frame);
      assert(html.includes(`viewBox="0 0 ${frame.width} ${frame.height}"`));
      assert(html.includes(`cx="${local.x}" cy="${local.y}"`));
      assert(html.includes(`left:${frame.x}${frame.x ? "px" : ""}`));
      assert(html.includes(`top:${frame.y}${frame.y ? "px" : ""}`));
    }
});

test("wrapper describes current image structure while SVG graphics are decorative and non-interactive", () => {
  const html = render(fixture());
  assert(html.includes('role="image"'));
  assert(
    html.includes(
      'aria-label="Composition overlay: Diagonal movement. The shoreline leads toward the small focal building."',
    ),
  );
  assert(html.includes('aria-hidden="true"'));
  assert(!html.includes("<text"));
  assert(!/Generated|new image|exact copy|AI painting/.test(html));
  for (const file of [
    "lib/compositionArchetypes.ts",
    "components/CompositionStructure.tsx",
  ]) {
    const source = fs.readFileSync(path.join(root, file), "utf8");
    assert(
      !/fetch\s*\(|functions\.invoke|api\.openai|canvas|process\.env|https?:|<Image\b|<img\b/.test(
        source,
      ),
      file,
    );
  }
});
