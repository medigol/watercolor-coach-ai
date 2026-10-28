import { useEffect, useMemo, useRef, useState } from "react";
import {
  Image,
  PanResponder,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { containFrame, type NormalizedRect } from "../shared/imageGeometry";
import {
  fullArtwork,
  cropPixels,
  isFullArtwork,
} from "../shared/artworkPreparation";
import type { ArtworkPreparation } from "../lib/prepareArtwork";
import { Button, colors, styles } from "./ui";
export default function ArtworkCropEditor({
  source,
  region,
  onChange,
  onConfirm,
  onCancel,
  required,
  busy,
}: {
  source: ArtworkPreparation;
  region: NormalizedRect;
  onChange: (r: NormalizedRect) => void;
  onConfirm: () => void;
  onCancel: () => void;
  required: boolean;
  busy: boolean;
}) {
  const [width, setWidth] = useState(300),
    [editing, setEditing] = useState(true);
  const height = Math.min(400, (width * source.height) / source.width),
    frame = containFrame(source, { width, height })!;
  const latest = useRef(region);
  latest.current = region;
  const start = useRef(region);
  const move = (corner: "start" | "end", dx: number, dy: number) => {
    const r = start.current,
      rx = r.x + r.width,
      by = r.y + r.height;
    const x =
      corner === "start"
        ? Math.max(0, Math.min(rx - 0.05, r.x + dx / frame.width))
        : r.x;
    const y =
      corner === "start"
        ? Math.max(0, Math.min(by - 0.05, r.y + dy / frame.height))
        : r.y;
    const right =
      corner === "end"
        ? Math.max(x + 0.05, Math.min(1, rx + dx / frame.width))
        : rx;
    const bottom =
      corner === "end"
        ? Math.max(y + 0.05, Math.min(1, by + dy / frame.height))
        : by;
    onChange({ x, y, width: right - x, height: bottom - y });
  };
  const responders = useMemo(
    () =>
      Object.fromEntries(
        (["start", "end"] as const).map((c) => [
          c,
          PanResponder.create({
            onStartShouldSetPanResponder: () => !busy,
            onMoveShouldSetPanResponder: () => !busy,
            onPanResponderGrant: () => {
              start.current = latest.current;
            },
            onPanResponderMove: (_, g) => move(c, g.dx, g.dy),
            onPanResponderTerminationRequest: () => false,
          }),
        ]),
      ),
    [width, height, busy],
  );
  const previewScale = Math.min(
    width / (region.width * source.width),
    360 / (region.height * source.height),
  );
  const box = {
    left: frame.x + region.x * frame.width,
    top: frame.y + region.y * frame.height,
    width: region.width * frame.width,
    height: region.height * frame.height,
  };
  let valid = true;
  try {
    cropPixels(region, source);
  } catch {
    valid = false;
  }
  const fields = [
    ["Left", region.x],
    ["Top", region.y],
    ["Right", region.x + region.width],
    ["Bottom", region.y + region.height],
  ] as const;
  function field(index: number, value: string) {
    const n = Number(value) / 100;
    if (!Number.isFinite(n) || n < 0 || n > 1) return;
    const sides = fields.map((f) => f[1]);
    sides[index] = n;
    const [x, y, right, bottom] = sides;
    if (right - x >= 0.05 && bottom - y >= 0.05)
      onChange({ x, y, width: right - x, height: bottom - y });
  }
  return (
    <View style={{ gap: 12 }}>
      <Text style={styles.heading}>
        {editing ? "Select the whole painting" : "Confirm artwork crop"}
      </Text>
      <Text style={styles.caption}>
        Keep painted whites and intentional paper margins. Exclude external
        frame, wall and tools. No perspective correction is applied.
      </Text>
      {editing ? (
        <View
          accessibilityLabel="Artwork crop selection"
          onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
          style={{
            width: "100%",
            height,
            backgroundColor: "#fff",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <Image
            source={{ uri: source.uri }}
            accessibilityLabel="Original upright image for crop selection"
            style={{
              position: "absolute",
              left: frame.x,
              top: frame.y,
              width: frame.width,
              height: frame.height,
            }}
            resizeMode="contain"
          />
          <View
            pointerEvents="none"
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              right: 0,
              height: box.top,
              backgroundColor: "#132d3466",
            }}
          />
          <View
            pointerEvents="none"
            style={{
              position: "absolute",
              left: 0,
              top: box.top + box.height,
              right: 0,
              bottom: 0,
              backgroundColor: "#132d3466",
            }}
          />
          <View
            pointerEvents="none"
            style={{
              position: "absolute",
              left: 0,
              top: box.top,
              width: box.left,
              height: box.height,
              backgroundColor: "#132d3466",
            }}
          />
          <View
            pointerEvents="none"
            style={{
              position: "absolute",
              left: box.left + box.width,
              top: box.top,
              right: 0,
              height: box.height,
              backgroundColor: "#132d3466",
            }}
          />
          <View
            pointerEvents="none"
            style={{
              position: "absolute",
              ...box,
              borderWidth: 2,
              borderColor: colors.accent,
            }}
          />
          {(["start", "end"] as const).map((c) => (
            <View
              key={c}
              {...responders[c].panHandlers}
              accessibilityLabel={
                c === "start"
                  ? "Move crop top left; percentage controls below"
                  : "Move crop bottom right; percentage controls below"
              }
              style={{
                position: "absolute",
                left: box.left + (c === "end" ? box.width : 0) - 22,
                top: box.top + (c === "end" ? box.height : 0) - 22,
                width: 44,
                height: 44,
                alignItems: "center",
                justifyContent: "center",
                ...({ touchAction: "none" } as Record<string, string>),
              }}
            >
              <View
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: 8,
                  backgroundColor: colors.accent,
                  borderWidth: 2,
                  borderColor: "#fff",
                }}
              />
            </View>
          ))}
        </View>
      ) : (
        <View
          accessibilityLabel="Selected artwork region to be analysed"
          style={{
            width: "100%",
            height: region.height * source.height * previewScale,
            overflow: "hidden",
            backgroundColor: "#fff",
          }}
        >
          <Image
            source={{ uri: source.uri }}
            accessibilityLabel="Preview of artwork pixels to keep"
            style={{
              position: "absolute",
              width: source.width * previewScale,
              height: source.height * previewScale,
              left:
                (width - region.width * source.width * previewScale) / 2 -
                region.x * source.width * previewScale,
              top: -region.y * source.height * previewScale,
            }}
          />
        </View>
      )}
      {editing && (
        <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
          {fields.map(([label, v], i) => (
            <View key={label} style={{ flex: 1, minWidth: 55, gap: 4 }}>
              <Text style={styles.caption}>{label} %</Text>
              <CropPercentageField
                accessibilityLabel={`Crop ${label.toLowerCase()} percent`}
                editable={!busy}
                percent={v}
                onCommit={(t) => field(i, t)}
                style={{
                  minHeight: 44,
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: 8,
                  padding: 8,
                  color: colors.ink,
                }}
              />
            </View>
          ))}
        </View>
      )}
      {!valid && (
        <Text accessibilityRole="alert" style={styles.caption}>
          Keep a larger artwork area for clear feedback.
        </Text>
      )}
      <Button
        title={
          busy
            ? "Preparing artwork…"
            : editing
              ? "Preview crop"
              : "Confirm crop"
        }
        disabled={busy || !valid || (required && isFullArtwork(region))}
        onPress={editing ? () => setEditing(false) : onConfirm}
      />
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {!editing && (
          <Pressable
            accessibilityRole="button"
            onPress={() => setEditing(true)}
            style={{ minHeight: 44, padding: 12 }}
          >
            <Text style={styles.caption}>Adjust crop</Text>
          </Pressable>
        )}
        <Pressable
          accessibilityRole="button"
          disabled={busy}
          onPress={() => {
            onChange({ ...fullArtwork });
            setEditing(true);
          }}
          style={{ minHeight: 44, padding: 12 }}
        >
          <Text style={styles.caption}>Reset selection</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          disabled={busy}
          onPress={onCancel}
          style={{ minHeight: 44, padding: 12 }}
        >
          <Text style={styles.caption}>Cancel crop</Text>
        </Pressable>
      </View>
    </View>
  );
}

function CropPercentageField({
  percent,
  onCommit,
  ...props
}: Omit<React.ComponentProps<typeof TextInput>, "value" | "onChangeText"> & {
  percent: number;
  onCommit: (text: string) => void;
}) {
  const format = () => String(Math.round(percent * 1000) / 10);
  const [draft, setDraft] = useState(format),
    [focused, setFocused] = useState(false);
  useEffect(() => {
    if (!focused) setDraft(format());
  }, [percent, focused]);
  return (
    <TextInput
      {...props}
      keyboardType="decimal-pad"
      value={draft}
      onFocus={() => setFocused(true)}
      onChangeText={setDraft}
      onBlur={() => {
        onCommit(draft);
        setFocused(false);
      }}
    />
  );
}
