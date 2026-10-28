// Isolated QA export. Never edits the checkout or ships synthetic media.
const fs = require("node:fs"),
  path = require("node:path"),
  cp = require("node:child_process");
const root = path.resolve(__dirname, ".."),
  dir = fs.mkdtempSync("/tmp/watercolour-video-fixture-");
const files = cp
  .execFileSync(
    "git",
    ["ls-files", "--cached", "--others", "--exclude-standard", "-z"],
    { cwd: root },
  )
  .toString()
  .split("\0")
  .filter(Boolean);
for (const file of new Set(files)) {
  if (
    file.startsWith("docs/") ||
    file.startsWith("supabase/") ||
    !fs.statSync(path.join(root, file)).isFile()
  )
    continue;
  fs.mkdirSync(path.dirname(path.join(dir, file)), { recursive: true });
  fs.copyFileSync(path.join(root, file), path.join(dir, file));
}
fs.symlinkSync(
  path.join(root, "node_modules"),
  path.join(dir, "node_modules"),
  "dir",
);
const media = path.join(dir, "learning/media.ts"),
  s = fs.readFileSync(media, "utf8"),
  needle = "export const mediaResources: MediaResource[] = [];";
if (!s.includes(needle))
  throw Error(
    "Expected empty production catalogue; refusing to patch an unknown source",
  );
fs.writeFileSync(
  media,
  s.replace(
    needle,
    "export const mediaResources: MediaResource[] = " +
      JSON.stringify([require("../tests/helpers/video-fixture.cjs")()]) +
      ";",
  ),
);
const output = process.argv[2] || "/tmp/watercolour-video-fixture-export";
const r = cp.spawnSync(
  process.execPath,
  [
    path.join(root, "node_modules/expo/bin/cli"),
    "export",
    "--platform",
    "web",
    "--output-dir",
    output,
    "--clear",
    "--max-workers",
    "2",
  ],
  {
    cwd: dir,
    stdio: "inherit",
    env: {
      ...process.env,
      EXPO_PUBLIC_SUPABASE_URL: "https://watercolor-test.supabase.co",
      EXPO_PUBLIC_SUPABASE_ANON_KEY: "sb_publishable_browser_test_only",
      EXPO_WEB_BASE_PATH: "/watercolor-coach-ai",
      EXPO_OFFLINE: "1",
      EXPO_NO_TELEMETRY: "1",
    },
  },
);
if (r.error) throw r.error;
process.exitCode = r.status ?? 1;
