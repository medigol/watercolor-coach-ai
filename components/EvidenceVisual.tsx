import { useState } from "react";
import { Platform, Pressable, Text, View } from "react-native";
import { evidenceCrop, type TeachingEvidence } from "../lib/teachingEvidence";
import {
  containFrame,
  validSize,
  type ImageSize,
} from "../shared/imageGeometry";
import ReferenceImage, { supportsImageAdjustments } from "./ReferenceImage";
import CompositionStructure from "./CompositionStructure";
import { colors, styles } from "./ui";

/** Clipping and grayscale display the ORIGINAL URI. No assets are produced. */
export default function EvidenceVisual({
  uri,
  sourceSize,
  plan,
  onSelect,
}: {
  uri?: string;
  sourceSize?: ImageSize | null;
  plan: TeachingEvidence;
  onSelect?: () => void;
}) {
  const [width, setWidth] = useState(0);
  const [failed, setFailed] = useState<string>();
  if (!uri || failed === uri) return null;
  const value =
    !!plan.value && Platform.OS === "web" && supportsImageAdjustments;
  const cells =
    plan.kind === "comparison"
      ? plan.regions.map((r) => ({ ...r, gray: false }))
      : value
        ? [
            { region: plan.regions[0]?.region, label: "Original", gray: false },
            {
              region: plan.regions[0]?.region,
              label: "Value view · grayscale only",
              gray: true,
            },
          ]
        : [
            {
              region:
                plan.kind === "local" ? plan.regions[0]?.region : undefined,
              label:
                plan.kind === "location"
                  ? (plan.regions[0]?.label ??
                    "Possible object area · future study")
                  : plan.kind === "local"
                    ? plan.regions[0]?.label
                    : "Whole painting",
              gray: false,
            },
          ];
  const cellWidth = Math.max(
    1,
    Math.min(320, (width - (cells.length - 1) * 10) / cells.length),
  );
  let wholeFallbackShown = false;
  return (
    <View
      testID="teaching-evidence"
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      style={{ width: "100%", minWidth: 0, gap: 6 }}
    >
      <View
        style={{
          flexDirection: "row",
          gap: 10,
          alignItems: "flex-start",
          maxWidth: "100%",
        }}
      >
        {cells.map((cell, index) => {
          const size = validSize(sourceSize) ? sourceSize : null;
          const crop =
            size && cell.region
              ? evidenceCrop(cell.region, size, {
                  width: cellWidth,
                  height: 150,
                })
              : null;
          const frame = size
            ? containFrame(size, { width: cellWidth, height: 160 })
            : null;
          // Several unreadable regions share one honest whole-image fallback.
          // An intentional Original/Value pair still keeps its grayscale view.
          if (!crop && !cell.gray) {
            if (wholeFallbackShown) return null;
            wholeFallbackShown = true;
          }
          const viewport = crop?.viewport ?? {
            width: frame?.width ?? cellWidth,
            height: frame?.height ?? 130,
          };
          const image =
            crop?.image ??
            (frame
              ? { ...frame, x: 0, y: 0 }
              : { x: 0, y: 0, width: cellWidth, height: 130 });
          const content = (
            <View
              testID={crop ? "evidence-crop" : "evidence-whole"}
              style={{
                ...viewport,
                overflow: "hidden",
                borderRadius: 8,
                backgroundColor: colors.background,
              }}
            >
              <View
                testID="evidence-source-frame"
                style={{
                  position: "absolute",
                  left: image.x,
                  top: image.y,
                  width: image.width,
                  height: image.height,
                }}
              >
                <ReferenceImage
                  uri={uri}
                  label={`${cell.gray ? "Grayscale value view" : "Original painting evidence"}: ${plan.label}`}
                  filter={cell.gray ? "grayscale(1)" : "none"}
                  onError={() => setFailed(uri)}
                />
              </View>
              {plan.composition && frame && (
                <CompositionStructure
                  overlay={plan.composition}
                  frame={{ ...frame, x: 0, y: 0 }}
                />
              )}
              {plan.kind === "location" && frame && plan.regions[0] && (
                <View
                  testID="future-study-location"
                  pointerEvents="none"
                  style={{
                    position: "absolute",
                    left: plan.regions[0].region.x * frame.width,
                    top: plan.regions[0].region.y * frame.height,
                    width: plan.regions[0].region.width * frame.width,
                    height: plan.regions[0].region.height * frame.height,
                    borderWidth: 1,
                    borderStyle: "dashed",
                    borderColor: colors.accent,
                    backgroundColor: "rgba(35,105,99,0.08)",
                    borderRadius: 6,
                  }}
                />
              )}
            </View>
          );
          return (
            <View
              key={index}
              style={{
                width: viewport.width,
                maxWidth: "100%",
                gap: 4,
                minWidth: 0,
              }}
            >
              {onSelect ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Locate evidence in your painting: ${plan.label}`}
                  onPress={onSelect}
                  style={{
                    minHeight: 44,
                    alignSelf: "flex-start",
                    maxWidth: "100%",
                  }}
                >
                  {content}
                </Pressable>
              ) : (
                content
              )}
              <Text style={[styles.caption, { fontSize: 11 }]}>
                {crop
                  ? cell.label
                  : plan.kind === "location"
                    ? cell.label
                    : cell.gray
                      ? cell.label
                      : "Original painting"}
              </Text>
            </View>
          );
        })}
      </View>
      {!!plan.value && !value && (
        <Text style={styles.caption}>
          Value comparison is available in the web preview. The original is
          shown here.
        </Text>
      )}
    </View>
  );
}
