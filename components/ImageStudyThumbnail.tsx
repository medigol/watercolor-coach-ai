import { useEffect, useRef, useState, type ReactNode } from "react";
import { Image, Text, View } from "react-native";
import { referenceAspectRatio } from "../lib/referencePreparation";
import { imageStudyMarks, type ThumbnailKind } from "../lib/thumbnailPlanning";
import CoachingMarks from "./CoachingMarks";
import ReferenceImage, { supportsImageAdjustments } from "./ReferenceImage";
import { colors, styles } from "./ui";

export default function ImageStudyThumbnail({
  uri,
  kind,
  notes,
  fallback,
}: {
  uri: string;
  kind: ThumbnailKind;
  notes: unknown;
  fallback: ReactNode;
}) {
  const marks = imageStudyMarks(kind, notes);
  const [image, setImage] = useState<{ uri: string; ratio: number }>();
  const [failed, setFailed] = useState<string>();
  const [width, setWidth] = useState(0);
  const imageRequest = useRef({ uri, active: false });
  const usable = marks.length > 0;
  useEffect(() => {
    if (!usable) return;
    const request = { uri, active: true };
    imageRequest.current = request;
    setFailed(undefined);
    try {
      Image.getSize(
        uri,
        (w, h) => {
          if (!request.active) return;
          const ratio = referenceAspectRatio(w, h);
          if (ratio === undefined) setFailed(uri);
          else setImage({ uri, ratio });
        },
        () => {
          if (request.active) setFailed(uri);
        },
      );
    } catch {
      setFailed(uri);
    }
    return () => {
      request.active = false;
    };
  }, [uri, usable]);
  const ready = usable && image?.uri === uri && failed !== uri && width > 0;
  const frameWidth = ready
    ? image.ratio >= width / 220
      ? width
      : 220 * image.ratio
    : 0;
  const frameHeight = ready ? frameWidth / image.ratio : 0;
  const filter = supportsImageAdjustments
    ? kind === "value_mass"
      ? "grayscale(1) contrast(1.12)"
      : "saturate(0.8)"
    : "none";
  const currentRequest = imageRequest.current;
  return (
    <View
      onLayout={(event) => {
        const next = event.nativeEvent.layout.width;
        if (Number.isFinite(next) && next > 0) setWidth(Math.min(next, 1024));
      }}
      style={{ width: "100%", gap: 8 }}
    >
      {ready ? (
        <>
          <View style={{ alignItems: "center" }}>
            <View
              accessible
              accessibilityRole="image"
              accessibilityLabel={`${kind.replace(/_/g, " ")} study overlay on your original image. Use it as a painting guide, not tracing.`}
              style={{
                width: frameWidth,
                height: frameHeight,
                borderRadius: 12,
                overflow: "hidden",
                backgroundColor: colors.background,
              }}
            >
              <View
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  width: "100%",
                  height: "100%",
                  opacity: 0.86,
                }}
              >
                <ReferenceImage
                  uri={uri}
                  label="Original image with planning marks"
                  filter={filter}
                  onError={() => {
                    if (
                      currentRequest.active &&
                      imageRequest.current === currentRequest
                    )
                      setFailed(uri);
                  }}
                />
              </View>
              <View
                pointerEvents="none"
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  width: "100%",
                  height: "100%",
                }}
              >
                <CoachingMarks
                  notes={marks}
                  width={frameWidth}
                  height={frameHeight}
                  selected={kind === "crop" ? 0 : null}
                  onSelect={() => {}}
                />
              </View>
            </View>
          </View>
          <Text style={styles.caption}>Study overlay on your image</Text>
          <Text style={styles.caption}>
            Adapt this to your painting · Use as a guide, not tracing
          </Text>
          {kind === "value_mass" && !supportsImageAdjustments && (
            <Text style={styles.caption}>
              Original colours shown; the value-group marks are your guide.
            </Text>
          )}
        </>
      ) : (
        <>
          {failed === uri && (
            <Text style={styles.caption}>
              This image could not be loaded. Use the planning template below.
            </Text>
          )}
          {fallback}
        </>
      )}
    </View>
  );
}
