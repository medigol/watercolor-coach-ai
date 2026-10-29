import type {
  Exercise,
  GuidedProject,
  Lesson,
  LessonStep,
  LearningItem,
} from "./types";
const materials = [
  "A small piece of watercolour paper",
  "One round brush",
  "One familiar watercolour",
  "Clean water, palette and cloth",
];
function step(
  id: string,
  title: string,
  minutes: number,
  visual: LessonStep["visual"],
  explanation: string,
  actions: string[],
  checklist: string[],
  observe: string,
  pitfall: string,
): LessonStep {
  return {
    id,
    title,
    minutes,
    visual,
    explanation,
    actions,
    checklist,
    observe,
    pitfall,
  };
}
function lesson(
  value: Omit<
    Lesson,
    "kind" | "version" | "editorialStatus" | "availability" | "resourceIds"
  >,
): Lesson {
  return {
    ...value,
    kind: "lesson",
    version: 1,
    editorialStatus: "internally-reviewed",
    availability: "available",
    resourceIds: [],
  };
}
const waterExercise: Exercise = {
  target: "Two rows of three small swatches, followed by two moisture tests.",
  technique: "Dilution, consistent brush loading and observing paper moisture.",
  variable:
    "First change only dilution; then change only the paper's moisture.",
  constants: [
    "Same pigment, brush and paper",
    "Similar swatch size and brush load",
    "For the moisture test, the same premixed colour",
  ],
  comparison:
    "Compare the dry swatches. Then compare where each moisture-test edge stops or spreads.",
  success: [
    "Three recognisably different dry values",
    "A repeatable swatch without a puddle at its end",
    "An observed difference between dry and damp paper, even if a bloom occurs",
  ],
  recovery:
    "If a puddle forms, unload the brush on the cloth and repeat one swatch. If an edge spreads unpredictably, wait for the sheen to diminish and test again. Record the condition rather than calling the result a failure.",
  shortVersion:
    "In 10–15 minutes, make one dilution row and one dry/damp pair. Let them dry before comparing; return later if necessary.",
  extension:
    "Repeat with a different paper while keeping the pigment mixture and brush the same. Compare behaviour, not just appearance.",
};
export const lessons: Lesson[] = [
  lesson({
    id: "water-brush",
    moduleId: "materials",
    title: "Water & brush control",
    description:
      "Make water quantity a deliberate choice, not a guessing game.",
    difficulty: "foundation",
    skillIds: ["water-control", "washes"],
    prerequisiteSkillIds: [],
    instructionMinutes: 7,
    practiceMinutes: 18,
    materials,
    objectives: [
      "Create three dry values by dilution",
      "Load and unload a brush consistently",
      "Observe how paper moisture changes a mark",
    ],
    why: "A wash depends on water in the brush, water on the paper and pigment concentration. Changing all three at once makes the result hard to understand. This study separates them, so the next painting decision has a visible cause.",
    exercise: waterExercise,
    subjectTags: [],
    styleTags: ["atmospheric", "urban", "botanical", "expressive"],
    reflectionPrompt:
      "Which brush load and paper condition gave the edge you intended? Describe one visible result and the condition you would repeat.",
    steps: [
      step(
        "look",
        "Notice the three water decisions",
        3,
        "water",
        "Dilution changes pigment concentration. Brush loading changes the amount of liquid delivered. Paper moisture changes how far that liquid can move. A glossy wet surface, a damp surface with little sheen and dry paper behave differently; room conditions and paper sizing change the timing.",
        [
          "Look at the diagram as a comparison, not a recipe for exact timing.",
          "Choose one familiar pigment so its behaviour does not change between tests.",
        ],
        ["I reviewed dilution, loading and surface moisture"],
        "A pale mixture can still flood the paper if the brush carries too much liquid.",
        "Do not equate a darker mixture with a wetter brush. These are different controls.",
      ),
      step(
        "set-up",
        "Prepare a repeatable brush load",
        4,
        "water",
        "Wet the brush, load the belly from a small colour puddle and touch it lightly to the palette edge. Make a stroke. If a bead gathers at the end, briefly touch the brush to the cloth before the next stroke. The aim is repeatability, not one universally correct water load.",
        [
          "Tape or steady the paper. Mark six small rectangles in two rows.",
          "Make a small pool of colour. Keep a clean-water area separate.",
          "Test a stroke, then adjust the load once. Keep this loading action for the dilution row.",
        ],
        [
          "Paper and palette ready",
          "A test stroke made without a large end puddle",
        ],
        "Can you repeat a similar stroke twice? Paper texture may break the mark; that is not automatically poor control.",
        "Do not scrub a partly drying stroke. Let it dry and start another.",
      ),
      step(
        "dilution",
        "Vary dilution, not everything",
        7,
        "water",
        "Put a little of the same mixture into three wells. Leave one as it is, add some water to the second and more to the third. Ratios are starting experiments, not reconstruction formulas. Swatch each with the same loading action. Repeat the row to see whether the relationship is reproducible.",
        [
          "Paint three similarly sized swatches on dry paper without going back into them.",
          "Repeat below. Keep the paper, brush, pigment and loading action constant.",
          "Allow them to dry; watercolour often changes in apparent value as it dries.",
        ],
        [
          "First dilution row painted",
          "Repeat row painted",
          "Dry values compared",
        ],
        "Look for three separable values. Which stayed light enough to serve as a light passage?",
        "Comparing one wet swatch with a dry one confounds the result. Wait or pause the lesson.",
      ),
      step(
        "moisture",
        "Compare dry and damp paper",
        7,
        "edges",
        "Use one premixed colour for both tests. On one patch of dry paper, place a stroke. Wet a second patch evenly, wait until standing water is gone, then place the same stroke. Note the sheen and the spread. A later, wetter addition can push pigment into a drying area and produce a bloom; that can be useful deliberately.",
        [
          "Make a dry-paper stroke.",
          "Make a second stroke on evenly damp paper using the same mixture and loading action.",
          "Wait and compare the boundaries. If time is short, return after drying.",
        ],
        [
          "Dry-paper test made",
          "Damp-paper test made",
          "Surface condition and edge difference observed",
        ],
        "Does the damp-paper mark spread farther? Record what happened rather than assuming every paper behaves identically.",
        "A shiny puddle is not the same condition as evenly damp paper. Avoid fixed-minute recipes.",
      ),
      step(
        "reflect",
        "Name a repeatable decision",
        4,
        "water",
        "An unexpected spread is useful information if you can describe the conditions. Completion records your practice, not objective mastery. Keep the swatches as a physical reference; no upload is needed.",
        [
          "Compare the dry results at the same distance.",
          "Choose one loading action and one moisture condition to reuse.",
        ],
        ["I compared the dry results", "I chose a condition to repeat"],
        "Can you explain one result using a condition you actually observed?",
        "Do not infer a particular pigment formula or paper brand from appearance alone.",
      ),
    ],
  }),
  lesson({
    id: "three-values",
    moduleId: "values",
    title: "Three-value planning",
    description:
      "Give a painting a clear large-scale structure before adding colour.",
    difficulty: "foundation",
    skillIds: ["values"],
    prerequisiteSkillIds: [],
    instructionMinutes: 6,
    practiceMinutes: 19,
    materials: [
      "Paper and a soft pencil, or one neutral watercolour",
      "A simple object, view or your own reference",
      "A timer, if useful",
    ],
    objectives: [
      "Separate light, middle and dark masses",
      "Group small variations into larger shapes",
      "Compare two value arrangements without changing subject placement",
    ],
    why: "A thumbnail lets you test relationships cheaply. Three values are a planning constraint, not a rule that every finished painting must have strong contrast. A high-key or misty subject may intentionally occupy a narrow range.",
    exercise: {
      target: "Two postcard-stamp-sized thumbnails of the same simple subject.",
      technique: "Grouping visible tones into three value families.",
      variable:
        "Change the placement of one dark accent in the second thumbnail.",
      constants: [
        "Same framing and subject shapes",
        "Same three values",
        "Similar total dark area",
      ],
      comparison:
        "View both from arm's length. Ask which arrangement serves your intended focus or calmness.",
      success: [
        "Only three main value families",
        "Large masses readable without details",
        "A specific observed difference between the alternatives",
      ],
      recovery:
        "If everything fragments, reduce the number of shapes. If the dark dominates unintentionally, try a smaller dark area in a separate third thumbnail and name that changed variable.",
      shortVersion:
        "Use 10–15 minutes for two pencil thumbnails. Revisit the comparison after a short break.",
      extension:
        "Transfer your preferred grouping to a different subject while keeping the three-value constraint.",
    },
    subjectTags: [],
    styleTags: ["atmospheric", "urban", "botanical", "expressive"],
    reflectionPrompt:
      "Which value arrangement better served your intention, and what changed in the viewing experience?",
    steps: [
      step(
        "look",
        "See tone separately from hue",
        3,
        "values",
        "Hue is a colour family; value is its lightness or darkness. A saturated red can attract attention without being the darkest area. Squinting may help you group masses, but it is not a calibrated grayscale measurement. Compare neighbouring tones rather than judging by colour names.",
        [
          "Choose a simple subject with no more than five major masses.",
          "Name one light, one middle and one dark relationship you can actually see.",
        ],
        ["A simple subject chosen", "Three value relationships identified"],
        "Can you distinguish the relationships without relying on colour names?",
        "Do not make a red object dark merely because its colour is strong.",
      ),
      step(
        "map",
        "Group before detail",
        5,
        "values",
        "Draw two small equal rectangles. Mark the largest light and middle shapes, then decide where the dark belongs. Keep paper for the light. Small variations can join one family; this is purposeful simplification, not a claim that the subject has only three tones.",
        [
          "Outline only major masses in both rectangles.",
          "Choose three pencil pressures or premix three dry-tested neutral values.",
        ],
        ["Two matching frames drawn", "Three working values chosen"],
        "Is the empty paper an intentional light shape?",
        "Adding windows or leaves too early prevents you from seeing the larger organisation.",
      ),
      step(
        "first",
        "Make the first thumbnail",
        6,
        "values",
        "Fill each mass with one family. Let neighbouring masses connect when their values are close. A focal area may be supported by local contrast, isolation or shape; it does not have to be centred or extremely dark.",
        [
          "Keep your chosen framing.",
          "Use the three families without adding detail.",
          "Pause and view the small design from arm's length.",
        ],
        ["First thumbnail completed", "Large-scale reading checked"],
        "Where does your attention go first, and is that consistent with your intention?",
        "A compelling thumbnail is not proof that a finished painting will succeed; edges and colour will add relationships.",
      ),
      step(
        "compare",
        "Change one dark relationship",
        7,
        "values",
        "In the second thumbnail, relocate one small dark accent while retaining similar total dark area. Keep framing, main shapes and values constant. If several things change, you cannot tell which decision caused the effect.",
        [
          "Make the second arrangement.",
          "Compare first attention, balance and quiet intervals.",
          "Choose either version, or decide both serve different intentions.",
        ],
        [
          "Second thumbnail completed",
          "The controlled difference identified",
          "Both versions compared",
        ],
        "A calmer version may be preferable to a more dramatic one. State the effect, not a universal winner.",
        "Do not move the subject and alter all values at the same time.",
      ),
      step(
        "reflect",
        "Take the principle to a painting",
        4,
        "values",
        "The transferable skill is choosing large value relationships before committing. Keep both thumbnails; the less preferred version is evidence of a decision, not wasted work.",
        [
          "Write one sentence about the difference.",
          "Identify one relationship worth preserving when you add colour.",
        ],
        ["A comparison recorded", "One relationship selected for transfer"],
        "Can you name the cause and visual effect?",
        "Do not turn this study into a rule that all paintings need a dramatic dark focal point.",
      ),
    ],
  }),
  lesson({
    id: "edge-families",
    moduleId: "edges",
    title: "Hard, soft & lost edges",
    description:
      "Use boundaries to connect forms, suggest space and direct attention.",
    difficulty: "developing",
    skillIds: ["edges"],
    prerequisiteSkillIds: ["water-control"],
    instructionMinutes: 6,
    practiceMinutes: 24,
    materials,
    objectives: [
      "Distinguish hard, soft and lost boundaries",
      "Compare edge behaviour while controlling mixture and shape",
      "Choose an edge relationship for a visual purpose",
    ],
    why: "A hard edge is an abrupt transition; a soft edge is gradual. A lost edge is locally difficult to distinguish because adjoining values or colours are similar. Losing an edge is a visual relationship, not simply blurring every contour.",
    exercise: {
      target:
        "Three similar simple hill or leaf shapes and one paired application.",
      technique:
        "Dry-paper marks, damp-paper diffusion and merging adjacent similar tones.",
      variable:
        "Change the boundary treatment; keep the main shape and mixture comparable.",
      constants: [
        "Same brush, pigment and paper",
        "Similar shape size and initial value",
        "Same viewing distance after drying",
      ],
      comparison:
        "Compare the dry boundaries. For a paired study, choose where one sharper edge can coexist with a softer or lost interval.",
      success: [
        "A visibly abrupt transition",
        "A visibly gradual transition",
        "One locally merging boundary",
        "A stated purpose for the selected sharp edge",
      ],
      recovery:
        "If all shapes diffuse, wait longer before the hard-edge test. If a lifted area becomes damaged, stop; try the softening action on a fresh patch instead of scrubbing.",
      shortVersion:
        "In 10–15 minutes make the three edge tests. Save the application for your next session.",
      extension:
        "Keep value contrast similar and compare edge placement in two small compositions. Notice that sharpness is only one influence on attention.",
    },
    subjectTags: [],
    styleTags: ["atmospheric", "botanical", "urban", "expressive"],
    reflectionPrompt:
      "Where did an edge remain hard, soften or disappear? Which relationship would serve your chosen style, and why?",
    steps: [
      step(
        "look",
        "Read boundaries, not labels",
        3,
        "edges",
        "Look at each diagram boundary. Hard and soft describe transition width. A lost interval joins adjacent similar passages; the rest of a shape may remain legible. An atmospheric painting may use many soft edges, while an observational botanical study may need selected crisp ones. Neither distribution is universally superior.",
        [
          "Choose a hill, leaf or abstract mass to repeat.",
          "Decide whether you want separation, connection or recession.",
        ],
        ["A repeatable shape chosen", "A visual intention stated"],
        "Which edge would serve that intention?",
        "Do not call every soft edge a mistake or every hard edge an improvement.",
      ),
      step(
        "hard",
        "Establish a hard edge",
        5,
        "edges",
        "Paint a small shape on dry paper with enough liquid to flow but not flood. Leave the boundary alone as it dries. This gives a baseline for comparison. Rough paper may break the mark; describe that separately from softness.",
        [
          "Use a premixed mid-value colour.",
          "Paint one shape on dry paper and let it dry.",
        ],
        ["Baseline hard-edge shape painted", "Boundary checked after drying"],
        "Look for a relatively abrupt value transition.",
        "Repeatedly touching a drying boundary can create an accidental line or disturbed texture.",
      ),
      step(
        "soft",
        "Make a gradual transition",
        7,
        "edges",
        "Use the same mixture on evenly damp paper for the second shape. Alternatively, on a fresh test, touch one still-wet boundary with a clean damp brush. These are future practice methods, not methods inferred from someone else's painting. More water can travel back into a drying passage and make a bloom.",
        [
          "Test surface moisture before painting.",
          "Paint a similar-sized shape.",
          "Compare after both tests dry; record any uncontrolled spread.",
        ],
        [
          "Soft-edge comparison made",
          "Moisture condition noted",
          "Dry transitions compared",
        ],
        "The edge may spread and change apparent value. Note that limitation rather than pretending the comparison is perfectly controlled.",
        "A dripping brush can push pigment away instead of gently joining the transition.",
      ),
      step(
        "lost",
        "Lose an interval, keep the form",
        10,
        "edges",
        "Place a similar-value neighbouring passage beside part of a third shape, allowing the two to meet. Aim for a short boundary to become difficult to distinguish while the rest of the shape still reads. Then make a tiny application with one selected sharper edge and one quieter interval.",
        [
          "Match neighbouring values approximately on scrap first.",
          "Join only a portion of the boundary.",
          "Apply the relationship to a leaf pair, hill or abstract mass.",
        ],
        [
          "One merging interval tested",
          "A small application completed",
          "The purpose of the sharper interval identified",
        ],
        "Does the form still read without every contour being stated?",
        "A lost boundary needs adjoining relationships; rubbing out a contour is not the only route.",
      ),
      step(
        "reflect",
        "Choose edges deliberately",
        5,
        "edges",
        "Compare separation and connection in the dry studies. You are building a vocabulary of choices. Your selected style can influence which boundary relationships you practise next, while leaving other choices available.",
        [
          "Select one useful pairing of sharper and quieter edges.",
          "Describe where you would try it in another subject.",
        ],
        ["Dry studies compared", "A transferable edge decision named"],
        "Can you connect the boundary treatment with its intended visual effect?",
        "Do not sharpen every boundary to make a painting feel more finished.",
      ),
    ],
  }),
  lesson({
    id: "observed-structure",
    moduleId: "drawing",
    title: "Observe shapes & perspective",
    description:
      "Check a few visible relationships before drawing every architectural line.",
    difficulty: "developing",
    skillIds: ["drawing", "perspective"],
    prerequisiteSkillIds: [],
    instructionMinutes: 5,
    practiceMinutes: 15,
    materials: [
      "Pencil and paper",
      "A box or a simple building viewed from a fixed position",
    ],
    objectives: [
      "Compare large shape proportions",
      "Observe relative slopes from a fixed viewpoint",
      "Distinguish a structural check from an imposed realistic style",
    ],
    why: "Perspective is a way to understand spatial relationships, not a requirement that all art look photographic. A fixed-viewpoint comparison can expose an unintended alignment while leaving expressive distortion as a valid choice.",
    exercise: {
      target: "Two small line studies of one box or building corner.",
      technique: "Proportion comparison and observing receding edges.",
      variable:
        "Change only the observed receding-edge slopes in the second study.",
      constants: [
        "Same subject and viewpoint",
        "Same frame and approximate overall size",
        "No added tonal or colour detail",
      ],
      comparison:
        "Compare which arrangement describes the planes you observed. You may retain a distortion intentionally if you can explain the choice.",
      success: [
        "Large width/height relationship compared",
        "Two receding slopes observed rather than assumed",
        "One justified structural or expressive decision",
      ],
      recovery:
        "If the subject is too complex, use a box with three visible planes. Keep your head position steady and compare a single pair of edges.",
      shortVersion:
        "In 10–15 minutes, compare one pair of receding edges. Complete the second drawing in another session if needed.",
      extension:
        "Try a new viewpoint without reusing the first viewpoint's slopes. Compare how the same object changes.",
    },
    subjectTags: ["urban", "still-life", "boats"],
    styleTags: ["urban", "botanical", "expressive"],
    reflectionPrompt:
      "Which relationship did observation change? Was a remaining distortion intentional or something to revisit?",
    steps: [
      step(
        "look",
        "Compare the envelope",
        3,
        "drawing",
        "Look at the overall width and height before naming doors, roofs or windows. Negative shapes between objects can help check placement. This lesson uses your own observed subject; it does not claim exact likeness without a reference.",
        [
          "Choose a simple corner or box.",
          "Keep one viewpoint and outline its overall envelope.",
        ],
        [
          "Subject and fixed viewpoint selected",
          "Overall width and height compared",
        ],
        "Is the large envelope consistent with what you observe?",
        "Drawing an imagined box symbol can replace observation of the actual view.",
      ),
      step(
        "first",
        "Record the first reading",
        5,
        "drawing",
        "Draw a few major edges. Look at their slopes relative to horizontal and vertical. In a conventional linear-perspective description, parallel edges in the same spatial direction may converge toward a shared vanishing point, possibly far outside the page; different directions need not share it.",
        [
          "Draw only the largest planes.",
          "Compare the direction of two edges that recede in the same spatial direction.",
        ],
        ["First simple line study made", "One comparable edge pair identified"],
        "Which edges describe the same direction in space, and which do not?",
        "Do not force all diagonals toward one point or assume a horizon without evidence.",
      ),
      step(
        "compare",
        "Test one structural change",
        8,
        "drawing",
        "Make a second study of the same framing and size. Change only the slopes you have re-observed. Keep detail out. If you intend expressive distortion, describe what the altered relationship communicates instead of treating realism as the only success criterion.",
        [
          "Recheck the selected slopes against the subject.",
          "Draw the second version with that one change.",
          "Compare the plane relationships and choose a purposeful version.",
        ],
        [
          "Second study completed",
          "One changed relationship isolated",
          "A structural or expressive choice explained",
        ],
        "Does the change clarify the observed form or better support your expressive aim?",
        "Changing proportions, crop and slopes simultaneously prevents a useful comparison.",
      ),
      step(
        "reflect",
        "Carry the check forward",
        4,
        "drawing",
        "A quick structural study can guide urban marks, leaf proportions or an abstract arrangement. It need not become an elaborate underdrawing. Observation supplies options; intention guides which option you use.",
        [
          "Name one assumption you replaced with observation.",
          "Choose one check to use before your next painting.",
        ],
        ["An observation recorded", "A next-use decision selected"],
        "Can this check transfer to a new subject?",
        "Completion of this short exercise is not proof of perspective proficiency.",
      ),
    ],
  }),
];
export const project: GuidedProject = {
  id: "quiet-landscape",
  kind: "project",
  moduleId: "projects",
  title: "A quiet landscape",
  description:
    "A small atmospheric study: three masses, a soft distance and one intentional landing.",
  objectives: [
    "Use a value plan to guide a small painting",
    "Separate distant and near masses through selected relationships",
    "Decide when to stop",
  ],
  difficulty: "developing",
  skillIds: ["project-foundations", "atmosphere"],
  prerequisiteSkillIds: ["water-control", "values", "edges"],
  instructionMinutes: 10,
  practiceMinutes: 50,
  materials: [
    "Postcard-sized watercolour paper",
    "One round brush",
    "One blue or neutral pigment; an optional familiar earth colour",
    "Pencil, palette, clean water and cloth",
  ],
  why: "A small invented landscape lets you test value and edge decisions without needing a photograph or copying an artist's work. The example is an original diagram, not a promised painted result. Use your own shape variations and palette.",
  exercise: {
    target:
      "One postcard-sized landscape with sky, distant hill and near bank.",
    technique: "Value planning, controlled washes and selected edges.",
    variable:
      "For an optional second study, change only the edge of the distant hill.",
    constants: [
      "Same three-mass design",
      "Same small palette and value plan",
      "Similar paper and size",
    ],
    comparison:
      "Compare the depth suggested by the two hill boundaries. Do not change colour, crop and contrast at the same time.",
    success: [
      "A visible light/middle/dark plan",
      "Distance and foreground have intentionally different relationships",
      "One chosen landing without detailing every area",
      "A reflection based on dry results",
    ],
    recovery:
      "If masses merge unintentionally, let the work dry and reassess. Test any change on scrap. Starting a second small study is often safer than repeatedly repairing a drying wash.",
    shortVersion:
      "Work in short 10–15 minute sessions, pausing at step boundaries. Allow about 60 active minutes in total; drying time is additional and depends on conditions.",
    extension:
      "Apply the same value and edge plan to a boat, street or abstract arrangement; change the subject without copying this silhouette.",
  },
  subjectTags: ["landscape", "mountains", "water"],
  styleTags: ["atmospheric", "expressive"],
  resourceIds: [],
  version: 1,
  editorialStatus: "internally-reviewed",
  availability: "available",
  reflectionPrompt:
    "Which planned relationship survived drying? Name one choice to preserve and one variable to test in a separate study.",
  steps: [
    step(
      "intention",
      "Choose a quiet intention",
      4,
      "landscape",
      "Imagine a broad sky, one distant hill and a near bank. Choose a calm or more dramatic intention; the demonstration suggests calm, but that is an option rather than a universal standard.",
      [
        "Prepare postcard-sized paper.",
        "Choose a limited palette you already know.",
        "State your intention in the optional note.",
      ],
      ["Paper and materials ready", "An intention chosen"],
      "How much open sky or water will support that intention?",
      "Do not copy every contour in the diagram or assume a specific pigment is essential.",
    ),
    step(
      "values",
      "Plan three major values",
      7,
      "values",
      "Make a tiny pencil plan beside the painting. Decide where the light paper remains, which mass is middle value and where a limited dark can belong. A misty plan can compress the whole range; the darkest area need not be black.",
      [
        "Draw sky, hill and bank as three simple masses.",
        "Choose a small landing and one quieter interval.",
        "View the thumbnail from arm's length.",
      ],
      [
        "A three-mass thumbnail made",
        "A light area reserved",
        "Landing and quieter interval chosen",
      ],
      "Does the large organisation serve your intention before colour is added?",
      "A dark accent added by habit can overpower a quiet intention.",
    ),
    step(
      "wash-plan",
      "Test the wash and boundary",
      6,
      "water",
      "Premix enough pale colour for the sky and test the intended hill value on scrap. Decide where damp-paper diffusion is useful and where you want a dry-paper edge. Watch sheen rather than a clock.",
      [
        "Test dilution and loading on scrap.",
        "Choose a pause for drying before a later layer.",
        "Keep the paper evenly damp only where you want diffusion.",
      ],
      ["Dry value tested", "Moisture plan chosen"],
      "Is the pale mixture light enough after drying?",
      "Wet paper everywhere makes it harder to choose which edges remain distinct.",
    ),
    step(
      "sky",
      "Lay a light sky passage",
      8,
      "landscape",
      "Apply the pale mixture across the sky area with a consistent load. Leave intended paper lights. A little variation can be appropriate; avoid repeatedly chasing an even finish as the passage dries.",
      [
        "Work across the small sky passage.",
        "Remove an accidental standing bead with an unloaded brush if needed.",
        "Pause before the surface becomes patchily dry.",
      ],
      ["Light sky passage laid", "Surface left to settle"],
      "Does the broad light mass remain simple?",
      "Adding water late can create a bloom. That may be expressive, but it changes this controlled study.",
    ),
    step(
      "hill",
      "Place the distant mass",
      8,
      "landscape",
      "Use the tested middle mixture for a simple distant hill. For this atmospheric option, let part of its boundary soften into a suitable damp passage. If the sky has dried, use a fresh scrap test rather than scrubbing it back into submission.",
      [
        "Check the current surface condition.",
        "Place one connected hill mass.",
        "Keep the outline simple and pause for drying.",
      ],
      [
        "Surface condition checked",
        "Distant mass painted",
        "An edge relationship observed",
      ],
      "Does the hill separate enough to read without taking all the attention?",
      "Distance is not always lighter in nature; you are selecting a relationship for this study.",
    ),
    step(
      "bank",
      "Connect a near mass",
      10,
      "landscape",
      "When the relevant passage is dry enough for the boundary you want, place a near bank using the planned darker mixture. Leave some intervals quiet. A nearer mass can be differentiated through value, edge or shape; do not increase all of them automatically.",
      [
        "Recheck the value plan.",
        "Paint one connected near mass.",
        "Select one boundary for clearer separation and leave another less explicit.",
      ],
      [
        "Near mass connected",
        "One clearer boundary selected",
        "A quieter interval retained",
      ],
      "Is the relationship between hill and bank readable?",
      "Small disconnected dark marks can fragment a simple plan.",
    ),
    step(
      "finish",
      "Make one finishing decision",
      10,
      "edges",
      "Look at the dry painting. Ask whether the intended landing already reads. If it does, stop. If not, test one small value or edge adjustment on scrap first. More detail is not automatically more resolved.",
      [
        "View from arm's length.",
        "Choose to stop, or test one small conditional change on scrap.",
        "Preserve the relationships that already work.",
      ],
      ["Dry painting reviewed", "A deliberate stop or tested change chosen"],
      "Can you explain why your finishing choice helps the stated intention?",
      "Do not try to repair every small variation or scrape a fragile wet surface.",
    ),
    step(
      "reflect",
      "Keep the lesson, not just the result",
      7,
      "landscape",
      "Your notes describe a self-reported experiment, not a score. Keep the thumbnail and painting together. A separate second study can test one boundary treatment without risking the finished work.",
      [
        "Compare the dry painting with the thumbnail.",
        "Name one effective relationship and one future test.",
        "Record a reflection to complete the project.",
      ],
      ["Plan and painting compared", "One future controlled study identified"],
      "What principle can you use in a different subject?",
      "A finished project is not proof of mastery or measured learning gain.",
    ),
  ],
};
export const items: LearningItem[] = [...lessons, project];
export const itemById = (id: string) => items.find((item) => item.id === id);
