import { router } from "expo-router";
import WatercolorWashHeader from "../../components/WatercolorWashHeader";
import ActionCard from "../../components/ActionCard";
import { Screen } from "../../components/ui";
export default function Home() {
  return (
    <Screen>
      <WatercolorWashHeader />
      <ActionCard
        title="Improve my painting"
        description="Upload your artwork and get clear feedback."
        onPress={() => router.push("/upload/improve-painting")}
      />
      <ActionCard
        title="Create painting reference"
        tone="blue"
        description="Turn a photo into a simple painting guide."
        onPress={() => router.push("/upload/create-reference")}
      />
    </Screen>
  );
}
