# Provider reliability and studio coaching review

Existing branch: `codex/provider-contract-reliability`.
Production baseline: `50b72031bc9831cc98148020c7641327ec073494`.

The provider now returns an internal domain-grouped artistic draft. The server builds the saved canonical v1 graph. No migration, new route, product redesign, extra model call or automatic retry is introduced. This addresses redundant-metadata failure classes directly; production first-attempt reliability and coaching quality still require live paid-model confirmation after deployment.

## Provider and server responsibilities

| Responsibility          | Previous provider response                                         | Current implementation                                                                                              |
| ----------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------- |
| Artistic interpretation | Model                                                              | Model: visible facts, quality, classifications, lessons, practical actions, optional located evidence               |
| Fact/insight domains    | Repeated strings and cross-view references                         | Inferred from `overall`, `composition`, `colourValue`, `technique` block location                                   |
| IDs                     | Model-generated global fact/insight/role/note IDs                  | Deterministic server ordinal IDs, e.g. `fact_colour_value_1`, `insight_technique_1`, `role_1`, `note_overall_1`     |
| Required fact links     | Arbitrary global string IDs                                        | Local zero-based `factRefs`; server maps to generated IDs                                                           |
| Role links              | Global string IDs                                                  | Optional numeric `roleIndex`; unresolved optional links become null                                                 |
| Expert views            | Model supplies summary/view membership graph                       | Server generates same-domain summaries, unique references and bounded view lists                                    |
| Visual notes            | Model supplies duplicated metadata and percent/normalized geometry | Local insight index, label, supplied normalized rectangles, confidence, timing; server derives compatibility fields |
| Saved/public schema     | `PaintingAnalysisResult` v1                                        | **Unchanged v1**; no provider-draft fields persist                                                                  |

`shared/providerPaintingAnalysis.ts` is pure code with no I/O, random IDs, prose hashing, image operations or provider calls. The provider Structured Output schema uses closed objects and `$defs` for reused fact/insight/composition definitions. Root `expertViews`, `summaryId`, `insightIds`, `factIds`, `roleId`, `insightId`, arbitrary IDs and repeated domain fields are absent from the draft contract. Existing canonical server responses and old saved results remain supported for compatibility; the production request uses the draft schema.

Each block supplies 1–2 facts and compact insights, with at most eight canonical facts/twelve insights overall. Required indexes must reference supplied local facts. Invalid required indexes remain fatal; duplicate indexes are de-duplicated. The server copies useful supplied prose, generates IDs/domains, chooses an evidenced clear issue/refinement ahead of strength/study for a summary, preserves useful within-view order, and caps overall at two references and other views at three. Empty/null/invalid optional practice becomes an empty string. No artistic completion is invented.

## Optional data and remaining failures

Compatible same-area role aliases share a retained supplied role ID; valid geometry and explicit confidence decide the reliable instance. Equal-confidence disputed geometry becomes null while the shared role text can remain. Same-area conflicting meanings or multiple distinct focal candidates are omitted with their optional references rather than arbitrarily demoted/relabelled. Supporting never becomes quiet. Low/unknown-confidence and malformed role rectangles are omitted.

Malformed visual aids, optional local insight/role links, colour aids, brush plans and secondary/primary overlay geometry do not invalidate useful core text. Global topics do not receive invented geometry: absent/empty aid regions are dropped, and global facts retain null role references for whole-image evidence. Supplied rectangles are converted only into the existing note format; no region is inferred from prose. At most three notes survive, with supplied clear issues/refinements ahead of strength aids. Canonical validation still runs before the unchanged save transaction.

HTTP 422 remains for unusable core text, missing/empty required domain content, malformed core structure, unrecoverable required fact indexes and an essential interpretation that cannot be supplied without inventing prose. Invalid JSON completion content is a core 422. A refused/truncated/incomplete provider completion or transport/envelope failure remains a safe 503. No failure saves a sample or successful quota unit.

422 JSON adds a fixed `reason_code`: `core_text`, `missing_domain`, `provider_structure`, `unrecoverable_reference`, `unrecoverable_roles`, `empty_analysis`, or `unknown`. The enum is mapped from fixed diagnostics, never from arbitrary model/user strings. Existing user-facing copy stays generic; the browser checks that diagnostic keys/values do not appear in normal UI. No image, prompt, user ID/email or credential is returned/logged.

Completion logs contain only `provider_finish:stop`, `provider_finish:length`, or `provider_finish:other` (unknown finish values are collapsed). Length remains a failure, not a retry or token-budget adjustment. Synthetic tests cover length; no live evidence of frequent truncation was captured in this task.

## Studio coaching

- Highly resolved: zero recommendations is valid, at most two useful subtleties. Strong: zero clear issues is valid, at most two sophisticated elevation items. Competent/developing: surface supplied material/foundational opportunities, capped at three in presentation. Prompt self-check asks whether quality and classifications agree; if only strengths/subtle refinements are justified, reconsider Strong. There is no count-based frontend quality reassignment or forced invented criticism.
- Major guidance combines WHAT/WHERE in referenced visible facts, WHY/EFFECT in the lesson, and approximate HOW MUCH/HOW TO TEST in the action. The prompt prioritises value/focal hierarchy, composition/weight, drawing/perspective, spatial recession, colour/chroma, edges and restrained detail according to actual visual impact. Specific relationships outrank generic positioning/contrast advice.
- Add/remove/quiet/connect/group/simplify/clarify guidance remains eligible. Significant structural changes belong on separate paper. Existing study-variable/comparison and What works/exercise separation remain; supplied exercises never become preservation advice.
- A boat-like technical fixture tests supplied spatial integration of horizontal value bands. Van-like existing regressions retain background/focal hierarchy above generic contrast or off-centre placement. Architectural figure studies remain allowed for supplied human-scale/flow purpose, approximate size/location and subordinate contrast. These are test scenarios/questions, not hard-coded diagnoses of user paintings.
- Generic decorative figure additions are suppressed in Study, Notes, overall summary and domain prose. Purposeful additions stay future-study suggestions; existing location cues never draw a person/object.
- Central placement is not a defect by itself. Combined “preserve colour intensity and central placement” retains only the supplied transferable principle. Positive central relationships remain legitimate when supported.
- Object “anatomical inaccuracies” becomes drawing terminology; real human/animal anatomy remains allowed. Supplied actionable perspective advice stays in elevation rather than a duplicated appended rationale criticism. Rationale retains complete supplied sentences, at most two, omitting trailing fragments instead of inventing a completion.
- Observable language removes/normalizes the reported process-history assertions. Soft passages/overlaps/edges are visible effects; original wash sequence, moisture and handling are not reconstructed. Suggested wet-on-wet/layering studies remain allowed. Known malformed technique fragments are omitted; another valid supplied fact/insight can keep that domain usable.

These are bounded English safeguards and model instructions, not an independent image-quality or semantic oracle. A live response can still be poorly calibrated. The server does not manufacture a recommendation or change an artistic quality judgement to pass a count test.

## Colour and visual presentation

Correct colour-to-source labels, crop context, grayscale comparisons, Composition thumbnails, Notes/Roles, normalized alignment, bounded mobile artwork height and 2×2 44px controls remain intact. Source evidence is still the original URI, with no crop files, uploads, edits, simulated improvements or new geometry system.

When some colours have located evidence, their own labelled crops remain and missing colours use individual neutral confidence copy. When none have located evidence, names/swatches remain compact with one shared “Source regions were not located confidently for these colours.” note. There is no repeated per-colour missing-evidence paragraph.

Existing complementary guard, transparent-watercolor white exclusion (unless an explicit opaque/gouache variation), approximate 1:1/2:1/3:1 ratios and no original-pigment certainty remain. No local colour sampling or generated study images were added.

## Size observations (technical fixture, not a token/cost benchmark)

Canonical response schema: 14,254 serialized bytes; provider schema: 11,285 (**20.8% smaller**).
Provider draft: 4,221 bytes versus approximately 5.2 KB for its equivalent normalized saved v1 document (**about 19% smaller**). Provider prompt: 11,740 characters versus 13,120 at baseline (**10.5% shorter**). These do not measure live token usage, latency, cost, first-attempt success rate or coaching quality.

## Validation

- Complete suite: **924 passed, 96 new, zero failures/skipped**, against baseline 828.
- Frontend TypeScript and strict Edge Function Deno TypeScript: passed.
- Configured Pages export at `/watercolor-coach-ai`: passed with fake public test bindings.
- Missing-configuration export: passed. All eight direct Pages routes show safe setup behaviour, with zero external requests/runtime errors.
- Browser matrix covers widths 375/390/430/768/1024/1440/1800 across original technical landscape, portrait, square, wide and portrait-vehicle fixtures. Two 35-case matrices preserve geometry/read-only evidence; four calibration cases preserve colour/process/context; two additional 390/1440 cases reopen actual server-normalized v1 results and exercise Composition/Notes/Roles without calls/writes. An all-missing colour check verifies one shared note.
- Existing cases retain Improve Painting, Create Reference, old saved JSON, gallery reopen, manual retry/dedup/quota, 401/403/409/422/503, lost-response recovery and no mock fallback. Real Edge entrypoint tests use the installed Supabase SDK with controlled outbound HTTP. No live database/paid API is used.
- All **76 matrix/calibration cases** and the shared-colour-note assertion passed with zero runtime errors. Mobile/desktop screenshots of server-normalized results were visually inspected. Every local interaction preserves call/quota/upload/write accounting; aggregate test counters also include deliberate upload/error/retry/reference scenarios.

Actual entrypoint regressions verify one `/v1/chat/completions` request per new attempt, one successful `complete_openai_feedback` RPC, no completion/mock save on core failure, and idempotent existing-result recovery without another paid call/completion. Normalization/evidence interactions add no provider calls, uploads or writes. Existing owner checks/reservation/release/transactional quota paths remain in place.

## Infrastructure and deployment

Model: **gpt-4.1-mini**. `max_completion_tokens`: **3000**. Vision detail/deadlines unchanged. Persisted result version: **1**; only the INTERNAL provider draft changes. SQL, secrets, auth, storage, RLS, dependencies/lockfile, GitHub workflows, quota architecture and mock-fallback behaviour: **unchanged**. Client bindings remain only the two existing Expo public Supabase variables; OpenAI/admin credentials stay server-side.

After owner review/merge, use the existing Pages workflow and manual **Deploy Supabase Edge Function** workflow to deploy the full checkout, including root `shared/`. The function must be redeployed for the draft schema/normalizer/prompt to take effect. No schema run, secret/variable changes or new dependency setup is needed. This task does not merge, deploy, create another PR or create another remote branch.

Deferred: live paid-model first-attempt/calibration confirmation, native-device verification and live database execution. Local colour sampling remains deferred. No Phase 2, image generation/editing, generated figures or fake before/after.

## Changed files

- Provider/server: `shared/providerPaintingAnalysis.ts` (new), `supabase/functions/_shared/contract.ts`, `supabase/functions/_shared/prompts.ts`, `supabase/functions/generate-feedback/handler.ts`, `supabase/functions/generate-feedback/index.ts`.
- Coaching/presentation: `shared/coachingEvidence.ts`, `shared/coachingLanguage.ts`, `shared/coachingWorkspace.ts`, `shared/paintingAnalysis.ts`, `components/PaintingAnalysisWorkspace.tsx`, `components/ColourValueAnalysis.tsx`.
- Tests: `tests/provider-draft.test.cjs` and `tests/helpers/provider-draft-fixture.cjs` (new), `tests/edge-runtime.test.cjs`, `tests/coaching-decision.test.cjs`, `tests/result-ux.test.cjs`, `tests/browser/professional-workspace.cjs`.
- Documentation: `README.md`, this report. No user artwork, screenshots, external composition references or mockup assets are added.
