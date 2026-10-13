const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const ts = require("typescript");
function fixture() {
  const values = [];
  let index = 0;
  let cleanup;
  let next = 0;
  let account = "learner-a";
  const calls = [];
  const routes = [];
  const react = {
    useState(initial) {
      const at = index++;
      if (values[at] === undefined) values[at] = initial;
      return [
        values[at],
        (value) => {
          values[at] = value;
        },
      ];
    },
    useRef(initial) {
      const at = index++;
      if (values[at] === undefined) values[at] = { current: initial };
      return values[at];
    },
    useEffect(effect) {
      const at = index++;
      if (values[at] === undefined) {
        values[at] = true;
        cleanup = effect();
      }
    },
  };
  const exports = {};
  const jsx = {
    jsx: (type, props) => ({ type, props }),
    jsxs: (type, props) => ({ type, props }),
  };
  const mocks = {
    react,
    "react/jsx-runtime": jsx,
    "react-native": { Text: "Text", View: "View" },
    "expo-router": { router: { push: (route) => routes.push(route) } },
    "./ui": { Button: "Button", styles: {} },
    "../providers/AuthProvider": {
      useAuth: () => ({ session: { user: { id: account } } }),
    },
    "../lib/artworks": {
      createSaveAttempt: () => ({ id: `request-${++next}` }),
      saveArtwork: (...args) =>
        new Promise((resolve, reject) => calls.push({ args, resolve, reject })),
    },
  };
  const code = ts.transpileModule(
    fs.readFileSync(
      require("node:path").join(
        __dirname,
        "../components/SaveResultButton.tsx",
      ),
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
  new Function("exports", "require", code)(exports, (name) => {
    assert(name in mocks, `Unexpected import ${name}`);
    return mocks[name];
  });
  const initial = {
    mode: "improve_painting",
    focus: "Composition",
    image: { uri: "blob:painting" },
    title: "Get feedback",
  };
  return {
    calls,
    routes,
    render: (props = {}) => {
      index = 0;
      return exports.default({ ...initial, ...props }).props.children[0].props;
    },
    setAccount: (id) => {
      account = id;
    },
    unmount: () => cleanup(),
  };
}
test("double-click and in-place retry make one attempt and retain its request ID", async () => {
  const f = fixture();
  const button = f.render();
  const first = button.onPress();
  await button.onPress();
  assert.equal(f.calls.length, 1);
  assert.equal(f.render().disabled, true);
  f.calls[0].reject(new Error("We could not confirm your save"));
  await first;
  const retry = f.render().onPress();
  assert.equal(f.calls.length, 2);
  assert.equal(f.calls[0].args[3], f.calls[1].args[3]);
  f.calls[1].resolve({ id: "saved-result", warning: null });
  await retry;
  assert.equal(f.routes.length, 1);
  assert.equal(f.routes[0].params.id, "saved-result");
});
test("changing focus, selected image, or account starts a new attempt", async () => {
  const f = fixture();
  let previous;
  for (const props of [
    {},
    { focus: "Watercolor technique" },
    { focus: "Watercolor technique", image: { uri: "blob:another" } },
  ]) {
    const pending = f.render(props).onPress();
    const current = f.calls.at(-1);
    if (previous) assert.notEqual(current.args[3], previous);
    previous = current.args[3];
    current.reject(new Error("Network failed"));
    await pending;
  }
  f.setAccount("learner-b");
  const pending = f.render().onPress();
  const current = f.calls.at(-1);
  assert.notEqual(current.args[3], previous);
  current.resolve({ id: "saved", warning: null });
  await pending;
});
test("a late response after leaving the upload screen cannot navigate", async () => {
  const f = fixture();
  const pending = f.render().onPress();
  f.unmount();
  f.calls[0].resolve({ id: "saved", warning: null });
  await pending;
  assert.equal(f.routes.length, 0);
});
