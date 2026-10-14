import { useEffect, useState } from "react";
import { Image, Pressable, Text, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import {
  usableOverlays,
  type CoachingOverlay as CoachingNote,
} from "../lib/overlays";
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
const priority = { high: 0, medium: 1, low: 2 } as const;

// Curate display density without changing saved geometry or its validation.
export function curatedCoachingNotes(notes: unknown): CoachingNote[] {
  return usableOverlays(notes)
    .map((note, order) => ({ note, order }))
    .sort(
      (a, b) =>
        priority[a.note.priority] - priority[b.note.priority] ||
        a.order - b.order,
    )
    .slice(0, 3)
    .map(({ note }) => note);
}
function displayedNote(note: CoachingNote, study: boolean): CoachingNote {
  return study
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
    : note;
}

// The same panel can live in Explore your feedback or below a standalone image.
export function VisualCoachingNotes({
  notes,
  study = false,
  selected,
  onSelect,
}: {
  notes: unknown;
  study?: boolean;
  selected?: number | null;
  onSelect?: (index: number | null) => void;
}) {
  const [localSelected, setLocalSelected] = useState<number | null>(0);
  const [showAll, setShowAll] = useState(false);
  const [allSelection, setAllSelection] = useState<number | null>(null);
  const valid = curatedCoachingNotes(notes);
  if (!valid.length) return null;
  const requested = selected === undefined ? localSelected : selected;
  const activeIndex =
    requested != null && requested >= 0 && requested < valid.length
      ? requested
      : 0;
  const allVisible = showAll && allSelection === activeIndex;
  const displayed = valid.map((note) => displayedNote(note, study));
  const select = (index: number | null) => {
    setLocalSelected(index);
    onSelect?.(index);
  };
  return (
    <View style={{ gap: 12 }}>
      <Text style={styles.caption}>
        {study
          ? "Study decisions on your original image; these marks are not tracing instructions."
          : "Use these marks as painting decisions, not tracing instructions."}
      </Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
        {legend
          .filter((group) => valid.some((note) => legendGroup(note) === group))
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
      {displayed.map((note, index) => {
        if (!allVisible && index !== activeIndex) return null;
        const active = index === activeIndex;
        const group = legendGroup(note);
        return (
          <Pressable
            key={`${note.id ?? "note"}-${index}`}
            accessibilityRole="button"
            accessibilityLabel={`Note ${index + 1}: ${note.label}. ${note.shortInstruction}${active ? `. ${markMeaning(note, study)} ${study ? "Study this effect" : "Why it matters"}: ${note.reason} ${timingLabel(note, study)}: ${note.action}` : ""}`}
            accessibilityState={{ selected: active, expanded: active }}
            aria-selected={active}
            aria-expanded={active}
            onPress={() => select(index)}
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
            <Text
              style={[
                styles.caption,
                { color: markColors[group], fontWeight: "600" },
              ]}
            >
              {index + 1} · {study && group === "Simplify" ? "Shapes" : group}
            </Text>
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
                <Text style={styles.body}>{conciseText(note.reason, 2)}</Text>
                <Text
                  style={[
                    styles.caption,
                    { fontWeight: "600", color: colors.ink },
                  ]}
                >
                  {timingLabel(note, study)}
                </Text>
                <Text style={styles.body}>{conciseText(note.action, 2)}</Text>
              </>
            )}
          </Pressable>
        );
      })}
      {valid.length > 1 && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            allVisible ? "Show selected note only" : "Show all notes"
          }
          accessibilityState={{ expanded: allVisible }}
          aria-expanded={allVisible}
          onPress={() => {
            setAllSelection(activeIndex);
            setShowAll(!allVisible);
          }}
          style={{
            minHeight: 44,
            justifyContent: "center",
            alignSelf: "flex-start",
            paddingHorizontal: 12,
            borderRadius: 10,
            backgroundColor: colors.pale,
          }}
        >
          <Text
            style={[
              styles.caption,
              { color: colors.accent, fontWeight: "600" },
            ]}
          >
            {allVisible ? "Show selected note only" : "Show all notes"}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

export default function CoachingOverlay({
  uri,
  notes,
  label,
  study = false,
  hideNotes = false,
  selectedNote,
  onSelectNote,
  onOpenNotes,
  onImageError,
}: {
  uri: string;
  notes: unknown;
  label: string;
  study?: boolean;
  hideNotes?: boolean;
  selectedNote?: number | null;
  onSelectNote?: (index: number) => void;
  onOpenNotes?: () => void;
  onImageError?: () => void;
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
    const fail = () => {
      if (alive) {
        setFailed(uri);
        onImageError?.();
      }
    };
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
          else fail();
        },
        fail,
      );
    } catch {
      fail();
    }
    return () => {
      alive = false;
    };
  }, [uri]);
  const valid = curatedCoachingNotes(notes);
  if (!valid.length || failed === uri || size?.uri !== uri) return null;
  const activeIndex = selectedNote === undefined ? selected : selectedNote;
  const imageWidth = Math.min(width, 420 * size.ratio);
  const imageHeight = imageWidth / size.ratio;
  const markers = markerPositions(valid, imageWidth, imageHeight);
  const selectNote = (index: number) => {
    if (!Number.isInteger(index) || index < 0 || index >= valid.length) return;
    setSelected(index);
    setNotesOpen(true);
    onSelectNote?.(index);
  };
  const openNotes = () => {
    if (hideNotes) onOpenNotes?.();
    else {
      if (!notesOpen && activeIndex == null) setSelected(0);
      setNotesOpen((open) => !open);
    }
  };
  return (
    <View style={{ gap: 10 }}>
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
              onError={() => {
                setFailed(uri);
                onImageError?.();
              }}
              style={{ width: "100%", height: "100%", borderRadius: 18 }}
            />
            <CoachingMarks
              notes={valid}
              width={imageWidth}
              height={imageHeight}
              selected={activeIndex}
              onSelect={selectNote}
            />
            {valid.map((note, index) => {
              const { left, top, target } = markers[index];
              const diameter = Math.min(
                activeIndex === index ? 32 : 26,
                target,
              );
              return (
                <Pressable
                  key={`${note.id ?? "note"}-${index}`}
                  accessibilityRole="button"
                  accessibilityLabel={`Note ${index + 1}: ${displayedNote(note, study).label}`}
                  aria-selected={activeIndex === index}
                  accessibilityState={{ selected: activeIndex === index }}
                  onPress={() => selectNote(index)}
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
                      borderWidth: activeIndex === index ? 3 : 2,
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
                      {index + 1}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}
      </View>
      <Text style={styles.caption}>
        {valid.length} coaching {valid.length === 1 ? "note" : "notes"} · tap a
        marker or open notes
      </Text>
      {(!hideNotes || onOpenNotes) && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            hideNotes ? "Open visual coaching notes" : "Visual coaching notes"
          }
          accessibilityState={hideNotes ? undefined : { expanded: notesOpen }}
          aria-expanded={hideNotes ? undefined : notesOpen}
          onPress={openNotes}
          style={{
            minHeight: 44,
            justifyContent: "center",
            paddingHorizontal: 12,
            alignSelf: "flex-start",
            backgroundColor: colors.pale,
            borderRadius: 10,
          }}
        >
          <Text
            style={[
              styles.caption,
              { color: colors.accent, fontWeight: "600" },
            ]}
          >
            {!hideNotes && notesOpen ? "Hide notes" : "Open notes"}
          </Text>
        </Pressable>
      )}
      {!hideNotes && notesOpen && (
        <VisualCoachingNotes
          notes={valid}
          study={study}
          selected={activeIndex}
          onSelect={(index) => setSelected(index)}
        />
      )}
    </View>
  );
}
