// Real isolated PostgreSQL; cached image only, no network/exposed ports.
const { spawnSync, spawn } = require("node:child_process"),
  fs = require("node:fs"),
  assert = require("node:assert/strict"),
  crypto = require("node:crypto");
const { request, owner } = require("../tests/helpers/reference-fixture.cjs");
const name = "watercolor-reference-" + crypto.randomBytes(5).toString("hex");
let started = false;
function docker(args, input, allowed = false) {
  const r = spawnSync("docker", args, {
    input,
    encoding: "utf8",
    timeout: 60000,
    maxBuffer: 1024 * 1024,
  });
  if (!allowed && (r.status !== 0 || r.error)) {
    throw Error(r.stderr || String(r.error));
  }
  return r;
}
const sqlArgs = [
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
];
const sql = (text, allowed = false) => docker(sqlArgs, text, allowed);
const quote = (s) => "'" + s.replaceAll("'", "''") + "'";
function claim(r) {
  return `set role service_role;select public.claim_reference_generation('${r.ownerId}','${r.id}',${
    quote(JSON.stringify(r))
  }::jsonb);`;
}
function parallel(text) {
  return new Promise((resolve, reject) => {
    const child = spawn("docker", sqlArgs, { stdio: ["pipe", "pipe", "pipe"] });
    let out = "", err = "";
    child.stdout.on("data", (b) => out += b);
    child.stderr.on("data", (b) => err += b);
    child.on("error", reject);
    child.on(
      "exit",
      (code) => code ? reject(Error(err)) : resolve(JSON.parse(out.trim())),
    );
    child.stdin.end(text);
  });
}
(async () => {
  try {
    docker(["image", "inspect", "postgres:16"]);
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
    for (let n = 0; n < 60; n++) {
      if (
        // The entrypoint's temporary init server has a Unix socket but no TCP
        // listener. Wait for the final server, not that short-lived init socket.
        docker(
          ["exec", name, "pg_isready", "-h", "127.0.0.1", "-U", "postgres"],
          undefined,
          true,
        )
          .status === 0
      ) {
        ready = true;
        break;
      }
      await new Promise((r) => setTimeout(r, 250));
    }
    if (!ready) {
      throw Error("Disposable PostgreSQL final server did not become ready");
    }
    for (
      const file of [
        "tests/helpers/local-supabase.sql",
        "supabase/schema.sql",
        "supabase/migrations/202611060001_reference_studio.sql",
        "supabase/migrations/202611060001_reference_studio.sql",
      ]
    ) sql(fs.readFileSync(file, "utf8"));
    const other = "10000000-0000-4000-8000-000000000002",
      r1 = request(),
      r2 = request();
    r2.ownerId = other;
    r2.id = "20000000-0000-4000-8000-000000000002";
    r2.source.path = `${other}/${r2.id}/source.png`;
    r2.input.path = `${other}/${r2.id}/input.png`;
    sql(
      `insert into auth.users(id,email) values('${owner}','one@example.invalid'),('${other}','two@example.invalid');insert into public.reference_generation_accounts(user_id,enabled,attempt_limit) values('${owner}',true,2),('${other}',true,2);`,
    );
    const operations = require("../tests/helpers/reference-operations-db.cjs");
    const legacy = operations.prepare(sql);
    for (let i = 0; i < 2; i++) {
      sql(
        fs.readFileSync(
          "supabase/migrations/202611060002_reference_operations.sql",
          "utf8",
        ),
      );
    }
    operations.upgrade(sql, legacy);
    // Execute the exact future staging READ ONLY query against this disposable
    // database. No hosted identities/credentials or Storage service involved.
    sql(
      "alter table auth.users add column is_anonymous boolean default false;",
    );
    const snapshotSql = fs.readFileSync(
      "scripts/reference-staging-snapshot.sql",
      "utf8",
    ).replaceAll("__TEST_OWNER__", owner).replaceAll(
      "__STAGING_REF__",
      "isolated-fixture-only",
    );
    const snapshot = JSON.parse(sql(snapshotSql).stdout);
    assert.equal(snapshot.operationsVersion, "reference-operations/v1");
    assert.equal(snapshot.serviceOnlyRPCs, true);
    assert.equal(snapshot.rlsEnabled, true);
    assert.equal(snapshot.clientTablesReadOnly, true);
    assert.equal(snapshot.auditPrivate, true);
    assert.equal(snapshot.testUserExists, true);
    const contract = "config/reference-staging-database-contract.json";
    if (process.env.REFERENCE_TEST_CONTRACT_OUTPUT) {
      fs.writeFileSync(
        process.env.REFERENCE_TEST_CONTRACT_OUTPUT,
        JSON.stringify(snapshot.definitionHashes, null, 2) + "\n",
      );
    }
    if (fs.existsSync(contract)) {
      assert.deepEqual(
        snapshot.definitionHashes,
        JSON.parse(fs.readFileSync(contract)),
        "Exact migration/RLS definitions match reviewed staging contract",
      );
    }
    const result = await Promise.all([
      parallel(claim(r1)),
      parallel(claim(r2)),
    ]);
    assert.deepEqual(result.map((v) => v.status).sort(), ["busy", "claimed"]);
    const r = result[0].status === "claimed" ? r1 : r2,
      loser = result[0].status === "claimed" ? r2 : r1;
    const same = JSON.parse(sql(claim(r)).stdout);
    assert.equal(same.status, "existing");
    assert.equal(
      sql(
        `select attempts_reserved from public.reference_generation_accounts where user_id='${r.ownerId}';`,
      ).stdout.trim(),
      "1",
    );
    const changed = structuredClone(r);
    changed.direction.instruction = "change request";
    assert.equal(JSON.parse(sql(claim(changed)).stdout).status, "conflict");
    assert.notEqual(
      sql(
        `set role authenticated;select public.claim_reference_generation('${owner}','${r1.id}','{}');`,
        true,
      ).status,
      0,
    );
    const own = sql(
      `begin;set local request.jwt.claim.sub='${r.ownerId}';set local role authenticated;select count(*) from public.reference_generations;rollback;`,
    ).stdout.trim();
    assert.equal(own, "1");
    const foreign = sql(
      `begin;set local request.jwt.claim.sub='${loser.ownerId}';set local role authenticated;select count(*) from public.reference_generations;rollback;`,
    ).stdout.trim();
    assert.equal(foreign, "0");
    sql(
      `create policy stray_reference_table on public.reference_generations for all to authenticated using(true) with check(true);grant insert,update,delete on public.reference_generations to authenticated;create policy stray_reference_storage on storage.objects for all to authenticated using(true) with check(true);`,
    );
    assert.notEqual(
      sql(
        `begin;set local request.jwt.claim.sub='${r.ownerId}';set local role authenticated;update public.reference_generations set status='failed' where id='${r.id}';rollback;`,
        true,
      ).status,
      0,
    );
    assert.notEqual(
      sql(
        `begin;set local request.jwt.claim.sub='${r.ownerId}';set local role authenticated;insert into storage.objects(bucket_id,name) values('reference-studio','${r.ownerId}/${r.id}/generated.png');rollback;`,
        true,
      ).status,
      0,
    );
    assert.notEqual(
      sql(
        `begin;set local request.jwt.claim.sub='${loser.ownerId}';set local role authenticated;insert into storage.objects(bucket_id,name) values('reference-studio','${r.ownerId}/${r.id}/source.png');rollback;`,
        true,
      ).status,
      0,
    );
    sql(
      `begin;set local request.jwt.claim.sub='${r.ownerId}';set local role authenticated;insert into storage.objects(bucket_id,name) values('reference-studio','${r.ownerId}/${r.id}/source.png');commit;`,
    );
    const unentitled = "10000000-0000-4000-8000-000000000003";
    sql(
      `insert into auth.users(id,email) values('${unentitled}','no-credit@example.invalid');`,
    );
    assert.notEqual(
      sql(
        `begin;set local request.jwt.claim.sub='${unentitled}';set local role authenticated;insert into storage.objects(bucket_id,name) values('reference-studio','${unentitled}/${r.id}/source.png');rollback;`,
        true,
      ).status,
      0,
      "an account without a separate allowance cannot upload studio sources",
    );
    sql(
      `set role service_role;select public.mark_reference_uncertain('${r.ownerId}','${r.id}');`,
    );
    assert.equal(JSON.parse(sql(claim(loser)).stdout).status, "busy");
    assert.equal(JSON.parse(sql(claim(r)).stdout).record.status, "uncertain");
    operations.cancelReserved(sql, r);
    const second = structuredClone(r);
    second.id = "30000000-0000-4000-8000-000000000001";
    second.source.path = `${r.ownerId}/${second.id}/source.png`;
    second.input.path = `${r.ownerId}/${second.id}/input.png`;
    assert.equal(JSON.parse(sql(claim(second)).stdout).status, "claimed");
    await operations.recoverDispatched(sql, parallel, second);
    const third = structuredClone(second);
    third.id = "30000000-0000-4000-8000-000000000002";
    assert.equal(JSON.parse(sql(claim(third)).stdout).status, "limit");
    assert.equal(
      sql("select sum(free_results_used) from public.usage_counters;").stdout
        .trim(),
      "0",
    );
    assert.equal(
      sql("select public from storage.buckets where id='reference-studio';")
        .stdout.trim(),
      "f",
    );
    console.log(
      "PASS: migration rerun; owner-only reads; restrictive write/storage guards; server-only RPCs; concurrent global reservation; idempotency; conflict; uncertain hold; explicit reconciliation; separate attempt limit; critique counters unchanged.",
    );
  } finally {
    if (started) docker(["rm", "-f", name], undefined, true);
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
