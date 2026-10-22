const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const root = path.resolve(__dirname, "..");
test("saved v1 with newly unsupported method wording remains readable without rewriting its source", () => {
  const canonical = require("./helpers/canonical-fixture.cjs")();
  canonical.canonicalAnalysis.facts[3].observation = "Lifting created the pale cloud shapes.";
  canonical.canonicalAnalysis.insights[3].lesson = "Negative painting defined the tree canopy.";
  canonical.canonicalAnalysis.insights[3].action = "Preserve the lifting used for the clouds.";
  const before = structuredClone(canonical);
  const html = render("improve_painting", "openai", "https://example.invalid/original.png", undefined,
    { canonicalResult: canonical, viewportWidth: 1440 });
  assert(html.includes("Painting Assessment"));
  assert(html.includes("older assessment"));
  assert(!/Lifting created|Negative painting defined|lifting used/.test(html));
  assert(!html.includes("We could not open this saved analysis"));
  assert(html.includes("example.invalid/original.png"));
  assert.deepEqual(canonical, before);
});
test("substantive saved teaching survives the existing workspace without truncation or unsafe preservation", () => {
  const canonical = require("./helpers/analysis-depth-fixture.cjs")();
  const html = render(
    "improve_painting",
    "openai",
    "https://example.invalid/original.png",
    undefined,
    {
      canonicalResult: canonical,
      viewportWidth: 1440,
    },
  );
  assert(html.includes("Strong painting"));
  for (const text of [
    "Selected crisp contours hold attention near the tower",
    "Preserve the value separation",
    "Preserve the road curve",
    "Warm focal accents concentrate chroma",
    "Connected middle tones keep internal contrast",
    "The concentrated warm accent marks one place to pause",
    "This unequal edge definition lets the background recede",
    "varying only value contrast",
    "Keep the shapes, warm–cool relationship and edge treatment consistent",
    "choose the version where the reserved light remains readable",
  ])
    assert(html.includes(text), text);
  assert(
    !/emphasize road contrast|tower perspective is inconsistent|edges and washes/i.test(
      html,
    ),
  );
});

test("multi-sentence colour teaching is deduplicated only when every lesson is already covered", () => {
  const canonical = require("./helpers/analysis-depth-fixture.cjs")();
  const colour = canonical.canonicalAnalysis.colourAnalysis;
  colour.chromaHierarchy = colour.valueHierarchy;
  const html = render(
    "improve_painting",
    "openai",
    "https://example.invalid/original.png",
    undefined,
    {
      canonicalResult: canonical,
      viewportWidth: 1440,
    },
  );
  assert(html.includes("Colour strategy"));
  assert(html.includes("Warm focal accents concentrate chroma"));
  assert(!html.includes("Chroma hierarchy"));
  assert(html.includes("Value hierarchy"));
});

test("a generic figure study cannot leak back through overall assessment or domain prose", () => {
  const canonical = require("./helpers/canonical-fixture.cjs")();
  Object.assign(canonical.canonicalAnalysis.insights[0], {
    classification: "stylistic_alternative",
    lesson: "A figure could add decorative interest.",
    action: "Add figures and compare with no figures.",
  });
  const html = render(
    "improve_painting",
    "openai",
    "https://example.invalid/original.png",
    undefined,
    { canonicalResult: canonical, viewportWidth: 1440 },
  );
  assert(!html.includes("decorative interest"));
  assert(!html.includes("Add figures"));
  assert(html.includes("Painting Assessment"));
});
for (const focus of [
  "Overall feedback",
  "Composition",
  "Colour & contrast",
  "Watercolor technique",
])
  test(`server-normalized draft remains compatible with saved result presentation: ${focus}`, () => {
    const { loadShared } = require("./helpers/shared-loader.cjs");
    const normalized = loadShared(
      "../shared/providerPaintingAnalysis.ts",
      "lib/overlays.ts",
    ).normalizeProviderPaintingAnalysis(
      require("./helpers/provider-draft-fixture.cjs")(),
    );
    assert(normalized.ok);
    const html = render(
      "improve_painting",
      "openai",
      "https://example.invalid/original.png",
      undefined,
      { canonicalResult: normalized.result, viewportWidth: 1440, focus },
    );
    for (const text of [
      "Painting Assessment",
      "Highly resolved painting",
      "What works",
      "Composition",
      "Colour &amp; Value",
      "Edges &amp; Texture",
    ])
      assert(html.includes(text), text);
    assert(!html.includes("saved analysis could not"));
  });
test("zero located colours show one shared confidence note with compact colour labels", () => {
  const canonical = require("./helpers/canonical-fixture.cjs")();
  canonical.canonicalAnalysis.colourAnalysis =
    require("./helpers/colour-fixture.cjs")();
  canonical.canonicalAnalysis.colourAnalysis.visibleColours.forEach(
    (c) => (c.roleId = null),
  );
  const html = render(
    "improve_painting",
    "openai",
    "https://example.invalid/original.png",
    undefined,
    { canonicalResult: canonical, viewportWidth: 1440 },
  );
  assert.equal(
    (
      html.match(
        /Source regions were not located confidently for these colours\./g,
      ) ?? []
    ).length,
    1,
  );
  assert(
    !html.includes("No confidently located source detail for this colour."),
  );
  for (const colour of canonical.canonicalAnalysis.colourAnalysis
    .visibleColours)
    assert(html.includes(colour.label));
});
test("mixed colour evidence retains its own labels and a single individual confidence note", () => {
  const canonical = require("./helpers/canonical-fixture.cjs")();
  canonical.canonicalAnalysis.colourAnalysis =
    require("./helpers/colour-fixture.cjs")();
  canonical.canonicalAnalysis.colourAnalysis.visibleColours[1].roleId = null;
  const html = render(
    "improve_painting",
    "openai",
    "https://example.invalid/original.png",
    undefined,
    { canonicalResult: canonical, viewportWidth: 1440 },
  );
  assert.equal(
    (
      html.match(/No confidently located source detail for this colour\./g) ??
      []
    ).length,
    1,
  );
  assert(
    !html.includes(
      "Source regions were not located confidently for these colours.",
    ),
  );
  assert(html.includes("Reserved warm light"));
  assert(html.includes("See image evidence · What works"));
});

test("colour rows sharing one source region retain labels and reference one existing original detail", () => {
  const canonical = require("./helpers/canonical-fixture.cjs")();
  canonical.canonicalAnalysis.colourAnalysis =
    require("./helpers/colour-fixture.cjs")();
  canonical.canonicalAnalysis.colourAnalysis.visibleColours = [
    { label: "Muted green", approximateHex: "#889987", roleId: "tower" },
    { label: "Muted orange", approximateHex: "#b88b6d", roleId: "tower" },
    { label: "Off-white", approximateHex: "#efeadb", roleId: null },
  ];
  const html = render(
    "improve_painting",
    "openai",
    "https://example.invalid/original.png",
    undefined,
    { canonicalResult: canonical, viewportWidth: 1440 },
  );
  const colour = html.slice(
    html.indexOf('data-testid="colour-value-analysis"'),
  );
  assert(colour.includes("Muted green"));
  assert(colour.includes("Muted orange"));
  const rows = colour.slice(0, colour.indexOf(">Colour strategy<"));
  assert.equal((rows.match(/See image evidence · What works/g) || []).length, 2);
  assert.equal((colour.match(/data-testid="evidence-crop"/g) || []).length, 0);
  assert(
    colour.includes("No confidently located source detail for this colour."),
  );
  assert(!colour.includes("unavailable for this saved colour"));
});
function render(
  mode,
  provider,
  image,
  overlays,
  {
    focus = "Composition",
    saved = {},
    canonicalResult,
    viewportWidth = 375,
    isSaved = true,
    expandedAids = true,
    openSection,
    resultState = {},
  } = {},
) {
  const modules = new Map();
  function load(relative) {
    if (modules.has(relative)) return modules.get(relative);
    const exports = {};
    modules.set(relative, exports);
    const code = ts.transpileModule(
      fs.readFileSync(path.join(root, relative), "utf8"),
      {
        compilerOptions: {
          module: ts.ModuleKind.CommonJS,
          jsx: ts.JsxEmit.ReactJSX,
          target: ts.ScriptTarget.ES2022,
        },
      },
    ).outputText;
    new Function("exports", "require", code)(exports, (name) => {
      if (name === "@expo/vector-icons") return { Ionicons: () => null };
      if (
        name === "react" &&
        relative.endsWith("ResultExperience.tsx") &&
        (openSection !== undefined || Object.keys(resultState).length)
      ) {
        let stateIndex = 0;
        return {
          ...React,
          useState: (initial) => {
            const index = stateIndex++;
            const defaults =
              typeof initial === "function" ? initial() : initial;
            const value = Object.hasOwn(resultState, index)
              ? resultState[index]
              : index === 0 && openSection !== undefined
                ? openSection
                : defaults;
            return [value, () => {}];
          },
        };
      }
      if (name === "react" || name === "react/jsx-runtime")
        return require(name);
      if (name === "react-native-svg") {
        const shape = (props) =>
          React.createElement(
            "svg",
            {
              "aria-hidden": props["aria-hidden"],
              role: props.accessibilityRole,
              "aria-label": props.accessibilityLabel,
            },
            props.children,
          );
        return {
          __esModule: true,
          default: shape,
          Ellipse: shape,
          Rect: shape,
          Polyline: shape,
          Polygon: shape,
          Path: shape,
          G: shape,
          Line: shape,
          Text: shape,
          Circle: shape,
        };
      }
      if (name === "react-native")
        return {
          Text: (props) =>
            React.createElement(
              "span",
              {
                role:
                  props.accessibilityRole === "image"
                    ? "img"
                    : props.accessibilityRole,
              },
              props.children,
            ),
          View: (props) =>
            React.createElement(
              "div",
              {
                "aria-label": props.accessibilityLabel,
                "data-testid": props.testID,
                role:
                  props.accessibilityRole === "image"
                    ? "img"
                    : props.accessibilityRole,
              },
              props.children,
            ),
          Image: (props) =>
            React.createElement("img", {
              src: props.source.uri,
              alt: props.accessibilityLabel,
            }),
          ActivityIndicator: () => null,
          Pressable: (props) =>
            React.createElement(
              "button",
              {
                "aria-label": props.accessibilityLabel,
                "aria-expanded": props["aria-expanded"],
                "aria-selected": props["aria-selected"],
                "aria-pressed": props["aria-pressed"],
                disabled: props.disabled,
              },
              props.children,
            ),
          StyleSheet: { create: (value) => value },
          ScrollView: (props) =>
            React.createElement("main", null, props.children),
          useWindowDimensions: () => ({ width: viewportWidth, height: 900 }),
          Platform: {
            OS: "web",
            select: (choices) => choices.web ?? choices.default,
          },
        };
      if (name.endsWith("/ui") || name === "./ui")
        return {
          Screen: (props) => React.createElement("main", null, props.children),
          Button: (props) => React.createElement("button", null, props.title),
          colors: {},
          styles: {},
        };
      if (name.endsWith("/useSavedResult"))
        return {
          useSavedResult: (sample) => ({
            result: canonicalResult ?? {
              ...sample,
              ...(overlays === undefined ? {} : { overlays }),
              ...saved,
            },
            provider,
            isSaved,
            image,
            focus,
            loading: false,
            error: "",
            retry: () => {},
          }),
        };
      if (/MiniWatercolorScene|ArtworkThumbnail|WatercolorSwatch/.test(name))
        return {
          __esModule: true,
          default: () => React.createElement("div", { "data-study-aid": true }),
        };
      const full = path.resolve(root, path.dirname(relative), name);
      const file =
        fs.existsSync(full) && /\.tsx?$/.test(full)
          ? full
          : [".tsx", ".ts"]
              .map((ext) => full + ext)
              .find((f) => fs.existsSync(f));
      if (!file) throw new Error(`Unexpected import ${name}`);
      return load(path.relative(root, file));
    });
    if (expandedAids && relative.endsWith("StudyDisclosure.tsx")) {
      const Original = exports.default;
      exports.default = (props) =>
        React.createElement(Original, { ...props, open: true });
    }
    return exports;
  }
  const Component = load(
    `app/result/${mode === "create_reference" ? "create-reference" : "improve-painting"}.tsx`,
  ).default;
  return renderToStaticMarkup(React.createElement(Component)).replace(
    /<!--.*?-->/g,
    "",
  );
}

const brushPlan = [
  {
    stage: "Separate edge study",
    brush: "Medium round brush",
    wash: "Tea-strength blue wash",
    technique: "wet_on_dry",
    timing: "Wait until the first wash is dry.",
    edges: "Keep supporting edges soft; reserve one crisp focal accent.",
    stop: "Stop before scattering small darks.",
  },
];
const canonical = {
  primaryGoal: "Keep the pavilion as the only crisp focal point.",
  primarySubjectOrArea: "pavilion",
  areasToEmphasize: ["pavilion"],
  areasToQuiet: ["pier"],
  currentPaintingAction: "Test on scrap before adding one small focal accent.",
  nextStudyAction: "In a new study, move the pavilion slightly right.",
  supportingObservations: ["The bridge directs attention toward the pavilion."],
  compositionImplication:
    "The bridge gives the eye a clear path to the focal light.",
  colourImplication: "Warm roof light stands against the muted cool distance.",
  techniqueImplication:
    "A practical way to practise this is one soft-to-sharp edge transition.",
};
const saved = {
  coachingDecision: canonical,
  brushPlan,
  whatWorks: [
    "Roof light separates from the cooler distance.",
    "The shoreline leads to the pavilion.",
  ],
  whatToFix: ["Keep pier marks soft in a separate study."],
  promising: "The connected shoreline offers a useful value-grouping study.",
  practice:
    "Spend 15 minutes practising one soft-to-sharp edge transition on a new sheet.",
  palette: [
    {
      name: "Ultramarine",
      hex: "#526B89",
      pigmentCode: "PB29",
      use: "Cool distance",
      mix: "Test an earth-colour neutral.",
    },
  ],
  paletteStrategy: "Keep distance cool and muted; reserve a warm focal accent.",
};
const notes = [
  {
    id: "focus",
    type: "focal_ring",
    category: "focal_point",
    x: 55,
    y: 25,
    width: 20,
    height: 30,
    priority: "high",
    label: "Pavilion light",
    shortInstruction: "Observe the pavilion's contrast.",
    reason: "The focal light stands apart.",
    action: "Keep one small focal accent selective.",
  },
  {
    id: "value",
    type: "value_mass",
    x: 20,
    y: 70,
    category: "value_structure",
    points: [
      { x: 0, y: 70 },
      { x: 100, y: 70 },
      { x: 100, y: 100 },
      { x: 0, y: 100 },
    ],
    valueGroup: "dark",
    priority: "high",
    label: "Quiet pier",
    shortInstruction: "Keep the pier soft.",
    reason: "This supports the focal light.",
    action: "Test soft pier marks on scrap.",
    timing: "next_study",
  },
  {
    id: "flow",
    type: "eye_flow_arrow",
    x: 10,
    y: 80,
    category: "composition",
    points: [
      { x: 10, y: 80 },
      { x: 60, y: 40 },
    ],
    priority: "medium",
    label: "Eye path",
    shortInstruction: "Follow the bridge.",
    reason: "A connected path supports attention.",
    action: "Compare this path in a new study.",
    timing: "next_study",
  },
  {
    id: "extra",
    type: "point_marker",
    category: "edge_control",
    x: 30,
    y: 40,
    priority: "low",
    label: "Extra detail",
    shortInstruction: "Test an edge.",
    reason: "Compare the transition.",
    action: "Use a separate study.",
  },
];
const image = "https://example.invalid/private-signed-image";
const aria = (title, open) =>
  `aria-label="${title.replace(/&/g, "&amp;")}" aria-expanded="${open}"`;
const ordered = (html, titles) => {
  for (let i = 1; i < titles.length; i++)
    assert(
      html.indexOf(titles[i - 1]) < html.indexOf(titles[i]),
      `${titles[i - 1]} before ${titles[i]}`,
    );
};

for (const provider of ["mock", "openai"])
  for (const mode of ["improve_painting", "create_reference"])
    test(`${mode}/${provider}: old saved JSON renders and detailed guidance remains accessible`, () => {
      const html = render(mode, provider, image);
      assert(html.includes("Explore your feedback"));
      assert(!html.includes("0 future study ideas")); // No filler requirement for old data.
      assert(html.includes("Sketch &amp; value plan"));
      assert(
        !/simplified reference placeholder|Sample line study|Sample tonal plan|Suggested next prompt/.test(
          html,
        ),
      );
      assert(!html.includes('aria-label="Thumbnail planning"'));
      assert(!html.includes('aria-label="Composition model"'));
      if (provider === "mock") {
        assert(html.includes("Sample watercolor guide"));
        assert(
          html.includes(
            "Sample guide shown — live AI feedback was unavailable.",
          ),
        );
        assert(!html.includes("<img"));
        assert(!html.includes("Your painting"));
        assert(!html.includes("Your photo"));
        assert(!html.includes("Visual coaching notes"));
        assert(!html.includes("Ask a follow-up"));
      } else {
        const label =
          mode === "create_reference" ? "Your photo" : "Your painting";
        assert(html.includes(label));
        assert(
          html.includes(
            mode === "create_reference" ? "Coastal Town" : "Lake House",
          ),
        );
        ordered(html, [
          label,
          mode === "create_reference" ? "Painting plan" : "Main coaching point",
          "Next 15-minute practice",
          "Explore your feedback",
        ]);
      }
      if (mode === "create_reference") {
        assert(html.includes("No new image is generated."));
        assert(html.includes("Painting steps"));
        assert(html.includes("Suggested palette"));
      } else {
        ordered(html, [
          "Main coaching point",
          "What works well",
          "What to improve",
          "Next 15-minute practice",
          "Explore your feedback",
        ]);
        assert(
          html.includes(
            "The quiet blue-green palette creates a peaceful mood.",
          ),
        );
        assert(html.includes("Full coaching note"));
        assert(html.includes("Full practice note"));
      }
    });

for (const [focus, primary, order] of [
  [
    "Overall feedback",
    null,
    [
      "Visual coaching notes",
      "Planning studies",
      "Composition",
      "Watercolor technique",
      "Colour &amp; value",
    ],
  ],
  [
    "Composition",
    "Composition",
    [
      "Composition",
      "Planning studies",
      "Visual coaching notes",
      "Colour &amp; value",
      "Watercolor technique",
    ],
  ],
  [
    "Colour & contrast",
    "Colour & value",
    [
      "Colour &amp; value",
      "Planning studies",
      "Visual coaching notes",
      "Composition",
      "Watercolor technique",
    ],
  ],
  [
    "Watercolor technique",
    "Watercolor technique",
    [
      "Watercolor technique",
      "Planning studies",
      "Visual coaching notes",
      "Composition",
      "Colour &amp; value",
    ],
  ],
])
  test(`${focus}: same source fixture promotes its domain and orders Explore without duplicate sections`, () => {
    const html = render("improve_painting", "openai", image, notes, {
      focus,
      saved,
      expandedAids: false,
    });
    ordered(html, [
      "Main coaching point",
      "What works well",
      "What to improve",
      "Next 15-minute practice",
      "Explore your feedback",
    ]);
    const explore = html.slice(html.indexOf("Explore your feedback"));
    ordered(
      explore,
      order.filter((title) => explore.includes(title)),
    );
    for (const title of [
      "Composition",
      "Colour & value",
      "Watercolor technique",
      "Planning studies",
      "Visual coaching notes",
      "Sketch & value plan",
      "Ask a follow-up",
    ])
      if (
        title !== "Planning studies" ||
        html.includes(aria(title, title === primary))
      )
        assert(html.includes(aria(title, title === primary)), title);
    assert.equal(
      (html.match(/aria-label="Planning studies"/g) || []).length,
      focus === "Watercolor technique" ? 0 : 1,
    );
    if (focus === "Composition") {
      assert(html.includes(canonical.compositionImplication));
      assert(!html.includes(brushPlan[0].timing));
      assert(!html.includes("Suggested palette"));
    } else if (focus === "Colour & contrast") {
      assert(html.includes(canonical.colourImplication));
      assert(html.includes("Suggested palette"));
      assert(!html.includes(brushPlan[0].timing));
    } else if (focus === "Watercolor technique") {
      assert(html.includes(canonical.techniqueImplication));
      assert(html.includes(brushPlan[0].timing));
      assert(!html.includes("Suggested palette"));
    } else {
      assert(!html.includes(brushPlan[0].timing));
      assert(!html.includes("Suggested palette"));
      assert(!html.includes("Teaching model"));
      assert(!html.includes("Study overlay on your image"));
    }
    assert(!html.includes("What is promising"));
    assert(html.includes("Why this is worth developing"));
    assert(html.includes(">3 notes<"));
    assert(!html.includes("Extra detail"));
  });

test("unified Planning studies has one three-card budget and honest loading fallbacks", () => {
  const html = render("improve_painting", "openai", image, notes, {
    saved,
    openSection: "planning",
    expandedAids: false,
  });
  assert(html.includes(aria("Planning studies", true)));
  const backed = (
    html.match(/Generic study aid · adapt it to your painting\./g) || []
  ).length;
  const models = (
    html.match(/Teaching model · not an exact copy of your painting\./g) || []
  ).length;
  assert(backed >= 1 && backed <= 2);
  assert(models <= 1);
  assert(backed + models <= 3);
  assert(!html.includes("Generated painting"));
  assert(!html.includes("Brush &amp; wash plan</span>"));
});

test("resolved work keeps specific strengths, optional study language and no forced correction", () => {
  const strong = {
    ...saved,
    coachingMode: "study",
    coachingDecision: {
      ...canonical,
      primaryGoal:
        "The reserved pavilion light and connected shadows create a clear focal hierarchy.",
      currentPaintingAction: null,
    },
    whatToFix: [
      "One possible variation would be a quieter foreground in a separate study.",
    ],
    prompt: "How can I practise this kind of edge control?",
  };
  for (const mode of ["improve_painting", "create_reference"]) {
    const html = render(mode, "openai", image, notes, { saved: strong });
    for (const title of [
      "What makes this work",
      "Advanced observations",
      "Optional refinements",
    ])
      assert(html.includes(title));
    assert(
      !/Main issue|You should fix|This weakens the painting|Correct this|Try now on this painting/.test(
        html,
      ),
    );
    assert(html.includes(strong.whatWorks[0]));
    assert(html.includes("How to practise this handling"));
    if (mode === "improve_painting") assert(html.includes("Study observation"));
  }
});

test("an empty strong-work refinement list hides corrections without losing supplied strengths or practice", () => {
  const html = render("improve_painting", "openai", undefined, undefined, {
    saved: { coachingMode: "study", whatToFix: [] },
    focus: "Overall feedback",
    expandedAids: false,
  });
  assert(html.includes("What makes this work"));
  assert(!html.includes("What to improve"));
  assert(!html.includes("Optional refinements"));
  assert(html.includes("Next 15-minute practice"));
  assert(html.includes("Explore your feedback"));
});

test("legacy structural directions remain next-study only; invalid optional data does not crash", () => {
  const html = render("improve_painting", "openai", undefined, undefined, {
    saved: {
      mainAdvice: "Make the house smaller.",
      compositionDecision: {
        mainIssue: 55,
        reason: { bad: true },
        tryNow: "Place the figures farther right.",
        nextStudy: null,
      },
      coachingDecision: { invalid: true },
      palette: [null, { hex: "bad" }],
      paletteStrategy: { bad: true },
      brushPlan: [{ stage: "Broken" }],
    },
  });
  assert(html.includes("Next study: Make the house smaller."));
  assert(html.includes("Place the figures farther right."));
  assert(!html.includes("Suggested palette"));
  assert(!html.includes("Brush &amp; wash plan</span>"));
  assert(html.includes("Explore your feedback"));
  const current =
    html.match(
      /Current painting<\/span>([\s\S]*?)(?:Next study|<\/main>)/,
    )?.[1] || "";
  assert(!current.includes("Place the figures"));
});

test("canonical projection suppresses contradictory secondary advice while preserving the main decision", () => {
  const html = render("improve_painting", "openai", image, notes, {
    saved: {
      ...saved,
      mainAdvice: "Old secondary text.",
      whatToFix: ["Sharpen the pier."],
      practice: "Darken the pier in a small study.",
      brushPlan: [{ ...brushPlan[0], edges: "Sharpen the pier." }],
      composition: "Sharpen the pier.",
    },
  });
  assert(html.includes("Old secondary text.")); // Independent saved main advice is retained.
  assert(!html.includes("Sharpen the pier."));
  assert(!html.includes("Darken the pier in a small study."));
});

test("saved data with missing or unknown focus safely uses Overall; samples ignore live calibration and images", () => {
  for (const focus of [null, "bad focus"]) {
    const html = render("improve_painting", "openai", image, notes, {
      focus,
      saved,
      expandedAids: false,
    });
    assert(html.includes("Your selected focus: Overall feedback"));
    assert(!html.includes('aria-expanded="true"'));
  }
  const mock = render("improve_painting", "mock", image, notes, {
    saved: { ...saved, coachingMode: "study" },
  });
  assert(mock.includes("Sample watercolor guide"));
  assert(!mock.includes("<img"));
  assert(!mock.includes("What makes this work"));
  assert(!mock.includes("Ask a follow-up"));
});

test("follow-up is short, secondary and closed; opening exposes a suggestion without a model operation", () => {
  const html = render("improve_painting", "openai", image, notes, {
    saved,
    expandedAids: false,
    focus: "Overall feedback",
  });
  assert(html.includes(aria("Ask a follow-up", false)));
  assert(html.includes("Ask another coaching question about this painting."));
  const open = render("improve_painting", "openai", image, notes, {
    saved,
    expandedAids: false,
    openSection: "followup",
  });
  assert(open.includes(aria("Ask a follow-up", true)));
  assert(open.includes("How can I make the lake house stand out"));
  assert(!open.includes("Suggested next prompt"));
  const source = fs.readFileSync(
    path.join(root, "components/ResultExperience.tsx"),
    "utf8",
  );
  assert(
    !/\.invoke\(|\.rpc\(|fetch\(|OPENAI_API_KEY|SUPABASE_SERVICE_ROLE_KEY/.test(
      source,
    ),
  );
});

test("same centered two-column desktop hierarchy keeps Explore with coaching; mobile is one column", () => {
  const desktop = render("improve_painting", "openai", image, notes, {
    saved,
    viewportWidth: 1280,
    expandedAids: false,
    focus: "Overall feedback",
  });
  for (const id of [
    "result-container",
    "result-columns",
    "result-visual-column",
    "result-advice-column",
    "explore-feedback",
  ])
    assert(desktop.includes(`data-testid="${id}"`));
  const advice = desktop.slice(
    desktop.indexOf('data-testid="result-advice-column"'),
  );
  ordered(advice, [
    "Main coaching point",
    "Next 15-minute practice",
    "Explore your feedback",
  ]);
  assert(!desktop.includes('aria-expanded="true"'));
  const mobile = render("improve_painting", "openai", image, notes, {
    saved,
    expandedAids: false,
    focus: "Overall feedback",
  });
  assert(!mobile.includes('data-testid="result-columns"'));
  ordered(mobile, [
    "Your painting",
    "Main coaching point",
    "What works well",
    "What to improve",
    "Next 15-minute practice",
    "Explore your feedback",
  ]);
});

test("malformed optional strengths, brush stages and mark geometry leave required coaching readable", () => {
  for (const mode of ["improve_painting", "create_reference"]) {
    const html = render(mode, "openai", image, [{ x: 200 }], {
      saved: {
        whatWorks: [null, 22],
        whatToFix: { bad: true },
        promising: { bad: true },
        brushPlan: [{ stage: "Broken" }],
      },
    });
    assert(!html.includes("What works well"));
    assert(!html.includes("What to improve"));
    assert(!html.includes("Visual coaching notes"));
    assert(!html.includes("Brush &amp; wash plan</span>"));
    assert(html.includes("Next 15-minute practice"));
  }
});

test("painting sequence and diagrams remain honest and accessible without fake generated scenes", () => {
  const source = fs.readFileSync(
    path.join(root, "components/PaintingStepsCard.tsx"),
    "utf8",
  );
  assert(!/MiniWatercolorScene|ArtworkThumbnail|Image\b/.test(source));
  assert(source.includes("{i + 1}"));
  for (const mode of ["improve_painting", "create_reference"]) {
    const html = render(mode, "openai");
    assert(!/^\s*svg\s*$/im.test(html.replace(/<[^>]*>/g, "\n")));
    assert(!/aria-label="svg"/i.test(html));
    assert(!html.includes("0 future study ideas"));
    assert(!html.includes("Generated painting"));
  }
});

test("irrelevant optional domains are omitted instead of producing empty Explore rows", () => {
  const html = render("improve_painting", "openai", undefined, undefined, {
    saved: {
      ...saved,
      palette: null,
      paletteStrategy: null,
      brushPlan: null,
      coachingDecision: {
        ...canonical,
        currentPaintingAction: null,
        nextStudyAction: null,
        compositionImplication: null,
        colourImplication: null,
        techniqueImplication: null,
      },
    },
    focus: "Overall feedback",
    expandedAids: false,
  });
  assert(!html.includes('aria-label="Composition"'));
  assert(!html.includes('aria-label="Colour &amp; value"'));
  assert(!html.includes('aria-label="Watercolor technique"'));
  assert(html.includes("Main coaching point"));
  assert(html.includes("Next 15-minute practice"));
  assert(!html.includes("Planning studies"));
});

const structure = {
  type: "diagonal",
  confidence: 0.9,
  shortExplanation:
    "The shoreline enters at lower left and carries the eye to the pavilion; the quiet trees support that landing.",
  paths: [
    [
      { x: 0.1, y: 0.8 },
      { x: 0.65, y: 0.4 },
    ],
  ],
  focalPoint: { x: 0.65, y: 0.4 },
  secondaryPoints: null,
  masses: null,
};
const readyImageState = {
  2: { uri: image, size: { width: 1200, height: 900 } },
};

test("primary and optional secondary composition interpretations are inspected separately", () => {
  const secondary = {
    ...structure,
    type: "off_centre",
    paths: null,
    shortExplanation:
      "The pavilion sits right of centre, balanced by the quiet left bank.",
  };
  const html = render("improve_painting", "openai", image, notes, {
    saved: {
      ...saved,
      compositionOverlay: structure,
      secondaryCompositionOverlay: secondary,
    },
    openSection: "composition",
    expandedAids: false,
    resultState: readyImageState,
  });
  assert(html.includes(structure.shortExplanation));
  assert(!html.includes(secondary.shortExplanation));
  assert(html.includes('aria-label="Primary structure"'));
  assert(html.includes('aria-label="Secondary structure"'));
  assert(!html.includes("Tertiary structure"));
  const alternate = render("improve_painting", "openai", image, notes, {
    saved: {
      ...saved,
      compositionOverlay: structure,
      secondaryCompositionOverlay: secondary,
    },
    openSection: "composition",
    expandedAids: false,
    resultState: { ...readyImageState, 5: "secondary" },
  });
  assert(alternate.includes(secondary.shortExplanation));
  assert(!alternate.includes(structure.shortExplanation));
});

test("no secondary is forced and identical geometry with different confidence is deduplicated", () => {
  for (const secondary of [
    undefined,
    {
      ...structure,
      confidence: 0.7,
      shortExplanation: "Same structure in other words.",
    },
    { ...structure, confidence: 0.2 },
  ]) {
    const html = render("improve_painting", "openai", image, [], {
      saved: {
        ...saved,
        compositionOverlay: structure,
        secondaryCompositionOverlay: secondary,
      },
      openSection: "composition",
      expandedAids: false,
      resultState: readyImageState,
    });
    assert(!html.includes('aria-label="Secondary structure"'));
    assert(html.includes(structure.shortExplanation));
  }
});

test("visual controls are absent before intrinsic dimensions and offer only useful layers", () => {
  const pending = render("improve_painting", "openai", image, notes, {
    saved: { ...saved, compositionOverlay: structure },
    expandedAids: false,
  });
  assert(!pending.includes('data-testid="visual-layer-controls"'));
  const ready = render("improve_painting", "openai", image, notes, {
    saved: { ...saved, compositionOverlay: structure },
    expandedAids: false,
    resultState: readyImageState,
  });
  assert(ready.includes('aria-label="Hide coaching"'));
  assert(ready.includes('aria-label="Notes view"'));
  assert(ready.includes('aria-label="Composition view"'));
  assert(!ready.includes('aria-label="Roles view"'));
  const hidden = render("improve_painting", "openai", image, notes, {
    saved: { ...saved, compositionOverlay: structure },
    expandedAids: false,
    resultState: { ...readyImageState, 3: false },
  });
  assert(hidden.includes('aria-label="Show coaching"'));
  assert(!hidden.includes('aria-label="Composition view"'));
});

test("old misfiled brush advice appears in Technique and a related-domain tag replaces repetition", () => {
  const recipe = "Use a damp brush to soften the trees in a separate study.";
  const data = {
    ...saved,
    coachingDecision: {
      ...canonical,
      primaryGoal: recipe,
      compositionImplication: recipe,
    },
  };
  const composition = render("improve_painting", "openai", image, notes, {
    saved: data,
    focus: "Composition",
    expandedAids: false,
  });
  assert(!composition.includes(recipe));
  assert(composition.includes("Also affects: Technique"));
  const technique = render("improve_painting", "openai", image, notes, {
    saved: data,
    focus: "Composition",
    openSection: "technique",
    expandedAids: false,
  });
  assert.equal((technique.match(new RegExp(recipe, "g")) || []).length, 1);
});

test("routed paragraphs and actions keep their destination available even when its original implication is absent", () => {
  const design = "In a separate study, move the house to the right.";
  const handling = "In a separate study, practise wet-on-wet.";
  const data = {
    ...saved,
    palette: null,
    brushPlan: null,
    coachingDecision: {
      ...canonical,
      compositionImplication: null,
      colourImplication: design,
      techniqueImplication: null,
      currentPaintingAction: null,
      nextStudyAction: handling,
    },
  };
  const composition = render("improve_painting", "openai", image, [], {
    saved: data,
    focus: "Overall feedback",
    openSection: "composition",
    expandedAids: false,
  });
  assert(composition.includes(aria("Composition", true)));
  assert(composition.includes(design));
  const technique = render("improve_painting", "openai", image, [], {
    saved: data,
    focus: "Overall feedback",
    openSection: "technique",
    expandedAids: false,
  });
  assert(technique.includes(aria("Watercolor technique", true)));
  assert(technique.includes(handling));
});

test("an identical supplied implication has one home and a short related-domain label", () => {
  const observation =
    "The pavilion stays dominant against the quieter distance.";
  const data = {
    ...saved,
    coachingDecision: {
      ...canonical,
      compositionImplication: observation,
      colourImplication: observation,
      techniqueImplication: observation,
    },
  };
  const composition = render("improve_painting", "openai", image, [], {
    saved: data,
    openSection: "composition",
    expandedAids: false,
  });
  assert.equal(
    (composition.match(new RegExp(observation, "g")) || []).length,
    1,
  );
  assert(composition.includes("Also affects: Colour &amp; value, Technique"));
  const colour = render("improve_painting", "openai", image, [], {
    saved: data,
    openSection: "colour",
    expandedAids: false,
  });
  assert(!colour.includes(observation));
});

test("global observations retain Notes mode as full-image context beside an available composition", () => {
  const globalNote = {
    ...notes[0],
    scope: "global",
    classification: "strength",
    evidence: "Large soft shapes stay subordinate to the pavilion's light.",
  };
  const html = render("improve_painting", "openai", image, [globalNote], {
    saved: { ...saved, compositionOverlay: structure },
    expandedAids: false,
    resultState: { ...readyImageState, 0: "visual", 4: "notes" },
  });
  assert(html.includes('aria-label="Notes view" aria-pressed="true"'));
  assert(html.includes('aria-label="Composition view" aria-pressed="false"'));
});

test("one Notes layer opens unified notes and the redundant Open notes trigger is absent", () => {
  const html = render("improve_painting", "openai", image, notes, {
    saved,
    expandedAids: false,
    resultState: readyImageState,
  });
  assert(html.includes('aria-label="Notes view"'));
  assert(!html.includes('aria-label="Open visual coaching notes"'));
  assert(!html.includes(">Open notes<"));
});
test("composition explanation names actual elements, entry, path, landing and supporting hierarchy", () => {
  const teaching = {
    elements: ["cliff", "lighthouse"],
    entry: "Lower left rock",
    path: "Rock edge toward the tower",
    landing: "Pale tower",
    supportingMass: "Low cliff",
    quietMass: "Open water",
    counterbalance: null,
    risk: null,
  };
  const html = render("improve_painting", "openai", image, [], {
    saved: { ...saved, compositionOverlay: { ...structure, teaching } },
    expandedAids: false,
    openSection: "composition",
  });
  for (const text of [
    "Visible elements: cliff, lighthouse",
    "Entry: Lower left rock",
    "Path: Rock edge toward the tower",
    "Landing: Pale tower",
    "Supporting: Low cliff",
    "Quiet: Open water",
  ])
    assert(html.includes(text), text);
  assert(!html.includes("Candidate score"));
});
test("current composition teaching does not repeat its paragraph or invent a generic repair", () => {
  const html = render("improve_painting", "openai", image, [], {
    saved: {
      compositionOverlay: structure,
      composition: structure.shortExplanation,
      coachingDecision: null,
      compositionDecision: null,
    },
    expandedAids: false,
    openSection: "composition",
  });
  assert(html.includes(structure.shortExplanation));
  assert(!html.includes("Composition decision"));
  assert(
    !html.includes(
      "Keep the existing placement. Test a small value or edge change",
    ),
  );
  assert(!html.includes("Current painting"));
});

for (const focus of [
  "Overall feedback",
  "Composition",
  "Colour & contrast",
  "Watercolor technique",
])
  test(`canonical saved result: ${focus} opens the same unified analysis without forced correction`, () => {
    const fixture = require("./helpers/canonical-fixture.cjs")();
    const key = {
      "Overall feedback": "overall",
      Composition: "composition",
      "Colour & contrast": "colourValue",
      "Watercolor technique": "technique",
    }[focus];
    const html = render("improve_painting", "openai", image, undefined, {
      focus,
      canonicalResult: fixture,
      viewportWidth: 1440,
      expandedAids: false,
    });
    assert(html.includes("Painting Assessment"));
    assert(!html.includes('data-testid="expert-view-controls"'));
    assert(html.includes("Highly resolved painting"));
    assert(html.includes("No significant correction is needed"));
    assert(!html.includes("What to improve"));
    const lesson = fixture.canonicalAnalysis.insights.find(
      (i) => i.id === fixture.expertViews[key].summaryId,
    ).lesson;
    assert(html.includes(lesson));
    assert(!html.includes("Your selected view"));
    assert(html.includes("Colour &amp; Value"));
    assert(!html.includes("Open notes"));
  });
test("canonical optional alternatives are explicitly labelled, not presented as defects", () => {
  const fixture = require("./helpers/canonical-fixture.cjs")();
  fixture.canonicalAnalysis.insights.push({
    id: "alternative",
    domain: "technique",
    classification: "stylistic_alternative",
    factIds: ["edges"],
    lesson: "A broken dry accent offers another valid handling choice.",
    action: "Compare it in a separate study.",
  });
  fixture.expertViews.technique.insightIds.push("alternative");
  const html = render("improve_painting", "openai", image, undefined, {
    focus: "Watercolor technique",
    canonicalResult: fixture,
    expandedAids: false,
  });
  assert(html.includes("Stylistic alternative"));
  assert(html.includes("On a separate small study"));
  assert(!html.includes("What to improve"));
});
test("canonical invalid required data renders an explicit saved-analysis error", () => {
  const fixture = require("./helpers/canonical-fixture.cjs")();
  delete fixture.expertViews.technique;
  const html = render("improve_painting", "openai", image, undefined, {
    canonicalResult: fixture,
    expandedAids: false,
  });
  assert(html.includes("We could not open this saved analysis"));
  assert(!html.includes("Lake House"));
});

test("canonical developing analysis stays readable without leaking an unselected refinement into assessment", () => {
  const fixture = require("./helpers/canonical-fixture.cjs")();
  fixture.canonicalAnalysis.qualityAssessment.level = "developing";
  fixture.canonicalAnalysis.insights.forEach(
    (i) => (i.classification = "optional_refinement"),
  );
  const html = render("improve_painting", "openai", image, undefined, {
    focus: "Overall feedback",
    canonicalResult: fixture,
    expandedAids: false,
  });
  assert(html.includes("Painting Assessment"));
  assert(!html.includes('data-testid="expert-view-controls"'));
  assert(!html.includes(fixture.canonicalAnalysis.insights[0].lesson));
  assert(!html.includes("What works well"));
  assert(!html.includes("What makes this work"));
  assert(!html.includes(">What works<"));
  assert(!html.includes("We could not open this saved analysis"));
});

test("unified Colour & Value renders visible relationships and possible mixes without duplicating Suggested Palette", () => {
  const fixture = require("./helpers/canonical-fixture.cjs")();
  fixture.canonicalAnalysis.colourAnalysis =
    require("./helpers/colour-fixture.cjs")();
  const html = render("improve_painting", "openai", image, undefined, {
    canonicalResult: fixture,
    viewportWidth: 1440,
  });
  for (const text of [
    "Visible colour evidence",
    "Value hierarchy",
    "Chroma hierarchy",
    "Colour-mixing starting points",
    "Approximate starting ratio",
    "Possible watercolour pigments",
  ])
    assert(html.includes(text));
  assert(!html.includes("Suggested palette"));
  assert(!html.includes("expert-view-controls"));
});

test("an optional overall refinement is taught once instead of repeated in the assessment", () => {
  const fixture = require("./helpers/canonical-fixture.cjs")();
  const insight = fixture.canonicalAnalysis.insights[0];
  insight.classification = "optional_refinement";
  insight.lesson =
    "A smaller light accent could make the existing hierarchy more selective.";
  insight.action =
    "On a separate study, compare two sizes of the reserved light; keep the bank unchanged and choose the clearer hierarchy.";
  fixture.canonicalAnalysis.facts[0].observation =
    "Additional pale light marks compete with the tower and weaken its selective hierarchy.";
  const html = render("improve_painting", "openai", image, undefined, {
    canonicalResult: fixture,
    viewportWidth: 1440,
  });
  assert.equal(html.split(insight.lesson).length - 1, 1);
  assert(html.includes("How to elevate this painting"));
  assert(html.includes("Optional refinement"));
});
test("repeated colour prose is shown once while the value hierarchy remains first-class", () => {
  const fixture = require("./helpers/canonical-fixture.cjs")();
  const colour = require("./helpers/colour-fixture.cjs")();
  const sentence =
    "The reserved light separates from a broad cool middle-value group.";
  colour.colourStrategy = sentence;
  colour.valueHierarchy = sentence;
  colour.technicalAssessment.explanation = sentence;
  fixture.canonicalAnalysis.colourAnalysis = colour;
  const html = render("improve_painting", "openai", image, undefined, {
    canonicalResult: fixture,
    viewportWidth: 1440,
  });
  assert.equal(html.split(sentence).length - 1, 1);
  assert(html.includes("Value hierarchy"));
});

test("canonical composition retains distinct text teaching when optional structure is absent", () => {
  const fixture = require("./helpers/canonical-fixture.cjs")();
  fixture.canonicalAnalysis.composition.primary = null;
  fixture.canonicalAnalysis.composition.observation =
    "The broad unpainted water holds space around the tower group.";
  const html = render("improve_painting", "openai", image, undefined, {
    focus: "Composition",
    canonicalResult: fixture,
  });
  assert(html.includes(fixture.canonicalAnalysis.composition.observation));
  assert(!html.includes("On your painting · Diagonal"));
});
test("canonical Overall renders at most one supported planning card", () => {
  const fixture = require("./helpers/canonical-fixture.cjs")();
  fixture.canonicalAnalysis.qualityAssessment.level = "developing";
  fixture.canonicalAnalysis.insights[0].lesson =
    "Compare the reserved light and the connected shadow group.";
  fixture.canonicalAnalysis.insights[0].classification = "study_experiment";
  fixture.canonicalAnalysis.insights[0].action =
    "In a separate study, test the reserved light against a connected shadow.";
  fixture.canonicalAnalysis.composition.primary = null;
  fixture.expertViews.overall.practice =
    "Test one connected shadow and reserved light in a 15-minute value study.";
  fixture.canonicalAnalysis.visualEvidence = [
    {
      insightId: "whole",
      roleId: "tower",
      note: {
        id: "light",
        type: "focal_ring",
        category: "focal_point",
        label: "Tower light",
        scope: "local",
        region: { x: 0.56, y: 0.24, width: 0.2, height: 0.3 },
        regionConfidence: 0.92,
        x: 56,
        y: 24,
        width: 20,
        height: 30,
        priority: "high",
        shortInstruction: "Compare this reserved light in a separate study.",
      },
    },
    {
      insightId: "whole",
      roleId: "tower",
      note: {
        id: "dark",
        type: "value_mass",
        category: "value_structure",
        label: "Tower shadow",
        scope: "local",
        region: { x: 0.56, y: 0.24, width: 0.2, height: 0.3 },
        regionConfidence: 0.92,
        x: 56,
        y: 24,
        width: 20,
        height: 30,
        priority: "high",
        shortInstruction: "Compare this connected shadow in a separate study.",
        valueGroup: "dark",
      },
    },
  ];
  const html = render("improve_painting", "openai", image, undefined, {
    focus: "Overall feedback",
    canonicalResult: fixture,
  });
  const labels = (html.match(/Study overlay on your image/g) || []).length;
  assert(labels <= 1);
  assert(!html.includes("2 future study ideas"));
});

for (const [name, classification, action] of [
  [
    "unselected optional critique",
    "optional_refinement",
    "Review the foreground gradation.",
  ],
  [
    "selected optional critique",
    "optional_refinement",
    "On a separate study, soften the lower foreground transition; compare the focal separation.",
  ],
  ["unselected clear issue", "clear_issue", "Review the supplied gradation."],
])
  test(`assessment never hides ${name} beneath status`, () => {
    const r = require("./helpers/canonical-fixture.cjs")();
    r.canonicalAnalysis.qualityAssessment.level = "strong";
    const i = r.canonicalAnalysis.insights[0];
    Object.assign(i, {
      classification,
      lesson: "The foreground-shadow gradation could be softer.",
      action,
    });
    if (name === "selected optional critique")
      r.canonicalAnalysis.facts[0].observation =
        "The lower foreground-shadow edge is abrupt and weakens spatial depth.";
    const html = render("improve_painting", "openai", undefined, undefined, {
      canonicalResult: r,
    });
    const assessment = html
      .split('data-testid="overall-assessment"')[1]
      .split('data-testid="elevation-recommendations"')[0];
    // What works follows assessment, but it contains no corrective overall insight.
    assert(!assessment.includes(i.lesson));
    if (name === "selected optional critique") {
      assert.equal(html.split(i.lesson).length - 1, 1);
      assert(
        html.indexOf(i.lesson) >
          html.indexOf('data-testid="elevation-recommendations"'),
      );
    }
  });

test("unsafe depth advice is absent from recommendations and linked Notes on saved-result reopen", () => {
  const r = require("./helpers/canonical-fixture.cjs")();
  Object.assign(r.canonicalAnalysis.insights[0], {
    classification: "optional_refinement",
    lesson: "Mountain contrast affects atmospheric recession.",
    action: "Darken the distant mountain to improve depth.",
  });
  r.canonicalAnalysis.visualEvidence[0].note.label = "Unsafe mountain advice";
  const html = render("improve_painting", "openai", undefined, undefined, {
    canonicalResult: r,
  });
  assert(!html.includes("Unsafe mountain advice"));
  assert(!html.includes("Darken the distant mountain"));
  assert(!html.includes('data-testid="elevation-recommendations"'));
});

for (const [position, region, point] of [
  ["central", { x: 0.4, y: 0.4, width: 0.2, height: 0.2 }, { x: 0.5, y: 0.5 }],
  [
    "off_centre",
    { x: 0.72, y: 0.65, width: 0.16, height: 0.2 },
    { x: 0.8, y: 0.75 },
  ],
  ["uncertain", null, null],
])
  test(`saved focal-placement copy is consistent with ${position} supplied geometry`, () => {
    const r = require("./helpers/canonical-fixture.cjs")(),
      c = r.canonicalAnalysis;
    c.visualRoles[0].region = region;
    c.visualRoles[0].confidence = region ? 0.9 : null;
    c.composition.primary = {
      ...c.composition.primary,
      type: "off_centre",
      paths: null,
      masses: null,
      focalPoint: point,
    };
    c.composition.observation =
      "Central vertical focus around the boat focal point.";
    c.insights[0].lesson =
      "A central boat focal point holds the surrounding shapes together.";
    c.facts[0].observation =
      "The boat is centrally placed against quiet surrounding water.";
    const before = structuredClone(r);
    const html = render("improve_painting", "openai", image, undefined, {
      canonicalResult: r,
      viewportWidth: 1440,
    });
    if (position !== "central")
      assert(
        !/central boat focal point|Central vertical focus|centrally placed/.test(
          html,
        ),
      );
    if (position !== "off_centre") assert(!html.includes("Off-centre focus"));
    assert(html.includes("Painting Assessment"));
    assert.deepEqual(
      r,
      before,
      "position presentation cannot move canonical geometry",
    );
  });

test("an omitted recommendation cannot retain its technical colour assessment", () => {
  const r = require("./helpers/canonical-fixture.cjs")(),
    c = r.canonicalAnalysis;
  c.colourAnalysis = require("./helpers/colour-fixture.cjs")();
  Object.assign(c.insights[2], {
    classification: "optional_refinement",
    lesson: "The tower perspective is inconsistent.",
    action: "Correct the tower perspective.",
  });
  c.colourAnalysis.technicalAssessment = {
    kind: "issue",
    insightId: "temperature",
    explanation: "ORPHAN_COLOUR_ASSESSMENT",
  };
  const html = render("improve_painting", "openai", image, undefined, {
    canonicalResult: r,
    viewportWidth: 1440,
  });
  assert(!html.includes("ORPHAN_COLOUR_ASSESSMENT"));
  assert(!html.includes("The tower perspective is inconsistent"));
  assert(html.includes("Visible colour evidence"));
});

test("confident positive competent assessment is derived as Strong without changing saved v1", () => {
  const r = require("./helpers/canonical-fixture.cjs")();
  r.canonicalAnalysis.qualityAssessment.level = "competent";
  r.canonicalAnalysis.qualityAssessment.rationale =
    "Clear focal hierarchy and coherent values create balanced structure.";
  const before = structuredClone(r);
  const html = render("improve_painting", "openai", image, undefined, {
    canonicalResult: r,
  });
  assert(html.includes("Strong painting"));
  assert(!html.includes("Competent painting"));
  assert.deepEqual(r, before);
  assert.equal(r.canonicalAnalysis.version, 1);
});

function cleanupRender(canonical) {
  return render(
    "improve_painting",
    "openai",
    "https://example.invalid/original.png",
    undefined,
    { canonicalResult: canonical, viewportWidth: 1440 },
  );
}
test("final cleanup renders Strong from the final safe state and hides unsupported colour critique", () => {
  const r = require("./helpers/final-live-freeze-fixture.cjs")();
  const html = cleanupRender(r);
  assert(html.includes("Strong painting"));
  assert(!html.includes("limiting depth"));
  assert(!html.includes("analogous"));
  assert(!html.includes("Complex neutral"));
  assert(html.includes("Quiet neutral"));
  assert(html.includes("2:1"));
});
for (const [method, label] of [
  ["wet_on_wet", "Wet-on-wet"],
  ["wet_on_dry", "Wet-on-dry"],
  ["damp_on_damp", "Damp-on-damp"],
])
  test(`final cleanup brush technique ${method} is human-readable`, () => {
    const r = require("./helpers/final-live-freeze-fixture.cjs")();
    r.canonicalAnalysis.brushPlan[0].technique = method;
    const html = cleanupRender(r);
    assert(html.includes(label));
    assert(!html.includes(method));
  });
for (const wash of [
  "damp_on_dry",
  "internal_wash_method",
  "wet_on_dry",
  "Try wet-on-dry",
  "Try wet-on-wet",
])
  test(`final cleanup does not show duplicate, unknown or contradictory Wash row: ${wash}`, () => {
    const r = require("./helpers/final-live-freeze-fixture.cjs")();
    r.canonicalAnalysis.brushPlan[0].wash = wash;
    const html = cleanupRender(r);
    assert(!html.includes(">Wash<"));
    assert(html.includes("Wet-on-dry"));
    if (wash.includes("_")) assert(!html.includes(wash));
  });
test("final cleanup readable wash remains future practice with a single reconstruction disclaimer", () => {
  const r = require("./helpers/final-live-freeze-fixture.cjs")();
  r.canonicalAnalysis.brushPlan[0].wash = "Light neutral wash";
  const html = cleanupRender(r);
  assert(html.includes("Light neutral wash"));
  assert(html.includes(">Wash<"));
  assert.equal(
    (html.match(/not a reconstruction of the original process/g) || []).length,
    1,
  );
  assert(!html.includes("A way to test a similar effect on separate paper"));
  assert(!html.includes("For a separate study: soft distant shapes"));
});
test("final cleanup removes foreign tails and observed process terms in a saved v1 result without modifying it", () => {
  const r = require("./helpers/final-live-freeze-fixture.cjs")();
  r.canonicalAnalysis.composition.primary.shortExplanation =
    "The open water and sky remain quiet,低";
  r.canonicalAnalysis.visualRoles[2].area =
    "foreground and background wash areas";
  r.canonicalAnalysis.facts[3].observation =
    "Visible marks is loose, with soft washes and varied edge variation.";
  const before = structuredClone(r),
    html = cleanupRender(r);
  assert(
    !/低|marks is|varied edge variation|wash areas|soft washes/.test(html),
  );
  assert(html.includes("colour passages"));
  assert.deepEqual(r, before);
});
test("final cleanup renders one focal interpretation through notes, rationale and composition", () => {
  const r = require("./helpers/final-live-freeze-fixture.cjs")();
  r.canonicalAnalysis.qualityAssessment.rationale =
    "The bright sky and pier form the clear focal area. Coherent light supports the quiet mood.";
  r.canonicalAnalysis.composition.observation =
    "The pier is the focal subject.";
  const html = cleanupRender(r);
  assert(!html.includes("pier form the clear focal area"));
  assert(!html.includes("pier is the focal subject"));
  assert(html.includes("Coherent light supports"));
  assert(html.includes("One reserved light holds this quiet scene together"));
});

test("final cleanup keeps the existing study-stage safety filter while removing preambles", () => {
  const r = require("./helpers/final-live-freeze-fixture.cjs")();
  r.canonicalAnalysis.brushPlan[0].stage = "Fix the poor background";
  const html = cleanupRender(r);
  assert(!html.includes("Fix the poor background"));
  assert(html.includes("Handling study"));
  assert(html.includes("Wet-on-dry"));
});

for (const kind of ["church", "van", "boat"])
  test(`semantic freeze actual result screen: ${kind} has coherent Strong teaching without hidden critique`, () => {
    const r = require("./helpers/semantic-cleanup-fixture.cjs")(kind),
      before = structuredClone(r);
    const html = cleanupRender(r);
    assert(html.includes("Strong painting"));
    assert(html.includes("Preserve the sharp light-shadow contrast"));
    assert(
      !/room for improvement|solid foundational|technical mastery|refining edges|improving background|contrast contrast|pigment application|is painted with|gauge improvement|perspective accuracy/.test(
        html,
      ),
      html,
    );
    assert(!html.includes(">Stylistic alternative"));
    assert(!html.includes("Increase edge sharpness"));
    if (kind === "church") {
      assert(html.includes("strong value contrast"));
      assert(html.includes("effectively balances"));
    }
    if (kind === "boat")
      assert(
        html.includes(
          "The boat has more defined edges and darker visible passages",
        ),
      );
    assert.deepEqual(r, before);
  });
test("semantic freeze actual result screen retains supported perspective teaching and practice", () => {
  const r = require("./helpers/semantic-cleanup-fixture.cjs")("van"),
    c = r.canonicalAnalysis;
  c.facts.push({
    id: "drawing-problem",
    domain: "overall",
    roleId: null,
    observation: "Inconsistent vehicle perspective flattens spatial depth.",
  });
  c.insights.push({
    id: "drawing-guidance",
    domain: "overall",
    classification: "clear_issue",
    factIds: ["drawing-problem"],
    lesson: "Inconsistent vehicle perspective limits depth.",
    action:
      "On a separate study, align vehicle perspective and compare spatial depth.",
  });
  r.expertViews.overall.practice =
    "On a separate study, paint two vehicle shapes varying only perspective accuracy. Keep values fixed. Compare vehicle perspective to gauge improvement.";
  const html = cleanupRender(r);
  assert(html.includes("perspective accuracy"));
  assert(html.includes("gauge improvement"));
  assert(html.includes("Inconsistent vehicle perspective limits depth"));
});
test("semantic freeze actual result screen keeps genuine artistic comparisons", () => {
  const r = require("./helpers/semantic-cleanup-fixture.cjs")(),
    c = r.canonicalAnalysis;
  c.insights.push({
    id: "valid-alternative",
    domain: "technique",
    classification: "stylistic_alternative",
    factIds: ["edges"],
    lesson:
      "A quieter versus a more graphic focal treatment offers two valid choices.",
    action:
      "Compare the two edge treatments on a separate study, holding values constant and keeping supporting edges below the focal hierarchy.",
  });
  const html = cleanupRender(r);
  assert(html.includes("Stylistic alternative"));
  assert(html.includes("two valid choices"));
  assert(!html.includes("could be enhanced"));
});
