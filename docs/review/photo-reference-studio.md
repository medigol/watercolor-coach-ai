# Photo-to-painting Reference Studio

Verdict: **BLOCKED FOR LIVE GENERATION**. The image-editing integration and application workflow are implemented, but no paid provider request, actual-photo output-fidelity evaluation, staging deployment or production migration was authorised/performed. This is a reviewable engineering implementation, not a validated AI image-generation release. Do not merge or deploy this Draft PR as an enabled generation service.

Baseline fetched from remote main: `5732b2ab8e9b4f5cda06d851791b4349d935400f`. Branch: `codex/photo-to-painting-reference-studio`. Production remains unchanged.

## Audit and resulting architecture

The old upload route used `ImageSelector` and `SaveResultButton` to call `generate-feedback` in `create_reference` mode. Its `gpt-4.1-mini` response was a text plan in `ai_results`, not image bytes. `ReferencePreparation`, `ReferenceImage.web` and `ReferenceAdjustment.web` displayed CSS grayscale/contrast/saturation/blur, explicitly without pixel exports. Both existing modes used the successful-feedback reservation/quota and account-owned private `artworks` bucket. Saved plans use the existing result validator/hook.

Those contracts remain intact. The old upload is available as **Text-only painting plan** (`/upload/create-reference?legacy=1`); its existing feedback allowance is disclosed. Ordinary `?id=` results still use the unchanged legacy saved-result reader and presentation. No critique prompt, response contract, quota, image preparation, assessment or saved-artwork implementation was rewritten.

The new path is additive:

1. `/upload/create-reference` → `ReferenceStudio.web.tsx`.
2. Pure, strict `shared/referenceStudio.ts` request/result contract, with immutable request ID, source/input SHA-256 and dimensions, optional parent, artistic goal, preserve flags, permitted changes, crop/rotation/adjustments and explicit paid consent.
3. `lib/referenceCanvas.web.ts` and `shared/referencePixels.ts` implement real local pixels. File signatures, decoded dimensions and orientation precede processing. Original JPEG/PNG bytes remain unchanged; canvas preparation flattens transparency onto white, creates a separate PNG and strips source metadata from the image sent for editing.
4. `transform-reference` authenticates through Supabase Auth, checks account and source ownership, validates hashes and fully decodes JPEG/PNG, claims a separate allowance, calls the **official image-edit endpoint once**, validates/decodes its PNG and saves private output bytes plus metadata.
5. `/result/create-reference?generation=<uuid>` loads the separate record and private bytes. It never generates on load/reload. The edited image leads; before/after, prepared input, intended changes, planning PNGs, conditional painting guidance and exports follow.
6. My Artworks includes an independent saved-image-reference list. A missing new backend/table produces a recoverable message without breaking legacy records. Refinement uses a completed own output as its source, verifies its parent hash, and requires a fresh explicit paid attempt.

The web implementation targets Android Chrome and desktop. Native builds show an honest unsupported-studio message rather than pretending to process pixels. No new frontend dependency or runtime image-generation subscription was added. Pinned `jpeg-js`/`pngjs` imports and integrity locks are confined to the new Edge decoder; the existing Edge type-check command now checks both functions.

## Actual capabilities

| Area | Implementation | Boundary |
| --- | --- | --- |
| Upload | JPEG/PNG, signatures, full browser decode, orientation correction, original export | 10 MB, 8 MP, 16–4096 px/side; WebP/HEIC/SVG/animation unsupported in this studio |
| Local preparation | Manual percent crop, 90° rotation, brightness, contrast, saturation, approximate warm/cool RGB shift | Real PNG bytes; no semantic object removal or calibrated Kelvin claim |
| Artistic direction | Seven intentions, three strengths, protected subjects/geometry/identity/lights/colours, specific details, five permitted-change families, mood/detail/colour and bounded instruction | Qualitative model instructions, not guaranteed edit precision |
| AI output | One image-conditioned edit using prepared source pixels | Requires new backend, configuration, allowance, funding approval and real provider verification |
| Composition format | Prepared aspect retained approximately in provider-supported 16px increments, around 1 MP, max edge 1536 | Ratios outside 1:3–3:1 rejected; no forced square/thirds/3:2 template |
| Planning | Actual 3/5-group perceptual-lightness quantisation and optional spatial block grouping; pixel-area fractions | Approximate tonal study, not semantic segmentation, focal detection or artistic scoring |
| Comparison | Original/improved, with prepared input separately inspectable | Each image keeps its own ratio; requested changes explicitly remain unverified |
| Export/save | Actual prepared/generated/value/shape PNG bytes, unchanged original, text painting plan; private generated record saved on completion | No CSS-to-image claim; no signed URLs stored |
| Alternatives | Explicit refinement from chosen output with parent lineage | No automatic four-image call or free regeneration |

An 8 MP limit is deliberately conservative for Edge decode memory. Many full-resolution phone photos exceed it and need a smaller source; automatic archival of larger originals and a worker-based decoding pipeline remain future work. A hard refresh cannot restore a browser `File`; settings/receipt remain account-scoped and completed images remain privately saved.

## Provider research, configuration and cost

Official documents retrieved and inspected on 2026-11-06:

- [GPT Image 2 model and snapshot](https://developers.openai.com/api/docs/models/gpt-image-2): image input/output, editing endpoint, `gpt-image-2-2026-04-21` snapshot. The inspected GPT Image 1.5 page now marks that model deprecated; it was not chosen.
- [Image generation/editing guide](https://developers.openai.com/api/docs/guides/image-generation): official multipart source-file edit examples, one or multiple source images, PNG/base64 output, masks as guidance rather than exact regional guarantees. GPT Image 2 accepts flexible dimensions in 16px increments, ratio at most 3:1, 655,360–8,294,400 pixels, max edge 3840. It always uses high-fidelity input: **omit `input_fidelity`**.
- [Edit API reference](https://developers.openai.com/api/reference/resources/images/methods/edit): endpoint, `n`, quality, output format, dimensions, base64 response. This implementation uses one PNG source, `n=1`, `quality=medium`, `output_format=png`; no unsupported response-format/input-fidelity/compression parameter. No mask/markup precision UI is offered. Our input limits are stricter than the provider guide; its 50 MB mask/image discussion is not used as this app's size limit.
- [Provider pricing](https://developers.openai.com/api/docs/pricing): token-based image/input/output cost and calculator guidance. The inspectable page exposed a **Batch** row for GPT Image 2, not an unambiguous standard synchronous quote for this pinned integration. Batch prices are not applicable to our synchronous edit. No fixed dollar estimate, per-image promise or inferred standard price is displayed. **Confirm current standard pricing with the official calculator and the actual organisation before enablement.**
- [API data controls](https://developers.openai.com/api/docs/guides/your-data): API data is not used for training by default; ordinary abuse-monitoring retention can be 30 days and exceptions/settings apply. Do not promise zero retention. Owner must review organisation policy, image safety retention and user disclosure.

`provider.ts` uses only `https://api.openai.com/v1/images/edits`. The prepared PNG is sent as an uploaded source file. The result must contain exactly one base64 image, not a URL. Response streaming reads are capped at 16 MB; decoded image at 10 MB; provider timeout 105 seconds. The response must decode as PNG at the requested dimensions. There are no retries, fallbacks, downloads from provider-supplied URLs, second vision/text calls or image-provider requests on render. Only authenticated non-billable capability/read requests occur.

Server-only requirements:

| Setting | Default / purpose |
| --- | --- |
| Supabase URL, anon and service role | Existing Edge environment; never frontend service-role access |
| `REFERENCE_STUDIO_OPENAI_API_KEY` | Dedicated server secret, **no fallback to the critique key**; use an owner-reviewed project/budget |
| `REFERENCE_STUDIO_ENABLED=true` | Explicit feature enablement, default off |
| `REFERENCE_STUDIO_BUDGET_ACK=image-edits-v1` | Owner/operator acknowledgement of reviewed pricing, funding, retention and the separate attempt policy |
| `reference_generation_accounts` | Default absent/disabled, limit zero; owner must grant a bounded allowance through privileged administration |

An allowance is a **maximum attempted image edit**, not a successful-feedback credit, dollar cap or promise that a failed request is free. A claimed slot remains accounted for on uncertain completion. No image attempt refunds itself; no process resets critique counters. Initial global concurrency is one pending/uncertain generation. Count limits do not enforce a dollar cap. Provider/project budget alerts may be advisory; verify their enforcement and the approved bounded allowance before enablement, and monitor actual usage. A presence-only check found no dedicated studio key, feature enablement or budget acknowledgement in this execution environment. No production secret was inspected; this is not a statement about hosted project secrets. Live tests executed: **zero**; paid calls: **zero**; authorised live budget: **none**.

## Security and state handling

- Actual Auth verification rejects anonymous sessions and owner mismatches; UUID/path schema rejects remote URLs, traversal, extra fields and uncontrolled options. User text/image text is untrusted task data, never a privileged prompt. No credentials enter prompts.
- Both stored source and input are downloaded through the user's authenticated private-storage client, then checked against immutable bytes, SHA-256, signature, format, dimensions and complete decoder output before reserving a paid attempt. Header workload checks happen before decoder allocation. Filename/MIME alone is insufficient.
- Private objects use `<owner>/<request>/source.jpg|png`, `input.png`, `generated.png`. Insert-only source/input objects and service-written output are distinguishable. Accounts without an enabled, remaining separate allowance cannot insert studio sources, even alongside a broad storage policy. Restrictive policies prevent cross-account reads/writes, forged generated output, overwrite and premature deletion even alongside a broad permissive policy.
- New record has its own owner, original identity and optional parent identity; no permanent signed URLs. Browser reads verified bytes through authenticated downloads, creates local object URLs, and revokes those URLs on component cleanup. Settings and receipts use a separate account-scoped session key, never a learner-progress key, bearer token, image bytes or expiring signed URL.
- The client writes a receipt before upload/dispatch. Busy guards, disabled controls and immutable request IDs prevent accidental duplicate taps. A read/status/reload never resubmits the provider operation. Background completion does not redirect a learner who navigated away.
- Atomic SQL reservation uses a global advisory lock and a separate account row/counter. Repeating a request returns its record; a changed payload under the same ID conflicts. There is no expiring lease that could accidentally dispatch a second billed call.
- States are `pending`, `completed`, `failed`, `uncertain`. Completion means validated stored image bytes, **not artistic approval**. Provider timeout, invalid/partial output, upload failure after provider, or ambiguous commit stays uncertain. Pre-dispatch rejection produces no paid call. Definite failed state is available to controlled owner reconciliation, not an automatic retry loop.
- No raw image, provider payload, credentials or signed URLs are logged by the new endpoint. Frontend bundle audit rejects server configuration names, paid provider endpoint and fixture markers.

### Proposed migration and recovery

`supabase/migrations/202611060001_reference_studio.sql` is additive and **not applied to production**. It creates only two new tables, three service-only RPCs and a separate private bucket/policies. Existing `schema.sql`, feedback quota/RPCs, Auth triggers, saved-artwork and assessment tables are unchanged. New policy conditions are neutral for the existing bucket. Migration reruns and permission/concurrency checks use a network-isolated disposable PostgreSQL 16 container.

Before a staging rollout: owner approval, backup, review grants/RLS and pricing, apply this migration in staging, deploy only the new function, configure a dedicated key, and grant at most the explicitly funded test allowance. Leave production untouched until separately authorised.

If completion is uncertain: keep the record and receipt; do not reissue the provider call. Disable new work if necessary. An authorised operator privately checks the owned output, dimensions/hash, provider request/billing evidence and expected source. Reconcile one exact owner/request transaction to completed only with validated bytes, or failed only when justified. Never automatically refund/reset an uncertain allowance. Any replacement allowance needs a fresh funding decision. An unresolved attempt currently blocks other image generations globally; a durable worker/reconciliation workflow is required before wider scale.

Rollback starts by disabling the feature/account grants. Preserve records and private objects for export/reconciliation. Never drop pending/uncertain records or reset existing counters. Future deletion/retention administration and rollback archiving need owner review; this milestone does not implement a user-facing image-reference delete tool.

## Artistic claims and limits

The prompt protects purposeful framing, negative space, subject identity, perspective, values and highlights; no universal thirds/off-centre/dark-focal rule. Local crop is deliberate. Model edits are approximate and cannot guarantee protected features, exact selected-object changes or likeness. The original is the fallback reference.

What Changed distinguishes recorded pixel operations from **requested, unverified** AI modifications. Written painting guidance follows the chosen intention, not invented semantic analysis of the output. The value study is computed from the selected image. It supplies approximate lightness groups; it cannot decide which region should be focal, whether a building is correct or whether the result is a better painting subject.

Four original synthetic category fixtures exercised landscape/urban/botanical/portrait input plumbing and controls. They are simple deterministic pixel fixtures, **not actual photographs, provider outputs, examples of meaningful artistic alternatives or evidence of paintability**. Browser screenshots carry a conspicuous local-fixture banner. No private user image was committed.

| Required artistic test | Status |
| --- | --- |
| Complex-foreground landscape: simplify without removing subject | NEEDS AUTHORISED REAL PROVIDER TEST / HUMAN REVIEW |
| Urban photograph: perspective, windows, proportions, faithful geometry | NEEDS AUTHORISED REAL PROVIDER TEST / HUMAN REVIEW |
| Botanical/still life: shape/colour fidelity, manageable value masses | NEEDS AUTHORISED REAL PROVIDER TEST / HUMAN REVIEW |
| People/portrait: identity, anatomy, no unintended additions/removals | NEEDS AUTHORISED REAL PROVIDER TEST / HUMAN REVIEW |
| Watercolour usability, intention and meaningful improvement | NEEDS PRACTICAL PAINTER / OWNER REVIEW |

No numerical artistic score or guaranteed improvement percentage is assigned. Provider access/capability is documented, but organisation access, actual model output, charged usage, practical fidelity and physical Android Chrome have not been tested.

## Validation and evidence

See [machine-readable execution record](photo-reference-studio-validation.json) for exact commands, results, log hashes and scope, and [actual application screenshots](screenshots/photo-reference-studio/README.md). Do not count the focused tests again on top of the full suite. Decoder tests use real pinned libraries; provider integration tests use deterministic responses. Browser generation images are fixture bytes, never claimed genuine AI output.

Legacy browser harnesses now recognise the separate read-only reference list and the explicitly non-billable `capabilities` action. The learning harness still forbids generation/storage operations; the old text-plan scenario explicitly opens `?legacy=1`. Existing paid-call/ownership/save assertions remain. UI unit stubs only isolate the added route/list leaves; the new browser suite covers those actual components.

## Readiness gates and next action

Engineering implementation is present for controls, secure boundary, comparison, local planning, storage/read compatibility and cost guards. **Gate 1 real output, Gate 3 fidelity, Gate 4 paintability and actual-provider portion of Gate 8 remain open.** Pricing confirmation, approved funding, staging infrastructure and independent artistic evaluation remain blockers; no successful release is claimed.

Next: owner review of this Draft PR, migration/RLS/cost policy and the actual provider pricing; explicit capped budget and staging authorisation; then one deliberately requested, independently accounted edit per permissioned photo category (no automatic batch of four), recording actual usage, output fidelity and failure/recovery behaviour. Human artistic and Android Chrome review precede any controlled Beta deployment. Do not merge/deploy automatically.
