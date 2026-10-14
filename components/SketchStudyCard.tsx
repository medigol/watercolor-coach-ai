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
        Generic line-study aid · adapt it to your photo
      </Text>
      <Text style={styles.body}>{description}</Text>
    </View>
  );
}
