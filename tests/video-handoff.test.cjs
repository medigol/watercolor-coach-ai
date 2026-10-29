const test = require("node:test"),
  assert = require("node:assert/strict"),
  fs = require("node:fs"),
  path = require("node:path");
const {
    validate,
    csv,
    researchPlanFor,
  } = require("../scripts/import-video-handoff.cjs"),
  h = require("../docs/video/final-handoff/evidence.json");
const load = require("./helpers/learning-loader.cjs"),
  { mediaResources, publicationErrors, validMedia } = load("learning/media.ts"),
  fixture = require("./helpers/video-fixture.cjs");
test("final handoff validates 17 authentic candidate identities and all actual curriculum steps", () => {
  assert.deepEqual(validate(h), []);
  assert.equal(h.candidates.length, 17);
  assert.equal(new Set(h.candidates.map((c) => c.videoId)).size, 17);
  assert.equal(h.coverage.length, 27);
  assert.equal(h.coverage.filter((r) => r.need === "unnecessary").length, 6);
});
test("four owner screenings preserved without invented professional scores or clip approval", () => {
  const owner = h.candidates.filter((c) => c.ownerScreening);
  assert.equal(owner.length, 4);
  for (const c of owner) {
    assert.equal(c.ownerScreening.clarity, "good");
    assert.equal(c.ownerScreening.fit, "exact");
    assert.equal(c.verification.independentContentReview, false);
    assert.equal(c.verification.score, null);
    assert.equal(c.verification.finalSegment, null);
    assert.equal(c.ownerScreening.releaseApproval, false);
  }
});
test("Steve and Paul witnessed proposals preserved exactly, not inferred durations", () => {
  for (const [id, start, end] of [
    ["steve-flat-wash", 47, 702],
    ["paul-values", 37, 852],
  ]) {
    const c = h.candidates.find((c) => c.id === id);
    assert.equal(c.ownerScreening.witnessedWindow.startSeconds, start);
    assert.equal(c.ownerScreening.witnessedWindow.endSeconds, end);
    assert.equal(c.verification.totalDurationSeconds, null);
    assert.equal(c.verification.finalSegment, null);
  }
});
test("Louise start-only and Cafe unknown range/language do not acquire a guessed end", () => {
  const l = h.candidates.find((c) => c.id === "louise-blend"),
    c = h.candidates.find((c) => c.id === "cafe-cloud-tips");
  assert.equal(l.ownerScreening.startOnlyHint, 90);
  assert.equal(l.ownerScreening.witnessedWindow, null);
  assert.equal(c.ownerScreening.witnessedWindow, null);
  assert.equal(c.ownerScreening.narrationAsObserved, null);
  assert.equal(
    h.queue.find((q) => q.candidateId === l.id).finalEndSeconds,
    null,
  );
});
test("all fourteen publisher hints remain proposals and conflicting endpoints remain separate", () => {
  assert.equal(
    h.candidates.reduce((n, c) => n + c.publisherHints.length, 0),
    14,
  );
  for (const c of h.candidates)
    for (const hint of c.publisherHints) {
      assert.equal(hint.finalSegmentVerified, false);
      assert.equal(hint.witnessedByOwner, false);
    }
  const conflict = h.candidates.find((c) => c.id === "cafe-cloud-tips")
    .sourceConflicts[0];
  assert.equal(conflict.startSeconds, 138);
  assert.equal(conflict.csvEndHint, 162);
  assert.equal(conflict.candidateJsonEndHint, 298);
});
test("Paul is the value-planning proposal and genuine lost-edge primary remains unfilled", () => {
  assert.equal(
    h.coverage.find(
      (r) => r.lessonId === "three-values" && r.stepId === "first",
    ).primaryCandidateId,
    "paul-values",
  );
  assert.equal(
    h.cards.find((c) => c.lessonId === "three-values" && c.stepId === "first")
      .proposedCandidateId,
    "paul-values",
  );
  const lost = h.coverage.find(
    (r) => r.lessonId === "edge-families" && r.stepId === "lost",
  );
  assert.equal(lost.primaryCandidateId, null);
  assert.equal(lost.matchingRisk, "CRITICAL");
  assert.equal(
    h.cards.find((c) => c.stepId === "lost").proposedCandidateId,
    null,
  );
});
test("Javid has three actionable advanced plans; no beginner prerequisite or invented timestamps", () => {
  assert.equal(h.advancedPlan.resources.length, 3);
  assert.equal(h.advancedPlan.selectedForNextInspection, "javid-cityscape");
  assert.equal(
    researchPlanFor(h, "beginner").filter((c) => c.id.startsWith("javid-"))
      .length,
    0,
  );
  assert.equal(
    researchPlanFor(h, "intermediate").filter((c) => c.id.startsWith("javid-"))
      .length,
    3,
  );
  for (const p of h.advancedPlan.resources) {
    assert.equal(p.startSeconds, null);
    assert.equal(p.endSeconds, null);
    assert.equal(p.productionApproved, false);
    assert(p.originalActivity.practise.includes("own subject"));
  }
  assert(
    h.coverage.every((r) => !(r.primaryCandidateId || "").startsWith("javid-")),
  );
});
test("eleven original teaching drafts cover materials, controlled practice, observation and reflection", () => {
  assert.equal(h.cards.length, 11);
  for (const c of h.cards) {
    assert.equal(c.actualVideoMatchVerified, false);
    assert.equal(c.productionApproved, false);
    assert(c.beforeWatching && c.understand && c.observe.length >= 2);
    assert(
      c.practice.variable &&
        c.practice.constants.length &&
        c.practice.reflection,
    );
    if (c.proposedCandidateId)
      assert(h.candidates.some((v) => v.id === c.proposedCandidateId));
  }
  const corrected = h.cards.find(
    (c) => c.lessonId === "quiet-landscape" && c.stepId === "finish",
  );
  assert.equal(corrected.proposedCandidateId, "matthew-process-2024");
  assert.equal(corrected.suppliedCandidateId, "matthew-landscape-2025");
});
test("candidate and source hints cannot be passed as production resources", () => {
  assert.deepEqual(mediaResources, []);
  for (const c of h.candidates) {
    assert(publicationErrors(c).length);
    assert.equal(c.verification.productionApproved, false);
  }
});
test("CSV reader handles BOM, quoted commas, doubled quotes and line endings", () => {
  assert.deepEqual(
    csv('\uFEFFid,note\r\na,"two, words"\r\nb,"quote ""yes"""\r\n'),
    [
      { id: "a", note: "two, words" },
      { id: "b", note: 'quote "yes"' },
    ],
  );
  assert.throws(() => csv('a,b\n"open'));
});
test("review board does not load YouTube or import into the application", () => {
  const html = fs.readFileSync(
    path.join(__dirname, "../docs/video/final-handoff/OWNER_REVIEW_BOARD.html"),
    "utf8",
  );
  assert(!/<iframe|<img|<script[^>]+src=/i.test(html));
  assert(html.includes("connect-src 'none'"));
  assert(html.includes("publicationApproval:false"));
  const files = fs
    .readdirSync(path.join(__dirname, "../learning"))
    .filter((f) => /\.ts$/.test(f));
  for (const f of files)
    assert(
      !fs
        .readFileSync(path.join(__dirname, "../learning", f), "utf8")
        .includes("final-handoff/evidence"),
    );
});
test("publication must reject unresolved Made for Kids status despite otherwise complete synthetic approval", () => {
  const r = fixture();
  r.audience = {
    status: "unknown",
    checkedAt: null,
    source: null,
    reviewer: null,
  };
  assert(validMedia(r));
  assert(publicationErrors(r).some((e) => /audience|kids/i.test(e)));
});
test("made-for-kids metadata is representable but excluded from this initial player release", () => {
  const r = fixture();
  r.audience.status = "made-for-kids";
  assert(validMedia(r));
  assert(publicationErrors(r).some((e) => /kids/i.test(e)));
});
test("an unsupported audience assurance cannot be published without dated identity-matched evidence", () => {
  for (const mutate of [
    (r) => delete r.audience,
    (r) => (r.audience.checkedAt = null),
    (r) => (r.audience.source = "https://www.youtube.com/watch?v=another1234"),
    (r) => (r.audience.status = "probably-adult"),
    (r) => (r.audience.reviewer = ""),
  ]) {
    const r = fixture();
    mutate(r);
    assert(!validMedia(r));
    assert(publicationErrors(r).length);
  }
});
test("current supplied owner screening cannot satisfy exact-segment production approval", () => {
  for (const o of require("../docs/video/final-handoff/owner-screening-as-submitted.json")
    .reviewedCandidates) {
    const r = fixture();
    r.review.status = "content-reviewed";
    r.review.evidence = r.review.evidence.filter(
      (e) => !["segment", "owner"].includes(e.kind),
    );
    r.review.evidence.push({
      kind: "content",
      method: "human-review",
      date: "2026-01-01",
      reviewer: "Owner preliminary screening",
      source: r.url,
      note: o.ownerScreening.teachingClarity,
    });
    assert(publicationErrors(r).some((e) => /owner approval|Segment/.test(e)));
  }
});
