import { Text, View } from "react-native";
import { styles } from "./ui";

export default function FollowUpQuestion({ text }: { text: string }) {
  return (
    <View style={{ gap: 8, paddingHorizontal: 8, paddingVertical: 12 }}>
      <Text style={[styles.heading, { fontSize: 16 }]}>Follow-up question</Text>
      <Text style={styles.caption}>
        Use this if you want another coaching round.
      </Text>
      <Text style={styles.body}>{text}</Text>
    </View>
  );
}
