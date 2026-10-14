import type { ReferenceData } from "../../lib/artworks";
import { useSavedResult } from "../../hooks/useSavedResult";
import { ResultState, SavedImage } from "../../components/SavedResultState";
import { Text, View } from "react-native";
import CompositionSuggestionCard from "../../components/CompositionSuggestionCard";
import SketchGuideCard from "../../components/SketchGuideCard";
import ValueStudyCard from "../../components/ValueStudyCard";
import PaletteCard from "../../components/PaletteCard";
import PaintingStepsCard from "../../components/PaintingStepsCard";
import { Screen, styles } from "../../components/ui";
import { referenceResult as sample } from "../../data/mockResults";
export default function ReferenceResult() {
  const { result, provider, image, loading, error, warning, retry } =
    useSavedResult<ReferenceData>(sample, "create_reference");
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
      <SavedImage overlays={result.overlays} uri={image} label="Your photo" />
      <Text style={styles.caption}>
        {provider === "mock"
          ? "Sample painting plan"
          : "Photo-based coaching notes"}
      </Text>
      <View style={styles.card}>
        <Text style={styles.heading}>Painting plan</Text>
        <Text style={styles.body}>
          Coaching notes for a painting you create. No new image is generated.
          The visual studies below are generic planning aids.
        </Text>
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
