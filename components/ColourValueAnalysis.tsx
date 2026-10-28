import type { ReactNode } from "react";
import { Text, View } from "react-native";
import type { PaintingAnalysisResult } from "../shared/paintingAnalysis";
import { colors, styles } from "./ui";
import { design } from "./theme";
import { sameLearningInsight } from "../shared/coachingEvidence";
import { displayRecreationMixes } from "../shared/coachingDisplay";
import { evidenceProperties } from "../shared/coachingAlignment";

// A shared opening sentence does not make the rest of a teaching paragraph
// redundant. Omit it only when all of its supplied lessons are already covered.
function teachingAlreadyCovered(text: string, previous: string[]): boolean {
  const sentences = (value: string) =>
    value
      .split(/(?<=[.!?])\s+|\n+/)
      .map((s) => s.trim())
      .filter(Boolean);
  const parts = sentences(text);
  return parts.length > 1
    ? parts.every((part) =>
        previous.flatMap(sentences).some((p) => sameLearningInsight(part, p)),
      )
    : previous.some((p) => sameLearningInsight(text, p));
}

export default function ColourValueAnalysis({
  source,
  renderEvidence,
  renderValueEvidence,
  omittedInsightIds = [],
  displayText = (value: string) => value,
}: {
  source: PaintingAnalysisResult;
  omittedInsightIds?: readonly string[];
  displayText?: (value: string) => string;
  renderEvidence?: (index: number) => ReactNode;
  renderValueEvidence?: () => ReactNode;
}) {
  const c = source.canonicalAnalysis,
    colour = c.colourAnalysis;
  const mixes = displayRecreationMixes(colour?.recreationMixes ?? []);
  const evidence = colour?.visibleColours.map((_, index) =>
    renderEvidence?.(index),
  );
  const missingColourCount =
    colour?.visibleColours.filter((_, index) => !evidence?.[index]).length ?? 0;
  const hasLocatedColours = evidence?.some(Boolean) ?? false;
  const suppliedValue = colour?.valueHierarchy ?? "";
  const chromaticOnly = (text: string) => {
    const properties = evidenceProperties(text);
    return properties.includes("colour") && !properties.includes("value");
  };
  const value =
    (suppliedValue && !chromaticOnly(suppliedValue) ? suppliedValue : "") ||
    c.facts
      .filter(
        (f) =>
          f.domain === "colour_value" &&
          evidenceProperties(f.observation).includes("value"),
      )
      .map((f) => f.observation)
      .join(" ");
  const paragraphs = [
    ["Colour strategy", colour?.colourStrategy],
    ["Value hierarchy", value],
    ["Chroma hierarchy", colour?.chromaHierarchy],
    ["Temperature & depth", colour?.temperatureRelationship],
  ]
    .filter(([, text]) => !!text)
    .filter(
      ([label, text], index, all) =>
        label === "Value hierarchy" ||
        !teachingAlreadyCovered(text || "", [
          value,
          ...all.slice(0, index).map(([, previous]) => previous || ""),
        ]),
    );
  const assessment = colour?.technicalAssessment;
  const showAssessment =
    assessment &&
    displayText(assessment.explanation).trim() &&
    !teachingAlreadyCovered(
      assessment.explanation,
      paragraphs.map(([, text]) => text || ""),
    ) &&
    (!assessment.insightId ||
      !omittedInsightIds.includes(assessment.insightId));
  return (
    <View testID="colour-value-analysis" style={{ gap: design.space.lg }}>
      {!!colour?.visibleColours.length && (
        <View testID="visible-colour-evidence" style={{ gap: 10 }}>
          <Text style={[styles.body, { color: colors.ink, fontWeight: "600" }]}>
            Visible colour evidence
          </Text>
          <Text style={styles.caption}>
            Original painting details where confidently located. Small colour
            indicators are approximate, not original pigment identification.
          </Text>
          <View style={{ gap: 14 }}>
            {colour.visibleColours.map((item, index) => {
              const sourceEvidence = evidence?.[index];
              const role = c.visualRoles.find((r) => r.id === item.roleId);
              return (
                <View
                  key={index}
                  style={{
                    width: "100%",
                    minWidth: 0,
                    gap: 5,
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      gap: 7,
                      alignItems: "center",
                    }}
                  >
                    <View
                      accessibilityLabel={`Approximate analysis colour: ${item.label}`}
                      style={{
                        width: 12,
                        height: 12,
                        borderRadius: 3,
                        backgroundColor: item.approximateHex,
                        borderWidth: 0.5,
                        borderColor: colors.border,
                      }}
                    />
                    <Text
                      style={[styles.caption, { color: colors.ink, flex: 1 }]}
                    >
                      {item.label}
                    </Text>
                  </View>
                  {sourceEvidence}
                  {missingColourCount === 1 && !sourceEvidence && (
                    <Text style={styles.caption}>
                      No confidently located source detail for this colour.
                    </Text>
                  )}
                  {role && sourceEvidence && (
                    <Text style={styles.caption}>{role.role} area</Text>
                  )}
                </View>
              );
            })}
          </View>
          {missingColourCount >= 2 && (
            <Text style={styles.caption}>
              {hasLocatedColours
                ? "Some listed colours are visible in the painting, but their exact source regions were not located confidently."
                : "Source regions were not located confidently for these colours."}
            </Text>
          )}
        </View>
      )}
      {paragraphs
        .filter(([, text]) => !!text)
        .map(([title, text]) => (
          <View key={title} style={{ gap: 4 }}>
            <Text
              style={[styles.body, { color: colors.ink, fontWeight: "600" }]}
            >
              {title}
            </Text>
            <Text style={styles.body}>{displayText(text || "")}</Text>
            {title === "Value hierarchy" && renderValueEvidence?.()}
          </View>
        ))}
      {showAssessment && assessment && (
        <View
          style={{
            padding: 14,
            borderRadius: design.radius.control,
            backgroundColor:
              assessment.kind === "issue" ? "#F9F0E2" : colors.pale,
            gap: 6,
          }}
        >
          <Text style={[styles.body, { color: colors.ink, fontWeight: "600" }]}>
            {
              {
                coherent: "Coherent colour hierarchy",
                issue: "Technical opportunity",
                stylistic_alternative: "Stylistic alternative",
                uncertain: "A tentative interpretation",
              }[assessment.kind]
            }
          </Text>
          <Text style={styles.body}>{displayText(assessment.explanation)}</Text>
        </View>
      )}
      {!!mixes.length && (
        <View style={{ gap: 12 }}>
          <Text style={[styles.heading, { fontSize: 17 }]}>
            Colour-mixing starting points
          </Text>
          <Text style={styles.caption}>
            Possible watercolour pigments for approximating the visible effect,
            not the original formula.
          </Text>
          {mixes.map((mix, index) => (
            <View
              key={index}
              style={{
                gap: 5,
                borderLeftWidth: 2,
                borderColor: colors.ochre,
                paddingLeft: 12,
              }}
            >
              <Text
                style={[styles.body, { fontWeight: "600", color: colors.ink }]}
              >
                {mix.target}
              </Text>
              <Text style={styles.body}>{mix.pigments.join(" + ")}</Text>
              {!!mix.startingRatio && (
                <Text style={styles.caption}>
                  Approximate starting ratio · {mix.startingRatio}
                </Text>
              )}
              <Text style={styles.caption}>{mix.use}</Text>
            </View>
          ))}
          <Text style={styles.caption}>
            Starting points only. Brand, paper, pigment strength and water load
            change the result. Lighten transparent colour with water and paper
            white; test on scrap first.
          </Text>
        </View>
      )}
      {!colour && (
        <Text style={styles.caption}>
          This saved analysis includes value observations. Detailed colour
          relationships and mixes were not supplied.
        </Text>
      )}
    </View>
  );
}
