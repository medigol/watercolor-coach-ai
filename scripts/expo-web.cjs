// Use the local Expo CLI without optional network checks or telemetry writes.
const { spawn } = require("node:child_process");
const cli = require.resolve("expo/bin/cli");
const args = process.argv[2] === "build"
  ? ["export", "--platform", "web", "--output-dir", "dist", "--max-workers", "2"]
  : ["start", "--web", "--offline", "--port", "8081", "--max-workers", "2"];
const child = spawn(process.execPath, [cli, ...args], {
  stdio: "inherit",
  env: { ...process.env, EXPO_OFFLINE: "1", EXPO_NO_TELEMETRY: "1", BROWSER: "none" },
});
child.on("error", (error) => { console.error(error.message); process.exitCode = 1; });
child.on("exit", (code, signal) => { process.exitCode = code ?? (signal ? 1 : 0); });
for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => child.kill(signal));
}
