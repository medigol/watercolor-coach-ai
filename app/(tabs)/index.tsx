import { router } from "expo-router";
import { Text } from "react-native";
import ActionCard from "../../components/ActionCard";
import { Screen, styles } from "../../components/ui";
export default function Home() {
  return (
    <Screen>
      <Text style={styles.title}>Watercolor Coach AI</Text>
      <Text style={styles.body}>
        Upload your painting. Get clear feedback. Know what to practise next.
      </Text>
      <ActionCard
        title="Improve my painting"
        description="Upload your artwork and get clear feedback."
        onPress={() => router.push("/upload/improve-painting")}
      />
      <ActionCard
        title="Create painting reference"
        description="Turn a photo into a simple painting guide."
        onPress={() => router.push("/upload/create-reference")}
      />
    </Screen>
  );
}
