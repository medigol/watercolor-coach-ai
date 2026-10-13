const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const ts = require("typescript");

const root = path.resolve(__dirname, "..");
const userId = "10000000-0000-4000-8000-000000000001";
const artworkId = "20000000-0000-4000-8000-000000000001";
const otherUserId = "10000000-0000-4000-8000-000000000002";
const png = Uint8Array.from(
  Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aWQAAAABJRU5ErkJggg==",
    "base64",
  ),
);

function source(relative) {
  return ts.transpileModule(
    fs.readFileSync(path.join(root, relative), "utf8"),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
      },
    },
  ).outputText;
}
const samples = {};
new Function("exports", source("data/mockResults.ts"))(samples);

// Keep the real persistence code, replacing only its network boundaries.
function fixture(options = {}) {
  const state = {
    userId,
    uploads: [],
    removals: [],
    saves: [],
    fetches: 0,
    signs: [],
  };
  const client = {
    auth: {
      getUser: async () => ({ data: { user: { id: userId } }, error: null }),
      getSession: async () => ({
        data: { session: { user: { id: state.userId } } },
        error: null,
      }),
    },
    storage: {
      from: (bucket) => {
        assert.equal(bucket, "artworks");
        return {
          upload: async (name, bytes, settings) => {
            state.uploads.push({ name, bytes, settings });
            if (options.changeAccountAfterUpload) state.userId = otherUserId;
            return { error: options.uploadError || null };
          },
          remove: async (names) => {
            state.removals.push(...names);
            return { error: null };
          },
          createSignedUrl: async (name) => {
            state.signs.push(name);
            return {
              data: { signedUrl: "https://example.invalid/temporary-image" },
              error: null,
            };
          },
        };
      },
    },
    rpc: async (name, input) => {
      assert.equal(name, "save_mock_artwork");
      state.saves.push(input);
      if (options.transportThrows) throw new Error("Lost response");
      return (
        options.rpcResponse || { data: artworkId, error: null, status: 200 }
      );
    },
  };
  const api = {};
  new Function("require", "exports", "fetch", source("lib/artworks.ts"))(
    (name) =>
      name === "./supabase" ? { requireSupabase: () => client } : samples,
    api,
    async () => {
      state.fetches += 1;
      return new Response(options.bytes || png, {
        headers: {
          "content-type": options.mime || "image/png",
          ...(options.headers || {}),
        },
      });
    },
  );
  return { api, state };
}

test("saves mock metadata without an image and binds the expected account", async () => {
  const { api, state } = fixture();
  assert.deepEqual(await api.saveArtwork("improve_painting", "Composition"), {
    id: artworkId,
    warning: null,
  });
  assert.equal(state.uploads.length, 0);
  assert.equal(state.saves[0].p_expected_user_id, userId);
  assert.equal(state.saves[0].p_image_path, null);
  assert.deepEqual(state.saves[0].p_result, samples.improveResult);
});

test("uses actual image bytes rather than a mismatched supplied MIME", async () => {
  const { api, state } = fixture();
  await api.saveArtwork("create_reference", null, {
    uri: "file:///painting",
    mimeType: "image/jpeg",
  });
  assert.equal(state.uploads[0].settings.contentType, "image/png");
  assert.match(state.uploads[0].name, new RegExp(`^${userId}/.+\\.png$`));
  assert.equal(state.saves[0].p_image_path, state.uploads[0].name);
});

test("rejects an SVG disguised as JPEG and safely saves sample metadata", async () => {
  const { api, state } = fixture({
    bytes: Buffer.from("<svg><script>unsafe</script></svg>"),
    mime: "image/jpeg",
  });
  const saved = await api.saveArtwork("improve_painting", null, {
    uri: "blob:sample",
    mimeType: "image/jpeg",
  });
  assert(saved.warning);
  assert.equal(state.uploads.length, 0);
  assert.equal(state.saves[0].p_image_path, null);
});

test("oversized picker files are rejected before reading; response limits also apply", async () => {
  const size = 10 * 1024 * 1024 + 1;
  const first = fixture();
  assert(
    (
      await first.api.saveArtwork("improve_painting", null, {
        uri: "file:///huge",
        fileSize: size,
      })
    ).warning,
  );
  assert.equal(first.state.fetches, 0);
  const second = fixture({ headers: { "content-length": String(size) } });
  assert(
    (
      await second.api.saveArtwork("improve_painting", null, {
        uri: "blob:huge",
      })
    ).warning,
  );
  assert.equal(second.state.uploads.length, 0);
  const third = fixture({ bytes: new Uint8Array(size) });
  assert(
    (
      await third.api.saveArtwork("improve_painting", null, {
        uri: "blob:huge",
      })
    ).warning,
  );
  assert.equal(third.state.uploads.length, 0);
});

test("failed storage uploads still save mock metadata", async () => {
  const { api, state } = fixture({ uploadError: { message: "Forbidden" } });
  assert(
    (
      await api.saveArtwork("create_reference", null, {
        uri: "file:///painting",
      })
    ).warning,
  );
  assert.equal(state.saves[0].p_image_path, null);
});

test("a definite database rejection cleans up the successful image upload", async () => {
  const { api, state } = fixture({
    rpcResponse: { data: null, error: { code: "23514" }, status: 400 },
  });
  await assert.rejects(
    api.saveArtwork("improve_painting", null, { uri: "file:///painting" }),
    /could not save/,
  );
  assert.deepEqual(state.removals, [state.uploads[0].name]);
});

test("uncertain save outcomes preserve images that a committed transaction may reference", async () => {
  for (const options of [
    { transportThrows: true },
    {
      rpcResponse: {
        data: null,
        error: { message: "Lost response" },
        status: 0,
      },
    },
    {
      rpcResponse: {
        data: null,
        error: { message: "Upstream error" },
        status: 502,
      },
    },
    { rpcResponse: { data: null, error: { message: "Timeout" }, status: 408 } },
  ]) {
    const { api, state } = fixture(options);
    await assert.rejects(
      api.saveArtwork("improve_painting", null, { uri: "file:///painting" }),
      /could not confirm your save.*Check My Artworks/,
    );
    assert.equal(state.uploads.length, 1);
    assert.deepEqual(state.removals, []);
  }
});

test("an account change during upload never saves the previous user's artwork to the new account", async () => {
  const { api, state } = fixture({ changeAccountAfterUpload: true });
  await assert.rejects(
    api.saveArtwork("improve_painting", null, { uri: "file:///painting" }),
    /could not save/,
  );
  assert.equal(state.saves.length, 0);
});

test("malformed saved result data and artwork rows are rejected before rendering", () => {
  const { api } = fixture();
  assert(api.validResult(samples.improveResult, "improve_painting"));
  assert(api.validResult(samples.referenceResult, "create_reference"));
  assert(
    !api.validResult(
      { ...samples.improveResult, whatWorks: [null] },
      "improve_painting",
    ),
  );
  assert(
    !api.validResult(
      { ...samples.referenceResult, palette: [{ name: "Sky", hex: "unsafe" }] },
      "create_reference",
    ),
  );
  assert(
    !api.validResult(
      { ...samples.referenceResult, steps: [] },
      "create_reference",
    ),
  );
  const row = {
    id: artworkId,
    mode: "improve_painting",
    title: "Lake House",
    image_url: null,
    focus_area: null,
    created_at: "2026-10-13T00:00:00Z",
  };
  assert(api.validArtwork(row));
  assert(!api.validArtwork({ ...row, mode: "invalid" }));
  assert(!api.validArtwork({ ...row, created_at: "not a date" }));
  assert(!api.validArtwork({ ...row, focus_area: {} }));
  assert(!api.validArtworkId("not-a-uuid"));
});

test("external URLs and traversal paths are never sent to storage for signing", async () => {
  const { api, state } = fixture();
  for (const invalid of [
    null,
    "https://example.invalid/image",
    "/image",
    `${userId}/../image`,
    `${userId}//image`,
  ])
    assert.equal(await api.imageUrl(invalid), undefined);
  assert.deepEqual(state.signs, []);
  assert.equal(
    await api.imageUrl(`${userId}/painting.png`),
    "https://example.invalid/temporary-image",
  );
});
