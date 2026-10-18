import { useEffect, useRef, useState } from "react";
import { Image, Platform, Pressable, Text, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import {
  prepareArtwork,
  pickWebArtwork,
  type ArtworkPreparation,
} from "../lib/prepareArtwork";
import type { ArtworkImage } from "../lib/artworks";
import { fullArtwork } from "../shared/artworkPreparation";
import type { NormalizedRect } from "../shared/imageGeometry";
import ArtworkCropEditor from "./ArtworkCropEditor";
import { Button, styles, colors } from "./ui";
export default function PaintingImageSelector({
  onSelect,
  disabled = false,
}: {
  onSelect?: (image: ArtworkImage | undefined) => void;
  disabled?: boolean;
}) {
  const [source, setSource] = useState<ArtworkPreparation>(),
    [selected, setSelected] = useState<ArtworkImage>(),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [editing, setEditing] = useState(false),
    [required, setRequired] = useState(false),
    [region, setRegion] = useState<NormalizedRect>({ ...fullArtwork });
  const current = useRef<ArtworkPreparation | undefined>(undefined),
    active = useRef(true),
    operation = useRef(false);
  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
      current.current?.dispose();
    };
  }, []);
  async function confirm(s: ArtworkPreparation, r: NormalizedRect) {
    setBusy(true);
    setError("");
    try {
      const result = await s.export(r);
      if (!active.current) return;
      setSelected(result);
      onSelect?.(result);
      setEditing(false);
    } catch (e) {
      if (active.current)
        setError(
          e instanceof Error
            ? e.message
            : "This image could not be prepared. Choose another.",
        );
    } finally {
      if (active.current) setBusy(false);
    }
  }
  async function choose() {
    if (disabled || operation.current) return;
    operation.current = true;
    setError("");
    try {
      let image: ArtworkImage | undefined;
      let release = () => {};
      if (Platform.OS === "web") {
        const picked = await pickWebArtwork();
        image = picked?.image;
        release = picked?.dispose ?? release;
      } else {
        const picked = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ["images"],
          quality: 1,
          exif: false,
        });
        image = picked.canceled ? undefined : picked.assets[0];
      }
      if (!image || !active.current) {
        release();
        return;
      }
      setBusy(true);
      setSelected(undefined);
      onSelect?.(undefined);
      setEditing(false);
      current.current?.dispose();
      current.current = undefined;
      setSource(undefined);
      let next: ArtworkPreparation;
      try {
        next = await prepareArtwork(image);
      } finally {
        release();
      }
      if (!active.current) {
        next.dispose();
        return;
      }
      current.current = next;
      setSource(next);
      setRequired(false);
      const r = next.proposal ?? { ...fullArtwork };
      setRegion(r);
      if (next.proposal) setEditing(true);
      else await confirm(next, r);
    } catch (e) {
      if (active.current)
        setError(
          e instanceof Error
            ? e.message
            : "We could not open your photos. Please choose another image.",
        );
    } finally {
      operation.current = false;
      if (active.current) setBusy(false);
    }
  }
  function edit(external = false) {
    setRequired(external);
    setEditing(true);
    onSelect?.(undefined);
    setError("");
  }
  return (
    <View style={styles.card}>
      {!source ? (
        <View
          style={{
            minHeight: 210,
            justifyContent: "center",
            alignItems: "center",
            gap: 12,
            borderWidth: 1,
            borderStyle: "dashed",
            borderColor: colors.border,
            borderRadius: 12,
            padding: 20,
          }}
        >
          <Text style={styles.heading}>Start with your painting</Text>
          <Text style={[styles.caption, { textAlign: "center" }]}>
            A clear photo or scan · JPEG, PNG or WebP · up to 10 MB
          </Text>
        </View>
      ) : editing ? (
        <ArtworkCropEditor
          source={source}
          region={region}
          onChange={setRegion}
          busy={busy || disabled}
          required={required}
          onConfirm={() => confirm(source, region)}
          onCancel={() => {
            if (selected && !required) {
              setEditing(false);
              onSelect?.(selected);
            } else {
              setEditing(false);
              setSelected(undefined);
              onSelect?.(undefined);
            }
          }}
        />
      ) : selected ? (
        <Image
          source={{ uri: selected.uri }}
          accessibilityLabel="Confirmed artwork preview"
          resizeMode="contain"
          style={{
            width: "100%",
            aspectRatio: (selected.width ?? 1) / (selected.height ?? 1),
            maxHeight: 420,
            backgroundColor: "#fff",
            borderRadius: 12,
          }}
        />
      ) : (
        <Text style={styles.caption}>
          Choose another image or adjust the crop to continue.
        </Text>
      )}
      {source && !editing && (
        <View style={{ gap: 4 }}>
          <Pressable
            accessibilityRole="button"
            disabled={busy || disabled}
            onPress={() => edit(required)}
            style={{ minHeight: 44, padding: 12 }}
          >
            <Text style={styles.caption}>Adjust crop</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            disabled={busy || disabled}
            onPress={() => edit(true)}
            style={{ minHeight: 44, padding: 12 }}
          >
            <Text style={styles.caption}>
              Frame, wall or tools visible? Isolate artwork
            </Text>
          </Pressable>
          <Text style={styles.caption}>
            Already fills the image? No crop is needed. Keep intentional white
            paper and painted edges.
          </Text>
        </View>
      )}
      {source && editing && !required && (
        <Button
          title="Use full image"
          disabled={busy || disabled}
          onPress={() => {
            setRegion({ ...fullArtwork });
            confirm(source, { ...fullArtwork });
          }}
        />
      )}
      <Button
        title={
          busy
            ? "Preparing image…"
            : source
              ? "Choose another image"
              : "Choose painting"
        }
        onPress={choose}
        disabled={busy || disabled}
      />
      {!!error && (
        <Text accessibilityRole="alert" style={styles.caption}>
          {error}
        </Text>
      )}
      <Text style={styles.caption}>
        Preparation stays on this device. Only the confirmed artwork is uploaded
        privately when you choose Analyse painting. Watercolor eligibility is
        checked in that analysis; an uncertain image may need a clearer photo.
      </Text>
    </View>
  );
}
