const fs = require("node:fs");
const { external, safeID } = require("./safety.cjs");
const { production } = require("./production.cjs");
const CATEGORIES = {
  watercolor: 8,
  surroundings: 4,
  screenshot: 4,
  photo: 4,
  other_media: 2,
  challenging: 2,
};
function readManifest(file) {
  const m = JSON.parse(fs.readFileSync(external(file, true), "utf8"));
  if (m.version !== 1 || !Array.isArray(m.cases) || m.cases.length !== 24)
    throw Error("Manifest must define exactly 24 cases");
  const seen = new Set(),
    files = new Set(),
    p = production();
  for (const c of m.cases) {
    if (
      !safeID(c.case_id) ||
      seen.has(c.case_id) ||
      typeof c.file !== "string" ||
      files.has(c.file)
    )
      throw Error("Cases and image paths must be distinct");
    seen.add(c.case_id);
    files.add(c.file);
    if (
      !Object.hasOwn(CATEGORIES, c.category) ||
      !["accept", "reject", "uncertain", "crop-needed"].includes(
        c.ground_truth,
      ) ||
      !["accept", "reject", "uncertain", "crop-needed"].includes(
        c.source_ground_truth,
      ) ||
      !["confirmed", "not_watercolor", "ambiguous"].includes(
        c.watercolor_status,
      )
    )
      throw Error("Invalid case annotation");
    if (
      !["full", "manual", "candidate"].includes(c.preparation) ||
      typeof c.permission !== "string" ||
      typeof c.source !== "string" ||
      typeof c.notes !== "string" ||
      typeof c.approved_for_api !== "boolean" ||
      typeof c.ambiguous_ground_truth !== "boolean" ||
      typeof c.abstention_acceptable !== "boolean"
    )
      throw Error("Missing privacy/ground truth annotation");
    if (
      c.expected_painting_region !== null &&
      !p.geometry.validRect(c.expected_painting_region)
    )
      throw Error("Expected region must use oriented normalized coordinates");
    if (
      c.preparation === "manual" &&
      c.confirmed_region !== null &&
      !p.geometry.validRect(c.confirmed_region)
    )
      throw Error("Manual crop requires independently confirmed region");
  }
  for (const [cat, n] of Object.entries(CATEGORIES))
    if (m.cases.filter((c) => c.category === cat).length !== n)
      throw Error("Incorrect category coverage: " + cat);
  if (
    m.cases
      .filter((c) => c.category === "screenshot")
      .some(
        (c) =>
          c.preparation !== "full" ||
          !["reject", "crop-needed"].includes(c.ground_truth),
      )
  )
    throw Error(
      "Raw screenshot controls must retain UI and require rejection or crop confirmation",
    );
  if (
    m.cases
      .filter((c) => c.category === "photo")
      .some((c) => c.preparation !== "full" || c.ground_truth !== "reject")
  )
    throw Error("Ordinary photo controls must retain original scene");
  return m;
}
function selectCases(cases, selection) {
  if (!selection) return cases;
  const ids = selection.split(",");
  if (
    ids.length !== 3 ||
    new Set(ids).size !== 3 ||
    ids.some((id) => !cases.some((c) => c.case_id === id))
  )
    throw Error("Pilot requires exactly three distinct manifest case IDs");
  return cases.filter((c) => ids.includes(c.case_id));
}
function roiMetrics(candidate, expected) {
  if (!expected) return null;
  if (!candidate)
    return {
      proposed: false,
      iou: 0,
      paintingCoverage: 0,
      excessArea: null,
      edgeLoss: null,
    };
  const area = (r) => r.width * r.height,
    unit = (n) => Math.max(0, Math.min(1, n));
  const intersection =
    Math.max(
      0,
      Math.min(candidate.x + candidate.width, expected.x + expected.width) -
        Math.max(candidate.x, expected.x),
    ) *
    Math.max(
      0,
      Math.min(candidate.y + candidate.height, expected.y + expected.height) -
        Math.max(candidate.y, expected.y),
    );
  return {
    proposed: true,
    iou: unit(intersection / (area(candidate) + area(expected) - intersection)),
    paintingCoverage: unit(intersection / area(expected)),
    excessArea: unit((area(candidate) - intersection) / area(candidate)),
    edgeLoss: {
      left: Math.max(0, candidate.x - expected.x),
      top: Math.max(0, candidate.y - expected.y),
      right: Math.max(
        0,
        expected.x + expected.width - candidate.x - candidate.width,
      ),
      bottom: Math.max(
        0,
        expected.y + expected.height - candidate.y - candidate.height,
      ),
    },
  };
}
module.exports = { readManifest, selectCases, roiMetrics, CATEGORIES };
