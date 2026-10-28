import { useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { Text, TextInput, View, useWindowDimensions } from "react-native";
import { useLearning } from "../../../providers/LearningProvider";
import { itemById } from "../../../learning/content";
import {
  checklistId,
  completed,
  editEntry,
  finishStep,
  learningStatus,
  resumeStep,
  stepReady,
} from "../../../learning/progress";
import { confidenceLabels, skills } from "../../../learning/catalogue";
import { confidenceLevels } from "../../../learning/types";
import { application, sessionPlan } from "../../../learning/engine";
import { mediaResources } from "../../../learning/media";
import {
  Action,
  Card,
  Choices,
  Copy,
  Heading,
  LearnScreen,
  learnStyles,
} from "../../../components/learning/LearningUI";
import StudyVisual from "../../../components/learning/StudyVisual";
import YouTubeResource from "../../../components/learning/YouTubeResource";
import ChecklistControl from "../../../components/learning/ChecklistControl";
export default function LessonStudio() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const item = typeof id === "string" ? itemById(id) : undefined;
  const { state, update } = useLearning();
  const { width } = useWindowDimensions();
  const [outline, setOutline] = useState(false),
    [details, setDetails] = useState(false),
    [review, setReview] = useState(false);
  if (!item)
    return (
      <LearnScreen>
        <Heading level={1}>That study is not available</Heading>
        <Copy>
          No progress has been changed. Choose one of the fully authored studies
          in the curriculum.
        </Copy>
        <Action
          title="Browse available studies"
          onPress={() => router.replace("/learn/curriculum")}
        />
      </LearnScreen>
    );
  const entry = state.entries[item.id],
    index = resumeStep(item, entry),
    step = item.steps[index];
  const isComplete = completed(item, entry),
    final = index === item.steps.length - 1;
  const minutes = state.profile?.minutes ?? 15;
  const note = (key: string, value: string) =>
    update((s) =>
      editEntry(s, item, (e) => {
        e.notes[key] = value;
      }),
    );
  const go = (n: number) =>
    update((s) =>
      editEntry(s, item, (e) => {
        e.stepId = item.steps[n].id;
      }),
    );
  return (
    <LearnScreen nav={false} resetKey={`${item.id}:${step.id}`}>
      <Text style={learnStyles.label}>
        {item.kind === "project"
          ? "Guided painting studio"
          : "A small deliberate study"}{" "}
        · {item.difficulty} · version {item.version}
      </Text>
      <Heading level={1}>{item.title}</Heading>
      <Copy>{item.description}</Copy>
      <Copy muted>
        {sessionPlan(item.id, minutes)} {learningStatus(item, entry)}.
      </Copy>
      {!entry ? (
        <Card>
          <Heading>What you will explore</Heading>
          {item.objectives.map((t) => (
            <Copy key={t}>• {t}</Copy>
          ))}
          <Copy>{item.why}</Copy>
          <Copy muted>
            Materials: {item.materials.join(" · ")}. Use art materials according
            to their labels; keep brushes and paint water separate from food and
            drink.
          </Copy>
          {item.prerequisiteSkillIds.length > 0 && (
            <Copy muted>
              Useful preparation:{" "}
              {item.prerequisiteSkillIds
                .map((id) => skills.find((s) => s.id === id)!.title)
                .join(", ")}
              . These are informative prerequisites; you can choose to begin or
              use a refresher.
            </Copy>
          )}
          <Action
            title={`Begin ${item.kind === "project" ? "project" : "lesson"}`}
            onPress={() => update((s) => editEntry(s, item, () => {}))}
          />
          <Copy muted>
            Beginning records a view. Only your completed activities and
            reflection record completion. No upload or AI analysis is required.
          </Copy>
        </Card>
      ) : entry.contentVersion !== item.version ? (
        <Card>
          <Heading>Earlier work is preserved</Heading>
          <Copy>
            Your saved content version differs from this lesson. It will not be
            silently overwritten or marked complete for the new version.
          </Copy>
          <Action
            title="Return to learning progress"
            secondary
            onPress={() => router.push("/learn/progress")}
          />
        </Card>
      ) : isComplete && !review ? (
        <Card>
          <Heading>
            {item.kind === "project" ? "Project" : "Lesson"} completed
          </Heading>
          <Copy>
            You recorded the activities and a reflection. This is self-reported
            practice, not a certificate of mastery.
          </Copy>
          <Copy>{entry.reflection!.text}</Copy>
          <Copy>Next-level experiment: {item.exercise.extension}</Copy>
          <Action
            title="Choose my next study"
            onPress={() => router.push("/learn/path")}
          />
          <Action
            title="Review this completed study"
            secondary
            onPress={() => {
              setReview(true);
              setOutline(true);
            }}
          />
        </Card>
      ) : (
        <>
          <View style={{ gap: 10 }}>
            <Text accessibilityLiveRegion="polite" style={learnStyles.label}>
              Step {index + 1} of {item.steps.length} · {step.minutes} active
              minutes ·{" "}
              {entry.completedSteps.includes(step.id)
                ? "recorded"
                : "to explore"}
            </Text>
            <Heading>{step.title}</Heading>
            <Action
              title={outline ? "Hide lesson outline" : "Show lesson outline"}
              secondary
              onPress={() => setOutline((v) => !v)}
            />
            {outline && (
              <View style={{ gap: 8 }}>
                {item.steps.map((s, n) => (
                  <Action
                    key={s.id}
                    title={`${n + 1}. ${s.title}${entry.completedSteps.includes(s.id) ? " · recorded" : ""}`}
                    secondary
                    selected={n === index}
                    onPress={() => go(n)}
                  />
                ))}
              </View>
            )}
          </View>
          <View
            testID="studio-columns"
            style={{
              flexDirection: width >= 1000 ? "row" : "column",
              gap: 24,
              alignItems: "flex-start",
            }}
          >
            <View
              testID="studio-reference"
              style={{
                flex: width >= 1000 ? 1 : undefined,
                width: width >= 1000 ? undefined : "100%",
                minWidth: 0,
                gap: 20,
              }}
            >
              <StudyVisual kind={step.visual} />
              <Card>
                <Heading level={3}>Understand the decision</Heading>
                <Copy>{step.explanation}</Copy>
                <Copy>Look for: {step.observe}</Copy>
                <Copy muted>Common difficulty: {step.pitfall}</Copy>
              </Card>
            </View>
            <View
              testID="studio-practice"
              style={{
                flex: width >= 1000 ? 1 : undefined,
                width: width >= 1000 ? undefined : "100%",
                minWidth: 0,
                gap: 20,
              }}
            >
              <Card>
                <Text style={learnStyles.label}>
                  Now, at your painting table
                </Text>
                <Heading level={3}>One step at a time</Heading>
                {step.actions.map((a, n) => (
                  <Copy key={a}>
                    {n + 1}. {a}
                  </Copy>
                ))}
                <Copy muted>Materials: {item.materials.join(" · ")}</Copy>
                {step.checklist.map((check, n) => {
                  const key = checklistId(step.id, n),
                    checked = entry.checked[step.id]?.includes(key) ?? false;
                  return (
                    <ChecklistControl
                      key={key}
                      label={check}
                      checked={checked}
                      onToggle={() =>
                        update((s) =>
                          editEntry(s, item, (e) => {
                            const list = e.checked[step.id] ?? [];
                            e.checked[step.id] = checked
                              ? list.filter((id) => id !== key)
                              : [...list, key];
                          }),
                        )
                      }
                    />
                  );
                })}
                <Copy muted>{item.exercise.shortVersion}</Copy>
                <TextInput
                  accessibilityLabel="Optional note for this step"
                  placeholder="A condition or observation to remember…"
                  multiline
                  maxLength={2000}
                  value={entry.notes[step.id] ?? ""}
                  onChangeText={(text) => note(step.id, text)}
                  style={learnStyles.input}
                />
                {final && (
                  <View style={{ gap: 14 }}>
                    <Heading level={3}>Reflect before completing</Heading>
                    <Copy>{item.reflectionPrompt}</Copy>
                    <TextInput
                      accessibilityLabel="My exercise reflection"
                      placeholder="I observed… Next time I will test…"
                      multiline
                      maxLength={2000}
                      value={
                        entry.notes["reflection-text"] ??
                        entry.reflection?.text ??
                        ""
                      }
                      onChangeText={(text) => note("reflection-text", text)}
                      style={learnStyles.input}
                    />
                    <Copy>How did this study feel?</Copy>
                    <Choices
                      values={[
                        { id: "easy", label: "Comfortable exercise" },
                        { id: "useful", label: "Useful stretch" },
                        { id: "challenging", label: "Worth revisiting" },
                      ]}
                      selected={entry.notes["reflection-difficulty"] ?? ""}
                      onSelect={(v) => note("reflection-difficulty", v)}
                    />
                    <Copy>
                      Your confidence now — self-report, not an assessed score
                    </Copy>
                    <Choices
                      values={confidenceLevels.map((id) => ({
                        id,
                        label: confidenceLabels[id],
                      }))}
                      selected={entry.notes["reflection-confidence"] ?? ""}
                      onSelect={(v) => note("reflection-confidence", v)}
                    />
                  </View>
                )}
                {!stepReady(item, index, entry) && (
                  <Copy muted>
                    Tick this step's activities
                    {final
                      ? ", record any unfinished earlier steps, add a reflection, and choose difficulty and confidence"
                      : ""}{" "}
                    to record completion.
                  </Copy>
                )}
                <Action
                  title={
                    final
                      ? `Finish ${item.kind === "project" ? "project" : "lesson"}`
                      : "Complete step and continue"
                  }
                  disabled={!stepReady(item, index, entry)}
                  onPress={() => {
                    update((s) => finishStep(s, item, index));
                    if (final) setReview(false);
                  }}
                />
                {index > 0 && (
                  <Action
                    title="Previous studio step"
                    secondary
                    onPress={() => go(index - 1)}
                  />
                )}
              </Card>
            </View>
          </View>
          <View testID="studio-media">
            <YouTubeResource
              resource={mediaResources.find((r) =>
                item.resourceIds.includes(r.id),
              )}
            />
          </View>
          <Card>
            <Action
              title={
                details
                  ? "Hide exercise plan"
                  : "See the controlled exercise plan"
              }
              secondary
              onPress={() => setDetails((v) => !v)}
            />
            {details && (
              <>
                <Heading>Keep the comparison useful</Heading>
                <Copy>Paint: {item.exercise.target}</Copy>
                <Copy>Practise: {item.exercise.technique}</Copy>
                <Copy>Change: {item.exercise.variable}</Copy>
                <Copy>
                  Keep constant: {item.exercise.constants.join(" · ")}
                </Copy>
                <Copy>Compare: {item.exercise.comparison}</Copy>
                {item.exercise.success.map((s) => (
                  <Copy key={s}>Success cue: {s}</Copy>
                ))}
                <Copy>If it does not work: {item.exercise.recovery}</Copy>
                <Copy>Optional extension: {item.exercise.extension}</Copy>
                {state.profile && (
                  <Copy>
                    Your subject application:{" "}
                    {application(state.profile, item.id)}
                  </Copy>
                )}
              </>
            )}
          </Card>
        </>
      )}
      <Action
        title="Save and return to my path"
        secondary
        onPress={() => router.push("/learn/path")}
      />
    </LearnScreen>
  );
}
