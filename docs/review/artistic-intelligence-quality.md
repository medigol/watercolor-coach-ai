# Focused artistic intelligence and editorial review

This work follows the [authoritative request](artistic-intelligence-quality-spec.md). It is an engineering and copy pass, not a new artistic-accuracy claim. The four described user outputs are regression scenarios, not original artwork bytes or a reproducible live evaluation.

## Integration and protected scope

PR #35 is merged in Git: main `25d9f24434180794c14b0cda4a5ecc81e6a98509` has parents `95549eb44bc93812328d560e4a61ff21abebc47a` and the verified candidate `61fab6afe1a3e491632b969fb58f20fbce3e7fb9`. The API read of PR #35 returned `Get "https://api.github.com/repos/medigol/watercolor-coach-ai/pulls/35": Forbidden`; the merge commit, parent identity and identical candidate/main trees establish integration independently. No change was made to that PR, its branch or main.

Branch: `codex/artistic-intelligence-quality`, created from that integrated main. The final commit, push status and PR/compare link are in the delivery message.

No persisted schema/version, model/detail/token cap, provider architecture/draft graph, extra call, automatic retry/fallback, quota/idempotency, auth, storage ownership, RLS/SQL, dependency, secret, deployment workflow or Create Reference architecture changed. The provider remains `gpt-4.1-mini`, `detail:low`, 3,000 completion tokens, one call per new attempt. Handler changes are public message strings only. Shared observation safeguards also protect legacy/reference observations; explicit future methods remain allowed.

## Confirmed corrections

| Area | Root cause and implementation | Regression evidence |
|---|---|---|
| Hue versus value | The shared property dictionary treated every `contrast` as tonal evidence. Explicit hue/chroma/temperature contrast and multiple named hues alone now do not establish a tonal property. Independent supplied dark/light/value evidence remains valid. Colour panels omit a hue-only Value hierarchy; grayscale evidence requires a supplied tonal fact. No RGB swatch or image sampling is treated as luminance measurement. | `tests/artistic-quality.test.cjs`, `tests/evidence-visual.test.cjs`, `tests/live-colour-evidence-ux.test.cjs` |
| Structural accuracy | Generic praise such as accurate perspective could survive with only a focal-placement fact. A narrow supplied-text guard now requires a same-target line/angle/plane/relative-dimension relationship for explicit positive accuracy claims. It does not diagnose drawing errors or verify pixels. | `tests/artistic-quality.test.cjs` |
| Original process | Lifting/negative-painting claims escaped the original-process filter. Named original methods and passive/artist lifting history are now omitted; supplied negative shapes, visible transitions and explicit separate-paper reproduction methods survive. | `tests/artistic-quality.test.cjs`, `tests/live-process-language.test.cjs` |
| Saved compatibility | Applying a stricter observation cleaner to old saved v1 records could reject a previously readable result. Saved, structurally valid v1 data can now use the immutable display safeguard path with an older-assessment notice when cleaning fails. New server output retains strict cleaning/validation. Stored source, image ownership, IDs and version are unchanged. | `tests/result-ux.test.cjs`; `tests/saved-result-read.test.cjs` also proves late reads cannot swap the current image/result |
| Repeated visual evidence | Colour rows bypassed the existing evidence allocator and rendered the same canonical region repeatedly. They now share the allocator with strengths/recommendations/value/technique, using links to the original owner. Colour names remain distinct; uncertain/unlocated rows do not borrow a role as located evidence. No crop file, image transform beyond existing grayscale, upload, provider request or write is introduced. | `tests/result-ux.test.cjs`, `tests/browser/professional-workspace.cjs`, `tests/live-colour-evidence-ux.test.cjs` |
| Empty/repeated teaching | A repeated technical explanation could leave an empty highlighted card. Entirely covered explanations are omitted; a distinct later sentence is preserved. Empty practice is legitimate. No exercise is invented. | `tests/live-colour-evidence-ux.test.cjs`, existing substantive-teaching regressions |
| Confidence and copy | A low-confidence Strong result could still state no major issue without qualification. Confidence below 0.65 now produces a tentative status; grade criteria/distribution and canonical stored quality are preserved. Removed the suggestion to explore optional items when none may exist. Replaced jargon-heavy recovery and loading copy, and clarified screen/control/section names. | `tests/artistic-quality.test.cjs`, `tests/artworks.test.cjs`, `tests/save-button.test.cjs`, rendered heading/mobile/error checks |

## Four observed scenarios

- **Van/mountain:** bounded hue-versus-value and unsupported structural-praise defects reproduced with sanitized text and fixed. Real van luminance, geometry and rating remain UNVERIFIED without original bytes and authorized outputs.
- **Church/street:** lifting/negative-painting history leakage reproduced and fixed. Composition confidence/archetype/anchor gates and existing geometry were preserved. The actual church guide's appropriateness remains UNVERIFIED; no new triangle, path or location was fabricated.
- **Boat/nested screenshot:** actual root cause remains UNVERIFIED. Source review and technical round trips found no reproduction of app-generated screenshots or saved-source swapping. A new late-read race test preserves the selected artwork/image; the existing raster/upload round trip and owner-scoped saved join remain. A source UI screenshot, a previously wrong selection, or a model misclassification cannot be distinguished without its original and saved path metadata. The prompt now explicitly rejects raw recursive app UI; local crop detection remains separate from model eligibility.
- **Illustration/uncertain medium:** cartoon/colouring-page style is explicitly separated from physical medium and quality. Identifiable watercolour-dominant illustration may be accepted; ambiguous pencil/marker/print/mixed-media evidence uses the existing uncertain path. No universal cartoon rejection or physical-medium certainty rule was added. Actual example classification remains UNVERIFIED.

## Prompt and contract

Only the Improve Painting system prompt changed: minor photographed borders versus obstructing context; nested UI versus an original artwork; illustration style versus medium; tonal versus hue evidence; supported positive perspective/proportion claims; observational technique; professional Australian English. Existing substantive, distinct-domain teaching and composition semantics remain. No new provider field, canonical schema, persisted version or global graph was added. Strict schema and the production user instruction hashes remain unchanged.

The benchmark production lock was explicitly refreshed for the reviewed prompt/shared-source changes. Every arm still uses the identical current production prompt/schema and the same prepared bytes. Existing private experiments prepared against the former prompt must not be silently relabelled or have their journals reset: their source lock correctly refuses a different experiment. All paid work still requires explicit authorization and fresh model/detail-specific compatibility/pricing attestation.

No controlled evidence establishes that low detail caused the reported errors, that high detail fixes them, or that a different model wins. This pass makes zero paid requests; technical preparation and mocked API tests cannot answer those questions. No production model, detail, temperature or output-token setting was changed.

## Editorial examples

| Before | After |
|---|---|
| Complete Painting Analysis | Painting Assessment |
| Analysis (route header) | Assessment |
| Clean / Clean view | Original |
| Notes (desktop/accessibility label) | Coaching notes; compact mobile Notes retained |
| Roles | Visual roles |
| Composition overlay | Composition guide; compact mobile Composition retained |
| Watercolor technique | Edges & Texture |
| Recreate this look | Colour-mixing starting points |
| Practice & Studies | Suggested practice |
| Preparing your complete painting analysis… | Analysing your artwork… |
| Live AI feedback could not be prepared. | We couldn't complete the analysis. |
| successful-analysis quota unit (failure copy) | Removed; recovery is “We couldn't prepare reliable feedback. Please try again.” |
| This doesn't appear to be a watercolor painting. | We couldn't assess this as a watercolour artwork… If this is an app screenshot, use the original artwork file or crop out the interface. |
| Preserve the lifting used… | Omitted as unsupported history; no replacement observation invented |

Brand spelling `Watercolor Coach AI`, persisted enums and user-supplied historical titles are not mechanically rewritten. Future model prose is requested in Australian English. Messages do not claim saving before persistence or promise API cost refunds. Conditional screenshot wording avoids asserting a specific reason that the existing general rejection code does not distinguish.

## Focused regression / acceptance matrix

UNVERIFIED means real-image/model acceptance was not executed, regardless of technical tests. Use permitted local originals with independent medium/provenance and crop annotations. The existing 24-case manifest can carry overlapping tags; synthetic fixtures do not replace these cases.

| Case | Engineering evidence / private benchmark slots | Real-image acceptance |
|---|---|---|
| Genuine watercolour | Existing accepted envelope/normalization; C01–C08 | UNVERIFIED |
| Strong watercolour | No forced issue; evidence-dependent Strong fixture; C01–C02 | UNVERIFIED |
| Developing watercolour | Material issue preserves Developing; C03–C04 | UNVERIFIED |
| Work in progress | Explicit prompt eligibility; C03–C04 | UNVERIFIED |
| Abstract watercolour | Style is not a defect; C05 | UNVERIFIED |
| Monochrome watercolour | Explicit prompt eligibility/value separation; C06 | UNVERIFIED |
| Watercolour-style illustration | Explicit medium uncertainty versus style; C07 / independently annotated media cases | UNVERIFIED |
| Ambiguous medium | Existing uncertain envelope and recovery message; C23–C24 | UNVERIFIED |
| Coloured illustration / colouring page | No medium inferred from cartoon style; C21–C22 | UNVERIFIED |
| Photograph | Existing rejected envelope and raw full-scene controls; C17–C20 | UNVERIFIED |
| App screenshot | Raw UI rejection policy; C13–C14 | UNVERIFIED |
| Nested artwork screenshot | Explicit recursive-UI policy; C15–C16 | UNVERIFIED |
| Minor paper/desk borders | Preserve legitimate painting; surrounding-context crop controls C09–C12 | UNVERIFIED |
| Rotated / poorly cropped | Actual adapter EXIF/crop pixels, normalized coordinates and boundary tests; C09–C12 / challenging slots | UNVERIFIED for real artworks |
| Low-detail input | Fixed four-arm configuration and controlled same-byte comparison; challenging slot | UNVERIFIED; no causal detail comparison |
| Complex composition | Existing original-geometry/archetype gates; C08 | UNVERIFIED for artistic correspondence |
| Previously saved critique | Real hook, immutable v1 rendering, source-race, legacy and browser readonly tests | COMPLETE for tested Chromium/technical records; real artistic claims remain UNVERIFIED |

## Human review rubric

For each actual authorized output, record **supported / uncertain / unsupported**, an exact quoted claim and its location in the original prepared image. Do not infer medium/provenance from a cartoon subject, turn “uncertain” into success, or replace image-grounded review with a schema score.

| Dimension | Review question | Existing blind worksheet mapping |
|---|---|---|
| Object/subject accuracy | Are named objects present and correctly placed/related? | B |
| Medium uncertainty | Does evidence support watercolour, or is abstention appropriate? | A |
| Composition accuracy | Do mass, hierarchy, direction and drawn guides correspond to actual relationships? | B |
| Value accuracy | Does an original/grayscale comparison support tonal claims separately from hue? | C |
| Colour accuracy | Are hue, chroma and temperature distinguished and grounded? | C |
| Technique honesty | Are visible effects separate from unknown historical method? | D |
| Quality justification | Do rationale, surviving issues and strengths justify the level without person judgement? | B / E / F |
| Actionability | Is the change specific, proportionate and safe to test on separate paper? | E |
| Repetition | Does each section add a distinct lesson, with shared evidence reused? | F |
| Evidence alignment | Does each marker/crop actually identify the claim's subject and geometry? | B / G |
| Professional language | Is prose complete, calm, precise and understandable? | E / G |
| Teaching usefulness | Does the reader learn why and what to compare, without forced filler? | E / F |

Keep raw originals/outputs, private source paths, ratings and reports outside Git. Use two independent blind reviewers before a model-selection recommendation. A separate approved three-image pilot and the remaining comparison use the existing one-journal, maximum-96-request / prospective-$3 guard. Current official rates/account support and defensible image-family bounds remain prerequisites, not claims verified by this pass.

## Completed validation

| Check | Actual result |
|---|---|
| Node 22.23.4 `node --test tests/*.test.cjs` | **1,716 passed; 0 failed/skipped/cancelled; 39 new tests** over the 1,677-test integrated baseline |
| Frontend `node node_modules/typescript/bin/tsc --noEmit` | PASS |
| Deno 2.5.6 `deno check --config supabase/functions/generate-feedback/deno.json supabase/functions/generate-feedback/index.ts` | PASS; system CA store, no TLS bypass |
| Configured `node scripts/expo-web.cjs build` | PASS, fake public Supabase variables and `/watercolor-coach-ai` base path |
| Unconfigured `node node_modules/expo/bin/cli export --platform web --output-dir /tmp/artistic-quality-unconfigured-final --clear --max-workers 2` | PASS, public variables empty, offline Expo |
| `tests/browser/professional-workspace.cjs` | **170** responsive/aspect/preparation/eligibility/error cases; all four H1/H2 checks and auth/account journey passed; runtime errors **0** |
| `tests/browser/artwork-preparation.cjs` | **39** real-browser technical raster/EXIF/crop checks passed |
| `tests/browser/unconfigured-pages.cjs` | **8** routes passed; zero external requests/runtime errors |
| `tests/browser/model-benchmark.cjs` | **6** original technical fixtures passed; zero provider/network requests and runtime errors |
| `scripts/benchmark/cli.cjs run --dry-run --prepared <external-prepared-fixtures>` | **0** paid requests; 24 planned slots; price unknown/null and live readiness false |
| `node scripts/test-local-database.cjs` | Both existing SQL suites passed in no-network PostgreSQL16; schema run twice; simultaneous independent claims produced one claimed and one busy |
| Diff/security review | 261 tracked/pending files scanned with no key-shaped matches; protected source paths unchanged; no real image assets committed |

Browser scripts used developer Playwright via `NODE_PATH=/opt/codex/cua_node/lib/node_modules` and system Chromium. Auth/Storage/Edge HTTP is mocked in the real exported app; SQL executes in a disposable local database with synthetic accounts, not a live Supabase project. Widths **375/390/430/768/1024/1440/1800** cover portrait, tall vehicle/architecture, landscape, square and wide technical sources. Saved interaction/reopen assertions add zero provider calls/uploads/writes. Source detail, grayscale and mobile/control screenshots were visually inspected; these are deliberately technical shapes, not real artistic validation.

The first new text tests reproduced the defects. An intermediate full run passed 1,708/1,710 with two stale public-copy assertions; both were updated to the new wording while preserving behavior assertions. An intermediate browser run timed out on its old 503-message selector; the final complete rerun passed. No failing/aborted/intermediate run is reported as passing. New regressions also preserve future lifting/negative-painting studies and visible negative shapes, so these safeguards do not prohibit legitimate teaching.

Prompt size changed from **18,824 to 19,963 characters** (+1,139). The 3,000 output-token cap and one-call count are unchanged; this is not a claim of identical billed input tokens or live truncation performance. The benchmark estimates against the current locked prompt. No real paid comparison was executed.

## Changes and commits

- `f3eceee` records the exact focused request.
- `e1827bd` implements the reviewed corrections, updated source lock and regressions.
- The delivery message supplies the final documentation commit and verified remote SHA.

The full changed-file inventory relative to integrated main follows. No unrelated file or artifact is included.

- `README.md`
- `app/_layout.tsx`
- `components/ColourValueAnalysis.tsx`
- `components/PaintingAnalysisWorkspace.tsx`
- `components/PaintingImageSelector.tsx`
- `components/ResultExperience.tsx`
- `components/SaveResultButton.tsx`
- `docs/benchmark/production-lock.json`
- `docs/review/artistic-intelligence-quality-spec.md`
- `docs/review/artistic-intelligence-quality.md`
- `docs/review/artistic-intelligence-validation.json`
- `lib/artworks.ts`
- `lib/teachingEvidence.ts`
- `shared/artworkEligibility.ts`
- `shared/coachingAlignment.ts`
- `shared/coachingAssessment.ts`
- `shared/coachingDisplay.ts`
- `shared/coachingEvidence.ts`
- `shared/coachingWorkspace.ts`
- `supabase/functions/_shared/prompts.ts`
- `supabase/functions/generate-feedback/handler.ts`
- `tests/artistic-quality.test.cjs`
- `tests/artworks.test.cjs`
- `tests/browser/professional-workspace.cjs`
- `tests/edge-runtime.test.cjs`
- `tests/evidence-visual.test.cjs`
- `tests/feedback.test.cjs`
- `tests/final-freeze-assessment.test.cjs`
- `tests/live-colour-evidence-ux.test.cjs`
- `tests/professional-coaching.test.cjs`
- `tests/result-ux.test.cjs`
- `tests/save-button.test.cjs`
- `tests/saved-result-read.test.cjs`

## Validation and closure

The final delivery records exact completed commands/counts and any intermediate failed copy assertions. Automated validation covers Node 22 tests, frontend/strict Edge types, both exports, Chromium responsive/legacy/reference/error journeys, real technical raster preparation, no-network PostgreSQL security checks and free benchmark preparation/dry-run. No native/iOS/Android, Safari/Firefox, screen-reader-device or live Supabase/provider behavior is certified by these technical runs.

Final disposition is **CONDITIONALLY READY** once those commands pass: the reproducible engineering/copy corrections can close; live artistic acceptance remains open and explicitly UNVERIFIED. No confirmed implementation defect is intentionally deferred. No Phase 2, image generation/editing, fake improved artwork or paid probe was added. No merge, deployment or production data/configuration change is authorized or performed.

Owner actions are bounded: review this diff; separately authorize the normal frontend/Edge release when appropriate (prompt improvements affect future analyses only); supply the permitted originals and corresponding original saved-path metadata for the four reported scenarios; separately approve any real provider comparison and complete blind review. No new database migration or secret is required. Do not declare the original nested-screenshot cause or an artistic-quality win without that evidence.
