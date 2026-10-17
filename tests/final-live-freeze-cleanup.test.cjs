const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const { loadShared } = require("./helpers/shared-loader.cjs");
const fixture = require("./helpers/final-live-freeze-fixture.cjs");
const display = loadShared("../shared/coachingDisplay.ts", "lib/overlays.ts");
const { workspaceTeaching } = loadShared(
  "../shared/coachingWorkspace.ts",
  "lib/overlays.ts",
);
const { cleanPaintingAnalysis, validPaintingAnalysis } = loadShared(
  "../shared/paintingAnalysis.ts",
  "lib/overlays.ts",
);
const {
  cleanDisplayText,
  colourTheoryText,
  displayRecreationMixes,
  prepareCoachingDisplay,
} = display;
function issue(
  r,
  text = "Disconnected water bands flatten spatial depth around the boat.",
  action = "Connect adjacent water values around the boat in a separate study.",
) {
  const c = r.canonicalAnalysis;
  c.facts.push({
    id: "issue-fact",
    domain: "overall",
    roleId: null,
    observation: text,
  });
  const i = {
    id: "issue",
    domain: "overall",
    classification: "clear_issue",
    factIds: ["issue-fact"],
    lesson: text,
    action,
  };
  c.insights.push(i);
  return i;
}
function projected(r) {
  return workspaceTeaching(r).displaySource.canonicalAnalysis;
}

for (const [label, text, conflict] of [
  [
    "rationale",
    "The bright sky and pier form the clear focal area. Coherent light supports the mood.",
    true,
  ],
  [
    "focal area around",
    "Clear values establish a clear focal area around the bright sky and pier. Coherent light supports the mood.",
    true,
  ],
  [
    "matching identity",
    "The tower is the focal subject. Coherent light supports the mood.",
    false,
  ],
  [
    "relational mention",
    "Warm tower light contrasts with cool water to establish focal hierarchy.",
    false,
  ],
])
  test(`cleanup focal: ${label}`, () => {
    const r = fixture();
    r.canonicalAnalysis.qualityAssessment.rationale = text;
    const result =
      prepareCoachingDisplay(r).canonicalAnalysis.qualityAssessment.rationale;
    if (conflict) {
      assert(!/focal area/i.test(result));
      assert(result.includes("Coherent light"));
    } else assert.equal(result, text);
  });
test("cleanup focal: supporting object cannot be promoted in any teaching field", () => {
  const r = fixture();
  const c = r.canonicalAnalysis;
  c.visualRoles.find((r) => r.id === "bank").area = "pier";
  c.insights[0].lesson = "The pier is the focal subject.";
  c.composition.observation = "The pier is the focal subject.";
  c.colourAnalysis.colourStrategy = "The pier is the focal subject.";
  c.facts[0].observation = "The pier is the focal subject.";
  c.visualEvidence[0].note.label = "The pier is the focal subject.";
  const result = prepareCoachingDisplay(r);
  assert(!JSON.stringify(result).includes("pier is the focal"));
  assert.equal(result.canonicalAnalysis.visualRoles[1].role, "supporting");
});
test("cleanup focal: uncertain role neutralizes identification without inventing an identity", () => {
  const r = fixture();
  r.canonicalAnalysis.visualRoles[0].confidence = 0.4;
  const text =
    "The pier is the focal subject. Balanced masses support the light.";
  const result = display.focalIdentityText(text, r);
  assert.equal(result, "Balanced masses support the light.");
});
test("cleanup focal: all canonical roles, IDs and normalized geometry stay unchanged", () => {
  const r = fixture(),
    before = structuredClone(r);
  const p = prepareCoachingDisplay(r);
  assert.deepEqual(
    p.canonicalAnalysis.visualRoles,
    before.canonicalAnalysis.visualRoles,
  );
  assert.deepEqual(
    p.canonicalAnalysis.composition.primary.paths,
    before.canonicalAnalysis.composition.primary.paths,
  );
  assert.deepEqual(r, before);
});

for (const level of ["strong", "highly_resolved", "competent"]) {
  test(`cleanup hidden critique: ${level} unsupported depth harm is removed without replacement`, () => {
    const r = fixture();
    r.canonicalAnalysis.qualityAssessment.level = level;
    const t = workspaceTeaching(r),
      c = t.displaySource.canonicalAnalysis;
    assert(!/limiting depth/.test(c.colourAnalysis.valueHierarchy));
    assert(c.colourAnalysis.valueHierarchy.includes("close in tone"));
    assert.equal(t.recommendations.length, 0);
  });
  test(`cleanup hidden critique: ${level} displayed supported depth limitation remains`, () => {
    const r = fixture();
    r.canonicalAnalysis.qualityAssessment.level = level;
    issue(r);
    r.canonicalAnalysis.colourAnalysis.valueHierarchy =
      "Disconnected water bands flatten spatial depth around the boat.";
    const t = workspaceTeaching(r);
    assert(t.recommendations.some((r) => r.insight.id === "issue"));
    assert(
      t.displaySource.canonicalAnalysis.colourAnalysis.valueHierarchy.includes(
        "flatten spatial depth",
      ),
    );
  });
}
test("cleanup hidden critique: positive value compression remains untouched", () => {
  const r = fixture(),
    text = "Compressed background values create strong atmospheric recession.";
  r.canonicalAnalysis.colourAnalysis.valueHierarchy = text;
  assert.equal(projected(r).colourAnalysis.valueHierarchy, text);
});
test("cleanup hidden critique: a stylistic alternative cannot establish a defect", () => {
  const r = fixture();
  const i = issue(r);
  i.classification = "stylistic_alternative";
  assert(
    !projected(r).colourAnalysis.valueHierarchy.includes("limiting depth"),
  );
});
test("cleanup hidden critique: same property on a different target is insufficient", () => {
  const r = fixture();
  issue(
    r,
    "The road values are muddy and flatten depth.",
    "On a separate study, connect road values and compare depth.",
  );
  r.canonicalAnalysis.colourAnalysis.valueHierarchy =
    "The boat values flatten depth.";
  assert.equal(projected(r).colourAnalysis.valueHierarchy, "");
});

for (const [input, expected] of [
  ["The loose technique suits the atmospheric mood.", "loose visible marks"],
  ["Soft washes create the distant effect.", "Soft colour passages"],
  ["Foreground and background wash areas", "colour passage"],
  ["Visible marks is loose.", "Visible marks are loose"],
  ["The varied edge variation supports atmosphere.", "edge variation"],
  [
    "Irregular visible texture visible in the foreground.",
    "Irregular visible texture in the foreground",
  ],
  [
    "Soft soft diffused diffused visible visible marks.",
    "Soft diffused visible marks",
  ],
  ["Dry-brush texture surrounds wet blending.", "irregular visible texture"],
  ["Edge control gives the light a clear boundary.", "Edge variation"],
])
  test(`cleanup observational text: ${input}`, () => {
    const r = fixture();
    r.canonicalAnalysis.facts[0].observation = input;
    const text =
      prepareCoachingDisplay(r).canonicalAnalysis.facts[0].observation;
    assert(text.toLowerCase().includes(expected.toLowerCase()), text);
    assert(
      !/marks is|varied edge variation|visible texture visible|\bwashes?\b|loose technique/i.test(
        text,
      ),
      text,
    );
  });
test("cleanup role labels: wash language changes without new softness or geometry", () => {
  const r = fixture();
  const role = r.canonicalAnalysis.visualRoles[2];
  role.area = "foreground and background wash areas";
  const actual = prepareCoachingDisplay(r).canonicalAnalysis.visualRoles[2];
  assert(!/wash|soft/i.test(actual.area));
  assert.deepEqual(actual.region, role.region);
  assert.equal(actual.role, "quiet");
});
for (const text of [
  "On scrap paper, try a wash.",
  "On a separate study, try wet-on-wet.",
  "On a separate study, try dry brush.",
])
  test(`cleanup future methods survive: ${text}`, () => {
    const r = fixture();
    r.expertViews.overall.practice = text;
    assert.equal(prepareCoachingDisplay(r).expertViews.overall.practice, text);
  });
test("cleanup recreation method is not interpreted as original observation", () => {
  const r = fixture();
  assert.equal(
    prepareCoachingDisplay(r).canonicalAnalysis.colourAnalysis
      .recreationMixes[0].use,
    r.canonicalAnalysis.colourAnalysis.recreationMixes[0].use,
  );
});
test("cleanup grammar: substantive nonduplicate wording is unchanged", () => {
  const text = "Soft distant transitions contrast with one crisp tower corner.";
  assert.equal(cleanDisplayText(text), text);
});

const mix = (ratio = "2:1", pigments = ["Ultramarine", "Burnt Sienna"]) => ({
  target: "Quiet neutral",
  pigments,
  startingRatio: ratio,
  use: "Test a light wash on scrap paper.",
});
for (const ratio of ["1:1", "2:1", "3:1"])
  test(`cleanup mixes: ${ratio} is retained unchanged`, () =>
    assert.deepEqual(displayRecreationMixes([mix(ratio)]), [mix(ratio)]));
for (const ratio of ["2:2:1", "1:1:1", "4:1", "70:30", "80:20", "70%", "2.5:1"])
  test(`cleanup mixes: ${ratio} is never displayed`, () => {
    const result = displayRecreationMixes([mix(ratio)]);
    assert.equal(result[0].startingRatio, null);
  });
test("cleanup mixes: three pigments omitted, supplied safe alternative preserved", () => {
  const safe = mix();
  assert.deepEqual(
    displayRecreationMixes([
      mix("2:2:1", ["Ochre", "Ultramarine", "Sienna"]),
      safe,
    ]),
    [safe],
  );
});
test("cleanup mixes: exact-original pigment assertion is omitted", () => {
  const m = mix();
  m.use = "The artist used these original pigments.";
  assert.deepEqual(displayRecreationMixes([m]), []);
});
test("cleanup mixes: transparent white omitted, explicit gouache variation remains", () => {
  const m = mix("1:1", ["Ultramarine", "White"]);
  assert.deepEqual(displayRecreationMixes([m]), []);
  m.use = "Try this opaque gouache variation on scrap.";
  assert.equal(displayRecreationMixes([m]).length, 1);
});
for (const [text, safe] of [
  [
    "Uses a muted, analogous palette dominated by greens and browns with soft red accents.",
    false,
  ],
  [
    "An analogous relationship of neighbouring blue, blue-green and green hues supports calm.",
    true,
  ],
  ["Complementary warm and cool colours support depth.", false],
  ["Red and green accents create a complementary palette.", false],
  [
    "A deliberate complementary relationship between opposing red and green hues supports the focus.",
    true,
  ],
  ["Perhaps a triadic palette, with muted natural colours.", false],
])
  test(`cleanup harmony: ${text}`, () => {
    const result = colourTheoryText(text);
    assert.equal(
      /\b(?:analogous|complementary|triadic)\b/i.test(result),
      safe,
      result,
    );
    assert(!result.includes("#"));
    if (text.includes("muted")) assert(result.includes("muted"));
  });
test("cleanup harmony: temperature and chroma relationships are preserved", () => {
  const text =
    "Warm light against cool muted water supports the calm atmosphere.";
  assert.equal(colourTheoryText(text), text);
});
for (const text of [
  "Open water and sky remain quiet,低",
  "The open water remains quiet 低",
  "The sky remains quiet,静.",
])
  test(`cleanup malformed tail: ${text}`, () => {
    const actual = cleanDisplayText(text);
    assert(actual);
    assert(!/[低静]/.test(actual));
    assert(text.startsWith(actual));
  });
test("cleanup embedded corruption is omitted, not translated or replaced", () =>
  assert.equal(cleanDisplayText("Open 低 water remains quiet."), ""));
test("cleanup Unicode punctuation and accented Latin are preserved", () => {
  const text = "“Côte d’Azur” — warm–cool Cézanne-blue pigment notes at 20°.";
  assert.equal(cleanDisplayText(text), text);
});
test("cleanup optional corruption does not tighten canonical validation or create a new core failure", () => {
  const r = fixture();
  r.canonicalAnalysis.composition.primary.shortExplanation =
    "Open water and sky remain quiet,低";
  const core = cleanPaintingAnalysis(r, (notes) => notes);
  assert(validPaintingAnalysis(core));
  const t = workspaceTeaching(core);
  assert(
    !t.displaySource.canonicalAnalysis.composition.primary.shortExplanation.includes(
      "低",
    ),
  );
});

test("cleanup quality: positive Pavilion-like state normalizes Strong and status, without canonical mutation", () => {
  const r = fixture(),
    before = structuredClone(r);
  const t = workspaceTeaching(r);
  assert.equal(t.assessment.level, "strong");
  assert(t.status.includes("No major issue"));
  assert.deepEqual(r, before);
  assert.equal(r.canonicalAnalysis.qualityAssessment.level, "competent");
});
test("cleanup quality: supported material issue blocks Strong", () => {
  const r = fixture();
  issue(r);
  assert.equal(workspaceTeaching(r).assessment.level, "competent");
});
test("cleanup quality: supported material limitation remains in rationale", () => {
  const r = fixture();
  issue(r);
  r.canonicalAnalysis.qualityAssessment.rationale +=
    " Disconnected water bands flatten spatial depth around the boat.";
  const t = workspaceTeaching(r);
  assert.equal(t.assessment.level, "competent");
  assert(t.assessment.rationale.includes("flatten spatial depth"));
});
for (const [kind, change] of [
  [
    "uncertainty",
    (r) =>
      (r.canonicalAnalysis.qualityAssessment.rationale =
        "The hierarchy seems clear and perhaps coherent."),
  ],
  [
    "low confidence",
    (r) => (r.canonicalAnalysis.qualityAssessment.confidence = 0.79),
  ],
  [
    "no positive rationale",
    (r) =>
      (r.canonicalAnalysis.qualityAssessment.rationale =
        "A tower is beside water."),
  ],
  ["no factual strength", (r) => (r.canonicalAnalysis.insights = [])],
])
  test(`cleanup quality: ${kind} prevents upgrade despite zero recommendations`, () => {
    const r = fixture();
    change(r);
    const t = workspaceTeaching(r);
    assert.equal(t.assessment.level, "competent");
    assert.equal(t.status, "Review the observations and studies below.");
  });
test("cleanup quality: unsupported raw issue cannot block safe upgrade", () => {
  const r = fixture();
  issue(
    r,
    "The tower is slightly right of centre.",
    "Correct tower perspective in a separate study.",
  );
  r.canonicalAnalysis.insights.at(-1).lesson =
    "Inconsistent tower perspective limits depth.";
  assert.equal(workspaceTeaching(r).assessment.level, "strong");
});
test("cleanup quality: hierarchy-suppressed raw issue cannot remain a hidden label blocker", () => {
  const r = fixture();
  issue(
    r,
    "The road contrast competes with the tower and flattens hierarchy.",
    "Strengthen road contrast.",
  );
  const t = workspaceTeaching(r);
  assert(!t.recommendations.some((x) => x.insight.id === "issue"));
  assert.equal(t.assessment.level, "strong");
});
test("cleanup quality: unsupported appended rationale critique is removed before normalization", () => {
  const r = fixture();
  r.canonicalAnalysis.qualityAssessment.rationale +=
    " The boat perspective needs refinement.";
  const t = workspaceTeaching(r);
  assert(!t.assessment.rationale.includes("perspective"));
  assert.equal(t.assessment.level, "strong");
});
test("cleanup legacy display is repeatable, immutable and contains no I/O path", () => {
  const r = fixture(),
    before = JSON.stringify(r);
  const one = workspaceTeaching(r),
    two = workspaceTeaching(r);
  assert.deepEqual(one, two);
  assert.equal(JSON.stringify(r), before);
  const code = fs.readFileSync("shared/coachingDisplay.ts", "utf8");
  assert(!/\b(?:fetch|supabase|invoke|upload|insert|update)\s*\(/.test(code));
  assert(!/canvas|Image\.getSize|OpenAI/.test(code));
});

test("cleanup hidden critique preserves supplied softness without a dangling sentence", () => {
  const text = projected(fixture()).colourAnalysis.valueHierarchy;
  assert(text.includes(", preserving softness."));
  assert(!/[.!?] preserving/.test(text));
});
for (const limitation of [
  "Excessive chroma competes with the tower.",
  "Unclear hierarchy obscures the tower.",
  "Building perspective problems weaken depth.",
])
  test(`cleanup hidden critique removes unsupported ${limitation}`, () => {
    const r = fixture();
    r.canonicalAnalysis.colourAnalysis.temperatureRelationship = limitation;
    assert.equal(projected(r).colourAnalysis.temperatureRelationship, "");
  });
test("cleanup meaningful optional uncertainty does not silently upgrade quality", () => {
  const r = fixture();
  r.canonicalAnalysis.colourAnalysis.technicalAssessment = {
    kind: "uncertain",
    insightId: null,
    explanation: "The value relationship is uncertain.",
  };
  assert.equal(workspaceTeaching(r).assessment.level, "competent");
});

test("cleanup harmony: uncertainty cannot validate a formal complementary scheme", () => {
  assert(
    !/complementary/.test(
      colourTheoryText(
        "Perhaps a deliberate complementary relationship between red and green hues.",
      ),
    ),
  );
});

test("cleanup focal: an explicit linked fact can identify a generically named focal role", () => {
  const r = fixture();
  r.canonicalAnalysis.visualRoles[0].area = "reserved light area";
  assert.equal(
    display.focalIdentityText("The tower is the focal subject.", r),
    "The tower is the focal subject.",
  );
});
test("cleanup focal: supporting context is not mistaken for a competing focal claim", () => {
  const r = fixture(),
    text =
      "The focal area around the tower against the quiet sky establishes hierarchy.";
  assert.equal(display.focalIdentityText(text, r), text);
});

for (const classification of ["clear_issue", "optional_refinement"])
  test(`cleanup final safe state: card limits cannot erase a supported material ${classification}`, () => {
    const r = fixture(),
      i = issue(r);
    i.classification = classification;
    const { assessCoaching } = loadShared(
      "../shared/coachingAssessment.ts",
      "lib/overlays.ts",
    );
    assert.equal(assessCoaching(r, [], [i]).level, "competent");
    assert.equal(assessCoaching(r, [], []).level, "strong");
  });
