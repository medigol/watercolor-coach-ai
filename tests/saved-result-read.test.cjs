const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const ts = require("typescript");
const root = path.resolve(__dirname, "..");
const userId = "10000000-0000-4000-8000-000000000001";
const artworkId = "20000000-0000-4000-8000-000000000001";

function load(relative, imports) {
  const output = ts.transpileModule(fs.readFileSync(path.join(root, relative), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const exports = {};
  new Function("exports", "require", output)(exports, (name) => {
    assert(name in imports, `Unexpected import: ${name}`);
    return imports[name];
  });
  return exports;
}
const samples = load("data/mockResults.ts", {});

// Run the real hook and persistence validators. The small hook host lets the
// test inspect async state transitions without adding native test dependencies.
function fixture(mode, provider, options = {}) {
  const calls = { reads: [], signs: [], model: 0, saves: 0 };
  const values = new Map();
  let index = 0;
  let effects = [];
  let params = options.sampleOnly ? {} : { id: artworkId };
  const sample = mode === "improve_painting" ? samples.improveResult : samples.referenceResult;
  let row = {
    provider,
    result_json: { ...sample, title: "Saved personal painting" },
    artworks: { image_url: `${userId}/painting.png`, focus_area: "Composition" },
  };
  const react = {
    useState(initial) {
      const at = index++;
      if (!values.has(at)) values.set(at, initial);
      return [values.get(at), (next) => values.set(at,
        typeof next === "function" ? next(values.get(at)) : next)];
    },
    useEffect(effect, deps) {
      const at = index++;
      const previous = values.get(at);
      if (!previous || deps.some((value, i) => !Object.is(value, previous.deps[i]))) {
        effects.push(() => {
          previous?.cleanup?.();
          values.set(at, { deps, cleanup: effect() });
        });
      }
    },
  };
  const client = {
    from(table) {
      assert.equal(table, "ai_results", "Saved-result reads must not query model or quota operations");
      const query = { filters: {} };
      calls.reads.push(query);
      const chain = {
        select(columns) { query.columns = columns; return chain; },
        eq(field, value) { query.filters[field] = value; return chain; },
        abortSignal(signal) { query.signal = signal; return chain; },
        async single() { return { data: row, error: null }; },
      };
      return chain;
    },
    storage: { from(bucket) {
      assert.equal(bucket, "artworks");
      return { async createSignedUrl(name) {
        calls.signs.push(name);
        return { data: { signedUrl: "https://example.invalid/signed-painting" }, error: null };
      } };
    } },
    rpc() { calls.saves++; throw new Error("A gallery/result read must never save or charge quota"); },
    functions: { invoke() { calls.model++; throw new Error("A gallery/result read must never call the model"); } },
  };
  const artifacts = load("lib/artworks.ts", {
    "./supabase": { requireSupabase: () => client },
    "../data/mockResults": samples,
  });
  const { useSavedResult } = load("hooks/useSavedResult.ts", {
    react,
    "expo-router": { useLocalSearchParams: () => params },
    "../lib/supabase": { requireSupabase: () => client },
    "../lib/artworks": artifacts,
    "../providers/AuthProvider": { useAuth: () => ({ session: { user: { id: userId } } }) },
  });
  return {
    calls,
    setRow(next) { row = next; },
    setParams(next) { params = next; },
    render() { index = 0; return useSavedResult(sample, mode); },
    async settle() {
      const queued = effects; effects = [];
      queued.forEach((effect) => effect());
      await new Promise((resolve) => setImmediate(resolve));
    },
  };
}

for (const mode of ["improve_painting", "create_reference"])
  for (const provider of ["openai", "mock"])
    test(`${mode}/${provider}: opening and retrying a saved result reads its provider without model/save/quota side effects`, async () => {
      const f = fixture(mode, provider);
      assert.equal(f.render().loading, true);
      await f.settle();
      const saved = f.render();
      assert.equal(saved.loading, false);
      assert.equal(saved.error, "");
      assert.equal(saved.provider, provider);
      assert.equal(saved.isSaved, true);
      assert.equal(saved.result.title, "Saved personal painting");
      assert.equal(saved.image, "https://example.invalid/signed-painting");
      assert.deepEqual(f.calls.reads[0].filters, { artwork_id: artworkId, user_id: userId, mode });
      assert(f.calls.reads[0].columns.startsWith("provider,result_json,"));
      saved.retry();
      assert.equal(f.render().loading, true);
      await f.settle();
      assert.equal(f.render().provider, provider);
      assert.equal(f.calls.reads.length, 2);
      assert.equal(f.calls.model, 0);
      assert.equal(f.calls.saves, 0);
    });
test("no-ID sample routes are labelled mock rather than saved, with no requests", async () => {
  const f = fixture("improve_painting", "openai", { sampleOnly: true });
  f.render();
  await f.settle();
  const state = f.render();
  assert.equal(state.isSaved, false);
  assert.equal(state.provider, "mock");
  assert.equal(state.result.title, "Lake House");
  assert.equal(state.loading, false);
  assert.deepEqual(f.calls, { reads: [], signs: [], model: 0, saves: 0 });
});
test("unsupported saved providers cannot be mistaken for live feedback", async () => {
  const f = fixture("improve_painting", "unexpected");
  f.render();
  await f.settle();
  const state = f.render();
  assert.match(state.error, /could not open this saved result/);
  assert.equal(state.provider, "mock");
  assert.equal(f.calls.signs.length, 0);
  assert.equal(f.calls.model, 0);
  assert.equal(f.calls.saves, 0);
});
test("opening the gallery and selecting an existing artwork only reads storage/database and navigates", async () => {
  const values = new Map();
  let index = 0;
  let focusEffect;
  const routes = [];
  const calls = { reads: [], signs: [], model: 0, saves: 0 };
  const row = {
    id: artworkId, mode: "improve_painting", title: "Lake House",
    image_url: `${userId}/painting.png`, focus_area: "Composition",
    created_at: "2026-10-14T00:00:00Z",
  };
  const client = {
    from(table) {
      assert.equal(table, "artworks");
      const query = { filters: {} }; calls.reads.push(query);
      const chain = {
        select(columns) { query.columns = columns; return chain; },
        eq(field, value) { query.filters[field] = value; return chain; },
        order() { return chain; },
        abortSignal() { return chain; },
        then(resolve, reject) { return Promise.resolve({ data: [row], error: null }).then(resolve, reject); },
      };
      return chain;
    },
    storage: { from() { return { async createSignedUrl(name) {
      calls.signs.push(name);
      return { data: { signedUrl: "https://example.invalid/signed-gallery-image" }, error: null };
    } }; } },
    rpc() { calls.saves++; throw new Error("Gallery reads must not save or charge quota"); },
    functions: { invoke() { calls.model++; throw new Error("Gallery reads must not call the model"); } },
  };
  const react = {
    useState(initial) {
      const at = index++;
      if (!values.has(at)) values.set(at, initial);
      return [values.get(at), (next) => values.set(at, typeof next === "function" ? next(values.get(at)) : next)];
    },
    useCallback(callback) { return callback; },
  };
  const artifacts = load("lib/artworks.ts", {
    "./supabase": { requireSupabase: () => client }, "../data/mockResults": samples,
  });
  const jsx = (type, props) => ({ type, props });
  const { default: Gallery } = load("app/(tabs)/artworks.tsx", {
    react, "react/jsx-runtime": { jsx, jsxs: jsx },
    "react-native": { Text: "Text", ActivityIndicator: "ActivityIndicator" },
    "expo-router": { useFocusEffect(callback) { focusEffect = callback; }, router: { push(route) { routes.push(route); } } },
    "../../components/ArtworkCard": { __esModule: true, default: "ArtworkCard" },
    "../../components/ui": { Button: "Button", Screen: "Screen", styles: {}, colors: {} },
    "../../lib/supabase": { requireSupabase: () => client },
    "../../lib/artworks": artifacts,
    "../../providers/AuthProvider": { useAuth: () => ({ session: { user: { id: userId } } }) },
  });
  Gallery(); focusEffect();
  await new Promise((resolve) => setImmediate(resolve));
  index = 0;
  const cards = Gallery().props.children[2];
  assert.equal(cards.length, 1);
  assert.equal(cards[0].props.artwork.title, "Lake House");
  cards[0].props.onPress();
  assert.deepEqual(routes, [{ pathname: "/result/improve-painting", params: { id: artworkId } }]);
  assert.deepEqual(calls.reads[0].filters, { user_id: userId });
  assert.deepEqual(calls.signs, [row.image_url]);
  assert.equal(calls.model, 0);
  assert.equal(calls.saves, 0);
});
