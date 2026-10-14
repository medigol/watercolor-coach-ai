const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");
function fixture(width = 375, platform = "web", initiallyOpen) {
  let choice,
    currentWidth = width;
  const exports = {};
  const jsx = (type, props) => ({ type, props });
  const source = ts.transpileModule(
    fs.readFileSync(
      path.join(__dirname, "../components/StudyDisclosure.tsx"),
      "utf8",
    ),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        jsx: ts.JsxEmit.ReactJSX,
        target: ts.ScriptTarget.ES2022,
      },
    },
  ).outputText;
  const mocks = {
    react: {
      useState: () => [
        choice,
        (value) => {
          choice = value;
        },
      ],
    },
    "react/jsx-runtime": { jsx, jsxs: jsx },
    "react-native": {
      View: "View",
      Text: "Text",
      Pressable: "Pressable",
      Platform: { OS: platform },
      useWindowDimensions: () => ({ width: currentWidth }),
    },
    "./ui": { colors: {}, styles: {} },
  };
  new Function("exports", "require", source)(exports, (name) => {
    assert(name in mocks, name);
    return mocks[name];
  });
  return {
    render: () =>
      exports.default({
        title: "Composition model",
        helper: "General teaching ideas.",
        children: "Study contents",
        initiallyOpen,
      }),
    resize: (width) => {
      currentWidth = width;
    },
  };
}
const button = (tree) => tree.props.children[0].props;
const content = (tree) => tree.props.children[1];
test("mobile study disclosure leaves details hidden until the learner opens them", () => {
  const f = fixture();
  let tree = f.render();
  assert.equal(button(tree)["aria-expanded"], false);
  assert.equal(content(tree), false);
  assert.equal(button(tree).accessibilityRole, "button");
  assert.equal(button(tree).accessibilityLabel, "Composition model");
  button(tree).onPress();
  tree = f.render();
  assert.equal(button(tree)["aria-expanded"], true);
  assert.equal(content(tree), "Study contents");
  button(tree).onPress();
  assert.equal(content(f.render()), false);
});
test("desktop defaults open while learner choice survives resizing", () => {
  const f = fixture(1440);
  assert.equal(content(f.render()), "Study contents");
  button(f.render()).onPress();
  f.resize(375);
  assert.equal(content(f.render()), false);
  button(f.render()).onPress();
  f.resize(1440);
  assert.equal(content(f.render()), "Study contents");
});
test("explicitly secondary follow-up and native tablet details remain folded", () => {
  assert.equal(content(fixture(1440, "web", false).render()), false);
  assert.equal(content(fixture(1200, "ios").render()), false);
});
