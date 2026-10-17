const { loadShared } = require("./helpers/shared-loader.cjs");
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");
const root = path.resolve(__dirname, "..");
function load(file, imports = {}) {
  const exports = {};
  const code = ts.transpileModule(
    fs.readFileSync(path.join(root, file), "utf8"),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
      },
    },
  ).outputText;
  new Function("exports", "require", code)(exports, (name) => {
    if (!(name in imports)) return loadShared(name, file);
    return imports[name];
  });
  return exports;
}
const overlays = load("supabase/functions/_shared/overlays.ts");
const contract = load("supabase/functions/_shared/contract.ts", {
  "./overlays.ts": overlays,
  "./coachingDecision.ts": load("shared/coachingDecision.ts"),
});
const samples = load("data/mockResults.ts");
const { validResult } = load("lib/artworks.ts", {
  "./supabase": {
    requireSupabase: () => {
      throw new Error("No network in a result contract test");
    },
  },
  "../data/mockResults": samples,
});
const { coachingPrompt } = load("supabase/functions/_shared/prompts.ts");
for (const mode of ["improve_painting", "create_reference"]) {
  const sample =
    mode === "improve_painting"
      ? samples.improveResult
      : samples.referenceResult;
  test(`${mode}: study notes permit zero refinements without weakening other core fields`, () => {
    const study = {
      ...sample,
      coachingMode: "study",
      whatToFix: [],
      compositionDecision: {
        mainIssue: null,
        reason: "The connected path leads clearly to the focal light.",
        tryNow: null,
        nextStudy: "One possible variation is a smaller separate value study.",
      },
    };
    assert(contract.validFeedback(study, mode));
    assert(validResult(study, mode));
    assert.deepEqual(contract.cleanFeedback(study, mode), study);
    assert(validResult(sample, mode));
    assert(contract.validFeedback(sample, mode));
    assert(contract.validFeedback({ ...study, coachingMode: null }, mode));
    assert(
      contract.validFeedback({ ...sample, coachingMode: "constructive" }, mode),
    );
    if (mode === "improve_painting") {
      for (const whatToFix of [undefined, null, "optional", [null], [""]]) {
        assert(!contract.validFeedback({ ...study, whatToFix }, mode));
        assert(!validResult({ ...study, whatToFix }, mode));
      }
      assert(!contract.validFeedback({ ...study, whatWorks: [] }, mode));
      assert(!validResult({ ...study, whatWorks: [] }, mode));
    } else {
      assert(!contract.validFeedback({ ...study, steps: [] }, mode));
      assert(!validResult({ ...study, steps: [] }, mode));
    }
  });
  test(`${mode}: invalid optional coaching flags are removed without inventing a classification`, () => {
    for (const coachingMode of [false, [], ["study"], {}, "advanced", 1]) {
      const raw = { ...sample, coachingMode };
      assert(!contract.validFeedback(raw, mode));
      const cleaned = contract.cleanFeedback(raw, mode);
      assert(!Object.hasOwn(cleaned, "coachingMode"));
      assert(contract.validFeedback(cleaned, mode));
      assert.deepEqual(cleaned, sample);
    }
    const schema = contract.legacyFeedbackSchema(mode);
    assert(schema.required.includes("coachingMode"));
    assert.deepEqual(schema.properties.coachingMode.type, ["string", "null"]);
    assert.deepEqual(schema.properties.coachingMode.enum, [
      "constructive",
      "study",
      null,
    ]);
  });
  test(`${mode}: prompt privately calibrates confidence with modest independent study guidance`, () => {
    const prompt = coachingPrompt(mode);
    for (const phrase of mode === "improve_painting"
      ? [
          "Assess the PAINTING first",
          "zero clear_issue is valid",
          "no score out of100",
          "Recommended practice conditions, not reconstructed facts",
          "No generated stages",
        ]
      : [
          "First privately calibrate how resolved this single image appears",
          "never infer or label the user's skill level",
          "use study for strong/highly resolved work or when critique confidence is uncertain",
          "do not force criticism",
          "0–2 modest conditional optional variations",
          "empty array when no useful refinement is supported",
          "current actions must be safe, conditional and tested on scrap first",
          "big-shape proportions or value-mass redesign belong only to next_study",
          "practice gives one short exercise",
          "neither repeats mainAdvice or composition paragraphs",
          "neutral labels and next_study timing for experiments",
        ])
      assert(prompt.includes(phrase), phrase);
    if (mode === "improve_painting") {
      assert.match(prompt, /Overall identifies the main priority or strongest success/);
      assert.match(prompt, /2–4 concise COMPLETE supported sentences/);
      assert(prompt.includes("without visible harm"));
      assert(prompt.includes("separate sheet"));
    } else {
      assert(
        prompt.includes(
          "If the image is a photograph, do not praise washes or painted handling",
        ),
      );
      assert(
        prompt.includes(
          "not a generated reference image or a watercolor painting needing repair",
        ),
      );
    }
  });
}
