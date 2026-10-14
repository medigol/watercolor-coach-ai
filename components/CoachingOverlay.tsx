import { useEffect, useState } from "react";
import { Image, Pressable, Text, View } from "react-native";
import { overlayAnchor, validOverlays } from "../lib/overlays";
import { colors, styles } from "./ui";

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
            h > 0
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
  if (
    !validOverlays(notes) ||
    !notes.length ||
    failed === uri ||
    size?.uri !== uri
  )
    return null;
  const imageWidth = Math.min(width, 480 * size.ratio);
  const imageHeight = imageWidth / size.ratio;
  return (
    <View style={{ gap: 16 }}>
      <Text style={styles.heading}>Coaching overlay</Text>
      <Text style={styles.caption}>
        Guidance marks on your original image. Tap a number to focus on its
        note.
      </Text>
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
              style={{ width: "100%", height: "100%", borderRadius: 16 }}
            />
            {notes.map((note, i) => {
              const point = overlayAnchor(note);
              // Keep 44px touch targets inside the frame, even at image boundaries.
              const left = Math.max(
                0,
                Math.min(imageWidth - 44, (imageWidth * point.x) / 100 - 22),
              );
              const top = Math.max(
                0,
                Math.min(imageHeight - 44, (imageHeight * point.y) / 100 - 22),
              );
              return (
                <Pressable
                  key={i}
                  accessibilityRole="button"
                  accessibilityLabel={`Note ${i + 1}: ${note.label}`}
                  aria-selected={selected === i}
                  accessibilityState={{ selected: selected === i }}
                  onPress={() => setSelected(i)}
                  style={{
                    position: "absolute",
                    left,
                    top,
                    width: 44,
                    height: 44,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <View
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 14,
                      backgroundColor:
                        selected === i ? colors.ink : colors.accent,
                      borderWidth: 2,
                      borderColor: colors.paper,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Text style={{ color: "white", fontWeight: "700" }}>
                      {i + 1}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}
      </View>
      {notes.map((note, i) => (
        <Pressable
          key={i}
          accessibilityRole="button"
          accessibilityLabel={`Note ${i + 1}: ${note.label}. ${note.shortInstruction}. ${note.reason} ${note.action}`}
          aria-selected={selected === i}
          aria-expanded={selected === i}
          accessibilityState={{
            selected: selected === i,
            expanded: selected === i,
          }}
          onPress={() => setSelected(i)}
          style={[
            styles.card,
            {
              borderColor: selected === i ? colors.accent : colors.border,
              borderWidth: selected === i ? 2 : 1,
            },
          ]}
        >
          <Text style={styles.heading}>
            {i + 1}. {note.label}
          </Text>
          <Text style={styles.body}>{note.shortInstruction}</Text>
          {selected === i && (
            <>
              <Text style={styles.caption}>{note.reason}</Text>
              <Text style={styles.body}>{note.action}</Text>
            </>
          )}
        </Pressable>
      ))}
    </View>
  );
}
