# Controlled artistic-quality pilot: NO-GO

2026-10-23 UTC. Engineering follow-up began at `8f189dc194dbcaf88b953a4ea8187fa257d96db1`; final unblocking follow-up at clean, synchronized `397d572d6350484741ed2ba476f8c1d6f2125de4`, on `codex/grounded-artwork-assessment`. The completed offline engineering suite was **not rerun**. No provider request, API key use, artwork transmission, merge or deployment occurred. Production settings, schema, prompt and source lock remain unchanged.

## Fixed scope and verified cost status

The smallest proposed pilot remains **C02 church, C03 van, C16 full raw nested screenshot**, at most **12 attempts** across the four fixed arms. C04/C08 remain reserved for generalisation. Preparation hashes and existing reference drafts are reused. No automatic expansion, retry or follow-up classification/critique call.

| Arm | Configured model/detail | Configured parameters | Current combination/rates/image bound verified? |
|---|---|---|---|
| baseline_low | gpt-4.1-mini / low | Chat Completions, temperature 0.3 | No |
| baseline_high | gpt-4.1-mini / high | Chat Completions, temperature 0.3 | No |
| candidate_mini | gpt-5.4-mini / high | Chat Completions, reasoning `none`, no temperature | No |
| candidate_luna | gpt-6-luna / high | Chat Completions, reasoning `none`, no temperature | No |

All retain exact production strict JSON schema, required-null eligibility envelope and 3,000 completion tokens. Prior official OpenAPI retrieval lists the model IDs and generic API fields; it does not verify individual combinations, current availability/prices or model-specific image accounting.

The most recent environment requests to the following official pages failed with **`Tunnel connection failed: 403 Forbidden`**; the final unblocking follow-up did not repeatedly retry the proxy:

- https://developers.openai.com/api/docs/models
- https://developers.openai.com/api/docs/pricing
- https://developers.openai.com/api/docs/guides/images-vision
- https://developers.openai.com/api/docs/guides/image-cost-calculator

**Verified worst-case pilot cost: unavailable (`null`).** The user's independently supplied official input/output prices and generic image/Chat Completions/Structured Outputs support are now [recorded](compatibility.md#independently-supplied-official-findings--2026-10-23). Missing exact parameters/schema acceptance, cached/write accounting and family/detail-specific image bounds still prevent complete attestation. The existing **$3 prospective experiment guard** is an application control, not a verified quote or invoice guarantee. Actual serialized non-image requests are 33,823/33,824/33,832/33,830 UTF-8 bytes across the fixed arms; the existing 2× byte allowance plus 4,096 gives text-token bounds 71,742/71,744/71,760/71,756. Reserving 3,000 output tokens per call at the supplied uncached/output prices yields a **$0.42897 non-image component for 12 calls**, excluding all image charges and unresolved cache writes. It must not be represented as the pilot quote or total bound. The recorded free dry-run remains 12 planned requests, zero paid, `pricingVerified:false`, `readyForLive:false`. No provider probe was used.

## Inputs and ground truth

The three newly supplied JPEGs decode and display locally:

- **C13**, Care Bears external app screenshot, 591 × 1280; full UI retained as a later crop-needed control.
- **C21**, supplied isolated illustration view, 1280 × 888; some upper lettering is trimmed.
- **C24**, fuller illustrated sheet, 1280 × 980, including printed-looking logo/bottom text.

Both previously missing Care Bears input types—raw screenshot and isolated illustration—are now available. Their references/permissions and intended complete boundary still need human review. C13/C21/C24 are linked views of the **same artwork**, not three independent samples. No additional Care Bears input type is currently missing. The saved screenshot's watercolour title is not provenance. All physical media remain **UNCONFIRMED**, artistic intent UNKNOWN, and API approval false. No confirmed-watercolour examples have been established; obtain at least two permissioned, provenance-confirmed examples with different visual structures/finish for positive-control acceptance. These two are a minimum control set, not a substitute for the broader 24-slot acceptance corpus. Do not replace the selected pilot with them silently or add calls without separate approval.

Unknown physical medium is not an obligatory uncertain model answer. The benchmark does not pass ground-truth annotations to the model. Its production eligibility policy stays intact; accepted critiques can be reviewed even when physical medium is unknown. A reporting defect was reproduced: accepted output for explicitly ambiguous/uncertain ground truth could be called an eligibility error. Those cases now remain unscored for eligibility accuracy while retaining outcomes and artistic review. Confirmed-watercolour recall is unknown without confirmed positives. If the pilot yields no accepted analyses, artistic-quality comparison is **inconclusive**; no forced acceptance, gate bypass or extra inference is authorized.

## Complete blind review, not just excerpts

The previous report discarded geometry and truncated the critique, preventing complete annotation/full-context review. The existing report now optionally uses **already explicitly retained** provider responses to produce masked complete analysis/canonical pages and individual exact-source geometry audits. It never enables retention, adds provider requests or changes production. All supplied regions, note associations and primary/secondary paths remain inspectable without inventing replacement geometry. Text is escaped; model metadata masked; private paths/content stay outside Git. Missing retention or invalid content is marked unverified.

These coordinate audits are not literal app screenshots. Two independent reviewers must check the sixteen existing rubric dimensions, compare raw versus cleaned claims, inspect every actual app note/role/composition/colour/crop/value state in a local network-blocked replay, and record exact claims, source locations, errors/severity and disagreements. No human ratings, model outputs or real-model app captures exist yet. Explicit full-response retention consent is therefore a prerequisite for the proposed complete review, alongside paid/transmission approval.

Only affected checks were executed: **91 benchmark tests pass**, zero failures/skips/cancellations (**five new tests**). Complete-review rendering passes at 375 and 1440 with technical mocked content, zero runtime errors/unexpected requests; this proves no artistic accuracy. Initial direct file navigation was blocked by browser policy; fully intercepted local-origin rendering passed. Three new real files were incrementally prepared with the existing adapter, zero network calls; previous five prepared annotations remained unchanged. Original production source lock verifies exactly. No frontend/Edge/build/browser-wide suite was repeated because only developer benchmark reporting changed.

## Private preservation and authorization prerequisites

The corpus remains at `/tmp/watercolor-private-evaluation/`, now eight prepared files. Private `pilot-readiness/` contains documentation-access evidence, compatibility/cost unknowns, unapproved permission records, proposed reviewer requirements and the dry-run. Every approval remains false; no live cost journal exists. A checked local archive and hash receipt are at **`/workspace/watercolor-private-preservation/`**, outside Git, with directory/file modes 0700/0600. Both `/tmp` and `/workspace` can disappear when this execution environment is deleted. Copy the archive to private user-controlled durable storage before that happens; no external backup/upload was performed.

Final follow-up verified the original archive's gzip/tar integrity, receipt SHA-256, all 75 internal hash-manifest entries, and all 76 archived files against the corpus. Inventory: nine source files (eight unique inputs plus the linked small-crop source copy), eight prepared images, eight reference drafts, 26 visual artifacts, the 24-slot manifest and private permission/review records. Credential pattern/filename scans found zero matches; no unsafe archive paths or links. The original archive is unchanged. A second local download bundle includes it and the final unapproved rate/cost/reviewer records, with separate checksum receipts. No callable outbound file-export connector exists: use a host-provided private filesystem download or existing authenticated file copy, then verify the checksum. Neither local bundle is a durable external backup.

R1 and R2 assignments now explicitly require independent review of every actual masked output (up to 12 each), all sixteen dimensions and every app-visible annotation, with source region, exact claim, reasoning, severity and uncertainty. Identities and independence are unconfirmed, ratings absent and retention/transmission/payment false. If C02/C03 both abstain on all arms, no substantive artistic comparison is possible. Recommend a **separately approved** three-case positive-control selection (matching the current CLI), containing at least two provenance-confirmed watercolours with different structures; at most 12 additional proposed calls, never silently added to this pilot. None of those controls is presently available as confirmed medium.

Before GO:

1. Verify all four exact model/API/detail/strict-output/reasoning combinations and current prices/image-token bounds from accessible official documentation; prepare a same-day private rate card.
2. Recheck exact source/prepared hashes and obtain a verified projection within the remaining $3 guarded budget. Preserve all journals/reservations if any paid attempt later occurs.
3. Independently review source/reference boundaries and the unknown-medium interpretation; arrange two blind reviewers and local app replay for every annotation.
4. Obtain explicit permission to transmit the three selected images to OpenAI, spend the reviewed amount on at most 12 attempts, and retain complete responses privately. Private draft records do not grant this permission.
5. Resolve prepared-annotation immutability through a reviewed **pre-paid** permission update/new preparation that preserves this unapproved offline record and exact image hashes. Never recreate an experiment to replay an uncertain paid attempt or reset spending.

There is no safe authorization question with a verified cost yet. **NO-GO** until compatibility/cost verification and review/permission prerequisites are satisfied. Care Bears is no longer an input-availability blocker; real artistic acceptance, confirmed-watercolour controls and independent human review remain outstanding.
