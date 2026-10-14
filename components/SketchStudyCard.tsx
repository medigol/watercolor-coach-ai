import { Text, View } from "react-native";
import StudyAidVisual from "./StudyAidVisual";
import { styles } from "./ui";
export default function SketchStudyCard({
  title = "Planning sketch aid",
  description,
}: {
  title?: string;
  description: string;
}) {
  return (
    <View style={styles.card}>
      <Text style={styles.heading}>{title}</Text>
      <StudyAidVisual kind="sketch" />
      <Text style={styles.caption}>
        Generic planning aid · adapt this to your image
      </Text>
      <Text style={styles.body}>{description}</Text>
    </View>
  );
}
