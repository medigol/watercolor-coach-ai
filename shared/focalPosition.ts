import { validPoint, validRect } from "./imageGeometry.ts";

export type CoarseFocalPosition = "central" | "off_centre" | "uncertain";

interface FocalRoleGeometry {
  role: string;
  region?: unknown;
  confidence?: number | null;
}
interface FocalPointGeometry {
  focalPoint?: unknown;
  confidence?: number | null;
}
const confident = (value: unknown): value is number =>
  typeof value === "number" &&
  Number.isFinite(value) &&
  value >= 0.65 &&
  value <= 1;

/**
 * Coarse placement, not a composition diagnosis: the central square is .38–.62
 * on both axes; clearly off-centre begins at/beyond the .28–.72 outer square.
 * The .10-wide dead band avoids false precision near either boundary. Reuse
 * supplied, confident geometry only; disagreement keeps the wording neutral.
 * No anchor, region, archetype or persisted document is changed here.
 */
export function coarseFocalPosition(
  roles: readonly FocalRoleGeometry[] | null | undefined,
  composition?: FocalPointGeometry | null,
): CoarseFocalPosition {
  const positions: CoarseFocalPosition[] = [];
  const classify = (x: number, y: number): CoarseFocalPosition => {
    const distance = Math.max(Math.abs(x - 0.5), Math.abs(y - 0.5));
    // Epsilon handles decimal representation at the documented boundaries.
    if (distance <= 0.12 + Number.EPSILON) return "central";
    if (distance >= 0.22 - Number.EPSILON) return "off_centre";
    return "uncertain";
  };
  for (const role of roles ?? []) {
    if (
      role.role === "focal" &&
      confident(role.confidence) &&
      validRect(role.region)
    ) {
      positions.push(
        classify(
          role.region.x + role.region.width / 2,
          role.region.y + role.region.height / 2,
        ),
      );
    }
  }
  if (
    confident(composition?.confidence) &&
    validPoint(composition?.focalPoint)
  ) {
    positions.push(
      classify(composition.focalPoint.x, composition.focalPoint.y),
    );
  }
  return positions.length && positions.every((value) => value === positions[0])
    ? positions[0]
    : "uncertain";
}

/**
 * Remove unsupported positional qualifiers from actual focal/subject placement
 * claims, without replacing them with a new diagnosis. Other central objects
 * (a central shadow, colour region, etc.) are outside this bounded vocabulary.
 */
export function neutralizeFocalPositionText(
  text: string,
  position: CoarseFocalPosition,
): string {
  let result = text;
  // Steeple/spire name the same architectural focal target as tower. These
  // aliases change wording only; no geometry or artistic placement is inferred.
  const subject =
    "(?:focal(?:\\s+(?:point|area|subject|group|building|boat|vehicle|van|tower|church|steeple|spire))?|focus|subject|boat|vehicle|van|church|tower|steeple|spire|building)";
  if (position !== "central") {
    result = result
      .replace(
        new RegExp(
          `\\b(?:central|centred|centered)\\s+(?=(?:vertical\\s+)?${subject}\\b)`,
          "gi",
        ),
        (match, offset: number) =>
          /\boff[- ]$/i.test(result.slice(0, offset)) ? match : "",
      )
      .replace(
        new RegExp(
          `\\b(${subject}\\s+(?:is\\s+)?)(?:centrally\\s+)(placed|positioned|located)\\b`,
          "gi",
        ),
        "$1$2",
      )
      .replace(
        new RegExp(
          `\\bcentrally\\s+(?=(?:placed|positioned|located)\\s+${subject}\\b)`,
          "gi",
        ),
        "",
      )
      .replace(
        new RegExp(
          `\\b(${subject}\\s+(?:is\\s+)?)(?:at|in)\\s+(?:the\\s+)?cent(?:re|er)\\b`,
          "gi",
        ),
        "$1within the image",
      )
      .replace(
        new RegExp(
          `\\b(${subject}['’]s\\s+)(?:central|centred|centered)\\s+(?=(?:placement|position|location)\\b)`,
          "gi",
        ),
        "$1",
      );
  }
  if (position !== "off_centre") {
    result = result
      .replace(
        new RegExp(
          `\\boff[- ]cent(?:re|er)(?:d|ed)?\\s+(?=${subject}\\b)`,
          "gi",
        ),
        "",
      )
      .replace(
        new RegExp(
          `\\b(${subject}\\s+(?:is\\s+)?(?:placed\\s+|positioned\\s+|located\\s+)?)off[- ]cent(?:re|er)(?:d|ed)?\\b`,
          "gi",
        ),
        "$1within the image",
      )
      .replace(
        new RegExp(
          `\\b(${subject}['’]s\\s+)off[- ]cent(?:re|er)(?:d|ed)?\\s+(?=(?:placement|position|location)\\b)`,
          "gi",
        ),
        "$1",
      );
  }
  result = result.replace(/ {2,}/g, " ").trim();
  return /^[A-Z]/.test(text) && /^[a-z]/.test(result)
    ? result[0].toUpperCase() + result.slice(1)
    : result;
}
