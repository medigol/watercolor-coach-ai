import { Text } from "react-native";
import ReferencePreparation from "../../components/ReferencePreparation";
import CompositionSuggestionCard from "../../components/CompositionSuggestionCard";
import ThumbnailPlanning from "../../components/ThumbnailPlanning";
import PaletteCard from "../../components/PaletteCard";
import PaintingStepsCard from "../../components/PaintingStepsCard";
import ResultLayout from "../../components/ResultLayout";
import ResultProviderLabel from "../../components/ResultProviderLabel";
import { ResultState, SavedImage } from "../../components/SavedResultState";
import { styles } from "../../components/ui";
import { useSavedResult } from "../../hooks/useSavedResult";
import type { ReferenceData } from "../../lib/artworks";
import { referenceResult as sample } from "../../data/mockResults";
export default function ReferenceResult() {
  const { result, provider, isSaved, image, loading, error, warning, retry } =
    useSavedResult<ReferenceData>(sample, "create_reference");
  if (loading || error)
    return <ResultState loading={loading} error={error} retry={retry} />;
  return (
    <ResultLayout
      header={
        <>
          <Text style={styles.title}>{result.title}</Text>
          <ResultProviderLabel provider={provider} isSaved={isSaved} />
          {!!warning && (
            <Text accessibilityRole="alert" style={styles.body}>
              {warning}
            </Text>
          )}
        </>
      }
      image={
        <SavedImage overlays={result.overlays} uri={image} label="Your photo" />
      }
      guidance={
        <>
          <Text style={styles.caption}>PLAN · choose the big shapes</Text>
          <CompositionSuggestionCard
            title="Painting plan"
            text={result.composition}
          />
          <Text style={styles.caption}>
            Coaching notes for a painting you create. No new image is generated.
          </Text>
        </>
      }
      planning={
        <>
          {!!image && <ReferencePreparation uri={image} />}
          <ThumbnailPlanning
            uri={image}
            overlays={result.overlays}
            title={result.title}
            composition={result.composition}
            sketch={result.sketch}
            values={result.values}
          />
        </>
      }
      painting={
        <>
          <Text style={styles.caption}>
            PAINT · fewer colours, clear washes
          </Text>
          <PaletteCard
            palette={result.palette}
            strategy={result.paletteStrategy}
          />
          <PaintingStepsCard steps={result.steps} />
        </>
      }
    />
  );
}
