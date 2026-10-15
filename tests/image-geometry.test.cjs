const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");
const root = path.resolve(__dirname, "..");
const cache = new Map();
const jsx = {
  jsx: (type, props) => ({ type, props }),
  jsxs: (type, props) => ({ type, props }),
  Fragment: "Fragment",
};
function load(file) {
  const resolved = path.resolve(root, file);
  if (cache.has(resolved)) return cache.get(resolved);
  const exports = {};
  cache.set(resolved, exports);
  const code = ts.transpileModule(fs.readFileSync(resolved, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.ReactJSX,
    },
  }).outputText;
  new Function("exports", "require", code)(exports, (name) => {
    if (name === "react/jsx-runtime") return jsx;
    if (name === "react-native-svg")
      return {
        default: "Svg",
        Ellipse: "Ellipse",
        Rect: "Rect",
        Polyline: "Polyline",
        Polygon: "Polygon",
        Path: "Path",
        G: "G",
      };
    assert(name.startsWith("."), `Unexpected geometry dependency: ${name}`);
    const candidate = path.resolve(path.dirname(resolved), name);
    return load(/\.tsx?$/.test(candidate) ? candidate : `${candidate}.ts`);
  });
  return exports;
}
const geometry = load("shared/imageGeometry.ts");
const drawing = load("lib/overlayDrawing.ts");
const close = (actual, expected) =>
  assert(Math.abs(actual - expected) < 1e-8, `${actual} != ${expected}`);
const region = { x: 0.58, y: 0.3, width: 0.16, height: 0.2 };
const center = { x: 0.66, y: 0.4 };
const note = {
  type: "region_highlight",
  label: "Focal building",
  x: 58,
  y: 30,
  width: 16,
  height: 20,
  priority: "high",
  shortInstruction: "Keep this light shape clear.",
  reason: "It anchors the connected supporting masses.",
  action: "Observe the surrounding quiet shapes.",
};

test("one normalized coordinate contract rejects non-finite, out-of-range and malformed geometry", () => {
  assert(geometry.validPoint(center));
  assert(geometry.validRect(region));
  for (const bad of [
    null,
    { x: -0.1, y: 0.4 },
    { x: 0.4, y: 1.1 },
    { x: NaN, y: 0.4 },
    { x: 0.4, y: Infinity },
    { x: "0.4", y: 0.4 },
    { x: 0.4, y: 0.4, screenX: 44 },
  ])
    assert(!geometry.validPoint(bad), JSON.stringify(bad));
  for (const bad of [
    { ...region, width: 0 },
    { ...region, height: -0.2 },
    { ...region, x: 0.99 },
    { ...region, y: 0.99 },
    { ...region, width: Infinity },
    { ...region, cropUri: "generated.png" },
  ])
    assert(!geometry.validRect(bad), JSON.stringify(bad));
  assert.equal(
    geometry.containFrame(
      { width: 0, height: 10 },
      { width: 100, height: 100 },
    ),
    null,
  );
  assert.equal(
    geometry.containFrame(
      { width: 10, height: 10 },
      { width: Infinity, height: 100 },
    ),
    null,
  );
});

test("regions use reliable explicit bounds or actual legacy extents; points and open paths never invent crops", () => {
  assert.deepEqual(
    geometry.noteRegion({ ...note, region, regionConfidence: 0.8 }),
    region,
  );
  assert.deepEqual(geometry.noteRegion(note), region);
  const polygon = {
    ...note,
    width: undefined,
    height: undefined,
    points: [
      { x: 58, y: 30 },
      { x: 74, y: 30 },
      { x: 74, y: 50 },
    ],
  };
  const bounds = geometry.noteRegion(polygon);
  close(bounds.x, region.x);
  close(bounds.y, region.y);
  close(bounds.width, region.width);
  close(bounds.height, region.height);
  for (const bad of [
    { ...note, region: { ...region, x: -1 } },
    { ...note, region, regionConfidence: 0.64 },
    { ...note, region, regionConfidence: NaN },
    { ...note, region: null },
    { ...note, region: undefined },
    { ...note, type: "point_marker", width: undefined, height: undefined },
    { ...polygon, type: "arrow" },
  ])
    assert.equal(geometry.noteRegion(bad), null);
  const anchor = geometry.noteAnchor({ ...note, region: null });
  close(anchor.x, center.x);
  close(anchor.y, center.y);
});

test("mass polygons accept genuine closed regions and discard collapsed or self-crossing shapes", () => {
  const triangle = [
    { x: 0.1, y: 0.1 },
    { x: 0.8, y: 0.2 },
    { x: 0.4, y: 0.8 },
  ];
  assert(geometry.validPolygon(triangle));
  assert(geometry.validPolygon([...triangle, triangle[0]]));
  assert(
    !geometry.validPolygon([
      { x: 0, y: 0 },
      { x: 0.5, y: 0.5 },
      { x: 1, y: 1 },
    ]),
  );
  assert(
    !geometry.validPolygon([
      { x: 0.1, y: 0.1 },
      { x: 0.9, y: 0.9 },
      { x: 0.1, y: 0.8 },
      { x: 0.9, y: 0.1 },
    ]),
  );
});

for (const source of [
  { width: 1200, height: 900 },
  { width: 900, height: 1200 },
  { width: 1000, height: 1000 },
  { width: 2000, height: 700 },
]) {
  for (const width of [320, 375, 1440]) {
    test(`marker, highlight, crop and composition coordinates align at ${source.width}:${source.height} within ${width}px contain viewport`, () => {
      const viewport = { width, height: width > 1000 ? 560 : 340 };
      const frame = geometry.containFrame(source, viewport);
      assert(frame);
      close(frame.width / frame.height, source.width / source.height);
      close(frame.x * 2 + frame.width, viewport.width);
      close(frame.y * 2 + frame.height, viewport.height);
      const point = geometry.projectPoint(center, frame);
      const highlight = drawing.activeRegionGeometry(
        note,
        width,
        viewport.height,
        frame,
      );
      const mark = drawing.markGeometry(note, width, viewport.height, frame);
      close(highlight.x, mark.x);
      close(highlight.y, mark.y);
      close(highlight.width, mark.width);
      close(highlight.height, mark.height);
      close(point.x, highlight.x + highlight.width / 2);
      close(point.y, highlight.y + highlight.height / 2);
      // The composition renderer consumes this exact projected image anchor.
      const compositionPoint = geometry.projectPoint(
        geometry.noteAnchor(note),
        frame,
      );
      close(compositionPoint.x, point.x);
      close(compositionPoint.y, point.y);
      const [marker] = drawing.markerPositions(
        [note],
        width,
        viewport.height,
        frame,
      );
      close(marker.left + marker.target / 2, point.x);
      close(marker.top + marker.target / 2, point.y);
      const crop = geometry.cropView(region, source, {
        width: width > 1000 ? 180 : 144,
        height: 120,
      });
      assert(crop);
      const cropPoint = geometry.projectPoint(center, crop.image);
      close(cropPoint.x, crop.target.x + crop.target.width / 2);
      close(cropPoint.y, crop.target.y + crop.target.height / 2);
      close(
        (cropPoint.x - crop.image.x) / crop.image.width,
        (point.x - frame.x) / frame.width,
      );
      close(
        (cropPoint.y - crop.image.y) / crop.image.height,
        (point.y - frame.y) / frame.height,
      );
      close(crop.image.width / crop.image.height, source.width / source.height);
      assert(crop.bounds.x < region.x && crop.bounds.y < region.y);
      assert(crop.bounds.x + crop.bounds.width > region.x + region.width);
      assert(crop.bounds.y + crop.bounds.height > region.y + region.height);
      assert(crop.scale <= 1.25);
    });
  }
}

test("context crops stay bounded near image edges, cap enlargement and omit tiny unreliable views", () => {
  const source = { width: 1200, height: 900 };
  for (const region of [
    { x: 0, y: 0, width: 0.1, height: 0.1 },
    { x: 0.9, y: 0.9, width: 0.1, height: 0.1 },
    { x: 0, y: 0, width: 1, height: 1 },
  ]) {
    const crop = geometry.cropView(region, source, { width: 160, height: 120 });
    assert(crop);
    assert(geometry.validRect(crop.bounds));
    assert(crop.viewport.width <= 160 && crop.viewport.height <= 120);
    assert(crop.target.x >= -1e-8 && crop.target.y >= -1e-8);
    assert(crop.target.x + crop.target.width <= crop.viewport.width + 1e-8);
    assert(crop.target.y + crop.target.height <= crop.viewport.height + 1e-8);
  }
  assert.equal(
    geometry.cropView({ ...region, width: 0.0001 }, source, {
      width: 160,
      height: 120,
    }),
    null,
  );
  assert.equal(
    geometry.cropView(
      region,
      { width: 16, height: 16 },
      { width: 160, height: 120 },
    ),
    null,
  );
  assert.equal(
    geometry.cropView(region, source, { width: 0, height: 120 }),
    null,
  );
  assert.equal(
    geometry.cropView(region, source, { width: 160, height: 120 }, 0.35, 20),
    null,
  );
  const capped = geometry.cropView(
    { x: 0.3, y: 0.3, width: 0.2, height: 0.2 },
    { width: 200, height: 200 },
    { width: 400, height: 400 },
  );
  assert(capped);
  assert.equal(capped.scale, 1.25);
});

test("shared geometry is pure and temporary crop views carry no new assets, storage or network calls", () => {
  const source = fs.readFileSync(
    path.join(root, "shared/imageGeometry.ts"),
    "utf8",
  );
  assert(
    !/fetch\s*\(|supabase|\.upload\s*\(|ImageManipulator|createObjectURL|toDataURL/.test(
      source,
    ),
  );
  const crop = geometry.cropView(
    region,
    { width: 1200, height: 900 },
    { width: 160, height: 120 },
  );
  assert.deepEqual(Object.keys(crop).sort(), [
    "bounds",
    "image",
    "scale",
    "target",
    "viewport",
  ]);
});

test("local, relationship and whole-image scopes never force one misleading crop", () => {
  const second = { x: 0.12, y: 0.5, width: 0.2, height: 0.18 };
  const multi = {
    ...note,
    scope: "multi_region",
    regions: [region, second],
    regionConfidence: 0.85,
  };
  assert.equal(geometry.noteRegion(multi), null);
  assert.deepEqual(geometry.noteRegions(multi), [region, second]);
  assert.equal(geometry.noteAnchors(multi).length, 2);
  assert(geometry.noteGeometryVisible(multi));
  assert.equal(drawing.activeRegionsGeometry(multi, 320, 240).length, 2);
  const global = {
    ...note,
    scope: "global",
    region,
    regions: [region, second],
    anchors: [center, { x: 0.2, y: 0.6 }],
  };
  assert.equal(geometry.noteRegion(global), null);
  assert.deepEqual(geometry.noteRegions(global), []);
  assert.deepEqual(geometry.noteAnchors(global), []);
  assert.equal(geometry.noteAnchor(global), null);
  assert.equal(geometry.noteGeometryVisible(global), false);
  assert.deepEqual(drawing.activeRegionsGeometry(global, 320, 240), []);
  for (const regionConfidence of [0.64, -0.5, Infinity, NaN]) {
    assert.equal(
      geometry.noteGeometryVisible({ ...note, region, regionConfidence }),
      false,
    );
    assert.deepEqual(geometry.noteRegions({ ...multi, regionConfidence }), []);
  }
  const noTargets = {
    ...note,
    scope: "multi_region",
    regions: [region, { ...second, x: -1 }],
  };
  assert.equal(geometry.noteGeometryVisible(noTargets), false);
  assert.equal(geometry.noteRegion(noTargets), null);
  // A remaining valid box plus an independent anchor is a genuine relationship.
  const mixedTargets = { ...noTargets, anchors: [{ x: 0.2, y: 0.4 }] };
  assert(geometry.noteGeometryVisible(mixedTargets));
});

test("marker indexes remain linked to notes while non-local or uncertain observations create no fake targets", () => {
  const global = { ...note, scope: "global" };
  const uncertain = { ...note, region, regionConfidence: 0.4 };
  const visible = { ...note, scope: "local", region, regionConfidence: 0.9 };
  const positions = drawing.markerPositions(
    [global, visible, uncertain, visible],
    320,
    240,
  );
  assert.equal(positions.length, 4);
  assert.deepEqual(positions[0], { left: 0, top: 0, target: 0 });
  assert.equal(positions[1].target, 44);
  assert.deepEqual(positions[2], { left: 0, top: 0, target: 0 });
  const firstOnly = drawing.markerPositions([visible], 320, 240)[0];
  assert.deepEqual(positions[1], firstOnly);
  assert.notDeepEqual(positions[3], positions[1]);
});

test("multi-region targets keep the same normalized relationships through responsive letterboxing", () => {
  const anchors = [
    { x: 0.18, y: 0.5 },
    { x: 0.7, y: 0.35 },
    { x: 0.85, y: 0.8 },
  ];
  const multi = {
    ...note,
    scope: "multi_region",
    anchors,
    regionConfidence: 0.8,
  };
  assert.deepEqual(geometry.noteAnchors(multi), anchors);
  assert.deepEqual(geometry.noteRegions(multi), []);
  assert.equal(geometry.noteRegion(multi), null);
  for (const source of [
    { width: 1200, height: 900 },
    { width: 900, height: 1200 },
    { width: 1000, height: 1000 },
    { width: 2000, height: 700 },
  ]) {
    for (const width of [320, 375, 1440]) {
      const frame = geometry.containFrame(source, { width, height: 420 });
      for (const anchor of geometry.noteAnchors(multi)) {
        const point = geometry.projectPoint(anchor, frame);
        close((point.x - frame.x) / frame.width, anchor.x);
        close((point.y - frame.y) / frame.height, anchor.y);
      }
    }
  }
});

test("adaptive context gives small subjects proportionately more surroundings and respects explicit padding", () => {
  const source = { width: 1600, height: 1200 };
  const small = { x: 0.4, y: 0.4, width: 0.04, height: 0.04 };
  const large = { x: 0.2, y: 0.2, width: 0.6, height: 0.6 };
  const viewport = { width: 180, height: 140 };
  const smallCrop = geometry.cropView(small, source, viewport);
  const largeCrop = geometry.cropView(large, source, viewport);
  assert(smallCrop && largeCrop);
  assert(
    smallCrop.bounds.width / small.width > largeCrop.bounds.width / large.width,
  );
  assert(largeCrop.bounds.width < 1);
  assert(smallCrop.bounds.x < small.x && smallCrop.bounds.y < small.y);
  const explicit = geometry.cropView(region, source, viewport, 0.35);
  close(explicit.bounds.x, region.x - region.width * 0.35);
  close(explicit.bounds.width, region.width * 1.7);
});

test("selected relationship highlights use true separate regions while global and uncertain notes stay text-only", () => {
  const Marks = load("components/CoachingMarks.tsx").default;
  const second = { x: 0.12, y: 0.5, width: 0.2, height: 0.18 };
  const notes = [
    { ...note, scope: "global" },
    { ...note, regionConfidence: 0.4 },
    { ...note, scope: "local", region, regionConfidence: 0.8 },
    {
      ...note,
      scope: "multi_region",
      regions: [region, second],
      regionConfidence: 0.9,
    },
  ];
  let selected;
  const tree = Marks({
    notes,
    width: 320,
    height: 240,
    selected: 3,
    onSelect: (index) => {
      selected = index;
    },
  });
  const nodes = (tree) =>
    !tree || typeof tree !== "object"
      ? []
      : [tree, ...[tree.props?.children].flat(Infinity).flatMap(nodes)];
  const groups = nodes(tree).filter((node) => node.type === "G");
  assert.equal(groups.length, 2);
  groups[1].props.onPress();
  assert.equal(selected, 3);
  const highlights = nodes(tree).filter(
    (node) => node.props?.testID === "active-coaching-region",
  );
  assert.equal(highlights.length, 2);
  for (const [index, highlight] of highlights.entries()) {
    const expected = geometry.projectRect([region, second][index], {
      x: 0,
      y: 0,
      width: 320,
      height: 240,
    });
    close(highlight.props.x, expected.x);
    close(highlight.props.y, expected.y);
    close(highlight.props.width, expected.width);
    close(highlight.props.height, expected.height);
    assert.equal(highlight.props.strokeDasharray, "4 4");
    assert(highlight.props.fillOpacity < 0.05);
  }
  assert.equal(
    nodes(tree).filter(
      (node) => node.props?.testID === "active-coaching-anchor",
    ).length,
    2,
  );
});

test("explicit normalized local regions keep crops, markers and legacy shapes on one authoritative target", () => {
  const explicit = { x: 0.6, y: 0.4, width: 0.2, height: 0.2 };
  for (const type of [
    "focal_ring",
    "crop_box",
    "region_highlight",
    "value_mass",
  ]) {
    const mixed = {
      ...note,
      type,
      x: 10,
      y: 10,
      width: 10,
      height: 10,
      scope: "local",
      region: explicit,
      regionConfidence: 0.9,
    };
    const expected = geometry.projectRect(explicit, {
      x: 0,
      y: 0,
      width: 320,
      height: 240,
    });
    const mark = drawing.markGeometry(mixed, 320, 240);
    assert.equal(mark.kind, type);
    for (const key of ["x", "y", "width", "height"])
      close(mark[key], expected[key]);
    assert.deepEqual(mark.points, []);
    assert.deepEqual(drawing.activeRegionGeometry(mixed, 320, 240), expected);
    const polygon = {
      ...mixed,
      width: undefined,
      height: undefined,
      points: [
        { x: 10, y: 10 },
        { x: 20, y: 10 },
        { x: 20, y: 20 },
      ],
    };
    assert.deepEqual(drawing.markGeometry(polygon, 320, 240).points, []);
    const marker = drawing.markerPositions([mixed], 320, 240)[0];
    close(marker.left + marker.target / 2, expected.x + expected.width / 2);
    close(marker.top + marker.target / 2, expected.y + expected.height / 2);
    const crop = geometry.cropView(
      explicit,
      { width: 1200, height: 900 },
      { width: 160, height: 120 },
    );
    close((crop.target.x - crop.image.x) / crop.image.width, expected.x / 320);
    close((crop.target.y - crop.image.y) / crop.image.height, expected.y / 240);
  }
  const path = {
    ...note,
    type: "arrow",
    width: undefined,
    height: undefined,
    scope: "local",
    region: explicit,
    regionConfidence: 0.9,
    points: [
      { x: 10, y: 10 },
      { x: 20, y: 20 },
    ],
  };
  const pointMark = drawing.markGeometry(
    { ...path, type: "point_marker", points: undefined },
    320,
    240,
  );
  close(pointMark.x, 0.7 * 320);
  close(pointMark.y, 0.5 * 240);
  assert.equal(pointMark.width, 0);
  assert.equal(pointMark.height, 0);
  const omitted = drawing.markGeometry(path, 320, 240);
  assert.equal(omitted.kind, "point_marker");
  assert.deepEqual(omitted.points, []);
  const contained = {
    ...path,
    points: [
      { x: 62, y: 44 },
      { x: 76, y: 56 },
    ],
  };
  const preserved = drawing.markGeometry(contained, 320, 240);
  assert.equal(preserved.kind, "arrow");
  close(preserved.points[0].x, 0.62 * 320);
  close(preserved.points[1].y, 0.56 * 240);
});

test("explicit null confidence keeps local, relationship and point observations text-only without changing legacy marks", () => {
  const second = { x: 0.12, y: 0.5, width: 0.2, height: 0.18 };
  const uncertain = [
    { ...note, scope: "local", region, regionConfidence: null },
    {
      ...note,
      scope: "multi_region",
      regions: [region, second],
      regionConfidence: null,
    },
    {
      ...note,
      type: "point_marker",
      width: undefined,
      height: undefined,
      regionConfidence: null,
    },
    {
      ...note,
      scope: "multi_region",
      anchors: [center, { x: 0.2, y: 0.6 }],
      regionConfidence: null,
    },
  ];
  const overlays = load("lib/overlays.ts");
  const retained = overlays.usableOverlays(uncertain);
  assert.equal(retained.length, uncertain.length);
  for (const item of retained) {
    assert.equal(item.shortInstruction, note.shortInstruction);
    assert.equal(item.reason, note.reason);
    assert.equal(item.action, note.action);
    assert.equal(geometry.noteGeometryVisible(item), false);
    assert.equal(geometry.noteRegion(item), null);
    assert.deepEqual(geometry.noteRegions(item), []);
    assert.deepEqual(geometry.noteAnchors(item), []);
    assert.deepEqual(drawing.activeRegionsGeometry(item, 320, 240), []);
  }
  assert(
    drawing
      .markerPositions(retained, 320, 240)
      .every((position) => position.target === 0),
  );
  const Marks = load("components/CoachingMarks.tsx").default;
  const tree = Marks({
    notes: retained,
    width: 320,
    height: 240,
    selected: 0,
    onSelect: () => {},
  });
  assert(tree.props.children.every((child) => child === null));
  // Old saved JSON omitted this optional field and keeps its genuine geometry.
  assert(!Object.hasOwn(note, "regionConfidence"));
  assert(geometry.noteGeometryVisible(note));
  assert.deepEqual(geometry.noteRegion(note), region);
  assert.equal(drawing.markerPositions([note], 320, 240)[0].target, 44);
  // Geometry introduced by the first phase also remains compatible if the
  // confidence field was never present; an explicit null is an abstention.
  assert(geometry.noteGeometryVisible({ ...note, region }));
});
