// Optional browser verification: provide Playwright on NODE_PATH; no production dependency.
const pathModule = require("node:path");
const root = pathModule.resolve(__dirname, "../..");
const artifactDir = pathModule.resolve(
  process.argv[3] || "/tmp/watercolor-professional-preview",
);
require("node:fs").mkdirSync(artifactDir, { recursive: true });
const originalFixture = require(root + "/tests/helpers/canonical-fixture.cjs");
const colourFixture = require(root + "/tests/helpers/colour-fixture.cjs");
const canonicalFixture = () => {
  const r = originalFixture();
  r.canonicalAnalysis.colourAnalysis = colourFixture();
  r.expertViews.overall.practice =
    "On scrap, paint three tower silhouettes against a soft wash. Keep one edge crisp. Compare which version holds the light most clearly at arm’s length.";
  return r;
};
function finalFreezeFixFixture(kind) {
  const result = canonicalFixture(),
    c = result.canonicalAnalysis;
  c.qualityAssessment = {
    level: "competent",
    confidence: 0.88,
    rationale:
      kind === "uncertain"
        ? "The hierarchy seems clear, with possibly balanced light."
        : "Clear hierarchy and coherent values give the scene readable depth.",
  };
  const road = c.visualRoles.find((r) => r.id === "water");
  road.area = "foreground road";
  const active = kind === "active";
  c.facts.push({
    id: "road-role",
    domain: "composition",
    roleId: road.id,
    observation: active
      ? "The foreground road forms a strong directional lead-in and major foreground value mass."
      : "The foreground road is a low-contrast, low-information subordinate passage.",
  });
  c.insights.push({
    id: "road-role-strength",
    domain: "composition",
    classification: "strength",
    factIds: ["road-role"],
    lesson: active
      ? "The road connects the foreground to the tower."
      : "The sparse road marks create an uncluttered interval in the foreground.",
    action: active
      ? "Preserve the road's directional relationship."
      : "Preserve the sparse road marks.",
  });
  c.visualEvidence.push({
    insightId: "road-role-strength",
    roleId: road.id,
    note: {
      ...structuredClone(c.visualEvidence[0].note),
      id: "quiet-road-note",
      label: "Quiet road passage",
      shortInstruction: "Observe this Quiet road passage.",
      type: "region_highlight",
      visualRole: "quiet",
      region: structuredClone(road.region),
      x: road.region.x * 100,
      y: road.region.y * 100,
      width: road.region.width * 100,
      height: road.region.height * 100,
    },
  });
  c.facts.find((f) => f.id === "edges").observation =
    "Dry-brush texture surrounds wet blending beside the tower; edge variation technique creates edge control.";
  Object.assign(
    c.insights.find((i) => i.id === "handling"),
    {
      lesson: "Dry brush texture and wet blending give the scene varied edges.",
      action: "Maintain this edge control around the tower.",
    },
  );
  result.expertViews.overall.practice =
    "On a separate small study, paint horizontal colour bands varying only value contrast; compare spatial depth with softer edges.";
  return result;
}
// Sanitized live-output text over original technical assets. These fixtures
// exercise presentation consistency, not another assessment of image pixels.
function liveFreezeFixture(kind) {
  const value = canonicalFixture(),
    c = value.canonicalAnalysis;
  c.qualityAssessment = {
    level: "competent",
    confidence: 0.88,
    rationale:
      "Clear focal hierarchy, coherent values and balanced light give the scene readable depth.",
  };
  c.colourAnalysis.visibleColours = [
    {
      label: "Reserved warm light",
      approximateHex: "#e5c58c",
      roleId: "tower",
    },
    { label: "Muted blue-grey", approximateHex: "#819395", roleId: null },
    { label: "Soft ochre", approximateHex: "#c2a878", roleId: null },
  ];
  const noteFor = (insightId, id, label, roleId = "tower") => ({
    insightId,
    roleId,
    note: {
      ...structuredClone(c.visualEvidence[0].note),
      id,
      label,
      type: "region_highlight",
      category: "edge_control",
      scope: "multi_region",
      region: null,
      regions: [
        structuredClone(c.visualRoles[0].region),
        structuredClone(c.visualRoles[1].region),
      ],
      shortInstruction: label,
    },
  });
  if (kind === "church") {
    c.facts.push({
      id: "wire-evidence",
      domain: "technique",
      roleId: "tower",
      observation:
        "The upper-left wires have sharper edge contrast than the tower silhouette and compete with its focal separation.",
    });
    c.insights.push(
      {
        id: "wire-quiet",
        domain: "technique",
        classification: "optional_refinement",
        factIds: ["wire-evidence"],
        lesson:
          "Some upper-left wires compete with the tower silhouette and weaken focal separation.",
        action:
          "In a separate study, simplify some upper-left wires to reduce competition with the tower.",
      },
      {
        id: "wire-soften",
        domain: "technique",
        classification: "optional_refinement",
        factIds: ["wire-evidence"],
        lesson:
          "Selected upper-left wire edges compete with the tower silhouette.",
        action:
          "In a separate study, soften selected upper-left wire edges so the tower silhouette remains dominant.",
      },
      {
        id: "unsupported-base",
        domain: "overall",
        classification: "optional_refinement",
        factIds: ["hierarchy"],
        lesson:
          "The tower's base and surrounding shadows feel compressed, limiting spatial depth.",
        action:
          "In a separate study, simplify shadow masses at the tower base to improve depth.",
      },
    );
    c.visualEvidence = [
      noteFor("wire-quiet", "wire-quiet-note", "Related passages"),
      noteFor("wire-soften", "wire-soften-note", "Related passages"),
      noteFor(
        "unsupported-base",
        "unsupported-base-note",
        "Unsupported base-shadow claim",
      ),
    ];
  } else if (kind === "van") {
    c.visualRoles[0].area = "van";
    c.visualRoles[0].region = { x: 0.44, y: 0.4, width: 0.12, height: 0.2 };
    Object.assign(c.composition.primary, {
      type: "off_centre",
      focalPoint: { x: 0.5, y: 0.5 },
      shortExplanation:
        "Off-centre focus; van centrally placed against the mountain.",
    });
    c.composition.observation =
      "Central vertical focus; van centrally placed against the mountain.";
    c.qualityAssessment.rationale =
      "Clear value grouping supports focal separation. Perspective and value transitions need refinement for depth.";
    c.facts[0].observation =
      "The warm van stands apart from the cooler quiet mountain.";
    c.facts.push(
      {
        id: "mountain-values",
        domain: "colour_value",
        roleId: "bank",
        observation:
          "The mountain's internal dark values compete with the van and flatten depth.",
      },
      {
        id: "road-values",
        domain: "composition",
        roleId: "bank",
        observation:
          "The near foreground road has abrupt value transitions and weak taper toward the distant van, flattening recession.",
      },
    );
    c.insights.push(
      {
        id: "mountain-grouping",
        domain: "colour_value",
        classification: "clear_issue",
        factIds: ["mountain-values"],
        lesson:
          "The mountain's internal dark values compete with the van and flatten spatial depth.",
        action:
          "On a separate study, compress mountain internal values into a narrower middle-value range; compare van separation without losing mountain scale.",
      },
      {
        id: "unsafe-road",
        domain: "composition",
        classification: "optional_refinement",
        factIds: ["road-values"],
        lesson:
          "Abrupt foreground road values weaken recession toward the van.",
        action:
          "Introduce more value contrast and subtle chroma shifts in road and foreground to enhance depth.",
      },
    );
    c.visualEvidence = [
      noteFor(
        "mountain-grouping",
        "mountain-grouping-note",
        "Mountain / focal vehicle",
        "bank",
      ),
      noteFor(
        "unsafe-road",
        "unsafe-road-note",
        "Unsafe road amplification",
        "bank",
      ),
    ];
  } else {
    c.visualRoles[0].area = "boat";
    c.visualRoles[0].region = { x: 0.72, y: 0.66, width: 0.18, height: 0.2 };
    Object.assign(c.composition.primary, {
      type: "off_centre",
      focalPoint: { x: 0.81, y: 0.76 },
      shortExplanation:
        "Central boat focal point within broad horizontal bands.",
    });
    c.composition.observation =
      "A central boat focal point sits within horizontal colour bands.";
    c.facts[0].observation =
      "Broad horizontal colour bands frame a lower-right boat with darker contours against soft background passages.";
    c.facts[1].observation =
      "The boat sits lower-right among broad horizontal bands.";
    c.facts[3].observation =
      "The boat is painted with more defined brush strokes against soft horizontal background bands.";
    Object.assign(c.insights[0], {
      lesson:
        "Horizontal bands and boat placement give the scene a calm rhythm.",
      action: "Preserve the calm spacing of the bands around the boat.",
    });
    Object.assign(c.insights[1], {
      lesson:
        "Boat placement within horizontal bands maintains the calm rhythm.",
      action: "Keep the bands calm around the boat.",
    });
    c.insights[3].lesson =
      "Combining loose washes for background with sharper brushwork gives focal separation.";
    c.insights.push({
      id: "unsupported-soften",
      domain: "technique",
      classification: "optional_refinement",
      factIds: ["edges"],
      lesson: "The soft background edges could be softer.",
      action: "Soften the background edges further.",
    });
    c.visualEvidence = [
      noteFor(
        "unsupported-soften",
        "unsupported-soften-note",
        "Unsupported extra softness",
      ),
    ];
  }
  return value;
}
const { chromium } = require("playwright");
const assert = require("node:assert/strict"),
  fs = require("node:fs");
const ts = require("typescript");
const samples = {};
new Function(
  "exports",
  ts.transpileModule(fs.readFileSync(root + "/data/mockResults.ts", "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText,
)(samples);
const uid = "10000000-0000-4000-8000-000000000001";
const user = {
  id: uid,
  aud: "authenticated",
  role: "authenticated",
  email: "learner@example.invalid",
  email_confirmed_at: new Date().toISOString(),
  app_metadata: { provider: "email", providers: ["email"] },
  user_metadata: { display_name: "Learner" },
  created_at: new Date().toISOString(),
};
const token = [
  { alg: "HS256", typ: "JWT" },
  {
    sub: uid,
    aud: "authenticated",
    role: "authenticated",
    exp: Math.floor(Date.now() / 1000) + 3600,
  },
  "signature",
]
  .map((v, i) =>
    i < 2 ? Buffer.from(JSON.stringify(v)).toString("base64url") : v,
  )
  .join(".");
let debugPage;
let imageFile = artifactDir + "/technical-scene.png";
let releaseFeedback;
let signalFeedbackHeld;
(async () => {
  const browser = await chromium.launch({
    ...(fs.existsSync("/usr/bin/chromium")
      ? { executablePath: "/usr/bin/chromium" }
      : {}),
    args: ["--no-sandbox"],
  });
  const scene = await browser.newPage({
    viewport: { width: 640, height: 400 },
  });
  await scene.setContent(
    '<body style="margin:0"><svg width="640" height="400" viewBox="0 0 640 400" xmlns="http://www.w3.org/2000/svg"><rect width="640" height="400" fill="#F5F0DF"/><path d="M0 0H640V220Q490 210 320 210T0 210Z" fill="#B9D0CC"/><path d="M0 205Q150 170 300 202T640 198V400H0Z" fill="#8DAFAC"/><path d="M0 160L140 130L230 147L300 115L430 125L640 156V210H0Z" fill="#95A49B"/><g fill="#D0BC98"><path d="M80 153L115 120L155 153V215H80Z"/><path d="M150 162L185 135L215 160V215H150Z"/><path d="M300 165L340 130L370 153V214H300Z"/></g><path d="M360 142L410 110L458 142V222H360Z" fill="#F0DEC1"/><path d="M350 142L410 105L468 142Z" fill="#607674"/><path d="M385 167H399V199H385Z M421 159H436V184H421Z" fill="#668582"/><path d="M0 320Q165 278 235 310Q405 356 640 305V400H0Z" fill="#526D68"/><path d="M80 362Q210 289 280 294Q390 263 414 225" fill="none" stroke="#D3D0B6" stroke-width="18"/><g stroke="#F0ECE0" stroke-width="4"><path d="M160 246H272 M307 271H435 M434 241H537"/></g></svg>',
  );
  await scene
    .locator("svg")
    .screenshot({ path: artifactDir + "/technical-scene.png" });
  const aspectFiles = {};
  for (const [name, w, h] of [
    ["landscape", 800, 600],
    ["portrait", 600, 1000],
    ["square", 800, 800],
    ["wide", 1200, 400],
  ]) {
    await scene.setViewportSize({ width: w, height: h });
    await scene.locator("svg").evaluate(
      (el, { w, h }) => {
        el.setAttribute("width", w);
        el.setAttribute("height", h);
        el.setAttribute("preserveAspectRatio", "none");
      },
      { w, h },
    );
    const file = artifactDir + "/" + name + ".png";
    await scene.locator("svg").screenshot({ path: file });
    aspectFiles[name] = file;
  }
  // Original technical vehicle fixture, drawn here solely for layout/evidence checks.
  await scene.setViewportSize({ width: 600, height: 1000 });
  await scene.setContent(
    '<body style="margin:0"><svg width="600" height="1000" xmlns="http://www.w3.org/2000/svg"><rect width="600" height="1000" fill="#dce8e2"/><path d="M0 480L170 180L285 365L400 100L600 480Z" fill="#7d9395"/><path d="M0 450L100 395L220 520L340 430L600 465V1000H0Z" fill="#738572"/><path d="M120 1000L270 535H350L490 1000Z" fill="#b7b7a4"/><path d="M225 510H350L380 590V670H205V575Z" fill="#9b4e3f"/><path d="M239 535H338L354 580H225Z" fill="#b8c8c3"/><g fill="#3e5050"><circle cx="230" cy="670" r="19"/><circle cx="357" cy="670" r="19"/></g><path d="M50 370V650M530 350V590" stroke="#4a6458" stroke-width="18"/></svg>',
  );
  aspectFiles["portrait-vehicle"] = artifactDir + "/portrait-vehicle.png";
  await scene
    .locator("svg")
    .screenshot({ path: aspectFiles["portrait-vehicle"] });
  await scene.close();
  const page = await browser.newPage({ viewport: { width: 375, height: 900 } });
  debugPage = page;
  await page.emulateMedia({ reducedMotion: "reduce" });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const rows = [],
    results = new Map();
  let forceStudy = false,
    edgeMode = "success",
    uploadFails = false,
    brokenImages = false,
    used = 0,
    edgeCalls = 0,
    rpcCalls = 0,
    reads = 0;
  const requests = [],
    uploads = [],
    removed = [];
  await page.route("https://watercolor-test.supabase.co/**", async (route) => {
    const req = route.request(),
      u = new URL(req.url()),
      path = u.pathname;
    let body = {};
    try {
      body = req.postDataJSON() || {};
    } catch {}
    const reply = (value, status = 200) =>
      route.fulfill({
        status,
        contentType: "application/json",
        body: JSON.stringify(value),
      });
    if (path.endsWith("/token"))
      return reply({
        access_token: token,
        refresh_token: "fake-refresh-token",
        expires_in: 3600,
        token_type: "bearer",
        user,
      });
    if (path.endsWith("/user")) return reply(user);
    if (path.endsWith("/logout")) return route.fulfill({ status: 204 });
    if (path.endsWith("/profiles")) return reply({ display_name: "Learner" });
    if (path.endsWith("/functions/v1/generate-feedback")) {
      edgeCalls++;
      requests.push(body);
      if (body.mode === "improve_painting")
        assert.equal(body.focus_area, "Overall feedback");
      assert.equal(body.expected_user_id, uid);
      assert.equal(req.headers().authorization, "Bearer " + token);
      if (edgeMode === "hold")
        await new Promise((resolve) => {
          releaseFeedback = resolve;
          signalFeedbackHeld?.();
        });
      if (edgeMode === "missing")
        return reply({ message: "Function not found" }, 404);
      if (edgeMode === "unavailable")
        return reply({ code: "unavailable" }, 503);
      if (edgeMode === "invalid_core")
        return reply(
          { code: "unavailable", reason_code: "unrecoverable_reference" },
          422,
        );
      if (edgeMode === "busy") return reply({ code: "busy" }, 409);
      if (edgeMode === "auth") return reply({ code: "auth" }, 401);
      if (edgeMode === "stale_mock") {
        const value =
          body.mode === "create_reference"
            ? samples.referenceResult
            : samples.improveResult;
        rows.push({
          id: body.request_id,
          user_id: uid,
          mode: body.mode,
          title: value.title,
          image_url: body.image_path,
          focus_area: body.focus_area,
          created_at: new Date().toISOString(),
        });
        results.set(body.request_id, { provider: "mock", value });
        return reply({ id: body.request_id, provider: "mock" });
      }
      if (results.has(body.request_id))
        return reply({
          id: body.request_id,
          provider: results.get(body.request_id).provider,
        });
      if (used >= 3) return reply({ code: "usage_limit" }, 403);
      await new Promise((resolve) => setTimeout(resolve, 150));
      const base = {
        x: 20,
        y: 20,
        priority: "high",
        classification: "optional_refinement",
        evidence: "The dark lower marks compete with the small roof light.",
        shortInstruction: "Keep supporting shapes quiet.",
        reason: "This supports the focal roof light.",
        action: "Test a connected shadow on scrap before touching dry paint.",
        timing: "current_painting",
      };
      const overlays = [
        {
          ...base,
          id: "crop",
          type: "crop_box",
          category: "composition",
          label: "Test this framing",
          x: 8,
          y: 6,
          width: 84,
          height: 82,
          timing: "next_study",
          action: "Test this crop in the next study.",
        },
        {
          ...base,
          id: "value",
          type: "value_mass",
          category: "value_structure",
          label: "Connect lower shadows",
          points: [
            { x: 0, y: 72 },
            { x: 38, y: 66 },
            { x: 62, y: 80 },
            { x: 100, y: 78 },
            { x: 100, y: 100 },
            { x: 0, y: 100 },
          ],
          valueGroup: "dark",
        },
        {
          ...base,
          id: "flow",
          type: "eye_flow_arrow",
          category: "composition",
          label: "Follow the shoreline",
          points: [
            { x: 12, y: 89 },
            { x: 43, y: 72 },
            { x: 64, y: 53 },
          ],
          action:
            "Quiet the lower-left marks and lead the eye along the shoreline.",
        },
        {
          ...base,
          id: "focus",
          type: "focal_ring",
          category: "focal_point",
          label: "Keep the roof light",
          x: 55,
          y: 25,
          width: 20,
          height: 33,
        },
        {
          ...base,
          id: "quiet",
          type: "simplify_region",
          category: "simplification",
          label: "Quiet distant roofs",
          x: 3,
          y: 28,
          width: 42,
          height: 24,
          styleHint: "simplify",
        },
      ];
      const value = {
        ...(body.mode === "create_reference"
          ? samples.referenceResult
          : samples.improveResult),
        title:
          body.mode === "create_reference"
            ? "Harbour painting plan"
            : "Harbour painting feedback",
        overlays,
        whatWorks: [
          "The roof light separates clearly from the distant water.",
          "The shoreline provides a natural eye path.",
        ],
        promising: "The connected foreground can support this existing light.",
        whatToFix: ["Connect the lower shadows and keep the roofs quieter."],
        palette: samples.referenceResult.palette.map((item, i) => ({
          ...item,
          tag: i === 0 ? "main_wash" : i === 1 ? "shadow_mix" : "focal_accent",
          use: "Support a quiet warm/cool relationship.",
          mix: "Test a muted blue and earth mixture.",
        })),
        paletteStrategy:
          "Keep the background cool and muted; reserve one warm dark focal accent.",
        brushPlan: [
          {
            stage: "First atmosphere wash",
            brush: "Large soft brush",
            wash: "Tea-strength blue wash",
            technique: "wet_on_wet",
            timing: "Lay the wash while the paper has an even shine.",
            edges: "Keep the distant roofs soft.",
            stop: "Leave the roof light untouched.",
          },
          {
            stage: "Connected shadow",
            brush: "Medium round brush",
            wash: "Milk-strength blue and earth mix",
            technique: "wet_on_dry",
            timing: "Wait until the first wash is dry.",
            edges: "Keep one focal corner sharp and soften the outer edge.",
            stop: "Stop before scattering small darks.",
          },
        ],
        compositionDecision: {
          mainIssue: "The foreground competes with the roof light.",
          reason: "One quiet mass supports the focal area.",
          tryNow: "Avoid adding more small darks to the outer foreground.",
          nextStudy: "Test the crop in a small thumbnail.",
        },
      };
      value.coachingMode = forceStudy ? "study" : "constructive";
      value.coachingDecision = {
        primaryGoal: forceStudy
          ? "Reserved roof light and connected shadows create a clear value hierarchy."
          : "Keep the roof light as the one crisp focal point.",
        primarySubjectOrArea: "roof light",
        areasToEmphasize: ["roof light"],
        areasToQuiet: ["pier"],
        currentPaintingAction: forceStudy
          ? null
          : "Test one small focal accent on scrap first.",
        nextStudyAction:
          "In a separate study, test one connected shadow beside the roof light.",
        supportingObservations: [
          "The shoreline carries attention toward the roof light.",
        ],
        compositionImplication:
          "The shoreline leads the eye toward the roof light between quieter masses.",
        colourImplication:
          "Warm roof light stands against the muted cool distance.",
        techniqueImplication:
          "A practical way to practise this handling is a soft-to-sharp edge transition.",
      };
      value.practice =
        "Spend 15 minutes testing one soft-to-sharp edge transition on a separate sheet. Keep one focal accent.";
      value.whatToFix.push("Sharpen the pier.");

      if (forceStudy)
        Object.assign(value, {
          mainAdvice:
            "Reserved roof light and connected shadows give this scene a clear value hierarchy.",
          composition:
            "The off-centre roof light is held by quiet connected masses. The shoreline gives the eye a clear path.",
          whatWorks: [
            "The soft background leaves the roof light easy to read.",
            "One sharp roof corner anchors the focal group.",
          ],
          promising: "The lost shoreline edge offers a useful handling lesson.",
          whatToFix: [
            "One possible variation would be a quieter foreground in a separate study.",
          ],
          practice:
            "For 15 minutes, test one lost edge against a sharp focal corner in a small study. Compare the effect at arm’s length.",
          prompt: "How can I practise this kind of edge control?",
          compositionDecision: {
            mainIssue: null,
            reason:
              "Connected shadows link quieter support to the focal light.",
            tryNow: null,
            nextStudy:
              "One possible variation would be a narrower foreground in a separate study.",
          },
        });
      if (body.mode === "improve_painting") {
        for (const key of Object.keys(value)) delete value[key];
        Object.assign(value, canonicalFixture());
      }
      rows.push({
        id: body.request_id,
        user_id: uid,
        mode: body.mode,
        title: value.title,
        image_url: body.image_path,
        focus_area: body.focus_area,
        created_at: new Date().toISOString(),
      });
      results.set(body.request_id, { provider: "openai", value });
      used++;
      if (edgeMode === "lost") return reply({ code: "unavailable" }, 503);
      return reply({ id: body.request_id, provider: "openai" });
    }
    if (path.endsWith("/rpc/save_mock_feedback")) {
      rpcCalls++;
      throw Error("Production must not save a mock result");
    }
    if (path.endsWith("/artworks") && req.method() === "GET") {
      reads++;
      assert.equal(u.searchParams.get("user_id"), "eq." + uid);
      return reply(rows);
    }
    if (path.endsWith("/ai_results")) {
      reads++;
      const id = u.searchParams.get("artwork_id").slice(3),
        row = rows.find((r) => r.id === id),
        saved = results.get(id);
      assert(row && saved);
      return reply({
        provider: saved.provider,
        result_json: saved.value,
        artworks: { image_url: row.image_url, focus_area: row.focus_area },
      });
    }
    if (path.startsWith("/storage/v1/object/sign/") && req.method() === "POST")
      return reply({
        signedURL:
          "/object/sign/artworks/" +
          path.split("/artworks/")[1] +
          "?token=fake-signed",
      });
    if (path.startsWith("/storage/v1/object/sign/") && req.method() === "GET")
      return brokenImages
        ? reply({ error: "Image unavailable" }, 403)
        : route.fulfill({
            status: 200,
            contentType: "image/png",
            body: fs.readFileSync(imageFile),
          });
    if (
      path.startsWith("/storage/v1/object/artworks/") &&
      req.method() === "POST"
    ) {
      uploads.push(path);
      return uploadFails
        ? reply({ statusCode: "500", message: "upload unavailable" }, 500)
        : reply({ Key: path.split("/object/")[1] });
    }
    if (
      path.endsWith("/storage/v1/object/artworks") &&
      req.method() === "DELETE"
    ) {
      removed.push(...body.prefixes);
      return reply([]);
    }
    throw Error("Unexpected request " + req.method() + " " + path);
  });

  const base = process.argv[2] || "http://localhost:8091/watercolor-coach-ai";
  // Never let this optional harness send even an auth request to a live project.
  // Export with the documented fake public Supabase values before running it.
  await page.route("**/*", async (route) => {
    const url = new URL(route.request().url());
    if (url.hostname === "watercolor-test.supabase.co") return route.fallback();
    if (
      url.origin === new URL(base).origin ||
      url.protocol === "blob:" ||
      url.protocol === "data:"
    )
      return route.continue();
    errors.push("Blocked unexpected external endpoint: " + url.origin);
    await route.abort("blockedbyclient");
  });
  const artwork = page.getByTestId("coaching-image-frame");
  const button = (name) => page.getByRole("button", { name, exact: true });
  const shot = async (name) =>
    page.screenshot({ path: artifactDir + "/" + name + ".png" });
  const snapshot = () => ({
    edgeCalls,
    used,
    rpcCalls,
    reads,
    uploads: uploads.length,
    removed: removed.length,
  });
  const open = async (title) => {
    if ((await button(title).getAttribute("aria-expanded")) !== "true")
      await button(title).click();
  };
  const noOverflow = async () =>
    assert(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    );
  await page.goto(base + "/");
  await button("Sign in").waitFor();
  await page
    .getByRole("textbox", { name: "Email", exact: true })
    .fill(user.email);
  await page
    .locator('input[aria-label="Password"]:visible')
    .last()
    .fill("test-password-only");
  await button("Sign in").click();
  await button("Improve my painting").click();
  await button("Choose painting").waitFor();
  await button("Choose painting").focus();
  await page.keyboard.press("Shift+Tab");
  await page.keyboard.press("Tab");
  assert(
    await button("Choose painting").evaluate(
      (el) =>
        document.activeElement === el &&
        parseFloat(getComputedStyle(el).outlineWidth) >= 2,
    ),
  );
  assert.equal(await page.getByRole("radio").count(), 0);
  assert.equal(await page.getByText(/Lake House|Which view/).count(), 0);
  assert.equal(
    await button("Analyse painting").getAttribute("aria-disabled"),
    "true",
  );
  await shot("upload-empty");
  const choose = async () => {
    const event = page.waitForEvent("filechooser");
    await button("Choose painting").click();
    await (await event).setFiles(artifactDir + "/technical-scene.png");
    await button("Choose another image").waitFor();
  };
  await choose();
  await shot("upload-selected");
  edgeMode = "hold";
  const feedbackHeld = new Promise((resolve, reject) => {
    const deadline = setTimeout(
      () =>
        reject(new Error("Feedback fixture did not receive the held request")),
      15000,
    );
    signalFeedbackHeld = () => {
      clearTimeout(deadline);
      resolve();
    };
  });
  await button("Analyse painting").click();
  const pending = page.getByRole("button", {
    name: "Preparing your complete painting analysis…",
    exact: true,
  });
  await pending.waitFor();
  await pending.evaluate((el) => el.click());
  await feedbackHeld;
  assert.equal(edgeCalls, 1);
  assert.equal(used, 0);
  assert.equal(await pending.getAttribute("aria-disabled"), "true");
  assert.equal(
    await button("Choose another image").getAttribute("aria-disabled"),
    "true",
  );
  await shot("loading");
  edgeMode = "success";
  releaseFeedback();
  await page.getByText("Complete Painting Analysis", { exact: true }).waitFor();
  assert.equal(edgeCalls, 1);
  assert.equal(used, 1);
  assert.equal(rows.length, 1);
  assert.equal(rpcCalls, 0);
  assert.equal(await page.getByTestId("expert-view-controls").count(), 0);
  const id = rows[0].id;
  const saved = results.get(id).value;
  await page.getByTestId("coaching-source-image").waitFor();
  await page.setViewportSize({ width: 1440, height: 1000 });
  await shot("highly-resolved-desktop");
  await page.setViewportSize({ width: 390, height: 950 });
  await shot("highly-resolved-mobile");
  const localEvidenceButton = page
    .getByRole("button", { name: /^Locate evidence in your painting:/ })
    .first();
  const beforeKeyboardEvidence = snapshot();
  await localEvidenceButton.focus();
  await page.keyboard.press("Enter");
  await page.getByTestId("coaching-note-0").waitFor();
  assert.deepEqual(snapshot(), beforeKeyboardEvidence);
  await button("Clean view").click();
  const matrix = [];
  for (const [aspect, file] of Object.entries(aspectFiles)) {
    imageFile = file;
    await page.reload();
    await page
      .getByText("Complete Painting Analysis", { exact: true })
      .waitFor();
    await page.getByTestId("coaching-source-image").waitFor();
    for (const width of [375, 390, 430, 768, 1024, 1440, 1800]) {
      await page.setViewportSize({ width, height: 1000 });
      await page.waitForFunction((width) => {
        const frame = document
          .querySelector('[data-testid="coaching-image-frame"]')
          ?.getBoundingClientRect();
        const layout = document.querySelector(
          `[data-testid="${width >= 1024 ? "result-columns" : "result-stack"}"]`,
        );
        return (
          !!layout &&
          !!frame &&
          (width >= 1024 || frame.height <= innerHeight * 0.6)
        );
      }, width);
      await noOverflow();
      const before = snapshot();
      const primaryFrame = await artwork.boundingBox();
      if (width < 1024)
        assert(primaryFrame.height <= 1000 * 0.6, "mobile artwork height");
      if (width < 600) {
        const controls = page.getByLabel("Artwork overlay controls");
        const boxes = await controls
          .getByRole("button")
          .evaluateAll((elements) =>
            elements.map((el) => {
              const r = el.getBoundingClientRect();
              return {
                x: r.x,
                y: r.y,
                width: r.width,
                height: r.height,
                text: el.textContent,
              };
            }),
          );
        assert.equal(boxes.length, 4);
        assert(boxes.every((b) => b.height >= 44));
        assert(Math.abs(boxes[0].y - boxes[1].y) < 1);
        assert(Math.abs(boxes[2].y - boxes[3].y) < 1);
        assert(boxes[2].y > boxes[0].y);
        assert(Math.abs(boxes[0].width - boxes[1].width) < 1);
        assert.deepEqual(
          boxes.map((b) => b.text),
          ["Clean", "Notes", "Composition", "Roles"],
        );
        const title = page.getByText("Complete Painting Analysis", {
          exact: true,
        });
        assert((await title.boundingBox()).height <= 60);
      }
      for (const section of [
        "Composition",
        "Colour & Value",
        "Watercolor technique",
        "Practice & Studies",
      ])
        await open(section);
      assert.equal(
        await page.getByText("Suggested palette", { exact: true }).count(),
        0,
      );
      const thumbnails = page.getByTestId("teaching-evidence");
      assert((await thumbnails.count()) > 0);
      const evidenceBoxes = await thumbnails.evaluateAll((elements) =>
        elements.map((el) => {
          const r = el.getBoundingClientRect();
          return { x: r.x, right: r.right };
        }),
      );
      assert(evidenceBoxes.every((b) => b.x >= 0 && b.right <= width + 1));
      await button("Composition overlay").click();
      await artwork.getByTestId("composition-structure").waitFor();
      const image = await page
          .getByTestId("coaching-source-image")
          .boundingBox(),
        svg = await artwork.getByTestId("composition-structure").boundingBox();
      assert(Math.abs(image.width - svg.width) < 1);
      assert(Math.abs(image.height - svg.height) < 1);
      assert(Math.abs(image.x - svg.x) < 1);
      assert(Math.abs(image.y - svg.y) < 1);
      const circle = artwork
        .getByTestId("composition-structure")
        .locator("circle")
        .first();
      assert(
        Math.abs(Number(await circle.getAttribute("cx")) - 0.67 * image.width) <
          1,
      );
      assert(
        Math.abs(
          Number(await circle.getAttribute("cy")) - 0.36 * image.height,
        ) < 1,
      );
      const firstGeometry = await artwork
        .getByTestId("composition-structure")
        .innerHTML();
      await button("Colour & Value").click();
      await button("Colour & Value").click();
      assert.equal(
        await artwork.getByTestId("composition-structure").innerHTML(),
        firstGeometry,
      );
      await button("Roles").click();
      await page.getByTestId("visual-role-map").waitFor();
      assert(
        (
          await page.getByTestId("visual-role-map").getAttribute("aria-label")
        ).includes("Supporting"),
      );
      await page.getByRole("button", { name: /^Notes ·/ }).click();
      await page.getByTestId("coaching-marker-0").click();
      await page.getByTestId("coaching-note-0").waitFor();
      await page
        .getByTestId("coaching-note-0")
        .getByRole("button")
        .last()
        .click();
      assert.equal(
        await page
          .getByTestId("coaching-marker-0")
          .getAttribute("aria-selected"),
        "true",
      );
      await button("Clean view").click();
      assert.equal(
        await artwork.getByTestId("composition-structure").count(),
        0,
      );
      assert.equal(await page.getByTestId("visual-role-map").count(), 0);
      await noOverflow();
      assert.deepEqual(snapshot(), before);
      matrix.push({ aspect, width, aligned: true, readonly: true });
    }
  }
  imageFile = aspectFiles.landscape;
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.reload();
  await page.getByText("Complete Painting Analysis", { exact: true }).waitFor();
  await button("Composition overlay").click();
  await artwork.getByTestId("composition-structure").waitFor();
  await shot("composition-directional");
  await open("Colour & Value");
  await button("Colour & Value").scrollIntoViewIfNeeded();
  await shot("colour-value");
  await page.getByRole("button", { name: /^Notes ·/ }).click();
  await page.getByTestId("coaching-marker-0").click();
  await page.getByTestId("coaching-note-0").waitFor();
  await shot("notes");
  await button("Roles").click();
  await page.getByTestId("visual-role-map").waitFor();
  await shot("roles");
  // Reproduce live calibration failures with original technical assets only.
  const calibrationMatrix = [];
  const beforeCalibration = structuredClone(saved);
  const calibration = saved.canonicalAnalysis;
  calibration.qualityAssessment.rationale =
    "Clear value grouping supports the focal light. Minor refinements could enhance spatial clarity.";
  calibration.facts[3].observation =
    "Watercolor washes are applied loosely with some layering and soft blending.";
  calibration.insights[3].lesson =
    "The wash application is controlled with transparent layering.";
  calibration.insights[0].action =
    "On scrap paper, paint two value versions; compare which holds the focal light.";
  calibration.colourAnalysis.visibleColours = [
    { label: "Muted green", approximateHex: "#819582", roleId: "tower" },
    { label: "Muted orange", approximateHex: "#b9876a", roleId: "tower" },
    { label: "Off-white", approximateHex: "#efeadd", roleId: null },
  ];
  calibration.colourAnalysis.recreationMixes[0].pigments.push("white");
  calibration.visualRoles[0].region = {
    x: 0.65,
    y: 0.24,
    width: 0.03,
    height: 0.45,
  };
  Object.assign(calibration.visualEvidence[0].note, {
    x: 65,
    y: 24,
    width: 3,
    height: 45,
    region: calibration.visualRoles[0].region,
  });
  imageFile = aspectFiles.portrait;
  for (const width of [375, 390, 430, 1440]) {
    await page.setViewportSize({ width, height: 950 });
    await page.reload();
    await page
      .getByText("Complete Painting Analysis", { exact: true })
      .waitFor();
    await open("Colour & Value");
    await open("Watercolor technique");
    const colours = page.getByTestId("colour-value-analysis");
    const before = snapshot();
    for (const label of ["Muted green", "Muted orange"]) {
      const crop = colours.locator(
        `img[alt="Original painting evidence: ${label}"]`,
      );
      await crop.waitFor();
      assert.equal(await crop.count(), 1);
      const bounds = await crop.locator("..").locator("..").boundingBox();
      assert(
        bounds.width / bounds.height >= 0.6,
        "narrow role needs recognisable display context",
      );
      assert.equal(
        await colours
          .getByRole("button", { name: `See image evidence: ${label}` })
          .count(),
        0,
      );
    }
    await colours
      .getByText("No confidently located source detail for this colour.", {
        exact: true,
      })
      .waitFor();
    const body = await page.locator("body").innerText();
    assert(
      !/wash application|washes are applied|Minor refinements could/.test(body),
    );
    assert(
      body.includes(
        "Visible colour passages appear loose, with overlapping colour and soft blended transitions.",
      ),
    );
    assert(!body.includes("Ultramarine + Burnt Sienna + white"));
    await noOverflow();
    assert.deepEqual(
      snapshot(),
      before,
      "colour/technique evidence cannot create provider calls or writes",
    );
    calibrationMatrix.push({
      width,
      labelIsolation: true,
      contextualCrop: true,
      processSafety: true,
      readonly: true,
    });
    await colours.evaluate((element) =>
      element.scrollIntoView({ block: "start" }),
    );
    await shot(`hotfix-colour-evidence-${width}`);
  }
  Object.assign(saved, structuredClone(beforeCalibration));
  imageFile = aspectFiles.landscape;
  const providerMatrix = [];
  const { loadShared } = require(root + "/tests/helpers/shared-loader.cjs");
  const providerResult = loadShared(
    "../shared/providerPaintingAnalysis.ts",
    "lib/overlays.ts",
  ).normalizeProviderPaintingAnalysis(
    require(root + "/tests/helpers/provider-draft-fixture.cjs")(),
  );
  assert(providerResult.ok);
  Object.assign(saved, structuredClone(providerResult.result));
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 950 });
    await page.reload();
    await page
      .getByText("Complete Painting Analysis", { exact: true })
      .waitFor();
    await open("Composition");
    await open("Colour & Value");
    await open("Watercolor technique");
    await page.getByTestId("teaching-evidence").first().waitFor();
    const before = snapshot();
    await button("Composition overlay").click();
    await artwork.getByTestId("composition-structure").waitFor();
    await button("Roles").click();
    await page.getByTestId("visual-role-map").waitFor();
    await page.getByRole("button", { name: /^Notes ·/ }).click();
    await page.getByTestId("coaching-marker-0").click();
    await page.getByTestId("coaching-note-0").waitFor();
    await button("Clean view").click();
    assert.deepEqual(snapshot(), before);
    await noOverflow();
    providerMatrix.push({ width, normalizedV1: true, readonly: true });
    await shot(`provider-normalized-${width}`);
  }
  // All colours without location use one shared note, including freshly normalized v1.
  saved.canonicalAnalysis.colourAnalysis.visibleColours.forEach(
    (c) => (c.roleId = null),
  );
  await page.reload();
  await page.getByText("Complete Painting Analysis", { exact: true }).waitFor();
  await open("Colour & Value");
  const colourSection = page.getByTestId("colour-value-analysis");
  assert.equal(
    await colourSection
      .getByText(
        "Source regions were not located confidently for these colours.",
        { exact: true },
      )
      .count(),
    1,
  );
  assert.equal(
    await colourSection
      .getByText("No confidently located source detail for this colour.", {
        exact: true,
      })
      .count(),
    0,
  );
  Object.assign(saved, structuredClone(beforeCalibration));
  const finalCalibrationMatrix = [];
  const beforeFinalCalibration = structuredClone(saved);
  saved.canonicalAnalysis.qualityAssessment.level = "strong";
  Object.assign(saved.canonicalAnalysis.insights[0], {
    classification: "optional_refinement",
    lesson: "The foreground-shadow gradation could be softer.",
    action: "Review this gradation.",
  });
  Object.assign(saved.canonicalAnalysis.insights[3], {
    classification: "optional_refinement",
    lesson:
      "The bank's edge sharpness approaches the focal tower's crisp corner.",
    action:
      "On a separate study, soften selected lower bank edges; compare the separation from the focal tower.",
  });
  saved.canonicalAnalysis.facts[3].observation =
    "The bank's lower edges are too sharp and compete with the crisp focal tower corner, weakening separation.";
  saved.canonicalAnalysis.insights.push({
    id: "unsafe-depth",
    domain: "overall",
    classification: "optional_refinement",
    factIds: ["hierarchy"],
    lesson: "Mountain contrast affects atmospheric recession.",
    action: "Darken the distant mountain to improve depth.",
  });
  saved.canonicalAnalysis.visualEvidence = [
    {
      ...saved.canonicalAnalysis.visualEvidence[0],
      insightId: "handling",
      note: {
        ...saved.canonicalAnalysis.visualEvidence[0].note,
        id: "calibrated-comparison",
        label: "Focal and supporting edge relationship",
        scope: "multi_region",
        region: null,
        regions: [
          { x: 0.56, y: 0.24, width: 0.2, height: 0.3 },
          { x: 0.08, y: 0.59, width: 0.27, height: 0.22 },
        ],
      },
    },
  ];
  imageFile = aspectFiles.portrait;
  for (const width of [375, 390, 430, 768, 1024, 1440, 1800]) {
    await page.setViewportSize({ width, height: 950 });
    await page.reload();
    await page.getByTestId("recommendation-0").waitFor();
    const assessment = await page.getByTestId("overall-assessment").innerText();
    assert(!/foreground-shadow gradation|Mountain contrast/.test(assessment));
    assert.equal(await page.getByTestId("recommendation-1").count(), 0);
    assert(
      !/Related passage|Darken the distant mountain/.test(
        await page.locator("body").innerText(),
      ),
    );
    for (const area of [1, 2])
      await page
        .getByText(`Focal and supporting edge relationship · area ${area}`, {
          exact: true,
        })
        .waitFor();
    const before = snapshot();
    await button("Composition overlay").click();
    await button("Roles").click();
    await page.getByRole("button", { name: /^Notes ·/ }).click();
    await page.getByTestId("coaching-marker-0").click();
    await button("Clean view").click();
    await noOverflow();
    assert.deepEqual(
      snapshot(),
      before,
      "calibrated evidence interactions cannot call models, upload or write",
    );
    finalCalibrationMatrix.push({
      width,
      cleanAssessment: true,
      relationshipLabels: true,
      unsafeDepthOmitted: true,
      readonly: true,
    });
    await page.getByTestId("recommendation-0").scrollIntoViewIfNeeded();
    if ([390, 1440].includes(width)) await shot(`final-calibration-${width}`);
  }
  Object.assign(saved, structuredClone(beforeFinalCalibration));
  const liveFreezeMatrix = [];
  for (const kind of ["church", "van", "boat"]) {
    Object.assign(saved, liveFreezeFixture(kind));
    imageFile =
      kind === "van"
        ? aspectFiles["portrait-vehicle"]
        : kind === "church"
          ? aspectFiles.portrait
          : aspectFiles.landscape;
    for (const width of [375, 390, 430, 768, 1024, 1440, 1800]) {
      await page.setViewportSize({ width, height: 950 });
      await page.reload();
      await page
        .getByText("Complete Painting Analysis", { exact: true })
        .waitFor();
      await page.getByTestId("coaching-source-image").waitFor();
      await open("Composition");
      await open("Colour & Value");
      await open("Watercolor technique");
      const assessment = await page
        .getByTestId("overall-assessment")
        .innerText();
      assert(
        assessment.includes(
          kind === "van" ? "Competent painting" : "Strong painting",
        ),
      );
      assert(
        !/perspective|value transitions need refinement/i.test(assessment),
      );
      const recommendations = page.locator('[data-testid^="recommendation-"]');
      assert.equal(await recommendations.count(), kind === "boat" ? 0 : 1);
      const colours = page.getByTestId("colour-value-analysis");
      await colours
        .locator('img[alt="Original painting evidence: Reserved warm light"]')
        .waitFor();
      assert.equal(
        await colours
          .getByText(
            "Some listed colours are visible in the painting, but their exact source regions were not located confidently.",
            { exact: true },
          )
          .count(),
        1,
      );
      assert.equal(
        await colours
          .getByText("No confidently located source detail for this colour.", {
            exact: true,
          })
          .count(),
        0,
      );
      for (const label of [
        "Reserved warm light",
        "Muted blue-grey",
        "Soft ochre",
      ])
        assert(await colours.getByText(label, { exact: true }).count());
      const before = snapshot();
      await button("Composition overlay").click();
      if (kind === "van") {
        assert(
          !/Off-centre focus/i.test(await page.locator("body").innerText()),
        );
        assert(await page.getByText(/Focal placement/).count());
      }
      await button("Roles").click();
      const notes = page.getByRole("button", { name: /^Notes(?: · \d+)?$/ });
      assert.equal(
        await notes.getAttribute("aria-label"),
        kind === "boat" ? "Notes" : "Notes · 1",
      );
      if (kind !== "boat") {
        await notes.click();
        assert.equal(await page.getByTestId("coaching-marker-0").count(), 1);
        assert.equal(await page.getByTestId("coaching-marker-1").count(), 0);
        await page.getByTestId("coaching-marker-0").click();
        await page.getByTestId("coaching-note-0").waitFor();
      } else assert.equal(await notes.getAttribute("aria-disabled"), "true");
      const body = await page.locator("body").innerText();
      assert(
        !/Related passages?|Unsupported base-shadow claim|surrounding shadows feel compressed|Unsafe road amplification|Introduce more value contrast|Unsupported extra softness|Soften the background edges further/i.test(
          body,
        ),
      );
      assert.equal(
        await page.locator('[aria-label*="Related passage"]').count(),
        0,
      );
      if (kind === "church") {
        assert(/wire/i.test(await recommendations.first().innerText()));
        assert(body.includes("Multiple source areas"));
      }
      if (kind === "boat") {
        assert(
          !/central boat focal point|painted with|brushwork|brush strokes|loose washes/i.test(
            body,
          ),
        );
        assert(
          body.includes(
            "Horizontal bands and boat placement give the scene a calm rhythm.",
          ),
        );
        assert(
          !body.includes(
            "Boat placement within horizontal bands maintains the calm rhythm.",
          ),
        );
      }
      await button("Clean view").click();
      await noOverflow();
      assert.deepEqual(
        snapshot(),
        before,
        "freeze result controls cannot add model calls, uploads or database writes",
      );
      liveFreezeMatrix.push({
        kind,
        width,
        evidenceAligned: true,
        deduplicated: true,
        noOrphanNotes: true,
        geometryConsistent: true,
        assessmentConsistent: true,
        sharedColourNotice: true,
        readonly: true,
      });
      if ([390, 1440].includes(width))
        await shot(`live-freeze-${kind}-${width}`);
    }
  }
  Object.assign(saved, structuredClone(beforeFinalCalibration));
  const finalFreezeFixMatrix = [];
  for (const kind of ["active", "quiet", "uncertain"]) {
    Object.assign(saved, finalFreezeFixFixture(kind));
    imageFile = aspectFiles.portrait;
    for (const width of [375, 390, 430, 768, 1024, 1440, 1800]) {
      await page.setViewportSize({ width, height: 950 });
      await page.reload();
      await page
        .getByText("Complete Painting Analysis", { exact: true })
        .waitFor();
      await page.getByTestId("coaching-source-image").waitFor();
      const assessment = await page
        .getByTestId("overall-assessment")
        .innerText();
      assert(
        assessment.includes(
          kind === "uncertain" ? "Competent painting" : "Strong painting",
        ),
      );
      assert(
        assessment.includes(
          kind === "uncertain"
            ? "Review the observations and studies below."
            : "No major issue detected. Explore optional refinements or studies.",
        ),
      );
      const before = snapshot();
      await button("Roles").click();
      const map = page.getByTestId("visual-role-map");
      await map.waitFor();
      const roleLabel = await map.getAttribute("aria-label");
      assert.equal(roleLabel.includes("Quiet"), kind !== "active");
      assert.equal(
        await page
          .getByText("Quiet · foreground road", { exact: true })
          .count(),
        kind === "active" ? 0 : 1,
      );
      await page.getByRole("button", { name: /^Notes(?: · \d+)?$/ }).click();
      if (kind !== "active") {
        // Notes initially shows the selected primary note. Open the retained
        // road note before inspecting its teaching; marker existence is also
        // the rendered orphan check, independent of collapsed list state.
        await page.getByTestId("coaching-marker-1").click();
        await page.getByTestId("coaching-note-1").waitFor();
      }
      assert.equal(
        (await page.getByText("Quiet road passage", { exact: true }).count()) >
          0,
        kind !== "active",
      );
      if (kind === "active")
        assert.equal(await page.getByTestId("coaching-marker-1").count(), 0);
      await open("Watercolor technique");
      const body = await page.locator("body").innerText();
      assert(
        !/dry[- ]brush texture|wet blending|edge variation technique|edge control|observed structure and handling/i.test(
          body,
        ),
      );
      assert(/irregular visible texture/i.test(body));
      assert(/soft blended colour transitions/i.test(body));
      assert(/preserve this edge variation/i.test(body));
      const practice = page.getByText(
        /paint horizontal colour bands varying only value contrast/i,
      );
      assert.equal(await practice.count(), 1);
      assert(!/softer edges/i.test(await practice.innerText()));
      await button("Clean view").click();
      await noOverflow();
      assert.deepEqual(
        snapshot(),
        before,
        "final freeze safeguards remain local and read-only",
      );
      finalFreezeFixMatrix.push({
        kind,
        width,
        roleConsistent: true,
        processSafe: true,
        singleVariable: true,
        statusConsistent: true,
        readonly: true,
      });
      if (width === 390 || width === 1440)
        await shot(`final-freeze-fix-${kind}-${width}`);
    }
  }
  Object.assign(saved, structuredClone(beforeFinalCalibration));
  const analysisDepthMatrix = [];
  for (const width of [375, 390, 430, 768, 1024, 1440, 1800]) {
    Object.assign(
      saved,
      require(root + "/tests/helpers/analysis-depth-fixture.cjs")(),
    );
    imageFile = aspectFiles.portrait;
    await page.setViewportSize({ width, height: 950 });
    await page.reload();
    await page
      .getByText("Complete Painting Analysis", { exact: true })
      .waitFor();
    await page.getByTestId("coaching-source-image").waitFor();
    await open("Composition");
    await open("Colour & Value");
    await open("Watercolor technique");
    const assessment = await page.getByTestId("overall-assessment").innerText();
    assert(assessment.includes("Strong painting"));
    assert(
      assessment.includes(
        "Selected crisp contours hold attention near the tower",
      ),
    );
    assert.equal(
      await page.locator('[data-testid^="recommendation-"]').count(),
      0,
    );
    const body = await page.locator("body").innerText();
    for (const text of [
      "Preserve the road curve",
      "Warm focal accents concentrate chroma",
      "Connected middle tones keep internal contrast",
      "The concentrated warm accent marks one place to pause",
      "This unequal edge definition lets the background recede",
      "varying only value contrast",
      "Keep the shapes, warm–cool relationship and edge treatment consistent",
      "choose the version where the reserved light remains readable",
    ])
      assert(body.includes(text), text);
    assert(
      !/emphasize road contrast|tower perspective is inconsistent|edges and washes/i.test(
        body,
      ),
    );
    const before = snapshot();
    for (const control of ["Roles", "Composition overlay", "Clean view"])
      await button(control).click();
    await page.getByRole("button", { name: /^Notes(?: · \d+)?$/ }).click();
    await page.getByTestId("coaching-marker-0").click();
    await page.getByTestId("coaching-note-0").waitFor();
    await button("Clean view").click();
    await noOverflow();
    assert.deepEqual(
      snapshot(),
      before,
      "deeper saved teaching and its evidence remain local and read-only",
    );
    analysisDepthMatrix.push({
      width,
      completeTeaching: true,
      safePreservation: true,
      processFree: true,
      readonly: true,
    });
    if (width === 390 || width === 1440) await shot(`analysis-depth-${width}`);
  }
  const cleanupMatrix = [];
  for (const width of [375, 390, 430, 768, 1024, 1440, 1800]) {
    Object.assign(
      saved,
      require(root + "/tests/helpers/final-live-freeze-fixture.cjs")(),
    );
    const c = saved.canonicalAnalysis;
    c.qualityAssessment.rationale =
      "The bright sky and pier form the clear focal area. Coherent light and balanced masses give the scene readable depth.";
    c.composition.primary.shortExplanation =
      "The bank leads toward the tower across open water,低";
    c.facts.find((f) => f.id === "edges").observation =
      "Visible marks is loose, with soft washes and varied edge variation.";
    c.visualRoles.find((r) => r.id === "water").area =
      "foreground and background wash areas";
    imageFile = aspectFiles.portrait;
    await page.setViewportSize({ width, height: 950 });
    await page.reload();
    await page.getByTestId("overall-assessment").waitFor();
    await page.getByTestId("coaching-source-image").waitFor();
    for (const section of [
      "Composition",
      "Colour & Value",
      "Watercolor technique",
    ])
      await open(section);
    const body = await page.locator("body").innerText();
    assert(body.includes("Strong painting"));
    assert(body.includes("Coherent light and balanced masses"));
    assert(
      !/pier form the clear focal area|limiting depth|analogous|低|marks is|varied edge variation|soft washes|wash areas|damp_on_dry|2:2:1|Complex neutral/.test(
        body,
      ),
      body,
    );
    assert(body.includes("Visible marks are loose"));
    assert(body.includes("Quiet neutral"));
    assert(body.includes("Wet-on-dry"));
    assert.equal(
      (body.match(/not a reconstruction of the original process/g) || [])
        .length,
      1,
    );
    const before = snapshot();
    for (const control of ["Roles", "Composition overlay", "Clean view"])
      await button(control).click();
    await page.getByRole("button", { name: /^Notes(?: · \d+)?$/ }).click();
    await page.getByTestId("coaching-marker-0").click();
    await page.getByTestId("coaching-note-0").waitFor();
    await button("Clean view").click();
    await noOverflow();
    assert.deepEqual(
      snapshot(),
      before,
      "cleanup is presentation only: zero provider calls/uploads/writes/reads",
    );
    cleanupMatrix.push({
      width,
      focalConsistent: true,
      noHiddenCritique: true,
      grammar: true,
      safeMixes: true,
      english: true,
      readableBrush: true,
      readonly: true,
    });
    if (width === 390 || width === 1440)
      await shot(`final-live-cleanup-${width}`);
  }
  const semanticMatrix = [];
  for (const kind of ["church", "van", "boat"]) {
    for (const width of [375, 390, 430, 768, 1024, 1440, 1800]) {
      Object.assign(
        saved,
        require(root + "/tests/helpers/semantic-cleanup-fixture.cjs")(kind),
      );
      imageFile =
        kind === "van"
          ? aspectFiles["portrait-vehicle"]
          : kind === "church"
            ? aspectFiles.portrait
            : aspectFiles.landscape;
      await page.setViewportSize({ width, height: 950 });
      await page.reload();
      await page.getByTestId("overall-assessment").waitFor();
      await page.getByTestId("coaching-source-image").waitFor();
      for (const section of [
        "Composition",
        "Colour & Value",
        "Watercolor technique",
      ])
        await open(section);
      const body = await page.locator("body").innerText();
      assert(body.includes("Strong painting"), body);
      assert(body.includes("No major issue detected"));
      assert(body.includes("Preserve the sharp light-shadow contrast"));
      assert(
        !/room for improvement|solid foundational|technical mastery|refining edges|improving background|contrast contrast|pigment application|is painted with|gauge improvement|perspective accuracy/.test(
          body,
        ),
        body,
      );
      assert(!body.includes("Stylistic alternative"));
      if (kind === "church") {
        assert(body.includes("strong value contrast"));
        assert(body.includes("effectively balances"));
      }
      if (kind === "boat")
        assert(
          body.includes(
            "The boat has more defined edges and darker visible passages",
          ),
        );
      const before = snapshot();
      for (const control of ["Roles", "Composition overlay", "Clean view"])
        await button(control).click();
      await page.getByRole("button", { name: /^Notes(?: · \d+)?$/ }).click();
      await page.getByTestId("coaching-marker-0").click();
      await page.getByTestId("coaching-note-0").waitFor();
      assert(
        !/refining edges|technical mastery|room for improvement/.test(
          await page.locator("body").innerText(),
        ),
      );
      await button("Clean view").click();
      await noOverflow();
      assert.deepEqual(
        snapshot(),
        before,
        "semantic cleanup and saved interactions create zero provider calls/uploads/writes/reads",
      );
      semanticMatrix.push({
        kind,
        width,
        coherentAssessment: true,
        safeStrength: true,
        noFalseAlternative: true,
        neutralPractice: true,
        readonly: true,
      });
      if (width === 390 || width === 1440)
        await shot(`semantic-freeze-${kind}-${width}`);
    }
  }
  Object.assign(saved, structuredClone(beforeFinalCalibration));
  imageFile = aspectFiles.landscape;
  const originalPrimary = structuredClone(
    saved.canonicalAnalysis.composition.primary,
  );
  saved.canonicalAnalysis.composition.primary = {
    ...originalPrimary,
    type: "balanced_masses",
    shortExplanation:
      "The smaller tower light is counterbalanced by a wider muted bank across open water.",
    paths: null,
    secondaryPoints: [{ x: 0.215, y: 0.7 }],
    masses: [
      {
        role: "focal",
        points: [
          { x: 0.56, y: 0.24 },
          { x: 0.76, y: 0.24 },
          { x: 0.76, y: 0.54 },
          { x: 0.56, y: 0.54 },
        ],
      },
      {
        role: "supporting",
        points: [
          { x: 0.08, y: 0.59 },
          { x: 0.35, y: 0.59 },
          { x: 0.35, y: 0.81 },
          { x: 0.08, y: 0.81 },
        ],
      },
    ],
    teaching: {
      elements: ["Tower light", "Bank mass"],
      entry: "This directional field must be hidden for balance",
      path: "This directional path must be hidden",
      landing: "This landing must be hidden",
      supportingMass: "Muted lower bank",
      quietMass: "Open water between the masses",
      counterbalance: "Smaller bank counters the tower light",
      risk: null,
    },
  };
  saved.canonicalAnalysis.composition.observation =
    "Separate masses hold a quiet stretch of water between the tower light and the bank.";
  await page.reload();
  await page.getByText("Complete Painting Analysis", { exact: true }).waitFor();
  await button("Composition overlay").click();
  await artwork.getByTestId("composition-structure").waitFor();
  assert.equal(
    await page.getByText(/This directional|This landing/).count(),
    0,
  );
  assert(await page.getByText("Open / quieter space", { exact: true }).count());
  await shot("composition-balanced-masses");
  saved.canonicalAnalysis.composition.primary = originalPrimary;
  saved.canonicalAnalysis.composition.observation =
    "The low bank leads toward the pale tower.";
  saved.canonicalAnalysis.qualityAssessment.level = "competent";
  saved.canonicalAnalysis.insights[2].classification = "optional_refinement";
  saved.canonicalAnalysis.insights[2].lesson =
    "A quieter bank value group could give the small focal light more breathing room.";
  saved.canonicalAnalysis.insights[2].action =
    "In a separate study, compare one connected bank shadow with fewer dark accents.";
  Object.assign(saved.canonicalAnalysis.facts[2], {
    observation:
      "The lower bank's dark accents compete with the reserved tower light and fragment the value grouping.",
    roleId: "bank",
  });
  await page.reload();
  await page
    .getByText("Review the observations and studies below.", { exact: true })
    .waitFor();
  assert.equal(await page.getByText(/No significant correction/).count(), 0);
  await page
    .getByTestId("recommendation-0")
    .getByTestId("teaching-evidence")
    .waitFor();
  const beforeEvidence = snapshot();
  const recommendation = page.getByTestId("recommendation-0");
  const crops = recommendation.getByTestId("evidence-crop");
  assert.equal(await crops.count(), 2);
  const cropTransforms = await recommendation
    .getByTestId("evidence-source-frame")
    .evaluateAll((elements) => elements.map((el) => el.getAttribute("style")));
  assert.equal(cropTransforms[0], cropTransforms[1]);
  assert.equal(
    await recommendation.locator('img[style*="grayscale(1)"]').count(),
    1,
  );
  assert.deepEqual(snapshot(), beforeEvidence);
  await recommendation.scrollIntoViewIfNeeded();
  await shot("main-opportunity-value-evidence");
  await shot("competent-result");
  await page.setViewportSize({ width: 390, height: 950 });
  await shot("competent-mobile");
  const evidenceMatrix = [];
  for (const [aspect, file] of Object.entries(aspectFiles)) {
    imageFile = file;
    await page.reload();
    await page.getByTestId("recommendation-0").waitFor();
    for (const width of [375, 390, 430, 768, 1024, 1440, 1800]) {
      await page.setViewportSize({ width, height: 1000 });
      await open("Colour & Value");
      const before = snapshot();
      const card = page.getByTestId("recommendation-0");
      await card.getByTestId("evidence-crop").first().waitFor();
      assert.equal(await card.getByTestId("evidence-crop").count(), 2);
      const transforms = await card
        .getByTestId("evidence-source-frame")
        .evaluateAll((els) => els.map((el) => el.getAttribute("style")));
      assert.equal(transforms[0], transforms[1]);
      const boxes = await card.getByTestId("evidence-crop").evaluateAll((els) =>
        els.map((el) => {
          const r = el.getBoundingClientRect();
          return {
            left: r.left,
            right: r.right,
            width: r.width,
            height: r.height,
          };
        }),
      );
      assert(
        boxes.every(
          (b) =>
            b.left >= 0 &&
            b.right <= width + 1 &&
            b.width >= 32 &&
            b.height >= 32,
        ),
      );
      const sources = await card
        .locator("img")
        .evaluateAll((els) => els.map((el) => el.src));
      assert(
        sources.every(
          (src) => src === sources[0] && src.includes("/object/sign/artworks/"),
        ),
      );
      await noOverflow();
      assert.deepEqual(snapshot(), before);
      evidenceMatrix.push({
        aspect,
        width,
        original: true,
        sameRegion: true,
        grayscaleOnly: true,
        readonly: true,
      });
      if (width === 390 && ["portrait", "portrait-vehicle"].includes(aspect)) {
        await page
          .getByText("Complete Painting Analysis", { exact: true })
          .scrollIntoViewIfNeeded();
        await shot(aspect + "-mobile-top");
        await card.scrollIntoViewIfNeeded();
        await shot(aspect + "-mobile-evidence");
      }
    }
  }
  imageFile = aspectFiles.landscape;
  const beforeVisualExamples = structuredClone(saved);
  const edgeInsight = saved.canonicalAnalysis.insights.find(
    (i) => i.id === "handling",
  );
  Object.assign(edgeInsight, {
    classification: "optional_refinement",
    factIds: ["edges", "path"],
    lesson: "Softer bank edges could support the crisp focal corner.",
    action:
      "In a separate study, compare soft versus current bank edges; hold the focal corner fixed and choose the clearer separation.",
  });
  saved.canonicalAnalysis.facts[3].observation =
    "The lower bank edge is too sharp and competes with the crisp focal tower corner, weakening separation.";
  Object.assign(
    saved.canonicalAnalysis.facts[2],
    structuredClone(beforeCalibration.canonicalAnalysis.facts[2]),
  );
  Object.assign(
    saved.canonicalAnalysis.insights[2],
    structuredClone(beforeCalibration.canonicalAnalysis.insights[2]),
  );
  saved.canonicalAnalysis.visualEvidence.push({
    insightId: "handling",
    roleId: "tower",
    note: {
      ...saved.canonicalAnalysis.visualEvidence[0].note,
      id: "edge-comparison",
      label: "Focal and supporting edges",
      scope: "multi_region",
      regions: [
        { x: 0.56, y: 0.24, width: 0.2, height: 0.3 },
        { x: 0.08, y: 0.59, width: 0.27, height: 0.22 },
      ],
      region: null,
      priority: "high",
    },
  });
  await page.setViewportSize({ width: 390, height: 950 });
  await page.reload();
  await page
    .getByTestId("recommendation-0")
    .getByTestId("evidence-crop")
    .first()
    .waitFor();
  assert.equal(
    await page
      .getByTestId("recommendation-0")
      .getByTestId("evidence-crop")
      .count(),
    2,
  );
  assert.equal(
    await page
      .getByTestId("recommendation-0")
      .locator('img[style*="grayscale"]')
      .count(),
    0,
  );
  await page.getByTestId("recommendation-0").scrollIntoViewIfNeeded();
  await shot("mobile-edge-comparison");
  Object.assign(saved, structuredClone(beforeVisualExamples));
  saved.canonicalAnalysis.insights.push({
    id: "figure-study",
    domain: "composition",
    classification: "study_experiment",
    factIds: ["path"],
    lesson: "A subordinate scale cue could clarify the bank's depth.",
    action:
      "In a separate study, compare one tiny muted figure at the lower bank with no figure; keep tower contrast strongest and assess human scale.",
  });
  saved.canonicalAnalysis.visualEvidence.push({
    insightId: "figure-study",
    roleId: "bank",
    note: {
      ...saved.canonicalAnalysis.visualEvidence[0].note,
      id: "figure-location",
      type: "region_highlight",
      category: "composition",
      label: "Possible figure area",
      shortInstruction: "Possible subordinate figure area · future study.",
      x: 10,
      y: 64,
      width: 10,
      height: 10,
      scope: "local",
      region: { x: 0.1, y: 0.64, width: 0.1, height: 0.1 },
      regionConfidence: 0.9,
      timing: "next_study",
    },
  });
  await page.reload();
  await open("Practice & Studies");
  await page.getByTestId("future-study-location").waitFor();
  assert(
    await page
      .getByText("Possible figure area · future study", { exact: true })
      .count(),
  );
  await page.getByTestId("future-study-location").scrollIntoViewIfNeeded();
  await shot("future-study-location");
  Object.assign(saved, structuredClone(beforeVisualExamples));
  const beforeTextRoles = snapshot();
  saved.canonicalAnalysis.visualRoles.forEach((r) => (r.confidence = 0.2));
  await page.reload();
  await button("Roles").click();
  await page
    .getByText(
      "Role locations are uncertain. These roles are text guidance only.",
      { exact: true },
    )
    .waitFor();
  assert.equal(await page.getByTestId("visual-role-map").count(), 0);
  assert(await page.getByText("Supporting · bank", { exact: true }).count());
  assert.equal(edgeCalls, beforeTextRoles.edgeCalls);
  assert.equal(used, beforeTextRoles.used);
  assert.equal(uploads.length, beforeTextRoles.uploads);
  Object.assign(saved, structuredClone(beforeVisualExamples));
  // A legacy saved response opens without reanalysis; reference flow remains available.
  const canonicalSaved = results.get(id).value;
  results.set(id, { provider: "openai", value: samples.improveResult });
  await page.reload();
  await page.getByText(samples.improveResult.title, { exact: true }).waitFor();
  assert.equal(edgeCalls, 1);
  assert.equal(used, 1);
  results.set(id, { provider: "openai", value: canonicalSaved });
  // Exercise distinct public error states and same-identity manual retries.
  await page.goto(base + "/upload/improve-painting");
  await choose();
  const errorCases = [
    ["invalid_core", "reliable analysis"],
    ["unavailable", "AI service could not complete"],
    ["busy", "already being analysed"],
    ["auth", "session has expired"],
  ];
  let retryId;
  for (const [mode, text] of errorCases) {
    edgeMode = mode;
    const before = used;
    const n = edgeCalls;
    await page
      .getByRole("button", { name: /^(Analyse painting|Retry analysis)$/ })
      .click();
    await page.getByRole("alert").filter({ hasText: text }).waitFor();
    assert(
      !/unrecoverable_reference|reason_code/.test(
        await page.locator("body").innerText(),
      ),
    );
    assert.equal(edgeCalls, n + 1);
    assert.equal(used, before);
    retryId ??= requests.at(-1).request_id;
    assert.equal(requests.at(-1).request_id, retryId);
    await shot("error-" + mode);
  }
  const oldUsed = used;
  used = 3;
  edgeMode = "success";
  await button("Retry analysis").click();
  await page
    .getByRole("alert")
    .filter({ hasText: "current analysis limit" })
    .waitFor();
  used = oldUsed;
  edgeMode = "lost";
  await button("Retry analysis").click();
  await page
    .getByRole("alert")
    .filter({ hasText: "Check My Artworks" })
    .waitFor();
  assert.equal(used, 2);
  const beforeRecovery = edgeCalls;
  edgeMode = "success";
  await button("Retry analysis").click();
  await page.getByText("Complete Painting Analysis", { exact: true }).waitFor();
  assert.equal(edgeCalls, beforeRecovery + 1);
  assert.equal(used, 2);
  assert.equal(rows.length, 2);
  assert.equal(rpcCalls, 0);
  await page.goto(base + "/upload/create-reference");
  const photoChooser = page.waitForEvent("filechooser");
  await button("Choose photo").click();
  await (await photoChooser).setFiles(artifactDir + "/technical-scene.png");
  const beforeReference = edgeCalls;
  await button("Create Reference").click();
  await page.getByText("Painting plan", { exact: true }).first().waitFor();
  assert.equal(edgeCalls, beforeReference + 1);
  assert.equal(used, 3);
  assert.equal(rows.length, 3);
  assert.equal(rpcCalls, 0);
  const beforeGallery = {
    edgeCalls,
    used,
    rpcCalls,
    uploads: uploads.length,
    removed: removed.length,
  };
  await page.goto(base + "/artworks");
  await page
    .getByRole("button", { name: /Tower study/ })
    .first()
    .click();
  await page.getByText("Complete Painting Analysis", { exact: true }).waitFor();
  assert.deepEqual(
    {
      edgeCalls,
      used,
      rpcCalls,
      uploads: uploads.length,
      removed: removed.length,
    },
    beforeGallery,
  );
  assert.deepEqual(errors, []);
  fs.writeFileSync(
    artifactDir + "/report.json",
    JSON.stringify(
      {
        matrix,
        evidenceMatrix,
        calibrationMatrix,
        providerMatrix,
        finalCalibrationMatrix,
        liveFreezeMatrix,
        finalFreezeFixMatrix,
        analysisDepthMatrix,
        cleanupMatrix,
        semanticMatrix,
        calls: snapshot(),
        errors,
        requests: requests.map((r) => ({
          id: r.request_id,
          focus: r.focus_area,
          mode: r.mode,
        })),
        controlled: true,
      },
      null,
      2,
    ),
  );
  console.log(
    "PASS: professional workspace; 70 responsive/aspect + 4 calibration + 2 provider-normalized + 7 final calibration + 21 live-freeze + 21 final-freeze-fix + 7 analysis-depth + 7 final-live-cleanup + 21 semantic-freeze cases; unchanged geometry; Notes/marker linking; all local controls readonly; upload/loading/errors/retry; legacy; safe reason codes; zero automatic mock fallback; no live paid calls.",
  );
  await browser.close();
})().catch(async (error) => {
  console.error(error);
  if (debugPage)
    console.error((await debugPage.locator("body").innerText()).slice(0, 7000));
  process.exit(1);
});
