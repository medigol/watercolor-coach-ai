// Offline database execution: cached PostgreSQL only, no exposed ports/network,
// synthetic accounts only, no production URL/credentials, no schema deployment.
const { spawnSync, spawn } = require("node:child_process");
const assert = require("node:assert/strict");
const fs = require("node:fs"),
  path = require("node:path"),
  crypto = require("node:crypto");
const root = path.resolve(__dirname, ".."),
  name = "watercolor-rc-" + crypto.randomBytes(6).toString("hex");
function docker(args, input, allowFailure = false) {
  const r = spawnSync("docker", args, {
    input,
    encoding: "utf8",
    timeout: 60000,
    maxBuffer: 1024 * 1024,
  });
  if (!allowFailure && (r.error || r.status !== 0))
    throw Error(`Local database check failed: ${r.error?.message || r.stderr}`);
  return r;
}
async function main() {
  let started = false;
  try {
    docker(["image", "inspect", "postgres:16", "--format", "{{.Id}}"]); // Never pull.
    docker([
      "run",
      "--detach",
      "--rm",
      "--pull",
      "never",
      "--network",
      "none",
      "--name",
      name,
      "--tmpfs",
      "/var/lib/postgresql/data:rw",
      "--env",
      "POSTGRES_HOST_AUTH_METHOD=trust",
      "postgres:16",
    ]);
    started = true;
    let ready = false;
    for (let i = 0; i < 40; i++) {
      if (
        docker(["exec", name, "pg_isready", "-U", "postgres"], undefined, true)
          .status === 0
      ) {
        ready = true;
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
    if (!ready) throw Error("Disposable local PostgreSQL did not become ready");
    const sql = (file) =>
      docker(
        [
          "exec",
          "-i",
          name,
          "psql",
          "-X",
          "-v",
          "ON_ERROR_STOP=1",
          "-U",
          "postgres",
          "-d",
          "postgres",
        ],
        fs.readFileSync(path.join(root, file), "utf8"),
      );
    sql("tests/helpers/local-supabase.sql");
    sql("supabase/schema.sql");
    sql("supabase/schema.sql");
    sql("supabase/tests/rls.sql");
    sql("supabase/tests/feedback.sql");
    const u = "10000000-0000-4000-8000-000000000009";
    docker(
      [
        "exec",
        "-i",
        name,
        "psql",
        "-X",
        "-v",
        "ON_ERROR_STOP=1",
        "-U",
        "postgres",
      ],
      "insert into auth.users(id,email) values ('" +
        u +
        "','concurrent@example.invalid');",
    );
    const claim = (i) =>
      new Promise((resolve, reject) => {
        const child = spawn("docker", [
          "exec",
          "-i",
          name,
          "psql",
          "-X",
          "-qAt",
          "-v",
          "ON_ERROR_STOP=1",
          "-U",
          "postgres",
        ]);
        let output = "",
          error = "";
        child.stdout.on("data", (v) => (output += v));
        child.stderr.on("data", (v) => (error += v));
        child.on("error", reject);
        child.on("close", (code) =>
          code === 0
            ? resolve(
                JSON.parse(
                  output
                    .trim()
                    .split("\n")
                    .find((v) => v.startsWith("{")),
                ).status,
              )
            : reject(Error(error)),
        );
        child.stdin.end(
          "set role service_role; select set_config('request.jwt.claim.role','service_role',false); select public.claim_feedback_request('" +
            u +
            "','20000000-0000-4000-8000-00000000000" +
            i +
            "');",
        );
      });
    assert.deepEqual((await Promise.all([claim(8), claim(9)])).sort(), [
      "busy",
      "claimed",
    ]);

    console.log(
      "PASS: real PostgreSQL 16; schema rerun twice; owner-only RLS/storage paths; server-only RPCs; transactional quota/idempotency/rollback tests; simultaneous independent claims yield exactly one reservation. No live Supabase services contacted.",
    );
  } finally {
    if (started) docker(["stop", "--time", "2", name], undefined, true);
  }
}
if (require.main === module)
  main().catch((e) => {
    console.error(e.message);
    process.exitCode = 1;
  });
