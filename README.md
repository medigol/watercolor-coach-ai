# Watercolor Coach AI

A modern mobile-first watercolor learning MVP using Expo SDK 54, React Native, strict TypeScript, Expo Router, and Supabase. The project lives in the repository root. Home, My Artworks, and Practice remain the only bottom tabs. Account access is in the header.

## Supabase setup

1. Create a Supabase project. Enable the **Email** provider in **Authentication → Providers**. Keep email confirmation enabled unless you deliberately use a disposable development project.
2. Open **SQL Editor → New query**, paste [supabase/schema.sql](supabase/schema.sql), and run the **entire script together** as the project administrator. Initial auth/feedback setup requires this schema; the script is transactional and preserves older mock-save callers. It creates `profiles`, `artworks`, `ai_results`, and `usage_counters`, owner-only RLS policies, a new-user profile/counter trigger, and the transactional mock-save functions and server-only OpenAI reservation/save functions. It also upgrades the provider constraint to `mock`/`openai` and adds request reservation fields to usage counters. Existing Auth users are backfilled. This live-feedback bugfix adds no SQL changes and does not require rerunning an already-current schema.
3. Under **Storage**, verify the bucket named **artworks** exists and is **private**. The SQL creates it automatically (or enforces private access on that existing bucket), limits objects to 10 MiB, and allows JPEG, PNG, and WebP. You can also create it manually with those settings before running the SQL.
4. The SQL installs Storage policies: signed-in users may insert/read/delete objects only under `<their-auth-user-id>/filename`. No overwrite policy is added. Review and remove any older permissive policies on these tables or this bucket: restrictive owner guards also keep older permissive policies from granting cross-user access. Never make this bucket public.
5. In **Authentication → URL Configuration**, set **Site URL** to your deployed app URL, e.g. `https://medigol.github.io/watercolor-coach-ai/`. Allow that exact URL as a redirect, plus the exact local/Codespaces origins you use. Open the confirmation link, then return to the app and sign in. Native users may confirm via the website and sign in on their device; no separate native callback route is added.
6. In project API settings, copy the project URL and public **anon** key (or the public publishable key). Only the following two frontend variables are used.

```dotenv
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
```

Copy `.env.example` to `.env` and enter your own project values **locally or in the cloud workspace**. Real values are not provided in this repository. `.env` and `.env.*` are ignored; `.env.example` contains blanks only. Never commit real credentials, privileged project keys, or account passwords. Expo public variables are embedded in the browser bundle and visible to visitors; they must be public client credentials, protected by the SQL RLS and private bucket policies.

If variables are missing or the URL is malformed, the app displays **Account setup needed** rather than crashing. A syntactically valid but incorrect public key produces a connection/sign-in error and must be replaced. After changing values, restart Expo; web deployments require a new build. The web runner and Expo configuration refuse recognizable privileged keys before bundling; use only a public anon/publishable key, never a private key or a user access token.

## Run locally

Use Node.js 20.19+ (Node 22 LTS recommended), then:

```sh
npm install
npx expo start
```

Use an SDK 54-compatible Expo Go client or a development build. Android emulators are supported; iOS simulators require macOS/Xcode. If the network blocks Expo's compatibility API, use `npx expo start --offline`.

For the browser:

```sh
npm run preview
```

This serves Expo web on port 8081 with offline compatibility checks and telemetry disabled. It does not disable your app's Supabase requests: those still require Internet access. No local tool installation is needed if these commands run in Codespaces or Codex cloud.

```sh
npm test
npm run typecheck
npm run build:web
```

The web build outputs route HTML and assets to `dist/`.

## GitHub Pages preview — no local installation

1. Merge these changes into `main`.
2. In the repository, open **Settings → Secrets and variables → Actions → Variables**. Add **repository variables** `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` with your public project values. Do not add private backend credentials. The workflow reads these two values during export.
3. Open **Settings → Pages**, choose **Source → GitHub Actions**.
4. Open **Actions → Deploy Expo web to GitHub Pages → Run workflow**, choose `main`, and run it. Wait for both build and deploy jobs to succeed. Approve the `github-pages` deployment if your environment requires it.
5. Open **https://medigol.github.io/watercolor-coach-ai/**, or the deployment URL shown by GitHub. Sign up, confirm your email, and sign in.

Pushes to `main` deploy automatically. Updating Supabase variables requires rerunning the workflow; changing them alone does not update the existing static bundle. Missing variables still allow export/deployment, but the preview shows the setup message. GitHub supplies `EXPO_WEB_BASE_PATH` for project-site paths automatically. No custom domain is required. GitHub Pages hosts the public frontend; it does not host the database or images.

If Pages is unavailable, check repository visibility/plan eligibility. If Actions is disabled, enable it in Settings → Actions → General. Actual deployment is verified only after the workflow succeeds.

## Codespaces / Codex browser preview

In GitHub select your branch, then **Code → Codespaces → Create codespace on this branch**. The devcontainer installs dependencies and starts port 8081 automatically. Create `.env` in the Codespaces editor, add your public project values, and restart the preview. Open **Ports → 8081 → Open in Browser**; keep the forwarded port private. If you created the Codespace before these changes, rebuild its container.

Use `npm ci` and `npm run preview` in the cloud terminal if startup needs retrying. The automatic startup log is `/tmp/watercolor-preview.log`. Stop an existing server before starting another copy on the same port. A GitHub account with available Codespaces quota is required; github.dev alone cannot run the app.

In Codex cloud, use the same commands and port 8081. Open the interface's port-forwarding/web-preview feature if available. The onboarding UI does not offer a user-facing web preview; use Pages there. A localhost URL printed by the cloud machine cannot be opened directly on your computer. Permit HTTPS access to your project's `<project-ref>.supabase.co` hostname if cloud network policy restricts it.

## Accounts, uploads, and saved results

- Sign up/sign in protects Home, uploads, results, the gallery, Practice, and Account. Sign out from **Account** clears the current device's session. Native sessions use AsyncStorage; web sessions use browser storage (or an in-memory fallback if storage is blocked, which does not survive reload).
- Pick an image and press **Get feedback** or **Create Reference**. The app attempts a private upload, then requests feedback from the authenticated Edge Function. Only a validated `provider=openai` result is saved for a new production submission. Failed feedback stays on the upload screen with a clear message; the app never saves a sample to replace it. Reading a result uses its saved ID and stored JSON. Images use temporary signed URLs; no public image URL or expiring signed URL is persisted in the database. `artworks.image_url` stores the private object path.
- Select a supported image before requesting feedback. Photo access, image format, file size, or storage failures show an actionable error and do not create an artwork/result. A definite feedback rejection can remove the newly uploaded image. An uncertain save retains the image and request ID because the database may already have committed; check My Artworks before retrying. An in-place retry reuses that ID and private path to recover the saved result without double counting. Storage and database operations are separate: interruptions or failed cleanup can leave unreferenced private images; no background cleanup job is added.
- **My Artworks** loads only the signed-in user's saved rows and links to their results. With no rows it shows “No artworks yet. Upload a painting to get your first feedback.” Loading/error/retry states are included.
- New production results use `provider='openai'`. Existing saved `provider='mock'` examples retain their data and are clearly labelled as samples; new live failures never create them. Result screens and gallery read saved JSON. Uploaded images are labelled as your photo/painting. Sketch/value visuals are explicitly generic planning aids to adapt to your own subject, and painting steps use numbered markers. The reference result is a text painting plan, not a newly generated image. No payments or subscriptions are integrated.
- Usage counters are read-only to clients. A user can save **three successful OpenAI results**; only the server's successful save transaction increments the counter. Missing images, existing mock results and failed model calls consume no results. A successful new OpenAI save counts once; replaying its request ID does not count again. At the limit the app shows: “You have used your 3 free AI feedback results. More feedback will be available after subscriptions are added.” A request in progress temporarily blocks another model call for that account; abandoned reservations expire after 120 seconds.
- Result headers distinguish **AI feedback** from **Sample guide shown — live AI feedback was unavailable. This example may not match your uploaded image.** Samples use the neutral title **Sample watercolor guide**, omit the uploaded image and its marks, and use generic planning diagrams. This keeps example critique separate from your own work; the private saved image remains unchanged. A loaded database result also says **Saved result**. Opening it, retrying a read, and browsing My Artworks never requests new analysis or consumes quota. **Follow-up question** is optional and visually secondary for real feedback; it is hidden for samples. Displaying it does not call the model.
- Practice exercises are unchanged. There is no practice tracking, account editing, password reset UI, artwork editing, or deletion UI yet.

## Deploy automatic feedback (Supabase Edge Function)

GitHub Pages remains a static frontend. OpenAI requests and privileged database operations run **only in Supabase**, never in the browser or Pages Actions.

1. For initial setup, run the entire [supabase/schema.sql](supabase/schema.sql) in the Supabase SQL Editor **before** deploying the frontend/function. The quota/save functions are required; the historical mock RPC remains for compatibility with existing callers. If your project already runs the current schema, this bugfix needs no migration or SQL rerun. Keep the `artworks` bucket private and Auth email enabled as described above.
2. In **Supabase Dashboard → Edge Functions → Secrets**, set or verify `OPENAI_API_KEY` with an OpenAI API project key. This bugfix needs no additional secret. Never paste its value into this repository, `.env.example`, frontend environment variables, Pages variables, or a GitHub workflow. Supabase hosted functions supply `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` as built-in server environment values. The service-role key is used only inside the function for quota/save RPCs. Do not copy it into frontend configuration. For a local Supabase function runtime, use its local server environment/ignored secret file, never a committed file.
3. Deploy from a cloud terminal (Codespaces/Codex works; nothing needs installing on your computer), using the Supabase CLI:

   ```sh
   npx supabase login
   npx supabase link --project-ref YOUR_PROJECT_REF
   npx supabase functions deploy generate-feedback --project-ref YOUR_PROJECT_REF --no-verify-jwt
   ```

   `supabase/config.toml` also sets `verify_jwt=false`. This disables the gateway's legacy JWT verifier so current Supabase signing keys work; it **does not make feedback anonymous**. The handler requires a Bearer session token and verifies it with `auth.getUser(token)` before reading images or performing operations. It rejects anonymous Auth sessions, expired/invalid tokens, and mismatched-account requests. Keep anonymous sign-ins disabled for this email-account MVP. Never remove that check. Deploy the committed function files together, including `_shared/`.

   Alternatively, run **Actions → Deploy Supabase Edge Function → Run workflow**, choosing the fix branch before merge or `main` after merge. That workflow uses the existing repository variable `SUPABASE_PROJECT_REF` and repository secret `SUPABASE_ACCESS_TOKEN`; the OpenAI key stays in Supabase. Redeploy whenever the handler or shared code changes. This bugfix requires a function redeploy and no schema migration.

4. Keep `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` as the only Supabase frontend variables used by the Pages build. Redeploy Pages after merging. Deploying/reconfiguring the function does not require adding any other Pages variable.
5. Sign in, select a JPEG/PNG/WebP painting or photo of at most 10 MiB, then request feedback in either existing mode. The function reads only your private folder using your session, sends the image to OpenAI's `gpt-4.1-mini` vision model, validates structured JSON, and saves it. Uploaded images are sent to OpenAI for this analysis; no OpenAI-generated images are added. API billing applies to attempted model calls, including calls whose output fails validation. The app's three-result counter counts saved successful results, not billable attempts. **ChatGPT Plus/Pro and Codex credits are not OpenAI API credits**; configure billing/credits for your OpenAI API project separately.

To test failures, leave the function undeployed, leave its existing OpenAI secret unset, or simulate a failed model/image request in a disposable environment. New production submissions must show an error and stay on the upload screen, with no mock artwork/result and no quota increment. Invalid JSON or invalid required core feedback also fails clearly. Malformed optional brush, promising, strategy, palette metadata, composition notes and reference observations are cleaned or omitted; valid core coaching can still save as OpenAI. Quota shows the existing limit message; an in-progress request asks you to check My Artworks; an expired session asks you to sign in again. Network/Edge/OpenAI failures say “Live AI feedback could not be prepared. Please try again.” No upstream keys, prompts, image contents or private error details are exposed.

Retrying the unchanged form reuses the same request ID and uploaded path after uncertain outcomes; changing the image/focus/account starts a new attempt. Replaying an already saved result returns it without replacement or quota increment. A confirmed `provider=mock` response from an older deployed function is rejected by the new upload flow; a subsequent manual retry uses a new request ID but retains its image, since the older sample may reference it. There is no automatic second model call. This in-memory retry state does not survive a page reload. Private images are retained when a save might have committed; interruptions may leave private orphans. Existing saved samples remain accessible through My Artworks, but result URLs without a saved ID show an error rather than silently opening a sample.

Live automatic feedback requires a real configured Supabase project, the SQL migration, a deployed function, and an OpenAI API key with API credits. None of those credentials are included. No paid API call is needed to run the regression suite.

## Coaching overlays

New feedback in either mode can include a few visual coaching notes on your uploaded painting/photo. Tap a mark, its number, or its note card to highlight the same decision and read what it means, why it matters, and what to do. Marks include focal rings, dotted simplification regions, distinct light/middle/dark masses, design lines, eye-flow arrows, crop frames, soft/hard edge marks, preserved-light outlines, and local numbered points. Selecting a crop quietly shades its outside area; selecting a ring strengthens its outline. A compact Focus / Value / Simplify / Edge / Composition legend keeps the marks readable.

The original image is shown at its own aspect ratio. Coordinates are percentages of that image; boxes use a top-left corner and width/height, and paths use bounded points. SVG geometry scales with the displayed image. Older point/region notes still work. The model is asked for 3–6 useful marks, preferably three; fewer confident marks are better than many weak ones.

These marks are drawn by the app over the existing uploaded image. They do not generate, edit, repaint, or replace the image. Guidance prioritizes focal point, tonal grouping, simplified secondary shapes, atmospheric edges, and preserved lights. All coaching comes from the same existing model request; no additional model call or image API is used.

Overlays are an optional `result_json.overlays` field. Older saved results and unchanged mock samples work without it. The server strictly validates 0–100 coordinates, geometry, region bounds, categories, priorities, timing, and text limits. Invalid anchors or note metadata are discarded individually. If only geometry is invalid but the supplied anchor and coaching text are valid, the shape is removed and the note remains as a point marker at that supplied location; no replacement geometry is invented. If no useful marks remain, or the image is unavailable, the overlay section is hidden and text guidance still displays. Locations are approximate coaching suggestions, not precise measurements or tracing instructions.

Optional timing distinguishes actions on the current painting, in the next study, or both. Crop/framing and recognized object placement/proportion changes are presented as next-study experiments. Unspecified timing asks the learner to test a small study first. Composition focus has a **Composition decision** block for the main issue, reason, safe action now, and experiment next. New optional `compositionDecision` fields improve this presentation; older saved results use existing notes/text and cautious general guidance. This language handling is conservative and cannot infer every technique or guarantee that a dry painting can be changed safely.

## Reference preparation and study aids

The real reference result includes **Original**, **Value**, **Simplified**, and **Adjust** views when an uploaded photo is available. Samples omit these image views. Browser views use deterministic, client-side CSS filters: grayscale/contrast for values, reduced saturation and slight softness for simplification, and bounded contrast, brightness, and saturation sliders. Reset restores the original view and default controls. These are display-only planning views; the saved image is never edited, repainted, replaced, or uploaded again.

This stable MVP does not perform true three-value posterization, isolate objects, or remove photographic detail. Native clients and browsers without filter support keep the original image and explain the limitation. Unavailable images leave the painting plan and study aids usable. There is no canvas pixel access, so private signed-image URLs can use these filters without requiring cross-origin pixel reads.

**Thumbnail planning** shows only two or three studies. When the provider is `openai` and an uploaded image and relevant valid geometry are available, the original image is shown beneath its saved crop frame, eye-flow path, value masses, simplify region, structure line, or focal ring. These cards say **Study overlay on your image** and **Use as a guide, not tracing**. No new shapes are inferred from pixels, and no tracing accuracy is promised. Value studies use a grayscale display filter in supported browsers; native/unsupported clients keep the original colours with the same value marks. Filters never modify the stored image.

Studies with unavailable images, missing geometry, point-only advice, or sample results say **Generic planning diagram · use when image overlay is unavailable**. Validated note categories and simple text cues choose relevant studies and broad landscape/street layouts; unknown subjects keep a big-shape/value fallback. Generic diagrams remain templates to adapt to your image. The original saved sketch and value notes remain available in a compact disclosure. Selection can miss unusual subjects or ambiguous wording, and saved mark locations remain approximate. Crop advice is always a next-study experiment, rather than moving already-painted objects.

**Composition model** adds one or two deterministic instructor thumbnails with when-to-use guidance, application to the supplied notes, and a practical action. The small built-in library covers eye paths, horizons, framing, focal groups and value masses; it uses original app-drawn diagrams, no external artwork or image analysis. These are planning ideas, not exact matches to a photo. Meaningful diagrams have human-readable accessible labels; their decorative SVG shapes are hidden from assistive technology.

On wide browser screens, result content is centered in two columns: image/studies on the left and guidance/painting notes on the right. Phones retain the single-column order and comfortable spacing.

Painting steps use numbered markers and show a stage heading when supplied, while older step strings still render unchanged. The **Watercolor palette** uses larger layered wash swatches with supplied strategy, temperature relative to the palette, painting role, mix idea, and main-wash, shadow-mix, accent, focal-accent and atmospheric-distance tags when available. Older palette arrays render without invented roles or metadata. New guidance prefers a limited palette, up to seven colors and fewer when useful; existing arrays retain compatibility. Swatches are approximate screen colors. Only PB29/Ultramarine, PBr7/Burnt Sienna, and PY43/PY42/Yellow Ochre are supported as conservative optional code matches here; other uncertain codes are omitted. Formulations and mixes vary. No manufacturer catalog, exact brand formula, universal mixing ratio, or purchase advice is added.

New real results request 2–3 visible strengths before focused improvements, alongside one main priority. **What works well** and **What to improve** stay visible, with **What is promising** when supplied. Reference strengths describe the photo's useful design, not painting technique. Optional `promising`, reference `whatWorks`/`whatToFix`, and `brushPlan` fields preserve old JSON compatibility. Missing optional guidance is hidden, never fabricated. The **Brush & wash plan**, below the main summary and palette, uses up to three stages to explain brush category, wash consistency, wet technique, moisture/timing cues, soft/sharp edges, and stopping. It contains no commercial recommendations.

Preparation and all visual aids require **no additional OpenAI call**. The existing single analysis request supplies text, optional marks, and palette guidance. Existing saved samples, quota accounting, ownership checks, saved JSON compatibility, and deployment workflows remain intact. Normal production failures now show errors rather than saving mocks.

This result-page polish changes the **shared Edge prompt and result contract**. Deploy the frontend first: merge into `main` and wait for **Deploy Expo web to GitHub Pages** to succeed. Then run **Actions → Deploy Supabase Edge Function → Run workflow → main** and wait for success; include the shared files when using the CLI. New study results can contain an empty refinement array, so the frontend must support that before the updated function creates them. No database migration, new secret or new environment variable is needed. The existing model, single call, image detail, 3,000-token completion cap and deadlines remain unchanged. Prompt/schema length may change input-token cost.

Deploy both parts. Pages does not deploy Supabase Edge Functions. The production live-only error behavior remains intact; do not roll back to a function that saves samples on live failures. An old deployed function can still write samples before the frontend rejects them, so keep its production bugfix as well as these prompt/contract changes. Verify the selected branch and `_shared/` files. Existing saved samples remain readable, and missing frontend Supabase variables still show the setup message without crashing.

## Result summary and calibrated study notes

The painting result shows a one-sentence **Main priority**, specific strengths, up to three distinct improvements, and **Next 15-minute practice** before secondary study aids on phones. The full legacy advice/practice remains available inside the study details when the summary is shortened. Reference results keep their painting plan and existing steps. Uploaded image marks remain visible; their longer note cards are folded until you tap a mark or **View notes**.

**Composition model** and **Thumbnail planning** are folded by default on mobile and open on wide desktop browsers. Learners can expand or close them; their choice survives viewport changes. Models explain general design ideas, not diagnoses or exact image matches. A single brief brush stage is visible; longer **Brush & wash plan** details are folded on mobile. **Follow-up question** is always initially folded and remains hidden for samples. Sketch/value notes retain their disclosure. These controls only show saved guidance and never request another analysis.

The existing model request privately calibrates how resolved the supplied image appears. Optional `coachingMode: "study"` frames strong/highly resolved work as a learning reference, or uses cautious study observations when confidence is low. It changes headings to **What makes this work**, **Advanced learning notes**, **Optional refinements**, and **Optional planning variation**. Composition notes say **Observe this decision** and **Study this effect** rather than diagnosing a main issue or asking for corrections now. Brush notes say **How to study this handling** and retain physical execution cues for a separate study sheet. Photos are not praised for painted technique. No personal skill rating, profile field or multi-image assessment is added.

Developing work retains constructive, evidence-based feedback and one priority. The model may return zero refinements when none are warranted; the required array still exists, and other required core text/strengths remain validated. Missing or malformed optional coaching flags retain legacy constructive presentation and never create a sample fallback. Existing saved results are not rewritten or reassessed; their original wording remains subject to cautious presentation safeguards. New calibrated guidance requires the updated function and a new analysis.

Exact duplicate secondary notes are suppressed. Main advice names the priority, brush notes explain execution, planning aids show a visual idea, and practice gives a short exercise. Current-painting instructions are restricted to cautious, practical actions or scrap tests. Cropping, object placement, spacing, horizon, large-shape simplification and value-mass redesign belong in a separate next study. Strong-work presentation removes forceful correction sentences rather than inventing positive observations; it may omit conflicting or useful wording conservatively. These language safeguards cannot classify every possible phrase or establish painting quality with certainty.

## Why failed feedback became a sample

The previous Edge handler cleaned only overlays, then strictly validated the entire result. A malformed optional `brushPlan`, `promising`, or `paletteStrategy` could reject otherwise valid required text; even a correctly typed string longer than the local limit could fail, since the OpenAI schema did not enforce that length. Both modes reproduced this as HTTP 200 with a saved mock. Missing server configuration, image reads, model/network failures and invalid core responses also reached that same mock-save branch. Separately, the frontend called `save_mock_feedback` after an unhandled Edge error, including a missing function. The quota/auth/busy rejection paths already stopped when their structured error code was recognized.

The fixed handler cleans optional metadata before strict core validation and returns an error instead of creating a new mock. The frontend never calls the mock-save RPC during a new upload and rejects stale HTTP 200/mock responses. These code-level causes are reproduced by tests; identifying the exact upstream trigger in a particular live project still requires its Supabase invocation logs and deployment/configuration state. No live project credentials were used for this diagnosis.

If failures persist after deploying both parts, inspect **Supabase Dashboard → Edge Functions → generate-feedback → Invocations/Logs** for the request time/status. Verify the existing Edge secret, OpenAI API project billing/credits and rate limits, private `artworks` bucket and current schema. A workflow success verifies code deployment, not API billing or image readability. Never paste keys or private image data into issues or logs. For a quota rejection, inspect the account's `usage_counters` without changing it. An invalid core response may be incomplete or unsupported and remains a clear failure; it is never replaced by a sample.

## Checking the free-result counter

The quota audit verified new successful saves increase usage **0 → 1 → 2 → 3**, while duplicate request IDs, existing results, mock fallback, failed saves, reads and releases do not increase it. Server reservations and transaction locks also prevent duplicate increments during concurrent requests. A fourth new OpenAI request returns the existing clear limit message; existing results remain accessible. No schema change was needed.

To inspect your configured project, open Supabase **Table Editor → usage_counters**, filter by the account's Auth user ID, and compare `free_results_used` before/after each action. Check `ai_results.provider` for the corresponding artwork: a saved mock guide must not count. Reopen that artwork, refresh, and retry the unchanged request; usage should stay the same. Do not edit or reset counters to test production behavior. For repeatable checks, use a disposable project and [supabase/tests/feedback.sql](supabase/tests/feedback.sql), which rolls its fixtures back. The counter tracks successful saved results, not billable API attempts or the total number of gallery cards.

## Validation and security checks

`npm test` runs auth, credential preflight, persistence, strict response validation, Edge auth/request validation, production error handling, optional-field cleaning, saved-sample compatibility, idempotency, and quota regressions without live credentials. Runtime regressions execute the real Edge entrypoint with the installed Supabase SDK and controlled HTTP responses. `npm run typecheck` checks the frontend. With Deno 2.5.6 installed, `npm run typecheck:edge` separately checks the deployed server code. The Pages workflow runs both TypeScript checks before exporting. `supabase/tests/rls.sql` checks profile/counter provisioning, restrictive ownership guards even with older broad policies, isolated rows and storage paths, ownership-transfer denial, account-bound RPC calls, anonymous-save denial, and transactional rollback. [supabase/tests/feedback.sql](supabase/tests/feedback.sql) additionally checks provider forgery denial, server-only RPC privileges, reservations, atomic quota increments, three-result enforcement, counter-write denial even with legacy column grants/permissive policies, and retry/fallback races. Run both scripts after the schema in a disposable/local Supabase project or SQL Editor; fixture rows are rolled back. Review any pre-existing policies first.

Native device testing and live Supabase/OpenAI behavior remain unverified and need verification against your configured project. Browser integration checks can validate request handling, but do not substitute for a real project's Auth/Storage policies. These checks use controlled backend responses and do not verify email delivery or live API availability.

## Structure

`app/`: routes and three tabs; `components/`: shared modern cards/study visuals; `data/`: unchanged mock results/practices; `providers/`: auth state; `lib/`: Supabase and artwork persistence; `hooks/`: saved-result loading; `supabase/`: schema, RLS, private bucket policies, and checks.
