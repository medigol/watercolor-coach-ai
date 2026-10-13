import { Text, View } from "react-native";
import { Placeholder, styles } from "./ui";
export default function ValueStudyCard({
  description,
}: {
  description: string;
}) {
  return (
    <View style={styles.card}>
      <Text style={styles.heading}>Three-value study</Text>
      <Placeholder
        label="Light · middle · dark — sample placeholder"
        kind="values"
      />
      <Text style={styles.body}>{description}</Text>
    </View>
  );
}
