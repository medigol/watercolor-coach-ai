import { Text, View } from "react-native";
import { colors, styles } from "./ui";
export default function FeedbackSection({
  title,
  text,
  items,
  highlight = false,
}: {
  title: string;
  text?: string;
  items?: string[];
  highlight?: boolean;
}) {
  return (
    <View style={[styles.card, highlight && { backgroundColor: colors.pale }]}>
      <Text style={styles.heading}>{title}</Text>
      {text && <Text style={styles.body}>{text}</Text>}
      {items?.map((item) => (
        <Text key={item} style={styles.body}>
          • {item}
        </Text>
      ))}
    </View>
  );
}
