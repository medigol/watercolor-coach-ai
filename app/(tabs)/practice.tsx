import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";
import { Screen, styles, colors } from "../../components/ui";
import { mockPractices } from "../../data/mockPractices";
export default function Practice() {
  return (
    <Screen>
      <Text style={styles.title}>A little practice</Text>
      <Text style={styles.body}>
        One brush, a small piece of paper, and 15 minutes. Pick an exercise and
        give it a try.
      </Text>
      {mockPractices.map((practice, index) => (
        <View key={practice.title} style={styles.card}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                backgroundColor: index % 2 ? colors.blue : colors.pale,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="brush-outline" color={colors.accent} size={22} />
            </View>
            <View
              style={{
                paddingVertical: 6,
                paddingHorizontal: 10,
                backgroundColor: colors.background,
                borderRadius: 9,
              }}
            >
              <Text
                style={{
                  color: colors.accent,
                  fontWeight: "600",
                  fontSize: 12,
                }}
              >
                15 minutes
              </Text>
            </View>
          </View>
          <Text style={styles.heading}>{practice.title}</Text>
          <Text style={styles.body}>{practice.description}</Text>
          {practice.steps.map((step, i) => (
            <Text key={step} style={styles.body}>
              {i + 1}. {step}
            </Text>
          ))}
        </View>
      ))}
    </Screen>
  );
}
