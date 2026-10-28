import { router } from "expo-router";
import { Text, View } from "react-native";
import { useLearning } from "../../../providers/LearningProvider";
import { makePath } from "../../../learning/engine";
import { itemById } from "../../../learning/content";
import { learningStatus } from "../../../learning/progress";
import {
  Action,
  Card,
  Copy,
  Heading,
  LearnScreen,
  learnStyles,
} from "../../../components/learning/LearningUI";
export default function Path() {
  const { state, update } = useLearning();
  const path = makePath(state);
  return (
    <LearnScreen>
      <Text style={learnStyles.label}>
        {path.mode === "personal"
          ? "Made from your preferences"
          : "A ready-to-start sequence"}
      </Text>
      <Heading level={1}>{path.title}</Heading>
      <Copy>{path.weeklySuggestion}</Copy>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        <Action
          title="Use structured path"
          secondary
          selected={state.mode === "structured"}
          onPress={() => update((s) => ({ ...s, mode: "structured" }))}
        />
        <Action
          title={state.profile ? "Use personal path" : "Create personal path"}
          secondary
          selected={path.mode === "personal"}
          onPress={() =>
            state.profile
              ? update((s) => ({ ...s, mode: "personal" }))
              : router.push("/learn/onboarding")
          }
        />
        <Action
          title="Edit preferences"
          secondary
          onPress={() => router.push("/learn/onboarding")}
        />
      </View>
      {path.recommendations.map((r, index) => {
        const item = itemById(r.itemId)!;
        return (
          <Card key={r.itemId}>
            <Text style={learnStyles.label}>
              {index + 1} · {item.kind}{" "}
              {r.refresher ? "· optional refresher" : ""}
            </Text>
            <Heading>{item.title}</Heading>
            <Copy>{item.description}</Copy>
            <Copy muted>
              {learningStatus(item, state.entries[item.id])} · {r.sessionPlan}
            </Copy>
            <Copy>Why this study: {r.reason}</Copy>
            <Copy>{r.application}</Copy>
            {r.prerequisiteNotes.map((n) => (
              <Copy key={n} muted>
                {n}
              </Copy>
            ))}
            <Action
              title={`Open ${item.title}`}
              onPress={() =>
                router.push({
                  pathname: "/learn/lesson",
                  params: { id: item.id },
                })
              }
            />
          </Card>
        );
      })}
      {!!path.refresherIds.length && (
        <Card>
          <Heading>Optional foundation refreshers</Heading>
          <Copy>
            You can revisit these without resetting completed work or being
            forced through a beginner sequence.
          </Copy>
          {path.refresherIds.map((id) => (
            <Action
              key={id}
              title={`Refresher: ${itemById(id)!.title}`}
              secondary
              onPress={() =>
                router.push({ pathname: "/learn/lesson", params: { id } })
              }
            />
          ))}
        </Card>
      )}
      <Card>
        <Heading>Room to choose</Heading>
        {path.limitations.map((t) => (
          <Copy key={t} muted>
            {t}
          </Copy>
        ))}
        <Action
          title="Explore outside my path"
          secondary
          onPress={() => router.push("/learn/curriculum")}
        />
      </Card>
    </LearnScreen>
  );
}
