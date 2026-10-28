import { observationText, suggestedMethodText } from "./coachingEvidence.ts";

// Bounded presentation edits over supplied prose only. No inference, new
// diagnosis, graph/classification repair, I/O or provider access belongs here.
export function tidyTeachingText(value: string): string {
  return (
    value
      // Plain React text only. Decode a bounded set of common escaped prose;
      // nothing here is interpreted as HTML, including decoded angle brackets.
      .replace(
        /&(amp|quot|apos|lt|gt|nbsp|#39|#34);/gi,
        (entity) =>
          ({
            "&amp;": "&",
            "&quot;": '"',
            "&apos;": "'",
            "&lt;": "<",
            "&gt;": ">",
            "&nbsp;": " ",
            "&#39;": "'",
            "&#34;": '"',
          })[entity.toLowerCase()] ?? entity,
      )
      .replace(/<\/?(?:p|br|strong|em|b|i)\s*\/?>/gi, " ")
      .replace(/\*\*([^*\n]+)\*\*/g, "$1")
      // An isolated truncated slash has no safe artistic expansion. Omit the
      // affected clause instead of guessing that 'negative/.' meant space.
      .split(/(?<=[.!?])\s+/)
      .filter((sentence) => !/\/[.!?]?\s*$/.test(sentence))
      .join(" ")
      .replace(
        /\b(contrast|clear|edges?|values?|visible|soft|diffused|crisp|muted|broad|irregular)(?:\s+\1\b)+/gi,
        "$1",
      )
      .replace(/([.!?])\1+/g, "$1")
      .replace(/[,;:]\s*([.!?])/g, "$1")
      .replace(/\s+([,;.!?])/g, "$1")
      .replace(/\s{2,}/g, " ")
      .replace(/^[,;:\s]+|[,;:\s]+$/g, "")
      .trim()
  );
}

const personJudgement =
  /\b(?:the (?:artist|painter) (?:shows|demonstrates|displays|exhibits|has)|foundational (?:skills?|understanding)|professionalism|professional experience|mastery|proficiency|technical mastery|(?:experienced|skilled|skilful|skillful|expert) (?:handling|use|control|execution|technique)|handling ability|technique control|control of watercolou?r techniques|(?:demonstrates?|shows?)\s+(?:(?:great|solid|strong|considerable)\s+)?skill|(?:artist|painter|user|you|they)\b[^.!?]{0,45}\b(?:skill\w*|experience\w*|professional\w*|mastery|talented|expert))\b/i;

/** Convert only explicit property praise; omit remaining judgements of people. */
export function paintingLevelText(value: string): string {
  const text = value
    .replace(
      /\b(solid|good|strong|effective) control of (?:the )?(value contrasts?|value grouping|focal hierarchy|edge definition|colou?r relationships?)\b/gi,
      (_, quality: string, property: string) => {
        const label =
          quality.toLowerCase() === "effective" ? "effective" : "strong";
        // Value contrast is one abstract property; retaining plural 'contrasts'
        // here would break a supplied singular predicate ('control creates').
        const visibleProperty = property.replace(
          /value contrasts$/i,
          "value contrast",
        );
        return `${/^[A-Z]/.test(quality) ? label[0].toUpperCase() + label.slice(1) : label} ${visibleProperty}`;
      },
    )
    .replace(
      /\bthe (?:artist|painter) (shows|demonstrates|displays|exhibits|has)\b(?=\s+(?:(?:a|an|the|strong|clear|coherent|effective|balanced)\s+){0,3}(?:value contrast|value grouping|focal hierarchy|edge definition|colou?r relationships?)\b)/gi,
      "The painting $1",
    );
  return tidyTeachingText(
    text
      .split(/(?<=[.!?])\s+|\n+/)
      .flatMap((sentence) => {
        if (!personJudgement.test(sentence)) return [sentence];
        // Retain only independent supplied clauses, never create substitute praise.
        return sentence
          .split(/;\s*|,?\s+(?:but|while|although|though|and)\s+/i)
          .filter((part) => {
            const predicate =
              /\b(?:is|are|has|have|creates?|supports?|gives?|holds?|separates?|balances?)\b/i.exec(
                part,
              );
            return (
              !personJudgement.test(part) &&
              predicate &&
              !!part.slice(0, predicate.index).trim() &&
              !/^(?:with|and|but)\b/i.test(part.trim())
            );
          })
          .map((part) => part.trim().replace(/[,;.]$/, "") + ".");
      })
      .join(" "),
  );
}

/** A visible adjective can be retained; an unknown application method cannot. */
export function visibleTeachingText(value: string): string {
  const text = paintingLevelText(value)
    .replace(
      /\b(is|was|are|were) painted with (?=(?:(?:more|less) )?(?:defined|sharp(?:er)?|crisp|soft|dark(?:er)?|light(?:er)?) (?:edges?|contours?|shapes?|marks?)\b)/gi,
      (_, verb: string) => (/^(?:are|were)$/i.test(verb) ? "have " : "has "),
    )
    .replace(
      /\b(dark(?:er)?|light(?:er)?|dense|denser|solid[- ]looking) (?:pigment|colou?r) application\b/gi,
      "$1 visible passages",
    );
  const safe = text
    .split(/(?<=[.!?])\s+|\n+/)
    .filter(
      (sentence) =>
        !/\b(?:(?:is|was|are|were) painted with|painted using|applied with|(?:pigment|colou?r|brush|wash) application|original (?:handling|process|method))\b/i.test(
          sentence,
        ),
    )
    .join(" ");
  return tidyTeachingText(observationText(safe));
}

export function futureTeachingText(value: string): string {
  return tidyTeachingText(paintingLevelText(suggestedMethodText(value)));
}

const correctiveVerb =
  "(?:refin(?:e|ing)|fix(?:ing)?|improv(?:e|ing)|correct(?:ing)?|increas(?:e|ing)|sharpen(?:ing)?|soften(?:ing)?|strengthen(?:ing)?|adjust(?:ing)?|amplif(?:y|ying)|enhanc(?:e|ing)|deepen(?:ing)?|darken(?:ing)?|lighten(?:ing)?|reduc(?:e|ing)|simplif(?:y|ying)|mute|quiet|add)";
export function correctiveInstruction(value: string): boolean {
  return new RegExp(
    `^(?:(?:please|slightly|gently|selectively|also)\\s+)*${correctiveVerb}\\b|\\b(?:should|needs?(?: to)?|could be|would benefit from)\\b[^.!?]{0,45}\\b(?:refin\\w*|fix\\w*|improv\\w*|correct\\w*|stronger|sharper|softer|more contrast)\\b`,
    "i",
  ).test(value.trim());
}

/** Strength owns existing relationships. Changes belong to existing guidance. */
export function strengthTeachingText(value: string): string {
  const text = value.replace(
    new RegExp(
      `(?:[,;]?\\s+(?:while|but|and|then)\\s+|,\\s+(?=\\w+ing\\b))(?:(?:slightly|gently|selectively|subtly|also)\\s+)*${correctiveVerb}\\b[^.!?]*`,
      "gi",
    ),
    "",
  );
  return tidyTeachingText(
    text
      .split(
        /(?<=[.!?])\s+|;\s*|,?\s+(?:but|while)\s+(?=[^.!?]*\b(?:needs?|should|could|must)\b)/i,
      )
      .filter(
        (part) =>
          !correctiveInstruction(part) &&
          !/\b(?:needs? (?:refinement|improvement|correction)|must (?:be )?(?:refin\w*|improv\w*|correct\w*))\b/i.test(
            part,
          ),
      )
      .join(" "),
  );
}

/** Comparisons can be valid choices; maintaining or fixing is no alternative. */
export function honestStylisticAlternative(
  lesson: string,
  action: string,
): boolean {
  const text = `${lesson} ${action}`.replace(
    /\b(?:not|never|no) (?:a |an )?(?:correction|defect|improvement)\b/gi,
    "",
  );
  if (
    /\b(?:improv\w*|fix(?:es|ing)?|correct\w*|enhanc\w*|refin\w*|weak\w*|poor\w*|insufficient|inaccurac\w*|needs?|defects?)\b/i.test(
      text,
    )
  )
    return false;
  const instruction = action.replace(
    /^(?:on|in|for) (?:a )?(?:(?:separate|small|new|future|next) )*study[,;:]?\s*/i,
    "",
  );
  return (
    !instruction
      .split(/[.!?;,]|\s+(?:and|but|while)\s+/i)
      .some(correctiveInstruction) &&
    /\b(?:compare|versus|vs\.?|rather than|instead of|alternative|another valid|different (?:choice|treatment|approach))\b/i.test(
      text,
    ) &&
    !(
      /^(?:maintain|preserve|keep|retain)\b/i.test(instruction) &&
      !/\b(?:compare|versus|vs\.?|rather than|instead of)\b/i.test(action)
    )
  );
}

/** Neutralize only a supplied defect implication. Never invent a new exercise. */
export function neutralStudyText(
  value: string,
  supports: (claim: string) => boolean,
): string {
  return tidyTeachingText(
    futureTeachingText(value)
      .split(/(?<=[.!?])\s+/)
      .flatMap((sentence) => {
        if (supports(sentence)) return [sentence];
        const neutral = sentence
          .replace(/\b(perspective|proportion|drawing) accuracy\b/gi, "$1")
          .replace(/\baccurate (perspective|proportions?|drawing)\b/gi, "$1")
          .replace(
            /\s+to (?:gauge|measure|assess|evaluate) (?:the )?improvement\b/gi,
            "",
          )
          .replace(
            /[,;]?\s+(?:to|in order to) (?:improve|correct|fix|repair)\b[^.!?]*/gi,
            "",
          );
        return /\b(?:improv\w*|correct\w*|fix(?:es|ing)?|repair\w*|inaccurac\w*|accuracy|deficien\w*|weak\w*|poor\w*)\b/i.test(
          neutral,
        )
          ? []
          : [neutral];
      })
      .join(" "),
  );
}
