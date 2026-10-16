const test = require("node:test"),
  assert = require("node:assert/strict"),
  fs = require("node:fs"),
  path = require("node:path"),
  ts = require("typescript");
const fixture = require("./helpers/provider-draft-fixture.cjs");
const { loadShared } = require("./helpers/shared-loader.cjs");
const draft = loadShared(
  "../shared/providerPaintingAnalysis.ts",
  "lib/overlays.ts",
);
const painting = loadShared("../shared/paintingAnalysis.ts", "lib/overlays.ts");
const teaching = loadShared(
  "../shared/coachingWorkspace.ts",
  "lib/overlays.ts",
);
const language = loadShared("../shared/coachingLanguage.ts", "lib/overlays.ts");
const evidence = loadShared("../shared/coachingEvidence.ts", "lib/overlays.ts");
const overlays = {};
new Function(
  "exports",
  "require",
  ts.transpileModule(
    fs.readFileSync(path.join(__dirname, "../lib/overlays.ts"), "utf8"),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
      },
    },
  ).outputText,
)(overlays, (name) => loadShared(name, "lib/overlays.ts"));
function normalized(raw = fixture()) {
  const before = structuredClone(raw),
    result = draft.normalizeProviderPaintingAnalysis(raw);
  assert(result.ok, JSON.stringify(result));
  const value = painting.cleanPaintingAnalysis(
    result.result,
    overlays.usableOverlays,
  );
  assert(
    painting.validPaintingAnalysis(value),
    JSON.stringify(painting.canonicalValidationIssue(value)),
  );
  assert.deepEqual(
    raw,
    before,
    "normalization never mutates the provider document",
  );
  return value;
}
function schema() {
  return draft.providerPaintingAnalysisSchema({
    structure: { type: ["object", "null"] },
    brush: { type: ["array", "null"] },
  });
}
function checkSchema(s, v, root = s) {
  if (s.$ref) return checkSchema(root.$defs[s.$ref.split("/").at(-1)], v, root);
  const types = [].concat(s.type ?? []),
    kind = v === null ? "null" : Array.isArray(v) ? "array" : typeof v;
  if (types.length)
    assert(
      types.includes(kind) ||
        (Number.isInteger(v) && types.includes("integer")),
      `type ${kind}`,
    );
  if (v === null) return;
  if (s.enum) assert(s.enum.includes(v));
  if (typeof v === "string") {
    if (s.maxLength) assert(v.length <= s.maxLength);
    if (s.minLength) assert(v.length >= s.minLength);
  }
  if (typeof v === "number") {
    if (s.minimum !== undefined) assert(v >= s.minimum);
    if (s.maximum !== undefined) assert(v <= s.maximum);
  }
  if (Array.isArray(v)) {
    if (s.maxItems !== undefined) assert(v.length <= s.maxItems);
    if (s.minItems !== undefined) assert(v.length >= s.minItems);
    if (s.items) v.forEach((x) => checkSchema(s.items, x, root));
  } else if (typeof v === "object" && s.properties) {
    assert.equal(s.additionalProperties, false);
    assert.deepEqual([...s.required].sort(), Object.keys(s.properties).sort());
    for (const key of s.required) assert(Object.hasOwn(v, key), key);
    for (const [key, x] of Object.entries(v)) {
      assert(s.properties[key], key);
      checkSchema(s.properties[key], x, root);
    }
  }
}
test("provider draft fixture satisfies the strict provider shape without global IDs or expert views", () => {
  checkSchema(schema(), fixture());
  const json = JSON.stringify(schema());
  for (const name of [
    "id",
    "domain",
    "factIds",
    "roleId",
    "insightId",
    "summaryId",
    "insightIds",
    "expertViews",
    "canonicalAnalysis",
    "version",
  ])
    assert(!json.includes(`\"${name}\":`), name);
});
test("canonical v1 is built server-side from local facts and references", () => {
  const value = normalized();
  assert.equal(value.canonicalAnalysis.version, 1);
  assert.deepEqual(Object.keys(value.expertViews), painting.expertViewKeys);
  assert.equal(value.canonicalAnalysis.facts[0].id, "fact_overall_1");
  assert.equal(value.canonicalAnalysis.insights[3].id, "insight_technique_1");
});
test("deterministic IDs, links and generated views are stable", () =>
  assert.deepEqual(normalized(), normalized()));
for (const [key, domain] of [
  ["overall", "overall"],
  ["composition", "composition"],
  ["colourValue", "colour_value"],
  ["technique", "technique"],
]) {
  test(`${key}: summary and every selected insight belong only to the inferred domain`, () => {
    const value = normalized(),
      view = value.expertViews[key];
    assert(view.insightIds.includes(view.summaryId));
    assert.equal(new Set(view.insightIds).size, view.insightIds.length);
    for (const id of view.insightIds)
      assert.equal(
        value.canonicalAnalysis.insights.find((i) => i.id === id).domain,
        domain,
      );
  });
  test(`${key}: missing essential content is a fixed missing_domain failure`, () => {
    const raw = fixture();
    delete raw[key];
    assert.deepEqual(draft.normalizeProviderPaintingAnalysis(raw), {
      ok: false,
      reason: "missing_domain",
    });
  });
  test(`${key}: invalid optional practice becomes empty without a core failure`, () => {
    const raw = fixture();
    raw[key].practice = { bad: true };
    assert.equal(normalized(raw).expertViews[key].practice, "");
  });
}
test("a supplied meaningful refinement can be summary without inventing a second report", () => {
  const raw = fixture();
  raw.composition.insights.push({
    ...raw.composition.insights[0],
    classification: "optional_refinement",
    lesson: "Background accents compete with the tower.",
    action:
      "On a separate study, quiet background accents; compare focal clarity.",
  });
  const value = normalized(raw);
  assert.equal(
    value.expertViews.composition.summaryId,
    "insight_composition_2",
  );
  assert.deepEqual(value.expertViews.composition.insightIds, [
    "insight_composition_1",
    "insight_composition_2",
  ]);
});
for (const ref of [-1, 2, 0.5, "0", null])
  test(`invalid required local fact index ${ref} stays fatal`, () => {
    const raw = fixture();
    raw.technique.insights[0].factRefs = [ref];
    assert.equal(
      draft.normalizeProviderPaintingAnalysis(raw).reason,
      "unrecoverable_reference",
    );
  });
test("duplicate local references are de-duplicated without a provider retry", () => {
  const raw = fixture();
  raw.technique.insights[0].factRefs = [0, 0];
  assert.deepEqual(normalized(raw).canonicalAnalysis.insights[3].factIds, [
    "fact_technique_1",
  ]);
});
test("ambiguous same-area focal/quiet roles are omitted without killing useful text", () => {
  const raw = fixture();
  raw.visualRoles.push({ ...raw.visualRoles[0], role: "quiet" });
  const value = normalized(raw);
  assert(!value.canonicalAnalysis.visualRoles.some((r) => r.area === "tower"));
  assert.equal(value.canonicalAnalysis.facts[0].roleId, null);
});
test("multiple focal candidates are not arbitrarily demoted into supporting roles", () => {
  const raw = fixture();
  raw.visualRoles[1].role = "focal";
  const value = normalized(raw);
  assert(
    !value.canonicalAnalysis.visualRoles.some((r) =>
      ["tower", "bank"].includes(r.area),
    ),
  );
  assert.equal(value.canonicalAnalysis.facts[1].roleId, null);
});
test("duplicate compatible roles use the most reliable supplied row and remap local role indexes", () => {
  const raw = fixture();
  raw.visualRoles.push({ ...raw.visualRoles[0], confidence: 0.99 });
  raw.overall.facts[0].roleIndex = 3;
  const value = normalized(raw);
  assert.equal(value.canonicalAnalysis.visualRoles.length, 3);
  assert.equal(value.canonicalAnalysis.facts[0].roleId, "role_4");
  assert.equal(
    value.canonicalAnalysis.colourAnalysis.visibleColours[0].roleId,
    "role_4",
  );
});
test("equal-confidence conflicting geometry keeps shared role text but no false rectangle", () => {
  const raw = fixture();
  raw.visualRoles.push({
    ...raw.visualRoles[1],
    region: { x: 0.5, y: 0.1, width: 0.2, height: 0.2 },
  });
  const role = normalized(raw).canonicalAnalysis.visualRoles.find(
    (r) => r.area === "bank",
  );
  assert(role);
  assert.equal(role.role, "supporting");
  assert.equal(role.region, null);
});
for (const confidence of [0.2, null, "unknown"])
  test(`uncertain focal region ${confidence} is omitted without losing text`, () => {
    const raw = fixture();
    raw.visualRoles[0].confidence = confidence;
    const value = normalized(raw);
    const role = value.canonicalAnalysis.visualRoles.find(
      (r) => r.area === "tower",
    );
    assert.equal(role.region, null);
    assert.equal(role.role, "focal");
  });
for (const field of ["visualRoles", "brushPlan"])
  test(`malformed optional ${field} never destroys the analysis`, () => {
    const raw = fixture();
    raw[field] = { bad: true };
    normalized(raw);
  });
for (const field of ["primary", "secondary"])
  test(`malformed optional composition ${field} is independently dropped`, () => {
    const raw = fixture();
    raw.compositionStructure[field] = { bad: true };
    assert.equal(normalized(raw).canonicalAnalysis.composition[field], null);
  });
for (const bad of [
  null,
  "unknown",
  [null],
  [{ insightIndex: 99, label: "unsafe" }],
  [
    {
      insightIndex: 0,
      label: "bad region",
      regions: [{ x: 9 }],
      confidence: 0.9,
      timing: "next_study",
    },
  ],
])
  test(`malformed optional visual aids survive: ${JSON.stringify(bad)}`, () => {
    const raw = fixture();
    raw.overall.visualAids = bad;
    assert.deepEqual(normalized(raw).canonicalAnalysis.visualEvidence, []);
  });
test("malformed optional colour source role or region is safe and does not create geometry", () => {
  const raw = fixture();
  raw.colourValue.colourAnalysis.visibleColours[0].roleIndex = 99;
  raw.colourValue.colourAnalysis.visibleColours[0].region = { x: 5 };
  const value = normalized(raw);
  assert.equal(
    value.canonicalAnalysis.colourAnalysis.visibleColours[0].roleId,
    null,
  );
});
test("optional local visual links get deterministic IDs and exact supplied normalized geometry", () => {
  const raw = fixture(),
    value = normalized(raw),
    note = value.canonicalAnalysis.visualEvidence[0];
  assert.equal(note.insightId, "insight_overall_1");
  assert.equal(note.note.id, "note_overall_1");
  assert.deepEqual(note.note.region, raw.overall.visualAids[0].regions[0]);
});
test("invalid optional visual insight index is dropped rather than repaired using prose", () => {
  const raw = fixture();
  raw.overall.visualAids[0].insightIndex = 99;
  assert.deepEqual(normalized(raw).canonicalAnalysis.visualEvidence, []);
});
test("the three-note budget prioritises supplied corrections above earlier strength aids", () => {
  const raw = fixture();
  for (const key of ["composition", "colourValue", "technique"])
    raw[key].visualAids = [
      {
        insightIndex: 0,
        label: `${key} evidence`,
        regions: [raw.visualRoles[raw[key].facts[0].roleIndex].region],
        confidence: 0.9,
        timing: "next_study",
      },
    ];
  raw.technique.facts[0].observation =
    "The tower roof accents collide and weaken its clear silhouette.";
  Object.assign(raw.technique.insights[0], {
    classification: "clear_issue",
    lesson: "Crowded roof marks weaken the focal silhouette.",
    action:
      "On a separate study, compare one simplified tower silhouette with the current roof accents.",
  });
  const notes = normalized(raw).canonicalAnalysis.visualEvidence;
  assert.equal(notes.length, 3);
  assert.equal(notes[0].insightId, "insight_technique_1");
});
test("all views keep the same canonical roles and Composition Lock", () => {
  const value = normalized();
  for (const key of painting.expertViewKeys) {
    const view = painting.projectPaintingAnalysis(value, key);
    assert.deepEqual(
      view.compositionOverlay,
      value.canonicalAnalysis.composition.primary,
    );
    assert.deepEqual(
      view.coachingDecision.visualRoles,
      value.canonicalAnalysis.visualRoles.map(({ area, role }) => ({
        area,
        role,
      })),
    );
  }
});
test("normalization has zero provider calls, uploads or database writes", () => {
  const previous = global.fetch;
  let calls = 0;
  global.fetch = () => {
    calls++;
    throw Error("Unexpected I/O");
  };
  try {
    normalized();
    assert.equal(calls, 0);
  } finally {
    global.fetch = previous;
  }
  const source = fs.readFileSync(
    path.join(__dirname, "../shared/providerPaintingAnalysis.ts"),
    "utf8",
  );
  assert(!/\b(?:fetch|createClient|upload|rpc|writeFile)\s*\(/.test(source));
});
test("fixed failure enum cannot return arbitrary user/model prose", () => {
  for (const raw of ["PRIVATE MODEL TEXT", "a@b.invalid", {}, null])
    assert(
      draft.providerFailureReasons.includes(
        draft.safeProviderFailureReason(raw),
      ),
    );
});
for (const level of ["highly_resolved", "strong"])
  test(`${level} draft may have zero corrections`, () => {
    const raw = fixture();
    raw.qualityAssessment.level = level;
    assert.equal(
      teaching.workspaceTeaching(normalized(raw)).recommendations.length,
      0,
    );
  });
test("boat-like competent draft surfaces its supplied integration opportunity", () => {
  const raw = fixture();
  raw.qualityAssessment.level = "competent";
  raw.colourValue.facts[0].observation =
    "The horizontal bands read separately and the boat seems detached from their shared spatial field.";
  Object.assign(raw.colourValue.insights[0], {
    classification: "optional_refinement",
    lesson: "Disconnected value bands weaken the boat's spatial integration.",
    action:
      "On scrap paper, connect the lower bands in one middle value and quiet one separating edge; compare whether the boat feels embedded.",
  });
  const t = teaching.workspaceTeaching(normalized(raw));
  assert.equal(t.recommendations[0].label, "Main opportunity");
  assert.match(t.recommendations[0].insight.action, /connect.*bands/);
});
test("developing draft can prioritise supplied foundational value grouping", () => {
  const raw = fixture();
  raw.qualityAssessment.level = "developing";
  raw.colourValue.facts[0].observation =
    "Disconnected foreground shadow shapes compete with the tower and weaken focal separation.";
  Object.assign(raw.colourValue.insights[0], {
    classification: "clear_issue",
    lesson: "Connected shadow values would clarify the focal light.",
    action:
      "On scrap, group the foreground darks into one connected mass; compare focal clarity.",
  });
  assert.equal(
    teaching.workspaceTeaching(normalized(raw)).recommendations[0].label,
    "Main opportunity",
  );
});
test("combined colour intensity and central placement preserves only the transferable supplied principle", () => {
  assert.equal(
    language.transferablePreservation(
      "Preserve the van's colour intensity and central placement.",
    ),
    "Preserve the van's colour intensity.",
  );
  assert.equal(
    language.transferablePreservation(
      "Preserve the van's central placement and colour intensity.",
    ),
    "Preserve the van's colour intensity.",
  );
});
test("strong-work elevation is capped at two sophisticated opportunities", () => {
  const raw = fixture();
  raw.qualityAssessment.level = "strong";
  for (const [key, lesson, action] of [
    [
      "composition",
      "Repeated bank marks could have a less regular rhythm.",
      "On scrap, vary the foreground mark spacing and compare the flow.",
    ],
    [
      "colourValue",
      "Supporting cool passages could have a narrower chroma range.",
      "On scrap, reduce bank chroma and compare focal colour separation.",
    ],
    [
      "technique",
      "Upper contours could have more selective softness.",
      "On scrap, soften selected background edges and compare recession.",
    ],
  ])
    Object.assign(raw[key].insights[0], {
      classification: "optional_refinement",
      lesson,
      action,
    });
  raw.composition.facts[0].observation =
    "Overly regular foreground bank mark spacing flattens its visual rhythm.";
  raw.colourValue.facts[0].observation =
    "The bank's cool passages compete with the focal tower through excessive chroma.";
  raw.technique.facts[0].observation =
    "Hard upper background contours are abrupt and flatten atmospheric recession.";
  assert.equal(
    teaching.workspaceTeaching(normalized(raw)).recommendations.length,
    2,
  );
});
test("rationale drops incomplete trailing fragment, retaining complete supplied evidence", () => {
  assert.equal(
    language.qualityRationaleText(
      "Clear value grouping supports the focal house. Value contrasts and a",
    ),
    "Clear value grouping supports the focal house.",
  );
});
test("an isolated unfinished rationale is not displayed as a completed judgement", () => {
  assert.equal(language.qualityRationaleText("Value contrasts and a"), "");
});
test("supplied actionable perspective critique appears in elevation, not hidden or duplicated in rationale", () => {
  const raw = fixture();
  raw.qualityAssessment.level = "competent";
  raw.qualityAssessment.rationale =
    "Clear light creates hierarchy. Perspective inaccuracies limit the building's spatial clarity.";
  raw.composition.facts[0].observation =
    "The right roof alignment disrupts the building's perspective.";
  Object.assign(raw.composition.insights[0], {
    classification: "clear_issue",
    lesson: "Misaligned roof angles disrupt structural depth.",
    action:
      "On a separate study, align the right roof slopes to one vanishing direction; compare structural clarity.",
  });
  const value = normalized(raw);
  assert.equal(
    value.canonicalAnalysis.qualityAssessment.rationale,
    "Clear light creates hierarchy.",
  );
  assert.match(
    teaching.workspaceTeaching(value).recommendations[0].insight.action,
    /align the right roof/,
  );
});
test("obvious vehicle anatomy wording becomes drawing terminology", () => {
  assert.equal(
    evidence.observationText(
      "Anatomical inaccuracies in the van weaken its structure.",
    ),
    "Drawing inaccuracies in the van weaken its structure.",
  );
});
test("actual human or animal anatomy remains legitimate", () => {
  const text = "Anatomical proportions of the horse make its gesture readable.";
  assert.equal(evidence.observationText(text), text);
});
for (const text of [
  "Solid control of watercolor techniques.",
  "Using layered washes.",
  "with more controlled for van details.",
])
  test(`unsafe or malformed technique sentence is omitted: ${text}`, () =>
    assert.equal(evidence.observationText(text), ""));
test("soft washes are described as a visible effect rather than proof of process", () =>
  assert.equal(
    evidence.observationText("Effective use of soft washes creates depth."),
    "Soft-edged colour passages create depth.",
  ));
test("an explicitly suggested layering practice is not mistaken for original process history", () => {
  const text =
    "Try using layered washes on scrap paper after each layer dries.";
  assert.equal(evidence.observationText(text), text);
});
test("separate scrap-paper layering practice remains allowed", () => {
  const text =
    "On scrap watercolor paper, compare two depths using layered washes after each dries.";
  assert.equal(evidence.observationText(text), text);
});
test("valid visible edge evidence survives malformed extra fragment", () =>
  assert.equal(
    evidence.observationText(
      "Soft mountain edges support the crisp van. with more controlled for van details.",
    ),
    "Soft mountain edges support the crisp van.",
  ));
test("a domain survives one omitted malformed technique fact when other supplied evidence remains", () => {
  const raw = fixture();
  raw.technique.facts.push({
    observation: "with more controlled for van details.",
    roleIndex: null,
  });
  normalized(raw);
});
test("an unrecoverably empty required technique domain stays fatal", () => {
  const raw = fixture();
  raw.technique.facts[0].observation = "with more controlled for van details.";
  assert.equal(
    draft.normalizeProviderPaintingAnalysis(raw).reason,
    "core_text",
  );
});
test("generic decorative figure suggestion is suppressed", () => {
  const raw = fixture();
  raw.composition.insights.push({
    ...raw.composition.insights[0],
    classification: "study_experiment",
    lesson: "A figure would add interest.",
    action: "Add figures; compare with no figures.",
  });
  const t = teaching.workspaceTeaching(normalized(raw));
  assert(!t.studies.some((i) => /Add figures/.test(i.action)));
});
test("purposeful subordinate figures can be proposed in a separate architectural study", () => {
  const raw = fixture();
  raw.composition.insights.push({
    ...raw.composition.insights[0],
    classification: "study_experiment",
    lesson: "Two tiny figures could establish human scale on the approach.",
    action:
      "On scrap, add two low-detail figures at the lower-left approach, one-tenth tower height and lower contrast; compare human scale with no figures.",
  });
  const t = teaching.workspaceTeaching(normalized(raw));
  assert(t.studies.some((i) => /human scale/.test(i.lesson)));
  assert.match(
    t.studies.find((i) => /human scale/.test(i.lesson)).action,
    /separate|scrap/,
  );
});
test("provider self-check requires quality/improvement consistency without a frontend count classifier", () => {
  const prompt = fs
    .readFileSync(
      path.join(__dirname, "../supabase/functions/_shared/prompts.ts"),
      "utf8",
    )
    .split("import type")[0];
  for (const phrase of [
    "Does the quality level agree",
    "reconsider Strong",
    "WHAT/WHERE",
    "HOW MUCH",
    "WHY/EFFECT",
    "HOW to test",
    "add/remove/quiet/connect",
    "never default opaque white",
  ])
    assert(prompt.includes(phrase), phrase);
});
