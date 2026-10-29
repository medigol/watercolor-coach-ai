# Online video preview release · 29 October 2026

The owner authorised this upgrade, both merges and the existing GitHub Pages deployment. PR #39 was merged as `7e48e0f5158d446be923013fd257d79f44515001`; Pages run [40815696473](https://github.com/medigol/watercolor-coach-ai/actions/runs/40815696473) succeeded. The 17-video preview is the remaining PR #40 increment. Merge/deployment outcomes are recorded on that PR, avoiding another code change just to stamp a deployment SHA.

## Delivered behaviour

Learn exposes **Video Library — Preview** at `/learn/videos`, with all 17 supplied identities, four prior owner screenings, 18 explicitly unverified timing proposals/hints and three optional intermediate/advanced Javid resources. Related lesson steps link to this separate research experience. Research title labels are not claimed to be newly verified original titles.

The same official player/controller handles click-to-load playback, proposed windows, replay, caption preferences, errors and navigation cleanup. Explicit original-video mode has no invented endpoint. Approved lesson playback still requires bounded segments by default; `mediaResources` remains empty and all publication checks remain intact. No video completion changes a lesson.

Private corrections and observed boundaries use a separate account-scoped browser key, with explicit save, read/write failure recovery and JSON export. Exports are always unapproved evidence and omit account identity. No raw owner notes, provenance ledger or screening submission is imported into app bundles. No backend, model, quota, database, auth, provider, learner-progress schema/key, dependency or deployment-workflow change.

## Caption-panel investigation

The failing acceptance path combined rapid programmatic scrolling with a panel missing an explicit web expanded-state attribute. The browser harness now waits for the ScrollView responder/layout and provider readiness, then requires the actual panel to open, requests the chosen caption preference and checks the resulting official iframe URL. Assertions were retained. Shared disclosure controls now expose `aria-expanded`. This verifies interaction/parameters, **not actual caption tracks or real playback**.

Two further reproduced presentation/accessibility issues were corrected: provider errors were shown twice, and mobile tab accessible names included decorative icon glyphs. Errors are shown once; explicit Home/Learn/My Artworks tab labels are covered by a meaningful component regression and actual browser navigation. The player was extended narrowly for unbounded original playback, not replaced.

## Validation

[Machine-readable validation](online-preview-validation.json).

| Check | Result |
| --- | --- |
| Full unit/integration suite | 1,995 pass; zero failed/skipped |
| Frontend / strict Edge TypeScript | Pass / pass |
| Configured production / unconfigured web exports | Pass / pass |
| Preview browser scenarios | 14 pass; seven widths; zero runtime errors/unexpected requests |
| Existing learning journey | 35 responsive cases + 8 first-viewport checks pass |
| Saved critique workspace | 177 cases pass; existing geometry and read-only controls preserved |
| Image preparation / unconfigured routes | 40 / 16 pass |
| Isolated PostgreSQL security, quotas and source lock | Pass; no production service writes |
| Production JS audit | All 17 real IDs present; synthetic fixture and raw owner-review markers absent |

Browser/provider and signed-in account tests use controlled fixtures against the actual exported app. No live assessment, paid call, user artwork upload or production database write occurred. Real YouTube acceptance remains with the owner in Chrome; the cloud restriction was not re-probed or bypassed. No external instructor approval, caption availability or real educational accuracy is inferred from technical tests.

## Deployment, owner acceptance and rollback

1. Retarget PR #40 onto the merged `main`, verify the integrated tree, push and merge only after blocking checks pass.
2. Use the unchanged `.github/workflows/deploy-pages.yml` to publish `https://medigol.github.io/watercolor-coach-ai/`; no Supabase deployment is needed because its source is unchanged.
3. Verify the successful workflow revision and live `/learn/videos` HTML/assets. Normal existing sign-in remains required. Owner checks real playback, captions, proposed boundaries and private export in Chrome; these checks do not approve instructional clips automatically.
4. If this frontend increment needs rollback, revert the PR #40 merge with its first parent through normal review and redeploy Pages. Preserve PR #39 and all account/artwork/local-progress data. No database rollback or quota adjustment is required. Do not clear storage to roll back a UI.
