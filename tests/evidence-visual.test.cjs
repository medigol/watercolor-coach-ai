const test = require("node:test"),
  assert = require("node:assert/strict"),
  fs = require("node:fs"),
  path = require("node:path"),
  ts = require("typescript");
const React = require("react"),
  { renderToStaticMarkup } = require("react-dom/server");
const fixture = require("./helpers/canonical-fixture.cjs");
const root = path.resolve(__dirname, ".."),
  modules = new Map();
let viewport = 320,
  platform = "web";
const flatten = (v) =>
  Array.isArray(v) ? Object.assign({}, ...v.filter(Boolean).map(flatten)) : v;
const element =
  (tag) =>
  ({
    children,
    testID,
    accessibilityLabel,
    accessibilityRole,
    style,
    ...props
  }) =>
    React.createElement(
      tag,
      {
        "data-testid": testID,
        "aria-label": accessibilityLabel,
        role: accessibilityRole,
        style: flatten(style),
      },
      children,
    );
const native = {
  View: element("div"),
  Text: element("span"),
  Pressable: element("button"),
  Platform: {
    get OS() {
      return platform;
    },
  },
};
function load(file) {
  const resolved = path.resolve(root, file);
  if (modules.has(resolved)) return modules.get(resolved);
  const output = {};
  modules.set(resolved, output);
  const code = ts.transpileModule(fs.readFileSync(resolved, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.ReactJSX,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  new Function("exports", "require", code)(output, (name) => {
    if (name === "react")
      return {
        ...React,
        useState: (initial) =>
          React.useState(initial === 0 ? viewport : initial),
      };
    if (name === "react/jsx-runtime") return require(name);
    if (name === "react-native") return native;
    if (name === "react-native-svg")
      return Object.fromEntries(
        [
          ["default", "svg"],
          ["G", "g"],
          ["Circle", "circle"],
          ["Line", "line"],
          ["Polygon", "polygon"],
          ["Path", "path"],
        ].map(([name, tag]) => [
          name,
          ({ children, ...props }) => React.createElement(tag, props, children),
        ]),
      );
    if (name === "./ReferenceImage")
      return {
        supportsImageAdjustments: true,
        default: ({ uri, label, filter }) =>
          React.createElement("img", {
            src: uri,
            alt: label,
            style: { filter },
          }),
      };
    if (name === "./ui")
      return {
        colors: load("components/theme.ts").colors,
        styles: { caption: {} },
      };
    assert(name.startsWith("."), `Unexpected I/O-capable import ${name}`);
    let dependency = path.resolve(path.dirname(resolved), name);
    if (!path.extname(dependency))
      dependency += fs.existsSync(dependency + ".ts") ? ".ts" : ".tsx";
    return load(dependency);
  });
  return output;
}
const helper = load("lib/teachingEvidence.ts"),
  geometry = load("shared/imageGeometry.ts"),
  roles = load("lib/visualRoles.ts");
const EvidenceVisual = load("components/EvidenceVisual.tsx").default;
const uri = "https://example.invalid/private/original.png?token=test-only",
  size = { width: 1200, height: 900 };
const region = { x: 0.56, y: 0.24, width: 0.2, height: 0.3 };
const local = () =>
  helper.insightEvidence(fixture(), fixture().canonicalAnalysis.insights[0]);
const render = (plan, props = {}) =>
  renderToStaticMarkup(
    React.createElement(EvidenceVisual, {
      plan,
      uri,
      sourceSize: size,
      ...props,
    }),
  );

test("multi-region tonal evidence exposes real local grayscale with a colour return control", () => {
  const plan = {
    label: "Two supplied areas",
    kind: "comparison",
    value: true,
    regions: [
      { region: { x: 0, y: 0, width: 0.4, height: 0.5 }, label: "Focal area" },
      {
        region: { x: 0.6, y: 0.5, width: 0.4, height: 0.5 },
        label: "Supporting area",
      },
    ],
  };
  const html = render(plan);
  assert(html.includes("Show grayscale evidence"));
  assert.equal((html.match(/evidence-crop/g) ?? []).length, 2);
  assert(
    html.includes("assessment-located area; check it against the observation"),
  );
  assert(!html.includes("verified observation"));
});
test("actual image-derived luminance is qualified separately from model interpretation", () => {
  const tone = load("shared/imageTone.ts");
  const rgba = new Uint8ClampedArray(16 * 16 * 4);
  for (let y = 0; y < 16; y++)
    for (let x = 0; x < 16; x++)
      rgba.set(x < 8 ? [0, 0, 0, 255] : [255, 255, 255, 255], (y * 16 + x) * 4);
  const plan = {
    label: "Two supplied areas",
    kind: "comparison",
    value: true,
    regions: [
      { region: { x: 0, y: 0, width: 0.5, height: 1 }, label: "Area 1" },
      { region: { x: 0.5, y: 0, width: 0.5, height: 1 }, label: "Area 2" },
    ],
  };
  const html = render(plan, { tone: tone.toneSample(rgba, 16, 16) });
  assert(html.includes("area 1 has lower median luminance"));
  assert(html.includes("does not establish focal importance"));
});

test("hue-only evidence does not imply a grayscale value comparison", () => {
  const r = fixture(),
    i = r.canonicalAnalysis.insights[2];
  r.canonicalAnalysis.facts[2].observation =
    "Hue contrast separates the red vehicle from the blue background.";
  i.lesson = "Hue contrast establishes separation.";
  const plan = helper.insightEvidence(r, i);
  assert.equal(plan.value, false);
  assert(!render(plan).includes("grayscale(1)"));
});
test("hue-first colour teaching does not hide a later supplied tonal comparison", () => {
  const r = fixture(),
    c = r.canonicalAnalysis;
  c.facts[2].observation = "Hue contrast separates red from blue.";
  c.facts.push({
    id: "tonal-fact",
    roleId: "tower",
    domain: "colour_value",
    observation: "The light tower separates from the darker bank value group.",
  });
  c.insights.push({
    id: "tonal",
    domain: "colour_value",
    classification: "strength",
    factIds: ["tonal-fact"],
    lesson: "The light shape holds attention.",
    action: "Preserve this value relationship.",
  });
  const before = structuredClone(r),
    plan = helper.tonalEvidence(r);
  assert.equal(plan.insightId, "tonal");
  assert.equal(plan.value, true);
  assert.deepEqual(r, before);
  assert.equal(helper.tonalEvidence(r, ["tonal"]), null);
});

test("two colours sharing a role keep their own semantic evidence labels", () => {
  const r = fixture();
  for (const label of ["Muted green", "Muted orange", "Off-white", "Red"]) {
    const plan = helper.colourEvidence(r, "tower", label);
    assert.equal(plan.label, label);
    assert.equal(plan.regions[0].label, label);
    assert(render(plan).includes(label));
    assert(!render(plan).includes("See image evidence"));
  }
});
test("role fallback also uses the requested colour label, not another evidence owner", () => {
  const r = fixture();
  r.canonicalAnalysis.visualEvidence = [];
  assert.equal(
    helper.colourEvidence(r, "bank", "Muted green").regions[0].label,
    "Muted green",
  );
});
test("narrow tower evidence retains target geometry but displays contextual neighbours", () => {
  const target = { x: 0.6, y: 0.2, width: 0.03, height: 0.45 };
  const before = structuredClone(target);
  const crop = helper.evidenceCrop(
    target,
    { width: 600, height: 1000 },
    { width: 260, height: 150 },
  );
  assert(crop);
  assert(crop.bounds.width >= 0.4);
  assert(crop.viewport.width / crop.viewport.height >= 0.6);
  assert(crop.bounds.width * crop.bounds.height < 0.72);
  assert.deepEqual(crop.target, geometry.projectRect(target, crop.image));
  assert.deepEqual(target, before);
  const html = render(
    {
      label: "Tower",
      kind: "local",
      regions: [{ region: target, label: "Tower" }],
    },
    { sourceSize: { width: 600, height: 1000 } },
  );
  assert(html.includes(uri));
});
for (const target of [
  { x: 0, y: 0, width: 0.03, height: 0.45 },
  { x: 0.97, y: 0.55, width: 0.03, height: 0.45 },
  { x: 0.2, y: 0.97, width: 0.6, height: 0.03 },
])
  test(`narrow context stays bounded at ${target.x},${target.y}`, () => {
    const c = helper.evidenceCrop(target, size, { width: 260, height: 150 });
    assert(c);
    assert(geometry.validRect(c.bounds));
    assert(c.bounds.x <= target.x && c.bounds.y <= target.y);
    assert(c.bounds.x + c.bounds.width >= target.x + target.width - 1e-9);
    assert(c.bounds.y + c.bounds.height >= target.y + target.height - 1e-9);
  });

test("a confident insight renders a crop from the original signed URI", () => {
  const html = render(local());
  assert(html.includes('data-testid="evidence-crop"'));
  assert(html.includes(uri));
  assert(html.includes("Original painting evidence"));
});
test("a crop uses the canonical normalized region without editing it", () => {
  const r = fixture(),
    before = structuredClone(r);
  const plan = helper.insightEvidence(r, r.canonicalAnalysis.insights[0]);
  assert.deepEqual(plan.regions[0].region, region);
  render(plan);
  assert.deepEqual(r, before);
});
test("crop context expands modestly and preserves the target", () => {
  const crop = helper.evidenceCrop(region, size, { width: 240, height: 150 });
  assert(crop.bounds.width > region.width);
  assert(crop.bounds.height > region.height);
  assert(crop.bounds.width <= region.width * 1.5 + 1e-9);
  assert(crop.target.width > 0);
  assert(
    crop.bounds.x <= region.x &&
      crop.bounds.x + crop.bounds.width >= region.x + region.width,
  );
});
for (const r of [
  { x: 0, y: 0, width: 0.2, height: 0.2 },
  { x: 0.8, y: 0.8, width: 0.2, height: 0.2 },
  { x: 0.45, y: 0, width: 0.2, height: 0.9 },
])
  test(`context clamps to image bounds at ${r.x},${r.y}`, () => {
    const c = helper.evidenceCrop(r, size, { width: 180, height: 150 });
    assert(c);
    assert(geometry.validRect(c.bounds));
    assert(c.bounds.x >= 0 && c.bounds.y >= 0);
    assert(
      c.bounds.x + c.bounds.width <= 1 + 1e-9 &&
        c.bounds.y + c.bounds.height <= 1 + 1e-9,
    );
  });
for (const confidence of [null, 0.2, Number.NaN, 1.1])
  test(`uncertain note confidence ${confidence} produces whole-image evidence`, () => {
    const r = fixture();
    r.canonicalAnalysis.visualEvidence[0].note.regionConfidence = confidence;
    const plan = helper.insightEvidence(r, r.canonicalAnalysis.insights[0]);
    assert.equal(plan.kind, "whole");
    assert(!render(plan).includes('data-testid="evidence-crop"'));
  });
test("missing geometry remains readable as a full-image thumbnail", () => {
  const r = fixture();
  r.canonicalAnalysis.visualEvidence = [];
  r.canonicalAnalysis.visualRoles.forEach((r) => (r.region = null));
  assert.equal(
    helper.insightEvidence(r, r.canonicalAnalysis.insights[0]).kind,
    "whole",
  );
});
test("a declared global topic never receives a fake role crop", () => {
  const r = fixture();
  r.canonicalAnalysis.visualEvidence[0].note.scope = "global";
  const plan = helper.insightEvidence(r, r.canonicalAnalysis.insights[0]);
  assert.equal(plan.kind, "whole");
  assert.deepEqual(plan.regions, []);
});
test("a null-role global fact cannot inherit a local crop", () => {
  const r = fixture();
  r.canonicalAnalysis.facts[0].roleId = null;
  assert.equal(
    helper.insightEvidence(r, r.canonicalAnalysis.insights[0]).kind,
    "whole",
  );
});
test("whole-image regions do not masquerade as useful local crops", () => {
  assert.equal(
    helper.usefulLocalRegion({ x: 0, y: 0, width: 1, height: 1 }),
    false,
  );
});
test("malformed regions are omitted independently", () => {
  assert.equal(
    helper.usefulLocalRegion({ x: -1, y: 0.2, width: 0.3, height: 0.2 }),
    false,
  );
  const r = fixture();
  r.canonicalAnalysis.visualEvidence[0].note.region = { ...region, x: 2 };
  r.canonicalAnalysis.visualRoles[0].region = null;
  assert.equal(
    helper.insightEvidence(r, r.canonicalAnalysis.insights[0]).kind,
    "whole",
  );
});
test("an unreadably tiny source crop falls back to the original thumbnail", () => {
  const html = render(local(), { sourceSize: { width: 8, height: 8 } });
  assert(!html.includes('data-testid="evidence-crop"'));
  assert(html.includes('data-testid="evidence-whole"'));
});
test("unreadable comparison crops share one whole-image fallback instead of duplicating it", () => {
  const plan = {
    ...local(),
    kind: "comparison",
    regions: [
      local().regions[0],
      {
        region: { x: 0.1, y: 0.5, width: 0.2, height: 0.2 },
        label: "Second passage",
      },
    ],
  };
  const html = render(plan, { sourceSize: { width: 8, height: 8 } });
  assert.equal((html.match(/data-testid="evidence-whole"/g) || []).length, 1);
  assert(!html.includes('data-testid="evidence-crop"'));
});
test("canonical multi-region evidence compares two actual source passages", () => {
  const r = fixture(),
    note = r.canonicalAnalysis.visualEvidence[0].note;
  note.scope = "multi_region";
  note.regions = [region, { x: 0.1, y: 0.5, width: 0.25, height: 0.25 }];
  const plan = helper.insightEvidence(r, r.canonicalAnalysis.insights[0]);
  assert.equal(plan.kind, "comparison");
  const html = render(plan);
  assert.equal((html.match(/data-testid="evidence-crop"/g) || []).length, 2);
  assert.equal((html.match(/src=/g) || []).length, 2);
});
test("incomplete multi-region geometry falls back instead of inventing a second crop", () => {
  const r = fixture();
  Object.assign(r.canonicalAnalysis.visualEvidence[0].note, {
    scope: "multi_region",
    regions: [region],
  });
  assert.equal(
    helper.insightEvidence(r, r.canonicalAnalysis.insights[0]).kind,
    "whole",
  );
});
test("two fact-linked canonical roles can supply a comparison without a duplicate role map", () => {
  const r = fixture();
  r.canonicalAnalysis.visualEvidence = [];
  r.canonicalAnalysis.insights[0].factIds.push("path");
  const p = helper.insightEvidence(r, r.canonicalAnalysis.insights[0]);
  assert.equal(p.kind, "comparison");
  assert.deepEqual(
    p.regions.map((r) => r.label),
    ["tower", "bank"],
  );
});
test("original and grayscale use exactly the same source crop transform", () => {
  const plan = { ...local(), value: true },
    html = render(plan);
  const transforms = [
    ...html.matchAll(/data-testid="evidence-source-frame" style="([^"]+)"/g),
  ].map((m) => m[1]);
  assert.equal(transforms.length, 2);
  assert.equal(transforms[0], transforms[1]);
  assert(html.includes("grayscale(1)"));
  assert(html.includes("Value view · grayscale only"));
  assert(!/blur\(|contrast\(|brightness\(|saturate\(/.test(html));
});
test("native grayscale fallback shows the unchanged original and explains the limitation", () => {
  platform = "ios";
  try {
    const html = render({ ...local(), value: true });
    assert(!html.includes("grayscale(1)"));
    assert(html.includes("available in the web preview"));
  } finally {
    platform = "web";
  }
});
test("composition teaching uses the whole original image and the saved overlay", () => {
  const p = helper.compositionEvidence(
    fixture().canonicalAnalysis.composition.primary,
  );
  assert.equal(p.kind, "whole");
  assert.deepEqual(p.regions, []);
  const html = render(p);
  assert(html.includes('data-testid="composition-structure"'));
  assert(!html.includes('data-testid="evidence-crop"'));
});
test("none composition remains text-only", () =>
  assert.equal(
    helper.compositionEvidence({
      ...fixture().canonicalAnalysis.composition.primary,
      type: "none",
    }),
    null,
  ));
function figurePlan() {
  const r = fixture(),
    i = r.canonicalAnalysis.insights[0];
  i.domain = "composition";
  i.classification = "study_experiment";
  i.action =
    "In a separate study, add two tiny figures near the lower bank; compare scale with and without them.";
  return { r, i };
}
test("a future figure study visual is a location cue on the original, never an inserted object", () => {
  const { r, i } = figurePlan();
  const plan = helper.insightEvidence(r, i);
  assert.equal(plan.kind, "location");
  const html = render(plan);
  assert(html.includes('data-testid="future-study-location"'));
  assert(html.includes("Possible figure area · future study"));
  assert.equal((html.match(/src=/g) || []).length, 1);
  assert(!/before|after|generated person|corrected image/i.test(html));
});
test("a figure suggestion without a confident proposed location remains text-only", () => {
  const { r, i } = figurePlan();
  r.canonicalAnalysis.visualEvidence = [];
  assert.equal(helper.insightEvidence(r, i), null);
});
test("a current-painting note cannot become a proposed-object location", () => {
  const { r, i } = figurePlan();
  r.canonicalAnalysis.visualEvidence[0].note.timing = "current_painting";
  assert.equal(helper.insightEvidence(r, i), null);
});
test("colour source examples resolve existing canonical role regions", () => {
  const r = fixture();
  const p = helper.colourEvidence(r, "tower", "Warm light");
  assert.deepEqual(
    p.regions[0].region,
    r.canonicalAnalysis.visualRoles[0].region,
  );
  assert(render(p).includes('data-testid="evidence-crop"'));
});
test("a colour without a canonical location has no invented crop", () => {
  assert.equal(helper.colourEvidence(fixture(), null, "Warm light"), null);
  assert.equal(helper.colourEvidence(fixture(), "missing", "Warm light"), null);
});
test("repeated evidence is rendered once and referenced elsewhere", () => {
  const p = local();
  const placements = helper.allocateEvidence([
    { key: "main", label: "Main opportunity", plan: p },
    { key: "colour", label: "Warm light", plan: { ...p, value: true } },
  ]);
  assert("plan" in placements.main);
  assert.equal(placements.main.plan.value, true);
  assert.deepEqual(placements.colour, {
    reference: { key: "main", label: "Main opportunity" },
  });
});

test("reusing a value visual upgrades its single owner without mutating canonical evidence", () => {
  const original = local(),
    before = structuredClone(original);
  const allocated = helper.allocateEvidence([
    { key: "strength", label: "What works", plan: original },
    {
      key: "value",
      label: "Value hierarchy",
      plan: { ...original, value: true },
    },
  ]);
  assert.equal(allocated.strength.plan.value, true);
  assert.equal(allocated.value.reference.key, "strength");
  assert.deepEqual(original, before);
});

test("colour evidence can reuse a confident linked note when the canonical role lacks a region", () => {
  const r = fixture();
  r.canonicalAnalysis.visualRoles[0].region = null;
  const plan = helper.colourEvidence(r, "tower", "Warm light");
  assert.deepEqual(
    plan.regions[0].region,
    r.canonicalAnalysis.visualEvidence[0].note.region,
  );
  assert(render(plan).includes('data-testid="evidence-crop"'));
});
test("malformed explicit note geometry cannot silently become a different role crop", () => {
  const r = fixture();
  r.canonicalAnalysis.visualEvidence[0].note.region = { ...region, width: 4 };
  assert.equal(
    helper.insightEvidence(r, r.canonicalAnalysis.insights[0]).kind,
    "whole",
  );
});
test("any explicitly global evidence keeps its insight global", () => {
  const r = fixture();
  r.canonicalAnalysis.visualEvidence.push({
    ...r.canonicalAnalysis.visualEvidence[0],
    note: { scope: "global" },
  });
  assert.equal(
    helper.insightEvidence(r, r.canonicalAnalysis.insights[0]).kind,
    "whole",
  );
});
test("an evidence allocation is bounded without making up a shared region", () => {
  const requests = [0.1, 0.3, 0.5, 0.7, 0.8].map((x, i) => ({
    key: String(i),
    label: String(i),
    plan: {
      ...local(),
      regions: [
        { region: { x, y: 0.1, width: 0.1, height: 0.1 }, label: String(i) },
      ],
    },
  }));
  const placements = helper.allocateEvidence(requests);
  assert.equal(Object.values(placements).filter((p) => "plan" in p).length, 4);
  assert.equal(placements["4"].reference.key, "artwork");
});
test("a repeated request key cannot replace its own visual with a self-reference", () => {
  const request = { key: "main", label: "Main", plan: local() };
  assert("plan" in helper.allocateEvidence([request, request]).main);
});
test("evidence components issue zero provider calls, uploads or writes", () => {
  const original = global.fetch;
  let calls = 0;
  global.fetch = () => {
    calls++;
    throw Error("Unexpected write/request");
  };
  try {
    render(local());
    render({ ...local(), value: true });
    render(
      helper.compositionEvidence(
        fixture().canonicalAnalysis.composition.primary,
      ),
    );
    assert.equal(calls, 0);
  } finally {
    global.fetch = original;
  }
  for (const file of [
    "components/EvidenceVisual.tsx",
    "lib/teachingEvidence.ts",
  ])
    assert(
      !/functions\.invoke|\.rpc\(|\.upload\(|\.insert\(|\.update\(|toDataURL|canvas|api\.openai|fetch\s*\(/.test(
        fs.readFileSync(path.join(root, file), "utf8"),
      ),
      file,
    );
});
for (const width of [240, 275, 320, 375])
  test(`evidence crop/comparison fits a ${width}px teaching column`, () => {
    viewport = width;
    try {
      const html = render({ ...local(), value: true });
      const widths = [
        ...html.matchAll(
          /data-testid="evidence-crop" style="width:([\d.]+)px/g,
        ),
      ].map((m) => Number(m[1]));
      assert.equal(widths.length, 2);
      assert(widths.reduce((a, b) => a + b, 10) <= width + 1e-8);
    } finally {
      viewport = 320;
    }
  });
test("low-confidence canonical Roles do not draw geometry", () => {
  const r = fixture();
  r.canonicalAnalysis.visualRoles[0].confidence = 0.2;
  assert.deepEqual(
    roles.planCanonicalVisualRoles(r.canonicalAnalysis.visualRoles),
    [],
  );
});
test("large uncertain role rectangles are omitted while canonical text/roles stay unchanged", () => {
  const r = fixture(),
    before = structuredClone(r);
  r.canonicalAnalysis.visualRoles[0].region = {
    x: 0,
    y: 0,
    width: 0.9,
    height: 0.9,
  };
  r.canonicalAnalysis.visualRoles[0].confidence = 0.7;
  assert.deepEqual(
    roles.planCanonicalVisualRoles(r.canonicalAnalysis.visualRoles),
    [],
  );
  assert.equal(
    r.canonicalAnalysis.visualRoles[0].role,
    before.canonicalAnalysis.visualRoles[0].role,
  );
});
test("supporting and quiet remain distinct canonical roles", () => {
  const r = fixture();
  const map = roles.planCanonicalVisualRoles(r.canonicalAnalysis.visualRoles);
  assert(map.some((r) => r.role === "supporting"));
  assert(map.some((r) => r.role === "quiet"));
  assert.equal(map.filter((r) => r.role === "focal").length, 1);
});
test("three explicitly supplied depth planes can be compared without guessing regions", () => {
  const r = fixture();
  r.canonicalAnalysis.visualEvidence = [];
  r.canonicalAnalysis.facts.push({
    id: "depth",
    domain: "technique",
    roleId: "water",
    observation: "The distant water has a narrower value range.",
  });
  r.canonicalAnalysis.insights[0].factIds = ["hierarchy", "path", "depth"];
  const p = helper.insightEvidence(r, r.canonicalAnalysis.insights[0]);
  assert.equal(p.regions.length, 3);
  assert.deepEqual(
    p.regions.map((v) => v.region),
    r.canonicalAnalysis.visualRoles.map((v) => v.region),
  );
  const html = render(p);
  assert.equal((html.match(/data-testid="evidence-crop"/g) || []).length, 3);
});

for (const label of [
  "Focal boat and surrounding water",
  "Warm light / cool shadow",
]) {
  test(`multi-region comparison uses supplied relationship captions: ${label}`, () => {
    const r = fixture(),
      note = r.canonicalAnalysis.visualEvidence[0].note;
    note.scope = "multi_region";
    note.label = label;
    note.regions = [region, { x: 0.08, y: 0.59, width: 0.27, height: 0.22 }];
    const before = structuredClone(note.regions);
    const plan = helper.insightEvidence(r, r.canonicalAnalysis.insights[0]);
    assert.equal(plan.kind, "comparison");
    assert.deepEqual(
      plan.regions.map((r) => r.label),
      [`${label} · area 1`, `${label} · area 2`],
    );
    assert.deepEqual(
      plan.regions.map((r) => r.region),
      before,
    );
    const html = render(plan);
    assert(!html.includes("Related passage"));
    assert(html.includes(`${label} · area 1`));
    assert(html.includes("area 2"));
  });
}
test("legacy multi-region note without a label uses its supplied fact, never guessed region identities", () => {
  const r = fixture(),
    note = r.canonicalAnalysis.visualEvidence[0].note;
  delete note.label;
  note.scope = "multi_region";
  note.regions = [region, { x: 0.08, y: 0.59, width: 0.27, height: 0.22 }];
  const plan = helper.insightEvidence(r, r.canonicalAnalysis.insights[0]);
  assert.equal(
    plan.regions[0].label,
    `${r.canonicalAnalysis.facts[0].observation} · area 1`,
  );
  assert(!JSON.stringify(plan).includes("Related passage"));
});
for (const label of [
  "Related passage",
  "Related passage 2",
  "Related passages",
]) {
  test(`generic saved evidence caption '${label}' uses neutral source numbering without region guesses`, () => {
    const r = fixture(),
      note = r.canonicalAnalysis.visualEvidence[0].note;
    note.scope = "multi_region";
    note.label = label;
    note.regions = [region, { x: 0.08, y: 0.59, width: 0.27, height: 0.22 }];
    const before = structuredClone(r);
    const plan = helper.insightEvidence(r, r.canonicalAnalysis.insights[0]);
    assert.deepEqual(
      plan.regions.map((r) => r.label),
      ["Source area 1", "Source area 2"],
    );
    assert(!render(plan).includes("Related passage"));
    assert.deepEqual(
      plan.regions.map((r) => r.region),
      note.regions,
    );
    assert.deepEqual(r, before);
  });
}
