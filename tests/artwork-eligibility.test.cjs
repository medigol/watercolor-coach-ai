const test = require("node:test"),
  assert = require("node:assert/strict");
const { loadShared } = require("./helpers/shared-loader.cjs");
const gate = loadShared("../shared/artworkEligibility.ts", "lib/overlays.ts");
const provider = loadShared(
  "../shared/providerPaintingAnalysis.ts",
  "lib/overlays.ts",
);
const fixture = require("./helpers/provider-draft-fixture.cjs");
const accepted = () => ({
  eligibility: { status: "accepted", reason_code: null },
  analysis: fixture(),
});
test("accepted eligibility unwraps the unchanged provider draft, not a persisted envelope", () => {
  const v = accepted(),
    before = structuredClone(v);
  assert.equal(gate.artworkEligibility(v).analysis, v.analysis);
  assert(
    provider.normalizeProviderPaintingAnalysis(
      gate.artworkEligibility(v).analysis,
    ).ok,
  );
  assert.deepEqual(v, before);
});
for (const [status, code] of [
  ["rejected", "unsupported_artwork"],
  ["uncertain", "artwork_uncertain"],
  ["uncertain", "crop_needed"],
])
  test(`${status}/${code} permits no fabricated analysis`, () => {
    const v = { eligibility: { status, reason_code: code }, analysis: null };
    assert.deepEqual(gate.artworkEligibility(v), { status, code });
    v.analysis = fixture();
    assert.equal(gate.artworkEligibility(v).status, "invalid");
  });
for (const [name, change] of [
  ["missing envelope", () => fixture()],
  ["missing draft", (v) => ((v.analysis = null), v)],
  ["unknown enum", (v) => ((v.eligibility.status = "photo"), v)],
  [
    "accepted with rejection code",
    (v) => ((v.eligibility.reason_code = "unsupported_artwork"), v),
  ],
  ["raw private reason", (v) => ((v.eligibility.reason_code = "PRIVATE"), v)],
  ["extra client flag", (v) => ({ ...v, accepted: true })],
  ["empty eligibility", (v) => ((v.eligibility = {}), v)],
  ["array draft", (v) => ((v.analysis = []), v)],
  [
    "contradictory rejection",
    (v) => (
      (v.eligibility = { status: "rejected", reason_code: "crop_needed" }),
      v
    ),
  ],
  [
    "uncertain without reason",
    (v) => ((v.eligibility = { status: "uncertain", reason_code: null }), v),
  ],
])
  test(`malformed eligibility fails closed: ${name}`, () =>
    assert.equal(
      gate.artworkEligibility(change(accepted())).status,
      "invalid",
    ));
test("strict schema is root object, every field required, nested nullable draft, refs resolve", () => {
  const draft = provider.providerPaintingAnalysisSchema({
    structure: {
      type: ["object", "null"],
      additionalProperties: false,
      properties: {},
      required: [],
    },
    brush: { type: ["array", "null"], items: { type: "string" } },
  });
  const schema = gate.artworkEligibilitySchema(draft);
  assert.equal(schema.type, "object");
  assert(!schema.anyOf);
  assert.deepEqual(schema.properties.analysis.type, ["object", "null"]);
  function walk(s) {
    if (!s || typeof s !== "object") return;
    if (s.$ref) assert(schema.$defs[s.$ref.split("/").at(-1)]);
    if (s.properties) {
      assert.equal(s.additionalProperties, false);
      assert.deepEqual(
        [...s.required].sort(),
        Object.keys(s.properties).sort(),
      );
    }
    for (const v of Object.values(s))
      if (Array.isArray(v)) v.forEach(walk);
      else walk(v);
  }
  walk(schema);
  assert.equal(
    schema.properties.analysis.properties.qualityAssessment.properties.rationale
      .maxLength,
    640,
  );
});

test('provider policy separates eligibility from quality, rejects image-text instructions and abstains on ambiguous medium',()=>{
 const s=require('node:fs').readFileSync(require('node:path').join(__dirname,'../supabase/functions/_shared/prompts.ts'),'utf8').split('QUALITY:')[0];
 for(const word of ['WIP','abstract','monochrome','realistic','scanned','photographed','Ordinary real-world photos','screenshot/UI','documents','empty paper','multiple separate artworks','crop_needed','digital watercolor-style','artwork_uncertain','untrusted image content','NEVER instructions','analysis MUST be null','reason_code null'])assert(s.includes(word),word);
});
