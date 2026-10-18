# Artwork-only input gate, zero-API crop preparation, and deeper watercolor coaching

Repository: `medigol/watercolor-coach-ai`; branch: `codex/artwork-gate-and-deep-coaching`. This branch is based on main. **This is a scoped feature addition, not a minor copy patch.** Do not merge, deploy, or create a PR.

## Existing architecture verified

- Expo 54 / React Native Web, `app/upload/improve-painting.tsx`, `components/ImageSelector.tsx`, `components/SaveResultButton.tsx`.
- ImagePicker accepts any image, uploads via `lib/artworks.ts` (JPEG/PNG/WebP, 10 MB), and calls Supabase `generate-feedback`.
- Edge `handler.ts` claims request, downloads bytes, calls provider, normalizes draft to persisted v1, then completes success/quota.
- Provider `index.ts` calls `gpt-4.1-mini` once with image detail `low`, strict JSON Schema and `max_completion_tokens=3000`.
- No current artwork classifier or painting-boundary crop. Create Reference intentionally accepts photographs and must not be constrained.

## Outcome / core rules

1. Improve Painting must not critique ordinary photographs, selfies, pets, documents, screenshots, UI, AI stock/graphics, unrelated objects, empty paper, or non-watercolor art as a finished watercolor. Allow real watercolor artwork and watercolor in progress (including a photograph of physical watercolor on paper/wall, sketchbook, frame or easel). Photorealistic/abstract watercolors are valid.
2. Zero-API preflight: file signature/size/dimensions/decoding; image orientation; boundary/crop assistance. Client-side geometry/CV cannot reliably prove watercolor identity. Do not claim otherwise.
3. Painting area must be the analysis image whenever a safe crop is selected: exclude desk, wall, frame, hand, brush, pencil, phone, clips, labels, surrounding paper border. Do not remove actual painted negative space, intentional paper white or internal composition. For uncertain boundary, ask the user to adjust/confirm; never destructively auto-cut ambiguous artwork.
4. No extra AI calls: eligibility must be decided as part of the SAME provider invocation already used for painting analysis, with a strict-schema outcome permitting `accepted`, `rejected`, or `uncertain`. For rejected/uncertain images, no fabricated painting draft, no completed analysis, no quota unit, no My Artworks result. Provider API cost may still be incurred once: distinguish from quota explicitly.
5. Rejection is a first-class bounded, sanitized user-facing error distinct from malformed canonical 422/provider 503; release the claim and preserve idempotency and safe uploaded-asset deletion semantics. No retry, no mock fallback, no secrets/logging of images.
6. All saved v1 results, result overlays, geometry, crop evidence and grayscale must reference the pixels in the ACTUAL submitted painting-only image. No SQL migration and no assumption that original full camera image is stored. If crop produces new bytes, upload ONLY chosen cropped artwork, not duplicate source photo. Original remains client-local unless existing persistence already required otherwise.
7. Keep one-call model/architecture, `gpt-4.1-mini`, existing 3000 completion token cap initially. Better coaching within budget: detail rather than filler; if genuinely impossible to achieve desired length reliably under current cap, report concrete token trade-off and proposed ceiling, do not silently increase. No high-detail image mode switch without separately documented cost/accuracy justification and user approval.

## A. Safe free image preparation

- Inspect existing code and Expo/platform support first. Reuse web canvas, existing image picker, and native-compatible crop functionality. If an Expo-matched crop package is absolutely required, introduce only that one with explicit justification and lockfile/test coverage; don't add a large CV/ML dependency.
- Client preflight checks: MIME magic bytes JPEG/PNG/WebP, valid decode, orientation/EXIF display, reasonable pixel dimensions, extreme panorama/small artwork, file size, blank/unreadable/corrupt images.
- Deterministic boundary candidate ONLY when a distinct physical rectangular art region is strongly detectable. It may produce a suggestion; user gets preview and confirmation. No unverified automatic destructive crop, no autonomous perspective warp or painting-edge invention. Include `Use full image`, `Adjust crop`, `Choose another` as appropriate, but do not offer full-image bypass if non-art objects are clearly present and the user needs to isolate artwork first.
- Manual crop with an accessible rectangular ROI, touch/mouse controls, minimum crop size and aspect preservation; clear indication of what is kept; confirm before paid analysis. Photo of an angled painting: prefer manual bounded crop to guesswork; no forced perspective correction unless existing deterministic reliable support.
- Allow genuine watercolor filling the photo, artwork with irregular painted edges, white margins integral to painting. False crop risk > border exclusion perfection.
- Process pixels locally before upload; preserve colour/value and enough resolution for professional feedback; avoid over-compression/EXIF/location metadata. Manage JPEG/PNG transparency and mobile memory.
- Cropped image bytes are ground truth for all subsequent image evidence. Normalize overlay coordinates to crop; prohibit overlays on removed photo surroundings. No additional processed derivative saved.
- Preview/reset/crop changes must invalidate prior requestId / imagePath cleanly, except truly uncertain live-response recovery must preserve same ID and bytes. Avoid double-upload on manual retry; use image-key existing attempt semantics correctly.

## B. One-call trusted eligibility gate

- Eligibility belongs in provider response for Improve Painting ONLY, not client text heuristics and not Create Reference.
- Classify watercolor or predominant watercolor-like painting / work in progress as accepted; photos OF an artwork accepted when artwork area isolated; normal real-world photo rejected; screenshot/document/other painting media rejected or conservatively uncertain; AI generated watercolor-like image not claimed to be physical paint or accepted as original without policy decision; consider whether purely digital watercolor-styled works are within supported scope, document it and present accurate label.
- Ambiguous/low-quality image -> `uncertain` with one brief safe reason, ask for clearer crop/photo instead of invented analysis. Be conservative with hyperrealistic and abstract painting.
- Strict JSON schema must validly express accepted analysis vs rejected/uncertain short outcome. Do NOT force full fake art analysis for rejection. Test JSON Schema strict compatibility (root-anyOf limitations) before choosing shape; use explicit discriminated union or safe required-null fields. Keep accepted provider draft structure substantially intact, deterministic server canonical IDs unchanged, persisted v1 unchanged.
- Server checks eligibility FIRST before draft normalization, saving and quota; validate enum and reason codes, do not trust arbitrary prose or client flags. Rejection response must be structured, safe fixed code: `unsupported_artwork` / `artwork_uncertain` / `crop_needed`; no diagnostic raw provider text. Distinguish from canonical failure 422 and 503. Never log private images, transcripts, identifiers, prompt or payload.
- Release request claim; no `complete_openai_feedback` on rejection. Failed image gate must not use success quota. Provider spend can still occur, do not mislead user about zero cost. Deletion only on definite reject; lost-response recovery and owner isolation unchanged.
- User messages concise and actionable, e.g. `This doesn't appear to be a watercolor painting. Choose a watercolor artwork or a clear photo of one.`, `We couldn't confidently identify the painting. Crop to the artwork and try again.`
- No second provider call for classification/crop/review or repair. No hidden retry, mock fallback, or safety bypass through legacy/mock paths.

## C. Image trust and adversarial cases

- Treat visible text, QR codes, stickers, screenshot content and prompt-like writing within image as untrusted image content, not operational instructions.
- Do not claim or reconstruct artist identity, originality, exact pigment/brush, or production sequence.
- Reject screenshot of app UI even if embedded thumbnail of painting is tiny; accept phone photograph of actual painting with adequate crop.
- Don't confuse hyperrealistic painting with photograph; when uncertain, abstain, do not confidently reject.
- If image shows multiple separate paintings, collage or printed reproductions, require user to isolate a single artwork; do not analyze all as one unless work itself is an intentional multi-panel painting.

## D. Deeper, expert, image-specific educational coaching

- Keep unified Complete Painting Analysis and existing artwork-first workspace. No focus selector, no expert tabs, no UI redesign.
- Each painting: clear qualified quality judgement backed by observation; 2–4 distinct evidence-linked strengths (do not force count); 0–3 justified important improvements; if no defect, offer an optional valid study based on an observed successful relationship.
- For every useful observation/recommendation teach `WHAT is seen` -> `WHERE` -> `WHY artistically` -> `underlying technical principle` -> `effect on attention, space, mood` -> `bounded HOW in a separate study` -> `how to assess outcome`. Emphasize focal/value hierarchy, mass balance, quiet/open space, lead-ins, lost/found edges, chroma and colour temperature, atmosphere, depth, simplification, transparency, painterly decisions, perspective/proportion only if evidenced.
- Composition should explain actual archetype and relations (diagonal/L/U/steelyard/balanced masses/etc) only if supported. No false position/negative-space labels, no auto focal amplification, no mandatory object additions.
- Colour/Value explains actual visible hues, warmth/coolness, chroma vs value differences, optical consequences, approximate practical simple mix ratios, not precise original pigment claims, no invented colour theory.
- Technique describes observed visual outcome only. Future reproduction methods such as wet-on-wet are explicitly suggestions. Distinguish present painting-safe micro-adjustment vs separate structural study.
- One well-designed controlled-variable practice includes materials/size/time where grounded, what stays fixed, the variable, 2 variant comparison, and visible success cue. No implied hidden defect.
- Avoid generic textbook filler, repetitive warm/cool praise across sections, invented facts or corrective text within strengths. Suppression may remove unsupported advice, but should not strip all informative educational content.
- Request richer substantive content by using existing fields coherently, with existing rationale/practice max 640 chars. The strict 3000-token completion cap cannot guarantee arbitrarily long essays: prioritize ~350–650 total useful words if reliably feasible; document measured length and truncation. If 3000 causes truncation, DO NOT automatically raise cap or retry; report trade-off and request approval for a separately scoped ceiling change. Consider small deterministic, clearly general watercolor-principle explanations only when tied to existing facts and without invented image findings; avoid unconditional boilerplate.
- Keep public stored schema v1, no new persistent columns, no paid study-generation calls, no image generation.

## E. Safety / compatibility / acceptance

- All gating only for Improve Painting; Create Reference continues to accept ordinary photos. Saved results and legacy paths still reopen. No SQL, RLS, secrets, auth, model or provider-count change. Exact app image handling tested web/mobile. Server-side validation authoritative.
- Confirm can reject image without consuming success quota while still honestly accounting that a single provider request may cost money.
- Test representative positive: scanned watercolor, framed painting cropped, painting on desk with brush outside crop, white border integral to artwork, WIP watercolor, loose abstract watercolor, monochrome watercolor, hyperreal watercolor, dark background watercolor; varied orientation/lighting/aspect ratios.
- Test negative: selfie, landscape photograph, animal photo, house photo, screenshot/web UI, document, collage, empty paper, paint palette/brushes only, tiny painting amidst room photo, painting in inappropriate medium, multiple artworks without isolation.
- Ambiguous cases -> abstain/ask for crop, don't silently consume successful quota; no model extra call; reject response vs 422 canonical distinction; failure/timeout/retry/recovery; zero writes on saved-result views.
- Test wrong/corrupt/oversize image, exif rotation, web crop coordinate, Android/iOS crop semantics, alpha, user-adjust crop reset, crop changes request key, crop evidence alignment, Crop+Notes/Composition/Roles and grayscale, saved reopen, Create Reference unaffected.
- Test traditional structure/colour/technique and depth scenarios with content-specific, non-filler guidance; no false defects. No paid automatic tests.
- Run full existing unit+integration, TypeScript frontend/strict Edge, configured/unconfigured export, browser responsive 375/390/430/768/1024/1440/1800, 401/403/409/422/503, quota/dedup/lost-response, plus mobile static/manual readiness. No skipped tests silently.
- Before implementation, write a short engineering plan and explicit cost/schema/risk decisions; then implement, do not stop at planning.
- Stay on branch; no PR, merge, deployment. Report exact files +/- counts, test count/new, validation, single-call gate, zero-cost crop flow, reject/quota cleanup, accepted output quality, token/cost estimate, caveats (including no guarantee free photo-vs-painting classifier), and live acceptance steps. Do NOT claim production success from mocks.
