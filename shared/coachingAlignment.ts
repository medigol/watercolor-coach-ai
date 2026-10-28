import type { PaintingFact, PaintingInsight } from "./paintingAnalysis.ts";
import {
  variableStudy,
  objectDesignSuggestion,
  unsupportedPlacementAdvice,
} from "./coachingLanguage.ts";

// Small, bounded vocabulary over SUPPLIED facts. No pixel analysis, inferred
// observations, reference repair, or replacement diagnosis is performed here.
const targets: Record<string, RegExp> = {
  architecture: /\b(?:church|tower|building|house|roof|architecture)s?\b/i,
  vehicle: /\b(?:vehicle|van|car)s?\b/i,
  boat: /\bboats?\b/i,
  road: /\b(?:road|path|street|lead[- ]in|cent(?:re|er)[- ]?line)s?\b/i,
  background: /\b(?:mountain|background|distant form|distance)s?\b/i,
  foreground: /\b(?:foreground|bank|shoreline)s?\b/i,
  water: /\bwater\b/i,
  shadow: /\bshadows?\b/i,
  reflection: /\breflections?\b/i,
  sky: /\b(?:sky|cloud)s?\b/i,
  wires: /\b(?:wire|pole)s?\b/i,
  figures: /\b(?:figure|person|people)s?\b/i,
  trees: /\b(?:tree|foliage)s?\b/i,
  bands: /\b(?:bands?|large shapes?|masses)\b/i,
};
const properties: Record<string, RegExp> = {
  value:
    /\b(?:values?|tonal|contrast|dark\w*|light\w*|shadows?|mid[- ]?tones?)\b/i,
  edge: /\b(?:edges?|contours?|sharp\w*|soft\w*|crisp\w*|diffus\w*|silhouette)\b/i,
  colour:
    /\b(?:colou?r|hue|chroma|saturat\w*|temperature|warm\w*|cool\w*|palette)\b/i,
  drawing:
    /\b(?:perspective|drawing|proportion|alignment|misalign\w*|structural|angles?|distort\w*|deck angle)\b/i,
  composition:
    /\b(?:placement|placed|position\w*|cent(?:ral|er|re)\w*|spacing|balance|weight|tangent|diagonal|flow)\b/i,
  depth: /\b(?:depth|recession|recede\w*|atmospher\w*|spatial)\b/i,
  connection:
    /\b(?:connect\w*|integrat\w*|detach\w*|bands?|overlap\w*|fragment\w*|group\w*|masses)\b/i,
  detail:
    /\b(?:detail|marks?|noise|noisy|wires?|simplif\w*|texture|rhythm|repet\w*|cadence)\b/i,
};
const matching = (dictionary: Record<string, RegExp>, text: string) =>
  Object.keys(dictionary).filter((k) => dictionary[k].test(text));
export function evidenceProperties(text: string): string[] {
  const chromatic = text.replace(
    // Contrast has several meanings. Explicit chromatic contrast is not proof
    // of a tonal difference; keep any independently supplied value vocabulary.
    /\b(?:hue|colou?r|chroma|saturation|temperature|warm(?:\s+and\s+|\s*[–—/-]\s*)cool)\s+contrast\b/gi,
    "colour relationship",
  );
  const hues = new Set(
    text
      .toLowerCase()
      .match(/\b(?:red|orange|yellow|green|blue|violet|purple)\b/g) ?? [],
  );
  const tonal =
    /\b(?:values?|tonal|luminance|gr[ae]yscale|dark\w*|light\w*|pale|white|black|shadows?|mid[- ]?tones?)\b/i.test(
      text,
    );
  return matching(
    properties,
    hues.size >= 2 && !tonal
      ? chromatic.replace(/\bcontrast\b/gi, "colour relationship")
      : chromatic,
  );
}
export const evidenceTargets = (text: string) => matching(targets, text);

/** Narrow evidence test for explicit tonal and structural-accuracy claims.
 * It checks supplied relationships, never pixels, RGB swatches or correctness
 * of the model's observation. Other descriptive teaching is left untouched. */
export function descriptiveClaimSupported(
  claim: string,
  facts: readonly PaintingFact[],
): boolean {
  // Improve Painting supplies one artwork, not a reference pair. Even an
  // internally consistent drawing cannot establish an exact external likeness.
  if (
    /\b(?:faithful|exact|accurate) (?:likeness|reproduction|representation of the (?:reference|original subject))\b|\bmatches? (?:the |its )?reference (?:exactly|accurately)\b/i.test(
      claim,
    )
  )
    return false;
  const named = evidenceTargets(claim);
  const linked = facts.filter((f) => {
    const target = evidenceTargets(f.observation);
    return !named.length || named.some((t) => target.includes(t));
  });
  if (
    /\b(?:value|tonal|luminance|gr[ae]yscale)\s+(?:contrast|separation|difference|hierarchy|grouping)\b/i.test(
      claim,
    ) &&
    !linked.some((f) => evidenceProperties(f.observation).includes("value"))
  )
    return false;
  const accuracy =
    /\b(?:perspective|proportions?|drawing|structural alignment)\b[^.!?]{0,45}\b(?:accurate|correct|consistent|convincing)\b|\b(?:accurate|correct|consistent|convincing)\s+(?:perspective|proportions?|drawing|structural alignment)\b/i;
  if (!accuracy.test(claim)) return true;
  return linked.some(
    (f) =>
      /\b(?:lines?|angles?|ellipses|planes?|verticals?|horizontals?|width|height|axes)\b/i.test(
        f.observation,
      ) &&
      /\b(?:converg\w*|parallel|align\w*|relative|recession|consistent direction|shared direction|proportional)\b/i.test(
        f.observation,
      ),
  );
}
const intersects = (a: string[], b: string[]) => a.some((x) => b.includes(x));
export function evidencedProblem(text: string): boolean {
  return text
    .split(/[.!?;]/)
    .some(
      (c) =>
        !/\b(?:no|without)\s+(?:significant |visible |material )?(?:problem|issue|competition|weakness|harm)\b/i.test(
          c,
        ) &&
        /\b(?:compet\w*|disrupt\w*|inaccurac\w*|errors?|obscur\w*|unreadable|confus\w*|flatten\w*|weaken\w*|weak|nois\w*|excess\w*|overly|too (?:uniform|sharp|dark|light|saturated|strong|many)|lacks?|insufficient|abrupt\w*|disconnect\w*|detach\w*|muddy|poor\w*|unintended|crowd\w*|collid\w*|inconsisten\w*|limits?|limiting|read separately)\b/i.test(
          c,
        ),
    );
}
export function directionalChange(text: string): boolean {
  return /\b(?:soften|sharpen|darken|lighten|quiet|mute|simplify|compress|reduce|increase|strengthen|deepen|heighten|boost|raise|accentuate|intensify|reinforce|warm|cool|connect|merge|group|clarify|align|correct)\b|\b(?:more|less|fewer)\s+(?:contrast|detail|chroma|saturat\w*|sharp\w*|soft\w*|dark\w*|light\w*)|\b(?:softer|sharper|darker|lighter|quieter|warmer|cooler|stronger|simpler)\b/i.test(
    text,
  );
}
/** Reuse the same supplied target/property clauses for alignment and impact. */
function relevantInsightClauses(
  i: PaintingInsight,
  facts: readonly PaintingFact[],
): string[] {
  const linked = facts.filter((f) => i.factIds.includes(f.id));
  const target = evidenceTargets(i.lesson),
    actionTargets = primaryTargets(i);
  const named = target.length ? target : actionTargets;
  const specific = named.filter((t) =>
    ["shadow", "reflection", "wires", "road"].includes(t),
  );
  const required = specific.length ? specific : named;
  const props = evidenceProperties(i.lesson);
  const location = (text: string) =>
    text
      .match(/\b(?:upper|lower|left|right|base|roof)\b/gi)
      ?.map((x) => x.toLowerCase()) ?? [];
  return linked
    .flatMap((f) =>
      f.observation
        .split(/[.!?;]|\b(?:but|while|with)\b/i)
        .flatMap((clause) =>
          /\b(?:connect\w*|separat\w*|integrat\w*|detach\w*|between|compared|than)\b/i.test(
            clause,
          )
            ? [clause]
            : clause.split(/\band\b/i),
        ),
    )
    .filter((clause) => {
      const ft = evidenceTargets(clause),
        fp = evidenceProperties(clause);
      const cl = location(i.lesson),
        fl = location(clause);
      return (
        (!required.length || intersects(required, ft)) &&
        (!actionTargets.length || intersects(actionTargets, ft)) &&
        (!cl.length || !fl.length || intersects(cl, fl)) &&
        (props.includes("drawing")
          ? fp.includes("drawing")
          : !props.length || intersects(props, fp))
      );
    });
}
/** Each supporting fact must itself connect the target and relevant property.
 * A colour fact and an unrelated placement fact cannot manufacture perspective. */
export function insightAlignment(
  i: PaintingInsight,
  facts: readonly PaintingFact[],
): "supported" | "study" | "omit" {
  if (!["clear_issue", "optional_refinement"].includes(i.classification))
    return "supported";
  const linked = facts.filter((f) => i.factIds.includes(f.id));
  const claim = `${i.lesson} ${i.action}`;
  if (
    objectDesignSuggestion(i.action) ||
    unsupportedPlacementAdvice(
      claim,
      linked.map((f) => f.observation).join(" "),
    )
  )
    return "supported";
  const relevant = relevantInsightClauses(i, facts);
  if (!relevant.length) return "omit";
  // Explicit unsupported defects are never relabelled as harmless experiments.
  const problem = relevant.some(evidencedProblem);
  if (evidencedProblem(i.lesson) && !problem) return "omit";
  if (directionalChange(claim) && !problem)
    return variableStudy(i.action) ? "study" : "omit";
  return "supported";
}
export function materialInsight(
  i: PaintingInsight,
  facts: readonly PaintingFact[],
): boolean {
  if (insightAlignment(i, facts) !== "supported") return false;
  // A linked but unrelated problem must not turn an otherwise neutral matched
  // observation into a material diagnosis. Reuse alignment's existing clauses.
  const problems = relevantInsightClauses(i, facts).filter(evidencedProblem);
  if (!problems.length) return false;
  if (i.classification === "clear_issue") {
    // A provider label does not make an explicitly subtle effect material.
    // Both the lesson and every linked problem fact must describe that limited
    // impact; a mild lesson cannot erase a materially harmful supplied fact.
    const minor = /\b(?:minor|subtle|slight(?:ly)?)\b/i;
    const major =
      /\b(?:major|severe|foundational|dominates?|obscur\w*|unreadable)\b/i;
    return !(
      minor.test(i.lesson) &&
      problems.every((clause) => minor.test(clause) && !major.test(clause))
    );
  }
  return (
    !/\b(?:minor|tiny|small|subtle|slightly|selected|a few|some wires)\b/i.test(
      `${i.lesson} ${i.action}`,
    ) &&
    /\b(?:values?|contrast|focal dominance|hierarchy|depth|spatial|integrat\w*|perspective|proportion|drawing|balance|dominates?|disconnect\w*)\b/i.test(
      `${i.lesson} ${i.action}`,
    )
  );
}

const effects: Record<string, RegExp> = {
  hierarchy:
    /\b(?:focal|compet\w*|domin\w*|attention|silhouette|separat\w*)\b/i,
  depth: /\b(?:depth|recession|spatial|atmospher\w*)\b/i,
  noise: /\b(?:noise|noisy|clutter|busy|fragment\w*|mark economy)\b/i,
  balance: /\b(?:balance|weight|mass)\b/i,
  connection: /\b(?:integrat\w*|connect\w*|detach\w*|anchor\w*)\b/i,
  drawing: /\b(?:perspective|proportion|alignment|plane|drawing)\b/i,
  rhythm: /\b(?:rhythm|cadence|spacing|repet\w*|calm)\b/i,
};
function primaryTargets(i: PaintingInsight): string[] {
  const text =
    i.action.split(/[;]|\b(?:keep|preserve|retain)\b/i)[0] || i.lesson;
  const ordered = Object.entries(targets)
    .map(([k, re]) => ({ k, at: text.search(re) }))
    .filter((t) => t.at >= 0)
    .sort((a, b) => a.at - b.at);
  return ordered.length ? [ordered[0].k] : evidenceTargets(i.lesson);
}
export function sameTeaching(
  a: PaintingInsight,
  b: PaintingInsight,
  strength = false,
): boolean {
  if (strength) {
    if (
      !intersects(
        evidenceTargets(`${a.lesson} ${a.action}`),
        evidenceTargets(`${b.lesson} ${b.action}`),
      )
    )
      return false;
  } else {
    if (!intersects(primaryTargets(a), primaryTargets(b))) return false;
    const identity = (i: PaintingInsight) =>
      i.action
        .match(/\b(?:tower|roof|church|building|house)\b/i)?.[0]
        .toLowerCase();
    if (
      primaryTargets(a)[0] === "architecture" &&
      identity(a) &&
      identity(b) &&
      identity(a) !== identity(b)
    )
      return false;
  }
  const ap = evidenceProperties(`${a.lesson} ${a.action}`),
    bp = evidenceProperties(`${b.lesson} ${b.action}`);
  const ae = matching(effects, a.lesson),
    be = matching(effects, b.lesson);
  if (!ae.length || !be.length || !intersects(ae, be)) return false;
  if (strength) {
    const dominant = (p: string[]) =>
      [
        "drawing",
        "edge",
        "colour",
        "composition",
        "connection",
        "detail",
        "value",
        "depth",
      ].find((k) => p.includes(k));
    return dominant(ap) === dominant(bp) && !!dominant(ap);
  }
  const restraint = /\b(?:soften|simplify|quiet|reduce|mute|fewer|omit)\b/i;
  return (
    (restraint.test(a.action) && restraint.test(b.action)) || intersects(ap, bp)
  );
}
export function teachingRank(i: PaintingInsight): number {
  const text = `${i.lesson} ${i.action}`;
  if (/\b(?:minor|tiny|subtle|slightly)\b/i.test(i.lesson)) return 8;
  if (
    /\b(?:integrat\w*|connect\w*|detach\w*|surrounding|reflection|contact shadow)\b/i.test(
      text,
    )
  )
    return 0;
  // The suggested mechanism matters more than an incidental "light pattern"
  // in a detail lesson. These are tie-breakers, not a new artistic diagnosis.
  if (
    /\b(?:values?|contrast|tonal|darken|lighten|darker|lighter)\b/i.test(
      i.action,
    )
  )
    return 1;
  if (/\b(?:depth|recession|recede\w*|atmospher\w*)\b/i.test(text)) return 2;
  if (/\b(?:masses|group\w*|fragment\w*)\b/i.test(i.action)) return 3;
  if (/\b(?:balance|weight|placement|position|tangent)\b/i.test(text)) return 4;
  if (/\b(?:perspective|drawing|proportion|align\w*|angles?)\b/i.test(text))
    return 5;
  if (/\b(?:edges?|contours?|soften|sharpen)\b/i.test(i.action)) return 6;
  if (/\b(?:colou?r|chroma|saturat\w*|temperature|warm|cool)\b/i.test(i.action))
    return 7;
  return 8;
}
