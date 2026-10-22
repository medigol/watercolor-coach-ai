const test = require("node:test");
const assert = require("node:assert/strict");
const { loadShared } = require("./helpers/shared-loader.cjs");
const fixture = require("./helpers/canonical-fixture.cjs");
const evidence = loadShared("../shared/coachingEvidence.ts", "lib/overlays.ts");
const alignment = loadShared("../shared/coachingAlignment.ts", "lib/overlays.ts");
const { workspaceTeaching } = loadShared("../shared/coachingWorkspace.ts", "lib/overlays.ts");

// Text-boundary regressions only. No claim about perception of real artworks.
for (const text of [
  "The clouds were created through lifting and negative painting.",
  "Lifting created the pale sky shapes.",
  "Negative painting defines the tree canopy.",
  "Preserve the lifting used for the clouds.",
  "The pale clouds were lifted from the surrounding colour.",
  "The artist lifted the cloud shapes.",
]) test(`original process is not a visible fact: ${text}`, () => {
  assert.equal(evidence.observationText(text), "");
});
for (const text of [
  "On a separate small study, compare lifting with reserved paper whites.",
  "Try negative painting on scrap paper; compare the surrounding shapes.",
  "A practical way to reproduce this would be negative painting on separate paper.",
  "This effect could be practised with lifting on a separate study.",
  "The pale negative shapes separate the darker tree masses.",
]) test(`future methods and actual negative shapes remain valid: ${text}`, () => {
  assert.equal(evidence.observationText(text), text);
});
test("an independent visible effect survives an unsupported historical sentence", () => {
  assert.equal(evidence.observationText("The clouds show soft transitions. Lifting created the light shapes."), "The clouds show soft transitions.");
});
for (const text of [
  "Hue contrast separates the red vehicle from the blue mountain.",
  "Warm–cool contrast separates the vehicle from its surroundings.",
  "Chroma contrast gives the foreground an accent.",
  "Red and blue contrast separates the vehicle from the mountain.",
  "Warm and cool contrast separates the vehicle from the background.",
]) test(`chromatic contrast is not tonal evidence: ${text}`, () => {
  assert(!alignment.evidenceProperties(text).includes("value"));
  assert(alignment.evidenceProperties(text).includes("colour"));
});
test("explicit mixed tonal and hue evidence retains both dimensions", () => {
  assert(alignment.evidenceProperties("Hue contrast and a darker foreground give separate colour and value relationships.").includes("value"));
});
function claim(lesson, observation) {
  const r = fixture(), c = r.canonicalAnalysis;
  c.insights = [{ ...c.insights[0], lesson, action: "Preserve this supplied relationship." }];
  c.facts = [{ ...c.facts[0], observation }];
  return r;
}
test("hue-only fact cannot support a value-contrast Strength or its note", () => {
  const r = claim("Strong value contrast separates the vehicle from the mountain.", "Hue contrast separates the red vehicle from the blue mountain.");
  const before = structuredClone(r), t = workspaceTeaching(r);
  assert.equal(t.strengths.length, 0);
  assert(t.noteExcludedInsightIds.includes("whole"));
  assert.deepEqual(r, before);
});
test("actual supplied tonal relationship can support a value Strength", () => {
  const r = claim("Strong value contrast separates the vehicle from the mountain.", "The darker vehicle sits against the lighter mountain value group.");
  assert.equal(workspaceTeaching(r).strengths.length, 1);
});
test("generic structural-accuracy praise needs an observed geometric relationship", () => {
  const r = claim("The vehicle perspective and proportions are accurate.", "The red vehicle is the focal subject.");
  assert.equal(workspaceTeaching(r).strengths.length, 0);
});
test("supplied relative alignments support a bounded structural observation", () => {
  const r = claim("The vehicle perspective is consistent.", "The vehicle's wheel ellipses and roof lines share a consistent recession direction.");
  assert.equal(workspaceTeaching(r).strengths.length, 1);
});
test("a hue fact is not lost simply because it cannot prove grayscale separation", () => {
  const r = claim("Hue contrast separates the red vehicle from the blue background.", "Hue contrast separates the red vehicle from the blue background.");
  assert.equal(workspaceTeaching(r).strengths.length, 1);
});
test("uncertain quality cannot display an unqualified no-issue verdict", () => {
  const r = fixture();
  r.canonicalAnalysis.qualityAssessment = { level: "strong", confidence: 0.4, rationale: "Some details are difficult to assess." };
  assert.match(workspaceTeaching(r).status, /tentative|uncertain|limited/i);
});
test("visible mood language is not mistaken for the lifting method", () => {
  const text = "Warm accents are lifting the mood of the quiet street scene.";
  assert.equal(evidence.observationText(text), text);
});
test("a different object's alignments cannot justify vehicle accuracy", () => {
  const r = claim("The vehicle perspective is accurate.", "The building's roof lines are parallel and aligned.");
  assert.equal(workspaceTeaching(r).strengths.length, 0);
});
test("unsupported accuracy praise cannot provide the only evidence for upgrading quality", () => {
  const r = claim("The vehicle perspective is accurate.", "The red vehicle is the focal subject.");
  r.canonicalAnalysis.qualityAssessment = { level: "competent", confidence: 0.9, rationale: "Clear vehicle perspective gives the scene strong structure." };
  assert.equal(workspaceTeaching(r).assessment.level, "competent");
});
for (const level of ["developing", "competent", "strong", "highly_resolved"]) {
  test(`quality remains evidence-dependent, not a forced distribution: ${level}`, () => {
    const r = fixture();
    r.canonicalAnalysis.qualityAssessment.level = level;
    if (["developing", "competent"].includes(level)) {
      r.canonicalAnalysis.facts.push({ id: "problem", domain: "overall", roleId: null,
        observation: "Disconnected water bands flatten spatial depth around the boat." });
      r.canonicalAnalysis.insights.push({ id: "fix", domain: "overall", classification: "clear_issue", factIds: ["problem"],
        lesson: "Disconnected water bands weaken the boat's spatial integration.",
        action: "On a separate study, connect water value bands and compare spatial depth." });
      r.canonicalAnalysis.qualityAssessment.rationale = "Disconnected water bands weaken spatial depth around the boat.";
    }
    const before = structuredClone(r), t = workspaceTeaching(r);
    assert.equal(t.assessment.level, level);
    assert.equal(t.recommendations.length > 0, ["developing", "competent"].includes(level));
    assert.deepEqual(r, before);
  });
}
test("medium uncertainty and screenshot recovery messages are conditional and non-technical", () => {
  const { artworkGateMessages } = loadShared("../shared/artworkEligibility.ts", "lib/overlays.ts");
  assert.match(artworkGateMessages.unsupported_artwork, /If this is an app screenshot.*original.*crop/);
  assert.match(artworkGateMessages.artwork_uncertain, /couldn't reliably identify the medium/);
  assert.match(artworkGateMessages.crop_needed, /one complete artwork/);
  assert.doesNotMatch(Object.values(artworkGateMessages).join(" "), /schema|provider|quota|original pigment|you're|your skill/i);
});
