# Final Improve Painting semantic cleanup freeze patch

Baseline: current `main` after the analysis-depth freeze pass. This is the final bounded semantic/copy cleanup before freezing Improve Painting for this phase.

Do not redesign UI, change provider architecture, add features, change model/token cap/quota/schema/auth/storage/RLS/SQL/dependencies/workflows, add retries/calls, or start Phase 2.

## Fix only these remaining live issues

### 1. No hidden limitation in assessment rationale
A displayed assessment rationale must not contain a specific limitation unless there is a surviving evidence-supported recommendation/study that addresses it.

Examples of invalid live text:
- `room for improvement in spatial coherence and edge variation`
- `room for improvement in depth and compositional clarity`
when no surviving displayed guidance addresses those limitations.

Requirements:
- after presentation filtering, strip unsupported limitation clauses from displayed rationale;
- preserve supported positive reasoning;
- never invent a recommendation to justify rationale;
- never downgrade/upgrade solely to keep a critique sentence;
- no dangling punctuation/double periods after cleanup;
- keep rationale substantive when supported, but concise.

### 2. No person/skill judgement in assessment or strengths
Remove/normalize person-skill language such as:
- `solid foundational skills`
- `solid foundational understanding`
- `control of watercolor techniques`
- `demonstrates skill`
- `experienced handling`

Assessment must describe the painting, not the painter.

Prefer painting-level language such as:
- `The value, colour and compositional relationships are coherent.`
- `The painting is structurally clear but still leaves room for...` only when that limitation is supported.

Do not hard-code exact replacements; use conservative cleaning over supplied text.

### 3. Strengths must contain no hidden correction
What Works / strength actions must be preservation-only.

Invalid live example:
`Preserve the sharp light-shadow contrast on the tower while refining edges to maintain focus.`

`refining edges` is corrective language hidden inside a strength.

Requirements:
- keep the valid preservation clause;
- remove the corrective/amplifying clause from the strength action;
- if the correction is independently evidence-supported and important, it may only appear as a proper optional_refinement/clear_issue recommendation, not inside What Works;
- do not invent a new correction;
- keep road/background hierarchy guards already implemented.

Also clean obvious textual duplication in strengths, e.g.:
`warm–cool contrast contrast`
→ one `contrast`.

### 4. Final observable-process cleanup
Observed effect / What I see / What to preserve must describe visible results only.

Invalid live example:
`The boat is painted with more defined edges and darker pigment application, creating sharper contrast.`

Remove/rephrase original-process wording such as:
- `is painted with` / `was painted with` when describing original execution;
- `pigment application`;
- `painted using`;
- `applied with`;
- other execution-history wording.

Preserve only supported visible result, e.g. semantically:
`The boat has more defined edges and darker visible passages, creating stronger contrast.`

Future-study/recreation instructions may still use method/pigment terminology when explicitly framed as future/suggested practice.

### 5. Stylistic alternative classification must be semantically honest
A `stylistic_alternative` shown to the user must actually describe an alternative variation, not merely preserve the current painting and not disguise a correction.

Invalid live examples:
- lesson says current horizontal layering works, action says `maintain the horizontal structure...` — this is preservation, not an alternative;
- lesson says focal placement `could be enhanced by stronger contrast or sharper edges` and action says increase edge/value contrast — this is corrective/optional-refinement language, not a stylistic alternative.

Requirements:
- if a stylistic alternative does not introduce a real alternative choice, suppress it from Studies rather than relabeling preservation as alternative;
- if the text is actually corrective and evidence-supported, it belongs only in optional_refinement/clear_issue presentation;
- if the text is corrective but unsupported, omit it;
- do not automatically mutate classification in a way that invents a diagnosis;
- genuine alternatives remain allowed (e.g. compare a quieter vs more graphic focal treatment while preserving hierarchy), provided they are clearly future-study choices rather than defects.

## Preserve already-solved behavior
Do not regress:
- Strong display normalization using supported material issues only;
- evidence target/property/problem alignment;
- road/path/background hierarchy safeguards in recommendations and strengths;
- process wording cleanup for wash/washes, dry-brush, wet blending, edge control;
- duplicate recommendation and strength suppression;
- central/off-centre consistency;
- quiet-role guard;
- missing-colour shared note;
- Related passage cleanup;
- one-controlled-variable practice;
- composition semantics;
- one-call/no-retry architecture;
- Create Reference and legacy reopen.

## Focused regression tests
Add tests for at least:
1. rationale limitation with no surviving matching guidance is removed;
2. rationale limitation survives when a matching evidence-supported recommendation survives;
3. positive rationale remains intact after limitation removal;
4. cleanup does not leave `..`, dangling `and`, or fragments;
5. `solid foundational skills` is removed/rephrased to painting-level language;
6. `solid foundational understanding` is removed/rephrased;
7. painter/artist skill judgement does not survive assessment;
8. strength `preserve X while refining Y` keeps preservation and removes correction;
9. a genuine preservation-only strength remains unchanged;
10. duplicate `contrast contrast` is normalized;
11. observed `is painted with` process wording becomes visible-result wording;
12. `pigment application` does not survive observed/preserve text;
13. explicit future pigment/method practice remains allowed;
14. preservation-only study is not displayed as stylistic_alternative;
15. corrective stylistic_alternative is not displayed as stylistic alternative;
16. genuine future alternative still survives;
17. road hierarchy, quality normalization, one-variable practice and one-call invariants remain passing.

## Validation
Run the full existing suite plus new regressions:
- all unit/integration tests;
- frontend TypeScript;
- strict Edge TypeScript;
- configured/unconfigured exports;
- full browser/responsive harness at 375/390/430/768/1024/1440/1800;
- legacy reopen;
- Create Reference;
- Clean/Notes/Composition/Roles;
- colour/crop/value evidence;
- retry/quota/dedup/lost-response;
- 401/403/409/422/503;
- zero runtime browser errors;
- saved-result interactions/reopen = zero provider calls/uploads/writes.

No paid live-provider calls in automated tests.

## Final report
Push only to `codex/final-freeze-semantic-cleanup`.
Do not create PR, merge or deploy.
Report final SHA, working tree state, full changed-file inventory, +/- counts, total/new tests, failures/skips/cancellations, TS/export/browser results, exact implementation of the five fixes, architecture invariants, deviations and remaining live-only limitations.

After review/merge/deploy, live-test Church / Red Van / Abstract Boat one last time. If these semantic issues are gone, freeze Improve Painting for this phase and stop micro-tuning.
