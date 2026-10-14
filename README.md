# Watercolor Coach AI

A modern mobile-first watercolor learning MVP using Expo SDK 54, React Native, strict TypeScript, Expo Router, and Supabase. The project lives in the repository root. Home, My Artworks, and Practice remain the only bottom tabs. Account access is in the header.

## Supabase setup

1. Create a Supabase project. Enable the **Email** provider in **Authentication → Providers**. Keep email confirmation enabled unless you deliberately use a disposable development project.
2. Open **SQL Editor → New query**, paste [supabase/schema.sql](supabase/schema.sql), and run the **entire script together** as the project administrator. Apply the updated script before deploying a new frontend from this branch; the migration is transactional and preserves older mock-save callers. It creates `profiles`, `artworks`, `ai_results`, and `usage_counters`, owner-only RLS policies, a new-user profile/counter trigger, and the transactional mock-save functions and server-only OpenAI reservation/save functions. It also upgrades the provider constraint to `mock`/`openai` and adds request reservation fields to usage counters. Existing Auth users are backfilled.
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
- Pick an image and press **Get feedback** or **Create Reference**. The app attempts a private upload, then requests feedback from the authenticated Edge Function. A validated result is saved atomically, or the existing mock is saved if automatic feedback is unavailable. Reading a result uses its saved ID and stored JSON. Images use temporary signed URLs; no public image URL or expiring signed URL is persisted in the database. `artworks.image_url` stores the private object path.
- If photo access, image format, file size, or storage upload fails, the app uses the sample illustration and can still save the mock metadata. A clear message appears on the result when a selected image could not be stored. If the database definitively rejects the save, a retry message appears and the app stays on the upload screen; it attempts to remove the uploaded image. If the response is lost or the outcome is uncertain, the image is retained because the database may already have saved it, and the message asks you to check My Artworks before trying again. Storage and database operations are separate: interruptions or failed cleanup can leave unreferenced private images; no background cleanup job is added.
- **My Artworks** loads only the signed-in user's saved rows and links to their results. With no rows it shows “No artworks yet. Upload a painting to get your first feedback.” Loading/error/retry states are included.
- Real results use `provider='openai'`; fallback results retain the existing **Lake House** and **Coastal Town** data with `provider='mock'` and are labelled as samples. Result screens and gallery read saved JSON. Uploaded images are labelled as your photo/painting. Sketch/value visuals are explicitly generic planning aids to adapt to your own subject, and painting steps use numbered markers. The reference result is a text painting plan, not a newly generated image. No payments or subscriptions are integrated.
- Usage counters are read-only to clients. A user can save **three successful OpenAI results**; only the server's successful save transaction increments the counter. Missing images, mock results, failed model calls, and retries consume no results. At the limit the app shows: “You have used your 3 free AI feedback results. More feedback will be available after subscriptions are added.” A request in progress temporarily blocks another model call for that account; abandoned reservations expire after 120 seconds.
- Practice exercises are unchanged. There is no practice tracking, account editing, password reset UI, artwork editing, or deletion UI yet.

## Deploy automatic feedback (Supabase Edge Function)

GitHub Pages remains a static frontend. OpenAI requests and privileged database operations run **only in Supabase**, never in the browser or Pages Actions.

1. Run the entire updated [supabase/schema.sql](supabase/schema.sql) in the Supabase SQL Editor **before** deploying this frontend/function. Do not skip this migration: the new idempotent mock RPC and quota functions are required even when using fallback. Keep the `artworks` bucket private and Auth email enabled as described above.
2. In **Supabase Dashboard → Edge Functions → Secrets**, add `OPENAI_API_KEY` with an OpenAI API project key. Never paste its value into this repository, `.env.example`, frontend environment variables, Pages variables, or a GitHub workflow. Supabase hosted functions supply `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` as built-in server environment values. The service-role key is used only inside the function for quota/save RPCs. Do not copy it into frontend configuration. For a local Supabase function runtime, use its local server environment/ignored secret file, never a committed file.
3. Deploy from a cloud terminal (Codespaces/Codex works; nothing needs installing on your computer), using the Supabase CLI:

   ```sh
   npx supabase login
   npx supabase link --project-ref YOUR_PROJECT_REF
   npx supabase functions deploy generate-feedback --project-ref YOUR_PROJECT_REF --no-verify-jwt
   ```

   `supabase/config.toml` also sets `verify_jwt=false`. This disables the gateway's legacy JWT verifier so current Supabase signing keys work; it **does not make feedback anonymous**. The handler requires a Bearer session token and verifies it with `auth.getUser(token)` before reading images or performing operations. It rejects anonymous Auth sessions, expired/invalid tokens, and mismatched-account requests. Keep anonymous sign-ins disabled for this email-account MVP. Never remove that check. Deploy the committed function files together, including `_shared/`.

   Alternatively, after merging, run **Actions → Deploy Supabase Edge Function → Run workflow → main**. That workflow uses the repository variable `SUPABASE_PROJECT_REF` and repository secret `SUPABASE_ACCESS_TOKEN`; the OpenAI key stays in Supabase. Redeploy the function when prompt code changes; no schema migration is needed for the result-copy/prompt update.
4. Keep `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` as the only Supabase frontend variables used by the Pages build. Redeploy Pages after merging. Deploying/reconfiguring the function does not require adding any other Pages variable.
5. Sign in, select a JPEG/PNG/WebP painting or photo of at most 10 MiB, then request feedback in either existing mode. The function reads only your private folder using your session, sends the image to OpenAI's `gpt-4.1-mini` vision model, validates structured JSON, and saves it. Uploaded images are sent to OpenAI for this analysis; no OpenAI-generated images are added. API billing applies to attempted model calls, including calls whose output fails validation. The app's three-result counter counts saved successful results, not billable attempts. **ChatGPT Plus/Pro and Codex credits are not OpenAI API credits**; configure billing/credits for your OpenAI API project separately.

To test fallback, leave the function undeployed, leave its OpenAI secret unset, or submit without selecting an image. The app should save the existing mock, label it as a sample, and explain that automatic feedback is unavailable. Unreadable images, model/network errors, and invalid model JSON also fall back without charging the result counter. Quota/auth/invalid-request rejections show a message rather than silently bypassing the rejection. A lost Edge response and fallback share one artwork ID: whichever result was already committed is returned, without replacement or duplication. An uncertain final save asks you to check My Artworks. Retrying the unchanged form reuses the same request ID and uploaded path; changing the image/focus/account creates a new attempt. This in-memory retry state does not survive a page reload. Private images are retained when a save might have committed; interruptions may leave private orphans.

Live automatic feedback requires a real configured Supabase project, the SQL migration, a deployed function, and an OpenAI API key with API credits. None of those credentials are included. No paid API call is needed to run the regression suite.

## Coaching overlays

New feedback in either mode can include 3–5 numbered coaching notes on your uploaded painting/photo. Tap a marker or its note card to highlight it and read the reason and practical action. The original image is shown at its own aspect ratio; overlay coordinates are percentages of that image. Optional region coordinates describe a top-left corner and width/height; this first version shows a number at the region centre rather than drawing filled regions or crop rectangles.

These marks are drawn by the app over the existing uploaded image. They do not generate, edit, repaint, or replace the image. Guidance prioritizes focal point, tonal grouping, simplified secondary shapes, atmospheric edges, and preserved lights. All coaching comes from the same existing model request; no additional model call or image API is used.

Overlays are an optional `result_json.overlays` field. Older saved results and unchanged mock samples work without it. Invalid/missing overlays or unavailable images hide the overlay section; valid text guidance still displays. The server strictly validates 0–100 coordinates, region bounds, categories, priorities, and text limits, and discards invalid optional overlays without losing valid feedback. Locations are approximate coaching suggestions, not precise measurements.

After merging, redeploy Pages and run **Actions → Deploy Supabase Edge Function → Run workflow → main** to deploy the updated schema/prompt code. No database SQL migration, new secrets, or new environment variables are required.

## Validation and security checks

`npm test` runs auth, credential preflight, persistence, strict response validation, Edge auth/request validation, fallback, idempotency, and quota regressions without live credentials. Runtime regressions execute the real Edge entrypoint with the installed Supabase SDK and controlled HTTP responses. `npm run typecheck` checks the frontend. With Deno 2.5.6 installed, `npm run typecheck:edge` separately checks the deployed server code. The Pages workflow runs both TypeScript checks before exporting. `supabase/tests/rls.sql` checks profile/counter provisioning, restrictive ownership guards even with older broad policies, isolated rows and storage paths, ownership-transfer denial, account-bound RPC calls, anonymous-save denial, and transactional rollback. [supabase/tests/feedback.sql](supabase/tests/feedback.sql) additionally checks provider forgery denial, server-only RPC privileges, reservations, atomic quota increments, three-result enforcement, counter-write denial even with legacy column grants/permissive policies, and retry/fallback races. Run both scripts after the schema in a disposable/local Supabase project or SQL Editor; fixture rows are rolled back. Review any pre-existing policies first.

Native device testing and live Supabase/OpenAI behavior remain unverified and need verification against your configured project. Browser integration checks can validate request handling, but do not substitute for a real project's Auth/Storage policies. These checks use controlled backend responses and do not verify email delivery or live API availability.

## Structure

`app/`: routes and three tabs; `components/`: shared modern cards/study visuals; `data/`: unchanged mock results/practices; `providers/`: auth state; `lib/`: Supabase and artwork persistence; `hooks/`: saved-result loading; `supabase/`: schema, RLS, private bucket policies, and checks.
