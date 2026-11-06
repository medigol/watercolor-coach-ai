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
test("four real photo cases stay hash-pinned, bounded and unauthorised until explicit owner decisions", () => {
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
});
