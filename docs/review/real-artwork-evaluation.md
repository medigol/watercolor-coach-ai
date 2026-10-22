# Real-artwork offline acceptance and benchmark correction

## A. Verdict and repository baseline

**CONDITIONALLY READY for engineering review; NOT artistically accepted or frozen.** Five supplied files were inspected and prepared locally. No real provider response was generated or evaluated. Independent human review, Care Bears originals, verified current prices/model-specific compatibility and explicit transmission/spending authorization remain blocking acceptance gates. No candidate model has won. A reproduced critical semantic failure in a future authorized run changes the verdict to NOT READY.

Work continues on `codex/grounded-artwork-assessment`, starting from clean, remote-synchronized `1aa087f0f1f3f5f27378bf28c8319ead86601f53`. Current main at inspection was `8ce3c80823b259495ff19c39189de36d32d4a5bc`. Prior composition, critique, image preparation, pixel evidence and benchmark work was already integrated. Its [baseline](grounded-artwork-assessment-baseline.md), [implementation report](grounded-artwork-assessment.md) and [validation record](grounded-artwork-assessment-validation.json) remain historical records, not rewritten experiments.

Date: **2026-10-23 Australia/Sydney**, executions on **2026-10-22 UTC**. Node 22.23.4, Deno 2.5.6, local Chromium/Playwright; no app dependency changes. The only executable change is developer benchmark reporting, committed as `6f8510b` (`Correct benchmark eligibility outcome error accounting`). Production remains byte-for-byte unchanged from the reference commit, including prompt/schema/source lock.

## B. Available image inventory and viewing diagnosis

Private corpus: `/tmp/watercolor-private-evaluation/`, outside every Git checkout. Directories are 0700; files 0600. Originals were copied without changing their bytes; private inventory records source hashes, actual JPEG headers, upright dimensions, orientation, permission and limitations. All five are RGB JPEGs with orientation 1. Decode integrity (`Pillow.verify`, then actual pixel decode) and local `view_image` succeeded for all five in this execution. No corrupt, missing, unreadable or unsupported file was found. There is no retained diagnostic proving the cause of previously reported viewing failures; they must not be retroactively attributed to image corruption. Local visual access is now available.

| Private case | Supplied input | Source and prepared dimensions | Physical medium / intent | Preparation and status |
|---|---|---|---|---|
| C02 | Church/street/powerlines original | 915 × 1280 | UNCONFIRMED / UNKNOWN | Full artwork retained; prepared and viewed |
| C03 | Vehicle/mountain-road original | 857 × 1280 | UNCONFIRMED / UNKNOWN | Full artwork retained; prepared and viewed |
| C04 | Additional waterside architecture/boat artwork | 1280 × 853 | UNCONFIRMED / UNKNOWN | Generalisation case; full image prepared and viewed |
| C08 | Additional urban-street artwork | 926 × 1280 | UNCONFIRMED / UNKNOWN | Generalisation case; full image prepared and viewed |
| C16 | Nested boat-assessment screenshot | 591 × 1280 | UNCONFIRMED / UNKNOWN | Full external UI deliberately retained as a dangerous-input control |
| C22 | Linked manual-isolation attempt from C16 | Selected 260 × 187; **no prepared output** | UNCONFIRMED / UNKNOWN | Correct artwork-only selection fails existing 65,536-pixel minimum; no upscaling or UI padding |
| — | Care Bears full screenshot and isolated illustration | Unavailable | UNKNOWN | **PENDING — ORIGINAL INPUT UNAVAILABLE**, both cases |

C22 is a linked source copy/attempt, not a sixth original or independent held-out artwork. Existing diagram marks obscure part of its thumbnail. No credible original boat raster can be recovered from that screenshot. There is no assertion that these watercolour-like appearances establish physical medium, artist skill, materials or process. Watercolor-category slots are appearance-based sampling strata; their `watercolor_status` is **ambiguous**, never confirmed. Standalone source/prepared eligibility is **uncertain**, with abstention acceptable. C16 expects **crop-needed**, prohibiting a normal confident critique of browser/app controls. These are predeclared expectations, not measured model outcomes. All `approved_for_api` values remain false; unfilled manifest slots remain placeholders, not fabricated images.

## C. Source-based references, independence and privacy

Before any new model output, source-based draft references were written for all five inputs. They distinguish visible subjects/relationships, plausible interpretations, uncertain inferences, forbidden claims, coarse source rectangles and teaching expectations. They do not assign Strong/Competent, learner level or compulsory faults. These are **AI-assisted visual drafts**, independent of future evaluated responses, **not independently reviewed human ground truth**. Two actual reviewers must check them before comparative artistic claims. No reviewer participation or rating is invented.

Private artifacts include `inventory.json`, 24-slot `manifest.json`, `reference/C*.json`, `predeclared-acceptance.json`, `prepared/prepared.json`, exact prepared images, local original/grayscale reference pages, upload-flow captures, raster measurements and a root-cause/pilot record. Source hashes, exact coordinates, private screenshots and detailed image-derived evaluation material stay outside Git. Human expectations are never inserted into the production prompt or request body. No complete provider response exists here.

## D. Eligibility and crop findings

The **actual production web preparation adapter** ran in Chromium with network requests blocked. Five full-image exports passed header/resource/orientation checks; dimensions stayed correct. Output hashes are recorded privately and verified by the existing benchmark. Four standalone full-image selections preserve all supplied artwork and intentional margins. Local automatic proposals were **absent for all five inputs**. This is a measured limitation of the inexpensive border proposal, not proof of medium classification failure or success. No automatic screenshot detector was added or claimed.

The raw screenshot was retained in full. Against the draft artwork-thumbnail rectangle, it covers the artwork but includes approximately **93.6% excess area**. This is a descriptive containment measurement, not an artistic-accuracy score. It must not become a successful painting assessment merely because a crop editor was offered. The exact artwork-only crop is below the existing minimum area and is correctly blocked. Obtaining the original boat raster is the safe next step. Keeping interface pixels or enlarging the thumbnail to pass validation would not recover information and was not done.

Model accepted/rejected/uncertain/crop-needed results, false acceptance/rejection rates and screenshot semantic contamination remain **UNVERIFIED**, because no provider calls were authorized or executed. Five successful local image exports do not establish five accepted paintings.

## E–J. Perception, grounding, criticism, calibration, teaching and pigment findings

| Case | Source-based observations, separate from model performance | Interpretation / required verification |
|---|---|---|
| C03 | Lower-middle red-fronted vehicle; large cool mountain; warm right-side vegetation; curving road and near shadows are visible. Original and actual grayscale were inspected separately. | Vehicle attention is plausibly chromatic as well as tonal; hue alone cannot establish strongest local value contrast. Coarse linear-light samples show dark vehicle and shadow passages, not a unique focal score. Right vegetation references must exclude unrelated road. No current model tree overlay, verdict, issue or exercise exists to score. |
| C02 | Tall tower right of centre; left pole and overhead wires; warm light street and dark foreground masses are visible. | Wires are observed structures; an eye-movement route is interpretive. No unique diagonal path, relocation, granulating pigment or layering history follows from this. Current model path/landing and wording remain unverified. |
| C04 | Dark right-bank architectural mass and reflection; smaller boat left of centre; broad water and pale distant buildings. | Boat and architecture support more than one plausible attention reading. Atmospheric recession can be discussed from visible contrast/softness; no quality label or mandatory correction is preassigned. |
| C08 | Left buildings and red awnings, street vehicles/figures, pale distant architecture and open sky are visible. | Near accents and distant destination permit alternative hierarchy readings. Exact perspective accuracy and a useful intervention require an actual assessment and independent review. |
| C16 | Outer and inner mobile/browser/app interfaces surround a small abstract boat thumbnail with pre-existing marks/text. | This is not Care Bears and is not an isolated original painting. Raw acceptance of external controls as artwork is a critical failure category; actual eligibility outcome is still pending. Historical text/marks in this file are not a controlled response from current HEAD. |

No new actual pigment mixture, quality label, exercise or process claim was available to evaluate. The existing clear-pink/yellow guard, coral/peach counterexamples, future-technique permission, process restrictions, material-only display calibration and one-variable study safeguards pass deterministic regressions. They do not prove physical pigment behaviour or useful teaching from real provider output. Expert paint tests, actual response inspection and human review remain necessary. No unsupported weakness, substitute recipe, diagram or teaching exercise was invented to populate results.

## K–L. Model readiness and independent review

Exactly four arms remain configured: `baseline_low` (`gpt-4.1-mini`, low), `baseline_high` (same model, high), `candidate_mini` (`gpt-5.4-mini`, high), `candidate_luna` (`gpt-6-luna`, high). Production is still baseline low, temperature 0.3, 3,000 completion tokens. Candidate adapters still request reasoning `none` and omit temperature; those combinations are **not newly verified**.

Official model/pricing/vision/structured-output pages failed with `Tunnel connection failed: 403 Forbidden`. The elevated retry was cancelled. The accessible official OpenAPI lists the three IDs and generic fields but does not verify each model/account combination, strict schema support, detail accounting, price or output/reasoning behaviour. See the dated [compatibility record](../benchmark/compatibility.md), including the newly retrieved deprecation metadata. All arms are **unavailable for live evaluation here until those checks are completed**, rather than silently substituted. The example rate card was not made authoritative. No paid availability probe or API key use occurred.

The same production lock, exact prepared bytes, four-arm configuration and existing 24-case/96-request journal remain the comparison foundation. There is no second benchmark or scoring system. The [sixteen-dimension rubric](grounded-artwork-assessment-acceptance.md#sixteen-dimension-human-rubric) remains intact; existing A–G blind worksheets can record its dimensions through the documented categories and evidence notes. No worksheet was populated with invented outputs. No independent human reviews occurred. At least two blind reviewers must quote exact claims, identify source regions, distinguish factual errors from interpretation and preserve disagreements. Geometry scoring needs the actual output geometry, not excerpts alone; use separately approved private full-response retention when necessary. No reviewer averages may conceal critical errors.

The 3,000-token cap's truncation/detail effects, real token accounting, latency, usable-output cost, quality differences and stability remain **unmeasured**. No winner or model-only improvement is claimed. No baseline outputs or ground truth were rewritten.

## M. Reproduced defect, root cause and smallest correction

**Confirmed offline defect: category error arithmetic.** `scripts/benchmark/report.cjs` compared manifest `accept`/`reject` directly with provider `accepted`/`rejected`. Correct accepted/rejected outcomes were therefore counted as category errors and could prevent a valid screening recommendation. This is a reporting-vocabulary mismatch, not model perception, production eligibility or artistic evidence.

`tests/benchmark-outcomes.test.cjs` was added first: **two failures reproduced** (five passing controls). A narrow `matchesExpected` helper now maps only those two vocabulary pairs, preserving recorded confusion labels, explicit crop-needed, uncertainty, invalid/not-comparable outcomes and predeclared abstention policy. Seven regressions cover correct outcomes plus false acceptance and invalid/abstention counterexamples. After correction, the affected benchmark suite passes **86/86**; complete unit/integration suite passes **1,767/1,767**. Prior private journals/results were not edited. No new diagnosis, provider request or production suppression was introduced.

C16's missing automatic proposal is a **confirmed local detector limitation**, mitigated by explicit confirmation and the existing same-call eligibility gate; whether that gate rejects/abstains correctly is blocked on authorized outputs. Its tiny isolated crop is an **intended resource/quality gate**, not a defect to bypass. Other reported semantic failures remain hypotheses until actual comparable outputs exist.

## N. Before/after evidence

A deterministic correct `accept → accepted` or `reject → rejected` category pair changed from one error to zero. False acceptance of reject/crop-needed remains one error; invalid and not-comparable remain errors. This is an accounting correction, not improved art criticism. There is **no comparable before/after real-model assessment**; neither historical screenshot wording nor local reference rectangles substitute for one.

## O. Executed free validation

See [machine-readable validation](real-artwork-evaluation-validation.json) for exact commands/artifacts. All final executed checks below passed. No tests were skipped or cancelled in the unit/integration suite.

| Check | Actual result / scope |
|---|---|
| Unit/integration/schema/geometry/tonal/colour/pigment/evidence/legacy/provider/security | **1,767 pass; 0 fail, 0 skip, 0 cancel, 0 todo; 7 new tests** |
| Frontend strict TypeScript | Pass |
| Strict Edge TypeScript | Pass, Deno 2.5.6 |
| Configured Pages export | Pass, documented base path and fake public test configuration |
| Unconfigured Pages export + direct routes | Pass; eight routes, zero external requests/runtime errors |
| Full professional browser harness | **177 cases**, seven widths 375/390/430/768/1024/1440/1800; zero runtime errors |
| Actual technical preparation raster browser suite | **40 checks**; no provider calls |
| Existing benchmark browser suite | **6 technical fixtures**; zero network/provider calls/errors |
| Available real-image preparation | **5 full-image exports**, zero network calls; C22 isolated thumbnail deliberately blocked |
| Real-image reference projection | **35 checks**, five images × seven widths; zero network/runtime errors; reference geometry only |
| Actual exported-app selection/crop confirmation with real files | **10 checks**, five files × 375/1440; tiny crop blocked; zero provider/upload/write calls; mocked auth only |
| Pilot dry-run | **12 planned**, **0 paid**, $3 application guard, `worstCaseUSD:null`, `readyForLive:false` |
| All-available dry-run | **20 planned**, **0 paid**, same blocked pricing state; not authorization to test five cases |
| Isolated PostgreSQL 16 | Pass; schema twice, owner-only RLS/storage paths, server RPCs, quota/idempotency/rollback and concurrent claim checks; no live Supabase |
| Protected-source and privacy review | Production tree/lock, dependencies/workflows/SQL unchanged; no private image/evaluation file tracked |

Invocation issues were corrected, not concealed: the technical raster harness initially received an output path in its URL position, causing invalid navigation; it passed after supplying the documented URL and output arguments. The private UI check initially checked the wrong disabled representation and then checked before the percentage field's blur-commit; after using `isDisabled()` and committing the field, the existing minimum-area block passed. Neither was a production defect. The deliberate small-crop preparation rejection is recorded separately from successful exports.

## P–Q. Product, operational and security evidence

The full controlled exported-app harness retested Clean/Notes/Composition/Roles, source/crop/value evidence, semantic headings, keyboard focus, touch geometry, legacy reopening, Create Reference, upload/loading, explicit retry, 401/403/409/422/503, quota/dedup and lost-response recovery. These use mocked Auth/Storage/Edge responses: simulated mutation traffic during synthetic upload tests is not real artwork transmission. Saved-result interaction/reopen checks create no provider/upload/write calls. The separate real-file flow never submitted analysis; local authentication was mocked, and any unexpected remote request was blocked.

Reference displays use actual prepared images plus the **existing production coordinate projector** and genuine same-source CSS grayscale. They prove alignment and frame correspondence, not correctness of a model's subject regions or artistic paths. No completed assessment was fabricated for these real files. Private captures were visually inspected. Physical Android Chrome, native grayscale, Safari/Firefox, real screen readers, deployed storage expiry/CORS and live Supabase remain manual/environmental checks.

Production provider/draft architecture, prompt, schema/version 1, single-call behaviour, gpt-4.1-mini/low/0.3/3000 settings, retry/no-fallback policy, quota, dedup/idempotency/lost-response rules, auth, storage, RLS, SQL, secrets, dependencies, workflows and Create Reference are unchanged. New inference calls: **0**; paid cost: **$0**; real-art uploads/DB writes: **0**. No image generation, artistic-content editing, fake before/after, new service or deployment. Production latency/storage overhead change: **none from this patch**; baseline optional local raster work remains as previously documented.

## R. Remaining risks and controlled next pilot

Proposed pilot, **not executed or currently authorized**: C02, C03 and full raw C16, selected for structure/path, colour/value/localization and external-UI contamination respectively. C04/C08 remain generalisation cases with no provider outputs; they are not statistical evidence or a completed held-out acceptance set. The existing runner plans **at most 12 requests**, three cases × the same four arms. Current verified cost projection is **unknown**, so live is blocked. Do not set approval flags or guess image bounds to proceed.

Before requesting paid approval: independently review references, verify every arm's current official model/API/detail/schema/reasoning/pricing/image bound and same-day private rate card, verify unchanged source lock and prepared hashes, review the prospective projection, confirm image-transmission rights and account spending controls, and assign two blind reviewers. A later explicit approval must cover the three images, OpenAI transmission, maximum 12 attempts and the reviewed spend. Full provider-response retention needs separate explicit consent if requested for geometry review. Do not automatically continue to 24 cases or repeat failed slots.

The runner's **$3 experiment-wide application guard** reserves a conservative bound before each request; uncertain calls burn slots, the integrity-protected journal cannot reset with another output directory, and unknown usage/bounds/compatibility stop subsequent calls. No retries, repair, fallback or separate classifier. This is not an invoice guarantee: framing, image accounting, incorrect attestation and delayed billing require account-level limits and reconciliation. Stop also for any critical UI/object/ownership/mapping error; diagnose its layer before requesting separately authorized follow-up. A changed source lock requires a genuinely reviewed new experiment, never a budget-reset workaround.

After prerequisites are satisfied, the existing commands are:

```bash
# Free; prepared files already exist locally. No API key needed.
node scripts/benchmark/cli.cjs run --dry-run \
  --prepared /tmp/watercolor-private-evaluation/prepared --cases C02,C03,C16

# FREE, only after current official rates and bounds have been verified:
node scripts/benchmark/cli.cjs run --dry-run \
  --prepared /tmp/watercolor-private-evaluation/prepared \
  --rates /tmp/watercolor-private-evaluation/rates.json --cases C02,C03,C16

# NOT AUTHORIZED: only after separate explicit paid/transmission approval,
# private approval flags, a verified same-day rate card and a privately set key:
node scripts/benchmark/cli.cjs run --live --confirm-cost \
  --prepared /tmp/watercolor-private-evaluation/prepared \
  --output /tmp/watercolor-private-evaluation/results \
  --rates /tmp/watercolor-private-evaluation/rates.json --cases C02,C03,C16
```

Use Node 22+ and the existing [benchmark instructions](../benchmark/README.md). An intentionally absent verified `rates.json` blocks the paid command today. The manifest/source records are immutable once prepared; do not edit them in place merely to approve transmission—prepare a reviewed permission-updated experiment **before any paid request**, preserving this offline record. Never recreate an experiment to replay an uncertain paid attempt or reset spending. No live journal exists in this offline corpus.

## S. Final requirements traceability

PASS means the bounded executed engineering/local check, not artistic acceptance. PARTIAL/BLOCKED/UNVERIFIED remain open. References below are private artifacts unless repository paths are named.

| Requirement group | Status | Evidence / remaining action |
|---|---|---|
| Continuation 1: unknown medium/intent/materials/skill | PASS | Inventory + manifest ambiguous/uncertain; no invented provenance or quality |
| 2: five actual files; mandatory originals; missing Care Bears | PASS / BLOCKED | Five source hashes/decodes/prepared images; both Care Bears inputs unavailable |
| 3: viewing diagnosis | PASS / historical cause UNVERIFIED | All five viewed now; no original failure diagnostic supports a retrospective cause |
| 4: private corpus, full screenshot, no API approval | PASS | External 0700/0600 workspace, 24 slots, five prepared; C22 safely blocked |
| 5: pre-output source expectations | PARTIAL | Five AI-assisted reference drafts; independent human review PENDING |
| 6A: vehicle facts/value/vegetation/road regression | PARTIAL | Original/grayscale/reference samples inspected; actual model output/overlay/teaching UNVERIFIED |
| 6B: church/path/process/position/text regression | PARTIAL | Original/reference inspected; current provider path/claims UNVERIFIED |
| 6C: additional generalisation cases | PARTIAL | Two independent source files and expectations; no evaluation output |
| 6D: nested screenshot boundaries | PARTIAL | Outer/inner UI and thumbnail localized; raw retained, tiny crop blocked; model eligibility UNVERIFIED |
| 7.1–2: container and medium recognition | PARTIAL | Local boundaries/explicit confirmation checked; no semantic model result |
| 7.3–6: focal/support/colour/path/value accuracy | PARTIAL | Existing deterministic tests + real reference frame/grayscale; actual model correspondence UNVERIFIED |
| 7.7–12: process/pigment/praise/labels/practice/contradictions | UNVERIFIED real output | Existing guards/counterexamples pass; no current real assessment to judge |
| 7.13–16: malformed text/duplication/mobile/saved compatibility | PASS engineering / PARTIAL artistic | Full test/browser matrix; real saved artistic annotations unavailable |
| 8: justified fix, test-first, counterexamples, no hardcoding | PASS | Reporting mismatch reproduced (2 failures), narrow helper, seven regression tests |
| 9: all applicable free validation | PASS | Validation table/JSON; physical-device/deployed-environment checks remain manual |
| 10: four-arm readiness, current rates, source lock | PARTIAL / live BLOCKED | Exact lock verified; documentation 403, cancelled elevation; no price/compatibility fabrication |
| 11: independent defensible evaluation, no model winner | PASS method / human review BLOCKED | Pre-output drafts, existing rubric/blinding retained; no ratings or superiority claims |
| 12: controlled pilot and safety gates | PASS plan / execution BLOCKED | Three named slots, 12 planned, no approved arms/rates/transmission/spend |
| 13: inventory/diagnosis/corpus/references/regressions/fixes/checks/gaps/pilot/verdict/Git | PASS reporting | This report, validation JSON, private detailed evidence, final delivery SHA/status |
| 14: priority/no Care Bears substitution/no paid/no production switch | PASS | Zero paid/transmission; no model/settings/source-lock changes |
| Master phases 1–2: baseline/benchmark/originals/expanded corpus | PARTIAL | Existing infrastructure reused; five files, remaining slots and Care Bears missing |
| 3: independently reviewed ground truth and predefined acceptance | PARTIAL | References/predeclared critical rules created before outputs; human sign-off missing |
| 4: actual prepared bytes/full screenshot/crop safety | PASS local / UNVERIFIED model | Five exact exports + crop failure + raw UI control; intentional-interface/disconfirming real model cases pending |
| 5: factual perception/semantic regions/paths/root layers | UNVERIFIED model | No provider geometry/objects; local draft projection is not model accuracy |
| 6: professional composition/values/colour/structure/light/edge critique | UNVERIFIED model | Source/reference observations available, no actual critique or expert review |
| 7: useful criticism/quality calibration/contradictions | UNVERIFIED model | Existing deterministic gates pass; actual critique not generated |
| 8: recommendations/practice/learner level/transfer | UNVERIFIED model | No learner context invented; no actual exercise or longitudinal learning evidence |
| 9: actual pigment mixes and physical plausibility | UNVERIFIED real output | Existing pink/coral/white/ratio/process regressions pass; no actual recipe/paint test |
| 10: model frontier/prices/detail/token cap | BLOCKED | Exact baseline/source bytes available; no verified rate card or authorized output |
| 11: response stability/statistical claims | BLOCKED | No repeats authorized; no accuracy-rate/statistical superiority claim |
| 12: blind two-reviewer sixteen-dimension review | BLOCKED | Existing machinery/rubric retained; zero actual reviewers/ratings |
| 13: no overfit/rewrite/test-specific production exception | PASS | Production untouched; additional cases reserved, no outputs trained against expectations |
| 14: failure/root-cause ledger at correct layer | PASS bounded | Confirmed reporting defect vs intended small-crop gate vs unverified perception distinguished |
| 15: real flow/responsiveness/accessibility/rendered alignment | PARTIAL | Actual selection checks + full technical app matrix; real model annotation, physical device, signed URL environment pending |
| 16: v1/ownership/readonly reopening | PASS engineering | Existing saved suites/full browser checks; no schema/data mutation |
| 17: privacy/adversarial/security | PASS engineering / PARTIAL model | Private artifacts, no external image traffic, SQL/security tests; actual adversarial model obedience pending |
| 18: release blockers/readiness criteria | PASS criteria / acceptance BLOCKED | No READY without exact outputs and independent review; future critical defect => NOT READY |
| 19: stages A–C, D–K | PASS offline / BLOCKED paid-dependent stages | Safe audit/preparation/checks/fix complete; paid/review/held-out artistic gates not substituted |
| 20–21: report/evidence format | PASS available evidence | Case/config/input/source/reference/proof/uncertainty recorded; output-specific fields explicitly unavailable |
| 22–23: discipline and limits | PASS | Existing architecture retained; no fabricated facts/ratings/process/learning gains; exact original methods and universal best composition remain unknowable |

## T–U. Release decision and Git delivery

The bounded offline engineering phase can close after this report is pushed. **The artistic-acceptance phase cannot close or freeze.** Missing Care Bears inputs, independently reviewed references, verified API/rates, explicit paid/transmission authorization, actual responses and blind expert review remain mandatory. No known new reproducible production critical defect was established offline; this is not proof that the screenshot/semantic failure category is solved.

Changed files: `scripts/benchmark/report.cjs`, `tests/benchmark-outcomes.test.cjs`, `docs/benchmark/compatibility.md`, `docs/benchmark/README.md`, `docs/review/grounded-artwork-assessment-acceptance.md`, this report and its validation JSON. The final delivery message supplies final SHA, additions/deletions and remote/clean-tree verification. No PR creation, merge, deployment, main write, production configuration change or paid call was performed.
