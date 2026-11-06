const test = require("node:test"),
  assert = require("node:assert/strict"),
  fs = require("node:fs"),
  crypto = require("node:crypto");
const studio = require("./helpers/reference-loader.cjs")(
  "shared/referenceStudio.ts",
);
const canonical = (value) =>
  Array.isArray(value)
    ? value.map(canonical)
    : value && typeof value === "object"
    ? Object.fromEntries(
      Object.keys(value).sort().map((k) => [k, canonical(value[k])]),
    )
    : value;
test("four original photo cases and separate colour case stay hash-pinned and unauthorised", () => {
  const m = JSON.parse(
    fs.readFileSync("docs/review/photo-reference-studio-acceptance-set.json"),
  );
  assert.equal(m.providerTransmissions, 0);
  assert.equal(m.automaticSequence, false);
  assert.deepEqual(m.cases.map((c) => c.caseId), m.caseOrder);
  assert.deepEqual(m.cases.map((c) => c.category), [
    "landscape",
    "architecture",
    "botanical",
    "people",
    "colour-landscape",
  ]);
  assert.equal(m.firstCaseId, m.cases[0].caseId);
  for (const c of m.cases) {
    assert(studio.validDirection(c.direction));
    assert(studio.validPixels(c.pixels));
    assert.match(c.sha256, /^[a-f0-9]{64}$/);
    assert(c.bytes <= 10 * 1024 * 1024 && c.bytes > 0);
    assert(c.selectedWidth * c.selectedHeight <= 8000000);
    assert.equal(
      c.directionSha256,
      crypto.createHash("sha256").update(JSON.stringify(canonical(c.direction)))
        .digest("hex"),
    );
    assert.equal(c.rights.ownerTransmissionPermission, false);
    assert.equal(c.approvedRequests, 0);
    assert.equal(c.paidBudgetUSD, null);
    assert.equal(c.actualProviderOutput, false);
    assert.equal(c.plannedRequests, 1);
    assert.equal(c.humanReviewRubric.length, 9);
    assert(
      c.humanReviewRubric.every((r) =>
        r.status === "NOT_TESTED" && r.reviewer === null
      ),
    );
    assert(c.rights.basisEvidenceUrl && c.rights.licenceTemplate);
  }
  assert.equal(m.cases[3].rights.modelReleaseObtained, false);
  assert.equal(m.cases[3].rights.likenessReviewRequired, true);
  assert.deepEqual(m.cases.slice(0, 4).map((c) => c.sha256), [
    "da9e2f054a9b2907971245d3d6152366fc6dc4e4b97753fa47ffb19e41956f9d",
    "f0eb3ea412d7068a955e09342a274fc28c92b36a5215fc045040edaaee899894",
    "b71a1e4b3a54cfdcb7f1b357d71dfbc92a358541f3674fc71c47f3fa93a65a7e",
    "99987c2702c7b3e35fd84955c5584a131f3f7bd1e6953124fd969c995692defd",
  ]);
  assert.equal(m.proposedTests[0].id, "A");
  assert.equal(m.proposedTests[1].id, "B");
  for (const c of m.cases) {
    assert.equal(c.independentReviewWorksheet.status, "NOT_RUN");
    assert.equal(c.independentReviewWorksheet.sections.length, 6);
    assert(
      c.independentReviewWorksheet.changeReview.every((x) =>
        x.classification === "NOT_REVIEWED" && x.observedEvidence === null
      ),
    );
  }
});
