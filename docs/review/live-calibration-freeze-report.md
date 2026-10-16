# Improve Painting live-calibration freeze pass

Implements the final user specification on existing `codex/live-calibration-hotfix`, starting at `07ddb5229969297987a52f0cb670a880ba46c837`. Production baseline: `c8f5a0b4978aab23e61f78585539d2dca59a8906`. The supplied [live findings](live-calibration-hotfix.md) remain unchanged. No branch/PR creation, merge or deployment.

## Evidence, recommendations and consistency

- `shared/coachingAlignment.ts` contains a bounded vocabulary of supplied targets, properties and visible consequences. A placement fact cannot establish compressed shadows, a colour fact cannot establish perspective, and a general focal observation cannot establish a road defect. Supporting target/property/problem must occur in a relevant fact clause, not be assembled from unrelated facts or clauses. Explicit architectural sublocations remain distinct. No facts, geometry, diagnoses or replacement advice are synthesized.
- Directional changes require supplied delta evidence. Neutral soft/crisp/muted/saturated/contrasting/dark observations alone cannot justify softer/sharper/quieter/stronger/darker corrections. Educational variations survive as existing study/alternative classifications only when the supplied action actually compares a controlled variable and the lesson does not assert an unsupported defect. Chroma harm cannot authorize an opposite edge correction merely because both appear in a sentence. Purposeful figure/object studies and valid central-placement alternatives remain available.
- Recommendation de-duplication considers target, property/mechanism and intended effect, including wire softening/simplification to reduce focal competition. More specific valid guidance is selected before duplicate removal; no filler is added. Different wire effects, different subjects and different mechanisms with different purposes remain. What Works also de-duplicates paraphrased teaching while preserving distinct transferable principles and excluding exercises/corrections.
- Ranking considers specificity, supported materiality, existing high-priority evidence and actual mechanism. Painting-level integration, value/hierarchy, recession and large-shape connection generally precede small local details. A generic “Increase contrast” does not win solely because it was labelled clear_issue. Incidental “light pattern” wording in wire detail does not turn it into a major value intervention. Existing quality-dependent recommendation caps remain.
- Road/path/street/centre-line amplification recognizes introduce more, raise, strengthen, boost, enhance, heighten, accentuate, intensify, reinforce, and make stronger/darker/sharper/more saturated. It still requires location, taper/quieter recession and an explicit focal limit. Distant/background amplification retains the same hierarchy constraint; there is no “background must be lighter” formula.
- Suppressed, duplicate, capped or reclassified recommendations do not retain original corrective Notes, markers, selected-note teaching, crop links or colour technical assessments. Canonical visual evidence is filtered by insight ID before UI projection/curation, including legacy idless notes; evidence sources are filtered before crop resolution. A surviving separate study has its own existing classification/copy, not an orphaned corrective marker. No storage or saved JSON is changed.

## Assessment and positioning

- `shared/coachingAssessment.ts` derives display quality/rationale without changing canonical quality, saved version or provider data. Competent/Developing normalize to Strong only with confidence >= .8, positive supplied rationale and successful factual evidence, no original uncertainty/limitation/person judgement, no original clear issue and no supported material limitation. Removing advice or having a low recommendation count is never enough. Strong/Highly resolved are not downgraded to manufacture work.
- Specific rationale limitations must correspond to surviving actionable, evidence-supported guidance for the named property. Perspective cannot be justified by a proportion recommendation; temperature cannot be justified by a chroma-only adjustment. Unsupported clauses are omitted while complete supplied positive explanations remain. No new rationale or recommendation is generated to fill a gap.
- `shared/focalPosition.ts` uses only existing normalized focal-role rectangles and supported composition focalPoint, confidence >= .65. Central means both coordinates within .38–.62; clearly off-centre starts beyond .28–.72 on either axis. The .10 dead band and conflicting supplied geometry yield neutral wording. No anchors, role meanings or archetypes are changed/inferred.
- Contradictory central/off-centre text is neutralized in displayed teaching, Notes and evidence labels. An off-centre archetype label becomes neutral Focal placement when the confident centre disagrees or is uncertain; the contradictory named diagram is suppressed rather than replaced. The original canonical geometry remains intact.
- Reviewed diagonal/S-curve/L/framing/cross/radiating/triangle/balance/thirds/none rules remain. Balance uses Open / quieter space, with no automatic negative-space diagnosis for a structural road/foreground. No new grids or composition formula are introduced.
- Recommendation subtitles use classification-appropriate wording; material issues are not labelled merely “an elevation idea, not a defect”. Layout and routes are unchanged.

## Observable language and colour UX

- Original process/handling assertions are converted to supplied visible effects: soft/diffused colour passages, visible marks, sharper contours only when actually supplied, transparent-looking overlaps, and variation in edge definition. Live loose/controlled/defined/sharper brushwork, soft washes, continued wash use and uneven control phrases are covered. The cleaner does not invent softness, darkness or crispness. Explicit future-practice methods remain allowed; “could” alone does not legitimize reconstructed history.
- Two or more unlocated visible colours now use one shared confidence notice, including mixed located/unlocated results. One missing colour can retain a local note. Located source crops, names, swatches and valid roles remain; missing roles/crops are never fabricated.
- Generic Related passage(s) is removed from Notes headings, metadata, captions and accessibility labels. Semantic labels remain; comparison captions use label · area N. Otherwise neutral Multiple source areas / Source area N is used, with no region identities guessed from order.
- Existing temperature-conflict, complementary-hue, approximate recreation-mix, pigment-identity, paper-white and opaque/gouache safeguards remain. No pigment database or colour-sampling feature was added.
- Prompt changes compactly reinforce factual ownership, directional delta, duplicate teaching, coarse positional consistency and observable effects. Provider schema/graph responsibilities/output fields remain unchanged; model and output budget remain fixed.

## Validation

- Complete suite: **1,112 passed**, **140 new**, zero failures/skips/cancellations, against baseline 972.
- Frontend TypeScript and strict Edge Deno TypeScript: passed.
- Configured `/watercolor-coach-ai` Pages export with fake public test bindings: passed.
- Unconfigured export with both public bindings empty: passed.
- Browser: **104 cases** — existing 83 plus **21 sanitized church/van/boat text cases**, across **375/390/430/768/1024/1440/1800**. Existing portrait/portrait-vehicle/landscape/square/wide technical assets remain original fixtures. Mobile/desktop screenshots were inspected; no user painting or screenshot is committed.
- Eight direct unconfigured routes: safe setup, no external requests/runtime errors.
- Retained browser flows: legacy/gallery reopen, Create Reference, Composition/Notes/Roles/Clean, source/value evidence, errors 401/403/409/422/503, manual retry/dedup/quota and lost-response recovery. Internal diagnostic values do not leak to normal UI.
- Local saved-result view/evidence interactions check unchanged provider, quota, upload/removal/write/read counters. Reopening a saved result may read existing data but never starts analysis or writes/uploads. Aggregate counters also include deliberate upload/error/retry/reference scenarios; those totals are not claimed to be zero.
- Existing Edge-entrypoint/SDK regressions retain one OpenAI call per new attempt, one successful completion/quota unit, none on invalid output, owner checks, idempotent recovery and no automatic retry/mock fallback. Optional metadata and fixed safe reason codes are unchanged.

The 140 new tests comprise 43 alignment/delta/dedup/road cases, 26 assessment cases, 20 position cases, 33 process cases, 13 colour/caption cases and five integrated result-render cases. Older synthetic recommendation fixtures now explicitly supply relevant target/property/consequence facts; no runtime fact synthesis or weakened count/priority assertions were used. Obsolete process-caption expectations were updated to the new observational wording.

## Frozen boundaries

Provider draft/normalizer, contract, handler and entrypoint are unchanged. Model **gpt-4.1-mini**, `max_completion_tokens` **3000**, persisted schema/version **1**, quota accounting, idempotency, dedup, auth, storage, RLS, SQL, secrets, dependencies/lockfile, workflows, Pages/Supabase architecture, Create Reference and saved-result architecture are unchanged. Only the Improve Painting prompt and deterministic coaching/presentation safeguards change. The frontend still uses only the two existing public Supabase bindings. No private keys or user assets were added.

No extra provider call, retry, fallback, image generation/editing, fake before/after, generated object/figure, persistent crop, upload or storage write was introduced. No new mode, major screen, dependency, migration or Phase 2 work.

## Changed files

- Runtime helpers: `shared/coachingAlignment.ts`, `shared/coachingAssessment.ts`, `shared/focalPosition.ts` (new); `shared/coachingCalibration.ts`, `shared/coachingEvidence.ts`, `shared/coachingWorkspace.ts`.
- UI: `components/PaintingAnalysisWorkspace.tsx`, `components/ColourValueAnalysis.tsx`, `components/CoachingOverlay.tsx`, `lib/compositionArchetypes.ts`, `lib/teachingEvidence.ts`.
- Prompt: `supabase/functions/_shared/prompts.ts`.
- New tests: `tests/live-coaching-alignment.test.cjs`, `tests/live-quality-assessment.test.cjs`, `tests/focal-position.test.cjs`, `tests/live-process-language.test.cjs`, `tests/live-colour-evidence-ux.test.cjs`.
- Updated tests/harness: `tests/browser/professional-workspace.cjs`, `tests/coaching-evidence.test.cjs`, `tests/evidence-visual.test.cjs`, `tests/final-coaching-calibration.test.cjs`, `tests/local-coaching-notes.test.cjs`, `tests/master-coaching.test.cjs`, `tests/overlays.test.cjs`, `tests/professional-coaching.test.cjs`, `tests/provider-draft.test.cjs`, `tests/result-ux.test.cjs`.
- Documentation: this report; the supplied specification is unchanged.

## Production freeze gate — pending live acceptance

Controlled fixtures prove regressions and runtime behavior, not live-model artistic judgement or first-attempt reliability on the user's private paintings. Deployment is expressly prohibited in this task, and the same three private painting files/production sessions were not supplied. Therefore **Improve Painting is not declared production-frozen yet**.

After the owner deploys this reviewed checkout through the existing Pages/Edge workflows, repeat the exact church, van and boat paintings. Freeze when each succeeds on its first attempt and all supplied live criteria pass: no duplicate/unsupported/delta-free advice, hierarchy/position/quality/rationale coherence, observational wording, clean colour/caption UX and unchanged call/quota/idempotency behavior. Then stop calibration for this phase. Only a genuine regression/severe new defect should reopen it.

Remaining limitations: conservative English lexical safeguards cannot fully judge meaning or pixels; native-device verification and live Supabase execution remain unverified. No new broad semantic/model system was added to disguise those limits. No merge or deployment was performed.
