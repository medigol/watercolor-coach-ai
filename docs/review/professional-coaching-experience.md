**Watercolor Coach AI — professional coaching experience review**

Branch: `codex/professional-coaching-experience`. Started from current main `938dc8286969549cb7d433198663a96f25e3c763` (the merged validation reliability hotfix). The final commit SHA is supplied in the handoff. Nothing was merged.

Change size: 43 files including 12 review screenshots; 3076 additions / 278 deletions of text. Screenshots are test evidence, not product assets or reference artwork.

**Validation**

| Check | Result |
| --- | --- |
| Complete Node suite | 642 passed; original 601 retained and 41 new regressions |
| Frontend TypeScript | Passed `npm run typecheck` |
| Edge TypeScript | Passed Deno check with the function's existing configuration |
| Configured web / Pages path | Passed `npm run build:web`, `/watercolor-coach-ai` base path |
| Missing-configuration export | Passed; safe setup screen on six direct routes |
| Browser interaction | Chromium, controlled Supabase responses, no paid/live services |
| Responsive / aspect matrix | 28 cases: 375, 390, 430, 768, 1024, 1440, 1800 × landscape, portrait, square, wide |
| Visual review | Actual upload, pending, results, colour, composition, Notes, Roles and error screenshots inspected |
| Native / live-model calibration | Not performed; production model reliability is not proved by fixtures |

The committed optional browser harness is `tests/browser/professional-workspace.cjs`. It uses Playwright already installed in test infrastructure; no app dependency was added. Run it against a static export built with the fake public configuration documented in README, using its base URL and an artifact directory. Unexpected external endpoints are blocked so the harness cannot submit to a live project. Cloud verification supplied the installed Playwright on `NODE_PATH`. The [browser report](professional-coaching/browser-report.json) records alignment/read-only results and controlled invocation counts.

**Upload**

Previously: image picker, sample painting placeholder, four initial-focus radios, Get feedback.

Now: a private painting upload surface, Choose painting, actual aspect-preserving preview, Choose another image, Analyse painting. No real-flow sample artwork and no focus selector. The action is disabled before selection and during analysis. The image picker is also disabled while pending. Hidden `focus_area` defaults to `Overall feedback`; initial focus does not change the model prompt or canonical truth.

Pending reads “Preparing your complete painting analysis…” and explains structure/colour/value/notes as parts of one request. There are no fake percentages or assertions of precise backend progress. A synchronous ref lock continues to prevent double submission.

**Unified result and design**

The page is **Complete Painting Analysis**. Overall Assessment, What works, an opportunity only when warranted, Composition, Colour & Value, Watercolor technique and Practice & Studies form one continuous result. Four analysis-mode tabs and their duplicate lower navigation are removed. Internal expert views remain saved data ownership, not extra reports or API requests. Legacy Improve results and Create Reference retain their compatible renderer.

Desktop at 1024+ uses a large original artwork on the left and a compact inspector on the right, centred within 1440 pixels. The artwork is sticky while the same result scrolls. At smaller widths, artwork and wrapping 44-pixel overlay controls come first, followed immediately by Overall; secondary domain detail can collapse. Section headings are disclosures, not alternative analysis modes. No separate anchor navigation is needed.

Shared local tokens define paper/surface/text/accent/success/warning/study/role colours, spacing, radii, type, touch size and shadow. Warm paper tones, dark typography, restrained teal, thin borders, compact section dividers and fewer nested cards replace the former repeated-card stack. Web keyboard focus has an explicit outline and reduced motion is respected. A decorative paper texture was not added.

The supplied mockup and Rebelle creative-software reference informed artwork prominence, a compact inspector and calm controls only. Their artwork, layouts, iconography, text and assets were not copied. Browser images are original technical vector fixtures rendered for geometry tests; no uploaded reference illustration was committed.

**Coaching calibration**

- Highly resolved with no clear issue: “No significant correction is needed.” Successful decisions lead; supplied alternatives stay optional.
- Strong with no clear issue: “No major issue detected. Explore optional refinements or studies.” No invented defect.
- Competent: a supplied meaningful opportunity receives “Main opportunity to explore”; it cannot be paired with a blanket no-correction status. Without one, the UI asks the reader to review the observations rather than inventing an improvement.
- Developing with an evidenced clear issue: “Main priority”; the strongest supplied opportunity leads. Lists remain short.

Statuses derive from canonical quality/classifications and supplied action content. A preservation-only optional note is not promoted into a main opportunity. Existing material-harm, role consistency and successful-evidence safeguards remain. Corrective imperatives hidden inside strength lessons/actions are reclassified into studies; What works remains positive observation/why/preservation teaching. There is no skill, profession or identity score. Low-confidence assessment language is restrained; raw confidence scores are not displayed.

The prompt now requests a specific short exercise with task, target, controlled variable, comparison and a success cue. Practice can be empty when unsupported; the validator/schema accept that absence without inventing an exercise. Duplicate strength/practice prose is suppressed. Future study experiments and stylistic alternatives are explicitly labelled, deduplicated, and capped at two. There are no generated study images, wash stages or reconstruction.

**Composition**

The model still supplies an archetype, canonical normalized geometry and teaching relationships. The frontend owns line/curve/polygon/grid style, label density, transparency and deterministic connections. It never consumes arbitrary SVG instructions or guesses geometry from prose. Stored geometry is not mutated.

Supported templates: diagonal, S-curve, L-shape, U-frame, triangle, enclosure, radiating, steelyard, balanced masses, three-spot, rhythm, overlapping masses, cross, rule of thirds, off-centre, mixed, none. Directional paths use only supplied anchors; diagonal has one lead-in with an entry/landing indication. S paths smooth supplied anchor relationships; L/U preserve supported open framing; triangles choose three supported non-collinear points. Cross/radiating/rhythm use restrained supplied directions. Enclosure does not force arrows. Balance/steelyard use supplied masses/counterweights and a subtle relationship axis, with mass/negative-space teaching rather than Entry/Path/Landing. Repetition and enclosed/grouped structures omit irrelevant directional labels. Only rule of thirds gets a thirds grid; off-centre does not. None or weak/malformed geometry remains text only. One distinct secondary structure can be inspected without changing the canonical lock.

Historical composition references informed general composition grammar only. No reference image, traced illustration, text or page design was committed.

**Colour & Value**

The canonical workspace replaces the generic Suggested Palette UI with visible colour structure, strategy, value hierarchy, chroma hierarchy, temperature/depth, a classified technical assessment, and useful recreation starting mixes. Value stays first-class when prose overlaps other fields; duplicate colour paragraphs are suppressed. Older records without this optional analysis show their actual value observations and a concise explanation of the unavailable detail, without invented swatches or mixes.

Swatches are approximate model-derived visible colours returned in the existing call. No local pixel sampling, canvas, CORS workaround or external colour service was added. Each optional colour role reference resolves through the existing canonical role ID; this data cannot redefine the focal/supporting/quiet map. Unsupported competing supporting-area instructions are dropped.

A technical colour issue must link to a canonical `colour_value` clear issue. Unsupported issue claims are omitted. Coherent or unusual/muted palettes are not automatically errors. Style alternatives are labelled separately. Optional colour text rejects process/pigment-certainty and painter-identity claims. Recreation pigments are explicitly possible options; ratios are approximate starting ratios, with brand/paper/strength/water-load caveats and scrap testing. They are never identified as original materials.

**Notes, Roles and practice controls**

One to three curated Notes keep their canonical insight, fact and region ownership. Marker selection opens/selects its note; selecting a note selects its marker. Original-image contextual crops remain display-only. Rounded, lighter selected-region outlines and reduced concentric marks improve clarity. Role areas use restrained translucent fills, thin rounded outlines, compact labels and distinct line patterns. Text explains the canonical areas. Supporting is never automatically Quiet. Low-confidence role regions are omitted by the existing confidence gate. Clean view removes overlays without modifying the image.

**Reliability and interaction proof**

| State | Public behavior |
| --- | --- |
| 422 validation | Explains that a reliable response could not be prepared and failed validation consumes no successful-analysis quota unit |
| 503 service | Requests a retry in a moment; uncertain outcomes still advise checking My Artworks |
| 403 quota | Current analysis limit message |
| 401 auth | Session expired / sign in again |
| 409 busy | Painting already being analysed / check My Artworks |

Internal validation reason codes remain private and the backend's diagnostic/logging architecture is unchanged. No automatic provider retry or mock substitution was added. Manual retry retains the same identity where appropriate. Definite rejection retains existing cleanup rules; uncertain saves retain identity/image, allowing a lost committed response to recover without duplicate result/quota. The browser harness tests rapid clicks, all error states, same-identity recovery, gallery reopen and a Create Reference submission. Existing real Edge/SDK tests verify one actual provider request and one completion RPC per successful analysis, failed validation saving no quota unit, and unchanged authenticated/private storage boundaries. Browser local section/layer/Notes interactions assert zero additional calls, DB writes, uploads or deletes.

One new analysis still uses one provider call and one successful quota unit. Reopening performs ordinary authorized reads/signing, without analysis or quota writes. No live-model calls were made. Automated fixture success cannot establish production-model reliability or calibration across real paintings.

**Contract, model and deployment**

The result remains version 1. Optional `canonicalAnalysis.colourAnalysis` is backward compatible; its malformed data is dropped independently. It includes `visibleColours`, `colourStrategy`, `valueHierarchy`, `chromaHierarchy`, `temperatureRelationship`, `technicalAssessment` and `recreationMixes`. Pigment identity and a second role map are not represented. Empty practice strings are now allowed when no useful task is supported. Facts, role ownership, four internal expert-view references, safe repair behavior and Composition Lock are preserved. Legacy JSON is not migrated or silently reanalysed.

Model: `gpt-4.1-mini`. Previous and new token cap: **3000**. There was no increase or automatic retry. A representative controlled JSON fixture measures 3502 characters without the optional extension and 4702 with it (1182 characters for colour alone); this is not a token measurement or real production response. The prompt requests compact colour content and nullable optional aids. Richer content may use more of the existing budget, so actual per-analysis token usage is not claimed to be unchanged. Viewing colour/sections/overlays adds no model requests or provider charges.

After review/merge, let Pages deploy first, then manually deploy `generate-feedback` through the existing GitHub Actions workflow. Both need the same root `shared/` source. Existing Supabase public repository variables and Edge secrets remain sufficient. No new key, local installation, workflow or database migration is required.

| Infrastructure | Changed? |
| --- | --- |
| SQL / database schema | No |
| Secrets / public environment variables | No |
| Dependencies / lockfile | No |
| Auth / protected-route guards | No (only the result header title changed in the root layout) |
| Storage / owner paths / RLS | No |
| Quota / reservation / idempotency architecture | No |
| GitHub workflows | No |
| Automatic mock fallback | No; remains disabled |

**Deferred and limits**

Local Value check and colour sampling are deferred P1 work; the original image is never modified. Complex history/comparison, added date/grouping UI, animation and deeper image processing are deferred. The gallery's existing dates and separate saved rows remain intact; nothing is overwritten. Upload retry identity is in-memory and does not survive an upload-page reload; check My Artworks after uncertain outcomes. Native testing and paid live-model calibration are unverified. No before/after image generation, painting-stage sequence, exact process reconstruction, artist identification, social/payment/subscription feature or Phase 2 work was added.

**Inspected screenshots**

These show original technical fixtures, not AI-generated painting outputs or reference artwork.

| Screen | Screenshot |
| --- | --- |
| Upload empty | [Open](professional-coaching/upload-empty.png) |
| Upload selected | [Open](professional-coaching/upload-selected.png) |
| Pending | [Open](professional-coaching/loading.png) |
| Highly resolved / desktop | [Open](professional-coaching/highly-resolved-desktop.png) |
| Mobile result | [Open](professional-coaching/highly-resolved-mobile.png) |
| Competent opportunity | [Open](professional-coaching/competent-result.png) |
| Directional composition | [Open](professional-coaching/composition-directional.png) |
| Balanced masses | [Open](professional-coaching/composition-balanced-masses.png) |
| Colour & Value | [Open](professional-coaching/colour-value.png) |
| Notes linking | [Open](professional-coaching/notes.png) |
| Roles | [Open](professional-coaching/roles.png) |
| Safe validation failure | [Open](professional-coaching/error-invalid_core.png) |
