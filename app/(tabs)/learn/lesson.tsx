import { useEffect, useRef, useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import {
  Text,
  TextInput,
  View,
  ScrollView,
  useWindowDimensions,
} from "react-native";
import { useLearning } from "../../../providers/LearningProvider";
import { itemById } from "../../../learning/content";
import {
  checklistId,
  completed,
  editEntry,
  finishStep,
  resumeStep,
  stepReady,
} from "../../../learning/progress";
import { confidenceLabels, skills } from "../../../learning/catalogue";
import { confidenceLevels } from "../../../learning/types";
import { application, sessionPlan } from "../../../learning/engine";

import {
  Action,
  Card,
  Choices,
  Copy,
  Disclosure,
  Heading,
  LearnScreen,
  TextLink,
  learnStyles,
} from "../../../components/learning/LearningUI";
import StudyVisual, {
  StyleVisual,
} from "../../../components/learning/StudyVisual";
import LessonDemonstration from "../../../components/learning/LessonDemonstration";
import ChecklistControl from "../../../components/learning/ChecklistControl";
import { studio } from "../../../components/learning/design";
export default function LessonStudio() {
  const { id } = useLocalSearchParams<{ id?: string }>(),
    item = typeof id === "string" ? itemById(id) : undefined;
  const learning = useLearning(),
    { state, update } = learning,
    { width } = useWindowDimensions();
  const studioScroll = useRef<ScrollView>(null);
  const [demoKey, setDemoKey] = useState<string | null>(null);
  const [guideKey, setGuideKey] = useState<string | null>(null);
  const [outline, setOutline] = useState(false),
    [review, setReview] = useState(false);
  useEffect(() => {
    setReview(false);
    setOutline(false);
  }, [id]);
  if (!item)
    return (
      <LearnScreen>
        <Heading level={1}>That study is not available</Heading>
        <Copy>No progress has been changed. Choose an available study.</Copy>
        <Action
          title="Browse available studies"
          onPress={() => router.replace("/learn/curriculum")}
        />
      </LearnScreen>
    );
  const entry = state.entries[item.id],
    index = resumeStep(item, entry),
    step = item.steps[index],
    final = index === item.steps.length - 1,
    isComplete = completed(item, entry),
    wide = width >= studio.desktop;
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
  const missingEarlier = item.steps
    .slice(0, index)
    .filter((s) => !entry?.completedSteps.includes(s.id));
  const demonstration = (
    <View testID="studio-media">
      <TextLink
        title="Optional demonstration"
        expanded={demoKey === `${item.id}:${step.id}`}
        onPress={() =>
          setDemoKey((v) =>
            v === `${item.id}:${step.id}` ? null : `${item.id}:${step.id}`,
          )
        }
      />
      {demoKey === `${item.id}:${step.id}` && (
        <LessonDemonstration
          lessonId={item.id}
          stepId={step.id}
          profile={state.profile}
          entry={entry}
          onPractice={() => {
            setDemoKey(null);
            studioScroll.current?.scrollTo({ y: 0, animated: false });
            if (typeof document !== "undefined") {
              const target = document.getElementById("painting-exercise");
              target?.querySelector<HTMLInputElement>("input")?.focus();
            }
          }}
        />
      )}
    </View>
  );
  const reference = (
    <View style={{ gap: 16 }}>
      <StudyVisual kind={step.visual} />
      <Heading level={3}>Understand the decision</Heading>
      <Copy>{step.explanation}</Copy>
      <Copy muted>Common difficulty: {step.pitfall}</Copy>
    </View>
  );
  return (
    <LearnScreen
      scrollRef={studioScroll}
      nav={false}
      resetKey={`${item.id}:${step.id}`}
    >
      <View testID="studio-context" style={{ gap: 8 }}>
        <Text style={learnStyles.label}>
          {item.kind === "project" ? "Guided painting" : "Learning study"}
        </Text>
        <Heading level={1}>{item.title}</Heading>
      </View>
      {!entry ? (
        <>
          <Copy>{item.description}</Copy>
          <Copy muted>
            {sessionPlan(item.id, state.profile?.minutes ?? 15)}
          </Copy>
          <Action
            title={`Begin ${item.kind === "project" ? "project" : "lesson"}`}
            onPress={() => update((s) => editEntry(s, item, () => {}))}
          />
          {item.kind === "project" && (
            <>
              <StyleVisual styleId="atmospheric" />
              <Copy muted>
                Original illustrated study direction, not a finished physical
                painting. Your own shapes and palette are welcome.
              </Copy>
            </>
          )}
          <View style={learnStyles.section}>
            <Heading>What you will explore</Heading>
            {item.objectives.map((t) => (
              <Copy key={t}>• {t}</Copy>
            ))}
            <Copy>{item.why}</Copy>
          </View>
          <Disclosure title="Materials and preparation">
            <Copy>{item.materials.join(" · ")}</Copy>
            {item.prerequisiteSkillIds.length > 0 && (
              <Copy muted>
                Useful preparation:{" "}
                {item.prerequisiteSkillIds
                  .map((id) => skills.find((s) => s.id === id)!.title)
                  .join(", ")}
                . Refreshers are available in the curriculum; you may choose to
                begin.
              </Copy>
            )}
            <Copy muted>
              Use materials according to their labels. Keep brushes and paint
              water separate from food and drink.
            </Copy>
          </Disclosure>
        </>
      ) : entry.contentVersion !== item.version ? (
        <Card>
          <Heading>Earlier work is preserved</Heading>
          <Copy>
            Your saved version differs from this lesson. It will not be
            overwritten.
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
          <Copy>{entry.reflection!.text}</Copy>
          <Copy muted>
            Recorded practice and reflection — self-reported, not a mastery
            score.
          </Copy>
          <Copy>Next experiment: {item.exercise.extension}</Copy>
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
          <View style={{ gap: 6 }}>
            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 8,
              }}
            >
              <Text accessibilityLiveRegion="polite" style={learnStyles.label}>
                Step {index + 1} of {item.steps.length} · {step.minutes} minutes
                {entry.completedSteps.includes(step.id) ? " · recorded" : ""}
              </Text>
              <TextLink
                title={outline ? "Hide lesson outline" : "Show lesson outline"}
                label="Outline"
                expanded={outline}
                onPress={() => setOutline((v) => !v)}
              />
            </View>
            {outline && (
              <View style={{ gap: 4, paddingBottom: 8 }}>
                {item.steps.map((s, n) => (
                  <TextLink
                    key={s.id}
                    title={`${n + 1}. ${s.title}${entry.completedSteps.includes(s.id) ? " · recorded" : ""}`}
                    onPress={() => go(n)}
                  />
                ))}
              </View>
            )}
            <Heading>{step.title}</Heading>
          </View>
          <View
            testID="studio-columns"
            style={{
              flexDirection: wide ? "row" : "column",
              gap: wide ? 36 : 20,
              alignItems: "flex-start",
            }}
          >
            <View
              nativeID="painting-exercise"
              testID="studio-practice"
              style={{
                flex: wide ? 1.05 : undefined,
                width: wide ? undefined : "100%",
                minWidth: 0,
                gap: 18,
              }}
            >
              <View
                testID="current-practical-action"
                style={{ gap: 10, paddingVertical: 4 }}
              >
                <Text style={learnStyles.label}>Do</Text>
                {step.actions.map((a, n) => (
                  <Text
                    key={a}
                    style={[
                      learnStyles.body,
                      n === 0
                        ? {
                            fontSize: wide ? 22 : 20,
                            lineHeight: wide ? 31 : 28,
                            fontWeight: "600",
                          }
                        : {},
                    ]}
                  >
                    {n === 0 ? a : `${n + 1}. ${a}`}
                  </Text>
                ))}
              </View>
              <View
                testID="studio-observation"
                style={{
                  borderLeftWidth: 3,
                  borderColor: studio.colors.clay,
                  paddingLeft: 14,
                  gap: 4,
                }}
              >
                <Text style={learnStyles.label}>Observe</Text>
                <Copy>{step.observe}</Copy>
              </View>
              {!wide && (
                <View>
                  <TextLink
                    title="Visual guide and explanation"
                    expanded={guideKey === `${item.id}:${step.id}`}
                    onPress={() =>
                      setGuideKey((v) =>
                        v === `${item.id}:${step.id}`
                          ? null
                          : `${item.id}:${step.id}`,
                      )
                    }
                  />
                  {guideKey === `${item.id}:${step.id}` && reference}
                </View>
              )}
              <View style={{ gap: 8 }}>
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
              </View>
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
                    onChangeText={(t) => note("reflection-text", t)}
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
                  <Copy>Confidence now — your own reflection</Copy>
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
                  {final && missingEarlier.length
                    ? `Record earlier steps first: ${missingEarlier.map((s) => s.title).join(", ")}. `
                    : ""}
                  Tick this step’s activities
                  {final
                    ? ", add your reflection and choose difficulty and confidence"
                    : ""}{" "}
                  to continue.
                </Copy>
              )}
              <View testID="studio-step-controls" style={{ gap: 8 }}>
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
                <View
                  style={{
                    flexDirection: "row",
                    flexWrap: "wrap",
                    justifyContent: "space-between",
                    gap: 16,
                  }}
                >
                  {index > 0 && (
                    <TextLink
                      title="Previous studio step"
                      onPress={() => go(index - 1)}
                    />
                  )}
                  <TextLink
                    title="Save and return to my path"
                    onPress={() => router.push("/learn/path")}
                  />
                </View>
              </View>
              <Disclosure
                key={`${item.id}:${step.id}:note`}
                title="Notes for this step"
              >
                <TextInput
                  accessibilityLabel="Optional note for this step"
                  placeholder="A condition or observation to remember…"
                  multiline
                  maxLength={2000}
                  value={entry.notes[step.id] ?? ""}
                  onChangeText={(t) => note(step.id, t)}
                  style={learnStyles.input}
                />
                <Copy muted>
                  {learning.saveError
                    ? "Not saved. Keep your note here and retry."
                    : learning.saving
                      ? "Saving your note…"
                      : "Notes save on this device as you write."}
                </Copy>
                {learning.saveError && (
                  <TextLink title="Retry note save" onPress={learning.retry} />
                )}
              </Disclosure>
            </View>
            <View
              testID="studio-reference"
              style={{
                flex: wide ? 1 : undefined,
                width: wide ? undefined : "100%",
                minWidth: 0,
                gap: 16,
              }}
            >
              {demonstration}
              {wide && reference}
              {item.kind === "project" && (
                <Disclosure title="Project direction and materials">
                  <StyleVisual styleId="atmospheric" />
                  <Copy muted>
                    Illustrated composition direction, not a promised finished
                    painting.
                  </Copy>
                  <Copy>{item.materials.join(" · ")}</Copy>
                  <Copy>{item.exercise.shortVersion}</Copy>
                </Disclosure>
              )}
              {item.kind !== "project" && (
                <Disclosure title="Materials for this study">
                  <Copy>{item.materials.join(" · ")}</Copy>
                </Disclosure>
              )}
              <Disclosure title="See the controlled exercise plan">
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
              </Disclosure>
            </View>
          </View>
        </>
      )}
    </LearnScreen>
  );
}
