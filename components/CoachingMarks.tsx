import Svg, {
  Ellipse,
  Rect,
  Polyline,
  Polygon,
  Path,
  G,
} from "react-native-svg";
import { type CoachingOverlay } from "../lib/overlays";
import {
  arrowHead,
  legendGroup,
  markColors,
  markGeometry,
} from "../lib/overlayDrawing";
export default function CoachingMarks({
  notes,
  width,
  height,
  selected,
  onSelect,
}: {
  notes: CoachingOverlay[];
  width: number;
  height: number;
  selected: number | null;
  onSelect: (index: number) => void;
}) {
  return (
    <Svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={{ position: "absolute", left: 0, top: 0 }}
      accessible={false}
    >
      {notes.map((note, i) => {
        const g = markGeometry(note, width, height),
          color = markColors[legendGroup(note)],
          active = selected === i;
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
              : color;
        const dash =
          note.styleHint === "soft" ||
          (g.kind === "edge_mark" && note.styleHint !== "hard")
            ? "5 5"
            : undefined;
        return (
          <G key={`${note.id ?? "note"}-${i}`} onPress={() => onSelect(i)}>
            {g.kind === "focal_ring" && (
              <Ellipse
                cx={g.x + g.width / 2}
                cy={g.y + g.height / 2}
                rx={g.width / 2}
                ry={g.height / 2}
                fill="none"
                stroke={color}
                strokeWidth={strokeWidth}
              />
            )}
            {(g.kind === "region_highlight" || g.kind === "value_mass") &&
              (g.points.length >= 3 ? (
                <Polygon
                  points={points}
                  fill={fill}
                  fillOpacity={active ? 0.24 : 0.13}
                  stroke={color}
                  strokeWidth={strokeWidth}
                  strokeDasharray={
                    note.styleHint === "simplify" ? "4 4" : undefined
                  }
                />
              ) : (
                <Rect
                  x={g.x}
                  y={g.y}
                  width={g.width}
                  height={g.height}
                  rx={Math.min(12, g.width / 4, g.height / 4)}
                  fill={fill}
                  fillOpacity={active ? 0.24 : 0.13}
                  stroke={color}
                  strokeWidth={strokeWidth}
                  strokeDasharray={
                    note.styleHint === "simplify" ? "4 4" : undefined
                  }
                />
              ))}
            {g.kind === "crop_box" && (
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
                  strokeDasharray={dash}
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
