# Final Improve Painting analysis-depth freeze pass

Baseline: `main` at `38e56bdfb4d19b35085e3e12a37b15e6b201a98a` after PR #30. This is the final bounded Improve Painting pass for the current phase.

The goal is twofold:
1. close the three remaining live logic/copy gaps;
2. deepen the in-app analysis so it reads like expert watercolor coaching rather than a short professional summary.

Do not redesign the UI or architecture. Do not add new features. Do not increase API cost. Do not add retries/calls/tokens. Do not start Phase 2.

## Architecture invariants

Keep unchanged:
- one new analysis attempt = exactly one provider/OpenAI call;
- no automatic retry or fallback provider call;
- `gpt-4.1-mini`;
- `max_completion_tokens = 3000`;
- persisted result version 1;
- quota, request dedup/idempotency, lost-response recovery;
- provider draft architecture and deterministic server canonicalization;
- auth, storage, RLS, SQL, secrets, dependencies, workflows;
- Create Reference and legacy saved-result compatibility;
- saved-result interactions/reopen = zero provider calls/writes;
- no image generation/editing/fake before-after/generated figures.

## A. Remaining live blockers

### A1. Strong normalization must be blocked only by supported material clear issues
Current code blocks display normalization to Strong when *any* raw canonical `clear_issue` exists, even if it was later removed because it was unsupported.

Change the blocker so only a **supported material clear issue** blocks upgrade.

Requirements:
- use existing supplied facts/insights only;
- a raw `clear_issue` that fails `insightAlignment`, lacks problem evidence, or is non-material must not by itself block Strong normalization;
- a genuinely supported material `clear_issue` must still block upgrade;
- zero recommendations alone must never prove Strong;
- preserve confidence >= 0.8, positive rationale, factual strength and uncertainty safeguards;
- stored canonical quality remains unchanged; display-only normalization only.

### A2. Hierarchy safeguards must also apply to strength-preservation actions
Live van output still contained:
`Preserve and slightly emphasize road curve contrast to strengthen visual flow.`

That is unsafe because road/path contrast amplification can compete with the focal subject.

Apply road/background hierarchy safety not only to corrective recommendations but also to strength-preservation actions in `What works`.

For road/street/path/lead-in strength actions:
- preserving existing curve/direction is allowed;
- increasing contrast/chroma/sharpness/darkness is allowed only if the wording specifies a local foreground cue, taper/recession, and explicit subordination below focal hierarchy;
- otherwise remove only the unsafe amplification clause while preserving the valid preservation principle;
- do not convert a strength into a correction;
- do not invent replacement teaching.

Also ensure central placement is not preserved as a universal formula; preserve the successful relationship instead.

### A3. Final observable-language cleanup
Live output still allowed generic process wording such as:
`Soft, diffused edges and washes create atmospheric mountain background.`

Observed/preserve sections must describe visible results only.

In observational context:
- `wash` / `washes` -> `colour passage` / `colour passages` when used as a description of the original painting;
- keep future-study method suggestions such as `try a wash`, `wet-on-wet study`, etc.;
- avoid awkward duplicates such as `Irregular visible texture visible...`;
- normalize obvious duplicate adjectives/words after cleaning;
- do not rewrite valid pigment-mix language or future-practice technique instructions.

## B. Analysis depth: move from summary to coaching

The current live analysis is much more accurate, but several sections are still too terse. The final product should provide **more teaching, not more filler**.

Do not add generic watercolor theory unrelated to the image. Every additional sentence must perform one of these jobs:
- explain what is visible;
- explain why it works or fails;
- explain the relationship to hierarchy/depth/mood/composition;
- give a transferable principle;
- specify a safe action or study;
- state a success cue.

Avoid repeating the same conclusion across Overall, What Works, Composition, Colour & Value, Technique and Practice.

### B1. Overall Assessment depth

Current examples such as `Strong use of light.` are too thin.

Target content for Overall rationale:
- roughly 2-4 concise sentences / ~45-90 words when source evidence supports it;
- explain the quality level using 2-3 painting-level relationships, not a single adjective;
- mention what establishes hierarchy/mood/spatial clarity;
- if Strong/Highly resolved, explain why no major correction is needed;
- if Competent/Developing, mention only limitations that have surviving evidence-supported guidance;
- no hidden critique;
- no generic praise such as `nice colours` or `good composition`;
- no person-skill judgement.

Do not hard-enforce minimum word count if the provider has insufficient supported content. Fewer accurate sentences are better than invented depth.

### B2. What Works depth

Each selected strength should teach a distinct principle.

For each strength, aim for this semantic structure when evidence permits:
1. Observation: what relationship is visible and where;
2. Why it works: effect on focal hierarchy / depth / balance / mood / readability;
3. Transferable principle: what relationship to preserve in future work.

Typical target: ~35-80 words per strength, 1-3 strengths total.

Do not:
- add exercises here;
- add hidden corrective language;
- repeat the same target/effect in different words;
- preserve a location/style choice as dogma (`keep it centered`, `always use thirds`).

Preserve relationships instead:
- value separation;
- directional flow;
- warm/cool relationship;
- edge hierarchy;
- mass balance;
- atmospheric recession.

### B3. How to Elevate depth

When a real recommendation exists, it should answer as many of these as supported:
- WHAT should change;
- WHERE in the image;
- WHY the current relationship is limiting;
- HOW MUCH / what hierarchy limit;
- EFFECT on the painting;
- HOW TO TEST safely.

Target: usually ~60-120 words per material recommendation, max 1-3 recommendations according to quality level.

Significant changes remain separate studies.

Do not expand a weak recommendation with generic theory. If the evidence does not support a detailed action, omit it rather than padding it.

### B4. Composition depth

Keep the current structured metadata (archetype, visible elements, entry/path/landing, masses, open/quieter space, counterbalance) but add or enrich the leading composition explanation when source data supports it.

The explanation should teach:
- dominant mass relationship;
- visual path / eye movement;
- focal placement relationship;
- counterweight / balance;
- role of quieter/open space;
- what compositional relationship is worth preserving.

Aim for ~50-110 words of composition explanation in total, not counting structured labels.

Do not define textbook composition rules generically.

### B5. Colour & Value depth

Current one-line summaries are often too report-like.

Enrich the existing fields without changing schema:
- `colourStrategy`: explain dominant palette relationship and what it does;
- `valueHierarchy`: explain which planes/masses are grouped and where strongest separation is reserved;
- `chromaHierarchy`: explain where chroma is concentrated/restrained and why;
- `temperatureRelationship`: explain warm/cool spatial or focal relationship;
- `technicalAssessment`: explain whether the colour/value hierarchy is coherent and why.

Each field should usually be 1-3 concise sentences where supported, not one generic sentence.

Teach relationships such as:
- compressed background values vs concentrated focal separation;
- focal chroma concentration;
- warm foreground vs cool recession;
- muted supporting masses;
- value grouping across large shapes.

Do not say `background should always be lighter` or other universal formulas.

### B6. Technique / observed effect depth

Keep this section observational.

It should explain not only what edge/texture differences are visible, but why those visible differences matter.

Useful structure:
- visible edge/texture/mark relationship;
- effect on depth/focus/atmosphere;
- what visible relationship is worth preserving.

Target ~50-100 words total when supported.

Never reconstruct original process. Use visible language only:
- soft/diffused transitions;
- sharper selected contours;
- broken/granular texture;
- broad colour passages;
- transparent-looking overlap;
- lost/found edges;
- mark density/economy when visibly supported.

Future practice can recommend techniques separately.

### B7. Practice depth

Practice should feel like a small instructor-designed experiment, not a generic exercise.

When a useful practice exists, include:
- duration/scale when reasonable (e.g. 10-15 minute small study);
- one controlled variable;
- what remains constant;
- comparison;
- success cue.

Typical target ~45-90 words.

Examples of controlled variables:
- value contrast;
- edge softness;
- chroma;
- temperature;
- spacing;
- figure scale.

Do not change more than one independent variable while claiming one-variable practice.

### B8. Strong painting behavior

Strong/Highly resolved paintings must not be forced to have corrective sections.

For Strong/Highly resolved:
- deeper analysis should come primarily from explaining *why the painting succeeds*;
- 0 corrective recommendations is valid;
- optional study may explore a stylistic alternative without implying defect;
- the teaching value should come from relationships worth preserving.

### B9. Competent/Developing behavior

For Competent/Developing:
- deeper explanation must still be concise and prioritized;
- material issue first;
- exact evidence location and relationship;
- no laundry-list critique;
- no invented flaw to create depth.

## C. Provider prompt strategy and token budget

Do not increase 3000 token cap.

Improve information density rather than raw length.

Prompt guidance should explicitly request:
- concise but substantive teaching;
- complete sentences;
- no generic filler;
- no repeated conclusion across domains;
- stronger explanation of why/effect/transferable principle;
- deeper recommendation only when evidence supports it.

Keep provider draft schema unchanged unless a tiny backwards-compatible textual clarification is strictly necessary. Prefer using existing text fields more effectively rather than adding fields.

Do not require every response to hit word minimums. Treat ranges as quality targets, not validation constraints. Never reject a valid response solely for being shorter.

## D. Frontend presentation

Do not redesign layout.

Keep:
- artwork-first workspace;
- existing accordions/sections;
- mobile stacking;
- desktop sticky artwork/inspector behavior;
- Clean / Notes / Composition / Roles controls.

Longer teaching must remain scannable:
- preserve paragraph spacing;
- do not add giant text walls;
- use existing field/card boundaries;
- do not add new tabs or panels.

If a section becomes long, rely on existing collapsible structure rather than truncating important teaching.

## E. Regression tests

Add focused tests covering at least:
1. unsupported raw clear_issue no longer blocks Strong display normalization;
2. supported material clear_issue still blocks Strong;
3. non-material clear_issue does not alone block Strong;
4. uncertainty/confidence safeguards still block unsafe upgrade;
5. road strength action `preserve and slightly emphasize road contrast` loses unsafe amplification while preserving safe direction/curve teaching;
6. fully hierarchy-qualified road preservation can survive;
7. background/focal strength actions obey same hierarchy principle;
8. observational `washes` becomes `colour passages`;
9. future-practice `wash` wording remains allowed;
10. duplicate `visible ... visible` wording is normalized;
11. Strong overall rationale can contain multiple supported teaching sentences without adding critique;
12. Competent rationale cannot mention a limitation without surviving guidance;
13. What Works can carry observation + why + preservation without being marked corrective;
14. duplicate strengths remain suppressed;
15. deeper colour/value text still remains evidence-supported and process-free;
16. technique text can explain effect on depth/focus without inferring process;
17. practice can include task + one variable + constant + success cue;
18. one-call/no-retry/model/token/quota/schema/idempotency invariants remain unchanged.

Do not create brittle exact-word tests for every expanded sentence. Test semantics/guards and stable user-facing requirements.

## F. Full validation

Run the complete existing suite plus new tests:
- frontend TypeScript;
- strict Edge TypeScript;
- configured and unconfigured web exports;
- full browser/responsive harness at 375/390/430/768/1024/1440/1800;
- legacy saved reopen;
- Create Reference;
- Clean/Notes/Composition/Roles;
- colour/crop/value evidence;
- retry/dedup/quota/lost-response states;
- 401/403/409/422/503;
- zero browser runtime errors;
- saved-result interactions/reopen = zero provider calls/uploads/writes.

Do not perform paid live provider calls in automated tests.

## G. Final live freeze gate

After merge/deploy, live-test the same three paintings:
- Church;
- Red Van;
- Abstract Boat.

Freeze Improve Painting for this phase if:
- all complete first attempt;
- no 422/canonical failure;
- Van/Boat quality is coherent with surviving material advice;
- unsupported hidden clear issues do not block safe Strong normalization;
- no unsafe road/background amplification in recommendation OR What Works preservation;
- observed technique contains no original-process claims, including generic `washes` as original method;
- no awkward duplicate cleaned wording;
- Overall gives substantive painting-level reasoning rather than one-line generic summary;
- What Works explains why and transferable principle;
- Colour & Value explains relationships, not just labels;
- Technique explains visible effect + why it matters;
- Practice is a true one-variable study with success cue when present;
- no repeated filler or cross-section duplication;
- one provider call per analysis and zero calls for saved-result interactions;
- architecture invariants remain unchanged.

When these pass, **freeze Improve Painting**. Do not continue micro-tuning for minor stylistic preferences.

## H. Final report

Push implementation only to `codex/final-analysis-depth-freeze`.

Do not create PR, merge or deploy.

Report:
- final SHA;
- working tree status;
- complete changed-file inventory;
- +/- counts;
- total/new tests and failures/skips/cancellations;
- frontend/Edge TypeScript;
- configured/unconfigured exports;
- browser/responsive results;
- exact implementation for the three residual blockers;
- exact prompt/content-depth changes for Overall, What Works, How to Elevate, Composition, Colour & Value, Technique and Practice;
- confirmation that provider schema/model/token/quota/calls/retry/auth/storage/RLS/SQL/dependencies/workflows/Create Reference remain unchanged;
- any deviation;
- remaining live-only limitations.
