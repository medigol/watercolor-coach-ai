import { Text, View } from "react-native";
import { styles } from "./ui";

export default function FollowUpQuestion({ text }: { text: string }) {
  return (
    <View style={styles.card}>
      <Text style={styles.heading}>Follow-up question</Text>
      <Text style={styles.caption}>
        Use this if you want another coaching round.
      </Text>
      <Text style={styles.body}>{text}</Text>
    </View>
  );
}
