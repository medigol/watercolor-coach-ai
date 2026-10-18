// All provider responses are mocked. Header-only technical buffers below are
// resource/fairness fixtures, NOT real paintings or visual-quality evidence.
const test = require("node:test"),
  assert = require("node:assert/strict"),
  fs = require("node:fs"),
  path = require("node:path"),
  os = require("node:os");
const {
  ROOT,
  production,
  lockedProduction,
  hash,
} = require("../scripts/benchmark/production.cjs");
const {
  ARMS,
  ENDPOINT,
  bodyFor,
  attest,
  projected,
  usageCost,
  fingerprint,
} = require("../scripts/benchmark/models.cjs");
const { validate, assertSchema } = require("../scripts/benchmark/schema.cjs");
const {
  evaluate,
  run,
  plan,
  charged,
  ledgerRead,
} = require("../scripts/benchmark/runner.cjs");
const {
  external,
  excerpt,
  localFile,
  writePrivate,
} = require("../scripts/benchmark/safety.cjs");
const {
  readManifest,
  roiMetrics,
} = require("../scripts/benchmark/manifest.cjs");
const {
  report,
  reviewRows,
  statistics,
  recommendation,
  percentile,
  csv,
} = require("../scripts/benchmark/report.cjs");
const { args } = require("../scripts/benchmark/cli.cjs");
const p = lockedProduction();
const draft = () => require("./helpers/deep-coaching-fixture.cjs")("strong");
const accepted = () => ({
  eligibility: { status: "accepted", reason_code: null },
  analysis: draft(),
});
const payload = (v = accepted(), extra = {}) => ({
  model: "gpt-4.1-mini",
  system_fingerprint: "fp_mock",
  choices: [{ finish_reason: "stop", message: { content: JSON.stringify(v) } }],
  usage: {
    prompt_tokens: 1000,
    completion_tokens: 800,
    total_tokens: 1800,
    prompt_tokens_details: { cached_tokens: 100, cache_write_tokens: 50 },
    completion_tokens_details: { reasoning_tokens: 0 },
  },
  ...extra,
});
function card() {
  return {
    verified: true,
    checkedOn: new Date().toISOString().slice(0, 10),
    tier: "standard",
    currency: "USD",
    sources: [
      "https://developers.openai.com/api/docs/models",
      "https://developers.openai.com/api/docs/pricing",
      "https://developers.openai.com/api/docs/guides/images-vision",
    ],
    arms: Object.fromEntries(
      ARMS.map((a) => [
        a.id,
        {
          ...a,
          input: 0.001,
          cached: 0.0005,
          cacheWrite: 0.0002,
          output: 0.002,
          maxImageTokens: 20000,
          imageBoundSource:
            "https://developers.openai.com/api/docs/guides/images-vision",
          cacheWriteAccounting: "additive",
          support: {
            chatCompletions: true,
            imageInput: true,
            strictJsonSchema: true,
            requiredNullableEnvelope: true,
            reasoningNone: true,
          },
        },
      ]),
    ),
  };
}
function temp(t) {
  const d = fs.mkdtempSync(
    path.join(os.tmpdir(), "watercolor-benchmark-unit-"),
  );
  t.after(() => fs.rmSync(d, { recursive: true, force: true }));
  return d;
}
function fixture(t, n = 3) {
  const root = temp(t),
    dir = path.join(root, "prepared"),
    output = path.join(root, "results");
  fs.mkdirSync(dir);
  const cases = Array.from({ length: n }, (_, i) => {
    const id = "C" + String(i + 1).padStart(2, "0"),
      b = Buffer.alloc(32);
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]).copy(b);
    b.writeUInt32BE(0x49484452, 12);
    b.writeUInt32BE(800, 16);
    b.writeUInt32BE(600, 20);
    b[24] = i;
    fs.writeFileSync(path.join(dir, id + ".png"), b);
    return {
      case_id: id,
      image: id + ".png",
      imageHash: hash(b),
      sourceHash: hash(b),
      width: 800,
      height: 600,
      mime: "image/png",
      category: "watercolor",
      ground_truth: "accept",
      watercolor_status: "confirmed",
      approved_for_api: true,
      permission: "Original synthetic test only",
      autoCropMetrics: null,
      appliedCropMetrics: null,
    };
  });
  const meta = {
    version: 1,
    experimentID: "mock-experiment",
    manifestHash: hash("mock manifest"),
    production: p.identity,
    cases,
  };
  fs.writeFileSync(path.join(dir, "prepared.json"), JSON.stringify(meta));
  return { root, prepared: dir, output, rates: card(), meta };
}
const env = { OPENAI_API_KEY: "mock-key-never-real" };
function mockTransport(calls, response) {
  return async (url, options) => {
    calls.push({ url, body: JSON.parse(options.body), options });
    const body = JSON.parse(options.body);
    return response
      ? response(body)
      : new Response(
          JSON.stringify(payload(accepted(), { model: body.model })),
        );
  };
}
test("benchmark locks EXACT production prompt, user text, schema and pure source graph", () => {
  assert.deepEqual(production().identity, p.identity);
  assert(p.prompt.includes("FIRST assess eligibility"));
  assert(p.schema.required.includes("analysis"));
  assert(!Object.keys(p.identity.sources).some((x) => x.includes("handler")));
  assertSchema(p.schema);
});
test("exactly four requested configurations, no fallback candidate", () =>
  assert.deepEqual(
    ARMS.map((a) => [a.model, a.detail]),
    [
      ["gpt-4.1-mini", "low"],
      ["gpt-4.1-mini", "high"],
      ["gpt-5.4-mini", "high"],
      ["gpt-6-luna", "high"],
    ],
  ));
test("each arm uses identical prepared bytes, prompt, user metadata, strict nullable schema and ceiling", () => {
  const bytes = Buffer.from("immutable synthetic input");
  const bs = ARMS.map((a) => bodyFor(p, a, bytes, "image/png"));
  for (const b of bs) {
    assert.equal(b.messages[0].content, p.prompt);
    assert.equal(b.messages[1].content[0].text, p.user);
    assert.equal(
      b.messages[1].content[1].image_url.url,
      "data:image/png;base64," + bytes.toString("base64"),
    );
    assert.deepEqual(b.response_format.json_schema.schema, p.schema);
    assert.equal(b.response_format.json_schema.strict, true);
    assert.equal(b.max_completion_tokens, 3000);
    assert.equal(b.service_tier, "default");
  }
  assert.equal(bs[0].temperature, 0.3);
  assert.equal(bs[1].temperature, 0.3);
  for (const b of bs.slice(2)) {
    assert.equal(b.reasoning_effort, "none");
    assert(!Object.hasOwn(b, "temperature"));
  }
});
test("configuration fingerprint masks image data but captures detail/model parameters", () => {
  assert.equal(
    fingerprint(bodyFor(p, ARMS[0], Buffer.from("A"), "image/png")),
    fingerprint(bodyFor(p, ARMS[0], Buffer.from("B"), "image/png")),
  );
  assert.notEqual(
    fingerprint(bodyFor(p, ARMS[0], Buffer.alloc(0), "image/png")),
    fingerprint(bodyFor(p, ARMS[1], Buffer.alloc(0), "image/png")),
  );
});
for (const [name, mutate] of [
  ["unverified", (c) => (c.verified = false)],
  ["stale date", (c) => (c.checkedOn = "2000-01-01")],
  ["nonstandard tier", (c) => (c.tier = "fast")],
  ["unknown price", (c) => (c.arms.candidate_luna.input = null)],
  ["missing cached price", (c) => (c.arms.candidate_luna.cached = null)],
  ["missing image bound", (c) => (c.arms.candidate_luna.maxImageTokens = null)],
  [
    "missing reasoning support",
    (c) => (c.arms.candidate_luna.support.reasoningNone = false),
  ],
  [
    "missing nullable support",
    (c) => (c.arms.candidate_mini.support.requiredNullableEnvelope = false),
  ],
  ["unofficial source", (c) => (c.sources = [])],
])
  test("live attestation rejects " + name, () => {
    const c = card();
    mutate(c);
    assert.throws(() => attest(c));
  });
test("committed reference rates cannot authorize paid calls", () =>
  assert.throws(() => attest(require("../docs/benchmark/rates.example.json"))));
test("prospective bound is family-specific, no shared low/high image cost formula", () => {
  const c = card();
  c.arms.baseline_low.maxImageTokens = 30000;
  const low = projected(p, ARMS[0], Buffer.alloc(0), "image/png", c),
    high = projected(p, ARMS[1], Buffer.alloc(0), "image/png", c);
  assert(low.usd > high.usd);
  assert.equal(low.outputBound, 3000);
  assert(low.textBound > Buffer.byteLength(p.prompt));
});
test("cost bills output INCLUDING reasoning once, cached input and additive cache writes", () => {
  const u = payload().usage;
  u.completion_tokens_details.reasoning_tokens = 200;
  const v = usageCost(u, { input: 1, cached: 0.1, cacheWrite: 2, output: 4 });
  assert.equal(v.usd, (900 + 10 + 100 + 3200) / 1e6);
  assert.equal(v.reasoning, 200);
  assert.equal(v.output, 800);
});
for (const [name, mutate] of [
  ["missing usage", () => null],
  ["inconsistent total", (u) => ({ ...u, total_tokens: 1 })],
  [
    "bad cached",
    (u) => ({ ...u, prompt_tokens_details: { cached_tokens: 9999 } }),
  ],
  [
    "unknown billing field",
    (u) => ({ ...u, prompt_tokens_details: { unrecognized_charge: 2 } }),
  ],
  [
    "bad reasoning",
    (u) => ({ ...u, completion_tokens_details: { reasoning_tokens: 9999 } }),
  ],
  [
    "audio billing",
    (u) => ({ ...u, prompt_tokens_details: { audio_tokens: 20 } }),
  ],
])
  test("accounting fails closed: " + name, () =>
    assert.throws(() =>
      usageCost(mutate(payload().usage), card().arms.baseline_low),
    ),
  );
test("valid provider draft passes raw strict schema AND actual canonical cleaner/validator", () => {
  const r = evaluate(payload(), p);
  assert(r.strictSchema);
  assert(r.canonicalValid);
  assert.equal(r.outcome, "accepted");
  assert.equal(r.excerpts.length, 4);
});
for (const [status, reason] of [
  ["rejected", "unsupported_artwork"],
  ["uncertain", "crop_needed"],
  ["uncertain", "artwork_uncertain"],
])
  test("semantic outcome distinct: " + reason, () => {
    const r = evaluate(
      payload({ eligibility: { status, reason_code: reason }, analysis: null }),
      p,
    );
    assert(r.strictSchema);
    assert.equal(r.outcome, status);
    assert.equal(r.reasonCode, reason);
    assert(!r.canonicalValid);
  });
for (const [name, change] of [
  ["truncated", (v) => (v.choices[0].finish_reason = "length")],
  ["refusal", (v) => (v.choices[0].message.refusal = "mock refusal")],
  ["invalid JSON", (v) => (v.choices[0].message.content = "{")],
  ["absent choice", (v) => (v.choices = [])],
  ["unknown finish", (v) => (v.choices[0].finish_reason = "future_value")],
])
  test("provider failure is not successful: " + name, () => {
    const v = payload();
    change(v);
    assert.equal(evaluate(v, p).outcome, "invalid");
  });
test("strict schema detects extras, bad pattern, wrong refs, null contract and array bounds independently", () => {
  for (const mutate of [
    (v) => (v.extra = 1),
    (v) => (v.analysis.overall.facts[0].roleIndex = 999),
    (v) => (v.analysis.overall.facts = []),
    (v) => (v.eligibility.status = "maybe"),
    (v) =>
      (v.analysis.colourValue.colourAnalysis.visibleColours[0].approximateHex =
        "red"),
  ]) {
    const v = accepted();
    mutate(v);
    assert(!validate(v, p.schema));
  }
  assert.throws(() => assertSchema({ type: "string", not: { type: "null" } }));
});
test("canonical failure distinct from syntactically strict JSON", () => {
  const v = accepted();
  v.analysis.overall.insights[0].factRefs = [1];
  v.analysis.overall.facts = v.analysis.overall.facts.slice(0, 1);
  const r = evaluate(payload(v), p);
  assert(r.strictSchema);
  assert(!r.canonicalValid);
});
test("default run makes ZERO calls even with a key present", async (t) => {
  const f = fixture(t),
    calls = [];
  const r = await run(f, mockTransport(calls), env);
  assert.equal(r.mode, "dry-run");
  assert.equal(calls.length, 0);
  assert.equal(r.paidRequests, 0);
  assert.equal(r.plannedRequests, 12);
});
for (const [name, options, key] of [
  ["no confirmation", { live: true }, env],
  ["no key", { live: true, confirmCost: true }, {}],
])
  test("live gate " + name, async (t) => {
    const f = fixture(t),
      calls = [];
    await assert.rejects(run({ ...f, ...options }, mockTransport(calls), key));
    assert.equal(calls.length, 0);
  });
test("live rejects unapproved image before transport", async (t) => {
  const f = fixture(t);
  f.meta.cases[0].approved_for_api = false;
  fs.writeFileSync(
    path.join(f.prepared, "prepared.json"),
    JSON.stringify(f.meta),
  );
  let n = 0;
  await assert.rejects(
    run(
      { ...f, live: true, confirmCost: true },
      () => {
        n++;
      },
      env,
    ),
  );
  assert.equal(n, 0);
});
test("pilot then full experiment never repeats case-arm; exactly 96 calls max across invocations", async (t) => {
  const f = fixture(t, 24),
    calls = [];
  const opt = { ...f, live: true, confirmCost: true };
  await run({ ...opt, cases: "C01,C02,C03" }, mockTransport(calls), env);
  assert.equal(calls.length, 12);
  await run(opt, mockTransport(calls), env);
  assert.equal(calls.length, 96);
  await run(opt, mockTransport(calls), env);
  assert.equal(calls.length, 96);
  assert.equal(
    ledgerRead(path.join(f.output, "ledger.jsonl")).filter(
      (x) => x.kind === "reserved",
    ).length,
    96,
  );
});
test("same immutable image bytes across all four mocked arms; no Supabase calls", async (t) => {
  const f = fixture(t),
    calls = [];
  await run({ ...f, live: true, confirmCost: true }, mockTransport(calls), env);
  assert(
    calls.every((c) => c.url === ENDPOINT && c.options.redirect === "error"),
  );
  for (let i = 0; i < 12; i += 4) {
    const urls = calls
      .slice(i, i + 4)
      .map((c) => c.body.messages[1].content[1].image_url.url);
    assert.equal(new Set(urls).size, 1);
  }
});
test("model errors sanitized, arm named not-comparable, NO retries or later requests with unknown billing", async (t) => {
  const f = fixture(t),
    calls = [];
  const r = await run(
    { ...f, live: true, confirmCost: true },
    mockTransport(
      calls,
      () => new Response("private upstream body secret", { status: 400 }),
    ),
    env,
  );
  assert.equal(calls.length, 1);
  assert.equal(r.stopped, "unknown_or_exceeded_accounting");
  const text = fs.readFileSync(path.join(f.output, "ledger.jsonl"), "utf8");
  assert(text.includes("not_comparable"));
  assert(!text.includes("private upstream"));
  assert(!text.includes(env.OPENAI_API_KEY));
  await assert.rejects(
    run({ ...f, live: true, confirmCost: true }, mockTransport(calls), env),
  );
  assert.equal(calls.length, 1);
});
test("missing usage stops before any second call and reserves worst case", async (t) => {
  const f = fixture(t),
    calls = [];
  const r = await run(
    { ...f, live: true, confirmCost: true },
    mockTransport(
      calls,
      (b) =>
        new Response(
          JSON.stringify(payload(accepted(), { model: b.model, usage: null })),
        ),
    ),
    env,
  );
  assert.equal(calls.length, 1);
  assert.equal(r.stopped, "unknown_or_exceeded_accounting");
  assert(r.chargedOrReservedUSD > 0);
});
test("network ambiguity burns slot; never automatically replay on restart", async (t) => {
  const f = fixture(t),
    calls = [];
  await run(
    { ...f, live: true, confirmCost: true },
    mockTransport(calls, () => {
      throw Error("private network error");
    }),
    env,
  );
  await assert.rejects(
    run({ ...f, live: true, confirmCost: true }, mockTransport(calls), env),
  );
  assert.equal(calls.length, 1);
});
test("prospective $3 guard stops BEFORE first call if request bound exceeds budget", async (t) => {
  const f = fixture(t),
    calls = [];
  for (const a of ARMS) f.rates.arms[a.id].output = 2000;
  const r = await run(
    { ...f, live: true, confirmCost: true },
    mockTransport(calls),
    env,
  );
  assert.equal(calls.length, 0);
  assert.equal(r.stopped, "prospective_budget");
});
test("prospective guard considers prior actual charges before EACH call", async (t) => {
  const f = fixture(t),
    calls = [];
  for (const a of ARMS) f.rates.arms[a.id].output = 625;
  const r = await run(
    { ...f, live: true, confirmCost: true },
    mockTransport(calls),
    env,
  );
  assert.equal(calls.length, 3);
  assert(r.chargedOrReservedUSD <= 3);
  assert.equal(r.stopped, "prospective_budget");
});
test("usage above attested input bound aborts further calls", async (t) => {
  const f = fixture(t),
    calls = [];
  const r = await run(
    { ...f, live: true, confirmCost: true },
    mockTransport(
      calls,
      (b) =>
        new Response(
          JSON.stringify(
            payload(accepted(), {
              model: b.model,
              usage: {
                prompt_tokens: 999999,
                completion_tokens: 800,
                total_tokens: 1000799,
              },
            }),
          ),
        ),
    ),
    env,
  );
  assert.equal(calls.length, 1);
  assert.equal(r.stopped, "unknown_or_exceeded_accounting");
});
test("unexpected model or nonstandard service tier is not comparable", async (t) => {
  const f = fixture(t),
    calls = [];
  const r = await run(
    { ...f, live: true, confirmCost: true },
    mockTransport(
      calls,
      () =>
        new Response(
          JSON.stringify(
            payload(accepted(), {
              model: "unrequested-model",
              service_tier: "priority",
            }),
          ),
        ),
    ),
    env,
  );
  assert.equal(calls.length, 1);
  assert.equal(r.stopped, "incompatible_arm");
});
test("raw complete provider response retained ONLY with explicit consent", async (t) => {
  const f = fixture(t);
  await run({ ...f, live: true, confirmCost: true }, mockTransport([]), env);
  assert(!fs.existsSync(path.join(f.output, "private-responses")));
  const g = fixture(t);
  await run(
    { ...g, live: true, confirmCost: true, retainResponses: true },
    mockTransport([]),
    env,
  );
  assert.equal(
    fs.readdirSync(path.join(g.output, "private-responses")).length,
    12,
  );
});
test("changed prepared image rejected before any provider call", async (t) => {
  const f = fixture(t),
    calls = [];
  fs.appendFileSync(path.join(f.prepared, "C01.png"), "changed");
  await assert.rejects(
    run({ ...f, live: true, confirmCost: true }, mockTransport(calls), env),
  );
  assert.equal(calls.length, 0);
});
test("journal cannot silently reset by changing report directory", async (t) => {
  const f = fixture(t),
    calls = [];
  await run({ ...f, live: true, confirmCost: true }, mockTransport(calls), env);
  await assert.rejects(
    run(
      {
        ...f,
        output: path.join(f.root, "other"),
        live: true,
        confirmCost: true,
      },
      mockTransport(calls),
      env,
    ),
  );
  assert.equal(calls.length, 12);
});
test("in-flight lock rejects concurrent paid execution", async (t) => {
  const f = fixture(t),
    calls = [];
  fs.mkdirSync(f.output);
  fs.writeFileSync(path.join(f.output, "run.lock"), "existing");
  await assert.rejects(
    run({ ...f, live: true, confirmCost: true }, mockTransport(calls), env),
  );
  assert.equal(calls.length, 0);
});
test("unfinished durable reservation is charged conservatively", () =>
  assert.equal(
    charged([{ kind: "reserved", key: "a", reservedUSD: 0.1 }]),
    0.1,
  ));
test("manifest template covers exact 24-case mix without inventing samples or authorizing uploads", (t) => {
  const root = temp(t),
    m = require("../docs/benchmark/manifest.example.json");
  const f = path.join(root, "manifest.json");
  assert.equal(m.cases.length, 24);
  fs.writeFileSync(f, JSON.stringify(m));
  assert.equal(readManifest(f).cases.length, 24);
  assert(m.cases.every((c) => !c.approved_for_api));
  const copy = structuredClone(m);
  for (const c of copy.cases)
    if (c.preparation === "manual")
      c.confirmed_region = { x: 0.1, y: 0.1, width: 0.8, height: 0.8 };
  fs.writeFileSync(f, JSON.stringify(copy));
  assert.equal(readManifest(f).cases.length, 24);
});
test("raw screenshot/photo controls cannot be relabeled as isolated acceptances", (t) => {
  const root = temp(t),
    m = structuredClone(require("../docs/benchmark/manifest.example.json"));
  for (const c of m.cases)
    if (c.preparation === "manual")
      c.confirmed_region = { x: 0.1, y: 0.1, width: 0.8, height: 0.8 };
  m.cases.find((c) => c.category === "screenshot").ground_truth = "accept";
  const f = path.join(root, "manifest.json");
  fs.writeFileSync(f, JSON.stringify(m));
  assert.throws(() => readManifest(f));
});
test("ROI metrics distinguish proposal IoU, painting-edge preservation and absent proposal", () => {
  const e = { x: 0.2, y: 0.2, width: 0.6, height: 0.6 };
  assert.equal(roiMetrics(e, e).iou, 1);
  assert.equal(roiMetrics(e, e).paintingCoverage, 1);
  const smaller = { x: 0.3, y: 0.3, width: 0.4, height: 0.4 };
  assert(roiMetrics(smaller, e).edgeLoss.left > 0);
  assert(roiMetrics(smaller, e).paintingCoverage < 1);
  assert.equal(roiMetrics(null, e).proposed, false);
  assert.equal(roiMetrics(e, null), null);
});
test("private paths must be outside every Git checkout; traversal/remote/symlink escape rejected", (t) => {
  assert.throws(() => external(path.join(ROOT, ".benchmark-private")));
  const root = temp(t);
  fs.writeFileSync(path.join(root, "a.png"), "x");
  for (const file of ["../a.png", "https://example.test/a.png", "/tmp/a.png"])
    assert.throws(() => localFile(root, file));
  const other = temp(t);
  fs.writeFileSync(path.join(other, "x"), "x");
  fs.symlinkSync(path.join(other, "x"), path.join(root, "escape"));
  assert.throws(() => localFile(root, "escape"));
});
test("private writes use mode 0600 and reject symlinks", (t) => {
  const root = temp(t),
    file = path.join(root, "private.json");
  writePrivate(file, { test: 1 });
  assert.equal(fs.statSync(file).mode & 0o777, 0o600);
  fs.symlinkSync(file, path.join(root, "link"));
  assert.throws(() => writePrivate(path.join(root, "link"), "bad"));
});
test("review excerpts strip URLs, email, key-shaped text and bound length", () => {
  const text = excerpt(
    "sk-example-secret person@example.invalid https://example.invalid/private " +
      "a".repeat(1000),
  );
  assert(!text.includes("example-secret"));
  assert(!text.includes("@"));
  assert(!text.includes("https:"));
  assert.equal(text.length, 500);
});
test("report emits reproducible blind worksheets, CSV, category errors and no invented winner", async (t) => {
  const f = fixture(t);
  await run({ ...f, live: true, confirmCost: true }, mockTransport([]), env);
  const r = report(f);
  assert.equal(r.completed, 12);
  assert(r.recommendation.includes("Pending"));
  const html = fs.readFileSync(
    path.join(f.output, "blind-review.html"),
    "utf8",
  );
  for (const a of ARMS) assert(!html.includes(a.id) && !html.includes(a.model));
  assert(html.includes("R1") && html.includes("R2"));
  assert.equal(
    JSON.parse(fs.readFileSync(path.join(f.output, "ratings.template.json")))
      .reviews.length,
    24,
  );
  const sum = JSON.parse(fs.readFileSync(path.join(f.output, "summary.json")));
  assert.equal(sum.arms[0].n, 3);
  assert.equal(sum.arms[0].costUSD.perReviewedUsable, null);
  assert(sum.arms[0].confusion.watercolor.accept.accepted === 3);
  const before = html;
  report(f);
  assert.equal(
    fs.readFileSync(path.join(f.output, "blind-review.html"), "utf8"),
    before,
  );
});
test("rating requires two independent individual reviews, domain scores and evidence", () => {
  assert.throws(() =>
    reviewRows(
      { reviews: [{ blindID: "V1", reviewer: "R1", scores: { A: 5 } }] },
      new Set(["V1"]),
    ),
  );
  assert.throws(() =>
    reviewRows({ reviews: [{ blindID: "unknown" }] }, new Set(["V1"])),
  );
});
test("human disagreement and usable cost calculated separately from API success", () => {
  const r = {
      caseID: "C01",
      key: "C01:baseline_low",
      armID: "baseline_low",
      outcome: "accepted",
      strictSchema: true,
      canonicalValid: true,
      finishReason: "stop",
      latencyMs: 100,
      outputWords: 100,
      usage: { usd: 0.1 },
    },
    c = {
      case_id: "C01",
      category: "watercolor",
      ground_truth: "accept",
      watercolor_status: "confirmed",
    },
    mapping = [{ blindID: "v", armID: "baseline_low", key: r.key }];
  const scores = ["R1", "R2"].map((reviewer, i) => ({
    blindID: "v",
    reviewer,
    scores: Object.fromEntries(
      Object.keys(require("../scripts/benchmark/report.cjs").DOMAINS).map(
        (k) => [k, i ? 4 : 5],
      ),
    ),
    hallucination: false,
    originalProcessClaim: false,
    visuallyGrounded: true,
    uiUsable: true,
  }));
  const s = statistics([r], [c], scores, mapping)[0];
  assert.equal(s.agreement[0].absoluteDifferences.B, 1);
  assert.equal(s.costUSD.perReviewedUsable, 0.1);
  scores[0].hallucination = true;
  assert.equal(
    statistics([r], [c], scores, mapping)[0].costUSD.perReviewedUsable,
    null,
  );
});
test("screenshot/photo false acceptance separate from watercolor recall", () => {
  const cases = [
      {
        case_id: "A",
        category: "screenshot",
        ground_truth: "reject",
        watercolor_status: "not_watercolor",
      },
      {
        case_id: "B",
        category: "watercolor",
        ground_truth: "accept",
        watercolor_status: "confirmed",
      },
    ],
    rows = cases.map((c) => ({
      caseID: c.case_id,
      armID: "baseline_low",
      outcome: "accepted",
      canonicalValid: true,
    }));
  const s = statistics(rows, cases, [], [])[0];
  assert.equal(s.falseAcceptanceCount, 1);
  assert.equal(s.acceptedAndCritiquedNonPainting, 1);
  assert.equal(s.watercolorRecall, 1);
  assert.equal(s.eligibilityPrecision, 0.5);
});
test("metrics do not turn missing data into zero latency or a price winner", () => {
  assert.equal(percentile([], 0.95), null);
  assert(
    recommendation(
      ARMS.map(() => ({ n: 0 })),
      24,
    ).includes("Pending"),
  );
  assert(csv("=formula").startsWith("\"'"));
});
for (const argv of [
  ["run", "--confirm-cost"],
  ["run", "--live", "--dry-run"],
  ["run", "--key", "secret"],
  ["prepare", "--live"],
  ["run", "--prepared"],
])
  test("CLI rejects unsafe/ambiguous args " + argv.join(" "), () =>
    assert.throws(() => args(argv)),
  );
test("production boundaries unchanged; no SDK, DB, storage or hidden provider fallback in tool", () => {
  const source = fs.readFileSync(
    path.join(ROOT, "scripts/benchmark/runner.cjs"),
    "utf8",
  );
  assert(
    !/supabase|complete_openai_feedback|generate-feedback|retry\(/.test(source),
  );
  assert.equal((source.match(/await transport\(/g) || []).length, 1);
  const entry = fs.readFileSync(
    path.join(ROOT, "supabase/functions/generate-feedback/index.ts"),
    "utf8",
  );
  assert(entry.includes('model: "gpt-4.1-mini"'));
  assert(entry.includes("max_completion_tokens: 3000"));
  assert(entry.includes('detail: "low"'));
});

test("review includes bounded original rationale and actual colour/value teaching", () => {
  const v = payload(),
    r = evaluate(v, p),
    raw = accepted().analysis;
  assert.equal(
    r.teachingSummary.valueHierarchy,
    raw.colourValue.colourAnalysis.valueHierarchy,
  );
  assert(r.teachingSummary.rationale.length > 0);
  assert(r.teachingSummary.colour.colourStrategy.length > 0);
});
test("zero-affordable-call experiment still produces an honest empty report", async (t) => {
  const f = fixture(t),
    calls = [];
  for (const a of ARMS) f.rates.arms[a.id].output = 2000;
  await run({ ...f, live: true, confirmCost: true }, mockTransport(calls), env);
  const r = report(f);
  assert.equal(r.completed, 0);
  assert(r.recommendation.includes("Pending"));
  assert.equal(calls.length, 0);
});

test("every-call source verification detects drift without recompiling or changing production", () => {
  const {
    verifyProductionFiles,
  } = require("../scripts/benchmark/production.cjs");
  verifyProductionFiles(p.identity);
  const changed = structuredClone(p.identity);
  changed.sources["lib/prepareArtwork.ts"] = "not-the-locked-source";
  assert.throws(() => verifyProductionFiles(changed));
});
