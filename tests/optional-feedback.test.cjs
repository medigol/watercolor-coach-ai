const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");
const root = path.resolve(__dirname, "..");
function load(file, imports = {}) {
  const exports = {};
  const code =
    ts.transpileModule(fs.readFileSync(path.join(root, file), "utf8"), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
      },
    }).outputText;
  new Function("exports", "require", code)(exports, (name) => {
    if (!(name in imports)) throw new Error(`Unexpected import: ${name}`);
    return imports[name];
  });
  return exports;
}
const overlays = load("supabase/functions/_shared/overlays.ts");
const { cleanFeedback, cleanOverlayFeedback, validFeedback } = load(
  "supabase/functions/_shared/contract.ts",
  {
    "./overlays.ts": overlays,
  },
);
const { improveResult, referenceResult } = load(
  "supabase/functions/_shared/mockResults.ts",
);
const sampleFor = (mode) =>
  mode === "improve_painting" ? improveResult : referenceResult;
const stage = {
  stage: "Next study — connected shadows",
  brush: "Medium round for connected shapes",
  wash: "Milk-strength tested blue-earth neutral",
  technique: "damp_on_damp",
  timing: "Wait until the shine has nearly left the new study sheet.",
  edges: "Keep secondary edges soft and focal edges selective.",
  stop: "Stop once the middle value reads as one connected shape.",
};
const palette = [{
  name: "Ultramarine",
  hex: "#57788b",
  pigmentCode: "PB29",
  use: "Cool distance",
  temperature: "cool",
  mix: "Test a neutral with Burnt Sienna",
  tag: "atmospheric_distance",
}];
const decision = {
  mainIssue: "A foreground dark competes with the focal area.",
  reason: "It draws attention away from the figures.",
  tryNow: "Stop adding competing foreground detail.",
  nextStudy: "Test a tighter foreground crop in a thumbnail.",
};
const note = {
  type: "eye_flow_arrow",
  id: "eye-path",
  category: "composition",
  timing: "next_study",
  label: "Keep the eye path clear",
  x: 15,
  y: 70,
  width: null,
  height: null,
  points: [{ x: 15, y: 70 }, { x: 50, y: 50 }],
  styleHint: "eye_flow",
  valueGroup: null,
  priority: "high",
  shortInstruction: "Quiet secondary detail beside the leading path.",
  reason: "The path helps the eye reach the focal subject.",
  action: "Test this arrangement in a thumbnail before repainting.",
};
for (const mode of ["improve_painting", "create_reference"]) {
  test(`${mode}: malformed optional teaching aids preserve core OpenAI-eligible feedback`, () => {
    const sample = sampleFor(mode);
    const input = {
      ...sample,
      promising: { unsupported: true },
      paletteStrategy: "x".repeat(351),
      brushPlan: [{ ...stage, technique: "unknown" }],
      compositionDecision: "not an object",
      ...(mode === "improve_painting"
        ? { palette: [{ name: "", hex: "invalid" }] }
        : { whatWorks: "not a list", whatToFix: [null, ""] }),
    };
    const original = JSON.parse(JSON.stringify(input));
    assert(!validFeedback(input, mode));
    const cleaned = cleanFeedback(input, mode);
    assert(validFeedback(cleaned, mode));
    assert.deepEqual(cleaned, sample);
    assert.deepEqual(input, original, "Cleaning must not mutate model data");
  });
  test(`${mode}: individually valid brush stages survive, capped at three`, () => {
    const stages = [
      stage,
      { ...stage, stage: "bad", timing: null },
      { ...stage, stage: "Second supported stage" },
      { ...stage, stage: "Third supported stage" },
      { ...stage, stage: "Fourth supported stage" },
    ];
    const cleaned = cleanFeedback(
      { ...sampleFor(mode), brushPlan: stages },
      mode,
    );
    assert.deepEqual(cleaned.brushPlan, [stages[0], stages[2], stages[3]]);
    assert(validFeedback(cleaned, mode));
    for (
      const brushPlan of [false, {}, "plan", [null], [{
        ...stage,
        brush: "x".repeat(121),
      }], [{ ...stage, product: "not allowed" }]]
    ) {
      const result = cleanFeedback({ ...sampleFor(mode), brushPlan }, mode);
      assert(!Object.hasOwn(result, "brushPlan"));
      assert(validFeedback(result, mode));
    }
  });
  test(`${mode}: valid optional guidance and legacy JSON stay unchanged`, () => {
    const sample = sampleFor(mode);
    const valid = {
      ...sample,
      promising: "The reserved focal light gives this design useful potential.",
      brushPlan: [stage],
      paletteStrategy:
        "Keep distance cool and reserve accents for the focal area.",
      compositionDecision: decision,
      palette,
      overlays: [note],
      ...(mode === "create_reference"
        ? {
          whatWorks: ["The photo has a clear light shape."],
          whatToFix: ["Simplify the competing foreground detail."],
        }
        : {}),
    };
    assert.deepEqual(cleanFeedback(valid, mode), valid);
    assert(validFeedback(cleanFeedback(valid, mode), mode));
    assert.deepEqual(cleanFeedback(sample, mode), sample);
    assert(validFeedback(cleanFeedback(sample, mode), mode));
    const nullable = {
      ...sample,
      promising: null,
      brushPlan: null,
      compositionDecision: null,
      paletteStrategy: null,
    };
    assert.deepEqual(cleanFeedback(nullable, mode), nullable);
  });
  test(`${mode}: composition decisions retain only valid bounded members`, () => {
    const raw = {
      ...sampleFor(mode),
      compositionDecision: {
        mainIssue: decision.mainIssue,
        reason: "x".repeat(351),
        tryNow: null,
        nextStudy: 42,
        extra: "unsupported",
      },
    };
    const cleaned = cleanFeedback(raw, mode);
    assert.deepEqual(cleaned.compositionDecision, {
      mainIssue: decision.mainIssue,
      tryNow: null,
    });
    assert(validFeedback(cleaned, mode));
  });
  test(`${mode}: required text and unknown top-level fields remain strictly rejected`, () => {
    const sample = sampleFor(mode);
    for (
      const patch of [
        { title: "" },
        { composition: null },
        { sketch: true },
        { values: "x".repeat(701) },
        { unexpected: "not allowed" },
        ...(mode === "improve_painting"
          ? [{ mainAdvice: "" }, { whatWorks: [null] }, { whatToFix: [] }, {
            practice: [],
          }, { prompt: "" }]
          : [{ steps: [] }, { steps: [null] }]),
      ]
    ) {
      const raw = { ...sample, ...patch, promising: false };
      const cleaned = cleanFeedback(raw, mode);
      assert(!validFeedback(cleaned, mode), JSON.stringify(patch));
      for (const [key, value] of Object.entries(patch)) {
        assert.deepEqual(
          cleaned[key],
          value,
          "Core fields must not be repaired",
        );
      }
    }
  });
  test(`${mode}: overlays use the established per-note cleanup exactly`, () => {
    const badGeometry = { ...note, points: [{ x: 500, y: 0 }] };
    const raw = {
      ...sampleFor(mode),
      overlays: [
        note,
        { ...note, id: "fallback", points: badGeometry.points },
        { ...note, x: -1 },
      ],
    };
    assert.deepEqual(cleanFeedback(raw, mode), cleanOverlayFeedback(raw));
    assert(validFeedback(cleanFeedback(raw, mode), mode));
  });
}
test("required reference palette keeps core colors while dropping unsafe optional metadata", () => {
  const raw = {
    ...referenceResult,
    palette: [{
      name: "Ultramarine",
      hex: "#57788b",
      use: ["not text"],
      mix: "x".repeat(181),
      temperature: "hot",
      pigmentCode: "PB999",
      tag: "purchase",
      manufacturer: "unverified",
    }, {
      name: "Burnt Sienna",
      hex: "#a87960",
      pigmentCode: "PB29",
      use: "Warm walls",
      temperature: "warm",
      tag: "accent",
    }],
  };
  const cleaned = cleanFeedback(raw, "create_reference");
  assert.deepEqual(cleaned.palette, [
    { name: "Ultramarine", hex: "#57788b" },
    {
      name: "Burnt Sienna",
      hex: "#a87960",
      use: "Warm walls",
      temperature: "warm",
      tag: "accent",
    },
  ]);
  assert(validFeedback(cleaned, "create_reference"));
  for (const pigmentCode of ["PB15", ["PB29"], {}, 29]) {
    const result = cleanFeedback({
      ...referenceResult,
      palette: [{ ...palette[0], pigmentCode }],
    }, "create_reference");
    assert(!Object.hasOwn(result.palette[0], "pigmentCode"));
    assert(validFeedback(result, "create_reference"));
  }
});
test("invalid required reference palette is never repaired, dropped, or shortened", () => {
  for (
    const palette of [
      null,
      "colors",
      [],
      [null],
      [{ name: "", hex: "#57788b" }],
      [{ name: "Ultramarine", hex: "url(unsafe)" }],
      [{ hex: "#57788b" }],
      Array.from(
        { length: 9 },
        () => ({ name: "Ultramarine", hex: "#57788b" }),
      ),
    ]
  ) {
    const cleaned = cleanFeedback(
      { ...referenceResult, palette },
      "create_reference",
    );
    assert.deepEqual(cleaned.palette, palette);
    assert(!validFeedback(cleaned, "create_reference"));
  }
});
test("optional painting palette cleans metadata and drops invalid core as an optional aid", () => {
  const cleaned = cleanFeedback({
    ...improveResult,
    palette: [{ ...palette[0], tag: "unsupported" }],
  }, "improve_painting");
  const { tag: _tag, ...expected } = palette[0];
  assert.deepEqual(cleaned.palette, [expected]);
  assert(validFeedback(cleaned, "improve_painting"));
  for (
    const palette of [false, {}, [], [{ name: "", hex: "#57788b" }], [null]]
  ) {
    const result = cleanFeedback(
      { ...improveResult, palette },
      "improve_painting",
    );
    assert(!Object.hasOwn(result, "palette"));
    assert(validFeedback(result, "improve_painting"));
  }
});
test("reference observations clean individually while required painting observations stay strict", () => {
  const input = {
    ...referenceResult,
    whatWorks: [
      null,
      "One clear light shape.",
      "x".repeat(351),
      "Natural eye path.",
    ],
    whatToFix: {},
  };
  const cleaned = cleanFeedback(input, "create_reference");
  assert.deepEqual(cleaned.whatWorks, [
    "One clear light shape.",
    "Natural eye path.",
  ]);
  assert(!Object.hasOwn(cleaned, "whatToFix"));
  assert(validFeedback(cleaned, "create_reference"));
  const painting = cleanFeedback({
    ...improveResult,
    whatWorks: input.whatWorks,
  }, "improve_painting");
  assert.deepEqual(painting.whatWorks, input.whatWorks);
  assert(!validFeedback(painting, "improve_painting"));
});
test("optional cleaning is idempotent and never fabricates missing core fields", () => {
  for (
    const value of [null, true, "feedback", [], {
      promising: "A supported observation.",
    }, { brushPlan: [stage] }]
  ) {
    const cleaned = cleanFeedback(value, "improve_painting");
    assert(!validFeedback(cleaned, "improve_painting"));
    assert.deepEqual(cleanFeedback(cleaned, "improve_painting"), cleaned);
  }
  const raw = {
    ...referenceResult,
    promising: false,
    brushPlan: [stage, null],
    palette: [{ ...palette[0], mix: false }],
  };
  const once = cleanFeedback(raw, "create_reference");
  assert.deepEqual(cleanFeedback(once, "create_reference"), once);
});
