import { Text, View } from "react-native";
import Svg, { Ellipse, G, Line, Path, Polygon, Rect } from "react-native-svg";
import {
  compositionModelLibrary,
  selectCompositionModels,
  type CompositionModelId,
  type CompositionModelsInput,
} from "../lib/compositionModels";
import { colors, styles } from "./ui";
import { studyText, conciseText } from "../lib/coachingPresentation";

const paper = "#F7F5EC",
  light = "#FDFCFA",
  middle = "#AAB7A7",
  dark = "#465C50",
  pencil = "#6F8074";
function Focus({ x, y }: { x: number; y: number }) {
  return (
    <G>
      <Ellipse cx={x} cy={y} rx={8} ry={5} fill={dark} />
      <Ellipse
        cx={x}
        cy={y}
        rx={15}
        ry={12}
        fill="none"
        stroke={colors.ochre}
        strokeWidth={1.5}
      />
    </G>
  );
}
function QuietMasses() {
  return (
    <Path
      d="M17 115 Q67 82 110 101 Q151 120 190 95 Q230 86 303 110 L303 156 L17 156 Z"
      fill={middle}
      fillOpacity={0.62}
    />
  );
}

export function CompositionModelDiagram({
  model,
}: {
  model: CompositionModelId;
}) {
  const description = compositionModelLibrary[model];
  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={`${description.name}: ${description.description} Instructor thumbnail; use this as a planning idea.`}
      style={{
        width: "100%",
        aspectRatio: 1.8,
        overflow: "hidden",
        borderRadius: 12,
        backgroundColor: paper,
      }}
    >
      <Svg
        width="100%"
        height="100%"
        viewBox="0 0 320 180"
        accessible={false}
        aria-hidden={true}
      >
        <Rect
          x={14}
          y={16}
          width={292}
          height={142}
          rx={3}
          fill={light}
          stroke={pencil}
          strokeWidth={0.8}
        />
        {model === "s_curve" && (
          <>
            <QuietMasses />
            <Path
              d="M46 145 C258 128 71 100 235 57"
              fill="none"
              stroke={light}
              strokeWidth={22}
            />
            <Path
              d="M46 145 C258 128 71 100 225 61 M215 62 L225 61 L220 72"
              fill="none"
              stroke={colors.accent}
              strokeWidth={2}
              strokeLinecap="round"
            />
            <Focus x={239} y={53} />
          </>
        )}
        {model === "diagonal" && (
          <>
            <Polygon
              points="24,145 64,148 251,53 243,31"
              fill={middle}
              fillOpacity={0.65}
            />
            <Path
              d="M40 140 L230 52 M220 53 L230 52 L224 62"
              fill="none"
              stroke={colors.accent}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <Focus x={242} y={45} />
          </>
        )}
        {model === "l_foreground" && (
          <>
            <Path
              d="M17 39 L56 39 L56 120 L240 120 L240 155 L17 155 Z"
              fill={middle}
              stroke={pencil}
              strokeWidth={1}
            />
            <Rect
              x={207}
              y={64}
              width={33}
              height={43}
              rx={3}
              fill={middle}
              fillOpacity={0.6}
            />
            <Focus x={226} y={82} />
          </>
        )}
        {(model === "high_horizon" || model === "low_horizon") && (
          <>
            <Rect
              x={15}
              y={model === "high_horizon" ? 55 : 118}
              width={290}
              height={model === "high_horizon" ? 102 : 39}
              fill={middle}
              fillOpacity={0.57}
            />
            <Line
              x1={15}
              y1={model === "high_horizon" ? 55 : 118}
              x2={305}
              y2={model === "high_horizon" ? 55 : 118}
              stroke={colors.accent}
              strokeWidth={1.5}
              strokeDasharray="5 4"
            />
            {model === "high_horizon" && (
              <Path
                d="M17 142 Q84 100 151 138 Q214 152 303 130 L303 157 L17 157 Z"
                fill={dark}
                fillOpacity={0.65}
              />
            )}
            <Focus x={224} y={model === "high_horizon" ? 76 : 130} />
          </>
        )}
        {model === "dominant_foreground" && (
          <>
            <Path
              d="M17 106 Q78 75 131 108 Q189 124 238 98 Q273 87 303 108 L303 156 L17 156 Z"
              fill={middle}
            />
            <Path
              d="M17 141 Q66 124 111 137 L160 153 L303 143 L303 156 L17 156 Z"
              fill={dark}
              fillOpacity={0.55}
            />
            <Path
              d="M134 153 Q141 121 191 95 L204 98 Q159 127 158 154 Z"
              fill={light}
            />
            <Focus x={218} y={86} />
          </>
        )}
        {model === "off_center" && (
          <>
            <Line
              x1={111}
              y1={17}
              x2={111}
              y2={156}
              stroke={pencil}
              strokeOpacity={0.2}
              strokeDasharray="3 5"
            />
            <Line
              x1={210}
              y1={17}
              x2={210}
              y2={156}
              stroke={pencil}
              strokeOpacity={0.2}
              strokeDasharray="3 5"
            />
            <Rect
              x={43}
              y={104}
              width={87}
              height={35}
              rx={8}
              fill={middle}
              fillOpacity={0.55}
            />
            <Rect
              x={237}
              y={109}
              width={42}
              height={22}
              rx={5}
              fill={middle}
              fillOpacity={0.4}
            />
            <Focus x={212} y={66} />
          </>
        )}
        {model === "triangle" && (
          <>
            <Polygon
              points="65,139 176,38 272,139"
              fill="none"
              stroke={pencil}
              strokeWidth={1}
              strokeDasharray="5 4"
            />
            <Ellipse cx={83} cy={126} rx={28} ry={14} fill={middle} />
            <Ellipse
              cx={250}
              cy={127}
              rx={19}
              ry={11}
              fill={middle}
              fillOpacity={0.75}
            />
            <Focus x={175} y={52} />
          </>
        )}
        {model === "frame_in_frame" && (
          <>
            <Path
              d="M17 29 L64 29 L64 127 L263 127 L263 29 L303 29 L303 156 L17 156 Z"
              fill={middle}
              fillOpacity={0.68}
            />
            <Rect
              x={80}
              y={35}
              width={168}
              height={77}
              rx={2}
              fill="none"
              stroke={pencil}
              strokeWidth={1}
            />
            <Focus x={210} y={79} />
          </>
        )}
        {model === "big_light_dark" && (
          <>
            <Rect
              x={15}
              y={28}
              width={290}
              height={129}
              fill={middle}
              fillOpacity={0.65}
            />
            <Path
              d="M29 48 L191 32 L285 63 L245 116 L98 145 L22 105 Z"
              fill={light}
              stroke={pencil}
              strokeOpacity={0.3}
              strokeWidth={0.8}
            />
            <Focus x={221} y={84} />
          </>
        )}
        {model === "connected_shadow" && (
          <>
            <Path
              d="M25 133 L64 107 L111 119 L149 88 L190 96 L215 83 L241 115 L291 123 L291 147 L250 139 L198 129 L153 119 L108 142 L68 133 L35 150 Z"
              fill={middle}
              stroke={pencil}
              strokeWidth={1}
            />
            <Focus x={218} y={87} />
          </>
        )}
        {model === "quiet_background" && (
          <>
            <Path
              d="M23 69 Q67 44 117 72 Q160 90 192 66 Q232 57 293 83 L293 125 Q235 102 180 120 Q121 107 69 129 L23 111 Z"
              fill={middle}
              fillOpacity={0.32}
            />
            <Rect x={207} y={77} width={14} height={26} fill={dark} />
            <Rect x={223} y={88} width={8} height={15} fill={dark} />
            <Ellipse
              cx={218}
              cy={91}
              rx={24}
              ry={21}
              fill="none"
              stroke={colors.ochre}
              strokeWidth={1.5}
            />
          </>
        )}
        {model === "lead_in" && (
          <>
            <Polygon
              points="17,67 78,43 116,99 96,155 17,155"
              fill={middle}
              fillOpacity={0.65}
            />
            <Polygon
              points="244,68 303,47 303,156 249,143 220,90"
              fill={middle}
              fillOpacity={0.65}
            />
            <Path
              d="M100 155 L205 72 M249 155 L229 75"
              fill="none"
              stroke={pencil}
              strokeWidth={1.5}
            />
            <Path
              d="M162 146 Q172 112 207 80 M197 84 L207 80 L202 91"
              fill="none"
              stroke={colors.accent}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <Focus x={221} y={63} />
          </>
        )}
        {model === "supporting_masses" && (
          <>
            <Path
              d="M37 92 Q56 57 95 81 L109 126 L42 134 Z"
              fill={middle}
              fillOpacity={0.65}
            />
            <Path
              d="M133 111 Q151 84 180 106 L185 138 L137 140 Z"
              fill={middle}
              fillOpacity={0.5}
            />
            <Rect x={211} y={71} width={17} height={35} rx={2} fill={dark} />
            <Rect x={231} y={85} width={10} height={21} rx={2} fill={dark} />
            <Ellipse
              cx={227}
              cy={87}
              rx={25}
              ry={22}
              fill="none"
              stroke={colors.ochre}
              strokeWidth={1.5}
            />
          </>
        )}
        {model === "big_shapes" && (
          <>
            <Path
              d="M17 97 Q80 74 137 96 Q200 108 252 88 L303 98 L303 157 L17 157 Z"
              fill={middle}
            />
            <Path
              d="M17 141 Q88 117 146 143 Q220 151 303 130 L303 157 L17 157 Z"
              fill={dark}
              fillOpacity={0.7}
            />
            <Focus x={224} y={89} />
          </>
        )}
      </Svg>
    </View>
  );
}

export default function CompositionModels(
  props: CompositionModelsInput & { study?: boolean; hideHeading?: boolean },
) {
  const models = selectCompositionModels(props);
  return (
    <View style={{ gap: 14 }}>
      {!props.hideHeading && (
        <Text style={styles.heading}>Composition model</Text>
      )}
      <Text style={styles.caption}>
        This is a general teaching model, not an exact copy of your image.
      </Text>
      {models.map((model) => (
        <View key={model.id} style={[styles.card, { padding: 16, gap: 10 }]}>
          <Text style={{ ...styles.heading, fontSize: 17, lineHeight: 23 }}>
            {model.name}
          </Text>
          <CompositionModelDiagram model={model.id} />
          <Text style={styles.caption}>
            Instructor thumbnail · Use this as a planning idea
          </Text>
          <View style={{ gap: 3 }}>
            <Text
              style={{
                ...styles.caption,
                color: colors.ink,
                fontWeight: "600",
              }}
            >
              {props.study ? "What this model shows" : "When to use it"}
            </Text>
            <Text style={styles.caption}>
              {props.study ? model.description : model.whenToUse}
            </Text>
          </View>
          <View style={{ gap: 3 }}>
            <Text
              style={{
                ...styles.caption,
                color: colors.ink,
                fontWeight: "600",
              }}
            >
              {props.study ? "Study this idea" : "Relate to your study"}
            </Text>
            <Text style={styles.caption}>
              {props.study
                ? studyText(
                    model.application,
                    "Compare this model with the decisions you want to understand.",
                  )
                : conciseText(model.application)}
            </Text>
          </View>
          {props.study && (
            <Text
              style={{
                ...styles.caption,
                color: colors.accent,
                fontWeight: "600",
              }}
            >
              Optional next study variation
            </Text>
          )}
          <Text style={{ ...styles.body, fontSize: 14, lineHeight: 22 }}>
            {props.study
              ? studyText(
                  model.action,
                  "If useful, test this arrangement in a separate small study.",
                )
              : conciseText(model.action)}
          </Text>
        </View>
      ))}
    </View>
  );
}
