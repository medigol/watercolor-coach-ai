import { useEffect, useState } from "react";
import { Image, Pressable, Text, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { usableOverlays } from "../lib/overlays";
import {
  markMeaning,
  timingLabel,
  studyText,
  conciseText,
} from "../lib/coachingPresentation";
import {
  legendGroup,
  markColors,
  markerPositions,
  type LegendGroup,
} from "../lib/overlayDrawing";
import CoachingMarks from "./CoachingMarks";
import { colors, styles } from "./ui";
const legend: LegendGroup[] = [
  "Focus",
  "Value",
  "Simplify",
  "Edge",
  "Composition",
];
export default function CoachingOverlay({
  uri,
  notes,
  label,
  study = false,
}: {
  uri: string;
  notes: unknown;
  label: string;
  study?: boolean;
}) {
  const [size, setSize] = useState<{ uri: string; ratio: number }>();
  const [failed, setFailed] = useState<string>();
  const [width, setWidth] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [notesOpen, setNotesOpen] = useState(false);
  useEffect(() => {
    let alive = true;
    setSelected(null);
    setNotesOpen(false);
    try {
      Image.getSize(
        uri,
        (w, h) => {
          if (
            alive &&
            Number.isFinite(w) &&
            Number.isFinite(h) &&
            w > 0 &&
            h > 0 &&
            Number.isFinite(w / h) &&
            w / h > 0
          )
            setSize({ uri, ratio: w / h });
          else if (alive) setFailed(uri);
        },
        () => {
          if (alive) setFailed(uri);
        },
      );
    } catch {
      if (alive) setFailed(uri);
    }
    return () => {
      alive = false;
    };
  }, [uri]);
  const valid = usableOverlays(notes);
  if (!valid.length || failed === uri || size?.uri !== uri) return null;
  const imageWidth = Math.min(width, 420 * size.ratio),
    imageHeight = imageWidth / size.ratio;
  const markers = markerPositions(valid, imageWidth, imageHeight);
  const displayed = valid.map((note) =>
    study
      ? {
          ...note,
          label: studyText(
            note.label,
            `${legendGroup(note) === "Simplify" ? "Shape" : legendGroup(note)} study`,
          ),
          shortInstruction: studyText(
            note.shortInstruction,
            "Observe this mark within the wider painting.",
          ),
          reason: studyText(
            note.reason,
            "Compare its relationship with neighbouring shapes, values, and edges.",
          ),
          action: studyText(
            note.action,
            "If useful, test a modest variation on a separate study sheet.",
          ),
        }
      : note,
  );
  const selectNote = (index: number) => {
    if (!Number.isInteger(index) || index < 0 || index >= valid.length) return;
    setSelected(index);
    setNotesOpen(true);
  };
  return (
    <View style={{ gap: 18 }}>
      <Text style={styles.caption}>{label}</Text>
      <View
        onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
        style={{ alignItems: "center", width: "100%" }}
      >
        {width > 0 && (
          <View style={{ width: imageWidth, height: imageHeight }}>
            <Image
              source={{ uri }}
              accessibilityLabel={label}
              resizeMode="contain"
              onError={() => setFailed(uri)}
              style={{ width: "100%", height: "100%", borderRadius: 18 }}
            />
            <CoachingMarks
              notes={valid}
              width={imageWidth}
              height={imageHeight}
              selected={selected}
              onSelect={selectNote}
            />
            {valid.map((note, i) => {
              const { left, top, target } = markers[i];
              const diameter = Math.min(selected === i ? 32 : 26, target);
              return (
                <Pressable
                  key={`${note.id ?? "note"}-${i}`}
                  accessibilityRole="button"
                  accessibilityLabel={`Note ${i + 1}: ${displayed[i].label}`}
                  aria-selected={selected === i}
                  accessibilityState={{ selected: selected === i }}
                  onPress={() => selectNote(i)}
                  style={{
                    position: "absolute",
                    left,
                    top,
                    width: target,
                    height: target,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <View
                    style={{
                      width: diameter,
                      height: diameter,
                      borderRadius: diameter / 2,
                      backgroundColor: markColors[legendGroup(note)],
                      borderWidth: selected === i ? 3 : 2,
                      borderColor: colors.paper,
                      alignItems: "center",
                      justifyContent: "center",
                      shadowColor: colors.ink,
                      shadowOpacity: 0.12,
                      shadowRadius: 3,
                    }}
                  >
                    <Text
                      style={{
                        color: "white",
                        fontWeight: "700",
                        fontSize: Math.min(14, diameter / 2),
                      }}
                    >
                      {i + 1}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}
      </View>
      <View style={{ gap: 6 }}>
        <Text style={styles.heading}>Visual coaching notes</Text>
        <Text style={styles.caption}>
          {study
            ? "Study marks on your original image. Explore painting decisions without tracing them."
            : "Guidance marks on your original image. Use them as painting decisions, not tracing instructions."}
        </Text>
        <Text style={styles.caption}>
          {valid.length} marks · tap a number to open its note
        </Text>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Visual coaching notes"
        accessibilityState={{ expanded: notesOpen }}
        aria-expanded={notesOpen}
        onPress={() => setNotesOpen((open) => !open)}
        style={{
          minHeight: 44,
          justifyContent: "center",
          paddingHorizontal: 14,
          backgroundColor: colors.pale,
          borderRadius: 12,
        }}
      >
        <Text
          style={{ ...styles.caption, color: colors.accent, fontWeight: "600" }}
        >
          {notesOpen ? "Hide notes" : "View notes"}
        </Text>
      </Pressable>
      {notesOpen && (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
          {legend
            .filter((group) =>
              valid.some((note) => legendGroup(note) === group),
            )
            .map((group) => (
              <View
                key={group}
                style={{ flexDirection: "row", alignItems: "center", gap: 5 }}
              >
                {group === "Composition" ? (
                  <Svg
                    width={12}
                    height={12}
                    viewBox="0 0 12 12"
                    accessible={false}
                    aria-hidden={true}
                  >
                    <Path
                      d="M1 11 L11 1 M5 1 L11 1 L11 7"
                      fill="none"
                      stroke={markColors[group]}
                      strokeWidth={1.4}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </Svg>
                ) : (
                  <View
                    style={{
                      width: 12,
                      height: group === "Edge" ? 2 : 10,
                      borderRadius: group === "Focus" ? 6 : 2,
                      backgroundColor:
                        group === "Value" ? markColors[group] : "transparent",
                      borderWidth: group === "Value" ? 0 : 1.5,
                      borderColor: markColors[group],
                      borderStyle:
                        group === "Simplify" || group === "Edge"
                          ? "dotted"
                          : "solid",
                    }}
                  />
                )}
                <Text style={styles.caption}>
                  {study && group === "Simplify" ? "Shapes" : group}
                </Text>
              </View>
            ))}
        </View>
      )}
      {notesOpen &&
        displayed.map((note, i) => {
          const active = selected === i,
            group = legendGroup(note);
          return (
            <Pressable
              key={`${note.id ?? "note"}-${i}`}
              accessibilityRole="button"
              accessibilityLabel={`Note ${i + 1}: ${note.label}. ${note.shortInstruction}${active ? `. ${markMeaning(note, study)} ${study ? "Study this effect" : "Why it matters"}: ${note.reason} ${timingLabel(note, study)}: ${note.action}` : ""}`}
              aria-selected={active}
              aria-expanded={active}
              accessibilityState={{ selected: active, expanded: active }}
              onPress={() => setSelected(active ? null : i)}
              style={[
                styles.card,
                {
                  padding: 18,
                  gap: 10,
                  borderColor: active ? markColors[group] : colors.border,
                  borderWidth: active ? 2 : 1,
                  backgroundColor: active ? colors.pale : colors.paper,
                },
              ]}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 8,
                }}
              >
                <Text
                  style={[
                    styles.caption,
                    { color: markColors[group], fontWeight: "600" },
                  ]}
                >
                  {i + 1} · {group}
                </Text>
                <Text
                  style={[
                    styles.caption,
                    { color: colors.accent, fontSize: 18 },
                  ]}
                >
                  {active ? "−" : "+"}
                </Text>
              </View>
              <Text style={[styles.heading, { fontSize: 18, lineHeight: 25 }]}>
                {note.label}
              </Text>
              <Text style={styles.body}>
                {conciseText(note.shortInstruction)}
              </Text>
              {active && (
                <>
                  <Text
                    style={[
                      styles.caption,
                      { fontWeight: "600", color: colors.ink },
                    ]}
                  >
                    {study ? "Observe this decision" : "What this mark means"}
                  </Text>
                  <Text style={styles.body}>{markMeaning(note, study)}</Text>
                  <Text
                    style={[
                      styles.caption,
                      { fontWeight: "600", color: colors.ink },
                    ]}
                  >
                    {study ? "Study this effect" : "Why it matters"}
                  </Text>
                  <Text style={styles.body}>{note.reason}</Text>
                  <Text
                    style={[
                      styles.caption,
                      { fontWeight: "600", color: colors.ink },
                    ]}
                  >
                    {timingLabel(note, study)}
                  </Text>
                  <Text style={styles.body}>{note.action}</Text>
                </>
              )}
            </Pressable>
          );
        })}
    </View>
  );
}
