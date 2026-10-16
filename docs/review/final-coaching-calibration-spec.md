# Final coaching calibration specification

Baseline: production `main` after PR #26 (`fc6712a8623efc3c5bb8c92150d6828a161b0a54`).

This is a small final coaching-quality patch. The provider-contract reliability architecture from PR #26 is frozen unless a regression test proves a defect. Do not redesign the UI, add provider calls, add retries, increase token cap, change persisted result schema/version, or start Phase 2.

## Live findings

### Red van
The new result is materially better and no longer treats central placement as a defect, but its first recommendation says to add darker values to mountain shadows to improve atmospheric recession. That can move a background mass forward if it increases background contrast relative to the focal vehicle. Any recession recommendation must evaluate whether the change makes the distant mass quieter or more competitive. If darker structure is genuinely needed, it must remain compressed/subordinate to focal contrast and preserve soft atmospheric edges.

The road recommendation also proposes more contrast on edges and centre line. Lead-in contrast must not create a competing focal path. If stronger road cues are supported, localise them (normally nearer foreground) and keep/taper them below focal contrast as they recede.

### Church
The painting is correctly treated as Strong. The wires-near-tower refinement is useful. However a standalone sentence about foreground-shadow gradation appears in Overall Assessment without becoming an elevation recommendation. This is hidden critique and must not happen: corrective/optional critique either appears in `How to elevate this painting` or is omitted from the assessment.

The suggestion to warm dark/cool church shadows may conflict with the painting's successful warm-light/cool-shadow relationship. Do not reverse a successful temperature structure merely to “unify the palette”. A temperature change must be location-specific and preserve the hierarchy; reflected warmth may be a study only when actually supported.

Multi-region evidence captions such as `Related passage 1/2` are too generic. They should use a meaningful supplied relationship label, e.g. `<relationship label> · area 1`, not pretend to know per-region semantics that were not supplied.

### Boat
The result now has meaningful elevation guidance, but both recommendations target essentially the same focal-amplification outcome: stronger boat contrast / sharper boat edges. Before intensifying an already readable focal object, the coach must examine the relationship between the focal object and its surrounding masses. If supported, spatial integration, reflection/water connection, horizontal-band integration, value grouping, or edge hierarchy should outrank a second near-duplicate “make focal stronger” recommendation.

The coach must not force that diagnosis. If only focal contrast is genuinely limiting, one precise focal recommendation is valid. Do not invent a second issue for completeness.

## Required changes

### 1. Depth-safe recommendation calibration
Strengthen provider prompt and add deterministic presentation/ranking safeguards where useful.

For distant/background/mountain masses, recommendations intended to improve recession must not simply increase darkness/contrast/sharpness/chroma unless supplied evidence/action explicitly keeps that change subordinate to focal/foreground hierarchy.

Prefer supported interventions such as compressing internal background values, softening selected internal edges, reducing local contrast/chroma/detail, preserving silhouette while quieting internal transitions, or cooler/receding temperature only when colour evidence supports it.

Do not encode “background must always be lighter”. Dark backgrounds can recede. The invariant is hierarchy, not a formula.

If deterministic code detects unsafe generic advice such as “darken/increase contrast in the distant mountain to improve recession” without subordinate/focal-limit language, do not promote it as Main/Secondary opportunity. Suppression or study-only treatment is safer than inventing a replacement.

### 2. Lead-in hierarchy guard
A road/path/line can guide the eye without becoming a competing focal element. Prompt guidance should require location and taper/hierarchy where stronger contrast is proposed. Stronger foreground cue + quieter recession is valid when supported. Generic “increase contrast along the road” is insufficient for a major recommendation.

### 3. Recommendation diversity / de-duplication
Provider self-check: do not return two recommendations with the same target and same intended visual effect unless mechanisms are genuinely distinct and both materially useful.

Server/presentation should also suppress obvious duplicates using supplied text only. Consider target + mechanism/effect, not just exact lesson similarity. Do not invent a replacement recommendation.

Example duplicate family: “increase boat/background value contrast” + “make boat darker/sharper for stronger focal impact” when both merely intensify the same already-readable focal object.

When a supplied relational/spatial recommendation exists, rank it above a second generic focal-intensification recommendation.

### 4. Relational coaching before focal amplification
Before making an already clear focal object darker/sharper/more saturated, inspect its relationship to surrounding value masses, reflection/contact shadow, background competition, edge hierarchy, spatial integration, and atmospheric depth.

A painting-level relational intervention should outrank repeated isolated-object strengthening when evidence supports both.

### 5. No hidden critique in Overall Assessment
The assessment card contains quality label, clean quality rationale, and status.

Do not display an unrendered clear_issue/optional_refinement as a standalone `overallObservation` beneath status.

A corrective/optional statement must either be selected into `How to elevate this painting` or be omitted from the assessment card. Neutral/strength observation may remain only when it adds non-duplicate value.

### 6. Temperature-conflict guard
Expand contradiction detection/prompt calibration so a successful warm/cool relationship is not casually reversed.

Examples: a successful cool shadow should not be told to become warmer merely for “palette unity” unless a specific local reflected-warmth relationship is observed; a warm focal/cool background separation should not be neutralised by generic harmonisation.

Improve target vocabulary where needed: church, tower, street, road, mountain, van/vehicle, boat, water, shadow(s), wires/poles, roof, foreground/background.

Add warm/cool/temperature to property-conflict reasoning where possible without inventing facts.

### 7. Observable-effect language only
Harden deterministic language cleaning for live phrases such as `broad, loose horizontal washes`, `more controlled brush strokes`, `controlled brush strokes`.

Prefer visible-effect wording using only supplied meaning, for example `broad horizontal colour bands with soft transitions` or `darker, sharper contours around the boat`.

Do not claim original brush handling, wash sequence, moisture state, layering process or technique control. Suggested reproduction/practice methods remain allowed when clearly framed as suggestions.

### 8. Multi-region evidence labels
Replace generic `Related passage 1`, `Related passage 2` captions.

Do not invent per-region identities if provider did not supply them. Safe fallback: `<supplied note/relationship label> · area 1`, `<supplied note/relationship label> · area 2`.

If a trustworthy supplied role/label maps explicitly to a region, it may be used. Do not infer region identity from ordering alone.

### 9. Composition semantic calibration
Prompt must define `quietMass` / negative/open space more carefully.

For balance archetypes, a road/foreground/large structural painted mass is not automatically “negative space” merely because it is lighter or subordinate. Negative/open space should be an actually open, low-information or visually quiet interval around/between major masses. If uncertain, use null rather than false teaching.

Consider a safer presentation label such as `Open / quieter space` if saved field semantically represents quiet/open space rather than strict textbook negative space. Do not change overlay geometry.

### 10. Keep recommendations professionally specific
Preserve WHAT / WHERE / WHY / HOW MUCH / EFFECT / HOW TO TEST.

A major recommendation should identify the actual relationship, not only `increase contrast`, `sharpen edges`, `add atmosphere`, or `improve composition`.

Prefer 1–3 distinct high-impact interventions. Fewer is better than duplicate filler.

### 11. Add/remove/quiet/connect remains allowed
Do not regress the ability to recommend a purposeful figure, object, removal, simplification, quieter element, or connected mass. These remain valid only when they solve a concrete scale/flow/hierarchy/depth/rhythm problem. Significant changes remain future studies, never fake edited imagery.

## Regression tests

Add tests for at least:
1. Generic distant contrast/darkness increase for recession is not promoted without hierarchy qualification.
2. Qualified background-value study explicitly below focal contrast is allowed.
3. Generic road contrast strengthening is not ranked above a more specific supported relationship.
4. Two same-target/same-effect focal-intensification recommendations are de-duplicated.
5. Distinct mechanisms with genuinely different effects can both survive.
6. Relational/spatial boat recommendation outranks duplicate second focal-intensification when supplied.
7. No new critique is invented when duplicates are removed.
8. Strong assessment does not show unselected optional refinement as hidden standalone critique.
9. Selected optional refinement appears only in `How to elevate`, not duplicated in assessment.
10. Warm/cool strength is not contradicted by generic opposite-temperature advice for same target.
11. Local reflected-warmth study remains allowed when explicitly supported/scoped.
12. `broad, loose horizontal washes` is not displayed as asserted process.
13. `controlled brush strokes` is not displayed as reconstructed handling.
14. Visible broad horizontal colour bands / soft transitions / sharp dark contours survive.
15. Multi-region evidence captions do not contain `Related passage`.
16. Multi-region labels use supplied relationship label + area number when per-region semantics unavailable.
17. Balanced-mass composition does not force a positive structural road/foreground mass into textbook `Negative space` when uncertainty is explicit.
18. Existing figure/object future-study guidance remains available.
19. Central placement remains valid and is not automatically criticised.
20. What Works remains exercise-free.
21. Colour evidence labels/crops remain correct.
22. Existing 422 reason_code, provider normalization, one-call tests and quota tests remain unchanged/passing.

## Hard architecture constraints
Keep unchanged unless a test proves a required bug fix:
- one provider call per new analysis attempt;
- no automatic retry;
- `gpt-4.1-mini`;
- `max_completion_tokens = 3000`;
- successful-quota semantics;
- request dedup/idempotency;
- auth/storage/RLS/secrets;
- SQL;
- dependencies;
- workflows;
- persisted result version 1;
- internal provider-draft architecture from PR #26;
- no mock fallback;
- Create Reference;
- legacy saved results;
- no image generation/editing;
- no fake before/after;
- no generated figures/objects.

## Validation
Run complete test suite, frontend TypeScript, Edge TypeScript, configured/unconfigured exports, browser harness, responsive matrix at 375/390/430/768/1024/1440/1800, unconfigured routes, legacy reopen, Create Reference, retry/dedup/quota/error states, and zero model calls/writes during saved-result evidence interactions.

Do not commit real user paintings.

## Final report
Push implementation to `codex/final-coaching-calibration` and do not merge. Report commit SHA, changed files and +/-, tests/new tests, TypeScript/export/browser results, exact safeguards added for depth/recommendation diversity/temperature conflict/hidden critique/process wording/evidence labels/composition semantics, confirmation provider architecture/model/token cap/quota/SQL/secrets/auth/storage/RLS/dependencies/workflows remain unchanged, and remaining live-only limitations.
