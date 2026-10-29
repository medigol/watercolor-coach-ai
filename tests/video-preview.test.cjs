const test = require("node:test"), assert = require("node:assert/strict"), fs = require("node:fs");
const load = require("./helpers/learning-loader.cjs");
const { previewCandidates } = load("learning/videoPreviewCatalogue.ts");
const { previewCatalogueErrors, previewUrls, previewMatches, blankPreviewReview, decodePreviewReview, previewReviewKey, previewReviewExport } = load("learning/videoPreview.ts");
const { validMedia, publicationErrors, mediaResources, validPlayerUrl } = load("learning/media.ts");
const { SegmentPlayback } = load("learning/videoPlayer.ts");
const origin = "https://medigol.github.io", captions = { mode: "default", language: "default" };
test("all 17 preview identities match authoritative handoff without private owner fields", () => {
  const supplied = require("../docs/video/final-handoff/evidence.json");
  assert.equal(previewCandidates.length, 17);
  assert.deepEqual(previewCatalogueErrors(previewCandidates), []);
  for (const c of previewCandidates) {
    const source = supplied.candidates.find(s => s.id === c.id);
    assert(source); assert.equal(c.videoId, source.videoId); assert.equal(c.url, source.url);
    assert.equal(c.researchTitle, source.suppliedTitleLabel);
    for (const key of ["notes", "ownerScreening", "sourceMetadata", "reviewer", "sourceLedger", "verified", "review"]) assert(!(key in c));
    assert(!validMedia(c)); assert(publicationErrors(c).length);
  }
  assert.equal(mediaResources.length, 0);
});
test("all four screenings, two proposals and unknown endpoints remain distinct", () => {
  assert.equal(previewCandidates.filter(c => c.ownerScreened).length, 4);
  const steve = previewCandidates.find(c => c.id === "steve-flat-wash"), paul = previewCandidates.find(c => c.id === "paul-values"), louise = previewCandidates.find(c => c.id === "louise-blend");
  assert.equal(steve.windows[0].start, 47); assert.equal(steve.windows[0].end, 702);
  assert.equal(paul.windows[0].start, 37); assert.equal(paul.windows[0].end, 852);
  assert.equal(louise.windows[0].start, 90); assert.equal(louise.windows[0].end, undefined);
  assert(previewCandidates.every(c => c.windows.every(w => !Object.hasOwn(w, "verified"))));
});
test("both Café conflicting publisher endpoints remain visible proposals", () => {
  const c = previewCandidates.find(c => c.id === "cafe-cloud-tips");
  assert(c.windows.some(w => w.start === 138 && w.end === 162 && w.source === "publisher-hint"));
  assert(c.windows.some(w => w.start === 138 && w.end === 298 && w.source === "conflicting-publisher-hint"));
});
test("all three Javid candidates are optional advanced, without invented boundaries", () => {
  const entries = previewCandidates.filter(c => c.advancedOnly);
  assert.deepEqual(entries.map(c => c.videoId), ["nbszEH7DO6w", "3sNvfeoXi3o", "8sKFqQAW5Ns"]);
  assert(entries.every(c => c.windows.length === 0 && !c.ownerScreened));
});
for (const name of ["extra owner note", "unsafe URL", "unknown lesson", "reversed window", "duplicate window", "invented evidence"]) test("reject preview data: " + name, () => {
  const c = structuredClone(previewCandidates[0]);
  if (name === "extra owner note") c.notes = "private";
  if (name === "unsafe URL") c.url = "https://youtube.com.attacker.invalid/";
  if (name === "unknown lesson") c.related[0].lessonId = "invented";
  if (name === "reversed window") c.windows[0].end = c.windows[0].start;
  if (name === "duplicate window") c.windows.push(c.windows[0]);
  if (name === "invented evidence") c.windows[0].source = "verified";
  assert(previewCatalogueErrors([c]).length);
});
test("duplicate preview identities rejected", () => assert(previewCatalogueErrors([previewCandidates[0], previewCandidates[0]]).length));
test("nested private notes and unsupported screening assurances cannot enter preview metadata", () => {
  for (const change of [c => c.windows[0].ownerNote = "private", c => c.related[0].reviewer = "private", c => c.ownerScreened = "professionally verified"]) {
    const c = structuredClone(previewCandidates[0]); change(c); assert(previewCatalogueErrors([c]).length);
  }
});
test("original mode omits endpoint for every candidate; never invents duration", () => {
  for (const c of previewCandidates) {
    const u = previewUrls(c, "original", captions, origin), q = new URL(u.embed).searchParams;
    assert.equal(q.get("start"), "0"); assert.equal(q.get("end"), null); assert.equal(u.cue.endSeconds, undefined);
    assert(validPlayerUrl(u.embed, origin, true)); assert(!validPlayerUrl(u.embed, origin));
    assert.equal(q.get("cc_load_policy"), null); assert.equal(u.full, c.url);
  }
});
test("owner start-only is unbounded; proposed end is absolute, never a duration", () => {
  const l = previewCandidates.find(c => c.id === "louise-blend"), s = previewCandidates.find(c => c.id === "steve-flat-wash");
  const a = previewUrls(l, "owner-start", captions, origin), b = previewUrls(s, "owner-proposal", captions, origin);
  assert.equal(a.cue.startSeconds, 90); assert.equal(a.cue.endSeconds, undefined);
  assert.equal(new URL(a.embed).searchParams.get("end"), null);
  assert.equal(new URL(b.embed).searchParams.get("end"), "702"); assert(validPlayerUrl(b.embed, origin));
});
test("unknown window, unsafe origin and unknown caption settings rejected", () => {
  const c = previewCandidates[0];
  assert.equal(previewUrls(c, "invented", captions, origin), null);
  for (const o of ["file://", "javascript:alert(1)", "http://attacker.invalid", origin + "/path"]) assert.equal(previewUrls(c, "original", captions, o), null);
  assert.equal(previewUrls(c, "original", { mode: "force", language: "fa" }, origin), null);
});
test("caption request explicit; no claim of available Persian captions", () => {
  const u = new URL(previewUrls(previewCandidates[0], "original", { mode: "prefer", language: "fa" }, origin).embed);
  assert.equal(u.searchParams.get("cc_load_policy"), "1"); assert.equal(u.searchParams.get("cc_lang_pref"), "fa");
});
test("full-video player does not manufacture an endpoint or exercise completion", () => {
  const calls = [], notices = [], api = { cueVideoById: c => calls.push(["cue", c]), loadVideoById: c => calls.push(["load", c]), pauseVideo: () => calls.push(["pause"]), playVideo() {}, getCurrentTime: () => 70000, getPlayerState: () => 1, destroy() {} };
  const cue = { videoId: previewCandidates[0].videoId, startSeconds: 0 }, player = new SegmentPlayback(api, cue, n => notices.push(n));
  player.select(cue); player.replay(); player.poll(); player.event(0);
  assert.deepEqual(calls, [["cue", cue], ["load", cue]]); assert.equal(notices.at(-1).state, "paused"); assert.match(notices.at(-1).message, /does not complete/);
});
test("replay after changing back from a bounded clip removes the old end", () => {
  const calls = [], api = { cueVideoById: c => calls.push(c), loadVideoById: c => calls.push(c), pauseVideo() {}, playVideo() {}, getCurrentTime: () => 0, getPlayerState: () => 5, destroy() {} };
  const player = new SegmentPlayback(api, { videoId: "alq0YqX86gs", startSeconds: 47, endSeconds: 702 }, () => {});
  player.select({ videoId: "alq0YqX86gs", startSeconds: 0 }); player.replay(); assert(!("endSeconds" in calls.at(-1)));
});
test("review uses separate account-scoped storage and accepts only explicit observations", () => {
  const c = previewCandidates[0], draft = blankPreviewReview(c.id);
  assert.equal(draft.observedStart, ""); assert.equal(draft.observedEnd, ""); assert.equal(draft.playback, "not-tested");
  assert.deepEqual(decodePreviewReview(JSON.stringify(draft), c.id), draft);
  assert.notEqual(previewReviewKey("a", c.id), previewReviewKey("b", c.id));
  assert(!previewReviewKey("a", c.id).includes("learning:v1"));
  assert.throws(() => decodePreviewReview(JSON.stringify({ ...draft, productionApproved: true }), c.id));
  assert.throws(() => decodePreviewReview(JSON.stringify(draft), "other-video"));
  assert.throws(() => decodePreviewReview("invalid", c.id));
  assert.throws(() => decodePreviewReview(" ".repeat(20001), c.id));
});
test("review exports are evidence only, without account identity or approval", () => {
  const out = previewReviewExport([blankPreviewReview(previewCandidates[0].id)], previewCandidates[0].windows[0]);
  assert.equal(out.productionApproved, false); assert.equal(out.ownerExactSegmentApproval, false); assert(!("accountId" in out)); assert.equal(out.reviews[0].playback, "not-tested");
});
test("curriculum links use actual step IDs and respect unrelated steps", () => {
  const paul = previewCandidates.find(c => c.id === "paul-values");
  assert(previewMatches(paul, "three-values", "look")); assert(!previewMatches(paul, "water-brush", "look")); assert(!previewMatches(paul, "three-values", "invented"));
});
test("preview route and player contain no backend calls or learning completion writes", () => {
  for (const file of ["app/(tabs)/learn/videos.tsx", "components/learning/PreviewVideoPlayer.tsx", "components/learning/PreviewReviewForm.tsx"]) {
    const s = fs.readFileSync(file, "utf8");
    assert(!/finishStep|editEntry|supabase|functions\.invoke|fetch\(/.test(s), file);
    assert(!s.includes("video-fixture") && !s.includes("mock-youtube"));
  }
});
