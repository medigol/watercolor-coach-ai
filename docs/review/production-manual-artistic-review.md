# Manual review of legitimate production assessments

2026-10-23 UTC. Active approach: review owner-generated, existing production assessments. The independent paid benchmark is **deferred by user instruction**. No API key or new credentials are requested, no production assessment is submitted automatically, and no benchmark approval is exercised. Existing evidence and experimental records remain unchanged.

## Deployment evidence

| Question | Evidence | Finding |
|---|---|---|
| Latest fetched `main` | Successful `git fetch origin`; `origin/main` is `8ce3c80823b259495ff19c39189de36d32d4a5bc` | Verified Git revision; **not proof of deployment** |
| Public frontend revision | Production page/root and GitHub Pages build/deployment API reads failed with `Tunnel connection failed: 403 Forbidden`; elevated page read was cancelled | **UNVERIFIED**; proxy failure, not an observed application HTTP/authentication error |
| Actual deployed backend/model | No deployed function source, deployment revision or existing runtime model record available | **UNVERIFIED** |
| Model configured in fetched main | `git show origin/main:supabase/functions/generate-feedback/index.ts`: `gpt-4.1-mini`, image detail `low`, `max_completion_tokens:3000`, temperature `0.3` | Verified **source configuration only** |
| Deployment coupling | Pages workflow runs on main push or manual dispatch; Supabase function workflow is a separate manual dispatch | A frontend commit cannot establish the deployed backend revision/model |

The [production page](https://medigol.github.io/watercolor-coach-ai/upload/improve-painting) could not be inspected interactively in this environment. No production browser/device pass is claimed. The source/model settings were inspected, not changed. Development safeguards on `codex/grounded-artwork-assessment` must not be described as deployed fixes.

An owner can establish the missing facts without running an assessment:

1. In GitHub Actions, record the most recent **successful Pages deploy job**, its full head SHA, time and production environment URL. A successful build alone is insufficient. Manual dispatch can deploy a branch other than main.
2. Separately record the deployed Supabase `generate-feedback` revision/time from the owner's normal dashboard and its corresponding source revision. Check for deployments made outside GitHub Actions. Do not export access tokens or project secrets.
3. Inspect that deployed source's configured model/detail/token cap. If an existing request's resolved-model metadata is legitimately retained, record it separately from the configured alias. Do not create a request to obtain it.
4. Record **generation revision** and **current renderer revision** separately for saved results. A current page can display an old assessment. Persisted version `1` does not identify its prompt/model/build revision. Leave missing fields UNVERIFIED rather than inferring them from the latest commit or title.

## Results actually available

Two user-supplied historical production screenshots were inspected locally; neither is a complete assessment or a current live reproduction. Images, hashes and detailed review records remain outside Git in `/tmp/watercolor-manual-production-review/`.

| Result | Visible evidence | Defensible finding | Unverified |
|---|---|---|---|
| Nested boat screenshot, private C16 | Outer “Your painting” contains another app screenshot. An outer note marker lies over nested interface text, below the actual boat thumbnail. | **Historical material evidence-positioning/input-scope failure.** Critical if reproduced on current production. | Generation/render version; analysed bytes; provider/canonical geometry; whether cause was perception, source conversion, evidence association or rendering; current reproduction; complete critique |
| Care Bears saved result, private C13 | Clean image card contains the isolated illustration. “Strong painting” and the beginning of “This watercolor painting demonstrates…” are visible; the rationale is cut off. | Partial observation only. Medium certainty needs provenance. The capture does **not** prove that surrounding browser UI was the model input, or that the painting's medium/quality verdict was wrong. | Full rationale, recommendations, composition/roles, tonal reasoning, technique, practice, input crop, interactions and model revision |
| Church/van/other supplied originals | Actual paintings are available privately; church/van have user-supplied watercolour attestation | Useful reference images for a review | No complete corresponding production assessment is available here; artistic accuracy/teaching quality cannot be scored |

The historical boat failure is not a new reproducible development defect. The branch already contains explicit artwork confirmation, same-call external-UI eligibility instructions and geometry/evidence safeguards. Their real-model effectiveness remains unverified. Without the corresponding saved geometry/input and current rendering, another prompt/coordinate patch would guess at the cause. No redundant production-code change or sample-specific exception was introduced.

## Practical capture workflow: existing saved result first

1. The owner opens the normal production app, signs in normally, and opens an **existing saved assessment**. Do not click Analyse, Retry, Regenerate or any action that starts a new attempt. No assistant authentication, session sharing, quota bypass or automatic assessment is part of this workflow. Any new assessment is a separate, deliberate user action through normal controls, not authorized by these review instructions.
2. Create a private folder **outside Git** for each result. Keep the exact analysed image/crop and original distinct, plus creation time, available revision evidence, device/browser and viewport. Record unknown provenance/medium honestly. Reuploaded duplicates are not additional independent artworks. Preserve raw originals and saved records; annotate a working copy of the review only.
3. Before reading the critique, independently note major subjects, coarse locations, major light/dark masses, hue/temperature relationships and plausible focal readings. Existing assistant-authored reference drafts are aids, not human ground truth or acceptance answers. Never feed reference notes into a production assessment.
4. Capture the complete expanded assessment, including Overall, What Works, recommendations, Composition, Colour & Value, Technique and Practice. Capture Clean, Notes, Composition and Roles, then **each selected note/role/path/located colour** and the evidence crop or grayscale view reached from it. Include the full image frame with each mark. Do not infer hidden sections from a partial screenshot.
5. Exercise saved-result interactions only. Record whether the correct region highlights, whether evidence leads to the stated subject/property, whether tab changes leave stale selections, whether colour/grayscale/crops use the same selected artwork, and whether reopening preserves the result. Review at a narrow mobile width (e.g. 390 px) and desktop when available; record actual device checks separately from emulation.
6. The owner may observe network counts in their own browser: new analysis invocations, new artwork uploads and artwork/feedback mutations should remain zero for saved views. Ordinary authenticated reads, signed-image access and session refresh are distinct from analysis/uploads/artwork writes. **Do not export raw HAR files**, cookies, Authorization headers, signed URLs or personal account data. If a saved-view action unexpectedly submits an analysis, uploads or mutates the artwork, stop and record the action; do not repeat it to collect more evidence.
7. If the existing app or an owner-held record provides canonical JSON legitimately, keep the original private. A review copy may redact personal identifiers/URLs while preserving local fact/note/role IDs and geometry. Screenshots alone cannot establish hidden references or exact provider coordinates. No new export endpoint, database access or schema change is required.
8. Fill one [result worksheet](production-manual-result-template.md) per result. Attach full, uncut evidence privately with permission; do not commit paintings/screenshots or full model responses. Use existing results before considering any new paid action.

## What to assess

Use the existing [sixteen-dimension rubric](grounded-artwork-assessment-acceptance.md#sixteen-dimension-human-rubric), not a new numerical quality score. For each claim/mark record **supported / uncertain / unsupported / not applicable / unverified**, exact text, source region, consequence and reviewer reasoning.

| Requested review area | Required evidence/check |
|---|---|
| Visual observations | Actual subject, position and relationship in the exact analysed image; no invented object or depicted-text instruction |
| Focal point/annotations | Each visible point/region/path identifies the named subject; unrelated UI/masses excluded; bounds, frame and landing agree |
| Composition | Actual masses/balance/movement distinguished from interpretive eye path; centrality/style not automatically defective |
| Colour versus value | Inspect original and genuine grayscale separately; hue/chroma prominence alone cannot establish strongest tonal contrast |
| Critique quality | Explain a meaningful strength and supported limitation if any; quality label agrees with rationale and surviving advice; no forced praise/weakness |
| Watercolour accuracy | Observation describes visible effects; future methods distinguished from original process; unknown materials not asserted; mixes plausible and approximate |
| Practical improvements | What/where/why, mechanism, restraint and expected effect; preserve focal/background hierarchy and successful decisions; major changes on a separate study |
| Teaching/exercises | Relevant to a supported relationship, one main variable with constants/comparison/success cue; no hidden unsupported defect |
| Contradictions/hallucinations | Compare every section, preservation/action, quality rationale, overlay and practice; distinguish factual failure from reasonable aesthetic disagreement |
| Displayed UX | Real selected mark/crop, legible labels, image proportions, grayscale/source consistency, navigation, mobile/keyboard behavior and saved-read side effects |

## Defect-to-fix rule

For a reproducible finding record result/source revision, exact claim/mark, expected relationship, severity, reproduction steps and the smallest responsible layer. A historical screenshot can establish what was displayed, but cannot identify the originating layer by itself.

* **Critical:** external UI as painting, materially wrong focal/supporting evidence, fabricated major object, wrong source link, ownership/data corruption. A current reproduction blocks artistic readiness.
* **High:** repeated hue/value confusion, unsupported technique/material certainty, implausible recipe, contradictory significant advice or systematic miscalibration.
* **Medium:** vague/repetitive teaching or a localized UX problem that does not materially mislead.

Check whether the development branch already addresses the category. If it does, verify the same legitimate result in a local, network-blocked replay where possible; do not claim a deployment fix. For a new code defect, add a sanitized failing regression and a disconfirming case, change the responsible validator/transform/component, then run affected tests and required checks. Never fix bad model geometry with fabricated replacement geometry or rewrite stored conclusions. Production prompt changes require preserving the old source lock/results and explicitly starting a new future benchmark experiment; the deferred benchmark must not be silently relabelled.

Completed expert reviews are not required to collect owner-supplied results or diagnose a deterministic UI defect. Genuinely independent artistic review is required for artistic acceptance, and two independent reviews for a model-superiority claim. No participation, ratings, improvement percentage or model winner is invented.

## Current outcome

Verified: source configuration, separate deployment mechanisms, two partial historical displays, preserved private originals, and zero new assessments/provider calls. Unverified: live deployment/model, complete exact-image critiques, current semantic geometry, educational usefulness and real interactive/mobile behavior. The immediate improvement is a usable saved-result evidence workflow and honest result/revision tracking. No new application defect has been reproduced with enough evidence to justify another code patch. The next useful input is a complete legitimate saved Church/Van or other assessment, with its exact analysed image and selected evidence states—not another independent paid API setup.

Only documentation and private review records changed. Existing completed engineering tests were not rerun for this documentation-only work. No production settings, architecture, schema, quota, auth, storage/RLS, credentials, workflows, merge or deployment changed. `/tmp` and `/workspace` are ephemeral; retain private review evidence in owner-controlled storage.
