const { test } = require("node:test");
const assert = require("node:assert/strict");
const { assertPublicSupabaseKey } = require("../scripts/check-public-env.cjs");
const tokenFor = (role) =>
  [
    Buffer.from("{}").toString("base64url"),
    Buffer.from(JSON.stringify({ role })).toString("base64url"),
    "test-only-signature",
  ].join(".");
test("missing configuration and public keys remain exportable", () => {
  for (const key of [
    undefined,
    "",
    "   ",
    "sb_publishable_test_only",
    tokenFor("anon"),
  ])
    assert.doesNotThrow(() => assertPublicSupabaseKey(key));
});
test("privileged and user JWT credentials cannot be embedded by Expo", () => {
  for (const key of [
    "sb_secret_test_only",
    " SB_SECRET_test_only ",
    tokenFor("service_role"),
    tokenFor("authenticated"),
    tokenFor(null),
  ]) {
    assert.throws(
      () => assertPublicSupabaseKey(key),
      (error) =>
        error.message.includes("Refusing to export") &&
        !error.message.includes(key.trim()),
    );
  }
});

const { mkdtempSync, writeFileSync, rmSync } = require("node:fs");
const { tmpdir } = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
test("the web runner refuses privileged keys loaded from production dotenv files", () => {
  const root = mkdtempSync(path.join(tmpdir(), "watercolor-public-env-"));
  const marker = "sb_secret_test_only_do_not_bundle";
  try {
    writeFileSync(
      path.join(root, ".env.production"),
      `EXPO_PUBLIC_SUPABASE_ANON_KEY=${marker}\n`,
    );
    const env = { ...process.env };
    delete env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
    delete env.EXPO_NO_DOTENV;
    const result = spawnSync(
      process.execPath,
      [path.resolve(__dirname, "../scripts/expo-web.cjs"), "build"],
      { cwd: root, env, encoding: "utf8" },
    );
    assert.equal(result.status, 1);
    assert.match(result.stderr, /Refusing to export/);
    assert.ok(!result.stderr.includes(marker));
    assert.ok(!result.stdout.includes(marker));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("direct Expo configuration also rejects privileged public-variable values", () => {
  const marker = "sb_secret_test_only_do_not_bundle";
  const result = spawnSync(
    process.execPath,
    [
      "-e",
      `require(${JSON.stringify(path.resolve(__dirname, "../app.config.js"))})`,
    ],
    {
      env: { ...process.env, EXPO_PUBLIC_SUPABASE_ANON_KEY: marker },
      encoding: "utf8",
    },
  );
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Refusing to export/);
  assert.ok(!result.stderr.includes(marker));
});
