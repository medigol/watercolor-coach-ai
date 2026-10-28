/** Narrow plausibility checks for OPTIONAL recreation recipes, not pigment
 * identification or a colour-mixing simulator. Never substitute a new formula. */
export function plausiblePigmentMix(
  target: string,
  pigments: readonly string[],
): boolean {
  const words = (value: string) => value.replace(/[_-]/g, " ");
  const purpose = words(target);
  if (!pigments.length || pigments.length > 3) return false;
  // Yellow shifts rose/magenta towards orange and can neutralise a violet rose.
  // It is not a general clear-pink recipe. Explicit warm/muted coral/peach targets
  // are different experiments and must not be blanket-rejected.
  const clearPink =
    /\b(?:pink|rose|magenta|fuchsia)\b/i.test(purpose) &&
    !/\b(?:coral|peach|salmon|orange|muted|neutral|earthy|brown)\b/i.test(
      purpose,
    );
  return (
    !clearPink ||
    !pigments.some((pigment) =>
      /\b(?:yellow|ochre|PY\s*\d+)\b/i.test(words(pigment)),
    )
  );
}
