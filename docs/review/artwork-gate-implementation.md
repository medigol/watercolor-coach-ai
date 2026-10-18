# Implementation decisions

This implements the complete `artwork-gate-and-deep-coaching.md` specification on its existing branch.

1. **Eligibility:** a strict root object contains required `eligibility` and nullable `analysis`. Nested nullable draft retains local references and server canonicalization. Accepted requires a draft and null reason; rejected/uncertain requires null draft and a bounded reason. Inconsistent envelopes fail closed as provider errors, not fabricated canonical failures. Definite semantic outcomes return HTTP 400 with a fixed code. Existing successful-ID recovery runs first. No rejection cache/SQL is added; the client stops resubmission of the same rejected preparation.
2. **Preparation:** JPEG/PNG/WebP signature/header/resource validation, oriented decode, local preview and rectangular manual crop before upload. Only a strongly isolated uniform-surround rectangle can be proposed; a proposal always requires confirmation. Geometry is not medium recognition. Full artwork needs no crop. Users identify external surroundings explicitly; when present, full-image submission is blocked until crop/confirmation. No destructive automatic trimming of painted white space. Export only the confirmed oriented artwork, preserving aspect and colours (alpha matted on white); metadata is removed through raster export. One Expo SDK-matched image-manipulator package is justified for native orientation/decode/crop/export; no ML/CV library. No extra source upload, derived storage asset or schema field.
3. **Teaching/validation:** concise, fact-linked relational teaching and one optional supplied neutral study for strong work; preserve all semantic safeguards and current workspace. Keep model `gpt-4.1-mini`, low detail and 3,000 completion tokens. Measure synthetic useful-word/serialized-size budgets without calling a paid provider. Do not claim mocks prove classification, live output length or iOS/Android behavior.

Risk decisions: local checks cannot distinguish photographs from paintings or guarantee perfect boundaries. Ambiguous medium abstains; digital watercolor-style images/printed reproductions are uncertain (not claimed physical originals). Multiple distinct works or a tiny painting require isolation. Native crop requires manual device checks. Rejected requests can cost one provider invocation but no successful quota; without a persisted rejection cache cross-session rejected-request dedup is not guaranteed. Existing lost-response IDs/bytes remain recoverable.

## Coaching and budget decisions

The prior depth/calibration systems remain authoritative. The prompt now requests 2–4 distinct strengths (without a forced minimum), 0–3 supported opportunities and one optional neutral study tied to an observed relationship, including constants, two variants and visible success cues. The workspace can display a fourth distinct strength and an explicit no-study state. Genuine saved stylistic alternatives remain readable; no deterministic exercise or finding is fabricated.

The original technical Strong fixture contains **373 words across core observation/lesson/action/rationale/practice fields** in a **5,367-byte / 5,365-character serialized provider draft** (before the small eligibility wrapper). This is a size measurement, not tokenizer output or live-provider evidence. JSON punctuation/keys, numbers and visual metadata also consume output tokens. The ~350–650-word aspiration is not a minimum and cannot be guaranteed under 3,000 tokens. Optional geometry/mixes/brush stages stay sparse; complete core teaching takes priority. `finish_reason=length` still fails safely with one request, no repair/retry and no success quota. No paid provider calls were made, so real truncation frequency and artistic depth remain live acceptance work; there is no demonstrated need to raise the cap.

Cost: local preflight/crop/preview/reset uses zero paid services. An accepted attempt or a semantic rejection normally uses one existing provider request (unless an existing successful ID is recovered before generation). A rejection does not complete quota. The maximum completion charge is `3,000 × current output-token price`; for illustration only, at $1.60 per million output tokens this is $0.0048, plus prompt/image input charges. Verify current provider pricing; image and prompt costs are not included in that illustration. There is no extra classifier/crop/study call and no high-detail switch.

## Required live/manual acceptance after a separately approved release

- Real artwork recognition: scans; framed/desk/sketchbook watercolor; WIP; abstract, monochrome, photorealistic and dark paintings; ordinary photos/UI/documents; mixed/uncertain medium; multiple works/tiny room artwork; image-text prompt injection. Mocked dispositions test contract/quota behavior, not visual classification reliability.
- Android/iOS: Expo SDK 54-compatible runtime with image-manipulator 14.0.8; local/file/photo-library URIs, EXIF rotations/mirrors, PNG alpha, crop touch, memory limits, cache retention, orientation and colour appearance. Browser mouse/touch simulation and native adapter unit tests do not prove device behavior.
- Compare real submitted crop pixels with saved images and role/note/composition/colour/value evidence; preserve intentional paper whites. Angled artwork should ask for a straight-on photo rather than pretend to rectify perspective.
- Judge accepted coaching substance and truncation on real paintings without using automated paid tests. Confirm no false faults, original-process claims or repetitive strengths; neutral practice must not imply a hidden defect.

Limitations: boundary proposals are deliberately low-recall and web-only; manual selection is the fallback. Local geometry cannot prove medium or distinguish a painted rectangular field from a physical sheet. Native PNG retains alpha rather than flattening it; preview uses white. Raster export uses the platform's colour management and may differ from a source ICC workflow. Temporary native raster files are OS cache files. Successful-result dedup is unchanged; rejected requests have no cross-session persisted cache, so a lost rejection response can incur another call on explicit retry. Replaced web output URLs and previous selected-source URLs are released instead of accumulating across edits. Storage cleanup is best effort on network/service failure. No new SQL, secret, auth/RLS change, deployment or Phase 2.

## Final automated validation

- All 1,592 unit/integration tests pass: 103 added relative to main's 1,489; zero failures, skips or cancellations. Includes actual Edge entrypoint/SDK mocked-boundary tests, one-call eligibility, quota completion/release, malformed/refused/truncated responses, ownership, retention, idempotency and lost-response recovery. No paid provider calls.
- Frontend `npm run typecheck` and strict Deno Edge check pass. Configured `npm run build:web`/Expo export and unconfigured static export pass.
- Workspace browser harness: 170 matrix/error cases plus an upload-error/retry check. The existing legacy reopen, Create Reference, Clean/Notes/Composition/Roles, colour/crop/value evidence, quota, dedup, recovery and 401/403/409/422/503 flows pass. Three new semantic-error cases preserve quota and prevent resubmitting the same rejected preparation.
- Real-browser preparation harness: 39 cases, including four aspect formats at all seven widths, rendered crop/confirm/reset, mouse and touch drags, high DPI, EXIF 6 pixel orientation, PNG white matte, integral white margins, blank/dark local preparation, corrupt/oversized input rejection before decode, release of replaced output URLs, and exact confirmed-byte upload. These are original technical fixtures and mocked semantics, not classification accuracy tests.
- Widths: 375, 390, 430, 768, 1024, 1440, 1800. Eight unconfigured Pages routes pass with no external requests. Zero browser runtime errors. Saved-result controls/reopen produce zero provider calls, uploads or writes; normal saved-result reads remain allowed.
- Native adapter/unit and source compatibility were checked; real iOS/Android permission/file/decoder/crop/memory behaviour remains unverified. Live medium classification, artistic acceptance and actual provider truncation remain unverified. This branch was not merged or deployed.

## Complete branch file inventory

The authoritative specification below was already present before implementation; all other listed files are implementation/test/documentation changes.

- `README.md`
- `components/ArtworkCropEditor.tsx`
- `components/ImageSelector.tsx`
- `components/PaintingAnalysisWorkspace.tsx`
- `components/PaintingImageSelector.tsx`
- `components/SaveResultButton.tsx`
- `docs/review/artwork-gate-and-deep-coaching.md` (provided authoritative specification; unchanged during implementation)
- `docs/review/artwork-gate-implementation.md`
- `lib/artworks.ts`
- `lib/prepareArtwork.ts`
- `package-lock.json`
- `package.json`
- `shared/artworkEligibility.ts`
- `shared/artworkPreparation.ts`
- `shared/coachingWorkspace.ts`
- `supabase/functions/_shared/contract.ts`
- `supabase/functions/_shared/prompts.ts`
- `supabase/functions/generate-feedback/handler.ts`
- `supabase/functions/generate-feedback/index.ts`
- `tests/artwork-eligibility.test.cjs`
- `tests/artwork-preparation.test.cjs`
- `tests/artworks.test.cjs`
- `tests/browser/artwork-preparation.cjs`
- `tests/browser/professional-workspace.cjs`
- `tests/deep-coaching.test.cjs`
- `tests/edge-runtime.test.cjs`
- `tests/feedback.test.cjs`
- `tests/helpers/deep-coaching-fixture.cjs`
- `tests/painting-analysis.test.cjs`
- `tests/save-button.test.cjs`
