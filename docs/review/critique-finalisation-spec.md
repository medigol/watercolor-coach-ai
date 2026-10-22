PROJECT: ArtMentor AI / Watercolor Coach AI
TASK: FINAL COMPLETION, HARDENING, INTEGRATION AND RELEASE READINESS OF THE EXISTING ARTWORK CRITIQUE AND VISUAL COACHING FEATURE

You are acting as the final senior engineering, architecture, QA, UX, security and AI-quality reviewer for this application.

This is an implementation task, not merely an audit, planning exercise or benchmark infrastructure task.

PRIMARY OBJECTIVE

Finish the existing artwork critique and visual coaching capability comprehensively. Identify and implement all justified missing work, fix confirmed defects, complete incomplete integrations, strengthen reliability, and validate the entire existing user experience end to end.

Deliver a stable, coherent, maintainable release candidate.

Do not expand the project into the future personalised training system, course generation, YouTube integration, social features or other Phase 2 work.

IMPORTANT PROJECT CONTEXT

The latest benchmark implementation is on:
codex/model-evaluation-harness
Final reported commit:
dc61aaef83bcb8f1e40465d050404a4563fd2b64

An earlier composition/critique improvement branch was:
codex/image-local-composition-coaching
Reported commit:
9552c2f62a2dbb9f1b1e6c6918488c3fafd4906d

These identifiers are contextual references, not proof that the work has been merged or is present in the current checkout.

Inspect the actual repository, available branches, merge bases, commit history and current feature implementation. Do not assume either branch has been integrated.

The recent benchmark report claimed 1,663 passing tests, an isolated four-arm comparison harness, no production behaviour changes, no paid requests and no deployment. Independently verify relevant claims from actual source and test results.

EXECUTION PRINCIPLES

1. Inspect before changing.
2. Implement justified corrections rather than merely recommending them.
3. Prefer correcting root causes over adding guards that conceal defects.
4. Avoid speculative refactoring, unnecessary abstraction or feature creep.
5. Maintain strict consistency across UI, frontend types, backend schemas, prompts, validation, persistent data and documentation.
6. Preserve production security, privacy, authentication, quota and storage behaviour.
7. Protect real user data.
8. Do not fake artistic validation with synthetic fixtures.
9. Never claim success for an unexecuted test.
10. Do not stop after the first successful test run if verified problems remain.

PHASE 1 — REPOSITORY AND INTEGRATION RECONCILIATION

Inspect the complete repository and identify:

- Current branch, HEAD and working-tree status.
- Relevant critique, composition, visual coaching and benchmark branches.
- Changes present on each branch but absent from the release target.
- Conflicting or overlapping implementations.
- Uncommitted work and existing changes that must be preserved.
- Architecture and dependency boundaries.
- Actual user-facing feature flows.
- Existing test coverage and technical documentation.
- Known defects, TODOs and deferred items relevant to this feature.

Ensure that all relevant completed critique and composition functionality is integrated into a single coherent release-candidate branch.

If cherry-picking or merging prior work is necessary, do so carefully into a dedicated integration branch, resolving conflicts using the current architecture as the source of truth. Preserve unrelated work.

Do not assume the latest benchmark branch contains the previous critique enhancements.

Document exactly what was integrated, omitted or superseded.

PHASE 2 — COMPLETE USER JOURNEY

Audit and complete the entire existing journey:

Artwork selection -> image upload -> validation -> preparation -> AI analysis -> structured critique -> visual annotations -> actionable improvements -> optional practice suggestions -> saved results -> later viewing.

Cover:

- Valid and invalid image formats.
- Oversized images and upload limitations.
- JPEG orientation and EXIF handling.
- Image resizing, compression and aspect-ratio preservation.
- Cropping and coordinate transformation.
- Colour fidelity and visual quality.
- Network interruption.
- Authentication expiration.
- Session recovery.
- Loading, timeout, retry and cancellation behaviour.
- Duplicate submissions and accidental repeated requests.
- Clear user-facing error explanations.
- Data persistence and retrieval.
- Refresh, back navigation and repeat viewing.
- Small mobile screens and touch interactions.
- Tablet and desktop layouts.
- Keyboard interaction and accessibility.
- Browser compatibility within the project's supported environments.

Fix reproducible failures, broken journeys, misleading behaviour and preventable inconsistencies.

PHASE 3 — ARTISTIC CRITIQUE QUALITY

Inspect the actual prompts, contracts, schemas, validators, examples and rendering logic.

The system should deliver accurate, evidence-grounded and practical coaching for the artwork being analysed.

Review these existing capabilities:

A. Overall critique
- Concise, specific observations.
- Recognition of what visually works.
- Identification of the highest-impact improvement.
- Actionable next steps.
- No generic praise or repeated filler.

B. Composition
- Subject placement.
- Focal hierarchy and visual emphasis.
- Balance and negative space.
- Entry points and visual pathways when genuinely supported.
- Element relationships.
- Spatial organisation.
- Optional alternate interpretation only when materially distinct.
- No invented objects or unsupported geometric claims.

C. Colour and value
- Tonal hierarchy.
- Contrast.
- Colour relationships.
- Temperature where visually meaningful.
- Harmony and separation.
- Concrete changes that can improve clarity.
- No unsupported pigment identification or invented process history.

D. Technique
- Observable edges, gradients, washes, marks, layering effects and surface characteristics.
- Distinguish visible results from inferred artistic processes.
- Do not claim to know brush type, paper type, pigment brand, stroke order or wetness at creation unless independently supported.
- Provide realistic corrective practice where appropriate.

E. Actionable coaching
- Prioritise the most important issues.
- Avoid overwhelming the learner.
- Give precise, feasible improvements.
- Preserve the artist's intended style rather than automatically forcing realism or conventional composition.
- Express uncertainty when the image does not support a definite conclusion.
- Avoid contradictory or duplicated advice across sections.

F. Practice suggestions
- Keep to the existing intended scope and number of studies.
- Ensure practice recommendations are directly tied to observed problems.
- Do not introduce a separate learning platform or course system.

Review prompts and validation rules for unsupported specificity, false certainty, repeated observations, contradictory recommendations, output instability and inappropriate assumptions about artistic intent.

Correct confirmed issues while preserving valid behaviour and existing contracts wherever feasible.

PHASE 4 — VISUAL COACHING AND IMAGE ALIGNMENT

Thoroughly validate existing annotations and visual guidance:

- Element detection and identification.
- Bounding regions and geometric accuracy.
- Coordinate systems and normalisation.
- Image orientation and aspect ratio.
- Crop offsets and transformations.
- Scaling between original image and rendered image.
- Overlay alignment on different screen sizes.
- Multiple regions and overlapping annotations.
- Visibility, clipping and layering.
- Correct relationship between textual evidence and visual markers.
- Interaction states and selection behaviour.
- Saved-result rendering.
- Accessibility and readability.

Every displayed annotation must be traceable to its intended observation.

Prevent visually confident but unsupported annotations.

When reliable geometry is unavailable, fail gracefully rather than displaying misleading shapes.

Ensure user interactions with existing saved critiques do not generate unnecessary new AI requests or writes.

PHASE 5 — MODEL INTEGRATION AND API ROBUSTNESS

Verify:

- Actual model identifiers and endpoint compatibility.
- Request structure and image payload preparation.
- Input/output token configuration.
- Structured response schema compatibility.
- Strict parsing and canonical validation.
- Invalid or incomplete model responses.
- Safe fallback or explicit errors.
- Retry boundaries.
- Timeout handling.
- Rate-limit responses.
- Idempotency where appropriate.
- Error classification and logging.
- Cost and token usage recording where already supported.
- No unintentional extra model calls.
- Correct separation of frontend, Edge and provider responsibilities.

Do not silently substitute models or change production model settings.

If live compatibility cannot be confirmed without credentials or paid calls, explicitly document that limitation and continue all feasible offline validation.

PHASE 6 — SECURITY, PRIVACY AND DATA INTEGRITY

Review relevant existing code and configuration for:

- Authentication and authorisation.
- Per-user artwork and critique ownership.
- Storage bucket permissions.
- Signed URLs and access lifetimes.
- RLS enforcement.
- Secure environment-variable handling.
- API-key exposure.
- Request validation.
- File-type and file-size protection.
- Excessive request or payload handling.
- Logging of potentially sensitive artwork or user information.
- Data retention and deletion behaviour.
- User-visible error messages that may expose internals.
- Quota enforcement and concurrent request behaviour.
- Trust boundaries between model output and UI rendering.
- XSS and unsafe markup where applicable.

Fix confirmed security defects without weakening established safeguards.

Do not change production secrets, policy configuration or live database data.

If a database migration or production configuration update is genuinely required, implement and test the migration in an appropriate non-production context, document the deployment requirements and do not execute it against production without approval.

PHASE 7 — UI, UX AND ACCESSIBILITY

Inspect the real rendered application.

The critique experience should be intuitive, consistent and visually clean.

Review:

- Page hierarchy and information density.
- Clear distinction between observations and recommendations.
- Section naming and consistent terminology.
- Duplicate or unnecessary UI controls.
- Visual annotations and associated explanatory copy.
- Mobile readability and touch targets.
- Text overflow and truncation.
- Empty and loading states.
- Error recovery.
- Saved result navigation.
- Accessibility labels and semantic structure.
- Keyboard access.
- Focus visibility.
- Contrast and responsive layout.
- Appropriate handling of long model responses.
- User confidence in the provenance and limits of AI observations.

Fix meaningful usability defects.

Do not redesign the application merely for visual novelty.

PHASE 8 — BENCHMARK AND EVALUATION READINESS

Review the existing model-evaluation harness for correctness and practical readiness.

Validate:
- Four evaluation arms and their actual definitions.
- Isolation from production.
- Image preparation and immutability.
- Consistent test inputs across models.
- Schema validation.
- Output comparison fairness.
- Ledger and resume behaviour.
- Request limits and accounting.
- Reporting and blind-review worksheets.
- Reproducibility and auditability.
- Accurate cost reporting.
- Handling of partial or failed trials.

Fix confirmed defects that compromise valid evaluation.

Avoid adding unnecessary benchmarking infrastructure.

If 24 representative permitted artwork cases are available, prepare and validate them without external transmission.

If not available, provide an exact concise list of required assets and keep this as an external validation blocker, not as an excuse to leave engineering work incomplete.

Do not invent artwork or reuse copyrighted imagery without appropriate permission.

Do not execute paid model calls or transmit user artwork to external providers without explicit approval.

PHASE 9 — TESTING AND DEFECT RESOLUTION

Create a severity-ranked internal issue inventory:

P0: security, data-loss or critical feature-breaking defects.
P1: major broken workflows, integrity failures or systematic misleading outputs.
P2: meaningful usability, reliability or maintainability defects.
P3: cosmetic or low-impact issues.

Distinguish:
- Confirmed defects.
- Reproducible risks.
- Unverified concerns.
- External blockers.
- Future enhancements outside scope.

Resolve all feasible confirmed P0/P1 defects and justified P2 defects.

Add targeted regression tests for substantive fixes.

Run all relevant checks, including:

- Full unit/integration tests.
- Frontend TypeScript.
- Strict Edge TypeScript.
- Configured and unconfigured builds.
- Relevant security and schema tests.
- Image transformation and annotation tests.
- Browser-based end-to-end journeys.
- Responsive device and viewport matrix.
- Saved-result behaviour.
- Failure and recovery paths.
- Benchmark preparation and dry-run checks.
- Relevant accessibility checks.
- Repeat validation after final modifications.

Use real browser rendering wherever supported.

No silent skips, fabricated results or misleading claims about execution coverage.

Where real model outputs cannot be tested, explicitly distinguish technical validation from artistic-quality validation.

PHASE 10 — RELEASE-CANDIDATE CONSOLIDATION

After fixes:

1. Review the full changeset for accidental or unrelated modifications.
2. Remove temporary debugging code, dead code and unnecessary duplication introduced during the task.
3. Check architectural consistency and maintainability.
4. Verify documentation matches implementation.
5. Ensure tests cover important behaviour.
6. Confirm existing production protections remain intact.
7. Perform a final regression run.
8. Produce a clean, reviewable diff.
9. Commit completed, verified work in logically organised commits.
10. Push the final release-candidate branch if permitted by repository access.

Do not automatically merge into the production branch.
Do not deploy.
Do not manipulate production data or credentials.

DEFINITION OF DONE

The engineering portion may be declared complete only when:

- All relevant existing critique functionality is reconciled and integrated.
- No known reproducible release-blocking defect remains.
- The existing user journey works in supported tested environments.
- Visual annotations and associated text remain consistent.
- Relevant security and data-integrity checks pass.
- No major responsive or accessibility defect remains.
- Automated tests and builds pass, or any exception is explicitly justified.
- Any remaining manual or live artistic-quality checks are identified precisely.
- There are no unresolved implementation TODOs that materially block the existing critique feature.

Do not claim full product readiness if live visual-quality evaluation remains unperformed.

STOP CONDITIONS

If a genuine external dependency prevents completion, finish all independent work first.

Do not request confirmation for routine implementation decisions.

Ask only if a decision requires:
- Paid API usage.
- External transmission of private artwork.
- Production deployment or database changes.
- New credentials or access permissions.
- Destructive operations.
- A material change to product scope or behaviour.

Do not perform these operations without authorisation.

FINAL REPORT — REQUIRED

Provide:

1. Final branch and commit hashes.
2. Relevant prior branch integrations and conflict resolutions.
3. Confirmed defects discovered, with severity.
4. Defects fixed and files changed.
5. Remaining confirmed defects, if any.
6. Test commands and actual results.
7. Real end-to-end journeys executed.
8. Security and data-integrity findings.
9. Artistic-quality validation performed versus still unverified.
10. Benchmark readiness and remaining dependencies.
11. Exact manual actions required from the product owner.
12. Final recommendation:
   READY / CONDITIONALLY READY / NOT READY.
13. Exact remaining blockers, prioritised.
14. Whether the critique feature's engineering phase can now be formally closed.

FINAL INSTRUCTION

Execute the work now. Do not merely describe what should be done.

Your objective is to complete the existing painting critique capability, not to create another open-ended improvement roadmap.

Do not over-engineer. Do not exaggerate readiness. Do not conceal unresolved issues.

Finish all work that can safely and objectively be completed within the current repository and available environment.