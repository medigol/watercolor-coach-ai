const test = require("node:test"),
  assert = require("node:assert/strict"),
  fs = require("node:fs"),
  path = require("node:path"),
  ts = require("typescript");
const { loadShared } = require("./helpers/shared-loader.cjs"),
  fixture = require("./helpers/canonical-fixture.cjs");
const painting = loadShared("../shared/paintingAnalysis.ts", "lib/overlays.ts");
function load(file, stubs = {}) {
  const out = {};
  new Function(
    "exports",
    "require",
    ts.transpileModule(
      fs.readFileSync(path.join(__dirname, "..", file), "utf8"),
      {
        compilerOptions: {
          module: ts.ModuleKind.CommonJS,
          target: ts.ScriptTarget.ES2022,
        },
      },
    ).outputText,
  )(out, (name) => (name in stubs ? stubs[name] : loadShared(name, file)));
  return out;
}
const notes = load("lib/overlays.ts");
const contract = load("supabase/functions/_shared/contract.ts", {
  "./overlays.ts": notes,
  "./coachingDecision.ts": loadShared(
    "../shared/coachingDecision.ts",
    "lib/overlays.ts",
  ),
});
const clean = (value) =>
  painting.cleanPaintingAnalysis(value, notes.usableOverlays);

test("one versioned envelope has four domain-owned views, facts and insights stored only once", () => {
  const raw = fixture(),
    value = clean(raw);
  assert(painting.validPaintingAnalysis(value));
  assert(contract.validFeedback(value, "improve_painting"));
  assert(!contract.validFeedback(value, "create_reference"));
  assert.equal(value.canonicalAnalysis.version, 1);
  assert.equal(Object.keys(value.expertViews).length, 4);
  for (const view of Object.values(value.expertViews)) {
    assert.deepEqual(Object.keys(view), [
      "summaryId",
      "insightIds",
      "practice",
    ]);
    for (const id of view.insightIds)
      assert(value.canonicalAnalysis.insights.some((i) => i.id === id));
  }
  assert.deepEqual(raw, fixture(), "cleaning does not mutate saved data");
  assert.deepEqual(clean(value), value, "cleaning is stable");
});
for (const key of painting.expertViewKeys)
  test(`${key}: same locked composition and roles with a different owned interpretation`, () => {
    const source = clean(fixture()),
      view = painting.projectPaintingAnalysis(source, key),
      overall = painting.projectPaintingAnalysis(source, "overall");
    assert.deepEqual(view.compositionOverlay, overall.compositionOverlay);
    assert.deepEqual(
      view.secondaryCompositionOverlay,
      overall.secondaryCompositionOverlay,
    );
    assert.deepEqual(
      view.coachingDecision.visualRoles,
      overall.coachingDecision.visualRoles,
    );
    assert.deepEqual(view.overlays, overall.overlays);
    assert.equal(
      view.mainAdvice,
      source.canonicalAnalysis.insights.find(
        (i) => i.id === source.expertViews[key].summaryId,
      ).lesson,
    );
    assert.equal(view.practice, source.expertViews[key].practice);
    assert.deepEqual(view.whatToFix, []);
  });
for (const key of painting.expertViewKeys)
  for (const override of [
    "focalArea",
    "visualRoles",
    "composition",
    "entry",
    "path",
    "landing",
    "geometry",
    "qualityAssessment",
  ])
    test(`${key}: cannot supply independent ${override}`, () => {
      const raw = fixture();
      raw.expertViews[key][override] = "replacement";
      assert(!painting.validPaintingAnalysis(raw));
      assert(!contract.validFeedback(clean(raw), "improve_painting"));
    });
for (const [name, mutate] of [
  ["unsupported version", (r) => (r.canonicalAnalysis.version = 2)],
  ["missing required view", (r) => delete r.expertViews.technique],
  [
    "missing fact",
    (r) => (r.canonicalAnalysis.insights[0].factIds = ["absent"]),
  ],
  [
    "cross-domain view",
    (r) => (r.expertViews.colourValue.summaryId = "design"),
  ],
  ["duplicate insight", (r) => (r.canonicalAnalysis.insights[1].id = "whole")],
  [
    "two focal groups",
    (r) => (r.canonicalAnalysis.visualRoles[1].role = "focal"),
  ],
  [
    "empty required lesson",
    (r) => (r.canonicalAnalysis.insights[1].lesson = ""),
  ],
  ["missing quality", (r) => delete r.canonicalAnalysis.qualityAssessment],
  [
    "overlong practice",
    (r) => (r.expertViews.technique.practice = "x".repeat(241)),
  ],
  ["truncated core", (r) => delete r.canonicalAnalysis.facts],
])
  test(`required canonical data rejects ${name} explicitly`, () => {
    const r = fixture();
    mutate(r);
    assert(!contract.validFeedback(clean(r), "improve_painting"));
  });
test("malformed optional geometry, notes, palette and method plan preserve required teaching", () => {
  const r = fixture();
  r.canonicalAnalysis.composition.primary = { bad: true };
  r.canonicalAnalysis.composition.secondary = { bad: true };
  r.canonicalAnalysis.visualRoles[0].region = {
    x: 10,
    y: 2,
    width: 5,
    height: 9,
  };
  r.canonicalAnalysis.visualEvidence = [
    { roleId: "missing", note: {} },
    { roleId: null, note: { x: 900 } },
  ];
  r.canonicalAnalysis.palette = [{ name: "Unsafe", hex: "url(bad)", use: "x" }];
  r.canonicalAnalysis.brushPlan = [{ technique: "invented" }];
  const result = clean(r);
  assert(painting.validPaintingAnalysis(result));
  assert.equal(result.canonicalAnalysis.composition.primary, null);
  assert.equal(result.canonicalAnalysis.composition.secondary, null);
  assert.equal(result.canonicalAnalysis.visualRoles[0].region, null);
  assert.deepEqual(result.canonicalAnalysis.visualEvidence, []);
  assert.equal(result.canonicalAnalysis.palette, null);
  assert.equal(result.canonicalAnalysis.brushPlan, null);
});
test("duplicate secondary structure is omitted even with another name and prose", () => {
  const r = fixture();
  r.canonicalAnalysis.composition.secondary = {
    ...r.canonicalAnalysis.composition.primary,
    type: "off_centre",
    confidence: 0.8,
    shortExplanation: "Another label on the same anchors.",
  };
  assert.equal(clean(r).canonicalAnalysis.composition.secondary, null);
});
test("distinct secondary structure is kept without changing canonical role map", () => {
  const r = fixture();
  r.canonicalAnalysis.composition.secondary = {
    ...r.canonicalAnalysis.composition.primary,
    type: "off_centre",
    paths: null,
  };
  const c = clean(r);
  assert.equal(c.canonicalAnalysis.composition.secondary.type, "off_centre");
  for (const key of painting.expertViewKeys)
    assert.deepEqual(
      painting.projectPaintingAnalysis(c, key).secondaryCompositionOverlay,
      c.canonicalAnalysis.composition.secondary,
    );
});
test("diagonal rendering reduces ordered canonical anchors to entry and landing", () => {
  const result = clean(fixture());
  assert.deepEqual(result.canonicalAnalysis.composition.primary.paths, [
    [
      { x: 0.12, y: 0.85 },
      { x: 0.67, y: 0.36 },
    ],
  ]);
});
test("highly resolved painting needs no clear issues, forced correction or filler", () => {
  const c = clean(fixture());
  assert.equal(c.canonicalAnalysis.qualityAssessment.level, "highly_resolved");
  assert(
    !c.canonicalAnalysis.insights.some(
      (i) => i.classification === "clear_issue",
    ),
  );
  for (const key of painting.expertViewKeys) {
    const result = painting.projectPaintingAnalysis(c, key);
    assert.equal(result.coachingMode, "study");
    assert.deepEqual(result.whatToFix, []);
  }
});
test("correction in a strength becomes an explicit study, preserving successful evidence", () => {
  const r = fixture();
  r.canonicalAnalysis.insights[3].action = "Sharpen the water edges.";
  const c = clean(r);
  assert.equal(
    c.canonicalAnalysis.insights[3].classification,
    "study_experiment",
  );
  assert(!painting.projectPaintingAnalysis(c, "technique").whatToFix.length);
});
test("original process claim fails rather than inventing a visible observation", () => {
  const r = fixture();
  r.canonicalAnalysis.facts[3].observation =
    "The artist used a size 12 round brush.";
  assert(!painting.validPaintingAnalysis(clean(r)));
});
test("suggested method remains a recommendation, never a reconstruction", () => {
  const c = clean(fixture());
  assert(c.expertViews.technique.practice.includes("practise one wet-on-wet"));
  assert.equal(
    c.canonicalAnalysis.facts[3].observation,
    fixture().canonicalAnalysis.facts[3].observation,
  );
});
test("view ownership prevents generic cross-domain paragraphs and duplicate summary IDs", () => {
  const r = fixture();
  r.expertViews.technique.insightIds.push("design");
  assert(!painting.validPaintingAnalysis(r));
  const other = fixture();
  other.expertViews.overall.insightIds = ["whole", "whole"];
  assert(!painting.validPaintingAnalysis(other));
});
test("model strict schema requires every member with bounded nullable optional aids", () => {
  const schema = contract.feedbackSchema("improve_painting");
  function visit(s) {
    if (s.properties) {
      assert.equal(s.additionalProperties, false);
      assert.deepEqual(
        [...s.required].sort(),
        Object.keys(s.properties).sort(),
      );
      Object.values(s.properties).forEach(visit);
    }
    if (s.items) visit(s.items);
  }
  visit(schema);
  assert.deepEqual(schema.required, [
    "title",
    "canonicalAnalysis",
    "expertViews",
  ]);
  assert.equal(
    schema.properties.canonicalAnalysis.properties.version.enum[0],
    1,
  );
  assert.equal(
    schema.properties.expertViews.properties.overall.properties.insightIds
      .maxItems,
    2,
  );
  assert.equal(
    schema.properties.canonicalAnalysis.properties.visualEvidence.maxItems,
    3,
  );
});
test("legacy text stays legacy, never fabricated canonical geometry or hidden analysis", () => {
  const legacy = load("data/mockResults.ts").improveResult;
  assert(!painting.hasPaintingAnalysis(legacy));
  assert(contract.validFeedback(legacy, "improve_painting"));
  assert.deepEqual(contract.cleanFeedback(legacy, "improve_painting"), legacy);
});

test("role geometry confidence can be discarded without rejecting core facts", () => {
  const r = fixture();
  r.canonicalAnalysis.visualRoles[0].confidence = "unknown";
  const c = clean(r);
  assert(painting.validPaintingAnalysis(c));
  assert.equal(c.canonicalAnalysis.visualRoles[0].confidence, null);
});
test("an optional focal overlay outside the authoritative focal region is omitted", () => {
  const r = fixture();
  r.canonicalAnalysis.composition.primary.focalPoint = { x: 0.1, y: 0.9 };
  const c = clean(r);
  assert(painting.validPaintingAnalysis(c));
  assert.equal(c.canonicalAnalysis.composition.primary, null);
  assert.equal(
    c.canonicalAnalysis.composition.observation,
    r.canonicalAnalysis.composition.observation,
  );
});
test("a local evidence crop cannot silently move its canonical role to another region", () => {
  const r = fixture();
  r.canonicalAnalysis.visualEvidence[0].note.region = {
    x: 0.01,
    y: 0.7,
    width: 0.1,
    height: 0.2,
  };
  assert.deepEqual(clean(r).canonicalAnalysis.visualEvidence, []);
});
test("a taste-based suggestion is optional while an evidenced material problem may stay clear", () => {
  const r = fixture();
  r.canonicalAnalysis.insights[2].classification = "clear_issue";
  r.canonicalAnalysis.insights[2].action =
    "Compare more saturation in a separate study.";
  assert.equal(
    clean(r).canonicalAnalysis.insights[2].classification,
    "optional_refinement",
  );
  const issue = fixture();
  issue.canonicalAnalysis.qualityAssessment.level = "developing";
  issue.canonicalAnalysis.facts[2].observation =
    "Scattered dark marks on the bank compete with the tower light and weaken its readability.";
  issue.canonicalAnalysis.insights[2] = {
    ...issue.canonicalAnalysis.insights[2],
    classification: "clear_issue",
    lesson: "The scattered darks interrupt the light-to-shadow grouping.",
    action: "Compare one connected bank shadow in a separate thumbnail.",
  };
  assert.equal(
    clean(issue).canonicalAnalysis.insights[2].classification,
    "clear_issue",
  );
  assert.equal(
    painting.projectPaintingAnalysis(clean(issue), "colourValue").whatToFix
      .length,
    1,
  );
});
test("equal emphasis cannot mutate the canonical roles or their shared display", () => {
  const r = fixture();
  r.canonicalAnalysis.insights[2].lesson =
    "Sharpen the bank and water equally to make them focal.";
  r.canonicalAnalysis.insights[2].action = "Increase contrast on the water.";
  const c = clean(r);
  assert.equal(
    c.canonicalAnalysis.insights[2].classification,
    "study_experiment",
  );
  for (const key of painting.expertViewKeys) {
    const p = painting.projectPaintingAnalysis(c, key);
    assert.deepEqual(
      p.coachingDecision.visualRoles,
      c.canonicalAnalysis.visualRoles.map(({ area, role }) => ({ area, role })),
    );
    assert.deepEqual(
      p.compositionOverlay,
      c.canonicalAnalysis.composition.primary,
    );
  }
});
test("copied paragraphs cannot masquerade as four different expert insights", () => {
  const r = fixture();
  r.canonicalAnalysis.insights[2].lesson =
    r.canonicalAnalysis.insights[1].lesson;
  assert(!painting.validPaintingAnalysis(r));
});

test("one successful canonical request uses one quota unit; retries/local views are free; explicit new requests use the normal three-result limit", async () => {
  const { createHandler } = load(
    "supabase/functions/generate-feedback/handler.ts",
    { "../_shared/contract.ts": contract },
  );
  const userId = "10000000-0000-4000-8000-000000000001";
  let used = 0,
    calls = 0,
    fail = false;
  const saved = new Map();
  const handler = createHandler({
    hasOpenAI: true,
    verify: async () => ({ id: userId, token: "test" }),
    existing: async (_u, i) => saved.get(i.request_id) ?? null,
    usage: async () => ({ used, limit: 3 }),
    claim: async () => ({ status: "claimed" }),
    download: async () => new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]),
    generate: async () => {
      calls++;
      if (fail) throw Error("upstream failure");
      return fixture();
    },
    finish: async (_u, i, result) => {
      assert(painting.validPaintingAnalysis(result));
      const row = { id: i.request_id, provider: "openai" };
      if (!saved.has(i.request_id)) {
        used++;
        saved.set(i.request_id, row);
      }
      return row;
    },
    release: async () => {},
  });
  const send = (n, focus = "Composition") =>
    handler(
      new Request("https://example.invalid/generate-feedback", {
        method: "POST",
        headers: { Authorization: "Bearer test" },
        body: JSON.stringify({
          request_id: `20000000-0000-4000-8000-${String(n).padStart(12, "0")}`,
          expected_user_id: userId,
          mode: "improve_painting",
          focus_area: focus,
          image_path: userId + "/painting.png",
        }),
      }),
    );
  assert.equal((await send(1)).status, 200);
  assert.equal(used, 1);
  assert.equal(calls, 1);
  for (const key of painting.expertViewKeys) {
    painting.projectPaintingAnalysis(clean(fixture()), key);
    assert.equal((await send(1, painting.expertViewFocus[key])).status, 200);
  }
  assert.equal(used, 1);
  assert.equal(calls, 1);
  fail = true;
  assert.equal((await send(2)).status, 503);
  assert.equal(used, 1);
  fail = false;
  assert.equal((await send(2)).status, 200);
  assert.equal(used, 2);
  assert.equal((await send(3)).status, 200);
  assert.equal(used, 3);
  const before = calls;
  assert.equal((await send(4)).status, 403);
  assert.equal(calls, before);
});
test("a legacy provider response cannot satisfy a new canonical painting request", async () => {
  const { createHandler } = load(
    "supabase/functions/generate-feedback/handler.ts",
    { "../_shared/contract.ts": contract },
  );
  let completed = 0;
  const uid = "10000000-0000-4000-8000-000000000001";
  const handler = createHandler({
    hasOpenAI: true,
    verify: async () => ({ id: uid, token: "test" }),
    existing: async () => null,
    usage: async () => ({ used: 0, limit: 3 }),
    claim: async () => ({ status: "claimed" }),
    download: async () => new Uint8Array(),
    generate: async () => load("data/mockResults.ts").improveResult,
    finish: async () => {
      completed++;
      throw Error("must not save");
    },
    release: async () => {},
  });
  const response = await handler(
    new Request("https://example.invalid", {
      method: "POST",
      headers: { Authorization: "Bearer test" },
      body: JSON.stringify({
        request_id: "20000000-0000-4000-8000-000000000001",
        expected_user_id: uid,
        mode: "improve_painting",
        focus_area: null,
        image_path: uid + "/painting.png",
      }),
    }),
  );
  assert.equal(response.status, 422);
  assert.equal(completed, 0);
});

test("visual notes derive evidence, action, classification, domain and role from IDs, without duplicate verdicts", () => {
  const raw = fixture();
  Object.assign(raw.canonicalAnalysis.visualEvidence[0].note, {
    classification: "clear_issue",
    domain: "technique",
    visualRole: "quiet",
    action: "Sharpen all the water.",
    reason: "The artist used a size 12 brush.",
    evidence: "Another unsupported observation.",
  });
  const c = clean(raw);
  assert.equal(c.canonicalAnalysis.visualEvidence.length, 1);
  const stored = c.canonicalAnalysis.visualEvidence[0].note;
  for (const field of [
    "classification",
    "domain",
    "visualRole",
    "action",
    "reason",
    "evidence",
  ])
    assert(!Object.hasOwn(stored, field));
  const note = painting.projectPaintingAnalysis(c, "composition").overlays[0];
  assert.equal(note.classification, "strength");
  assert.equal(note.domain, "overall");
  assert.equal(note.visualRole, "focal");
  assert.equal(note.action, c.canonicalAnalysis.insights[0].action);
  assert.equal(note.evidence, c.canonicalAnalysis.facts[0].observation);
  assert(!note.reason.includes("artist"));
});
test("an unreferenced note or hidden corrective strength cannot invent a second verdict", () => {
  const raw = fixture();
  raw.canonicalAnalysis.visualEvidence[0].insightId = "missing";
  assert.deepEqual(clean(raw).canonicalAnalysis.visualEvidence, []);
  const other = fixture();
  other.canonicalAnalysis.visualEvidence[0].note.shortInstruction =
    "Sharpen the water.";
  assert.deepEqual(clean(other).canonicalAnalysis.visualEvidence, []);
});
test("painting quality cannot be presented as a personal skill or identity assessment", () => {
  for (const claim of [
    "You are an expert painter.",
    "The user has professional skill.",
    "An experienced artist painted this.",
  ]) {
    const r = fixture();
    r.canonicalAnalysis.qualityAssessment.rationale = claim;
    assert(!painting.validPaintingAnalysis(r));
  }
});
