# Controlled model/vision benchmark for Watercolor Coach AI

**Status:** authorized to prepare a comparison, not to change production. **Branch:** `codex/model-evaluation-harness`. No PR, merge, deploy, SQL migration, production model switch, or paid API calls during implementation/tests. User-facing production remains `gpt-4.1-mini`, `detail:"low"`, one OpenAI call per Improve Painting attempt and 3000 max completion tokens.

## Goal

Find the lowest-cost model/image-detail configuration that reliably (a) accepts actual watercolors and watercolor WIP/abstract/photorealistic paintings; (b) rejects photographs, screenshots/UI, documents and non-artwork; (c) creates grounded, substantial and nonrepetitive educational feedback in the existing strict structured response schema; (d) does not fabricate technique/process, overlay geometry or critique; (e) completes within the 3000 completion-token budget. No hypothesis may be reported as a measured result.

## Arms (exactly four; all use the same immutable current production prompt and provider draft schema)

| Key | Model ID | Image detail | Why |
| --- | --- | --- | --- |
| baseline_low | `gpt-4.1-mini` | `low` | current production baseline |
| baseline_high | `gpt-4.1-mini` | `high` | isolate vision-detail effect |
| candidate_mini | `gpt-5.4-mini` | `high` | stronger mini alternative |
| candidate_luna | `gpt-6-luna` | `high` | latest cost-sensitive model (replaces earlier contemplated gpt-5.6-luna) |

Verify current official model prices/parameters via OpenAI docs BEFORE any paid benchmark. Reference standard text token prices at specification time (USD per 1M input/output): `gpt-4.1-mini` 0.40/1.60, `gpt-5.4-mini` 0.75/4.50, `gpt-6-luna` 0.10/0.50. These are reference values only; use reported usage (input, cached, output, reasoning, cache write) and current rate card, and state the caveat that image tokenization varies. Pricing source https://developers.openai.com/api/docs/pricing. Official model ids/source https://developers.openai.com/api/docs/models.

## Nonnegotiable isolation and cost limits

1. Design as a **separate, local, opt-in developer benchmark tool**: reuse production prompt, JSON Schema and image preparation helpers where safely importable, but NEVER import production credentials into test results, access Supabase user database/storage, invoke `complete_openai_feedback`, alter quota, or submit images through `generate-feedback`. No app UI model selector, no production config change.
2. Default run mode is `--dry-run`; **zero provider calls** unless an explicit `--live --confirm-cost` flag and local `OPENAI_API_KEY` exist. No keys in CLI args/files/logs; do not add secrets or real images to Git.
3. Hard limits: 24 distinct cases, max 4 calls per case = **96 total**, exactly one provider request per image-arm; zero retries/recovery/repair calls. Enforce an explicit spend budget default **USD $3.00** by conservative preflight projection and stop on observed or estimated budget exhaustion; do not assert the ceiling is enforced by provider billing. Fail closed when usage/cost estimation is unavailable. Optional limited pilot of 3 cases × 4 arms first, using the same cap. Report estimate before user triggers live mode.
4. Keep existing `max_completion_tokens=3000`, no extra image calls. Newer reasoning model API parameter support must be checked: use `reasoning_effort:"none"` where supported for fair vision/instruction comparison (and to protect output budget), omit `temperature` if unsupported; current gpt-4.1-mini baseline keeps its production `temperature:0.3`. Chat Completions and strict `json_schema` compatibility must be verified, including required-null envelope. Do not silently fall back to another model, endpoint, or weaker schema. Record API errors.
5. Never send the same benchmark case to production or decrement the user's successful analysis quota. Live offline evaluation involves up to four total calls per case ACROSS arms, unlike production which stays one per user analysis. Use only images approved for private API testing. All images/ratings/provider outputs stay locally ignored by Git; do not commit or print private image content.
6. No automatic launch of live evaluation in CI, GitHub Actions, unit tests or Codex. All tests must use mocks/fixtures. No new heavy ML dependency.

## Dataset (24 cases; manifest metadata separate from images)

Require real curated originals, not just screenshots of past analyses. Supply via ignored local test directory; no image files in Git. Manifest tracks `case_id`, `file`, `category`, `ground_truth` (accept/reject/uncertain/crop-needed), `watercolor_status`, `expected_painting_region` if manually annotated, `source/permission`, `notes`; never store user identity. Do NOT invent images or assert they were supplied. Include:

- 8 clear watercolors (landscape, urban/church, vehicle/van, boat/reflection, etc.; 2 strong, 2 developing/WIP, 2 abstract/monochrome, 2 highly realistic/complex).
- 4 real watercolors photographed on paper, in sketchbook, on desk or in a frame, with visible extraneous surroundings.
- 4 screenshot/UI cases embedding a watercolor thumbnail or image; 2 with small artwork and 2 with plausible rectangular embedded art.
- 4 normal photographs (landscape, building, person/animal, road or other real-world scene).
- 2 other-medium artworks, collages or printed reproductions (uncertain when medium ambiguous).
- 2 challenging low-light/rotated/large-border/uncertain scenarios.

These total 24. A photo OF physical art is not an ordinary scene photo. An already isolated watercolor embedded in an uploaded image may be correctly accepted only after successful *local* painting extraction; raw screenshot with UI still visible must not be accepted as an isolated painting. Distinguish **crop/preparation success** from **model eligibility**; evaluate both independently. If a true watercolor is photorealistic/abstract, do not consider confident rejection correct merely because it is unusual. Human reviewer records ambiguous ground truth and abstention acceptability.

Use current user-provided visual samples only if their actual image bytes are available in a permitted local test folder; do not treat transcribed prior model outputs as new model-generated results. The app can already produce confirmed artwork crop bytes for a chosen region: for fair comparison give each arm the **identical immutable prepared bytes**. For local extraction tests retain original source separately and compare extracted region against manually annotated target; for gate tests also send some intentionally unisolated screenshots/photos to verify abstention/rejection.

## Build a reproducible local harness

- CLI run script plus TypeScript/Node (or existing repository test runtime) tests; conservative dependency changes.
- Extract production `paintingAnalysisPrompt` and `providerFeedbackSchema("improve_painting")` with no semantic changes, or verify hash equivalence if bundling the copied source is unavoidable; compare canonicalizer/validator after response to catch complete UI result compatibility.
- Each case-arm runs one `POST /v1/chat/completions` request with the **same** metadata, prompt, max tokens, schema and image pixels; only model-specific supported request parameters and image detail vary. Mock every possible provider outcome; guard 96-call hard cap.
- Record sample id, arm id, source and crop dimensions, eligibility `status/reason_code`, strict JSON parse/validator, canonical valid, `finish_reason`, refusal, latency, returned usage token breakdown, attributable USD estimate, provider error only as sanitized code. Never log images, raw API keys, signed URLs, user ids or messages. Truncate and sanitize any analysis excerpts in human-review tool; store full provider text ONLY in an optional ignored local private results directory with explicit consent.
- Produce local CSV/JSON summary and printable reviewer worksheet; randomize/mask arm names for **blind human scoring**.
- Fairly handle model-specific default reasoning and unsupported parameter errors; report differences, don't invent a successful comparison. Treat `finish_reason=length`/refusal as a failure for that arm. Reasoning tokens count toward output budget/bill.
- Human scoring (1–5 each, with written evidence): (A) watercolor/media eligibility precision and recall, including screenshot false acceptance; (B) fidelity to visible actual objects/placements and compositional roles; (C) colour/value/chroma reasoning; (D) truthful observed visual effect vs conjectured technique; (E) distinct, specific, truly educational actions/practice; (F) no duplicate/filler or invented faults; (G) well-formed complete schema and usable UI layout. Track false acceptance of nonpaintings separately (safety critical); actual watercolors falsely rejected/uncertain separately; and cost per **usable accepted output**, not just nominal invocation cost.
- A decision report must show per-category confusion matrix, acceptance/rejection/uncertain rates, invalid/truncated results, per-model mean/median/p95 latency, median output words, observed tokens and total/mean cost, reviewer agreement where applicable, exemplar wins/failures and unresolved ambiguities. Proposed production model must win on image-specific teaching plus strict eligibility, not only price.

## Release decision and constraints

- Prefer the least-expensive arm that reliably beats production on watercolor-grounded coaching and meets strict screenshot/no-painting rejection quality; reject any arm that fabricates feedback for a UI screenshot or normal photo. Small N=24 is a **screening pilot**, not a statistical guarantee. If close, do a separate larger user-approved follow-up.
- Distinguish expected improved detection from **actual** crop ROI quality: changing a model does not by itself create automatic local screenshot extraction; this is a separate image-preparation workstream. Never claim that the AI can inspect the original screenshot after it has only been sent a cropped image.
- The production design remains **one model call per new Improve Painting analysis**; the offline benchmark uses 4 calls per sample to compare four mutually exclusive future production options.
- Only after live benchmark and human review, propose production change as a separate PR. Verify backwards compatibility of strict structured output, provider 400/422, quota/release, legacy reopen, request dedup and crop alignment; no premature migration/deploy.
- Deliver a detailed implementation report with exact commands to prepare 24-image local manifest, run no-cost mocks, run 3-case opt-in pilot, and (after explicit local user choice) run full evaluation. Report what was ACTUALLY executed; do not report paid tests or live quality conclusions from mocks.

## Existing relevant code to inspect

`supabase/functions/generate-feedback/index.ts` (model + request), `supabase/functions/_shared/prompts.ts` (painting prompt), `supabase/functions/_shared/contract.ts` (schema), `shared/artworkEligibility.ts`, `shared/providerPaintingAnalysis.ts`, `shared/artworkPreparation.ts`, `lib/prepareArtwork.ts`, `shared/coachingWorkspace.ts`, `tests/deep-coaching.test.cjs`, `docs/review/artwork-gate-implementation.md`.

**Implementation instruction:** implement and test the local harness on `codex/model-evaluation-harness`; commit and push ONLY this branch, no PR/merge/deploy, no paid real API calls. If you don't have 24 real curated local images, finish the runnable framework using synthetic unit mocks and honestly state that *visual benchmark not yet run*.