const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");
const root = path.resolve(__dirname, "..");
function load(file, imports = {}) {
  const out = {};
  const code = ts.transpileModule(
    fs.readFileSync(path.join(root, file), "utf8"),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
      },
    },
  ).outputText;
  new Function("exports", "require", code)(out, (name) => {
    if (!(name in imports)) throw new Error(`Unexpected import: ${name}`);
    return imports[name];
  });
  return out;
}
const overlayContract = load("supabase/functions/_shared/overlays.ts");
const contract = load("supabase/functions/_shared/contract.ts", {
  "./overlays.ts": overlayContract,
});
const samples = load("supabase/functions/_shared/mockResults.ts");
const { createHandler } = load(
  "supabase/functions/generate-feedback/handler.ts",
  { "../_shared/contract.ts": contract, "../_shared/mockResults.ts": samples },
);
const uid = "10000000-0000-4000-8000-000000000001";
const id = "20000000-0000-4000-8000-000000000001";
const input = {
  request_id: id,
  expected_user_id: uid,
  mode: "improve_painting",
  focus_area: "Composition",
  image_path: `${uid}/painting.png`,
};
function fixture(overrides = {}) {
  const calls = [];
  const deps = {
    hasOpenAI: true,
    verify: async (token) => ({ id: uid, token }),
    existing: async () => null,
    usage: async () => ({ used: 0, limit: 3 }),
    claim: async () => {
      calls.push("claim");
      return { status: "claimed" };
    },
    download: async () => {
      calls.push("download");
      return new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
    },
    generate: async () => {
      calls.push("generate");
      return samples.improveResult;
    },
    finish: async (_u, i, result) => {
      calls.push("finish");
      assert(contract.validFeedback(result, i.mode));
      return { id, provider: "openai" };
    },
    mock: async (_u, _i, result) => {
      calls.push("mock");
      assert.equal(
        result,
        _i.mode === "improve_painting"
          ? samples.improveResult
          : samples.referenceResult,
      );
      return { id, provider: "mock" };
    },
    release: async () => {
      calls.push("release");
    },
    ...overrides,
  };
  const handler = createHandler(deps);
  return {
    calls,
    run: async (body = input, auth = "Bearer user-session") =>
      handler(
        new Request("https://example.invalid/generate-feedback", {
          method: "POST",
          headers: auth ? { Authorization: auth } : {},
          body: typeof body === "string" ? body : JSON.stringify(body),
        }),
      ),
  };
}
for (const mode of ["improve_painting", "create_reference"]) {
  test(`${mode}: structured OpenAI result is validated and saved`, async () => {
    const result =
      mode === "improve_painting"
        ? samples.improveResult
        : samples.referenceResult;
    const f = fixture({ generate: async () => result });
    assert.deepEqual(await (await f.run({ ...input, mode })).json(), {
      id,
      provider: "openai",
    });
    assert(f.calls.includes("finish"));
    assert(f.calls.includes("release"));
    assert(!f.calls.includes("mock"));
  });
}
for (const [name, overrides] of [
  ["missing server key", { hasOpenAI: false }],
  [
    "unreadable image",
    {
      download: async () => {
        throw new Error("private upstream error");
      },
    },
  ],
  [
    "OpenAI network error",
    {
      generate: async () => {
        throw new Error("private upstream error");
      },
    },
  ],
  ["invalid JSON", { generate: async () => "{invalid json" }],
  [
    "wrong response shape",
    { generate: async () => ({ ...samples.improveResult, whatWorks: [null] }) },
  ],
])
  test(`${name}: saves mock without counting a real result`, async () => {
    const f = fixture(overrides);
    const r = await f.run();
    assert.equal(r.status, 200);
    const body = await r.json();
    assert.equal(body.provider, "mock");
    assert.match(body.warning, /sample guide/);
    assert(!f.calls.includes("finish"));
    assert(f.calls.includes("mock"));
    if (name === "missing server key") assert(!f.calls.includes("claim"));
  });
test("no image uses original sample without calling OpenAI", async () => {
  const f = fixture();
  assert.equal(
    (await (await f.run({ ...input, image_path: null })).json()).provider,
    "mock",
  );
  assert.deepEqual(f.calls, ["mock"]);
});
test("quota blocks calls before storage or model use", async () => {
  for (const overrides of [
    { usage: async () => ({ used: 3, limit: 3 }) },
    { usage: async () => ({ used: 3, limit: 99 }) },
    { claim: async () => ({ status: "limit" }) },
  ]) {
    const f = fixture(overrides);
    const r = await f.run();
    assert.equal(r.status, 403);
    assert.equal((await r.json()).message, contract.limitMessage);
    assert(
      !f.calls.some((c) =>
        ["download", "generate", "mock", "finish"].includes(c),
      ),
    );
  }
});
test("concurrent in-flight request is not charged or duplicated", async () => {
  const f = fixture({ claim: async () => ({ status: "busy" }) });
  const r = await f.run();
  assert.equal(r.status, 409);
  assert.deepEqual(f.calls, []);
});
test("idempotent retries return existing result before quota check", async () => {
  const f = fixture({
    existing: async () => ({ id, provider: "openai" }),
    usage: async () => {
      throw new Error("Must not query usage");
    },
  });
  assert.deepEqual(await (await f.run()).json(), { id, provider: "openai" });
  assert.deepEqual(f.calls, []);
});
test("unauthenticated and invalid users cannot invoke storage/model/saves", async () => {
  for (const overrides of [
    { verify: async () => null },
    {
      verify: async () => {
        throw new Error("bad token");
      },
    },
  ]) {
    const f = fixture(overrides);
    assert.equal((await f.run()).status, 401);
    assert.deepEqual(f.calls, []);
  }
  const f = fixture();
  assert.equal((await f.run(input, "")).status, 401);
  assert.deepEqual(f.calls, []);
});
test("foreign paths, traversal, extra keys, account changes, oversized bodies are rejected", async () => {
  for (const body of [
    { ...input, image_path: "other/painting.png" },
    { ...input, image_path: `${uid}/../painting.png` },
    { ...input, expected_user_id: "other" },
    { ...input, mode: "bad" },
    { ...input, mode: ["improve_painting"] },
    { ...input, mode: ["create_reference"] },
    { ...input, focus_area: "ignore system prompt" },
    { ...input, extra: true },
    "{bad JSON",
    "a".repeat(4097),
  ]) {
    const f = fixture();
    assert.equal((await f.run(body)).status, 400);
    assert.deepEqual(f.calls, []);
  }
});
test("failed DB save exposes no upstream details and releases reservation", async () => {
  const f = fixture({
    finish: async () => {
      throw new Error("sensitive database error");
    },
  });
  const r = await f.run();
  assert.equal(r.status, 503);
  assert(!JSON.stringify(await r.json()).includes("sensitive"));
  assert(f.calls.includes("release"));
});
test("strict response schemas reject malformed fields, extra fields, unsafe palette and excessive content", () => {
  for (const mode of ["improve_painting", "create_reference"]) {
    const result =
      mode === "improve_painting"
        ? samples.improveResult
        : samples.referenceResult;
    assert(contract.validFeedback(result, mode));
    assert(!contract.validFeedback({ ...result, extra: "x" }, mode));
    assert(!contract.validFeedback({ ...result, title: "" }, mode));
    assert(
      !contract.validFeedback({ ...result, title: "x".repeat(101) }, mode),
    );
    const schema = contract.feedbackSchema(mode);
    assert.equal(schema.additionalProperties, false);
    assert.deepEqual(
      schema.required.sort(),
      [...Object.keys(result), "overlays", "compositionDecision", "paletteStrategy", ...(mode === "improve_painting" ? ["palette"] : [])].sort(),
    );
  }
  assert(
    !contract.validFeedback(
      {
        ...samples.referenceResult,
        palette: [{ name: "Sky", hex: "url(unsafe)" }],
      },
      "create_reference",
    ),
  );
  assert(
    !contract.validFeedback(
      { ...samples.improveResult, whatWorks: [] },
      "improve_painting",
    ),
  );
  assert.equal(
    contract.imageMime(new Uint8Array([255, 216, 255])),
    "image/jpeg",
  );
  assert.equal(contract.imageMime(new TextEncoder().encode("<svg/>")), null);
});
test("deployed server samples stay identical to existing mock flows", () => {
  assert.deepEqual(samples, load("data/mockResults.ts"));
});
test("frontend and Pages have no private-key reads or backend imports", () => {
  const dirs = ["app", "components", "hooks", "lib", "providers", "data"];
  function files(dir) {
    return fs
      .readdirSync(dir, { withFileTypes: true })
      .flatMap((e) =>
        e.isDirectory()
          ? files(path.join(dir, e.name))
          : [path.join(dir, e.name)],
      );
  }
  for (const file of dirs
    .flatMap((d) => files(path.join(root, d)))
    .filter((f) => /\.[jt]sx?$/.test(f))) {
    const code = fs.readFileSync(file, "utf8");
    assert(
      !/OPENAI_API_KEY|SUPABASE_SERVICE_ROLE_KEY|supabase\/functions/.test(
        code,
      ),
      `${file} leaks server capability`,
    );
  }
  const workflow = fs.readFileSync(
    path.join(root, ".github/workflows/deploy-pages.yml"),
    "utf8",
  );
  assert(!/OPENAI_API_KEY|SUPABASE_SERVICE_ROLE_KEY/.test(workflow));
});

test("invalid optional overlays keep validated OpenAI text instead of forcing mock", async () => {
  const f = fixture({
    generate: async () => ({
      ...samples.improveResult,
      overlays: [{ x: 200 }],
    }),
  });
  const r = await f.run();
  assert.equal(r.status, 200);
  assert.equal((await r.json()).provider, "openai");
  assert(f.calls.includes("finish"));
  assert(!f.calls.includes("mock"));
});

const richNote = {
  type: "focal_ring",
  id: "note-1",
  category: "focal_point",
  label: "Keep the strongest contrast here",
  x: 24,
  y: 28,
  width: 20,
  height: 18,
  points: null,
  styleHint: "focal",
  valueGroup: null,
  priority: "high",
  shortInstruction: "Keep one sharp dark beside this reserved light.",
  reason: "This gives the eye one clear resting place.",
  action: "After the wash dries, add one controlled dark accent and stop.",
};
test("rich geometry validates and malformed notes are discarded independently", () => {
  const line = {
    ...richNote, id: "note-2", type: "guide_line", category: "composition",
    width: null, height: null, points: [{ x: 10, y: 65 }, { x: 85, y: 60 }],
  };
  const mass = {
    ...richNote, id: "note-3", type: "value_mass", category: "value_structure",
    width: null, height: null, valueGroup: "middle",
    points: [{ x: 15, y: 55 }, { x: 75, y: 60 }, { x: 65, y: 88 }],
  };
  for (const mode of ["improve_painting", "create_reference"]) {
    const sample = mode === "improve_painting" ? samples.improveResult : samples.referenceResult;
    assert(contract.validFeedback({ ...sample, overlays: [richNote, line, mass] }, mode));
    const raw = { ...sample, overlays: [richNote, { ...line, points: [{ x: 120, y: 0 }, { x: 2, y: 5 }] }, mass] };
    assert(!contract.validFeedback(raw, mode));
    const cleaned = contract.cleanOverlayFeedback(raw);
    const { width: _width, height: _height, points: _points, ...lineText } = line;
    assert.deepEqual(cleaned.overlays, [richNote, { ...lineText, type: "point_marker" }, mass]);
    assert(contract.validFeedback(cleaned, mode));
    const { width: _ringWidth, height: _ringHeight, points: _ringPoints, ...ringText } = richNote;
    assert.deepEqual(contract.cleanOverlayFeedback({ ...sample, overlays: [{ ...richNote, width: null }] }),
      { ...sample, overlays: [{ ...ringText, type: "point_marker" }] });
  }
  for (const invalid of [
    { ...richNote, type: "focal_ring", width: null, height: null },
    { ...line, points: [{ x: 10, y: 10 }, { x: 10, y: 10 }] },
    { ...mass, points: [{ x: 10, y: 10 }, { x: 20, y: 20 }, { x: 30, y: 30 }] },
    { ...mass, points: [{ x: 10, y: 10 }, { x: 20, y: 20 }] },
    { ...line, styleHint: "glowing" },
    { ...richNote, category: "object_detection" },
    { ...mass, valueGroup: "bright" },
    { ...line, points: [{ x: 10, y: 10, extra: true }, { x: 15, y: 25 }] },
    { ...richNote, width: 90 },
  ]) assert(!overlayContract.validOverlays([invalid]), JSON.stringify(invalid));
  assert(overlayContract.validOverlays([richNote]));
  assert(!overlayContract.validOverlays([richNote, richNote]));
  assert.deepEqual(overlayContract.usableOverlays([richNote, richNote]), [richNote]);
});
test("optional practical palette metadata stays compatible and rejects invented pigment codes", () => {
  const palette = [
    { name: "Ultramarine", hex: "#496983", use: "Cool sky and distant shadows", pigmentCode: "PB29" },
    { name: "Burnt Sienna", hex: "#aa765c", use: "Warm building planes; test a neutral mix", pigmentCode: "PBr7" },
    { name: "Yellow Ochre", hex: "#bf9b60", use: "Light warm walls", pigmentCode: "PY43" },
    { name: "Payne's Gray", hex: "#45535e", use: "Optional convenience dark; use sparingly", pigmentCode: null },
  ];
  assert(contract.validFeedback({ ...samples.referenceResult, palette }, "create_reference"));
  assert(contract.validFeedback(samples.referenceResult, "create_reference"));
  for (const patch of [
    { pigmentCode: "PB99" }, { pigmentCode: "PB29/PBk7" }, { manufacturer: "unverified" },
    { pigmentCode: "PBr7" }, { use: "x".repeat(181) }, { use: true },
  ]) assert(!contract.validFeedback({ ...samples.referenceResult, palette: [{ ...palette[0], ...patch }] }, "create_reference"));
  for (const [name, pigmentCode] of [["Raw Sienna", "PBr7"], ["Red Ochre", "PY43"], ["Payne's Gray", "PB29"]])
    assert(!contract.validFeedback({ ...samples.referenceResult, palette: [{ name, hex: "#808080", pigmentCode }] }, "create_reference"));
  const schema = contract.feedbackSchema("create_reference");
  assert.deepEqual(schema.properties.palette.items.required, ["name", "hex", "use", "pigmentCode", "temperature", "mix", "tag"]);
  assert.deepEqual(schema.properties.palette.items.properties.pigmentCode.enum, ["PB29", "PBr7", "PY43", "PY42", null]);
});
test("rich overlay cleanup preserves OpenAI result and calls the model only once", async () => {
  let generated = 0;
  let saved;
  const f = fixture({
    generate: async () => {
      generated++;
      return { ...samples.improveResult, overlays: [richNote, { ...richNote, x: -3 }] };
    },
    finish: async (_u, _i, result) => {
      saved = result;
      return { id, provider: "openai" };
    },
  });
  const response = await f.run();
  assert.equal(response.status, 200);
  assert.equal((await response.json()).provider, "openai");
  assert.equal(generated, 1);
  assert.deepEqual(saved.overlays, [richNote]);
  assert(!f.calls.includes("mock"));
});

test("semantic mark aliases and timing remain strict while invalid geometry keeps usable coaching cards", () => {
  const paths = [{ x: 10, y: 70 }, { x: 35, y: 50 }, { x: 55, y: 45 }];
  const aliases = [
    { ...richNote, type: "eye_flow_arrow", category: null, styleHint: "eye_flow", timing: "next_study", width: null, height: null, points: paths },
    { ...richNote, type: "composition_line", category: null, styleHint: "horizon", timing: "both", width: null, height: null, points: paths },
    { ...richNote, type: "simplify_region", category: null, styleHint: "simplify", timing: "current_painting" },
    { ...richNote, type: "reserve_light_mark", category: null, styleHint: "preserve_light", timing: null },
  ];
  const kinds = ["arrow", "guide_line", "region_highlight", "focal_ring"];
  const categories = ["composition", "composition", "simplification", "reserve_light"];
  aliases.forEach((note, index) => {
    assert(overlayContract.validOverlays([note]));
    assert.equal(overlayContract.overlayKind(note), kinds[index]);
    assert.equal(overlayContract.overlayCategory(note), categories[index]);
    const bad = { ...note, width: 110, height: 10, points: [{ x: 150, y: 0 }] };
    assert(!overlayContract.validOverlays([bad]));
    const [usable] = overlayContract.usableOverlays([bad]);
    assert.equal(usable.type, "point_marker");
    assert.equal(usable.category, categories[index]);
    assert.equal(usable.x, note.x);
    assert.equal(usable.y, note.y);
    assert.equal(usable.timing, note.timing);
    assert(!Object.hasOwn(usable, "width"));
    assert(!Object.hasOwn(usable, "height"));
    assert(!Object.hasOwn(usable, "points"));
    assert(overlayContract.validOverlays([usable]));
    assert.deepEqual(overlayContract.usableOverlays([{ ...bad, x: -1 }]), []);
    assert.deepEqual(overlayContract.usableOverlays([{ ...bad, timing: "tomorrow" }]), []);
    assert.deepEqual(overlayContract.usableOverlays([{ ...bad, action: "" }]), []);
    assert.deepEqual(overlayContract.usableOverlays([{ ...bad, unexpected: "not allowed" }]), []);
  });
});
test("composition decisions and extended palettes are optional and compatible in both feedback modes", () => {
  const palette = [{ name: "Ultramarine", hex: "#52738a", pigmentCode: "PB29", use: "Cool sky wash and distance", temperature: "cool", mix: "Test a diluted neutral with Burnt Sienna", tag: "main_wash" }];
  const decision = { mainIssue: "The foreground dark competes with the figures.", reason: "It attracts the eye before the focal area.", tryNow: "Stop adding detail to the foreground; keep focal accents selective.", nextStudy: "Test a higher crop in a small thumbnail before repainting." };
  for (const mode of ["improve_painting", "create_reference"]) {
    const sample = mode === "improve_painting" ? samples.improveResult : samples.referenceResult;
    const enriched = { ...sample, palette, paletteStrategy: "Use cool distance and reserve stronger darks near the figures.", compositionDecision: decision };
    assert(contract.validFeedback(sample, mode));
    assert(contract.validFeedback(enriched, mode));
    assert(contract.validFeedback({ ...enriched, compositionDecision: { tryNow: decision.tryNow } }, mode));
    assert(contract.validFeedback({ ...enriched, compositionDecision: null, paletteStrategy: null }, mode));
    for (const compositionDecision of [[], "text", { mainIssue: "x".repeat(351) }, { tryNow: 3 }, { mainIssue: "" }, { moveObject: "not allowed" }])
      assert(!contract.validFeedback({ ...enriched, compositionDecision }, mode));
    assert(!contract.validFeedback({ ...enriched, paletteStrategy: "x".repeat(351) }, mode));
    for (const patch of [{ temperature: "hot" }, { tag: "buy_now" }, { mix: "x".repeat(181) }, { temperature: ["cool"] }, { manufacturer: "unverified" }])
      assert(!contract.validFeedback({ ...enriched, palette: [{ ...palette[0], ...patch }] }, mode));
  }
  assert(contract.validFeedback({ ...samples.improveResult, palette: null }, "improve_painting"));
  assert(!contract.validFeedback({ ...samples.referenceResult, palette: null }, "create_reference"));
});
test("strict model schemas require nullable optional guidance fields without forcing legacy JSON changes", () => {
  function checkObject(schema) {
    if (!schema || typeof schema !== "object") return;
    if (schema.properties) {
      assert.deepEqual([...schema.required].sort(), Object.keys(schema.properties).sort());
      assert.equal(schema.additionalProperties, false);
      Object.values(schema.properties).forEach(checkObject);
    }
    if (schema.items) checkObject(schema.items);
  }
  for (const mode of ["improve_painting", "create_reference"]) {
    const schema = contract.feedbackSchema(mode);
    checkObject(schema);
    assert.deepEqual(schema.properties.compositionDecision.type, ["object", "null"]);
    assert.deepEqual(schema.properties.overlays.items.properties.timing.enum, ["current_painting", "next_study", "both", null]);
    assert(schema.properties.overlays.items.properties.type.enum.includes("eye_flow_arrow"));
    assert(schema.properties.overlays.items.properties.styleHint.enum.includes("connect_shadow"));
    assert.deepEqual(schema.properties.palette.type, mode === "improve_painting" ? ["array", "null"] : "array");
  }
});
