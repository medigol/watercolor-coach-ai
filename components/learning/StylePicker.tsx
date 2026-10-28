import { useState } from "react";
import { View, Text, useWindowDimensions } from "react-native";
import { styles, styleById } from "../../learning/catalogue";
import type { LearningProfile, StyleId } from "../../learning/types";
import { Action, Copy, Heading, learnStyles } from "./LearningUI";
import { StyleVisual } from "./StudyVisual";
export default function StylePicker({
  profile,
  onChange,
}: {
  profile: LearningProfile;
  onChange: (value: LearningProfile) => void;
}) {
  const { width } = useWindowDimensions();
  const [compare, setCompare] = useState<StyleId[]>([
    "atmospheric",
    "botanical",
  ]);
  return (
    <View style={{ gap: 22 }}>
      <Copy>
        Choose a primary direction and optional secondary interests. These are
        learning emphases, not labels for your artistic identity. You can change
        them later.
      </Copy>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 20 }}>
        {styles.map((s) => (
          <View
            key={s.id}
            style={[learnStyles.card, { width: width >= 850 ? "48%" : "100%" }]}
          >
            <StyleVisual styleId={s.id} />
            <Heading level={3}>{s.title}</Heading>
            <Copy>{s.description}</Copy>
            {s.decisions.map((d) => (
              <Copy key={d} muted>
                {d}
              </Copy>
            ))}
            <Copy muted>Try: {s.exercise}</Copy>
            <Copy muted>
              Related directions:{" "}
              {s.related.map((id) => styleById(id).title).join(", ")}.
            </Copy>
            <Action
              title={`Primary: ${s.title}`}
              secondary
              selected={profile.primaryStyle === s.id}
              onPress={() =>
                onChange({
                  ...profile,
                  primaryStyle: s.id,
                  secondaryStyles: profile.secondaryStyles.filter(
                    (id) => id !== s.id,
                  ),
                })
              }
            />
            <Action
              title={`Secondary: ${s.title}`}
              secondary
              disabled={profile.primaryStyle === s.id}
              selected={profile.secondaryStyles.includes(s.id)}
              onPress={() =>
                onChange({
                  ...profile,
                  secondaryStyles: profile.secondaryStyles.includes(s.id)
                    ? profile.secondaryStyles.filter((id) => id !== s.id)
                    : [...profile.secondaryStyles, s.id],
                })
              }
            />
            <Action
              title={`Compare ${s.title}`}
              secondary
              selected={compare.includes(s.id)}
              onPress={() =>
                setCompare((current) =>
                  current.includes(s.id)
                    ? current.filter((id) => id !== s.id)
                    : [...current.slice(-1), s.id],
                )
              }
            />
          </View>
        ))}
      </View>
      <View style={learnStyles.card}>
        <Text style={learnStyles.label}>Compare two directions</Text>
        <Heading level={3}>
          {compare.length === 2
            ? compare.map((id) => styleById(id).title).join(" & ")
            : "Select two style cards"}
        </Heading>
        {compare.map((id) => (
          <View key={id} style={{ gap: 8 }}>
            <Copy>
              {styleById(id).title}: {styleById(id).decisions.join(" ")}
            </Copy>
            <Copy muted>
              Practice emphasis:{" "}
              {styleById(id)
                .skillIds.map((s) => s.replace(/-/g, " "))
                .join(", ")}
              . The other choices remain available.
            </Copy>
          </View>
        ))}
      </View>
      <Copy muted>
        All examples are original vector teaching studies, not paintings by a
        named artist or simulations of physical paint.
      </Copy>
    </View>
  );
}
