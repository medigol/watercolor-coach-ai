import { useSavedResult } from "../../hooks/useSavedResult";
import { ResultState, SavedImage } from "../../components/SavedResultState";
import { Text, View } from "react-native";
import CompositionSuggestionCard from "../../components/CompositionSuggestionCard";
import SketchGuideCard from "../../components/SketchGuideCard";
import ValueStudyCard from "../../components/ValueStudyCard";
import PaletteCard from "../../components/PaletteCard";
import PaintingStepsCard from "../../components/PaintingStepsCard";
import { Screen, Placeholder, styles } from "../../components/ui";
import { referenceResult as sample } from "../../data/mockResults";
export default function ReferenceResult() {
  const { result, focus, image, loading, error, warning, retry } =
    useSavedResult(sample, "create_reference");
  if (loading || error)
    return <ResultState loading={loading} error={error} retry={retry} />;
  return (
    <Screen>
      <Text style={styles.title}>{result.title}</Text>
      {!!warning && (
        <Text accessibilityRole="alert" style={styles.body}>
          {warning}
        </Text>
      )}
      <SavedImage uri={image} />
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
