import { router } from "expo-router";
import { Text, View } from "react-native";
import ActionCard from "../../components/ActionCard";
import { Screen, styles } from "../../components/ui";
export default function Home() {
  return (
    <Screen>
      <View
        style={{
          backgroundColor: "#EAF2EC",
          padding: 24,
          borderRadius: 26,
          overflow: "hidden",
          gap: 14,
        }}
      >
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            right: -40,
            top: -50,
            width: 190,
            height: 160,
            borderRadius: 90,
            backgroundColor: "#D1E4E36E",
            transform: [{ rotate: "-25deg" }],
          }}
        />
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            left: -50,
            bottom: -90,
            width: 240,
            height: 140,
            borderRadius: 90,
            backgroundColor: "#BFD8C63B",
          }}
        />
        <Text style={styles.title}>Watercolor Coach AI</Text>
        <Text style={styles.body}>
          Upload your painting. Get clear feedback. Know what to practise next.
        </Text>
      </View>
      <ActionCard
        title="Improve my painting"
        description="Upload your artwork and get clear feedback."
        onPress={() => router.push("/upload/improve-painting")}
      />
      <ActionCard
        title="Create painting reference"
        tone="blue"
        icon="image-outline"
        description="Turn a photo into a simple painting guide."
        onPress={() => router.push("/upload/create-reference")}
      />
    </Screen>
  );
}
