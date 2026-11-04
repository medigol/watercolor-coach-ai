# Water & Brush Control: integrated teaching pilot

## Baseline and scope

Fetched remote `main` on 4 November 2026: `c2c5dd7468e3c0a25c9b6009ff035ca8cbe0f741`, unchanged from the reviewed PR #41 release. The working tree was clean. Source inspection confirms four lessons, one eight-step project, 27 canonical steps, 12 framework modules, 24 skills, 17 preview candidates, 18 proposed windows and zero approved media resources.

The baseline supplies useful short comparisons but gives little detail on wetting/loading the whole brush, the physical contact of tip and belly, joining wash passes, or how to distinguish similar-looking failures. Mobile hides the short concept paragraph with its diagram. Related research previews require leaving the lesson. These are teaching and integration gaps, not evidence that the existing curriculum or saved records should be replaced.

## Implemented architecture

`instructionTypes.ts` defines additive teaching units, controlled experiments, conditional diagnostics and a separate provisional-video link type. `waterInstruction.ts` authors the pilot. `instruction.ts` validates identities, canonical references, order, diagnostics, time totals and evidence-bound preview links. These are not `MediaResource` objects and cannot satisfy publication checks.

The canonical lesson route renders a selected focus within each existing step, with the physical action and original checklist near the top. Setup, concept, remaining physical actions, observation and controlled practice are visible without opening media or theory disclosures. The diagnosis focus exposes symptom selectors directly in the main instruction. A separate visual/reference column supplies original diagrams, fuller causal explanation, tips, optional related diagnosis and variations; mobile retains an independent visual-guide disclosure. Experienced self-reported learners can fold basic terminology and see the decision variation directly. All essential written teaching remains present for video-preferring learners.

Teaching-focus navigation is temporary reading state, not a second course, completion mechanism or stored competence score. It never writes progress. Reload resumes the same canonical step; the focus selector starts at that step’s first focus. The selected focus is retained while opening/closing its video. The UI does not claim that a sub-focus position was saved.

| Canonical step | Implemented focuses | Active estimate |
| --- | --- | --- |
| `look` | Three independent water decisions; controlled load comparison | 5 min |
| `set-up` | Materials and working size; loading the round brush; contact and movement | 15 min |
| `dilution` | A connected flat wash; two rows comparing dry concentration | 15 min |
| `moisture` | Surface stages; dry/damp comparison; a safe diagnostic repeat | 15 min |
| `reflect` | Dry comparison, observed relationship, uncertainty and transfer | 5 min |

Total: approximately **55 active minutes** (18 reading, 37 practice), with individual focuses of 3–8 active minutes. Watching and material-dependent drying are additional. The original short comparison remains available for short visits. Nothing forces a timer or automatic advance.

## Representative teaching changes

Before, setup says: “Wet the brush, load the belly from a small colour puddle and touch it lightly to the palette edge.”

The added loading focus explains how to wet through the hairs, avoid a dry interior or hanging drop, bring the tip and belly through the premixed colour, test the beginning/middle/end of a stroke, unload lightly and repeat on fresh scrap. It explicitly separates changing the brush’s liquid reservoir from diluting the palette mixture.

Before, the drying warning says: “Do not scrub a partly drying stroke. Let it dry and start another.”

The diagnostic guide now connects a lighter bloom and darker rim to possible water imbalance, asks whether sheen was already disappearing or an edge pool fed back, proposes a fresh one-variable comparison, and says when to leave the original passage alone. It also recognises intentional blooms and texture.

Before, mobile’s “Do” list leads directly to a checklist while the concept is optional. The new focus has a practical first action, then visible setup, technical distinction, sequenced hand actions, observation and a controlled experiment with constants and dry-result criteria. The old practice checklist remains its original record; it is not replaced with new mastery claims.

## Technical accuracy and instructional coherence

The sequence is: distinguish controls → arrange materials → establish delivery → compare contact → connect a wash → vary concentration → read the surface → compare conditions → diagnose a fresh test → reflect and transfer. Each focus includes an explicit transition. No three-value or advanced urban video is represented as brush-loading evidence.

Original diagrams distinguish the three controls, tip/belly contact, an advancing wet join/small bead and dry/damp/standing-water conditions. They are labelled teaching diagrams, not physical paintings, footage or quantitatively simulated pigment behaviour. Their text alternatives explain both the concept and its limitation.

No fixed brush angle, mixture ratio, inclination or drying duration is prescribed. Brush size/shape/hair, actual load, paper sizing/texture/thickness, pigment concentration/properties and room conditions affect results. A wet sheen and internal dampness are distinguished. Soft edges, lost contours, lifting, softening and glazing are not interchangeable. Granulation, neutral colour, diffusion and broken texture are not automatically mistakes. Corrections to wet pools are conditional; uncertain or partly drying passages are left alone.

### Two challenged learner scenarios

1. **Small wash flooded by a wet brush:** the learner checks for a hanging drop, standing water and incline. Only if the passage remains wholly wet does the guide suggest touching the excess pool with a clean blotted brush. When sheen is disappearing, it says to stop. The next scrap test changes load or incline separately, keeping concentration steady.
2. **Unintended backrun after a late wet touch:** the learner checks the earlier surface state and nearby pools, leaves the forming bloom alone, and tries a fresh comparison with earlier timing *or* more comparable delivery. The guide explicitly avoids scrubbing or repeatedly adding water. An expressive bloom can remain if it serves the intention.

These are inspected instructional decision paths, **not reports of physically performed painting trials**. An instructor/owner must still assess how a real beginner applies them.

### Explicit self-review

Reviewer: Codex author/self-review; no independent instructor approval. Every one of the ten units is assessed against all ten categories in the machine-readable [validation record](mentor-grade-watercolour-instruction-validation.json). PASS means evidence supports the bounded claim below, not artistic certification.

| Category | Self-review outcome and basis |
| --- | --- |
| Technical accuracy | NEEDS HUMAN REVIEW: consistent with inspected manufacturer principles; detailed application still needs instructor/owner judgement. |
| Physical specificity | PASS based on inspected authored actions: brush contact, delivery, surface, observation and stop decisions are stated. |
| Causal clarity | PASS based on inspected concept/why/experiment fields; hypotheses remain conditional. |
| Learner-level suitability | NEEDS HUMAN REVIEW: terminology and experienced variations are present, but no human learner study occurred. |
| Continuity | PASS based on inspected transitions, canonical ordering and reference validation. |
| Practical reproducibility | NEEDS HUMAN REVIEW: controlled variables/constants and outcomes exist; no physical paint trials were performed. |
| Diagnostic correctness | NEEDS HUMAN REVIEW: plausible alternatives and safe stops are explicit; no appearance-only certainty or universal repair. |
| Material variation | PASS based on inspected normal-variation, dry-comparison and material caveats. |
| Accessible presentation | PASS for the executed browser/keyboard/reflow scope in the validation record; full WCAG conformance is not claimed. |
| Video/evidence alignment | PASS for references and honest provisional labels; exact footage matching remains open. |

### Inspected supporting sources

Fetched successfully with normal certificate-verified HTTPS on 4 November 2026; source prose was inspected, not merely a search snippet. No passages, photographs or video frames are reproduced.

- [DANIEL SMITH / Carmen Gardner: Four basic watercolor washes](https://danielsmith.com/tutorials/extra-fine-watercolors/four-basic-watercolor-washes/) — prepared puddle, wet/dry starting approaches, reloading, wet-edge continuity, excess liquid and stopping. Its particular materials/board angle are examples, not mandatory prescriptions in this lesson.
- [DANIEL SMITH: Watercolor for beginners](https://danielsmith.com/tutorials/watercolor-for-beginners/) — tip/full-brush use, water containers, palette/cloth, wet-on-dry/wet-on-wet, pigment properties, glazing, lifting and dry appearance. The pilot adds cautious material-dependent comparisons rather than assuming every pigment and sheet behaves alike.
- [YouTube IFrame API](https://developers.google.com/youtube/iframe_api_reference), [player parameters](https://developers.google.com/youtube/player_parameters), [API terms](https://developers.google.com/youtube/terms/api-services-terms-of-service) — official object-form cue/load, absolute endpoints, `seekTo` invalidating end restrictions, minimum 200×200 viewport, controls/origin and privacy obligations. Existing official-player implementation is reused; no legal certification is claimed.

## Inline media and remaining evidence

The [machine-readable crosswalk and exact 27-step rollout](mentor-grade-watercolour-crosswalk.json) records every unit’s outcome, exercise, illustration, reference, source window, provenance and unresolved inspection.

- **Steve, `alq0YqX86gs`, 47–702s:** two teaching points reference the **same longer owner proposal**. Neither is described as a separately verified loading/wash clip. Actual actions and shorter boundaries still need inspection.
- **Louise, `UeIHo83pVGc`:** surface-reading context can open the owner’s **90s start-only** proposal without an end. The dry/damp comparison separately references publisher hints **109–410s** and **515–758s**. These are chapter proposals, not certified clips.
- No video is assigned to reflection. All six existing no-video steps remain protected. No softening video is claimed to prove a lost contour. The Café 138s conflict is not used; all candidates/hints, Paul and all three Javid records remain unchanged in discovery.

One explicit inline Watch mounts the existing `PreviewVideoPlayer` with the exact reference ID/window, using the existing official frame/controller. Multiple references share one active selection. Opening another, switching focus/step, opening approved media or leaving the route disposes the old frame. Closing focuses the current physical experiment; no playback event writes a checklist, note or completion. Replay restores absolute boundaries; seeking remains approximate. Third-party connection waits for a deliberate gesture; official controls/ads/branding and external original links remain accessible.

No new live YouTube/footage diagnostics were attempted. Browser video frames are synthetic API responses. Availability, narration, actual captions, exact action matching and final clip approval remain unverified. The approved catalogue is still empty. Private owner review and JSON export remain in their separate library mode.

## Saved work and safe rollout

No lesson ID, step ID, checklist ID/wording, version, storage key/schema, reflection, completion rule, provider, auth, Supabase/RLS, quota, artwork assessment or production source lock changes. A snapshot regression compares all five canonical item contracts against fetched `main`. Old partial work resumes its step; completed work retains its reflection and completion, with an explicit note that extended teaching did not reassess it.

Only timing and a safer fresh-test/short-session summary change in the canonical Water & Brush record. The other three lessons and project content are unchanged. No migrations, dependencies, paid AI calls, learner uploads, merge or deployment.

Next rollout is editorially gated, not automated bulk expansion:

1. **Three-value planning:** observed grouping → connected masses → contrasting alternatives → dry/distance comparison → reflection. Preserve every existing step/checklist; verify Paul’s actual grouping sequence before an exact clip.
2. **Edges:** hard → soft → genuinely lost relationships with moisture/value controls. Keep the lost-contour demonstration gap open until inspected evidence exists.
3. **Observed structure:** envelope/proportion → related edges/horizon → controlled simplification → transfer. Verify Tim’s actual explanation before offering exact segments; Javid remains optional advanced comparison.
4. **Eight-step landscape:** retain `intention`, `values`, `wash-plan`, `sky`, `hill`, `bank`, `finish`, `reflect`. Enrich decisions and conditional diagnosis per stage; preserve drying/resume and keep intention/reflection video-free. Review focal decisions as choices, not mandatory darkening/detail.

Owner review is needed for technical/learner suitability, real physical failure scenarios, and whether the related footage actually supports each proposed teaching point. Do not repeat the four already supplied clarity/fit screenings. No exact clip is approved by reviewing this UI.

## Screenshots and validation

[Executed commands, counts and limitations](mentor-grade-watercolour-instruction-validation.json). Captures are the actual exported app with synthetic accounts, original diagrams and simulated provider frames; they contain no private artwork or copied footage.

| View | Before | Implemented pilot |
| --- | --- | --- |
| Mobile lesson | ![Before](screenshots/mentor-instruction/before-mobile.png) | ![After](screenshots/mentor-instruction/after-mobile.png) |
| Desktop lesson | ![Before desktop](screenshots/mentor-instruction/before-desktop.png) | ![After desktop](screenshots/mentor-instruction/after-desktop.png) |

[Inline before load](screenshots/mentor-instruction/inline-before.png) · [Synthetic player](screenshots/mentor-instruction/inline-synthetic.png) · [Diagnosis](screenshots/mentor-instruction/diagnosis.png) · [Physical exercise](screenshots/mentor-instruction/practice.png).
