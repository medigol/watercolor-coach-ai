const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");
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
const preparation = load("lib/referencePreparation.ts");
const note = (patch = {}) => ({
  type: "point_marker",
  label: "Keep the focal shape clear",
  priority: "high",
  x: 20,
  y: 30,
  shortInstruction: "Keep the supporting shapes quiet.",
  reason: "This lets the light focal shape carry the painting.",
  action:
    "Soften competing marks and keep one sharp accent near the focal shape.",
  ...patch,
});
const crop = note({
  type: "crop_box",
  category: "composition",
  width: 65,
  height: 50,
  action: "Test a tighter foreground crop before repainting.",
});
const flow = note({
  type: "eye_flow_arrow",
  category: "composition",
  points: [
    { x: 10, y: 80 },
    { x: 40, y: 60 },
    { x: 65, y: 35 },
  ],
  label: "Follow the shoreline",
});
const value = note({
  type: "value_mass",
  category: "value_structure",
  width: 45,
  height: 30,
  valueGroup: "dark",
});
const focal = note({
  type: "focal_ring",
  category: "focal_point",
  x: 55,
  y: 30,
  width: 15,
  height: 20,
});
const quiet = note({
  type: "simplify_region",
  category: "simplification",
  x: 5,
  y: 5,
  width: 35,
  height: 25,
});
const horizon = note({
  type: "composition_line",
  category: "composition",
  styleHint: "horizon",
  points: [
    { x: 5, y: 40 },
    { x: 90, y: 40 },
  ],
});
const edge = note({
  type: "edge_mark",
  category: "edge_control",
  points: [
    { x: 20, y: 40 },
    { x: 55, y: 45 },
  ],
});
const input = {
  composition: "Test the crop and eye path.",
  sketch: "Keep the large shapes connected.",
  values: "Group three values.",
  uri: "private-signed-image",
  provider: "openai",
};

test("crop/flow/value/simplify/structure/focal study marks preserve validated saved geometry", () => {
  const notes = [crop, flow, value, focal, quiet, horizon];
  const before = JSON.stringify(notes);
  assert.deepEqual(planning.imageStudyMarks("crop", notes), [crop, focal]);
  assert.deepEqual(planning.imageStudyMarks("eye_flow", notes), [
    flow,
    focal,
    quiet,
  ]);
  assert.deepEqual(planning.imageStudyMarks("value_mass", notes), [value]);
  assert.deepEqual(planning.imageStudyMarks("simplification", notes), [quiet]);
  assert.deepEqual(planning.imageStudyMarks("horizon", notes), [horizon]);
  assert.deepEqual(planning.imageStudyMarks("focal_point", notes), [focal]);
  assert.deepEqual(planning.imageStudyMarks("edge_control", [edge]), [edge]);
  assert.deepEqual(planning.imageStudyMarks("big_shapes", notes), []);
  assert.equal(JSON.stringify(notes), before);
});

test("point-only, degenerate or malformed geometry never becomes an invented image shape", () => {
  for (const [kind, invalid] of [
    ["crop", note({ type: "crop_box", width: 90, height: 90 })],
    [
      "eye_flow",
      note({
        type: "eye_flow_arrow",
        points: [
          { x: 20, y: 30 },
          { x: 20, y: 30 },
        ],
      }),
    ],
    ["value_mass", note({ type: "value_mass", category: "value_structure" })],
    [
      "simplification",
      note({ type: "simplify_region", width: -1, height: 30 }),
    ],
    ["horizon", note({ type: "composition_line", styleHint: "horizon" })],
    ["focal_point", note({ type: "focal_ring", category: "focal_point" })],
    ["edge_control", note({ type: "edge_mark", category: "edge_control" })],
  ]) {
    assert.deepEqual(planning.imageStudyMarks(kind, [invalid]), [], kind);
  }
  assert.deepEqual(
    planning.imageStudyMarks("crop", [
      note({ styleHint: "crop", category: "composition" }),
    ]),
    [],
  );
  assert.deepEqual(planning.imageStudyMarks("eye_flow", [horizon]), []);
});

test("image-backed selection keeps two/three cards and uses relevant reason/action with safe timing", () => {
  const result = planning.planThumbnailStudies({
    ...input,
    overlays: [crop, flow, value, focal, quiet, horizon],
  });
  assert.equal(result.length, 3);
  assert.deepEqual(
    result.map((study) => study.kind),
    ["crop", "value_mass", "eye_flow"],
  );
  assert(result.every((study) => study.marks.length > 0));
  assert.equal(result[0].purpose, crop.reason);
  assert.equal(result[0].action, crop.action);
  assert.equal(result[0].timing, "Try this crop in the next study");
  const structural = note({
    ...flow,
    timing: "current_painting",
    action: "Move the figures closer to the main building.",
  });
  const next = planning
    .planThumbnailStudies({ ...input, overlays: [structural] })
    .find((study) => study.kind === "eye_flow");
  assert.equal(next.timing, "Try in the next study");
  const generic = planning.planThumbnailStudies({
    ...input,
    uri: undefined,
    overlays: [crop, flow, value],
  });
  assert(generic.every((study) => study.marks.length === 0));
});

test("available focal geometry outranks weak high-priority crop/value metadata", () => {
  const weakCrop = note({
    type: "composition_crop",
    category: "composition",
    styleHint: "crop",
  });
  const weakValue = note({
    type: "value_adjustment",
    category: "value_structure",
  });
  const result = planning.planThumbnailStudies({
    ...input,
    overlays: [weakCrop, weakValue, focal],
  });
  assert.equal(result[0].kind, "focal_point");
  assert.deepEqual(result[0].marks, [focal]);
  assert(result.length >= 2 && result.length <= 3);
  assert(result.slice(1).every((study) => study.marks.length === 0));
});

test("mock or missing provider never mixes sample guidance with the private uploaded image", () => {
  for (const provider of ["mock", undefined, "unknown"]) {
    const studies = planning.planThumbnailStudies({
      ...input,
      provider,
      overlays: [crop, flow, value, focal],
    });
    assert(studies.every((study) => study.marks.length === 0));
    assert(studies.length >= 2 && studies.length <= 3);
  }
  const real = planning.planThumbnailStudies({
    ...input,
    provider: "openai",
    overlays: [crop, flow, value, focal],
  });
  assert(real.some((study) => study.marks.length > 0));
});

function fixture({
  ratio = [1200, 800],
  fail = false,
  supported = true,
  deferred = false,
} = {}) {
  const states = [];
  const pending = [];
  let stateIndex = 0,
    effectKey,
    cleanup;
  const jsx = {
    jsx: (type, props) => ({ type, props }),
    jsxs: (type, props) => ({ type, props }),
    Fragment: "Fragment",
  };
  const Component = load("components/ImageStudyThumbnail.tsx", {
    react: {
      useState(initial) {
        const index = stateIndex++;
        if (!(index in states)) states[index] = initial;
        return [
          states[index],
          (value) => {
            states[index] =
              typeof value === "function" ? value(states[index]) : value;
          },
        ];
      },
      useRef(initial) {
        const index = stateIndex++;
        if (!(index in states)) states[index] = { current: initial };
        return states[index];
      },
      useEffect(effect, deps) {
        const key = JSON.stringify(deps);
        if (key !== effectKey) {
          cleanup?.();
          effectKey = key;
          cleanup = effect();
        }
      },
    },
    "react/jsx-runtime": jsx,
    "react-native": {
      View: "View",
      Text: "Text",
      Image: {
        getSize(uri, ok, error) {
          pending.push({ uri, ok, error });
          if (!deferred) fail ? error() : ok(...ratio);
        },
      },
    },
    "../lib/referencePreparation": preparation,
    "../lib/thumbnailPlanning": planning,
    "./CoachingMarks": { default: "CoachingMarks" },
    "./ReferenceImage": {
      default: "ReferenceImage",
      supportsImageAdjustments: supported,
    },
    "./ui": { colors: {}, styles: {} },
  }).default;
  const fallback = {
    type: "Fallback",
    props: {
      children:
        "Generic planning diagram · use when image overlay is unavailable",
    },
  };
  const render = (
    kind = "crop",
    notes = [crop, focal],
    uri = "private-image",
  ) => {
    stateIndex = 0;
    return Component({ uri, kind, notes, fallback });
  };
  function nodes(tree) {
    if (!tree || typeof tree !== "object") return [];
    return [tree, ...[tree.props?.children].flat(Infinity).flatMap(nodes)];
  }
  function measure(tree, width = 310) {
    nodes(tree)
      .find((node) => node.props?.onLayout)
      .props.onLayout({ nativeEvent: { layout: { width } } });
  }
  return { render, nodes, measure, pending };
}

for (const [kind, marks] of [
  ["crop", [crop, focal]],
  ["eye_flow", [flow, focal, quiet]],
  ["value_mass", [value]],
  ["simplification", [quiet]],
  ["horizon", [horizon]],
  ["focal_point", [focal]],
  ["edge_control", [edge]],
])
  test(`${kind}: original image renders with aligned meaningful marks, no fake image output`, () => {
    const f = fixture();
    let tree = f.render(kind, marks);
    f.measure(tree);
    tree = f.render(kind, marks);
    const image = f.nodes(tree).find((node) => node.type === "ReferenceImage");
    const drawing = f.nodes(tree).find((node) => node.type === "CoachingMarks");
    assert.equal(image.props.uri, "private-image");
    assert.equal(drawing.props.width, 310);
    assert(Math.abs(drawing.props.height - 310 / 1.5) < 0.0001);
    assert.deepEqual(
      drawing.props.notes,
      planning.imageStudyMarks(kind, marks),
    );
    assert(
      !drawing.props.notes.some(
        (mark) => overlay.overlayKind(mark) === "point_marker",
      ),
    );
    assert.equal(drawing.props.selected, kind === "crop" ? 0 : null);
    const output = JSON.stringify(tree);
    assert(output.includes("Study overlay on your image"));
    assert(output.includes("Use as a guide, not tracing"));
    assert(!output.includes("Generic planning diagram"));
    assert(!/generated from|Exact repaint|Edited image/.test(output));
    if (kind === "value_mass")
      assert(image.props.filter.includes("grayscale(1)"));
  });

test("portrait studies preserve aspect ratio and stay within a small mobile frame", () => {
  const f = fixture({ ratio: [600, 1200] });
  f.measure(f.render());
  const tree = f.render();
  const drawing = f.nodes(tree).find((node) => node.type === "CoachingMarks");
  assert.equal(drawing.props.width, 110);
  assert.equal(drawing.props.height, 220);
  assert.equal(drawing.props.width / drawing.props.height, 0.5);
});

test("short panoramas preserve natural ratio without resource dimension overflow", () => {
  for (const ratio of [
    [6000, 300],
    [Number.MAX_VALUE, 1],
  ]) {
    const f = fixture({ ratio });
    f.measure(f.render());
    const tree = f.render();
    const drawing = f.nodes(tree).find((node) => node.type === "CoachingMarks");
    assert.equal(drawing.props.width, 310);
    assert(Number.isFinite(drawing.props.height));
    assert(drawing.props.height > 0 && drawing.props.height <= 220);
    assert(
      Math.abs(
        drawing.props.width / drawing.props.height / (ratio[0] / ratio[1]) - 1,
      ) < 0.0001,
    );
  }
});

test("unavailable images and bad image dimensions fall back without a broken preview", () => {
  for (const options of [
    { fail: true },
    { ratio: [0, 800] },
    { ratio: [Number.MAX_VALUE, Number.MIN_VALUE] },
  ]) {
    const f = fixture(options);
    f.measure(f.render());
    const tree = f.render();
    assert(f.nodes(tree).some((node) => node.type === "Fallback"));
    assert(!f.nodes(tree).some((node) => node.type === "ReferenceImage"));
  }
  const f = fixture();
  f.measure(f.render());
  let tree = f.render();
  f.nodes(tree)
    .find((node) => node.type === "ReferenceImage")
    .props.onError();
  tree = f.render();
  assert(f.nodes(tree).some((node) => node.type === "Fallback"));
  assert(JSON.stringify(tree).includes("This image could not be loaded"));
  assert(!JSON.stringify(tree).includes("Study overlay on your image"));
});

test("weak geometry stays generic without reading the image, and stale image callbacks are ignored", () => {
  const bad = fixture();
  bad.render("crop", [note({ category: "composition", styleHint: "crop" })]);
  assert.equal(bad.pending.length, 0);
  const f = fixture({ deferred: true });
  f.measure(f.render("crop", [crop], "first"));
  f.render("crop", [crop], "second");
  f.pending[0].ok(10, 20);
  assert(
    !f
      .nodes(f.render("crop", [crop], "second"))
      .some((node) => node.type === "ReferenceImage"),
  );
  f.pending[1].ok(800, 600);
  const tree = f.render("crop", [crop], "second");
  assert.equal(
    f.nodes(tree).find((node) => node.type === "ReferenceImage").props.uri,
    "second",
  );
});

test("late render errors from a previous image cannot unset the current image failure", () => {
  const f = fixture();
  f.measure(f.render("crop", [crop], "first"));
  const oldImage = f
    .nodes(f.render("crop", [crop], "first"))
    .find((node) => node.type === "ReferenceImage");
  f.render("crop", [crop], "second");
  const newImage = f
    .nodes(f.render("crop", [crop], "second"))
    .find((node) => node.type === "ReferenceImage");
  newImage.props.onError();
  oldImage.props.onError();
  const tree = f.render("crop", [crop], "second");
  assert(!f.nodes(tree).some((node) => node.type === "ReferenceImage"));
  assert(f.nodes(tree).some((node) => node.type === "Fallback"));
});

test("native or unsupported browser value studies show original colours with an honest note", () => {
  const f = fixture({ supported: false });
  f.measure(f.render("value_mass", [value]));
  const tree = f.render("value_mass", [value]);
  assert.equal(
    f.nodes(tree).find((node) => node.type === "ReferenceImage").props.filter,
    "none",
  );
  assert(JSON.stringify(tree).includes("Original colours shown"));
});

test("planning adds no model requests, pixel processing, secrets or generated images", () => {
  for (const file of [
    "lib/thumbnailPlanning.ts",
    "components/ImageStudyThumbnail.tsx",
    "components/ThumbnailPlanning.tsx",
  ]) {
    const source = fs.readFileSync(path.join(root, file), "utf8");
    assert(
      !/fetch\s*\(|functions\.invoke|api\.openai|canvas|getImageData|process\.env|\/images\/(generations|edits)/.test(
        source,
      ),
    );
  }
});
