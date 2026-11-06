# Reference Studio: staging operations and first paid test

Verdict: **CONDITIONALLY READY FOR STAGING TEST**. Engineering preparation is implemented; actual staging preflight remains **BLOCKED** until the owner supplies the named environment, deployment/read permissions and first-test approvals. No artistic output quality has been verified. Operational safeguards and local recovery drills are implemented. Organisation access, current project pricing, a staging destination, transmission permission and a paid budget are still unverified or unauthorised. No hosted migration/deployment, credential configuration or image-generation request was performed in this pass. This document is a future checklist, not deployment authorisation.

Initial operational review started at `2c056f3a46249c1011ca41331dc6aa75e0b238b2`; this final staging pass fetched and verified `5f91a56acb5acff0c36b23c931d1d51fc8a9e903`, existing Draft [PR #44](https://github.com/medigol/watercolor-coach-ai/pull/44). Production/main: `5732b2ab8e9b4f5cda06d851791b4349d935400f`. The [original implementation report](photo-reference-studio.md), [new validation record](photo-reference-studio-operations-validation.json) and [four-photo acceptance manifest](photo-reference-studio-acceptance-set.json) have separate scopes.

## Official pricing recheck, 6 November 2026

There is an unresolved discrepancy with the owner's quoted standard rate. The retrieved [developer pricing table](https://developers.openai.com/api/docs/pricing.md), under **Standard**, lists `gpt-image-2` at **$8/M image input, $30/M image output and $5/M text input tokens**. Its **Batch** table lists **$4/$15/$2.50**. This integration makes a synchronous Images edit; it does not use Batch. The fetched [public pricing page](https://openai.com/api/pricing/) did not contain a standalone GPT Image 2 card in the inspected response; the newer Image 2.6 cards are not a substitute quote for this pin. The image guide's calculator supplied $30/M output. Consequently this pass cannot confirm $4/$15/$2.50 as the applicable synchronous price. The owner should resolve this against current official pricing and the actual API project's terms before authorising a charge.

The [model page](https://developers.openai.com/api/docs/models/gpt-image-2) identifies `gpt-image-2-2026-04-21` as the GPT Image 2 snapshot. The family pricing is the available documentation basis for that pin; no organisation-specific price was checked. No cached-input discount is assumed: the inspected table limits the GPT Image 2 cached image rate to the Responses API, while this code uses Images.

The [official guide calculator](https://developers.openai.com/api/docs/guides/image-generation#calculating-costs) and its served calculator module were inspected. For medium quality, let `R=max(width,height)/min(width,height)`, `S=round-half-to-even(48/R)`, and `P=width*height`. Its estimated output tokens are `ceil(48*S*(2,000,000+P)/4,000,000)`. The independently implemented, offline [calculator](../../scripts/reference-cost-estimate.cjs) checks supported dimensions and shows both price scenarios; it never calls an API.

| Medium output | Estimated output tokens | Output-only at $15/M (unconfirmed for this endpoint) | Output-only at retrieved $30/M Standard |
| --- | ---: | ---: | ---: |
| 1024 × 1024 | 1,756 | $0.02634 | $0.05268 |
| First landscape: 1152 × 912 | 1,392 | $0.02088 | $0.04176 |

Total estimated cost is `(image-input-tokens*image-input-rate + text-input-tokens*text-input-rate + output-tokens*output-rate)/1,000,000`. As an explicitly hypothetical example, **2,000 image input tokens + 800 text input tokens** makes the square edit **$0.03634** at the lower rates, or **$0.07268** at retrieved Standard; the first landscape would be **$0.03088 / $0.06176**. Those input counts were **not measured or predicted**. The official [vision guide](https://developers.openai.com/api/docs/guides/images-vision) warns that its vision patch/tile calculators do not estimate GPT Image generation/edit input cost. Historical GPT Image 1 rules must not be applied to this model. No exact all-in image price is claimed.

Actual usage, tokenisation, revised prompts, applicable rates, tax/currency and provider billing decide the charge. An HTTP error, invalid output, timeout or lost connection is not evidence of zero billing; upstream work may continue after a local timeout. Even a valid paid output can fail during storage/commit. Usage metadata is useful evidence, not an invoice. Missing metadata is not zero tokens. Attempt limits bound dispatch count, not dollars, and provider budget alerts may be advisory. Do not promise a hard dollar stop unless the actual project supports and verifies one.

## Provider contract and unverified account prerequisites

The current [Images edit reference](https://developers.openai.com/api/reference/resources/images/methods/edit) and [image guide](https://developers.openai.com/api/docs/guides/image-generation) support image-conditioned editing. The guide retains multipart file examples even though the reference also describes JSON image inputs. The implementation sends exactly:

- `POST https://api.openai.com/v1/images/edits`, server-only Bearer key.
- Multipart `model=gpt-image-2-2026-04-21`, one prepared `image` PNG file, bounded `prompt`, `n=1`, `quality=medium`, explicit `size`, `output_format=png`.
- No `input_fidelity` (Image 2 always uses high-fidelity input), `response_format`, output compression parameter, automatic mask, fallback model or second paid call.
- One base64 result is required; no provider URL is fetched. The response body is capped at 16 MB, decoded PNG at 10 MB, dimensions at the requested 16px grid near 1 MP/max edge 1536. The provider's broader limits are not the app's acceptance limits.
- Provider timeout 105 seconds. Auth, two source downloads/decodes, receipt persistence, output storage and DB commit add time. Verify the staging Edge plan's wall-clock/CPU/memory limits for the whole operation. A worker interruption can leave a billed request uncertain.
- `X-Client-Request-Id` is the immutable generation UUID. The [official request-ID documentation](https://developers.openai.com/api/reference/overview) describes tracing/support lookup, **not an idempotency guarantee**. At-most-one application dispatch comes from the database gate, not that header.

Only a safe provider request ID, HTTP status and available bounded integer usage counts are persisted. No images, prompt, raw error body, API key or signed URL is added to logs/audit notes. A receipt write failure never repeats an edit or intentionally rejects a valid image. A transport failure may have no receipt at all.

Documentation establishes the API contract, **not access for this organisation**. Before a paid test the owner must verify in the actual staging OpenAI project: billing/funding; model and Images-edit permission for the pin; applicable usage tier/rate limits; dedicated project-key permission; any required [API organisation verification](https://help.openai.com/en/articles/10910291-api-organization-verification); retention and permitted subject handling. The documented free tier does not provide GPT Image 2 access. A key existing or a model-list entry alone would not prove editing permission. No authenticated model listing or edit was attempted here. See [API data controls](https://developers.openai.com/api/docs/guides/your-data); do not promise zero retention or a model release.

## Findings and implemented corrections

The original conservative global reservation is deliberate: **any pending or uncertain request blocks all new image generations**, without expiry. It protects against repeating a potentially billed request but requires operator intervention. Age, an elapsed timeout, a browser reload or a missing output never releases it.

The isolated PostgreSQL audit reproduced two defects before applying the fix, inside transactions that were rolled back:

1. `WITH CHECK(false)` does not protect DELETE. Existing table grants were read-only, but a future client DELETE grant/permissive policy could remove a reservation or account counter. New restrictive DELETE policies explicitly deny it.
2. A PostgreSQL CHECK accepts UNKNOWN: the old completed-record constraint allowed a null output path with non-null metadata. A new constraint requires the exact non-null owned path, pinned model, SHA-256, bounded bytes and the correct requested output dimensions.

The follow-up [migration 002](../../supabase/migrations/202611060002_reference_operations.sql) adds an atomic dispatch gate and audited reconciliation. Claim, dispatch, ordinary completion and reconciliation use the same global advisory lock. A fresh reservation starts `reserved`; a single successful `begin_reference_dispatch` changes it to `dispatched`. Cancellation and dispatch cannot both win. If its RPC response is lost, the worker does **not** call the provider and keeps the hold conservatively. Pre-migration rows are backfilled as dispatched, even when old: their history cannot safely be inferred.

Reconciliation requires a fresh owner/request/status/phase/`updated_at` snapshot and an immutable operation UUID. Stale snapshots and conflicting operation reuse fail. Repeating the identical reconciliation is safe; it does not generate. Completion requires an existing exact private output object and strictly validated output metadata. Terminal recovery requires worker-drain evidence; dispatched requests also require independent upstream terminal evidence. An unresolved request remains uncertain. Counters remain consumed in every resolution; there is no automatic refund. Canonical request comparison also makes a same-ID replay read-only regardless of JSON key order.

Migration 002 is required by the new worker. An enabled account's capability check fails closed unless the service-only operations version is present. Deploying only the code is not a usable rollout. Deploying the migration while an old worker remains active is unsafe: disable and drain old code first, and never roll back to code that bypasses the dispatch gate.

## Database and storage review

Both additive migrations were tested on isolated PostgreSQL 16 (`--network none`, no published port), including reruns. Existing `schema.sql`, feedback quota/RPCs and unrelated production tables remain unchanged. Tests cover two-account isolation, anonymous/client denial, source entitlement, future broad policies, private output forging/update/delete denial, duplicate/conflicting IDs, concurrent claim/dispatch, legacy quarantine, cancellation, stale recovery, missing objects, invalid metadata and unchanged critique counters.

`reference_generation_accounts` and `reference_generations` remain owner-readable, client non-writable. New reconciliation history is service-only, RLS-enabled, and contains bounded operator/evidence references and safe output metadata. Claim, completion, uncertainty, dispatch, receipt, version and reconciliation RPCs are not executable by public/anon/authenticated. Functions that elevate privileges fix `search_path`. Private Storage paths remain `<owner>/<request>/source.jpg|png`, `input.png`, `generated.png`; clients insert entitled immutable sources, only the server writes generated output. Other buckets' policy behaviour is preserved. No expiring signed URL is persisted.

Storage entitlement is not a total storage-byte quota: an enabled account with an unused attempt can upload more than one source/input pair before dispatch, and abandoned preparations can leave private objects. The UI and supervised one-account staging procedure limit the intended use; they are not abuse prevention for a broad release. Inventory staging objects and keep the test account disabled outside the approved window. Upload tickets/per-account storage budgets and retention/deletion administration need a separate design before general availability.

Privileged service/database operators can bypass RLS and can delete an Auth user with cascading records. **Do not delete an account, generation, allowance or output while a request is unresolved.** The application does not implement account deletion; administrative deletion/retention needs a separate drain/archive process. Local PostgreSQL tests do not reproduce the hosted Storage server, hosted Auth configuration or Edge deadlines; staging must verify those independently.

## Safe operator reconciliation (staging only after authorisation)

This is an existing-request recovery procedure, never a generation retry:

1. Confirm the exact **staging** project/account/request. Disable new studio dispatch and the test account's entitlement. Do not touch critique allowance. A secret/flag change alone does not prove old worker termination. Account disablement prevents a not-yet-passed gate, but cannot stop a request that already passed it.
2. Drain every worker/version authorised to handle the request and check provider disposition using the request receipt, client UUID, provider support/usage and private incident records. Worker drain is not provider drain. If completion is ambiguous, or provider terminal status cannot be established, **keep the global hold**. Never release by time or assume that a 4xx/timeout is non-billable. No second generation is a diagnostic step.
3. Fetch a fresh private `reference_generations` row for the exact owner/id, including request JSON, status, dispatch phase, `updated_at` and safe receipt fields. Keep it outside the repository. Inspect only the owned bucket path `<owner>/<id>/generated.png`; no search across other accounts. A file downloaded elsewhere does not prove this object's provenance.
4. Choose one resolution: `uncertain` to retain the hold; `failed` only with a justified terminal/no-recoverable-output disposition; or `completed` only with independently verified existing output, correct association, PNG decode/dimensions/hash and the worker/upstream terminal evidence. A still-reserved request can be cancelled without a provider-terminal attestation only after old workers are drained and the gate's applicability is certain. Pre-gate rows are not eligible for that inference.
5. Build a payload **offline** using the committed tool. It cannot connect to a service, upload or generate. For example, with private files and reviewed identity/evidence values:

   ```sh
   deno run --cached-only --allow-read \
     supabase/functions/transform-reference/reconcile-plan.ts \
     --record /private/staging-record.json \
     --owner OWNER_UUID --operation NEW_OPERATION_UUID \
     --resolution completed --operator OPERATOR_NAME \
     --evidence 'Private incident CASE-ID; worker and upstream terminal evidence checked' \
     --workers-drained true --provider-terminal true \
     --output /private/owned-generated.png > /private/reconcile-parameters.json
   ```

   `OWNER_UUID`/`NEW_OPERATION_UUID` are placeholders, not executable identities. The tool needs the pinned decoder cache, normal TLS verification and no `--allow-net`. For `failed`/`uncertain`, omit `--output`; never assert terminal/drained without evidence. The payload contains CAS fields and validated metadata, not source bytes or a prompt. Use a short private evidence/ticket reference; never paste keys, signed URLs or raw provider content into notes.
6. Independently review the payload and execute **one** `reconcile_reference_generation` RPC using separately authorised staging service-role administration. The tool does not execute it. Preserve its operation UUID. A stale-snapshot refusal requires a fresh investigation, not blind parameter replacement. The database verifies the owned output object's existence; the operator remains responsible for matching the downloaded bytes and provenance.
7. Read the final row, audit row and consumed allowance. Reopen the saved reference as its owner, download/export it, reload with **zero generation**, and confirm a second account cannot read it. `failed` does not restore a slot. Any further allowance requires a new budget/permission decision. Retain unresolved evidence privately.

Recovery drills in this pass use synthetic storage metadata and generated test PNGs in a disposable DB, not real provider results. Do not deliberately interrupt a paid request or rewrite a completed hosted row to simulate uncertainty. Test normal saved-output reopening on the first real edit; use local fixtures for the lost-response drill.

## Staging deployment and rollback checklist — not performed

- Obtain separate owner authorisation naming a non-production Supabase project/ref, preview frontend URL, test-account UUID and deployment scope. Do not copy production user data or point the preview at production. Keep the current GitHub Pages site and feedback function unchanged.
- For a fresh staging project, establish/review the baseline schema first. Back up any existing staging data, inventory legacy unresolved requests, disable/drain old workers, then apply migrations 001 and 002 in order. Conflicting pre-existing invalid rows should stop the migration for investigation, not be deleted/reset. Verify private bucket/grants/RLS and `reference_operations_version() = 'reference-operations/v1'` through privileged administration. Leave accounts disabled/allowance zero.
- Deploy only the reviewed `transform-reference` function and a frontend preview with staging **public** config. Verify function deployment/JWT handling, required server secrets, hosting deadlines and configuration-read behaviour. Auth verification still occurs inside the handler. No secret belongs in the static frontend. A Supabase project deploy alone does not establish OpenAI model permission.
- The existing Supabase GitHub workflow deploys **generate-feedback only**; it is not a Reference Studio deployment mechanism and must not be dispatched for this test. The Pages workflow targets production main. Neither workflow was changed or invoked. A future authorised staging operation must name `transform-reference` and the explicit staging ref, without deploying critique or Pages.
- Only after the owner confirms project access, pricing/retention, source transmission permission and a bounded one-request budget may an authorised operator configure the dedicated staging key/ack/feature flags. Do not use the critique key or grant image generation to ordinary accounts. Keep a named operator available for the global hold.
- Grant at most **one additional attempted request** to the named staging account, without resetting `attempts_reserved`. For a fresh account this is limit 1. A previously used account requires `attempt_limit = attempts_reserved + 1` (within the schema limit) and fresh approval. No automatic allowance rollover to the other three photos.
- Rollback: disable feature and account entitlement, drain workers, reconcile/retain unresolved requests, preserve private output/read/export access and audit/counters. Do not drop tables/bucket, delete rows, decrement counters or revert to a pre-gate worker. Any later destructive removal needs separate archival/retention authorisation. No hosted rollback was executed here.

## Photo acceptance set: separate smoke and product-value tests

The [manifest](photo-reference-studio-acceptance-set.json) preserves the original four real public photographs and adds a separate CC0 colour landscape. It specifies exact source pages/download derivatives, byte lengths/SHA-256, copyright basis, controls, direction hashes, protected elements, requested edits, unacceptable changes and nine qualitative review questions. All five selected JPEGs were downloaded only to a temporary local directory, visually inspected and fully decoded with the actual server decoder. **No photo bytes were committed, uploaded to Supabase or sent for generation.** Copyright clearance is documented; owner transmission permission and all paid budgets remain false/null. People need an additional likeness/endorsement review; no model release was obtained.

| Case | Source and selected input | Protect / request | Unacceptable |
| --- | --- | --- | --- |
| First: landscape | Ansel Adams, Tetons/Snake River, NARA; PD-USGov; Commons 1920 × 1537 derivative | Preserve strong monochrome composition, ridge/snow, river bends and foreground silhouettes; quietly simplify small foreground foliage | Colourisation, moved river/ridge, invented objects, erased lights, simulated paper texture |
| Architecture | W. N. Manning/HABS, Sayre-Troy House, LOC; PD-USGov-NPS; 1920 × 1373 JPEG derivative | Preserve building/columns/visible openings/roof/steps and tree occlusions; reduce minor foliage/grass texture | Inventing hidden facade behind trees, new windows/columns, perspective drift, redesigned house |
| Botanical | Boopathi Raja123, Pink Rose flower-; CC0; 1080 × 1132 original JPEG | Preserve pink rose/petals/stem/leaves/light; reduce competition from bright background blooms | New/missing petals, changed main-flower identity/hue, anatomical distortion or uniform blur claimed semantic editing |
| People, last | NASA, Eileen Collins portrait; PD-USGov-NASA; 1280 × 1620 derivative | Preserve face/age/expression/hair/hands/suit patches/flag/shuttle; quiet backdrop texture only | Identity/beauty edits, extra fingers, altered insignia/text/model geometry, implied endorsement |

The landscape already has a strong composition: preserving the original or finding no useful improvement is a valid outcome. These two monochrome cases do not test colour harmony; botanical/people supply colour coverage later. The HABS archival TIFF is not the upload candidate; use the pinned JPEG derivative. A full-resolution landscape JPEG (7.2 MP) passed header bounds but exceeded the 100 MB JPEG decoder budget; the smaller selected copy passed. An earlier rose candidate contained visible artificial ripple distortion and was rejected. These are input findings, **not output-quality findings**.

To reproduce the input preflight after downloading the five proposed candidates as `landscape.jpg`, `architecture.jpg`, `botanical.jpg`, `people.jpg`, `colour-landscape.jpg` outside the repo:

```sh
deno run --cached-only --allow-read \
  supabase/functions/transform-reference/check-acceptance-inputs.ts \
  docs/review/photo-reference-studio-acceptance-set.json /private/photo-candidates
```

A changed hash/direction/photo requires renewed owner approval; do not silently substitute a private photo or a different Commons derivative. Source pages and rights should be rechecked before any publication; this set is intended for private educational staging evaluation.

## First one-image sequence and stop conditions (Test A only)

1. Owner approves only `reference-landscape-01`, its exact JPEG SHA and direction SHA from the manifest, `subtle/simplify`, no crop/rotation/pixel adjustments, one `n=1/medium` edit, an explicit maximum USD budget and transmission to the named OpenAI staging project. A numeric budget has **not** been supplied. Resolve pricing/access before this approval is acted upon.
2. In the staging preview, sign in as the named account; verify original, prepared input/settings, about 1 MP output (1152 × 912), allowance and explicit paid consent. Select **Generate improved reference once**. Record its UUID privately. No other tab/account/queued category may generate. No automatic retry, variation, second model or fallback is allowed.
3. If pending/uncertain, stop and follow reconciliation above. A browser error is not permission to click a new attempt. If completed, inspect actual PNG bytes/hash/dimensions, source association, provider request trace and any usage counts, private saved record, read/export/reload and second-account denial. Check the actual provider billing/usage record when available; if attribution is delayed or ambiguous, keep the next test on hold. Do not claim a hypothetical calculator figure is the charge.
4. Perform the manifest's qualitative review against source and prepared input: fidelity, composition, lights/values, colour, detail/focal hierarchy, geometry/anatomy, unrequested edits, paintability and actual changes. Mark observed evidence and reviewer. Outcome may be useful, preserve-original/no-benefit, reject or hold. Generated does not mean artistically approved. Do not publish source/output or call them real outputs in docs before permission.
5. Stop after this one request regardless of success. Report actual charge/uncertainty, saved-output recovery and artistic findings. Only then may the owner approve **one separate Test B** colour case, with its own transmission scope, configuration hash, budget and window. Architecture/botanical/people remain independent optional tests; people require likeness review or an explicitly re-approved consented replacement. This is not an automatic four-image test plan.

The first-test approval must record these concrete values, rather than merely saying "enable AI": staging Supabase ref and preview URL; test account UUID; OpenAI organisation/project; approved commit; case `reference-landscape-01`; source SHA `da9e2f054a9b2907971245d3d6152366fc6dc4e4b97753fa47ffb19e41956f9d`; direction SHA from the manifest; `gpt-image-2-2026-04-21`, one medium image; resolved pricing basis; maximum USD budget; source-transmission/retention permission; named operator; and the authorisation's time window. If dimensions, bytes, direction or pin change, stop for re-approval. A one-attempt allowance is not a provider-enforced dollar cap.

## Remaining limitations and owner actions

JPEG and PNG only: common phone HEIC/HEIF, AVIF, WebP and RAW are unsupported, not silently converted. Files over 10 MB, decoded header dimensions over 8 MP/4096 per side, malformed data and extreme ratios are rejected. The 8 MP header cap is not a guarantee of decodability under the 100 MB JPEG memory budget. A smaller exported copy may be needed; keep the original elsewhere. Prepared provider PNGs are limited to edge 1536, strip source metadata and flatten transparency; private originals retain their original bytes/metadata. A hard refresh cannot restore an unsaved browser File.

Output is near 1 MP in 16px increments, not a high-resolution print master or exact source aspect. There is no guaranteed local object editing, mask fidelity, geometry/identity preservation, measurable aesthetic improvement or physical painting history. Planning is approximate computed lightness grouping, not semantic shape analysis. The global unresolved hold/manual recovery is suitable only for a tightly supervised test, not general availability. Saved listing is currently bounded to the latest 30 records and there is no user-facing deletion/retention tool.

Physical Android Chrome, actual provider rendering/access/billing, hosted Edge/Storage/RLS and practical watercolour usefulness remain untested. Browser Chromium fixtures verify software mechanics only. Independent artistic signoff remains open.

**Exact remaining owner actions for the first authorised staging edit:** confirm the applicable project price and model/edit access; name/authorise staging infrastructure and the test account; authorise the staged migration/function/preview and dedicated-key configuration (separately from this read-only/local pass); approve the pinned first photo/direction and provider transmission/retention; specify a one-request USD budget and operator; then authorise that single deliberate edit. No production change, additional photo or retry is implied.


## Reproducible staging artifacts and preflight

The committed [profile template](../../config/reference-staging.example.json), [preflight tool](../../scripts/reference-staging-preflight.cjs), [read-only SQL](../../scripts/reference-staging-snapshot.sql) and [reviewed database definition fingerprints](../../config/reference-staging-database-contract.json) are the deployment preparation. The default profile contains **null identifiers, false permissions and no budget**. No project/account has been invented or provisioned. Do not put real tokens, passwords or photographs in these tracked files.

`node scripts/reference-staging-preflight.cjs` is offline/read-only by default. It checks the working branch, exact expected commit, clean tree, profile separation, fresh evidence, migration/guard definitions, service-only grants, RLS/private bucket, dedicated Auth user, allowances/global hold, function release/model/configuration and operator approval. Missing evidence is BLOCKED, not a simulated success. Exit 2 means blocked; exit 0 means the supplied evidence passed its stated phase, not that the tool generated anything.

The optional `--collect-read-only <private-output.json>` mode must be explicitly selected and requires a complete owner profile with `stagingReadAuthorised=true`. It uses only `REFERENCE_PREFLIGHT_STAGING_ANON_KEY` and `REFERENCE_PREFLIGHT_STAGING_USER_JWT`, from environment variables. It reads the exact staging `/auth/v1/user`, verifies the named non-anonymous owner, then posts **only** `{action:"capabilities"}` to the exact staging `transform-reference` endpoint. It refuses the production ref, redirects, mismatched accounts and missing permission; it does not retry. It cannot upload photos, invoke generation, read OpenAI, configure secrets or execute SQL. Reports expose environment presence as booleans, never credential values, raw Auth records or provider payloads.

Capabilities now report the pinned runtime contract, public release SHA, one/medium/PNG settings, automatic-retry=false, feature/budget flags and environment **presence**. A release SHA is an operator deployment attestation, not cryptographic proof of a hosted bundle or OpenAI access. Match it with the independently reviewed artifact hashes and platform deployment record. Database fingerprints detect changes to the eight guarded functions, relevant policies and completed-row constraints; they are drift checks, not independent certification. SQL exports are private operator-supplied evidence: verify the actual staging project selection when exporting them. Different PostgreSQL formatting/versions can cause a safe hash mismatch; stop and review the definitions rather than replacing expected hashes automatically.

### Exact future setup, after separate staging authorisation

1. Copy the profile outside the repository. Fill the reviewed PR commit, actual **different** production/staging Supabase refs, HTTPS staging frontend URL on a different host from production Pages, named test-user UUID and isolated OpenAI project/budget declaration. Keep `phase=disabled`, all paid approval fields false/null. Record the owner authorisation for staging deployment and reads. These values are currently missing.
2. Fetch the existing PR branch and verify that exact clean commit. Prepare a new empty directory outside the repo:

   ```sh
   node scripts/reference-staging-preflight.cjs --profile /private/staging-profile.json --prepare /private/reference-staging-artifact
   ```

   The artifact contains only the new function's runtime dependency tree, pinned Deno configuration/lock, migrations 001/002, a **transform-reference-only** Supabase config, source SHA-256 manifest and bound read-only SQL. It contains no image/key/user data and performs no deployment. Missing identifiers or a dirty tree mark the artifact review-only; do not deploy it. The normal production repo's `generate-feedback` source is not included. Do not invoke either production GitHub workflow.
3. In the explicitly named empty non-production Supabase project, review/setup the baseline schema (no production data copy), then apply artifact migrations **001 followed by 002**. Record their hashes and successful transactions. Do not run an unscoped migration command against a linked production project. Create the named ordinary test user; leave its reference allowance absent or disabled with zero limit/reservations. Do not deploy critique. SQL/RLS preflight is not a hosted Storage HTTP test.
4. Deploy **only** `transform-reference` from the artifact with an explicit staging ref. Verify Auth gateway/handler behaviour, platform secrets and Edge CPU/memory/wall-clock limits. Configure the non-secret `REFERENCE_STUDIO_RELEASE_SHA` to the reviewed commit. Keep `REFERENCE_STUDIO_ENABLED=false`, budget acknowledgement absent, approved-configuration hash absent and image-generation key absent. The Supabase URL/anon/service-role environment belongs only to this staging function. No paid credentials are needed for this disabled stage.
5. Build the frontend from the same commit with only the staging public Supabase URL/publishable key and its correct base path; run existing production bundle audits. Publish to the separately approved staging frontend host. Do not use production Pages or production public configuration. Verify the host/configuration manually in the deployed network panel.
6. In the staging project SQL editor or a verified staging connection, execute the artifact's bound `read-only-snapshot.sql`. It starts a read-only transaction, selects safe schema/permission/account metadata and rolls back. Export the JSON privately; it does not change migrations or allowances. Confirm the selected project really is staging; the embedded ref is a binding assertion, not a remote-connection oracle.
7. After explicit staging-read authorisation, collect Auth/function evidence and verify disabled preflight:

   ```sh
   node scripts/reference-staging-preflight.cjs --profile /private/staging-profile.json --collect-read-only /private/function.json
   node scripts/reference-staging-preflight.cjs --profile /private/staging-profile.json --database /private/database.json --function /private/function.json
   ```

   Evidence expires after 15 minutes. Expected result is `STAGING DISABLED PREFLIGHT PASS`: private Storage/RLS, migration 002 version/exact definitions, correct Auth owner/release/model, no global hold, flags off and **zero enabled/nonzero allowances**. This does not authorise a paid call or prove organisation access.

### Bind the one approved configuration before enabling anything

The workspace adds **Export request details for approval** beside Export prepared PNG. It writes a real JSON metadata file, without image bytes, credentials, storage paths or paid consent. It records owner, source/prepared identities, parent, exact artistic controls, local pixel settings, pinned model/size/quality/format and `images=1`. Exporting never calls the provider.

Prepare Test A in the staging UI using the manifest's exact direction and pixel settings. Export its prepared PNG and request details, inspect them, and keep them private. Compute the configuration SHA-256 using the tool's canonical JSON algorithm:

```sh
node -e 'const fs=require("node:fs"),p=JSON.parse(fs.readFileSync(process.argv[1]));console.log(require("./scripts/reference-staging-preflight.cjs").sha(p.configuration))' /private/reference-test-plan.json
```

The owner must approve that configuration hash **and** its prepared-input hash, source hash, actual project/rate basis, one-attempt USD budget, transmission/retention, operator and window. This approval is not populated from a prompt or inferred from a checkbox. Set `phase=one-test` in the private profile only after those approvals. The model-access confirmation is an owner attestation from the actual project; docs and this preflight cannot prove it. No real model-access request is needed during preparation.

Only after separate authorisation to configure the paid staging service may the operator set the dedicated `REFERENCE_STUDIO_OPENAI_API_KEY`, the approved `REFERENCE_STUDIO_APPROVED_CONFIG_SHA256`, release SHA, feature flag and budget acknowledgement. Grant exactly one additional remaining attempt to the dedicated test account without resetting its consumed counter; keep every other account disabled. Refresh the SQL and capability snapshots and run:

```sh
node scripts/reference-staging-preflight.cjs --profile /private/staging-profile.json --database /private/database.json --function /private/function.json --plan /private/reference-test-plan.json
```

The tool checks the approval window/budget/consent/operator, exact proposed photo/direction/configuration, correct runtime configuration pin, one remaining slot and no unresolved hold. Even a PASS **does not dispatch**. The server independently binds the paid request to the canonical configuration hash before any image download/reservation/provider call; changed source/input/owner/settings/model/size cannot silently pass. Request UUID and immutable storage paths remain separate: the browser records a fresh UUID before the single deliberate submit, and the DB enforces its one-use dispatch. Hash binding is not a dollar cap, an upstream idempotency key or a guarantee of fidelity.

Then follow the earlier one-image sequence: explicit paid consent, click once, inspect actual output and private association/export/reload/second-account denial, inspect actual bill when attributable, complete the worksheet, and stop. Do not deliberately break a paid request to test recovery; local fixtures cover that failure drill. Any failure/uncertainty preserves ID, hold and consumed allowance. Disable further generation after the test while reviewing it. Only a new independent approval may enable Test B.

## Test A versus Test B and artistic worksheet

**Test A** remains `reference-landscape-01` with its original SHA, controls and composition. It tests faithful recognition, the API/storage contract and saved recovery. Its monochrome result cannot support a colour-improvement claim.

**Test B**, `reference-colour-landscape-01`, is KoheiU's real CC0 photograph of the river seen from Khe Ran bridge, Vietnam (1477 × 1108; exact source page/bytes/hash in the manifest). The selected source has blue-grey water/sky, green canopy, warmer gravel, receding ridges and fragmented bank/foliage detail. One small red item on lower-left gravel is the only requested object removal; its material is not inferred. The proposal explicitly trims the upper 12% of sky locally, then asks AI to group bank/foliage marks, restrain competing colour, distinguish warmer gravel from cooler water, quiet distant relationships and remove that item while retaining river/skyline/tree geometry and overcast light. The local crop must not be credited as AI work. No thirds, sunset, invented buildings/boats or uniform blur is requested. It may be rejected if the original remains the better reference.

Test B's planned prepared size is 1477 × 975; output 1264 × 832. Its estimated medium output is 1,172 tokens: **$0.03516 output-only** at retrieved $30/M Standard (or $0.01758 at the unconfirmed lower output rate), plus unknown actual input cost. The source metadata states own work/CC0 and no additional restrictions; permission for model transmission remains false. The earlier four case hashes/directions/pixel settings remain unchanged. All five files passed actual local decoding; no image bytes are committed or sent for generation.

Each case now has its own unfilled worksheet with source-specific preservation/request lists and six sections: fidelity; composition; colour; values; paintability; requested-versus-observed. A reviewer must record actual image-region evidence, not copy the request into findings. Every requested edit can be marked CONFIRMED, PARTIALLY_ACHIEVED, UNACHIEVED, UNREQUESTED or UNCERTAIN only after seeing output. Final outcomes include accept-useful, prefer-original/no-benefit, reject-artistic-unsuitability and hold. No composite artistic score or automatic signoff is used.

## Failure-state UX recheck

Unavailable generation and zero allowance explain that local preparation/exports and the old text plan remain usable. File/decoder limits remain bounded; the server-preparation message now explains that a smaller JPEG/PNG may be needed even inside header limits. Only allowlisted public error codes produce specific copy; raw gateway/SQL/provider content is never shown. Pending/uncertain states keep their original receipt and do not resubmit on reload. **Prepare a separate attempt now checks the prior saved state and refuses to clear pending/uncertain or unreadable requests.** The prior export reproduced this receipt-loss gap in the browser; new tests cover the fix. A terminal failed/completed record may be released for a separate explicitly funded request, without refunding a counter.

Unavailable saved images retain status/retry-reading recovery and never use a fake image. Account changes remount the existing Auth-scoped navigation stack; storage keys and reads remain owner-scoped. Physical Android Chrome remains a separate acceptance requirement.

### A browser receipt with no database row

A pre-dispatch upload/decoder rejection can leave a local receipt without a generation row. Do not invent a completed/failed DB record or automatically clear it. The operator must disable/drain workers, verify the exact owner/request has no row and no unresolved provider disposition, inspect any private source uploads, and establish that the current dispatch gate could not have sent this request. A missing row alone, especially with a legacy worker or administrative deletion, is not proof. Keep any other global hold untouched. If uncertainty remains, keep the receipt.

Only after that investigation and explicit operator/owner approval may the user clear **that exact local receipt** in the staging browser, preserving their other settings. For example, privately replace the UUID placeholders below, inspect the stored object, and execute only when its receipt matches:

```js
const key = 'watercolor:reference-studio:v1:OWNER_UUID';
const settings = JSON.parse(sessionStorage.getItem(key));
if (settings?.receipt !== 'INVESTIGATED_REQUEST_UUID') throw Error('Different receipt; stop');
delete settings.receipt;
sessionStorage.setItem(key, JSON.stringify(settings));
location.reload();
```

This changes only account-scoped browser preparation state; it cannot release a DB hold, refund/reset an allowance or dispatch anything. Preserve the incident ID/evidence privately. A subsequent paid attempt still requires fresh approval and all preflight gates. Unused Storage objects need separately authorised retention cleanup, not automatic deletion during reconciliation.

The one-test profile also requires the owner's verified numerical **Standard** image-input/image-output/text-input rates and `billingUncertaintyAcknowledged=true`. Preflight rejects a budget below the estimated output-only floor. Input cost is still unknown and may raise the total; this floor check does not enforce a total dollar cap. If the owner requires an absolute cap that the actual provider project cannot enforce, do not dispatch. The owner must resolve that restriction before authorising the test.
