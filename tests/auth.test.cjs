const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const ts = require("typescript");

const root = path.resolve(__dirname, "..");

// Exercise the real auth handlers with controlled storage/network and hooks.
// This suite does not replace browser rendering or live Supabase verification.
function load(file, mocks) {
  const exports = {};
  const { outputText } = ts.transpileModule(
    fs.readFileSync(path.join(root, file), "utf8"),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        jsx: ts.JsxEmit.ReactJSX,
        target: ts.ScriptTarget.ES2020,
      },
    },
  );
  new Function("require", "exports", outputText)((name) => {
    if (!(name in mocks)) throw new Error(`Unexpected import: ${name}`);
    return mocks[name];
  }, exports);
  return exports;
}

function hooks(initial = []) {
  let index = 0;
  const values = [...initial];
  const effects = [];
  return {
    values,
    effects,
    react: {
      useState(value) {
        const current = index++;
        if (values[current] === undefined) values[current] = value;
        return [
          values[current],
          (next) => {
            values[current] =
              typeof next === "function" ? next(values[current]) : next;
          },
        ];
      },
      useEffect(effect) {
        effects.push(effect);
      },
      createContext() {
        return { Provider: "Provider" };
      },
      useContext() {
        return { error: null };
      },
    },
  };
}

const jsx = {
  jsx: (type, props, key) => ({ type, props, key }),
  jsxs: (type, props, key) => ({ type, props, key }),
  Fragment: "Fragment",
};
const tick = () => new Promise((resolve) => setImmediate(resolve));

function authFixture(getSession) {
  const state = hooks();
  let callback;
  let unsubscribed = false;
  const { AuthProvider } = load("providers/AuthProvider.tsx", {
    react: state.react,
    "react/jsx-runtime": jsx,
    "react-native": { Platform: { OS: "web" } },
    "../lib/supabase": {
      supabase: {
        auth: {
          onAuthStateChange(next) {
            callback = next;
            return {
              data: {
                subscription: {
                  unsubscribe() {
                    unsubscribed = true;
                  },
                },
              },
            };
          },
          getSession,
        },
      },
    },
  });
  AuthProvider({ children: null });
  const cleanup = state.effects[0]();
  return {
    values: state.values,
    emit: (event, session) => callback(event, session),
    cleanup,
    unsubscribed: () => unsubscribed,
  };
}

for (const event of ["SIGNED_IN", "SIGNED_OUT"]) {
  test(`stale restoration and INITIAL_SESSION cannot undo ${event}`, async () => {
    let resolve;
    const fixture = authFixture(
      () =>
        new Promise((done) => {
          resolve = done;
        }),
    );
    const latest = event === "SIGNED_IN" ? { user: { id: "new-user" } } : null;
    fixture.emit(event, latest);
    fixture.emit("INITIAL_SESSION", { user: { id: "stale-initial-user" } });
    resolve({
      data: { session: { user: { id: "stale-restored-user" } } },
      error: null,
    });
    await tick();
    assert.equal(fixture.values[0], latest);
    assert.equal(fixture.values[1], false);
    fixture.cleanup();
    assert.equal(fixture.unsubscribed(), true);
  });
}

test("failed restoration becomes sign-in and the error clears after login", async () => {
  const fixture = authFixture(() =>
    Promise.reject(new Error("controlled failure")),
  );
  await tick();
  assert.equal(fixture.values[0], null);
  assert.equal(fixture.values[1], false);
  assert.match(fixture.values[2], /sign in again/);
  const session = { user: { id: "signed-in-user" } };
  fixture.emit("SIGNED_IN", session);
  assert.equal(fixture.values[0], session);
  assert.equal(fixture.values[2], null);
  fixture.cleanup();
});

test("unmounted auth provider ignores pending restoration and unsubscribes", async () => {
  let resolve;
  const fixture = authFixture(
    () =>
      new Promise((done) => {
        resolve = done;
      }),
  );
  fixture.cleanup();
  resolve({ data: { session: { user: { id: "late-user" } } }, error: null });
  await tick();
  assert.equal(fixture.values[0], null);
  assert.equal(fixture.unsubscribed(), true);
});

function find(node, type) {
  if (!node || typeof node !== "object") return;
  if (node.type === type) return node;
  const children = node.props?.children;
  for (const child of Array.isArray(children) ? children : [children]) {
    const result = find(child, type);
    if (result) return result;
  }
}

async function submitPassword(signup, password) {
  const state = hooks(["learner@example.invalid", password, "", false, ""]);
  const calls = [];
  const authMethod = (name) => async () => {
    calls.push(name);
    return { data: { session: {} }, error: null };
  };
  const { default: AccountForm } = load("components/AccountForm.tsx", {
    react: state.react,
    "react/jsx-runtime": jsx,
    "expo-router": { Link: "Link" },
    "react-native": { Text: "Text", TextInput: "TextInput", View: "View" },
    "../providers/AuthProvider": { useAuth: () => ({ error: null }) },
    "../lib/supabase": {
      requireSupabase: () => ({
        auth: {
          signInWithPassword: authMethod("signin"),
          signUp: authMethod("signup"),
        },
      }),
    },
    "./ui": { Button: "Button", Screen: "Screen", styles: {}, colors: {} },
  });
  await find(AccountForm({ signup }), "Button").props.onPress();
  return { calls, message: state.values[4] };
}

test("sign-in accepts existing six-character passwords while signup keeps its minimum", async () => {
  assert.deepEqual((await submitPassword(false, "six-ok")).calls, ["signin"]);
  const shortSignup = await submitPassword(true, "six-ok");
  assert.deepEqual(shortSignup.calls, []);
  assert.match(shortSignup.message, /at least 8/);
  assert.deepEqual((await submitPassword(true, "eight-ok")).calls, ["signup"]);
  assert.deepEqual((await submitPassword(false, "")).calls, []);
});

test("switching accounts resets the protected stack without resetting token refresh", () => {
  let session = { user: { id: "account-a" }, access_token: "first-token" };
  const Stack = Object.assign(() => {}, {
    Protected: "Protected",
    Screen: "StackScreen",
  });
  const { default: RootLayout } = load("app/_layout.tsx", {
    "react/jsx-runtime": jsx,
    "expo-router": { Stack },
    "expo-status-bar": { StatusBar: "StatusBar" },
    "react-native": { ActivityIndicator: "ActivityIndicator", Text: "Text" },
    "react-native-safe-area-context": { SafeAreaView: "SafeAreaView" },
    "../providers/AuthProvider": {
      AuthProvider: "AuthProvider",
      useAuth: () => ({ session, loading: false }),
    },
    "../providers/LearningProvider": { LearningProvider: "LearningProvider" },
    "../lib/supabase": { supabase: {} },
    "../components/ui": { Screen: "Screen", styles: {}, colors: {} },
  });
  const learning = RootLayout().props.children.find(child => child.type === "LearningProvider");
  assert(learning, "local learning must use its account-scoped provider");
  const routes = learning.props.children.type;
  const original = routes();
  assert.equal(original.type, Stack);
  assert.equal(original.key, "account-a");
  session = { user: { id: "account-a" }, access_token: "refreshed-token" };
  assert.equal(routes().key, original.key);
  session = { user: { id: "account-b" }, access_token: "other-account-token" };
  assert.equal(routes().key, "account-b");
  assert.notEqual(routes().key, original.key);
  session = null;
  assert.equal(routes().key, "signed-out");
});

function clientAllowed(value, platform, url = "https://example.supabase.co") {
  const variables = [
    "EXPO_PUBLIC_SUPABASE_URL",
    "EXPO_PUBLIC_SUPABASE_ANON_KEY",
  ];
  const previous = variables.map((name) => process.env[name]);
  process.env[variables[0]] = url;
  process.env[variables[1]] = value;
  let created = false;
  try {
    const { supabase } = load("lib/supabase.ts", {
      "react-native-url-polyfill/auto": {},
      "@react-native-async-storage/async-storage": {},
      "@supabase/supabase-js": {
        createClient() {
          created = true;
          return {};
        },
      },
      "react-native": { Platform: { OS: platform } },
    });
    assert.equal(Boolean(supabase), created);
    return created;
  } finally {
    variables.forEach((name, index) => {
      if (previous[index] === undefined) delete process.env[name];
      else process.env[name] = previous[index];
    });
  }
}

const jwt = (role) =>
  [
    "e30",
    Buffer.from(JSON.stringify({ role })).toString("base64url"),
    "test-signature",
  ].join(".");

for (const platform of ["web", "ios"]) {
  test(`public client rejects privileged/user tokens and accepts public keys on ${platform}`, () => {
    for (const value of [
      "sb_secret_test-only-placeholder",
      "SB_SECRET_test-only-placeholder",
      jwt("service_role"),
      jwt("authenticated"),
    ])
      assert.equal(clientAllowed(value, platform), false);
    assert.equal(clientAllowed(jwt("anon"), platform), true);
    assert.equal(
      clientAllowed("sb_publishable_test-only-placeholder", platform),
      true,
    );
  });

  test(`missing or invalid public configuration remains safe on ${platform}`, () => {
    assert.equal(clientAllowed("", platform), false);
    assert.equal(
      clientAllowed("sb_publishable_test-only-placeholder", platform, ""),
      false,
    );
    assert.equal(
      clientAllowed(
        "sb_publishable_test-only-placeholder",
        platform,
        "invalid-url",
      ),
      false,
    );
    assert.equal(
      clientAllowed(
        "sb_publishable_test-only-placeholder",
        platform,
        "file:///private",
      ),
      false,
    );
  });
}
