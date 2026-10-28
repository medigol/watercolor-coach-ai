import { router } from "expo-router";
import { Text } from "react-native";
import { items, itemById } from "../../../learning/content";
import { skills, confidenceLabels } from "../../../learning/catalogue";
import {
  completed,
  learningStatus,
  resumeStep,
} from "../../../learning/progress";
import { makePath } from "../../../learning/engine";
import { useLearning } from "../../../providers/LearningProvider";
import {
  Action,
  Card,
  Copy,
  Heading,
  LearnScreen,
  learnStyles,
} from "../../../components/learning/LearningUI";
export default function Progress() {
  const { state } = useLearning(),
    path = makePath(state);
  const entries = Object.values(state.entries);
  const done = items.filter((i) => completed(i, state.entries[i.id]));
  const practised = [
    ...new Set(
      items
        .filter((i) =>
          state.entries[i.id]?.completedSteps.some(
            (id) => i.steps.findIndex((s) => s.id === id) > 0,
          ),
        )
        .flatMap((i) => i.skillIds),
    ),
  ];
  return (
    <LearnScreen>
      <Heading level={1}>Your practice, kept in view</Heading>
      <Copy>
        {done.length} completed {done.length === 1 ? "study" : "studies"}.
        Completion and confidence are self-reported; no independent competence
        has been measured.
      </Copy>
      <Copy muted>
        Learning notes stay in this browser or app, are not encrypted or synced,
        and can be lost if local storage is cleared. Use a trusted personal
        device.
      </Copy>
      {!entries.length && (
        <Card>
          <Heading>A clean sheet</Heading>
          <Copy>
            Begin a lesson, try its exercise and record what you notice. Opening
            a page alone does not complete it.
          </Copy>
          <Action
            title="Choose my first study"
            onPress={() => router.push("/learn/path")}
          />
        </Card>
      )}
      {entries.map((entry) => {
        const i = itemById(entry.itemId);
        if (!i)
          return (
            <Card key={entry.itemId}>
              <Heading>Earlier content retained</Heading>
              <Copy muted>
                Saved work for {entry.itemId} is preserved locally. This version
                does not offer its lesson route.
              </Copy>
            </Card>
          );
        return (
          <Card key={i.id}>
            <Text style={learnStyles.label}>{i.kind}</Text>
            <Heading>{i.title}</Heading>
            <Copy>
              {learningStatus(i, entry)} ·{" "}
              {
                entry.completedSteps.filter((id) =>
                  i.steps.some((s) => s.id === id),
                ).length
              }{" "}
              of {i.steps.length} steps recorded
            </Copy>
            {entry.contentVersion !== i.version ? (
              <Copy muted>
                Earlier version {entry.contentVersion} retained. It is not
                automatically marked complete for the current content.
              </Copy>
            ) : (
              <Action
                title={`${completed(i, entry) ? "Revisit" : "Resume"} ${i.title}`}
                secondary
                onPress={() =>
                  router.push({
                    pathname: "/learn/lesson",
                    params: { id: i.id },
                  })
                }
              />
            )}
            {!completed(i, entry) && entry.contentVersion === i.version && (
              <Copy muted>
                Resume at: {i.steps[resumeStep(i, entry)].title}
              </Copy>
            )}
            {entry.reflection && (
              <>
                <Copy>Reflection: {entry.reflection.text}</Copy>
                <Copy muted>
                  {entry.reflection.difficulty} · confidence:{" "}
                  {confidenceLabels[entry.reflection.confidence]}
                </Copy>
              </>
            )}
          </Card>
        );
      })}
      <Card>
        <Heading>Skills you have practised</Heading>
        <Copy>
          {practised.length
            ? practised
                .map((id) => skills.find((s) => s.id === id)?.title ?? id)
                .join(" · ")
            : "Your practical activity will appear here after a study step is completed."}
        </Copy>
        <Copy muted>These are practice records, not a mastery percentage.</Copy>
      </Card>
      {state.profile && (
        <Card>
          <Heading>Self-reported starting confidence</Heading>
          {Object.entries(state.profile.diagnostic).length ? (
            Object.entries(state.profile.diagnostic).map(([id, level]) => (
              <Copy key={id}>
                {skills.find((s) => s.id === id)?.title}:{" "}
                {confidenceLabels[level!]}
              </Copy>
            ))
          ) : (
            <Copy muted>No optional confidence answers recorded.</Copy>
          )}
          <Action
            title="Revise my self-report"
            secondary
            onPress={() => router.push("/learn/onboarding")}
          />
        </Card>
      )}
      <Card>
        <Heading>Worth revisiting</Heading>
        {path.revisionIds.length ? (
          path.revisionIds.map((id) => (
            <Copy key={id}>
              {itemById(id)!.title}: you reported difficulty; compare one
              controlled variable again.
            </Copy>
          ))
        ) : (
          <Copy>
            No difficulty-based refresher is recorded. You can revisit any
            available study.
          </Copy>
        )}
        <Action
          title="See my next recommendation"
          secondary
          onPress={() => router.push("/learn/path")}
        />
      </Card>
    </LearnScreen>
  );
}
