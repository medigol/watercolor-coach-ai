const { loadShared } = require("./helpers/shared-loader.cjs");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const ts = require("typescript");

const root = path.resolve(__dirname, "..");
const userId = "10000000-0000-4000-8000-000000000001";
const artworkId = "20000000-0000-4000-8000-000000000001";
const otherUserId = "10000000-0000-4000-8000-000000000002";
const image = { uri: "blob:painting" };
const liveError = "Live AI feedback could not be prepared. Please try again.";
const authMessage = "Please sign in again before requesting feedback.";
const png = Uint8Array.from(Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aWQAAAABJRU5ErkJggg==",
  "base64",
));
function source(relative) {
  return ts.transpileModule(fs.readFileSync(path.join(root, relative), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
}
const samples = {};
new Function("exports", source("data/mockResults.ts"))(samples);
function rejection(status, code, message = "private upstream details") {
  return { data: null, error: { context: new Response(JSON.stringify({ code, message }), { status }) } };
}
// Keep the real persistence code; replace only its network boundaries. Any
// production call to a mock RPC is recorded and makes the assertions fail.
function fixture(options = {}) {
  const state = { userId, uploads: [], removals: [], saves: [], fetches: 0, signs: [], edges: [] };
  const client = {
    auth: {
      getUser: async () => {
        if (options.authThrows) throw new Error("private auth transport details");
        return { data: { user: options.noUser ? null : { id: userId } }, error: options.authError ?? null };
      },
      getSession: async () => ({ data: { session: state.userId ? { user: { id: state.userId } } : null }, error: null }),
    },
    storage: { from(bucket) {
      assert.equal(bucket, "artworks");
      return {
        async upload(name, bytes, settings) {
          state.uploads.push({ name, bytes, settings });
          if (options.changeAccountAfterUpload) state.userId = otherUserId;
          return { error: options.uploadResponses
            ? options.uploadResponses[state.uploads.length - 1] : options.uploadError ?? null };
        },
        async remove(names) { state.removals.push(...names); return { error: null }; },
        async createSignedUrl(name) {
          state.signs.push(name);
          return { data: { signedUrl: "https://example.invalid/temporary-image" }, error: null };
        },
      };
    } },
    functions: { async invoke(name, settings) {
      assert.equal(name, "generate-feedback");
      state.edges.push(settings.body);
      if (options.edgeResponses) {
        const next = options.edgeResponses[state.edges.length - 1];
        return typeof next === "function" ? next(settings.body) : next;
      }
      if (options.edgeThrows) throw new Error("private network details");
      if (options.edgeCode) return rejection(options.edgeStatus ?? 503, options.edgeCode);
      if (options.changeAccountAfterEdge) state.userId = otherUserId;
      return { data: { id: settings.body.request_id, provider: options.edgeProvider ?? "openai" }, error: null };
    } },
    async rpc(name, input) {
      state.saves.push({ name, input });
      throw new Error("A configured production request must never create mock feedback");
    },
  };
  const api = {};
  new Function("require", "exports", "fetch", source("lib/artworks.ts"))(
    (name) => name === "./supabase" ? { requireSupabase: () => client } : name.startsWith("../shared/") ? loadShared(name,"lib/artworks.ts") : samples,
    api,
    async () => {
      state.fetches++;
      if (options.fetchThrows) throw new Error("private local-file details");
      return new Response(options.bytes || png, {
        status: options.fetchStatus ?? 200,
        headers: { "content-type": options.mime || "image/png", ...(options.headers || {}) },
      });
    },
  );
  return { api, state };
}
const liveSuccess = (body) => ({ data: { id: body.request_id, provider: "openai" }, error: null });

for (const mode of ["improve_painting", "create_reference"])
  test(`${mode}: successful production upload returns only live OpenAI feedback`, async () => {
    const { api, state } = fixture();
    const attempt = api.createSaveAttempt();
    const saved = await api.saveArtwork(mode, "Composition", image, attempt);
    assert.deepEqual(saved, { id: attempt.id, provider: "openai", warning: null });
    assert.equal(state.edges.length, 1);
    assert.equal(state.edges[0].expected_user_id, userId);
    assert.equal(state.edges[0].image_path, state.uploads[0].name);
    assert.equal(state.saves.length, 0);
  });
test("a production request without an image never invokes Edge or saves a sample", async () => {
  const { api, state } = fixture();
  await assert.rejects(api.saveArtwork("improve_painting", null), /Choose a painting or photo/);
  assert.equal(state.fetches, 0);
  assert.equal(state.edges.length, 0);
  assert.equal(state.saves.length, 0);
});
test("uses actual image bytes rather than trusting a mismatched MIME", async () => {
  const { api, state } = fixture();
  await api.saveArtwork("create_reference", null, { ...image, mimeType: "image/jpeg" });
  assert.equal(state.uploads[0].settings.contentType, "image/png");
  assert.match(state.uploads[0].name, new RegExp(`^${userId}/.+\\.png$`));
});
test("an SVG disguised as JPEG is rejected before Edge or any saved result", async () => {
  const { api, state } = fixture({ bytes: Buffer.from("<svg><script>unsafe</script></svg>"), mime: "image/jpeg" });
  await assert.rejects(api.saveArtwork("improve_painting", null, image), /Choose a JPEG, PNG, or WebP/);
  assert.equal(state.uploads.length, 0);
  assert.equal(state.edges.length, 0);
  assert.equal(state.saves.length, 0);
});
test("oversized picker files are rejected before reading and all size limits stop live submission", async () => {
  const size = 10 * 1024 * 1024 + 1;
  for (const [options, selected] of [
    [{}, { ...image, fileSize: size }],
    [{ headers: { "content-length": String(size) } }, image],
    [{ bytes: new Uint8Array(size) }, image],
  ]) {
    const { api, state } = fixture(options);
    await assert.rejects(api.saveArtwork("improve_painting", null, selected), /smaller than 10 MB/);
    if (selected.fileSize) assert.equal(state.fetches, 0);
    assert.equal(state.uploads.length, 0);
    assert.equal(state.edges.length, 0);
    assert.equal(state.saves.length, 0);
  }
});
for (const options of [{ uploadError: { message: "private bucket error" } }, { fetchThrows: true }, { fetchStatus: 404 }])
  test(`an upload/file failure is actionable and does not submit a null image (${Object.keys(options)[0]})`, async () => {
    const { api, state } = fixture(options);
    const attempt = api.createSaveAttempt();
    await assert.rejects(api.saveArtwork("create_reference", null, image, attempt), /could not be uploaded.*Choose it again/);
    assert.equal(attempt.imagePath, undefined);
    assert.equal(state.edges.length, 0);
    assert.equal(state.saves.length, 0);
  });
test("a failed upload can be retried with the same request ID instead of a cached null path", async () => {
  const { api, state } = fixture({ uploadResponses: [{ message: "Upload failed" }, null] });
  const attempt = api.createSaveAttempt();
  const id = attempt.id;
  await assert.rejects(api.saveArtwork("create_reference", null, image, attempt), /could not be uploaded/);
  const saved = await api.saveArtwork("create_reference", null, image, attempt);
  assert.equal(saved.id, id);
  assert.equal(state.uploads.length, 2);
  assert.equal(state.edges.length, 1);
  assert.equal(state.saves.length, 0);
});
for (const [status, code] of [[503, "unavailable"], [422, "unavailable"], [400, "invalid_request"], [404, "not_found"], [429, "rate_limit"]])
  test(`production HTTP ${status}/${code} fails clearly without mock RPC`, async () => {
    const { api, state } = fixture({ edgeCode: code, edgeStatus: status });
    await assert.rejects(api.saveArtwork("improve_painting", null, image), (error) => {
      assert(error.message.startsWith(liveError));
      assert(!/private|sample|mock/.test(error.message));
      return true;
    });
    assert.equal(state.saves.length, 0);
    assert.equal(state.removals.length, [400, 404, 422].includes(status) ? 1 : 0);
  });
test("quota and busy messages remain exact and never create mock rows", async () => {
  for (const [status, code, message] of [
    [403, "usage_limit", "You have used your 3 free AI feedback results. More feedback will be available after subscriptions are added."],
    [409, "busy", "Feedback is already being prepared. Check My Artworks in a moment."],
    [401, "auth", authMessage],
  ]) {
    const { api, state } = fixture({ edgeCode: code, edgeStatus: status });
    await assert.rejects(api.saveArtwork("improve_painting", null, image), { message });
    assert.equal(state.saves.length, 0);
    assert.equal(state.removals.length, code === "busy" ? 0 : 1);
  }
});
test("malformed success responses and thrown network errors never fall back to mock saves", async () => {
  for (const options of [
    { edgeThrows: true },
    { edgeProvider: "unexpected" },
    { edgeResponses: [{ data: null, error: null }] },
    { edgeResponses: [{ data: { id: artworkId, provider: "openai" }, error: null }] },
  ]) {
    const { api, state } = fixture(options);
    await assert.rejects(api.saveArtwork("create_reference", null, image), (error) => {
      assert(error.message.startsWith(liveError));
      assert(error.message.includes("Check My Artworks"));
      return true;
    });
    assert.equal(state.removals.length, 0);
    assert.equal(state.saves.length, 0);
  }
});
test("confirmed stale mock success is rejected; the next manual retry uses a fresh ID and the same referenced image", async () => {
  const { api, state } = fixture({ edgeResponses: [
    (body) => ({ data: { id: body.request_id, provider: "mock" }, error: null }),
    liveSuccess,
  ] });
  const attempt = api.createSaveAttempt();
  const oldId = attempt.id;
  await assert.rejects(api.saveArtwork("improve_painting", null, image, attempt), (error) => error.message.startsWith(liveError));
  assert.equal(state.edges.length, 1, "A stale response must not automatically retry");
  assert.notEqual(attempt.id, oldId);
  const saved = await api.saveArtwork("improve_painting", null, image, attempt);
  assert.equal(saved.provider, "openai");
  assert.equal(saved.id, attempt.id);
  assert.notEqual(state.edges[0].request_id, state.edges[1].request_id);
  assert.equal(state.edges[0].image_path, state.edges[1].image_path);
  assert.equal(state.uploads.length, 1);
  assert.equal(state.removals.length, 0);
  assert.equal(state.saves.length, 0);
});
test("a limit rejection after a confirmed stale mock never removes that old result's image", async () => {
  const { api, state } = fixture({ edgeResponses: [
    (body) => ({ data: { id: body.request_id, provider: "mock" }, error: null }),
    rejection(403, "usage_limit"),
  ] });
  const attempt = api.createSaveAttempt();
  await assert.rejects(api.saveArtwork("improve_painting", null, image, attempt));
  await assert.rejects(api.saveArtwork("improve_painting", null, image, attempt), { message: api.freeLimitMessage });
  assert.equal(state.removals.length, 0);
  assert.equal(state.saves.length, 0);
});
test("uncertain outcomes preserve request ID and upload so retry recovers a committed live result", async () => {
  const { api, state } = fixture({ edgeResponses: [rejection(503, "unavailable"), liveSuccess] });
  const attempt = api.createSaveAttempt();
  const originalId = attempt.id;
  await assert.rejects(api.saveArtwork("improve_painting", "Composition", image, attempt), /Check My Artworks/);
  const saved = await api.saveArtwork("improve_painting", "Composition", image, attempt);
  assert.equal(saved.id, originalId);
  assert.equal(state.edges[0].request_id, state.edges[1].request_id);
  assert.equal(state.edges[0].image_path, state.edges[1].image_path);
  assert.equal(state.uploads.length, 1);
  assert.equal(state.removals.length, 0);
  assert.equal(state.saves.length, 0);
});
test("busy responses keep the same in-flight ID/image until the next manual retry recovers live feedback", async () => {
  const { api, state } = fixture({ edgeResponses: [rejection(409, "busy"), liveSuccess] });
  const attempt = api.createSaveAttempt();
  const originalId = attempt.id;
  await assert.rejects(api.saveArtwork("improve_painting", null, image, attempt), {
    message: "Feedback is already being prepared. Check My Artworks in a moment.",
  });
  assert.equal(attempt.id, originalId);
  assert.equal(state.edges.length, 1);
  assert.equal((await api.saveArtwork("improve_painting", null, image, attempt)).id, originalId);
  assert.equal(state.edges[0].image_path, state.edges[1].image_path);
  assert.equal(state.uploads.length, 1);
  assert.equal(state.removals.length, 0);
  assert.equal(state.saves.length, 0);
});
test("retry after a definite rejection replaces the cleaned upload but preserves the request ID", async () => {
  const { api, state } = fixture({ edgeResponses: [rejection(422, "unavailable"), liveSuccess] });
  const attempt = api.createSaveAttempt();
  const originalId = attempt.id;
  await assert.rejects(api.saveArtwork("create_reference", null, image, attempt), { message: liveError });
  assert.equal(attempt.imagePath, undefined);
  assert.equal((await api.saveArtwork("create_reference", null, image, attempt)).id, originalId);
  assert.equal(state.uploads.length, 2);
  assert.equal(state.removals.length, 1);
  assert.equal(state.saves.length, 0);
});
test("a later definite rejection cannot delete an image from a prior uncertain submission", async () => {
  const { api, state } = fixture({ edgeResponses: [rejection(503, "unavailable"), rejection(404, "not_found")] });
  const attempt = api.createSaveAttempt();
  for (let retry = 0; retry < 2; retry++)
    await assert.rejects(api.saveArtwork("improve_painting", null, image, attempt), /Check My Artworks/);
  assert.equal(state.uploads.length, 1);
  assert.equal(state.removals.length, 0);
  assert.equal(attempt.mayHaveSaved, true);
  assert.equal(state.saves.length, 0);
});
test("auth errors and account switches cannot upload/submit for another user", async () => {
  for (const options of [{ noUser: true }, { authError: { message: "private auth details" } }]) {
    const { api, state } = fixture(options);
    await assert.rejects(api.saveArtwork("improve_painting", null, image), { message: authMessage });
    assert.equal(state.uploads.length, 0);
    assert.equal(state.edges.length, 0);
  }
  const { api, state } = fixture({ changeAccountAfterUpload: true });
  await assert.rejects(api.saveArtwork("improve_painting", null, image), { message: authMessage });
  assert.equal(state.edges.length, 0);
  assert.equal(state.saves.length, 0);
  const second = fixture();
  await assert.rejects(second.api.saveArtwork("improve_painting", null, image,
    { id: artworkId, ownerId: otherUserId }), { message: authMessage });
  assert.equal(second.state.uploads.length, 0);
  assert.equal(second.state.edges.length, 0);
});
test("a thrown auth transport error never exposes upstream details or creates a sample", async () => {
  const { api, state } = fixture({ authThrows: true });
  await assert.rejects(api.saveArtwork("improve_painting", null, image), { message: liveError });
  assert.equal(state.uploads.length, 0);
  assert.equal(state.edges.length, 0);
  assert.equal(state.saves.length, 0);
});
test("retryable Auth SDK network failures show the live retry message rather than incorrectly requesting a new sign-in", async () => {
  for (const authError of [
    { name: "AuthRetryableFetchError", message: "private network details" },
    { status: 0, message: "private network details" },
    { status: 503, message: "private unavailable details" },
  ]) {
    const { api, state } = fixture({ authError });
    await assert.rejects(api.saveArtwork("improve_painting", null, image), { message: liveError });
    assert.equal(state.uploads.length, 0);
    assert.equal(state.edges.length, 0);
    assert.equal(state.saves.length, 0);
  }
});
test("a successful response followed by an account switch cannot return a result to the new user", async () => {
  const { api, state } = fixture({ changeAccountAfterEdge: true });
  await assert.rejects(api.saveArtwork("improve_painting", null, image), { message: authMessage });
  assert.equal(state.removals.length, 0);
  assert.equal(state.saves.length, 0);
});
test("existing mock and OpenAI result JSON remain valid for read-only rendering", () => {
  const { api } = fixture();
  assert(api.validResult(samples.improveResult, "improve_painting"));
  assert(api.validResult(samples.referenceResult, "create_reference"));
  assert(!api.validResult({ ...samples.improveResult, whatWorks: [null] }, "improve_painting"));
  assert(!api.validResult({ ...samples.referenceResult, palette: [{ name: "Sky", hex: "unsafe" }] }, "create_reference"));
  assert(!api.validResult({ ...samples.referenceResult, steps: [] }, "create_reference"));
  const row = { id: artworkId, mode: "improve_painting", title: "Lake House", image_url: null, focus_area: null, created_at: "2026-10-13T00:00:00Z" };
  assert(api.validArtwork(row));
  assert(!api.validArtwork({ ...row, mode: "invalid" }));
  assert(!api.validArtwork({ ...row, created_at: "not a date" }));
  assert(!api.validArtwork({ ...row, focus_area: {} }));
  assert(!api.validArtworkId("not-a-uuid"));
});
test("external URLs and traversal paths are never sent to private storage for signing", async () => {
  const { api, state } = fixture();
  for (const invalid of [null, "https://example.invalid/image", "/image", `${userId}/../image`, `${userId}//image`])
    assert.equal(await api.imageUrl(invalid), undefined);
  assert.deepEqual(state.signs, []);
  assert.equal(await api.imageUrl(`${userId}/painting.png`), "https://example.invalid/temporary-image");
});
