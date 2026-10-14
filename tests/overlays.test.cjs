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
const contract = load("supabase/functions/_shared/contract.ts", {
  "./overlays.ts": overlay,
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
  assert(!overlay.validOverlays(notes.slice(0, 2)));
  assert(!overlay.validOverlays([...notes, ...notes]));
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
    assert.deepEqual(contract.cleanOverlayFeedback(bad), sample);
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
  assert(prompt.includes("Never invent uncertain locations"));
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
          values[n] = v;
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
  const Component = load("components/CoachingOverlay.tsx", {
    react,
    "react/jsx-runtime": jsx,
    "react-native": {
      Image,
      Pressable: "Pressable",
      Text: "Text",
      View: "View",
    },
    "../lib/overlays": overlay,
    "./ui": {
      colors: { accent: "teal", ink: "dark", border: "border" },
      styles: { card: {} },
    },
  }).default;
  const render = (uri = currentUri ?? "image", data = notes) => {
    index = 0;
    currentUri = uri;
    return Component({ uri, notes: data, label: "Your photo" });
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
  return { render, nodes, Image };
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
