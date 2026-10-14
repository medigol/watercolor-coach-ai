import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import Svg, {
  Ellipse,
  G,
  Line,
  Path,
  Polygon,
  Rect,
  Text as SvgText,
} from "react-native-svg";
import {
  planThumbnailStudies,
  type ThumbnailKind,
  type ThumbnailLayout,
  type ThumbnailPlanningInput,
} from "../lib/thumbnailPlanning";
import { colors, styles } from "./ui";

const tone = {
  paper: "#F6F4EB",
  light: "#FCFBF5",
  middle: "#A9B4A7",
  dark: "#42594F",
  line: "#74897B",
  accent: "#A9715A",
};

function Masses({
  layout,
  planning = false,
}: {
  layout: ThumbnailLayout;
  planning?: boolean;
}) {
  const middle = planning ? "#E1E7DC" : tone.middle;
  const dark = planning ? "#829383" : tone.dark;
  if (layout === "street")
    return (
      <G
        stroke={planning ? tone.line : undefined}
        strokeWidth={planning ? 1 : undefined}
      >
        <Polygon points="16,39 78,23 116,67 123,145 16,154" fill={middle} />
        <Polygon points="226,58 259,34 304,44 304,154 212,137" fill={middle} />
        <Path
          d="M16 137 L118 125 L212 116 L304 143 L304 156 L16 156 Z"
          fill={dark}
        />
        <Line
          x1={123}
          y1={145}
          x2={185}
          y2={82}
          stroke={tone.line}
          strokeWidth={1.5}
        />
        <Line
          x1={222}
          y1={144}
          x2={185}
          y2={82}
          stroke={tone.line}
          strokeWidth={1.5}
        />
        <Rect x={213} y={70} width={9} height={23} rx={2} fill={dark} />
      </G>
    );
  if (layout === "landscape")
    return (
      <G
        stroke={planning ? tone.line : undefined}
        strokeWidth={planning ? 1 : undefined}
      >
        <Path
          d="M16 91 Q56 79 102 91 Q161 99 209 77 Q254 74 304 92 L304 145 L16 145 Z"
          fill={middle}
        />
        <Path
          d="M16 137 Q66 117 113 134 Q165 154 214 136 Q260 125 304 142 L304 156 L16 156 Z"
          fill={dark}
        />
        <Path
          d="M71 109 Q128 117 175 98"
          fill="none"
          stroke={tone.light}
          strokeWidth={9}
        />
        <Ellipse cx={221} cy={87} rx={9} ry={5} fill={dark} />
      </G>
    );
  return (
    <G
      stroke={planning ? tone.line : undefined}
      strokeWidth={planning ? 1 : undefined}
    >
      <Path
        d="M43 73 Q82 47 124 67 L152 59 Q195 50 255 84 L273 137 Q235 157 162 143 L69 153 Z"
        fill={middle}
      />
      <Path
        d="M42 128 Q90 111 135 126 L174 119 Q219 121 265 139 L258 155 L59 155 Z"
        fill={dark}
      />
      <Path d="M105 71 L159 66 L154 92 L121 98 Z" fill={tone.light} />
      <Rect x={215} y={78} width={12} height={21} rx={3} fill={dark} />
    </G>
  );
}

function FocusRing({ x = 221, y = 87 }: { x?: number; y?: number }) {
  return (
    <G>
      <Ellipse
        cx={x}
        cy={y}
        rx={16}
        ry={13}
        fill="none"
        stroke={tone.accent}
        strokeWidth={2}
      />
      <Ellipse
        cx={x}
        cy={y}
        rx={20}
        ry={17}
        fill="none"
        stroke={tone.accent}
        strokeWidth={0.8}
        strokeOpacity={0.5}
      />
    </G>
  );
}

function Diagram({
  kind,
  layout,
}: {
  kind: ThumbnailKind;
  layout: ThumbnailLayout;
}) {
  const simplePair = kind === "simplification" || kind === "horizon";
  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={`Generic ${kind.replace(/_/g, " ")} worksheet. Adapt this diagram to your own image; it does not reproduce your subject.`}
      style={{
        width: "100%",
        aspectRatio: 1.9,
        borderRadius: 12,
        overflow: "hidden",
        backgroundColor: tone.paper,
      }}
    >
      <Svg width="100%" height="100%" viewBox="0 0 320 180" accessible={false}>
        {!simplePair && (
          <>
            <Rect
              x={14}
              y={15}
              width={292}
              height={143}
              rx={4}
              fill={tone.light}
              stroke={tone.line}
              strokeWidth={0.8}
            />
            <Masses layout={layout} planning={kind === "big_shapes"} />
          </>
        )}
        {kind === "crop" && (
          <>
            <Rect
              x={14}
              y={15}
              width={58}
              height={143}
              fill={tone.dark}
              fillOpacity={0.13}
            />
            <Rect
              x={72}
              y={15}
              width={234}
              height={12}
              fill={tone.dark}
              fillOpacity={0.13}
            />
            <Rect
              x={72}
              y={151}
              width={234}
              height={7}
              fill={tone.dark}
              fillOpacity={0.13}
            />
            <Rect
              x={292}
              y={27}
              width={14}
              height={124}
              fill={tone.dark}
              fillOpacity={0.13}
            />
            <Rect
              x={72}
              y={27}
              width={220}
              height={124}
              fill="none"
              stroke={colors.accent}
              strokeWidth={2}
              strokeDasharray="6 4"
            />
            <FocusRing />
            <SvgText x={14} y={173} fill={tone.dark} fontSize={11}>
              Quiet the outside · test the frame
            </SvgText>
          </>
        )}
        {kind === "eye_flow" && (
          <>
            <Path
              d={
                layout === "street"
                  ? "M162 146 Q161 115 188 99 L211 91"
                  : "M51 140 Q99 121 134 128 Q181 126 211 91"
              }
              fill="none"
              stroke={colors.accent}
              strokeWidth={3}
              strokeLinecap="round"
            />
            <Path
              d="M201 94 L211 91 L207 102"
              fill="none"
              stroke={colors.accent}
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <FocusRing />
            <SvgText x={14} y={173} fill={tone.dark} fontSize={11}>
              One clear path toward the focal area
            </SvgText>
          </>
        )}
        {(kind === "big_shapes" || kind === "value_mass") && (
          <>
            {kind === "big_shapes" && <FocusRing />}
            <Rect
              x={16}
              y={165}
              width={10}
              height={9}
              fill={tone.light}
              stroke={tone.line}
              strokeWidth={0.5}
            />
            <SvgText x={32} y={173} fill={tone.dark} fontSize={11}>
              Light
            </SvgText>
            <Rect x={101} y={165} width={10} height={9} fill={tone.middle} />
            <SvgText x={117} y={173} fill={tone.dark} fontSize={11}>
              Middle
            </SvgText>
            <Rect x={211} y={165} width={10} height={9} fill={tone.dark} />
            <SvgText x={227} y={173} fill={tone.dark} fontSize={11}>
              Dark
            </SvgText>
          </>
        )}
        {kind === "simplification" && (
          <>
            <Rect
              x={14}
              y={27}
              width={130}
              height={112}
              rx={4}
              fill={tone.light}
              stroke={tone.line}
              strokeWidth={0.8}
            />
            <Rect
              x={176}
              y={27}
              width={130}
              height={112}
              rx={4}
              fill={tone.light}
              stroke={tone.line}
              strokeWidth={0.8}
            />
            {[0, 1, 2].flatMap((row) =>
              [0, 1, 2, 3].map((column) => (
                <Rect
                  key={`${row}-${column}`}
                  x={27 + column * 22}
                  y={57 + row * 21}
                  width={13 + row}
                  height={12}
                  rx={2}
                  fill={row === 2 && column === 3 ? tone.dark : tone.middle}
                />
              )),
            )}
            <Path
              d="M192 65 Q224 46 281 65 L289 111 Q249 119 194 109 Z"
              fill={tone.middle}
            />
            <Rect
              x={269}
              y={98}
              width={12}
              height={15}
              rx={2}
              fill={tone.dark}
            />
            <Path
              d="M149 82 L170 82 M164 77 L170 82 L164 87"
              fill="none"
              stroke={colors.accent}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <SvgText x={38} y={159} fill={tone.dark} fontSize={12}>
              Many marks
            </SvgText>
            <SvgText x={206} y={159} fill={tone.dark} fontSize={12}>
              One wash
            </SvgText>
          </>
        )}
        {kind === "horizon" && (
          <>
            {[
              { x: 14, horizon: 100 },
              { x: 176, horizon: 63 },
            ].map(({ x, horizon }) => (
              <G key={x}>
                <Rect
                  x={x}
                  y={27}
                  width={130}
                  height={112}
                  rx={4}
                  fill={tone.light}
                  stroke={tone.line}
                  strokeWidth={0.8}
                />
                <Rect
                  x={x + 1}
                  y={horizon}
                  width={128}
                  height={138 - horizon}
                  fill={tone.middle}
                />
                <Line
                  x1={x + 1}
                  y1={horizon}
                  x2={x + 129}
                  y2={horizon}
                  stroke={colors.accent}
                  strokeWidth={1.8}
                  strokeDasharray="5 3"
                />
                <Ellipse
                  cx={x + 94}
                  cy={horizon + 7}
                  rx={7}
                  ry={4}
                  fill={tone.dark}
                />
                <Ellipse
                  cx={x + 94}
                  cy={horizon + 7}
                  rx={12}
                  ry={9}
                  fill="none"
                  stroke={tone.accent}
                  strokeWidth={1.4}
                />
              </G>
            ))}
            <SvgText x={49} y={159} fill={tone.dark} fontSize={12}>
              More sky
            </SvgText>
            <SvgText x={204} y={159} fill={tone.dark} fontSize={12}>
              More ground
            </SvgText>
          </>
        )}
      </Svg>
    </View>
  );
}

export default function ThumbnailPlanning(props: ThumbnailPlanningInput) {
  const studies = planThumbnailStudies(props);
  const [notesExpanded, setNotesExpanded] = useState(false);
  const hasSketch = typeof props.sketch === "string" && !!props.sketch.trim();
  const hasValues = typeof props.values === "string" && !!props.values.trim();
  return (
    <View style={{ gap: 14 }}>
      <Text style={styles.heading}>Thumbnail planning</Text>
      <Text style={styles.caption}>
        Use these small studies to test composition and values before painting.
      </Text>
      {studies.map((study) => (
        <View key={study.kind} style={[styles.card, { padding: 16, gap: 10 }]}>
          <Text style={{ ...styles.heading, fontSize: 17, lineHeight: 23 }}>
            {study.title}
          </Text>
          <Diagram kind={study.kind} layout={study.layout} />
          <Text
            style={{ ...styles.caption, color: colors.ink, fontWeight: "600" }}
          >
            {study.purpose}
          </Text>
          <Text style={{ ...styles.body, fontSize: 14, lineHeight: 22 }}>
            {study.action}
          </Text>
          <Text style={styles.caption}>
            Generic planning diagram · Adapt this to your image
          </Text>
        </View>
      ))}
      {(hasSketch || hasValues) && (
        <View style={{ gap: 10 }}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Sketch & value notes"
            accessibilityState={{ expanded: notesExpanded }}
            aria-expanded={notesExpanded}
            onPress={() => setNotesExpanded((current) => !current)}
            style={{
              minHeight: 44,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingHorizontal: 14,
              backgroundColor: colors.pale,
              borderRadius: 12,
            }}
          >
            <Text
              style={{
                ...styles.caption,
                color: colors.accent,
                fontWeight: "600",
              }}
            >
              Sketch &amp; value notes
            </Text>
            <Text style={{ ...styles.caption, color: colors.accent }}>
              {notesExpanded ? "Hide" : "Show"}
            </Text>
          </Pressable>
          {notesExpanded && (
            <View style={[styles.card, { padding: 16, gap: 14 }]}>
              {hasSketch && (
                <View style={{ gap: 4 }}>
                  <Text
                    style={{
                      ...styles.caption,
                      color: colors.ink,
                      fontWeight: "600",
                    }}
                  >
                    Your sketch plan
                  </Text>
                  <Text
                    style={{ ...styles.body, fontSize: 14, lineHeight: 22 }}
                  >
                    {props.sketch}
                  </Text>
                </View>
              )}
              {hasValues && (
                <View style={{ gap: 4 }}>
                  <Text
                    style={{
                      ...styles.caption,
                      color: colors.ink,
                      fontWeight: "600",
                    }}
                  >
                    Your value plan
                  </Text>
                  <Text
                    style={{ ...styles.body, fontSize: 14, lineHeight: 22 }}
                  >
                    {props.values}
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>
      )}
    </View>
  );
}
