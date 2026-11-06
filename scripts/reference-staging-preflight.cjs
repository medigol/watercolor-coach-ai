// Default: offline/read-only. No deployment, SQL execution, credentials changes,
// image transmission or provider calls. Optional collection ONLY reads staging
// Auth + a fixed non-generating capabilities action after explicit authorisation.
const fs = require("node:fs"),
  path = require("node:path"),
  crypto = require("node:crypto"),
  { execFileSync } = require("node:child_process");
const root = path.resolve(__dirname, ".."),
  branch = "codex/photo-to-painting-reference-studio",
  model = "gpt-image-2-2026-04-21";
const canonical = (v) =>
  Array.isArray(v)
    ? v.map(canonical)
    : v && typeof v === "object"
    ? Object.fromEntries(Object.keys(v).sort().map((k) => [k, canonical(v[k])]))
    : v;
const sha = (v) =>
  crypto.createHash("sha256").update(
    typeof v === "string" || Buffer.isBuffer(v)
      ? v
      : JSON.stringify(canonical(v)) ?? "null",
  ).digest("hex");
const runtimeFiles = [
  "shared/referenceStudio.ts",
  "shared/referenceImage.ts",
  ...[
    "index.ts",
    "handler.ts",
    "provider.ts",
    "image.ts",
    "deno.json",
    "deno.lock",
  ].map((p) => "supabase/functions/transform-reference/" + p),
];
const migrationFiles = [
  "supabase/migrations/202611060001_reference_studio.sql",
  "supabase/migrations/202611060002_reference_operations.sql",
];
function profileChecks(p) {
  const missing = [];
  if (p?.schema !== "reference-staging-profile/v1") {
    missing.push("profile schema");
  }
  if (p?.expectedBranch !== branch) missing.push("expected branch");
  if (!/^[a-f0-9]{40}$/.test(p?.expectedCommit || "")) {
    missing.push("expected commit");
  }
  for (const k of ["productionSupabaseRef", "stagingSupabaseRef"]) {
    if (!/^[a-z0-9]{20}$/.test(p?.[k] || "")) missing.push(k);
  }
  if (p?.stagingSupabaseRef === p?.productionSupabaseRef) {
    missing.push("distinct staging project");
  }
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
      .test(p?.testOwnerId || "")
  ) missing.push("testOwnerId");
  try {
    const u = new URL(p?.stagingFrontendUrl);
    if (
      u.protocol !== "https:" || u.username || u.password || u.search ||
      u.hash || u.hostname === "medigol.github.io"
    ) throw Error();
  } catch {
    missing.push("non-production stagingFrontendUrl");
  }
  if (typeof p?.openAIProject !== "string" || !p.openAIProject.trim()) {
    missing.push("openAIProject");
  }
  if (p?.isolatedOpenAIProjectOrBudgetConfirmed !== true) {
    missing.push("isolated OpenAI project/budget confirmation");
  }
  if (!["disabled", "one-test"].includes(p?.phase)) missing.push("phase");
  return missing;
}
function evaluate(p, evidence = {}, local = {}, now = Date.now()) {
  const checks = [],
    add = (name, pass) =>
      checks.push({ name, result: pass ? "PASS" : "BLOCKED" });
  const missing = profileChecks(p);
  add("staging profile complete and production excluded", missing.length === 0);
  add(
    "branch, exact commit and clean worktree",
    local.branch === branch && local.commit === p.expectedCommit &&
      local.clean === true,
  );
  const db = evidence.database, fn = evidence.function;
  add(
    "fresh database evidence",
    db?.schema === "reference-staging-database/v1" &&
      db.stagingProjectRef === p.stagingSupabaseRef &&
      db.testOwnerId === p.testOwnerId &&
      now - Date.parse(db.observedAt) >= 0 &&
      now - Date.parse(db.observedAt) < 15 * 60 * 1000,
  );
  add(
    "migrations 001/002 and exact guarded definitions",
    db?.operationsVersion === "reference-operations/v1" &&
      !!local.databaseContract &&
      JSON.stringify(canonical(db?.definitionHashes)) ===
        JSON.stringify(canonical(local.databaseContract)),
  );
  add(
    "private storage and RLS",
    db?.bucket?.private === true && db.bucket.byteLimit === 10485760 &&
      JSON.stringify([...(db.bucket.mimeTypes || [])].sort()) ===
        JSON.stringify(["image/jpeg", "image/png"]) &&
      db.rlsEnabled === true && db.clientTablesReadOnly === true &&
      db.auditPrivate === true && db.serviceOnlyRPCs === true,
  );
  add("dedicated real test account", db?.testUserExists === true);
  add("global hold clear", db?.unresolved === 0);
  add(
    "fresh authenticated function contract",
    fn?.schema === "reference-staging-function/v1" &&
      fn.stagingProjectRef === p.stagingSupabaseRef &&
      fn.authOwnerMatched === true &&
      fn.capabilities?.ownerId === p.testOwnerId &&
      now - Date.parse(fn.observedAt) >= 0 &&
      now - Date.parse(fn.observedAt) < 15 * 60 * 1000,
  );
  const c = fn?.capabilities, r = c?.runtime;
  add(
    "required server environment by presence only",
    [
      "SUPABASE_URL",
      "SUPABASE_ANON_KEY",
      "SUPABASE_SERVICE_ROLE_KEY",
      "REFERENCE_STUDIO_RELEASE_SHA",
    ].every((name) => r?.environmentPresence?.[name] === true),
  );
  add(
    "pinned one-image function release",
    r?.contract === "reference-studio/staging-v1" &&
      r.release === p.expectedCommit && r.model === model && r.images === 1 &&
      r.quality === "medium" && r.format === "png" &&
      r.automaticRetries === false,
  );
  if (p.phase === "disabled") {
    add(
      "disabled by default and no enabled allowances",
      r?.configured === false && c.enabled === false && c.remaining === 0 &&
        r?.featureFlagEnabled === false && r?.budgetAcknowledged === false &&
        db?.enabledAccounts === 0 && db.nonzeroAllowances === 0,
    );
  } else {
    add(
      "exactly one remaining attempt, no other enabled account",
      [
        "REFERENCE_STUDIO_OPENAI_API_KEY",
        "REFERENCE_STUDIO_ENABLED",
        "REFERENCE_STUDIO_BUDGET_ACK",
        "REFERENCE_STUDIO_APPROVED_CONFIG_SHA256",
      ].every((name) => r?.environmentPresence?.[name] === true) &&
        r?.configured === true && c.enabled === true && c.remaining === 1 &&
        r?.featureFlagEnabled === true && r?.budgetAcknowledged === true &&
        db?.account?.enabled === true &&
        db.account.limit - db.account.reserved === 1 &&
        db.otherEnabledAccounts === 0,
    );
    const a = p.approval,
      cases = evidence.acceptance?.cases || [],
      item = cases.find((x) => x.caseId === a?.caseId);
    add(
      "recorded owner approval and case hash",
      a?.ownerApproved === true && !!item && item.sha256 === a.sourceSha256 &&
        item.directionSha256 === a.directionSha256,
    );
    const cfg = evidence.requestPlan?.configuration;
    add(
      "one pinned paid configuration",
      a?.images === 1 && a.model === model && a.quality === "medium" &&
        /^[a-f0-9]{64}$/.test(a?.configurationSha256 || "") &&
        /^[a-f0-9]{64}$/.test(a?.preparedInputSha256 || "") &&
        evidence.requestPlan?.schema === "reference-test-plan/v1" && !!cfg &&
        sha(cfg) === a?.configurationSha256 &&
        r?.approvedConfigurationSha256 === a?.configurationSha256 &&
        cfg.source?.sha256 === a?.sourceSha256 &&
        cfg.input?.sha256 === a?.preparedInputSha256 && cfg.model === model &&
        cfg.images === 1 && cfg.quality === "medium" && cfg.format === "png" &&
        cfg.ownerId === p.testOwnerId && cfg.parentId === null &&
        sha(cfg.direction) === a?.directionSha256 &&
        JSON.stringify(canonical(cfg.pixels)) ===
          JSON.stringify(canonical(item?.pixels)) &&
        cfg.source?.width === item?.selectedWidth &&
        cfg.source?.height === item?.selectedHeight &&
        cfg.source?.bytes === item?.bytes &&
        cfg.input?.width === item?.expectedPreparedDimensions?.width &&
        cfg.input?.height === item?.expectedPreparedDimensions?.height &&
        cfg.size ===
          `${item?.expectedOutputDimensions?.width}x${item?.expectedOutputDimensions?.height}`,
    );
    add(
      "funding, actual project access, consent, retention and operator",
      Number.isFinite(a?.maximumUSD) && a.maximumUSD > 0 &&
        typeof a.standardPricingBasis === "string" &&
        a.standardPricingBasis.trim().length > 10 &&
        a.projectModelEditAccessConfirmed === true &&
        a.transmissionConsent === true && a.retentionAcknowledged === true &&
        typeof a.operator === "string" && a.operator.trim().length > 0,
    );
    let outputCost = null;
    const rates = a?.standardRatesUSDPerMillion;
    try {
      if (
        rates && ["imageInput", "imageOutput", "textInput"].every((k) =>
          Number.isFinite(rates[k]) && rates[k] >= 0
        ) && rates.imageOutput > 0
      ) {
        const dims = cfg.size.split("x").map(Number);
        outputCost =
          require("./reference-cost-estimate.cjs").mediumOutputTokens(...dims) *
          rates.imageOutput / 1e6;
      }
    } catch {
      /* Invalid configuration/rates cannot produce a cost approval. */
    }
    add(
      "confirmed Standard rates, output floor funded and uncertain billing acknowledged",
      a?.standardPricingConfirmed === true &&
        a?.billingUncertaintyAcknowledged === true && outputCost !== null &&
        a.maximumUSD >= outputCost,
    );
    add(
      "within approved test window",
      now >= Date.parse(a?.windowStart) && now <= Date.parse(a?.windowEnd) &&
        Date.parse(a.windowEnd) > Date.parse(a.windowStart),
    );
  }
  return {
    verdict: checks.every((c) => c.result === "PASS")
      ? (p.phase === "disabled"
        ? "STAGING DISABLED PREFLIGHT PASS"
        : "READY FOR OWNER-AUTHORISED STAGING TEST")
      : "BLOCKED",
    mode: "offline evidence verification",
    checks,
    missing,
    liveProviderAccessVerified: false,
    providerRequests: 0,
    paidCalls: 0,
    hostedWrites: 0,
  };
}
async function collect(p, env = process.env, fetcher = fetch) {
  if (profileChecks(p).length || p.stagingReadAuthorised !== true) {
    throw Error("Explicit complete staging read authorisation required");
  }
  const key = env.REFERENCE_PREFLIGHT_STAGING_ANON_KEY,
    token = env.REFERENCE_PREFLIGHT_STAGING_USER_JWT;
  if (!key || !token) throw Error("Staging read credentials are missing");
  const origin = `https://${p.stagingSupabaseRef}.supabase.co`;
  async function read(url, init = {}) {
    const res = await fetcher(origin + url, {
      ...init,
      headers: {
        apikey: key,
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      redirect: "error",
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) throw Error("Staging read was not confirmed");
    const text = await res.text();
    if (text.length > 32000) throw Error("Unexpected staging response");
    return JSON.parse(text);
  }
  const user = await read("/auth/v1/user");
  if (user.id !== p.testOwnerId || user.is_anonymous) {
    throw Error("Staging account mismatch");
  }
  const raw = await read("/functions/v1/transform-reference", {
    method: "POST",
    body: JSON.stringify({ action: "capabilities" }),
  });
  // Persist only the allowlisted capability contract, never Auth/user payloads.
  return {
    schema: "reference-staging-function/v1",
    observedAt: new Date().toISOString(),
    stagingProjectRef: p.stagingSupabaseRef,
    authOwnerMatched: true,
    capabilities: {
      ownerId: raw.ownerId,
      enabled: raw.enabled,
      remaining: raw.remaining,
      runtime: raw.runtime
        ? {
          contract: raw.runtime.contract,
          release: raw.runtime.release,
          model: raw.runtime.model,
          images: raw.runtime.images,
          quality: raw.runtime.quality,
          format: raw.runtime.format,
          environmentPresence: Object.fromEntries(
            [
              "SUPABASE_URL",
              "SUPABASE_ANON_KEY",
              "SUPABASE_SERVICE_ROLE_KEY",
              "REFERENCE_STUDIO_OPENAI_API_KEY",
              "REFERENCE_STUDIO_ENABLED",
              "REFERENCE_STUDIO_BUDGET_ACK",
              "REFERENCE_STUDIO_APPROVED_CONFIG_SHA256",
              "REFERENCE_STUDIO_RELEASE_SHA",
            ].map(
              (
                name,
              ) => [name, raw.runtime.environmentPresence?.[name] === true],
            ),
          ),
          configured: raw.runtime.configured,
          featureFlagEnabled: raw.runtime.featureFlagEnabled,
          budgetAcknowledged: raw.runtime.budgetAcknowledged,
          automaticRetries: raw.runtime.automaticRetries,
          approvedConfigurationSha256: raw.runtime.approvedConfigurationSha256,
        }
        : null,
    },
  };
}
function prepare(out, p, local) {
  if (
    !out || path.resolve(out).startsWith(root + path.sep) ||
    path.resolve(out) === root
  ) throw Error("Choose an artifact directory outside the repository");
  if (
    fs.existsSync(out) &&
    (fs.lstatSync(out).isSymbolicLink() || fs.readdirSync(out).length)
  ) throw Error("Choose a new empty artifact directory");
  fs.mkdirSync(out, { recursive: true });
  const files = [...runtimeFiles, ...migrationFiles];
  for (const f of files) {
    const dest = path.join(out, f);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(path.join(root, f), dest);
  }
  let sql = fs.readFileSync(
    path.join(root, "scripts/reference-staging-snapshot.sql"),
    "utf8",
  );
  if (!profileChecks(p).length) {
    sql = sql.replaceAll("__STAGING_REF__", p.stagingSupabaseRef).replaceAll(
      "__TEST_OWNER__",
      p.testOwnerId,
    );
  }
  fs.writeFileSync(path.join(out, "read-only-snapshot.sql"), sql);
  fs.copyFileSync(
    path.join(root, "config/reference-staging.example.json"),
    path.join(out, "profile.example.json"),
  );
  const config =
    (profileChecks(p).length
      ? "# Fill an authorised staging profile before deployment.\n"
      : `project_id = "${p.stagingSupabaseRef}"\n`) +
    "[functions.transform-reference]\nverify_jwt = false\n";
  fs.writeFileSync(path.join(out, "supabase/config.toml"), config);
  const manifest = {
    schema: "reference-staging-artifact/v1",
    branch: local.branch,
    commit: local.commit,
    clean: local.clean,
    reviewOnly: !local.clean || !!profileChecks(p).length,
    onlyFunctionToDeploy: "transform-reference",
    model,
    enabledByDefault: false,
    deploymentsPerformed: 0,
    generatedConfigSha256: sha(config),
    files: files.map((f) => ({
      path: f,
      sha256: sha(fs.readFileSync(path.join(root, f))),
    })),
  };
  fs.writeFileSync(
    path.join(out, "artifact.json"),
    JSON.stringify(manifest, null, 2) + "\n",
  );
  return manifest;
}
async function main(args) {
  const opt = {};
  for (let i = 0; i < args.length; i += 2) {
    if (
      ![
        "--profile",
        "--database",
        "--function",
        "--plan",
        "--prepare",
        "--collect-read-only",
      ].includes(args[i]) || !args[i + 1] || opt[args[i]]
    ) throw Error("Use documented named option/value pairs");
    opt[args[i]] = args[i + 1];
  }
  const read = (f) => JSON.parse(fs.readFileSync(f, "utf8"));
  const p = read(
    opt["--profile"] ||
      path.join(root, "config/reference-staging.example.json"),
  );
  const git = (...a) =>
    execFileSync("git", a, { cwd: root, encoding: "utf8" }).trim();
  const local = {
    branch: git("branch", "--show-current"),
    commit: git("rev-parse", "HEAD"),
    clean: git("status", "--porcelain").length === 0,
    databaseContract: fs.existsSync(
        path.join(root, "config/reference-staging-database-contract.json"),
      )
      ? read(
        path.join(root, "config/reference-staging-database-contract.json"),
      )
      : null,
  };
  if (opt["--prepare"]) {
    prepare(opt["--prepare"], p, local);
    console.log(
      JSON.stringify({
        artifactPrepared: true,
        commit: local.commit,
        clean: local.clean,
        deploymentsPerformed: 0,
        providerRequests: 0,
      }),
    );
    return;
  }
  if (opt["--collect-read-only"]) {
    const result = await collect(p);
    fs.writeFileSync(
      opt["--collect-read-only"],
      JSON.stringify(result, null, 2) + "\n",
    );
    console.log(
      JSON.stringify({
        stagingReadCompleted: true,
        providerRequests: 0,
        hostedWrites: 0,
      }),
    );
    return;
  }
  const report = evaluate(p, {
    database: opt["--database"] ? read(opt["--database"]) : null,
    function: opt["--function"] ? read(opt["--function"]) : null,
    requestPlan: opt["--plan"] ? read(opt["--plan"]) : null,
    acceptance: read(
      path.join(root, "docs/review/photo-reference-studio-acceptance-set.json"),
    ),
  }, local);
  report.environmentPresence = {
    REFERENCE_PREFLIGHT_STAGING_ANON_KEY: !!process.env
      .REFERENCE_PREFLIGHT_STAGING_ANON_KEY,
    REFERENCE_PREFLIGHT_STAGING_USER_JWT: !!process.env
      .REFERENCE_PREFLIGHT_STAGING_USER_JWT,
  };
  console.log(JSON.stringify(report, null, 2));
  if (report.verdict === "BLOCKED") process.exitCode = 2;
}
module.exports = { profileChecks, evaluate, collect, prepare, sha, canonical };
if (require.main === module) {
  main(process.argv.slice(2)).catch(() => {
    console.error(
      "Preflight stopped. Check the local profile/evidence and documented staging permissions; no generation or hosted write was made.",
    );
    process.exitCode = 2;
  });
}
