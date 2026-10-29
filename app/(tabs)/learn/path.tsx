import { router } from "expo-router";
import { Text, View } from "react-native";
import { useLearning } from "../../../providers/LearningProvider";
import { makePath } from "../../../learning/engine";
import { itemById } from "../../../learning/content";
import {
  completed,
  learningStatus,
  resumeStep,
} from "../../../learning/progress";
import { modules } from "../../../learning/catalogue";
import {
  Action,
  Copy,
  Disclosure,
  Heading,
  LearnScreen,
  TextLink,
  learnStyles,
} from "../../../components/learning/LearningUI";
export default function Path() {
  const { state, update } = useLearning(),
    path = makePath(state),
    nextId = path.recommendations.find(
      (r) => !completed(itemById(r.itemId)!, state.entries[r.itemId]),
    )?.itemId;
  return (
    <LearnScreen>
      <Text style={learnStyles.label}>
        {path.mode === "personal"
          ? "Your personal pathway"
          : "The foundation pathway"}
      </Text>
      <Heading level={1}>{path.title}</Heading>
      <Copy>{path.weeklySuggestion}</Copy>
      <View style={{ flexDirection: "row", gap: 20, alignItems: "flex-start" }}>
        <TextLink
          title="Edit preferences"
          onPress={() => router.push("/learn/onboarding")}
        />
        <View style={{ flex: 1 }}>
          <Disclosure title="Path settings">
            <Action
              title="Use structured path"
              secondary
              selected={state.mode === "structured"}
              onPress={() => update((s) => ({ ...s, mode: "structured" }))}
            />
            <Action
              title={
                state.profile ? "Use personal path" : "Create personal path"
              }
              secondary
              selected={path.mode === "personal"}
              onPress={() =>
                state.profile
                  ? update((s) => ({ ...s, mode: "personal" }))
                  : router.push("/learn/onboarding")
              }
            />
          </Disclosure>
        </View>
      </View>
      <View style={{ gap: 0 }}>
        {path.recommendations.map((r, index) => {
          const i = itemById(r.itemId)!,
            done = completed(i, state.entries[i.id]),
            next = i.id === nextId,
            step = i.steps[resumeStep(i, state.entries[i.id])];
          return (
            <View key={i.id} style={{ flexDirection: "row", gap: 18 }}>
              <View style={{ width: 32, alignItems: "center" }}>
                <Text
                  style={{
                    fontSize: 17,
                    fontWeight: "600",
                    color: "#236963",
                    paddingTop: 20,
                  }}
                >
                  {done ? "✓" : String(index + 1).padStart(2, "0")}
                </Text>
                <View
                  style={{
                    width: 1,
                    flex: 1,
                    backgroundColor: "#CCD8D0",
                    marginTop: 10,
                  }}
                />
              </View>
              <View
                style={{
                  flex: 1,
                  minWidth: 0,
                  paddingVertical: 18,
                  gap: 10,
                  borderBottomWidth: 1,
                  borderColor: "#CCD8D0",
                }}
              >
                <Text style={learnStyles.label}>
                  {next
                    ? "Recommended next"
                    : done
                      ? "Completed"
                      : r.refresher
                        ? "Optional refresher"
                        : "Available afterward"}{" "}
                  · {modules.find((m) => m.id === i.moduleId)!.title}
                </Text>
                <Heading>{i.title}</Heading>
                <Copy muted>{learningStatus(i, state.entries[i.id])}</Copy>
                {next && (
                  <>
                    <Copy>{step.actions[0]}</Copy>
                    <Copy>Why this study: {r.reason}</Copy>
                    <Copy muted>{r.sessionPlan}</Copy>
                  </>
                )}
                <Action
                  title={`Open ${i.title}`}
                  secondary={!next}
                  onPress={() =>
                    router.push({
                      pathname: "/learn/lesson",
                      params: { id: i.id },
                    })
                  }
                />
                <Disclosure title={`Study details: ${i.title}`}>
                  {!next && <Copy>Why this study: {r.reason}</Copy>}
                  <Copy>{r.application}</Copy>
                  {r.prerequisiteNotes.map((t) => (
                    <Copy key={t} muted>
                      {t}
                    </Copy>
                  ))}
                  {!next && <Copy muted>{r.sessionPlan}</Copy>}
                </Disclosure>
              </View>
            </View>
          );
        })}
      </View>
      {!!path.refresherIds.length && (
        <Disclosure title="Optional foundation refreshers">
          {path.refresherIds.map((id) => (
            <TextLink
              key={id}
              title={`Refresher: ${itemById(id)!.title}`}
              onPress={() =>
                router.push({ pathname: "/learn/lesson", params: { id } })
              }
            />
          ))}
        </Disclosure>
      )}
      <Disclosure title="How this path is chosen">
        {path.limitations.map((t) => (
          <Copy key={t} muted>
            {t}
          </Copy>
        ))}
      </Disclosure>
      <TextLink
        title="Explore outside my path"
        onPress={() => router.push("/learn/curriculum")}
      />
    </LearnScreen>
  );
}
