const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const { loadShared } = require("./helpers/shared-loader.cjs");
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
    if (
      path
        .resolve(root, path.dirname(file), name)
        .startsWith(path.join(root, "shared") + path.sep)
    ) {
      return loadShared(name, file);
    }
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
const currentDiagonal = {
  type: "diagonal",
  confidence: 0.85,
  shortExplanation:
    "The road carries the eye from the lower left toward the roof light.",
  paths: [
    [
      { x: 0.2, y: 0.8 },
      { x: 0.65, y: 0.35 },
    ],
  ],
  focalPoint: null,
  secondaryPoints: null,
  masses: null,
};

test("unified planning prefers relevant validated image studies and caps the combined systems", () => {
  for (const focus of [
    "Overall feedback",
    "Composition",
    "Colour & contrast",
    "Watercolor technique",
  ]) {
    const studies = planPlanningStudies({ ...input, focus });
    assert(studies.length >= 1 && studies.length <= 2, focus);
    assert.equal(
      studies.filter((study) => study.source === "image").length,
      focus === "Colour & contrast" ? 1 : 2,
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

test("zero to two studies require focus and evidence, with no horizon or eye-flow filler", () => {
  for (const focus of [
    "Overall feedback",
    "Composition",
    "Colour & contrast",
    "Watercolor technique",
  ]) {
    assert.deepEqual(
      planPlanningStudies({
        ...input,
        overlays: [],
        composition: "",
        sketch: "",
        values: "",
        focus,
      }),
      [],
    );
  }
  const colour = planPlanningStudies({ ...input, focus: "Colour & contrast" });
  assert(colour.length > 0 && colour.length <= 2);
  assert(
    colour.every(
      (card) =>
        card.type === "thumbnail" &&
        ["value_mass", "focal_point"].includes(card.study.kind),
    ),
  );
  const technique = planPlanningStudies({
    ...input,
    focus: "Watercolor technique",
  });
  assert(technique.length > 0 && technique.length <= 2);
  assert(
    technique.every(
      (card) =>
        card.type === "thumbnail" &&
        ["edge_control", "simplification"].includes(card.study.kind),
    ),
  );
  assert(
    !planPlanningStudies({
      ...input,
      overlays: [],
      composition: "The horizon is low and the shoreline leads right.",
      focus: "Composition",
    }).some(
      (card) => card.type === "thumbnail" && card.study.kind === "horizon",
    ),
  );
});
test("named source and action mismatch omits the image-backed claim", () => {
  const mismatch = {
    ...edge,
    label: "Roof edge",
    reason: "Foreground trees need softer boundaries.",
    action: "Practise soft foreground tree edges in a separate study.",
    domain: "technique",
  };
  const cards = planPlanningStudies({
    ...input,
    overlays: [mismatch],
    focus: "Watercolor technique",
  });
  assert(cards.every((card) => card.source !== "image"));
  const matched = {
    ...mismatch,
    reason: "The roof edge contrasts with the softer distance.",
    action: "Practise this roof edge on a separate sheet.",
  };
  const good = planPlanningStudies({
    ...input,
    overlays: [matched],
    focus: "Watercolor technique",
  });
  assert.equal(good.length, 1);
  assert.equal(good[0].source, "image");
  assert(good[0].study.title.includes("Roof edge"));
  assert.deepEqual(good[0].study.marks, [matched]);
  assert.equal(good[0].study.action, matched.action);
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
  assert.equal(studies.length, 1);
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
    assert(studies.length <= 2);
    assert(studies.every((study) => study.source === "generic"));
    const html = renderToStaticMarkup(
      React.createElement(PlanningStudies, props),
    );
    assert(!html.includes("Study overlay on your image"));
    assert(!html.includes("private-signed-image"));
    if (studies.length)
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
    0,
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

test("conflicting studies are omitted instead of attaching unrelated canonical actions to geometry", () => {
  for (const nextStudyAction of [decision.nextStudyAction, null]) {
    const cards = planPlanningStudies({
      ...input,
      coachingDecision: { ...decision, nextStudyAction },
      overlays: [
        { ...focal, action: "In a separate study, sharpen the pavilion." },
      ],
    });
    assert(
      !cards.some(
        (card) =>
          card.type === "thumbnail" &&
          card.study.action.includes("sharpen the pavilion"),
      ),
    );
    assert(
      !cards.some(
        (card) =>
          card.type === "thumbnail" && card.study.action === nextStudyAction,
      ),
    );
  }
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
  const action = "In a separate study, test a crisp pavilion roof.";
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

test("a current image-specific path replaces the identical planning overlay, not a distinct future experiment", () => {
  const future = {
    ...flow,
    priority: "medium",
    points: [
      { x: 15, y: 85 },
      { x: 40, y: 55 },
      { x: 70, y: 30 },
    ],
    action: "Test this alternate approach in a future thumbnail.",
  };
  const props = {
    ...input,
    focus: "Composition",
    composition: "Use one diagonal movement.",
    overlays: [flow, future, crop, value],
    currentCompositionOverlay: currentDiagonal,
  };
  const before = JSON.stringify(props);
  const cards = planPlanningStudies(props);
  const flowStudy = cards.find(
    (card) => card.type === "thumbnail" && card.study.kind === "eye_flow",
  );
  assert(flowStudy);
  assert.deepEqual(flowStudy.study.marks[0].points, future.points);
  assert(
    cards.every(
      (card) => card.type !== "model" || card.model.id !== "diagonal",
    ),
  );
  assert(cards.length >= 2 && cards.length <= 3);
  assert.equal(JSON.stringify(props), before);
  const withoutFuture = planPlanningStudies({
    ...props,
    overlays: [flow, crop, value],
  });
  assert(
    !withoutFuture.some(
      (card) => card.type === "thumbnail" && card.study.kind === "eye_flow",
    ),
  );
  assert(
    withoutFuture.some(
      (card) => card.type === "thumbnail" && card.study.kind === "crop",
    ),
  );
});

test("a repeated current focal target and generic off-centre model are omitted while a new target remains", () => {
  const current = {
    ...currentDiagonal,
    type: "off_centre",
    paths: null,
    focalPoint: { x: 0.175, y: 0.25 },
  };
  const future = { ...focal, x: 60, y: 30, priority: "medium" };
  const props = {
    ...input,
    focus: "Composition",
    composition: "Explore off-centre placement.",
    overlays: [focal, future, value],
    currentCompositionOverlay: current,
  };
  const cards = planPlanningStudies(props);
  const focalStudy = cards.find(
    (card) => card.type === "thumbnail" && card.study.kind === "focal_point",
  );
  assert(focalStudy);
  assert.equal(focalStudy.study.marks[0].x, future.x);
  assert(
    cards.every(
      (card) => card.type !== "model" || card.model.id !== "off_center",
    ),
  );
});

test("equivalent percent-space framing is deduplicated without deleting a different future crop", () => {
  const current = {
    ...currentDiagonal,
    type: "enclosure",
    paths: [
      [
        { x: 0.1, y: 0.15 },
        { x: 0.85, y: 0.15 },
        { x: 0.85, y: 0.85 },
        { x: 0.1, y: 0.85 },
      ],
    ],
  };
  const future = {
    ...crop,
    width: 65,
    height: 60,
    priority: "medium",
    region: { x: 0.1, y: 0.15, width: 0.75, height: 0.7 },
    regionConfidence: 0.9,
  };
  const cards = planPlanningStudies({
    ...input,
    focus: "Composition",
    overlays: [crop, future, value],
    currentCompositionOverlay: current,
  });
  const cropStudy = cards.find(
    (card) => card.type === "thumbnail" && card.study.kind === "crop",
  );
  assert(cropStudy);
  assert.equal(cropStudy.study.marks[0].width, future.width);
  assert.equal(cropStudy.study.marks[0].height, future.height);
});

test("explicit normalized local regions and focal targets participate in current-overlay deduplication", () => {
  const currentRegion = { x: 0.15, y: 0.2, width: 0.25, height: 0.3 };
  const current = {
    ...currentDiagonal,
    type: "mixed",
    paths: null,
    masses: [
      {
        role: "supporting",
        points: [
          { x: 0.15, y: 0.2 },
          { x: 0.4, y: 0.2 },
          { x: 0.4, y: 0.5 },
          { x: 0.15, y: 0.5 },
        ],
      },
    ],
  };
  const cards = planPlanningStudies({
    ...input,
    overlays: [
      { ...value, region: currentRegion, regionConfidence: 0.9 },
      crop,
    ],
    currentCompositionOverlay: current,
  });
  assert(
    !cards.some(
      (card) => card.type === "thumbnail" && card.study.kind === "value_mass",
    ),
  );
  assert(
    cards.some(
      (card) => card.type === "thumbnail" && card.study.kind === "crop",
    ),
  );
  const focalCards = planPlanningStudies({
    ...input,
    overlays: [
      {
        ...focal,
        region: { x: 0.5, y: 0.3, width: 0.15, height: 0.1 },
        regionConfidence: 0.9,
      },
      crop,
    ],
    currentCompositionOverlay: {
      ...currentDiagonal,
      type: "off_centre",
      paths: null,
      focalPoint: { x: 0.575, y: 0.35 },
    },
  });
  assert(
    !focalCards.some(
      (card) => card.type === "thumbnail" && card.study.kind === "focal_point",
    ),
  );
});

test("a confident secondary interpretation also removes repeats while preserving a different future target", () => {
  const secondary = {
    ...currentDiagonal,
    type: "off_centre",
    paths: null,
    focalPoint: { x: 0.175, y: 0.25 },
  };
  const future = { ...focal, x: 60, y: 30, priority: "medium" };
  const props = {
    ...input,
    focus: "Composition",
    composition: "Use one diagonal movement and an off-centre focal point.",
    overlays: [flow, focal, future, crop, value],
    currentCompositionOverlay: currentDiagonal,
  };
  const baseline = planPlanningStudies(props);
  const oldFocal = baseline.find(
    (card) => card.type === "thumbnail" && card.study.kind === "focal_point",
  );
  assert.equal(oldFocal.study.marks[0].x, focal.x);
  const cards = planPlanningStudies({
    ...props,
    secondaryCompositionOverlay: secondary,
  });
  const futureFocal = cards.find(
    (card) => card.type === "thumbnail" && card.study.kind === "focal_point",
  );
  assert.equal(futureFocal.study.marks[0].x, future.x);
  assert(
    !cards.some(
      (card) => card.type === "thumbnail" && card.study.kind === "eye_flow",
    ),
  );
  assert(
    cards.every(
      (card) =>
        card.type !== "model" ||
        !["diagonal", "off_center"].includes(card.model.id),
    ),
  );
  assert(cards.length <= 3);
  assert.deepEqual(
    planPlanningStudies({
      ...props,
      secondaryCompositionOverlay: { ...secondary, confidence: 0.4 },
    }),
    baseline,
  );
});

test("missing, uncertain, invalid, or unavailable current overlays preserve legacy planning exactly", () => {
  const baseline = planPlanningStudies(input);
  for (const currentCompositionOverlay of [
    undefined,
    null,
    {},
    { ...currentDiagonal, confidence: 0.4 },
    { ...currentDiagonal, paths: null },
  ]) {
    assert.deepEqual(
      planPlanningStudies({ ...input, currentCompositionOverlay }),
      baseline,
    );
  }
  for (const patch of [
    { provider: "mock" },
    { provider: undefined },
    { uri: "" },
  ]) {
    assert.deepEqual(
      planPlanningStudies({
        ...input,
        ...patch,
        currentCompositionOverlay: currentDiagonal,
      }),
      planPlanningStudies({ ...input, ...patch }),
    );
  }
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
