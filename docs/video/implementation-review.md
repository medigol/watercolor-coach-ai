# Curated video education · implemented review milestone

**Engineering: CONDITIONALLY READY. Editorial: BLOCKED. Production: BLOCKED.** The player/catalogue integration is implemented and tested offline. The intended curated-learning product is **not complete**: no real videos or segments could be verified in this environment.

## Baseline and delivery scope

Branch `codex/curated-watercolour-video-v1` starts at PR #39 head `703996ef1eedac355b76c8d282833390b455ad07`. Verified main was `25ba5298072174541aa2356ecdd7aaa02347565c`, which does not contain that learning head. PR #39 and its branch are not modified. A new Draft PR should target `codex/personalised-watercolour-learning-v1`; it depends on PR #39. GitHub's state/API access returned HTTP403, so that distinction is based on verified Git ancestry, not a fabricated successful PR API response.

## Educational/editorial evidence

[Coverage](coverage.json) maps all **27 actual steps** in the four lessons and eight-step project to existing skill IDs, observable needs, narration requirements, duration ranges and candidate instructor screening. Video is helpful rather than required; intention/reflection steps do not get filler demonstrations. No curriculum or lesson content is rewritten.

[Instructor worksheets](instructors.json) compare the eleven supplied candidates' proposed roles and explicitly leave all fifteen teaching-quality dimensions unknown. Mitchell/Clark foundations continuity, Yi Lin values/atmosphere and a necessary specialist form a **provisional screening plan, not a selected or endorsed group**. English/Persian Javid material, caption access, silent/speed-painting and paid-preview dependencies need direct review.

**Real catalogue: 0 videos. Approved segment table: 0 rows.** No titles, creator/channel identities, durations, publication dates, timestamp boundaries, caption tracks or teaching scores were inferred. The 25–35-candidate and 8–12-approved-video targets were not achieved. See [explicit empty inventory](editorial-candidates.json), [exact access failures](access-evidence-2026-10-28.json), [discovery attempts](instructor-access-2026-10-28.json) and [independent browser failures](browser-access-2026-10-28.json). All attempted external sources were blocked; no proxy bypass or indefinitely pending approval was used.

The [editorial workflow](editorial-workflow.md) defines the 100-point rubric, ≥85 plus no-critical-failure gate, direct-viewing evidence, exact segment inspection, captions, official-source attribution, live embed verification, explicit owner approval and a manual 90-day health review. Current official documentation/policy review remains blocked, not certified.

## Implemented technical behaviour

- Extends the existing media contract in `learning/media.ts` / `videoTypes.ts`; no second player system. Metadata includes independent editorial/availability states, rubric breakdown, evidence method/reviewer/date, caption observations, stable segment IDs, content versions, before/after explanation and controlled practice. Validation rejects unsafe identities/URLs, invalid curriculum references, duplicate/conflicting segments for the same lesson/step, bad absolute times, invented caption states, missing approvals, unreviewed or retired resources. The production catalogue remains empty and is never populated from research files.
- `videoSelection.ts` is an additive deterministic layer. It prioritises current step/objective, appropriate experience, editorial quality, time, style/subject, instructor continuity and **confirmed** caption compatibility when those inputs are supplied. Current caption choices apply only to the open player; no cross-lesson video history is invented. Ties retain curated order. It offers one primary and at most a different approach, accounts for separate viewing/practice/drying time and does not replace the existing learning-path engine.
- Web uses the official IFrame API and privacy-enhanced iframe **only after an intentional load**. Both actual player dimensions stay ≥200px; the old arbitrary 430px restriction is removed. Native/insufficient-space/restricted cases use an attributed external route. No unofficial playback, thumbnails, stream/transcript access, download or tracking service.
- `start` and `end` are absolute seconds. Same-player object-form cueing changes segments; explicit replay uses object-form loading to restore both bounds. It never relies on `seekTo` retaining an endpoint. Provider events alone establish playing/paused state. A 500ms guard pauses out-of-window playback and reports it; it is **not a frame-exact technical lock**, especially with throttled/background browsing. Official controls remain visible and authoritative. Playback never completes a painting step.
- Singleton API loading, bounded readiness/network timeout, one active player, stale-callback guards, unmount/destruction and visibility/page-hide pause protect lifecycle. Route-focus cleanup explicitly unloads retained tab screens: switching to Home cannot leave a live player hidden behind it. Changing responsive layout no longer reparents/destroys the player. Caption reload is explicit; replay/segment changes reuse the instance.
- Iframe URLs allow only the privacy-enhanced YouTube host, a canonical video ID and permitted parameters; exact application origin and strict-origin-when-cross-origin identification are preserved. No learner identity, profile or progress fields are sent by custom code.
- Default captions send neither forcing nor language parameters. An optional preference requests `cc_load_policy`/`cc_lang_pref`; it does not claim a track exists or a translation is accurate. No unsupported caption API or custom transcript. Preferences are temporary to the open card, with no progress/schema/storage changes. External/native playback uses YouTube's settings.
- The existing studio remains action-first. Desktop demonstration sits beside the checklist; mobile expands only on request. Segment choices, rationale, explanation and privacy use disclosure. Replay, full-video attribution and **Return to the painting exercise** are clear; returning closes the player, scrolls to practice and restores checklist focus. All lessons remain usable without media.

## Actual exported UI, synthetic provider evidence

These screenshots are of the actual exported app with an **isolated synthetic catalogue and mocked API**, not real videos or static mockups. The fake player is visibly labelled. No real creator frame is stored or committed.

- [Before intentional loading](screenshots/synthetic-before-loading.png)
- [390px player and return-to-practice](screenshots/synthetic-player-390.png)
- [1440px studio alongside practice](screenshots/synthetic-studio-1440.png)
- [Caption request with unknown tracks](screenshots/synthetic-caption-request.png)
- [Simulated embedding restriction](screenshots/synthetic-embed-restriction.png)
- [Lesson completed without watching, despite an assigned QA resource](screenshots/completed-without-video.png)

The local review archive `/workspace/watercolour-curated-video-review.zip` includes all media/error/segment/replay/reflow screenshots, the full no-watch journey, access records, logs and a browsable index. Execution storage is temporary; download it for retention. Selected rights-safe screenshots and this report remain in Git.

## Executed verification

- **1,957 unit/integration tests pass**, including **84 new media/player/selection/coverage tests**. Existing tests were not weakened; their synthetic fixture was extended to the stricter contract and the old invalid-duration case still exceeds the new fixture duration.
- Frontend TypeScript, strict Edge TypeScript, configured/unconfigured exports and isolated QA export pass. No synthetic catalogue occurs in the production JS bundle. Source-lock verification passes.
- Existing Learn suite: **35 route/width cases plus eight first-viewport checks**, keyboard focus/checkboxes, failed save/recovery, old saved-progress fixture, partial/completed resume and existing product navigation pass. Run again against the assigned QA catalogue: both lesson/project completion remain possible with **zero YouTube requests**.
- Video browser: **seven widths** (320,375,390,430,768,1024,1440). Measured player sizes include 335×200 at 375px and 558×314 at 1440px. A/B cueing, replay absolute endpoints, seek guard, provider errors, unknown-caption messaging, default omission, explicit settings reload, external full-video/return, route cleanup, pre-consent privacy and byte-identical learning progress pass **with the mocked API**.
- Additional 375×600,844×390,1024×600 and390×480 reflow, 200% text-only enlargement, long titles, keyboard focus/return and reduced note viewport pass. This is not physical browser/OS-keyboard, Android/iOS or screen-reader approval.
- Existing assessment **177 cases**, raster preparation **40 cases**, unconfigured routes **15 cases** and real local PostgreSQL16 RLS/storage/quota/idempotency/rollback/concurrency checks pass. No live Supabase service contacted. After the environment restart, one disposable PostgreSQL startup attempt failed with a missing local socket; an unchanged rerun passed all assertions. Both attempt logs are retained.
- Browser testing reproduced alphabetical IDs overriding curated ties and responsive reparenting destroying playback. Source review also corrected alternative-segment prop handling and added a stable return-focus target; interaction regressions now cover both. Counterexamples retain useful segment choices and original exercise progress. A final red/green regression reproduced a late provider event reviving the UI after a fatal error; fatal player errors now remain terminal until an explicit new player load. Both the failing fatal-event record and the later browser reproduction of a player retained behind Home are in the review bundle. The latter is fixed with explicit route-blur pause/unload and checked while the simulated provider reports playing.

[Machine-readable validation, source hashes and exact browser records](validation.json). Reproduce with `npm test`, `npm run typecheck`, the existing Edge/export commands, `node scripts/validate-learning-media.cjs` and the existing browser suites. `node scripts/export-video-fixture.cjs <tmp-output>` creates a separate temporary QA export; run `tests/browser/learning-video.cjs <served-fixture-base> <artifact-dir>` against it. No credentials or fake runtime flags are needed in the real app.

## Live acceptance and remaining gates

| Claim | Evidence status |
| --- | --- |
| Real video identity, public availability, educator quality | UNVERIFIED — access blocked |
| Actual demonstrated technique and exact boundaries | UNVERIFIED — no content viewed |
| Live official embed, real seek/end/replay, fullscreen | UNVERIFIED — API simulation only |
| Actual captions, languages, translations | UNKNOWN |
| URL/API commands, minimum size, error handling, lifecycle | PASS in unit/exported-app synthetic checks |
| Original lesson/checklist/reflection completion without video | PASS in actual exported app with synthetic auth/catalogue |
| Current platform policy/privacy review, instructor/owner approval | BLOCKED / NOT PERFORMED |

No new dependencies, credentials, paid AI, database/backend/schema changes, production writes, altered auth/quota/storage or saved assessments. Curriculum, recommendation engine, learning persistence and production source lock are unchanged. No videos/audio/transcripts/real video frames downloaded or rehosted. Existing original diagrams are reused without private evaluation artwork.

**Owner review request:** review the engineering-only diff/screens first; keep it draft while content access is unavailable. Once real verification is possible, approve the actual instructor group and individually evidenced segments (not today's synthetic fixtures), then separately approve any release after live playback/policy/device review. No merge or deployment is authorised or performed by this milestone.
