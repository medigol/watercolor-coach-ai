# Offline model and vision screening benchmark

This is developer-only tooling. It does not run in Expo, Pages, CI, Supabase or the production Edge Function. It never accesses user storage, database, quota or production credentials. Production remains one `gpt-4.1-mini` low-detail call, temperature 0.3, 3,000 completion tokens and canonical version 1. No model has won; real visual evaluation is pending.

**Current execution status: deferred by user instruction.** The approved pilot made zero provider requests because no credential was available; do not request/configure credentials or execute it automatically. Use the [manual production saved-result review](../review/production-manual-artistic-review.md) now. Historical pilot authorizations/preparations remain preserved; a later user instruction is needed to resume the independent benchmark.

See [pilot-readiness.md](pilot-readiness.md) for the restricted three-arm proposal, exact cost assumptions, private preservation record and remaining approval requirements.

Read [compatibility.md](compatibility.md) for verified findings and unavailable official documentation. Exactly four arms are fixed in code: 4.1-mini low, 4.1-mini high, 5.4-mini high, 6-luna high. Candidates use `reasoning_effort:none`, omit temperature, and never silently change API/schema/model. All arms use Chat Completions standard tier, identical production instructions/schema and prepared bytes. No retries, repair, separate classifier, fallback, warm-up or availability probe.

An explicitly restricted run is now supported, without changing the four-arm default:

```bash
node scripts/benchmark/cli.cjs run --dry-run \
  --prepared /tmp/watercolor-private-evaluation/prepared --cases C02,C03,C16 \
  --arms baseline_low,baseline_high,candidate_mini
```

Only fixed IDs are accepted; order is canonical and duplicates/unknown IDs fail. Pricing/support attestation applies to **every included arm**, so unverified Luna can remain configured and excluded. The first live invocation binds the arm/rule scope to `experiment.json` and every integrity-protected reservation. Resumption with another arm set or changed vision rules fails; rewriting scope metadata cannot override the journal. Case-arm keys, original 96-slot/$3 experiment cap, before-call reservation, immutable image/source checks, and no-retry rules remain. A three-arm scope permits at most 72 distinct slots across 24 images, not a new allowance of 96 plus the original slots. Existing paid experiments without the new scope record require manual audit rather than silent paid resumption; historical reports remain readable. Do not start a new experiment to reset uncertain billing. Reports identify included/excluded arms; exclusion is not a candidate failure or a model win.

For the first three configurations, `vision.cjs` records the official patch rules supplied on 2026-10-23. Prepared images within dimension/patch limits use `ceil(width/32) × ceil(height/32)` then round the documented multiplier upward. Larger inputs use a documented global cap, not an invented resizing algorithm. The rate card must cover the derived bound; understated bounds fail. Luna still requires its own independently verified bound. Non-image byte/framing and 3,000-token output reservations and additive cache-write accounting are unchanged. An estimate does not attest an unknown write tariff.

The final supplied official prompt-caching check establishes **zero additional cache-write charge for models before GPT-5.6**, including both restricted families. Their reconciled private cards use `cacheWrite:0` and full uncached input pricing also for cache hits; no estimator change or cache-read discount is needed. C02/C03/C16 across the three arms has a **$0.4095328** prospective standard-tier token ceiling, including all nine requests' bounded text/images and maximum output. Any extra reserve is safety headroom, not a published charge. See the current pilot record for conditions, new private preparations and exact authorization scope. Completed independent reviews are required for artistic conclusions, not for collecting explicitly authorized results.

Account access and exact request acceptance can be tested **only inside existing paid case-arm slots**, after explicit authorization. A rate card may record `meteredCompatibilityTrial: {approved:true, usesExistingSlots:true, armIDs:[...]}` for empirical required-null/reasoning-parameter acceptance. This never overrides endpoint/image/strict-schema support, prices or image bounds; it does not alter the strict request, add a probe or repair/retry failure. An invalid strict/canonical trial response halts and its journal blocks silent resumption pending audit. Leave that authorization false until granted. All other existing live/image/cost/retention gates still apply.

## Requirements and private workspace

Use Node 22+ and the repository's installed development dependencies (`npm ci`). Local image preparation additionally needs developer Playwright plus Chromium. They are **not app dependencies**. In Codex they are already available; use `NODE_PATH=/opt/codex/cua_node/lib/node_modules` and `--chromium /usr/bin/chromium`. Else install Playwright in a separate developer tools directory outside the checkout, add its `node_modules` to `NODE_PATH`, and install Chromium following Playwright documentation. A missing browser fails clearly; it never sends images to a remote processor.

Keep originals, manifests, prepared images, ratings, journals, reports and optional raw responses **outside every Git checkout**. The tool refuses in-repository and symlink-escape paths; private directories/files use 0700/0600. Ignore rules are defense in depth, not permission to keep private art in the repository. Do not use a synchronized/public folder or identity-bearing case names. Do not put a key in manifest/rates/CLI arguments. `.env` is never loaded.

From the repository root:

```bash
export BENCH_DIR=/tmp/watercolor-private-evaluation
mkdir -m 700 "$BENCH_DIR"
mkdir -m 700 "$BENCH_DIR/originals"
cp docs/benchmark/manifest.example.json "$BENCH_DIR/manifest.json"
cp docs/benchmark/rates.example.json "$BENCH_DIR/rates.json"
```

Copy **your permitted real local files** into `originals/` yourself, then edit the external manifest. No real art is supplied here. Placeholder filenames are deliberate. The 24 slots are eight varied watercolors, four surrounding-object art photos, four raw screenshots, four normal photos, two other media, two challenging images. Notes distinguish strong/WIP, abstract/monochrome, hyperrealistic/complex, small-thumbnail/rectangular-art screenshots. Do not label a photo OF physical watercolor as an ordinary scene photograph.

For each case annotate non-identifying provenance, permission basis, confirmed/ambiguous medium, ground truth, ambiguity and whether abstention is acceptable. `source_ground_truth` describes the original; `ground_truth` describes **the exact prepared input sent to all arms**. `approved_for_api` defaults false; change it only with permission to send that image privately to OpenAI. Check provider data retention/account policies yourself. Local preparation alone needs no API authorization/key.

Rectangles use normalized 0–1 coordinates in the **EXIF-oriented original**, not screen pixels or unrotated encoded dimensions. `expected_painting_region` is an independent human ground-truth annotation; do not simply copy the detected candidate into it. `confirmed_region` is the actual manually chosen production crop. `preparation` is `full`, `manual` or explicitly confirmed `candidate`; a null/unconfirmed candidate is refused. Raw screenshot controls must stay `full` with `reject` or `crop-needed` ground truth; the current production policy requests isolation of an artwork inside external UI. Both outcomes forbid a normal confident assessment of the whole interface. Ordinary photo controls remain `full` and `reject`. Never crop away UI then count semantic acceptance as successful screenshot handling. Cropped artwork in the surrounding-object cases may correctly have source `crop-needed`, prepared `accept`. Reports count acceptance of a required-crop source as false acceptance, separately identifying `acceptedWithoutRequiredCrop`. Historical private ground truth/outputs must not be rewritten to match a changed prompt; use a new independently annotated, approved experiment with the refreshed production lock.

## Free preparation and dry runs

You can start with three real files while leaving other slots unprepared. A three-case selection must name exactly three IDs. Annotate selected cases accurately first. Later fill unprepared entries; existing prepared annotations/original bytes are immutable within the experiment. A changed prepared case requires a separately approved new experiment, never a silent retry or budget reset.

```bash
NODE_PATH=/opt/codex/cua_node/lib/node_modules \
  node scripts/benchmark/cli.cjs prepare \
  --manifest "$BENCH_DIR/manifest.json" \
  --output "$BENCH_DIR/prepared" --cases C01,C13,C17 \
  --chromium /usr/bin/chromium

node scripts/benchmark/cli.cjs run --dry-run \
  --prepared "$BENCH_DIR/prepared" --cases C01,C13,C17

# All free unit/integration tests, including benchmark mocked API tests:
npm test
# Focused free benchmark checks:
node --test tests/model-benchmark.test.cjs
# Original technical raster fixtures only; zero provider requests:
NODE_PATH=/opt/codex/cua_node/lib/node_modules \
  node tests/browser/model-benchmark.cjs
```

Preparation executes the **actual production web adapter** in local Chromium with networking blocked. It applies existing header/resource checks, EXIF orientation, local boundary proposal, confirmed crop, proportional resize and white-matte raster export. No copied crop algorithm, extra service or pixel re-analysis by AI. Production helper source hashes are locked too. Each prepared output is generated once, stripped of metadata, hashed and reused byte-for-byte across four arms. Original raw/oriented dimensions, EXIF rotation, prepared dimensions, applied ROI and automatic candidate are recorded privately. Local crop metrics are IoU, artwork coverage, excess surroundings and per-edge loss in normalized units. Human inspection must still verify edge preservation and screenshot content. Null annotation means unmeasured, not accurate.

The dry run makes zero calls even when a key is present. Without verified rates it returns `worstCaseUSD:null`, not a fabricated price. The committed rates template is intentionally unusable for live mode. Fill it only after reading the current official model/API, vision and standard pricing docs. Set same-day UTC `checkedOn`, `verified:true`, each supported API boolean, uncached/cached/cache-write/output rates, and a conservative **model/detail-specific** image-token upper bound plus official source. Zero cache-write price is valid only if officially confirmed as not additionally billed. Do not guess an unavailable Luna bound: live remains blocked until an upper bound is defensible.

```bash
# Once official documentation is independently verified, still FREE:
node scripts/benchmark/cli.cjs run --dry-run \
  --prepared "$BENCH_DIR/prepared" --rates "$BENCH_DIR/rates.json" \
  --cases C01,C13,C17
```

The output is a prospective worst-case projection for all selected arms. Review it **before** separately authorizing live. Production prompt, instruction, schema and all imported pure production modules are hash-checked every invocation and before every call. `docs/benchmark/production-lock.json` was captured from the production source at implementation. Intentional future source changes need a reviewed explicit lock refresh, not automatic adaptation.

## Separately approved paid pilot (NOT executed during implementation)

Only after permission for the selected originals, current official rates/parameters and explicit willingness to spend:

```bash
# Enter the key privately in the terminal; never paste it into a command or file.
read -rsp 'OpenAI API key: ' OPENAI_API_KEY
export OPENAI_API_KEY

node scripts/benchmark/cli.cjs run --live --confirm-cost \
  --prepared "$BENCH_DIR/prepared" --output "$BENCH_DIR/results" \
  --rates "$BENCH_DIR/rates.json" --cases C01,C13,C17

node scripts/benchmark/cli.cjs report \
  --prepared "$BENCH_DIR/prepared" --output "$BENCH_DIR/results"
```

This authorizes at most twelve paid requests (three images × four arms), not an automatic follow-up. `--retain-responses` is an **additional optional explicit consent** to save full provider payloads in private `results/private-responses/`; without it, only sanitized bounded teaching excerpts and non-sensitive metrics are retained. Full payloads can still contain private image-derived content: never publish them. Human worksheets are excerpt-based and can miss truncated context; use separately consented payload inspection if necessary, preserving blindness until scoring is finished.

With explicitly authorized retention, `report` now links each masked output to a private `blind-details/<masked-id>.html`: complete analysis (identity/link redaction only), production-cleaned canonical data, and individual source-image geometry audits for roles, notes, primary/secondary composition and located colours. Provider model/usage metadata is excluded from these pages. Geometry audits use only supplied valid coordinates; they are **not app screenshots or independent evidence of subject identity**. Verify actual rendered app annotations locally before sign-off. Without retained content, the report explicitly marks full-context/annotation acceptance unavailable. Never enable retention merely because this capability exists. Serve review files only locally if browser policy blocks direct file access, e.g. `python3 -m http.server 8765 --bind 127.0.0.1 --directory "$BENCH_DIR"`, then open the private results page on localhost. Do not expose the server on a public interface.

Open local `results/blind-review.html` directly in your browser and print if useful. It includes local original prepared sources, masked randomized output IDs and individual A–G evidence fields for R1/R2. Give each reviewer only their assigned rows; keep `private-blind-key.json`, unblinded summaries and raw payloads hidden until independent scoring ends. No browser/cloud upload is required. Copy `ratings.template.json` to a private `ratings.json`; enter 1–5 per domain plus written image-specific evidence, hallucination/original-process/grounding/usability flags. Do not submit incomplete template rows; include only completed ratings. At least two independent assessments are required for recommendation eligibility. Per-reviewer scores and absolute disagreement are preserved; a composite cannot conceal factual/process errors.

Use the existing [sixteen-dimension artistic rubric](../review/grounded-artwork-assessment-acceptance.md#sixteen-dimension-human-rubric) inside these same evidence notes; do not invent another composite score. Map dimensions 1–4 and 13 (fidelity/subjects/focus/composition/annotations) to B; 5–6 (colour/value) to C; 7–8 (pedagogy/process) to D; 10–12 (specificity/learning/practice) to E; 9 and 14–16 (calibration/consistency/clarity/style) to F. A separately records medium/input eligibility; G records contract/layout usability. For every applicable dimension, quote the actual claim and source region and record supported/uncertain/unsupported/not applicable. Missing output context or unavailable geometry is **unverified**, not a pass. Full geometry review may require separately consented private response retention; text excerpts alone cannot establish annotation accuracy. AI-assisted reference drafts need independent human checking and must not be labelled human ground truth.

```bash
node scripts/benchmark/cli.cjs report \
  --prepared "$BENCH_DIR/prepared" --output "$BENCH_DIR/results" \
  --ratings "$BENCH_DIR/ratings.json"
```

## Subsequent full comparison (separate approval; NOT automatic)

After judging the pilot and separately approving the remaining cases, complete the manifest's remaining annotations/files, then:

```bash
NODE_PATH=/opt/codex/cua_node/lib/node_modules \
  node scripts/benchmark/cli.cjs prepare \
  --manifest "$BENCH_DIR/manifest.json" --output "$BENCH_DIR/prepared" \
  --chromium /usr/bin/chromium

node scripts/benchmark/cli.cjs run --dry-run \
  --prepared "$BENCH_DIR/prepared" --rates "$BENCH_DIR/rates.json"

# Only after reviewing the new projection and authorizing the remaining spend:
node scripts/benchmark/cli.cjs run --live --confirm-cost \
  --prepared "$BENCH_DIR/prepared" --output "$BENCH_DIR/results" \
  --rates "$BENCH_DIR/rates.json"

node scripts/benchmark/cli.cjs report \
  --prepared "$BENCH_DIR/prepared" --output "$BENCH_DIR/results" \
  --ratings "$BENCH_DIR/ratings.json"
unset OPENAI_API_KEY
```

The same prepared experiment is bound to the same cost journal. The twelve pilot slots are not repeated: full follow-up has **at most 84 additional requests**, 96 total. New ratings are added using the new blank template without overwriting completed ratings. Reports include per-category confusion matrices/error rates, false accepted nonpainting counts, watercolor false reject/uncertain rates, raw strict-schema and canonical success, truncation/refusal, mean/median/p95 latency, output words/chars, token breakdowns, cost per human-usable accepted output, individual review scores/disagreements and written exemplars. JSON-word counts include keys; completion tokens are authoritative for budgeting. Unmeasured hallucination/grounding stays unknown. Invalid, uncertain and not-comparable are not successes.

A complete 24-case/six-category screening plus two blind reviews per output is required before suggesting any candidate for a **separate** production proposal. Unsafe screenshot/photo acceptance, factual or original-process hallucination, invalid schema, poor usable layout or truncation disqualify a candidate. Teaching must improve against baseline before price optimization. Small N cannot prove near-zero error rates or live artistic quality. If results are close, make no winner claim; a larger follow-up needs separate approval.

Physical medium may be genuinely unknown. Cases explicitly marked `ambiguous_ground_truth:true` with `ground_truth:uncertain` retain all observed model outcomes, but are excluded from the scored eligibility error denominator (`eligibilityScored` / `unscoredAmbiguous`); their error rate is null when nothing is scorable. A schema-valid accepted critique can still receive blind artistic review. Unknown medium does not force model abstention and is never relabelled confirmed watercolour. These cases cannot establish confirmed-watercolour recall or an automatic model winner. If all pilot outputs abstain with null analysis, artistic comparison is inconclusive; do not bypass the production gate or issue additional critique requests automatically.

## Budget, interruption and reproducibility limits

The hard application-side limit is **$3 total per prepared experiment**, 24 cases, four fixed arms, 96 durable request slots. It cannot be raised through a CLI flag. A reservation and its separate integrity checkpoint are fsynced BEFORE the only HTTP request. The checkpoint hashes the complete journal: missing, empty, truncated or edited accounting is rejected before resume or reporting. Legacy journals without a checkpoint require manual audit; the tool never silently recreates them. Calls are sequential. No redirects, retries, repair, hidden probes or fallbacks. A repeated invocation skips completed slots; a network error or unknown usage stops all further paid requests. An interrupted reservation remains burned and conservatively charged. A stale `run.lock` requires manual local audit; do not delete a journal/reservation to retry an uncertain request. Changing output directory cannot bypass the binding.

Before every call the guard uses a conservative **UTF-8 byte bound**, not a claimed exact tokenizer: twice the serialized nonimage request bytes plus 4,096 framing allowance, plus the separately documented per-arm image-token upper bound, plus all 3,000 output tokens. Prospective input assumes no cache discount and additionally reserves worst-case cache writes. Actual cost uses uncached/cached tokens, additive cache writes and completion tokens **including reasoning once**; optional absent breakdown fields are recorded as unreported (API optional fields default zero), not measured zero. Unknown monetary fields, absent/inconsistent usage, bound overruns or nonstandard tiers abort further requests. Compare invoices after the run; additive write accounting can overestimate actual billing.

These are intentionally loose upper estimates, not identical low/high formulas or provider billing guarantees. The full 96-call worst-case projection may exceed $3; then the guard stops before the next unaffordable request and reports an incomplete comparison. It does not promise 96 results for $3, lower fidelity or silently raise the cap. Actual costs may be lower than reservations, freeing budget for later calls. The in-flight request can still exceed a mistaken upper bound; provider billing delay, tokenizer framing, alias changes, image rules or incorrect attested rates cannot be enforced as an account-level ceiling. Set separate OpenAI project controls and reconcile billing. If no trustworthy image bound/price exists, **do not run live**.

Privacy: excerpt redaction is best effort, not an identity detector; manually inspect before sharing anything. All output is local outside Git; private image contents are never printed. No real artwork is included in automated tests. Raster tests use original technical shapes and mocked API tests cannot establish visual accuracy, model quality, pricing correctness, native device behavior or actual account compatibility. Production and Create Reference remain unchanged.
