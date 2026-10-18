import PaintingImageSelector from "./PaintingImageSelector";
import { useState } from "react";
import { Image, Text, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Button, Placeholder, styles, colors } from "./ui";
import { Ionicons } from "@expo/vector-icons";
import type { ArtworkImage } from "../lib/artworks";
export default function ImageSelector({
  sample,
  label,
  onSelect,
  painting = false,
  disabled = false,
}: {
  sample?: string;
  label: string;
  onSelect?: (image: ArtworkImage | undefined) => void;
  painting?: boolean;
  disabled?: boolean;
}) {
  if (painting) return <PaintingImageSelector onSelect={onSelect} disabled={disabled} />;
  return <PhotoSelector sample={sample} label={label} onSelect={onSelect} disabled={disabled} />;
}
function PhotoSelector({sample,label,onSelect,disabled=false}:{sample?:string;label:string;onSelect?:(image:ArtworkImage|undefined)=>void;disabled?:boolean}){
  const painting = false;
  const [uri, setUri] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const [failedUri, setFailedUri] = useState<string>();
  const [ratio, setRatio] = useState(1.4);
  async function select() {
    setBusy(true);
    setError(undefined);
    try {
      // The system photo picker does not require full library access.
      // Open it directly from the press event to preserve web user activation.
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        quality: 0.8,
      });
      if (!result.canceled && result.assets[0]) {
        setUri(result.assets[0].uri);
        const asset = result.assets[0];
        if (asset.width > 0 && asset.height > 0)
          setRatio(asset.width / asset.height);
        onSelect?.(result.assets[0]);
      }
    } catch {
      setError(
        "We could not open your photos. Please try choosing an image again.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <View style={styles.card}>
      {uri && failedUri !== uri ? (
        <Image
          source={{ uri }}
          accessibilityLabel="Selected image preview"
          style={
            painting
              ? {
                  width: "100%",
                  aspectRatio: ratio,
                  maxHeight: 500,
                  borderRadius: 12,
                }
              : { width: "100%", height: 200, borderRadius: 14 }
          }
          resizeMode="contain"
          onError={() => {
            setFailedUri(uri);
            setError(
              "We could not preview this image. Please choose another image if feedback cannot be prepared.",
            );
          }}
        />
      ) : painting ? (
        <View
          style={{
            minHeight: 230,
            gap: 12,
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 1,
            borderStyle: "dashed",
            borderColor: colors.border,
            borderRadius: 12,
            backgroundColor: colors.background,
            padding: 20,
          }}
        >
          <Ionicons name="image-outline" size={36} color={colors.accent} />
          <Text style={styles.heading}>Start with your painting</Text>
          <Text style={[styles.caption, { textAlign: "center" }]}>
            A clear photo or scan · JPEG, PNG or WebP · up to 10 MB
          </Text>
        </View>
      ) : (
        <Placeholder label={sample ?? "Choose your photo"} />
      )}
      <Button
        title={busy ? "Opening photos…" : uri ? "Choose another image" : label}
        onPress={select}
        disabled={busy || disabled}
      />
      {error && (
        <Text accessibilityRole="alert" style={styles.caption}>
          {error}
        </Text>
      )}
      <Text style={styles.caption}>
        {painting
          ? "Your painting is private to your account and sent for analysis only when you choose Analyse painting."
          : "Your image is stored privately for feedback. If feedback cannot be prepared, you can retry here."}
      </Text>
    </View>
  );
}
