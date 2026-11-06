import { Text } from "react-native";
import { Screen, styles } from "./ui";
export default function ReferenceStudio() {
  return (
    <Screen>
      <Text style={styles.title}>Painting Reference Studio</Text>
      <Text style={styles.body}>
        Open the web application in Chrome to prepare and export reference
        pixels. Native image editing is not enabled in this milestone. Existing
        saved reference plans remain available in My Artworks.
      </Text>
    </Screen>
  );
}
