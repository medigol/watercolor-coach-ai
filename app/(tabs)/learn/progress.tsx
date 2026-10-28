import { router } from "expo-router";
import { Text, View } from "react-native";
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
  Disclosure,
  Heading,
  LearnScreen,
  TextLink,
  learnStyles,
} from "../../../components/learning/LearningUI";
export default function Progress() {
  const { state } = useLearning(),
    path = makePath(state),
    entries = Object.values(state.entries);
  const done = items.filter((i) => completed(i, state.entries[i.id])),
    next = path.recommendations.find(
      (r) => !completed(itemById(r.itemId)!, state.entries[r.itemId]),
    );
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
      <Text style={learnStyles.label}>{path.title}</Text>
      <Heading level={1}>Your practice, kept in view</Heading>
      <Copy>
        {done.length} completed {done.length === 1 ? "study" : "studies"} ·{" "}
        {practised.length} skills practised
      </Copy>
      <Copy muted>
        A record of your activities and reflections, not an independent
        proficiency score.
      </Copy>
      {!entries.length ? (
        <Card>
          <Heading>A clean sheet</Heading>
          <Copy>
            Begin with one small study. Record what you tried and what you
            noticed.
          </Copy>
          <Action
            title="Choose my first study"
            onPress={() => router.push("/learn/path")}
          />
        </Card>
      ) : (
        next && (
          <View style={learnStyles.section}>
            <Text style={learnStyles.label}>Next recommendation</Text>
            <Heading>{itemById(next.itemId)!.title}</Heading>
            <Copy>{next.reason}</Copy>
            <TextLink
              title="See my next recommendation"
              onPress={() => router.push("/learn/path")}
            />
          </View>
        )
      )}
      {entries.map((e) => {
        const i = itemById(e.itemId);
        if (!i)
          return (
            <View key={e.itemId} style={learnStyles.section}>
              <Heading>Earlier content retained</Heading>
              <Copy muted>
                Saved work for {e.itemId} is preserved locally. This version
                does not offer its lesson route.
              </Copy>
            </View>
          );
        return (
          <View key={i.id} style={learnStyles.section}>
            <Text style={learnStyles.label}>
              {i.kind} · {completed(i, e) ? "✓ Completed" : "In progress"}
            </Text>
            <Heading>{i.title}</Heading>
            <Copy muted>
              {learningStatus(i, e)} ·{" "}
              {
                e.completedSteps.filter((id) =>
                  i.steps.some((s) => s.id === id),
                ).length
              }{" "}
              of {i.steps.length} steps recorded
            </Copy>
            {e.contentVersion !== i.version ? (
              <Copy muted>
                Earlier version {e.contentVersion} retained; it is not
                automatically completed for current content.
              </Copy>
            ) : (
              <TextLink
                title={`${completed(i, e) ? "Revisit" : "Resume"} ${i.title}`}
                onPress={() =>
                  router.push({
                    pathname: "/learn/lesson",
                    params: { id: i.id },
                  })
                }
              />
            )}{" "}
            {!completed(i, e) && e.contentVersion === i.version && (
              <Copy muted>Resume at: {i.steps[resumeStep(i, e)].title}</Copy>
            )}
            {e.reflection && (
              <Disclosure title={`Reflection: ${i.title}`}>
                <Copy>{e.reflection.text}</Copy>
                <Copy muted>
                  {e.reflection.difficulty} · confidence:{" "}
                  {confidenceLabels[e.reflection.confidence]}
                </Copy>
              </Disclosure>
            )}
          </View>
        );
      })}
      <View style={learnStyles.section}>
        <Heading>Skills you have practised</Heading>
        <Copy>
          {practised.length
            ? practised
                .map((id) => skills.find((s) => s.id === id)?.title ?? id)
                .join(" · ")
            : "Recorded practical activity will appear here."}
        </Copy>
      </View>
      {state.profile && (
        <Disclosure title="Self-reported starting confidence">
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
          <TextLink
            title="Revise my self-report"
            onPress={() => router.push("/learn/onboarding")}
          />
        </Disclosure>
      )}
      <Disclosure title="Worth revisiting">
        {path.revisionIds.length ? (
          path.revisionIds.map((id) => (
            <Copy key={id}>
              {itemById(id)!.title}: you reported difficulty. Compare one
              controlled variable again.
            </Copy>
          ))
        ) : (
          <Copy>
            Revisit any available study when it helps your next painting.
          </Copy>
        )}
        <TextLink
          title="My learning path"
          onPress={() => router.push("/learn/path")}
        />
      </Disclosure>
      <Disclosure title="How your progress is stored">
        <Copy muted>
          Notes and progress stay in this browser or app on this device. They
          are not encrypted or synced. Clearing local storage can remove them;
          use a trusted personal device. A completed activity is self-reported
          practice, not independently verified mastery.
        </Copy>
      </Disclosure>
    </LearnScreen>
  );
}
