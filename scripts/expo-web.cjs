// Use the local Expo CLI without optional network checks or telemetry writes.
const { assertPublicSupabaseKey } = require("./check-public-env.cjs");
const { spawn } = require("node:child_process");
const isBuild = process.argv[2] === "build";
const nodeEnv = isBuild ? "production" : process.env.NODE_ENV || "development";
// Inspect the same dotenv files Expo will load, without printing their values.
const { env: projectEnv } = require("@expo/env").parseProjectEnv(
  process.cwd(),
  {
    mode: nodeEnv,
    silent: true,
  },
);
assertPublicSupabaseKey(
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
    projectEnv.EXPO_PUBLIC_SUPABASE_ANON_KEY,
);
const cli = require.resolve("expo/bin/cli");
const args = isBuild
  ? [
      "export",
      "--platform",
      "web",
      "--output-dir",
      "dist",
      "--clear",
      "--max-workers",
      "2",
    ]
  : [
      "start",
      "--web",
      "--offline",
      "--clear",
      "--port",
      "8081",
      "--max-workers",
      "2",
    ];
const child = spawn(process.execPath, [cli, ...args], {
  stdio: "inherit",
  env: {
    ...process.env,
    NODE_ENV: nodeEnv,
    EXPO_OFFLINE: "1",
    EXPO_NO_TELEMETRY: "1",
    BROWSER: "none",
  },
});
child.on("error", (error) => {
  console.error(error.message);
  process.exitCode = 1;
});
child.on("exit", (code, signal) => {
  process.exitCode = code ?? (signal ? 1 : 0);
});
for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => child.kill(signal));
}
