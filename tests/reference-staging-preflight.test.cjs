const test = require("node:test"),
  assert = require("node:assert/strict"),
  fs = require("node:fs");
const { evaluate, collect, profileChecks, sha } = require(
  "../scripts/reference-staging-preflight.cjs",
);
const studio = require("./helpers/reference-loader.cjs")(
  "shared/referenceStudio.ts",
);
const owner = "10000000-0000-4000-8000-000000000001",
  commit = "a".repeat(40),
  now = Date.now();
function fixture() {
  const p = {
    ...JSON.parse(fs.readFileSync("config/reference-staging.example.json")),
    expectedCommit: commit,
    productionSupabaseRef: "p".repeat(20),
    stagingSupabaseRef: "s".repeat(20),
    stagingFrontendUrl: "https://staging-fixture.example.invalid",
    testOwnerId: owner,
    openAIProject: "synthetic-project-not-real",
    isolatedOpenAIProjectOrBudgetConfirmed: true,
    stagingReadAuthorised: true,
  };
  const contract = JSON.parse(
    fs.readFileSync("config/reference-staging-database-contract.json"),
  );
  const database = {
    schema: "reference-staging-database/v1",
    observedAt: new Date(now).toISOString(),
    stagingProjectRef: p.stagingSupabaseRef,
    testOwnerId: owner,
    operationsVersion: "reference-operations/v1",
    definitionHashes: structuredClone(contract),
    testUserExists: true,
    bucket: {
      private: true,
      byteLimit: 10485760,
      mimeTypes: ["image/png", "image/jpeg"],
    },
    rlsEnabled: true,
    clientTablesReadOnly: true,
    auditPrivate: true,
    serviceOnlyRPCs: true,
    unresolved: 0,
    enabledAccounts: 0,
    nonzeroAllowances: 0,
    otherEnabledAccounts: 0,
    account: null,
  };
  const func = {
    schema: "reference-staging-function/v1",
    observedAt: new Date(now).toISOString(),
    stagingProjectRef: p.stagingSupabaseRef,
    authOwnerMatched: true,
    capabilities: {
      ownerId: owner,
      enabled: false,
      remaining: 0,
      runtime: {
        contract: "reference-studio/staging-v1",
        environmentPresence: Object.fromEntries(
          [
            "SUPABASE_URL",
            "SUPABASE_ANON_KEY",
            "SUPABASE_SERVICE_ROLE_KEY",
            "REFERENCE_STUDIO_RELEASE_SHA",
            "REFERENCE_STUDIO_OPENAI_API_KEY",
            "REFERENCE_STUDIO_ENABLED",
            "REFERENCE_STUDIO_BUDGET_ACK",
            "REFERENCE_STUDIO_APPROVED_CONFIG_SHA256",
          ].map((k) => [k, true]),
        ),
        release: commit,
        model: "gpt-image-2-2026-04-21",
        images: 1,
        quality: "medium",
        format: "png",
        configured: false,
        featureFlagEnabled: false,
        budgetAcknowledged: false,
        automaticRetries: false,
        approvedConfigurationSha256: null,
      },
    },
  };
  return {
    p,
    e: { database, function: func },
    local: {
      branch: p.expectedBranch,
      commit,
      clean: true,
      databaseContract: contract,
    },
  };
}
test("default staging profile blocks with real identifiers/permissions absent", () => {
  const p = JSON.parse(
    fs.readFileSync("config/reference-staging.example.json"),
  );
  assert(profileChecks(p).includes("stagingSupabaseRef"));
  assert.equal(p.stagingReadAuthorised, false);
  assert.equal(evaluate(p).verdict, "BLOCKED");
});
test("complete disabled fixture verifies versions, private storage and zero allowances without generation", () => {
  const f = fixture(), r = evaluate(f.p, f.e, f.local, now);
  assert.equal(r.verdict, "STAGING DISABLED PREFLIGHT PASS");
  assert.equal(r.providerRequests + r.hostedWrites, 0);
});
test("wrong project/release, stale evidence, dirty checkout, weak RLS, global holds and enabled defaults block", () => {
  for (
    const change of [
      (f) => f.p.stagingSupabaseRef = f.p.productionSupabaseRef,
      (f) => f.e.function.capabilities.runtime.release = "b".repeat(40),
      (f) => f.e.database.observedAt = new Date(now - 16 * 60000).toISOString(),
      (f) => f.local.clean = false,
      (f) => f.e.database.rlsEnabled = false,
      (f) => f.e.database.serviceOnlyRPCs = false,
      (f) => f.e.database.unresolved = 1,
      (f) => f.e.database.enabledAccounts = 1,
      (f) =>
        f.e.database.definitionHashes.functions.begin_reference_dispatch =
          "drift",
    ]
  ) {
    const f = fixture();
    change(f);
    assert.equal(evaluate(f.p, f.e, f.local, now).verdict, "BLOCKED");
  }
});
test("one-test preflight requires exact owner/source/direction/config pin, budget, consent, operator and window", () => {
  const f = fixture(),
    c = JSON.parse(
      fs.readFileSync(
        "docs/review/photo-reference-studio-acceptance-set.json",
      ),
    ).cases[0];
  const identity = (x) => ({ path: "", ...x });
  const plan = studio.referenceTestPlan({
    ownerId: owner,
    parentId: null,
    source: identity({
      sha256: c.sha256,
      width: c.selectedWidth,
      height: c.selectedHeight,
      bytes: c.bytes,
    }),
    input: identity({
      sha256: "b".repeat(64),
      ...c.expectedPreparedDimensions,
      bytes: 20000,
    }),
    direction: c.direction,
    pixels: c.pixels,
  });
  f.p.phase = "one-test";
  f.e.acceptance = { cases: [c] };
  f.e.requestPlan = plan;
  Object.assign(f.e.database, {
    account: { enabled: true, limit: 1, reserved: 0 },
    enabledAccounts: 1,
    nonzeroAllowances: 1,
  });
  Object.assign(f.e.function.capabilities, { enabled: true, remaining: 1 });
  Object.assign(f.e.function.capabilities.runtime, {
    configured: true,
    featureFlagEnabled: true,
    budgetAcknowledged: true,
    approvedConfigurationSha256: sha(plan.configuration),
  });
  f.p.approval = {
    ownerApproved: true,
    caseId: c.caseId,
    sourceSha256: c.sha256,
    directionSha256: c.directionSha256,
    configurationSha256: sha(plan.configuration),
    preparedInputSha256: plan.configuration.input.sha256,
    model: plan.configuration.model,
    images: 1,
    quality: "medium",
    maximumUSD: 1,
    standardPricingBasis: "Synthetic test-only price acknowledgement",
    standardPricingConfirmed: true,
    standardRatesUSDPerMillion: {
      imageInput: 8,
      imageOutput: 30,
      textInput: 5,
    },
    billingUncertaintyAcknowledged: true,
    projectModelEditAccessConfirmed: true,
    transmissionConsent: true,
    retentionAcknowledged: true,
    operator: "fixture-only",
    windowStart: new Date(now - 1000).toISOString(),
    windowEnd: new Date(now + 1000).toISOString(),
  };
  assert.equal(
    evaluate(f.p, f.e, f.local, now).verdict,
    "READY FOR OWNER-AUTHORISED STAGING TEST",
  );
  for (
    const key of [
      "ownerApproved",
      "transmissionConsent",
      "retentionAcknowledged",
      "projectModelEditAccessConfirmed",
      "standardPricingConfirmed",
      "billingUncertaintyAcknowledged",
    ]
  ) {
    const x = structuredClone(f);
    x.p.approval[key] = false;
    assert.equal(evaluate(x.p, x.e, x.local, now).verdict, "BLOCKED");
  }
  for (
    const change of [
      (x) => x.p.approval.maximumUSD = null,
      (x) => x.p.approval.maximumUSD = 0.000001,
      (x) => x.p.approval.standardRatesUSDPerMillion.imageOutput = null,
      (x) => x.p.approval.operator = null,
      (x) =>
        x.e.function.capabilities.runtime.approvedConfigurationSha256 = null,
      (x) => x.e.requestPlan.configuration.direction.strength = "creative",
      (x) => x.e.database.account.limit = 2,
      (x) => x.e.database.otherEnabledAccounts = 1,
    ]
  ) {
    const x = structuredClone(f);
    change(x);
    assert.equal(evaluate(x.p, x.e, x.local, now).verdict, "BLOCKED");
  }
  assert.equal(evaluate(f.p, f.e, f.local, now + 2000).verdict, "BLOCKED");
});
test("read-only collector requires explicit authorisation and binds reads to staging, never provider", async () => {
  const f = fixture(), calls = [];
  const env = {
    REFERENCE_PREFLIGHT_STAGING_ANON_KEY: "private-fixture-key",
    REFERENCE_PREFLIGHT_STAGING_USER_JWT: "private-fixture-token",
  };
  const fetcher = async (u, init) => {
    calls.push({ u, init });
    assert.equal(new URL(u).hostname, f.p.stagingSupabaseRef + ".supabase.co");
    return new Response(
      JSON.stringify(
        u.endsWith("/user")
          ? { id: owner, is_anonymous: false, email: "private-fixture-email" }
          : {
            ...f.e.function.capabilities,
            untrusted: "private-response-extra",
          },
      ),
    );
  };
  const report = await collect(f.p, env, fetcher);
  assert.equal(calls.length, 2);
  assert.deepEqual(JSON.parse(calls[1].init.body), { action: "capabilities" });
  assert.equal(calls[0].init.redirect, "error");
  assert(!JSON.stringify(report).includes("private-"));
  f.p.stagingReadAuthorised = false;
  await assert.rejects(collect(f.p, env, fetcher));
  assert.equal(calls.length, 2);
});
test("read-only collector does not retry HTTP failure, redirects or mismatched identity", async () => {
  const f = fixture(),
    env = {
      REFERENCE_PREFLIGHT_STAGING_ANON_KEY: "fixture",
      REFERENCE_PREFLIGHT_STAGING_USER_JWT: "fixture",
    };
  let calls = 0;
  await assert.rejects(collect(f.p, env, async () => {
    calls++;
    return new Response("private SQL or network error", { status: 503 });
  }));
  assert.equal(calls, 1);
  await assert.rejects(
    collect(
      f.p,
      env,
      async () => new Response(JSON.stringify({ id: "different-owner" })),
    ),
  );
});
