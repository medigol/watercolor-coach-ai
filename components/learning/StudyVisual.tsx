import { useId } from "react";
import Svg, {
  Circle,
  Defs,
  G,
  Line,
  LinearGradient,
  Path,
  Rect,
  Stop,
  Text as SvgText,
} from "react-native-svg";
import { View, Text } from "react-native";
import type { LessonStep } from "../../learning/types";
import {
  perspectiveGuide as p,
  planeCorners as c,
} from "../../learning/visualGuides";
import { learnStyles } from "./LearningUI";
export { default as StyleVisual } from "./StyleArtwork";
const labels = {
  water:
    "Separate comparisons: pigment concentration changes across three irregular washes; a second row contrasts a repeatable brush load with a pooled bead.",
  values:
    "The same illustrated hill, cottage and foreground grouped into light, middle and dark masses. This is a planning diagram, not an automatic grayscale measurement.",
  edges:
    "Hard: abrupt change. Soft: a gradual boundary. Lost: a short boundary disappears where a neighbouring passage has the same value; other edges remain visible.",
  drawing:
    "A two-point perspective construction: top and bottom edges on the left plane meet the left vanishing point, while those on the right meet the right vanishing point.",
  landscape:
    "An illustrated three-mass study plan: open light, a connected middle distance and a selected darker near mass. These choices are options, not universal rules for distance.",
};
function SmallScene({ x, tonal = false }: { x: number; tonal?: boolean }) {
  return (
    <G transform={`translate(${x},30)`}>
      <Rect width={245} height={165} fill={tonal ? "#f8f2e2" : "#d6e2db"} />
      <Path
        d="M0 100L37 69L73 81L122 44L168 72L213 57L245 80V165H0Z"
        fill={tonal ? "#91a39a" : "#9bafa1"}
      />
      <Path
        d="M0 151Q60 108 107 139T245 122V165H0Z"
        fill={tonal ? "#365853" : "#526e5c"}
      />
      <Path
        d="M134 105L150 87L170 102V125H134Z"
        fill={tonal ? "#f8f2e2" : "#e3c38f"}
      />
      <Path
        d="M130 104L150 83L175 102"
        stroke={tonal ? "#365853" : "#975e47"}
        strokeWidth={5}
        fill="none"
      />
      {!tonal && (
        <>
          <Path
            d="M20 111L24 86M32 108L39 87M217 116V92"
            stroke="#6a895b"
            strokeWidth={4}
          />
          <Path
            d="M55 30Q81 10 105 31T154 30"
            stroke="#f8f2e2"
            strokeWidth={9}
            fill="none"
          />
          <Rect x={146} y={108} width={5} height={12} fill="#536c60" />
        </>
      )}
    </G>
  );
}
export default function StudyVisual({ kind, caption = true }: { kind: LessonStep["visual"]; caption?: boolean }) {
  const uid = useId().replace(/:/g, "");
  const id = (s: string) => `guide-${uid}-${s}`;
  return (
    <View style={{ gap: 8 }}>
      <View
        accessibilityRole="image"
        accessibilityLabel={labels[kind]}
        style={{
          width: "100%",
          aspectRatio: 1.8,
          backgroundColor: "#f8f2e2",
          borderRadius: 8,
          overflow: "hidden",
        }}
      >
        <Svg
          aria-hidden={true}
          accessible={false}
          width="100%"
          height="100%"
          viewBox="0 0 600 330"
        >
          <Defs>
            <LinearGradient id={id("wash")} x1="0" y1="0" x2=".3" y2="1">
              <Stop offset="0" stopColor="#356b78" stopOpacity={0.55} />
              <Stop offset=".72" stopColor="#65958e" stopOpacity={0.7} />
              <Stop offset="1" stopColor="#245563" stopOpacity={0.95} />
            </LinearGradient>
            <LinearGradient id={id("soft")} x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0" stopColor="#477771" />
              <Stop offset=".64" stopColor="#477771" />
              <Stop offset="1" stopColor="#f8f2e2" />
            </LinearGradient>
          </Defs>
          {kind === "water" && (
            <>
              {[0, 1, 2].map((n) => (
                <G
                  key={n}
                  transform={`translate(${28 + n * 190},15)`}
                  opacity={[0.95, 0.58, 0.28][n]}
                >
                  <Path
                    d="M7 29Q30 22 49 26T97 24L141 29Q151 48 146 72L149 105Q126 115 104 110T54 113L9 107Q2 87 7 64Z"
                    fill={`url(#${id("wash")})`}
                  />
                  <Path
                    d="M11 107Q34 113 56 109T105 108L143 105"
                    stroke="#285865"
                    strokeWidth={2}
                    opacity={0.55}
                    fill="none"
                  />
                </G>
              ))}
              {["Less dilute", "More dilute", "Pale mixture"].map((s, n) => (
                <SvgText
                  key={s}
                  x={105 + n * 190}
                  y={155}
                  textAnchor="middle"
                  fill="#253c3c"
                  fontSize={17}
                >
                  {s}
                </SvgText>
              ))}
              <Path
                d="M48 220Q88 207 124 215T237 218L243 245Q180 252 130 242T47 246Z"
                fill={`url(#${id("wash")})`}
              />
              <Path
                d="M337 220Q384 209 420 221L531 213Q557 229 531 250L473 245Q418 256 338 244Z"
                fill={`url(#${id("wash")})`}
              />
              <Path
                d="M526 214Q556 230 530 250"
                stroke="#285865"
                strokeWidth={6}
                opacity={0.65}
                fill="none"
              />
              <Circle
                cx={535}
                cy={230}
                r={23}
                fill="none"
                stroke="#8e573f"
                strokeWidth={1.2}
              />
              <SvgText
                x={143}
                y={292}
                textAnchor="middle"
                fill="#253c3c"
                fontSize={17}
              >
                Repeatable load
              </SvgText>
              <SvgText
                x={444}
                y={292}
                textAnchor="middle"
                fill="#253c3c"
                fontSize={17}
              >
                Extra liquid / bead
              </SvgText>
            </>
          )}
          {(kind === "values" || kind === "landscape") && (
            <>
              <SmallScene x={25} />
              <SmallScene x={330} tonal />
              <SvgText
                x={145}
                y={228}
                textAnchor="middle"
                fill="#253c3c"
                fontSize={17}
              >
                Illustrated colour study
              </SvgText>
              <SvgText
                x={453}
                y={228}
                textAnchor="middle"
                fill="#253c3c"
                fontSize={17}
              >
                Three-value plan
              </SvgText>
              {["Light", "Middle", "Dark"].map((s, n) => (
                <G key={s}>
                  <Rect
                    x={330 + n * 82}
                    y={254}
                    width={68}
                    height={31}
                    fill={["#f8f2e2", "#91a39a", "#365853"][n]}
                    stroke="#667a70"
                  />
                  <SvgText
                    x={364 + n * 82}
                    y={310}
                    textAnchor="middle"
                    fill="#253c3c"
                    fontSize={16}
                  >
                    {s}
                  </SvgText>
                </G>
              ))}
              <Path
                d="M283 104H315M305 95L315 104L305 113"
                stroke="#416961"
                strokeWidth={2}
                fill="none"
              />
            </>
          )}
          {kind === "edges" && (
            <>
              <Path d="M30 70H165V227H30Z" fill="#477771" />
              <Path d="M222 70H365V227H222Z" fill={`url(#${id("soft")})`} />
              <Path d="M413 70H531V227H413Z" fill="#477771" />
              <Path d="M531 128H577V177H531Z" fill="#477771" />
              <Path
                d="M532 110L559 96M531 191L560 204"
                stroke="#8e573f"
                strokeWidth={1.3}
              />
              {["Abrupt", "Gradual", "Lost interval"].map((s, n) => (
                <SvgText
                  key={s}
                  x={98 + n * 196}
                  y={275}
                  textAnchor="middle"
                  fill="#253c3c"
                  fontSize={18}
                >
                  {s}
                </SvgText>
              ))}
            </>
          )}
          {kind === "drawing" && (
            <>
              <Line
                x1={12}
                y1={p.horizon}
                x2={588}
                y2={p.horizon}
                stroke="#9aa79b"
                strokeWidth={1}
              />
              {[p.left, p.right].map((vp, n) => (
                <G key={n}>
                  <Line
                    x1={vp.x}
                    y1={vp.y}
                    x2={p.top.x}
                    y2={p.top.y}
                    stroke="#9a9a85"
                    strokeDasharray="6 5"
                  />
                  <Line
                    x1={vp.x}
                    y1={vp.y}
                    x2={p.bottom.x}
                    y2={p.bottom.y}
                    stroke="#9a9a85"
                    strokeDasharray="6 5"
                  />
                  <Circle cx={vp.x} cy={vp.y} r={4} fill="#8e573f" />
                  <SvgText
                    x={vp.x}
                    y={51}
                    textAnchor="middle"
                    fill="#253c3c"
                    fontSize={16}
                  >
                    {n === 0 ? "A" : "B"}
                  </SvgText>
                </G>
              ))}
              <Path
                d={`M${c.leftTop.x} ${c.leftTop.y}L${p.top.x} ${p.top.y}V${p.bottom.y}L${c.leftBottom.x} ${c.leftBottom.y}Z`}
                fill="#d6c59e"
                fillOpacity={0.55}
                stroke="#416961"
                strokeWidth={2}
              />
              <Path
                d={`M${p.top.x} ${p.top.y}L${c.rightTop.x} ${c.rightTop.y}L${c.rightBottom.x} ${c.rightBottom.y}L${p.bottom.x} ${p.bottom.y}Z`}
                fill="#89a49a"
                fillOpacity={0.55}
                stroke="#416961"
                strokeWidth={2}
              />
              <SvgText
                x={300}
                y={307}
                textAnchor="middle"
                fill="#253c3c"
                fontSize={17}
              >
                One viewpoint · two sets of receding edges
              </SvgText>
            </>
          )}
        </Svg>
      </View>
      {caption && <Text style={learnStyles.muted}>
        {labels[kind]} Original explanatory illustration; compare with your own
        dry paint tests.
      </Text>}
    </View>
  );
}
