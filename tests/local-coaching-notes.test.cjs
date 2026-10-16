const { loadShared } = require("./helpers/shared-loader.cjs");
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");
const root = path.resolve(__dirname, "..");
const jsx = {
  jsx: (type, props) => ({ type, props }),
  jsxs: (type, props) => ({ type, props }),
  Fragment: "Fragment",
};
function load(file, mocks = {}) {
  const exports = {};
  const source = ts.transpileModule(
    fs.readFileSync(path.join(root, file), "utf8"),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        jsx: ts.JsxEmit.ReactJSX,
        target: ts.ScriptTarget.ES2022,
      },
    },
  ).outputText;
  new Function("exports", "require", source)(exports, (name) => {
    if (!(name in mocks)) return loadShared(name, file);
    return mocks[name];
  });
  return exports;
}
const geometry = load("shared/imageGeometry.ts");
const metadata = load("shared/visualMetadata.ts", {
  "./imageGeometry.ts": geometry,
});
const overlays = load("lib/overlays.ts", {
  "../shared/imageGeometry.ts": geometry,
  "../shared/visualMetadata.ts": metadata,
});
const drawing = load("lib/overlayDrawing.ts", {
  "./overlays": overlays,
  "./imageGeometry": geometry,
});
const presentation = load("lib/coachingPresentation.ts", {
  "./overlays": overlays,
});
const teachingEvidence = load("lib/teachingEvidence.ts");
const localPresentation = load("lib/localNotePresentation.ts", {
  "./overlayDrawing": drawing,
  "./coachingPresentation": presentation,
  "../shared/visualMetadata": metadata,
});
const roles = load("lib/visualRoles.ts", {
  "../shared/visualMetadata": metadata,
  "./imageGeometry": geometry,
});
const ui = {
  colors: {
    paper: "#faf6ef",
    pale: "#f2f6f1",
    accent: "#486c64",
    ink: "#252c2b",
    border: "#ddd",
  },
  styles: { card: {}, body: {}, caption: {}, heading: {} },
};
function hooks() {
  const values = [];
  let index = 0,
    effectKey;
  return {
    begin() {
      index = 0;
    },
    react: {
      useState(initial) {
        const slot = index++;
        if (!(slot in values)) values[slot] = initial;
        return [
          values[slot],
          (next) => {
            values[slot] =
              typeof next === "function" ? next(values[slot]) : next;
          },
        ];
      },
      useEffect(fn, deps) {
        if (effectKey !== deps[0]) {
          effectKey = deps[0];
          fn();
        }
      },
    },
  };
}
function nodes(tree) {
  if (!tree || typeof tree !== "object") return [];
  return [tree, ...[tree.props?.children].flat(Infinity).flatMap(nodes)];
}
function text(tree) {
  return nodes(tree)
    .filter((n) => n.type === "Text")
    .flatMap((n) => [n.props.children].flat(Infinity))
    .join(" ")
    .replace(/\s+/g, " ");
}
function components(width = 375) {
  const state = hooks();
  let sizing = 0;
  const Image = Object.assign(() => null, {
    getSize: (_, ok) => {
      sizing++;
      ok(1200, 900);
    },
  });
  const native = {
    Image,
    Pressable: "Pressable",
    Text: "Text",
    View: "View",
    useWindowDimensions: () => ({ width, height: 900 }),
  };
  const loaded = load("components/CoachingOverlay.tsx", {
    react: state.react,
    "react/jsx-runtime": jsx,
    "react-native": native,
    "react-native-svg": { default: "Svg", Path: "Path" },
    "../lib/overlays": overlays,
    "../lib/overlayDrawing": drawing,
    "../lib/coachingPresentation": presentation,
    "../lib/localNotePresentation": localPresentation,
    "../lib/teachingEvidence": teachingEvidence,
    "../lib/visualRoles": roles,
    "../shared/imageGeometry": geometry,
    "../shared/visualMetadata": metadata,
    "./CoachingMarks": { default: "CoachingMarks" },
    "./VisualRoleMap": { default: "VisualRoleMap" },
    "./CompositionStructure": { default: "CompositionStructure" },
    "./RegionCrop": { default: "RegionCrop" },
    "./ui": ui,
  });
  return {
    ...loaded,
    Image,
    sizing: () => sizing,
    render(Component, props) {
      state.begin();
      return Component(props);
    },
  };
}
const note = (patch = {}) => ({
  id: "roof",
  type: "point_marker",
  label: "Sunlit roof",
  x: 47,
  y: 28,
  priority: "high",
  shortInstruction: "Keep this light joined to the nearby wall.",
  reason: "The connected light shape gives the roof a clear focal role.",
  action: "Compare the light shape in a separate thumbnail study.",
  region: { x: 0.35, y: 0.18, width: 0.2, height: 0.17 },
  regionConfidence: 0.9,
  classification: "strength",
  evidence: "The roof is the warmest shape against the soft cool background.",
  domain: "composition",
  relatedDomain: "colour_value",
  ...patch,
});
for (const label of [
  "Related passage",
  "Related passage 1",
  "Related passages",
]) {
  test(`generic note caption '${label}' becomes neutral without changing supplied source areas`, () => {
    const f = components();
    const regions = [
      { x: 0.1, y: 0.2, width: 0.18, height: 0.2 },
      { x: 0.6, y: 0.25, width: 0.2, height: 0.18 },
    ];
    const supplied = [
      note({
        label,
        scope: "multi_region",
        region: null,
        regions,
        anchors: null,
      }),
    ];
    const before = structuredClone(supplied);
    const tree = f.render(f.VisualCoachingNotes, {
      notes: supplied,
      uri: "same-original",
      sourceSize: { width: 1200, height: 900 },
    });
    assert(!text(tree).includes("Related passage"));
    assert(text(tree).includes("Multiple source areas"));
    const crops = nodes(tree).filter((n) => n.type === "RegionCrop");
    assert.deepEqual(
      crops.map((n) => n.props.label),
      ["Source area 1", "Source area 2"],
    );
    assert.deepEqual(
      crops.map((n) => n.props.region),
      regions,
    );
    assert.deepEqual(supplied, before);
  });
}
test("supplied semantic relationship labels remain available in Notes and numbered source captions", () => {
  const f = components();
  const tree = f.render(f.VisualCoachingNotes, {
    notes: [
      note({
        label: "Focal contour / distant passage",
        scope: "multi_region",
        region: null,
        regions: [
          { x: 0.1, y: 0.2, width: 0.18, height: 0.2 },
          { x: 0.6, y: 0.25, width: 0.2, height: 0.18 },
        ],
        anchors: null,
      }),
    ],
    uri: "same-original",
    sourceSize: { width: 1200, height: 900 },
  });
  assert(text(tree).includes("Focal contour / distant passage"));
  assert.deepEqual(
    nodes(tree)
      .filter((n) => n.type === "RegionCrop")
      .map((n) => n.props.label),
    [
      "Focal contour / distant passage · area 1",
      "Focal contour / distant passage · area 2",
    ],
  );
});
test("local notes use the original URI, intrinsic size and shared target, with mobile crop above text", () => {
  const f = components(375);
  let selected;
  const data = [note()];
  const tree = f.render(f.VisualCoachingNotes, {
    notes: data,
    uri: "private-signed-original",
    sourceSize: { width: 1200, height: 900 },
    selected: 0,
    onSelect: (i) => (selected = i),
  });
  const crop = nodes(tree).find((n) => n.type === "RegionCrop");
  assert(crop);
  assert.equal(crop.props.uri, "private-signed-original");
  assert.deepEqual(crop.props.sourceSize, { width: 1200, height: 900 });
  assert.deepEqual(crop.props.region, data[0].region);
  assert.equal(crop.props.desktop, false);
  assert.equal(crop.props.selected, true);
  crop.props.onPress();
  assert.equal(selected, 0);
  assert(text(tree).includes("Strength"));
  assert(text(tree).includes("Why this works"));
  assert(text(tree).includes("Also affects: Colour & value"));
  assert(!text(tree).includes("Clear issue"));
  assert.equal(f.sizing(), 0, "note views never fetch intrinsic size");
  for (const button of nodes(tree).filter((n) => n.type === "Pressable"))
    assert(
      !nodes(button.props.children).some((n) => n.type === "Pressable"),
      "buttons are not nested",
    );
});
test("note or crop selection updates the same controlled index and desktop crop sits beside text", () => {
  const f = components(1440);
  const data = [
    note(),
    note({
      id: "water",
      label: "Quiet water",
      priority: "medium",
      region: { x: 0.1, y: 0.6, width: 0.7, height: 0.22 },
      classification: "optional_refinement",
    }),
  ];
  let selected = 0;
  const render = () =>
    f.render(f.VisualCoachingNotes, {
      notes: data,
      selected,
      onSelect: (i) => (selected = i),
      uri: "original",
      sourceSize: { width: 1200, height: 900 },
    });
  let tree = render();
  nodes(tree)
    .find((n) => n.props?.accessibilityLabel === "Show all notes")
    .props.onPress();
  tree = render();
  const cards = nodes(tree).filter((n) =>
    n.props?.accessibilityLabel?.startsWith("Note "),
  );
  cards[1].props.onPress();
  assert.equal(selected, 1);
  tree = render();
  assert.equal(
    nodes(tree).filter((n) => n.type === "RegionCrop").length,
    1,
    "selection returns to a compact single note",
  );
  const crop = nodes(tree).find((n) => n.type === "RegionCrop");
  assert.equal(crop.props.label, "Quiet water");
  assert.equal(crop.props.selected, true);
  assert.equal(crop.props.desktop, true);
  const row = nodes(tree).find((n) => Array.isArray(n.props?.style));
  assert.equal(row.props.style[1].flexDirection, "row");
});
test("unreliable, point-only, missing size and missing URI notes retain text without invented crops", () => {
  for (const patch of [
    { region: null },
    {
      region: { x: 0.35, y: 0.18, width: 0.2, height: 0.17 },
      regionConfidence: 0.3,
    },
    { region: undefined, regionConfidence: undefined },
    { region: { x: -0.1, y: 0.2, width: 0.2, height: 0.2 } },
  ]) {
    const f = components();
    const tree = f.render(f.VisualCoachingNotes, {
      notes: [note(patch)],
      uri: "original",
      sourceSize: { width: 1200, height: 900 },
    });
    assert(!nodes(tree).some((n) => n.type === "RegionCrop"));
    assert(text(tree).includes("Sunlit roof"));
  }
  for (const props of [
    { uri: "original" },
    { sourceSize: { width: 1200, height: 900 } },
  ]) {
    const f = components();
    const tree = f.render(f.VisualCoachingNotes, { notes: [note()], ...props });
    assert(!nodes(tree).some((n) => n.type === "RegionCrop"));
    assert(text(tree).includes("Sunlit roof"));
  }
});
test("strong work has specific success labels and optional alternatives, without a forced clear issue", () => {
  const f = components();
  for (const classification of [
    "strength",
    "clear_issue",
    "stylistic_alternative",
    "study_experiment",
  ]) {
    const tree = f.render(f.VisualCoachingNotes, {
      notes: [note({ classification })],
      study: true,
    });
    assert(!text(tree).includes("Clear issue"));
    assert(
      text(tree).includes(
        classification === "clear_issue"
          ? "Optional refinement"
          : metadata.classificationLabel(classification),
      ),
    );
    assert(text(tree).includes("Optional next study variation"));
  }
});
test("composition-only image supplies intrinsic dimensions before a hidden overlay is enabled", () => {
  const f = components();
  const changes = [];
  const overlay = {
    type: "diagonal",
    confidence: 0.9,
    shortExplanation: "The quay leads towards the roof.",
    paths: [
      [
        { x: 0.1, y: 0.8 },
        { x: 0.7, y: 0.3 },
      ],
    ],
    focalPoint: { x: 0.7, y: 0.3 },
    secondaryPoints: null,
    masses: null,
  };
  const props = {
    uri: "original",
    notes: [],
    label: "Your painting",
    compositionOverlay: overlay,
    showComposition: false,
    onImageSize: (size) => changes.push(size),
  };
  assert.equal(f.render(f.default, props), null);
  let tree = f.render(f.default, props);
  nodes(tree)
    .find((n) => n.props?.onLayout)
    .props.onLayout({ nativeEvent: { layout: { width: 360 } } });
  tree = f.render(f.default, props);
  assert.deepEqual(changes, [null, { width: 1200, height: 900 }]);
  assert.equal(f.sizing(), 1);
  assert(!nodes(tree).some((n) => n.type === "CompositionStructure"));
  assert(!text(tree).includes("coaching notes"));
  assert(
    !nodes(tree).some((n) =>
      n.props?.accessibilityLabel?.includes("visual coaching"),
    ),
  );
  tree = f.render(f.default, { ...props, showComposition: true });
  const structure = nodes(tree).find((n) => n.type === "CompositionStructure");
  assert(structure);
  assert.equal(structure.props.frame.width, 360);
  assert.equal(structure.props.frame.height, 270);
  nodes(tree)
    .find((n) => n.type === f.Image)
    .props.onError();
  assert.equal(changes.at(-1), null);
  assert.equal(f.render(f.default, props), null);
});
test("RegionCrop clips the unchanged original URI with shared offsets and omits failed or tiny crops", () => {
  const state = hooks();
  const f = load("components/RegionCrop.tsx", {
    react: state.react,
    "react/jsx-runtime": jsx,
    "react-native": {
      Image: "Image",
      Pressable: "Pressable",
      Text: "Text",
      View: "View",
    },
    "../shared/imageGeometry": geometry,
    "./ui": ui,
  }).default;
  const sourceSize = { width: 1200, height: 900 };
  const region = note().region;
  const props = {
    uri: "same-private-source",
    sourceSize,
    region,
    label: "Roof",
    selected: true,
    onPress() {},
  };
  const render = (values) => {
    state.begin();
    return f(values);
  };
  let tree = render(props);
  const expected = geometry.cropView(region, sourceSize, {
    width: 240,
    height: 156,
  });
  const image = nodes(tree).find((n) => n.type === "Image");
  assert.deepEqual(image.props.source, { uri: "same-private-source" });
  assert.deepEqual(image.props.style, {
    position: "absolute",
    left: expected.image.x,
    top: expected.image.y,
    width: expected.image.width,
    height: expected.image.height,
  });
  assert(nodes(tree).some((n) => n.props?.style?.overflow === "hidden"));
  image.props.onError();
  assert.equal(render(props), null);
  assert.equal(
    render({
      ...props,
      uri: "other",
      region: { x: 0.2, y: 0.2, width: 0, height: 0.1 },
    }),
    null,
  );
  const source = fs.readFileSync(
    path.join(root, "components/RegionCrop.tsx"),
    "utf8",
  );
  assert(
    !/getSize|canvas|upload|download|supabase|createObjectURL/.test(source),
  );
});

test("multi-region notes show several contexts while anchors-only and global observations never fake a local crop", () => {
  const f = components();
  const regions = [
    { x: 0.1, y: 0.2, width: 0.18, height: 0.2 },
    { x: 0.6, y: 0.25, width: 0.2, height: 0.18 },
  ];
  let tree = f.render(f.VisualCoachingNotes, {
    notes: [
      note({ scope: "multi_region", region: null, regions, anchors: null }),
    ],
    uri: "original",
    sourceSize: { width: 1200, height: 900 },
  });
  const crops = nodes(tree).filter((n) => n.type === "RegionCrop");
  assert.equal(crops.length, 2);
  assert.deepEqual(
    crops.map((n) => n.props.region),
    regions,
  );
  assert(crops.every((n) => n.props.compact));
  assert(text(tree).includes("Sunlit roof"));
  assert(!text(tree).includes("Related passages"));
  for (const patch of [
    {
      scope: "multi_region",
      region: null,
      regions: [regions[0]],
      anchors: null,
    },
    {
      scope: "multi_region",
      region: null,
      regions: [regions[0], regions[0]],
      anchors: null,
    },
    {
      scope: "multi_region",
      region: null,
      regions: [regions[0]],
      anchors: [{ x: 0.7, y: 0.4 }],
    },
    {
      scope: "multi_region",
      region: null,
      regions: null,
      anchors: [
        { x: 0.15, y: 0.2 },
        { x: 0.7, y: 0.4 },
      ],
    },
    {
      scope: "global",
      region: note().region,
      regions,
      anchors: [
        { x: 0.15, y: 0.2 },
        { x: 0.7, y: 0.4 },
      ],
    },
  ]) {
    tree = f.render(f.VisualCoachingNotes, {
      notes: [note(patch)],
      uri: "original",
      sourceSize: { width: 1200, height: 900 },
    });
    assert(!nodes(tree).some((n) => n.type === "RegionCrop"));
    assert(text(tree).includes("Sunlit roof"));
  }
});

test("evidence precedes interpretation; unsupported corrections become conditional study experiments", () => {
  const f = components();
  let tree = f.render(f.VisualCoachingNotes, {
    notes: [note({ classification: "clear_issue" })],
  });
  let content = text(tree);
  assert(content.indexOf("What I see:") < content.indexOf("Why it matters"));
  assert(content.includes("Clear issue"));
  tree = f.render(f.VisualCoachingNotes, {
    notes: [
      note({
        label: "Fix this weak roof",
        shortInstruction: "You must fix this poor shape.",
        reason: "This mistake weakens the painting.",
        action: "Move the pavilion right.",
        classification: "clear_issue",
        evidence: null,
      }),
    ],
  });
  content = text(tree);
  assert(content.includes("Study experiment"));
  assert(content.includes("If useful"));
  assert(content.includes("Optional next study variation"));
  assert(
    !/must fix|weak roof|poor shape|mistake|weakens|Move the pavilion/.test(
      content,
    ),
  );
  tree = f.render(f.VisualCoachingNotes, {
    notes: [
      note({
        classification: "stylistic_alternative",
        evidence: null,
        shortInstruction: "In a separate study, compare a cooler roof.",
        action: "In a separate study, compare a cooler roof.",
      }),
    ],
  });
  content = text(tree);
  assert(content.includes("Stylistic alternative"));
  assert(content.includes("compare a cooler roof"));
  assert(!content.includes("Clear issue"));
});

test("Show all reuses visual evidence for repeated passages and always retains the selected note context", () => {
  const f = components();
  const data = [
    note(),
    note({
      id: "roof-colour",
      label: "Roof temperature",
      priority: "medium",
      domain: "colour_value",
      relatedDomain: "composition",
    }),
  ];
  let selected = 0;
  const render = () =>
    f.render(f.VisualCoachingNotes, {
      notes: data,
      selected,
      onSelect: (value) => (selected = value),
      uri: "original",
      sourceSize: { width: 1200, height: 900 },
    });
  let tree = render();
  nodes(tree)
    .find((n) => n.props?.accessibilityLabel === "Show all notes")
    .props.onPress();
  tree = render();
  assert.equal(nodes(tree).filter((n) => n.type === "RegionCrop").length, 1);
  assert(text(tree).includes("Shared image context with note 1"));
  assert.equal(text(tree).split("What I see:").length - 1, 1);
  nodes(tree)
    .find((n) => n.props?.accessibilityLabel?.startsWith("Note 2:"))
    .props.onPress();
  tree = render();
  assert.equal(nodes(tree).filter((n) => n.type === "RegionCrop").length, 1);
  assert.equal(
    nodes(tree).find((n) => n.type === "RegionCrop").props.label,
    "Roof temperature",
  );
});

test("clean/coaching and Notes/Composition/Roles remain exclusive local state over the unchanged source", () => {
  const f = components();
  const compositionOverlay = {
    type: "diagonal",
    confidence: 0.9,
    shortExplanation: "The quay leads towards the roof.",
    paths: [
      [
        { x: 0.1, y: 0.8 },
        { x: 0.7, y: 0.3 },
      ],
    ],
    focalPoint: { x: 0.7, y: 0.3 },
    secondaryPoints: null,
    masses: null,
  };
  const roleRegions = [
    { kind: "rectangle", role: "focal", region: note().region },
    {
      kind: "rectangle",
      role: "quiet",
      region: { x: 0.1, y: 0.1, width: 0.2, height: 0.2 },
    },
  ];
  const props = {
    uri: "same-original",
    notes: [note()],
    label: "Your painting",
    compositionOverlay,
    roleRegions,
    hideNotes: true,
  };
  f.render(f.default, props);
  let tree = f.render(f.default, props);
  nodes(tree)
    .find((n) => n.props?.onLayout)
    .props.onLayout({ nativeEvent: { layout: { width: 360 } } });
  for (const mode of ["notes", "composition", "roles"]) {
    for (const visible of [true, false]) {
      tree = f.render(f.default, {
        ...props,
        visualMode: mode,
        coachingVisible: visible,
      });
      const items = nodes(tree);
      assert.deepEqual(items.find((n) => n.type === f.Image).props.source, {
        uri: "same-original",
      });
      assert.equal(
        items.filter((n) => n.type === "CoachingMarks").length,
        visible && mode === "notes" ? 1 : 0,
      );
      assert.equal(
        items.filter((n) => n.type === "CompositionStructure").length,
        visible && mode === "composition" ? 1 : 0,
      );
      assert.equal(
        items.filter((n) => n.type === "VisualRoleMap").length,
        visible && mode === "roles" ? 1 : 0,
      );
      if (!visible || mode !== "notes")
        assert(
          !items.some((n) => n.props?.testID?.startsWith("coaching-marker-")),
        );
    }
  }
  assert.equal(
    f.sizing(),
    1,
    "toggling layers does not fetch another source or analysis",
  );
});

test("whole-painting and low-confidence notes retain text without false numbered image anchors", () => {
  for (const patch of [{ scope: "global" }, { regionConfidence: 0.3 }]) {
    const f = components();
    const props = {
      uri: "original",
      notes: [note(patch)],
      label: "Your painting",
    };
    f.render(f.default, props);
    let tree = f.render(f.default, props);
    nodes(tree)
      .find((n) => n.props?.onLayout)
      .props.onLayout({ nativeEvent: { layout: { width: 360 } } });
    tree = f.render(f.default, props);
    assert(
      !nodes(tree).some((n) => n.props?.testID?.startsWith("coaching-marker-")),
    );
    assert(text(tree).includes("choose Notes for whole-painting context"));
  }
});

test("generic source wording is removed from selected-note accessibility instructions as well as headings", () => {
  const f = components();
  const tree = f.render(f.VisualCoachingNotes, {
    notes: [
      note({
        label: "Related passages",
        shortInstruction: "Related passages",
        scope: "multi_region",
        regions: [
          { x: 0.1, y: 0.1, width: 0.2, height: 0.2 },
          { x: 0.5, y: 0.5, width: 0.2, height: 0.2 },
        ],
      }),
    ],
    selected: 0,
  });
  assert(!/Related passages?/i.test(text(tree)));
  for (const item of nodes(tree))
    assert(!/Related passages?/i.test(item.props?.accessibilityLabel ?? ""));
});
