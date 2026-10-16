import CoachingOverlay from "./CoachingOverlay";
import { usableOverlays } from "../lib/overlays";
import { ActivityIndicator, Text, Image } from "react-native";
import { Button, Screen, styles, colors } from "./ui";
import { useState, useEffect } from "react";
import type { ImageSize } from "../shared/imageGeometry";
import { drawableCompositionOverlay } from "../shared/visualMetadata";
import { planVisualRoles, type VisualRoleRegion } from "../lib/visualRoles";
export function ResultState({
  loading,
  error,
  retry,
}: {
  loading: boolean;
  error: string;
  retry: () => void;
}) {
  return (
    <Screen>
      {loading ? (
        <>
          <ActivityIndicator color={colors.accent} />
          <Text style={styles.body}>Opening your feedback…</Text>
        </>
      ) : (
        <>
          <Text accessibilityRole="alert" style={styles.body}>
            {error}
          </Text>
          <Button title="Try again" onPress={retry} />
        </>
      )}
    </Screen>
  );
}
export function SavedImage({
  uri,
  label = "Your painting",
  overlays,
  study = false,
  hideNotes = false,
  selectedNote,
  onSelectNote,
  onOpenNotes,
  onImageSize,
  compositionOverlay,
  showComposition = false,
  coachingVisible = true,
  visualMode,
  roleRegions,
  maxImageHeight,
}: {
  uri?: string;
  label?: string;
  overlays?: unknown;
  study?: boolean;
  hideNotes?: boolean;
  selectedNote?: number | null;
  onSelectNote?: (index: number) => void;
  onOpenNotes?: () => void;
  onImageSize?: (size: ImageSize | null) => void;
  compositionOverlay?: unknown;
  showComposition?: boolean;
  coachingVisible?: boolean;
  visualMode?: "notes" | "composition" | "roles";
  roleRegions?: VisualRoleRegion[];
  maxImageHeight?: number;
}) {
  const [failedUri, setFailedUri] = useState<string>();
  const [aspect, setAspect] = useState(1.4);
  useEffect(() => {
    if (!uri || !maxImageHeight) return;
    let alive = true;
    Image.getSize(
      uri,
      (width, height) => {
        if (alive && width > 0 && height > 0) setAspect(width / height);
      },
      () => {},
    );
    return () => {
      alive = false;
    };
  }, [uri, maxImageHeight]);
  if (uri && failedUri === uri)
    return (
      <>
        <Text style={styles.caption}>
          Your image is unavailable. Showing text guidance only.
        </Text>
      </>
    );
  if (
    uri &&
    (usableOverlays(overlays).length ||
      drawableCompositionOverlay(compositionOverlay) ||
      (roleRegions ?? planVisualRoles(overlays, compositionOverlay)).length > 0)
  )
    return (
      <CoachingOverlay
        uri={uri}
        notes={overlays}
        label={label}
        study={study}
        hideNotes={hideNotes}
        selectedNote={selectedNote}
        onSelectNote={onSelectNote}
        onOpenNotes={onOpenNotes}
        onImageSize={onImageSize}
        compositionOverlay={compositionOverlay}
        showComposition={showComposition}
        coachingVisible={coachingVisible}
        visualMode={visualMode}
        roleRegions={roleRegions}
        maxImageHeight={maxImageHeight}
        onImageError={() => setFailedUri(uri)}
      />
    );
  return uri ? (
    <>
      <Text style={styles.caption}>{label}</Text>
      <Image
        source={{ uri }}
        accessibilityLabel={label}
        style={
          maxImageHeight
            ? {
                width: "100%",
                aspectRatio: aspect,
                maxHeight: maxImageHeight,
                borderRadius: 12,
              }
            : { height: 210, width: "100%", borderRadius: 18 }
        }
        resizeMode="contain"
        onError={() => {
          setFailedUri(uri);
          onImageSize?.(null);
        }}
      />
    </>
  ) : null;
}
