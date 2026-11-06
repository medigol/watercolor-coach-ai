import { useState } from "react";
import SaveResultButton from "./SaveResultButton";
import { Text } from "react-native";
import ImageSelector from "./ImageSelector";
import { Screen, styles } from "./ui";
import type { ArtworkImage } from "../lib/artworks";
export default function CreateReference() {
  const [image, setImage] = useState<ArtworkImage>();
  return (
    <Screen>
      <Text style={styles.title}>Create painting reference</Text>
      <Text style={styles.body}>
        Choose your photo to plan the big shapes, colours, and washes.
      </Text>
      <Text style={styles.caption}>
        This text-only workflow uses the existing feedback allowance. It does
        not generate an edited reference image.
      </Text>
      <ImageSelector
        sample="Coastal Town — sample photo placeholder"
        label="Choose photo"
        onSelect={setImage}
      />
      <SaveResultButton
        mode="create_reference"
        image={image}
        title="Create Reference"
      />
      <Text style={styles.caption}>
        Create a plan from your uploaded photo. If it cannot be prepared, you
        can retry here.
      </Text>
    </Screen>
  );
}
