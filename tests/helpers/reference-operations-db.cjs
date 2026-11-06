// Real PostgreSQL cases, synthetic IDs/metadata only; never provider results.
const assert = require("node:assert/strict"), crypto = require("node:crypto");
const load = require("./reference-loader.cjs"),
  { request } = require("./reference-fixture.cjs");
const studio = load("shared/referenceStudio.ts");
const quote = (s) => "'" + s.replaceAll("'", "''") + "'";
const row = (sql, r) =>
  JSON.parse(
    sql(
      `select row_to_json(r) from public.reference_generations r where id='${r.id}';`,
    ).stdout.trim(),
  );
function reconcile(
  sql,
  r,
  resolution,
  {
    drained = false,
    terminal = false,
    metadata = null,
    operation = crypto.randomUUID(),
    snapshot = row(sql, r),
  } = {},
) {
  const payload = [
    r.ownerId,
    r.id,
    operation,
    snapshot.status,
    snapshot.dispatch_phase,
    snapshot.updated_at,
    resolution,
    "isolated-test-operator",
    "Isolated fixture verified; no provider was called",
    drained,
    terminal,
    metadata,
  ];
  const values = payload.map((v) =>
    v === null
      ? "null"
      : typeof v === "boolean"
      ? String(v)
      : typeof v === "object"
      ? quote(JSON.stringify(v)) + "::jsonb"
      : quote(v)
  );
  return `set role service_role;select public.reconcile_reference_generation(${
    values.join(",")
  });`;
}
function metadata(r) {
  const [width, height] = studio.outputSize(r).split("x").map(Number);
  return {
    width,
    height,
    bytes: 100,
    sha256: "a".repeat(64),
    model: studio.referenceModel,
  };
}
exports.prepare = (sql) => {
  const r = request();
  r.id = "40000000-0000-4000-8000-000000000001";
  r.ownerId = "10000000-0000-4000-8000-000000000009";
  r.source.path = `${r.ownerId}/${r.id}/source.png`;
  r.input.path = `${r.ownerId}/${r.id}/input.png`;
  sql(
    `insert into auth.users(id,email) values('${r.ownerId}','legacy-fixture@example.invalid');insert into public.reference_generation_accounts(user_id,enabled,attempt_limit) values('${r.ownerId}',true,1);set role service_role;select public.claim_reference_generation('${r.ownerId}','${r.id}',${
      quote(JSON.stringify(r))
    }::jsonb);`,
  );
  // Demonstrate the original WITH CHECK/DELETE gap before installing the fix.
  const deleted = sql(
    `begin;grant delete on public.reference_generations to authenticated;create policy repro_delete on public.reference_generations for all to authenticated using(true) with check(true);set local request.jwt.claim.sub='${r.ownerId}';set local role authenticated;delete from public.reference_generations where id='${r.id}' returning id;rollback;`,
  ).stdout.trim();
  assert.equal(deleted, r.id);
  // PostgreSQL accepts UNKNOWN in CHECK; old completed-path check allowed NULL.
  const missingPath = sql(
    `begin;update public.reference_generations set status='completed',output_metadata='{"model":"gpt-image-2-2026-04-21"}' where id='${r.id}' returning (output_path is null);rollback;`,
  ).stdout.trim();
  assert.equal(missingPath, "t");
  sql(
    `update public.reference_generations set created_at='2020-01-01' where id='${r.id}';`,
  );
  console.log(
    "REPRODUCED original defects in rolled-back local transactions: future client DELETE and completed NULL output path",
  );
  return r;
};
exports.upgrade = (sql, r) => {
  const functions = [
    "claim_reference_generation",
    "complete_reference_generation",
    "mark_reference_uncertain",
    "begin_reference_dispatch",
    "note_reference_provider_receipt",
    "reconcile_reference_generation",
    "reference_operations_version",
    "valid_reference_output",
  ];
  for (const name of functions) {
    const grants = JSON.parse(
      sql(
        `select json_build_object('anon',has_function_privilege('anon',p.oid,'EXECUTE'),'authenticated',has_function_privilege('authenticated',p.oid,'EXECUTE'),'service',has_function_privilege('service_role',p.oid,'EXECUTE')) from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='${name}';`,
      ).stdout,
    );
    assert.deepEqual(grants, {
      anon: false,
      authenticated: false,
      service: true,
    }, name);
  }
  assert.equal(
    sql("set role service_role;select public.reference_operations_version();")
      .stdout.trim(),
    "reference-operations/v1",
  );
  const current = row(sql, r);
  assert.equal(current.dispatch_phase, "dispatched");
  assert(current.dispatched_at.startsWith("2020-01-01"));
  assert.notEqual(
    sql(reconcile(sql, r, "failed", { drained: true, terminal: false }), true)
      .status,
    0,
    "age/worker drain cannot establish provider terminal state",
  );
  sql(reconcile(sql, r, "failed", { drained: true, terminal: true }));
  assert.equal(row(sql, r).status, "failed");
  assert.equal(
    sql(
      `select attempts_reserved from public.reference_generation_accounts where user_id='${r.ownerId}';`,
    ).stdout.trim(),
    "1",
  );
};
exports.cancelReserved = (sql, r) => {
  const before = row(sql, r);
  assert.equal(before.dispatch_phase, "reserved");
  assert.notEqual(sql(reconcile(sql, r, "failed"), true).status, 0);
  sql(reconcile(sql, r, "failed", { drained: true }));
  assert.equal(
    sql(
      `set role service_role;select public.begin_reference_dispatch('${r.ownerId}','${r.id}',${
        quote(JSON.stringify(r))
      }::jsonb);`,
    ).stdout.trim(),
    "f",
  );
  // Restrictive DELETE must hold even when this test deliberately grants it.
  sql(
    "grant delete on public.reference_generation_accounts to authenticated;create policy stray_account_delete on public.reference_generation_accounts for all to authenticated using(true) with check(true);",
  );
  for (
    const table of ["reference_generations", "reference_generation_accounts"]
  ) {
    const field = table === "reference_generations" ? "id" : "user_id",
      id = table === "reference_generations" ? r.id : r.ownerId;
    assert.equal(
      sql(
        `begin;set local request.jwt.claim.sub='${r.ownerId}';set local role authenticated;delete from public.${table} where ${field}='${id}' returning ${field};rollback;`,
      ).stdout.trim(),
      "",
    );
  }
  const call = reconcile(sql, r, "uncertain");
  assert.notEqual(
    sql(call.replace("set role service_role", "set role authenticated"), true)
      .status,
    0,
  );
};
exports.recoverDispatched = async (sql, parallel, r) => {
  const meta = metadata(r), json = quote(JSON.stringify(meta));
  assert.notEqual(
    sql(
      `set role service_role;select public.complete_reference_generation('${r.ownerId}','${r.id}',${json});`,
      true,
    ).status,
    0,
    "cannot complete before one-time dispatch",
  );
  const gate =
    `set role service_role;select to_json(public.begin_reference_dispatch('${r.ownerId}','${r.id}',${
      quote(JSON.stringify(r))
    }::jsonb));`;
  assert.deepEqual(
    (await Promise.all([parallel(gate), parallel(gate)])).sort(),
    [false, true],
  );
  sql(
    `set role service_role;select public.note_reference_provider_receipt('${r.ownerId}','${r.id}','req_isolated_fixture',200,'{"imageInputTokens":1000,"outputTokens":1200}');select public.mark_reference_uncertain('${r.ownerId}','${r.id}');`,
  );
  assert.equal(row(sql, r).provider_request_id, "req_isolated_fixture");
  assert.notEqual(
    sql(
      `set role service_role;select public.note_reference_provider_receipt('${r.ownerId}','${r.id}','Bearer secret',200,null);`,
      true,
    ).status,
    0,
  );
  assert.notEqual(
    sql(reconcile(sql, r, "failed", { drained: true }), true).status,
    0,
    "unknown dispatched job stays held",
  );
  assert.notEqual(
    sql(
      reconcile(sql, r, "completed", {
        drained: true,
        terminal: true,
        metadata: meta,
      }),
      true,
    ).status,
    0,
    "metadata alone is not a stored output",
  );
  sql(
    `insert into storage.objects(bucket_id,name) values('reference-studio','${r.ownerId}/${r.id}/generated.png');`,
  );
  const snapshot = row(sql, r);
  assert.notEqual(
    sql(
      reconcile(sql, r, "completed", {
        drained: false,
        terminal: true,
        metadata: meta,
      }),
      true,
    ).status,
    0,
  );
  for (
    const invalid of [
      { ...meta, width: 1024 },
      { ...meta, sha256: "bad" },
      { ...meta, bytes: 0 },
      { ...meta, bytes: "100" },
      { ...meta, extra: "invented" },
    ]
  ) {
    assert.notEqual(
      sql(
        reconcile(sql, r, "completed", {
          drained: true,
          terminal: true,
          metadata: invalid,
        }),
        true,
      ).status,
      0,
    );
  }
  const command = reconcile(sql, r, "completed", {
    drained: true,
    terminal: true,
    metadata: meta,
    snapshot,
  });
  const first = JSON.parse(sql(command).stdout);
  assert.equal(first.status, "completed");
  assert.deepEqual(
    JSON.parse(sql(command).stdout),
    first,
    "same operator operation is idempotent",
  );
  assert.notEqual(
    sql(
      reconcile(sql, r, "failed", { drained: true, terminal: true, snapshot }),
      true,
    ).status,
    0,
    "stale operator snapshot cannot overwrite completed result",
  );
  assert.notEqual(
    sql(
      `update public.reference_generations set output_path=null where id='${r.id}';`,
      true,
    ).status,
    0,
    "NULL CHECK hole closed",
  );
  assert.notEqual(
    sql(
      `set role authenticated;select count(*) from public.reference_generation_reconciliations;`,
      true,
    ).status,
    0,
    "operator evidence is not client-readable",
  );
  for (
    const [width, height] of [
      [320, 240],
      [240, 320],
      [1536, 520],
      [1536, 512],
      [512, 1536],
      [500, 500],
    ]
  ) {
    const req = structuredClone(r);
    req.input.width = width;
    req.input.height = height;
    assert.equal(
      sql(
        `set role service_role;select public.valid_reference_output(${
          quote(JSON.stringify(req))
        }::jsonb,${quote(JSON.stringify(metadata(req)))}::jsonb);`,
      ).stdout.trim(),
      "t",
      "SQL and JS output grid agree",
    );
  }
  console.log(
    "PASS: legacy quarantine, dispatch gate concurrency, cancellation, safe audited recovery, immutable holds, replay/CAS, output integrity, receipt privacy and no client deletion",
  );
};
