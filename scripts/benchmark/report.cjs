const fs = require("node:fs"),
  path = require("node:path"),
  crypto = require("node:crypto");
const { ARMS } = require("./models.cjs");
const { lockedProduction } = require("./production.cjs");
const {
  readPrepared,
  ledgerRead,
  charged,
  verifyJournal,
} = require("./runner.cjs");
const {
  privateDir,
  writePrivate,
  localFile,
  excerpt,
  external,
} = require("./safety.cjs");
const DOMAINS = {
  A: "Media eligibility",
  B: "Visible objects, placement and roles",
  C: "Colour, value and chroma",
  D: "Observed effect versus inferred process",
  E: "Specific educational action and practice",
  F: "No duplicates, filler or invented faults",
  G: "Complete schema and usable layout",
};
const html = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const csv = (v) =>
  '"' +
  String(v ?? "")
    .replace(/^[=+\-@]/, "'$&")
    .replace(/"/g, '""') +
  '"';
const mean = (xs) =>
  xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null;
function percentile(xs, q) {
  if (!xs.length) return null;
  const sorted = xs.slice().sort((a, b) => a - b);
  return sorted[Math.ceil(q * sorted.length) - 1];
}
function outcome(r) {
  return r?.outcome === "uncertain" && r.reasonCode === "crop_needed"
    ? "crop-needed"
    : r?.outcome || "not_run";
}
function matchesExpected(r, c) {
  // Manifest labels are imperative (accept/reject); provider outcomes are past
  // tense (accepted/rejected). Keep the recorded confusion labels unchanged.
  const expected =
    { accept: "accepted", reject: "rejected" }[c.ground_truth] ||
    c.ground_truth;
  const actual = outcome(r);
  return (
    actual === expected ||
    (c.abstention_acceptable && ["uncertain", "crop-needed"].includes(actual))
  );
}
function reviewRows(value, known) {
  if (!value || !Array.isArray(value.reviews))
    throw Error("Invalid review file");
  const seen = new Set();
  return value.reviews.map((r) => {
    if (
      !known.has(r.blindID) ||
      !["R1", "R2"].includes(r.reviewer) ||
      seen.has(r.blindID + ":" + r.reviewer)
    )
      throw Error("Unknown or duplicate blind rating");
    seen.add(r.blindID + ":" + r.reviewer);
    if (
      !Object.keys(DOMAINS).every(
        (k) =>
          Number.isInteger(r.scores?.[k]) &&
          r.scores[k] >= 1 &&
          r.scores[k] <= 5 &&
          typeof r.evidence?.[k] === "string" &&
          !!r.evidence[k].trim(),
      ) ||
      ![
        "hallucination",
        "originalProcessClaim",
        "visuallyGrounded",
        "uiUsable",
      ].every((k) => typeof r[k] === "boolean")
    )
      throw Error(
        "Ratings require 1–5, written evidence per domain and explicit grounding flags",
      );
    return {
      ...r,
      evidence: Object.fromEntries(
        Object.entries(r.evidence).map(([k, v]) => [k, excerpt(v, 500)]),
      ),
      exemplar: excerpt(r.exemplar, 500),
    };
  });
}
function statistics(rows, cases, reviews, mapping) {
  return ARMS.map((a) => {
    const rr = rows.filter((r) => r.armID === a.id),
      pairs = rr.map((r) => ({
        r,
        c: cases.find((c) => c.case_id === r.caseID),
      })),
      confusion = {};
    for (const { r, c } of pairs) {
      confusion[c.category] ??= {};
      confusion[c.category][c.ground_truth] ??= {};
      const out = outcome(r);
      confusion[c.category][c.ground_truth][out] =
        (confusion[c.category][c.ground_truth][out] || 0) + 1;
    }
    const n = rr.length,
      count = (fn) => pairs.filter(fn).length,
      rate = (num) => (n ? num / n : null);
    const accept = count(({ r }) => r.outcome === "accepted");
    const falseAccept = count(
      ({ r, c }) =>
        r.outcome === "accepted" &&
        ["reject", "crop-needed"].includes(c.ground_truth),
    );
    const watercolor = pairs.filter(
      ({ c }) =>
        c.watercolor_status === "confirmed" && c.ground_truth === "accept",
    );
    const accurateAccept = count(
      ({ r, c }) => r.outcome === "accepted" && c.ground_truth === "accept",
    );
    const ids = mapping.filter((m) => m.armID === a.id),
      scores = reviews.filter((r) => ids.some((m) => m.blindID === r.blindID));
    const agreement = ids.flatMap((m) => {
      const rs = scores.filter((s) => s.blindID === m.blindID);
      return rs.length === 2
        ? [
            {
              blindID: m.blindID,
              absoluteDifferences: Object.fromEntries(
                Object.keys(DOMAINS).map((k) => [
                  k,
                  Math.abs(rs[0].scores[k] - rs[1].scores[k]),
                ]),
              ),
            },
          ]
        : [];
    });
    const reviewedUsable = rr.filter((r) => {
      const m = ids.find((m) => m.key === r.key),
        s = scores.filter((s) => s.blindID === m?.blindID);
      return (
        r.outcome === "accepted" &&
        r.strictSchema &&
        r.canonicalValid &&
        r.finishReason === "stop" &&
        !r.refusal &&
        s.length >= 2 &&
        s.every(
          (v) =>
            v.visuallyGrounded &&
            v.uiUsable &&
            !v.hallucination &&
            !v.originalProcessClaim &&
            v.scores.B >= 4 &&
            v.scores.D >= 4,
        )
      );
    });
    const costs = rr.flatMap((r) => (r.usage ? [r.usage.usd] : [])),
      lat = rr.map((r) => r.latencyMs).filter(Number.isFinite);
    const categoryMetrics = Object.keys(confusion).map((category) => {
      const ps = pairs.filter(({ c }) => c.category === category),
        total = ps.length;
      return {
        category,
        total,
        falseAccepts: ps.filter(
          ({ r, c }) =>
            ["reject", "crop-needed"].includes(c.ground_truth) &&
            r.outcome === "accepted",
        ).length,
        errors: ps.filter(({ r, c }) => !matchesExpected(r, c)).length,
        errorRate:
          ps.filter(({ r, c }) => !matchesExpected(r, c)).length / total,
        invalid: ps.filter(({ r }) => r.outcome === "invalid").length,
      };
    });
    return {
      armID: a.id,
      model: a.model,
      detail: a.detail,
      n,
      confusion,
      categoryMetrics,
      acceptanceRate: rate(accept),
      rejectionRate: rate(count(({ r }) => r.outcome === "rejected")),
      uncertainRate: rate(count(({ r }) => r.outcome === "uncertain")),
      falseAcceptanceCount: falseAccept,
      acceptedWithoutRequiredCrop: count(
        ({ r, c }) =>
          r.outcome === "accepted" && c.ground_truth === "crop-needed",
      ),
      acceptedAndCritiquedNonPainting: count(
        ({ r, c }) =>
          r.outcome === "accepted" &&
          c.ground_truth === "reject" &&
          r.canonicalValid,
      ),
      eligibilityPrecision: accept ? accurateAccept / accept : null,
      watercolorRecall: watercolor.length
        ? watercolor.filter(({ r }) => r.outcome === "accepted").length /
          watercolor.length
        : null,
      watercolorFalseReject: watercolor.filter(
        ({ r }) => r.outcome === "rejected",
      ).length,
      watercolorUncertain: watercolor.filter(
        ({ r }) => r.outcome === "uncertain",
      ).length,
      invalid: count(({ r }) => r.outcome === "invalid"),
      truncated: count(({ r }) => r.finishReason === "length"),
      refused: count(({ r }) => r.refusal === true),
      finishReasons: Object.fromEntries(
        [...new Set(rr.map((r) => r.finishReason || "unknown"))].map((k) => [
          k,
          rr.filter((r) => (r.finishReason || "unknown") === k).length,
        ]),
      ),
      notComparable: count(({ r }) => r.outcome === "not_comparable"),
      strictSchemaSuccess: count(({ r }) => r.strictSchema === true),
      canonicalSuccess: count(({ r }) => r.canonicalValid === true),
      latencyMs: {
        mean: mean(lat),
        median: percentile(lat, 0.5),
        p95: percentile(lat, 0.95),
      },
      medianOutputWords: percentile(
        rr.map((r) => r.outputWords).filter(Number.isFinite),
        0.5,
      ),
      usageTotals: Object.fromEntries(
        ["input", "cached", "cacheWrite", "output", "reasoning"].map((k) => [
          k,
          rr.reduce((s, r) => s + (r.usage?.[k] || 0), 0),
        ]),
      ),
      costUSD: {
        total: costs.reduce((s, c) => s + c, 0),
        mean: mean(costs),
        reviewedUsableOutputs: reviewedUsable.length,
        perReviewedUsable:
          reviewedUsable.length && costs.length === rr.length
            ? costs.reduce((s, c) => s + c, 0) / reviewedUsable.length
            : null,
        unknownUsage: n - costs.length,
      },
      reviewerMeans: Object.fromEntries(
        Object.keys(DOMAINS).map((k) => [
          k,
          mean(scores.map((r) => r.scores[k])),
        ]),
      ),
      individualReviews: scores,
      agreement,
    };
  });
}
function recommendation(stats, totalCases) {
  if (
    totalCases !== 24 ||
    stats.some(
      (s) =>
        s.n !== 24 ||
        s.notComparable ||
        s.costUSD.unknownUsage ||
        s.individualReviews.length < 48,
    )
  )
    return "Pending: incomplete live comparison or blind review. No candidate winner is established.";
  const baseline = stats[0];
  const eligible = stats.filter(
    (s) =>
      s.falseAcceptanceCount === 0 &&
      s.categoryMetrics.every((c) => c.errors === 0) &&
      s.watercolorRecall === 1 &&
      s.invalid === 0 &&
      s.truncated === 0 &&
      s.strictSchemaSuccess === 24 &&
      s.individualReviews.every(
        (r) =>
          !r.hallucination &&
          !r.originalProcessClaim &&
          r.visuallyGrounded &&
          r.uiUsable &&
          r.scores.B >= 4 &&
          r.scores.D >= 4 &&
          r.scores.G >= 4,
      ),
  );
  const better = eligible
    .filter(
      (s) =>
        s.armID !== baseline.armID &&
        s.reviewerMeans.E > baseline.reviewerMeans.E &&
        s.reviewerMeans.C >= baseline.reviewerMeans.C &&
        s.reviewerMeans.F >= baseline.reviewerMeans.F,
    )
    .sort((a, b) => a.costUSD.perReviewedUsable - b.costUSD.perReviewedUsable);
  return better.length
    ? `Screening evidence supports ${better[0].armID} for a separate human-reviewed production proposal. N=24 is not a statistical safety guarantee; no production change is authorized.`
    : "No candidate demonstrates all screening gates and a grounded teaching gain. Retain production; inspect disagreements before any follow-up.";
}
function report({ prepared, output, ratings }) {
  const p = lockedProduction(),
    data = readPrepared(prepared, p),
    out = privateDir(output),
    events = ledgerRead(localFile(out, "ledger.jsonl"));
  verifyJournal(prepared, out);
  const rows = events.filter((e) => e.kind === "result"),
    seed = fs.readFileSync(localFile(out, "blind-seed"), "utf8");
  const blind = (key) =>
    "V" +
    crypto.createHmac("sha256", seed).update(key).digest("hex").slice(0, 14);
  const mapping = rows.map((r) => ({
    blindID: blind(r.key),
    key: r.key,
    caseID: r.caseID,
    armID: r.armID,
  }));
  writePrivate(path.join(out, "private-blind-key.json"), mapping);
  const blank = mapping
    .flatMap((m) =>
      ["R1", "R2"].map((reviewer) => ({
        blindID: m.blindID,
        reviewer,
        scores: Object.fromEntries(Object.keys(DOMAINS).map((k) => [k, null])),
        evidence: Object.fromEntries(Object.keys(DOMAINS).map((k) => [k, ""])),
        hallucination: null,
        originalProcessClaim: null,
        visuallyGrounded: null,
        uiUsable: null,
        exemplar: "",
      })),
    )
    .sort((a, b) =>
      blind(a.blindID + a.reviewer).localeCompare(
        blind(b.blindID + b.reviewer),
      ),
    );
  // Never overwrite entered ratings: write only the blank template.
  writePrivate(path.join(out, "ratings.template.json"), {
    domains: DOMAINS,
    reviews: blank,
  });
  const rated = ratings
    ? reviewRows(
        JSON.parse(fs.readFileSync(external(ratings, true), "utf8")),
        new Set(mapping.map((m) => m.blindID)),
      )
    : [];
  const stats = statistics(rows, data.cases, rated, mapping);
  const summary = {
    status: "screening-only",
    attempted: events.filter((e) => e.kind === "reserved").length,
    completed: rows.length,
    chargedOrReservedUSD: charged(events),
    totalPrepared: data.cases.length,
    arms: stats,
    localCrop: data.cases.map((c) => ({
      caseID: c.case_id,
      category: c.category,
      automatic: c.autoCropMetrics,
      applied: c.appliedCropMetrics,
    })),
    recommendation: recommendation(stats, data.cases.length),
    limitations: [
      "Crop geometry is measured independently from model eligibility.",
      "Unreviewed hallucination/grounding is unknown, never assumed safe.",
      "Output word counts include JSON keys.",
      "API token/cost estimates require invoice reconciliation; not account-level billing caps.",
      "No statistical real-world accuracy guarantee from 24 cases.",
    ],
  };
  writePrivate(path.join(out, "summary.json"), summary);
  const columns = [
    "caseID",
    "armID",
    "sourceWidth",
    "sourceHeight",
    "cropWidth",
    "cropHeight",
    "imageHash",
    "configHash",
    "outcome",
    "reasonCode",
    "strictSchema",
    "canonicalValid",
    "finishReason",
    "refusal",
    "outputWords",
    "outputChars",
    "latencyMs",
    "resolvedModel",
    "systemFingerprint",
    "usd",
    "input",
    "cached",
    "cacheWrite",
    "output",
    "reasoning",
  ];
  writePrivate(
    path.join(out, "summary.csv"),
    [
      columns.map(csv).join(","),
      ...rows.map((r) =>
        columns
          .map((k) => csv(k === "usd" ? r.usage?.usd : (r[k] ?? r.usage?.[k])))
          .join(","),
      ),
    ].join("\n") + "\n",
  );
  const items = blank.map((b) => {
    const m = mapping.find((m) => m.blindID === b.blindID),
      r = rows.find((r) => r.key === m.key),
      c = data.cases.find((c) => c.case_id === m.caseID);
    // Relative local image, no external URL, no model/arm/result identifiers.
    const relative = path
      .relative(out, localFile(prepared, c.image))
      .split(path.sep)
      .join("/");
    return `<article><h2>${html(b.blindID)} · ${b.reviewer}</h2><img alt="Original prepared source for blind review" src="${html(relative)}"><p>Outcome: ${html(outcome(r))}; schema: ${r.strictSchema === true ? "valid" : "not valid"}; canonical: ${r.canonicalValid === true ? "valid" : "not applicable/invalid"}</p><p>Sanitized excerpts only; missing context must not be scored as verified.</p><pre>${html(JSON.stringify({ summary: r.teachingSummary, domainExcerpts: r.excerpts || [] }, null, 2))}</pre>${Object.entries(
      DOMAINS,
    )
      .map(
        ([k, v]) =>
          `<p>${k}. ${html(v)} · 1 2 3 4 5 · Evidence: __________________</p>`,
      )
      .join(
        "",
      )}<p>Hallucination / inferred original process / grounded / usable: record explicitly.</p></article>`;
  });
  writePrivate(
    path.join(out, "blind-review.html"),
    `<!doctype html><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src 'self' file:; style-src 'unsafe-inline'"><title>Blind watercolor benchmark review</title><style>body{font:16px system-ui;max-width:850px;margin:auto;padding:20px}img{max-width:100%;max-height:400px}pre{white-space:pre-wrap}article{break-after:page}</style><h1>Independent blind review</h1><p>Use only your assigned reviewer rows. Do not inspect summary or private-blind-key until ratings are finalized. Compare every claim with the actual source; do not infer quality from schema validity.</p>${items.join("")}`,
  );
  writePrivate(
    path.join(out, "decision-report.md"),
    `# Offline screening report\n\n${summary.recommendation}\n\nAttempts: ${summary.attempted}; complete responses: ${summary.completed}; charged/reserved estimate: $${summary.chargedOrReservedUSD.toFixed(6)}.\n\nSee summary.json for category confusion matrices, errors, individual domain scores, disagreement, latency, usage, exemplars and crop metrics. Raw full responses are absent unless explicitly retained. Pending requests remain reserved and cannot be retried.\n\n${summary.limitations.join("\n\n")}\n`,
  );
  return {
    completed: rows.length,
    reviewed: rated.length,
    reportDirectory: out,
    recommendation: summary.recommendation,
  };
}
module.exports = {
  report,
  statistics,
  recommendation,
  reviewRows,
  percentile,
  DOMAINS,
  csv,
};
