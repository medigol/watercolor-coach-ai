const { hash } = require("./production.cjs");
const { imageTokenBound } = require("./vision.cjs");
const ARMS = Object.freeze(
  [
    {
      id: "baseline_low",
      model: "gpt-4.1-mini",
      detail: "low",
      temperature: 0.3,
    },
    {
      id: "baseline_high",
      model: "gpt-4.1-mini",
      detail: "high",
      temperature: 0.3,
    },
    {
      id: "candidate_mini",
      model: "gpt-5.4-mini",
      detail: "high",
      reasoning_effort: "none",
    },
    {
      id: "candidate_luna",
      model: "gpt-6-luna",
      detail: "high",
      reasoning_effort: "none",
    },
  ].map(Object.freeze),
);
const ENDPOINT = "https://api.openai.com/v1/chat/completions";
function selectArms(selection) {
  if (selection === undefined) return ARMS;
  if (typeof selection !== "string")
    throw Error("Arm selection must name configured IDs");
  const ids = selection.split(",");
  if (
    !ids.length ||
    new Set(ids).size !== ids.length ||
    ids.some((id) => !ARMS.some((a) => a.id === id))
  )
    throw Error("Unknown, empty or duplicate configured arm selection");
  return ARMS.filter((a) => ids.includes(a.id)); // Stable registry order, never substitution.
}
function bodyFor(p, arm, bytes, mime) {
  return {
    ...Object.fromEntries(
      Object.entries(arm).filter(([k]) => !["id", "detail"].includes(k)),
    ),
    service_tier: "default", // Explicit standard tier. No Batch/Fast/regional routing.
    max_completion_tokens: 3000,
    messages: [
      { role: "system", content: p.prompt },
      {
        role: "user",
        content: [
          { type: "text", text: p.user },
          {
            type: "image_url",
            image_url: {
              url: `data:${mime};base64,${bytes.toString("base64")}`,
              detail: arm.detail,
            },
          },
        ],
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "watercolor_feedback",
        strict: true,
        schema: p.schema,
      },
    },
  };
}
function attest(card, now = new Date(), arms = ARMS) {
  if (
    !arms.length ||
    arms.some((a) => !ARMS.includes(a)) ||
    new Set(arms).size !== arms.length
  )
    throw Error("Only fixed configured arms can be attested");
  if (
    !card ||
    card.verified !== true ||
    card.tier !== "standard" ||
    card.currency !== "USD" ||
    card.checkedOn !== now.toISOString().slice(0, 10)
  )
    throw Error(
      "Fresh official compatibility/pricing attestation required (UTC today)",
    );
  if (
    !Array.isArray(card.sources) ||
    !["/pricing", "/models", "/guides/images-vision"].every((part) =>
      card.sources.some(
        (s) =>
          typeof s === "string" &&
          s.startsWith("https://developers.openai.com/api/docs") &&
          s.includes(part),
      ),
    )
  )
    throw Error("Official model, pricing and vision sources required");
  for (const a of arms) {
    const r = card.arms?.[a.id];
    if (
      !r ||
      r.model !== a.model ||
      r.detail !== a.detail ||
      !["input", "output", "cached", "cacheWrite"].every(
        (k) => typeof r[k] === "number" && Number.isFinite(r[k]) && r[k] >= 0,
      ) ||
      r.input <= 0 ||
      r.output <= 0
    )
      throw Error("Unknown model price: " + a.id);
    if (
      !Number.isSafeInteger(r.maxImageTokens) ||
      r.maxImageTokens <= 0 ||
      r.maxImageTokens > 1e7 ||
      typeof r.imageBoundSource !== "string" ||
      !r.imageBoundSource.startsWith("https://developers.openai.com/")
    )
      throw Error("Verified model-specific image bound required: " + a.id);
    if (
      ![
        "chatCompletions",
        "imageInput",
        "strictJsonSchema",
        "requiredNullableEnvelope",
        ...(a.reasoning_effort ? ["reasoningNone"] : []),
      ].every(
        (k) =>
          r.support?.[k] === true ||
          // Empirical acceptance may be tested only by an explicitly authorized
          // ordinary case-arm slot. Never relax image/endpoint/schema support or
          // pricing, add a probe, repair a schema, or retry a failed request.
          (["requiredNullableEnvelope", "reasoningNone"].includes(k) &&
            card.meteredCompatibilityTrial?.approved === true &&
            card.meteredCompatibilityTrial?.usesExistingSlots === true &&
            Array.isArray(card.meteredCompatibilityTrial?.armIDs) &&
            card.meteredCompatibilityTrial.armIDs.every((id) =>
              arms.some((arm) => arm.id === id),
            ) &&
            card.meteredCompatibilityTrial.armIDs.includes(a.id)),
      )
    )
      throw Error("Unverified API compatibility: " + a.id);
    if (r.cacheWriteAccounting !== "additive")
      throw Error("Conservative additive cache-write accounting required");
  }
  return card;
}
function projected(p, a, bytes, mime, card, size) {
  const b = bodyFor(p, a, bytes, mime);
  // NOT an exact tokenizer. UTF-8 bytes plus 2x framing/schema allowance and
  // 4096 reserved overhead, then a separately attested image-family bound.
  b.messages[1].content[1].image_url.url = "[image billed separately]";
  const textBound = Buffer.byteLength(JSON.stringify(b)) * 2 + 4096;
  const r = card.arms[a.id],
    vision = size ? imageTokenBound(a, size) : null;
  if (vision && r.maxImageTokens < vision.maxImageTokens)
    throw Error(
      "Attested image bound below documented prepared-image requirement",
    );
  const imageBound = vision?.maxImageTokens ?? r.maxImageTokens,
    inputBound = textBound + imageBound;
  // Cache writes pessimistically charged on every input token IN ADDITION to
  // full uncached input. Never anticipate cache savings in the prospective guard.
  return {
    textBound,
    imageBound,
    ...(vision ? { vision } : {}),
    inputBound,
    outputBound: 3000,
    usd:
      (inputBound * (Math.max(r.input, r.cached) + r.cacheWrite) +
        3000 * r.output) /
      1e6,
  };
}
function usageCost(raw, rate) {
  const integer = (v) => Number.isSafeInteger(v) && v >= 0;
  if (
    !raw ||
    !["prompt_tokens", "completion_tokens", "total_tokens"].every((k) =>
      integer(raw[k]),
    ) ||
    raw.total_tokens !== raw.prompt_tokens + raw.completion_tokens
  )
    throw Error("Unknown usage");
  const input = raw.prompt_tokens,
    output = raw.completion_tokens,
    details = raw.prompt_tokens_details || {},
    od = raw.completion_tokens_details || {};
  const cached = details.cached_tokens ?? 0,
    cacheWrite = details.cache_write_tokens ?? 0,
    reasoning = od.reasoning_tokens ?? 0;
  if (
    ![cached, cacheWrite, reasoning].every(integer) ||
    cached > input ||
    cacheWrite > input ||
    reasoning > output
  )
    throw Error("Inconsistent usage");
  // Fail closed on new monetary categories rather than silently underbilling.
  const knownInput = new Set([
    "cached_tokens",
    "cache_write_tokens",
    "text_tokens",
    "image_tokens",
    "audio_tokens",
  ]);
  const knownOutput = new Set([
    "reasoning_tokens",
    "accepted_prediction_tokens",
    "rejected_prediction_tokens",
    "audio_tokens",
    "text_tokens",
  ]);
  if (
    Object.keys(details).some((k) => !knownInput.has(k)) ||
    Object.keys(od).some((k) => !knownOutput.has(k)) ||
    details.audio_tokens > 0 ||
    od.audio_tokens > 0 ||
    Object.keys(raw).some(
      (k) =>
        ![
          "prompt_tokens",
          "completion_tokens",
          "total_tokens",
          "prompt_tokens_details",
          "completion_tokens_details",
        ].includes(k),
    )
  )
    throw Error("Unknown billable usage category");
  const usd =
    ((input - cached) * rate.input +
      cached * rate.cached +
      cacheWrite * rate.cacheWrite +
      output * rate.output) /
    1e6;
  return {
    input,
    cached,
    cacheWrite,
    output,
    reasoning,
    total: raw.total_tokens,
    image: details.image_tokens ?? null,
    text: details.text_tokens ?? null,
    usd,
    breakdownReported: {
      cached: Object.hasOwn(details, "cached_tokens"),
      cacheWrite: Object.hasOwn(details, "cache_write_tokens"),
      reasoning: Object.hasOwn(od, "reasoning_tokens"),
    },
  };
}
function fingerprint(body) {
  const copy = structuredClone(body);
  copy.messages[1].content[1].image_url.url =
    "[image hash recorded separately]";
  return hash(JSON.stringify(copy));
}
module.exports = {
  ARMS,
  selectArms,
  ENDPOINT,
  bodyFor,
  attest,
  projected,
  usageCost,
  fingerprint,
};
