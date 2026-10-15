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
const focusCases = [
  [
    "Overall feedback",
    "The reserved light holds this quiet scene together.",
    "Compare one reserved light in a 15-minute study.",
  ],
  [
    "Composition",
    "The cliff diagonal carries the eye toward the lighthouse.",
    "Compare two cliff diagonals in small thumbnails.",
  ],
  [
    "Colour & contrast",
    "Warm roof light separates from a cool middle-value group.",
    "Test warm light against two cool middle values.",
  ],
  [
    "Watercolor technique",
    "Diffused distant transitions contrast with the crisp roof edge.",
    "Practise one soft-to-sharp transition on a separate sheet.",
  ],
];
function fixture(options = {}) {
  const calls = [];
  const boundaryErrors = [];
  let stored = options.existingProvider
    ? {
        artwork_id: id,
        provider: options.existingProvider,
        mode: options.mode ?? input.mode,
      }
    : null;
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
  if (options.overlays) modelResult.overlays = options.overlays;
  if (options.palette) modelResult.palette = options.palette;
  if (options.compositionDecision)
    modelResult.compositionDecision = options.compositionDecision;
  if (options.paletteStrategy)
    modelResult.paletteStrategy = options.paletteStrategy;
  if (options.feedback) Object.assign(modelResult, options.feedback);
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
      assert.equal(
        url.pathname,
        "/v1/chat/completions",
        "Only the existing text/vision analysis endpoint is used",
      );
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
      const prompt = body.messages[0].content;
      assert(prompt.includes("visible locations"));
      assert(prompt.includes("never claim to have generated"));
      assert(prompt.includes("Aim for two concise useful visual marks"));
      assert(prompt.includes("at most three distinct high-value notes"));
      assert(
        prompt.includes("one practical sentence under 25 words for action"),
      );
      assert.equal(body.max_completion_tokens, 3000);
      assert(
        prompt.includes("Omit any mark whose location or purpose is uncertain"),
      );
      assert(prompt.includes("never invent precise geometry"));
      assert(prompt.includes("without another analysis or a new image"));
      assert(
        prompt.includes("category focal_point/composition/value_structure"),
      );
      if (options.mode === "create_reference") {
        assert(prompt.includes("keep, simplify, remove, or merge"));
        assert(prompt.includes("4–7 colors maximum"));
        assert(prompt.includes("5–7 short, ordered actions"));
        assert(prompt.includes("stage-named string"));
        assert(prompt.includes("stage name followed by a colon and space"));
        assert(prompt.includes("First wash: Use a tea-strength sky wash"));
        assert(!prompt.includes("First wash —"));
        assert(prompt.includes("20–35 words per step"));
        assert(prompt.includes("moisture/timing cue"));
        assert(prompt.includes("what to look for before moving on"));
        assert(prompt.includes("common mistake to avoid"));
        assert(
          prompt.includes(
            "Never identify original pigments or invent manufacturer/purchase claims",
          ),
        );
        assert(prompt.includes("leave its code null"));
      } else {
        assert(prompt.includes("ONE main priority"));
        assert(prompt.includes("lost/found edges, and negative shapes"));
        assert(prompt.includes("without generic compliments"));
      }
      if (options.modelError)
        return json({ error: { message: "private upstream error" } }, 429);
      if (options.badEnvelope) return json(null);
      return json({
        choices: [
          {
            finish_reason: options.finishReason ?? "stop",
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
      assert.equal(url.searchParams.get("artwork_id"), `eq.${id}`);
      return json(stored);
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
        throw new Error(
          "A production Edge request must never save a mock result",
        );
      }
      assert.equal(headers.get("apikey"), fakeServer);
      assert.equal(headers.get("authorization"), `Bearer ${fakeServer}`);
      assert.equal(body.p_user_id, uid);
      assert.equal(body.p_request_id, id);
      if (url.pathname.endsWith("/claim_feedback_request"))
        return json(
          options.claimStatus === "existing"
            ? {
                status: "existing",
                id,
                provider: options.claimProvider ?? "openai",
              }
            : { status: options.claimStatus ?? "claimed" },
        );
      if (url.pathname.endsWith("/complete_openai_feedback")) {
        assert.deepEqual(
          body.p_result,
          load(
            path.join(root, "supabase/functions/_shared/contract.ts"),
          ).cleanFeedback(modelResult, options.mode ?? input.mode),
        );
        if (options.saveError)
          return json({ message: "private database failure" }, 500);
        stored ??= { artwork_id: id, provider: "openai", mode: body.p_mode };
        if (options.lostCommitResponse)
          return json({ message: "Connection lost after commit" }, 503);
        return json({
          id: options.completionId ?? id,
          provider: options.badProvider
            ? ["openai"]
            : (options.completionProvider ?? "openai"),
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
              SUPABASE_SERVICE_ROLE_KEY: options.noAdmin
                ? undefined
                : fakeServer,
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
for (const [focus, mainAdvice, practice] of focusCases) {
  test(`actual Edge SDK: ${focus} saves its independent interpretation in one paid call`, async () => {
    const f = fixture({
      feedback: {
        mainAdvice,
        practice,
        whatWorks: ["The roof light separates from its darker surroundings."],
        whatToFix: [],
        coachingDecision: {
          primaryGoal: "Preserve the existing light-dark hierarchy.",
          primarySubjectOrArea: "roof",
          areasToEmphasize: ["roof"],
          areasToQuiet: ["background"],
          currentPaintingAction: null,
          nextStudyAction: null,
          supportingObservations: [
            "The roof light separates from its surroundings.",
          ],
          compositionImplication: null,
          colourImplication: null,
          techniqueImplication: null,
        },
      },
    });
    const response = await f.run({ ...input, focus_area: focus });
    assert.equal(response.status, 200);
    assert.equal((await response.json()).provider, "openai");
    const saved = f.calls.find((call) =>
      call.path.endsWith("/complete_openai_feedback"),
    ).body.p_result;
    assert.equal(saved.mainAdvice, mainAdvice);
    assert.equal(saved.practice, practice);
    const model = f.calls.filter(
      (call) => call.path === "/v1/chat/completions",
    );
    assert.equal(model.length, 1);
    assert.equal(model[0].body.max_completion_tokens, 3000);
    assert(
      model[0].body.messages[0].content.includes(`Selected focus: ${focus}.`),
    );
    assert(!f.calls.some((call) => call.path.includes("save_mock")));
  });
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
  ["missing server credential", { noAdmin: true }],
  ["invalid JSON", { invalidJSON: true }],
  ["invalid response envelope", { badEnvelope: true }],
  ["model failure", { modelError: true }],
  ["refusal", { refusal: true }],
  ["truncated model output", { finishReason: "length" }],
  ["unreadable image", { imageMissing: true }],
])
  test(`actual Edge SDK runtime: ${name} returns live failure without any mock save`, async () => {
    const f = fixture(options);
    const r = await f.run();
    assert.equal(r.status, 503);
    const value = await r.json();
    assert.deepEqual(value, {
      code: "unavailable",
      message: "Live AI feedback could not be prepared. Please try again.",
    });
    assert(!JSON.stringify(value).includes("private"));
    assert(!f.calls.some((c) => c.path.endsWith("/save_mock_feedback")));
    assert(!f.calls.some((c) => c.path.endsWith("/complete_openai_feedback")));
    if (options.noKey || options.noAdmin || options.imageMissing)
      assert(!f.calls.some((c) => c.path.startsWith("/v1/")));
    if (!options.noKey && !options.noAdmin)
      assert(f.calls.some((c) => c.path.endsWith("/release_feedback_request")));
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
for (const provider of ["openai", "mock"])
  test(`actual Edge SDK runtime: an existing ${provider} result returns before quota/model/save even at the limit`, async () => {
    const f = fixture({
      existingProvider: provider,
      quota: true,
      noKey: true,
      noAdmin: true,
    });
    const response = await f.run();
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { id, provider });
    assert.deepEqual(
      f.calls.map((call) => call.path),
      ["/auth/v1/user", "/rest/v1/ai_results"],
    );
  });
for (const mode of ["improve_painting", "create_reference"])
  test(`actual Edge SDK runtime: duplicate ${mode} request IDs do not repeat a paid call or completion`, async () => {
    const f = fixture({ mode });
    for (let retry = 0; retry < 3; retry++) {
      const response = await f.run();
      assert.equal(response.status, 200);
      assert.deepEqual(await response.json(), { id, provider: "openai" });
    }
    assert.equal(
      f.calls.filter((call) => call.path === "/v1/chat/completions").length,
      1,
    );
    assert.equal(
      f.calls.filter((call) => call.path.endsWith("/complete_openai_feedback"))
        .length,
      1,
    );
    assert.equal(
      f.calls.filter((call) => call.path.endsWith("/claim_feedback_request"))
        .length,
      1,
    );
    assert.equal(
      f.calls.filter((call) => call.path === "/rest/v1/usage_counters").length,
      1,
    );
    assert.equal(
      f.calls.filter((call) => call.path.endsWith("/save_mock_feedback"))
        .length,
      0,
    );
  });
test("actual Edge SDK runtime: a committed result with a lost completion response is recovered without another paid call", async () => {
  const f = fixture({ lostCommitResponse: true });
  assert.equal((await f.run()).status, 503);
  const retry = await f.run();
  assert.equal(retry.status, 200);
  assert.deepEqual(await retry.json(), { id, provider: "openai" });
  assert.equal(
    f.calls.filter((call) => call.path === "/v1/chat/completions").length,
    1,
  );
  assert.equal(
    f.calls.filter((call) => call.path.endsWith("/complete_openai_feedback"))
      .length,
    1,
  );
});
test("actual Edge SDK runtime: a model failure saves nothing and makes one call per manual attempt", async () => {
  const f = fixture({ modelError: true });
  assert.equal((await f.run()).status, 503);
  assert.equal((await f.run()).status, 503);
  assert.equal(
    f.calls.filter((call) => call.path === "/v1/chat/completions").length,
    2,
  );
  assert.equal(
    f.calls.filter((call) => call.path.endsWith("/save_mock_feedback")).length,
    0,
  );
  assert.equal(
    f.calls.filter((call) => call.path.endsWith("/complete_openai_feedback"))
      .length,
    0,
  );
});
for (const status of ["busy", "limit", "existing"])
  test(`actual Edge SDK runtime: atomic claim ${status} stops download/model/completion`, async () => {
    const f = fixture({ claimStatus: status });
    const response = await f.run();
    assert.equal(
      response.status,
      status === "busy" ? 409 : status === "limit" ? 403 : 200,
    );
    assert.deepEqual(
      await response.json(),
      status === "existing"
        ? { id, provider: "openai" }
        : status === "limit"
          ? {
              code: "usage_limit",
              message:
                "You have used your 3 free AI feedback results. More feedback will be available after subscriptions are added.",
            }
          : {
              code: "busy",
              message:
                "Feedback is already being prepared. Check My Artworks in a moment.",
            },
    );
    assert(
      !f.calls.some((call) =>
        /storage|chat\/completions|complete_openai_feedback|save_mock_feedback|release_feedback_request/.test(
          call.path,
        ),
      ),
    );
  });
test("actual Edge SDK runtime: malformed saved provider is not accepted as success", async () => {
  const f = fixture({ badProvider: true });
  const r = await f.run();
  assert.equal(r.status, 503);
  assert.equal((await r.json()).code, "unavailable");
});
for (const options of [
  { completionProvider: "mock" },
  { completionId: "30000000-0000-4000-8000-000000000001" },
  { saveError: true },
])
  test(`actual Edge SDK runtime: uncertain/invalid live completion ${JSON.stringify(options)} returns failure and releases claim`, async () => {
    const f = fixture(options);
    const response = await f.run();
    assert.equal(response.status, 503);
    assert.equal((await response.json()).code, "unavailable");
    assert(
      f.calls.some((call) => call.path.endsWith("/release_feedback_request")),
    );
    assert(!f.calls.some((call) => call.path.endsWith("/save_mock_feedback")));
    assert.equal(
      f.calls.filter((call) => call.path === "/v1/chat/completions").length,
      1,
    );
  });
for (const mode of ["improve_painting", "create_reference"])
  test(`actual Edge SDK runtime: ${mode} malformed promising and optional palette tags retain a real result`, async () => {
    const f = fixture({
      mode,
      feedback: {
        promising: true,
        paletteStrategy: { invalid: true },
        palette: [
          {
            name: "Ultramarine",
            hex: "#57788b",
            tag: "buy_now",
            temperature: "hot",
            mix: true,
            pigmentCode: "PB999",
            use: "Cool sky wash.",
          },
        ],
      },
    });
    const response = await f.run();
    assert.equal(response.status, 200);
    assert.equal((await response.json()).provider, "openai");
    const saved = f.calls.find((call) =>
      call.path.endsWith("/complete_openai_feedback"),
    ).body.p_result;
    assert(!Object.hasOwn(saved, "promising"));
    assert(!Object.hasOwn(saved, "paletteStrategy"));
    assert.deepEqual(saved.palette, [
      { name: "Ultramarine", hex: "#57788b", use: "Cool sky wash." },
    ]);
    assert(!f.calls.some((call) => call.path.endsWith("/save_mock_feedback")));
    assert.equal(
      f.calls.filter((call) => call.path === "/v1/chat/completions").length,
      1,
    );
  });
for (const mode of ["improve_painting", "create_reference"])
  test(`actual Edge SDK runtime: ${mode} type-correct overlong optional guidance keeps real feedback`, async () => {
    const f = fixture({
      mode,
      feedback: {
        promising: "x".repeat(351),
        paletteStrategy: "x".repeat(351),
        brushPlan: [
          {
            stage: "Next study — first wash",
            brush: "x".repeat(121),
            wash: "Tea-strength sky wash",
            technique: "wet_on_wet",
            timing: "Begin while the new study sheet has an even sheen.",
            edges: "Keep distant edges soft and reserve the focal light.",
            stop: "Stop before the wash loses its light paper glow.",
          },
        ],
      },
    });
    const response = await f.run();
    assert.equal(response.status, 200);
    assert.equal((await response.json()).provider, "openai");
    const completed = f.calls.filter((call) =>
      call.path.endsWith("/complete_openai_feedback"),
    );
    assert.equal(completed.length, 1);
    for (const field of ["brushPlan", "promising", "paletteStrategy"])
      assert(!Object.hasOwn(completed[0].body.p_result, field));
    const analysis = f.calls.filter(
      (call) => call.path === "/v1/chat/completions",
    );
    assert.equal(analysis.length, 1);
    const schema = analysis[0].body.response_format.json_schema.schema;
    assert.equal(
      schema.properties.brushPlan.items.properties.brush.type,
      "string",
    );
    assert.equal(
      schema.properties.brushPlan.items.properties.brush.maxLength,
      undefined,
    );
    assert.equal(schema.properties.promising.maxLength, undefined);
    assert.equal(schema.properties.paletteStrategy.maxLength, undefined);
    assert(!f.calls.some((call) => call.path.endsWith("/save_mock_feedback")));
  });
for (const [name, options] of [
  [
    "invalid required painting observations",
    { feedback: { whatWorks: [null] } },
  ],
  [
    "missing required reference palette",
    { mode: "create_reference", feedback: { palette: null } },
  ],
  [
    "unsafe required palette colour",
    {
      mode: "create_reference",
      palette: [{ name: "Sky", hex: "url(unsafe)" }],
    },
  ],
  [
    "missing required reference sequence",
    { mode: "create_reference", feedback: { steps: [] } },
  ],
])
  test(`actual Edge SDK runtime: ${name} fails with no result row or sample and frees the reservation`, async () => {
    const f = fixture(options);
    const response = await f.run();
    assert.equal(response.status, 422);
    assert.equal((await response.json()).code, "unavailable");
    assert(
      !f.calls.some((call) =>
        /complete_openai_feedback|save_mock_feedback/.test(call.path),
      ),
    );
    assert(
      f.calls.some((call) => call.path.endsWith("/release_feedback_request")),
    );
    assert.equal(
      f.calls.filter((call) => call.path === "/v1/chat/completions").length,
      1,
    );
  });

for (const mode of ["improve_painting", "create_reference"])
  test(`actual Edge SDK runtime: ${mode} saves valid overlays in the same model call`, async () => {
    const overlays = Array.from({ length: 3 }, (_, i) => ({
      type: "simplify",
      label: "Simplify this area",
      x: 20 + i * 20,
      y: 30 + i * 15,
      width: null,
      height: null,
      priority: "medium",
      shortInstruction: "Merge secondary detail into one shape.",
      reason: "This keeps the focal point clear.",
      action: "Connect the shapes with a soft middle-value wash.",
    }));
    const f = fixture({ mode, overlays });
    const r = await f.run();
    assert.equal(r.status, 200);
    assert.equal((await r.json()).provider, "openai");
    assert.equal(
      f.calls.filter((c) => c.path === "/v1/chat/completions").length,
      1,
    );
    assert.deepEqual(
      f.calls.find((c) => c.path.endsWith("/complete_openai_feedback")).body
        .p_result.overlays,
      overlays,
    );
  });

for (const mode of ["improve_painting", "create_reference"])
  test(`actual Edge SDK runtime: ${mode} preserves useful rich marks when one geometry is invalid`, async () => {
    const point = {
      type: "point_marker",
      id: "detail",
      category: "reserve_light",
      label: "Preserve this light",
      x: 38,
      y: 40,
      width: null,
      height: null,
      points: null,
      styleHint: "preserve_light",
      valueGroup: "light",
      priority: "high",
      shortInstruction: "Leave this shape as clean paper.",
      reason: "It separates the focal form from its supporting shadow.",
      action:
        "Paint the connected middle-value wash around it with one brush pass.",
    };
    const ring = {
      ...point,
      id: "focus",
      type: "focal_ring",
      category: "focal_point",
      x: 20,
      y: 25,
      width: 30,
      height: 25,
    };
    const line = {
      ...point,
      id: "flow",
      type: "guide_line",
      category: "composition",
      valueGroup: null,
      points: [
        { x: 8, y: 70 },
        { x: 42, y: 56 },
        { x: 70, y: 51 },
      ],
    };
    const invalid = {
      ...line,
      id: "invalid",
      points: [
        { x: 30, y: 30 },
        { x: 30, y: 30 },
      ],
    };
    const f = fixture({ mode, overlays: [point, invalid, ring, line] });
    const response = await f.run();
    assert.equal(response.status, 200);
    assert.equal((await response.json()).provider, "openai");
    assert.equal(f.calls.filter((c) => c.path.startsWith("/v1/")).length, 1);
    const {
      width: _width,
      height: _height,
      points: _points,
      ...fallbackText
    } = invalid;
    assert.deepEqual(
      f.calls.find((c) => c.path.endsWith("/complete_openai_feedback")).body
        .p_result.overlays,
      [point, { ...fallbackText, type: "point_marker" }, ring, line],
    );
  });
test("actual Edge SDK runtime: reference palette metadata is stored without new calls", async () => {
  const palette = [
    {
      name: "Ultramarine",
      hex: "#57788b",
      use: "Cool distant sky; dilute for atmosphere",
      pigmentCode: "PB29",
    },
    {
      name: "Burnt Sienna",
      hex: "#a87960",
      use: "Warm walls and tested neutral shadow mixes",
      pigmentCode: "PBr7",
    },
    {
      name: "Yellow Ochre",
      hex: "#bd9b63",
      use: "Warm light planes",
      pigmentCode: "PY42",
    },
  ];
  const f = fixture({ mode: "create_reference", palette });
  const response = await f.run();
  assert.equal(response.status, 200);
  assert.equal((await response.json()).provider, "openai");
  assert.deepEqual(
    f.calls.find((c) => c.path.endsWith("/complete_openai_feedback")).body
      .p_result.palette,
    palette,
  );
  assert.equal(
    f.calls.filter((c) => c.path === "/v1/chat/completions").length,
    1,
  );
});
test("actual Edge SDK runtime: invented optional pigment code is stripped and real feedback is saved", async () => {
  const f = fixture({
    mode: "create_reference",
    palette: [
      { name: "Ultramarine", hex: "#57788b", use: "Sky", pigmentCode: "PB999" },
    ],
  });
  const response = await f.run();
  assert.equal(response.status, 200);
  assert.equal((await response.json()).provider, "openai");
  assert.deepEqual(
    f.calls.find((c) => c.path.endsWith("/complete_openai_feedback")).body
      .p_result.palette,
    [{ name: "Ultramarine", hex: "#57788b", use: "Sky" }],
  );
  assert(!f.calls.some((c) => c.path.endsWith("/save_mock_feedback")));
});

for (const mode of ["improve_painting", "create_reference"])
  test(`actual Edge SDK runtime: ${mode} saves instructor timing/composition/palette in one analysis`, async () => {
    const compositionDecision = {
      mainIssue: "The lower dark pulls attention away from the focal figures.",
      reason: "Its hard edges compete with the intended focal area.",
      tryNow: "Stop adding foreground marks; keep one crisp focal accent.",
      nextStudy: "Test a tighter lower crop before repainting.",
    };
    const palette = [
      {
        name: "Ultramarine",
        hex: "#57788b",
        use: "Sky and atmospheric distance",
        pigmentCode: "PB29",
        temperature: "cool",
        mix: "Test a soft grey with Burnt Sienna",
        tag: "main_wash",
      },
      {
        name: "Burnt Sienna",
        hex: "#a87960",
        use: "Warm planes and neutral shadows",
        pigmentCode: "PBr7",
        temperature: "warm",
        mix: null,
        tag: "accent",
      },
    ];
    const overlays = [
      {
        type: "eye_flow_arrow",
        id: "eye-path",
        category: "composition",
        timing: "next_study",
        label: "Lead the eye toward the figures",
        x: 15,
        y: 70,
        width: null,
        height: null,
        points: [
          { x: 15, y: 70 },
          { x: 50, y: 50 },
        ],
        styleHint: "eye_flow",
        valueGroup: null,
        priority: "high",
        shortInstruction:
          "Keep a quieter foreground path toward the focal group.",
        reason: "The viewer can follow the shoreline into the painting.",
        action: "Test this path in a thumbnail before adding more detail.",
      },
    ];
    const f = fixture({
      mode,
      palette,
      overlays,
      compositionDecision,
      paletteStrategy:
        "Keep distance cool and reserve small accents for the focal group.",
    });
    const response = await f.run();
    assert.equal(response.status, 200);
    assert.equal((await response.json()).provider, "openai");
    const saved = f.calls.find((c) =>
      c.path.endsWith("/complete_openai_feedback"),
    ).body.p_result;
    assert.deepEqual(saved.compositionDecision, compositionDecision);
    assert.deepEqual(saved.palette, palette);
    assert.deepEqual(saved.overlays, overlays);
    assert.equal(
      f.calls.filter((c) => c.path === "/v1/chat/completions").length,
      1,
    );
    const prompt = f.calls.find((c) => c.path === "/v1/chat/completions").body
      .messages[0].content;
    assert(
      prompt.includes(
        "Structural moves/crop/horizon/proportions belong to future studies",
      ),
    );
    assert(prompt.includes("current_painting, next_study, or both"));
    assert(prompt.includes("eye_flow_arrow"));
    assert(prompt.includes("paletteStrategy"));
    if (mode === "improve_painting")
      assert(prompt.includes("If the selected focus is Composition"));
  });

for (const mode of ["improve_painting", "create_reference"])
  test(`actual Edge SDK runtime: ${mode} saves supportive observations and brush plan in the existing call`, async () => {
    const feedback = {
      promising: "The clear foreground light can carry a calmer focal group.",
      whatWorks: [
        "The warm subject stands clearly against the cool distance.",
        "The reflection creates a natural path toward the focal group.",
      ],
      whatToFix: [
        "Quiet the scattered foreground marks.",
        "Reserve one stronger accent near the focal subject.",
      ],
      brushPlan: [
        {
          stage:
            mode === "improve_painting"
              ? "Next study — connected shadows"
              : "First connected shadow wash",
          brush: "Medium round for broad connected shadows",
          wash: "Milk-strength tested blue-earth neutral",
          technique: "damp_on_damp",
          timing: "Wait until the shine has nearly left the new study sheet.",
          edges: "Keep secondary edges soft and the focal accent selective.",
          stop: "Stop once the connected middle value reads as one shape.",
        },
      ],
      palette: [
        {
          name: "Ultramarine",
          hex: "#57788b",
          use: "Cool atmospheric distance",
          pigmentCode: "PB29",
          tag: "atmospheric_distance",
        },
      ],
      paletteStrategy:
        "Keep distance cool; test blue-earth shadows and reserve dark focal accents.",
    };
    const f = fixture({ mode, feedback });
    const response = await f.run();
    assert.equal(response.status, 200);
    assert.equal((await response.json()).provider, "openai");
    const saved = f.calls.find((call) =>
      call.path.endsWith("/complete_openai_feedback"),
    ).body.p_result;
    for (const [key, value] of Object.entries(feedback))
      assert.deepEqual(saved[key], value);
    assert.equal(
      f.calls.filter((call) => call.path === "/v1/chat/completions").length,
      1,
    );
    const prompt = f.calls.find((call) => call.path === "/v1/chat/completions")
      .body.messages[0].content;
    assert(prompt.includes("Identify 2–3 genuine strengths before fixes"));
    assert(prompt.includes("promising is one evidence-based sentence"));
    assert(prompt.includes("up to three short recommended practice stages"));
    assert(
      prompt.includes("Avoid casual lifting/scrubbing/repeated rewetting"),
    );
    assert(prompt.includes("prefer 3–4 useful colors"));
    assert(prompt.includes("dominant temperature"));
    if (mode === "create_reference")
      assert(
        prompt.includes(
          "If the image is a photograph, do not praise washes or painted handling",
        ),
      );
  });
for (const mode of ["improve_painting", "create_reference"])
  test(`actual Edge SDK runtime: ${mode} malformed optional brush data is dropped before real completion`, async () => {
    const f = fixture({
      mode,
      feedback: {
        promising: "The focal light has useful painting potential.",
        brushPlan: [{ stage: "Unsupported" }],
      },
    });
    const response = await f.run();
    assert.equal(response.status, 200);
    assert.equal((await response.json()).provider, "openai");
    const saved = f.calls.find((call) =>
      call.path.endsWith("/complete_openai_feedback"),
    ).body.p_result;
    assert(!Object.hasOwn(saved, "brushPlan"));
    assert.equal(
      saved.promising,
      "The focal light has useful painting potential.",
    );
    assert(!f.calls.some((call) => call.path.endsWith("/save_mock_feedback")));
    assert.equal(
      f.calls.filter((call) => call.path === "/v1/chat/completions").length,
      1,
    );
  });

for (const mode of ["improve_painting", "create_reference"]) {
  test(`actual Edge SDK runtime: ${mode} preserves study framing and zero optional refinements in one call`, async () => {
    const feedback = {
      coachingMode: "study",
      whatToFix: [],
      compositionDecision: {
        mainIssue: null,
        reason: "The quiet distance supports one clear focal accent.",
        tryNow: null,
        nextStudy:
          "One possible variation is a separate thumbnail with a lower horizon.",
      },
    };
    const f = fixture({ mode, feedback });
    const response = await f.run();
    assert.equal(response.status, 200);
    assert.equal((await response.json()).provider, "openai");
    const completion = f.calls.find((call) =>
      call.path.endsWith("/complete_openai_feedback"),
    );
    assert.deepEqual(completion.body.p_result.whatToFix, []);
    assert.equal(completion.body.p_result.coachingMode, "study");
    assert.deepEqual(
      completion.body.p_result.compositionDecision,
      feedback.compositionDecision,
    );
    assert.equal(
      f.calls.filter((call) => call.path === "/v1/chat/completions").length,
      1,
    );
    const request = f.calls.find(
      (call) => call.path === "/v1/chat/completions",
    ).body;
    assert.equal(request.max_completion_tokens, 3000);
    assert(request.messages[0].content.includes("do not force criticism"));
  });
}
for (const mode of ["improve_painting", "create_reference"]) {
  test(`actual Edge SDK runtime: ${mode} discards malformed optional coaching flag and saves core feedback`, async () => {
    const f = fixture({ mode, feedback: { coachingMode: ["study"] } });
    const response = await f.run();
    assert.equal(response.status, 200);
    assert.equal((await response.json()).provider, "openai");
    const result = f.calls.find((call) =>
      call.path.endsWith("/complete_openai_feedback"),
    ).body.p_result;
    assert(!Object.hasOwn(result, "coachingMode"));
    assert.equal(
      f.calls.filter((call) => call.path === "/v1/chat/completions").length,
      1,
    );
  });
}

for (const focus of [
  "Overall feedback",
  "Composition",
  "Colour & contrast",
  "Watercolor technique",
]) {
  test(`actual Edge SDK runtime: ${focus} reaches its distinct system prompt through validated input`, async () => {
    const f = fixture();
    const response = await f.run({ ...input, focus_area: focus });
    assert.equal(response.status, 200);
    const calls = f.calls.filter(
      (call) => call.path === "/v1/chat/completions",
    );
    assert.equal(calls.length, 1);
    assert(
      calls[0].body.messages[0].content.includes(`Selected focus: ${focus}.`),
    );
    assert.equal(calls[0].body.max_completion_tokens, 3000);
    assert.equal(
      f.calls.filter((call) => call.path.endsWith("/complete_openai_feedback"))
        .length,
      1,
    );
  });
}
for (const mode of ["improve_painting", "create_reference"]) {
  test(`actual Edge SDK runtime: ${mode} saves a coherent optional decision and rejects no valid core data`, async () => {
    const coachingDecision = {
      primaryGoal: "Keep the pavilion crisp and quiet the pier.",
      primarySubjectOrArea: "pavilion",
      areasToEmphasize: ["pavilion"],
      areasToQuiet: ["pier"],
      currentPaintingAction: "Move the pavilion lower.",
      nextStudyAction: null,
      supportingObservations: [
        "The light pavilion separates clearly from the distance.",
      ],
      compositionImplication: "The quiet pier supports the focal path.",
      colourImplication: "Reserve warm contrast for the pavilion.",
      techniqueImplication:
        "Practise crisp pavilion accents against a soft pier.",
    };
    for (const value of [coachingDecision, { malformed: true }]) {
      const f = fixture({
        mode,
        feedback: {
          coachingDecision: value,
          whatToFix: ["Sharpen the pier.", "Keep the pier soft."],
          practice: "Sharpen the pier.",
        },
      });
      const response = await f.run();
      assert.equal(response.status, 200);
      assert.equal((await response.json()).provider, "openai");
      const result = f.calls.find((call) =>
        call.path.endsWith("/complete_openai_feedback"),
      ).body.p_result;
      if (value === coachingDecision) {
        assert.equal(result.coachingDecision.currentPaintingAction, null);
        assert.equal(
          result.coachingDecision.nextStudyAction,
          "Move the pavilion lower.",
        );
        assert.deepEqual(result.whatToFix, ["Keep the pier soft."]);
        if (mode === "improve_painting")
          assert.notEqual(result.mainAdvice, coachingDecision.primaryGoal);
        if (mode === "improve_painting")
          assert(result.mainAdvice.includes("lake house"));
        else assert(!Object.hasOwn(result, "practice"));
      } else assert(!Object.hasOwn(result, "coachingDecision"));
      assert.equal(
        f.calls.filter((call) => call.path === "/v1/chat/completions").length,
        1,
      );
      assert.equal(
        f.calls.filter((call) =>
          call.path.endsWith("/complete_openai_feedback"),
        ).length,
        1,
      );
      assert(
        !f.calls.some((call) => call.path.endsWith("/save_mock_feedback")),
      );
    }
  });
}

for (const mode of ["improve_painting", "create_reference"]) {
  test(`actual Edge SDK runtime: ${mode} preserves optional region/evidence and composition metadata in the same single paid result`, async () => {
    const primary = {
      type: "diagonal",
      confidence: 0.85,
      shortExplanation:
        "The pier leads from the lower left toward the focal house.",
      paths: [
        [
          { x: 0.1, y: 0.8 },
          { x: 0.65, y: 0.35 },
        ],
      ],
      focalPoint: { x: 0.65, y: 0.35 },
      secondaryPoints: null,
      masses: null,
    };
    const localNote = {
      type: "point_marker",
      id: "roof",
      label: "Focal roof",
      x: 65,
      y: 35,
      priority: "high",
      shortInstruction: "Notice the roof against the quiet trees.",
      reason: "This separation concentrates attention.",
      action: "Preserve the light shape in a separate study.",
      classification: "strength",
      domain: "composition",
      relatedDomain: null,
      visualRole: "focal",
      scope: "local",
      region: { x: 0.55, y: 0.25, width: 0.2, height: 0.2 },
      regionConfidence: 0.9,
      regions: null,
      anchors: null,
      evidence:
        "The roof has the sharpest light-dark boundary against the softer trees.",
    };
    const f = fixture({
      mode,
      feedback: {
        compositionOverlay: primary,
        secondaryCompositionOverlay: {
          ...primary,
          type: "off_centre",
          paths: null,
        },
        overlays: [localNote],
      },
    });
    const response = await f.run();
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { id, provider: "openai" });
    const saved = f.calls.find((call) =>
      call.path.endsWith("/complete_openai_feedback"),
    ).body.p_result;
    assert.equal(saved.overlays[0].classification, "strength");
    assert.equal(saved.overlays[0].scope, "local");
    assert.equal(saved.compositionOverlay.type, "diagonal");
    assert.equal(saved.secondaryCompositionOverlay.type, "off_centre");
    assert.equal(
      f.calls.filter((call) => call.path === "/v1/chat/completions").length,
      1,
    );
    assert.equal(
      f.calls.filter((call) => call.path.endsWith("/complete_openai_feedback"))
        .length,
      1,
    );
    assert(
      !f.calls.some(
        (call) =>
          call.path.includes("save_mock") ||
          (call.path.includes("/storage/v1/object/") && call.body),
      ),
    );
  });
  test(`actual Edge SDK runtime: ${mode} bad optional visual fields preserve live text without mock completion`, async () => {
    const f = fixture({
      mode,
      feedback: {
        compositionOverlay: { type: "invented" },
        secondaryCompositionOverlay: { confidence: 9 },
        overlays: [
          {
            type: "point_marker",
            label: "Roof",
            x: 65,
            y: 35,
            priority: "high",
            shortInstruction: "Study the reserved light.",
            reason: "It concentrates attention.",
            action: "Try a separate small study.",
            classification: "clear_issue",
            scope: "local",
            region: { x: 2, y: 0, width: 0.2, height: 0.2 },
            regionConfidence: "certain",
            evidence: "bad",
          },
        ],
      },
    });
    const response = await f.run();
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { id, provider: "openai" });
    const saved = f.calls.find((call) =>
      call.path.endsWith("/complete_openai_feedback"),
    ).body.p_result;
    assert.equal(saved.compositionOverlay, undefined);
    assert.equal(saved.secondaryCompositionOverlay, undefined);
    assert.equal(saved.overlays[0].region, null);
    assert.equal(saved.overlays[0].regionConfidence, 0);
    assert.equal(saved.overlays[0].classification, "study_experiment");
    assert.equal(
      f.calls.filter((call) => call.path === "/v1/chat/completions").length,
      1,
    );
    assert(!f.calls.some((call) => call.path.endsWith("/save_mock_feedback")));
  });
}
