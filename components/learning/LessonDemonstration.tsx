import { useState } from "react";
import type { LearningProfile, LessonProgress } from "../../learning/types";
import { selectDemonstrations } from "../../learning/videoSelection";
import { TextLink } from "./LearningUI";
import YouTubeResource from "./YouTubeResource";
export default function LessonDemonstration({
  lessonId,
  stepId,
  profile,
  entry,
  onPractice,
}: {
  lessonId: string;
  stepId: string;
  profile: LearningProfile | null;
  entry?: LessonProgress;
  onPractice: () => void;
}) {
  const [alternative, setAlternative] = useState(false);
  const choices = selectDemonstrations({ lessonId, stepId, profile, entry }),
    selected = choices[alternative ? 1 : 0] ?? choices[0];
  return (
    <>
      <YouTubeResource
        key={`${lessonId}:${stepId}:${selected?.resource.id ?? "none"}`}
        resource={selected?.resource}
        segmentId={selected?.segment.id}
        allowedSegmentIds={
          selected
            ? selected.resource.segments
                .filter(
                  (s) =>
                    s.lessonId === lessonId &&
                    (!s.stepId || s.stepId === stepId) &&
                    s.levels.includes(profile?.experience ?? "beginner"),
                )
                .map((s) => s.id)
            : []
        }
        reason={selected?.reason}
        onPractice={onPractice}
      />
      {choices.length > 1 && (
        <TextLink
          title={
            alternative
              ? "Return to the main demonstration"
              : "Compare another verified approach"
          }
          onPress={() => setAlternative((v) => !v)}
        />
      )}
    </>
  );
}
