import { useEffect, useState } from "react";
import {
  Image,
  Pressable,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import Svg, { Path } from "react-native-svg";
import {
  usableOverlays,
  type CoachingOverlay as CoachingNote,
} from "../lib/overlays";
import { timingLabel, conciseText } from "../lib/coachingPresentation";
import {
  legendGroup,
  markColors,
  markerPositions,
  type LegendGroup,
} from "../lib/overlayDrawing";
import CoachingMarks from "./CoachingMarks";
import CompositionStructure from "./CompositionStructure";
import RegionCrop from "./RegionCrop";
import VisualRoleMap from "./VisualRoleMap";
import { planVisualRoles, type VisualRoleRegion } from "../lib/visualRoles";
import { presentedLocalNote as displayedNote } from "../lib/localNotePresentation";
import { sourceAreaCaption } from "../lib/teachingEvidence";
import {
  containFrame,
  noteRegions,
  noteGeometryVisible,
  type NormalizedRect,
  type ImageSize,
} from "../shared/imageGeometry";
import {
  effectiveClassification,
  classificationLabel,
  domainLabel,
  drawableCompositionOverlay,
  explicitGuidanceDomain,
} from "../shared/visualMetadata";
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
// Reuse image evidence when several concise notes discuss the same passage.
function matchingRegion(a: NormalizedRect, b: NormalizedRect): boolean {
  const intersection =
    Math.max(0, Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x)) *
    Math.max(0, Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y));
  const union = a.width * a.height + b.width * b.height - intersection;
  return union > 0 && intersection / union > 0.9;
}

// The same panel can live in Explore your feedback or below a standalone image.
export function VisualCoachingNotes({
  notes,
  study = false,
  selected,
  onSelect,
  uri,
  sourceSize,
  evidenceReferences = {},
  onShowEvidence,
}: {
  notes: unknown;
  study?: boolean;
  selected?: number | null;
  onSelect?: (index: number | null) => void;
  uri?: string;
  sourceSize?: ImageSize | null;
  evidenceReferences?: Record<string, string>;
  onShowEvidence?: (key: string) => void;
}) {
  const { width: viewportWidth } = useWindowDimensions();
  const desktop = viewportWidth >= 960;
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
  const displayed = valid.map((note) => {
    const presented = displayedNote(note, study);
    const label = sourceAreaCaption(presented.label);
    const clean = (value?: string | null) =>
      (value ?? "").replace(/\brelated passages?(?:\s+\d+)?\b/gi, label);
    return {
      ...presented,
      label,
      shortInstruction: clean(presented.shortInstruction),
      evidence: clean(presented.evidence),
      reason: clean(presented.reason),
      action: clean(presented.action),
    };
  });
  const visualEvidence: { region: NormalizedRect; owner: number }[] = [];
  const cropRegions = new Map<number, NormalizedRect[]>();
  const sharedContext = new Map<number, number>();
  for (const index of [
    activeIndex,
    ...valid.map((_, index) => index).filter((index) => index !== activeIndex),
  ]) {
    const regions: NormalizedRect[] = [];
    const candidates = noteGeometryVisible(valid[index])
      ? noteRegions(valid[index]).slice(0, 3)
      : [];
    const distinctContexts = candidates.filter(
      (region, position) =>
        !candidates
          .slice(0, position)
          .some((other) => matchingRegion(region, other)),
    );
    const contextualRegions =
      valid[index].scope === "multi_region" && distinctContexts.length < 2
        ? []
        : distinctContexts;
    for (const region of contextualRegions) {
      const previous = visualEvidence.find((item) =>
        matchingRegion(item.region, region),
      );
      if (previous) {
        if (previous.owner !== index) sharedContext.set(index, previous.owner);
      } else {
        regions.push(region);
        visualEvidence.push({ region, owner: index });
      }
    }
    cropRegions.set(index, regions);
  }
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
          .filter((group) =>
            valid.some(
              (note) =>
                noteGeometryVisible(note) && legendGroup(note) === group,
            ),
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
      {displayed.map((note, index) => {
        if (!allVisible && index !== activeIndex) return null;
        const active = index === activeIndex;
        const group = legendGroup(note);
        const classification = effectiveClassification(valid[index], study);
        const domain =
          note.domain ??
          explicitGuidanceDomain(
            `${valid[index].shortInstruction}. ${valid[index].action}`,
          ) ??
          (group === "Value"
            ? "colour_value"
            : group === "Edge"
              ? "technique"
              : "composition");
        const regions = cropRegions.get(index) ?? [];
        const linkedEvidence = note.id
          ? evidenceReferences[note.id]
          : undefined;
        const sharedOwner = sharedContext.get(index);
        const evidenceKey = (value: unknown) =>
          typeof value === "string"
            ? value.toLowerCase().replace(/\s+/g, " ").trim()
            : "";
        const reusedEvidence =
          sharedOwner != null &&
          evidenceKey(note.evidence) ===
            evidenceKey(displayed[sharedOwner].evidence);
        const evidence =
          !reusedEvidence && typeof note.evidence === "string"
            ? conciseText(note.evidence, 2)
            : "";
        const futureStudy =
          study ||
          classification === "stylistic_alternative" ||
          classification === "study_experiment";
        return (
          <View
            key={`${note.id ?? "note"}-${index}`}
            testID={`coaching-note-${index}`}
            style={[
              styles.card,
              {
                padding: 18,
                gap: 14,
                flexDirection: desktop ? "row" : "column",
                borderColor: active ? markColors[group] : colors.border,
                borderWidth: active ? 2 : 1,
                backgroundColor: active ? colors.pale : colors.paper,
              },
            ]}
          >
            {!linkedEvidence && uri && sourceSize && regions.length > 0 && (
              <View
                style={{
                  gap: 8,
                  flexDirection: desktop ? "column" : "row",
                  flexWrap: "wrap",
                  maxWidth: desktop ? 156 : 240,
                }}
              >
                {regions.map((region, regionIndex) => (
                  <RegionCrop
                    key={regionIndex}
                    uri={uri}
                    sourceSize={sourceSize}
                    region={region}
                    label={
                      regions.length > 1
                        ? sourceAreaCaption(valid[index].label, regionIndex)
                        : note.label
                    }
                    desktop={desktop}
                    compact={regions.length > 1}
                    selected={active}
                    onPress={() => select(index)}
                  />
                ))}
              </View>
            )}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Note ${index + 1}: ${note.label}. ${classificationLabel(classification)}. ${evidence ? `What I see: ${evidence}. ` : ""}${note.shortInstruction}${active ? `. ${study ? "Study this effect" : "Why it matters"}: ${note.reason} ${timingLabel(note, futureStudy)}: ${note.action}` : ""}`}
              accessibilityState={{ selected: active, expanded: active }}
              aria-selected={active}
              aria-expanded={active}
              onPress={() => select(index)}
              style={{
                gap: 10,
                flex: desktop ? 1 : undefined,
                minWidth: 0,
                minHeight: 44,
              }}
            >
              <Text
                style={[
                  styles.caption,
                  { color: markColors[group], fontWeight: "600" },
                ]}
              >
                {index + 1} · {domainLabel(domain)}
                {note.scope === "global"
                  ? " · Whole painting"
                  : note.scope === "multi_region"
                    ? ` · ${sourceAreaCaption(valid[index].label)}`
                    : ""}
              </Text>
              <Text style={[styles.heading, { fontSize: 18, lineHeight: 25 }]}>
                {note.label}
              </Text>
              <Text
                style={[
                  styles.caption,
                  { color: colors.ink, fontWeight: "600" },
                ]}
              >
                {classificationLabel(classification)}
              </Text>
              {note.relatedDomain && note.relatedDomain !== domain && (
                <Text style={styles.caption}>
                  Also affects: {domainLabel(note.relatedDomain)}
                </Text>
              )}
              {evidence && (
                <Text style={styles.body}>What I see: {evidence}</Text>
              )}
              {uri && sourceSize && sharedContext.has(index) && (
                <Text style={styles.caption}>
                  Shared image context with note{" "}
                  {(sharedContext.get(index) ?? 0) + 1}.
                </Text>
              )}
              {!active && (
                <Text style={styles.body}>
                  {conciseText(note.shortInstruction)}
                </Text>
              )}
              {active && !linkedEvidence && (
                <>
                  <Text
                    style={[
                      styles.caption,
                      { fontWeight: "600", color: colors.ink },
                    ]}
                  >
                    {classification === "strength"
                      ? "Why this works"
                      : study
                        ? "Study this effect"
                        : "Why it matters"}
                  </Text>
                  <Text style={styles.body}>{conciseText(note.reason, 2)}</Text>
                  <Text style={styles.body}>
                    {conciseText(note.shortInstruction)}
                  </Text>
                  <Text
                    style={[
                      styles.caption,
                      { fontWeight: "600", color: colors.ink },
                    ]}
                  >
                    {timingLabel(note, futureStudy)}
                  </Text>
                  <Text style={styles.body}>{conciseText(note.action, 2)}</Text>
                </>
              )}
            </Pressable>
            {linkedEvidence && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="See this note's teaching evidence"
                onPress={() => onShowEvidence?.(linkedEvidence)}
                style={{ minHeight: 44, justifyContent: "center" }}
              >
                <Text style={[styles.caption, { color: colors.accent }]}>
                  See this note’s teaching evidence
                </Text>
              </Pressable>
            )}
          </View>
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
  onImageSize,
  compositionOverlay,
  showComposition = false,
  coachingVisible = true,
  visualMode,
  roleRegions,
  maxImageHeight = 420,
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
  onImageSize?: (size: ImageSize | null) => void;
  compositionOverlay?: unknown;
  showComposition?: boolean;
  coachingVisible?: boolean;
  visualMode?: "notes" | "composition" | "roles";
  roleRegions?: VisualRoleRegion[];
  maxImageHeight?: number;
}) {
  const [size, setSize] = useState<{
    uri: string;
    width: number;
    height: number;
  }>();
  const [failed, setFailed] = useState<string>();
  const [width, setWidth] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [notesOpen, setNotesOpen] = useState(false);
  useEffect(() => {
    let alive = true;
    setSelected(null);
    setNotesOpen(false);
    onImageSize?.(null);
    const fail = () => {
      if (alive) {
        setFailed(uri);
        onImageSize?.(null);
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
          ) {
            const intrinsic = { width: w, height: h };
            setSize({ uri, ...intrinsic });
            onImageSize?.(intrinsic);
          } else fail();
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
  const roles = roleRegions ?? planVisualRoles(valid, compositionOverlay);
  const mode = visualMode ?? (showComposition ? "composition" : "notes");
  const notesVisible = coachingVisible && mode === "notes";
  if (
    (!valid.length &&
      !roles.length &&
      !drawableCompositionOverlay(compositionOverlay)) ||
    failed === uri ||
    size?.uri !== uri
  )
    return null;
  const activeIndex = selectedNote === undefined ? selected : selectedNote;
  const fitted = containFrame(size, { width, height: maxImageHeight });
  const imageWidth = fitted?.width ?? 0;
  const imageHeight = fitted?.height ?? 0;
  const imageFrame = containFrame(size, {
    width: imageWidth,
    height: imageHeight,
  });
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
          <View
            testID="coaching-image-frame"
            style={{ width: imageWidth, height: imageHeight }}
          >
            <Image
              testID="coaching-source-image"
              source={{ uri }}
              accessibilityLabel={label}
              resizeMode="contain"
              onError={() => {
                setFailed(uri);
                onImageSize?.(null);
                onImageError?.();
              }}
              style={{ width: "100%", height: "100%", borderRadius: 18 }}
            />
            {coachingVisible && mode === "composition" && imageFrame && (
              <CompositionStructure
                overlay={compositionOverlay}
                frame={imageFrame}
              />
            )}
            {coachingVisible &&
              mode === "roles" &&
              imageFrame &&
              roles.length > 0 && (
                <VisualRoleMap regions={roles} frame={imageFrame} />
              )}
            {notesVisible && (
              <CoachingMarks
                notes={valid}
                width={imageWidth}
                height={imageHeight}
                selected={activeIndex}
                onSelect={selectNote}
              />
            )}
            {notesVisible &&
              valid.map((note, index) => {
                const { left, top, target } = markers[index];
                if (!target || !noteGeometryVisible(note)) return null;
                const diameter = Math.min(
                  activeIndex === index ? 32 : 26,
                  target,
                );
                return (
                  <Pressable
                    key={`${note.id ?? "note"}-${index}`}
                    testID={`coaching-marker-${index}`}
                    accessibilityRole="button"
                    accessibilityLabel={`Note ${index + 1}: ${sourceAreaCaption(displayedNote(note, study).label)}`}
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
      {notesVisible && valid.length > 0 && (
        <Text style={styles.caption}>
          {valid.length} coaching {valid.length === 1 ? "note" : "notes"} ·{" "}
          {valid.some(noteGeometryVisible)
            ? "tap a marker or choose Notes"
            : "choose Notes for whole-painting context"}
        </Text>
      )}
      {notesVisible && valid.length > 0 && !hideNotes && (
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
      {notesVisible && !hideNotes && notesOpen && (
        <VisualCoachingNotes
          notes={valid}
          study={study}
          selected={activeIndex}
          uri={uri}
          sourceSize={size}
          onSelect={(index) => {
            setSelected(index);
            if (index != null) onSelectNote?.(index);
          }}
        />
      )}
    </View>
  );
}
