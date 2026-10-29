const test = require("node:test"),
  assert = require("node:assert/strict"),
  load = require("./helpers/learning-loader.cjs"),
  fixture = require("./helpers/video-fixture.cjs");
const {
  validMedia,
  publicationErrors,
  catalogueErrors,
  videoUrls,
  validCaptions,
} = load("learning/media.ts");
const { SegmentPlayback, playerFailure } = load("learning/videoPlayer.ts");
const { selectDemonstrations } = load("learning/videoSelection.ts");
test("synthetic complete review satisfies the publication contract; empty production is honest", () => {
  assert(validMedia(fixture()));
  assert.deepEqual(publicationErrors(fixture()), []);
  assert.deepEqual(
    catalogueErrors(load("learning/media.ts").mediaResources),
    [],
  );
});
const invalids = {
  "bad video ID": (r) => (r.videoId = "javascript:1"),
  "unsupported host": (r) =>
    (r.url = "https://attacker.invalid/watch?v=" + r.videoId),
  "unsafe channel": (r) => (r.channelUrl = "javascript:alert(1)"),
  "channel credentials": (r) =>
    (r.channelUrl = "https://user@www.youtube.com/@demo"),
  "no attribution": (r) => (r.creator = " "),
  "unknown lesson": (r) => (r.lessonIds = ["invented"]),
  "unknown skill": (r) => (r.skillIds = ["invented"]),
  "unknown style": (r) => (r.styleTags = ["invented"]),
  "unknown subject": (r) => (r.subjectTags = ["invented"]),
  "invalid segment ID": (r) => (r.segments[0].id = "../bad"),
  "duplicate segment ID": (r) => (r.segments[1].id = r.segments[0].id),
  "negative time": (r) => (r.segments[0].start = -1),
  "reversed time": (r) => (r.segments[0].end = 20),
  "beyond duration": (r) => (r.segments[0].end = 901),
  "zero length": (r) => (r.segments[0].end = 30),
  "fractional time": (r) => (r.segments[0].start = 30.5),
  "wrong calculated duration": (r) => (r.segments[0].durationSeconds = 121),
  "unknown step": (r) => (r.segments[0].stepId = "made-up"),
  "stale lesson version": (r) => (r.segments[0].lessonVersion = 2),
  "wrong parent": (r) => (r.segments[0].resourceId = "other"),
  "unknown learner level": (r) => (r.segments[0].levels = ["expert"]),
  "unsupported language": (r) => (r.language = "xx"),
  "unknown caption language": (r) => (r.captions.languages = ["fa"]),
  "unsubstantiated human caption claim": (r) => (r.captions.kind = "human"),
  "invented translation assurance": (r) =>
    (r.captions.translation = "accurate"),
  "impossible date": (r) => (r.verifiedAt = "2026-02-30"),
  "future date": (r) => (r.verifiedAt = "2099-01-01"),
  "score above rubric maximum": (r) => (r.review.scores.technical = 26),
  "score extra invented dimension": (r) => (r.review.scores.popularity = 5),
  "missing observation cues": (r) => (r.segments[0].prompts = []),
  "missing controlled variable": (r) => (r.segments[0].practice.variable = ""),
  "overlapping ranges same step": (r) => {
    r.segments[1].start = 100;
    r.segments[1].end = 220;
  },
};
for (const [name, mutate] of Object.entries(invalids))
  test("media rejects " + name, () => {
    const r = fixture();
    mutate(r);
    assert(!validMedia(r));
    assert(publicationErrors(r).length);
  });
for (const [name, mutate] of Object.entries({
  "description only": (r) => (r.review.status = "metadata-verified"),
  "no owner approval": (r) =>
    (r.review.evidence = r.review.evidence.filter((e) => e.kind !== "owner")),
  "no direct content viewing": (r) =>
    (r.review.evidence = r.review.evidence.filter((e) => e.kind !== "content")),
  "chapter list is not direct segment review": (r) =>
    r.review.evidence
      .filter((e) => e.kind === "segment")
      .forEach((e) => (e.method = "official-page")),
  "synthetic embed URL is not embed verification": (r) =>
    (r.review.evidence = r.review.evidence.filter((e) => e.kind !== "embed")),
  "one unverified segment": (r) => (r.segments[1].verification = "pending"),
  "critical issue despite high score": (r) =>
    (r.review.criticalIssues = ["Technique incorrect"]),
  "score below 85": (r) => (r.review.scores.technical = 0),
  unscored: (r) => (r.review.scores = null),
  retired: (r) => {
    r.active = false;
    r.review.status = "retired";
  },
  "temporarily unavailable": (r) => (r.availability = "unavailable"),
  "unknown embeddability": (r) => (r.embeddable = null),
}))
  test("publication blocks " + name, () => {
    const r = fixture();
    mutate(r);
    assert(publicationErrors(r).length);
    assert.deepEqual(
      selectDemonstrations({
        lessonId: "water-brush",
        stepId: "set-up",
        profile: null,
        resources: [r],
      }),
      [],
    );
  });
test("adjacent windows are valid; contradictory overlaps are not", () => {
  const r = fixture();
  r.segments[1].start = 150;
  r.segments[1].end = 270;
  assert(validMedia(r));
  r.segments[1].start = 149;
  r.segments[1].end = 269;
  assert(!validMedia(r));
});
test("duplicate resources and cross-resource segment identifiers rejected", () => {
  const a = fixture(),
    b = fixture();
  assert(catalogueErrors([a, b]).includes("Duplicate resource/video ID"));
  b.id = "other";
  b.videoId = "TESTonly002";
  b.url = "https://www.youtube.com/watch?v=" + b.videoId;
  b.segments.forEach((s) => (s.resourceId = b.id));
  assert(catalogueErrors([a, b]).includes("Duplicate segment ID"));
});
test("verified embedding restriction permits an attributed external route", () => {
  const r = fixture();
  r.embeddable = false;
  r.review.evidence = r.review.evidence.filter((e) => e.kind !== "embed");
  assert.deepEqual(publicationErrors(r), []);
});
test("caption absence and human caption claims require dated evidence", () => {
  const r = fixture();
  r.captions = {
    presence: "present",
    languages: ["fa"],
    kind: "human",
    translation: "unverified",
    checkedAt: "2026-01-01",
    evidence: "Synthetic caption observation, not a real video",
  };
  assert(validMedia(r));
  r.captions.checkedAt = null;
  assert(!validMedia(r));
});
test("absolute start/end, default caption omission, safe origin and full-video route", () => {
  const r = fixture(),
    u = videoUrls(r, 180, 300, undefined, "https://medigol.github.io");
  const q = new URL(u.embed).searchParams;
  assert.equal(q.get("start"), "180");
  assert.equal(q.get("end"), "300");
  assert.equal(q.get("origin"), "https://medigol.github.io");
  assert.equal(q.get("enablejsapi"), "1");
  assert(!q.has("cc_load_policy"));
  assert(!q.has("cc_lang_pref"));
  assert.equal(u.full, r.url);
  assert.equal(u.external, r.url + "&t=180s");
  assert.equal(q.get("autoplay"), "0");
});
test("caption requests are explicit, not track guarantees", () => {
  const u = videoUrls(fixture(), 30, 150, { mode: "prefer", language: "fa" });
  const q = new URL(u.embed).searchParams;
  assert.equal(q.get("cc_load_policy"), "1");
  assert.equal(q.get("cc_lang_pref"), "fa");
  assert(!validCaptions({ mode: "prefer", language: "xx" }));
  assert(!validCaptions({ mode: "force", language: "fa" }));
});
for (const [start, end] of [
  [-1, 20],
  [0, 0],
  [30, 29],
  [30, 901],
  [30, Infinity],
  [NaN, 40],
])
  test(`invalid absolute window ${start}..${end} omitted`, () =>
    assert.equal(videoUrls(fixture(), start, end), null));
for (const origin of [
  "javascript:alert(1)",
  "http://untrusted.invalid",
  "https://medigol.github.io/path",
  "https://user:pass@medigol.github.io",
])
  test("unsafe identity origin rejected " + origin, () =>
    assert.equal(videoUrls(fixture(), 30, 150, undefined, origin), null),
  );
function player() {
  const calls = [],
    notices = [];
  const api = {
    time: 30,
    state: 5,
    cueVideoById: (c) => calls.push(["cue", c]),
    loadVideoById: (c) => calls.push(["load", c]),
    playVideo: () => calls.push(["play"]),
    pauseVideo: () => calls.push(["pause"]),
    getCurrentTime() {
      return this.time;
    },
    getPlayerState() {
      return this.state;
    },
    destroy: () => calls.push(["destroy"]),
  };
  return {
    api,
    calls,
    notices,
    c: new SegmentPlayback(
      api,
      { videoId: "abcDEF123_-", startSeconds: 30, endSeconds: 150 },
      (n) => notices.push(n),
    ),
  };
}
test("play request is not evidence of playing; provider event is required", () => {
  const { c, api, notices } = player();
  c.select({ videoId: "abcDEF123_-", startSeconds: 30, endSeconds: 150 });
  c.play();
  assert.equal(notices.at(-1).state, "ready");
  api.state = 1;
  c.event(1);
  assert.equal(notices.at(-1).state, "playing");
});
test("A to B and replay restore BOTH absolute bounds without seekTo or new player", () => {
  const { c, calls } = player();
  const b = { videoId: "abcDEF123_-", startSeconds: 180, endSeconds: 300 };
  c.select(b);
  c.replay();
  assert.deepEqual(calls, [
    ["cue", b],
    ["load", b],
  ]);
  assert(!calls.some((x) => x[0] === "destroy"));
});
test("switching videos restores the new identity with the range", () => {
  const { c, calls } = player();
  const cue = { videoId: "TESTonly002", startSeconds: 0, endSeconds: 60 };
  c.select(cue);
  c.replay();
  assert.deepEqual(calls.at(-1), ["load", cue]);
});
test("seek beyond or before a window pauses and reports uncertainty, replay is explicit", () => {
  for (const time of [0, 500]) {
    const { c, api, calls, notices } = player();
    api.state = 1;
    api.time = time;
    c.poll();
    assert.equal(notices.at(-1).state, "outside-segment");
    c.event(2);
    assert.equal(notices.at(-1).state, "outside-segment");
    assert.equal(calls.filter((x) => x[0] === "pause").length, 1);
    c.replay();
    assert.equal(calls.at(-1)[0], "load");
  }
});
test("near endpoint has a viewing-window state only, no lesson callback", () => {
  const { c, api, notices } = player();
  api.state = 1;
  api.time = 150;
  c.poll();
  assert.equal(notices.at(-1).state, "segment-ended");
});
test("premature end is not claimed as a watched segment", () => {
  const { c, notices } = player();
  c.event(0);
  assert.equal(notices.at(-1).state, "paused");
});
test("paused provider is not polled as playing", () => {
  const { c, api, notices } = player();
  api.state = 2;
  api.time = 600;
  c.poll();
  assert.deepEqual(notices, []);
});
test("dispose is idempotent, stops media, destroys player and ignores late events", () => {
  const { c, calls, notices } = player();
  c.dispose();
  c.dispose();
  c.event(1);
  c.replay();
  c.error(100);
  assert.deepEqual(calls, [["pause"], ["destroy"]]);
  assert.deepEqual(notices, []);
});
for (const [code, state] of [
  [2, "error"],
  [5, "error"],
  [100, "unavailable"],
  [101, "restricted"],
  [150, "restricted"],
  [153, "error"],
])
  test("provider error " + code + " has a factual fallback", () => {
    const { c, notices } = player();
    c.error(code);
    assert.equal(notices.at(-1).state, state);
    assert.equal(playerFailure(code).state, state);
  });
const select = (resources, extra = {}) =>
  selectDemonstrations({
    lessonId: "water-brush",
    stepId: "set-up",
    profile: null,
    resources,
    ...extra,
  });
test("exact objective precedes a stylistically attractive generic lesson demo", () => {
  const a = fixture(),
    b = fixture();
  b.id = "generic";
  b.segments.forEach((s) => {
    s.resourceId = b.id;
    delete s.stepId;
  });
  assert.equal(select([b, a])[0].resource.id, a.id);
});
test("unrelated lessons, reflection and absent approved videos give no recommendation", () => {
  assert.deepEqual(select([]), []);
  assert.deepEqual(select([fixture()], { stepId: "reflect" }), []);
  assert.deepEqual(
    select([fixture()], { lessonId: "three-values", stepId: "map" }),
    [],
  );
});
test("advanced-only demonstration does not displace essential beginner technique", () => {
  const r = fixture();
  r.segments.forEach((s) => (s.levels = ["advanced"]));
  assert.deepEqual(select([r]), []);
});
test("separate viewing and practice duration; video never squeezed into 10 minutes", () => {
  const r = fixture();
  r.segments[0].start = 0;
  r.segments[0].end = 600;
  r.segments[0].durationSeconds = 600;
  r.segments = r.segments.slice(0, 1);
  const profile = load("learning/catalogue.ts").defaultProfile;
  const p = {
    ...profile,
    experience: "beginner",
    minutes: 10,
    format: "reading",
  };
  const d = select([r], { profile: p })[0];
  assert(d.longerSession);
  assert.match(d.reason, /separate 10-minute viewing/);
  assert.match(d.reason, /written guide/);
});
test("one primary plus a meaningfully different alternative, not a directory", () => {
  const r = fixture();
  const d = select([r]);
  assert.equal(d.length, 2);
  r.segments[1].approach = r.segments[0].approach;
  assert.equal(select([r]).length, 1);
});
test("coverage matrix maps every actual step once, without guessed video identifiers", () => {
  const m = require("../docs/video/coverage.json");
  const items = load("learning/content.ts").items;
  assert.equal(
    m.rows.length,
    items.reduce((n, i) => n + i.steps.length, 0),
  );
  assert.equal(
    new Set(m.rows.map((r) => r.lessonId + ":" + r.stepId)).size,
    m.rows.length,
  );
  for (const r of m.rows) {
    assert(
      items
        .find((i) => i.id === r.lessonId)
        .steps.some((s) => s.id === r.stepId),
    );
    const known = new Set(
      require("../docs/video/final-handoff/evidence.json").candidates.map(
        (c) => c.id,
      ),
    );
    assert(
      r.candidateVideoIds.every((id) => known.has(id)),
      "research IDs must come from the final owner handoff",
    );
    assert.equal(r.approvedResourceId, null);
  }
});

test("equally suitable segments preserve the curated order, not alphabetical IDs", () => {
  const r = fixture();
  assert.equal(select([r])[0].segment.id, r.segments[0].id);
});
test("iframe boundary rejects source tampering before any network request", () => {
  const { validPlayerUrl } = load("learning/media.ts"),
    o = "https://medigol.github.io",
    url = videoUrls(fixture(), 30, 150, undefined, o).embed;
  assert(validPlayerUrl(url, o));
  for (const s of [
    url.replace(
      "youtube-nocookie.com",
      "youtube-nocookie.com.attacker.invalid",
    ),
    url + "&learner=private",
    url + "&end=400",
    url.replace("autoplay=0", "autoplay=1"),
    url.replace("end=150", "end=0"),
    url + "#fragment",
    "javascript:alert(1)",
  ])
    assert(!validPlayerUrl(s, o), s);
  assert(!validPlayerUrl(url, "https://other.invalid"));
});
test("late provider events after a fatal error cannot revive playing or replay", () => {
  const { c, api, notices, calls } = player();
  c.error(100);
  const count = calls.length;
  api.state = 1;
  c.event(1);
  c.replay();
  c.poll();
  assert.equal(notices.at(-1).state, "unavailable");
  assert.equal(calls.length, count);
});
