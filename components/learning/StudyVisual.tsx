import Svg, {
  Circle,
  Defs,
  Ellipse,
  G,
  Line,
  LinearGradient,
  Path,
  Rect,
  Stop,
  Text as SvgText,
} from "react-native-svg";
import { View, Text } from "react-native";
import type { StyleId, LessonStep } from "../../learning/types";
import { learnStyles } from "./LearningUI";
/** Original vector teaching diagrams. No artist imitation or copyrighted art. */
export function StyleVisual({ styleId }: { styleId: StyleId }) {
  return (
    <View
      accessibilityRole="image"
      accessibilityLabel={
        {
          atmospheric:
            "Original diagram: soft pale distant hills with a restrained darker foreground",
          urban:
            "Original diagram: selective architectural contours and pale colour masses",
          botanical:
            "Original diagram: observed leaf silhouettes, clear edges and transparent colour overlaps",
          expressive:
            "Original diagram: broad directional marks, simplified masses and invented colour",
        }[styleId]
      }
      style={{
        width: "100%",
        aspectRatio: 1.7,
        borderRadius: 12,
        overflow: "hidden",
      }}
    >
      <Svg width="100%" height="100%" viewBox="0 0 510 300">
        <Defs>
          <LinearGradient id={`sky-${styleId}`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#c5d8d8" />
            <Stop offset="1" stopColor="#faf5e7" />
          </LinearGradient>
        </Defs>
        <Rect width="510" height="300" fill="#f6f0e1" />
        {styleId === "atmospheric" && (
          <>
            <Rect width="510" height="300" fill={`url(#sky-${styleId})`} />
            <Path
              d="M0 146Q80 116 140 134T280 120T510 148V210H0Z"
              fill="#abc0be"
              opacity={0.5}
            />
            <Path
              d="M0 168Q100 147 170 166T360 152T510 170V230H0Z"
              fill="#8fa8a5"
              opacity={0.68}
            />
            <Path d="M0 252Q120 198 240 237T510 217V300H0Z" fill="#4c6a62" />
            <Path
              d="M100 276Q220 233 280 239T420 216"
              stroke="#e9dfba"
              strokeWidth={7}
              fill="none"
            />
            <Path d="M327 203L340 191L353 204V220H327Z" fill="#b17652" />
          </>
        )}
        {styleId === "urban" && (
          <>
            <Path
              d="M20 220V107L110 90V226M116 223V148L192 116V228M205 224V63L314 86V227M325 226V121L453 144V230"
              fill="#d9c498"
              opacity={0.6}
            />
            <Path
              d="M8 241L510 204M24 216L23 107L110 90L112 166M110 90L142 118M119 217V148L190 116M207 222V63L315 86V221M207 63L247 41L337 78M328 220V121L453 144L460 230M245 88V127M283 97V133M247 160V198M284 164V201M365 149V178M405 158V188M39 126V159M76 121V154"
              stroke="#405d59"
              strokeWidth={2.5}
              fill="none"
              strokeLinecap="round"
            />
            <Path
              d="M0 262L225 225L290 250L510 222V300H0Z"
              fill="#9bb5b2"
              opacity={0.7}
            />
            <Path d="M185 275L242 230" stroke="#926549" strokeWidth={3} />
          </>
        )}
        {styleId === "botanical" && (
          <>
            <Path
              d="M176 282Q237 165 296 31M230 180L122 103M250 136L365 87M205 230L343 207"
              stroke="#6e8659"
              strokeWidth={3}
              fill="none"
            />
            <Path
              d="M228 177Q113 186 102 74Q205 75 228 177Z"
              fill="#7d9e6e"
              opacity={0.8}
            />
            <Path
              d="M248 141Q273 32 397 61Q366 149 248 141Z"
              fill="#aeb873"
              opacity={0.76}
            />
            <Path
              d="M206 235Q280 157 379 192Q325 276 206 235Z"
              fill="#577f66"
              opacity={0.8}
            />
            <Path
              d="M290 51Q242 15 230 52Q235 91 281 89Q326 114 342 75Q340 40 290 51Z"
              fill="#b97680"
              opacity={0.55}
            />
            <Path
              d="M130 105L220 172M270 134L362 89M226 231L340 207"
              stroke="#f0efd5"
              strokeWidth={1.5}
              fill="none"
            />
          </>
        )}
        {styleId === "expressive" && (
          <>
            <Path
              d="M-8 73L350 22L510 83L258 131L32 117Z"
              fill="#d8a15c"
              opacity={0.76}
            />
            <Path
              d="M19 191L122 111L234 140L327 88L491 168L395 218L235 190L121 222Z"
              fill="#749d9d"
              opacity={0.8}
            />
            <Path
              d="M-10 265L180 196L296 246L510 183L530 250L410 300H0Z"
              fill="#3a6665"
            />
            <Path
              d="M195 217L227 115L257 202L298 227"
              stroke="#ac5c4b"
              strokeWidth={18}
              fill="none"
            />
            <Path
              d="M46 248L156 215M330 181L404 132"
              stroke="#f2dfab"
              strokeWidth={9}
            />
            <Circle cx={385} cy={56} r={12} fill="#b66b49" opacity={0.7} />
          </>
        )}
      </Svg>
    </View>
  );
}
export default function StudyVisual({ kind }: { kind: LessonStep["visual"] }) {
  const labels = {
    water:
      "Dilution comparison: the same pigment in three progressively lighter swatches",
    values: "Three value families: light paper, middle mass and a limited dark",
    edges:
      "Boundary comparison: abrupt, gradual and a locally merging interval",
    drawing:
      "Two box planes with observed receding edges; not a universal perspective template",
    landscape:
      "A possible three-mass landscape with pale distance and a darker connected near bank",
  };
  return (
    <View style={{ gap: 8 }}>
      {kind === "landscape" ? (
        <StyleVisual styleId="atmospheric" />
      ) : (
        <View
          accessibilityRole="image"
          accessibilityLabel={labels[kind]}
          style={{
            width: "100%",
            aspectRatio: 1.8,
            backgroundColor: "#f6f0e1",
            borderRadius: 12,
            overflow: "hidden",
          }}
        >
          <Svg width="100%" height="100%" viewBox="0 0 540 300">
            <Defs>
              <LinearGradient id="edge-grad" x1="0" y1="0" x2="1" y2="0">
                <Stop offset="0" stopColor="#557e80" stopOpacity={0} />
                <Stop offset="0.5" stopColor="#557e80" stopOpacity={0.9} />
                <Stop offset="1" stopColor="#557e80" stopOpacity={0} />
              </LinearGradient>
            </Defs>
            {(kind === "water" || kind === "values") &&
              [0, 1, 2].map((n) => (
                <G key={n}>
                  <Rect
                    x={30 + n * 175}
                    y={65}
                    width={130}
                    height={150}
                    rx={kind === "water" ? 12 : 0}
                    fill={
                      kind === "water"
                        ? "#3f7278"
                        : ["#f6f0e1", "#82958d", "#304e48"][n]
                    }
                    opacity={kind === "water" ? [0.9, 0.5, 0.18][n] : 1}
                    stroke="#8b9b8d"
                    strokeWidth={1}
                  />
                  <SvgText
                    x={95 + n * 175}
                    y={250}
                    textAnchor="middle"
                    fill="#253c3c"
                    fontSize={16}
                  >
                    {kind === "water"
                      ? ["Less dilute", "More water", "Pale mixture"][n]
                      : ["Light", "Middle", "Dark"][n]}
                  </SvgText>
                </G>
              ))}
            {kind === "edges" && (
              <>
                <Rect x={30} y={65} width={130} height={150} fill="#557e80" />
                <Rect
                  x={200}
                  y={65}
                  width={145}
                  height={150}
                  fill="url(#edge-grad)"
                />
                <Rect x={385} y={65} width={125} height={150} fill="#557e80" />
                <Rect x={445} y={132} width={80} height={83} fill="#557e80" />
                <SvgText
                  x={90}
                  y={250}
                  textAnchor="middle"
                  fill="#253c3c"
                  fontSize={16}
                >
                  Hard
                </SvgText>
                <SvgText
                  x={270}
                  y={250}
                  textAnchor="middle"
                  fill="#253c3c"
                  fontSize={16}
                >
                  Soft
                </SvgText>
                <SvgText
                  x={450}
                  y={250}
                  textAnchor="middle"
                  fill="#253c3c"
                  fontSize={16}
                >
                  Lost interval
                </SvgText>
              </>
            )}
            {kind === "drawing" && (
              <>
                <Path
                  d="M90 230L90 110L210 70L330 115L330 225L212 265Z M90 110L212 155L330 115M212 155V265"
                  stroke="#446b66"
                  strokeWidth={4}
                  fill="#e4d3af"
                  fillOpacity={0.5}
                />
                <Line
                  x1={212}
                  y1={155}
                  x2={445}
                  y2={76}
                  stroke="#7b8a85"
                  strokeDasharray="7 7"
                />
                <Line
                  x1={330}
                  y1={225}
                  x2={466}
                  y2={179}
                  stroke="#7b8a85"
                  strokeDasharray="7 7"
                />
                <SvgText x={385} y={280} fill="#253c3c" fontSize={15}>
                  Compare slopes
                </SvgText>
              </>
            )}
          </Svg>
        </View>
      )}
      <Text style={learnStyles.muted}>
        {labels[kind]}. Original explanatory vector, not a photograph of paint
        behaviour.
      </Text>
    </View>
  );
}
