import { Text, View } from "react-native";
import MiniWatercolorScene from "./MiniWatercolorScene";
import { styles } from "./ui";
export default function SketchStudyCard({
  title = "Sketch guide",
  description,
}: {
  title?: string;
  description: string;
}) {
  return (
    <View style={styles.card}>
      <Text style={styles.heading}>{title}</Text>
      <MiniWatercolorScene
        kind="sketch"
        harbour={title === "Line sketch guide"}
      />
      <Text style={styles.caption}>
        Sample line study · large shapes before details
      </Text>
      <Text style={styles.body}>{description}</Text>
    </View>
  );
}
