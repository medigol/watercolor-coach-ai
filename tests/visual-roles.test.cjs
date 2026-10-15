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
  "react-native": { View: element("div"), Text: element("span") },
  "react-native-svg": Object.fromEntries(
    [
      ["default", "svg"],
      ["G", "g"],
      ["Rect", "rect"],
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
const planner = load("lib/visualRoles.ts");
const Component = load("components/VisualRoleMap.tsx").default;
const focal = { x: 0.6, y: 0.25, width: 0.2, height: 0.25 };
const supporting = { x: 0.15, y: 0.65, width: 0.3, height: 0.2 };
const quiet = { x: 0.05, y: 0.05, width: 0.4, height: 0.3 };
const note = (visualRole, region, patch = {}) => ({
  visualRole,
  region,
  regionConfidence: 0.9,
  scope: "local",
  ...patch,
});
const p = (x, y) => ({ x, y });
const mass = (role, points) => ({ role, points });
const composition = (patch = {}) => ({
  type: "balanced_masses",
  confidence: 0.9,
  shortExplanation: "The small focal house is balanced by a quieter tree mass.",
  paths: null,
  focalPoint: null,
  secondaryPoints: null,
  masses: [
    mass("focal", [p(0.6, 0.25), p(0.8, 0.25), p(0.7, 0.5)]),
    mass("quiet", [p(0.05, 0.05), p(0.45, 0.05), p(0.2, 0.35)]),
  ],
  ...patch,
});
const frame = { x: 0, y: 0, width: 400, height: 300, scale: 1 };
const render = (regions, imageFrame = frame) =>
  renderToStaticMarkup(
    React.createElement(Component, { regions, frame: imageFrame }),
  );

test("role map selects a concise explicitly located hierarchy, with at most one region per role", () => {
  const plan = planner.planVisualRoles([
    note("quiet", quiet),
    note("supporting", supporting),
    note("focal", focal),
    note("supporting", { x: 0.4, y: 0.65, width: 0.1, height: 0.1 }),
  ]);
  assert.deepEqual(plan, [
    { kind: "rectangle", role: "focal", region: focal },
    { kind: "rectangle", role: "supporting", region: supporting },
    { kind: "rectangle", role: "quiet", region: quiet },
  ]);
});

test("a single role or non-focal pair never becomes an authoritative-looking hierarchy", () => {
  for (const notes of [
    undefined,
    [],
    [note("focal", focal)],
    [note("supporting", supporting), note("quiet", quiet)],
    [note("focal", focal), note("focal", quiet)],
  ])
    assert.deepEqual(planner.planVisualRoles(notes), []);
});

test("low, missing or invalid confidence and malformed note geometry leave text intact", () => {
  for (const patch of [
    { regionConfidence: 0.64 },
    { regionConfidence: null },
    { regionConfidence: undefined },
    { regionConfidence: Number.NaN },
    { regionConfidence: 1.1 },
    { region: { ...supporting, x: 1.1 } },
    { visualRole: "primary" },
  ]) {
    const notes = [
      note("focal", focal),
      note("supporting", supporting, {
        shortInstruction: "The bridge remains subordinate.",
        ...patch,
      }),
    ];
    assert.deepEqual(planner.planVisualRoles(notes), []);
    assert.equal(notes[1].shortInstruction, "The bridge remains subordinate.");
  }
  assert.equal(
    planner.planVisualRoles([
      note("focal", focal, { regionConfidence: 0.65 }),
      note("supporting", supporting, { regionConfidence: 0.65 }),
    ]).length,
    2,
  );
});

test("global notes never create local regions; multi-region notes use only their real supplied regions", () => {
  assert.deepEqual(
    planner.planVisualRoles([
      note("focal", focal),
      note("quiet", quiet, { scope: "global" }),
    ]),
    [],
  );
  const relationship = note("supporting", null, {
    scope: "multi_region",
    regions: [supporting, quiet],
    anchors: null,
  });
  const plan = planner.planVisualRoles([note("focal", focal), relationship]);
  assert.equal(plan.length, 2);
  assert.deepEqual(plan[1].region, supporting);
  assert(!("crop" in plan[1]));
  assert.deepEqual(
    planner.planVisualRoles([
      note("focal", focal),
      {
        ...relationship,
        regions: [supporting],
      },
    ]),
    [],
  );
});

test("confident saved mass polygons may explain roles without forcing a named composition formula", () => {
  for (const type of ["balanced_masses", "mixed", "none"]) {
    const overlay = composition({ type });
    const plan = planner.planVisualRoles([], overlay);
    assert.equal(plan.length, 2);
    assert.equal(plan[0].kind, "polygon");
    assert.deepEqual(plan[0].points, overlay.masses[0].points);
  }
  assert.deepEqual(
    planner.planVisualRoles([], composition({ confidence: 0.64 })),
    [],
  );
  assert.deepEqual(
    planner.planVisualRoles(
      [],
      composition({
        masses: [mass("focal", [p(0.1, 0.1), p(0.2, 0.2)])],
      }),
    ),
    [],
  );
});

test("opposing roles at the same geometry are omitted, while repeated same-role notes are not duplicated", () => {
  assert.deepEqual(
    planner.planVisualRoles([
      note("focal", focal),
      note("quiet", focal),
      note("supporting", supporting),
    ]),
    [],
  );
  const rectangleAsPolygon = composition({
    masses: [
      mass("quiet", [
        p(focal.x, focal.y),
        p(focal.x + focal.width, focal.y),
        p(focal.x + focal.width, focal.y + focal.height),
        p(focal.x, focal.y + focal.height),
      ]),
    ],
  });
  assert.deepEqual(
    planner.planVisualRoles(
      [note("focal", focal), note("supporting", supporting)],
      rectangleAsPolygon,
    ),
    [],
  );
  assert.equal(
    planner.planVisualRoles([
      note("focal", focal),
      note("supporting", supporting),
      note("supporting", supporting),
    ]).length,
    2,
  );
});

test("geometry is never inferred from canonical names, point markers or global observations", () => {
  assert.deepEqual(
    planner.planVisualRoles(
      [
        {
          visualRole: "focal",
          regionConfidence: 0.95,
          area: "house",
          x: 70,
          y: 30,
        },
        {
          visualRole: "quiet",
          regionConfidence: 0.95,
          area: "trees",
          x: 20,
          y: 20,
        },
      ],
      { focalArea: "house", quietAreas: ["trees"] },
    ),
    [],
  );
});

test("one highest-confidence saved region is selected for each role without mutating inputs", () => {
  const notes = [
    note("focal", focal, { regionConfidence: 0.8 }),
    note("supporting", supporting),
    note("focal", quiet, { regionConfidence: 0.95 }),
  ];
  const before = JSON.stringify(notes);
  const plan = planner.planVisualRoles(notes);
  assert.equal(plan.length, 2);
  assert.deepEqual(plan[0].region, quiet);
  assert.equal(JSON.stringify(notes), before);
});

test("role display uses labelled solid, dashed and dotted outlines with minimal transparent wash", () => {
  const plan = planner.planVisualRoles([
    note("focal", focal),
    note("supporting", supporting),
    note("quiet", quiet),
  ]);
  const html = render(plan);
  for (const label of ["Focal", "Supporting", "Quiet"])
    assert(html.includes(`>${label}</span>`));
  assert(html.includes('stroke-dasharray="6 4"'));
  assert(html.includes('stroke-dasharray="1 4"'));
  const fillOpacities = [...html.matchAll(/fill-opacity="([\d.]+)"/g)].map(
    (match) => Number(match[1]),
  );
  assert.equal(fillOpacities.length, 3);
  assert(fillOpacities.every((opacity) => opacity > 0 && opacity <= 0.04));
  assert(html.includes('data-testid="visual-role-map"'));
  assert(
    html.includes(
      'aria-label="Visual roles: Focal, Supporting, Quiet. Located areas in your painting."',
    ),
  );
  assert(html.includes('aria-hidden="true"'));
  assert(!html.includes("<text"));
});

test("role rectangles, polygons and label anchors share image projection at every supported size", () => {
  const notePlan = planner.planVisualRoles([
    note("focal", focal),
    note("quiet", quiet),
  ]);
  const polygonPlan = planner.planVisualRoles([], composition());
  for (const source of [
    { width: 1200, height: 900 },
    { width: 900, height: 1200 },
    { width: 1000, height: 1000 },
    { width: 1800, height: 600 },
  ]) {
    for (const width of [320, 375, 1440]) {
      const imageFrame = geometry.containFrame(source, { width, height: 420 });
      const local = { ...imageFrame, x: 0, y: 0 };
      const projected = geometry.projectRect(focal, local);
      const html = render(notePlan, imageFrame);
      assert(
        html.includes(
          `x="${projected.x}" y="${projected.y}" width="${projected.width}" height="${projected.height}"`,
        ),
      );
      const points = polygonPlan[0].points
        .map((point) => {
          const target = geometry.projectPoint(point, local);
          return `${target.x},${target.y}`;
        })
        .join(" ");
      assert(render(polygonPlan, imageFrame).includes(`points="${points}"`));
    }
  }
});

test("role presentation is local, creates no asset and gracefully omits unavailable views", () => {
  assert.equal(render([]), "");
  const plan = planner.planVisualRoles([
    note("focal", focal),
    note("quiet", quiet),
  ]);
  assert.equal(render(plan, { ...frame, width: 0 }), "");
  assert.equal(render(plan, { ...frame, x: Number.NaN }), "");
  for (const file of ["lib/visualRoles.ts", "components/VisualRoleMap.tsx"]) {
    const source = fs.readFileSync(path.join(root, file), "utf8");
    assert(
      !/fetch\s*\(|functions\.invoke|api\.openai|canvas|process\.env|https?:|<Image\b|<img\b|\.upload\s*\(/.test(
        source,
      ),
      file,
    );
  }
});
