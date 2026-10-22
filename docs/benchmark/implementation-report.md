# Benchmark implementation and validation — 2026-10-18

**Harness ready; real visual comparison not run.** No candidate winner, crop-accuracy claim, current price confirmation or live account compatibility claim is made from synthetic tests. No paid provider calls, probes, real-art uploads, PR, merge or deployment were performed.

## Scope and commits

Repository: `medigol/watercolor-coach-ai`; existing branch: `codex/model-evaluation-harness`.

Starting reviewed branch head: `e862ad6e21a0c8aa81d156c2d8b8b301fbb4c8e9`; production base: `95549eb`. The two existing specification commits were preserved. `docs/review/model-vision-benchmark.md` was read completely and left unchanged.

Implementation commits:

- `302dfc7` — isolated four-arm runner, production locks, private manifest/rates templates, local preparation, cost ledger, blind review/report pipeline.
- `9b960be` — mocked API/failure/privacy/fairness tests, real technical raster checks, complete developer commands.
- `993b0b7` — auditable source/crop/configuration records, richer bounded review excerpts, empty-budget reports, efficient per-call source verification.
- This report is the final documentation-only validation commit; its SHA is reported in the delivery message.

Implementation inventory (all additions except the additive ignore rules):

| File | Purpose |
| --- | --- |
| `.gitignore` | Defense against accidentally retaining private benchmark artifacts in Git |
| `scripts/benchmark/cli.cjs` | Explicit prepare/dry-run/live/report commands; no dotenv/key arguments |
| `scripts/benchmark/production.cjs` | Pure production loader, exact instruction extraction, prompt/schema/source locks |
| `scripts/benchmark/schema.cjs` | Exact production JSON-schema subset validator; unknown keywords fail closed |
| `scripts/benchmark/models.cjs` | Exactly four adapters, standard tier, compatibility attestation, family-specific bounds and usage accounting |
| `scripts/benchmark/safety.cjs` | External private paths, permissions, traversal/symlink protection, bounded redaction |
| `scripts/benchmark/manifest.cjs` | 24-case coverage and independent local-ROI metrics |
| `scripts/benchmark/prepare.cjs` | Actual production browser preparation, local-only decoded pixels and immutable exports |
| `scripts/benchmark/runner.cjs` | One request per case-arm, durable no-retry ledger, $3 prospective guard, real canonical validation |
| `scripts/benchmark/report.cjs` | CSV/JSON, category errors, latency/usage/cost, printable blind review, per-domain disagreement and guarded recommendations |
| `docs/benchmark/manifest.example.json` | 24 non-sensitive placeholder slots; no real images or API approval |
| `docs/benchmark/rates.example.json` | Deliberately unverified reference prices; cannot authorize live execution |
| `docs/benchmark/production-lock.json` | Exact production prompt/schema/user-instruction and 22 source-file hashes |
| `docs/benchmark/compatibility.md` | Official API-spec findings, reference prices, blocked documentation, required fresh verification |
| `docs/benchmark/README.md` | Complete local curation, preparation, dry-run, approved pilot/full-run and review commands |
| `tests/model-benchmark.test.cjs` | 71 deterministic no-cost benchmark regressions |
| `tests/browser/model-benchmark.cjs` | Six original technical rasters through actual production preparation |
| `docs/benchmark/implementation-report.md` | This factual delivery/validation record |

No application, component, library, shared production helper, Edge Function, SQL, dependency, lockfile or workflow was changed. `git diff origin/main -- app components lib shared supabase types package.json package-lock.json .github` is empty. Exported app bundles contain no benchmark entrypoint/arm markers.

## Validation actually executed

| Check | Result |
| --- | --- |
| `npm test` (complete existing unit/integration plus benchmark suite) | **1,663 passed; 71 new** relative to 1,592; zero failed/skipped/cancelled/todo |
| `node --test tests/model-benchmark.test.cjs` | **71 passed**, zero failed/skipped/cancelled |
| `npm run typecheck` | Passed |
| Strict Deno Edge TypeScript check | Passed |
| Configured Pages-path `npm run build:web` | Passed with fake public Supabase variables |
| Unconfigured static web export | Passed with both public Supabase variables empty |
| Existing professional workspace browser harness | Passed, **170 matrix/error cases plus upload-error/retry check** |
| Unconfigured Pages browser harness | **Eight routes passed**; safe setup screen, zero external requests/runtime errors |
| New benchmark preparation browser harness | **Six technical fixtures**, zero network/provider requests/runtime errors |
| Actual CLI default/dry-run on six technical preparations | 24 planned slots; **zero paid requests**, unknown-price projection remains null |
| Diff/whitespace and production isolation checks | Passed |

Frontend check: `npm run typecheck`.

Strict Edge check used the existing Deno configuration, Deno 2.5.4 from the external npm tool cache, `DENO_TLS_CA_STORE=system` and `DENO_DIR=/tmp/watercolor-deno-cache`; no TLS bypass or repository dependency change.

Configured export used fake public browser-only Supabase values and `/watercolor-coach-ai`. Unconfigured export used an external temporary output directory, empty public variables, offline Expo and two workers. No real credentials were needed or committed.

Workspace widths: **375, 390, 430, 768, 1024, 1440, 1800**, including portrait/landscape/square/wide sources. Existing legacy reopen, Create Reference, Clean/Notes/Composition/Roles, source-colour/crop/grayscale evidence, upload/loading/retry, quota, dedup/lost-response and 401/403/409/422/503 behavior passed with mocked external boundaries. Saved controls/reopen remain zero provider calls/uploads/writes; normal saved reads remain permitted. Browser runtime errors: zero.

The new local browser test verifies actual decoded raster pixels, original encoded versus EXIF-oriented dimensions, white-matte alpha, local proposal IoU versus independent technical annotation, manual crop, raw mock UI retention, byte hashes, incremental preparation and mutation rejection. It uses original colored technical shapes, not real art, and proves neither watercolor classification nor real-scene crop accuracy.

Test logs, technical images and browser reports remain under external `/tmp/benchmark-*` directories. They are not committed or published. No real-device iOS/Android test was run; the benchmark explicitly exercises the web preparation path.

## Production and billing invariants

Production remains `gpt-4.1-mini`, low detail, temperature 0.3, `max_completion_tokens=3000`, canonical persisted version 1. Provider/draft architecture, one-call behavior, no automatic retry, quota/success accounting, dedup/idempotency/lost-response recovery, auth, storage, RLS, SQL, secrets, dependencies, workflows, Pages and Create Reference are unchanged. No model selector, second classifier, crop upload, extra storage asset, image generation/editing or fake before/after is introduced.

The offline benchmark alone can make four mutually exclusive comparison calls per approved case. `--live --confirm-cost`, a local key, per-image permission and same-day verified official rate/support documentation are all required. Slots are reserved/fsynced before sending; all calls are sequential. The same prepared experiment is bound to one journal. A three-case pilot's twelve requests count toward the 96 total; a full follow-up can add at most 84. Unknown transport/accounting burns the slot and stops further paid calls. There is no automatic recovery/retry.

Every arm receives identical production system/user text, strict required-null eligibility schema, prepared image bytes and output ceiling. Candidates use no-reasoning and omit temperature; account-specific incompatibility becomes not-comparable, not a fallback. Raw strict-schema success and post-production canonical validity are measured separately. Raw bounded excerpts are reviewed so deterministic cleaning cannot hide an original hallucination.

Before each call, the guard reserves a conservative nonimage UTF-8 byte/framing bound, a separately attested model/detail image-token bound and all 3,000 completion tokens. Cumulative observed/reserved cost cannot prospectively exceed **$3**. Cached input, cache writes and reasoning-inclusive completion usage are recorded. Unknown pricing/usage/new billable categories stop execution. Full 96-call upper estimates can exceed $3, leaving a partial experiment. This is not an account-level billing cap: an incorrect image/rate bound, in-flight charge or billing delay can still exceed estimates; reconcile invoices and use independent project controls. Cache-write accounting is deliberately conservative/additive and may overestimate.

Prompt bytes: **18,884**; serialized strict schema bytes: **11,698**. These are bytes, not claimed token counts. The exact prompt/schema SHA-256 values and imported-source hashes are in `production-lock.json`.

## Compatibility, deviations and pending acceptance

Official OpenAI public API specification independently confirmed the exact requested model IDs and generic Chat Completions image, strict schema, reasoning and usage fields. The downloaded document's SHA-256 is recorded in `compatibility.md`. It does **not** establish each model/account combination or current rate card.

**External limitation/deviation:** all public pricing/model/vision documentation hosts returned proxy HTTP 403, including after an escalated attempt. Current prices, cached/cache-write rates, per-family detail semantics and actual model/account support could not be independently verified. Consequently no adapter is treated as live-verified and the committed rate template deliberately fails live authorization. The specification's $0.40/$1.60, $0.75/$4.50 and $0.10/$0.50 input/output reference prices are labeled unverified references, not factual current billing findings. No shared 512px-low rule or borrowed Luna image formula is used. Lack of a defensible documented Luna bound must keep live execution blocked.

No real curated images or paid authorization were supplied for evaluation. Real 3-image pilot, 24-image comparison, actual family-specific token costs/latency/truncation, eligibility/crop accuracy, factual coaching quality, blind human scoring and account compatibility remain pending. Follow the exact commands in `README.md`; review current official documentation immediately before any separately authorized paid run. Images and complete provider responses stay outside Git; full responses require additional retention consent. Excerpt redaction is best effort, not a personal-information detector.

Human review requires actual source-image comparison, at least two independent assessments for recommendation eligibility, per-domain written evidence and explicit hallucination/process/grounding/usability flags. Usable layout still needs manual image-grounded review. Fixed sequential arm order, server alias/snapshot changes, optional unreported usage detail and provider cache effects should be considered when comparing costs/latencies. The report records resolved models/fingerprints/configuration hashes and does not claim experimental certainty from small differences.

**No production model recommendation is established. Synthetic tests prove harness behavior only; N=24 would remain a screening pilot, not statistical proof of near-zero real-world errors.** No Phase 2, PR, merge or deployment was performed.
