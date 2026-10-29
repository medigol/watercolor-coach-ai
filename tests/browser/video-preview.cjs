// Actual Expo export with synthetic auth and official API responses.
// Never real video inspection, production authentication or a paid request.
const { chromium } = require('playwright'), fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const base = process.argv[2] || 'http://127.0.0.1:8141/watercolor-coach-ai';
const out = process.argv[3] || '/tmp/watercolour-video-ux/after';
fs.mkdirSync(out, { recursive: true });
const load = require('../helpers/learning-loader.cjs');
const { previewCandidates } = load('learning/videoPreviewCatalogue.ts');
const { videoLearningGuides: guides, defaultPreviewWindow } = load('learning/videoLearning.ts');
const uid = '10000000-0000-4000-8000-000000000001', learningKey = 'watercolor:learning:v1:' + uid;
const reviewKey = 'watercolor:video-preview:v1:' + uid + ':steve-flat-wash';
const user = { id: uid, aud: 'authenticated', role: 'authenticated', email: 'preview-test@example.invalid', email_confirmed_at: new Date().toISOString(), app_metadata: { provider: 'email', providers: ['email'] }, user_metadata: {}, created_at: new Date().toISOString() };
const token = [{ alg: 'HS256', typ: 'JWT' }, { sub: uid, aud: 'authenticated', role: 'authenticated', exp: Math.floor(Date.now() / 1000) + 3600 }, 'test-signature'].map((v, i) => i < 2 ? Buffer.from(JSON.stringify(v)).toString('base64url') : v).join('.');
(async () => {
  const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', args: ['--no-sandbox'] });
  const context = await browser.newContext({ viewport: { width: 390, height: 900 }, acceptDownloads: true });
  const page = await context.newPage(); page.setDefaultTimeout(15000);
  const errors = [], unexpected = [], external = [], matrix = []; let failAPI = false;
  page.on('pageerror', e => errors.push(e.message));
  await page.addInitScript(() => {
    if (location.hostname === '127.0.0.1') { window.QA_OPENED = []; window.open = url => { window.QA_OPENED.push(String(url)); return null; }; }
  });
  await page.route('**/*', async route => {
    const req = route.request(), u = new URL(req.url());
    if (u.origin === new URL(base).origin) return route.continue();
    const reply = v => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(v) });
    if (u.hostname === 'watercolor-test.supabase.co') {
      if (u.pathname.endsWith('/token')) return reply({ access_token: token, refresh_token: 'test-refresh', expires_in: 3600, token_type: 'bearer', user });
      if (u.pathname.endsWith('/user')) return reply(user);
      if (u.pathname.endsWith('/profiles')) return reply({ display_name: 'Preview learner' });
      if (u.pathname.endsWith('/artworks') && req.method() === 'GET') return reply([]);
    }
    if (u.hostname === 'www.youtube.com' && u.pathname === '/iframe_api') {
      external.push(u.href);
      return failAPI ? route.abort() : route.fulfill({ contentType: 'application/javascript', body: require('../helpers/mock-youtube.cjs') });
    }
    if (u.hostname === 'www.youtube-nocookie.com' && u.pathname.startsWith('/embed/')) {
      external.push(u.href);
      return route.fulfill({ contentType: 'text/html', body: '<!doctype html><html><head><meta charset="utf-8"></head><body style="background:#253c3c;color:white;font:18px sans-serif">SIMULATED OFFICIAL PLAYER — NO REAL VIDEO INSPECTED</body></html>' });
    }
    unexpected.push(req.method() + ' ' + u.href); return route.abort();
  });
  const b = name => page.getByRole('button', { name, exact: true });
  const h = name => page.getByRole('heading', { name, exact: true });
  const click = async name => { const target = b(name); await target.scrollIntoViewIfNeeded(); await page.waitForTimeout(180); await target.click(); };
  const shot = async name => page.screenshot({ path: path.join(out, name + '.png'), fullPage: false });
  const scenario = async (name, fn) => { await fn(); matrix.push({ name, status: 'PASS' }); console.log('PASS ' + name); };
  const visit = async (suffix = '/learn/videos') => { await page.goto(base + suffix); await h(suffix.includes('candidate=') && !suffix.includes('not-a-video') ? guides[new URL(base + suffix).searchParams.get('candidate')].title : 'Video studies').waitFor(); };
  const ready = async () => page.getByRole('status').filter({ hasText: 'Ready · use YouTube Play if needed.' }).waitFor();
  const watch = async () => { await page.getByTestId('watch-video-poster').scrollIntoViewIfNeeded(); await page.waitForTimeout(180); await page.getByTestId('watch-video-poster').click(); await ready(); };
  const cue = () => page.evaluate(() => window.YT_TEST.calls.filter(c => c[0] === 'cue').at(-1)[1]);
  const near = async locator => { const r = await locator.boundingBox(); assert(r && r.y < (await page.viewportSize()).height - 65 && r.y + r.height > 0, 'target in visible area'); };
  const options = async () => { if (await b('Video options').getAttribute('aria-expanded') !== 'true') await click('Video options'); };
  const owner = async () => { await click('Owner review mode'); await h('Owner review tools').waitFor(); };
  const review = async () => { await click('Record a private playback review'); await page.getByRole('textbox', { name: 'Observed start (seconds or mm:ss; leave unknown blank)', exact: true }).waitFor(); };

  await page.goto(base + '/learn/videos');
  await page.getByRole('textbox', { name: 'Email', exact: true }).fill(user.email);
  await page.locator('input[aria-label="Password"]:visible').last().fill('test-password-only');
  await click('Sign in'); await click('Learn watercolour'); await click('Video Library — Preview · 17 candidates'); await h('Video studies').waitFor();
  await scenario('All 17 candidates and all three Javid videos remain available with learning titles and levels', async () => {
    assert.equal(await page.getByTestId('preview-candidate-list').locator('[data-testid^="preview-candidate-"]').count(), 17);
    for (const c of previewCandidates) {
      await b('Watch ' + guides[c.id].title).waitFor();
      const text = await page.getByTestId('preview-candidate-' + c.id).innerText();
      assert(text.includes(c.creator)); assert(text.includes(guides[c.id].objectives[0]));
      if (c.advancedOnly) assert(text.toLowerCase().includes('intermediate / advanced'));
    }
    assert.equal(external.length, 0); assert.equal(await page.locator('iframe').count(), 0); await shot('01-library-mobile');
  });
  await scenario('Library works at seven widths with keyboard-reachable 44px Watch actions and no overflow', async () => {
    for (const width of [320,375,390,430,768,1024,1440]) {
      await page.setViewportSize({ width, height: 950 }); await page.waitForTimeout(100);
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
      const button = b('Watch ' + guides['steve-flat-wash'].title); await button.scrollIntoViewIfNeeded(); await button.focus();
      assert(await button.evaluate(e => e === document.activeElement)); assert((await button.boundingBox()).height >= 44);
      if (width === 1440) { await h('Video studies').scrollIntoViewIfNeeded(); await shot('02-library-desktop'); }
    }
  });
  await scenario('A single library Watch action loads the selected default, without a redundant Load action', async () => {
    await page.setViewportSize({ width: 390, height: 844 });
    await click('Watch ' + guides['steve-flat-wash'].title); await ready();
    assert.equal(await page.locator('iframe').count(), 1);
    assert.equal(await b('Load YouTube preview').count(), 0);
    assert.equal((await cue()).startSeconds, 47); assert.equal((await cue()).endSeconds, 702);
    assert(await page.evaluate(() => window.YT_TEST.calls.some(c => c[0] === 'play')));
    // A play request alone does not mean playback actually began.
    assert.equal(await page.getByRole('status').filter({ hasText: 'YouTube reports playback.' }).count(), 0);
    await page.locator('iframe').scrollIntoViewIfNeeded(); await shot('03-one-action-player-390');
  });
  await scenario('Replay and endpoint enforcement use absolute proposed boundaries, never lesson completion', async () => {
    await click('Replay demonstration');
    const replay = await page.evaluate(() => window.YT_TEST.calls.filter(c => c[0] === 'load').at(-1)[1]);
    assert.equal(replay.startSeconds, 47); assert.equal(replay.endSeconds, 702);
    await page.evaluate(() => window.YT_TEST.emit(1, 702));
    await page.getByRole('status').filter({ hasText: 'Viewing window finished.' }).waitFor();
    assert.equal(await page.evaluate(k => localStorage.getItem(k), learningKey), null);
  });
  await scenario('Return to practice pauses, removes the frame and focuses the visible physical exercise', async () => {
    await click('Return to practice'); await page.waitForTimeout(250);
    assert.equal(await page.locator('iframe').count(), 0);
    const exercise = page.getByTestId('video-practice'); await near(exercise);
    assert(await exercise.evaluate(e => e === document.activeElement));
    assert(await b('Continue lesson').isVisible()); await shot('04-return-to-practice');
  });
  await scenario('Deep link, reload and URL watch hints never auto-load; every candidate Watch uses its evidence-based default', async () => {
    for (const c of previewCandidates) {
      const before = external.length;
      await visit('/learn/videos?candidate=' + c.id + '&watch=1');
      assert.equal(external.length, before); assert.equal(await page.locator('iframe').count(), 0);
      const g = guides[c.id];
      await page.getByText(g.objectives[0], { exact: false }).waitFor();
      await page.getByText(g.prompts[0], { exact: false }).waitFor();
      await page.getByText(g.exercise.action, { exact: true }).waitFor();
      assert.equal(await b('Record a private playback review').count(), 0);
      await options(); await click('Watch full original on YouTube'); assert.equal(await page.evaluate(() => window.QA_OPENED.at(-1)), c.url);
      await watch();
      const actual = await cue(), defaultId = defaultPreviewWindow(c), w = c.windows.find(w => w.id === defaultId);
      assert.equal(actual.videoId, c.videoId); assert.equal(actual.startSeconds, w?.start ?? 0); assert.equal(actual.endSeconds, w?.end);
      const q = new URL(await page.locator('iframe').getAttribute('src')).searchParams;
      assert.equal(q.get('origin'), new URL(base).origin); assert.equal(q.get('autoplay'), '0'); assert.equal(q.get('cc_load_policy'), null);
      assert.equal(q.get('end'), w?.end === undefined ? null : String(w.end));
    }
  });
  await scenario('Watch and owner-mode navigation work by keyboard with accurate disclosure state', async () => {
    await visit('/learn/videos?candidate=steve-flat-wash');
    const poster=page.getByTestId('watch-video-poster'); await poster.focus(); await page.keyboard.press('Enter'); await ready();
    assert.equal(await page.locator('iframe').count(),1);
    await b('Owner review mode').focus(); await page.keyboard.press('Enter'); await h('Owner review tools').waitFor();
    await b('Owner caption preference test').focus(); await page.keyboard.press('Enter');
    assert.equal(await b('Owner caption preference test').getAttribute('aria-expanded'),'true');
    await b('Return to learner view').focus(); await page.keyboard.press('Enter');
    assert.equal(await page.getByTestId('owner-video-review').count(),0);
  });
  await scenario('Mapped lesson step chooses Louise’s relevant chapter rather than unrelated introduction', async () => {
    for (const [step, start, end] of [['hard',515,758],['soft',1132,1252]]) {
      await visit('/learn/videos?candidate=louise-blend&lesson=edge-families&step=' + step); await watch();
      assert.equal((await cue()).startSeconds, start); assert.equal((await cue()).endSeconds, end);
      await page.getByText('For your current study:', { exact: false }).waitFor();
    }
  });
  await scenario('Chapter switching, outside-window seeking and replay restore correct bounds on the same player', async () => {
    const count = await page.evaluate(() => window.YT_TEST.instances.length);
    await options(); await click('Choose another chapter');
    await click('Wet-on-dry demonstration — publisher hint: 8:35–12:38 · unverified');
    assert.equal(await page.evaluate(() => window.YT_TEST.instances.length), count);
    assert.equal((await cue()).startSeconds, 515); assert.equal((await cue()).endSeconds, 758);
    await page.evaluate(() => window.YT_TEST.emit(1, 100));
    await page.getByRole('status').filter({ hasText: 'outside this viewing window' }).waitFor();
    await click('Replay demonstration');
    assert.equal(await page.evaluate(() => window.YT_TEST.calls.filter(c => c[0] === 'load').at(-1)[1].endSeconds), 758);
    await click('Full video · timestamps pending review'); await ready();
    assert.equal((await cue()).startSeconds, 0); assert(!('endSeconds' in await cue()));
    await click('Replay demonstration'); assert(!('endSeconds' in await page.evaluate(() => window.YT_TEST.calls.filter(c => c[0] === 'load').at(-1)[1])));
  });
  await scenario('Owner review is a separate explicit mode; learner view contains no timestamps form, export or caption settings', async () => {
    await visit('/learn/videos?candidate=steve-flat-wash');
    assert.equal(await page.getByTestId('owner-video-review').count(), 0);
    assert.equal(await b('Export my video reviews as JSON').count(), 0); assert.equal(await b('Owner caption preference test').count(), 0);
    await owner(); await page.getByTestId('owner-video-review').waitFor(); await review();
    assert.equal(await page.getByRole('textbox', { name: 'Observed start (seconds or mm:ss; leave unknown blank)', exact: true }).inputValue(), '');
    await click('Return to learner view'); assert.equal(await page.getByRole('textbox').count(), 0);
    assert.equal(await b('Owner caption preference test').count(), 0);
  });
  await scenario('Caption preference requests remain in owner mode and preserve selected boundaries', async () => {
    await owner(); await watch();
    await click('Owner caption preference test');
    assert.equal(await b('Owner caption preference test').getAttribute('aria-expanded'), 'true');
    await click('Prefer captions when available'); await click('Persian preference');
    const count = await page.evaluate(() => window.YT_TEST.instances.length);
    await click('Apply caption preference');
    await page.waitForFunction(n => window.YT_TEST.instances.length === n + 1, count); await ready();
    const q = new URL(await page.locator('iframe').getAttribute('src')).searchParams;
    assert.equal(q.get('cc_load_policy'), '1'); assert.equal(q.get('cc_lang_pref'), 'fa'); assert.equal(q.get('start'), '47'); assert.equal(q.get('end'), '702');
    await page.getByText('These request a preference, not an available caption track.', { exact: false }).waitFor();
  });
  await scenario('Private review saves and exports explicit observations; never grants approval or leaks account identity', async () => {
    await review(); await click('I saw real playback');
    await page.getByRole('textbox', { name: 'Observed start (seconds or mm:ss; leave unknown blank)', exact: true }).fill('47');
    await page.getByRole('textbox', { name: 'Corrections, title/channel checks and playback observations', exact: true }).fill('SYNTHETIC browser wiring check only; not real viewing.');
    await click('Save private preview review'); await page.getByRole('status').filter({ hasText: 'Review saved in this browser' }).waitFor();
    const pending = page.waitForEvent('download'); await click('Export my video reviews as JSON');
    const exported = JSON.parse(fs.readFileSync(await (await pending).path(), 'utf8'));
    assert.equal(exported.productionApproved, false); assert.equal(exported.ownerExactSegmentApproval, false); assert(!('accountId' in exported));
    assert.equal(exported.requestedWindow.start, 47); assert.equal(exported.requestedWindow.end, 702);
    assert.equal(exported.reviews.find(r => r.candidateId === 'steve-flat-wash').observedEnd, '');
    await page.reload(); await h(guides['steve-flat-wash'].title).waitFor(); await review();
    assert.equal(await page.getByRole('textbox', { name: 'Observed start (seconds or mm:ss; leave unknown blank)', exact: true }).inputValue(), '47');
    assert.equal(await page.locator('iframe').count(), 0);
    await shot('05-owner-review');
  });
  await scenario('Seven responsive player widths meet 200×200, and mobile first viewport exposes Watch with no technical form', async () => {
    await visit('/learn/videos?candidate=steve-flat-wash');
    for (const width of [320,375,390,430,768,1024,1440]) {
      await page.setViewportSize({ width, height: 844 }); await page.waitForTimeout(100);
      await h(guides['steve-flat-wash'].title).scrollIntoViewIfNeeded();
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
      if ([375,390].includes(width)) {
        await page.getByRole('button', { name: 'Learn home', exact: true }).scrollIntoViewIfNeeded();
        await near(page.getByTestId('watch-video-poster')); await shot('06-lesson-before-watch-' + width);
      }
    }
    await watch();
    for (const width of [320,375,390,430,768,1024,1440]) {
      await page.setViewportSize({ width, height: 844 }); await page.waitForTimeout(100);
      const r = await page.locator('iframe').boundingBox(); assert(r.width >= 200 && r.height >= 200, 'minimum size ' + width);
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
      if ([375,390,1440].includes(width)) { await page.locator('iframe').scrollIntoViewIfNeeded(); await shot('07-player-' + width); }
    }
  });
  await scenario('Short viewport, keyboard focus and enlarged-text reflow retain reachable practice and player actions', async () => {
    await page.setViewportSize({ width: 375, height: 568 });
    await b('Replay demonstration').scrollIntoViewIfNeeded(); await b('Replay demonstration').focus();
    assert(await b('Replay demonstration').evaluate(e => e === document.activeElement));
    await shot('08-short-mobile');
    await page.setViewportSize({ width: 320, height: 844 });
    await page.addStyleTag({ content: '[data-testid="learning-page"] [dir="auto"] { font-size: 200% !important; line-height: 1.5 !important; }' });
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
    await b('Continue lesson').scrollIntoViewIfNeeded(); await b('Continue lesson').focus(); await near(b('Continue lesson'));
  });
  await scenario('Topic and experience filters retain all candidates and avoid unrelated step claims', async () => {
    await visit(); await click('Find a demonstration'); await click('Three-value planning');
    const shown = await page.getByTestId('preview-candidate-list').locator('[data-testid^="preview-candidate-"]').count();
    assert.equal(shown, previewCandidates.filter(c => c.related.some(r => r.lessonId === 'three-values')).length);
    await click('Show all 17 preview videos'); await click('Optional advanced studies');
    assert.equal(await page.getByTestId('preview-candidate-list').locator('[data-testid^="preview-candidate-"]').count(), 3);
    await click('All levels'); assert.equal(await page.getByTestId('preview-candidate-list').locator('[data-testid^="preview-candidate-"]').count(), 17);
  });
  await scenario('Café conflict and Louise start-only stay unverified; unseen content is labelled suggested focus', async () => {
    await visit('/learn/videos?candidate=cafe-cloud-tips'); await watch(); assert.equal((await cue()).startSeconds, 439);
    await options(); await click('Choose another chapter'); await page.getByText('two conflicting proposed endpoints', { exact: false }).waitFor();
    await owner(); await page.getByText('138–162 seconds in the CSV versus 138–298 seconds', { exact: false }).waitFor();
    await visit('/learn/videos?candidate=louise-blend'); await watch(); assert.equal((await cue()).startSeconds, 90); assert(!('endSeconds' in await cue()));
    await visit('/learn/videos?candidate=javid-atmosphere'); await page.getByText('Suggested viewing focus, not a report of inspected footage.', { exact: false }).waitFor();
  });
  await scenario('Provider restriction and failed API connection preserve written practice and offer retry or original', async () => {
    await visit('/learn/videos?candidate=steve-flat-wash'); await watch(); await page.evaluate(() => window.YT_TEST.error(101));
    await page.getByRole('status').filter({ hasText: 'restricted embedding' }).waitFor(); assert.equal(await page.locator('iframe').count(), 0);
    await b('Continue lesson').waitFor(); await b('Try YouTube again').waitFor(); await options(); await click('Watch full original on YouTube');
    assert.equal(await page.evaluate(() => window.QA_OPENED.at(-1)), 'https://www.youtube.com/watch?v=alq0YqX86gs');
    failAPI = true; await visit('/learn/videos?candidate=steve-flat-wash');
    await page.getByTestId('watch-video-poster').click(); await page.getByRole('status').filter({ hasText: 'YouTube could not connect' }).waitFor();
    assert.equal(await page.locator('iframe').count(), 0); await b('Continue lesson').waitFor(); await shot('09-player-error'); failAPI = false;
  });
  await scenario('Continue lesson resumes existing step and checklist, with no learning writes from video playback', async () => {
    const { emptyProgress, newEntry } = load('learning/progress.ts');
    const { itemById } = load('learning/content.ts'); const state = emptyProgress(); const item = itemById('water-brush');
    const entry = newEntry(item); entry.stepId = 'dilution'; entry.notes.dilution = 'Preserved painting note';
    state.entries[item.id] = entry; state.currentItemId = item.id;
    const snapshot = JSON.stringify(state);
    await page.evaluate(([k,v]) => localStorage.setItem(k,v), [learningKey,snapshot]);
    await visit('/learn/videos?candidate=steve-flat-wash&lesson=water-brush&step=dilution'); await watch();
    await click('Continue lesson'); await page.getByTestId('studio-step-controls').waitFor();
    assert(page.url().includes('/learn/lesson')); assert.equal(await page.evaluate(k => JSON.parse(localStorage.getItem(k)).entries['water-brush'].stepId, learningKey), 'dilution');
    assert.equal(await page.locator('iframe').count(), 0);
    const saved = await page.evaluate(k => JSON.parse(localStorage.getItem(k)), learningKey);
    assert.equal(saved.entries['water-brush'].notes.dilution, 'Preserved painting note');
    assert.deepEqual(saved.entries['water-brush'].completedSteps, []);
  });
  await scenario('Route cleanup pauses/destroys the player, and returning to Learn does not start background playback', async () => {
    await visit('/learn/videos?candidate=steve-flat-wash'); await watch();
    await page.getByRole('tab', { name: 'Home', exact: true }).click();
    await page.waitForFunction(() => window.YT_TEST.instances.every(p => p.dead)); assert.equal(await page.locator('iframe').count(), 0);
    await page.getByRole('tab', { name: 'Learn', exact: true }).click(); await page.waitForTimeout(200);
    assert.equal(await page.locator('iframe').count(), 0);
  });
  await scenario('Unknown candidate is not silently substituted and never loads a player', async () => {
    await visit('/learn/videos?candidate=not-a-video'); await page.getByText('That preview candidate is not available.', { exact: false }).waitFor();
    assert.equal(await page.locator('iframe').count(), 0);
  });
  await scenario('Invalid private review data remains untouched outside owner mode; explicit recovery keeps learning', async () => {
    await page.evaluate(k => localStorage.setItem(k,'BROKEN_QA_RECORD'), reviewKey);
    await visit('/learn/videos?candidate=steve-flat-wash'); assert.equal(await page.getByRole('alert').count(),0);
    await owner(); await review(); await page.getByRole('alert').filter({ hasText:'The local review could not be read.' }).waitFor();
    assert.equal(await page.evaluate(k=>localStorage.getItem(k),reviewKey),'BROKEN_QA_RECORD'); assert(await b('Save private preview review').isDisabled());
    await click("Use a fresh review; replace this video's draft only on save"); assert.equal(await page.evaluate(k=>localStorage.getItem(k),reviewKey),'BROKEN_QA_RECORD');
    await click('Save private preview review'); await page.getByRole('status').filter({hasText:'Review saved in this browser'}).waitFor();
  });
  await scenario('Failed owner save is truthful and exportable, with learner progress unchanged', async () => {
    const before=await page.evaluate(k=>localStorage.getItem(k),learningKey);
    await page.addInitScript(()=>{ if(location.hostname!=='127.0.0.1') return; const original=Storage.prototype.setItem; Storage.prototype.setItem=function(k,v){ if(k.startsWith('watercolor:video-preview:v1:')) throw new DOMException('SYNTHETIC storage failure','QuotaExceededError'); return original.call(this,k,v); }; });
    await visit('/learn/videos?candidate=steve-flat-wash&review=1'); await review();
    await page.getByRole('textbox',{name:'Corrections, title/channel checks and playback observations',exact:true}).fill('SYNTHETIC unsaved correction');
    await click('Save private preview review'); await page.getByRole('alert').filter({hasText:'Review was not saved.'}).waitFor();
    const pending=page.waitForEvent('download'); await click('Export my video reviews as JSON'); assert((await pending).suggestedFilename().endsWith('.json'));
    assert.equal(await page.evaluate(k=>localStorage.getItem(k),learningKey),before); await shot('10-owner-save-failure');
  });
  assert.deepEqual(errors, []); assert.deepEqual(unexpected, []);
  fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({ source:'Actual configured Expo export, synthetic account/provider only', date:new Date().toISOString(), tests:matrix.length, pass:matrix.length, errors, unexpectedRequests:unexpected, matrix, liveYouTubeVerified:false, physicalDeviceTested:false },null,2));
  console.log(JSON.stringify({tests:matrix.length,pass:matrix.length,errors:errors.length,unexpected:unexpected.length})); await browser.close();
})().catch(e=>{ console.error(e); process.exit(1); });
