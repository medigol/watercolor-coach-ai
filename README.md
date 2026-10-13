# Watercolor Coach AI

A calm, mobile-first watercolor practice app built with Expo, React Native, TypeScript (strict mode), and Expo Router. The project lives directly in this repository root.

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
