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
      if (name === "react" || name === "react/jsx-runtime")
        return require(name);
      if (name === "react-native")
        return {
          Text: (props) => React.createElement("span", null, props.children),
          View: (props) => {
            const style = Object.assign(
              {},
              ...[props.style].flat(2).filter(Boolean),
            );
            return React.createElement(
              "div",
              {
                role: props.accessibilityRole,
                "aria-label": props.accessibilityLabel,
                "data-opacity": style.opacity,
                "data-pigment": style.backgroundColor,
                "data-width": style.width,
              },
              props.children,
            );
          },
          StyleSheet: { create: (value) => value },
        };
      if (name === "./ui") return { styles: {}, colors: {} };
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
const { usablePalette } = load("components/PaletteCard.tsx");
const render = (props) =>
  renderToStaticMarkup(
    React.createElement(load("components/PaletteCard.tsx").default, props),
  );

test("study palette labels colours for a separate study and omits forceful correction wording", () => {
  const html = render({
    study: true,
    strategy: "You should fix the palette.",
    palette: [
      {
        name: "Ultramarine",
        hex: "#526DA6",
        use: "Correct this sky.",
        mix: "The blue and earth pair gives a muted neutral.",
      },
    ],
  });
  assert(html.includes("Suggested palette"));
  assert(html.includes("Suggested colour options for a study"));
  assert(!html.includes("Use in this painting"));
  assert(!/you should fix|correct this/i.test(html));
  assert(html.includes("The blue and earth pair gives a muted neutral."));
});

test("palette renders large translucent wash swatches rather than flat color blocks", () => {
  const html = render({ palette: [{ name: "Ultramarine", hex: "#526DA6" }] });
  assert(html.includes("Suggested palette"));
  assert(html.includes('role="image"'));
  assert(html.includes("Ultramarine · approximate watercolor wash"));
  assert(html.includes('data-width="88"'));
  for (const opacity of ["0.15", "0.62", "0.18", "0.19"])
    assert(html.includes(`data-opacity="${opacity}"`));
  assert.equal((html.match(/data-pigment="#526DA6"/g) || []).length, 4);
  assert(!/<img|<canvas|https?:\/\//.test(html));
});

test("supplied palette strategy, uses, temperature, mix and painting tags render", () => {
  const html = render({
    strategy:
      "Keep earth colours quiet and reserve dark accents for the focal area.",
    palette: [
      {
        name: "Ultramarine",
        hex: "#526DA6",
        pigmentCode: "PB29",
        temperature: "cool",
        use: "Cool sky wash and distant shadows.",
        mix: "Mix with Burnt Sienna for a soft grey.",
        tag: "main_wash",
      },
      {
        name: "Burnt Sienna",
        hex: "#AE6F50",
        pigmentCode: "PBr7",
        temperature: "warm",
        use: "Warm building accents.",
        tag: "use_sparingly",
      },
    ],
  });
  for (const text of [
    "Palette strategy",
    "Keep earth colours quiet",
    "Suggested role:",
    "Cool sky wash and distant shadows.",
    "Mix idea:",
    "Mix with Burnt Sienna",
    "Cool",
    "Warm",
    "Main wash",
    "Use sparingly",
    "PB29",
    "PBr7",
  ])
    assert(html.includes(text));
  assert(html.includes("paint formulations vary"));
  assert(!/buy|purchase|brand|manufacturer/i.test(html));
});

test("palette presents options rather than original pigment identification", () => {
  const html = render({
    strategy:
      "The artist used ultramarine. A blue and earth pair is a suggested option for a cool study.",
    palette: [
      {
        name: "Ultramarine",
        hex: "#526DA6",
        pigmentCode: "PB29",
        use: "The original pigment is PB29. Cool sky and distance in a separate study.",
        mix: "The painter mixed burnt sienna. Try a blue-earth neutral on scrap paper.",
      },
    ],
  });
  assert(
    html.includes(
      "Suggested colour options for a study, not identified original pigments.",
    ),
  );
  assert(html.includes("Optional pigment suggestions"));
  assert(html.includes("A blue and earth pair is a suggested option"));
  assert(html.includes("Cool sky and distance in a separate study."));
  assert(html.includes("Try a blue-earth neutral on scrap paper."));
  assert(
    !/The artist used|The original pigment is|The painter mixed/.test(html),
  );
});

test("palette omits repeated detail while retaining distinct supplied colour roles", () => {
  const repeated = "Keep the warm accents around the focal area.";
  const html = render({
    strategy: repeated,
    palette: [
      {
        name: "Burnt Sienna",
        hex: "#AE6F50",
        use: repeated.toUpperCase(),
        mix: "An earth-blue pair can make a muted shadow.",
      },
    ],
    omit: [repeated],
    hideHeading: true,
  });
  assert(!html.includes("Suggested palette"));
  assert(!html.includes("Palette strategy"));
  assert(!html.includes(repeated.toUpperCase()));
  assert(html.includes("Burnt Sienna"));
  assert(html.includes("An earth-blue pair can make a muted shadow."));
});

test("shadow, focal and distance roles render as friendly painting tags without invented metadata", () => {
  const palette = [
    { name: "Ultramarine", hex: "#526DA6", tag: "shadow_mix" },
    { name: "Burnt Sienna", hex: "#AE6F50", tag: "focal_accent" },
    { name: "Yellow Ochre", hex: "#CCA55A", tag: "atmospheric_distance" },
  ];
  const html = render({
    palette,
    strategy:
      "Keep the main wash cool; reserve warm accents near the focal area.",
  });
  for (const tag of ["Shadow mix", "Focal accent", "Atmospheric distance"])
    assert(html.includes(tag));
  assert(html.includes("Keep the main wash cool"));
  assert(!/Use in this painting|Mix idea|PB29|PBr7|PY43/.test(html));
  assert.deepEqual(usablePalette(palette), palette);
});

test("old saved palette and mock palettes render without invented painting metadata", () => {
  const mock = load("data/mockResults.ts").referenceResult.palette;
  const old = [
    { name: "Ultramarine", hex: "#526DA6" },
    { name: "Yellow Ochre", hex: "#CCA55A" },
  ];
  for (const palette of [mock, old]) {
    const html = render({ palette });
    for (const color of palette) assert(html.includes(color.name));
    assert(html.includes("Approximate swatches"));
    assert(
      !/Palette strategy|Use in this painting|Mix idea|PB29|PY43|Main wash|Cool|Warm/.test(
        html,
      ),
    );
    assert(!/purchase|manufacturer|generated palette|exact brand/i.test(html));
  }
  assert.deepEqual(usablePalette(old), old);
});

test("invalid optional palette fields are omitted without losing valid saved color data", () => {
  const base = { name: "Sap green", hex: "#7F986E" };
  assert.deepEqual(
    usablePalette([
      {
        ...base,
        temperature: "hot",
        use: { text: "Vegetation" },
        mix: "x".repeat(181),
        tag: "constructor",
        pigmentCode: "PB29",
      },
    ]),
    [base],
  );
  for (const invalid of [
    undefined,
    null,
    "palette",
    {},
    [null],
    [{ name: {}, hex: "#ffffff" }],
  ]) {
    assert.deepEqual(usablePalette(invalid), []);
    assert.equal(render({ palette: invalid }), "");
  }
  assert.equal(
    usablePalette(Array.from({ length: 100 }, () => base)).length,
    8,
  );
  const html = render({ palette: [base], strategy: { unexpected: true } });
  assert(html.includes("Sap green"));
  assert(!html.includes("Palette strategy"));
});

test("optional pigment codes use only conservative common family matches", () => {
  for (const [name, code] of [
    ["Ultramarine blue", "PB29"],
    ["Burnt Sienna", "PBr7"],
    ["Yellow Ochre", "PY43"],
    ["Ochre", "PY42"],
  ])
    assert.equal(
      usablePalette([{ name, hex: "#526DA6", pigmentCode: code }])[0]
        .pigmentCode,
      code,
    );
  for (const [name, code] of [
    ["Ultramarine", "PB35"],
    ["Raw Sienna", "PBr7"],
    ["Red Ochre", "PY43"],
    ["Cerulean", "PB35"],
    ["Payne's Gray", "PBk7"],
    ["Sap green", "PB29"],
  ])
    assert.equal(
      usablePalette([{ name, hex: "#526DA6", pigmentCode: code }])[0]
        .pigmentCode,
      undefined,
    );
});
