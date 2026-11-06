const fs = require("node:fs"),
  path = require("node:path"),
  assert = require("node:assert/strict");
const dir = process.argv[2];
if (!dir) {
  throw Error("Usage: node scripts/audit-reference-studio.cjs <web-export>");
}
const jsDir = path.join(dir, "_expo/static/js/web");
const file = fs.readdirSync(jsDir).find((n) =>
  n.startsWith("entry-") && n.endsWith(".js")
);
const js = fs.readFileSync(path.join(jsDir, file), "utf8");
for (
  const marker of [
    "REFERENCE_STUDIO_OPENAI_API_KEY",
    "REFERENCE_STUDIO_BUDGET_ACK",
    "REFERENCE_STUDIO_APPROVED_CONFIG_SHA256",
    "REFERENCE_STUDIO_RELEASE_SHA",
    "SUPABASE_SERVICE_ROLE_KEY",
    "https://api.openai.com/v1/images/edits",
    "LOCAL SYNTHETIC FIXTURE",
    "test-key",
  ]
) {
  assert(
    !js.includes(marker),
    "Server secret, paid endpoint or fixture in frontend: " + marker,
  );
}
for (
  const marker of [
    "Generate improved reference",
    "Export improved reference PNG",
    "Plan the large values",
    "photo-reference/v1",
    "reference_generations",
  ]
) {
  assert(
    js.includes(marker),
    "Studio missing from real application: " + marker,
  );
}
assert(
  !fs.readFileSync("supabase/schema.sql", "utf8").includes(
    "reference_generations",
  ),
  "Original production schema must stay separate from proposed migration",
);
console.log(
  JSON.stringify(
    {
      status: "PASS",
      studioInActualApp: true,
      serverConfigurationAbsent: true,
      noBrowserPaidEndpoint: true,
      noFixtureBypass: true,
      productionMigrationNotAutomatic: true,
    },
    null,
    2,
  ),
);
