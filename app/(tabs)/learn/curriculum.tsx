import { router } from "expo-router";
import { Text, View } from "react-native";
import { modules, skills } from "../../../learning/catalogue";
import { itemById } from "../../../learning/content";
import {
  Copy,
  Disclosure,
  Heading,
  LearnScreen,
  TextLink,
  learnStyles,
} from "../../../components/learning/LearningUI";
export default function Curriculum() {
  return (
    <LearnScreen>
      <Heading level={1}>The watercolour curriculum</Heading>
      <Copy>
        Start with a few foundations, then choose the subjects and decisions
        that matter to you.
      </Copy>
      <Copy muted>
        Four lessons and one project are ready to use. Other modules are
        outlines for future teaching.
      </Copy>
      {modules.map((m, n) => (
        <View
          key={m.id}
          style={{
            gap: 12,
            paddingVertical: 18,
            borderTopWidth: 1,
            borderColor: "#CCD8D0",
          }}
        >
          {[0, 5, 8, 10].includes(n) && (
            <Text style={learnStyles.label}>
              {n === 0
                ? "Foundations"
                : n === 5
                  ? "Observation, design & atmosphere"
                  : n === 8
                    ? "Applying the skills"
                    : "Painting with independence"}
            </Text>
          )}
          <View
            style={{ flexDirection: "row", gap: 14, alignItems: "baseline" }}
          >
            <Text style={learnStyles.label}>
              {String(n + 1).padStart(2, "0")}
            </Text>
            <View style={{ flex: 1 }}>
              <Heading>{m.title}</Heading>
            </View>
          </View>
          <Copy>{m.description}</Copy>
          {m.lessonIds.length ? (
            <View style={{ gap: 4 }}>
              {m.lessonIds.map((id) => (
                <TextLink
                  key={id}
                  title={`Open ${itemById(id)!.title}`}
                  onPress={() =>
                    router.push({ pathname: "/learn/lesson", params: { id } })
                  }
                />
              ))}
            </View>
          ) : (
            <Copy muted>Outline only · teaching is not yet available</Copy>
          )}
          <Disclosure title={`Topics and prerequisites: ${m.title}`}>
            <Copy muted>{m.topics.join(" · ")}</Copy>
            {m.skillIds.map((id) => {
              const s = skills.find((k) => k.id === id)!;
              return (
                <Copy key={id} muted>
                  {s.title}
                  {s.prerequisites.length
                    ? ` — builds on ${s.prerequisites.map((p) => skills.find((k) => k.id === p)!.title.toLowerCase()).join(", ")}`
                    : " — introductory"}
                </Copy>
              );
            })}
          </Disclosure>
        </View>
      ))}
    </LearnScreen>
  );
}
