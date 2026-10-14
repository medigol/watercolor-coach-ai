import { Text, View } from "react-native";
import { colors, styles } from "./ui";
export default function PaintingStepsCard({ steps }: { steps: string[] }) {
  return (
    <View style={styles.card}>
      <Text style={styles.heading}>Painting steps</Text>
      {steps.map((step, i) => (
        <View
          key={i}
          style={{
            gap: 12,
            paddingTop: i ? 18 : 0,
            borderTopWidth: i ? 1 : 0,
            borderColor: colors.border,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
            <View
              style={{
                width: 30,
                height: 30,
                borderRadius: 10,
                backgroundColor: colors.pale,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ color: colors.accent, fontWeight: "700" }}>
                {i + 1}
              </Text>
            </View>
            <Text style={[styles.body, { flex: 1 }]}>{step}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}
