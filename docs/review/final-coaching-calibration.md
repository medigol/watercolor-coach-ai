# Final coaching calibration — implementation and validation

Implements [the specification](final-coaching-calibration-spec.md) on the existing `codex/final-coaching-calibration` branch, based on `57510fda298ba551ad41cbbcf6cee507026b129e`. No new remote branch/PR, merge, deployment, or Phase 2 work.

## Safeguards

- **Depth:** `shared/coachingCalibration.ts` omits generic distant/mountain darkness, contrast, sharpness or chroma increases intended to create recession when the proposed change has no explicit focal/foreground limit. Current background subordination alone is not permission to increase it indefinitely. Qualified compressed/subordinate studies, selective softening and dark background silhouettes remain valid. This is a hierarchy guard, not a rule that backgrounds must be lighter. Clauses about a focal subject *against* a mountain do not automatically become mountain interventions.
- **Lead-in:** amplified road/path/centre-line recommendations require supplied foreground/near localisation, taper/quieter recession and a focal contrast limit before promotion. Generic road strengthening is omitted rather than replaced with invented advice.
- **Diversity:** lessons and actions together identify wording duplicates. Same-target/same-effect focal intensification is also de-duplicated across darker-value/sharper-edge wording. Distinct targets or genuinely different supplied effects remain. Supported integration/connected-mass/reflection/recession interventions rank ahead of isolated repeated focal strengthening. Existing quality-dependent caps remain: two for Strong/Highly resolved, three for Competent/Developing. No fixed criticism count or new diagnosis is generated.
- **Assessment:** removed the standalone `overallObservation` beneath status. Quality label, cleaned rationale and status remain. Corrective/optional insights appear in elevation when selected, or are omitted there; they do not leak beneath assessment status. Rationale cleaning also removes the reported standalone optional gradation sentence. One old test that explicitly expected this hidden optional lesson was updated to require its absence while retaining readability/error assertions.
- **Temperature:** same-target warm/cool reversals are checked before the general separate-study exception. Generic palette unity cannot casually reverse successful cool shadows or warm-focal/cool-background separation. A reflected-warmth experiment requires supplied reflected-light evidence at a matching target, study/comparison framing, a local scope and retained cool-shadow hierarchy. Explicit different upper/lower/left/right subregions remain distinct. The canonical cleaner passes linked observations into this check; it does not change the contract. Target vocabulary now includes church, tower, street, road, mountain, van/vehicle, boat, water, shadows, wires/poles, roof and foreground/background.
- **Process:** asserted “broad, loose horizontal washes” becomes supplied broad horizontal colour bands; “controlled brush strokes” becomes visible marks. Existing supplied soft transitions and darker/sharper contours remain. No softness/crispness is invented to replace inferred control. Explicit reproduction/practice methods stay allowed.
- **Evidence captions:** multi-region notes use `<supplied relationship label> · area N`, falling back to the supplied fact when a legacy label is missing. There is no per-region subject inferred from ordering. Colour labels and original-source crops retain their existing isolation. Unsafe omitted advice is also excluded from linked Notes/domain prose.
- **Composition:** the prompt defines `quietMass` as open/low-information/quiet space around or between masses, not any subordinate road/foreground mass; uncertainty uses null. Balance/steelyard presentation says **Open / quieter space** instead of asserting textbook Negative space. Geometry, canonical roles, Composition Lock and reviewed archetype-specific directional/framing/axis/balance semantics are unchanged.
- **Prompt:** compact additions cover hierarchy-safe recession/lead-ins, relational inspection before focal amplification, target/effect diversity, temperature preservation, no hidden critique, process wording and quiet/open space. WHAT/WHERE/WHY/HOW MUCH/EFFECT/HOW TO TEST, purposeful add/remove/quiet/connect guidance and separate future studies remain.

## Tests and validation

- Complete suite: **972 passed**, **48 new**, zero failures, cancellations or skipped tests (baseline 924).
- Frontend TypeScript: passed (`npm run typecheck`).
- Strict Edge TypeScript: passed (`deno check --config supabase/functions/generate-feedback/deno.json supabase/functions/generate-feedback/index.ts`).
- Configured Pages export: passed (`npm run build:web`, public fake test bindings, `/watercolor-coach-ai` base path).
- Unconfigured Pages export: passed (both public bindings empty, same base path).
- Browser harness: **83 cases**, zero runtime errors. Two 35-case responsive/aspect matrices plus four existing calibration cases, two server-normalized v1 reopen cases and seven new final-calibration cases. Widths **375/390/430/768/1024/1440/1800**, original technical portrait/portrait-vehicle/landscape/square/wide sources. Final-calibration mobile/desktop screenshots were visually inspected; artifacts remain outside Git.
- All eight unconfigured direct routes: safe setup screen, zero external requests/runtime errors.
- Retained browser checks: legacy reopen, Create Reference, gallery reopen, Composition/Notes/Roles, original/value crop geometry, same-source grayscale, 44px/mobile controls, upload/loading, manual retry, dedup, quota, lost-response recovery and 401/403/409/422/503 states. Existing safe 422 `reason_code` remains hidden from normal UI.
- Each saved-result local interaction compares call/read/upload/removal/quota/write counters before/after; delta is zero. Aggregate browser counters include intentional upload/error/retry/reference scenarios and are not claimed to be zero.
- Existing real Edge-entrypoint tests still execute the installed Supabase SDK against controlled HTTP: one OpenAI request per new attempt, one successful completion RPC/quota unit, none on invalid output, idempotent recovery without another paid call/completion. Provider normalization/strict validation, optional-aid handling and safe reason codes are unchanged.

The 48 new regressions comprise 39 focused calibration cases, four result-render cases, three evidence-caption cases and two balanced/steelyard semantic cases. They exercise unsafe/qualified depth, safe dark backgrounds, lead-in hierarchy, target/effect diversity, no invented replacements, temperature conflict/reflection evidence, visible-effect wording, future figures, central placement, exercise-free strengths, canonical geometry/role invariance and assessment/evidence presentation.

## Architecture / infrastructure

| Boundary | Change |
| --- | --- |
| Internal provider draft/schema/normalizer | None |
| Persisted/public schema and result version | None; version **1** |
| OpenAI model | None; **gpt-4.1-mini** |
| Completion cap | None; **3000** |
| Provider calls / automatic retries | None added |
| Quota / dedup / idempotency / failure semantics | None |
| SQL / secrets / auth / storage / RLS | None |
| Dependencies / lockfile / workflows | None |
| Mock fallback | None; no automatic mock fallback |
| Create Reference / legacy result support | Retained |
| Image generation/editing / crop uploads / derived storage / fake before-after | None |

`generate-feedback/index.ts`, its handler, the provider-draft module, contract, SQL, auth/storage/quota implementation, dependency manifests and workflows are byte-for-byte unchanged from the starting branch. Visuals still clip the original URI in the frontend; no image files, upload/write paths or geometry system are introduced. Only Improve Painting prompt text changes; the Create Reference prompt is unchanged. Only `.env.example` is tracked; no secrets or user artwork were added.

## Changed files

- Coaching: `shared/coachingCalibration.ts` (new), `shared/coachingEvidence.ts`, `shared/coachingLanguage.ts`, `shared/coachingWorkspace.ts`, `shared/paintingAnalysis.ts`.
- Presentation: `components/PaintingAnalysisWorkspace.tsx`, `lib/teachingEvidence.ts`, `lib/compositionArchetypes.ts`.
- Prompt: `supabase/functions/_shared/prompts.ts`.
- Tests: `tests/final-coaching-calibration.test.cjs` (new), `tests/result-ux.test.cjs`, `tests/evidence-visual.test.cjs`, `tests/composition-structure.test.cjs`, `tests/browser/professional-workspace.cjs`.
- Documentation: this report. The supplied specification is unchanged.

## Limitations and deployment

No scope deviation. These are conservative, bounded English-language safeguards and prompt calibration, not an independent semantic/image-quality oracle. They cannot guarantee every live wording or artistic judgement is correct. No private user paintings or paid provider calls were used; live coaching calibration, live Supabase database execution and native device testing remain unverified.

After review/merge, deploy the full Edge Function checkout using the existing workflow so the prompt/shared cleaner changes take effect, and deploy the existing Pages build for presentation changes. No SQL run, secret/variable update, dependency installation change or new workflow is required. Deployment and merging were not performed in this task.
