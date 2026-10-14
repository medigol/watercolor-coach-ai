import {
  overlayCategories,
  overlayStyleHints,
  overlayTimings,
  overlayTypes,
  usableOverlays,
  validOverlays,
} from "./overlays.ts";
export const safePigmentCodes = ["PB29", "PBr7", "PY43", "PY42"] as const;
function safePigmentForName(name: string, code: unknown): boolean {
  if (code == null) return true;
  if (code === "PB29") return /\bultramarine\b/i.test(name);
  if (code === "PBr7") return /\bburnt\s+sienna\b/i.test(name);
  if (code === "PY43" || code === "PY42") {
    return /\byellow\s+ochre\b/i.test(name) || /^ochre$/i.test(name.trim());
  }
  return false;
}
export interface CompositionDecision {
  mainIssue?: string | null;
  reason?: string | null;
  tryNow?: string | null;
  nextStudy?: string | null;
}
const boundedText = (value: unknown, max: number) =>
  typeof value === "string" && !!value.trim() && value.length <= max;
function validCompositionDecision(value: unknown): boolean {
  if (value == null) return true;
  if (typeof value !== "object" || Array.isArray(value)) return false;
  const fields = ["mainIssue", "reason", "tryNow", "nextStudy"];
  return Object.entries(value).every(([key, item]) =>
    fields.includes(key) && (item == null || boundedText(item, 350))
  );
}
function validPalette(value: unknown): boolean {
  // Keep the prior eight-item bound for old saved JSON; the prompt prefers 4–7
  // colors at most and fewer when they cover the scene's painting roles.
  return Array.isArray(value) && value.length >= 1 && value.length <= 8 &&
    value.every((p) =>
      p && typeof p === "object" && !Array.isArray(p) &&
      Object.keys(p).every((key) =>
        ["name", "hex", "use", "pigmentCode", "temperature", "mix", "tag"]
          .includes(key)
      ) && boundedText(p.name, 60) && typeof p.hex === "string" &&
      /^#[0-9a-f]{6}$/i.test(p.hex) &&
      (p.use == null || boundedText(p.use, 180)) &&
      (p.pigmentCode == null || safePigmentCodes.includes(p.pigmentCode)) &&
      safePigmentForName(p.name, p.pigmentCode) &&
      (p.temperature == null ||
        ["warm", "cool", "neutral"].includes(p.temperature)) &&
      (p.mix == null || boundedText(p.mix, 180)) &&
      (p.tag == null ||
        ["main_wash", "accent", "use_sparingly"].includes(p.tag))
    );
}
export type Mode = "improve_painting" | "create_reference";
export type Provider = "mock" | "openai";
export interface Input {
  request_id: string;
  mode: Mode;
  focus_area: string | null;
  image_path: string | null;
  expected_user_id: string;
}
export interface Saved {
  id: string;
  provider: Provider;
}
export const limitMessage =
  "You have used your 3 free AI feedback results. More feedback will be available after subscriptions are added.";
export const uuid = (v: unknown): v is string =>
  typeof v === "string" &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
const focuses = [
  "Overall feedback",
  "Composition",
  "Colour & contrast",
  "Watercolor technique",
];
export function validInput(value: unknown, userId: string): value is Input {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const v = value as Record<string, unknown>;
  if (
    Object.keys(v).some(
      (k) =>
        ![
          "request_id",
          "mode",
          "focus_area",
          "image_path",
          "expected_user_id",
        ].includes(k),
    )
  ) {
    return false;
  }
  if (
    !uuid(v.request_id) ||
    v.expected_user_id !== userId ||
    typeof v.mode !== "string" ||
    !["improve_painting", "create_reference"].includes(v.mode)
  ) {
    return false;
  }
  if (
    v.focus_area !== null &&
    (typeof v.focus_area !== "string" || !focuses.includes(v.focus_area))
  ) {
    return false;
  }
  return (
    v.image_path === null ||
    (typeof v.image_path === "string" &&
      v.image_path.startsWith(userId + "/") &&
      /^[a-zA-Z0-9._-]{1,170}$/.test(v.image_path.slice(userId.length + 1)) &&
      !v.image_path.slice(userId.length + 1).startsWith("."))
  );
}
const improveFields = [
  "title",
  "mainAdvice",
  "whatWorks",
  "whatToFix",
  "composition",
  "sketch",
  "values",
  "practice",
  "prompt",
];
const referenceFields = [
  "title",
  "composition",
  "sketch",
  "values",
  "palette",
  "steps",
];
export function validFeedback(
  value: unknown,
  mode: Mode,
): value is Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const v = value as Record<string, unknown>;
  const fields = [
    ...(mode === "improve_painting" ? improveFields : referenceFields),
    ...[
      "overlays",
      "compositionDecision",
      "paletteStrategy",
      ...(mode === "improve_painting" ? ["palette"] : []),
    ]
      .filter((key) => Object.hasOwn(v, key)),
  ];
  if (
    v.overlays !== undefined &&
    v.overlays !== null &&
    !validOverlays(v.overlays)
  ) {
    return false;
  }
  if (
    Object.keys(v).length !== fields.length ||
    Object.keys(v).some((k) => !fields.includes(k))
  ) {
    return false;
  }
  if (
    !validCompositionDecision(v.compositionDecision) ||
    (v.paletteStrategy != null && !boundedText(v.paletteStrategy, 350)) ||
    (mode === "improve_painting" && v.palette != null &&
      !validPalette(v.palette))
  ) return false;
  const text = (s: unknown, max = 700) =>
    typeof s === "string" && s.trim().length > 0 && s.length <= max;
  if (
    !text(v.title, 100) ||
    !["composition", "sketch", "values"].every((k) => text(v[k]))
  ) {
    return false;
  }
  const list = (a: unknown) =>
    Array.isArray(a) &&
    a.length >= 1 &&
    a.length <= 8 &&
    a.every((s) => text(s, 350));
  if (mode === "improve_painting") {
    return (
      ["mainAdvice", "practice", "prompt"].every((k) => text(v[k])) &&
      list(v.whatWorks) &&
      list(v.whatToFix)
    );
  }
  return list(v.steps) && validPalette(v.palette);
}
export function feedbackSchema(mode: Mode) {
  const text = { type: "string" };
  const list = { type: "array", items: text };
  const overlayFields = {
    type: { type: "string", enum: [...overlayTypes] },
    id: { type: ["string", "null"] },
    category: { type: ["string", "null"], enum: [...overlayCategories, null] },
    label: text,
    x: { type: "number" },
    y: { type: "number" },
    width: { type: ["number", "null"] },
    height: { type: ["number", "null"] },
    points: {
      type: ["array", "null"],
      items: {
        type: "object",
        properties: { x: { type: "number" }, y: { type: "number" } },
        required: ["x", "y"],
        additionalProperties: false,
      },
    },
    styleHint: { type: ["string", "null"], enum: [...overlayStyleHints, null] },
    valueGroup: {
      type: ["string", "null"],
      enum: ["light", "middle", "dark", null],
    },
    timing: { type: ["string", "null"], enum: [...overlayTimings, null] },
    priority: { type: "string", enum: ["high", "medium", "low"] },
    shortInstruction: text,
    reason: text,
    action: text,
  };
  const palette = {
    type: "array",
    items: {
      type: "object",
      properties: {
        name: text,
        hex: text,
        use: { type: ["string", "null"] },
        pigmentCode: {
          type: ["string", "null"],
          enum: [...safePigmentCodes, null],
        },
        temperature: {
          type: ["string", "null"],
          enum: ["warm", "cool", "neutral", null],
        },
        mix: { type: ["string", "null"] },
        tag: {
          type: ["string", "null"],
          enum: ["main_wash", "accent", "use_sparingly", null],
        },
      },
      required: [
        "name",
        "hex",
        "use",
        "pigmentCode",
        "temperature",
        "mix",
        "tag",
      ],
      additionalProperties: false,
    },
  };
  const decisionFields = {
    mainIssue: { type: ["string", "null"] },
    reason: { type: ["string", "null"] },
    tryNow: { type: ["string", "null"] },
    nextStudy: { type: ["string", "null"] },
  };
  const common = {
    title: text,
    composition: text,
    sketch: text,
    values: text,
    compositionDecision: {
      type: ["object", "null"],
      properties: decisionFields,
      required: Object.keys(decisionFields),
      additionalProperties: false,
    },
    paletteStrategy: { type: ["string", "null"] },
    overlays: {
      type: ["array", "null"],
      items: {
        type: "object",
        properties: overlayFields,
        required: Object.keys(overlayFields),
        additionalProperties: false,
      },
    },
  };
  const properties = mode === "improve_painting"
    ? {
      ...common,
      mainAdvice: text,
      whatWorks: list,
      whatToFix: list,
      practice: text,
      prompt: text,
      palette: { ...palette, type: ["array", "null"] },
    }
    : {
      ...common,
      palette,
      steps: list,
    };
  return {
    type: "object",
    properties,
    required: Object.keys(properties),
    additionalProperties: false,
  };
}
export async function readLimited(
  body: ReadableStream<Uint8Array> | null,
  max: number,
  milliseconds = 5000,
): Promise<string> {
  if (!body) throw new Error("Empty body");
  const reader = body.getReader();
  let total = 0;
  const chunks: Uint8Array[] = [];
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error("Body timeout")), milliseconds);
  });
  try {
    while (true) {
      const part = await Promise.race([reader.read(), timeout]);
      if (part.done) break;
      total += part.value.length;
      if (total > max) throw new Error("Body too large");
      chunks.push(part.value);
    }
    const bytes = new Uint8Array(total);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.length;
    }
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } finally {
    clearTimeout(timer);
    void reader.cancel().catch(() => {});
  }
}
export function imageMime(bytes: Uint8Array): string | null {
  if (bytes.length > 10 * 1024 * 1024) return null;
  if (bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) {
    return "image/jpeg";
  }
  if ([137, 80, 78, 71, 13, 10, 26, 10].every((n, i) => bytes[i] === n)) {
    return "image/png";
  }
  if (
    [82, 73, 70, 70].every((n, i) => bytes[i] === n) &&
    [87, 69, 66, 80].every((n, i) => bytes[i + 8] === n)
  ) {
    return "image/webp";
  }
  return null;
}

// Discard malformed optional overlays while preserving valid text coaching.
export function cleanOverlayFeedback(value: unknown): unknown {
  if (!value || typeof value !== "object" || Array.isArray(value)) return value;
  const v = value as Record<string, unknown>;
  if (
    v.overlays === undefined ||
    v.overlays === null ||
    validOverlays(v.overlays)
  ) {
    return value;
  }
  const { overlays: _invalid, ...text } = v;
  const overlays = usableOverlays(v.overlays);
  return overlays.length ? { ...text, overlays } : text;
}
