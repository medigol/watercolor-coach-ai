import { View, Text, useWindowDimensions } from "react-native";
import { router } from "expo-router";
import { useLearning } from "../../../providers/LearningProvider";
import { makePath } from "../../../learning/engine";
import { itemById, project } from "../../../learning/content";
import { completed, learningStatus } from "../../../learning/progress";
import {
  Action,
  Card,
  Copy,
  Heading,
  LearnScreen,
  learnStyles,
} from "../../../components/learning/LearningUI";
import { StyleVisual } from "../../../components/learning/StudyVisual";
export default function Learn() {
  const { state, update } = useLearning();
  const { width } = useWindowDimensions();
  const path = makePath(state);
  const current = state.currentItemId
    ? itemById(state.currentItemId)
    : undefined;
  const next =
    current && !completed(current, state.entries[current.id])
      ? current
      : path.recommendations
          .map((r) => itemById(r.itemId)!)
          .find((i) => !completed(i, state.entries[i.id]));
  const returning = Object.keys(state.entries).length > 0 || !!state.profile;
  const done = Object.values(state.entries).filter((e) => {
    const i = itemById(e.itemId);
    return i && completed(i, e);
  }).length;
  return (
    <LearnScreen nav={false}>
      <Text style={learnStyles.label}>Learn watercolour · your studio</Text>
      <Heading level={1}>
        {returning
          ? "A little practice. A clear next step."
          : "Learn to see. Learn to paint."}
      </Heading>
      <Copy>
        {returning
          ? "Return to a decision you were exploring, or follow your next study. Your pace belongs to you."
          : "Build water, value and edge decisions through small physical studies. Start now, or shape a path around what you want to paint."}
      </Copy>
      <View
        style={{
          flexDirection: width >= 850 ? "row" : "column",
          gap: 24,
          alignItems: "stretch",
        }}
      >
        <View
          style={{
            flex: width >= 850 ? 1 : undefined,
            width: width >= 850 ? undefined : "100%",
            minWidth: 0,
            gap: 18,
          }}
        >
          {returning ? (
            <Card>
              <Text style={learnStyles.label}>
                {state.mode === "personal"
                  ? "Your personal path"
                  : "Structured learning"}
              </Text>
              <Heading>{next?.title ?? "Choose your next experiment"}</Heading>
              <Copy>
                {next
                  ? learningStatus(next, state.entries[next.id])
                  : "Your available path is complete. Revisit a study or try its advanced extension."}
              </Copy>
              {next && (
                <Action
                  title="Continue learning"
                  onPress={() =>
                    router.push({
                      pathname: "/learn/lesson",
                      params: { id: next.id },
                    })
                  }
                />
              )}
              <Copy muted>
                {done} completed {done === 1 ? "study" : "studies"} ·
                self-reported practice, not a mastery score.
              </Copy>
              <Action
                title="View my learning path"
                secondary
                onPress={() => router.push("/learn/path")}
              />
            </Card>
          ) : (
            <Card>
              <Heading>The foundation pathway</Heading>
              <Copy>
                Water and brush control → three-value planning → purposeful
                edges → a small landscape. No questionnaire required.
              </Copy>
              <Action
                title="Start structured learning"
                onPress={() => {
                  update((s) => ({ ...s, mode: "structured" }));
                  router.push("/learn/path");
                }}
              />
              <Action
                title="Create my personal path"
                secondary
                onPress={() => router.push("/learn/onboarding")}
              />
            </Card>
          )}
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
            <Action
              title="Explore styles"
              secondary
              onPress={() => router.push("/learn/styles")}
            />
            <Action
              title="Browse curriculum"
              secondary
              onPress={() => router.push("/learn/curriculum")}
            />
            <Action
              title="Learning progress"
              secondary
              onPress={() => router.push("/learn/progress")}
            />
          </View>
        </View>
        <View
          style={{
            flex: width >= 850 ? 1 : undefined,
            width: width >= 850 ? undefined : "100%",
            minWidth: 0,
            gap: 16,
          }}
        >
          <StyleVisual styleId="atmospheric" />
          <Text style={learnStyles.muted}>
            Original vector study · choosing masses and edges, not copying a
            finished painting.
          </Text>
          <Heading>{project.title}</Heading>
          <Copy>
            A postcard-sized painting in short, resumable sessions. Make a value
            plan, choose wash conditions, then decide which edges deserve
            attention.
          </Copy>
          <Action
            title="Explore the guided landscape"
            secondary
            onPress={() =>
              router.push({
                pathname: "/learn/lesson",
                params: { id: project.id },
              })
            }
          />
        </View>
      </View>
      {returning && (
        <Action
          title="Edit learning preferences"
          secondary
          onPress={() => router.push("/learn/onboarding")}
        />
      )}
    </LearnScreen>
  );
}
