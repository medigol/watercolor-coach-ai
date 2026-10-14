const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");
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
const overlay = load("lib/overlays.ts");
const drawing = load("lib/overlayDrawing.ts", { "./overlays": overlay });
const presentation = load("lib/coachingPresentation.ts", {
  "./overlays": overlay,
});
const contract = load("supabase/functions/_shared/contract.ts", {
  "./overlays.ts": overlay,
  "./coachingDecision.ts": load("shared/coachingDecision.ts"),
});
const samples = load("data/mockResults.ts");
const notes = Array.from({ length: 3 }, (_, i) => ({
  type: ["focal_point", "value_adjustment", "edge_control"][i],
  label: ["Strengthen focal point", "Group this shadow", "Soften this edge"][i],
  x: 20 + i * 25,
  y: 30 + i * 15,
  width: null,
  height: null,
  priority: i ? "medium" : "high",
  shortInstruction: "Keep the supporting shapes quiet.",
  reason: "This supports the light at the focal point.",
  action: "Use a soft middle-value wash while the paper is damp.",
}));
test("bounded overlay contract accepts points/regions, empty array and strict known fields", () => {
  assert(overlay.validOverlays(notes));
  assert(overlay.validOverlays([]));
  const region = { ...notes[0], x: 60, y: 40, width: 20, height: 10 };
  assert(overlay.validOverlays([region, ...notes.slice(1)]));
  assert.deepEqual(overlay.overlayAnchor(region), { x: 70, y: 45 });
  for (const patch of [
    { x: -1 },
    { y: 101 },
    { x: NaN },
    { x: "30" },
    { width: 50, height: 80 },
    { width: 10 },
    { width: 0, height: 5 },
    { type: "other" },
    { priority: "urgent" },
    { label: "" },
    { action: "x".repeat(351) },
    { extra: "ignored" },
  ])
    assert(
      !overlay.validOverlays([{ ...notes[0], ...patch }, ...notes.slice(1)]),
      JSON.stringify(patch),
    );
  assert(overlay.validOverlays(notes.slice(0, 2)));
  assert(overlay.validOverlays([...notes, ...notes]));
  assert(!overlay.validOverlays([...notes, ...notes, notes[0]]));
});
test("legacy/mocks remain valid; valid overlays survive; malformed optional overlays retain text", () => {
  for (const [mode, sample] of [
    ["improve_painting", samples.improveResult],
    ["create_reference", samples.referenceResult],
  ]) {
    assert(contract.validFeedback(sample, mode));
    assert(contract.validFeedback({ ...sample, overlays: notes }, mode));
    assert(contract.validFeedback({ ...sample, overlays: null }, mode));
    const bad = {
      ...sample,
      overlays: [{ ...notes[0], x: 200 }, ...notes.slice(1)],
    };
    assert(!contract.validFeedback(bad, mode));
    assert.deepEqual(contract.cleanOverlayFeedback(bad), {
      ...sample,
      overlays: notes.slice(1),
    });
    assert(contract.validFeedback(contract.cleanOverlayFeedback(bad), mode));
    const schema = contract.feedbackSchema(mode);
    assert(schema.required.includes("overlays"));
    assert.equal(schema.properties.overlays.items.additionalProperties, false);
  }
});
test("frontend and server overlay contracts remain identical; no image API or new credentials", () => {
  assert.equal(
    fs.readFileSync(path.join(root, "lib/overlays.ts"), "utf8"),
    fs.readFileSync(
      path.join(root, "supabase/functions/_shared/overlays.ts"),
      "utf8",
    ),
  );
  const source = fs.readFileSync(
    path.join(root, "supabase/functions/generate-feedback/index.ts"),
    "utf8",
  );
  assert(source.includes("https://api.openai.com/v1/chat/completions"));
  assert(!/\/images\/(generations|edits|variations)/.test(source));
  const prompt = fs.readFileSync(
    path.join(root, "supabase/functions/_shared/prompts.ts"),
    "utf8",
  );
  assert(prompt.includes("same JSON response"));
  assert(prompt.includes("never invent precise geometry"));
  assert(prompt.includes("never generate or edit the source image"));
});
function fixture(fail = false) {
  const values = [];
  let index = 0;
  let effectKey;
  let currentUri;
  const Image = Object.assign(() => null, {
    getSize: (uri, ok, error) => (fail ? error() : ok(1200, 800)),
  });
  const react = {
    useState: (initial) => {
      const n = index++;
      if (values[n] === undefined) values[n] = initial;
      return [
        values[n],
        (v) => {
          values[n] = typeof v === "function" ? v(values[n]) : v;
        },
      ];
    },
    useEffect: (fn, deps) => {
      if (effectKey !== deps[0]) {
        effectKey = deps[0];
        fn();
      }
    },
  };
  const jsx = {
    jsx: (type, props) => ({ type, props }),
    jsxs: (type, props) => ({ type, props }),
    Fragment: "Fragment",
  };
  const overlayComponents = load("components/CoachingOverlay.tsx", {
    react,
    "react/jsx-runtime": jsx,
    "react-native": {
      Image,
      Pressable: "Pressable",
      Text: "Text",
      View: "View",
    },
    "../lib/overlays": overlay,
    "../lib/coachingPresentation": presentation,
    "react-native-svg": { default: "Svg", Path: "Path" },
    "../lib/overlayDrawing": drawing,
    "./CoachingMarks": { default: "CoachingMarks" },
    "./ui": {
      colors: { accent: "teal", ink: "dark", border: "border" },
      styles: { card: {} },
    },
  });
  const Component = overlayComponents.default;
  function expandPanel(tree) {
    if (!tree || typeof tree !== "object") return tree;
    if (tree.type === overlayComponents.VisualCoachingNotes)
      return expandPanel(tree.type(tree.props));
    const children = tree.props?.children;
    if (children !== undefined)
      tree.props.children = Array.isArray(children)
        ? children.map(expandPanel)
        : expandPanel(children);
    return tree;
  }
  const render = (
    uri = currentUri ?? "image",
    data = notes,
    study = false,
    props = {},
  ) => {
    index = 0;
    currentUri = uri;
    return expandPanel(
      Component({ uri, notes: data, label: "Your photo", study, ...props }),
    );
  };
  function nodes(tree) {
    if (!tree) return [];
    const children = tree.props?.children;
    return [
      tree,
      ...(Array.isArray(children) ? children : [children])
        .flat(Infinity)
        .flatMap((child) => (typeof child === "object" ? nodes(child) : [])),
    ];
  }
  return {
    render,
    nodes,
    Image,
    curated: overlayComponents.curatedCoachingNotes,
  };
}
test("overlay maps image dimensions, marker selection highlights and expands matching note", () => {
  const f = fixture();
  assert.equal(f.render(), null);
  let tree = f.render();
  const layout = f.nodes(tree).find((n) => n.props?.onLayout);
  layout.props.onLayout({ nativeEvent: { layout: { width: 360 } } });
  tree = f.render();
  const image = f.nodes(tree).find((n) => n.type === f.Image);
  assert(image);
  const frame = f.nodes(tree).find((n) => n.props?.style?.width === 360);
  assert.equal(frame.props.style.height, 240);
  const marker = f
    .nodes(tree)
    .find((n) => n.props?.accessibilityLabel === "Note 2: Group this shadow");
  marker.props.onPress();
  tree = f.render();
  const selected = f
    .nodes(tree)
    .filter((n) => n.props?.accessibilityState?.selected);
  assert.equal(selected.length, 2);
  assert(selected.some((n) => n.props.accessibilityState.expanded));
  const marks = f.nodes(tree).find((n) => n.type === "CoachingMarks");
  assert.equal(marks.props.width, 360);
  assert.equal(marks.props.height, 240);
  marks.props.onSelect(0);
  tree = f.render();
  const card = f
    .nodes(tree)
    .find(
      (n) =>
        n.props?.accessibilityState?.expanded &&
        n.props?.accessibilityState?.selected,
    );
  assert(card.props.accessibilityLabel.includes("Strengthen focal point"));
  assert.equal(
    f
      .nodes(tree)
      .filter(
        (n) =>
          n.props?.accessibilityState?.expanded &&
          n.props?.accessibilityLabel?.startsWith("Note "),
      ).length,
    1,
  );
  f.nodes(tree)
    .find((n) => n.props?.accessibilityLabel === "Visual coaching notes")
    .props.onPress();
  assert(
    !f.nodes(f.render()).some((n) => n.props?.accessibilityState?.expanded),
  );
  image.props.onError();
  assert.equal(f.render(), null);
});
test("unavailable image, invalid or missing overlays produce no overlay section", () => {
  const f = fixture(true);
  assert.equal(f.render(), null);
  assert.equal(f.render(), null);
  const good = fixture();
  good.render();
  assert.equal(good.render("image", null), null);
  assert.equal(good.render("image", []), null);
  assert.equal(good.render("image", [{ x: 200 }]), null);
});

test("visual note cards start collapsed, and mark selection opens the matching accessible note", () => {
  const f = fixture();
  f.render();
  let tree = f.render();
  f.nodes(tree)
    .find((node) => node.props?.onLayout)
    .props.onLayout({ nativeEvent: { layout: { width: 360 } } });
  tree = f.render();
  const toggle = f
    .nodes(tree)
    .find((node) => node.props?.accessibilityLabel === "Visual coaching notes");
  assert.equal(toggle.props["aria-expanded"], false);
  assert(
    !f
      .nodes(tree)
      .some(
        (node) =>
          node.props?.ariaExpanded || node.props?.accessibilityState?.expanded,
      ),
  );
  f.nodes(tree)
    .find((node) => node.type === "CoachingMarks")
    .props.onSelect(1);
  tree = f.render();
  assert.equal(
    f
      .nodes(tree)
      .find(
        (node) => node.props?.accessibilityLabel === "Visual coaching notes",
      ).props["aria-expanded"],
    true,
  );
  assert(
    f
      .nodes(tree)
      .some(
        (node) =>
          node.props?.accessibilityState?.selected &&
          node.props?.accessibilityState?.expanded,
      ),
  );
  f.nodes(tree)
    .find((node) => node.props?.accessibilityLabel === "Visual coaching notes")
    .props.onPress();
  tree = f.render();
  assert.equal(
    f
      .nodes(tree)
      .find(
        (node) => node.props?.accessibilityLabel === "Visual coaching notes",
      ).props["aria-expanded"],
    false,
  );
  assert(
    !f.nodes(tree).some((node) => node.props?.accessibilityState?.expanded),
  );
});

test("study marks remain selectable while contradictory correction text is suppressed", () => {
  const f = fixture();
  const data = notes.map((note) => ({
    ...note,
    label: "Correct this weak area",
    shortInstruction: "You should fix the shapes.",
    reason: "This weakens the painting.",
    action: "Move the house to the right.",
  }));
  f.render("image", data, true);
  let tree = f.render("image", data, true);
  f.nodes(tree)
    .find((node) => node.props?.onLayout)
    .props.onLayout({ nativeEvent: { layout: { width: 360 } } });
  tree = f.render("image", data, true);
  const marks = f.nodes(tree).find((node) => node.type === "CoachingMarks");
  assert.deepEqual(marks.props.notes, data);
  marks.props.onSelect(0);
  tree = f.render("image", data, true);
  const text = f
    .nodes(tree)
    .filter((node) => node.type === "Text")
    .map((node) => node.props.children)
    .flat(Infinity)
    .join(" ");
  assert(text.includes("Observe this decision"));
  assert(text.includes("Study this effect"));
  assert(text.includes("Optional next study variation"));
  assert(
    !/Correct this|should fix|weakens the painting|Move the house|Try now on this painting/.test(
      text,
    ),
  );
});

const richNote = (type, geometry = {}) => ({ ...notes[0], type, ...geometry });
const box = { x: 10, y: 20, width: 30, height: 40 };
const pathPoints = [
  { x: 10, y: 20 },
  { x: 30, y: 40 },
  { x: 50, y: 20 },
];
test("every rich mark validates without inventing geometry; degenerate and malformed marks are discarded independently", () => {
  for (const type of [
    "focal_ring",
    "crop_box",
    "region_highlight",
    "value_mass",
  ])
    assert(overlay.validOverlays([richNote(type, box)]));
  for (const type of [
    "guide_line",
    "arrow",
    "edge_mark",
    "region_highlight",
    "value_mass",
  ])
    assert(overlay.validOverlays([richNote(type, { points: pathPoints })]));
  assert(overlay.validOverlays([richNote("point_marker")]));
  for (const item of [
    richNote("focal_ring"),
    richNote("crop_box", { points: pathPoints }),
    richNote("point_marker", box),
    richNote("guide_line", box),
    richNote("arrow", {
      points: [
        { x: 10, y: 20 },
        { x: 10, y: 20 },
      ],
    }),
    richNote("region_highlight", {
      points: [
        { x: 10, y: 20 },
        { x: 20, y: 30 },
        { x: 30, y: 40 },
      ],
    }),
    richNote("value_mass", {
      points: [
        { x: 10, y: 20 },
        { x: 30, y: 40 },
      ],
    }),
    richNote("guide_line", {
      points: [
        { x: 0, y: 0 },
        { x: 101, y: 30 },
      ],
    }),
    richNote("guide_line", {
      points: [
        { x: 0, y: 0 },
        { x: 20, y: 30, extra: true },
      ],
    }),
    richNote("region_highlight", { ...box, points: pathPoints }),
    richNote("point_marker", { category: "object_recognition" }),
    richNote("point_marker", { styleHint: "neon" }),
    richNote("point_marker", { valueGroup: "black" }),
  ]) {
    assert(!overlay.validOverlays([item]), JSON.stringify(item));
    const usable = overlay.usableOverlays([item, notes[1]]);
    assert.deepEqual(usable.at(-1), notes[1]);
    if (usable.length > 1) {
      assert.equal(usable[0].type, "point_marker");
      assert.equal(usable[0].x, item.x);
      assert.equal(usable[0].y, item.y);
      assert.equal(usable[0].points, undefined);
      assert.equal(usable[0].width, undefined);
      assert.equal(usable[0].action, item.action);
    }
  }
  const sameId = richNote("point_marker", { id: "focus-1" });
  assert(!overlay.validOverlays([sameId, sameId]));
  assert.deepEqual(overlay.usableOverlays([sameId, sameId]), [sameId]);
  assert.deepEqual(overlay.usableOverlays([{ x: 200 }]), []);
  assert.equal(overlay.usableOverlays(Array(100).fill(notes[0])).length, 6);
});
test("responsive geometry aligns boxes and paths to the original image; old saved region types remain useful", () => {
  const g = drawing.markGeometry(richNote("focal_ring", box), 360, 240);
  assert.deepEqual(g, {
    kind: "focal_ring",
    x: 36,
    y: 48,
    width: 108,
    height: 96,
    points: [],
  });
  const path = richNote("arrow", { points: pathPoints });
  assert.deepEqual(drawing.markGeometry(path, 200, 100).points, [
    { x: 20, y: 20 },
    { x: 60, y: 40 },
    { x: 100, y: 20 },
  ]);
  assert.deepEqual(overlay.overlayAnchor(path), { x: 30, y: 30 });
  assert.equal(overlay.overlayKind({ ...notes[0], ...box }), "focal_ring");
  assert.equal(overlay.overlayKind({ ...notes[1], ...box }), "value_mass");
  assert.equal(
    overlay.overlayKind({ ...notes[0], type: "composition_crop", ...box }),
    "crop_box",
  );
  assert.equal(drawing.arrowHead([]), "");
  assert.match(
    drawing.arrowHead([
      { x: 10, y: 10 },
      { x: 50, y: 20 },
    ]),
    /^M .+ L 50 20 L /,
  );
});
test("overlapping number anchors remain tappable and bounded without changing supplied mark geometry", () => {
  const marks = Array.from({ length: 6 }, () => richNote("focal_ring", box));
  const positions = drawing.markerPositions(marks, 327, 230);
  for (const [i, p] of positions.entries()) {
    assert.equal(p.target, 44);
    assert(p.left >= 0 && p.top >= 0);
    assert(p.left + 44 <= 327 && p.top + 44 <= 230);
    for (const other of positions.slice(0, i))
      assert(
        p.left >= other.left + 44 ||
          p.left + 44 <= other.left ||
          p.top >= other.top + 44 ||
          p.top + 44 <= other.top,
      );
  }
  assert.deepEqual(
    drawing.markGeometry(marks[0], 327, 230),
    drawing.markGeometry(marks[5], 327, 230),
  );
  const tiny = drawing.markerPositions(marks, 16, 8);
  assert(
    tiny.every(
      (p) => p.target === 8 && p.top === 0 && p.left >= 0 && p.left <= 8,
    ),
  );
});
test("SVG renderer draws each rich shape and selects the matching card with restrained highlighted marks", () => {
  const jsx = {
    jsx: (type, props) => ({ type, props }),
    jsxs: (type, props) => ({ type, props }),
    Fragment: "Fragment",
  };
  const Marks = load("components/CoachingMarks.tsx", {
    "react/jsx-runtime": jsx,
    "react-native-svg": {
      default: "Svg",
      Ellipse: "Ellipse",
      Rect: "Rect",
      Polyline: "Polyline",
      Polygon: "Polygon",
      Path: "Path",
      G: "G",
    },
    "../lib/overlayDrawing": drawing,
    "../lib/overlays": overlay,
  }).default;
  const rich = [
    richNote("focal_ring", box),
    richNote("region_highlight", box),
    richNote("value_mass", { points: pathPoints, valueGroup: "dark" }),
    richNote("crop_box", box),
    richNote("arrow", { points: pathPoints }),
    richNote("edge_mark", { points: pathPoints, styleHint: "hard" }),
  ];
  let selection;
  const tree = Marks({
    notes: rich,
    width: 360,
    height: 240,
    selected: 2,
    onSelect: (i) => (selection = i),
  });
  const nodes = (tree) =>
    !tree || typeof tree !== "object"
      ? []
      : [tree, ...[tree.props?.children].flat(Infinity).flatMap(nodes)];
  const all = nodes(tree);
  assert.equal(tree.props.viewBox, "0 0 360 240");
  for (const type of ["Ellipse", "Rect", "Polygon", "Polyline", "Path"])
    assert(all.some((n) => n.type === type));
  const value = all.find((n) => n.type === "Polygon");
  assert(Math.abs(value.props.fillOpacity - 0.37) < 0.001);
  assert.equal(value.props.strokeWidth, 3);
  all.filter((n) => n.type === "G")[4].props.onPress();
  assert.equal(selection, 4);
  const hard = all.filter((n) => n.type === "Polyline").at(-1);
  assert.equal(hard.props.strokeDasharray, undefined);
  const simple = Marks({
    notes: [richNote("point_marker")],
    width: 100,
    height: 100,
    selected: null,
    onSelect: () => {},
  });
  assert.equal(
    nodes(simple).filter((n) =>
      ["Rect", "Polygon", "Ellipse", "Polyline"].includes(n.type),
    ).length,
    0,
  );
});

test("semantic aliases render their instructional shapes and retain purpose even with conflicting metadata", () => {
  const expected = [
    ["reserve_light_mark", "focal_ring", "reserve_light", box],
    ["simplify_region", "region_highlight", "simplification", box],
    ["eye_flow_arrow", "arrow", "composition", { points: pathPoints }],
    ["composition_line", "guide_line", "composition", { points: pathPoints }],
  ];
  const jsx = {
    jsx: (type, props) => ({ type, props }),
    jsxs: (type, props) => ({ type, props }),
    Fragment: "Fragment",
  };
  const Marks = load("components/CoachingMarks.tsx", {
    "react/jsx-runtime": jsx,
    "react-native-svg": {
      default: "Svg",
      Ellipse: "Ellipse",
      Rect: "Rect",
      Polyline: "Polyline",
      Polygon: "Polygon",
      Path: "Path",
      G: "G",
    },
    "../lib/overlayDrawing": drawing,
    "../lib/overlays": overlay,
  }).default;
  const nodes = (t) =>
    !t || typeof t !== "object"
      ? []
      : [t, ...[t.props?.children].flat(Infinity).flatMap(nodes)];
  for (const [type, kind, category, geometry] of expected) {
    const note = richNote(type, {
      ...geometry,
      category: "color_temperature",
      timing: "both",
    });
    assert(overlay.validOverlays([note]));
    assert.equal(overlay.overlayKind(note), kind);
    assert.equal(overlay.overlayCategory(note), category);
    const broken = overlay.usableOverlays([
      { ...note, width: 150, height: 150, points: null },
    ])[0];
    assert.equal(broken.type, "point_marker");
    assert.equal(overlay.overlayCategory(broken), category);
    const tree = Marks({
      notes: [note],
      width: 320,
      height: 240,
      selected: 0,
      onSelect: () => {},
    });
    const all = nodes(tree);
    assert(
      all.some(
        (n) =>
          n.type ===
          (kind === "focal_ring"
            ? "Ellipse"
            : kind === "region_highlight"
              ? "Rect"
              : "Polyline"),
      ),
    );
    if (type === "reserve_light_mark") {
      assert.equal(presentation.markMeaning(note), "Keep this light clean.");
      assert(all.some((n) => n.props?.stroke === "#F7EDD4"));
    }
  }
});
test("timing and action cards separate safe adjustments from structural next-study experiments", () => {
  for (const action of [
    "Move the house slightly right.",
    "Place the figures farther right.",
    "Increase the sky area and reduce the foreground.",
    "Make the house smaller.",
    "Lower the horizon.",
    "Test this crop.",
  ]) {
    assert(presentation.requiresNewStudy(action), action);
    const note = richNote("point_marker", {
      timing: "current_painting",
      action,
    });
    assert.equal(presentation.coachingTiming(note), "next_study");
    const decision = presentation.compositionGuidance({
      decision: { tryNow: action },
      mainAdvice: "The focal contrast is scattered.",
      composition: "Try a quiet supporting mass.",
    });
    assert(!decision.tryNow.includes(action));
    assert.equal(decision.nextStudy, action);
  }
  const action = "Soften the distant edge after testing on scrap paper.";
  assert(!presentation.requiresNewStudy(action));
  assert.equal(
    presentation.timingLabel(
      richNote("edge_mark", {
        points: pathPoints,
        timing: "current_painting",
        action,
      }),
    ),
    "Try now on this painting",
  );
  assert.equal(
    presentation.timingLabel(
      richNote("crop_box", { ...box, timing: "current_painting" }),
    ),
    "Try in the next study",
  );
  assert(
    !overlay.validOverlays([richNote("point_marker", { timing: "urgent" })]),
  );
  const arrow = [
    { x: 10, y: 10 },
    { x: 90, y: 90 },
  ];
  assert.equal(
    drawing.arrowHead([...arrow, arrow[1]]),
    drawing.arrowHead(arrow),
  );
  assert.equal(drawing.arrowHead([arrow[0], arrow[0]]), "");
});

test("displayed overlays are priority-ranked and limited to three supplied marks", () => {
  const f = fixture();
  const data = [
    { ...notes[0], id: "low", priority: "low", label: "Low priority mark" },
    { ...notes[0], id: "medium", priority: "medium", label: "Supporting mark" },
    { ...notes[0], id: "high-a", priority: "high", label: "Primary decision" },
    {
      ...notes[0],
      id: "high-b",
      priority: "high",
      label: "Second primary mark",
    },
    { ...notes[0], id: "low-b", priority: "low", label: "Another low mark" },
  ];
  assert.deepEqual(
    f.curated(data).map((n) => n.id),
    ["high-a", "high-b", "medium"],
  );
  assert.equal(f.curated(data)[0].x, data[2].x);
  f.render("image", data);
  let tree = f.render("image", data);
  f.nodes(tree)
    .find((n) => n.props?.onLayout)
    .props.onLayout({ nativeEvent: { layout: { width: 360 } } });
  tree = f.render("image", data);
  const marks = f.nodes(tree).find((n) => n.type === "CoachingMarks");
  assert.equal(marks.props.notes.length, 3);
  const text = f
    .nodes(tree)
    .filter((n) => n.type === "Text")
    .flatMap((n) => [n.props.children].flat(Infinity))
    .join(" ")
    .replace(/\s+/g, " ");
  assert(text.includes("3 coaching notes · tap a marker or open notes"));
  assert(!text.includes("Primary decision"));
});

test("marker selection opens only its relevant note; showing every card is explicit", () => {
  const f = fixture();
  f.render();
  let tree = f.render();
  f.nodes(tree)
    .find((n) => n.props?.onLayout)
    .props.onLayout({ nativeEvent: { layout: { width: 360 } } });
  tree = f.render();
  f.nodes(tree)
    .find((n) => n.type === "CoachingMarks")
    .props.onSelect(1);
  tree = f.render();
  const cards = (value) =>
    f
      .nodes(value)
      .filter(
        (n) =>
          n.props?.accessibilityLabel?.startsWith("Note ") &&
          "expanded" in (n.props.accessibilityState || {}),
      );
  assert.equal(cards(tree).length, 1);
  assert(cards(tree)[0].props.accessibilityLabel.includes("Group this shadow"));
  const all = f
    .nodes(tree)
    .find((n) => n.props?.accessibilityLabel === "Show all notes");
  assert(all);
  all.props.onPress();
  tree = f.render();
  assert.equal(cards(tree).length, 3);
  assert.equal(
    cards(tree).filter((n) => n.props.accessibilityState.expanded).length,
    1,
  );
  f.nodes(tree)
    .find((n) => n.props?.accessibilityLabel === "Show selected note only")
    .props.onPress();
  assert.equal(cards(f.render()).length, 1);
  tree = f.render();
  f.nodes(tree)
    .find((n) => n.props?.accessibilityLabel === "Show all notes")
    .props.onPress();
  assert.equal(cards(f.render()).length, 3);
  tree = f.render();
  f.nodes(tree)
    .find((n) => n.type === "CoachingMarks")
    .props.onSelect(0);
  assert.equal(cards(f.render()).length, 1);
});

test("compact image delegates note opening to Explore without rendering long note cards", () => {
  const f = fixture();
  let selected,
    opened = 0;
  const props = {
    hideNotes: true,
    selectedNote: null,
    onSelectNote: (index) => {
      selected = index;
    },
    onOpenNotes: () => {
      opened++;
    },
  };
  f.render("image", notes, false, props);
  let tree = f.render("image", notes, false, props);
  f.nodes(tree)
    .find((n) => n.props?.onLayout)
    .props.onLayout({ nativeEvent: { layout: { width: 360 } } });
  tree = f.render("image", notes, false, props);
  assert(!f.nodes(tree).some((n) => n.props?.accessibilityState?.expanded));
  f.nodes(tree)
    .find((n) => n.type === "CoachingMarks")
    .props.onSelect(2);
  assert.equal(selected, 2);
  tree = f.render("image", notes, false, { ...props, selectedNote: selected });
  assert.equal(
    f.nodes(tree).find((n) => n.type === "CoachingMarks").props.selected,
    2,
  );
  assert(!f.nodes(tree).some((n) => n.props?.accessibilityState?.expanded));
  f.nodes(tree)
    .find((n) => n.props?.accessibilityLabel === "Open visual coaching notes")
    .props.onPress();
  assert.equal(opened, 1);
});

test("image sizing and render failures notify text-only image fallback", () => {
  let errors = 0;
  const missing = fixture(true);
  missing.render("bad", notes, false, {
    onImageError: () => {
      errors++;
    },
  });
  assert.equal(errors, 1);
  assert.equal(missing.render("bad", notes), null);
  const good = fixture();
  good.render();
  let tree = good.render();
  good
    .nodes(tree)
    .find((n) => n.props?.onLayout)
    .props.onLayout({ nativeEvent: { layout: { width: 360 } } });
  tree = good.render("image", notes, false, {
    onImageError: () => {
      errors++;
    },
  });
  good
    .nodes(tree)
    .find((n) => n.type === good.Image)
    .props.onError();
  assert.equal(errors, 2);
  assert.equal(good.render(), null);
});
