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
      {mockPractices.map((practice) => (
        <View key={practice.title} style={styles.card}>
          <Text style={{ color: colors.accent, fontWeight: "600" }}>
            15 minutes
          </Text>
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
