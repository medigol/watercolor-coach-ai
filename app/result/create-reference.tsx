import { Text, View } from "react-native";
import CompositionSuggestionCard from "../../components/CompositionSuggestionCard";
import SketchGuideCard from "../../components/SketchGuideCard";
import ValueStudyCard from "../../components/ValueStudyCard";
import PaletteCard from "../../components/PaletteCard";
import PaintingStepsCard from "../../components/PaintingStepsCard";
import { Screen, Placeholder, styles } from "../../components/ui";
import { referenceResult as result } from "../../data/mockResults";
export default function ReferenceResult() {
  return (
    <Screen>
      <Text style={styles.title}>{result.title}</Text>
      <Text style={styles.caption}>Sample painting reference</Text>
      <View style={styles.card}>
        <Text style={styles.heading}>Simplified reference</Text>
        <Placeholder label="Coastal Town — simplified reference placeholder" />
      </View>
      <CompositionSuggestionCard
        title="Composition plan"
        text={result.composition}
      />
      <SketchGuideCard title="Line sketch guide" description={result.sketch} />
      <ValueStudyCard description={result.values} harbour />
      <PaletteCard palette={result.palette} />
      <PaintingStepsCard steps={result.steps} />
    </Screen>
  );
}
