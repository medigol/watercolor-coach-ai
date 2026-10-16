import { View } from "react-native";
import Svg, { Circle, G, Line, Path, Polygon } from "react-native-svg";
import {
  createCompositionStructurePlan,
  type CompositionStroke,
} from "../lib/compositionArchetypes";
import {
  projectPoint,
  type ImageFrame,
  type NormalizedPoint,
} from "../lib/imageGeometry";

const ink = "#496F68";
const focal = "#A47735";
const paper = "#FFFEF8";

function pathData(stroke: CompositionStroke, frame: ImageFrame): string {
  const points = stroke.points.map((point) => projectPoint(point, frame));
  const start = points[0];
  if (!start) return "";
  let result = `M${start.x} ${start.y}`;
  if (stroke.smooth && points.length > 2) {
    // Quadratic corners stay inside the supplied anchor hull; there are no
    // invented off-image control points or predetermined curve coordinates.
    for (let index = 1; index < points.length - 1; index++) {
      const point = points[index];
      const next = points[index + 1];
      result += ` Q${point.x} ${point.y} ${(point.x + next.x) / 2} ${(point.y + next.y) / 2}`;
    }
    const end = points[points.length - 1];
    result += ` L${end.x} ${end.y}`;
  } else {
    for (const point of points.slice(1)) result += ` L${point.x} ${point.y}`;
  }
  return result + (stroke.closed ? " Z" : "");
}

/** A decorative layer over the original image, never a separate visual model. */
export default function CompositionStructure({
  overlay,
  frame,
}: {
  overlay?: unknown;
  frame: ImageFrame;
}) {
  const plan = createCompositionStructurePlan(overlay);
  if (
    !plan ||
    !Number.isFinite(frame.x) ||
    !Number.isFinite(frame.y) ||
    !Number.isFinite(frame.width) ||
    frame.width <= 0 ||
    !Number.isFinite(frame.height) ||
    frame.height <= 0
  )
    return null;
  // The wrapper occupies the exact contained image frame. All coordinates
  // within that wrapper still use the common normalized-image projector.
  const localFrame = { ...frame, x: 0, y: 0 };
  const projected = (point: NormalizedPoint) => projectPoint(point, localFrame);
  return (
    <View
      testID="composition-structure"
      pointerEvents="none"
      accessible
      accessibilityRole="image"
      accessibilityLabel={`Composition overlay: ${plan.label}. ${plan.explanation}`}
      style={{
        position: "absolute",
        left: frame.x,
        top: frame.y,
        width: frame.width,
        height: frame.height,
        overflow: "hidden",
      }}
    >
      <Svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${frame.width} ${frame.height}`}
        accessible={false}
        aria-hidden={true}
      >
        {plan.thirdsGrid &&
          [1 / 3, 2 / 3].map((position) => {
            const verticalStart = projected({ x: position, y: 0 });
            const verticalEnd = projected({ x: position, y: 1 });
            const horizontalStart = projected({ x: 0, y: position });
            const horizontalEnd = projected({ x: 1, y: position });
            return (
              <G key={position} strokeDasharray="4 5">
                {[false, true].map((foreground) => (
                  <G
                    key={String(foreground)}
                    stroke={foreground ? ink : paper}
                    strokeWidth={foreground ? 0.9 : 3}
                    strokeOpacity={foreground ? 0.65 : 0.7}
                  >
                    <Line
                      x1={verticalStart.x}
                      y1={verticalStart.y}
                      x2={verticalEnd.x}
                      y2={verticalEnd.y}
                    />
                    <Line
                      x1={horizontalStart.x}
                      y1={horizontalStart.y}
                      x2={horizontalEnd.x}
                      y2={horizontalEnd.y}
                    />
                  </G>
                ))}
              </G>
            );
          })}
        {plan.masses.map((mass, index) => {
          const points = mass.points
            .map((point) => {
              const position = projected(point);
              return `${position.x},${position.y}`;
            })
            .join(" ");
          return (
            <G key={`mass-${index}`} strokeLinejoin="round">
              <Polygon
                points={points}
                fill="none"
                stroke={paper}
                strokeWidth={3.4}
                strokeOpacity={0.65}
              />
              <Polygon
                points={points}
                fill={mass.role === "focal" ? focal : ink}
                fillOpacity={mass.role === "quiet" ? 0.025 : 0.065}
                stroke={mass.role === "focal" ? focal : ink}
                strokeOpacity={0.8}
                strokeWidth={1.4}
                strokeDasharray={mass.role === "focal" ? undefined : "5 4"}
              />
            </G>
          );
        })}
        {plan.balanceAxis?.length === 2 && (
          <Path
            d={`M${projected(plan.balanceAxis[0]).x} ${projected(plan.balanceAxis[0]).y} L${projected(plan.balanceAxis[1]).x} ${projected(plan.balanceAxis[1]).y}`}
            stroke={paper}
            strokeWidth={2}
            strokeOpacity={0.85}
            strokeDasharray="3 5"
            fill="none"
          />
        )}
        {plan.strokes.map((stroke, index) => {
          const d = pathData(stroke, localFrame);
          return (
            <G
              key={`structure-${index}`}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <Path
                d={d}
                stroke={paper}
                strokeWidth={3.5}
                strokeOpacity={0.65}
              />
              <Path
                d={d}
                stroke={ink}
                strokeWidth={1.6}
                strokeOpacity={0.9}
                strokeDasharray={plan.type === "mixed" ? "7 4" : undefined}
              />
            </G>
          );
        })}
        {plan.anchors.map((anchor, index) => {
          const point = projected(anchor.point);
          return (
            <G key={`anchor-${index}`} fill="none">
              <Circle
                cx={point.x}
                cy={point.y}
                r={anchor.role === "focal" ? 9 : 5}
                stroke={paper}
                strokeWidth={3.5}
                strokeOpacity={0.85}
              />
              <Circle
                cx={point.x}
                cy={point.y}
                r={anchor.role === "focal" ? 9 : 5}
                stroke={anchor.role === "focal" ? focal : ink}
                strokeWidth={1.7}
                strokeOpacity={0.95}
              />
            </G>
          );
        })}
      </Svg>
    </View>
  );
}
