import { Text, View } from "react-native";
import { styles } from "./ui";
export default function PaintingStepsCard({ steps }: { steps: string[] }) {
  return (
    <View style={styles.card}>
      <Text style={styles.heading}>Painting steps</Text>
      {steps.map((step, i) => (
        <Text key={step} style={styles.body}>
          {i + 1}. {step}
        </Text>
      ))}
    </View>
  );
}
