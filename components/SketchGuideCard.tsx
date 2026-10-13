import { Text, View } from "react-native";
import { Placeholder, styles } from "./ui";
export default function SketchGuideCard({
  title = "Sketch guide",
  description,
}: {
  title?: string;
  description: string;
}) {
  return (
    <View style={styles.card}>
      <Text style={styles.heading}>{title}</Text>
      <Placeholder label="Sample sketch placeholder" kind="sketch" />
      <Text style={styles.body}>{description}</Text>
    </View>
  );
}
