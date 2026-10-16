const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");
const { loadShared } = require("./helpers/shared-loader.cjs");
const root = path.resolve(__dirname, "..");
const jsx = {
  jsx: (type, props) => ({ type, props }),
  jsxs: (type, props) => ({ type, props }),
};
const exportsForComponent = {};
const code = ts.transpileModule(
  fs.readFileSync(
    path.join(root, "components/ColourValueAnalysis.tsx"),
    "utf8",
  ),
  {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.ReactJSX,
    },
  },
).outputText;
new Function("exports", "require", code)(exportsForComponent, (name) => {
  if (name === "react/jsx-runtime") return jsx;
  if (name === "react-native") return { Text: "Text", View: "View" };
  if (name === "./ui") return { colors: {}, styles: {} };
  if (name === "./theme") return { design: { space: {}, radius: {} } };
  return loadShared(name, "components/ColourValueAnalysis.tsx");
});
function nodes(tree) {
  if (!tree || typeof tree !== "object") return [];
  return [tree, ...[tree.props?.children].flat(Infinity).flatMap(nodes)];
}
function text(tree) {
  return nodes(tree)
    .filter((n) => n.type === "Text")
    .flatMap((n) => [n.props.children].flat(Infinity))
    .join(" ")
    .replace(/\s+/g, " ");
}
function render(located, colours) {
  const source = require("./helpers/canonical-fixture.cjs")();
  source.canonicalAnalysis.colourAnalysis =
    require("./helpers/colour-fixture.cjs")();
  if (colours) source.canonicalAnalysis.colourAnalysis.visibleColours = colours;
  const before = structuredClone(source),
    calls = [];
  const tree = exportsForComponent.default({
    source,
    renderEvidence(index) {
      calls.push(index);
      return located.includes(index)
        ? { type: "OriginalSourceEvidence", props: { index } }
        : null;
    },
  });
  assert.deepEqual(
    source,
    before,
    "presentation must not create role links or geometry",
  );
  assert.deepEqual(
    calls,
    source.canonicalAnalysis.colourAnalysis.visibleColours.map((_, i) => i),
  );
  return {
    tree,
    text: text(tree),
    colours: source.canonicalAnalysis.colourAnalysis.visibleColours,
  };
}
const localNotice = "No confidently located source detail for this colour.";
test("mixed colour evidence with two unlocated colours uses one shared notice and retains the located original", () => {
  const result = render([0]);
  assert.equal(
    result.text.split("exact source regions were not located confidently")
      .length - 1,
    1,
  );
  assert(!result.text.includes(localNotice));
  assert.deepEqual(
    nodes(result.tree)
      .filter((n) => n.type === "OriginalSourceEvidence")
      .map((n) => n.props.index),
    [0],
  );
  for (const colour of result.colours)
    assert(result.text.includes(colour.label));
  assert.equal(
    nodes(result.tree).filter((n) =>
      n.props?.accessibilityLabel?.startsWith("Approximate analysis colour:"),
    ).length,
    3,
  );
});
test("one unlocated colour uses only its concise local notice", () => {
  const result = render([0, 2]);
  assert.equal(result.text.split(localNotice).length - 1, 1);
  assert(!result.text.includes("exact source regions"));
  assert(!result.text.includes("Source regions were not located confidently"));
  assert.equal(
    nodes(result.tree).filter((n) => n.type === "OriginalSourceEvidence")
      .length,
    2,
  );
});
test("all unlocated colours retain their names and one shared notice without fabricated evidence", () => {
  const result = render([]);
  assert.equal(
    result.text.split(
      "Source regions were not located confidently for these colours.",
    ).length - 1,
    1,
  );
  assert(!result.text.includes(localNotice));
  assert.equal(
    nodes(result.tree).filter((n) => n.type === "OriginalSourceEvidence")
      .length,
    0,
  );
  for (const colour of result.colours)
    assert(result.text.includes(colour.label));
});
test("all located colours preserve original evidence without a missing-region notice", () => {
  const result = render([0, 1, 2]);
  assert(!result.text.includes("not located confidently"));
  assert(!result.text.includes(localNotice));
  assert.equal(
    nodes(result.tree).filter((n) => n.type === "OriginalSourceEvidence")
      .length,
    3,
  );
});
test("an unknown supplied role ID does not render an invented role label", () => {
  const result = render(
    [],
    [{ label: "Cool grey", approximateHex: "#889999", roleId: "absent-role" }],
  );
  assert(!result.text.includes("undefined"));
  assert(!result.text.includes("supporting area"));
  assert(!result.text.includes("quiet area"));
  assert(!result.text.includes("focal area"));
});
