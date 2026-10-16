import { useState } from "react";
import { Text } from "react-native";
import SaveResultButton from "../../components/SaveResultButton";
import ImageSelector from "../../components/ImageSelector";
import { Screen, styles } from "../../components/ui";
import type { ArtworkImage } from "../../lib/artworks";
export default function ImprovePainting() {
  const [image, setImage] = useState<ArtworkImage>();
  const [pending, setPending] = useState(false);
  return (
    <Screen>
      <Text style={styles.caption}>YOUR PAINTING · ONE COMPLETE ANALYSIS</Text>
      <Text style={styles.title}>Improve my painting</Text>
      <Text style={styles.body}>
        Understand what works, what matters, and what to practise next.
      </Text>
      <ImageSelector
        label="Choose painting"
        onSelect={setImage}
        painting
        disabled={pending}
      />
      <SaveResultButton
        mode="improve_painting"
        focus="Overall feedback"
        image={image}
        title="Analyse painting"
        onBusyChange={setPending}
      />
    </Screen>
  );
}
