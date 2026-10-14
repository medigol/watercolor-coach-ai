import { useEffect, useState } from "react";
import { Image, Pressable, Text, View } from "react-native";
import { usableOverlays } from "../lib/overlays";
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
}: {
  uri: string;
  notes: unknown;
  label: string;
}) {
  const [size, setSize] = useState<{ uri: string; ratio: number }>();
  const [failed, setFailed] = useState<string>();
  const [width, setWidth] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  useEffect(() => {
    let alive = true;
    setSelected(null);
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
            Number.isFinite(w / h)
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
              onSelect={setSelected}
            />
            {valid.map((note, i) => {
              const { left, top, target } = markers[i];
              const diameter = Math.min(28, target);
              return (
                <Pressable
                  key={`${note.id ?? "note"}-${i}`}
                  accessibilityRole="button"
                  accessibilityLabel={`Note ${i + 1}: ${note.label}`}
                  aria-selected={selected === i}
                  accessibilityState={{ selected: selected === i }}
                  onPress={() => setSelected(i)}
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
          Guidance marks on your original image. Use them as painting decisions,
          not tracing instructions.
        </Text>
      </View>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
        {legend.map((group) => (
          <View
            key={group}
            style={{ flexDirection: "row", alignItems: "center", gap: 5 }}
          >
            <View
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: markColors[group],
              }}
            />
            <Text style={styles.caption}>{group}</Text>
          </View>
        ))}
      </View>
      {valid.map((note, i) => {
        const active = selected === i,
          group = legendGroup(note);
        return (
          <Pressable
            key={`${note.id ?? "note"}-${i}`}
            accessibilityRole="button"
            accessibilityLabel={`Note ${i + 1}: ${note.label}. ${note.shortInstruction}. Why it matters: ${note.reason} Try this: ${note.action}`}
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
            <Text
              style={[
                styles.caption,
                { color: markColors[group], fontWeight: "600" },
              ]}
            >
              {i + 1} · {group}
            </Text>
            <Text style={[styles.heading, { fontSize: 18, lineHeight: 25 }]}>
              {note.label}
            </Text>
            <Text style={styles.body}>{note.shortInstruction}</Text>
            {active && (
              <>
                <Text
                  style={[
                    styles.caption,
                    { fontWeight: "600", color: colors.ink },
                  ]}
                >
                  Why it matters
                </Text>
                <Text style={styles.body}>{note.reason}</Text>
                <Text
                  style={[
                    styles.caption,
                    { fontWeight: "600", color: colors.ink },
                  ]}
                >
                  Try this
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
