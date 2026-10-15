import {
  drawableCompositionOverlay,
  type CompositionArchetype,
  type CompositionMass,
} from "../shared/visualMetadata";
import { validPolygon, type NormalizedPoint } from "./imageGeometry";

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

export function archetypeLabel(type: CompositionArchetype): string {
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
}

/**
 * Optional geometry is cleaned at the shared metadata boundary. The only
 * derived connections here join explicitly supplied meaningful anchors; no
 * archetype is guessed from text, note positions, or a generic teaching model.
 */
export function createCompositionStructurePlan(
  value: unknown,
): CompositionStructurePlan | null {
  const overlay = drawableCompositionOverlay(value);
  if (!overlay) return null;
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
  let strokes = paths.map((points) => ({
    points,
    closed: overlay.type === "triangle" || overlay.type === "enclosure",
    smooth: overlay.type === "s_curve",
  }));
  if (overlay.type === "triangle" && !strokes.length) {
    // Find three non-collinear supplied anchors. Earlier anchors can share a
    // line even when the complete supplied grouping has a meaningful area.
    for (
      let first = 0;
      first < anchors.length - 2 && !strokes.length;
      first++
    ) {
      for (
        let second = first + 1;
        second < anchors.length - 1 && !strokes.length;
        second++
      ) {
        for (let third = second + 1; third < anchors.length; third++) {
          const points = [
            anchors[first].point,
            anchors[second].point,
            anchors[third].point,
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
    label: archetypeLabel(overlay.type),
    explanation: overlay.shortExplanation,
    strokes,
    masses: overlay.masses ?? [],
    anchors,
    thirdsGrid: overlay.type === "rule_of_thirds",
  };
}
