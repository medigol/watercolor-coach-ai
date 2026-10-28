# Learn Watercolour · milestone 1

Baseline: remote `main` `25ba5298072174541aa2356ecdd7aaa02347565c` (merge of PR #37), fetched explicitly because this checkout's remote fetch configuration does not update `origin/main` by default. The user reports this Beta merged/deployed. Direct production HTTP returned proxy `403`, so deployed revisions were not independently verified here. Branch: `codex/personalised-watercolour-learning-v1`. Assessment development and Issue #38 remain frozen; no critique modules, provider configuration or benchmark source lock are changed.

## Working product and decisions

- Home → Learn; Home, Learn and My Artworks remain primary tabs. `/practice` redirects to Learn. All Learn routes are inside the existing authenticated tab boundary. The nested `/learn/index.html` export avoids a page/directory collision on GitHub Pages.
- Structured learning needs no questionnaire: water/brush → values → edges → landscape. Personal onboarding has six short stages, editable defaults, optional confidence/format/frequency questions and a review before confirmation. Draft preferences persist independently of the confirmed path.
- Twelve canonical modules and 24 skill outlines describe the full framework honestly. Four authored lessons are available: **Water & brush control**, **Three-value planning**, **Hard, soft & lost edges**, **Observe shapes & perspective**. One eight-step **Quiet landscape** project combines foundations. All other modules are labelled outlines and have no unavailable lesson links. Outline timing/material metadata is unknown rather than fabricated; complete lessons carry the actual teaching metadata.
- Pure TypeScript curriculum, validation, recommendation and progress contracts live in `learning/`; UI and original SVG teaching studies are separate. Every available lesson has objectives, why, materials, explanation, demonstration, actionable steps, controlled variables/constants, comparison, recovery, success cues, reflection, extension and next-step navigation. The studio shows one step at a time, with an optional outline and exercise plan.
- Four original vector style studies compare atmospheric realism, loose urban sketching, botanical observation and expressive/gestural painting. They are explicitly diagrams, not physical paintings or works attributed to a named artist. Primary/secondary styles affect real lesson ordering, observation-study inclusion and subject applications.
- Recommendations use prerequisites, preferences, self-reported readiness, completion and difficulty reflections. They explain each choice, split active practice into realistic sessions and keep drying time separate. A confident-water/weak-perspective urban learner starts with structural observation instead of a forced wash sequence. Advanced learners can choose a project and inspect optional refreshers, with unassessed prerequisites disclosed. No model call, skill score or independently proven competence is implied.
- Lesson opening records nothing automatically. Beginning records a view; checklists record activity; completion requires all steps plus a reflection, difficulty and confidence. An outline jump cannot bypass prior activities. Revisit retains completion. Changing a path never deletes completed studies or notes. Progress distinguishes activity, self-reported completion and confidence; no mastery percentage.

## Persistence and privacy

Existing AsyncStorage on native; explicit browser localStorage on web. The latter deliberately throws on failure instead of using the auth client's memory fallback. Keys are scoped to the authenticated user, `watercolor:learning:v1:<user-id>`. Context lives inside the existing auth provider; account changes gate stale data and pending callbacks. No learner data enters Supabase, image storage, AI requests or analytics.

The versioned local contract validates bounded fields/references and serializes writes. Failed loads preserve the original bytes and block editing. Failed writes visibly report **Not saved** and allow retry. Recovery is an explicit backup-before-reset operation. Future schema versions are rejected safely; unknown content and earlier content-version work are retained without invented routes or automatic completion. Browser reload/app restart can resume the recorded step/checklist/note. Progress is **not synchronised or encrypted**; use a trusted device and do not put sensitive personal information in reflections. Clearing browser/app storage removes local work. Best-effort cross-tab conflict detection rejects a changed snapshot; localStorage is not an atomic distributed store. Future authenticated sync requires a separately reviewed schema and conflict policy, not an implicit migration.

## Media and research boundary

**Zero production video records.** Standard public embedding needs no API key, but current official policy/video verification was blocked by this environment's network proxy; the elevated documentation request was cancelled. The app therefore assigns no guessed IDs, creators, segments or timestamps and makes no YouTube request during normal lessons. Every lesson remains complete with the honest unavailable-resource panel.

The reusable player accepts validated, manually verified catalogue entries, canonical YouTube URLs, creator attribution and bounded timestamps. A user action is required to load an embed; controls and branding are not covered, autoplay is off, there is no downloading/transcript extraction/looping. Native, small-player, unavailable, failed and non-embeddable resources retain an attributed external link. Synthetic tests verify URL/timestamp behavior; no real video playback or current-policy compliance is claimed verified. Before adding real records, inspect the actual demonstration, attribution, language/level, segment, availability and embedding permission, and review:

- https://developers.google.com/youtube/iframe_api_reference
- https://developers.google.com/youtube/player_parameters
- https://developers.google.com/youtube/terms/developer-policies
- https://developers.google.com/youtube/terms/required-minimum-functionality

All authored teaching is original and uses general watercolour/observation principles. No book text, paintings, transcripts or paid-course content is reproduced. The named instructors in the product directive are research leads, **not verified citations, endorsements or reviewers**. Access to publishers/current course sources was unavailable, so no unverified instructor attribution is shipped. External bibliography verification and independent instructor review remain pending; engineering tests do not certify pedagogy or demonstrate learning gains.

## Editorial QA

Each available item was checked internally for a single clear comparison, practical materials, timing, dry-result observation, recovery, transfer and respect for style. Water control separates dilution/load/surface moisture; the edge lesson distinguishes a gradual transition from a lost value relationship; value teaching separates hue/chroma from tone; perspective is a fixed-view observation exercise and does not impose realism. The project permits a deliberate stop rather than automatic extra detail and avoids asserting distant objects are always lighter. Physical materials and environmental variation remain explicit limitations. No learner paintings, external instructor participation or experimental learning improvement is claimed.

## Validation and review artifacts

Results and exact artifact paths are recorded in `personalised-watercolour-learning-v1-validation.json` after execution. Browser fixtures use a synthetic account with all external traffic mocked or rejected; clicking a completion checklist proves the app interaction, not that a learner physically painted. Capture artifacts come from the exported app and original in-app diagrams, not design mockups. Physical Android/iOS and real screen-reader certification remain manual acceptance checks.

Executed results: **1869 unit/integration tests passed**, including **70 new learning tests**, with zero failures/skips/cancellations. Frontend TypeScript, strict Edge TypeScript (Deno2.5.6), configured/unconfigured exports, **35 learning responsive route cases**, **177 existing assessment workspace cases**, **40 image-preparation cases**, **15 unconfigured routes** and the isolated PostgreSQL16 security suites passed. Learning widths:320/375/390/430/768/1024/1440; additional landscape and DPR2 reflow emulation passed. Keyboard focus and Space-key checklists, touch targets, panel non-overlap, local failures/recovery, saved lesson/project resumption and preserving completion after preference changes were exercised. No physical-device, real screen-reader, live video or live production smoke result is claimed.

QA reproduced and corrected a static page/directory collision, mobile stacked-flex panels overlapping reflection controls, a web checkbox lacking normal Space handling, style-only confirmation accidentally accepting unrelated questionnaire drafts, a mismatched project-preview image, and an underestimated session count. The last fix packs whole ordered activities: this 60-active-minute project needs six sessions within a 15-minute budget, not an unrealistic four sessions that require splitting activities. Drying remains additional. Meaningful regressions/counterexamples cover the corrected behavior; no assertion was weakened to hide a failure.

Visual QA captures fifteen actual-app frames (first/returning landing, styles including desktop, onboarding, path, mobile/desktop lesson, project, progress, empty/unavailable/save-error/corrupt-data states and reflow). Screenshots are local review artifacts outside Git, also bundled at `/workspace/learn-watercolour-milestone-1-review.zip`; download them if needed because execution storage is ephemeral. `README`, the validation inventory and the implementation files are the durable Git review material.

Reproduce with existing dependencies:

```sh
npm test
npm run typecheck
npm run typecheck:edge
EXPO_PUBLIC_SUPABASE_URL=https://watercolor-test.supabase.co EXPO_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_browser_test_only EXPO_WEB_BASE_PATH=/watercolor-coach-ai npm run build:web
# Serve dist under /watercolor-coach-ai, with directory index and .html routes.
NODE_PATH=<existing-playwright-install> node tests/browser/learning.cjs <loopback-base-url> <artifact-dir>
```

## Release boundary

No merge, deployment, production SQL, credentials, new package dependencies, paid calls or artwork upload is part of this milestone. Existing assessment/reference contracts, auth, quotas, idempotency, RLS, storage and the one-call architecture are retained. Review and approve the exact PR head before any release. This frontend-only learning milestone needs **no Supabase function or database deployment**. The existing Pages workflow would publish an approved merge; test authenticated deep links, local save/reload/account isolation and existing assessment/gallery routes afterwards. Rollback is the previous reviewed Pages source/artifact; preserve local progress keys rather than deleting them.

Next development: independent instructor/user review of these five complete studies, verified optional demonstrations and a subject-specific next lesson selected from actual learner reflections. Avoid adding a large catalogue before validating the teaching and save/resume experience.
