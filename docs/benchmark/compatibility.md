# Model/API and price verification record — 2026-10-18 UTC

## Independently supplied official findings — 2026-10-23

The user reports independent access to the official exact-model pages, pricing, vision and deprecation documentation. Record those supplied findings separately from retrieval through the blocked Codex proxy; no blocked host was retried or paid probe made in this follow-up. Published standard USD per million **input/output** tokens: `gpt-4.1-mini` **0.40/1.60**, `gpt-5.4-mini` **0.75/4.50**, `gpt-6-luna` **0.10/0.50**. Official model pages reportedly support image input, Chat Completions and Structured Outputs. These are published capabilities/rates, not complete verified request costs or empirical account compatibility.

The supplied official schedule confirms **2027-01-14** shutdown for the current `gpt-4.1-mini` baseline and recommends `gpt-6-luna` for migration. Preserve the baseline while testing; this recommendation/price is not an artistic-quality result or authorization to switch production.

Remaining unknowns: exact per-model request combinations (including candidate reasoning `none`), required-null strict schema acceptance, account access, cached/cache-write treatment, and exact model/detail image resizing/patch/token multipliers or defensible upper bounds. In particular, no Luna image bound may be borrowed from another family. The three-case pilot remains BLOCKED on a full bounded cost/compatibility attestation, not on absence of all published rate information. Account access remains an outcome for an explicitly authorized attempt, not grounds for an unapproved availability probe.

Using the actual locked request serialization, the existing conservative **non-image** input bound plus 3,000 output tokens at the supplied uncached/output prices contributes **$0.42897 for 12 calls**. This excludes every image charge and unresolved cache-write treatment: it is **not the pilot price, an invoice ceiling, or a verified full-request upper bound**. The private draft rate card remains `verified:false`, unknown fields null, and the existing attestation rejects it.

## Follow-up verification — 2026-10-23 Australia/Sydney (2026-10-22 UTC)

Public requests to all three exact model pages, pricing, vision and structured-output documentation again failed with `Tunnel connection failed: 403 Forbidden`. The elevated retry was cancelled; no permission bypass or provider probe was attempted. Thus **all four arms remain unavailable for live evaluation in this environment**, pending verified compatibility, pricing and family/detail-specific bounds. This is an evidence/access limitation, not a claim that the models do not exist. No example price was promoted to a current verified price; the rate template and adapters are unchanged.

The official repository's [OpenAPI specification](https://raw.githubusercontent.com/openai/openai-openapi/master/openapi.yaml) was retrieved again. SHA-256: `11ce7fc4b6ad9127e05dade75b0b1cf1cd8a6ed4441da10890d8b9a72e316d91`. Its `ModelIdsShared` includes all three configured IDs. Generic Chat Completions image/structured-output/usage fields still do not attest model-specific parameter combinations, account access, prices or image accounting. The retrieved enum metadata also announces a **2027-01-14** shutdown for `gpt-4.1-mini`; independently confirm the official deprecation notice before a future release decision. No production model change is made here.

See the [real-artwork offline evaluation](../review/real-artwork-evaluation.md) for the available corpus, zero-cost pilot plan and outstanding artistic gates. The earlier record below is retained as historical evidence.

## Original verification record

No API request, model-availability probe or image upload was made. These are documentation findings, not account compatibility results.

The public documentation hosts `developers.openai.com`, `platform.openai.com` and `openai.com/api/pricing/` returned proxy **403 Forbidden** in this environment, including an escalated attempt. Current rates, cached/write rates and family-specific image bounds could not be independently verified. The committed rate-card template is deliberately **unverified and cannot enable live mode**.

The official OpenAI API specification was accessible at:
https://raw.githubusercontent.com/openai/openai-openapi/master/openapi.yaml

Retrieved file SHA-256: `5ee00b466cb48a392c91773f62f1ca93392ec1bb26b52e0381af7fad0e4817a4`.

It lists `gpt-4.1-mini`, `gpt-5.4-mini`, `gpt-5.4-mini-2026-03-17` and `gpt-6-luna` under `ModelIdsShared`. Its Chat Completions contract documents image input with `detail`, strict JSON-schema response format, reasoning effort, `max_completion_tokens`, standard `service_tier:default`, prompt/completion usage, cached input, cache-write and reasoning token fields. This confirms IDs and generic API fields; **it does not prove every model/account honors every combination**, nor a snapshot resolution, price or family-specific detail rule. Live responses record resolved model and system fingerprint when returned. Aliases may change over time; reproduce with recorded hashes/configuration and record this limitation rather than silently substitute snapshots.

Exactly these adapters are implemented, pending local official documentation attestation and actual authorized response compatibility:

| Arm            | Exact model  | Detail | Temperature    | Reasoning effort |
| -------------- | ------------ | ------ | -------------- | ---------------- |
| baseline_low   | gpt-4.1-mini | low    | production 0.3 | omitted          |
| baseline_high  | gpt-4.1-mini | high   | production 0.3 | omitted          |
| candidate_mini | gpt-5.4-mini | high   | omitted        | none             |
| candidate_luna | gpt-6-luna   | high   | omitted        | none             |

All use Chat Completions, the identical production system/user instructions and strict required-null eligibility envelope, 3,000 completion tokens, standard tier; no fallback endpoint/model/parameter/schema weakening. An unsupported parameter, unavailable model or access error is **not comparable**. No compatibility pre-probe is performed: the one authorized case-arm request is the test, and consumes a slot even on failure. Unknown billing stops the whole run, leaving later arms pending.

Specification reference prices, **not independently reverified current prices**, USD per million input/output tokens:

| Model        | Input | Output |
| ------------ | ----: | -----: |
| gpt-4.1-mini |  0.40 |   1.60 |
| gpt-5.4-mini |  0.75 |   4.50 |
| gpt-6-luna   |  0.10 |   0.50 |

Before **each live invocation**, review official sources and complete an external local rate card checked on the same UTC date:

- https://developers.openai.com/api/docs/models (and each exact model page)
- https://developers.openai.com/api/docs/pricing
- https://developers.openai.com/api/docs/guides/images-vision
- https://developers.openai.com/api/reference/resources/chat/methods/create
- https://developers.openai.com/api/docs/guides/structured-outputs

Verify Chat Completions image input, strict `json_schema` including required-null envelope, reasoning `none` on both candidates and supported temperature behavior. Verify standard-tier uncached/cached/cache-write/output prices. Do not set support booleans based only on this document. An attestation is a human check, not independent API verification; actual access/compatibility remains an empirical outcome.

**Do not equate detail with fixed resolution/cost.** The authoritative task describes 4.1-mini low/high as sharing 2,048px/6,144-patch sizing bounds and warns that 5.4-mini low can cost more than high; those statements could not be independently checked here. No 512px-low assumption or shared image formula is coded. Supply an official, conservative `maxImageTokens` for EACH arm/detail and its source. If Luna's documentation has no defensible upper bound, leave its bound unknown: the harness refuses paid execution. Do not borrow 4.1's formula for Luna or estimate its bill from dimensions alone. Actual image tokens, when exposed, and aggregate usage are recorded separately. Independent invoice reconciliation is still needed.
