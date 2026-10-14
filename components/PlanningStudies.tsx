import { View } from "react-native";
import {
  planPlanningStudies,
  type PlanningStudiesInput,
} from "../lib/planningStudies";
import { CompositionTeachingCard } from "./CompositionModels";
import { ThumbnailStudyCard } from "./ThumbnailPlanning";

export { SketchValueNotes } from "./ThumbnailPlanning";

export default function PlanningStudies(props: PlanningStudiesInput) {
  const studies = planPlanningStudies(props);
  return (
    <View style={{ gap: 14 }}>
      {studies.map((item) =>
        item.type === "model" ? (
          <CompositionTeachingCard
            key={`model-${item.model.id}`}
            model={item.model}
            study={props.study}
          />
        ) : (
          <ThumbnailStudyCard
            key={`study-${item.study.kind}`}
            study={item.study}
            uri={props.uri}
            provider={props.provider}
            optional={props.study}
            unified
          />
        ),
      )}
    </View>
  );
}
