import { Text, View } from "react-native";
import StudyAidVisual from "./StudyAidVisual";
import { colors, styles } from "./ui";
export default function ValueStudyCard({
  description,
}: {
  description: string;
  harbour?: boolean;
}) {
  return (
    <View style={styles.card}>
      <Text style={styles.heading}>Value grouping aid</Text>
      <StudyAidVisual kind="values" />
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 16 }}>
        {[
          ["#F7F5EC", "Light"],
          ["#A4AAA0", "Middle"],
          ["#475952", "Dark"],
        ].map(([color, label]) => (
          <View
            key={label}
            style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
          >
            <View
              style={{
                width: 16,
                height: 12,
                borderRadius: 3,
                backgroundColor: color,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            />
            <Text style={styles.caption}>{label}</Text>
          </View>
        ))}
      </View>
      <Text style={styles.caption}>
        Generic value-study aid · adapt this to your image
      </Text>
      <Text style={styles.body}>{description}</Text>
    </View>
  );
}
