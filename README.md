# Watercolor Coach AI

A modern mobile-first watercolor learning MVP using Expo SDK 54, React Native, strict TypeScript, Expo Router, and Supabase. The project lives in the repository root. Home, My Artworks, and Practice remain the only bottom tabs. Account access is in the header.

## Supabase setup

1. Create a Supabase project. Enable the **Email** provider in **Authentication → Providers**. Keep email confirmation enabled unless you deliberately use a disposable development project.
2. Open **SQL Editor → New query**, paste [supabase/schema.sql](supabase/schema.sql), and run the **entire script together** as the project administrator. Apply the updated script before deploying a new frontend from this branch; the migration is transactional and preserves older mock-save callers. It creates `profiles`, `artworks`, `ai_results`, and `usage_counters`, owner-only RLS policies, a new-user profile/counter trigger, and the transactional `save_mock_artwork` function. Existing Auth users are backfilled.
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
- Pick an image and press **Get feedback** or **Create Reference**. The app attempts a private upload, then atomically saves the artwork and its mock result. Reading a result uses its saved ID and stored JSON. Images use temporary signed URLs; no public image URL or expiring signed URL is persisted in the database. `artworks.image_url` stores the private object path.
- If photo access, image format, file size, or storage upload fails, the app uses the sample illustration and can still save the mock metadata. A clear message appears on the result when a selected image could not be stored. If the database definitively rejects the save, a retry message appears and the app stays on the upload screen; it attempts to remove the uploaded image. If the response is lost or the outcome is uncertain, the image is retained because the database may already have saved it, and the message asks you to check My Artworks before trying again. Storage and database operations are separate: interruptions or failed cleanup can leave unreferenced private images; no background cleanup job is added.
- **My Artworks** loads only the signed-in user's saved rows and links to their results. With no rows it shows “No artworks yet. Upload a painting to get your first feedback.” Loading/error/retry states are included.
- Results remain the same realistic **Lake House** and **Coastal Town** samples with `provider='mock'`. Images are **not** analysed. Sketch/reference/value visuals are code-drawn sample aids. No OpenAI API, generated artwork, payments, or subscriptions are integrated.
- Usage counters are provisioned with defaults 0/3 and read-only to clients. They are not incremented or enforced yet; no subscription or quota product flow is added.
- Practice exercises are unchanged. There is no practice tracking, account editing, password reset UI, artwork editing, or deletion UI yet.

## Validation and security checks

`npm test` runs auth, credential preflight, and persistence regressions without live credentials. `supabase/tests/rls.sql` checks profile/counter provisioning, restrictive ownership guards even with older broad policies, isolated rows and storage paths, ownership-transfer denial, account-bound RPC calls, anonymous-save denial, and transactional rollback. Run it after the schema in a disposable/local Supabase project or SQL Editor; fixture rows are rolled back. Review any pre-existing policies first.

Native device testing and live Supabase signup/email/storage behavior need verification against your configured project. Browser integration checks can validate request handling, but do not substitute for a real project's Auth/Storage policies. Previously documented recoverable Expo/React static hydration warnings may remain; the client regenerates working screens.

## Structure

`app/`: routes and three tabs; `components/`: shared modern cards/study visuals; `data/`: unchanged mock results/practices; `providers/`: auth state; `lib/`: Supabase and artwork persistence; `hooks/`: saved-result loading; `supabase/`: schema, RLS, private bucket policies, and checks.
