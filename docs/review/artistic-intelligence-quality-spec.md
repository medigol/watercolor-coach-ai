PROJECT: medigol/watercolor-coach-ai

TASK: FINAL ARTISTIC INTELLIGENCE, USER-FACING COPY, AND PRODUCT QUALITY PASS

ROLE
Act as a senior watercolor instructor, computer vision engineer, AI application architect, product designer, accessibility reviewer, and production-quality software engineer.

This is an implementation task. Inspect, diagnose, correct, test, and deliver the changes. Do not stop after an audit or recommendations.

PRIMARY OBJECTIVE

Bring the existing artwork critique and visual coaching feature to a credible, polished, production-quality standard.

The system must provide artistically defensible observations, useful individualized teaching, appropriately calibrated judgments, meaningful visual evidence, and professional English throughout the user experience.

Prioritize correctness, trust, clarity, and teaching value over output length, elaborate visual effects, or artificially positive assessments.

The existing feature is functionally mature. Do not rebuild it, introduce unrelated features, or perform speculative architectural refactoring.

REPOSITORY CONTEXT

Repository:
medigol/watercolor-coach-ai

Existing release candidate:
codex/artwork-critique-release-candidate

Verified release candidate commit:
61fab6afe1a3e491632b969fb58f20fbce3e7fb9

Existing integration PR:
#35

Start by fetching and inspecting current remote refs and the status of PR #35.

Create a dedicated quality-improvement branch from the latest appropriate integrated candidate.

If PR #35 remains open, preserve it and use a stacked PR targeting its head branch where appropriate. If it has been merged, branch from current main.

Do not silently modify, overwrite, merge, close, or deploy PR #35.

Relevant implementation areas include, but are not limited to:

- supabase/functions/_shared/prompts.ts
- supabase/functions/_shared/contract.ts
- supabase/functions/generate-feedback/
- shared/artworkEligibility.ts
- shared/providerPaintingAnalysis.ts
- shared/paintingAnalysis.ts
- shared/coachingEvidence.ts
- shared/coachingDecision.ts
- shared/visualMetadata.ts
- components/PaintingAnalysisWorkspace.tsx
- Components responsible for image evidence, colour/value displays, notes, overlays, and saved results
- Existing tests and benchmark infrastructure

These paths are starting points, not a mandate to modify every file.

Review the actual code and test architecture first.

==================================================
1. INVESTIGATE REAL-WORLD QUALITY FAILURES
==================================================

Use the following four actual user-observed outputs as regression scenarios.

The original source artwork files may not be accessible in this Codex environment. Do not pretend screenshots or pasted descriptions are equivalent to original image bytes.

CASE A: RED VW VAN AND MOUNTAIN

Observed strengths:
- The red vehicle is a plausible primary focal subject.
- The mountain provides a large supporting background.
- Warm/cool relationships and atmospheric softness are relevant.

Potential failures:
- Confusing red/blue hue contrast with luminance/value contrast.
- Overconfident statements that vehicle perspective and proportions are accurate.
- Repeated descriptions of the same focal relationship.
- Two evidence regions carrying substantially identical observations.
- Generic preservation advice without meaningful teaching.

Investigate and correct these behaviours when reproducible.

CASE B: CHURCH SPIRE AND STREET

Observed strengths:
- Dominant vertical church spire.
- Warm illuminated street and cooler shadow areas.
- Directional movement through streets and overhead wires.
- Relevant hard/soft edge teaching.

Potential failures:
- Composition geometry implying unsupported precision.
- Diagonal guides or triangles not clearly corresponding to useful artistic relationships.
- Inferring lifting or negative painting as the original process from a finished image.
- Repeated warm/cool and focal-hierarchy commentary.
- Unsupported claims about exactly how the painting was produced.

CASE C: BOAT AND HORIZONTAL COLOUR BANDS

A saved analysis displayed a recursively nested screenshot of the application within the displayed painting.

Determine the true cause.

Possible causes include:
- The user uploaded a screenshot containing the app interface.
- The wrong source image was selected or saved.
- Crop/preparation failed to isolate the artwork.
- Preview or saved-image mapping used an incorrect image.
- The model accepted an unsuitable screenshot.

Do not select a root cause without evidence.

If the original input was a UI screenshot, the eligibility system should identify the issue and offer a clear correction path.

If the application generated or selected the nested image incorrectly, fix that source-mapping or preparation defect.

Preserve valid watercolor paintings that merely contain photographed paper edges or minor surrounding context.

CASE D: CARE BEARS ILLUSTRATION

The app confidently described a cartoon colouring-page-style image as a watercolor painting.

The actual physical medium is uncertain from the supplied screenshot; it could involve pencil, marker, another medium, or watercolor.

Do not assume a medium with certainty.

Investigate:
- Medium recognition.
- Confidence calibration.
- Overconfident watercolor terminology.
- Whether the existing uncertain-artwork eligibility path should be used.
- Unsupported advice about washes or watercolor techniques.

The model should not automatically reject all illustrations, cartoon artwork, mixed media, or stylized watercolors.

The decision must depend on available evidence and the product's actual watercolor scope.

==================================================
2. IMPROVE ARTWORK ELIGIBILITY
==================================================

The existing eligibility contract already supports accepted, rejected, and uncertain outcomes.

Retain that architecture where practical.

Improve reliability for:
- Original watercolor artworks.
- Works in progress.
- Loose and abstract watercolor.
- Monochrome watercolor.
- Watercolor-dominant illustration.
- Genuine paintings photographed on a desk.
- Screenshots containing application interfaces.
- Colouring pages and non-watercolor media.
- Digital watercolor-style images.
- Photographs of real scenes.
- Reproductions and ambiguous inputs.
- Images requiring cropping.
- Mixed-media artwork.

Apply conservative, evidence-based decisions.

When the medium cannot be determined confidently, express uncertainty rather than inventing certainty.

Do not falsely describe an ordinary photograph, screenshot, printed illustration, or ambiguous image as an original watercolor.

Do not reject valid artwork merely because it is amateur, stylized, incomplete, or has visible paper borders.

Retain the single-call eligibility architecture unless a demonstrated issue justifies a separately approved architectural change.

Do not introduce extra paid model calls.

Ensure rejection or uncertainty is reflected consistently in the UI, API response, quotas, storage cleanup, and retry flow.

==================================================
3. CALIBRATE ARTISTIC QUALITY ASSESSMENTS
==================================================

Investigate why the four supplied analyses all received:

"Strong painting"
"No major issue detected."

Four examples are not sufficient evidence of systematic positivity bias.

Do not force a range of ratings or invent faults to make the assessments appear more discriminative.

Instead, establish evidence-based criteria for:

DEVELOPING
Significant observable limitations in important pictorial relationships.

COMPETENT
Several relationships work, but meaningful and observable improvements remain.

STRONG
Most important artistic relationships are successful, with limited or optional refinements.

HIGHLY RESOLVED
Highly coherent pictorial decisions supported by specific evidence, without implying universal or objective perfection.

Judge the artwork, not the artist's identity, experience, age, or ability.

Quality assessments must:
- Explain the actual visual evidence.
- Match the improvement recommendations.
- Avoid generic compliments.
- Avoid invented deficiencies.
- Preserve artistic intent.
- Allow a genuinely successful painting to have no major correction.
- Identify important limitations when they are clearly visible.

Do not use artificial numerical quality scores.

==================================================
4. IMPROVE ARTISTIC ACCURACY
==================================================

Audit all critique-generation and validation paths.

COMPOSITION
Analyse:
- Primary and secondary focal relationships.
- Visual weight and balance.
- Large shapes and mass relationships.
- Negative and quiet space.
- Eye movement when genuinely supported.
- Perspective and spatial structure.
- Relationships between foreground, middle ground, and background.
- Atmospheric depth.
- Subject emphasis and competing elements.

Avoid forcing composition templates onto artworks.

A central subject, symmetry, abstraction, or unconventional arrangement is not automatically a defect.

COLOUR AND VALUE
Explicitly distinguish:
- Hue contrast.
- Value/luminance contrast.
- Chroma/saturation contrast.
- Colour temperature.
- Warm/cool spatial relationships.

Do not infer a strong grayscale contrast merely from contrasting hues.

Verify value claims against the image's actual tonal relationships where possible.

If the evidence is uncertain, soften or omit the claim.

TECHNIQUE
Distinguish:
A. Observable visual effects.
B. Possible ways to reproduce those effects.
C. Unknown original painting processes.

Never present an inferred process as a verified historical fact.

For example, use:
"The sky shows soft transitions and selectively preserved light areas."

Not:
"The artist created the clouds using lifting and negative painting."

Unless the original process is independently documented.

DRAWING AND PERSPECTIVE
Do not casually declare complex objects structurally accurate.

If perspective is assessed, support it with observable relationships.

ARTISTIC INTENT
Do not automatically recommend greater realism, stronger contrast, more detail, or conventional balance.

Ask whether an artistic decision supports the work's existing visual intention.

==================================================
5. REMOVE REDUNDANCY AND EMPTY TEACHING
==================================================

Audit generated content and UI projections for semantic duplication.

Common failures:
- Repeating the focal point in every section.
- Repeating warm/cool contrast without new insight.
- Duplicating "Original painting evidence" captions.
- Multiple evidence crops with essentially identical teaching.
- Repeating the same preservation recommendation.
- Repeating the same explanation in Overall, Composition, and Colour & Value.

Each section must have a distinct instructional purpose.

OVERALL:
The principal assessment and highest-value takeaway.

WHAT WORKS:
Specific successful artistic decisions and their effect.

COMPOSITION:
Spatial organisation, structure, visual weight, movement, and balance.

COLOUR & VALUE:
Actual palette, tonal relationships, chroma, and temperature.

VISIBLE TECHNIQUE:
Observable edges, textures, marks, and paint-like effects.

IMPROVEMENTS:
The most important supported change or optional refinement.

PRACTICE:
A focused exercise that teaches a transferable skill.

Prefer a shorter, more insightful analysis to a longer repetitive one.

Do not achieve brevity by removing necessary evidence or explanation.

==================================================
6. PROFESSIONALISE ALL USER-FACING ENGLISH
==================================================

Conduct a complete editorial and UX-copy review of the critique journey.

Scope includes:
- Screen titles.
- Section headings.
- Buttons and toggles.
- Image captions.
- Overlay instructions.
- Evidence labels.
- Progress and loading messages.
- Error messages.
- Eligibility notices.
- Saved-result messages.
- Empty states.
- Practice instructions.
- Quality assessments.
- AI-generated explanatory text.

Target tone:
Professional, clear, concise, precise, calm, supportive without flattery, and suitable for an international adult learner.

Use natural, accessible English with consistent Australian English spelling where appropriate.

Avoid:
- Robotic filler.
- Overly enthusiastic praise.
- Repeated wording.
- Unnecessary technical jargon.
- Internal engineering terminology.
- Unexplained labels.
- Awkward or incomplete sentences.
- False promises.
- Overconfident artistic claims.
- Blaming users for errors.

Suggested terminology, subject to UX review:

"Complete Painting Analysis" -> "Painting Assessment" or "Artwork Critique"

"What works" -> "What Works" or "Strengths"

"Colour & Value" -> retain, with consistent capitalization.

"Watercolor technique" -> "Visible Techniques" or "Edges & Technique", when the actual medium is supported.

"Recreate this look" -> "Colour-Mixing Starting Points"

"Practice & Studies" -> "Suggested Practice"

"Clean" -> "Original" or "Hide Annotations"

"Notes" -> "Coaching Notes"

"Roles" -> "Visual Roles"

"Composition" -> retain.

Choose final labels based on actual available screen space and clarity.

Do not mechanically replace strings if doing so breaks established product meaning.

Avoid duplicated headings such as:
"Your painting"
"Your painting"

Avoid displaying repeated text such as:
"Original painting evidence:"
before multiple identical observations.

Prefer one concise caption linked to a clearly identified image region.

The final UI should read like a professional art instructor's assessment, not raw structured AI data.

==================================================
7. DEFINE CLEAR USER MESSAGES
==================================================

Adopt the following examples as editorial starting points, not mandatory strings in every situation.

UNSUPPORTED SCREENSHOT
"This image appears to include a screenshot or app interface. Upload the original artwork, or crop the image to show only the painting."

UNCERTAIN MEDIUM
"We couldn't reliably identify the painting medium. Please upload a clearer image of the artwork. Watercolor-specific advice may not apply to other media."

CROP REQUIRED
"Please crop the image to include one artwork, with as little surrounding background as possible."

ANALYSIS IN PROGRESS
"Analysing your artwork. This may take a moment."

ALREADY IN PROGRESS
"An analysis request is already in progress. Check My Artworks before submitting again."

ANALYSIS UNAVAILABLE
"We couldn't complete the analysis. Please try again."

NO MATERIAL IMPROVEMENT IDENTIFIED
"No significant issues were identified from this image. The optional study explores a different artistic approach rather than correcting a fault."

NO PRACTICE SUGGESTION
"No additional exercise is needed for the observations in this assessment."

SAVED RESULT
"Your assessment is saved in My Artworks."

SOURCE IMAGE UNCLEAR
"Some details are difficult to assess in this image. A clearer photograph or scan may improve the feedback."

These messages must only appear when the underlying condition is actually established.

Do not tell users an analysis has been saved before persistence succeeds.

Do not promise that an unsuccessful operation has not consumed quota or incurred cost unless backend accounting guarantees it.

Use existing error codes and explicit recovery actions.

Keep messages understandable without exposing internal schemas, model IDs, database operations, or provider failures.

==================================================
8. IMPROVE VISUAL COACHING
==================================================

Review the original-image annotation system.

Ensure:
- Markers reference real visual regions.
- Labels correspond to the correct observation.
- Coordinates remain aligned after resizing and cropping.
- Notes are not duplicated.
- Geometry has an identifiable teaching purpose.
- Arrows show supported directional relationships.
- Areas, triangles, diagonals and focal markers do not imply unsupported precision.
- Selected notes are visually distinguishable.
- Text and diagrams never contradict each other.
- Mobile touch targets remain accessible.
- Overlays remain readable without obscuring the artwork unnecessarily.

Prefer zero annotations over unreliable annotations.

Avoid creating visual geometry merely because an archetype is available.

Use simpler visual guidance when exact coordinates or relationships are uncertain.

Ensure saved results reopen consistently without new provider calls or writes.

==================================================
9. REFINE PIGMENT AND PRACTICE GUIDANCE
==================================================

Inspect the current pigment recreation suggestions.

Do not imply the app has identified actual pigments from image pixels.

Avoid unsupported precision in mixing ratios.

When pigment recommendations are useful:
- Label them as approximate starting points.
- Explain the intended visible colour relationship.
- Allow for pigment strength and brand differences.
- Prefer optional experimentation rather than exact recipes.
- Never confuse digital RGB colours with verified pigment identity.

A suggested mixture should be plausible and useful, not merely syntactically valid.

Practice exercises should:
- Address an observed artistic relationship.
- Have a clear learning objective.
- Change one meaningful variable where possible.
- Specify what to compare.
- Be feasible for a watercolor learner.
- Avoid unnecessary repetition.
- Preserve the original artwork by using separate paper for substantial experiments.

Do not invent a practice task merely to populate the interface.

==================================================
10. INVESTIGATE IMAGE DETAIL AND MODEL LIMITATIONS
==================================================

Current production generation reportedly uses:
- gpt-4.1-mini
- image detail: low
- one provider call
- structured output
- 3,000 completion-token limit

Verify against actual code.

Investigate whether low-detail image input may contribute to:
- Incorrect medium recognition.
- Screenshot/UI misclassification.
- Missed fine detail.
- Text interpretation errors.
- Unsupported region selection.
- Value or compositional misreading.

Use the existing benchmark harness where feasible.

Do not assume higher detail is automatically better.

Do not change the production model, image detail, token cap, call count, or provider architecture without controlled evidence.

Prepare comparison tests and clearly state whether they were actually executed.

Do not call paid endpoints or transmit private artwork externally without approval.

==================================================
11. BACKWARD COMPATIBILITY
==================================================

Existing saved critiques must remain readable.

Do not silently overwrite or retroactively reinterpret historical AI responses.

If a new contract or version is genuinely needed:
- Maintain explicit compatibility with canonical v1.
- Add tested migration/adaptation logic where appropriate.
- Avoid irreversible changes.
- Preserve saved image mapping and ownership.
- Do not mutate production data.

Separately handle:
- Presentation improvements that safely apply to old results.
- New model-generated improvements that only apply to future analyses.

Validate old and new saved-result rendering.

==================================================
12. VALIDATION AND ACCEPTANCE
==================================================

Create a focused regression matrix covering:

- Genuine watercolor.
- Strong watercolor.
- Developing watercolor.
- Work in progress.
- Abstract watercolor.
- Monochrome watercolor.
- Watercolor-style illustration.
- Ambiguous medium.
- Coloured illustration or colouring page.
- Photograph.
- App screenshot.
- Screenshot with nested artwork.
- Artwork with minor paper/desk borders.
- Rotated or poorly cropped artwork.
- Low-detail image.
- Large or complex composition.
- Previously saved critique.

Where real original artwork is unavailable, mark image-quality results UNVERIFIED.

Do not substitute synthetic fixtures as proof of model perception.

Add deterministic tests for:
- Eligibility contract.
- Message selection.
- Failure/retry handling.
- Saved-result compatibility.
- Duplicate suppression.
- Responsive layout.
- Overlay bounds.
- Image source integrity.
- Accessibility.
- Semantic output consistency where objectively testable.

Use actual provider outputs for artistic acceptance only with explicit authorization.

Review real outputs using a human-readable evaluation rubric:
- Object/subject accuracy.
- Medium uncertainty.
- Composition accuracy.
- Value accuracy.
- Colour accuracy.
- Technique honesty.
- Quality-level justification.
- Actionability.
- Repetition.
- Visual evidence alignment.
- Professional language.
- Overall teaching usefulness.

Run all relevant existing tests:
- Full unit/integration suite.
- Frontend TypeScript.
- Strict Edge TypeScript.
- Configured and unconfigured builds.
- Chromium browser validation.
- Image preparation tests.
- Saved-result regressions.
- Relevant security and database tests if affected.
- Benchmark dry-run checks if affected.

Do not report passing tests that were not executed.

==================================================
13. EXECUTION AND SCOPE CONTROL
==================================================

Implement confirmed corrections.

Fix root causes, not just visible symptoms.

Avoid hardcoded responses tailored to the four examples.

Do not introduce rules that overfit these examples and damage performance on other legitimate watercolors.

Avoid broad regex-based deletion of AI prose that may destroy valid teaching content.

Prefer reliable prompt, schema, validation, and presentation changes with targeted regression coverage.

Keep the following protected unless a demonstrated defect requires an approved change:
- Authentication.
- Quotas.
- RLS.
- Storage ownership.
- Credentials.
- Live database.
- Production configuration.
- Billing.
- Deployment workflows.
- Unrelated application features.

Do not introduce personalized courses, YouTube integration, community features, or Phase 2.

Do not merge or deploy.

Commit and push verified implementation changes to the dedicated quality branch.

Where GitHub API access prevents PR creation, report the exact limitation and provide a working compare URL.

Do not abandon unfinished work merely because one tool fails.

==================================================
14. DEFINITION OF DONE
==================================================

The implementation is complete when:

1. All confirmed reproducible quality-related engineering defects in scope are corrected.
2. Eligibility decisions and user messages are consistent.
3. UI text is professionally edited and consistent.
4. Visual annotations are grounded and accessible.
5. Duplicate content is meaningfully reduced without losing teaching value.
6. Quality-level logic does not systematically force praise or criticism.
7. Unsupported technique and perspective claims are handled appropriately.
8. Previous saved analyses remain accessible.
9. Security and operational protections remain intact.
10. All relevant automated checks pass.
11. Any unverified real-model artistic results are explicitly separated from engineering completion.
12. Changes are committed and pushed.

FINAL REPORT

Provide:

A. Branch and final commit SHA.
B. Actual files changed.
C. Confirmed defects and root causes.
D. Corrections implemented.
E. Before/after examples of improved user-facing copy.
F. Prompt/schema/model changes, if any.
G. Test commands and actual results.
H. Real artistic-quality evidence versus synthetic coverage.
I. Remaining P0/P1/P2 defects.
J. External blockers and exact owner actions.
K. PR link or GitHub compare link.
L. Final verdict: READY / CONDITIONALLY READY / NOT READY.

Explicitly state whether the critique-quality engineering phase can be closed.

IMPORTANT FINAL INSTRUCTION

This is the final focused quality pass for the existing critique feature.

Deliver real corrections, not another large speculative roadmap.

Do not create endless new tasks.

Do not exaggerate quality or readiness.

Finish all work safely possible with the currently available repository, tools, evidence, and permissions.

Preserve the existing working application while producing a substantially more reliable, polished, and professional final-user experience.