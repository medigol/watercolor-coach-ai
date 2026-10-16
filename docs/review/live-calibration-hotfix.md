# Live calibration hotfix

Baseline: production main `c8f5a0b4978aab23e61f78585539d2dca59a8906` after PR #28. Both Pages and Supabase Edge deploys succeeded on this SHA.

This is a **small bounded live-calibration hotfix and final Improve Painting freeze pass**. Do not change provider architecture, model, token cap, quota, schema, auth/storage/RLS/SQL/dependencies/workflows, UI layout, or add retries/calls/image generation. Do not start new features in this pass.

## Live acceptance findings

Three real paintings (church, red van, abstract boat) produced successful analyses after the final deployment. Major prior improvements are visible: unsafe mountain-darkening advice disappeared, hidden assessment critique is reduced, central placement is no longer treated as a defect, `Open / quieter space` is shown for balance composition, and the boat no longer receives two near-identical focal-amplification recommendations.

Residual defects remain and should be fixed before freezing Improve Painting.

### 1. Recommendation de-duplication still misses same-target/same-effect wire advice
Church returned both:
- simplify/soften some wires because they compete with the tower;
- soften select wire edges because they compete with the tower silhouette.
These are effectively the same target and intended effect. Keep the stronger/more specific one; do not invent a replacement. Extend de-duplication beyond focal-only advice to same target + same intended effect across optional refinements.

### 2. Road hierarchy guard misses equivalent wording
Van returned: `introduce more value contrast and subtle chroma shifts in road and foreground to enhance depth.`
This is still too broad: it does not localise the change, taper it with recession, or explicitly keep it subordinate to focal contrast. The current guard appears to catch `increase/add/boost/enhance` but misses equivalent verbs such as `introduce`, `raise`, `strengthen`, `accentuate`, `make ... stronger`, etc.

Guard semantics, not one phrase. A major road/path recommendation that increases contrast/chroma must specify where (normally near foreground), how it tapers/quiets with distance, and that it remains below the focal hierarchy. Otherwise omit/demote it. Do not force a replacement.

### 3. Observable-effect cleaning remains incomplete
Live output still contains process/handling assertions such as:
- `Loose brushwork with some soft edges in sky clouds.`
- `Soft washes create mountain's misty effect but edges are unevenly controlled.`
- `Continue using soft washes for distant elements...`
- `The boat is painted with more defined brush strokes...`
- `Combining loose washes for background with sharper brushwork...`

In **Observed effect / What I see / What to preserve**, describe visible results only: broad colour passages, soft/diffused transitions, sharper/darker contours, lost/found edges, visible marks, etc. Do not reconstruct brush handling, wash type, control, sequence or application. Explicit practice/reproduction suggestions may still say `try a wet-on-wet study` or recommend a method because they are framed as future practice.

Add deterministic cleaning/tests for `loose brushwork`, `soft washes create`, `using soft washes`, `defined brush strokes`, `sharper brushwork`, `edges are ... controlled`, and close variants. Preserve the visible semantic content rather than simply dropping useful observations where safe.

### 4. Composition text/archetype contradictions need a deterministic consistency guard
Van result displayed `Off-centre focus` while its own observation said `Central vertical focus` / `Van centrally placed`.
Boat result said `central boat focal point`, while the visible boat is in the lower-right area and prior evidence already located it there.

Do not infer pixels again. Use existing normalized focal role/region and composition focalPoint when available to check coarse positional language/archetype consistency:
- if focal centre lies clearly within a central tolerance band, do not label the composition `Off-centre focus`;
- if focal centre lies clearly outside that band, do not state `central focal point`;
- if geometry/confidence is insufficient, prefer neutral wording rather than a false positional claim.

Do not change the geometry renderer or force rule-of-thirds/off-centre archetypes. Suppress/neutralize contradictory teaching text rather than inventing a new composition diagnosis.

### 5. Quality-level consistency still needs one final guard
Boat was classified `Competent painting`, with rationale `clear intent with balanced colour bands and a focal boat`, yet only one modest optional refinement was supplied (`soften some background edges`). This is inconsistent with the existing calibration rule that competent normally has a material evidenced route to improvement; if only subtle refinement is supported, Strong may be more coherent.

Do not auto-upgrade every sparse result. Add a conservative consistency check/prompt self-check:
- competent/developing should normally have at least one material, evidence-supported limitation/recommendation;
- if all surviving recommendations are minor optional refinements and rationale is wholly positive, prefer Strong or keep quality only when a real supported material limitation already exists in the provider draft;
- never invent a flaw just to justify Competent.

### 6. Missing colour evidence repetition remains poor UX
Boat still repeats `No confidently located source detail for this colour.` for multiple unlocated colours. If 2+ visible colours lack local evidence, show one shared explanatory note for the group and list the colour names without repeating the same sentence under each. Do not fabricate crops or role links.

### 7. `Related passages` generic wording still appears in note metadata
The top Notes list can still show `Related passages`. Replace generic user-facing wording with the supplied relationship/note label, or neutral `Multiple source areas` if no semantic label is available. Do not infer per-region identities from ordering.

### 8. Recommendation evidence must directly support the claimed problem
The live church result linked `Church tower placed slightly right of center, dominating composition vertically` to a lesson that `the church tower's base and surrounding shadows feel compressed, limiting spatial depth.` The linked fact does not itself establish compressed base shadows.

The live van result linked a general value-hierarchy fact to `Road and foreground values are too uniform` even though the fact only stated the road was mid-tone/uniform at a broad level.

Do not let an insight claim a material defect or relationship that is absent from its referenced facts. The linked evidence must support the actual target/property/problem named in the lesson. If not, omit/demote the insight or require the provider draft to reference an already supplied matching fact. Never synthesize a new fact in the presentation layer.

Use conservative lexical/semantic target-property matching from supplied text only. Do not build another image-analysis system.

### 9. Quality rationale must not contain hidden critique
Van rationale said `perspective and value transitions need refinement for depth`, but the visible selected elevation guidance did not provide a perspective recommendation. This is still hidden critique, now inside the rationale rather than `overallObservation`.

A quality rationale may explain the level, but any specific correctable limitation named there (perspective, drawing, values, edges, depth, colour hierarchy, etc.) must correspond to a surviving evidence-supported elevation insight, or be removed from the displayed rationale. Do not invent a recommendation to satisfy the rationale.

Strong/highly resolved rationale may be wholly positive. Competent/developing rationale can mention limitations only when those limitations are represented in actionable evidence-supported guidance.

### 10. A recommendation needs evidence for the requested delta, not merely the property
Boat had a visible fact saying `broad horizontal colour bands with visible soft edges`, then recommended softening background edges further. A fact that something is already soft does not, by itself, support `make it softer`.

Generalize this safeguard:
- observed soft edge ≠ evidence that it needs to be softer;
- observed crisp edge ≠ evidence it needs to be sharper;
- observed contrast ≠ evidence it needs more contrast;
- observed muted colour ≠ evidence it needs lower chroma;
- observed focal saturation ≠ evidence it needs more saturation.

A directional change needs supplied evidence of excess/deficiency/competition/flattening/confusion or a clearly scoped optional comparative study. Preserve optional stylistic experiments, but label them as alternatives rather than corrective elevation when no deficiency is evidenced.

### 11. `What works` should also avoid near-duplicate teaching
Boat returned two highly similar composition strengths: horizontal layering + boat placement / horizontal layering + boat placement again. Preserve distinct strengths, but collapse same-target/same-effect praise so `What works` teaches 2–3 different transferable principles rather than paraphrases.

Do not force domain diversity if only one genuine strength exists. Fewer distinct strengths is better than repetitive filler.

### 12. Final freeze / acceptance criteria
This pass should be the final Improve Painting calibration pass unless live testing exposes a genuine regression or severe new defect.

After implementation and deployment, repeat the same three live paintings. Freeze this phase when:
- all three complete successfully on the first attempt; no 422/canonical failure;
- no duplicate same-target/same-effect recommendations;
- no broad road/background amplification without hierarchy limits;
- no asserted original process/brush/wash handling in observed-effect sections;
- no composition label/text contradiction with existing focal geometry;
- quality level, rationale and surviving recommendations are mutually consistent;
- every corrective recommendation is directly supported by linked visible evidence;
- rationale contains no unsupported/unrendered critique;
- no `more/softer/sharper/stronger` correction without evidence for that directional change;
- no repeated missing-colour sentence block;
- no user-facing `Related passages` generic label;
- `What works` is concise and non-repetitive;
- one provider call per analysis, no auto retry, existing quota/idempotency behavior intact;
- saved-result interactions still make zero provider calls/uploads/writes.

Once those conditions pass, **stop calibration changes and freeze Improve Painting for this phase**. Move to the next product phase instead of continuing micro-tuning.

## Regression tests

Add focused tests covering:
1. two wire recommendations with same target/effect collapse to one;
2. distinct wire mechanisms with different intended effects can both survive;
3. `introduce more value contrast in the road` is treated like `increase contrast` and requires location/taper/focal limit;
4. a qualified near-foreground road cue with taper and focal limit survives;
5. observed-effect text removes/rephrases `loose brushwork`, `soft washes create`, `using soft washes`, `defined brush strokes`, `sharper brushwork`, `controlled edges` without erasing supported visible qualities;
6. future-practice wording such as `try a wet-on-wet study` remains allowed;
7. central focal region cannot render `Off-centre focus` label;
8. clearly off-centre focal region cannot render `central focal point` wording;
9. uncertain/no focal geometry yields neutral positional teaching rather than invented placement;
10. competent + wholly positive rationale + only minor optional surviving advice triggers calibration review/Strong normalization only when safe; no invented issue;
11. multiple missing colour-evidence entries produce one shared note, not repeated sentences;
12. user-facing `Related passages` is removed/replaced while preserving region evidence;
13. insight whose lesson names a target/property problem absent from all linked facts is omitted/demoted, not invented;
14. matching linked fact allows the same insight to survive;
15. rationale limitation such as `perspective needs refinement` is not displayed unless a surviving linked elevation insight addresses perspective;
16. positive quality rationale remains intact when no limitation is supported;
17. already-soft edge evidence alone cannot produce corrective `soften further` advice;
18. an explicitly hard/competitive edge fact can support a soften recommendation;
19. a clearly framed optional comparison study can vary softness without being presented as a defect;
20. near-duplicate strengths collapse while distinct transferable strengths survive;
21. one-call/quota/idempotency/provider contract/model/token/schema/deployment architecture tests remain unchanged and passing.

## Validation
Run the complete existing test suite, frontend TypeScript, Edge TypeScript, configured/unconfigured exports, browser/responsive harness, legacy reopen, Create Reference, error/retry/dedup/quota states, and verify saved-result interactions still make zero provider calls/writes.

Use sanitized textual fixtures derived from the live outputs where useful; do not commit the user's real paintings.

Push implementation to `codex/live-calibration-hotfix`. Do not create another branch. Do not open a PR and do not merge. Report commit SHA, changed files, test counts, exact safeguards, and any deviation/limitation.
