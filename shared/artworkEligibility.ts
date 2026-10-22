/** INTERNAL one-call eligibility envelope. Never persisted with canonical v1. */
export const artworkGateCodes = [
  "unsupported_artwork",
  "artwork_uncertain",
  "crop_needed",
] as const;
export type ArtworkGateCode = (typeof artworkGateCodes)[number];
export const artworkGateMessages: Record<ArtworkGateCode, string> = {
  unsupported_artwork:
    "We couldn't assess this as a watercolour artwork. Upload a clear photo or scan. If this is an app screenshot, use the original artwork file or crop out the interface.",
  artwork_uncertain:
    "We couldn't reliably identify the medium. Upload a clearer photo or scan of the artwork. Watercolour-specific advice may not apply to other media.",
  crop_needed:
    "Crop the image to show one complete artwork, with as little surrounding background as possible.",
};
const record = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === "object" && !Array.isArray(v);
export function isArtworkGateCode(v: unknown): v is ArtworkGateCode {
  return artworkGateCodes.includes(v as ArtworkGateCode);
}
export function artworkEligibility(
  value: unknown,
):
  | { status: "accepted"; analysis: Record<string, unknown> }
  | { status: "rejected" | "uncertain"; code: ArtworkGateCode }
  | { status: "invalid" } {
  if (
    !record(value) ||
    Object.keys(value).length !== 2 ||
    !record(value.eligibility) ||
    !Object.hasOwn(value, "analysis")
  )
    return { status: "invalid" };
  const e = value.eligibility;
  if (
    Object.keys(e).length !== 2 ||
    !Object.hasOwn(e, "status") ||
    !Object.hasOwn(e, "reason_code")
  )
    return { status: "invalid" };
  if (
    e.status === "accepted" &&
    e.reason_code === null &&
    record(value.analysis)
  )
    return { status: "accepted", analysis: value.analysis };
  if (value.analysis !== null) return { status: "invalid" };
  if (e.status === "rejected" && e.reason_code === "unsupported_artwork")
    return { status: "rejected", code: e.reason_code };
  if (
    e.status === "uncertain" &&
    (e.reason_code === "artwork_uncertain" || e.reason_code === "crop_needed")
  )
    return { status: "uncertain", code: e.reason_code };
  return { status: "invalid" };
}
/** Required nullable payload avoids forbidden root anyOf; refs remain root-local. */
export function artworkEligibilitySchema(draft: {
  $defs: unknown;
  [key: string]: unknown;
}) {
  const { $defs, ...analysis } = draft;
  return {
    type: "object",
    additionalProperties: false,
    required: ["eligibility", "analysis"],
    properties: {
      eligibility: {
        type: "object",
        additionalProperties: false,
        required: ["status", "reason_code"],
        properties: {
          status: {
            type: "string",
            enum: ["accepted", "rejected", "uncertain"],
          },
          reason_code: {
            type: ["string", "null"],
            enum: [null, ...artworkGateCodes],
          },
        },
      },
      analysis: { ...analysis, type: ["object", "null"] },
    },
    $defs,
  };
}
