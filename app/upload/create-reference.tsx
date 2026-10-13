import { useState } from "react";
import SaveResultButton from "../../components/SaveResultButton";
import { Text } from "react-native";
import ImageSelector from "../../components/ImageSelector";
import { Screen, styles } from "../../components/ui";
import type { ArtworkImage } from "../../lib/artworks";
export default function CreateReference() {
  const [image, setImage] = useState<ArtworkImage>();
  return (
    <Screen>
      <Text style={styles.title}>Create painting reference</Text>
      <Text style={styles.body}>
        Choose a photo, or try our coastal town sample.
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
        Sample guide only. Your photo is not processed yet.
      </Text>
    </Screen>
  );
}
