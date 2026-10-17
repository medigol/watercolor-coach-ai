# Final Improve Painting freeze fix

Baseline: current `main` after PR #29. This branch is the final bounded patch before freezing Improve Painting for this phase.

Do not re-open provider architecture, redesign UI, add retries/calls/tokens, change model/quota/schema/auth/storage/RLS/SQL/dependencies/workflows, or start new features.

## Fix only these remaining live issues

### 1. Competent-with-no-material-advice inconsistency
Live red-van and boat outputs can show `Competent painting` with an entirely positive rationale and no surviving material recommendation. This is incoherent.

Add a conservative display calibration rule using existing supplied canonical/provider data only:
- if original level is competent/developing;
- rationale is positive and contains no supported limitation;
- no original supported material clear issue remains;
- no surviving material recommendation exists;
- evidence includes at least one genuine successful strength;
then allow display level `Strong`.

Do not auto-upgrade solely because recommendation count is zero. Do not invent a defect. Existing uncertainty, clear_issue, or supported material limitation blocks upgrade.

### 2. Empty-state status copy
Do not show `Review the observed structure and handling below.` when there are no corrective recommendations.

For competent/developing with no surviving material recommendation, after quality calibration either:
- display the normalized Strong status if upgraded; or
- use neutral non-corrective wording such as `Review the observations and studies below.` if the level safely remains competent/developing.

Do not imply a hidden problem.

### 3. Remove final process-inference wording
Observed/preserve text still leaks process claims such as:
- `dry brush texture` / `dry-brush texture`
- `wet blending`
- `opaque colour application`
- `edge control`
- `edge variation technique`
- `maintain this edge control`

In Observed effect / What I see / What to preserve, convert only to visible-result language when supported:
- dry-brush texture -> broken/granular/irregular visible texture (do not assert dry-brush process)
- wet blending -> soft blended/diffused colour transitions
- opaque colour application -> denser/flatter/more solid-looking colour passage only if supplied wording supports that visible result; otherwise omit process phrase
- edge control -> edge variation / edge definition
- edge variation technique -> edge variation
- `Maintain this edge control...` -> `Preserve this edge variation...`

Future-study technique suggestions may still explicitly recommend dry-brush, wet-on-wet, etc. Do not erase valid future method suggestions.

### 4. Quiet-role semantic guard
A road/street/foreground/lead-in is not automatically `quiet` merely because it is non-focal.

Using existing role/fact text only, suppress or neutralize a displayed `quiet` role for road/street/path/foreground when evidence shows it is structurally active, e.g. directional lead-in, strong value mass, major foreground mass, strong perspective/path function, or significant visual flow.

Do not reassign it to supporting unless canonical evidence already supports supporting. If uncertain, omit the quiet role/overlay/text rather than inventing a replacement.

This must affect role overlay/list consistently so no orphan `Quiet` box remains.

### 5. Practice must truly use one controlled variable
Practice copy must not claim one variable while changing two.

Example live defect:
`paint horizontal colour bands varying only value contrast; compare spatial depth with softer edges.`
This changes both value contrast and edge softness.

Add a conservative validation/cleanup for practice/study text:
- if text says `only` / `one controlled variable` / equivalent, comparison/success cue must not introduce a second independent variable;
- preserve the first explicit controlled variable and remove/neutralize the second variable where safe;
- do not invent a replacement exercise;
- examples: if controlled variable is value contrast, compare depth/readability at different value contrast while keeping edges consistent; if edge softness is the variable, keep values consistent.

Prefer prompt reinforcement plus deterministic cleanup/test coverage.

## Regression tests

Add focused tests for:
1. competent + positive rationale + no supported material issue/recommendation + real strength can normalize to Strong;
2. same case with original clear_issue does not upgrade;
3. same case with supported material limitation does not upgrade;
4. ambiguous/uncertain rationale does not upgrade;
5. no-recommendation state never shows `Review the observed structure and handling below.`;
6. `dry brush texture` observed text becomes visible texture wording;
7. `wet blending` observed text becomes soft/diffused transition wording;
8. `opaque colour application` does not survive as process wording;
9. `edge control` / `edge variation technique` preserve wording becomes observable edge-variation language;
10. explicit future dry-brush/wet-on-wet study remains allowed;
11. structurally active road/foreground canonical quiet role is suppressed from role overlay/list;
12. genuinely quiet road/foreground with explicit low-information/subordinate evidence may remain quiet;
13. suppression does not fabricate supporting role;
14. practice with `varying only value contrast` cannot also vary softer edges;
15. valid single-variable value practice survives;
16. valid single-variable edge practice survives;
17. one-provider-call/no-retry/model/token/quota/schema/idempotency tests remain unchanged.

## Validation

Run the full existing suite, frontend TypeScript, strict Edge TypeScript, configured/unconfigured exports, browser/responsive harness at all existing widths, legacy reopen, Create Reference, error/dedup/quota/lost-response flows, and saved-result zero-call/write checks.

Use sanitized textual fixtures only. No real user paintings/screenshots.

Push implementation to `codex/final-freeze-fix`. Do not create PR, merge or deploy. Report final SHA, files +/- counts, tests/new tests, TS/export/browser results, exact five safeguards, architecture invariants, and any remaining live-only limitation.
