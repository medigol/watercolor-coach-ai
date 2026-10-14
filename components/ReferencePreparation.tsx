import { useEffect, useState } from "react";
import { ActivityIndicator, Image, Pressable, Text, View } from "react-native";
import {
  adjustmentBounds,
  boundedAdjustment,
  defaultAdjustments,
  referenceAspectRatio,
  referenceFilter,
  referenceViewNotes,
  type ReferenceAdjustments,
  type ReferenceView,
} from "../lib/referencePreparation";
import ReferenceImage, { supportsImageAdjustments } from "./ReferenceImage";
import ReferenceAdjustment from "./ReferenceAdjustment";
import { colors, styles } from "./ui";

const views: { id: ReferenceView; label: string }[] = [
  { id: "original", label: "Original" },
  { id: "value", label: "Value" },
  { id: "simplified", label: "Simplified" },
  { id: "adjust", label: "Adjust" },
];
const controls: { id: keyof ReferenceAdjustments; label: string }[] = [
  { id: "contrast", label: "Contrast" },
  { id: "brightness", label: "Brightness" },
  { id: "saturation", label: "Saturation" },
];

export default function ReferencePreparation({
  uri,
  label = "Your photo",
}: {
  uri: string;
  label?: string;
}) {
  const [view, setView] = useState<ReferenceView>("original");
  const [adjustments, setAdjustments] = useState<ReferenceAdjustments>({
    ...defaultAdjustments,
  });
  const [image, setImage] = useState<{ uri: string; ratio: number }>();
  const [failed, setFailed] = useState<string>();
  useEffect(() => {
    let active = true;
    setView("original");
    setAdjustments({ ...defaultAdjustments });
    setFailed(undefined);
    try {
      Image.getSize(
        uri,
        (width, height) => {
          if (!active) return;
          const ratio = referenceAspectRatio(width, height);
          if (ratio !== undefined) setImage({ uri, ratio });
          else setFailed(uri);
        },
        () => {
          if (active) setFailed(uri);
        },
      );
    } catch {
      setFailed(uri);
    }
    return () => {
      active = false;
    };
  }, [uri]);
  const unavailable = failed === uri;
  const ready = image?.uri === uri && !unavailable;

  return (
    <View style={styles.card}>
      <Text style={styles.heading}>Reference preparation</Text>
      <Text style={styles.caption}>
        Use these views to plan big shapes and washes. Do not copy every detail.
      </Text>
      {unavailable ? (
        <Text accessibilityRole="alert" style={styles.body}>
          We could not load this image. Your painting plan and study aids are
          still available below.
        </Text>
      ) : !ready ? (
        <View style={{ gap: 8 }}>
          <ActivityIndicator color={colors.accent} />
          <Text style={styles.caption}>Loading your reference…</Text>
        </View>
      ) : (
        <>
          <View
            style={{
              flexDirection: "row",
              gap: 4,
              padding: 4,
              borderRadius: 14,
              backgroundColor: colors.background,
            }}
          >
            {views.map((option) => {
              const disabled =
                !supportsImageAdjustments && option.id !== "original";
              return (
                <Pressable
                  key={option.id}
                  accessibilityRole="button"
                  accessibilityLabel={`${option.label} reference view`}
                  accessibilityState={{
                    selected: view === option.id,
                    disabled,
                  }}
                  aria-selected={view === option.id}
                  disabled={disabled}
                  onPress={() => setView(option.id)}
                  style={{
                    flex: 1,
                    minHeight: 44,
                    justifyContent: "center",
                    alignItems: "center",
                    borderRadius: 11,
                    backgroundColor:
                      view === option.id ? colors.paper : "transparent",
                    opacity: disabled ? 0.45 : 1,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: "600",
                      color: view === option.id ? colors.accent : colors.muted,
                    }}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <Text style={styles.caption}>
            {label} ·{" "}
            {views.find((option) => option.id === view)?.label.toLowerCase()}{" "}
            view
          </Text>
          <View style={{ alignItems: "center" }}>
            <View
              style={{
                width: "100%",
                maxWidth: 480 * Math.min(image.ratio, 1),
                aspectRatio: image.ratio,
                overflow: "hidden",
                borderRadius: 14,
                backgroundColor: colors.background,
              }}
            >
              <ReferenceImage
                uri={uri}
                label={`${label}: ${view} reference view`}
                filter={referenceFilter(view, adjustments)}
                onError={() => setFailed(uri)}
              />
            </View>
          </View>
          {!supportsImageAdjustments && (
            <Text style={styles.caption}>
              Display adjustments are unavailable here. This view keeps your
              original image unchanged. Plan its light, middle, and dark shapes.
            </Text>
          )}
          <Text style={styles.caption}>{referenceViewNotes[view]}</Text>
          {view === "adjust" && supportsImageAdjustments && (
            <View style={{ gap: 12 }}>
              {controls.map((control) => (
                <View key={control.id}>
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                    }}
                  >
                    <Text style={styles.caption}>{control.label}</Text>
                    <Text style={styles.caption}>
                      {adjustments[control.id]}%
                    </Text>
                  </View>
                  <ReferenceAdjustment
                    label={control.label}
                    value={adjustments[control.id]}
                    {...adjustmentBounds[control.id]}
                    onChange={(value) =>
                      setAdjustments((current) => ({
                        ...current,
                        [control.id]: boundedAdjustment(control.id, value),
                      }))
                    }
                  />
                </View>
              ))}
            </View>
          )}
          {supportsImageAdjustments && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Reset reference preparation"
              onPress={() => {
                setView("original");
                setAdjustments({ ...defaultAdjustments });
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
                style={{
                  ...styles.caption,
                  color: colors.accent,
                  fontWeight: "600",
                }}
              >
                Reset view
              </Text>
            </Pressable>
          )}
          <Text style={styles.caption}>
            Display-only study views. Your saved photo stays unchanged.
          </Text>
        </>
      )}
    </View>
  );
}
