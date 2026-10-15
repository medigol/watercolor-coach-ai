import { useState } from "react";
import { Image, Pressable, Text, View } from "react-native";
import {
  cropView,
  type ImageSize,
  type NormalizedRect,
} from "../shared/imageGeometry";
import { colors, styles } from "./ui";

/** A clipped view of the original URI. No image file is created or persisted. */
export default function RegionCrop({
  uri,
  sourceSize,
  region,
  label,
  selected = false,
  desktop = false,
  compact = false,
  onPress,
}: {
  uri: string;
  sourceSize: ImageSize;
  region: NormalizedRect;
  label: string;
  selected?: boolean;
  desktop?: boolean;
  compact?: boolean;
  onPress: () => void;
}) {
  const [failedUri, setFailedUri] = useState<string>();
  const crop = cropView(region, sourceSize, {
    width: compact ? 108 : desktop ? 156 : 240,
    height: compact ? 92 : desktop ? 132 : 156,
  });
  if (!crop || failedUri === uri) return null;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Select image region: ${label}`}
      accessibilityState={{ selected }}
      aria-selected={selected}
      onPress={onPress}
      style={{ alignSelf: "flex-start", gap: 5, minHeight: 44 }}
    >
      <View
        testID="region-crop-viewport"
        style={{
          ...crop.viewport,
          overflow: "hidden",
          borderRadius: 10,
          backgroundColor: colors.paper,
        }}
      >
        <Image
          testID="region-crop-source"
          source={{ uri }}
          accessibilityLabel={`Original image detail: ${label}`}
          resizeMode="contain"
          onError={() => setFailedUri(uri)}
          style={{
            position: "absolute",
            left: crop.image.x,
            top: crop.image.y,
            width: crop.image.width,
            height: crop.image.height,
          }}
        />
        <View
          testID="region-crop-target"
          pointerEvents="none"
          style={{
            position: "absolute",
            left: crop.target.x,
            top: crop.target.y,
            width: crop.target.width,
            height: crop.target.height,
            borderWidth: selected ? 2 : 1,
            borderColor: selected ? colors.accent : colors.ink,
            borderRadius: 3,
          }}
        />
      </View>
      <Text style={[styles.caption, { fontSize: 11 }]}>
        Original image detail
      </Text>
    </Pressable>
  );
}
