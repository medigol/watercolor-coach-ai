// Execute the real Edge entrypoint with the installed Supabase SDK. Replace only
// outbound fetch and Deno's env/serve boundary; never call a paid API or live DB.
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");
const { createClient } = require("@supabase/supabase-js");
const root = path.resolve(__dirname, "..");
const uid = "10000000-0000-4000-8000-000000000001";
const id = "20000000-0000-4000-8000-000000000001";
const input = {
  request_id: id,
  expected_user_id: uid,
  mode: "improve_painting",
  focus_area: "Composition",
  image_path: `${uid}/painting.png`,
};
const fakePublic = "sb_publishable_test_only";
const fakeServer = "sb_secret_test_only";
const fakeOpenAI = "test-only-openai-placeholder";
function fixture(options = {}) {
  const calls = [];
  const boundaryErrors = [];
  let handler;
  const modules = new Map();
  const user = {
    id: uid,
    aud: "authenticated",
    role: "authenticated",
    email: "learner@example.invalid",
    is_anonymous: !!options.anonymous,
  };
  const modelResult =
    options.mode === "create_reference"
      ? load(path.join(root, "data/mockResults.ts")).referenceResult
      : load(path.join(root, "data/mockResults.ts")).improveResult;
  function json(data, status = 200) {
    return new Response(JSON.stringify(data), {
      status,
      headers: { "Content-Type": "application/json" },
    });
  }
  async function networkImpl(urlOrRequest, init = {}) {
    const url = new URL(
      typeof urlOrRequest === "string"
        ? urlOrRequest
        : (urlOrRequest.url ?? urlOrRequest.toString()),
    );
    const headers = new Headers(init.headers);
    const body = typeof init.body === "string" ? JSON.parse(init.body) : null;
    calls.push({ path: url.pathname, headers, body, signal: init.signal });
    assert(
      init.signal instanceof AbortSignal,
      "Every upstream request needs a deadline",
    );
    if (url.hostname === "api.openai.com") {
      assert.equal(headers.get("authorization"), `Bearer ${fakeOpenAI}`);
      assert.equal(body.response_format.json_schema.strict, true);
      assert.equal(
        body.messages[1].content[1].image_url.url.startsWith(
          "data:image/png;base64,",
        ),
        true,
      );
      assert.equal(body.messages[1].content[1].image_url.detail, "low");
      assert.equal(body.model, "gpt-4.1-mini");
      if (options.modelError)
        return json({ error: { message: "private upstream error" } }, 429);
      if (options.badEnvelope) return json(null);
      return json({
        choices: [
          {
            finish_reason: "stop",
            message: {
              content: options.invalidJSON
                ? "{invalid json"
                : JSON.stringify(modelResult),
              refusal: options.refusal ? "declined" : null,
            },
          },
        ],
      });
    }
    assert.equal(url.hostname, "edge-test.supabase.co");
    if (url.pathname === "/auth/v1/user") {
      assert.equal(headers.get("authorization"), "Bearer user-session");
      assert.equal(headers.get("apikey"), fakePublic);
      return options.invalidSession
        ? json({ message: "invalid token" }, 401)
        : json(user);
    }
    if (url.pathname === "/rest/v1/ai_results") {
      assert.equal(headers.get("authorization"), "Bearer user-session");
      assert.equal(headers.get("apikey"), fakePublic);
      assert.equal(url.searchParams.get("user_id"), `eq.${uid}`);
      return json(null);
    }
    if (url.pathname === "/rest/v1/usage_counters") {
      assert.equal(headers.get("authorization"), "Bearer user-session");
      return json({
        free_results_used: options.quota ? 3 : 0,
        free_results_limit: 3,
      });
    }
    if (url.pathname.startsWith("/storage/v1/object/artworks/")) {
      assert.equal(headers.get("authorization"), "Bearer user-session");
      assert.equal(headers.get("apikey"), fakePublic);
      assert.equal(
        decodeURIComponent(url.pathname).endsWith(`/${uid}/painting.png`),
        true,
      );
      if (options.imageMissing) return json({ message: "Not found" }, 404);
      return new Response(Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10]), {
        headers: { "Content-Type": "image/png" },
      });
    }
    if (url.pathname.startsWith("/rest/v1/rpc/")) {
      if (url.pathname.endsWith("/save_mock_feedback")) {
        assert.equal(headers.get("authorization"), "Bearer user-session");
        assert.equal(headers.get("apikey"), fakePublic);
        assert.equal(body.p_expected_user_id, uid);
        assert.equal(body.p_request_id, id);
        return json({ id, provider: "mock" });
      }
      assert.equal(headers.get("apikey"), fakeServer);
      assert.equal(headers.get("authorization"), `Bearer ${fakeServer}`);
      assert.equal(body.p_user_id, uid);
      assert.equal(body.p_request_id, id);
      if (url.pathname.endsWith("/claim_feedback_request"))
        return json({ status: "claimed" });
      if (url.pathname.endsWith("/complete_openai_feedback")) {
        assert.deepEqual(body.p_result, modelResult);
        return json({
          id,
          provider: options.badProvider ? ["openai"] : "openai",
        });
      }
      if (url.pathname.endsWith("/release_feedback_request"))
        return new Response(null, { status: 204 });
    }
    throw new Error(`Unexpected request ${url.pathname}`);
  }
  async function network(...args) {
    try {
      return await networkImpl(...args);
    } catch (e) {
      boundaryErrors.push(e.message);
      throw e;
    }
  }
  function load(file) {
    if (modules.has(file)) return modules.get(file);
    const exports = {};
    modules.set(file, exports);
    const output = ts.transpileModule(fs.readFileSync(file, "utf8"), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
      },
    }).outputText;
    new Function("exports", "require", "Deno", "fetch", output)(
      exports,
      (name) =>
        name === "npm:@supabase/supabase-js@2.117.3"
          ? { createClient }
          : load(path.resolve(path.dirname(file), name)),
      {
        env: {
          get: (name) =>
            ({
              SUPABASE_URL: "https://edge-test.supabase.co",
              SUPABASE_ANON_KEY: fakePublic,
              SUPABASE_SERVICE_ROLE_KEY: fakeServer,
              OPENAI_API_KEY: options.noKey ? undefined : fakeOpenAI,
            })[name],
        },
        serve: (next) => {
          handler = next;
        },
      },
      network,
    );
    return exports;
  }
  load(path.join(root, "supabase/functions/generate-feedback/index.ts"));
  return {
    calls,
    run: async (body) => {
      const response = await handler(
        new Request(
          "https://edge-test.supabase.co/functions/v1/generate-feedback",
          {
            method: "POST",
            headers: { Authorization: "Bearer user-session" },
            body: JSON.stringify(
              body ?? { ...input, mode: options.mode ?? input.mode },
            ),
          },
        ),
      );
      assert.deepEqual(boundaryErrors, []);
      return response;
    },
  };
}
for (const mode of ["improve_painting", "create_reference"])
  test(`actual Edge SDK runtime: ${mode} uses user storage and server-only model/save`, async () => {
    const f = fixture({ mode });
    const response = await f.run();
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { id, provider: "openai" });
    assert(f.calls.some((c) => c.path.endsWith("/complete_openai_feedback")));
    assert(f.calls.some((c) => c.path.endsWith("/release_feedback_request")));
  });
for (const [name, options] of [
  ["missing key", { noKey: true }],
  ["invalid JSON", { invalidJSON: true }],
  ["invalid response envelope", { badEnvelope: true }],
  ["model failure", { modelError: true }],
  ["refusal", { refusal: true }],
  ["unreadable image", { imageMissing: true }],
])
  test(`actual Edge SDK runtime: ${name} saves mock without OpenAI commit`, async () => {
    const f = fixture(options);
    const r = await f.run();
    assert.equal(r.status, 200);
    const value = await r.json();
    assert.equal(value.provider, "mock");
    assert.match(value.warning, /sample guide/);
    assert(!f.calls.some((c) => c.path.endsWith("/complete_openai_feedback")));
    if (options.noKey || options.imageMissing)
      assert(!f.calls.some((c) => c.path.startsWith("/v1/")));
  });
for (const [name, options] of [
  ["invalid session", { invalidSession: true }],
  ["anonymous Auth session", { anonymous: true }],
])
  test(`actual Edge SDK runtime: ${name} denied before storage, quotas or model`, async () => {
    const f = fixture(options);
    const r = await f.run();
    assert.equal(r.status, 401);
    assert.equal(f.calls.length, 1);
    assert.equal(f.calls[0].path, "/auth/v1/user");
  });
test("actual Edge SDK runtime: quota stops all paid/storage/save calls", async () => {
  const f = fixture({ quota: true });
  const r = await f.run();
  assert.equal(r.status, 403);
  assert.equal((await r.json()).code, "usage_limit");
  assert.equal(f.calls.length, 3);
});
test("actual Edge SDK runtime: malformed saved provider is not accepted as success", async () => {
  const f = fixture({ badProvider: true });
  const r = await f.run();
  assert.equal(r.status, 503);
  assert.equal((await r.json()).code, "unavailable");
});
