const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const root = path.resolve(__dirname, "..");

function loadComponents() {
  const modules = new Map();
  function load(relative) {
    if (modules.has(relative)) return modules.get(relative);
    const exports = {};
    modules.set(relative, exports);
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
      if (name === "react" || name === "react/jsx-runtime") return require(name);
      if (name === "react-native")
        return {
          Text: (props) => React.createElement("span", null, props.children),
          View: (props) =>
            React.createElement(
              "div",
              {
                role: props.accessibilityRole,
                "aria-label": props.accessibilityLabel,
              },
              props.children,
            ),
          StyleSheet: { create: (value) => value },
        };
      if (name === "./ui")
        return { styles: {}, colors: {} };
      const full = path.resolve(root, path.dirname(relative), name);
      const file = [".tsx", ".ts"]
        .map((ext) => full + ext)
        .find((f) => fs.existsSync(f));
      if (!file) throw new Error(`Unexpected import ${name}`);
      return load(path.relative(root, file));
    });
    return exports;
  }
  return load;
}

const load = loadComponents();
const render = (component, props) =>
  renderToStaticMarkup(React.createElement(load(component).default, props));

test("planning sketch and value studies are abstract adaptable aids, without subject thumbnails", () => {
  for (const [component, title] of [
    ["components/SketchStudyCard.tsx", "Planning sketch aid"],
    ["components/ValueStudyCard.tsx", "Value grouping aid"],
  ]) {
    const html = render(component, { description: "Connect the larger shapes." });
    assert(html.includes(title));
    assert(html.includes("adapt this to your image"));
    assert(html.includes("Abstract"));
    assert(html.includes("Connect the larger shapes."));
    assert(!html.includes("<img"));
    assert(!/generated from|generated reference|AI painting/i.test(html));
    const source = fs.readFileSync(path.join(root, component), "utf8");
    assert(!/MiniWatercolorScene|ArtworkThumbnail/.test(source));
  }
});

test("legacy saved palette renders names and swatches without invented uses or pigments", () => {
  const html = render("components/PaletteCard.tsx", {
    palette: [
      { name: "Ultramarine blue", hex: "#526DA6" },
      { name: "Yellow ochre", hex: "#CCA55A" },
    ],
  });
  assert(html.includes("Ultramarine blue"));
  assert(html.includes("Yellow ochre"));
  assert(html.includes("Approximate swatches"));
  assert(!/PB29|PY43|sky|shadows|manufacturer/i.test(html));
});

test("new palette uses supplied compatible codes and painting uses, with cautious swatch note", () => {
  const html = render("components/PaletteCard.tsx", {
    palette: [
      {
        name: "Ultramarine blue",
        hex: "#526DA6",
        pigmentCode: "PB29",
        use: "Cool sky and distant shadows.",
      },
      { name: "Burnt sienna", hex: "#AE6F50", pigmentCode: "PBr7", use: null },
      { name: "Yellow ochre", hex: "#CCA55A", pigmentCode: "PY42" },
    ],
  });
  for (const text of ["PB29", "PBr7", "PY42", "Cool sky and distant shadows."])
    assert(html.includes(text));
  assert(html.includes("paint formulations vary"));
  assert(!/purchase|manufacturer|exact pigment/i.test(html));
});

test("palette omits unsupported or mismatched pigment metadata without replacing it", () => {
  const { paletteGuidance } = load("components/PaletteCard.tsx");
  for (const color of [
    { name: "Sap green", hex: "#7F986E", pigmentCode: "PB29" },
    { name: "Raw sienna", hex: "#AF9B6A", pigmentCode: "PBr7" },
    { name: "Red ochre", hex: "#AE6F50", pigmentCode: "PY43" },
    { name: "Payne's Gray", hex: "#475952", pigmentCode: "PBk7" },
    { name: "Yellow ochre", hex: "#CCA55A", pigmentCode: "PY43/PY42" },
  ]) assert.equal(paletteGuidance(color).pigmentCode, null);
  assert.equal(
    paletteGuidance({ name: "Yellow ochre", hex: "#CCA55A", pigmentCode: "PY43" }).pigmentCode,
    "PY43",
  );
  assert.equal(
    paletteGuidance({ name: "Ochre", hex: "#CCA55A", use: " " }).use,
    null,
  );
  assert.equal(
    paletteGuidance({ name: "Ochre", hex: "#CCA55A", use: "x".repeat(181) }).use,
    null,
  );
});

test("legacy painting steps remain intact; short stage prefixes are displayed separately", () => {
  const { splitPaintingStep } = load("components/PaintingStepsCard.tsx");
  const legacy = "Lay a pale sky wash, then let it dry.";
  assert.deepEqual(splitPaintingStep(legacy), { stage: null, instruction: legacy });
  assert.deepEqual(
    splitPaintingStep("First wash: Use a tea-strength wash; let the shine leave the paper."),
    {
      stage: "First wash",
      instruction: "Use a tea-strength wash; let the shine leave the paper.",
    },
  );
  for (const text of ["Wait. Then: continue gently.", "Sky: ", "Sky:\n"])
    assert.equal(splitPaintingStep(text).stage, null);
  const html = render("components/PaintingStepsCard.tsx", {
    steps: [legacy, "Final accents: Sharpen only the focal marks."],
  });
  assert(html.includes(legacy));
  assert(html.includes("Final accents"));
  assert(html.includes("Sharpen only the focal marks."));
  assert(!html.includes("<img"));
});
