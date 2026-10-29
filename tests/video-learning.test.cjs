const test = require('node:test'), assert = require('node:assert/strict');
const load = require('./helpers/learning-loader.cjs');
const { previewCandidates: candidates } = load('learning/videoPreviewCatalogue.ts');
const { defaultPreviewWindow, previewWindowSummary, previewLearningContext, previewSessionPlan, orderVideoPreviews, videoLearningGuides: guides } = load('learning/videoLearning.ts');
const { previewUrls } = load('learning/videoPreview.ts');
const { defaultProfile } = load('learning/catalogue.ts');
const { mediaResources, publicationErrors } = load('learning/media.ts');
const candidate = id => candidates.find(c => c.id === id);
const settings = { mode: 'default', language: 'default' };

test('every preserved candidate has original, actionable learning guidance', () => {
  assert.deepEqual(Object.keys(guides).sort(), candidates.map(c => c.id).sort());
  for (const c of candidates) {
    const g = guides[c.id];
    assert(g.title.length > 12 && g.title.length < 80, c.id);
    assert(g.objectives.length >= 2 && g.objectives.length <= 3);
    assert(g.prompts.length >= 2 && g.prompts.length <= 3);
    assert(g.prompts.every(p => p.endsWith('?')));
    assert(g.exercise.action.length > 80 && g.exercise.success.length > 50);
    assert(g.exercise.minutes >= 5 && g.exercise.minutes <= 15);
    assert(c.advancedOnly ? g.level === 'Intermediate / advanced' : g.level !== 'Intermediate / advanced');
    assert(['water','values','edges','drawing','landscape'].includes(g.visual));
  }
});
for (const [id, expected] of [
  ['steve-flat-wash', 'owner-proposal'], ['paul-values', 'owner-proposal'],
  ['louise-blend', 'owner-start'], ['cafe-cloud-tips', 'cafe-cloud-tips-publisher-3'],
  ['louise-clouds', 'louise-clouds-publisher-1'],
]) test('honest useful default: ' + id, () => {
  const c = candidate(id), before = JSON.stringify(c);
  assert.equal(defaultPreviewWindow(c), expected);
  const w = c.windows.find(w => w.id === expected);
  const urls = previewUrls(c, expected, settings, 'http://localhost:8141');
  assert.equal(urls.cue.startSeconds, w.start);
  assert.equal(urls.cue.endSeconds, w.end);
  assert.match(previewWindowSummary(c, expected), /unverified/);
  assert.equal(JSON.stringify(c), before);
});
for (const c of candidates.filter(c => !c.windows.length)) test('no invented time for ' + c.id, () => {
  assert.equal(defaultPreviewWindow(c), 'original');
  assert.match(previewWindowSummary(c, 'original'), /timestamps pending/);
  assert.equal(previewUrls(c, 'original', settings).cue.endSeconds, undefined);
});
for (const [lesson, step, expected] of [
  ['water-brush','moisture','louise-blend-publisher-1'],
  ['edge-families','hard','louise-blend-publisher-2'],
  ['edge-families','soft','louise-blend-publisher-5'],
]) test('Louise chapter matches actual mapped step ' + step, () => {
  assert.equal(defaultPreviewWindow(candidate('louise-blend'), {lesson, step}), expected);
});
test('unrelated/invalid step never selects a misleading specific chapter', () => {
  for (const context of [{lesson:'three-values',step:'hard'}, {lesson:'invented',step:'soft'}, {lesson:'edge-families',step:'missing'}])
    assert.equal(defaultPreviewWindow(candidate('louise-blend'), context), 'owner-start');
});
test('chapter selection is not based on array position or fabricated references', () => {
  const c = structuredClone(candidate('louise-blend')); c.windows.reverse();
  assert.equal(defaultPreviewWindow(c, {lesson:'edge-families',step:'hard'}), 'louise-blend-publisher-2');
  c.windows = c.windows.filter(w => w.id !== 'louise-blend-publisher-2');
  assert.equal(defaultPreviewWindow(c, {lesson:'edge-families',step:'hard'}), 'owner-start');
});
test('Café default avoids BOTH conflicting 138-second windows while preserving them', () => {
  const c = candidate('cafe-cloud-tips');
  assert.equal(defaultPreviewWindow(c, {lesson:'edge-families',step:'soft'}), 'cafe-cloud-tips-publisher-5');
  assert.equal(defaultPreviewWindow(c, {lesson:'quiet-landscape',step:'sky'}), 'cafe-cloud-tips-publisher-3');
  for (const context of [{}, {lesson:'quiet-landscape',step:'sky'}, {lesson:'edge-families',step:'soft'}])
    assert.notEqual(c.windows.find(w => w.id === defaultPreviewWindow(c, context)).start, 138);
  assert.equal(c.windows.filter(w => w.start === 138).length, 2);
  const allConflicted = {...c, windows:c.windows.filter(w => w.start === 138)};
  assert.equal(defaultPreviewWindow(allConflicted), 'original');
});
test('owner window survives both generic and unrelated context; end remains absolute', () => {
  const c = candidate('steve-flat-wash');
  for (const context of [{},{lesson:'water-brush',step:'dilution'},{lesson:'three-values',step:'first'}]) {
    const u = previewUrls(c, defaultPreviewWindow(c,context), settings);
    assert.equal(u.cue.startSeconds, 47); assert.equal(u.cue.endSeconds, 702);
    assert.equal(new URL(u.embed).searchParams.get('end'), '702');
  }
});
test('short sessions never pretend a long viewing plus exercise fits into fifteen minutes', () => {
  assert.match(previewSessionPlan(candidate('paul-values'), 'owner-proposal', 15), /14 minutes suggested viewing \+ 10 minutes practice/);
  assert.match(previewSessionPlan(candidate('paul-values'), 'owner-proposal', 15), /separate sessions/);
  assert(!previewSessionPlan(candidate('paul-values'), 'owner-proposal', 30).includes('separate sessions'));
  assert.match(previewSessionPlan(candidate('louise-blend'), 'owner-start'), /Viewing time is unconfirmed/);
});
test('contextual teaching link returns to an actual lesson and actual mapped step', () => {
  const c = candidate('paul-values');
  const out = previewLearningContext(c, {lesson:'three-values',step:'first'}, defaultProfile);
  assert.equal(out.lessonId,'three-values'); assert.equal(out.stepId,'first');
  assert.match(out.reason, /current study/);
  const fallback = previewLearningContext(c, {lesson:'water-brush',step:'soft'}, null);
  assert.equal(fallback.lessonId,'three-values'); assert.match(fallback.reason,/Connects to/);
});
test('beginner gets foundation-first advice for optional Javid, without hiding or promoting candidates', () => {
  const c = candidate('javid-cityscape');
  assert.match(previewLearningContext(c, {}, defaultProfile).reason,/foundation lesson first/);
  assert(!previewLearningContext(c, {}, {...defaultProfile,experience:'advanced'}).reason.includes('foundation lesson first'));
  const ordered=orderVideoPreviews(candidates, {}, defaultProfile);
  assert.equal(ordered.length,17); assert.equal(ordered.filter(c=>c.advancedOnly).length,3);
  assert(ordered.findIndex(c=>c.advancedOnly)>ordered.findIndex(c=>c.id==='steve-flat-wash'));
});
test('exact curriculum objective outranks style interest or screening status', () => {
  const ordered=orderVideoPreviews(candidates, {lesson:'observed-structure',step:'first'}, {...defaultProfile,primaryStyle:'atmospheric'});
  assert.equal(ordered[0].id,'tim-perspective');
  assert.deepEqual(new Set(ordered.map(c=>c.id)),new Set(candidates.map(c=>c.id)));
});
test('goal changes preview ordering while all 17 remain available', () => {
  const beginner=orderVideoPreviews(candidates, {}, defaultProfile);
  const urban=orderVideoPreviews(candidates, {}, {...defaultProfile,goal:'urban',primaryStyle:'urban',experience:'intermediate'});
  assert.equal(urban[0].id,'tim-perspective');
  assert.notEqual(beginner[0].id,urban[0].id);
  assert.equal(urban.length,17);
  const context=orderVideoPreviews(candidates,{lesson:'three-values',step:'look'},{...defaultProfile,goal:'urban'});
  assert.equal(context[0].id,'paul-values');
});
test('new guidance and defaults never confer media approval or mutate owner evidence', () => {
  assert.equal(mediaResources.length,0);
  for(const c of candidates){assert(publicationErrors(c).length); assert(!('verified' in guides[c.id]));}
  assert.match(guides['louise-soft-edges'].exercise.success,/Do not label a visible soft boundary a lost contour/);
});
