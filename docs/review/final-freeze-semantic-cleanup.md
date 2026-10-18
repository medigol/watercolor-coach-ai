# Final Improve Painting semantic cleanup freeze patch

Baseline: current `main` after the analysis-depth freeze pass. This is the FINAL bounded semantic/copy cleanup before freezing Improve Painting for this phase.

The purpose is not to add features or reopen calibration. It is to close the remaining user-facing semantic inconsistencies seen in the final Church / Red Van / Abstract Boat live runs, while preserving the existing architecture and deeper coaching behavior.

Do not redesign UI, change provider architecture, add features, change model/token cap/quota/schema/auth/storage/RLS/SQL/dependencies/workflows, add retries/calls, or start Phase 2.

## Architecture invariants

Keep unchanged:
- one new analysis attempt = exactly one provider/OpenAI call;
- no automatic retry or fallback provider call;
- `gpt-4.1-mini`;
- `max_completion_tokens = 3000`;
- persisted result version 1;
- provider draft architecture and deterministic server canonicalization;
- quota, request dedup/idempotency, lost-response recovery;
- auth, storage, RLS, SQL, secrets, dependencies and workflows;
- Create Reference and legacy saved-result compatibility;
- saved-result interactions/reopen = zero provider calls/uploads/writes;
- no image generation/editing/fake before-after/generated figures.

## Fix only these remaining live issues

### 1. No hidden limitation in assessment rationale

A displayed assessment rationale must not contain a specific limitation unless there is surviving evidence-supported displayed guidance that addresses it.

Invalid live examples:
- `room for improvement in spatial coherence and edge variation`
- `room for improvement in depth and compositional clarity`
when no surviving recommendation/study addresses those limitations.

Requirements:
- after presentation filtering, remove unsupported limitation clauses from displayed rationale;
- preserve supported positive reasoning;
- never invent a recommendation to justify rationale;
- never retain hidden critique merely because it existed in raw provider output;
- do not alter stored canonical quality solely to preserve/remove a sentence;
- no dangling fragments, duplicated punctuation, or double periods after cleanup;
- keep rationale substantive when supported, but concise.

If a limitation is supported by a surviving evidence-aligned recommendation/study, it may remain.

### 2. Quality normalization must use supported/cleaned rationale semantics

The display-level Strong normalization must not be blocked by critique text that is itself removed as unsupported.

Requirements:
- use the same supported/cleaned rationale semantics that are actually eligible for display when deciding whether a Competent/Developing result can safely normalize to Strong;
- unsupported raw limitation clauses that are removed from display must not by themselves block Strong normalization;
- a surviving supported material limitation must still block upgrade;
- a supported material clear_issue must still block upgrade;
- zero recommendations alone never proves Strong;
- confidence/uncertainty safeguards remain conservative;
- stored canonical quality remains unchanged.

Also make positive assessment detection robust to painting-level positive language after cleanup. For example, source wording such as `solid control of value contrasts` should be normalized to a painting-level property statement such as `strong value contrast` or equivalent, rather than treated as a person-skill judgement or failing positive detection.

This specifically prevents a coherent Church-like result from remaining Competent only because its positive wording used `solid control` / `effectively balances` rather than one exact positive keyword.

### 3. No person / skill judgement in any user-facing assessment teaching

User-facing analysis should describe the PAINTING, not the painter's competence, experience, skill or mastery.

Remove/normalize wording such as:
- `solid foundational skills`;
- `solid foundational understanding`;
- `demonstrates skill`;
- `skilled handling`;
- `experienced handling`;
- `control of watercolor techniques`;
- `solid control of value contrasts` when it reads as skill/handling judgement;
- `technical mastery`;
- `the painter shows...`;
- `the artist demonstrates...`.

Prefer painting-level language only when a safe conversion is directly supported, for example:
- `The painting has strong value contrast and clear focal hierarchy.`
- `The value, colour and compositional relationships are coherent.`

Do not fabricate substitute praise.

Apply this conservatively across assessment rationale, strengths/preservation, technique-preserve text and other evaluative user-facing coaching where the wording judges the person rather than the painting.

### 4. Strengths / What Works must contain no hidden correction

A Strength must remain observation + why it works + preservation only.

Invalid live example:
`Preserve the sharp light-shadow contrast on the tower while refining edges to maintain focus.`

`refining edges` is corrective language hidden inside a strength.

Requirements:
- inspect BOTH strength lesson and strength action;
- preserve the valid observation/relationship/preservation clause;
- remove corrective/amplifying clauses from What Works;
- do not invent replacement correction;
- if an independent evidence-supported correction already exists elsewhere, it may appear only as proper optional_refinement/clear_issue guidance;
- do not convert a strength into a correction merely to save wording;
- keep existing road/background hierarchy guards.

Also clean obvious local duplicate wording safely, including:
- `warm–cool contrast contrast` -> one `contrast`;
- repeated adjacent identical adjectives/nouns;
- duplicate punctuation.

Do not perform broad paraphrasing.

### 5. Final original-process cleanup

Observed effect / What I see / What to preserve must describe visible results only.

Invalid live example:
`The boat is painted with more defined edges and darker pigment application, creating sharper contrast.`

Observed/preservation text must not assert:
- `is painted with` / `was painted with` as execution history;
- `painted using`;
- `applied with`;
- `pigment application`;
- `colour application` as original method;
- `brush application`;
- `wash application`;
- original handling/process/history.

Convert only when visible-result meaning is safely supplied, e.g. semantically:
`The boat has more defined edges and darker visible passages, creating stronger contrast.`

Future-study/recreation instructions MAY still use pigment, wash, wet-on-wet, wet-on-dry, dry brush, brush choice, etc., because those are suggested future methods.

Rule:
- ORIGINAL OBSERVATION / PRESERVATION = visible result only;
- FUTURE PRACTICE / RECREATION = method terminology allowed.

Preserve all previous wash/washes, dry-brush, wet-blending and edge-control cleanup.

### 6. Stylistic alternative classification must be semantically honest

A user-facing `stylistic_alternative` must actually present a genuine alternative future choice.

Do not show preservation-only advice as an alternative.

Invalid live example:
- lesson says current horizontal layering works;
- action says `maintain the horizontal structure and off-centre placement...`.
This is preservation, not an alternative.

Do not disguise a correction as stylistic alternative.

Invalid live example:
- `could be enhanced by stronger contrast or sharper edges`;
- `increase edge sharpness or value contrast...`.
This is corrective/refinement language.

Requirements:
- preservation-only `stylistic_alternative` -> suppress from Studies;
- corrective wording inside `stylistic_alternative` -> suppress from Studies unless there is an independently and correctly classified canonical optional_refinement/clear_issue already surviving elsewhere;
- do NOT promote/reclassify a mislabeled stylistic alternative into a new correction during presentation cleanup;
- unsupported corrective alternative -> omit;
- do not invent a diagnosis or replacement alternative;
- genuine alternatives survive only when they clearly compare future choices without implying defect and maintain hierarchy safety.

Example of a genuine alternative concept:
- compare a quieter focal treatment vs a more graphic focal treatment in a separate study, while preserving overall hierarchy.

### 7. Practice / study must not imply an unsupported defect

A future practice may explore a neutral variable, but it must not imply that the current painting has a defect unless that limitation is evidence-supported.

Invalid strong-painting pattern:
`paint a vehicle ... focusing on perspective accuracy and proportion ... compare with this painting to gauge improvement`
when no surviving perspective/proportion limitation exists.

Requirements:
- for Strong/Highly resolved work, practice should usually extend an observed successful relationship or neutrally compare one controlled variable;
- words such as `improve`, `correct`, `fix`, `accuracy`, `proportion`, `perspective` must not imply a deficiency unless supported by surviving evidence-aligned guidance;
- if the exercise is otherwise useful but its improvement framing is unsupported, neutralize only the defect implication and preserve the legitimate study variable where possible;
- do not invent a new practice target;
- keep the existing one-controlled-variable rule, constants and success-cue behavior.

### 8. Final semantic consistency gate across displayed sections

Before rendering, enforce a narrow consistency check across:
- assessment rationale;
- What Works;
- recommendations;
- Technique observation/preservation;
- Practice & Studies.

The same displayed result must not simultaneously:
- say `no major issue detected` while hiding an unsupported limitation elsewhere;
- label something Strength while asking to refine/fix it;
- label something stylistic alternative while asking to fix it;
- claim a person skill level in one section after assessment cleanup removed it elsewhere;
- describe original process in Technique after observable-language cleanup;
- imply a practice deficiency that has no surviving evidence-supported limitation.

This is a presentation consistency guard only. Do not create new facts, diagnoses, recommendations, classifications or model calls.

## Preserve already-solved behavior

Do not regress:
- Strong display normalization using supported material issues only;
- deeper Overall/What Works/Composition/Colour & Value/Technique/Practice content from the analysis-depth pass;
- evidence target/property/problem alignment;
- recommendation and Strength deduplication;
- road/path/background hierarchy safeguards in recommendations and strengths;
- central/off-centre consistency;
- temperature/warm-cool consistency;
- quiet-role guard;
- missing-colour shared notice;
- Related passage cleanup;
- one-controlled-variable practice;
- composition archetype semantics;
- visual-role/note orphan cleanup;
- process wording cleanup for wash/washes, dry-brush, wet blending and edge control;
- one-call/no-retry architecture;
- Create Reference and legacy reopen.

## Implementation principles

Make the smallest safe patch.

Prefer:
- deterministic presentation cleanup;
- narrow reusable helpers;
- conservative suppression;
- explicit regression tests.

Do not:
- reanalyse pixels;
- invent facts;
- invent artistic diagnoses;
- invent replacement recommendations;
- add another model call;
- build another semantic engine;
- perform unrelated refactors.

When uncertain: omit rather than fabricate.

## Files to inspect

At minimum inspect:
- `shared/coachingAssessment.ts`;
- `shared/coachingEvidence.ts`;
- `shared/coachingWorkspace.ts`;
- `shared/coachingCalibration.ts`;
- `shared/coachingAlignment.ts`;
- `shared/coachingLanguage.ts`;
- `shared/paintingAnalysis.ts`;
- `shared/providerPaintingAnalysis.ts`;
- `supabase/functions/_shared/prompts.ts`;
- `components/PaintingAnalysisWorkspace.tsx`.

Relevant tests include:
- `tests/analysis-depth-assessment.test.cjs`;
- `tests/analysis-depth-strengths.test.cjs`;
- `tests/analysis-depth-language.test.cjs`;
- `tests/final-freeze-process.test.cjs`;
- `tests/live-quality-assessment.test.cjs`;
- `tests/result-ux.test.cjs`;
- `tests/browser/professional-workspace.cjs`.

Change only what is necessary.

## Focused regression tests

Add tests covering at least:
1. rationale limitation with no surviving matching guidance is removed;
2. rationale limitation survives when matching evidence-supported guidance survives;
3. positive rationale remains after unsupported critique removal;
4. unsupported raw critique removed from display does not alone block safe Strong normalization;
5. supported material limitation still blocks Strong;
6. supported material clear_issue still blocks Strong;
7. zero recommendations alone does not prove Strong;
8. Church-like positive painting-level rationale using `solid control` / `effectively balances` can normalize safely after person-skill cleanup when all other Strong conditions pass;
9. cleanup leaves no `..`, dangling `and`/`but`, comma fragment, or broken sentence;
10. `solid foundational skills` does not survive;
11. `solid foundational understanding` does not survive;
12. `solid control of value contrasts` is converted to painting-level property language or safely removed;
13. painter/artist experience/skill judgement does not survive user-facing coaching;
14. strength `Preserve X while refining Y` keeps preservation and removes correction;
15. corrective language in strength lesson is also removed/suppressed;
16. valid preservation-only Strength remains unchanged;
17. no correction is invented after Strength cleanup;
18. `contrast contrast` becomes one `contrast`;
19. adjacent duplicate wording is cleaned conservatively;
20. observed `is painted with` process wording becomes visible-result wording or is omitted;
21. `pigment application` does not survive observed/preserve text;
22. `painted using` / `applied with` do not survive original-image observation;
23. explicit future pigment/recreation instruction remains allowed;
24. future wet-on-wet/wet-on-dry/dry-brush practice remains allowed;
25. preservation-only study is not shown as stylistic_alternative;
26. corrective stylistic_alternative is not shown as stylistic alternative;
27. mislabeled corrective stylistic alternative is not promoted into a newly invented recommendation;
28. unsupported corrective alternative is omitted;
29. genuine future stylistic alternative survives;
30. Strong practice cannot imply unsupported perspective/proportion deficiency;
31. supported perspective/proportion practice remains allowed when matching evidence-supported guidance exists;
32. neutral one-variable study survives;
33. existing one-controlled-variable practice safeguards remain passing;
34. `No major issue detected` cannot coexist with a hidden unsupported limitation in another displayed teaching section;
35. road hierarchy safeguards remain passing;
36. background recession safeguards remain passing;
37. quality normalization safeguards remain passing;
38. saved-result interactions/reopen remain zero provider calls/uploads/writes;
39. one new analysis remains exactly one provider call;
40. no retry is added;
41. model remains `gpt-4.1-mini`;
42. `max_completion_tokens` remains `3000`;
43. persisted version remains 1;
44. quota/dedup/idempotency remain unchanged;
45. Create Reference remains unchanged.

Use sanitized textual fixtures only. Do not commit real user paintings/screenshots.

## Full validation

Run the COMPLETE existing suite plus new regressions:
- all unit/integration tests;
- frontend TypeScript;
- strict Edge TypeScript;
- configured and unconfigured web exports;
- full browser/responsive harness at 375/390/430/768/1024/1440/1800;
- legacy saved-result reopen;
- Create Reference;
- Clean/Notes/Composition/Roles;
- colour/crop/value evidence;
- upload/loading;
- retry/quota/dedup/lost-response;
- 401/403/409/422/503;
- zero browser runtime errors;
- saved-result interactions/reopen = zero provider calls/uploads/writes.

Do not perform paid live-provider calls in automated tests.

## Final report

Push implementation only to `codex/final-freeze-semantic-cleanup`.

Do not create PR, merge or deploy.

Report:
- final SHA;
- branch name;
- working tree state;
- complete changed-file inventory;
- additions/deletions;
- total/new tests and failures/skips/cancellations;
- frontend/Edge TypeScript;
- configured/unconfigured exports;
- browser/responsive results;
- exact implementation of:
  1. hidden-rationale cleanup;
  2. supported/cleaned-rationale quality normalization;
  3. person/skill-language cleanup;
  4. Strength hidden-correction cleanup;
  5. final original-process cleanup;
  6. stylistic-alternative semantic honesty;
  7. unsupported-defect practice cleanup;
  8. cross-section semantic consistency gate;
- confirmation that provider schema/model/token/quota/calls/retry/auth/storage/RLS/SQL/dependencies/workflows/Create Reference remain unchanged;
- any deviation;
- remaining live-only limitations.

After review/merge/deploy, live-test Church / Red Van / Abstract Boat one final time. If these semantic issues are gone, freeze Improve Painting for this phase and stop micro-tuning.
