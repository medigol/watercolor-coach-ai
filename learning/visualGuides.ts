/** Original, authored construction data, not observations of uploaded artwork. */
export const perspectiveGuide = {
  horizon: 70,
  left: { x: 30, y: 70 },
  right: { x: 570, y: 70 },
  top: { x: 300, y: 130 },
  bottom: { x: 300, y: 260 },
};
export function pointOnRay(
  from: { x: number; y: number },
  to: { x: number; y: number },
  x: number,
) {
  return { x, y: from.y + ((to.y - from.y) * (x - from.x)) / (to.x - from.x) };
}
export const planeCorners = {
  leftTop: pointOnRay(perspectiveGuide.left, perspectiveGuide.top, 140),
  leftBottom: pointOnRay(perspectiveGuide.left, perspectiveGuide.bottom, 140),
  rightTop: pointOnRay(perspectiveGuide.right, perspectiveGuide.top, 450),
  rightBottom: pointOnRay(perspectiveGuide.right, perspectiveGuide.bottom, 450),
};
export const styleFeatures = {
  atmospheric: {
    short: "Atmospheric realism",
    features: [
      "Connected, translucent masses",
      "Soft distance; a few found edges",
      "One restrained focal accent",
    ],
    cue: "Compare the pale, softened hill with the more defined roof and near bank.",
  },
  urban: {
    short: "Loose urban sketching",
    features: [
      "Selective structural lines",
      "Open, irregular colour passages",
      "Small marks suggest street activity",
    ],
    cue: "Notice where the line stops: not every wall, window or figure is enclosed.",
  },
  botanical: {
    short: "Botanical observation",
    features: [
      "Deliberate plant silhouettes",
      "Transparent colour overlaps",
      "Selective veins and soft internal shifts",
    ],
    cue: "Compare the crisp outside contour with the gradual changes inside each leaf.",
  },
  expressive: {
    short: "Expressive & gestural",
    features: [
      "Broad directional marks",
      "Interacting transparent colour",
      "Rhythm, simplification and chosen distortion",
    ],
    cue: "Follow repeated diagonal marks; quieter gaps keep them from becoming uniform detail.",
  },
} as const;
