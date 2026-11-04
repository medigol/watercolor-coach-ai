// Canonical lesson, real Expo export; synthetic auth/provider responses only.
// Never real video inspection, production authentication or a paid request.
const { chromium } = require('playwright'), fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const base = process.argv[2] || 'http://127.0.0.1:8192/watercolor-coach-ai';
const out = process.argv[3] || '/tmp/mentor-watercolour/after';
fs.mkdirSync(out, { recursive: true });
const load = require('../helpers/learning-loader.cjs');
const { previewCandidates } = load('learning/videoPreviewCatalogue.ts');
const { videoLearningGuides: guides, defaultPreviewWindow } = load('learning/videoLearning.ts');
const uid = '10000000-0000-4000-8000-000000000001', learningKey = 'watercolor:learning:v1:' + uid;
const reviewKey = 'watercolor:video-preview:v1:' + uid + ':steve-flat-wash';
const user = { id: uid, aud: 'authenticated', role: 'authenticated', email: 'preview-test@example.invalid', email_confirmed_at: new Date().toISOString(), app_metadata: { provider: 'email', providers: ['email'] }, user_metadata: {}, created_at: new Date().toISOString() };
const token = [{ alg: 'HS256', typ: 'JWT' }, { sub: uid, aud: 'authenticated', role: 'authenticated', exp: Math.floor(Date.now() / 1000) + 3600 }, 'test-signature'].map((v, i) => i < 2 ? Buffer.from(JSON.stringify(v)).toString('base64url') : v).join('.');
let responseUser = user;
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
      if (u.pathname.endsWith('/user')) return reply(responseUser);
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
  const scenario = async (name, fn) => { try { await fn(); } catch(error) { await shot('FAILED-'+matrix.length); fs.writeFileSync(path.join(out,'failed-dom.txt'),await page.locator('body').innerText()); console.error('SCENARIO:',name); throw error; } matrix.push({ name, status: 'PASS' }); console.log('PASS ' + name); };
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
  const learning=load('learning/progress.ts'),{itemById}=load('learning/content.ts');
  const {waterInstruction:units}=load('learning/instruction.ts');
  const water=itemById('water-brush');
  const raw=()=>page.evaluate(k=>localStorage.getItem(k),learningKey);
  async function seed(step,profile=null,complete=false){
    const state=learning.emptyProgress(),e=learning.newEntry(water);e.stepId=step;e.notes['set-up']='A preserved loading note';e.checked.look=[learning.checklistId('look',0)];e.completedSteps=['look'];
    if(complete){e.completedSteps=water.steps.map(s=>s.id);e.reflection={text:'Historical complete reflection',difficulty:'useful',confidence:'comfortable',recordedAt:new Date().toISOString()};}
    state.entries[water.id]=e;state.currentItemId=water.id;state.profile=profile;
    await page.evaluate(([k,v])=>{localStorage.setItem(k,v);for(const key of Object.keys(sessionStorage))if(key.startsWith('watercolor:teaching-focus:'))sessionStorage.removeItem(key);},[learningKey,JSON.stringify(state)]);
    await page.goto(base+'/learn/lesson?id=water-brush');await h('Water & brush control').waitFor();
    if(!complete)await page.getByTestId('instructional-unit').waitFor();
  }
  const selectFocus=async id=>{await click('Teaching focuses in this step');const u=units.find(u=>u.id===id),group=units.filter(x=>x.stepId===u.stepId);await click('Focus '+(group.findIndex(x=>x.id===id)+1)+': '+u.title);await h(u.title).waitFor();};
  const loadInline=async id=>{await click('Watch related preview: '+id);await ready();assert.equal(await page.locator('iframe').count(),1);assert.equal(await page.evaluate(()=>window.YT_TEST.instances.filter(p=>!p.dead).length),1);};
  await scenario('A first-time learner can open and begin the canonical lesson without a saved entry',async()=>{
    await page.evaluate(k=>localStorage.removeItem(k),learningKey);
    await page.goto(base+'/learn/lesson?id=water-brush');await h('Water & brush control').waitFor();await b('Begin lesson').waitFor();
    assert.equal(await page.locator('iframe').count(),0);await click('Begin lesson');await page.getByTestId('instructional-unit').waitFor();await shot('01-mobile-opening');
  });
  await scenario('Essential three-control teaching is visible in canonical lesson without media or disclosures',async()=>{
    const before=external.length;await seed('look');
    await page.getByText(units[0].concept,{exact:true}).waitFor();await page.getByText(units[0].setup,{exact:false}).waitFor();
    assert.equal(await page.getByRole('checkbox').count(),water.steps[0].checklist.length);
    assert.equal(await page.locator('iframe').count(),0);assert.equal(external.length,before);
    await page.getByTestId('unit-exercise').scrollIntoViewIfNeeded();await shot('10-essential-experiment');
  });
  await scenario('Seven widths plus landscape keep essential teaching visible, touch targets and no horizontal overflow',async()=>{
    await seed('set-up');
    for(const [width,height] of [[320,800],[375,900],[390,900],[430,900],[768,900],[1024,900],[1440,1000],[844,390]]){
      await page.setViewportSize({width,height});await page.waitForTimeout(100);
      assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
      const action=page.getByTestId('unit-goal');await action.scrollIntoViewIfNeeded();
      const box=await action.boundingBox();assert(box&&box.width>100);
      const check=page.getByRole('checkbox').first();assert((await check.locator("..").boundingBox()).height>=44, "the associated label is the full touch target");
      await check.focus();assert(await check.evaluate(e=>e===document.activeElement));
      if(width===1440){await b('Learn home').scrollIntoViewIfNeeded();await shot('02-desktop-essential');}
    }
  });
  await scenario('Ten authored focuses have essential actions, controlled variables and visible outcomes without changing progress',async()=>{
    await page.setViewportSize({width:390,height:900});
    for(const step of water.steps){await seed(step.id);const before=await raw();const group=units.filter(u=>u.stepId===step.id);
      for(const u of group){if(u!==group[0])await selectFocus(u.id);
        await page.getByText('1. '+u.actions[0],{exact:true}).waitFor();await page.getByText(u.concept,{exact:true}).waitFor();await page.getByText(u.exercise.action,{exact:true}).waitFor();
        const ids=['unit-goal','unit-concept','unit-preparation','current-practical-action',...(await page.getByTestId('contextual-video').count()?['contextual-video']:[]),'studio-observation','unit-exercise',...(u.diagnosticIds.length?['inline-diagnostics']:[]),'unit-practice-record','unit-focus-navigation'];
        assert(await page.getByTestId('instructional-unit').evaluate((el,ids)=>ids.every((id,n)=>n===0||!!(el.querySelector(`[data-testid="${ids[n-1]}"]`).compareDocumentPosition(el.querySelector(`[data-testid="${id}"]`))&Node.DOCUMENT_POSITION_FOLLOWING)),ids),'goal → concept → preparation → actions → optional video → observation → experiment → diagnosis → record → next');
        assert.equal(await page.getByTestId('unit-practice-record').getByRole('checkbox').count(),step.checklist.length);
        assert.equal(await page.getByTestId('unit-concept').getByRole('button').count(),0,'essential beginner concept is not hidden in a disclosure');
        assert.equal(await raw(),before,'reading and focus navigation must not write progress');
      }
    }
  });
  await scenario('Keyboard next/previous focus lands at the new explanation; back from experiment keeps the same focus',async()=>{
    await seed('set-up');const before=await raw();
    await b('Next teaching focus').focus();await page.keyboard.press('Enter');
    await h('Load the belly, then test the delivery').waitFor();
    const goal=page.getByTestId('unit-goal');assert(await goal.evaluate(e=>e===document.activeElement));await near(goal);
    await page.getByTestId('unit-exercise').scrollIntoViewIfNeeded();await click('Back to explanation');assert(await goal.evaluate(e=>e===document.activeElement));await near(goal);
    await click('Previous teaching focus');await h('Prepare a wash you can finish').waitFor();assert(await page.getByTestId('unit-goal').evaluate(e=>e===document.activeElement));
    assert.equal(await raw(),before);
  });
  await scenario('Steve broad proposal loads inline in one gesture and retains absolute 47–702 boundaries',async()=>{
    await seed('set-up');await selectFocus('wb-load-round');await page.setViewportSize({width:1440,height:1000});await b('Learn home').scrollIntoViewIfNeeded();await shot('11-desktop-brush');await page.setViewportSize({width:390,height:900});const before=await raw();const requests=external.length;
    assert.equal(await page.locator('iframe').count(),0);await page.getByTestId('current-practical-action').scrollIntoViewIfNeeded();await shot('17-brush-physical-sequence');await b('Watch related preview: wb-loading-steve').scrollIntoViewIfNeeded();await shot('03-inline-before-load');
    const y=await page.getByTestId('inline-reference-wb-loading-steve').evaluate(e=>e.getBoundingClientRect().top);
    await loadInline('wb-loading-steve');assert(external.length>requests);assert.equal((await cue()).startSeconds,47);assert.equal((await cue()).endSeconds,702);
    assert.equal(await b('Load YouTube preview').count(),0);assert(page.url().includes('/learn/lesson'));
    assert(Math.abs(await page.getByTestId('inline-reference-wb-loading-steve').evaluate(e=>e.getBoundingClientRect().top)-y)<160,'loading preserves nearby scroll context');
    await page.locator('iframe').scrollIntoViewIfNeeded();await shot('04-inline-synthetic-player');
    await click('Replay demonstration');const requested=await page.evaluate(()=>window.YT_TEST.calls.filter(c=>c[0]==='load').at(-1)[1]);assert.deepEqual(requested,{videoId:'alq0YqX86gs',startSeconds:47,endSeconds:702});
    await page.evaluate(()=>window.YT_TEST.emit(1,702));await page.getByRole('status').filter({hasText:'Viewing window finished'}).waitFor();assert.equal(await raw(),before);
  });
  await scenario('Returning to practice closes video and focuses the same unit exercise without writes',async()=>{
    const before=await raw();await click('Back to explanation');assert.equal(await page.locator('iframe').count(),0);assert(await page.getByTestId('unit-goal').evaluate(e=>e===document.activeElement));await loadInline('wb-loading-steve');await click('Return to practice');assert.equal(await page.locator('iframe').count(),0);
    const e=page.getByTestId('unit-exercise');assert(await e.evaluate(e=>e===document.activeElement));await near(e);assert.equal(await raw(),before);await shot('05-exercise-after-video');
  });
  await scenario('Switching canonical step cleans up; the repeated Steve proposal is not relabelled a short clip',async()=>{
    await loadInline('wb-loading-steve');
    await click('Show lesson outline');await click('3. Vary dilution, not everything');await h('Join a small wash while its edge is wet').waitFor();assert.equal(await page.locator('iframe').count(),0);
    await page.getByText('The same longer wash proposal, not a newly verified short wash segment.',{exact:false}).waitFor();
    await loadInline('wb-wash-steve');assert.equal((await cue()).startSeconds,47);assert.equal((await cue()).endSeconds,702);
    await click('Optional demonstration');assert.equal(await page.locator('iframe').count(),0);await page.getByText(/No verified video is assigned/).waitFor();
  });
  await scenario('Louise start-only reference remains 90s onwards without a fabricated endpoint',async()=>{
    await seed('moisture');await loadInline('wb-moisture-overview');assert.equal((await cue()).startSeconds,90);assert(!('endSeconds' in await cue()));
    const q=new URL(await page.locator('iframe').getAttribute('src')).searchParams;assert.equal(q.get('end'),null);
  });
  await scenario('Two independently referenced Louise chapter hints maintain one active official player',async()=>{
    await selectFocus('wb-moisture-pair');assert.equal(await page.locator('iframe').count(),0);const before=await raw();
    await loadInline('wb-moisture-wet');assert.equal((await cue()).startSeconds,109);assert.equal((await cue()).endSeconds,410);
    const old=await page.evaluate(()=>window.YT_TEST.instances.length);
    await loadInline('wb-moisture-dry');assert.equal((await cue()).startSeconds,515);assert.equal((await cue()).endSeconds,758);assert.equal(await page.evaluate(()=>window.YT_TEST.instances.filter(p=>!p.dead).length),1);
    assert.equal(await page.evaluate(()=>window.YT_TEST.instances.length),old+1);assert.equal(await raw(),before);
    await page.evaluate(()=>window.YT_TEST.emit(1,200));await page.getByRole('status').filter({hasText:'outside this viewing window'}).waitFor();
    await click('Replay demonstration');assert.equal(await page.evaluate(()=>window.YT_TEST.calls.filter(c=>c[0]==='load').at(-1)[1].endSeconds),758);
  });
  await scenario('Restricted embedding keeps current written exercise, original link and unchanged checklist',async()=>{
    const before=await raw();await page.evaluate(()=>window.YT_TEST.error(101));await page.getByRole('status').filter({hasText:'restricted embedding'}).waitFor();assert.equal(await page.locator('iframe').count(),0);
    await options();await click('Watch full original on YouTube');assert.equal(await page.evaluate(()=>window.QA_OPENED.at(-1)),'https://www.youtube.com/watch?v=UeIHo83pVGc');
    await page.getByText(units.find(u=>u.id==='wb-moisture-pair').exercise.action,{exact:true}).waitFor();assert.equal(await raw(),before);await shot('06-inline-error');
  });
  await scenario('Expert tip and symptom→cause→check→safe action→stop guide are accessible on mobile',async()=>{
    await seed('moisture');await selectFocus('wb-diagnose-repeat');await h('Diagnose a result').waitFor();await page.getByTestId('inline-diagnostics').waitFor();
    await click('A lighter irregular bloom with a darker rim forms in a wash');
    await page.getByText('Stop and start fresh: Do not scrub',{exact:false}).waitFor();await page.getByText('Check: Was the wash losing sheen',{exact:false}).waitFor();await shot('07-diagnose-backrun');
    await b('A large mobile puddle collects at a stroke’s end').focus();await page.keyboard.press('Enter');
    assert.equal(await b('A large mobile puddle collects at a stroke’s end').getAttribute('aria-expanded'),'true');
    await page.getByText('Safest next action: If everything is still wet',{exact:false}).waitFor();await click('Visual guide and explanation');await click('Instructor’s tip');await page.getByText(units.find(u=>u.id==='wb-diagnose-repeat').tip,{exact:true}).waitFor();await shot('12-instructor-tip');
  });
  await scenario('Reading and experienced presentation share the complete teaching without inferring competence',async()=>{
    const {defaultProfile}=load('learning/catalogue.ts');await seed('set-up',{...defaultProfile,experience:'intermediate',format:'reading'});
    await page.getByText(units[1].concept,{exact:true}).waitFor();await b('Review the basic terms').waitFor();await h('Decision to explore').waitFor();assert.equal(await page.locator('iframe').count(),0);
    await click('Next teaching focus');await h('Load the belly, then test the delivery').waitFor();const before=await raw();
    await loadInline('wb-loading-steve');await click('Return to practice');assert.equal(await raw(),before);await shot('08-experienced-route');
  });
  await scenario('Leaving lesson disposes playback; refresh and navigation restore the reading focus without altering checks or notes',async()=>{
    await loadInline('wb-loading-steve');const before=JSON.parse(await raw());await page.getByRole('tab',{name:'Home',exact:true}).click();await page.waitForFunction(()=>window.YT_TEST.instances.every(p=>p.dead));
    await page.goto(base+'/learn/lesson?id=water-brush');await h('Load the belly, then test the delivery').waitFor();assert.equal(await page.locator('iframe').count(),0);
    await page.reload();await h('Load the belly, then test the delivery').waitFor();assert.equal(await page.locator('iframe').count(),0);
    const after=JSON.parse(await raw());assert.deepEqual(after,before);assert.equal(after.entries['water-brush'].notes['set-up'],'A preserved loading note');
    await click('Notes for this step');assert.equal(await page.getByRole('textbox',{name:'Optional note for this step',exact:true}).inputValue(),'A preserved loading note');
  });
  await scenario('Historical complete record stays complete and preserves its reflection',async()=>{
    await seed('reflect',null,true);await h('Lesson completed').waitFor();await page.getByText('Historical complete reflection',{exact:true}).waitFor();const before=await raw();
    await click('Review this completed study');await click('1. Notice the three water decisions · recorded');assert.equal(await raw()===before,false,'explicit canonical navigation may save its step');
    const e=JSON.parse(await raw()).entries['water-brush'];assert.equal(e.completedSteps.length,5);assert.equal(e.reflection.text,'Historical complete reflection');
  });
  await scenario('No reflection video or owner QA tools; enlarged text and controls remain reachable',async()=>{
    await seed('reflect');assert.equal(await page.getByTestId('contextual-video').count(),0);assert.equal(await b('Owner review mode').count(),0);assert.equal(await b('Export my video reviews as JSON').count(),0);
    await page.setViewportSize({width:375,height:600});await page.addStyleTag({content:'[data-testid="learning-page"] [dir="auto"] {font-size:200% !important;line-height:1.5 !important}'});
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));const field=page.getByRole('textbox',{name:'My exercise reflection',exact:true});await field.fill('A tested moisture state and an uncertainty.');await field.scrollIntoViewIfNeeded();await near(field);await shot('09-enlarged-reflection');
  });
  await scenario('A stale saved focus is ignored, and the final practice checklist follows the experiment without a micro-unit gate',async()=>{
    await seed('set-up');const before=await raw();
    await page.evaluate(()=>sessionStorage.setItem('watercolor:teaching-focus:v1:10000000-0000-4000-8000-000000000001:water-brush:set-up','wb-moisture-pair'));
    await page.reload();await h('Prepare a wash you can finish').waitFor();
    await page.getByTestId('unit-goal').scrollIntoViewIfNeeded();await shot('13-revised-reading-order');
    await page.getByTestId('current-practical-action').scrollIntoViewIfNeeded();await shot('14-physical-instructions');
    await page.getByTestId('unit-exercise').scrollIntoViewIfNeeded();await shot('15-experiment-and-feedback');
    await page.getByTestId('unit-practice-record').scrollIntoViewIfNeeded();await shot('16-final-practice-checklist');
    assert.equal(await raw(),before);
    const checks=page.getByTestId('unit-practice-record').getByRole('checkbox');for(let n=0;n<await checks.count();n++){await checks.nth(n).focus();await page.keyboard.press('Space');}await expectPracticeSaved();
    assert.equal(await b('Complete step and continue').isEnabled(),true,'existing checklist alone controls canonical readiness, without visiting other focuses');
    async function expectPracticeSaved(){await page.waitForFunction(k=>JSON.parse(localStorage.getItem(k)).entries['water-brush'].checked['set-up']?.length===2,learningKey);}
  });
  await scenario('Another signed-in account never inherits the reading focus or playback intent',async()=>{
    await page.setViewportSize({width:390,height:900});await seed('set-up');await selectFocus('wb-load-round');await loadInline('wb-loading-steve');const original=await raw();const requests=external.length;
    const other={...user,id:'10000000-0000-4000-8000-000000000002',email:'other@example.invalid'};
    const otherToken=[{alg:'HS256',typ:'JWT'},{sub:other.id,aud:'authenticated',role:'authenticated',exp:Math.floor(Date.now()/1000)+3600},'test-signature'].map((v,i)=>i<2?Buffer.from(JSON.stringify(v)).toString('base64url'):v).join('.');
    responseUser=other;
    await page.evaluate(({other,otherToken,original})=>{
      const authKey=Object.keys(localStorage).find(k=>k.endsWith('-auth-token'));if(!authKey)throw Error('synthetic auth session missing');
      const session=JSON.parse(localStorage.getItem(authKey));session.user=other;session.access_token=otherToken;localStorage.setItem(authKey,JSON.stringify(session));
      localStorage.setItem('watercolor:learning:v1:'+other.id,original);
    },{other,otherToken,original});
    await page.reload();await h('Prepare a wash you can finish').waitFor();assert.equal(await page.locator('iframe').count(),0);assert.equal(external.length,requests);
    assert.equal(await raw(),original);await click('Next teaching focus');assert.equal(await raw(),original);
    assert.equal(await page.evaluate(()=>sessionStorage.getItem('watercolor:teaching-focus:v1:10000000-0000-4000-8000-000000000001:water-brush:set-up')),'wb-load-round');
  });
  await scenario('Blocked session storage preserves in-memory navigation and never blocks the lesson or writes progress',async()=>{
    await page.addInitScript(()=>Object.defineProperty(window,'sessionStorage',{get(){throw new DOMException('Storage disabled','SecurityError')}}));
    await page.reload();await h('Prepare a wash you can finish').waitFor();const before=await raw();
    await click('Next teaching focus');await h('Load the belly, then test the delivery').waitFor();assert.equal(await raw(),before);
    await click('Next teaching focus');await h('Choose the contact, not a fixed angle').waitFor();assert.equal(await raw(),before);
  });
  assert.deepEqual(errors,[]);assert.deepEqual(unexpected,[]);
  fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({source:'actual exported canonical lesson with synthetic auth/API only',tests:matrix.length,pass:matrix.length,matrix,errors,unexpected,realPlayback:false,newVideoContentInspected:false,physicalAndroidTested:false},null,2));
  console.log(JSON.stringify({tests:matrix.length,pass:matrix.length,errors:errors.length,unexpected:unexpected.length}));await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
