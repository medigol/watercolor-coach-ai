import { Text, View } from "react-native";
import Svg, { G, Polygon, Rect } from "react-native-svg";
import {
  projectPoint,
  projectRect,
  type ImageFrame,
} from "../lib/imageGeometry";
import { visualRoleLabel, type VisualRoleRegion } from "../lib/visualRoles";

const ink = "#496B63";
const paper = "#FFFEF8";
const treatment = {
  focal: { width: 1.8, dash: undefined, fill: 0.035 },
  supporting: { width: 1.4, dash: "6 4", fill: 0.025 },
  quiet: { width: 1.2, dash: "1 4", fill: 0.012 },
};

/** An optional exclusive layer: labels and line styles convey roles together. */
export default function VisualRoleMap({
  regions,
  frame,
}: {
  regions: VisualRoleRegion[];
  frame: ImageFrame;
}) {
  if (
    !regions.length ||
    !Number.isFinite(frame.x) ||
    !Number.isFinite(frame.y) ||
    !Number.isFinite(frame.width) ||
    frame.width <= 0 ||
    !Number.isFinite(frame.height) ||
    frame.height <= 0
  )
    return null;
  const selected = regions.slice(0, 3);
  const localFrame = { ...frame, x: 0, y: 0 };
  const description = selected
    .map((region) => visualRoleLabel(region.role))
    .join(", ");
  return (
    <View
      testID="visual-role-map"
      pointerEvents="none"
      accessible
      accessibilityRole="image"
      accessibilityLabel={`Visual roles: ${description}. Located areas in your painting.`}
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
        {selected.map((region, index) => {
          const style = treatment[region.role];
          const rect =
            region.kind === "rectangle"
              ? projectRect(region.region, localFrame)
              : null;
          const points =
            region.kind === "polygon"
              ? region.points
                  .map((point) => {
                    const projected = projectPoint(point, localFrame);
                    return `${projected.x},${projected.y}`;
                  })
                  .join(" ")
              : null;
          return (
            <G key={index} strokeLinejoin="round" strokeLinecap="round">
              {rect ? (
                <>
                  <Rect
                    {...rect}
                    fill="none"
                    stroke={paper}
                    strokeWidth={3.4}
                    strokeOpacity={0.7}
                  />
                  <Rect
                    {...rect}
                    fill={ink}
                    fillOpacity={style.fill}
                    stroke={ink}
                    strokeWidth={style.width}
                    strokeOpacity={0.85}
                    strokeDasharray={style.dash}
                  />
                </>
              ) : (
                <>
                  <Polygon
                    points={points!}
                    fill="none"
                    stroke={paper}
                    strokeWidth={3.4}
                    strokeOpacity={0.7}
                  />
                  <Polygon
                    points={points!}
                    fill={ink}
                    fillOpacity={style.fill}
                    stroke={ink}
                    strokeWidth={style.width}
                    strokeOpacity={0.85}
                    strokeDasharray={style.dash}
                  />
                </>
              )}
            </G>
          );
        })}
      </Svg>
      {selected.map((region, index) => {
        const anchor = projectPoint(
          region.kind === "rectangle" ? region.region : region.points[0],
          localFrame,
        );
        return (
          <View
            key={`label-${index}`}
            accessible={false}
            style={{
              position: "absolute",
              left: Math.max(0, Math.min(frame.width - 78, anchor.x + 3)),
              top: Math.max(0, Math.min(frame.height - 23, anchor.y + 3)),
              paddingHorizontal: 5,
              paddingVertical: 2,
              borderRadius: 4,
              backgroundColor: paper,
              opacity: 0.95,
              borderWidth: 0.5,
              borderColor: ink,
            }}
          >
            <Text
              accessible={false}
              style={{
                color: ink,
                fontSize: 11,
                lineHeight: 16,
                fontWeight: "600",
              }}
            >
              {visualRoleLabel(region.role)}
            </Text>
          </View>
        );
      })}
    </View>
  );
}
