const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");
const { loadShared } = require("./helpers/shared-loader.cjs");
const root = path.resolve(__dirname, "..");
function load(file, imports = {}) {
  const output = {};
  const code = ts.transpileModule(
    fs.readFileSync(path.join(root, file), "utf8"),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
      },
    },
  ).outputText;
  new Function("exports", "require", code)(output, (name) =>
    name in imports ? imports[name] : loadShared(name, file),
  );
  return output;
}
const visual = loadShared("../shared/visualMetadata.ts", "lib/overlays.ts");
const geometry = loadShared("../shared/imageGeometry.ts", "lib/overlays.ts");
const coaching = loadShared(
  "../shared/coachingDecision.ts",
  "lib/coachingDecision.ts",
);
const overlays = load("lib/overlays.ts");
const contract = load("supabase/functions/_shared/contract.ts", {
  "./overlays.ts": overlays,
  "./coachingDecision.ts": coaching,
});
const samples = load("supabase/functions/_shared/mockResults.ts");
const { coachingPrompt } = load("supabase/functions/_shared/prompts.ts");
const region = { x: 0.3, y: 0.3, width: 0.2, height: 0.25 };
const note = {
  type: "point_marker",
  id: "roof",
  label: "Focal roof",
  x: 40,
  y: 40,
  priority: "high",
  shortInstruction: "Notice the reserved light at the roof.",
  reason: "It anchors the eye against the larger shadow.",
  action: "Preserve this light in a small separate study.",
  region,
  regionConfidence: 0.9,
  classification: "strength",
  domain: "colour_value",
  relatedDomain: "composition",
  visualRole: "focal",
};
const diagonal = {
  type: "diagonal",
  confidence: 0.8,
  shortExplanation:
    "The roof and shoreline carry the eye toward the focal house.",
  paths: [
    [
      { x: 0.1, y: 0.8 },
      { x: 0.7, y: 0.3 },
    ],
  ],
  focalPoint: { x: 0.7, y: 0.3 },
  secondaryPoints: null,
  masses: null,
};
const decision = {
  primaryGoal:
    "Preserve the house as the focal point and keep the trees quiet.",
  primarySubjectOrArea: "house",
  areasToEmphasize: ["house"],
  areasToQuiet: ["trees"],
  currentPaintingAction: null,
  nextStudyAction: "In a separate study, keep the bridge subordinate.",
  supportingObservations: [
    "The house carries the sharpest light-dark separation.",
  ],
  compositionImplication:
    "The bridge leads toward the house without competing.",
  colourImplication: null,
  techniqueImplication: null,
  visualRoles: [
    { area: "house", role: "focal" },
    { area: "bridge", role: "supporting" },
    { area: "trees", role: "quiet" },
  ],
};
for (const mode of ["improve_painting", "create_reference"]) {
  const sample =
    mode === "improve_painting"
      ? samples.improveResult
      : samples.referenceResult;
  test(`${mode}: new optional visual contracts coexist with old, omitted and null fields`, () => {
    for (const extension of [
      {},
      { compositionOverlay: null },
      { compositionOverlay: diagonal, overlays: [note] },
    ]) {
      const clean = contract.cleanFeedback({ ...sample, ...extension }, mode);
      assert(contract.validFeedback(clean, mode));
      if (extension.compositionOverlay)
        assert.deepEqual(clean.compositionOverlay, diagonal);
    }
    const schema = contract.feedbackSchema(mode);
    assert(schema.required.includes("compositionOverlay"));
    for (const key of [
      "region",
      "regionConfidence",
      "classification",
      "domain",
      "relatedDomain",
      "visualRole",
    ])
      assert(schema.properties.overlays.items.required.includes(key));
    assert(schema.properties.coachingDecision.properties.visualRoles);
  });
  test(`${mode}: malformed optional regions and shape parts preserve live text and useful geometry`, () => {
    const clean = contract.cleanFeedback(
      {
        ...sample,
        overlays: [
          { ...note, region: { ...region, x: 2 }, classification: "wrong" },
        ],
        compositionOverlay: {
          ...diagonal,
          paths: [
            diagonal.paths[0],
            [
              { x: -1, y: 0 },
              { x: 1, y: 1 },
            ],
          ],
          masses: [
            {
              points: [
                { x: 0, y: 0 },
                { x: 1, y: 1 },
              ],
              role: "quiet",
            },
          ],
        },
      },
      mode,
    );
    assert(contract.validFeedback(clean, mode));
    assert.equal(clean.overlays[0].region, null);
    assert.equal(clean.overlays[0].classification, undefined);
    assert.equal(clean.overlays[0].shortInstruction, note.shortInstruction);
    assert.deepEqual(clean.compositionOverlay.paths, diagonal.paths);
    assert.equal(clean.compositionOverlay.masses, null);
    assert.equal(geometry.noteRegion(clean.overlays[0]), null);
  });
  test(`${mode}: invalid optional top-level metadata cannot repair invalid required feedback`, () => {
    const clean = contract.cleanFeedback(
      {
        ...sample,
        title: "",
        compositionOverlay: { type: "unrecognized" },
        overlays: [note],
      },
      mode,
    );
    assert(!contract.validFeedback(clean, mode));
  });
}
test("individual optional metadata failures leave the supplied note and valid fields intact", () => {
  const clean = overlays.usableOverlays([
    {
      ...note,
      regionConfidence: Infinity,
      domain: "unknown",
      relatedDomain: "bad",
      visualRole: "admin",
    },
  ])[0];
  assert.equal(clean.region, null);
  assert.equal(clean.regionConfidence, 0);
  assert.equal(clean.domain, undefined);
  assert.equal(clean.relatedDomain, undefined);
  assert.equal(clean.visualRole, undefined);
  assert.equal(clean.classification, "strength");
  assert.equal(clean.x, note.x);
  assert.equal(geometry.noteRegion(clean), null);
});
test("explicit low region confidence never falls back to unrelated legacy bounds", () => {
  const old = {
    ...note,
    type: "region_highlight",
    width: 20,
    height: 20,
    regionConfidence: 0.4,
  };
  assert.equal(geometry.noteRegion(overlays.usableOverlays([old])[0]), null);
  const { region: _region, regionConfidence: _confidence, ...legacy } = old;
  assert(geometry.noteRegion(overlays.usableOverlays([legacy])[0]));
});
test("classification preserves strengths, never invents clear issues, and frames alternatives as future experiments", () => {
  assert.equal(visual.effectiveClassification(note, true), "strength");
  assert.equal(
    visual.effectiveClassification(
      {
        ...note,
        evidence: "The roof and adjacent tree have equal dark accents.",
        classification: "clear_issue",
      },
      true,
    ),
    "optional_refinement",
  );
  assert.equal(visual.effectiveClassification({}, false), "study_experiment");
  for (const classification of ["stylistic_alternative", "study_experiment"])
    assert.equal(
      visual.sanitizeVisualMetadata({
        ...note,
        classification,
        timing: "current_painting",
      }).timing,
      "next_study",
    );
});
test("resolved work can have zero clear issues and specific positive evidence", () => {
  const sample = {
    ...samples.improveResult,
    coachingMode: "study",
    whatToFix: [],
    overlays: [note],
    coachingDecision: decision,
  };
  const clean = contract.cleanFeedback(sample, "improve_painting");
  assert(contract.validFeedback(clean, "improve_painting"));
  assert.deepEqual(clean.whatToFix, []);
  assert.equal(clean.overlays[0].classification, "strength");
  assert(clean.overlays[0].reason.includes("anchors the eye"));
});
test("explicit wrong-domain physical/structural instructions are reclassified once with a related-domain tag", () => {
  const physical = visual.sanitizeVisualMetadata({
    ...note,
    domain: "composition",
    action: "Use a damp brush on wet-on-wet paper.",
  });
  assert.equal(physical.domain, "technique");
  assert.equal(physical.relatedDomain, "composition");
  const structural = visual.sanitizeVisualMetadata({
    ...note,
    domain: "technique",
    action: "Lower the horizon in a separate thumbnail.",
  });
  assert.equal(structural.domain, "composition");
  assert.equal(structural.relatedDomain, "technique");
  const colour = visual.sanitizeVisualMetadata({
    ...note,
    domain: "colour_value",
    action: "Keep the strongest warm/cool contrast near the house.",
  });
  assert.equal(colour.domain, "colour_value");
  assert.equal(
    visual.explicitGuidanceDomain("The distant edges already look soft."),
    null,
  );
});
test("none and uncertain formulae preserve text without drawing stock geometry; mixed may show supplied structure", () => {
  assert(visual.usableCompositionOverlay({ ...diagonal, type: "none" }));
  assert.equal(
    visual.drawableCompositionOverlay({ ...diagonal, type: "none" }),
    null,
  );
  assert.equal(
    visual.drawableCompositionOverlay({ ...diagonal, confidence: 0.64 }),
    null,
  );
  assert.equal(
    visual.drawableCompositionOverlay({
      ...diagonal,
      paths: null,
      focalPoint: null,
    }),
    null,
  );
  assert(visual.drawableCompositionOverlay({ ...diagonal, type: "mixed" }));
  assert.equal(
    visual.drawableCompositionOverlay({
      ...diagonal,
      type: "mixed",
      paths: null,
      focalPoint: null,
    }),
    null,
  );
});
test("named overlays require their own genuine geometric evidence", () => {
  assert(visual.drawableCompositionOverlay(diagonal));
  assert(
    visual.drawableCompositionOverlay({ ...diagonal, type: "rule_of_thirds" }),
  );
  assert.equal(
    visual.drawableCompositionOverlay({
      ...diagonal,
      type: "rule_of_thirds",
      focalPoint: null,
    }),
    null,
  );
  for (const type of [
    "triangle",
    "s_curve",
    "l_shape",
    "u_frame",
    "enclosure",
    "cross",
    "radiating",
    "balanced_masses",
    "three_spot",
  ])
    assert.equal(
      visual.drawableCompositionOverlay({ ...diagonal, type }),
      null,
      type,
    );
  const triangle = {
    ...diagonal,
    type: "triangle",
    paths: [
      [
        { x: 0.1, y: 0.8 },
        { x: 0.5, y: 0.2 },
        { x: 0.8, y: 0.8 },
      ],
    ],
  };
  assert(visual.drawableCompositionOverlay(triangle));
  assert.equal(
    visual.drawableCompositionOverlay({
      ...triangle,
      paths: [
        [
          { x: 0, y: 0 },
          { x: 0.5, y: 0.5 },
          { x: 1, y: 1 },
        ],
      ],
    }),
    null,
  );
});
test("canonical focal/supporting/quiet roles reject conflicting note and composition advice", () => {
  const clean = contract.cleanFeedback(
    {
      ...samples.improveResult,
      coachingDecision: decision,
      overlays: [
        {
          ...note,
          id: "bridge",
          label: "bridge",
          action: "Increase contrast in the bridge.",
          shortInstruction: "Sharpen the bridge.",
        },
        {
          ...note,
          id: "trees",
          label: "trees",
          action: "Darken the trees.",
          shortInstruction: "Sharpen the trees.",
        },
        note,
      ],
      compositionOverlay: {
        ...diagonal,
        shortExplanation: "Sharpen the trees.",
      },
    },
    "improve_painting",
  );
  assert(contract.validFeedback(clean, "improve_painting"));
  assert.deepEqual(
    clean.overlays.map((n) => n.id),
    ["roof"],
  );
  assert.equal(clean.compositionOverlay, undefined);
  assert(
    coaching.conflictsWithDecision(
      "Increase contrast in the bridge.",
      decision,
    ),
  );
  assert(
    !coaching.conflictsWithDecision(
      "Keep a small restrained accent in the bridge to lead toward the house.",
      decision,
    ),
  );
});
test("malformed visual role entries cannot invalidate a compatible canonical decision", () => {
  const clean = coaching.usableCoachingDecision({
    ...decision,
    visualRoles: [
      ...decision.visualRoles,
      { area: "", role: "focal" },
      { area: "sky", role: "admin" },
    ],
  });
  assert.deepEqual(clean.visualRoles, decision.visualRoles);
  const { visualRoles: _roles, ...legacy } = decision;
  assert.deepEqual(coaching.usableCoachingDecision(legacy), legacy);
});
test("domain prompts separate design, colour and handling and explicitly avoid forcing flaws or archetypes", () => {
  const composition = coachingPrompt("improve_painting", "Composition");
  assert(
    composition.includes("physical brush/moisture recipes belong to Technique"),
  );
  const technique = coachingPrompt("improve_painting", "Watercolor technique");
  assert(technique.includes("Avoid major crop, horizon or spacing redesign"));
  const colour = coachingPrompt("improve_painting", "Colour & contrast");
  assert(
    colour.includes(
      "value hierarchy, dominant temperature, warm/cool contrast, chroma restraint",
    ),
  );
  for (const focus of [
    "Overall feedback",
    "Composition",
    "Colour & contrast",
    "Watercolor technique",
  ]) {
    const prompt = coachingPrompt("improve_painting", focus);
    for (const text of [
      "Clear issues need visible evidence",
      "Study mode may have zero clear issues",
      "Do not force a formula",
      "Supporting shapes may guide the eye without equal sharpness/contrast",
      "never initiates another model call",
    ])
      assert(prompt.includes(text), text);
  }
});

test("scope-aware metadata keeps valid multi-region parts without fabricating one local crop", () => {
  const clean = overlays.usableOverlays([
    {
      ...note,
      scope: "multi_region",
      region: null,
      regions: [
        region,
        { ...region, x: 2 },
        { x: 0.7, y: 0.2, width: 0.15, height: 0.2 },
      ],
      anchors: [
        { x: 0.1, y: 0.1 },
        { x: 2, y: 0 },
      ],
      evidence: "The warm roof contrasts with the cooler tree mass.",
    },
  ])[0];
  assert.equal(clean.regions.length, 2);
  assert.equal(clean.anchors.length, 1);
  assert.equal(geometry.noteRegion(clean), null);
  assert(geometry.noteGeometryVisible(clean));
  assert.equal(geometry.noteRegions(clean).length, 2);
});
test("global and unreliable note geometry stays text only", () => {
  const global = overlays.usableOverlays([{ ...note, scope: "global" }])[0];
  assert.equal(geometry.noteRegion(global), null);
  assert.equal(geometry.noteGeometryVisible(global), false);
  for (const extension of [
    {
      scope: "multi_region",
      regions: [region],
      anchors: [{ x: 0.8, y: 0.8 }],
      regionConfidence: "high",
    },
    { scope: "invented" },
  ]) {
    const clean = overlays.usableOverlays([{ ...note, ...extension }])[0];
    assert.equal(geometry.noteGeometryVisible(clean), false);
    assert.equal(clean.shortInstruction, note.shortInstruction);
  }
});
test("an unsupported correction is safely a future experiment; a specific evidenced issue can remain constructive", () => {
  for (const classification of ["clear_issue", "optional_refinement"]) {
    const weak = visual.sanitizeVisualMetadata({
      ...note,
      classification,
      evidence: "This is bad.",
      timing: "current_painting",
    });
    assert.equal(weak.classification, "study_experiment");
    assert.equal(weak.timing, "next_study");
    assert.equal(weak.evidence, undefined);
    const supported = visual.sanitizeVisualMetadata({
      ...note,
      classification,
      evidence:
        "The three dark window accents are as strong as the focal roof edge.",
    });
    assert.equal(supported.classification, classification);
  }
  assert.equal(
    visual.effectiveClassification({
      ...note,
      classification: "stylistic_alternative",
      evidence: null,
    }),
    "stylistic_alternative",
  );
});
test("evidence, scope and geometry are bounded strict nullable output fields", () => {
  const schema = contract.feedbackSchema("improve_painting");
  const fields = schema.properties.overlays.items;
  for (const key of ["scope", "evidence", "regions", "anchors"])
    assert(fields.required.includes(key));
  assert.equal(fields.properties.evidence.maxLength, 250);
  assert.equal(fields.properties.regions.maxItems, 3);
  assert.equal(fields.properties.anchors.maxItems, 3);
  assert(schema.required.includes("secondaryCompositionOverlay"));
  assert(!schema.properties.tertiaryCompositionOverlay);
});
for (const mode of ["improve_painting", "create_reference"]) {
  test(`${mode}: primary and distinct secondary composition contracts preserve legacy and malformed fallback`, () => {
    const sample =
      mode === "improve_painting"
        ? samples.improveResult
        : samples.referenceResult;
    const secondary = { ...diagonal, type: "off_centre", paths: null };
    const clean = contract.cleanFeedback(
      {
        ...sample,
        compositionOverlay: diagonal,
        secondaryCompositionOverlay: secondary,
      },
      mode,
    );
    assert(contract.validFeedback(clean, mode));
    assert.equal(clean.secondaryCompositionOverlay.type, "off_centre");
    const fallback = contract.cleanFeedback(
      {
        ...sample,
        secondaryCompositionOverlay: {
          ...secondary,
          focalPoint: { x: 2, y: 0 },
        },
      },
      mode,
    );
    assert(contract.validFeedback(fallback, mode));
    assert.equal(
      visual.drawableCompositionOverlay(fallback.secondaryCompositionOverlay),
      null,
    );
    const duplicate = contract.cleanFeedback(
      {
        ...sample,
        compositionOverlay: diagonal,
        secondaryCompositionOverlay: diagonal,
      },
      mode,
    );
    assert.equal(duplicate.secondaryCompositionOverlay, undefined);
  });
}

test("new optional roles cannot empty required strengths or fail compatible legacy core feedback", () => {
  const legacyDecision = { ...decision, supportingObservations: [] };
  delete legacyDecision.visualRoles;
  const original = {
    ...samples.improveResult,
    whatWorks: ["Keep the bridge crisp."],
    coachingDecision: legacyDecision,
  };
  const withRoles = {
    ...original,
    coachingDecision: { ...legacyDecision, visualRoles: decision.visualRoles },
  };
  const clean = contract.cleanFeedback(withRoles, "improve_painting");
  assert(contract.validFeedback(clean, "improve_painting"));
  assert.deepEqual(clean.whatWorks, original.whatWorks);
  assert(!Object.hasOwn(clean.coachingDecision, "visualRoles"));
  assert.deepEqual(clean, contract.cleanFeedback(original, "improve_painting"));
});

test("secondary composition advice obeys the same canonical quiet/supporting hierarchy", () => {
  const clean = contract.cleanFeedback(
    {
      ...samples.improveResult,
      coachingDecision: decision,
      compositionOverlay: diagonal,
      secondaryCompositionOverlay: {
        ...diagonal,
        type: "off_centre",
        shortExplanation: "Increase contrast in the bridge.",
      },
    },
    "improve_painting",
  );
  assert(contract.validFeedback(clean, "improve_painting"));
  assert.equal(clean.compositionOverlay.type, "diagonal");
  assert.equal(clean.secondaryCompositionOverlay, undefined);
  assert.equal(
    visual.explicitGuidanceDomain(
      "Limit the palette to three muted colour families.",
    ),
    "colour_value",
  );
  assert.equal(
    visual.explicitGuidanceDomain(
      "Mix ultramarine and burnt sienna for the quiet shadows.",
    ),
    "colour_value",
  );
});
