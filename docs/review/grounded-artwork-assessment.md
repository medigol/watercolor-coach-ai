# Grounded Artwork Assessment remediation

## Executive verdict

**CONDITIONALLY READY for engineering review; real artistic acceptance remains open.** This verdict is conditional on the final validation record below. No unconditional production freeze or artistic-quality certification is claimed. Exact originals and controlled real model outputs for the van, screenshot illustration and church are unavailable. Any reproduced assessment of external app UI as painting evidence remains a critical release blocker.

Baseline: `main` **8ce3c80823b259495ff19c39189de36d32d4a5bc**, merging PR #36 and the earlier artistic-quality work. Initial tree clean; dedicated branch **codex/grounded-artwork-assessment**. The [baseline matrix](grounded-artwork-assessment-baseline.md) records the inspected end-to-end pipeline and existing safeguards. The [independent acceptance matrix/rubric/limitations](grounded-artwork-assessment-acceptance.md) distinguishes engineering proof from unexecuted artistic tests. Final commit/push details are in the delivery message.

## Reproduced root causes and implemented changes

| Defect | Mechanism | Bounded correction and evidence |
|---|---|---|
| Unconfirmed whole image | Input ambiguity + frontend flow: no local boundary proposal was interpreted as permission to analyse everything | Every selection now opens the existing crop editor. Explicit full-image or crop confirmation is required; analysis remains disabled until then. Original upright source stays local and available via Adjust crop; selected preview identifies what is analysed. Technical nested-UI test checks actual cropped pixels and zero calls/writes, not medium recognition. |
| Path falsely straightened | Canonical cleaner discarded supplied middle anchors merely because the archetype was diagonal | Preserve ordered supplied points. Tests assert complete original geometry rather than a stock endpoint shortcut. No stored record is mutated. |
| Wrong directional destination | Optional geometric validation accepted path endpoint far from its own declared focal anchor | Directional diagonal/S paths with a supplied focal anchor omit their diagram if endpoint distance exceeds 0.12 normalized units. Never move/snap/redraw the path or invent an anchor. Text remains. Coarse tolerance is documented and tested; subject identity is not thereby proven. |
| Balance/frame teaching lost | Schema consumer required Entry/Path/Landing even for structural archetypes | Existing supporting/quiet/counterbalance/risk metadata can support teaching without journey fields. Existing archetype-specific rows remain unchanged. |
| Hue-only evidence forced to grayscale | Frontend aggregation overrode `insightEvidence.value` with `true` | Value evidence placement now requires a supplied tonal fact. Existing hue/value guards remain. Actual multi-region tonal comparison gains a reversible local grayscale toggle. |
| No independent tonal check | Only model text/property alignment existed | Bounded same-source web raster read, sRGB transfer decoding + Rec.709 linear luminance, region median/10th/90th percentiles. Stats sample canonical target, not expanded crop context. Two supplied regions can show a coarse relative comparison. No image changes/assets/uploads/writes/calls. It does not prove focus, subject identity or the model's artistic judgement. |
| Wrong colour region escaped text checks | Valid role ID/box can still point to a different hue | Optional coarse pixel contradiction gate omits a chromatic colour crop when a sufficiently populated source region contradicts its approximate hue. Neutral/low-chroma/tiny samples abstain; a small genuine accent is retained. Names/swatches remain palette-level. No role or replacement crop is fabricated. |
| Clear pink mixed with substantial yellow | Model recipes were checked for syntax/ratios/history/white but not this mixing relationship | Shared narrow recipe guard rejects yellow/ochre/PY in generic clear pink/rose/magenta targets. Diluted single rose remains valid; explicit peach/coral/muted targets are not blanket-rejected. Invalid optional recipe omitted, never silently replaced. Existing explicit opaque/gouache variation and future-method rules retained. |
| False independent-evidence impression | Model observation repeated beside source image could look externally verified | Captions distinguish actual source image from assessment-located area and interpretive guide. Composition strokes dashed, with text explaining they are not traced object edges. Pixel checks are explicitly qualified measurements, not artistic verification. |
| Cross-result interaction leakage | Canonical workspace had no explicit source/result change reset | Reset selected note/view/secondary/reveal state. Intrinsic metrics keyed to image URI; late old dimension/sample results cannot be applied to new source. Existing saved-result ownership/read races remain protected. Memoized teaching and colour checks avoid repeating sample work on overlay interactions. |
| Malformed prose | Common entities/markup and trailing truncated slash not handled | Bounded plain-text decoding of common entities, formatting cleanup, omission of unrecoverable truncated slash sentence. No guess that `negative/.` means a textbook concept. Existing process/person/strength/study safeguards preserved. |
| No-issue stamp without useful teaching | Positive stored level could show no-issue status after all meaningful strengths were filtered | Strong/resolved display with no surviving strength no longer gets an unqualified no-issue stamp. Supported material optional opportunities also receive opportunity status. No new score/forced grade distribution; stored quality untouched. |
| Reference-free likeness claim | One artwork supplies no external likeness comparison | Suppress explicit exact/faithful reference-likeness claim. Existing internal alignment evidence may still support bounded structural observations. No reference image or comparison feature invented. |
| Section heading navigation | Only primary assessment/strength/recommendation headings had explicit semantics | Existing Composition, Colour & Value, Edges & Texture and Suggested practice labels are semantic level-two headings, retaining the same accessible accordion controls. No redesign. |
| Benchmark false-acceptance blind spot | Raw screenshots previously required reject-only labels; accepted required-crop controls were absent from false-acceptance count | Raw UI remains full, with reject/crop-needed expected outcomes. Current template requests crop. Accepting a required-crop input counts as false acceptance and `acceptedWithoutRequiredCrop`; no paid runner/cost-journal/96-slot/$3 rule changed. Existing private experiments are not rewritten. |

Before/after deterministic examples:

- No boundary proposal → automatic whole-image acceptance **becomes** explicit user confirmation; not automatic screenshot recognition.
- `[entry, bend, landing]` → `[entry, landing]` **becomes** all supplied anchors preserved.
- Hue fact → forced value comparison **becomes** no grayscale claim from hue-only evidence.
- `magenta + yellow, 1:1 → pink` **becomes** omitted optional mix; no new recipe invented.
- `Colour &amp; Value` **becomes** `Colour & Value` plain text.
- `The tower is clear. Open sky providing quiet negative/.` **becomes** `The tower is clear.`

## Evidence contract, coordinates and graceful degradation

No provider/persisted field, version or SQL migration added. Canonical v1 facts/insights/role links/visual evidence/note IDs remain the source graph. Direct observations, interpretations and future instructions retain distinct existing fact/lesson/action/classification responsibilities. Historical process hypotheses are not presented as facts. Source pixels/dimensions/bounds are independent; duplicated model prose never becomes independent validation. No public numerical confidence percentage is introduced.

All evidence uses the exact private analysed raster: original EXIF-normalized source → explicit crop → proportional prepared raster → normalized 0–1 stored geometry → contained display frame → same projectors for all views. No second frame/geometry system. Context expansion affects only crop presentation; statistics use the original canonical region. CSS grayscale uses the same URI/geometry, without contrast, blur or value edits. A two-region comparison retains both regions and can return to colour. Native keeps the original and honestly states the web limitation. Already-discarded anchors in old saved two-point paths cannot be recovered; no replacement bend is invented.

Missing, tiny, malformed, low-confidence, stale/disconnected or contradictory optional geometry remains omitted/text-only. Existing polygon self-intersection, bounds, global/multi-region, role/note and focal-position gates remain. No claim that a valid coordinate or colour match proves semantic tree/road/church localization. No fabricated region from prose, polygon, before/after, modified subject, figure or generated study.

The original **upload** is available locally while selecting/adjusting, not stored as a second private original. Saved reopening displays the **analysed artwork** only. Retaining an additional original for later comparison would require a separate storage/product decision and was not added.

## Artistic reasoning and teaching scope

Existing selective diagnostics, evidence-aligned recommendations, material-priority ranking, distinct strengths, role/temperature/road/recession guards, supported-rationale normalization, one-variable separate studies and style-versus-defect distinctions remain. No painting is upgraded because pixels, zero recommendations or a hue difference establish quality. Existing confidence remains an uncalibrated model output used internally for omission, not an objective reliability guarantee.

Prompt changes separate container/medium/suitability; raw external UI requests crop, including nesting; intentional interface-themed artwork/painted lettering is not automatically rejected as UI. Quality limitations constrain fine texture/process claims without mechanically rejecting every photograph. Embedded instructions/fake system messages remain untrusted image content. Standalone critique cannot establish reference likeness. Added target-aware pink dilution guidance and preserved one-call, concise-output limits.

Physical medium recognition, correct subject localization, perspective accuracy, meaningful quality level and usefulness of a particular practice still need original-image expert review. No general digital/marker/pencil critique mode or personalized course engine was added. When the watercolour-specific scope is uncertain, the existing eligibility uncertainty path remains.

## Requirements traceability matrix

COMPLETE refers to the stated engineering mechanism and its bounded tests. PARTIAL explicitly retains real-image, semantic or platform acceptance below; it must not be read as professionally validated art criticism.

| # | Requirement | Status | Exact mechanism / test evidence; remaining action |
|---:|---|---|---|
| 1 | Current baseline/pipeline | COMPLETE | Baseline document, Git main/PR36 history, inspected source map; no old branch assumed latest |
| 2 | Actual failure mechanisms | COMPLETE | Root-cause table; unproved perception failures separated from reproduced code defects |
| 3 | Container/medium/suitability separation | PARTIAL | Prompt separates axes, explicit crop/medium messages; no new persisted classification fields; real recognition pending |
| 4 | Artwork boundaries/confirmation | PARTIAL | Selector/editor explicit confirmation, preparation raster tests; automatic detector accuracy and exact B pending |
| 5 | Claim-specific input quality | PARTIAL | Existing header/size/decode gates, new small-image warning + prompt limitations; no certified glare/blur/cast detector |
| 6 | Embedded text untrusted | PARTIAL | Prompt and strict mocked adversarial contract regression; real model obedience pending |
| 7 | Canonical evidence/provenance | PARTIAL | Existing v1 IDs/fact links/source URI plus provenance captions; model object/claim accuracy not independently proven |
| 8 | Observation/interpretation/hypothesis/instruction | COMPLETE | Existing facts/lessons/actions/classifications, visible/future guards, source/guide labels; hypotheses not sold as history |
| 9 | No circular validation | PARTIAL | Independent bounded pixel/bounds checks and written limitations; subjective reasoning remains human-reviewed |
| 10 | Evidence navigation/traceability | COMPLETE | Existing allocation/owner links; source navigation now selects note AND returns to artwork; browser readonly/link checks |
| 11 | One coordinate frame | COMPLETE | Existing shared geometry/preparation, URI-keyed dimensions, EXIF/crop/contain/responsive tests |
| 12 | Semantic annotation correctness | PARTIAL | Existing role-note overlap and anchor/bounds checks + new endpoint guard; exact subject boundaries require human image review |
| 13 | Observed versus interpretive geometry | COMPLETE | Dashed composition guides + explicit source/interpretive caption; no stock diagonal simplification |
| 14 | No false precision | COMPLETE | Existing confidence/tiny/global gates, omitted bad endpoint, colour abstention; no fabricated fallback geometry |
| 15 | Overlay interaction | COMPLETE | Existing accessible line styles, exclusive controls/collision handling; source-change reset and browser matrix |
| 16 | Selective artistic diagnostic | PARTIAL | Existing four-domain draft + compact prompt; usefulness of actual selected dimensions pending expert review |
| 17 | Respect intention/style | PARTIAL | Existing placement/style/alternative safeguards preserved; actual subjective readings pending |
| 18 | Reference-aware scope | COMPLETE | Improve supplies no reference pair; new reference-likeness guard + prompt; no invented reference feature |
| 19 | Hue/chroma/luminance distinction | COMPLETE | Existing textual guard + fixed forced-value bug; independent linear-light numeric fixtures |
| 20 | Image-derived tonal evidence | PARTIAL | `imageTone`, `useImageTone`, EvidenceVisual stats; comparison is coarse and web-only, not every tonal claim certified |
| 21 | Genuine grayscale | COMPLETE | Same-source CSS grayscale, explicit toggle back for multi-region evidence; native limitation stated |
| 22 | Correct colour sources | PARTIAL | Existing canonical links + coarse independent contradiction gate; neutral/ambiguous/semantic location still human-reviewed |
| 23 | Pigment mechanism audit | PARTIAL | Optional model recipe path inspected; ratio/white/history/pink guard and caveats; not a full pigment simulator |
| 24 | Pink regression | COMPLETE | Shared target-aware optional recipe rejection, diluted rose allowed, peach/coral retained; no substitute invention |
| 25 | No process reconstruction | COMPLETE | Existing observation/future-method guards preserved and regressions rerun |
| 26 | Avoid automatic positivity | PARTIAL | Existing independent strength/problem selection + new no-stamp gate for filtered evidence; live distribution/calibration pending |
| 27 | Coherent verdict | PARTIAL | Existing supported rationale/material calibration + new qualified status; no objective art-quality certification |
| 28 | Specific rather than verbose | PARTIAL | Existing target/property/problem alignment/dedup, concise prompt; exact teaching usefulness pending |
| 29 | Meaningful ranked opportunities | PARTIAL | Existing relational/material ranking; no forced filler; real priority selection pending |
| 30 | Consistent placement advice | COMPLETE | Existing coarse focal geometry/neutralization/unsupported-placement logic retained; geometry tests |
| 31 | Authorial agency | COMPLETE | Existing correction/refinement/alternative/study/preservation classes and separate-study safeguards |
| 32 | Assessment-linked practice | PARTIAL | Existing fact/domain links, neutral defect cleanup and one-variable study gate; expert usefulness pending |
| 33 | Controlled comparisons | COMPLETE | Existing single-variable/constant/comparison tests retained; no new practice invented |
| 34 | Actual learner context only | COMPLETE | No learner skill/age invented, existing skill-language removal; no training engine/new mode |
| 35 | No filler practice | COMPLETE | Empty practice state remains valid and tested |
| 36 | Complete experience audit | PARTIAL | Technical browser/responsive inspection; exact artwork, physical Android and assistive-device review pending |
| 37 | Distinct section roles | COMPLETE | Existing workspace retained; semantic section headings, source/interpretation distinction |
| 38 | Deduplication | COMPLETE | Existing strength/recommendation/evidence allocation retained; no separate crop gallery |
| 39 | Text/render integrity | COMPLETE | Existing strict output and guards + common entity/markup/truncated-slash cleanup; regressions |
| 40 | Mobile/zoom/device usability | PARTIAL | Seven-width technical browser checks, contained frame, >=44px controls; real device/high zoom/platform gaps documented |
| 41 | Educational visual roles | PARTIAL | Canonical roles/quiet-road omission and accessible line styles retained; real role correspondence pending |
| 42 | Cross-view same artwork | COMPLETE | URI-keyed dimensions/sample, source reset, original/crop/value/role coordinate tests; readonly browser controls |
| 43 | Layered quality gate | PARTIAL | Existing schema/link/resource/geometry/semantic/presentation checks extended; artistic truth not decidable by these gates |
| 44 | Honest degradation | COMPLETE | Optional bad aids/mixes omitted; input/core errors real; existing no mock fallback retained |
| 45 | Precision AND usefulness | PARTIAL | Genuine future methods/visible effects/valid recipes and diagrams retained; real comparative usefulness pending |
| 46 | Historical compatibility | COMPLETE | v1/legacy saved suites, immutable display path; no data rewrite/reanalysis |
| 47 | New reference consistency | COMPLETE | Existing server IDs/graph/schema unchanged, path anchors preserved, optional metadata remains nonfatal |
| 48 | Safe reopen/revisions | COMPLETE | Saved-result hook, late read/sample races, browser no provider/upload/write checks |
| 49 | Operational/security architecture | COMPLETE | Protected path diff, full auth/owner/quota/SQL regression; no new inference endpoint |
| 50 | Cost/performance | COMPLETE | One call unchanged; bounded/memoized raster, no new upload; prompt-size and measured local overhead reported |
| 51 | Image privacy | COMPLETE | Same private source only; no pixel logs, persistence or new external service; private artifacts outside Git |
| 52 | Serious edge-case suite | PARTIAL | New independent numeric/text/lifecycle/browser cases plus existing suites; extended real-image matrix is pending |
| 53 | Independent expectations | COMPLETE | Acceptance matrix predefines visible/forbidden/geometry/uncertainty criteria, not model-generated ratings |
| 54 | Deterministic tests | COMPLETE | Existing geometry/security/legacy suite + new tonal/colour/recipe/path/text/lifecycle tests |
| 55 | Browser/visual checks | PARTIAL | Exported-app technical source geometry/crop/toggle/screenshots; exact artwork/device checks pending |
| 56 | Sixteen-dimension expert rubric | COMPLETE | Independent acceptance document; actual expert review NOT DONE |
| 57 | Before/after comparison | PARTIAL | Reproducible deterministic snippets/tests; no permitted real baseline-versus-new model comparison |
| 58 | Known limitations register | COMPLETE | Acceptance document lists conditions, impact, mitigation and release gates |
| 59 | Ordered implementation | COMPLETE | Baseline → input → geometry → reasoning → presentation → operational validation; no Phase2 |
| 60 | Severity prioritization | COMPLETE | Input/geometry/value/recipe defects before presentation, no cosmetic redesign |
| 61 | Controlled scope | COMPLETE | No new model/service/dependency/course/social/image-generation system |
| 62 | Production safety | COMPLETE | Security/persisted contracts/provider settings unchanged, real errors/no automatic fallback |
| 63 | Evidence-based release claims | COMPLETE | Conditional verdict; exact originals and expert evaluation UNVERIFIED |
| 64 | Full validation | PARTIAL | All applicable automated checks below passed; physical devices, deployed services and real artistic evaluation remain unverified |
| 65 | Auditable A–Q report | COMPLETE | This report, baseline/acceptance documents, machine-readable validation inventory and final Git delivery |

## Validation, operational impact and Git delivery

Final command outcomes, exact counts and full source inventory are recorded in [grounded-artwork-assessment-validation.json](grounded-artwork-assessment-validation.json). The final delivery supplies the documentation commit and remote push state. No failed/interrupted intermediate command is reported as passing.

| Executed check | Final actual result |
|---|---|
| Node22 `node --test tests/*.test.cjs` | **1760 passed, 0 failed, 0 skipped, 0 cancelled, 0 todo; 44 new** versus integrated baseline1716 |
| Frontend `node node_modules/typescript/bin/tsc --noEmit` | PASS |
| Deno2.5.6 `deno check --config supabase/functions/generate-feedback/deno.json supabase/functions/generate-feedback/index.ts` | PASS, strict configuration, system trust store |
| Configured `EXPO_WEB_BASE_PATH=/watercolor-coach-ai npm run build:web` | PASS with fake public Supabase values; real Pages base-path export |
| Unconfigured `expo export --platform web --output-dir /tmp/grounded-pages-unconfigured --clear --max-workers 2` | PASS, public variables empty, same project base path |
| `tests/browser/professional-workspace.cjs` | **177** responsive/aspect/preparation/eligibility/calibration/evidence cases; zero runtime errors; auth/account, legacy, reference, upload/loading/error/retry/quota/dedup/lost-response and 401/403/409/422/503 covered |
| Browser local tonal comparison | Seven widths375/390/430/768/1024/1440/1800; actual original source, same region transforms, grayscale-only toggle and return to colour; zero additional provider calls/uploads/writes |
| `tests/browser/artwork-preparation.cjs` | **40** actual technical raster/EXIF/alpha/crop/nested-UI byte checks; no paid calls |
| `tests/browser/unconfigured-pages.cjs` | **8** direct routes; safe setup, zero external requests/runtime errors |
| `tests/browser/model-benchmark.cjs` | **6** technical preparation fixtures; zero network/provider requests/runtime errors |
| `scripts/benchmark/cli.cjs run --dry-run --prepared <external technical fixtures>` | Paid0, planned24, max96, budget$3, unknown cost/null and `readyForLive:false` |
| `node scripts/test-local-database.cjs` | PASS: both existing SQL suites in cached no-network PostgreSQL16, schema twice, concurrency one claimed/one busy; no live Supabase |
| Diff, protected-source and key-shaped-string review | PASS for the tested scope: no protected infrastructure path changes, only `.env.example` tracked, no private image assets or matching credentials added; pattern scan is not a formal security proof |

Browser service HTTP is mocked in the actual exported app, not a live Supabase project. Synthetic sources cover portrait/tall architecture, tall vehicle, landscape, square and wide shapes. Keyboard focus, semantic headings, touch targets, contrast, source-frame bounds, note linking and zero side effects are asserted. Technical screenshots were visually inspected at mobile and desktop widths, including measured comparison, Roles and portrait crop preview; no artistic ratings were derived from them. Native devices, Android-device browser behavior, Safari/Firefox, real assistive technology, actual browser high-zoom controls and deployed Storage/Auth/email/expiry behavior remain manual checks.

Intermediate failures are retained honestly: a focused292 run had two old fixtures whose paths deliberately ended away from their focal anchors; those fixtures now specify coherent endpoints, retaining all no-template assertions. The first full1757 run passed1752 and failed5: screenshot policy literal, old two-point expectation, memoization source-layout assertion, no-strength status scope and an over-broad recipe guard dropping a valid explicit opaque variation. The first three expectations were aligned with the new requirements; code fixes retained the prior neutral Competent status and explicit opaque mix. A subsequent1759 run passed; final later-tonal-insight regression brings the fully passing count to1760. The first browser launch used the wrong base-path environment name (`EXPO_BASE_URL`); corrected **EXPO_WEB_BASE_PATH** exports and reruns passed. Later browser checks correctly exposed an absent hue crop in a deliberately mismatched technical fixture and an in-flight initial read captured before readiness. The assertions now explicitly verify crop omission/preserved labels and capture the readonly baseline after the initial read/raster settles. No runtime failure, cost assertion or geometry bound was hidden or disabled.

Protected: provider architecture/draft, one call, no auto retry/repair/fallback, gpt-4.1-mini, low detail, temperature0.3, 3000 output tokens, quota, dedup/idempotency/lost response, persisted v1/schema, auth, storage ownership, RLS/SQL, secrets, dependencies, workflows, Pages and Create Reference architecture. Shared optional recipe/geometry/prose safeguards can also protect legacy/reference optional teaching; no route/mode redesign. No merge/deploy/paid call or private artwork transmission.

Prompt length is **21,427 characters versus 19,963** (+1,464 / 7.3%); output cap unchanged. This is not a paid token/latency measurement. Benchmark production lock refreshed after reviewing the prompt/shared changes; schema and production user-instruction hashes unchanged. No real account/model/pricing probe. Local 256² raster retains 524,288 bytes of numeric buffers; an initial Node-only technical timing was ~8.35ms median after warmup, not a browser/native device performance guarantee. Image decoding and CORS behavior remain platform-dependent. No persistent image/crop asset, storage write or provider request is added by evidence views.

Human review **NOT PERFORMED**. Actual artistic/medium/localization success and an artistic before/after comparison are **UNVERIFIED**. Required manual acceptance: permitted exact originals and independently annotated crop/subject/path regions, fresh consent for any provider run, blind expert rubric, physical mobile/assistive-platform checks and actual deployed signed-image CORS/expiry behavior. No feature may be declared unconditionally READY/frozen from synthetic tests alone.
