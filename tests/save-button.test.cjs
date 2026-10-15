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
      liveFeedbackErrorMessage: "Live AI feedback could not be prepared. Please try again.",
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
    errorText: (props = {}) => {
      index = 0;
      return exports.default({ ...initial, ...props }).props.children[1]?.props?.children;
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
  f.calls[1].resolve({ id: "saved-result", warning: null, provider: "openai" });
  await retry;
  assert.equal(f.routes.length, 1);
  assert.equal(f.routes[0].params.id, "saved-result");
});
test("changing a selected image or account starts a new attempt", async () => {
  const f = fixture();
  let previous;
  for (const props of [
    {},
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
  current.resolve({ id: "saved", warning: null, provider: "openai" });
  await pending;
});
test("a late response after leaving the upload screen cannot navigate", async () => {
  const f = fixture();
  const pending = f.render().onPress();
  f.unmount();
  f.calls[0].resolve({ id: "saved", warning: null, provider: "openai" });
  await pending;
  assert.equal(f.routes.length, 0);
});
test("production feedback errors stay on the upload screen without navigation", async () => {
  for (const message of [
    "Live AI feedback could not be prepared. Please try again.",
    "You have used your 3 free AI feedback results. More feedback will be available after subscriptions are added.",
    "Feedback is already being prepared. Check My Artworks in a moment.",
    "Please sign in again before requesting feedback.",
    "Choose a painting or photo before requesting feedback.",
    "Your image could not be uploaded. Choose it again and try again.",
  ]) {
    const f = fixture();
    const pending = f.render().onPress();
    f.calls[0].reject(new Error(message));
    await pending;
    assert.equal(f.routes.length, 0);
    assert.equal(f.render().disabled, false);
    assert.equal(f.errorText(), message);
  }
});
test("a stale or malformed provider response cannot navigate to a fake critique", async () => {
  for (const provider of ["mock", undefined, "other"]) {
    const f = fixture();
    const pending = f.render().onPress();
    f.calls[0].resolve({ id: "stale-result", warning: "Sample", provider });
    await pending;
    assert.equal(f.routes.length, 0);
    assert.equal(f.render().disabled, false);
    assert.equal(f.errorText(), "Live AI feedback could not be prepared. Please try again.");
  }
});

test("initial painting focus changes preserve an uncertain request ID; reference identity stays unchanged",async()=>{
 for(const mode of ["improve_painting","create_reference"]){const f=fixture();let previous;for(const focus of ["Composition","Colour & contrast","Watercolor technique"]){const pending=f.render({mode,focus}).onPress();const current=f.calls.at(-1);if(previous){if(mode==='improve_painting')assert.equal(current.args[3],previous);else assert.notEqual(current.args[3],previous);}previous=current.args[3];current.reject(new Error('Uncertain completion'));await pending;}}
});
