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

To test failures, leave the function undeployed, leave its existing OpenAI secret unset, or simulate a failed model/image request in a disposable environment. New production submissions must show an error and stay on the upload screen, with no mock artwork/result and no quota increment. Invalid JSON or invalid required core feedback also fails clearly. Malformed optional brush, promising, strategy, palette metadata, composition notes and reference observations are cleaned or omitted; valid core coaching can still save as OpenAI. Quota shows the existing limit message; an in-progress request asks you to check My Artworks; an expired session asks you to sign in again. Validation (422), service (503), quota (403), expired session (401), and busy (409) failures have distinct safe messages. A 422 explains that failed validation does not use a successful-analysis quota unit. Uncertain outcomes retain the Check My Artworks guidance. No upstream keys, prompts, image contents or private error details are exposed.

Retrying the unchanged form reuses the same request ID and uploaded path after uncertain outcomes; changing the image/account starts a new Improve Painting attempt; reference request identity remains unchanged. Replaying an already saved result returns it without replacement or quota increment. A confirmed `provider=mock` response from an older deployed function is rejected by the new upload flow; a subsequent manual retry uses a new request ID but retains its image, since the older sample may reference it. There is no automatic second model call. This in-memory retry state does not survive a page reload. Private images are retained when a save might have committed; interruptions may leave private orphans. Existing saved samples remain accessible through My Artworks, but result URLs without a saved ID show an error rather than silently opening a sample.

Live automatic feedback requires a real configured Supabase project, the SQL migration, a deployed function, and an OpenAI API key with API credits. None of those credentials are included. No paid API call is needed to run the regression suite.

## Canonical painting analysis (version 1)

**Improve my painting** now has one upload surface and one **Analyse painting** action. There is no focus question: hidden compatibility metadata defaults to `Overall feedback` and does not affect the model prompt. A saved result opens **Complete Painting Analysis**, one continuous workspace with Overall Assessment, What works, an evidence-supported opportunity when appropriate, Composition, Colour & Value, Watercolor technique, and Practice & Studies. Desktop keeps the artwork sticky beside the coaching inspector; mobile puts artwork and controls first with collapsible details. There are no four-mode tabs or repeated mode navigation. Clean, Notes, Composition and Roles are local display controls.

The saved JSON has three top-level fields: `title`, `canonicalAnalysis`, and `expertViews`. `canonicalAnalysis.version` is `1`. Shared facts and roles are stored once:

- `qualityAssessment`: developing, competent, strong, or highly_resolved; confidence and a short rationale about the painting, never the person's skill.
- `visualRoles`: stable IDs for named focal/supporting/quiet groups, with optional located regions and confidence.
- `facts`: descriptive visual observations, domain and role references.
- `composition`: one observation, optional primary structure and one distinct optional secondary. Geometry and entry/path/landing teaching belong here, never inside expert views.
- `insights`: domain-owned lessons referring to fact IDs, classified as strength, clear_issue, optional_refinement, stylistic_alternative, or study_experiment.
- Optional `colourAnalysis`, `visualEvidence`, legacy `palette`, and `brushPlan`. `colourAnalysis` describes approximate visible swatches, colour/value/chroma/temperature relationships, a classified technical assessment, and up to three possible recreation mixes. Swatches come from the same model response, not local pixel sampling or pigment identification; ratios are approximate starting points. Malformed optional colour data is omitted without rejecting core coaching. Older v1 results omit the extension and show only their supplied observations; no colour facts are fabricated. The canonical workspace replaces the generic Suggested Palette card. Practice may be empty when no useful task is supported. Visual notes refer to canonical insight and role IDs. Their evidence, classification, domain, reason, action and displayed role are derived from those references, without storing independent verdicts.

Each expert view contains only `summaryId`, owned `insightIds`, and one short `practice`. There are no per-view quality, focal, role or composition fields. Overall is shortest. Composition teaches the shared design; Colour discusses value/temperature/chroma; Technique separates visible appearance from suggested reproduction methods. A strong painting can have no clear issues. The UI then omits “What to improve” and teaches successful decisions, with clearly labelled optional alternatives when supplied.

**Composition Lock:** all views project the same canonical structures, normalized anchors and role regions into the existing renderers. Diagonal anchors become a predictable entry-to-landing line; existing archetype rendering controls curves, triangles, grids, mass relationships and minimal markers. Thirds grids require a supported thirds structure. Low-confidence or malformed optional geometry is omitted; a focal point conflicting with an explicitly located canonical focal region is omitted. Primary and secondary are inspected separately. Notes, original-image contextual crops, and Clean/Coaching controls remain available without creating image files or storage objects.

**Cost and quota:** the previous workflow could request a separate analysis for each selected focus. A new canonical analysis now sends one image in one OpenAI request and completes one saved-result transaction. The model remains `gpt-4.1-mini`, `max_completion_tokens: 3000`, with the existing deadlines. The budget has not increased; optional aids should be null rather than crowd out required views. Opening sections/layers, colour or practice details, and reopening saved results use zero provider calls and zero quota units. Saved-result reopening still performs authorized reads and signed-URL requests. There is no guaranteed 4× cost saving: usage depends on which analyses would otherwise have been requested and their output lengths.

One successful canonical result consumes **one** of the existing three successful OpenAI results, not four. Failure does not consume a successful-result unit. New explicit analyses still use the normal quota and idempotency rules. No new re-analysis button or follow-up API was added. Manual retry of the same painting preserves its Improve Painting request identity. There is no pre-analysis view selector. Changing image/account/mode retains the existing request-identity separation. Server reservation, owner checks and atomic quota completion are unchanged.

Required canonical facts, references and all four views are validated. Missing/invalid required data, unsupported versions, malformed JSON or truncated output cause an explicit failure, never mock substitution. Optional visual/method aids are cleaned independently. Existing saved focus-specific JSON and mock data keep their legacy presentation; opening them never fabricates canonical facts or silently re-analyses an image. `create_reference` retains its existing one-call plan, response shape, palette/steps, prompt and quota; shared errors use clearer public copy.

Deploy **Pages first**, then **Actions → Deploy Supabase Edge Function → Run workflow → main** after review and merge. The full checkout, including root `shared/`, is required for the function bundle. No SQL migration, new dependencies, environment variables or secrets are needed. OpenAI keys remain exclusively in Supabase function secrets. Until the function is redeployed, existing canonical v1 results remain readable with their supplied data; the new optional colour extension appears only when returned by the deployed function.

Text contradiction/duplicate checks are conservative English heuristics, not semantic image verification. Located regions and quality judgments can still be mistaken. Automated tests use controlled model/network responses; native-device testing and live paid-model calibration remain unverified. Phase 2 remains deferred: no painting-stage simulation, generated/edited images, reconstruction, YouTube or artist recommendations. Composition reference images are not app assets and were not copied.

## Coaching overlays

New feedback can include one to three useful teaching notes, including specific strengths. **Notes**, image markers, note headings and their contextual crops use the same selection. The Notes layer is the single image-side control for opening the matching Explore section; no competing Open notes button is shown. Selecting a marker opens its note; selecting a note or crop highlights its source region. Browser navigation gently brings that context into view and respects reduced motion. Detailed notes remain inside **Explore your feedback**.

Each note can be local, multi-region, or global. Local notes show a contextual view of the original image. Multi-region notes can show separate areas or anchors, without inventing a single combined crop. Global notes keep whole-image context and text. Crop views use the existing signed image URI, adaptive padding, intrinsic aspect ratio and capped enlargement; they create no files, uploads, storage objects or database rows. Repeated evidence views are shared. Bad, tiny or uncertain geometry omits the visual while keeping useful text.

**Hide coaching / Show coaching** compares the untouched original with its teaching graphics. Available **Notes**, **Composition** and **Roles** views are exclusive; graphics are not stacked. Roles appears only when confident geometry identifies a useful focal/supporting/quiet relationship. Text and line styles distinguish roles, rather than colour alone. All these controls are local presentation state and make no model call or quota change.

The pure [shared/imageGeometry.ts](shared/imageGeometry.ts) module is the source of truth for intrinsic-image coordinates, contain fitting, markers, highlights, crops, paths and polygons. New geometry uses normalized 0–1 coordinates; older 0–100 marks pass through the same adapter. Explicit local regions take priority over contradictory older geometry. No screen coordinates are persisted. Landscape, portrait, square and wide images use the same transform.

Optional `compositionOverlay` metadata describes a meaningful structure in the **current painting**, drawn transparently over that painting using original SVG primitives. The internal library includes diagonal movement, S-curves, L/U structures, enclosure, triangle/radiating/three-spot groupings, balance, rhythm, overlap, cross, thirds and off-centre placement. No formula is forced: none, mixed or uncertain interpretations are valid. At most one primary and one optional secondary interpretation can be inspected separately. The explanation should name the actual elements and eye path; a confidence below the visualization threshold omits the overlay. No reference-book images, diagrams or text are included.

Notes distinguish **Strength**, **Clear issue**, **Optional refinement**, **Stylistic alternative** and **Study experiment**. Evidence precedes meaning and action. Unsupported corrective claims are presented cautiously as separate-study ideas; taste is not treated as an error. Strong paintings may have no clear issues. Explicit brush recipes belong to Technique, structural redesign to Composition, and value/temperature/palette guidance to Colour & value; brief related-domain labels replace repeated paragraphs. These conservative text guards do not verify visual evidence or understand every sentence.

All new JSON fields are optional and independently cleaned. Invalid optional geometry must never turn valid live feedback into a sample or invalidate core feedback. Old saved results and unchanged mock samples remain readable without reprocessing. Structural moves, reframing and major redesign remain future-study suggestions. Locations and inferred structures are approximate teaching guidance, not tracing or measurements. Image load failures retain text. There is no generated or edited image, extra model request, SQL migration, or change to private storage, auth, quota or idempotency.

## Reference preparation and study aids

The real reference result includes **Original**, **Value**, **Simplified**, and **Adjust** views when an uploaded photo is available. Samples omit these image views. Browser views use deterministic, client-side CSS filters: grayscale/contrast for values, reduced saturation and slight softness for simplification, and bounded contrast, brightness, and saturation sliders. Reset restores the original view and default controls. These are display-only planning views; the saved image is never edited, repainted, replaced, or uploaded again.

This stable MVP does not perform true three-value posterization, isolate objects, or remove photographic detail. Native clients and browsers without filter support keep the original image and explain the limitation. Unavailable images leave the painting plan and study aids usable. There is no canvas pixel access, so private signed-image URLs can use these filters without requiring cross-origin pixel reads.

**Thumbnail planning** shows zero to two evidence-supported studies, with no minimum. When the provider is `openai` and an uploaded image and relevant valid geometry are available, the original image is shown beneath its saved crop frame, eye-flow path, value masses, simplify region, structure line, or focal ring. These cards say **Study overlay on your image** and **Use as a guide, not tracing**. No new shapes are inferred from pixels, and no tracing accuracy is promised. Value studies use a grayscale display filter in supported browsers; native/unsupported clients keep the original colours with the same value marks. Filters never modify the stored image.

Relevant studies with unavailable images, missing geometry, point-only advice, or sample results say **Generic planning diagram · use when image overlay is unavailable**. Validated note categories and simple text cues choose supported exercises and broad landscape/street layouts; unknown subjects do not force a fallback study. Generic diagrams remain templates to adapt to your image. The original saved sketch and value notes remain available in a compact disclosure. Selection can miss unusual subjects or ambiguous wording, and saved mark locations remain approximate. Crop advice is always a next-study experiment, rather than moving already-painted objects.

**Planning studies** has one shared budget of **zero to two** supported future experiments. No minimum is filled: an unrelated horizon, eye-flow or generic composition diagram is omitted. Colour normally uses value/temperature/chroma studies; Technique uses handling/edge studies; Overall stays tied to one useful learning point. Relevant saved image geometry comes first, with a title, action and geometry drawn from the same evidence item. Contradictory named targets use an honest generic exercise or are omitted. Automatic generic-model filler is removed; the original reusable diagram library remains in the codebase. A study repeating the current Composition overlay is omitted; genuinely different future paths, crops and focal experiments remain available. A generic card earns a place only when it adds a useful idea. App-drawn diagrams use no external artwork, pixel analysis, or image generation. Images that cannot load retain an honest generic aid. Full sketch/value notes live separately in **Sketch & value plan**.

On wide browser screens, results use a centered container up to 1,200px, with the painting on the left and the summary/Explore sections on the right. Phones retain the single-column order. Detailed sections remain collapsible at both widths; no fragile sticky behavior is added.

Painting steps keep numbered markers and existing strings, inside **Painting sequence** for reference results. **Suggested palette** presents optional colour families, approximate layered swatches, supplied roles, tested mix ideas and supported common pigment codes. It never identifies original pigments from pixels. Only PB29/Ultramarine, PBr7/Burnt Sienna, and PY43/PY42/Yellow Ochre are supported conservative optional matches; uncertain codes are omitted. Formulations and mixes vary. There are no manufacturer formulas, commercial catalogs or purchase recommendations.

## Focused coaching and a short result summary

The first result shows the uploaded image with at most three priority-ranked marks, one **Main coaching point** (or **Study observation**), two or three specific strengths, up to three improvements or optional refinements, and **Next 15-minute practice**. A distinct supplied `promising` observation becomes a small **Why this is worth developing** / **Advanced observations** subnote within strengths. It does not create another large card. New reference results may supply an optional practice exercise; older reference plans use their existing first step on a separate 15-minute study sheet. Missing optional content does not manufacture image observations.

**Explore your feedback** contains compact rows. Overall starts with every detail closed. Other selected focuses promote one available relevant section after the shared summary:

| Selected focus       | First detailed section | Main emphasis                                                                  |
| -------------------- | ---------------------- | ------------------------------------------------------------------------------ |
| Overall feedback     | None initially open    | Short synthesis and one next step                                              |
| Composition          | Composition            | Eye path, focal placement, shape balance and future layout studies             |
| Colour & contrast    | Colour & value         | Value hierarchy, warm/cool relationships, focal contrast and suggested palette |
| Watercolor technique | Watercolor technique   | Recommended brush/wash practice, moisture conditions, edges and stopping cues  |

The remaining rows change order with the focus. Only one Explore row opens at a time. Tapping an image marker opens its matching visual note, rather than all note cards; **Show all notes** is explicit. Brush plans remain inside Watercolor technique, with at most three concise recommended stages and an explicit statement that they do not reconstruct the original process. **Ask a follow-up** only displays a short supplied suggestion, stays secondary and is absent from samples. Opening rows, changing views, or reading saved guidance makes no model call, database write or quota increment.

## Legacy coaching decisions and consistency guards

Legacy focus-specific responses include optional `coachingDecision` metadata: one `primaryGoal`, a named subject/area, areas to emphasize/quiet, a safe current action, a future-study action, supporting observations and relevant composition/colour/technique implications. The existing single request shares descriptive visual facts and role relationships, while each selected focus interprets them independently. `primaryGoal` remains a compatibility summary and no longer overwrites valid focus-specific `mainAdvice` or forces every domain/exercise to paraphrase it. Supporting observations contain visible evidence rather than action instructions. `coachingMode` still privately calibrates resolvedness; it does not assess a user, store a skill profile or compare multiple images.

The pure [shared/coachingDecision.ts](shared/coachingDecision.ts) helper validates metadata and removes obvious lower-priority contradictions for explicitly named targets. The same projection is used by the Edge cleaner and the frontend display of saved metadata. Negation, factual observations and clearly different subareas are treated cautiously. Structural object moves/removal, cropping, horizon, spacing and major redesign are future-study directions. Current interventions are restricted to small conditional actions or scrap tests; resolved work has no current-painting intervention. Exact duplicates are suppressed, and legacy full coaching/practice notes remain available inside Sketch & value plan when summaries are shortened.

Invalid optional metadata is dropped without invalidating otherwise valid core feedback. Required core bounds remain strict: cleaning cannot repair malformed required arrays or overlong prompts. Empty refinement arrays are allowed when nothing warrants correction. Existing saved results without metadata keep their legacy content and safe presentation fallbacks; they are never automatically reassessed, rewritten or charged. Existing saved samples remain clearly labelled examples with no uploaded-image/real-mark mixup. Production failures still show errors rather than silently saving new mock guides.

For strong/resolved or uncertain work, the model explains why visible decisions work and offers modest separate-study variations. Headings use **What makes this work**, **Advanced observations**, **Optional refinements** and **How to practise this handling**. Developing work retains constructive feedback with one priority. Observable effects may be stated directly; inferred process is framed as a recommended way to practise or reproduce an effect. Original brushes, pigments, moisture, materials and sequencing are not asserted as known facts from a finished image. Explicit old original-process claims in brush/palette notes are omitted conservatively rather than replaced by invented facts.

These are bounded text guards, not a full semantic contradiction detector or a reliable assessment of painting quality. Ambiguous names, synonyms, pronouns, passive phrasing, very subtle subareas and unusual wording can escape detection or cause a useful sentence to be omitted. Guidance can still be mistaken. Native testing and live model calibration require a configured project/device; automated browser tests use controlled responses.

Composition uses its archetypes as teaching grammar. Optional `compositionOverlay.teaching` metadata names actual visible elements, entry, eye path, landing, supporting/quiet masses, counterbalance and risk. Missing or malformed members are omitted without invalidating core feedback. A typical overlay shows one structure, one focal landing and at most one supporting mass; balance/cross/radiating structures retain only the extra geometry their lesson requires. The thirds grid appears only for a supported thirds interpretation, and primary/secondary structures remain separately inspectable.

Shared [coachingEvidence.ts](shared/coachingEvidence.ts) guards observable appearance versus suggested practice, success versus conflicting corrections, and closely repeated learning insights. A successful crisp edge cannot simultaneously be labelled as needing a crisper edge at the same named target; explicit subregions and optional future experiments remain valid. Strength cards proposing changes are reclassified as study experiments. These are conservative deterministic text checks, not semantic image verification: ambiguous subjects and novel wording can evade them, or cause useful guidance to be omitted. No additional model request is made.

## Deploying this result refinement

Deploy the frontend first: after reviewing and merging into `main`, wait for **Deploy Expo web to GitHub Pages** to succeed. Then run **Actions → Deploy Supabase Edge Function → Run workflow → main**. CLI deployment must run from the full checkout so `generate-feedback`, `_shared/` and the imported root `shared/` modules are available. Pages does not deploy Supabase functions. New geometry, evidence, scope and composition metadata require a new analysis after redeploying; old results remain readable and are never automatically reprocessed.

No SQL migration, new secrets, environment variables or dependencies are required. Auth, private storage, RLS, the three-result quota, idempotency and successful-result accounting remain unchanged. The model, one-call architecture, image detail, 3,000-token completion cap and deadlines remain unchanged. Prompts guide optional visuals within that request; actual token use and billing can vary, but no additional model invocation is introduced. Keep the existing production live-only handler fix when deploying, since an older function can still save samples before the frontend rejects them. Missing public Supabase configuration still shows the safe setup screen.

Phase 2 remains deferred: no first-wash simulation, staged grayscale/colour sequence, intermediate painting reconstruction or generated paint stages are included. Shared normalized primitives can support later work without adding those interfaces now. Native-device behavior, live model calibration and visual correctness on real artwork still need device/project testing; automated checks use controlled results and original technical fixtures.

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

## Professional workspace validation

`npm test` includes canonical calibration, optional colour safety, domain/reference repair, strict schema, one-call/quota/idempotency, no-fallback, legacy and Create Reference regressions. For the optional browser harness, first export using fake public configuration (`EXPO_PUBLIC_SUPABASE_URL=https://watercolor-test.supabase.co`, `EXPO_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_browser_test_only`) and serve the Pages export. The harness blocks every unexpected external origin; do not point it at a live account setup. With Playwright already available in a test environment, `node tests/browser/professional-workspace.cjs <served-base-url> <artifact-directory>` runs controlled browser interactions and produces screenshots plus a JSON report. The harness uses original technical SVG fixtures and fake network responses; it never contacts OpenAI or a live database. Playwright is optional testing infrastructure, not an app dependency. The cloud validation uses Chromium and an external installed Playwright via `NODE_PATH`.

The model stays `gpt-4.1-mini` with `max_completion_tokens: 3000`. Automated fixtures cannot prove live-model production reliability or calibration. Native-device testing remains unverified. No SQL, secrets, dependencies, quota architecture, auth, RLS, or storage change is required. Contextual evidence clips the original image in the browser without creating crop files. Value comparisons apply grayscale only on web; native shows the original with a limitation message. Local colour sampling, edited comparisons/history and Phase 2 remain deferred.

The [professional coaching review](docs/review/professional-coaching-experience.md) includes the validation details, limits, deployment order and 12 inspectable screenshots.

The [master coaching pass review](docs/review/master-coaching-pass.md) documents ranked improvement advice, original-image evidence, source colour examples, mobile refinements and the expanded responsive checks. For an export built without Supabase variables, `node tests/browser/unconfigured-pages.cjs <served-base-url>` checks eight direct Pages routes for the safe setup screen. Both browser scripts require the same optional Playwright test infrastructure described above.
