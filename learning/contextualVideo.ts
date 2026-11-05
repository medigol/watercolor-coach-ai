import type { InstructionalUnit, InstructionVideoLink } from "./instructionTypes";
import { resolveInstructionVideo } from "./instruction";
import { displayTime } from "./media";

/** Viewing prompts invite inspection; they never assert observations of unseen footage. */
const prompts: Record<string, { title: string; lookFor: string }> = {
  "steve-flat-wash": { title:"Brush delivery and a connected wash", lookFor:"If visible, compare the liquid delivered by the brush and how one wash movement meets the next." },
  "louise-blend": { title:"Explore a changing edge", lookFor:"If visible, compare the surface before a mark with the boundary that develops. A soft edge need not be lost." },
  "paul-values": { title:"Plan with light, middle and dark", lookFor:"If visible, follow a large value grouping before the smaller contrast decisions." },
  "tim-perspective": { title:"Observe the major planes", lookFor:"If visible, compare a large proportion or a pair of related receding edges before the small details." },
  "cafe-cloud-tips": { title:"Keep a cloud light open", lookFor:"If visible, compare where colour is placed with the light passage that is left alone." },
};
export function contextualVideoCard(link: InstructionVideoLink, unit: InstructionalUnit) {
  const resolved=resolveInstructionVideo(link,unit), prompt=prompts[link.candidateId];
  if(!resolved||!prompt)return null;
  const w=resolved.window;
  return {
    ...resolved,...prompt,
    time:w?`${displayTime(w.start)}${w.end===undefined?" onwards · end unknown":`–${displayTime(w.end)}`}`:"Original · timestamps pending",
    scope:link.scope==="long-proposal"?"Longer overview":link.scope==="chapter-hint"?"Publisher chapter hint":link.scope==="start-only"?"Owner-proposed start":"Full original",
    provenance:link.scope==="long-proposal"?"This is an owner-proposed longer viewing window, not a newly verified short clip. The same overview may be referenced elsewhere in the course.":link.scope==="chapter-hint"?"These are existing publisher chapter hints. The exact action match and boundaries still need footage inspection.":link.scope==="start-only"?"The owner supplied a start only. No endpoint or precise technique match has been verified.":"This is the full original. No exact instructional window has been established.",
  };
}
