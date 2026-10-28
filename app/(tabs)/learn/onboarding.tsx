import { useState } from "react";
import { router } from "expo-router";
import { Text, View } from "react-native";
import { useLearning } from "../../../providers/LearningProvider";
import {
  defaultProfile,
  diagnosticSkills,
  skills,
  goalLabels,
  experienceLabels,
  subjectLabels,
  confidenceLabels,
  styleById,
} from "../../../learning/catalogue";
import {
  experiences,
  goals,
  subjects,
  confidenceLevels,
  type LearningProfile,
  type Confidence,
} from "../../../learning/types";
import { makePath } from "../../../learning/engine";
import { itemById } from "../../../learning/content";
import {
  Action,
  Card,
  Choices,
  Copy,
  Heading,
  LearnScreen,
  learnStyles,
  TextLink,
} from "../../../components/learning/LearningUI";
import StylePicker from "../../../components/learning/StylePicker";
const headings = [
  "Where are you starting?",
  "What would you like to develop?",
  "What do you enjoy painting?",
  "Choose a visual direction",
  "Make room for practice",
  "Review your personal path",
];
export default function Onboarding() {
  const { state, update } = useLearning();
  const [diagnostic, setDiagnostic] = useState(false);
  const p = state.draft ?? state.profile ?? defaultProfile;
  const index = state.onboardingStep;
  const change = (patch: Partial<LearningProfile>) =>
    update((s) => ({ ...s, draft: { ...p, ...patch } }));
  const move = (step: number) =>
    update((s) => ({ ...s, draft: p, onboardingStep: step }));
  const preview = makePath({ ...state, profile: p, mode: "personal" });
  return (
    <LearnScreen resetKey={`onboarding:${index}`}>
      <Text style={learnStyles.label} accessibilityLiveRegion="polite">
        Preferences · step {index + 1} of 6
      </Text>
      <Heading level={1}>{headings[index]}</Heading>
      <View
        accessibilityRole="progressbar"
        accessibilityLabel="Learning preferences"
        accessibilityValue={{ min: 1, max: 6, now: index + 1 }}
        style={{ flexDirection: "row", gap: 5 }}
      >
        {headings.map((_, n) => (
          <View
            key={n}
            style={{
              height: 3,
              flex: 1,
              backgroundColor: n <= index ? "#236963" : "#CCD8D0",
            }}
          />
        ))}
      </View>
      {index === 0 && (
        <Card>
          <Copy>
            Choose the closest fit. This is your own starting-point description.
          </Copy>
          <Choices
            values={experiences.map((id) => ({
              id,
              label: experienceLabels[id],
            }))}
            selected={p.experience}
            onSelect={(experience) =>
              change({
                experience: experience as LearningProfile["experience"],
              })
            }
          />
        </Card>
      )}
      {index === 1 && (
        <Card>
          <Copy>
            Choose one current priority. All available studies remain open.
          </Copy>
          <Choices
            values={goals.map((id) => ({ id, label: goalLabels[id] }))}
            selected={p.goal}
            onSelect={(goal) =>
              change({ goal: goal as LearningProfile["goal"] })
            }
          />
        </Card>
      )}
      {index === 2 && (
        <Card>
          <Copy>
            We will suggest ways to apply the studies to this subject.
          </Copy>
          <Choices
            values={subjects.map((id) => ({ id, label: subjectLabels[id] }))}
            selected={p.subject}
            onSelect={(subject) =>
              change({ subject: subject as LearningProfile["subject"] })
            }
          />
        </Card>
      )}
      {index === 3 && (
        <StylePicker
          profile={p}
          onChange={(draft) => update((s) => ({ ...s, draft }))}
        />
      )}
      {index === 4 && (
        <>
          <Card>
            <Heading>How much active time?</Heading>
            <Choices
              values={[10, 15, 30, 45, 60].map((n) => ({
                id: String(n),
                label: `${n === 60 ? "60+" : n} minutes`,
              }))}
              selected={String(p.minutes)}
              onSelect={(n) =>
                change({ minutes: Number(n) as LearningProfile["minutes"] })
              }
            />
            <Copy muted>
              Longer studies are split at meaningful steps. Drying time is
              additional.
            </Copy>
            <Heading level={3}>Optional weekly rhythm</Heading>
            <Choices
              values={[1, 2, 3, 4, 5, 6, 7].map((n) => ({
                id: String(n),
                label: `${n} / week`,
              }))}
              selected={String(p.weeklySessions ?? "")}
              onSelect={(n) => change({ weeklySessions: Number(n) })}
            />
            <Action
              title="No weekly schedule"
              secondary
              onPress={() => change({ weeklySessions: undefined })}
            />
            <Heading level={3}>Preferred explanation</Heading>
            <Choices
              values={[
                { id: "mixed", label: "Mixed" },
                { id: "reading", label: "Reading and visuals" },
                { id: "video", label: "Mostly video" },
              ]}
              selected={p.format}
              onSelect={(format) =>
                change({ format: format as LearningProfile["format"] })
              }
            />
            <Copy muted>
              No verified videos are assigned yet; every available lesson
              includes original visuals and instructions.
            </Copy>
          </Card>
          <Card>
            <Heading>Optional confidence check</Heading>
            <Copy>
              Self-report only. Skip this if you would rather discover through
              practice.
            </Copy>
            <Action
              title={
                diagnostic
                  ? "Hide optional confidence questions"
                  : "Show optional confidence questions"
              }
              secondary
              onPress={() => setDiagnostic((v) => !v)}
            />
            {diagnostic &&
              diagnosticSkills.map((id) => (
                <View key={id} style={{ gap: 10 }}>
                  <Heading level={3}>
                    {skills.find((s) => s.id === id)!.title}
                  </Heading>
                  <Choices
                    values={confidenceLevels.map((level) => ({
                      id: level,
                      label: confidenceLabels[level],
                    }))}
                    selected={p.diagnostic[id] ?? ""}
                    onSelect={(level) =>
                      change({
                        diagnostic: {
                          ...p.diagnostic,
                          [id]: level as Confidence,
                        },
                      })
                    }
                  />
                  <Action
                    title={`Clear confidence for ${id}`}
                    secondary
                    onPress={() => {
                      const next = { ...p.diagnostic };
                      delete next[id];
                      change({ diagnostic: next });
                    }}
                  />
                </View>
              ))}
          </Card>
        </>
      )}
      {index === 5 && (
        <Card>
          <Copy>
            {experienceLabels[p.experience]} · {goalLabels[p.goal]} ·{" "}
            {subjectLabels[p.subject]}
          </Copy>
          <Copy>
            {styleById(p.primaryStyle).title}
            {p.secondaryStyles.length
              ? ` + ${p.secondaryStyles.map((id) => styleById(id).title).join(", ")}`
              : ""}{" "}
            · {p.minutes} active minutes per session
          </Copy>
          {preview.recommendations.map((r) => (
            <View key={r.itemId} style={{ gap: 6 }}>
              <Heading level={3}>{itemById(r.itemId)!.title}</Heading>
              <Copy muted>{r.reason}</Copy>
            </View>
          ))}
          <Copy muted>
            Confirming changes recommendations. Completed lessons, project steps
            and reflections are kept.
          </Copy>
          <Action
            title="Confirm my personal path"
            onPress={() => {
              update((s) => ({
                ...s,
                profile: p,
                draft: null,
                mode: "personal",
              }));
              router.replace("/learn/path");
            }}
          />
        </Card>
      )}
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
        {index > 0 && (
          <Action
            title="Back to previous preference"
            secondary
            onPress={() => move(index - 1)}
          />
        )}{" "}
        {index < 5 && (
          <Action
            title={index === 4 ? "Review my path" : "Next preference"}
            onPress={() => move(index + 1)}
          />
        )}{" "}
        {index === 4 && (
          <Action
            title="Skip optional questions"
            secondary
            onPress={() => move(5)}
          />
        )}
        <TextLink
          title="Use structured learning instead"
          onPress={() => {
            update((s) => ({ ...s, mode: "structured" }));
            router.replace("/learn/path");
          }}
        />
      </View>
    </LearnScreen>
  );
}
