import { useState } from "react";
import { View, Text, useWindowDimensions } from "react-native";
import { styles, skills, subjectLabels } from "../../learning/catalogue";
import type { LearningProfile, StyleId } from "../../learning/types";
import { styleFeatures } from "../../learning/visualGuides";
import {
  Action,
  Copy,
  Disclosure,
  Heading,
  TextLink,
  learnStyles,
} from "./LearningUI";
import { StyleVisual } from "./StudyVisual";
export default function StylePicker({
  profile,
  onChange,
}: {
  profile: LearningProfile;
  onChange: (value: LearningProfile) => void;
}) {
  const { width } = useWindowDimensions(),
    [compare, setCompare] = useState<StyleId[]>(["atmospheric", "urban"]);
  return (
    <View style={{ gap: 28 }}>
      <Copy>
        Choose a primary direction; add secondary interests if you like. Your
        choices shape the studies in your path.
      </Copy>
      <Copy muted>
        Original digital illustrations, not physical paint samples.
      </Copy>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 28 }}>
        {styles.map((s, n) => (
          <View
            key={s.id}
            testID={`style-example-${s.id}`}
            style={{
              width: width >= 900 ? "48%" : "100%",
              gap: 14,
              paddingBottom: 20,
              borderBottomWidth: 1,
              borderColor: "#CCD8D0",
            }}
          >
            <StyleVisual styleId={s.id} />
            <View
              style={{ flexDirection: "row", gap: 12, alignItems: "baseline" }}
            >
              <Text style={learnStyles.label}>0{n + 1}</Text>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Heading level={3}>{s.title}</Heading>
              </View>
            </View>
            <Copy>{s.description}</Copy>
            <View style={{ gap: 4 }}>
              {styleFeatures[s.id].features.map((t) => (
                <Copy key={t} muted>
                  — {t}
                </Copy>
              ))}
            </View>
            <View style={{ flexDirection: "row", gap: 8 }}>
              <View style={{ flex: 1 }}>
                <Action
                  title={`Primary: ${s.title}`}
                  label={
                    profile.primaryStyle === s.id
                      ? "Primary style"
                      : "Choose primary"
                  }
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
              </View>
              <View style={{ flex: 1 }}>
                <Action
                  title={`Secondary: ${s.title}`}
                  label="Secondary"
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
              </View>
            </View>
            <TextLink
              title={`Compare ${s.title}`}
              expanded={compare.includes(s.id)}
              onPress={() =>
                setCompare((current) =>
                  current.includes(s.id)
                    ? current.filter((id) => id !== s.id)
                    : [...current.slice(-1), s.id],
                )
              }
            />
            <Disclosure title={`Explore ${s.title}`}>
              <Copy>{styleFeatures[s.id].cue}</Copy>
              <Copy muted>
                Skills:{" "}
                {s.skillIds
                  .map((id) => skills.find((k) => k.id === id)?.title ?? id)
                  .join(" · ")}
              </Copy>
              <Copy muted>
                Subjects:{" "}
                {s.subjects.map((id) => subjectLabels[id]).join(" · ")}
              </Copy>
              <Copy>Try: {s.exercise}</Copy>
              {s.decisions.map((t) => (
                <Copy key={t} muted>
                  {t}
                </Copy>
              ))}
            </Disclosure>
          </View>
        ))}
      </View>
      <View testID="style-comparison" style={{ gap: 16 }}>
        <Heading>Compare the decisions</Heading>
        <Copy muted>
          {compare.length === 2
            ? "Look at the edges, connected masses and where detail is concentrated."
            : "Choose two Compare controls to place the illustrations together."}
        </Copy>
        <View style={{ flexDirection: "row", gap: 14 }}>
          {compare.map((id) => (
            <View key={id} style={{ flex: 1, minWidth: 0, gap: 10 }}>
              <StyleVisual styleId={id} />
              <Heading level={3}>{styleFeatures[id].short}</Heading>
              <Copy muted>{styleFeatures[id].cue}</Copy>
            </View>
          ))}
        </View>
      </View>
      <Disclosure title="About these style examples">
        <Copy muted>
          Original digital teaching illustrations created for this project. They
          illustrate transparency, edge and mark decisions; they are not scans
          of physical watercolour or botanical specimen references. No named
          artist’s painting is reproduced. Real, permissioned watercolour
          examples remain a curation follow-up.
        </Copy>
      </Disclosure>
    </View>
  );
}
