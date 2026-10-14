import WatercolorSwatch from "./WatercolorSwatch";
import { StyleSheet, Text, View } from "react-native";
import type { PaletteColour } from "../types";
import { colors, styles } from "./ui";
import {
  conciseText,
  studyText,
  uniqueGuidance,
} from "../lib/coachingPresentation";

const safePigmentCodes = new Set(["PB29", "PBr7", "PY43", "PY42"]);
const temperatures = ["warm", "cool", "neutral"] as const;
const tags = {
  main_wash: "Main wash",
  shadow_mix: "Shadow mix",
  accent: "Accent",
  use_sparingly: "Use sparingly",
  focal_accent: "Focal accent",
  atmospheric_distance: "Atmospheric distance",
} as const;
function optionalText(value: unknown, limit: number): string | null {
  return typeof value === "string" && value.trim() && value.length <= limit
    ? value.trim()
    : null;
}

function suggestedPaletteText(value: string): string {
  // Retain suggested options; omit legacy claims about original materials.
  const originalMaterial =
    /\b(?:artist|painter|you|they)\s+(?:(?:clearly|definitely|originally)\s+)?(?:used|chose|mixed|painted with)\b|\b(?:was|were|had been|has been)\s+(?:(?:clearly|definitely|originally)\s+)?(?:used|mixed|painted with)\b|\b(?:original|actual|exact)\s+(?:pigment|paint|colou?r|palette)\b.{0,40}\b(?:is|was|were|used|must be)\b|\b(?:must|clearly|definitely)\s+(?:have\s+)?(?:used|mixed)\b/i;
  return conciseText(
    value
      .trim()
      .split(/(?<=[.!?])\s+|\r?\n+/)
      .filter((sentence) => !originalMaterial.test(sentence))
      .join(" "),
    2,
  );
}
export function paletteGuidance(color: PaletteColour) {
  const name = typeof color.name === "string" ? color.name.toLowerCase() : "";
  const codeMatchesName =
    (color.pigmentCode === "PB29" && /\bultramarine\b/.test(name)) ||
    (color.pigmentCode === "PBr7" && /\bburnt\s+sienna\b/.test(name)) ||
    (["PY43", "PY42"].includes(color.pigmentCode ?? "") &&
      (/\byellow\s+ochre\b/.test(name) || name.trim() === "ochre"));
  return {
    pigmentCode:
      typeof color.pigmentCode === "string" &&
      safePigmentCodes.has(color.pigmentCode) &&
      codeMatchesName
        ? color.pigmentCode
        : null,
    use: optionalText(color.use, 180),
    mix: optionalText(color.mix, 180),
    temperature: temperatures.includes(
      color.temperature as (typeof temperatures)[number],
    )
      ? color.temperature!
      : null,
    tag:
      typeof color.tag === "string" && Object.hasOwn(tags, color.tag)
        ? color.tag
        : null,
  };
}

// Optional palette data must never stop an older saved coaching result opening.
export function usablePalette(value: unknown): PaletteColour[] {
  if (!Array.isArray(value)) return [];
  const result: PaletteColour[] = [];
  for (const item of value.slice(0, 8)) {
    if (!item || typeof item !== "object" || Array.isArray(item)) continue;
    const color = item as Record<string, unknown>;
    if (
      typeof color.name !== "string" ||
      !color.name.trim() ||
      color.name.length > 60 ||
      typeof color.hex !== "string" ||
      !/^#[0-9a-f]{6}$/i.test(color.hex)
    )
      continue;
    const safe: PaletteColour = { name: color.name.trim(), hex: color.hex };
    const guidance = paletteGuidance(color as unknown as PaletteColour);
    if (guidance.pigmentCode) safe.pigmentCode = guidance.pigmentCode;
    if (guidance.use) safe.use = guidance.use;
    if (guidance.mix) safe.mix = guidance.mix;
    if (guidance.temperature) safe.temperature = guidance.temperature;
    if (guidance.tag) safe.tag = guidance.tag;
    result.push(safe);
  }
  return result;
}

export default function PaletteCard({
  palette,
  strategy,
  study = false,
  hideHeading = false,
  omit = [],
}: {
  palette: unknown;
  strategy?: string | null;
  study?: boolean;
  hideHeading?: boolean;
  omit?: string[];
}) {
  const colours = usablePalette(palette).filter(
    (colour) => !!suggestedPaletteText(colour.name),
  );
  if (!colours.length) return null;
  const suppliedStrategy = optionalText(strategy, 350);
  const safeStrategy = suppliedStrategy
    ? suggestedPaletteText(suppliedStrategy)
    : "";
  const paletteStrategy = study ? studyText(safeStrategy, "") : safeStrategy;
  const seen = [...omit];
  const showStrategy = uniqueGuidance([paletteStrategy], seen).length > 0;
  if (showStrategy) seen.push(paletteStrategy);
  const hasCodes = colours.some((color) => color.pigmentCode);
  return (
    <View style={hideHeading ? { gap: 16 } : styles.card}>
      {!hideHeading && <Text style={styles.heading}>Suggested palette</Text>}
      <Text style={styles.caption}>
        Suggested colour options for a study, not identified original pigments.
      </Text>
      {showStrategy && (
        <View style={paletteStyles.strategy}>
          <Text style={paletteStyles.smallHeading}>Palette strategy</Text>
          <Text style={styles.body}>{paletteStrategy}</Text>
        </View>
      )}
      <View style={{ gap: 20 }}>
        {colours.map((color, index) => {
          const { pigmentCode, use, mix, temperature, tag } =
            paletteGuidance(color);
          const notes = [
            ["Suggested role", use],
            ["Mix idea", mix],
          ].flatMap(([label, supplied]) => {
            if (!supplied) return [];
            const option = suggestedPaletteText(supplied);
            const text = study ? studyText(option, "") : option;
            if (!uniqueGuidance([text], seen).length) return [];
            seen.push(text);
            return [{ label, text }];
          });
          return (
            <View
              key={`${color.name}-${index}`}
              style={[paletteStyles.entry, index > 0 && paletteStyles.divider]}
            >
              <View style={paletteStyles.row}>
                <WatercolorSwatch color={color.hex} label={color.name} />
                <View style={{ flex: 1, gap: 7 }}>
                  <Text style={paletteStyles.name}>{color.name}</Text>
                  <View style={paletteStyles.badges}>
                    {pigmentCode && (
                      <Text style={paletteStyles.code}>{pigmentCode}</Text>
                    )}
                    {temperature && (
                      <Text style={paletteStyles.temperature}>
                        {temperature[0].toUpperCase() + temperature.slice(1)}
                      </Text>
                    )}
                    {tag && <Text style={paletteStyles.tag}>{tags[tag]}</Text>}
                  </View>
                </View>
              </View>
              {notes.map(({ label, text }) => (
                <Text key={label} style={paletteStyles.detail}>
                  <Text style={paletteStyles.detailLabel}>{label}: </Text>
                  {text}
                </Text>
              ))}
            </View>
          );
        })}
      </View>
      <View style={paletteStyles.note}>
        <Text style={styles.caption}>
          Approximate swatches · test your mixes on paper.
        </Text>
        {hasCodes && (
          <Text style={styles.caption}>
            Optional pigment suggestions · paint formulations vary.
          </Text>
        )}
      </View>
    </View>
  );
}

const paletteStyles = StyleSheet.create({
  strategy: {
    borderRadius: 14,
    backgroundColor: colors.pale,
    padding: 14,
    gap: 5,
  },
  smallHeading: {
    color: colors.accent,
    fontSize: 13,
    lineHeight: 20,
    fontWeight: "600",
  },
  entry: { gap: 9 },
  divider: { borderTopWidth: 1, borderColor: colors.border, paddingTop: 18 },
  row: { flexDirection: "row", alignItems: "center", gap: 14 },
  badges: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 6,
  },
  name: { color: colors.ink, fontSize: 17, lineHeight: 24, fontWeight: "600" },
  code: {
    color: colors.muted,
    fontSize: 11,
    lineHeight: 19,
  },
  temperature: { color: colors.muted, fontSize: 12, lineHeight: 19 },
  tag: {
    color: colors.accent,
    fontSize: 11,
    lineHeight: 19,
    backgroundColor: colors.pale,
    borderRadius: 5,
    overflow: "hidden",
    paddingHorizontal: 6,
  },
  detail: { color: colors.muted, fontSize: 14, lineHeight: 22 },
  detailLabel: { color: colors.ink, fontWeight: "600" },
  note: {
    borderTopWidth: 1,
    borderColor: colors.border,
    paddingTop: 12,
    gap: 4,
  },
});
