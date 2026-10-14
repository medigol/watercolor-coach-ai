import { Text, View } from "react-native";
import MiniWatercolorScene from "./MiniWatercolorScene";
import { colors, styles } from "./ui";
export default function ValueStudyCard({
  description,
  harbour = false,
}: {
  description: string;
  harbour?: boolean;
}) {
  return (
    <View style={styles.card}>
      <Text style={styles.heading}>Three-value study</Text>
      <MiniWatercolorScene kind="values" harbour={harbour} />
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        {[
          ["#EAE6DA", "Light"],
          ["#A4A399", "Middle"],
          ["#4D514C", "Dark"],
        ].map(([color, label]) => (
          <View
            key={label}
            style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
          >
            <View
              style={{
                width: 16,
                height: 12,
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
        Generic value-study aid · group your subject into light, middle, and
        dark
      </Text>
      <Text style={styles.body}>{description}</Text>
    </View>
  );
}
