# PR #43 — final artistic and instructional quality review

**CONDITIONALLY READY FOR OWNER REVIEW.** The implementation and engineering evidence are complete for this review. Internal visual inspection cannot supply independent artist approval, physical material reproducibility, physical Android acceptance or real YouTube footage/playback verification. No merge or deployment.

## Verified scope

Fetched the existing branch before editing. Remote and local head were both `f5bd14a940e532f81c346ce734bcc7ac4e3952dc`, with a clean working tree; `main` remained `f2a4631eea09ac667a84c92e9ff9892acb2edcde`. This follow-up stays on `codex/visual-video-learning-upgrade` and updates the existing [Draft PR #43](https://github.com/medigol/watercolor-coach-ai/pull/43).

The earlier [implementation report](evidence/visual-video-learning/pr43-initial-report.md), [validation record](evidence/visual-video-learning/pr43-initial-validation.json) and 102 screenshots are preserved as historical evidence. Their counts are not presented as newly executed tests.

## Individual artwork review

All **22 original PNGs were inspected at their native 1536×1024 resolution**. Their 720px and 1440px derivatives were rendered, decoded and visually inspected inside the actual exported app. All four new reconstructed views received the same derivative review. [The manifest](watercolour-visual-assets.json) records individual strengths, weaknesses, technique alignment, original/final verdicts, source paths/hashes, revisions, derivative screenshots and owner-approval status.

The original cohort received eight **ACCEPT**, thirteen **ACCEPT WITH LIMITATIONS**, one **REVISE / REGENERATE** and zero **BLOCKED** verdicts. Twenty-one originals and their files are unchanged. Only `edge-leaves` was revised. Its final internal verdict is **ACCEPT WITH LIMITATIONS**. No independent artist approval is claimed or automatically granted.

| Original | Verdict before correction | Concrete finding |
| --- | --- | --- |
| Brush loading | ACCEPT WITH LIMITATIONS | Tapered ends and fuller deposits are readable; dried darkness cannot establish loading history. |
| Brush contact | ACCEPT | Narrow, belly-width and directional broken rows clearly separate contact from continuity. |
| Flat wash | ACCEPT | Quiet interior, mild settling and hand-painted perimeter; no artificial perfection or random flaws added. |
| Wet-edge joining | ACCEPT WITH LIMITATIONS | Two darker joins contrast with the connected interior; movement and timing come from the written sequence/secondary aid. |
| Dilution | ACCEPT WITH LIMITATIONS | Strong/middle/pale order repeats in two rows; no ratios or controlled loading are inferred. |
| Dry/damp | ACCEPT WITH LIMITATIONS | Definite versus diffused boundaries are visible; neither measured moisture nor a lost contour is asserted. |
| Pool/backrun | ACCEPT WITH LIMITATIONS | End deposit and paler bloom/darker rim differ; diagnosis remains conditional. |
| Intentional texture | ACCEPT WITH LIMITATIONS | Directional gaps, granular settling and an olive bloom differ; no pigment identity is inferred. |
| Painted still life | ACCEPT | Coherent jug/pear/shadow arrangement and transparent modelling. |
| Value plan | ACCEPT WITH LIMITATIONS | Neutral dominant families retain the subject; small painted variations are not a calibrated conversion. |
| Alternative values | ACCEPT | Same principal placement, quieter jug opening and changed small front-pear emphasis. |
| Edge comparison | ACCEPT | The right pair has no continuous shared middle seam; outer tips remain found. |
| Leaf application | REVISE / REGENERATE | Middle join was ambiguous on a phone; targeted edit clarifies loss while preserving adjacent found contour, stems and tips. |
| Painted structure | ACCEPT WITH LIMITATIONS | Readable corner/planes/eaves; local trim geometry is approximate. |
| Structural plan | ACCEPT WITH LIMITATIONS | Same envelope and openings with reduced description; not surveyed geometry. |
| Finished landscape | ACCEPT | Quiet ridge, cottage, light river and connected bank form a credible watercolour design; retained unchanged as master. |
| Landscape value plan | ACCEPT WITH LIMITATIONS | Main masses/river route retained; separately labelled interpretation, not a literal physical first stage. |
| Landscape palette | ACCEPT WITH LIMITATIONS | Useful dry-value/colour relationships; no recovered pigment recipes. |
| Atmospheric style | ACCEPT | Quiet distance, open water and selected near marks differ in handling from the other styles. |
| Urban style | ACCEPT WITH LIMITATIONS | Economical lines/figures and open washes; local furniture/geometry is abbreviated. |
| Botanical style | ACCEPT WITH LIMITATIONS | Deliberate contours, transparent petals and selected veins; no species/specimen certification. |
| Expressive style | ACCEPT | Directional broken marks, interacting warm/cool masses and open paper carry gesture. |

### Targeted revision and production method

`edge-leaves` was edited with the supported image-generation tool using its own previous generated source. The upright leaf's right contour now disappears through the middle join and is found above/below it. The separate edge-comparison image remains unchanged. The new caption identifies the interval rather than asking the beginner to guess its location. The rear soft edge remains distinct from loss.

The brush caption now describes **visible deposits**, then asks the learner's own load test to explore causes. The wash-join caption describes two dried joins; physical pass directions remain in the visible instructions and the secondary technical aid. No loading history, wetness measurement or brush movement is claimed from a still image.

Four additional reconstructed project states were made by constrained edits of our own master/scaffold. The preparation frame received a further line-visibility correction after its first phone rendering was too faint. Acceptable original artwork was preserved. No external paintings, creator images, video frames, commercial illustrations or transcripts were copied. Generated originals remain labelled as generated. Pillow performed only deterministic resize/WebP compression; no code-painted substitutes, filters or artificial noise were used.

The catalogue now has **26 sources, 52 responsive WebP files and 30 teaching views**, totalling **5,708,562 bytes** for both responsive sizes. Original PNGs remain outside the production bundle. No runtime image generation, dependency or recurring service was added.

## A coherent landscape progression

The project now shows a useful development sequence:

| Canonical step | Primary teaching image | Added information |
| --- | --- | --- |
| `intention` | Existing finished master | Intended quiet/open relationship. |
| `values` | Existing neutral plan | Large value families and reserved light route. |
| `wash-plan` | New reconstructed preparation | Ridge, house and bank scaffold; reserved paper lights. Palette remains a supporting comparison. |
| `sky` | New reconstructed sky view | Pale sky wash; lower land/house/river remain unpainted. |
| `hill` | New reconstructed hill view | Quiet connected middle-distance mass; lower light still open. |
| `bank` | New reconstructed land-mass view | Connected near bank and quiet left group before foreground texture; house wall remains white. |
| `finish` | Existing final master | Selected accents/texture compared with the mass stage; stopping remains legitimate. |
| `reflect` | Existing final master | Intention, dry result and next separate experiment. |

All states retain the 3:2 framing, low left ridge, right-of-centre house and S-shaped open river/diagonal near-bank relationship. The sky image was edited from the master, then used as the registered scaffold for earlier/later views. The bank also references the master to retain the larger land silhouettes. The preparation correction changes line visibility only.

These are **illustrative reconstructions**, never photographs/scans of a genuine painting process. Small pigment-density, paper-texture and painterly silhouette differences remain. The comparison is not pixel-exact registration and does not prove wet-on-dry, wet-on-wet or a particular drying history. The actual written hill instruction still waits for a dry sky, tests rewetting on scrap and chooses dry paper if the sample lifts or streaks.

A bounded **Compare the landscape sequence** control shows one view on mobile or two adjacent views on desktop. Previous/Next controls keep it within a manageable reading area. The earlier long gallery was replaced during review because it created unnecessary scrolling. Finished-master detail crops remain optional comparisons at the relevant stages; they are no longer the only primary sky/hill/bank images. Four useful reconstructions are provided; no eight-image physical history is fabricated.

## Compact contextual video

All **12 contextual links from five sources** remain unchanged, with all 17 discovery candidates, three Javid entries, 18 timing proposals/hints, four screenings and zero approved media resources intact. No footage was newly inspected and no live playback was accepted.

The main card now contains a small **local illustration** play poster, instructional title, creator, existing proposed window, one conditional viewing cue, Watch, compact provisional status and source/experiment links. The poster is clearly identified as an illustration, not a source-video frame or creator image. It makes no third-party request. Both poster and Watch use the existing official player in one gesture. There is no second Load action.

Long scope/provenance, repeated-overview, playback and privacy explanations moved to **Video details and privacy**. Unknown endpoints remain visible. The one-line provisional note remains in the reading flow. Opening the original, captions/speed/fullscreen, replay/absolute bounds, one active player, error fallback, disposal and return to the current experiment reuse the existing implementation. Viewing never checks practice.

Measured in the actual exported app for the brush-loading reference:

| Viewport | Before | After | Reduction |
| --- | ---: | ---: | ---: |
| 390px | 615px | 442px | 173px (28%) |
| 1440px | 474px | 380px | 94px (20%) |

Both measurements made zero third-party media requests. These are layout measurements, not measures of educational or artistic quality.

## Instructional copy and image alignment

All 32 units were cross-checked against their primary/supplementary image, physical experiment, observation, diagnosis and video scope. The ten water units retain their reviewed physical guidance. Focused edits remove administrative repetition from values, edges, structure and the project without expanding every paragraph.

Before the sky instruction led with how the generated image was made. It now begins:

> Observe the broad light sky wash above the unpainted land. Keep the reserved lower lights clear while joining the sky passage.

Other corrections:

- Values name the actual jug opening/front-pear accent in the two plans; hue is not substituted for value.
- Edge captions locate the shared lost interval; soft-edge previews are never used as lost-edge proof.
- Structural observation begins with the visible envelope and a real fixed viewpoint; synthetic-survey warnings move to image information.
- Preparation relates the reserved-light plan to the dry-tested palette and wet-edge rehearsal.
- Hill instructions retain the explicit safe surface choice and compare the added mass with the sky-only view.
- Near-bank instructions compare the broad mass with final texture before asking whether detail helps.
- Finishing and reflection preserve stopping, uncertainty and a separate future test.

Captions lead with what to see. Concise generated/reconstructed labels remain visible. **About this study image** retains provenance, non-physical-history and technique limitations. Essential setup, hand actions, moisture/drying checks, material caveats and safe stopping advice remain visible in the main flow. [The updated crosswalk](visual-video-learning-crosswalk.json) distinguishes image role, visible cue, physical exercise and every unchanged video window/evidence source.

## Compatibility and validation

No lesson/project ID, canonical step, version, checklist identity/wording, completion rule, storage key/schema, note, reflection or account-scoped focus contract changed. No mandatory unit gates were added. No critique, saved-artwork, auth, Supabase schema/storage, quotas, provider, production configuration or media-publication contract changed. The source lock and protected-file diff remain intact.

[Current validation evidence](visual-video-learning-validation.json) records the exact newly executed commands/results. It includes the 2,083-test full suite, targeted review tests, frontend/strict Edge TypeScript, configured/unconfigured exports, learning/mentor/library/course browser tests, both derivative sizes, original approved-player synthetic integration, assessment/auth/saved-artwork matrices, 40 image-preparation checks, local PostgreSQL security execution, content/media validators and source/bundle audits. Tests do not certify painting realism or complete WCAG conformance.

[Screenshots and comparison index](screenshots/visual-video-learning/README.md) preserve earlier results and add actual 390px/desktop follow-up views, bounded sequence comparisons and all 52 in-app derivative captures. Synthetic player images are labelled; none is real YouTube evidence.

## Gates and remaining acceptance

- **A, artwork:** all 22 originals individually reviewed; one corrected; no blocked original. Internal acceptance remains subject to owner judgement/material testing.
- **B, progression:** four coherent reconstructed states implemented with visible labels, bounded comparisons and disclosed small variations. No claim of physical or pixel-exact history.
- **C, contextual media:** compact contextual cards implemented; all existing evidence/publication limits preserved. Actual footage matching/playback remains unverified.
- **D, instruction:** all five items share the coherent reading/practice flow; image-specific copy and physical actions remain independent of video.
- **E, safety:** original data and production contracts preserved.
- **F, engineering:** executed checks pass as recorded; physical Android and assistive-technology acceptance remain open.

Owner review should concentrate on the **revised leaf join and four new reconstructed states**, the revised phone reading/comparison flow, and physical execution of the relevant comparisons. Accepted unchanged originals do not need repeating merely because this pass occurred. Real Android official playback/captions and exact footage-to-technique inspection remain independent of the four completed instructor screenings. This conditional verdict supplies no new artistic or video editorial approval and authorises no release.
