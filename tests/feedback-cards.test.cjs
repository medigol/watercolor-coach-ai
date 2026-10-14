const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const root = path.resolve(__dirname, "..");
const modules = new Map();
function load(relative) {
  if (modules.has(relative)) return modules.get(relative);
  const exports = {};
  modules.set(relative, exports);
  const code = ts.transpileModule(fs.readFileSync(path.join(root, relative), "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.ReactJSX,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  new Function("exports", "require", code)(exports, (name) => {
    if (name === "react" || name === "react/jsx-runtime") return require(name);
    if (name === "@expo/vector-icons") return { Ionicons: () => null };
    if (name === "react-native") return {
      Text: (props) => React.createElement("span", null, props.children),
      View: (props) => React.createElement("div", null, props.children),
    };
    if (name === "./ui") return { styles: {}, colors: {} };
    const full = path.resolve(root, path.dirname(relative), name);
    const file = [".tsx", ".ts"].map((ext) => full + ext).find((f) => fs.existsSync(f));
    if (!file) throw new Error(`Unexpected import ${name}`);
    return load(path.relative(root, file));
  });
  return exports;
}
const feedback = (props) => renderToStaticMarkup(
  React.createElement(load("components/FeedbackDetails.tsx").default, props),
);
const question = (props) => renderToStaticMarkup(
  React.createElement(load("components/FollowUpQuestion.tsx").default, props),
);

test("constructive feedback keeps specific strengths visible and limits distinct fixes to three", () => {
  const html = feedback({
    works: ["The soft sky wash supports distance.", "Open water gives the focal group space."],
    promising: "The warm light could carry a restrained final accent.",
    fixes: [
      "The soft sky wash supports distance.", "Group the foreground darks.",
      "Reserve a clean light.", "Sharpen only the focal marks.", "Quiet the distant edge.",
    ],
  });
  assert(html.includes("What works well"));
  assert(html.includes("What is promising"));
  assert(html.includes("What to improve"));
  assert(html.indexOf("What works well") < html.indexOf("What to improve"));
  assert.equal((html.match(/The soft sky wash supports distance\./g) || []).length, 1);
  assert(html.includes("Sharpen only the focal marks."));
  assert(!html.includes("Quiet the distant edge."));
});

test("duplicate summary advice is removed from secondary feedback but a supplied strength remains visible", () => {
  const text = "The soft sky wash supports distance.";
  const html = feedback({
    works: [text], promising: text.toUpperCase(),
    fixes: [text, "Reserve a clean light."], omit: [text],
  });
  assert(html.includes("What works well"));
  assert.equal((html.match(/The soft sky wash supports distance\./g) || []).length, 1);
  assert(!html.includes("What is promising"));
  assert(html.includes("Reserve a clean light."));
});

test("strong-work feedback presents study observations and optional next-study refinements", () => {
  const html = feedback({
    study: true,
    works: ["The connected shadow shapes lead toward the small focal group."],
    promising: "The lost edges show how a broad wash can carry atmosphere.",
    fixes: [
      "The main issue is weak composition. You should fix this.",
      "One possible variation would be a quieter foreground in a new study.",
    ],
  });
  for (const title of ["What makes this work", "Advanced learning notes", "Optional refinements"])
    assert(html.includes(title));
  assert(html.includes("Optional next study:"));
  assert(html.includes("One possible variation"));
  assert(!/The main issue|You should fix|What to improve/.test(html));
});

test("empty refinements do not manufacture criticism for a resolved work", () => {
  const html = feedback({ study: true, works: ["The preserved light carries the atmosphere."], fixes: [] });
  assert(html.includes("What makes this work"));
  assert(!html.includes("Optional refinements"));
  assert(!html.includes("What to improve"));
  assert.equal(feedback({ works: [null, {}], fixes: [], promising: {} }), "");
});

test("structural normal-work improvements are labelled for the next study", () => {
  const html = feedback({
    works: ["The large light shape carries the scene."],
    fixes: ["Move the focal figures slightly off centre.", "Crop the heavy foreground.", "Test a small focal accent on scrap first."],
  });
  assert(html.includes("Next study: Move the focal figures slightly off centre."));
  assert(html.includes("Next study: Crop the heavy foreground."));
  assert(html.includes("Test a small focal accent on scrap first."));
  assert(!html.includes("Next study: Test a small focal accent"));
});

test("follow-up stays optional and short, supports a disclosure and learning framing", () => {
  const text = "How can I practise this kind of edge control?";
  const html = question({ text, study: true });
  assert(html.includes("Follow-up question"));
  assert(html.includes("Use this if you want another coaching round."));
  assert(html.includes("Optional learning question for a future study."));
  assert(html.includes(text));
  assert(!html.includes("Suggested next prompt"));
  const nested = question({ text, hideHeading: true });
  assert(!nested.includes("Follow-up question"));
  assert(nested.includes(text));
  assert.equal(question({ text: "How should I fix the main issue in this painting?", study: true }), "");
});
