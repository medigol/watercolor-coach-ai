**Master coaching and visual teaching review**

This pass starts at `11e6e30e297b680b2037c0cbb37d5b5ad3108a4b` on `codex/professional-coaching-experience`. No branch, PR or merge was created. The final commit SHA is supplied in the handoff. Fetch confirmed the remote branch matched the reviewed head. Remote main already contained merge commit `2a135bb` for PR #23; GitHub's PR API returned Forbidden, so the currently open PR could not be verified. Work remains on the requested branch.

**Validation**

Change size: **33 files, 3083 additions / 136 deletions**, including nine technical-fixture PNGs and one browser-report JSON. Controlled fixtures validate implementation, not the quality of a live model's judgment of a real painting. All review images are original technical SVG fixtures rendered by the harness, including a simple town and a tall vehicle/mountain diagram. No user painting, supplied mockup, artist reference or external artwork is included. The same controlled teaching document is used across aspect fixtures to test geometry, not to claim that a model examined those diagrams.

| Check | Result |
| --- | --- |
| Full Node suite | **768 passed**, zero failed/skipped: 669 existing + 99 new regressions |
| Frontend TypeScript | Passed `npm run typecheck` |
| Edge TypeScript | Passed Deno check with the existing function configuration |
| Configured export | Passed `npm run build:web`, fake public configuration and `/watercolor-coach-ai` base path |
| Unconfigured export | Passed direct Expo web export with both public Supabase values empty |
| Unconfigured direct routes | Eight routes show the setup screen; zero external requests/runtime errors |
| Browser interactions | Passed Chromium harness; controlled Auth/Storage/Edge/results; zero live/paid services |
| Responsive matrix | **70 cases**: 35 layout/overlay + 35 opportunity/value-evidence cases |
| Viewports | 375, 390, 430, 768, 1024, 1440, 1800 |
| Sources | Landscape, tall architectural diagram, square, wide, tall vehicle diagram |
| Interaction safety | Section/Notes/Roles/crop/keyboard interactions create no analysis, quota, upload or write changes |
| Compatibility/reliability | Legacy reopen, Create Reference, 401/403/409/422/503, manual retry, lost-response recovery and dedup pass |
| Visual inspection | Mobile tops, evidence, value, edge comparison, colour, composition, Notes, Roles and future location cue inspected |

The [browser report](master-coaching/browser-report.json) includes both matrices and controlled counters. Its aggregate nine Edge invocations include explicit failed/manual-retry attempts; three successes use three quota units. These totals include uploads for the exercised upload flows, not evidence processing. Every local interaction snapshot remains read-only. No mock RPC is invoked.

The final checks ran against the same production code being committed. The optional browser scripts depend on the preinstalled Playwright/Chromium test infrastructure, not a new package. Example: `NODE_PATH=/opt/codex/cua_node/lib/node_modules node tests/browser/professional-workspace.cjs <served-configured-base-url> <artifact-directory>`. Run `tests/browser/unconfigured-pages.cjs` against a separately served unconfigured export. Exports ran sequentially to avoid sharing Metro build state; browser checks served the completed static files.

**Coaching and prioritisation**

Improve Painting now presents **How to elevate this painting** immediately after What works, using existing canonical insight IDs, referenced facts, lessons and actions. Each recommendation explains What I see, Why it matters and Try in a separate study. No second assessment or recommendation geometry is created. The same selected recommendation is omitted from domain lesson lists and Overall, avoiding repeated instruction.

Highly resolved work may have no recommendations; useful optional refinements are capped at two and remain optional. Strong work may receive a meaningful elevation without a technical defect: an overall priority or existing high-priority evidence can elevate its presentation, while smaller refinements retain Optional wording. Competent and developing work can surface several supplied priorities, capped at three. Technical issues precede refinements; existing explicit priority evidence and canonical ordering break ties. The model is asked to rank by visual impact and consider foundations before detail. The frontend does not invent an impact score or a new classification.

Main and Secondary opportunity identify priority, while a separate caption distinguishes a visible technical issue from an elevation idea. Not every optional refinement becomes Main. Preservation-only notes are not promoted, duplicate lessons are suppressed, and no recommendation is invented when useful evidence is absent. Supporting remains distinct from Quiet. Optional design ideas cannot create equal focal competitors or mutate Composition Lock.

Figure/object additions, removals or moves become future design studies, never technical defects. They require referenced facts and a composition/overall domain for display. The prompt requires purpose, approximate number/position/scale, subordinate value/chroma and a comparison; it never proposes figures by default. Significant changes go on separate paper. A study needs a changed variable and comparison, rather than a repeated Strength; duplicate studies are omitted. Practice explicitly uses a separate study or scrap paper, never the finished painting. Generic preservation of central placement is replaced by a supplied transferable visual relationship when one exists, or omitted.

The prompt treats atmosphere, mood, value compression, chroma recession, edge hierarchy, spatial integration, negative space and mark economy as relevant teaching dimensions without filling categories. Technical defects require visible harm; loose, muted, abstract or unusual choices are judged against the painting's own logic. Quality rationale keeps the reason for the assigned level; appended optional criticism is removed. Strength remains observation/why/preservation, with hidden correction moved out of that classification.

**Original-image evidence**

`EvidenceVisual` renders only the existing signed original-image URI. `lib/teachingEvidence.ts` resolves canonical visualEvidence links first, then explicitly referenced fact/role regions. Prose cannot create a region. Composition and declared global insights use whole-image thumbnails. Missing, malformed, low-confidence, near-whole-image or unreadably tiny geometry falls back to the whole image or text. Explicit uncertain evidence cannot be replaced by a falsely precise role crop.

Local crops use the shared `cropView` projector and normalized coordinates. Context padding varies from 12–25% of the subject dimensions, with the existing absolute minimum margin, bound clamping and readability gates. Clipped layout and offsets show the same source image; no crop asset, encoded derivative, upload, database write or storage entry exists. Two supplied regions can be compared; three explicitly supplied regions can teach depth planes without guessing their identities. Edge comparisons show current edges with no blur or sharpening.

Value evidence displays Original beside Value view, with exactly the same region and transform. Web uses only `grayscale(1)`; brightness, contrast and other values are not altered. Native retains the original and explains that this comparison is available in the web preview. This uses the existing lightweight image renderer, not canvas or an image-processing dependency.

The allocation planner normally shows up to four meaningful visual groups. Identical passages have one owner and other contexts reference it; a requested value comparison upgrades that owner instead of repeating the crop. Notes link to the same teaching evidence and do not repeat its crop and full recommendation. Practice reuses the explanation rather than creating another visual gallery. References open their containing section and scroll to the evidence, with local Notes selection when a linked marker exists.

Visible colour examples reuse a confident local note linked to the same canonical fact/role, otherwise the located canonical role region; approximate model hex colours are small secondary indicators. Missing source evidence is labelled. Colour strategy, Value hierarchy, Chroma hierarchy, Temperature & depth, technical assessment and possible recreation mixes remain readable and separate. No optional region fields were necessary: existing roles/facts/evidence are sufficient, and saved JSON stays version 1 with the identical schema.

Composition has a compact whole-image thumbnail using the existing renderer and canonical overlay. The reviewed archetype-specific teaching semantics remain unchanged: directional Diagonal/S-curve, conditional L, framing U/enclosure, intersecting Cross, converging/diverging Radiating, mass balance, triangle grouping, repetition, thirds and text-only None. Figure studies can show a clearly labelled dashed possible-location cue on the original only when supplied confident next-study geometry exists; no figure is drawn or inserted. Without geometry they stay text-only.

**Language and colour safety**

Process guards reject observed claims about effective watercolor layering, areas of wet blending, controlled glazing and an original glazing sequence. Observable soft transitions, transparent-looking overlaps and selected crisp accents remain valid. Suggested reproduction methods on separate paper remain allowed and explicitly differ from a reconstruction.

Warm/cool alone cannot establish complementarity. Named opposing hue pairs or supplied sufficiently chromatic opposing approximate hues can support complementary/near-complementary wording; unsupported wording becomes ordinary contrast. These are conservative English/hue checks, not independent pixel verification. Simple approximate recreation ratios such as 1:1, 2:1 and 3:1 survive; 70:30, 80:20, percentages and decimal precision are omitted independently. Pigment options cannot claim original identity. The UI explains approximate mixes and testing on scrap.

**Mobile and visual quality**

The original painting is fitted without cropping to 58% of the narrow/tablet viewport height. Its contained-image frame still drives every overlay. Desktop retains the existing large/sticky artwork workspace, with its image height bounded to the available viewport. The route title is the concise Analysis; the page title uses 23px/29px mobile typography. Clean, Notes, Composition and Roles form a stable equal-width 2 × 2 grid below 600px, with descriptive accessible names and 44px targets. Desktop keeps fuller labels.

Role fill opacity and outlines are reduced. Very broad or low-confidence regions are omitted while canonical text stays visible; no role is reassigned. Evidence panels fit narrow columns and use adjacent, compact original/value crops. Existing warm paper, restrained teal, typography, spacing and overall workspace structure are retained. Every image has a descriptive accessible label and accompanying text; value and future-study cues are labelled. Browser keyboard activation of evidence preserves local-only behavior.

**Architecture and infrastructure**

One new analysis remains one provider request. The actual Edge SDK tests inspect the sole `/v1/chat/completions` call, `gpt-4.1-mini`, strict JSON and `max_completion_tokens: 3000`; successful completion uses the existing quota RPC once, invalid results consume no successful quota unit, and retries retain existing dedup/idempotency rules. The browser harness snapshots analysis, quota, RPC, upload and delete counters before/after local interactions and gallery reopen. It blocks unexpected external origins and uses no paid/live services.

No schema change, SQL migration, new environment value, key, dependency or workflow is required. Auth, owner-only storage/RLS, quota architecture, request identities, provider failures and disabled automatic mock fallback are untouched. All four canonical expert views, roles, facts and geometry remain saved in version 1. Legacy and Create Reference use their existing compatible renderer without automatic reanalysis.

After the user reviews and merges through their normal process, deploy Pages, then redeploy `generate-feedback` using the existing manual GitHub Actions workflow. Root `shared/` must be present for both builds. The newer prompt affects only explicitly requested new analyses; reopening saved results needs no model call. No deployment or merge was performed by this pass.

**Deferred and limitations**

Local pixel colour sampling is intentionally deferred: the original crop is the evidence, and adding canvas/CORS processing is unnecessary. A separate fullscreen image interaction, image history and edited comparisons are not added. Native-device behavior and live model coaching calibration remain unverified. Region confidence is model supplied and can be wrong; fallbacks favour less precision. Language safeguards are conservative English heuristics and cannot certify every possible sentence. There is no Phase 2, image generation/editing, inserted object, reconstructed stage, fake corrected painting or before/after simulation.

**Files changed**

| Area | Files |
| --- | --- |
| Route chrome | `app/_layout.tsx` (result title only; auth guards unchanged) |
| UI | `components/PaintingAnalysisWorkspace.tsx`, `components/EvidenceVisual.tsx`, `components/ColourValueAnalysis.tsx`, `components/CoachingOverlay.tsx`, `components/SavedResultState.tsx`, `components/VisualRoleMap.tsx` |
| Pure evidence/roles | `lib/teachingEvidence.ts`, `lib/visualRoles.ts` |
| Shared teaching/safety | `shared/coachingLanguage.ts`, `shared/coachingWorkspace.ts`, `shared/coachingEvidence.ts`, `shared/colourAnalysis.ts`, `shared/paintingAnalysis.ts` |
| Prompt | `supabase/functions/_shared/prompts.ts` (Improve Painting only) |
| Tests | `tests/master-coaching.test.cjs`, `tests/evidence-visual.test.cjs`, `tests/professional-coaching.test.cjs`, `tests/result-ux.test.cjs` |
| Browser harnesses | `tests/browser/professional-workspace.cjs`, `tests/browser/unconfigured-pages.cjs` |
| Documentation | `README.md`, this review, `docs/review/master-coaching/browser-report.json` and nine technical-fixture screenshots below |

| Infrastructure | Changed? |
| --- | --- |
| SQL / schema / RLS | No |
| Secrets / public environment variables | No |
| Dependencies / lockfile | No |
| Auth / protected-route guards | No |
| Storage / uploads / owner paths | No |
| Workflows | No |
| Quota / idempotency / request architecture | No |
| Model / token cap | No: `gpt-4.1-mini` / 3000 |
| Automatic mock fallback | No: remains disabled |
| Canonical JSON schema / version | No: existing version 1 |

**Inspectable screenshots**

| View | Original technical-fixture capture |
| --- | --- |
| Main opportunity / value evidence | [Open](master-coaching/main-opportunity-value-evidence.png) |
| Tall architectural mobile top | [Open](master-coaching/portrait-mobile-top.png) |
| Tall vehicle mobile evidence | [Open](master-coaching/portrait-vehicle-mobile-evidence.png) |
| Two-region edge comparison | [Open](master-coaching/mobile-edge-comparison.png) |
| Future-study location cue | [Open](master-coaching/future-study-location.png) |
| Notes / shared evidence | [Open](master-coaching/notes.png) |
| Restrained canonical Roles | [Open](master-coaching/roles.png) |
| Composition | [Open](master-coaching/composition-directional.png) |
| Colour source evidence | [Open](master-coaching/colour-value.png) |
