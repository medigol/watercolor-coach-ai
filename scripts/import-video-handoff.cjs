// Developer-only editorial import. Never imports into learning/media.ts.
const fs = require("node:fs"),
  path = require("node:path"),
  crypto = require("node:crypto");
const load = require("../tests/helpers/learning-loader.cjs");
const items = load("learning/content.ts").items;
function csv(source) {
  const rows = [];
  let row = [],
    cell = "",
    quoted = false;
  const s = source.replace(/^\uFEFF/, "");
  for (let n = 0; n < s.length; n++) {
    const c = s[n];
    if (c === '"') {
      if (quoted && s[n + 1] === '"') {
        cell += '"';
        n++;
      } else quoted = !quoted;
    } else if (c === "," && !quoted) {
      row.push(cell);
      cell = "";
    } else if ((c === "\n" || c === "\r") && !quoted) {
      if (c === "\r" && s[n + 1] === "\n") n++;
      row.push(cell);
      if (row.some(Boolean)) rows.push(row);
      row = [];
      cell = "";
    } else cell += c;
  }
  if (quoted) throw Error("Unterminated CSV quote");
  if (cell || row.length) {
    row.push(cell);
    rows.push(row);
  }
  const keys = rows.shift();
  return rows.map((r) => {
    if (r.length !== keys.length) throw Error("CSV column mismatch");
    return Object.fromEntries(keys.map((k, n) => [k, r[n]]));
  });
}
function seconds(t) {
  if (!/^\d{1,3}:\d{2}$/.test(t)) throw Error("Invalid supplied time");
  const [m, s] = t.split(":").map(Number);
  if (s >= 60) throw Error("Invalid supplied seconds");
  return m * 60 + s;
}
function build(input) {
  const cs = input.candidates.candidates,
    owner = input.owner.reviewedCandidates,
    coverage = input.coverage;
  if (
    cs.length !== 17 ||
    owner.length !== 4 ||
    coverage.length !== 27 ||
    input.chapters.length !== 14 ||
    input.cards.activities.length !== 11
  )
    throw Error("Unexpected final handoff counts");
  const known = new Map(cs.map((c) => [c.id, c]));
  if (known.size !== 17) throw Error("Duplicate candidates");
  const rows = coverage.map((r) => {
    const item = items.find((i) => i.id === r.lessonId),
      step = item?.steps.find((s) => s.id === r.stepId);
    if (!step) throw Error("Unknown curriculum step");
    for (const id of [
      r.primaryVideoCandidateId,
      r.alternativeCandidateId,
    ].filter(Boolean))
      if (!known.has(id)) throw Error("Unknown mapped candidate");
    const noVideo = r.releaseStatus === "NO_VIDEO_NEEDED";
    if (noVideo && (r.primaryVideoCandidateId || r.alternativeCandidateId))
      throw Error("Filler on no-video step");
    if ((r.primaryVideoCandidateId || "").startsWith("javid-"))
      throw Error("Javid cannot be a core prerequisite");
    return {
      lessonId: item.id,
      stepId: step.id,
      skillIds: item.skillIds,
      need: noVideo ? "unnecessary" : "helpful",
      primaryCandidateId: r.primaryVideoCandidateId || null,
      alternativeCandidateId: r.alternativeCandidateId || null,
      alternativeExperience: (r.alternativeCandidateId || "").startsWith(
        "javid-",
      )
        ? ["intermediate", "advanced"]
        : null,
      mustVerify: r.mustVerifyInActualVideo,
      proposedPractice: r.originalPractice,
      matchingRisk: r.matchingRisk,
      qaNote: r.qaNote || null,
      approvedSegmentId: null,
      releaseStatus: r.releaseStatus,
    };
  });
  if (
    new Set(rows.map((r) => r.lessonId + ":" + r.stepId)).size !== 27 ||
    rows.filter((r) => r.need === "unnecessary").length !== 6
  )
    throw Error("Invalid coverage");
  const candidates = cs.map((c) => {
    if (
      !/^[\w-]{11}$/.test(c.youtubeId) ||
      c.canonicalYouTubeURL !== `https://www.youtube.com/watch?v=${c.youtubeId}`
    )
      throw Error("Unsafe candidate URL");
    const suppliedOwner = owner.find((o) => o.candidateId === c.id);
    if (suppliedOwner && suppliedOwner.videoId !== c.youtubeId)
      throw Error("Owner evidence identity mismatch");
    const raw = suppliedOwner?.ownerScreening;
    const mappings = rows.filter((r) =>
      [r.primaryCandidateId, r.alternativeCandidateId].includes(c.id),
    );
    const hints = input.chapters
      .filter((h) => h.candidateId === c.id)
      .map((h, n) => ({
        id: `${c.id}-publisher-${n + 1}`,
        label: h.chapterLabel,
        startSeconds: seconds(h.startPublished),
        endHintSeconds: seconds(h.endNextChapter),
        source: h.source,
        evidence: "SUPPLIED_PUBLISHER_CHAPTER_HINT",
        ownerAcceptedForResearch: true,
        witnessedByOwner: false,
        finalSegmentVerified: false,
      }));
    const sourceHints = c.publisherChapterWindows || [];
    const conflicts = hints.flatMap((h) =>
      sourceHints
        .filter(
          (s) =>
            s.proposedStartSeconds === h.startSeconds &&
            s.proposedEndSecondsExclusive !== h.endHintSeconds,
        )
        .map((s) => ({
          kind: "PUBLISHER_END_HINT_CONFLICT",
          startSeconds: h.startSeconds,
          csvEndHint: h.endHintSeconds,
          candidateJsonEndHint: s.proposedEndSecondsExclusive,
          resolution: "Direct inspection required; neither is a final endpoint",
        })),
    );
    const javid = c.id.startsWith("javid-");
    return {
      id: c.id,
      videoId: c.youtubeId,
      url: c.canonicalYouTubeURL,
      suppliedTitleLabel: c.title,
      titleStatus:
        c.id === "steve-flat-wash"
          ? "DESCRIPTIVE_LABEL_EXACT_TITLE_UNCONFIRMED"
          : "SUPPLIED_RESEARCH_TITLE_NOT_RECHECKED",
      creatorLabel: c.creator,
      sourceMetadata: {
        source: c.sourceURL || c.source,
        category: c.sourceCategory,
        publishedDateAsSupplied: c.publishedDateVerified ?? null,
        channelTextAsSupplied: c.channelVerifiedText ?? null,
        notes: c.publisherNotes ?? c.sourceEvidence ?? null,
        provenance:
          "Final owner handoff; not independently re-verified by this execution",
      },
      ownerShortlistAccepted: true,
      ownerScreening: raw
        ? {
            watchedRelevantPart: true,
            clarity: raw.teachingClarity,
            fit: raw.lessonFit,
            date: raw.date,
            narrationAsObserved: raw.observedNarrationLanguage ?? null,
            witnessedWindow: raw.inspectedRange
              ? {
                  startSeconds: raw.inspectedRange.startSeconds,
                  endSeconds: raw.inspectedRange.endSeconds,
                  scope: "OWNER_WITNESSED_PROPOSAL_NOT_FINAL_CLIP",
                }
              : null,
            startOnlyHint: c.id === "louise-blend" ? 90 : null,
            rawTimeFields: raw.rawTimeFields ?? null,
            captions: "unknown",
            releaseApproval: false,
          }
        : null,
      publisherHints: hints,
      additionalSuppliedSourceHints: sourceHints,
      sourceConflicts: conflicts,
      suppliedCandidateMappings: c.mapping,
      correctedMappings: mappings.map((r) => ({
        lessonId: r.lessonId,
        stepId: r.stepId,
        role:
          r.primaryCandidateId === c.id
            ? "primary-research"
            : "alternative-research",
        experience: javid ? ["intermediate", "advanced"] : null,
      })),
      placement: {
        optionalAdvancedOnly: javid,
        corePrerequisite: false,
        experience: javid
          ? ["intermediate", "advanced"]
          : ["beginner", "developing", "intermediate", "advanced"],
      },
      verification: {
        independentContentReview: false,
        totalDurationSeconds: null,
        finalSegment: null,
        score: null,
        captions: "unknown",
        madeForKids: "unknown",
        embeddability: "unknown",
        livePlayback: false,
        ownerExactSegmentApproval: false,
        productionApproved: false,
      },
    };
  });
  const cards = input.cards.activities.map((a, n) => {
    const mapping = rows.find(
        (r) => r.lessonId === a.lessonId && r.stepId === a.stepId,
      ),
      item = items.find((i) => i.id === a.lessonId),
      step = item.steps.find((s) => s.id === a.stepId);
    const allowed = [
      mapping.primaryCandidateId,
      mapping.alternativeCandidateId,
    ].filter(Boolean);
    const candidateId =
      a.candidateVideoId && allowed.includes(a.candidateVideoId)
        ? a.candidateVideoId
        : mapping.primaryCandidateId;
    const correction =
      candidateId !== a.candidateVideoId
        ? `Supplied card ${a.candidateVideoId || "none"} conflicts with corrected coverage; use ${candidateId || "no primary video"} as the research proposal.`
        : a.pedagogicalCorrection || null;
    const variable = {
      "set-up": "Brush load only; compare repeat strokes before changing it",
      moisture: "Paper moisture only",
      map: "Arrangement of the large value groups",
      first:
        a.lessonId === "three-values"
          ? "Dark-mass grouping only"
          : "One structural relationship",
      soft: "Moisture at the boundary",
      lost: "Presence of part of the shared contour, keeping neighbouring values similar",
      values: "Three-mass arrangement before colour",
      sky: "Paper moisture only",
      hill: "One hill-edge relationship",
      finish: "One accent at a time",
    }[a.stepId];
    return {
      id: `draft-${a.lessonId}-${a.stepId}`,
      lessonId: a.lessonId,
      stepId: a.stepId,
      proposedCandidateId: candidateId,
      suppliedCandidateId: a.candidateVideoId,
      mappingCorrection: correction,
      status: "ORIGINAL_UNPUBLISHED_DRAFT",
      actualVideoMatchVerified: false,
      beforeWatching: a.proposedBeforeWatching,
      observe: [
        step.observe,
        "Compare the visible condition before and after the mark; do not infer an unseen painting process.",
      ],
      understand: step.explanation,
      practice: {
        materials: item.materials,
        action: a.proposedHandsOnExercise,
        variable,
        constants: [
          "Same paper, pigment and viewing distance unless that is the stated variable",
        ],
        success: [a.proposedSuccessCheck],
        reflection: item.reflectionPrompt,
      },
      advancedAlternativeCandidateId:
        a.advancedOptionalCandidateVideoId || null,
      productionApproved: false,
    };
  });
  const advancedPlan = {
    status: "UNPUBLISHED_ADVANCED_OPTIONAL_PLAN",
    selectedForNextInspection: "javid-cityscape",
    selectionBasis:
      "Owner explicitly requests Javid; 2024 listing has supplied identity evidence. This is an inspection priority, not a quality winner.",
    experiences: ["intermediate", "advanced"],
    beginnerPrerequisite: false,
    resources: candidates
      .filter((c) => c.placement.optionalAdvancedOnly)
      .map((c) => ({
        candidateId: c.id,
        url: c.url,
        role:
          c.id === "javid-cityscape"
            ? "Urban simplification comparison"
            : c.id === "javid-cityscape-confirmed-2021"
              ? "Compare free narration and structural explanation"
              : "Atmospheric edge/finishing decisions",
        possibleSteps:
          c.id === "javid-atmosphere"
            ? [
                ["quiet-landscape", "hill"],
                ["quiet-landscape", "finish"],
              ]
            : [
                ["observed-structure", "compare"],
                ["quiet-landscape", "finish"],
              ],
        startSeconds: null,
        endSeconds: null,
        classification:
          "Public artist demonstration/inspiration until narration and teaching are actually inspected",
        mustCheck: [
          "Does the free public video explain the decision sufficiently without paid commentary?",
          "Is critical setup/result visible at normal speed?",
          "Which exact self-contained window serves this optional advanced comparison?",
        ],
        originalActivity: {
          prepare:
            "Use your own small urban or atmospheric study, not a copy of the creator’s painting.",
          observe:
            "If the public demonstration supports it, compare connected major masses and the few marks that preserve readable structure.",
          practise:
            "Make two small thumbnails of your own subject. Keep values and framing fixed; reduce only the number of descriptive marks in the second.",
          success:
            "The intended spatial relationship remains readable after reducing marks.",
          reflect:
            "Which retained relationship mattered more than the omitted detail?",
        },
        productionApproved: false,
      })),
  };
  const order = [
    "steve-flat-wash",
    "paul-values",
    "louise-blend",
    "cafe-cloud-tips",
    "tim-perspective",
    "javid-cityscape",
    "javid-cityscape-confirmed-2021",
    "javid-atmosphere",
  ];
  const queue = [...candidates]
    .sort(
      (a, b) =>
        (order.includes(a.id) ? order.indexOf(a.id) : 99) -
        (order.includes(b.id) ? order.indexOf(b.id) : 99),
    )
    .map((c, n) => ({
      order: n + 1,
      candidateId: c.id,
      url: c.url,
      alreadyAnsweredByOwner: c.ownerScreening
        ? ["Relevant part watched", "Teaching clarity good", "Lesson fit exact"]
        : [],
      ownerWindow: c.ownerScreening?.witnessedWindow || null,
      ownerStartOnly: c.ownerScreening?.startOnlyHint ?? null,
      publisherHints: c.publisherHints,
      finalStartSeconds: null,
      finalEndSeconds: null,
      totalDurationSeconds: null,
      exactObjectives: rows
        .filter((r) =>
          [r.primaryCandidateId, r.alternativeCandidateId].includes(c.id),
        )
        .map((r) => ({
          lessonId: r.lessonId,
          stepId: r.stepId,
          mustObserve: r.mustVerify,
          risk: r.matchingRisk,
        })),
      specificChecks: [
        ...(c.id === "steve-flat-wash"
          ? [
              "Confirm the exact title; the supplied title is descriptive.",
              "Flat-wash steadiness alone does not prove a three-dilution comparison.",
            ]
          : []),
        ...(c.id === "paul-values"
          ? [
              "Within 37–852s find actual light/middle/dark grouping, setup and result; do not equate four monochrome examples with a three-value plan.",
            ]
          : []),
        ...(c.id === "louise-blend"
          ? [
              "90s is a start-only hint: independently establish the endpoint.",
              "Compare hard and soft boundaries. Do not assign this as a lost-edge example unless a shared contour genuinely disappears.",
            ]
          : []),
        ...(c.id === "cafe-cloud-tips"
          ? [
              "No owner times or narration language were recorded; confirm both.",
              "Resolve 02:18–02:42 versus 02:18–04:58 source conflict before selecting an endpoint.",
              "Inspect 04:58–06:24 and 07:19–12:05 as publisher hints, not witnessed clips.",
            ]
          : []),
        ...(c.placement.optionalAdvancedOnly
          ? [
              "Optional intermediate/advanced only; no beginner prerequisite.",
              "Identify narration versus silent/accelerated demonstration and exclude paid-only commentary.",
            ]
          : []),
        ...(c.id === "oliver-landscape"
          ? [
              "Check the supplied warning about audio problems in the first/last stages.",
            ]
          : []),
      ],
      remainingChecks: [
        "Confirm exact title, creator/channel and current total duration.",
        "Inspect the entire relevant technical sequence and result; record exact absolute boundaries only after viewing.",
        "Record narration, pacing, captions and Made for Kids designation; leave unknowns unknown.",
        "Record the 8 rubric subscores after technical/artistic inspection; no critical failure allowed.",
        "Run the shared live-player checklist and obtain approval for this exact video/segment.",
      ],
      releaseEligible: false,
    }));
  return {
    schema: "watercolour-final-handoff-v1",
    date: "2026-10-29",
    counts: {
      candidates: 17,
      ownerScreened: 4,
      ownerFullWitnessedWindows: 2,
      ownerStartOnly: 1,
      publisherHints: 14,
      steps: 27,
      noVideoSteps: 6,
      teachingDrafts: 11,
      javidCandidates: 3,
      published: 0,
    },
    ownerScope: input.direction,
    candidates,
    coverage: rows,
    cards,
    advancedPlan,
    queue,
  };
}
function validate(h) {
  const errors = [],
    byId = new Map(h.candidates.map((c) => [c.id, c]));
  if (byId.size !== 17 || h.coverage.length !== 27)
    errors.push("Wrong catalogue or coverage size");
  for (const c of h.candidates) {
    if (
      c.verification.productionApproved ||
      c.verification.finalSegment ||
      c.verification.score !== null ||
      c.verification.totalDurationSeconds !== null
    )
      errors.push("Unwitnessed promotion: " + c.id);
    if (
      c.placement.optionalAdvancedOnly &&
      c.placement.experience.includes("beginner")
    )
      errors.push("Advanced candidate in beginner plan");
  }
  if (
    h.coverage.find(
      (r) => r.lessonId === "three-values" && r.stepId === "first",
    )?.primaryCandidateId !== "paul-values"
  )
    errors.push("Wrong value mapping");
  if (
    h.coverage.find(
      (r) => r.lessonId === "edge-families" && r.stepId === "lost",
    )?.primaryCandidateId !== null
  )
    errors.push("Soft/lost conflation");
  if (h.coverage.filter((r) => r.need === "unnecessary").length !== 6)
    errors.push("No-video steps changed");
  for (const r of h.coverage)
    if (
      !items
        .find((i) => i.id === r.lessonId)
        ?.steps.some((s) => s.id === r.stepId)
    )
      errors.push("Unknown step");
  return errors;
}
function researchPlanFor(h, experience) {
  return h.candidates.filter((c) =>
    c.placement.experience.includes(experience),
  );
}
module.exports = { csv, seconds, build, validate, researchPlanFor };
if (require.main === module && process.argv[2] === "--validate") {
  const h = JSON.parse(
    fs.readFileSync(
      path.join(__dirname, "../docs/video/final-handoff/evidence.json"),
      "utf8",
    ),
  );
  const errors = validate(h);
  const rawOwner = fs.readFileSync(
    path.join(
      __dirname,
      "../docs/video/final-handoff/owner-screening-as-submitted.json",
    ),
  );
  const expected = h.provenance.fileHashes.find(
    (f) => f.path === "01_OWNER_REVIEW_AS_SUBMITTED.json",
  ).sha256;
  if (crypto.createHash("sha256").update(rawOwner).digest("hex") !== expected)
    errors.push("Owner evidence bytes changed");
  console.log(
    JSON.stringify(
      {
        contract: errors.length ? "FAIL" : "PASS",
        ...h.counts,
        independentContentReviews: 0,
        livePlaybackVerified: false,
        releaseEligible: false,
        errors,
      },
      null,
      2,
    ),
  );
  process.exit(errors.length ? 1 : 0);
}
if (require.main === module) {
  const dir = path.resolve(process.argv[2] || ""),
    read = (name) => fs.readFileSync(path.join(dir, name), "utf8"),
    manifest = JSON.parse(read("MANIFEST_FINAL.json"));
  for (const f of manifest.files) {
    const p = path.resolve(dir, f.path);
    if (!p.startsWith(dir + path.sep)) throw Error("Unsafe manifest path");
    const b = fs.readFileSync(p);
    if (
      b.length !== f.bytes ||
      crypto.createHash("sha256").update(b).digest("hex") !== f.sha256
    )
      throw Error("Manifest mismatch: " + f.path);
  }
  const result = build({
    candidates: JSON.parse(read("03_CANDIDATES_17_WITH_OWNER_SCREENING.json")),
    owner: JSON.parse(read("01_OWNER_REVIEW_AS_SUBMITTED.json")),
    direction: JSON.parse(read("02_OWNER_DIRECTION_AND_SCOPE.json")),
    coverage: csv(read("05_CURRICULUM_COVERAGE_27_STEPS.csv")),
    chapters: csv(read("04_PUBLISHER_CHAPTER_HINTS_14.csv")),
    cards: JSON.parse(read("06_REVISED_ORIGINAL_TEACHING_CARDS_11.json")),
  });
  const errors = validate(result);
  if (errors.length) throw Error(errors.join("; "));
  result.sourceLedger = csv(read("08_SOURCE_LEDGER.csv"));
  result.suppliedStatusAsProvided = csv(read("07_VIDEO_REVIEW_STATUS_17.csv"));
  result.provenance = {
    archiveSha256:
      "5f164b32b1388b6abaaaf09c50fae9a64c2a930309c1e1aa1aaae35f6e1c3b5f",
    manifestSha256: crypto
      .createHash("sha256")
      .update(read("MANIFEST_FINAL.json"))
      .digest("hex"),
    fileHashes: manifest.files.map((f) => ({ path: f.path, sha256: f.sha256 })),
  };
  fs.writeFileSync(
    path.join(__dirname, "../docs/video/final-handoff/evidence.json"),
    JSON.stringify(result, null, 2) + "\n",
  );
  console.log(JSON.stringify(result.counts));
}
