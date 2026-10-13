import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import ImageSelector from "../../components/ImageSelector";
import { Button, Screen, styles, colors } from "../../components/ui";
import { FeedbackFocus } from "../../types";
const options: FeedbackFocus[] = [
  "Overall feedback",
  "Composition",
  "Colour & contrast",
  "Watercolor technique",
];
export default function ImprovePainting() {
  const [focus, setFocus] = useState<FeedbackFocus>("Overall feedback");
  return (
    <Screen>
      <Text style={styles.title}>Improve my painting</Text>
      <Text style={styles.body}>
        Choose a painting, or explore with our Lake House sample.
      </Text>
      <ImageSelector
        sample="Lake House — sample painting placeholder"
        label="Choose painting"
      />
      <Text style={styles.heading}>What do you want help with?</Text>
      <View style={{ gap: 10 }}>
        {options.map((option) => (
          <Pressable
            key={option}
            accessibilityRole="radio"
            accessibilityState={{ checked: focus === option }}
            onPress={() => setFocus(option)}
            style={{
              borderRadius: 6,
              padding: 17,
              minHeight: 56,
              backgroundColor: focus === option ? colors.pale : colors.paper,
              borderWidth: 1,
              borderColor: focus === option ? colors.accent : colors.border,
            }}
          >
            <Text style={{ fontSize: 16, color: colors.ink }}>
              {focus === option ? "●" : "○"} {option}
            </Text>
          </Pressable>
        ))}
      </View>
      <Button
        title="Get feedback"
        onPress={() =>
          router.push({
            pathname: "/result/improve-painting",
            params: { focus },
          })
        }
      />
      <Text style={styles.caption}>
        Sample feedback only. Your painting is not analysed yet.
      </Text>
    </Screen>
  );
}
