const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const root = path.resolve(__dirname, "..");
function render(mode, provider, image, overlays, { expandedDetails = false } = {}) {
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
      if (name === "react" && expandedDetails && relative.endsWith("FeedbackDetails.tsx"))
        return { ...React, useState: () => [true, () => {}] };
      if (name === "react" || name === "react/jsx-runtime")
        return require(name);
      if (name === "react-native-svg") {
        const shape = (props) => React.createElement("svg", null, props.children);
        return {
          __esModule: true,
          default: shape,
          Ellipse: shape,
          Rect: shape,
          Polyline: shape,
          Polygon: shape,
          Path: shape,
          G: shape,
        };
      }
      if (name === "react-native")
        return {
          Text: (props) =>
            React.createElement("span", { role: props.accessibilityRole }, props.children),
          View: (props) =>
            React.createElement("div", { "aria-label": props.accessibilityLabel }, props.children),
          Image: (props) =>
            React.createElement("img", {
              src: props.source.uri,
              alt: props.accessibilityLabel,
            }),
          ActivityIndicator: () => null,
          Pressable: (props) =>
            React.createElement(
              "button",
              {
                "aria-label": props.accessibilityLabel,
                "aria-expanded": props["aria-expanded"],
                "aria-selected": props["aria-selected"],
                disabled: props.disabled,
              },
              props.children,
            ),
          StyleSheet: { create: (value) => value },
          Platform: { OS: "web", select: (choices) => choices.web ?? choices.default },
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
            result: overlays === undefined ? sample : { ...sample, overlays },
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
      assert(html.includes("Planning sketch aid"));
      assert(html.includes("Value grouping aid"));
      assert(html.includes("Generic planning aid · adapt this to your image"));
      assert(html.includes("Generic value-study aid · adapt this to your image"));
      assert(!html.includes("Visual coaching notes"));
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
        assert(html.indexOf("Your photo") < html.indexOf("Painting plan"));
        assert(html.indexOf("Painting plan") < html.indexOf("Reference preparation"));
        assert(html.indexOf("Reference preparation") < html.indexOf("Planning sketch aid"));
        assert(html.indexOf("Value grouping aid") < html.indexOf("Suggested palette"));
        assert(html.indexOf("Suggested palette") < html.indexOf("Painting steps"));
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
        assert(html.indexOf("Your painting") < html.indexOf("Main advice"));
        assert(html.indexOf("Main advice") < html.indexOf("What works &amp; what to fix"));
        assert(html.includes('aria-expanded="false"'));
        assert(!html.includes("The quiet blue-green palette creates a peaceful mood."));
        assert(html.indexOf("Value grouping aid") < html.indexOf("Next 15-minute practice"));
        assert(html.indexOf("Next 15-minute practice") < html.indexOf("Suggested next prompt"));
      }
    });
test("reference without an uploaded image keeps sample plan and generic aids, without inventing a photo", () => {
  const html = render("create_reference", "mock");
  assert(!html.includes("Your photo"));
  assert(!html.includes("<img"));
  assert(html.includes("Sample painting plan"));
  assert(html.includes("generic planning aids"));
  assert(!html.includes("Reference preparation"));
});

test("saved painting strengths and fixes render when compact details are expanded", () => {
  for (const provider of ["mock", "openai"]) {
    const html = render("improve_painting", provider, undefined, undefined, {
      expandedDetails: true,
    });
    assert(html.includes('aria-expanded="true"'));
    assert(html.includes("The quiet blue-green palette creates a peaceful mood."));
    assert(html.includes("The trees and house have similar darkness, so the house gets lost."));
    assert(html.indexOf("Main advice") < html.indexOf("What works"));
    assert(html.indexOf("What to fix") < html.indexOf("Composition suggestion"));
  }
});
test("painting sequence uses numbered markers with no scene thumbnails", () => {
  const source = fs.readFileSync(
    path.join(root, "components/PaintingStepsCard.tsx"),
    "utf8",
  );
  assert(!/MiniWatercolorScene|ArtworkThumbnail|Image\b/.test(source));
  assert(source.includes("{i + 1}"));
});

test("saved overlay metadata without an uploaded image still renders normal text guidance", () => {
  const notes = Array.from({ length: 3 }, () => ({
    type: "focal_point",
    label: "Preserve this light",
    x: 25,
    y: 40,
    priority: "high",
    shortInstruction: "Keep this light shape open.",
    reason: "It supports atmosphere.",
    action: "Reserve the paper white.",
  }));
  for (const mode of ["improve_painting", "create_reference"]) {
    const html = render(mode, "openai", undefined, notes);
    assert(!html.includes("Visual coaching notes"));
    assert(
      html.includes(
        mode === "improve_painting" ? "Main advice" : "Painting plan",
      ),
    );
    const invalid = render(
      mode,
      "openai",
      "https://example.invalid/private-image",
      [{ x: 200 }],
    );
    assert(!invalid.includes("Visual coaching notes"));
    assert(invalid.includes(mode === "create_reference" ? "Your photo" : "Your painting"));
    assert(invalid.includes("Planning sketch aid"));
  }
});
