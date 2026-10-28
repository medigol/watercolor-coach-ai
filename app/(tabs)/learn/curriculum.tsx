import { router } from "expo-router";
import { Text, View } from "react-native";
import { modules, skills } from "../../../learning/catalogue";
import { itemById } from "../../../learning/content";
import {
  Action,
  Card,
  Copy,
  Heading,
  LearnScreen,
  learnStyles,
} from "../../../components/learning/LearningUI";
export default function Curriculum() {
  return (
    <LearnScreen>
      <Heading level={1}>The watercolour curriculum</Heading>
      <Copy>
        Twelve connected areas, with four complete lessons and one guided
        project available now. Outlines show where the curriculum can grow; they
        are not finished lessons.
      </Copy>
      {modules.map((m, index) => (
        <Card key={m.id}>
          <Text style={learnStyles.label}>
            Module {String(index + 1).padStart(2, "0")} ·{" "}
            {m.lessonIds.length ? "Studies available" : "Curriculum outline"}
          </Text>
          <Heading>{m.title}</Heading>
          <Copy>{m.description}</Copy>
          <Copy muted>{m.topics.join(" · ")}</Copy>
          <View style={{ gap: 8 }}>
            {m.skillIds.map((id) => {
              const s = skills.find((v) => v.id === id)!;
              return (
                <Copy key={id} muted>
                  {s.title}
                  {s.prerequisites.length
                    ? ` — builds on ${s.prerequisites.map((p) => skills.find((v) => v.id === p)!.title.toLowerCase()).join(", ")}`
                    : " — introductory"}
                </Copy>
              );
            })}
          </View>
          {m.lessonIds.map((id) => (
            <Action
              key={id}
              title={`Open ${itemById(id)!.title}`}
              secondary
              onPress={() =>
                router.push({ pathname: "/learn/lesson", params: { id } })
              }
            />
          ))}
          {!m.lessonIds.length && (
            <Copy muted>
              Teaching content is not yet authored. No unavailable lesson is
              linked.
            </Copy>
          )}
        </Card>
      ))}
    </LearnScreen>
  );
}
