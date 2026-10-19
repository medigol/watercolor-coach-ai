# Critique release-candidate completion and evidence

**Verdict: CONDITIONALLY READY.** Repository engineering is complete for the tested Chromium/web scope. Do not formally close the entire feature's cross-platform/artistic release acceptance until the external checks below are signed off. Synthetic fixtures do not prove real artistic quality.

The complete [requirements matrix](critique-requirements-matrix.md) maps **256 original bullets/numbered instructions/narrative paragraphs plus ten recovery instructions**, with source lines, exact source/test files, status and remaining action. Status totals: **200 COMPLETE, 62 PARTIAL, 3 UNVERIFIED, 1 BLOCKED; zero NOT DONE engineering rows**. PARTIAL/UNVERIFIED do not mean passed. [Machine-readable validation](critique-release-validation.json) records the commands and actual results; the [original request](critique-finalisation-spec.md) is preserved.

## Was the interrupted run complete?

**No.** Recovery began on `codex/artwork-critique-release-candidate` at `dc61aaef83bcb8f1e40465d050404a4563fd2b64`, with seven modified tracked files and two untracked SQL-check files. HEAD had no finalisation implementation commits, there was no remote RC branch/tracking configuration, and final frontend/Edge/export/browser validation plus final report/push were unfinished. The last escalated public-documentation command was aborted; its following formatting/TypeScript command had not executed. Earlier focused/SQL logs were retained as history, not substituted for final reruns.

All interrupted edits were preserved and reviewed. One incomplete fix was strengthened: merely refusing a missing cost journal did not reject an empty/truncated existing journal. That gap is now closed and tested.

## Integration reconciliation

- Repository: `medigol/watercolor-coach-ai`; final branch: **`codex/artwork-critique-release-candidate`**. The final documentation commit SHA and verified remote push are provided in the delivery message (a document cannot embed its own commit hash).
- Main was fetched and remains `95549eb44bc93812328d560e4a61ff21abebc47a`.
- Composition/critique `9552c2f62a2dbb9f1b1e6c6918488c3fafd4906d` is an ancestor of main and this RC; main includes its PR #18/#20 integrations and subsequent canonical/coaching refinements.
- Benchmark `dc61aaef83bcb8f1e40465d050404a4563fd2b64` is the RC base. Its six specification/implementation/report commits above main are retained in this RC. The original benchmark branch is not modified.
- All **33 existing remote branch heads** were checked against this RC: every object was available and every head was an ancestor. No completed remote branch work was missing.
- `git log HEAD..origin/codex/image-local-composition-coaching` and the corresponding benchmark range are empty. No referenced completed work was missing; no cherry-pick, merge or conflict resolution was necessary. No completed feature was omitted or replaced. Later canonical v1/provider-draft architecture remains authoritative.

## Confirmed issue inventory and fixes

| ID | Severity | Confirmed defect | Fix and regression evidence | Final state |
|---|---|---|---|---|
| RC-01 | P1 | Losing/resetting a local benchmark journal could reset the request count/cost ledger and repeat paid slots | `scripts/benchmark/runner.cjs`: refuse missing/unbound journals; fsync a separate full-journal digest checkpoint after each reservation/result and verify before resume. The request is sent only after its reservation/checkpoint. `report.cjs` rejects inconsistent accounting. `tests/model-benchmark.test.cjs`: missing, empty, valid-prefix truncation, edited cost, missing checkpoint, unbound journal; pilot/full limit and unknown-billing tests retained | Fixed; no additional mocked call on corrupt resume |
| RC-02 | P2 | An encoder finishing after web source disposal created another private Blob URL, leaving an orphan after navigation/replacement | `lib/prepareArtwork.ts`: mark disposal, reject new exports and recheck after asynchronous encoding/byte read before allocating a URL. `tests/artwork-preparation.test.cjs` explicitly holds the encoder, disposes, then resolves it; also tests export after disposal | Fixed; only initial source URI exists and is revoked |
| RC-03 | P2 | Main critique/assessment/strength/recommendation titles lacked screen-reader heading semantics | `components/PaintingAnalysisWorkspace.tsx`: native header role and web H1/H2 levels, without visual/layout redesign. `tests/browser/professional-workspace.cjs`: exact main/assessment/What works/recommendations heading assertions in real rendered Chromium | Fixed in tested web scope; native/assistive-technology acceptance remains unverified |
| RC-04 | P2 | Shared muted text failed normal-text AA contrast on page and assessment surfaces (4.4489:1 and 4.3428:1) | `components/theme.ts`: darken muted grey-teal from `#617473` to `#5C6F6D`. `tests/accessibility.test.cjs`: four muted/surface pairs plus main-text and primary-button pairs require at least 4.5:1 | Fixed; six independent luminance/contrast assertions pass |

P0 defects found: **none**. Remaining **confirmed** P0/P1/P2 defects: **none in the tested repository/web scope**. This is not a claim about untested deployments/devices or real model accuracy.

A separate test synchronization issue was reproduced twice: immediate resize measurements could race React Native's stacked-to-column breakpoint, and a bounds-only wait could pass on the old stacked layout before the column update. The browser harness now waits for the expected breakpoint first, then up to ten seconds for the same evidence bounds/size predicates; it repeats the original strict measurements. Persistent overflow still fails. The synchronized complete rerun passed; production layout code was not changed. The final contrast calculation also reproduced failing muted-text pairs, fixed by RC-04 before repeating validation. Initial failing reproductions and intermediate failures are disclosed; they are not counted as passing checks. An added assessment-heading assertion initially targeted the uppercase caption instead of the actual H2 quality heading; the selector was corrected to the existing intended heading and all four heading checks rerun.

## Implementation commits and changed files

- `2f17e5d` — crop lifecycle fix, critique heading semantics, source-lock update and browser/image regressions.
- `c14a2d8` — durable benchmark accounting integrity and regressions/documentation.
- `aaf6bb0` — repeatable isolated PostgreSQL security/quota/concurrency execution.
- `fbcff0c` — minimally darker normal text and six contrast regressions.
- `e689003` — bounded breakpoint synchronization and assertions for all four restored critique headings.
- Final documentation commit — source request, full traceability, validation record, report and README pointers.

Full RC-specific file inventory relative to the recovered benchmark head:

- `components/PaintingAnalysisWorkspace.tsx`
- `components/theme.ts`
- `tests/accessibility.test.cjs`
- `lib/prepareArtwork.ts`
- `scripts/benchmark/runner.cjs`
- `scripts/benchmark/report.cjs`
- `docs/benchmark/production-lock.json`
- `docs/benchmark/README.md`
- `tests/artwork-preparation.test.cjs`
- `tests/model-benchmark.test.cjs`
- `tests/browser/professional-workspace.cjs`
- `scripts/test-local-database.cjs`
- `tests/helpers/local-supabase.sql`
- `README.md`
- `docs/review/critique-finalisation-spec.md`
- `docs/review/critique-requirements-matrix.md`
- `docs/review/critique-release-validation.json`
- `docs/review/critique-release-candidate.md`

The integrated benchmark contributes these **19 files relative to main** (five also receive RC fixes above; the full candidate has 32 distinct changed files):

- `.gitignore`
- `docs/benchmark/README.md`
- `docs/benchmark/compatibility.md`
- `docs/benchmark/implementation-report.md`
- `docs/benchmark/manifest.example.json`
- `docs/benchmark/production-lock.json`
- `docs/benchmark/rates.example.json`
- `docs/review/model-vision-benchmark.md`
- `scripts/benchmark/cli.cjs`
- `scripts/benchmark/manifest.cjs`
- `scripts/benchmark/models.cjs`
- `scripts/benchmark/prepare.cjs`
- `scripts/benchmark/production.cjs`
- `scripts/benchmark/report.cjs`
- `scripts/benchmark/runner.cjs`
- `scripts/benchmark/safety.cjs`
- `scripts/benchmark/schema.cjs`
- `tests/browser/model-benchmark.cjs`
- `tests/model-benchmark.test.cjs`

The benchmark implementation history remains in `docs/benchmark/implementation-report.md`; it is integrated by ancestry, not duplicated. No unrelated work was discarded. No temporary logs, screenshots or artwork are committed.

## Actual validation

| Command/check | Result |
|---|---|
| `npm test` | **1,677 passed, 0 failed, 0 skipped, 0 cancelled, 0 todo**; fourteen new regressions beyond independently rerun 1,663-test baseline |
| `node --test tests/artwork-preparation.test.cjs tests/model-benchmark.test.cjs` | **120 passed**, zero failed/skipped/cancelled |
| `node --test tests/accessibility.test.cjs` | **Six contrast tests passed**; affected pre-fix failures reproduced |
| `npm run typecheck` | Passed |
| Strict Edge Deno check | Passed; Deno 2.5.4 with repository config/lockfile and system CA store |
| Configured `npm run build:web` | Passed using fake public Supabase variables and `/watercolor-coach-ai` base path |
| Unconfigured `npx expo export --platform web --output-dir /tmp/rc-unconfigured-final --clear --max-workers 2` | Passed with both public variables empty and offline Expo |
| `NODE_PATH=/opt/codex/cua_node/lib/node_modules node tests/browser/professional-workspace.cjs <internal-base> /tmp/rc-workspace-release` | **170 matrix/error cases**, existing upload-error/retry check, added four H1/H2 assertions and added full auth/account journey passed; runtime errors **0** |
| Same tooling, `tests/browser/artwork-preparation.cjs` | **39 real raster/browser cases** passed; runtime errors **0** |
| Same tooling, `tests/browser/unconfigured-pages.cjs` | **Eight routes** passed; external requests/runtime errors **0/0** |
| Same tooling, `tests/browser/model-benchmark.cjs` | **Six original technical fixtures**, zero provider/network requests and runtime errors |
| `node scripts/benchmark/cli.cjs run --dry-run --prepared <external-technical-fixtures>` | **0 paid requests**, 24 planned slots for six fixtures; pricing unknown, projected price null, live readiness false |
| `node scripts/test-local-database.cjs` | **Both existing SQL suites** executed in real PostgreSQL 16, schema run twice, two independent simultaneous claims yielded exactly one `claimed` and one `busy` |
| Source/secret/diff review | No key-shaped matches in 257 tracked/pending files at final scan time; public-key guards pass; no changed model/prompt/schema/auth/quota/storage/RLS/workflow/dependency source |

The strict Edge command was:

```bash
DENO_DIR=/tmp/watercolor-deno-cache DENO_TLS_CA_STORE=system \
  npm exec --yes --cache /tmp/npm-cache --package deno@2.5.4 -- \
  deno check --config supabase/functions/generate-feedback/deno.json \
  supabase/functions/generate-feedback/index.ts
```

No TLS bypass. Node 24.19.0/npm 11.9.0 and system Chromium were used. The CI's Node 22/Deno 2.5.6 environment was not itself executed; workflows were not changed. No silent skip is recorded as a pass.

Browser widths: **375, 390, 430, 768, 1024, 1440, 1800**, with portrait, landscape, square, wide and tall technical sources. The layout, source crops, composition, original/grayscale evidence and mobile/desktop screenshots were inspected. Existing overlay alignment, labels, confidence gates, no orphan evidence, no fake before/after, no overflow and touch target assertions remain intact. Keyboard activation/focus outline and exact heading roles pass. This is not a complete WCAG audit or native screen-reader test.

Real browser journeys use the actual exported app and installed Supabase SDK, with Auth/REST/Storage/Edge **HTTP boundaries mocked**. Executed journeys: sign-in; image choose/preflight/crop/confirm/reset; upload failure; disabled/double submission/loading; successful structured critique; Clean/Notes/Composition/Roles; evidence/colour/value interaction; legacy reopen; gallery select; refresh; Create Reference; same-ID retry and lost-response recovery; 401/403/409/422/503 and semantic rejection states; account/sign-out; protected result URL while signed out; sign-up confirmation-message flow; sign-in and saved-art reopen after account flow. Saved interactions/reopen add **zero provider calls/uploads/writes**, while normal reads remain allowed. Sign-up tests do not deliver real email.

The database run is a no-network/no-published-port disposable Docker container, using the already cached `postgres:16` image and synthetic accounts. `tests/helpers/local-supabase.sql` is a minimal SQL compatibility bootstrap, **not a migration** or a full Supabase installation. Real application RLS/functions, restrictive guards against broad legacy policies, ownership/FKs, server privileges, successful quota accounting, rollback, idempotency and competing claims execute in PostgreSQL. Auth HTTP/JWT issuance, Storage HTTP/signed-URL expiry and deployed project policies remain **UNVERIFIED**. The owned container is removed afterward; no production database or credential is read or modified.

## Security and architectural boundaries

Production remains **gpt-4.1-mini**, `detail:low`, temperature **0.3**, **3,000** completion-token cap, persisted **version 1**, one provider call per new attempt, no automatic retry/repair/provider fallback and no automatic mock replacement on live failure. Saved controls/reopen use no provider call. Canonical/provider-draft architecture, prompt, strict schema, server deterministic IDs, auth, quota, RLS, Storage, SQL schema, secrets, dependencies, workflows and Create Reference logic are unchanged. Only the disposed web-image lifecycle, heading semantics and required muted-text contrast correction alter production client behavior.

The benchmark source lock was intentionally refreshed only for the audited `lib/prepareArtwork.ts` lifecycle change. Prompt/schema/user-instruction hashes remain identical. Its four arms, $3 prospective guard, 96 total slots, approval flags, privacy and no-retry policy remain. A digest detects accidental accounting loss/modification; it is not protection against a deliberate local operator editing both files, nor an OpenAI account-level billing cap. Unknown usage/prices and in-flight billing remain documented limitations. Old journals without checkpoints require local audit; no silent migration/reset occurs.

All real provider tests were mocked. No paid call, availability probe, external artwork transmission, production data operation, PR, merge or deployment occurred. No image generation/editing, new feature, course, social/YouTube integration or Phase 2 work was added.

## External blockers and exact owner actions

1. **Live artistic acceptance — outstanding/UNVERIFIED.** No auditable representative real-artwork bytes plus corresponding real provider outputs and independent ratings were supplied. Earlier text claims or historical user live observations are not a reproducible acceptance dataset. No such evaluation was performed here. Provide permitted local originals and review actual objects/placement, roles, value/colour, truthful visible effects, actionable teaching, duplicate/fault suppression and useful studies. Do not infer model quality from technical fixtures.
2. **Supply the exact 24-case set** in `docs/benchmark/manifest.example.json`: eight clear watercolors (two strong, two developing/WIP, two abstract/monochrome, two hyperrealistic/complex); four photos of real watercolor with paper/sketchbook/desk/frame surroundings; four raw UI screenshots (two small thumbnails, two plausible rectangular works); four ordinary photos (landscape, building, person/animal, road/scene); two other-media/collage/reproduction cases; two low-light/rotated/large-border/ambiguous cases. Each needs non-identifying provenance/permission, original/prepared ground truth, ambiguity/abstention annotation and an independently annotated oriented normalized ROI where meaningful. No real dataset is invented from the six technical fixtures.
3. **Official docs, rates and account compatibility — UNVERIFIED.** Public model/pricing/vision documentation was proxy-blocked (403); the interrupted escalated retry did not complete. Exact model identifiers exist in the earlier official API-spec record, but that does not prove present account access or per-family detail/pricing. Verify official sources and complete the fresh external rate/support card, including defensible model/detail image-token bounds. A key, explicit permission and separately approved `--live --confirm-cost` are required for a 3-image pilot and later full run. Follow `docs/benchmark/README.md`; keep the same journal (12 pilot plus at most 84 additional slots), and obtain two independent blind assessments per important output. No candidate winner is established.
4. **Staging Supabase acceptance — UNVERIFIED.** On a disposable configured project, manually verify sign-up/email confirmation/sign-in/out, token refresh/expiry, two-user ownership, private images and signed-URL expiry, saved result refresh and successful-only quota/idempotency. Existing setup instructions apply; no new migration is required by this RC. Do not test by resetting production counters or changing production policy/data.
5. **Device/browser/accessibility acceptance — UNVERIFIED.** If native platforms are in release scope, check actual iOS/Android SDK-54-compatible picker permissions, EXIF/crop pixels, memory limits, orientation, alpha/colour appearance and VoiceOver/TalkBack. Check Safari/Firefox and assistive-technology reading order/heading navigation; only Chromium was rendered here. Basic theme contrast/keyboard/targets were inspected, not full WCAG certified.

There are **no known remaining implementation P0/P1/P2 defects in tested scope**. The items above are external acceptance blockers/unverified dimensions, not fabricated engineering defects or an open-ended feature roadmap. Further work should respond to a reproducible failure or actual image-grounded evidence.

**Engineering closure:** the repository engineering phase **can be closed for the declared tested web scope**: feasible confirmed defects are fixed and automated web/security checks pass. **Formal closure of the full feature/release acceptance is not yet justified** while the matrix still contains external PARTIAL/BLOCKED/UNVERIFIED requirements. The owner can close it after recording those acceptance checks; until then use **CONDITIONALLY READY**, not an unconditional production-quality claim.
