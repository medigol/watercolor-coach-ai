import Svg, {
  Ellipse,
  Rect,
  Polyline,
  Polygon,
  Path,
  G,
} from "react-native-svg";
import { overlayCategory, type CoachingOverlay } from "../lib/overlays";
import {
  arrowHead,
  activeRegionsGeometry,
  legendGroup,
  markColors,
  markGeometry,
} from "../lib/overlayDrawing";
import {
  noteAnchors,
  noteGeometryVisible,
  projectPoint,
  type ImageFrame,
} from "../lib/imageGeometry";
export default function CoachingMarks({
  notes,
  width,
  height,
  selected,
  onSelect,
  frame,
}: {
  notes: CoachingOverlay[];
  width: number;
  height: number;
  selected: number | null;
  onSelect: (index: number) => void;
  frame?: Pick<ImageFrame, "x" | "y" | "width" | "height">;
}) {
  return (
    <Svg
      testID="coaching-marks"
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={{ position: "absolute", left: 0, top: 0 }}
      accessible={false}
      aria-hidden={true}
    >
      {notes.map((note, i) => {
        if (!noteGeometryVisible(note)) return null;
        const g = markGeometry(note, width, height, frame),
          color = markColors[legendGroup(note)],
          active = selected === i;
        const regions = active
          ? activeRegionsGeometry(note, width, height, frame)
          : [];
        const multi = note.scope === "multi_region";
        // A relationship uses its real targets, never the legacy single shape.
        if (multi) g.kind = "point_marker";
        const anchors =
          active && (multi || regions.length === 0)
            ? noteAnchors(note).map((anchor) =>
                projectPoint(anchor, frame ?? { x: 0, y: 0, width, height }),
              )
            : [];
        const strokeWidth = active ? 3 : 2;
        const points = g.points.map((p) => `${p.x},${p.y}`).join(" ");
        const line =
          g.kind === "guide_line" ||
          g.kind === "arrow" ||
          g.kind === "edge_mark";
        const fill =
          note.valueGroup === "dark"
            ? "#253C3C"
            : note.valueGroup === "light" ||
                note.styleHint === "preserve_light" ||
                note.styleHint === "lighten"
              ? "#FFFFFF"
              : note.valueGroup === "middle"
                ? "#8B9690"
                : color;
        const reserveLight =
          note.type === "reserve_light_mark" ||
          overlayCategory(note) === "reserve_light" ||
          note.styleHint === "preserve_light";
        const simplify =
          note.styleHint === "simplify" ||
          overlayCategory(note) === "simplification";
        const fillOpacity =
          (g.kind === "value_mass"
            ? note.valueGroup === "dark"
              ? 0.27
              : note.valueGroup === "light"
                ? 0.1
                : 0.2
            : 0.1) + (active ? 0.1 : 0);
        const dash =
          note.styleHint === "soft" ||
          (g.kind === "edge_mark" && note.styleHint !== "hard")
            ? "5 5"
            : undefined;
        return (
          <G key={`${note.id ?? "note"}-${i}`} onPress={() => onSelect(i)}>
            {regions.map((region, regionIndex) => (
              <Rect
                key={`region-${regionIndex}`}
                testID="active-coaching-region"
                pointerEvents="none"
                x={region.x}
                y={region.y}
                width={region.width}
                height={region.height}
                fill={color}
                fillOpacity={0.035}
                stroke={color}
                strokeWidth={1.5}
                strokeDasharray="4 4"
              />
            ))}
            {anchors.map((anchor, anchorIndex) => (
              <Ellipse
                key={`target-${anchorIndex}`}
                testID="active-coaching-anchor"
                pointerEvents="none"
                cx={anchor.x}
                cy={anchor.y}
                rx={5}
                ry={5}
                fill="none"
                stroke={color}
                strokeWidth={1.5}
                strokeDasharray="2 2"
              />
            ))}
            {g.kind === "focal_ring" && (
              <>
                <Ellipse
                  cx={g.x + g.width / 2}
                  cy={g.y + g.height / 2}
                  rx={g.width / 2}
                  ry={g.height / 2}
                  fill="none"
                  stroke={color}
                  strokeWidth={16}
                  strokeOpacity={0.01}
                />
                <Ellipse
                  cx={g.x + g.width / 2}
                  cy={g.y + g.height / 2}
                  rx={g.width / 2}
                  ry={g.height / 2}
                  fill="none"
                  stroke={reserveLight ? "#F7EDD4" : color}
                  strokeWidth={strokeWidth}
                />
                {(active || reserveLight) && (
                  <Ellipse
                    cx={g.x + g.width / 2}
                    cy={g.y + g.height / 2}
                    rx={Math.max(1, g.width / 2 - 5)}
                    ry={Math.max(1, g.height / 2 - 5)}
                    fill="none"
                    stroke={color}
                    strokeWidth={1}
                    strokeOpacity={0.7}
                  />
                )}
              </>
            )}
            {(g.kind === "region_highlight" || g.kind === "value_mass") &&
              (g.points.length >= 3 ? (
                <Polygon
                  points={points}
                  fill={fill}
                  fillOpacity={fillOpacity}
                  stroke={color}
                  strokeWidth={strokeWidth}
                  strokeDasharray={simplify ? "1 5" : undefined}
                  strokeLinecap="round"
                />
              ) : (
                <Rect
                  x={g.x}
                  y={g.y}
                  width={g.width}
                  height={g.height}
                  rx={Math.min(12, g.width / 4, g.height / 4)}
                  fill={fill}
                  fillOpacity={fillOpacity}
                  stroke={color}
                  strokeWidth={strokeWidth}
                  strokeDasharray={simplify ? "1 5" : undefined}
                  strokeLinecap="round"
                />
              ))}
            {g.kind === "crop_box" && (
              <>
                {active && (
                  <G pointerEvents="none">
                    <Rect
                      x={0}
                      y={0}
                      width={width}
                      height={g.y}
                      fill="#253C3C"
                      fillOpacity={0.15}
                    />
                    <Rect
                      x={0}
                      y={g.y + g.height}
                      width={width}
                      height={Math.max(0, height - g.y - g.height)}
                      fill="#253C3C"
                      fillOpacity={0.15}
                    />
                    <Rect
                      x={0}
                      y={g.y}
                      width={g.x}
                      height={g.height}
                      fill="#253C3C"
                      fillOpacity={0.15}
                    />
                    <Rect
                      x={g.x + g.width}
                      y={g.y}
                      width={Math.max(0, width - g.x - g.width)}
                      height={g.height}
                      fill="#253C3C"
                      fillOpacity={0.15}
                    />
                  </G>
                )}
                <Rect
                  x={g.x}
                  y={g.y}
                  width={g.width}
                  height={g.height}
                  fill="none"
                  stroke={color}
                  strokeWidth={14}
                  strokeOpacity={0.01}
                />
                <Rect
                  x={g.x}
                  y={g.y}
                  width={g.width}
                  height={g.height}
                  fill="none"
                  stroke={color}
                  strokeWidth={strokeWidth}
                  strokeDasharray="9 5"
                />
                <Path
                  d={cropCorners(g)}
                  fill="none"
                  stroke={color}
                  strokeWidth={strokeWidth}
                  strokeLinecap="round"
                />
              </>
            )}
            {line && (
              <>
                <Polyline
                  points={points}
                  fill="none"
                  stroke={color}
                  strokeWidth={18}
                  strokeOpacity={0.01}
                />
                <Polyline
                  points={points}
                  fill="none"
                  stroke={color}
                  strokeWidth={
                    g.kind === "edge_mark" ? strokeWidth + 1 : strokeWidth
                  }
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray={
                    g.kind === "guide_line" && note.styleHint === "muted"
                      ? "9 6"
                      : dash
                  }
                />
                {g.kind === "arrow" && (
                  <Path
                    d={arrowHead(g.points)}
                    fill="none"
                    stroke={color}
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}
              </>
            )}
          </G>
        );
      })}
    </Svg>
  );
}

function cropCorners(g: ReturnType<typeof markGeometry>) {
  const { x, y, width: w, height: h } = g;
  const arm = Math.min(12, w / 4, h / 4);
  return `M ${x} ${y + arm} L ${x} ${y} L ${x + arm} ${y} M ${x + w - arm} ${y} L ${x + w} ${y} L ${x + w} ${y + arm} M ${x + w} ${y + h - arm} L ${x + w} ${y + h} L ${x + w - arm} ${y + h} M ${x + arm} ${y + h} L ${x} ${y + h} L ${x} ${y + h - arm}`;
}
