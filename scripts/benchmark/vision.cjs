// Official vision-guide rules supplied/independently checked by the user on
// 2026-10-23. Developer benchmark only; never infer Luna's accounting.
const SOURCE = "https://developers.openai.com/api/docs/guides/images-vision";
const RULES = Object.freeze({
  "gpt-4.1-mini": Object.freeze({
    patch: 32,
    multiplier100: 162,
    maxDimension: 2048,
    patchBudget: 6144,
    details: ["low", "high"],
  }),
  "gpt-5.4-mini": Object.freeze({
    patch: 32,
    multiplier100: 120,
    maxDimension: 2048,
    patchBudget: 2500,
    details: ["high"],
  }),
});
function imageTokenBound(arm, size) {
  if (
    !size ||
    ![size.width, size.height].every((n) => Number.isSafeInteger(n) && n > 0)
  )
    throw Error("Valid prepared dimensions required for image accounting");
  const rule = RULES[arm.model];
  if (!rule || !rule.details.includes(arm.detail)) return null;
  const rawPatches =
    Math.ceil(size.width / rule.patch) * Math.ceil(size.height / rule.patch);
  const unchanged =
    Math.max(size.width, size.height) <= rule.maxDimension &&
    rawPatches <= rule.patchBudget;
  // Inside both limits, exact patch count. Otherwise use the documented global
  // cap: do not invent the provider's aspect-ratio/rounding resize algorithm.
  const patchesUpperBound = unchanged
    ? rawPatches
    : Math.min(
        rule.patchBudget,
        Math.ceil(rule.maxDimension / rule.patch) ** 2,
      );
  return {
    maxImageTokens: Math.ceil((patchesUpperBound * rule.multiplier100) / 100),
    rawPatches,
    patchesUpperBound,
    method: unchanged ? "unresized_patch_count" : "documented_global_cap",
    source: SOURCE,
    dimensions: { width: size.width, height: size.height },
    rule,
  };
}
module.exports = { RULES, imageTokenBound };
