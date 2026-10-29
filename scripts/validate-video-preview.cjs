// Validates only the deliberately unapproved public preview, not lesson publication.
const load = require("../tests/helpers/learning-loader.cjs");
const { previewCandidates } = load("learning/videoPreviewCatalogue.ts");
const { previewCatalogueErrors } = load("learning/videoPreview.ts");
const { videoLearningGuides, defaultPreviewWindow } = load("learning/videoLearning.ts");
const errors = previewCatalogueErrors(previewCandidates);
if (previewCandidates.length !== 17) errors.push("Expected all 17 owner-selected candidates");
if (previewCandidates.filter(c => c.advancedOnly).length !== 3) errors.push("Expected three optional advanced Javid candidates");
if (Object.keys(videoLearningGuides).length !== previewCandidates.length) errors.push("Learning guides must cover exactly the preserved candidates");
for (const c of previewCandidates) {
  const g = videoLearningGuides[c.id], windowId = defaultPreviewWindow(c);
  if (!g || g.objectives.length < 2 || g.prompts.length < 2 || !g.exercise.action || !g.exercise.success) errors.push(`Incomplete original guidance: ${c.id}`);
  if (windowId !== "original" && !c.windows.some(w => w.id === windowId)) errors.push(`Unknown proposed default: ${c.id}`);
}
console.log(JSON.stringify({ contract: errors.length ? "FAIL" : "PASS", previewCandidates: previewCandidates.length, learningGuides: Object.keys(videoLearningGuides).length, ownerScreenings: previewCandidates.filter(c => c.ownerScreened).length, proposedWindows: previewCandidates.reduce((n, c) => n + c.windows.length, 0), approvedLessonResources: load("learning/media.ts").mediaResources.length, errors }, null, 2));
if (errors.length) process.exitCode = 1;
