import { itemById } from "./content";
import { goalLabels } from "./catalogue";
import type { LearningProfile, LessonStep } from "./types";
import type { PreviewCandidate, PreviewWindow } from "./videoPreview";

/** Original app teaching, based on the supplied topic/step mapping. These are
 * learning intentions and observation questions, never claims of unseen footage.
 * No raw screening notes, transcripts or publication approvals belong here. */
export interface VideoLearningGuide {
  title: string;
  level: "Foundation" | "Developing" | "Intermediate / advanced";
  visual: LessonStep["visual"];
  objectives: [string, string, ...string[]];
  prompts: [string, string, ...string[]];
  exercise: { action: string; minutes: number; success: string };
}
export const videoLearningGuides: Record<string, VideoLearningGuide> = {
  "steve-flat-wash": {
    title: "Build a more even wash", level: "Foundation", visual: "water",
    objectives: ["Relate brush loading to an even passage of colour.", "Compare pooling and dried edges before adjusting the next wash."],
    prompts: ["How is the brush loaded before the wash begins?", "Where does a bead gather, and what happens to it before the next stroke?"],
    exercise: { action: "Paint two 3 × 4 cm boxes with one premixed colour on dry paper. Change only the brush load for the second box; compare both after drying.", minutes: 8, success: "Name the load that gave the more even passage, and identify any edge pooling." },
  },
  "paul-values": {
    title: "Plan with light, middle and dark", level: "Foundation", visual: "values",
    objectives: ["Group small variations into three large value families.", "Use the arrangement of dark and light to test focal emphasis."],
    prompts: ["Which light areas remain separate from the middle and dark groups?", "Where does the strongest value contrast draw your attention, regardless of hue?"],
    exercise: { action: "Draw two postage-stamp plans of the same simple view using white paper, a middle pencil tone and a dark tone. Move only the main dark group in the second plan.", minutes: 10, success: "Compare both at arm’s length and explain which grouping supports your intended focus." },
  },
  "louise-blend": {
    title: "Control a blended transition", level: "Foundation", visual: "edges",
    objectives: ["Relate paper moisture to the spread of a painted mark.", "Distinguish a sharp boundary from a gradual transition."],
    prompts: ["What is visibly wet or dry before the paint touches the paper?", "When an edge is softened, how damp is the brush and which side of the boundary is touched?"],
    exercise: { action: "Use one premixed colour for two equal strokes: one on dry paper and one on evenly damp paper with no standing water. Keep brush load similar.", minutes: 8, success: "After drying, identify the sharper edge and describe the difference in spread. A soft edge is not automatically a lost edge." },
  },
  "cafe-cloud-tips": {
    title: "Leave light and soft edges in a cloud study", level: "Developing", visual: "edges",
    objectives: ["Connect paper moisture with cloud-edge softness.", "Preserve a light passage rather than repeatedly disturbing a drying wash."],
    prompts: ["What surface sheen is visible when a new mark is added?", "Where are light passages left, and when does the painter stop touching the wash?"],
    exercise: { action: "Paint two 5 × 7 cm sky studies with the same mixture. Change only the paper moisture and preserve one light passage in each. Let both dry before comparing.", minutes: 10, success: "Identify one soft transition and one preserved light. Record the moisture condition you would repeat." },
  },
  "cafe-cloud-wet": {
    title: "Explore wet-into-wet skies", level: "Developing", visual: "water",
    objectives: ["Compare spreading on damp paper with a dry-paper mark.", "Decide when to leave a wash alone."],
    prompts: ["Can you see the surface condition before each cloud mark?", "Which changes appear while the wash is wet, and which appear only after drying?"],
    exercise: { action: "Paint a small damp-paper sky and a dry-paper comparison using the same pigment mixture and brush. Avoid retouching either as it dries.", minutes: 10, success: "Compare the dried edge width and note where an extra wet touch would have changed the result." },
  },
  "tim-perspective": {
    title: "Observe structure before street detail", level: "Developing", visual: "drawing",
    objectives: ["Separate a building’s large outline from small details.", "Compare related receding edges from one viewpoint."],
    prompts: ["Which observed edges belong to the same receding plane?", "Can you identify a horizon and compare proportions before adding windows?"],
    exercise: { action: "Sketch one street corner from your own view or reference. Block in the building envelope and two groups of receding edges; leave out windows and signs.", minutes: 12, success: "Check relative heights and the direction of each related edge group. Do not force every visible line toward one vanishing point." },
  },
  "cafe-brushstrokes": {
    title: "Make deliberate marks with one brush", level: "Foundation", visual: "water",
    objectives: ["Compare the brush tip and belly as mark-making tools.", "Repeat a mark before changing a single variable."],
    prompts: ["Which part of the brush makes contact with the paper?", "What changes between two marks: pressure, loading or speed?"],
    exercise: { action: "With one round brush and one mixture on dry paper, make two rows of six marks. Keep load and speed similar; change only the pressure between rows.", minutes: 6, success: "Identify a repeatable narrow mark and a broader mark, without treating paper texture as a mistake." },
  },
  "matthew-3stage": {
    title: "Connect the large landscape masses", level: "Developing", visual: "values",
    objectives: ["Reduce a landscape to a few connected shapes.", "Compare value relationships before adding detail."],
    prompts: ["Which large masses are established before small marks?", "Do neighbouring shapes read as one value family or separate families?"],
    exercise: { action: "Make a three-value plan of sky, hill and bank in a 5 × 7 cm rectangle. Connect similar-valued shapes and limit the plan to five masses.", minutes: 10, success: "The three main groups remain legible at arm’s length without relying on surface detail." },
  },
  "matthew-process-2024": {
    title: "Plan the order of a landscape study", level: "Developing", visual: "landscape",
    objectives: ["Choose a wash order that protects intended lights.", "Reserve finishing accents for a specific purpose."],
    prompts: ["Which passages need to dry before the next is added?", "Which late marks change the focus rather than merely add detail?"],
    exercise: { action: "For your own small landscape, write a three-stage wash plan: light passage, connected main masses, then at most three focal accents. Mark where drying is needed.", minutes: 8, success: "Explain which light the plan protects and why each final accent earns its place." },
  },
  "paul-simple-landscape": {
    title: "Give a simple landscape a near mass", level: "Developing", visual: "landscape",
    objectives: ["Relate a foreground mass to the rest of a study.", "Keep detail subordinate to the main shapes."],
    prompts: ["How much of the image is occupied by the near dark group?", "Which small details could be omitted without losing the landscape’s structure?"],
    exercise: { action: "On a dry three-mass landscape study, add one restrained foreground shape using a single mixture. Stop before adding small detail.", minutes: 10, success: "Compare before and after: does the near shape support your chosen focus without overwhelming the light area?" },
  },
  "louise-soft-edges": {
    title: "Soften an edge with intention", level: "Foundation", visual: "edges",
    objectives: ["Compare a hard boundary with a softened transition.", "Recognise that softness alone does not make an edge lost."],
    prompts: ["When is the neighbouring paper or brush damp?", "Is a boundary still visible after softening, or does it disappear into a similar value?"],
    exercise: { action: "Paint two small squares with the same mixture on dry paper. Leave one boundary hard; soften one side of the second square with a clean damp brush while it is workable.", minutes: 8, success: "Identify the abrupt and gradual boundaries after drying. Do not label a visible soft boundary a lost contour." },
  },
  "javid-cityscape": {
    title: "Simplify an urban scene into connected shapes", level: "Intermediate / advanced", visual: "drawing",
    objectives: ["Compare readable structure with selective omission.", "Choose where architectural detail is needed for your intention."],
    prompts: ["Which silhouettes keep the cityscape recognisable?", "Which peripheral features are left as connected marks rather than individually described?"],
    exercise: { action: "Make two monochrome street thumbnails from your own reference. Keep the same major proportions; omit half the small architectural marks in the second.", minutes: 15, success: "Identify what still makes the scene readable and whether the simpler version better supports your focus." },
  },
  "javid-cityscape-confirmed-2021": {
    title: "Choose selective detail in a cityscape", level: "Intermediate / advanced", visual: "drawing",
    objectives: ["Use a limited set of marks to support urban structure.", "Compare focal definition with looser supporting passages."],
    prompts: ["Where is the sharpest definition concentrated?", "Which broad shapes carry structure before you recognise any small detail?"],
    exercise: { action: "On a dry urban thumbnail, add at most five deliberate marks to clarify the focus. Pause after each; leave the surrounding shapes alone.", minutes: 12, success: "Name the structural job of each mark. More detail is not automatically a stronger painting." },
  },
  "javid-atmosphere": {
    title: "Consider atmosphere before finishing detail", level: "Intermediate / advanced", visual: "landscape",
    objectives: ["Compare value and edge relationships across a landscape.", "Decide which accents reinforce the intended atmosphere."],
    prompts: ["Where are contours more definite, and where do shapes connect?", "Which value relationships suggest depth in this particular scene?"],
    exercise: { action: "Make two small studies from your own landscape plan. Keep the main masses fixed; change only the sharpness of one supporting boundary, then compare the sense of depth.", minutes: 15, success: "Explain which edge choice supports your atmosphere; avoid assuming all distant objects must always be lighter." },
  },
  "louise-clouds": {
    title: "Compare ways to preserve a cloud light", level: "Developing", visual: "landscape",
    objectives: ["Plan a light passage before painting the sky around it.", "Compare edge handling rather than copying a cloud outline."],
    prompts: ["Which light shapes are preserved as the surrounding sky develops?", "If lifting is shown, what paper condition and brush action can you actually see?"],
    exercise: { action: "Paint two small skies with the same mixture and moisture condition. Change only the shape of the light passage you leave. Avoid copying a particular cloud contour.", minutes: 10, success: "Both studies preserve a clear light passage; compare which edge pattern serves your intended weather." },
  },
  "matthew-landscape-2025": {
    title: "Judge the middle distance in context", level: "Developing", visual: "landscape",
    objectives: ["Compare the middle distance with adjacent light and dark masses.", "Plan an edge that suits the intended depth."],
    prompts: ["How does the middle mass compare with its immediate neighbours?", "Where do connected washes and separate boundaries change the reading of depth?"],
    exercise: { action: "Paint two small three-mass plans with the same sky and foreground. Change only the middle mass’s value; let each dry before judging the depth.", minutes: 12, success: "Describe the relationship that works for your intention, rather than applying a universal lighter-distance rule." },
  },
  "oliver-landscape": {
    title: "Observe a landscape’s main relationships", level: "Developing", visual: "landscape",
    objectives: ["Simplify a view without losing its main proportions.", "Relate distance, value and edges to the observed light."],
    prompts: ["Which observed shapes remain important when small texture is removed?", "What changes between the near and far masses under this lighting?"],
    exercise: { action: "From your own view or reference, sketch three large landscape masses. Label one observed value relationship and one edge you intend to soften; omit small textures.", minutes: 10, success: "The plan records a specific observation and a purposeful simplification, rather than a formula for every landscape." },
  },
};

export interface VideoContext { lesson?: string; step?: string }
/** These choices use only supplied chapter TOPICS. They do not verify footage. */
const contextualWindows: Record<string, Record<string, string>> = {
  "louise-blend": {
    "water-brush:moisture": "louise-blend-publisher-1",
    "edge-families:hard": "louise-blend-publisher-2",
    "edge-families:soft": "louise-blend-publisher-5",
  },
  "cafe-cloud-tips": {
    "edge-families:soft": "cafe-cloud-tips-publisher-5",
    "quiet-landscape:sky": "cafe-cloud-tips-publisher-3",
  },
};
function safeHint(c: PreviewCandidate, w: PreviewWindow) {
  // Neither endpoint of the Café 138s conflict is a defensible default.
  return w.source !== "conflicting-publisher-hint" &&
    !c.windows.some(other => other.source === "conflicting-publisher-hint" && other.start === w.start);
}
export function defaultPreviewWindow(c: PreviewCandidate, context: VideoContext = {}): string {
  const related = c.related.some(r => r.lessonId === context.lesson && r.stepId === context.step);
  const specific = related ? contextualWindows[c.id]?.[`${context.lesson}:${context.step}`] : undefined;
  const mapped = c.windows.find(w => w.id === specific && safeHint(c, w));
  const owner = c.windows.find(w => w.source === "owner-proposal") ?? c.windows.find(w => w.source === "owner-start-only");
  const publisher = c.id === "cafe-cloud-tips"
    ? c.windows.find(w => w.id === "cafe-cloud-tips-publisher-3" && safeHint(c, w))
    : c.windows.find(w => w.source === "publisher-hint" && safeHint(c, w));
  return (mapped ?? owner ?? publisher)?.id ?? "original";
}
export function previewWindowSummary(c: PreviewCandidate, id: string) {
  const w = c.windows.find(w => w.id === id);
  if (!w) return "Full video · exact timestamps pending review";
  const time = (n: number) => `${Math.floor(n / 60)}:${String(n % 60).padStart(2, "0")}`;
  return `${time(w.start)}${w.end === undefined ? " onwards · endpoint pending" : `–${time(w.end)}`} · ${w.source.startsWith("owner") ? "owner proposal" : "publisher hint"} · unverified`;
}
export function previewLearningContext(c: PreviewCandidate, input: VideoContext, profile: LearningProfile | null) {
  const mapped = c.related.find(r => r.lessonId === input.lesson && (!input.step || r.stepId === input.step));
  const target = mapped ?? c.related[0];
  const item = itemById(target.lessonId)!;
  const step = item.steps.find(s => s.id === target.stepId)!;
  const beginner = profile?.experience === "beginner" || profile?.experience === "developing";
  return {
    ...target,
    reason: `${mapped ? "For your current study" : "Connects to"}: ${item.title} · ${step.title}.${profile && (item.styleTags.includes(profile.primaryStyle) || item.subjectTags.includes(profile.subject) || profile.goal === "technique" || profile.goal === "start") ? ` This topic supports your goal: ${goalLabels[profile.goal].toLowerCase()}.` : ""}${c.advancedOnly && beginner ? " Optional advanced comparison; use the written foundation lesson first." : ""}`,
  };
}
export function previewSessionPlan(c: PreviewCandidate, windowId: string, budget = 15) {
  const w = c.windows.find(w => w.id === windowId), practice = videoLearningGuides[c.id].exercise.minutes;
  const watch = w?.end === undefined ? null : Math.ceil((w.end - w.start) / 60);
  return watch === null
    ? `Practise for about ${practice} minutes, plus drying. Viewing time is unconfirmed; pause or watch separately.`
    : `${watch} minutes suggested viewing + ${practice} minutes practice, plus drying.${watch + practice > budget ? " Split watching and painting into separate sessions." : ""}`;
}
/** Rank only within a chosen curriculum topic; style never displaces a skill.
 * This orders preview candidates, not approved instructional recommendations. */
export function orderVideoPreviews(candidates: readonly PreviewCandidate[], context: VideoContext, profile: LearningProfile | null) {
  const goalStudy = profile ? ({ start: "water-brush", technique: "water-brush", atmosphere: "quiet-landscape", realism: "observed-structure", expression: "edge-families", composition: "three-values", colour: "three-values", urban: "observed-structure", independence: "quiet-landscape" } as const)[profile.goal] : undefined;
  const rank = (c: PreviewCandidate) => {
    const related = c.related.some(r => r.lessonId === context.lesson && (!context.step || r.stepId === context.step));
    const interests = profile && c.related.some(r => {
      const item = itemById(r.lessonId)!;
      return item.styleTags.includes(profile.primaryStyle) || item.subjectTags.includes(profile.subject);
    });
    const advanced = profile?.experience === "intermediate" || profile?.experience === "advanced";
    return [related ? 1 : 0, c.advancedOnly && !advanced ? 0 : 1, c.related.some(r => r.lessonId === goalStudy) ? 1 : 0, c.ownerScreened ? 1 : 0, interests ? 1 : 0];
  };
  return [...candidates].sort((a, b) => {
    const ar = rank(a), br = rank(b);
    for (let i = 0; i < ar.length; i++) if (ar[i] !== br[i]) return br[i] - ar[i];
    return 0;
  });
}
