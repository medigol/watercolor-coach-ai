const { loadShared } = require("./helpers/shared-loader.cjs");
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
    if (!(name in mocks)) return loadShared(name, relative);
    return mocks[name];
  });
  return exports;
}
const preparation = load("lib/referencePreparation.ts");

test("invalid, overflowing or underflowing image ratios fall back safely", () => {
  assert.equal(preparation.referenceAspectRatio(1200, 800), 1.5);
  assert.equal(preparation.referenceAspectRatio(800, 1200), 2 / 3);
  for (const [width, height] of [
    [NaN, 20],
    [20, 0],
    [-1, 20],
    [20, Infinity],
    [Number.MAX_VALUE, Number.MIN_VALUE],
    [Number.MIN_VALUE, Number.MAX_VALUE],
  ])
    assert.equal(preparation.referenceAspectRatio(width, height), undefined);
});

test("reference views preserve the original and produce bounded display-only adjustments", () => {
  const defaults = preparation.defaultAdjustments;
  assert.equal(preparation.referenceFilter("original", defaults), "none");
  assert.match(
    preparation.referenceFilter("value", defaults),
    /grayscale\(1\)/,
  );
  assert.match(preparation.referenceFilter("simplified", defaults), /blur\(/);
  assert.match(preparation.referenceViewNotes.value, /not a three-value/);
  assert.match(preparation.referenceViewNotes.simplified, /does not redraw/);
  assert.equal(
    preparation.referenceFilter("adjust", {
      contrast: 900,
      brightness: -1,
      saturation: NaN,
    }),
    "contrast(1.8) brightness(0.6) saturate(1)",
  );
  assert.equal(preparation.boundedAdjustment("saturation", 0), 0);
  assert.equal(preparation.boundedAdjustment("brightness", 120.4), 120);
  assert.equal(preparation.boundedAdjustment("contrast", Infinity), 100);
});

function fixture({
  supported = true,
  deferImage = false,
  failImage = false,
} = {}) {
  const values = [];
  const callbacks = [];
  let stateIndex = 0;
  let effectUri;
  let cleanup;
  let currentUri = "private-image";
  const jsx = {
    jsx: (type, props) => ({ type, props }),
    jsxs: (type, props) => ({ type, props }),
    Fragment: "Fragment",
  };
  const Image = {
    getSize(uri, ok, error) {
      callbacks.push({ uri, ok, error });
      if (!deferImage) (failImage ? error : ok)(1200, 800);
    },
  };
  const react = {
    useState(initial) {
      const index = stateIndex++;
      if (!(index in values)) values[index] = initial;
      return [
        values[index],
        (value) => {
          values[index] =
            typeof value === "function" ? value(values[index]) : value;
        },
      ];
    },
    useEffect(effect, [uri]) {
      if (uri !== effectUri) {
        cleanup?.();
        effectUri = uri;
        cleanup = effect();
      }
    },
  };
  const Component = load("components/ReferencePreparation.tsx", {
    react,
    "react/jsx-runtime": jsx,
    "react-native": {
      Image,
      Text: "Text",
      View: "View",
      Pressable: "Pressable",
      ActivityIndicator: "ActivityIndicator",
    },
    "../lib/referencePreparation": preparation,
    "./ReferenceImage": {
      default: "ReferenceImage",
      supportsImageAdjustments: supported,
    },
    "./ReferenceAdjustment": { default: "ReferenceAdjustment" },
    "./ui": { colors: {}, styles: {} },
  }).default;
  function render(uri = currentUri) {
    stateIndex = 0;
    currentUri = uri;
    return Component({ uri, label: "Your photo" });
  }
  function nodes(tree) {
    if (!tree || typeof tree !== "object") return [];
    return [tree, ...[tree.props?.children].flat(Infinity).flatMap(nodes)];
  }
  function find(tree, label) {
    return nodes(tree).find((node) => node.props?.accessibilityLabel === label);
  }
  return { render, nodes, find, callbacks };
}

test("value/adjust controls preserve source ratio, reset restores unmodified source and default sliders", () => {
  const f = fixture();
  f.render();
  let tree = f.render();
  assert(f.nodes(tree).some((node) => node.props?.style?.aspectRatio === 1.5));
  f.find(tree, "Value reference view").props.onPress();
  tree = f.render();
  assert.match(
    f.nodes(tree).find((node) => node.type === "ReferenceImage").props.filter,
    /grayscale/,
  );
  f.find(tree, "Adjust reference view").props.onPress();
  tree = f.render();
  const contrast = f
    .nodes(tree)
    .find(
      (node) =>
        node.type === "ReferenceAdjustment" && node.props.label === "Contrast",
    );
  contrast.props.onChange(150);
  tree = f.render();
  assert.match(
    f.nodes(tree).find((node) => node.type === "ReferenceImage").props.filter,
    /contrast\(1.5\)/,
  );
  f.find(tree, "Reset reference preparation").props.onPress();
  tree = f.render();
  assert.equal(
    f.nodes(tree).find((node) => node.type === "ReferenceImage").props.filter,
    "none",
  );
  f.find(tree, "Adjust reference view").props.onPress();
  tree = f.render();
  assert(
    f
      .nodes(tree)
      .filter((node) => node.type === "ReferenceAdjustment")
      .every((node) => node.props.value === 100),
  );
});

test("failed image reads/rendering show safe coaching fallback without broken image or controls", () => {
  for (const failImage of [true, false]) {
    const f = fixture({ failImage });
    f.render();
    let tree = f.render();
    if (!failImage) {
      f.nodes(tree)
        .find((node) => node.type === "ReferenceImage")
        .props.onError();
      tree = f.render();
    }
    assert(
      !f
        .nodes(tree)
        .some(
          (node) =>
            node.type === "ReferenceImage" ||
            node.type === "ReferenceAdjustment",
        ),
    );
    assert(
      f.nodes(tree).some((node) => node.props?.accessibilityRole === "alert"),
    );
    assert(
      JSON.stringify(tree).includes(
        "painting plan and study aids are still available",
      ),
    );
  }
});

test("reference switch ignores late image callbacks and clears previous adjustments", () => {
  const f = fixture({ deferImage: true });
  f.render("first");
  f.render("second");
  f.callbacks[0].ok(10, 20);
  let tree = f.render();
  assert(!f.nodes(tree).some((node) => node.type === "ReferenceImage"));
  f.callbacks[1].ok(600, 1200);
  tree = f.render();
  assert(f.nodes(tree).some((node) => node.props?.style?.aspectRatio === 0.5));
  f.find(tree, "Adjust reference view").props.onPress();
  tree = f.render();
  f.nodes(tree)
    .find((node) => node.type === "ReferenceAdjustment")
    .props.onChange(170);
  f.render("third");
  f.callbacks[2].ok(800, 600);
  tree = f.render();
  assert.equal(
    f.nodes(tree).find((node) => node.type === "ReferenceImage").props.filter,
    "none",
  );
});

test("native fallback clearly preserves original and disables unsupported view controls", () => {
  const f = fixture({ supported: false });
  f.render();
  const tree = f.render();
  assert(f.find(tree, "Original reference view"));
  for (const label of ["Value", "Simplified", "Adjust"])
    assert(f.find(tree, `${label} reference view`).props.disabled);
  assert(!f.nodes(tree).some((node) => node.type === "ReferenceAdjustment"));
  assert(JSON.stringify(tree).includes("keeps your original image unchanged"));
});

test("browser preparation uses CSS on existing image without pixel reads, API calls or native DOM imports", () => {
  const files = [
    "ReferencePreparation.tsx",
    "ReferenceImage.tsx",
    "ReferenceImage.web.tsx",
    "ReferenceAdjustment.tsx",
    "ReferenceAdjustment.web.tsx",
  ];
  for (const file of files) {
    const source = fs.readFileSync(path.join(root, "components", file), "utf8");
    assert(
      !/fetch\s*\(|\.functions\.invoke|api\.openai|canvas|crossOrigin/.test(
        source,
      ),
    );
    if (!file.includes(".web."))
      assert(!/document\.|window\.|<img\b|<input\b/.test(source));
  }
  const jsx = { jsx: (type, props) => ({ type, props }) };
  const Image = load("components/ReferenceImage.web.tsx", {
    "react/jsx-runtime": jsx,
  }).default;
  const output = Image({
    uri: "signed-private-photo",
    label: "Value view",
    filter: "grayscale(1)",
    onError() {},
  });
  assert.equal(output.props.src, "signed-private-photo");
  assert.equal(output.props.style.filter, "grayscale(1)");
  assert.equal(output.props.crossOrigin, undefined);
  const Slider = load("components/ReferenceAdjustment.web.tsx", {
    "react/jsx-runtime": jsx,
    "./theme": { colors: { accent: "teal" } },
  }).default;
  let selected;
  const range = Slider({
    label: "Brightness",
    value: 100,
    min: 60,
    max: 150,
    onChange: (value) => {
      selected = value;
    },
  });
  assert.equal(range.props.type, "range");
  assert.equal(range.props["aria-label"], "Brightness");
  range.props.onChange({ currentTarget: { valueAsNumber: 120 } });
  assert.equal(selected, 120);
});
