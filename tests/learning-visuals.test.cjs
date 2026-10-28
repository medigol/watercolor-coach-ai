const test = require("node:test"),
  assert = require("node:assert/strict");
const load = require("./helpers/learning-loader.cjs");
const {
  perspectiveGuide: p,
  planeCorners: c,
  styleFeatures,
} = load("learning/visualGuides.ts");
const cross = (a, b, q) =>
  (b.x - a.x) * (q.y - a.y) - (b.y - a.y) * (q.x - a.x);
const close = (n) => assert(Math.abs(n) < 1e-8);
test("perspective example uses one left vanishing point for both edges of the left plane", () => {
  close(cross(p.left, p.top, c.leftTop));
  close(cross(p.left, p.bottom, c.leftBottom));
  assert.equal(c.leftTop.x, c.leftBottom.x);
  assert(c.leftTop.y > p.horizon && c.leftBottom.y < p.bottom.y);
});
test("right plane converges to its own point, not decorative parallel extensions", () => {
  close(cross(p.right, p.top, c.rightTop));
  close(cross(p.right, p.bottom, c.rightBottom));
  assert.equal(c.rightTop.x, c.rightBottom.x);
  assert.notEqual(p.left.x, p.right.x);
  assert(Math.abs(cross(p.left, p.top, c.rightTop)) > 1);
});
test("four style comparisons identify different edge, mass and mark decisions", () => {
  assert.deepEqual(Object.keys(styleFeatures), [
    "atmospheric",
    "urban",
    "botanical",
    "expressive",
  ]);
  assert.equal(
    new Set(Object.values(styleFeatures).map((s) => s.features.join())).size,
    4,
  );
  for (const s of Object.values(styleFeatures))
    assert(s.features.length === 3 && s.cue.length > 30);
});
test("progress captured from e0c560d remains readable byte-for-byte without a migration or reanalysis", () => {
  const before = require("./helpers/learning-progress-v1.json");
  const raw = JSON.stringify(before);
  const { decodeProgress, completed, resumeStep } = load(
    "learning/progress.ts",
  );
  const { itemById } = load("learning/content.ts");
  const restored = decodeProgress(raw);
  assert.equal(JSON.stringify(restored), raw);
  assert(completed(itemById("water-brush"), restored.entries["water-brush"]));
  assert(
    completed(itemById("quiet-landscape"), restored.entries["quiet-landscape"]),
  );
  assert.equal(
    itemById("quiet-landscape").steps[
      resumeStep(
        itemById("quiet-landscape"),
        restored.entries["quiet-landscape"],
      )
    ].id,
    "reflect",
  );
});
