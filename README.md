# Watercolor Coach AI

A calm, mobile-first watercolor practice app built with Expo, React Native, TypeScript (strict mode), and Expo Router. The project lives directly in this repository root.

## Preview in your browser — no local installation

### GitHub Pages (recommended — no running cloud workspace)

A repository administrator completes this one-time setup entirely in GitHub:

1. Merge the GitHub Pages deployment changes into `main`.
2. Open **Settings → Pages**. Under **Build and deployment**, select **Source → GitHub Actions**. No custom domain is needed.
3. Open **Actions → Deploy Expo web to GitHub Pages → Run workflow**, select `main`, and click **Run workflow**. Pushes to `main` also deploy automatically.
4. Wait for both **build** and **deploy** jobs to succeed. Open the URL shown in the deployment environment, or return to **Settings → Pages → Visit site**.
5. For this repository's default Pages domain, open **https://medigol.github.io/watercolor-coach-ai/**. Bookmark this URL; no local installation, Expo Go, or running Codespace is required.

If Pages is unavailable, check your repository visibility and GitHub plan, and ask the repository administrator to enable it. If Actions is disabled, enable it in **Settings → Actions → General**. If the `github-pages` environment requests deployment approval, approve the pending deployment from the workflow run. A failed deployment does not create a working preview; use the Actions job logs to diagnose it.

The workflow uses Node 22, the committed lockfile, strict TypeScript checks, `npm run build:web`, and GitHub's Pages artifact/deployment actions. Expo exports every route as HTML. The non-secret `EXPO_WEB_BASE_PATH` is supplied automatically by GitHub's Pages configuration so navigation and assets work under `/watercolor-coach-ai`; no secret or manual environment-variable setup is needed. Local Expo web keeps its root paths. Later pushes to `main` update the preview automatically.

Static browser checks passed for navigation, both mock flows, and direct route refreshes. Expo/React currently emits recoverable hydration warnings when loading some static routes; it regenerates the working screen on the client. Actual deployment is verified only after the GitHub Actions run succeeds.

GitHub Pages is a public static preview for the existing mock MVP. Do not treat it as private storage. Selected images are still previewed only in your browser and are not uploaded.

### GitHub Codespaces

1. Open this repository on GitHub and select the `codex/browser-preview` branch (or `main` after this PR is merged).
2. Choose **Code → Codespaces → Create codespace on this branch**. Sign in to GitHub if asked.
3. Wait for the container setup to finish. Dependencies install in the cloud and the preview starts automatically.
4. Open the **Ports** panel. For port **8081**, click **Open in Browser**. If it does not appear, choose **Forward a Port**, enter `8081`, and open it.
5. Use the app in the new browser tab. Keep the Codespace running while viewing it; stop the Codespace when finished.

The forwarded port stays private and requires your GitHub sign-in. A Codespace requires available GitHub Codespaces quota; your computer needs only a browser. GitHub's repository page and github.dev alone do not run the app.

If startup needs to be retried, run these commands in the **Codespaces terminal**, not on your computer:

```sh
npm ci
npm run preview
```

The automatic server log is `/tmp/watercolor-preview.log`. If port 8081 is already serving the app, open that port instead of starting another copy.

### Codex cloud

In the repository root of a Codex cloud task, run `npm ci` if dependencies are missing, then `npm run preview`. If your Codex interface provides port forwarding or a web-preview action, open port **8081** through that interface. A localhost URL shown in terminal output belongs to the cloud machine and cannot be opened directly on your computer. The cloud environment onboarding UI does not provide a user-facing web preview; use Codespaces for that environment.

### Package a web build

Run `npm run build:web` in a Codespaces or Codex terminal to export the existing app into `dist/`. The static export includes HTML for each app route, so direct links and refreshes work without a single-page-app fallback. Exporting alone does not publish a website. The GitHub Pages workflow below publishes this output.

The preview uses existing Expo web support and fixed mock data. No backend, accounts, or API keys are needed. Offline mode skips Expo's optional compatibility API; package installation still needs Internet access.

## Install

Use Node.js 20.19+ (Node.js 22 LTS recommended) and npm. From the repository root:

```sh
npm install
```

## Run locally

```sh
npx expo start
```

If your network blocks Expo's compatibility API and startup reports `fetch failed`, use Expo's offline mode:

```sh
npx expo start --offline
```

Offline mode uses the installed SDK and packages without requesting compatibility data. In the restricted cloud environment, use `EXPO_NO_TELEMETRY=1 npx expo start --offline` to avoid home-directory telemetry writes. The app itself still needs no environment variables.

Scan the QR code with an Expo Go version compatible with Expo SDK 54, or use an Android emulator / iOS simulator. Press `a` for Android or `i` for iOS (requires macOS and Xcode). You can also run `npm run web` to try the browser version. If your Expo Go version no longer supports SDK 54, use a compatible Expo Go build or an Expo development build.

```sh
npm run typecheck
npx expo export --platform web
```

## MVP screens

- **Home:** two actions — Improve my painting and Create painting reference.
- **Improve painting:** choose a local image, select a feedback focus, and view the Lake House mock feedback. Main advice appears first, followed by strengths, fixes, composition, sketch and value placeholders, practice, and a next prompt.
- **Create reference:** choose a local photo and view a Coastal Town sample guide, palette, and painting steps.
- **My Artworks:** two mock saved items that open the corresponding sample results.
- **Practice:** five simple 15-minute exercises.

The bottom navigation contains only Home, My Artworks, and Practice. Upload and result screens use stack navigation with a back button.

## Structure

`app/` holds Expo Router screens; `components/` contains reusable cards and simple StyleSheet styling; `data/` contains mock results, artworks, and exercises; `types/` defines shared TypeScript types.

## Current limitations

- Feedback and references are fixed mock data. Selected images and feedback options do not change the sample advice.
- Images are selected locally and previewed on-device; nothing is uploaded or analysed. You can continue without granting photo permission.
- Sketches, references, thumbnails, and value studies are labelled visual placeholders, not generated artwork.
- My Artworks is a static sample collection. Uploads are not saved, and no persistence, accounts, or backend exists.
- No image generation, advanced AI settings, charts, or payment integrations.
- No environment variables or secrets are required.

Supabase, the OpenAI API, and subscription payments (including Apple and Google subscriptions) will be added later. None are integrated in this MVP.
