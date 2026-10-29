import { View, Text, useWindowDimensions } from "react-native";
import { router } from "expo-router";
import { useLearning } from "../../../providers/LearningProvider";
import { makePath } from "../../../learning/engine";
import { itemById, project } from "../../../learning/content";
import { completed, resumeStep } from "../../../learning/progress";
import {
  Action,
  Copy,
  Heading,
  LearnScreen,
  TextLink,
  learnStyles,
} from "../../../components/learning/LearningUI";
import { StyleVisual } from "../../../components/learning/StudyVisual";
export default function Learn() {
  const { state, update } = useLearning(),
    { width } = useWindowDimensions(),
    path = makePath(state);
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
  const step = next?.steps[resumeStep(next, state.entries[next.id])],
    reason = path.recommendations.find((r) => r.itemId === next?.id)?.reason;
  return (
    <LearnScreen nav={false}>
      <Text style={learnStyles.label}>Learn watercolour</Text>
      <Heading level={1}>
        {returning ? "Continue your practice" : "Learn to see. Learn to paint."}
      </Heading>
      {!returning && (
        <Copy>
          Small, purposeful studies. A few better decisions each time you pick
          up a brush.
        </Copy>
      )}
      <View
        style={{
          flexDirection: width >= 900 ? "row" : "column",
          gap: 36,
          alignItems: "flex-start",
        }}
      >
        <View
          style={{
            flex: width >= 900 ? 1 : undefined,
            width: width >= 900 ? undefined : "100%",
            gap: 20,
            minWidth: 0,
          }}
        >
          {returning ? (
            <View
              style={{
                gap: 14,
                padding: 20,
                backgroundColor: "#FFFEFB",
                borderRadius: 14,
              }}
            >
              <Text style={learnStyles.label}>{path.title}</Text>
              <Heading>{next?.title ?? "Choose your next experiment"}</Heading>
              {step && (
                <>
                  <Copy muted>
                    Step {resumeStep(next!, state.entries[next!.id]) + 1} ·{" "}
                    {step.minutes} active minutes
                  </Copy>
                  <Copy>{step.actions[0]}</Copy>
                </>
              )}
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
                {current?.id === next?.id
                  ? "Pick up the step you left open."
                  : (reason ??
                    "Revisit a study or explore its next-level experiment.")}
              </Copy>
              <TextLink
                title="View my learning path"
                onPress={() => router.push("/learn/path")}
              />
              <Copy muted>
                {done} completed {done === 1 ? "study" : "studies"} · recorded
                practice
              </Copy>
            </View>
          ) : (
            <View style={{ gap: 14 }}>
              <Action
                title="Start structured learning"
                onPress={() => {
                  update((s) => ({ ...s, mode: "structured" }));
                  router.push("/learn/path");
                }}
              />
              <Copy muted>
                Begin with water, values and edges. No questionnaire.
              </Copy>
              <Action
                title="Create my personal path"
                secondary
                onPress={() => router.push("/learn/onboarding")}
              />
              <Copy muted>
                A few preferences, then a path that fits what you want to paint.
              </Copy>
            </View>
          )}
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 20 }}>
            <TextLink
              title="Explore styles"
              onPress={() => router.push("/learn/styles")}
            />
            <TextLink
              title="Browse curriculum"
              onPress={() => router.push("/learn/curriculum")}
            />
            <TextLink
              title="Learning progress"
              onPress={() => router.push("/learn/progress")}
            />
            <TextLink
              title="Video Library — Preview · 17 candidates"
              onPress={() => router.push("/learn/videos")}
            />
          </View>
          {returning && (
            <TextLink
              title="Edit learning preferences"
              onPress={() => router.push("/learn/onboarding")}
            />
          )}
        </View>
        <View
          style={{
            flex: width >= 900 ? 1.15 : undefined,
            width: width >= 900 ? undefined : "100%",
            minWidth: 0,
            gap: 12,
          }}
        >
          <StyleVisual styleId="atmospheric" />
          <Text style={learnStyles.label}>Bring the studies together</Text>
          <Heading>{project.title}</Heading>
          <Copy>
            A small landscape, painted in unhurried steps. Plan the masses, find
            your wash conditions, choose where an edge should speak.
          </Copy>
          <TextLink
            title="Explore the guided landscape"
            onPress={() =>
              router.push({
                pathname: "/learn/lesson",
                params: { id: project.id },
              })
            }
          />
          <Copy muted>
            Original teaching illustration · not a finished physical
            watercolour.
          </Copy>
        </View>
      </View>
    </LearnScreen>
  );
}
