const fs = require("node:fs"),
  path = require("node:path");
const { lockedProduction, hash } = require("./production.cjs");
const {
  external,
  privateDir,
  writePrivate,
  localFile,
  excerpt,
  safeID,
} = require("./safety.cjs");
const { selectCases, CATEGORIES } = require("./manifest.cjs");
const { assertSchema, validate } = require("./schema.cjs");
const {
  ARMS,
  ENDPOINT,
  bodyFor,
  attest,
  projected,
  usageCost,
  fingerprint,
} = require("./models.cjs");
const LIMIT = 96,
  BUDGET = 3;
function evaluate(payload, p) {
  const choice = Array.isArray(payload?.choices) ? payload.choices[0] : null,
    msg = choice?.message;
  const content = typeof msg?.content === "string" ? msg.content : "";
  const base = {
    finishReason: ["stop", "length", "content_filter", "tool_calls"].includes(
      choice?.finish_reason,
    )
      ? choice.finish_reason
      : "other",
    refusal: !!msg?.refusal,
    outputChars: content.length,
    outputWords: content.trim() ? content.trim().split(/\s+/u).length : 0,
    jsonParsed: false,
    strictSchema: false,
    canonicalValid: false,
    outcome: "invalid",
    reasonCode: null,
    excerpts: [],
  };
  if (choice?.finish_reason !== "stop" || base.refusal) return base;
  let value;
  try {
    value = JSON.parse(content);
    base.jsonParsed = true;
  } catch {
    return base;
  }
  base.strictSchema = validate(value, p.schema);
  const gate = p.eligibility(value);
  base.outcome = gate.status;
  if (gate.status === "rejected" || gate.status === "uncertain")
    base.reasonCode = gate.code;
  if (gate.status === "accepted") {
    const normalized = p.normalize(gate.analysis);
    const cleaned = normalized.ok
      ? p.contract.cleanFeedback(normalized.result, "improve_painting")
      : null;
    base.canonicalValid = p.contract.validFeedback(cleaned, "improve_painting");
    // Review the raw draft, not just the cleaner: post-cleaning could hide a
    // hallucinated technique. Truncated excerpts remain explicitly incomplete.
    for (const domain of [
      "overall",
      "composition",
      "colourValue",
      "technique",
    ]) {
      const d = gate.analysis[domain];
      base.excerpts.push({
        domain,
        facts: (Array.isArray(d?.facts) ? d.facts : []).map((f) =>
          excerpt(f?.observation, 240),
        ),
        insights: (Array.isArray(d?.insights) ? d.insights : []).map((i) => ({
          classification: [
            "strength",
            "clear_issue",
            "optional_refinement",
            "stylistic_alternative",
            "study_experiment",
          ].includes(i?.classification)
            ? i?.classification
            : "invalid",
          lesson: excerpt(i?.lesson, 240),
          action: excerpt(i?.action, 180),
        })),
        practice: excerpt(d?.practice, 640),
      });
    }
  }
  return base;
}
function readPrepared(dir, p) {
  dir = external(dir, true);
  const data = JSON.parse(
    fs.readFileSync(localFile(dir, "prepared.json"), "utf8"),
  );
  if (
    data.version !== 1 ||
    typeof data.experimentID !== "string" ||
    !data.experimentID ||
    JSON.stringify(data.production) !== JSON.stringify(p.identity) ||
    !Array.isArray(data.cases) ||
    data.cases.length < 1 ||
    data.cases.length > 24 ||
    new Set(data.cases.map((c) => c.case_id)).size !== data.cases.length
  )
    throw Error("Invalid or stale prepared experiment");
  // Verify every prepared image BEFORE any provider request, not just next arm.
  for (const c of data.cases) {
    if (
      !safeID(c.case_id) ||
      !Object.hasOwn(CATEGORIES, c.category) ||
      !["accept", "reject", "uncertain", "crop-needed"].includes(
        c.ground_truth,
      ) ||
      typeof c.permission !== "string" ||
      typeof c.approved_for_api !== "boolean"
    )
      throw Error("Invalid prepared case metadata");
    const file = localFile(dir, c.image);
    if (fs.statSync(file).size > p.preparation.preparationLimits.bytes)
      throw Error("Prepared file too large");
    const b = fs.readFileSync(file);
    const h = p.preparation.imageHeader(b);
    if (
      hash(b) !== c.imageHash ||
      h.width !== c.width ||
      h.height !== c.height ||
      h.mime !== c.mime
    )
      throw Error("Prepared bytes changed");
  }
  return data;
}
function plan({ prepared, rates, cases }, p = lockedProduction()) {
  assertSchema(p.schema);
  const data = readPrepared(prepared, p),
    selected = selectCases(data.cases, cases);
  if (rates) attest(rates);
  const calls = selected.flatMap((c) =>
    ARMS.map((a) => ({
      caseID: c.case_id,
      armID: a.id,
      ...(rates
        ? projected(p, a, Buffer.alloc(0), c.mime, rates)
        : { usd: null }),
    })),
  );
  return {
    data,
    selected,
    calls,
    worstCaseUSD: rates ? calls.reduce((n, c) => n + c.usd, 0) : null,
  };
}
function ledgerRead(file) {
  if (!fs.existsSync(file)) return [];
  const s = fs.readFileSync(external(file, true), "utf8");
  try {
    return s.trim()
      ? s
          .trim()
          .split("\n")
          .map((x) => JSON.parse(x))
      : [];
  } catch {
    throw Error(
      "Incomplete cost journal; stop and audit locally, never retry unknown request",
    );
  }
}
function charged(events) {
  const reserves = events.filter((e) => e.kind === "reserved");
  return reserves.reduce((total, r) => {
    const done = events.find((e) => e.kind === "result" && e.key === r.key);
    return total + (done?.usage?.usd ?? r.reservedUSD);
  }, 0);
}
function append(file, event) {
  const fd = fs.openSync(file, "a", 0o600);
  try {
    fs.writeSync(fd, JSON.stringify(event) + "\n");
    fs.fsyncSync(fd);
  } finally {
    fs.closeSync(fd);
  }
}
async function limitedJSON(response) {
  if (!response.body) throw Error("Invalid response");
  const reader = response.body.getReader();
  let size = 0;
  const chunks = [];
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > 1024 * 1024) throw Error("Response too large");
      chunks.push(value);
    }
  } finally {
    await reader.cancel().catch(() => {});
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}
async function run(options, transport = fetch, env = process.env) {
  const p = lockedProduction(),
    planned = plan(options, p);
  if (!options.live)
    return {
      mode: "dry-run",
      paidRequests: 0,
      plannedRequests: planned.calls.length,
      maximumRequests: LIMIT,
      budgetUSD: BUDGET,
      worstCaseUSD: planned.worstCaseUSD,
      pricingVerified: !!options.rates,
      readyForLive:
        !!options.rates && planned.selected.every((c) => c.approved_for_api),
      note: "No provider request. Estimates are not an account billing cap.",
    };
  if (options.confirmCost !== true || !env.OPENAI_API_KEY)
    throw Error("Live requires --live --confirm-cost and local OPENAI_API_KEY");
  if (!options.rates) throw Error("Fresh verified rate card required");
  if (
    planned.selected.some(
      (c) => c.approved_for_api !== true || !c.permission.trim(),
    )
  )
    throw Error(
      "Each selected original must be approved for private API testing",
    );
  const out = privateDir(options.output),
    lock = path.join(out, "run.lock"),
    journal = path.join(out, "ledger.jsonl");
  // One cost journal for this prepared experiment, including pilot + full run.
  const binding = path.join(
    external(options.prepared, true),
    "live-output.json",
  );
  if (!fs.existsSync(binding)) writePrivate(binding, { output: out }, true);
  if (
    JSON.parse(
      fs.readFileSync(localFile(options.prepared, "live-output.json"), "utf8"),
    ).output !== out
  )
    throw Error("Prepared experiment is bound to its existing cost journal");
  if (fs.existsSync(journal)) localFile(out, "ledger.jsonl");
  writePrivate(
    lock,
    { pid: process.pid, created: new Date().toISOString() },
    true,
  );
  let events;
  try {
    const identity = {
      experimentID: planned.data.experimentID,
      production: p.identity,
    };
    const identityFile = path.join(out, "experiment.json");
    if (fs.existsSync(identityFile)) {
      if (
        JSON.stringify(
          JSON.parse(
            fs.readFileSync(localFile(out, "experiment.json"), "utf8"),
          ),
        ) !== JSON.stringify(identity)
      )
        throw Error("Output belongs to another experiment");
    } else writePrivate(identityFile, identity, true);
    if (!fs.existsSync(path.join(out, "blind-seed")))
      writePrivate(
        path.join(out, "blind-seed"),
        require("node:crypto").randomBytes(32).toString("hex"),
        true,
      );
    events = ledgerRead(journal);
    // Any unresolved request may have billed up to its reservation; it is NEVER
    // automatically replayed. Unknown accounting stops all further paid calls.
    if (
      events.some(
        (e) =>
          e.kind === "reserved" &&
          !events.some((d) => d.kind === "result" && d.key === e.key),
      ) ||
      events.some((e) => e.kind === "result" && e.accountingUnknown)
    )
      throw Error(
        "Uncertain prior billing; audit journal before any new paid experiment",
      );
    const reservations = events.filter((e) => e.kind === "reserved");
    if (
      reservations.length > LIMIT ||
      new Set(reservations.map((e) => e.key)).size !== reservations.length
    )
      throw Error("Invalid call journal");
    let stopped = null;
    benchmark: for (const c of planned.selected)
      for (const a of ARMS) {
        const key = c.case_id + ":" + a.id;
        if (events.some((e) => e.kind === "reserved" && e.key === key))
          continue;
        if (events.filter((e) => e.kind === "reserved").length >= LIMIT) {
          stopped = "call_limit";
          break benchmark;
        }
        // Recheck source locks and prices immediately before EACH paid request.
        lockedProduction();
        attest(options.rates);
        const bytes = fs.readFileSync(localFile(options.prepared, c.image));
        if (hash(bytes) !== c.imageHash) throw Error("Prepared bytes changed");
        const bound = projected(p, a, bytes, c.mime, options.rates);
        if (charged(events) + bound.usd > BUDGET) {
          stopped = "prospective_budget";
          break benchmark;
        }
        const body = bodyFor(p, a, bytes, c.mime);
        const reserve = {
          kind: "reserved",
          key,
          caseID: c.case_id,
          armID: a.id,
          imageHash: c.imageHash,
          annotationHash: c.annotationHash,
          manifestHash: planned.data.manifestHash,
          reservedUSD: bound.usd,
          bound,
          configHash: fingerprint(body),
          ratesHash: hash(JSON.stringify(options.rates)),
          at: new Date().toISOString(),
        };
        writePrivate(
          path.join(out, `rates-${reserve.ratesHash}.json`),
          options.rates,
        );
        append(journal, reserve);
        events.push(reserve); // Durable BEFORE request; network failure still burns this slot.
        const start = performance.now();
        let payload, row;
        try {
          const response = await transport(ENDPOINT, {
            method: "POST",
            redirect: "error",
            headers: {
              Authorization: `Bearer ${env.OPENAI_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
            signal: AbortSignal.timeout(60000),
          });
          // Upstream error prose is NEVER persisted or printed.
          if (!response.ok) {
            await response.body?.cancel();
            row = {
              outcome: "not_comparable",
              errorCode: `http_${response.status}`,
              httpStatus: response.status,
              accountingUnknown: true,
            };
          } else {
            payload = await limitedJSON(response);
            row = evaluate(payload, p);
            try {
              row.usage = usageCost(payload.usage, options.rates.arms[a.id]);
            } catch {
              row.accountingUnknown = true;
            }
            row.resolvedModel =
              typeof payload.model === "string" &&
              /^[a-zA-Z0-9._-]{1,100}$/.test(payload.model)
                ? payload.model
                : null;
            row.systemFingerprint =
              typeof payload.system_fingerprint === "string" &&
              /^[a-zA-Z0-9_-]{1,100}$/.test(payload.system_fingerprint)
                ? payload.system_fingerprint
                : null;
            if (
              !row.resolvedModel ||
              !(
                row.resolvedModel === a.model ||
                row.resolvedModel.startsWith(a.model + "-")
              ) ||
              !["default", undefined].includes(payload.service_tier)
            ) {
              row.outcome = "not_comparable";
              row.errorCode = "unexpected_model_or_tier";
            }
            if (
              row.usage &&
              (row.usage.input > bound.inputBound ||
                row.usage.output > 3000 ||
                row.usage.usd > bound.usd)
            ) {
              row.accountingUnknown = true;
              row.errorCode = "cost_bound_exceeded";
            }
            if (options.retainResponses) {
              const raw = privateDir(path.join(out, "private-responses"));
              writePrivate(
                path.join(raw, `${c.case_id}-${a.id}.json`),
                payload,
                true,
              );
            }
          }
        } catch {
          row = {
            outcome: "invalid",
            errorCode: "transport_or_payload_failure",
            accountingUnknown: true,
          };
        }
        row = {
          kind: "result",
          key,
          caseID: c.case_id,
          armID: a.id,
          latencyMs: Math.round(performance.now() - start),
          ...row,
        };
        append(journal, row);
        events.push(row);
        if (row.accountingUnknown) {
          stopped = "unknown_or_exceeded_accounting";
          break benchmark;
        }
        if (row.outcome === "not_comparable") {
          stopped = "incompatible_arm";
          break benchmark;
        }
      }
    return {
      mode: "live",
      attempted: events.filter((e) => e.kind === "reserved").length,
      chargedOrReservedUSD: charged(events),
      budgetUSD: BUDGET,
      stopped,
    };
  } finally {
    fs.unlinkSync(lock);
  }
}
module.exports = {
  evaluate,
  readPrepared,
  plan,
  ledgerRead,
  charged,
  run,
  LIMIT,
  BUDGET,
  limitedJSON,
};
