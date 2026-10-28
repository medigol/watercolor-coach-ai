# Curated demonstrations · editorial workflow

A lesson, not a search result, defines the teaching need. See `coverage.json` (all 27 current steps) and `instructors.json` (11 owner-proposed candidates; no verified endorsement or final instructor selection).

## Current evidence · 2026-10-28

**Zero real videos discovered with verifiable identity; zero inspected, scored or approved; zero real segments; zero live playback checks completed.** The 25–35-video research and 8–12-video catalogue targets could not be executed. Do not treat eleven failed instructor searches as eleven reviewed videos.

All four required Google YouTube documentation pages, YouTube Terms/privacy pages, six candidate creator sites, an additional public discovery search and eleven official YouTube discovery searches returned `Tunnel connection failed: 403 Forbidden`. Browser attempts independently returned `net::ERR_TUNNEL_CONNECTION_FAILED`. Exact URLs and failures are in the dated access records, including `additional-access-2026-10-28.json`. No proxy workaround, credential request, stream extraction, transcript copying or downloaded video was used.

The implementation follows the official API contract described in the owner's specification and links the relevant documentation. **Current documentation/policy review is still blocked**, not certified complete:

- https://developers.google.com/youtube/iframe_api_reference
- https://developers.google.com/youtube/player_parameters
- https://developers.google.com/youtube/terms/developer-policies
- https://developers.google.com/youtube/terms/required-minimum-functionality
- https://www.youtube.com/static?template=terms
- https://policies.google.com/privacy

## Research and continuity plan, not a selection

| Candidate supplied by owner | Proposed screening purpose | Unresolved before selection |
| --- | --- | --- |
| Steve Mitchell / The Mind of Watercolor | Foundations: load, water, washes; potential continuity into edges | Inspect real brush visibility, explanatory accuracy, sequencing, free lesson completeness and captions |
| Paul Clark | Compare beginner wash/value instruction and guided projects | Same review; compare terminology and progression with Mitchell |
| Eric Yi Lin / Café Watercolor | Values, simplification, artistic decision-making; atmosphere bridge | Verify exact demonstrations, narration and self-contained segments |
| Javid Tabatabaei | Atmospheric/urban specialist candidate | Inspect English and Persian content separately; distinguish narration, silent/speed painting and paid previews |
| Matthew White | Alternative values/light/landscape continuity | Compare teaching decisions with the potential values lead |
| Tim Wilmot | Observed architecture and narrated urban process | Check length, speed, structural clarity and independently usable segment context |
| Louise De Masi | Botanical observation, layering and edge specialist | Verify suitability for foundational edge comparisons, not only detailed projects |
| Oliver Pyle | Landscape observation, depth and colour | Check prerequisite level and exact atmosphere lesson fit |
| Liron Yanconsky | Comparative value/simplification screening | Confirm evidence, consistency and overlap before expanding the group |
| Karen Rice | Comparative short technique screening | Confirm isolated variables, visibility and narration |
| Shibasaki | Comparative brush/decision screening | Verify language/captions and completeness of the specific demonstration |

Every teaching-quality dimension remains unknown in the machine-readable instructor worksheet. No artistic score, typical length, caption language, verified title or creator-channel identity was inferred from a name. The provisional plan is to compare Mitchell/Clark for one foundations lead, Yi Lin for a possible values/atmosphere lead and add only a necessary specialist after direct review. There is **no approved instructor group** yet.

## Worksheet required for each actual candidate

Record the following before adding a production resource. Typed contracts live in `learning/videoTypes.ts`; only the learner-facing approved catalogue belongs in `learning/media.ts`.

1. Identity: exact video ID/title, canonical watch URL, verified channel URL/creator, original language, full duration, publication date if known, date and source of metadata verification.
2. Classify: focused technique, full instruction, narrated/partly narrated/silent painting, speed painting, inspiration, promotion or paid preview. Record actual observed evidence. Reject if the intended learning needs unavailable paid context or invisible/omitted critical steps.
3. Direct content review: reviewer identity, method, date, source link, observed decision/result, technical concerns, target level and prerequisites. A description/chapter list does not establish review.
4. Segment: stable ID; existing lesson/step and content version; absolute start/end; calculated duration; setup/result context; observed exact technique; direct viewing evidence for this segment ID. Do not infer boundaries from chapter text alone.
5. Original teaching: viewing objective, 2–3 observation prompts, misconception, explanation, material list, controlled action/variable/constants, visible success criteria and reflection. Never copy narration/transcripts or distribute video frames.
6. Score only after inspection: technical/artistic correctness /25, exact objective /20, visibility /15, explanation /15, target level /10, pacing /5, accessibility /5, continuity /5. Threshold 85/100 **and no critical failure**. Preserve each sub-score, rationale and disagreements. No current resource has a score.
7. Caption evidence: unknown/present/absent; languages actually observed; automatic/human/mixed only when supported; date/evidence. Translation availability and accuracy remain unverified. Caption preference is not a track guarantee.
8. Live playback: correct real identity, minimum 200×200 dimensions, start/end, replay, switching/seek behavior, full-video route, captions where actually offered, error/fullscreen behavior and returning to practice. Record device/browser and which checks were genuinely live.
9. Editorial and owner decisions: dated evidence and named reviewers; separate current availability, embedding restrictions and active/retired state. Never manufacture owner approval. Publication requires both direct viewing and segment-specific evidence, live embed evidence for embedded resources, editorial score and explicit owner approval.

Run `node scripts/validate-learning-media.cjs` and the tests before publication. A passing empty catalogue reports `BLOCKED_NO_VERIFIED_CONTENT`; engineering contract validity does not equal editorial readiness.

## Maintenance and lawful use

Recheck availability before initial release, roughly every 90 days and after a failure report. Reassess segments when their lesson content version changes. Retire with stable IDs and a verified replacement reference where appropriate; never silently substitute unverified content. No background health service is introduced.

Use the official player with controls/branding/advertising unobscured. Provide an attributed full-video link, an explicit click-to-load connection disclosure and terms/privacy access. No media/transcript storage, custom caption extraction, forced loops, API keys or view statistics. Privacy-enhanced embeds can still share information with YouTube. Caption preferences last only while the card is open and are not written into lesson progress. External/native playback uses YouTube's own caption controls. Current policy/legal review and live-device acceptance remain release gates; this is not legal certification.
