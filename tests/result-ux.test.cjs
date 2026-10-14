const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const root = path.resolve(__dirname, "..");
function render(mode, provider, image) {
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
      if (name === "@expo/vector-icons") return { Ionicons: () => null };
      if (name === "react" || name === "react/jsx-runtime")
        return require(name);
      if (name === "react-native")
        return {
          Text: (props) => React.createElement("span", null, props.children),
          View: (props) => React.createElement("div", null, props.children),
          Image: (props) =>
            React.createElement("img", {
              src: props.source.uri,
              alt: props.accessibilityLabel,
            }),
          ActivityIndicator: () => null,
        };
      if (name.endsWith("/ui") || name === "./ui")
        return {
          Screen: (props) => React.createElement("main", null, props.children),
          Button: (props) => React.createElement("button", null, props.title),
          colors: {},
          styles: {},
        };
      if (name.endsWith("/useSavedResult"))
        return {
          useSavedResult: (sample) => ({
            result: sample,
            provider,
            image,
            focus: "Composition",
            loading: false,
            error: "",
            retry: () => {},
          }),
        };
      if (/MiniWatercolorScene|ArtworkThumbnail|WatercolorSwatch/.test(name))
        return {
          __esModule: true,
          default: () => React.createElement("div", { "data-study-aid": true }),
        };
      const full = path.resolve(root, path.dirname(relative), name);
      const file = [".tsx", ".ts"]
        .map((ext) => full + ext)
        .find((f) => fs.existsSync(f));
      if (!file) throw new Error(`Unexpected import ${name}`);
      return load(path.relative(root, file));
    });
    return exports;
  }
  const Component = load(
    `app/result/${mode === "create_reference" ? "create-reference" : "improve-painting"}.tsx`,
  ).default;
  return renderToStaticMarkup(React.createElement(Component));
}
for (const provider of ["mock", "openai"])
  for (const mode of ["improve_painting", "create_reference"])
    test(`${mode}/${provider}: unchanged saved JSON renders with honestly labelled study aids`, () => {
      const html = render(
        mode,
        provider,
        "https://example.invalid/private-signed-image",
      );
      assert(html.includes("Generic line-study aid · adapt it to your photo"));
      assert(
        html.includes(
          "Generic value-study aid · group your subject into light, middle, and dark",
        ),
      );
      assert(
        !/simplified reference placeholder|Sample line study|Sample tonal plan/.test(
          html,
        ),
      );
      if (mode === "create_reference") {
        assert(html.includes("Your photo"));
        assert(html.includes("No new image is generated."));
        assert(html.includes("generic planning aids"));
        assert(html.includes("Painting steps"));
        assert(html.includes("Coastal Town"));
        assert(!html.includes("Simplified reference"));
        assert(
          html.includes(
            provider === "mock"
              ? "Sample painting plan"
              : "Photo-based coaching notes",
          ),
        );
      } else {
        assert(html.includes("Your painting"));
        assert(html.includes("Lake House"));
        assert(html.indexOf("Main advice") < html.indexOf("What works"));
        assert(html.includes("not studies generated"));
      }
    });
test("reference without an uploaded image keeps sample plan and generic aids, without inventing a photo", () => {
  const html = render("create_reference", "mock");
  assert(!html.includes("Your photo"));
  assert(!html.includes("<img"));
  assert(html.includes("Sample painting plan"));
  assert(html.includes("generic planning aids"));
});
test("painting sequence uses numbered markers with no scene thumbnails", () => {
  const source = fs.readFileSync(
    path.join(root, "components/PaintingStepsCard.tsx"),
    "utf8",
  );
  assert(!/MiniWatercolorScene|ArtworkThumbnail|Image\b/.test(source));
  assert(source.includes("{i + 1}"));
});
