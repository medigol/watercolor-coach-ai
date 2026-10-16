import type { ReactNode } from "react";
import { Text, View } from "react-native";
import type { PaintingAnalysisResult } from "../shared/paintingAnalysis";
import { colors, styles } from "./ui";
import { design } from "./theme";
import { sameLearningInsight } from "../shared/coachingEvidence";

export default function ColourValueAnalysis({
  source,
  renderEvidence,
  renderValueEvidence,
}: {
  source: PaintingAnalysisResult;
  renderEvidence?: (index: number) => ReactNode;
  renderValueEvidence?: () => ReactNode;
}) {
  const c = source.canonicalAnalysis,
    colour = c.colourAnalysis;
  const evidence = colour?.visibleColours.map((_, index) =>
    renderEvidence?.(index),
  );
  const hasLocatedColours = evidence?.some(Boolean) ?? false;
  const value =
    colour?.valueHierarchy ||
    c.facts
      .filter((f) => f.domain === "colour_value")
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
        (!sameLearningInsight(text || "", value) &&
          !all
            .slice(0, index)
            .some(([, previous]) =>
              sameLearningInsight(previous || "", text || ""),
            )),
    );
  return (
    <View testID="colour-value-analysis" style={{ gap: design.space.lg }}>
      {!!colour?.visibleColours.length && (
        <View style={{ gap: 10 }}>
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
                  {hasLocatedColours && !sourceEvidence && (
                    <Text style={styles.caption}>
                      No confidently located source detail for this colour.
                    </Text>
                  )}
                  {item.roleId && (
                    <Text style={styles.caption}>
                      {c.visualRoles.find((r) => r.id === item.roleId)?.role}{" "}
                      area
                    </Text>
                  )}
                </View>
              );
            })}
          </View>
          {!hasLocatedColours && (
            <Text style={styles.caption}>
              Source regions were not located confidently for these colours.
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
            <Text style={styles.body}>{text}</Text>
            {title === "Value hierarchy" && renderValueEvidence?.()}
          </View>
        ))}
      {!!colour?.technicalAssessment && (
        <View
          style={{
            padding: 14,
            borderRadius: design.radius.control,
            backgroundColor:
              colour.technicalAssessment.kind === "issue"
                ? "#F9F0E2"
                : colors.pale,
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
              }[colour.technicalAssessment.kind]
            }
          </Text>
          <Text style={styles.body}>
            {!paragraphs.some(([, text]) =>
              sameLearningInsight(
                text || "",
                colour.technicalAssessment!.explanation,
              ),
            ) && colour.technicalAssessment.explanation}
          </Text>
        </View>
      )}
      {!!colour?.recreationMixes.length && (
        <View style={{ gap: 12 }}>
          <Text style={[styles.heading, { fontSize: 17 }]}>
            Recreate this look
          </Text>
          <Text style={styles.caption}>
            Possible watercolor pigments for approximating the visible effect,
            not the original formula.
          </Text>
          {colour.recreationMixes.map((mix, index) => (
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
            change the result. Test on scrap first.
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
