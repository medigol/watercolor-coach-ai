import {
  drawableCompositionOverlay,
  type CompositionArchetype,
  type CompositionMass,
  type CompositionOverlay,
} from "../shared/visualMetadata";
import { validPolygon, type NormalizedPoint } from "./imageGeometry";
import {
  coarseFocalPosition,
  neutralizeFocalPositionText,
  type CoarseFocalPosition,
} from "../shared/focalPosition";

/**
 * Original teaching vocabulary, independent of any sample image or artwork.
 * Entries choose how supplied image geometry is explained; they contain no
 * template coordinates, scene drawings, or image-classification heuristics.
 */
export const compositionArchetypes: Record<
  CompositionArchetype,
  {
    label: string;
    principle: string;
  }
> = {
  diagonal: {
    label: "Diagonal movement",
    principle: "A directional relationship carries attention across the image.",
  },
  s_curve: {
    label: "Curving movement",
    principle: "A changing direction links visual anchors through the image.",
  },
  l_shape: {
    label: "L-shaped structure",
    principle: "A side mass and a lower mass support an open area.",
  },
  u_frame: {
    label: "Open framing",
    principle: "Connected surrounding shapes hold attention within an opening.",
  },
  enclosure: {
    label: "Enclosing structure",
    principle: "Surrounding shapes make an interior area feel visually held.",
  },
  triangle: {
    label: "Triangular grouping",
    principle: "Three meaningful anchors form a stable visual relationship.",
  },
  radiating: {
    label: "Converging directions",
    principle:
      "Several important directions relate to a shared area of attention.",
  },
  steelyard: {
    label: "Unequal balance",
    principle: "A smaller, distinct group balances a larger visual mass.",
  },
  balanced_masses: {
    label: "Balanced masses",
    principle: "Separate groups carry related visual weight across the image.",
  },
  three_spot: {
    label: "Three-anchor grouping",
    principle:
      "Three separated accents create a readable sequence of attention.",
  },
  rhythm: {
    label: "Repeating rhythm",
    principle:
      "Related shapes repeat with enough variation to guide attention.",
  },
  overlapping_masses: {
    label: "Overlapping masses",
    principle: "Shared boundaries and overlapping groups establish depth.",
  },
  cross: {
    label: "Crossing directions",
    principle:
      "An upright direction counters a strong horizontal relationship.",
  },
  rule_of_thirds: {
    label: "Thirds relationship",
    principle:
      "The focal area can be compared with divisions into three parts.",
  },
  off_centre: {
    label: "Off-centre focus",
    principle: "An unequal distribution of space supports the focal placement.",
  },
  mixed: {
    label: "Mixed structure",
    principle:
      "Several relationships work together without one dominant formula.",
  },
  none: {
    label: "No dominant structure",
    principle:
      "A named formula is not needed for a useful composition observation.",
  },
};

export const compositionArchetypeIds = Object.keys(
  compositionArchetypes,
) as CompositionArchetype[];

export function archetypeLabel(
  type: CompositionArchetype,
  position?: CoarseFocalPosition,
): string {
  if (type === "off_centre" && position && position !== "off_centre")
    return "Focal placement";
  return compositionArchetypes[type].label;
}

export interface CompositionStroke {
  points: NormalizedPoint[];
  closed: boolean;
  smooth: boolean;
}
export interface CompositionAnchor {
  point: NormalizedPoint;
  role: "focal" | "supporting";
}
export interface CompositionStructurePlan {
  type: CompositionArchetype;
  label: string;
  explanation: string;
  strokes: CompositionStroke[];
  masses: CompositionMass[];
  anchors: CompositionAnchor[];
  thirdsGrid: boolean;
  balanceAxis?: NormalizedPoint[];
}

/**
 * Optional geometry is cleaned at the shared metadata boundary. The only
 * derived connections here join explicitly supplied meaningful anchors; no
 * archetype is guessed from text, note positions, or a generic teaching model.
 */
export function createCompositionStructurePlan(
  value: unknown,
  position?: CoarseFocalPosition,
): CompositionStructurePlan | null {
  const overlay = drawableCompositionOverlay(value);
  if (!overlay) return null;
  const focalPosition = position ?? coarseFocalPosition([], overlay);
  const anchors: CompositionAnchor[] = [];
  if (overlay.focalPoint) {
    anchors.push({ point: overlay.focalPoint, role: "focal" });
  }
  for (const point of overlay.secondaryPoints ?? []) {
    if (
      !anchors.some(
        (anchor) => anchor.point.x === point.x && anchor.point.y === point.y,
      )
    )
      anchors.push({ point, role: "supporting" });
  }
  const paths = (overlay.paths ?? []).filter((points) => {
    if (overlay.type === "triangle" || overlay.type === "enclosure") {
      return validPolygon(points);
    }
    if (overlay.type === "s_curve" || overlay.type === "l_shape") {
      return points.length >= 3;
    }
    if (overlay.type === "u_frame") return points.length >= 4;
    return true;
  });
  if (["diagonal", "s_curve"].includes(overlay.type) && paths[0]?.[0]) {
    const entry = paths[0][0];
    if (!anchors.some((a) => a.point.x === entry.x && a.point.y === entry.y))
      anchors.push({ point: entry, role: "supporting" });
  }
  let strokes = paths.map((points) => ({
    points,
    closed: overlay.type === "triangle" || overlay.type === "enclosure",
    smooth: overlay.type === "s_curve",
  }));
  if (overlay.type === "triangle") {
    const candidates = paths[0] ?? anchors.map((anchor) => anchor.point);
    strokes = [];
    // Find three non-collinear supplied anchors. Earlier anchors can share a
    // line even when the complete supplied grouping has a meaningful area.
    for (
      let first = 0;
      first < candidates.length - 2 && !strokes.length;
      first++
    ) {
      for (
        let second = first + 1;
        second < candidates.length - 1 && !strokes.length;
        second++
      ) {
        for (let third = second + 1; third < candidates.length; third++) {
          const points = [
            candidates[first],
            candidates[second],
            candidates[third],
          ];
          if (validPolygon(points)) {
            strokes = [{ points, closed: true, smooth: false }];
            break;
          }
        }
      }
    }
  }
  return {
    type: overlay.type,
    label: archetypeLabel(overlay.type, focalPosition),
    explanation: neutralizeFocalPositionText(
      overlay.shortExplanation,
      focalPosition,
    ),
    strokes:
      overlay.type === "rule_of_thirds" ||
      overlay.type === "off_centre" ||
      [
        "balanced_masses",
        "steelyard",
        "three_spot",
        "overlapping_masses",
      ].includes(overlay.type)
        ? []
        : strokes.slice(
            0,
            ["cross", "radiating", "rhythm"].includes(overlay.type) ? 2 : 1,
          ),
    masses: ["balanced_masses", "steelyard", "overlapping_masses"].includes(
      overlay.type,
    )
      ? (overlay.masses ?? []).slice(0, 2)
      : (overlay.masses ?? [])
          .filter((mass) => mass.role === "supporting")
          .slice(0, 1),
    balanceAxis: ["balanced_masses", "steelyard"].includes(overlay.type)
      ? overlay.masses?.length === 2
        ? overlay.masses.map((m) => ({
            x: m.points.reduce((n, p) => n + p.x, 0) / m.points.length,
            y: m.points.reduce((n, p) => n + p.y, 0) / m.points.length,
          }))
        : anchors.slice(0, 2).map((a) => a.point)
      : undefined,
    anchors: ["diagonal", "s_curve"].includes(overlay.type)
      ? anchors
          .filter(
            (a) =>
              a.role === "focal" ||
              (paths[0]?.[0] &&
                a.point.x === paths[0][0].x &&
                a.point.y === paths[0][0].y),
          )
          .slice(0, 2)
      : [
            "triangle",
            "three_spot",
            "balanced_masses",
            "steelyard",
            "rhythm",
          ].includes(overlay.type)
        ? anchors.slice(0, 3)
        : anchors.filter((anchor) => anchor.role === "focal").slice(0, 1),
    thirdsGrid: overlay.type === "rule_of_thirds",
  };
}

export function compositionTeachingRows(
  overlay: CompositionOverlay,
  position?: CoarseFocalPosition,
): [string, string][] {
  const t = overlay.teaching;
  if (!t || overlay.type === "none") return [];
  // An L can frame space without describing a journey. Opt in only when
  // complete directional teaching accompanies a saved open path to its focal
  // anchor. Inspect the geometry without changing the canonical overlay.
  const lShape =
    overlay.type === "l_shape" &&
    [t.entry, t.path, t.landing].every((text) => text?.trim())
      ? drawableCompositionOverlay(overlay)
      : null;
  const directionalL = lShape?.paths?.some((points) => {
    const start = points[0];
    const end = points[points.length - 1];
    return (
      new Set(points.map((p) => `${p.x},${p.y}`)).size >= 3 &&
      (start.x !== end.x || start.y !== end.y) &&
      end.x === lShape.focalPoint?.x &&
      end.y === lShape.focalPoint?.y
    );
  });
  const directional =
    overlay.type === "diagonal" || overlay.type === "s_curve" || directionalL;
  const balance = ["balanced_masses", "steelyard"].includes(overlay.type);
  const relationshipLabels: Partial<Record<CompositionArchetype, string>> = {
    l_shape: "L-shaped relationship",
    u_frame: "Framing relationship",
    cross: "Axis relationship",
    radiating: "Directional relationship",
  };
  const elementLabels: Partial<Record<CompositionArchetype, string>> = {
    l_shape: "L-shaped elements",
    u_frame: "Framing elements",
    cross: "Intersecting elements",
    radiating: "Directional elements",
  };
  const relationshipLabel = relationshipLabels[overlay.type];
  const rows: [string, string | null | undefined][] = [
    [
      balance
        ? "Major masses"
        : overlay.type === "three_spot" || overlay.type === "rhythm"
          ? "Accents"
          : (elementLabels[overlay.type] ?? "Visible elements"),
      t.elements.join(", "),
    ],
    ...(directional
      ? ([
          ["Entry", t.entry],
          ["Path", t.path],
          ["Landing", t.landing],
        ] as [string, string | null | undefined][])
      : relationshipLabel
        ? [[relationshipLabel, t.path] as [string, string | null]]
        : []),
    [
      balance
        ? "Supporting weight"
        : overlay.type === "u_frame"
          ? "Supporting frame"
          : "Supporting mass",
      t.supportingMass,
    ],
    [
      balance
        ? "Open / quieter space"
        : overlay.type === "enclosure"
          ? "Enclosed space"
          : overlay.type === "u_frame" || overlay.type === "l_shape"
            ? "Open space"
            : "Quiet space",
      t.quietMass,
    ],
    [
      overlay.type === "cross" ? "Countering relationship" : "Counterbalance",
      t.counterbalance,
    ],
    ["Watch", t.risk],
  ];
  const focalPosition = position ?? coarseFocalPosition([], overlay);
  return rows
    .filter((r): r is [string, string] => !!r[1])
    .map(([label, text]) => [
      label,
      neutralizeFocalPositionText(text, focalPosition),
    ]);
}
