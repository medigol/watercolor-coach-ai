# Grounded Artwork Assessment: baseline and bounded implementation

Baseline: `main` at `8ce3c80823b259495ff19c39189de36d32d4a5bc`, merge of PR #36. The prior quality work is integrated, not an unmerged prerequisite. Initial working tree was clean. Dedicated branch: `codex/grounded-artwork-assessment`. No user artwork bytes are available for the three reported cases.

## Pipeline inspected before modification

| Stage | Existing source and responsibility | Finding |
|---|---|---|
| Selection | `components/PaintingImageSelector.tsx`, `ArtworkCropEditor.tsx` | Local proposal requires confirmation, but **no proposal auto-accepted full image**. Detector cannot identify medium or guarantee screenshot isolation. |
| Preparation | `lib/prepareArtwork.ts`, `shared/artworkPreparation.ts` | Header resource gates before decode; upright EXIF once; optional rectangular crop; white alpha matte; proportional size cap. Previous pending-Blob disposal fix intact. Only confirmed bytes uploaded. |
| Submission | `SaveResultButton.tsx`, `lib/artworks.ts` | Auth owner/request identity; upload one prepared source to private storage; idempotent Edge invocation; safe explicit retry and lost-response recovery. |
| Provider | `generate-feedback/index.ts`, `_shared/prompts.ts`, `contract.ts` | Exactly one Chat Completions request; gpt-4.1-mini, low detail, temperature0.3, 3000 completion tokens. Eligibility and analysis share that request; no reference image supplied. |
| Draft graph | `shared/providerPaintingAnalysis.ts` | Server-owned deterministic v1 IDs/domains/fact links/views. Optional visual aids are nonfatal. No global graph rebuilt by the model. |
| Canonical validation | `shared/paintingAnalysis.ts`, `visualMetadata.ts`, `coachingDecision.ts` | Schema/links/roles/bounds/shape/self-intersection and role-note consistency; optional-invalid metadata omission. **Diagonal cleaning discarded middle anchors. Directional endpoints not required to agree with focal landing. Structural teaching required journey fields.** |
| Teaching | `coachingAlignment.ts`, `coachingAssessment.ts`, `coachingCalibration.ts`, `coachingEvidence.ts`, `coachingSemantics.ts`, `coachingWorkspace.ts` | Evidence-aligned corrections, hue/value distinction, conditional quality normalization, substantive distinct strengths, one-variable separate studies, role/temperature/road safeguards. These compare supplied text; **they do not independently verify model perception**. |
| Source evidence | `lib/teachingEvidence.ts`, `EvidenceVisual.tsx` | Canonical normalized crops with bounded context; full-image/global fallback, allocation/dedup. Genuine web grayscale. **Workspace forced value mode on hue-only evidence; multi-region value comparison had no grayscale toggle.** |
| Colour | `shared/colourAnalysis.ts`, `coachingDisplay.ts`, `ColourValueAnalysis.tsx` | Optional model-generated recipes; no static mixing database. Ratios/white/history constraints exist, **clear-pink plus yellow not checked**. No independent region colour/tonal measurements. |
| Image rendering | `SavedResultState.tsx`, `imageGeometry.ts`, `overlayDrawing.ts`, `CompositionStructure.tsx`, `VisualRoleMap.tsx` | One contained intrinsic frame, percent legacy conversion at boundary, responsive projection, compact controls, collision-adjusted note labels, accessible role line styles. **Composition paths visually looked like observed solid edges; canonical workspace lacked explicit source-change interaction reset.** |
| Persistence | `useSavedResult.ts`, `ResultExperience.tsx` | Owner/mode-scoped immutable reads, short-lived signed source, legacy v1 fallback and late-read protection. Never reanalyse/rewrite saved records. |
| Quality evidence | `tests`, `tests/browser`, `docs/benchmark`, prior review | 1716 passing tests recorded on prior baseline, technical Chromium matrix, disposable SQL RLS, free benchmark; real expert/artwork/model evaluation explicitly pending. |

## Frame and provenance

Original file → decoder's EXIF-normalized upright image → user-confirmed axis-aligned crop → proportional prepared raster → private stored analysed raster → all normalized geometry relative to that raster → `containFrame` → shared projectors for overlays/crops. Original/crop offsets are not reapplied to saved geometry. DPR/zoom/resize change the display frame, not coordinates. Crop is explicit, never a silent colour/perspective edit. The original upload remains local during selection; only the analysed selection is stored. It is not retained as a second uploaded original.

Facts/insights/roles/visual aids all originate in one model draft. Source pixels, dimensions, bounds and linear-light sampling are independent checks; rephrased model facts are **not** independent proof. Existing confidence numbers are model outputs used as internal omission gates, not calibrated user percentages. No standalone reference pair exists; exact likeness cannot be established.

## Root-cause scope

Confirmed engineering defects: input-confirmation gap; geometric anchor simplification; endpoint/metadata validation gaps; hue-only grayscale presentation; recipe plausibility; malformed prose; missing source-change reset. Perception/medium/subject localization errors in the original three paintings are **unverified**, not attributed to a coordinate or rendering bug without their bytes. These must remain separate from technical fixtures. The final report contains the 65-requirement traceability matrix, actual validation and release limits.
