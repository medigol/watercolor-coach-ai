const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const load=require('./helpers/learning-loader.cjs');
const {instructionErrors,waterInstruction:units,waterDiagnostics:diagnostics,instructionVideoLinks:links,resolveInstructionVideo,unitsForStep}=load('learning/instruction.ts');
const {items,itemById}=load('learning/content.ts');const p=load('learning/progress.ts');
const {previewUrls}=load('learning/videoPreview.ts');const {publicationErrors,mediaResources}=load('learning/media.ts');
const clone=structuredClone;
test('canonical progress identity and all original checklist wording remain exact',()=>{
 assert.deepEqual(items.map(i=>({id:i.id,version:i.version,steps:i.steps.map(s=>({id:s.id,checklist:s.checklist}))})),require('./helpers/instruction-progress-contract.json'));
 assert.equal(itemById('water-brush').version,1);
});
test('pilot covers all nine required subject areas within the canonical five steps',()=>{
 assert.deepEqual(instructionErrors(),[]);assert.equal(units.length,10);
 assert.deepEqual([...new Set(units.map(u=>u.topic))],['three-decisions','materials','brush-loading','brush-contact','flat-wash','dilution','paper-moisture','diagnosis','transfer']);
 assert.deepEqual([...new Set(units.map(u=>u.stepId))],['look','set-up','dilution','moisture','reflect']);
 assert.equal(itemById('water-brush').instructionMinutes,18);assert.equal(itemById('water-brush').practiceMinutes,37);
 for(const s of itemById('water-brush').steps)assert.equal(unitsForStep('water-brush',s.id).reduce((n,u)=>n+u.minutes.reading+u.minutes.practice,0),s.minutes);
 assert(units.every(u=>u.minutes.reading+u.minutes.practice<=10));
});
for(const [name,mutate,expected] of [
 ['duplicate unit',u=>u.push(clone(u[0])),/duplicate/],
 ['unknown step',u=>u[0].stepId='fake',/Unknown lesson/],
 ['unknown lesson',u=>u[0].lessonId='fake',/Unknown lesson/],
 ['inverted sequence',u=>{[u[0],u[3]]=[u[3],u[0]]},/Contradictory/],
 ['missing causal explanation',u=>u[0].why='',/Incomplete teaching/],
 ['missing controlled variable',u=>u[0].exercise.variable='',/Incomplete experiment/],
 ['missing observed outcome',u=>u[0].exercise.success=[],/Incomplete experiment/],
 ['fabricated editorial approval',u=>u[0].editorial.status='owner-approved',/Unsupported editorial/],
 ['invented score',u=>u[0].editorial.score=100,/Unsupported editorial/],
 ['unknown diagnostic',u=>u[0].diagnosticIds=['fake'],/Orphan diagnostic/],
 ['zero active time',u=>u[0].minutes.practice=0,/Invalid active time/],
 ['unfinished step coverage',u=>u.pop(),/Uncovered canonical step/],
 ['unavailable illustration',u=>u[0].illustration='photograph',/Unknown illustration/],
])test('teaching validator rejects '+name,()=>{const u=clone(units);mutate(u);assert.match(instructionErrors(u).join(';'),expected)});
for(const field of ['symptom','causes','check','correction','stop','normalVariation'])test('diagnostics require '+field,()=>{
 const d=clone(diagnostics);d[0][field]=field==='causes'?[]:'';assert.match(instructionErrors(units,links,d).join(';'),/Incomplete diagnostic/);
});
test('all eight distinct failure cases have conditional checks and safe stopping decisions',()=>{
 assert.deepEqual(diagnostics.map(d=>d.id),['pooling','dry-brush','join-line','spread','backrun','overworked','dry-value','broken-mark']);
 const pool=diagnostics.find(d=>d.id==='pooling');assert.match(pool.check,/standing water/);assert.match(pool.correction,/still wet/);assert.match(pool.stop,/losing sheen/);
 const bloom=diagnostics.find(d=>d.id==='backrun');assert.match(bloom.check,/losing sheen/);assert.match(bloom.correction,/fresh scrap/);assert.match(bloom.stop,/Do not scrub/);assert.match(bloom.normalVariation,/expressive/);
 assert.match(diagnostics.find(d=>d.id==='broken-mark').normalVariation,/intentional/);
});
test('each inline reference reuses exact existing evidence, never a new short clip',()=>{
 assert.equal(links.length,5);assert.equal(new Set(links.map(l=>l.id)).size,5);
 for(const l of links){const u=units.find(u=>u.id===l.unitId),r=resolveInstructionVideo(l,u);assert(r);assert(publicationErrors(r.candidate).length);assert.equal(l.status,'provisional-preview');
 const cue=previewUrls(r.candidate,l.windowId,{mode:'default',language:'default'}).cue;assert.equal(cue.startSeconds,r.window.start);assert.equal(cue.endSeconds,r.window.end);}
 const s=links.filter(l=>l.candidateId==='steve-flat-wash');assert.equal(s.length,2);assert(s.every(l=>l.scope==='long-proposal'&&l.suggestedRelevance.includes('not a')));
 assert.equal(mediaResources.length,0);
});
test('Louise start remains unbounded, while two separately referenced chapter hints retain absolute ends',()=>{
 const resolved=links.filter(l=>l.candidateId==='louise-blend').map(l=>resolveInstructionVideo(l,units.find(u=>u.id===l.unitId)).window);
 assert.deepEqual(resolved.map(w=>[w.start,w.end]),[[90,undefined],[109,410],[515,758]]);
});
for(const [name,change]of[
 ['unknown candidate',l=>l.candidateId='invented'],['invented window',l=>l.windowId='brush-loading-clip'],['inferred approval',l=>l.status='verified'],['private note',l=>l.ownerNote='private'],['unrelated Paul values',l=>l.candidateId='paul-values'],['invented seconds',l=>l.start=12],
])test('inline reference refuses '+name,()=>{const l=clone(links[0]);change(l);assert.equal(resolveInstructionVideo(l,units.find(u=>u.id===l.unitId)),null)});
test('no reflection/intention fillers, lost-edge substitutions or conflicting Café defaults',()=>{
 const denied=require('../docs/video/final-handoff/evidence.json').coverage.filter(r=>r.need==='unnecessary');assert.equal(denied.length,6);
 for(const l of links){const u=units.find(u=>u.id===l.unitId);assert(!denied.some(d=>d.lessonId===u.lessonId&&d.stepId===u.stepId));}
 const u={...units[0],lessonId:'edge-families',stepId:'soft'};
 for(const id of ['cafe-cloud-tips-publisher-1','conflicting-json-hint'])assert.equal(resolveInstructionVideo({...links[0],unitId:u.id,candidateId:'cafe-cloud-tips',windowId:id,scope:'chapter-hint'},u),null);
 assert.match(units.find(u=>u.id==='wb-moisture-pair').concept,/not interchangeable/);
});
test('architecture permits an honest full-original reference without inventing a duration',()=>{
 const u=units.find(u=>u.id==='wb-moisture-pair'),l={...links[0],unitId:u.id,candidateId:'cafe-cloud-wet',windowId:'original',scope:'original'};
 const r=resolveInstructionVideo(l,u);assert(r);assert.equal(r.window,undefined);assert.equal(previewUrls(r.candidate,'original',{mode:'default',language:'default'}).cue.endSeconds,undefined);
});
test('historical partial and completed v1 records retain notes/checks/reflection and resume',()=>{
 const i=itemById('water-brush'),s=p.emptyProgress();const e=p.newEntry(i);e.stepId='moisture';e.checked.look=[p.checklistId('look',0)];e.completedSteps=['look'];e.notes['set-up']='Preserved loading note';e.reflection={text:'Earlier practice',difficulty:'useful',confidence:'developing',recordedAt:new Date().toISOString()};s.entries[i.id]=e;
 const raw=JSON.stringify(s),d=p.decodeProgress(raw);assert.equal(p.resumeStep(i,d.entries[i.id]),3);assert.equal(JSON.stringify(d),raw);
 e.completedSteps=i.steps.map(s=>s.id);assert(p.completed(i,e));assert.equal(e.notes['set-up'],'Preserved loading note');
});
test('new teaching/inline components cannot write learning or backend records',()=>{
 for(const file of ['components/learning/InstructionalUnit.tsx','learning/instruction.ts','learning/waterInstruction.ts'])assert(!/localStorage|AsyncStorage|finishStep|editEntry|functions\.invoke|supabase|fetch\(/.test(fs.readFileSync(file,'utf8')),file);
});
test('the same model validates another canonical lesson without a water-specific topic or diagram',()=>{
 const i=itemById('three-values');
 const next=i.steps.map((s,n)=>({...clone(units[0]),id:'values-focus-'+n,lessonId:i.id,stepId:s.id,topic:'value-grouping',illustration:'values',diagnosticIds:[],minutes:{reading:1,practice:s.minutes-1}}));
 assert.deepEqual(instructionErrors(next,[],[]),[]);
 assert(!p.completed(i,p.newEntry(i)));
});
test('a full-original future link remains a preview, never approved lesson media',()=>{
 const unit=units.find(u=>u.id==='wb-moisture-pair');
 const link={...links[0],unitId:unit.id,candidateId:'cafe-cloud-wet',windowId:'original',scope:'original'};
 const r=resolveInstructionVideo(link,unit);assert(r);assert.equal(r.window,undefined);assert(publicationErrors(r.candidate).length);
});

const focusSession=load('learning/teachingFocus.ts');
test('reading-position keys isolate account, canonical lesson and canonical step',()=>{
 const key=focusSession.teachingFocusKey;
 assert.notEqual(key('learner-a','water-brush','set-up'),key('learner-b','water-brush','set-up'));
 assert.notEqual(key('learner-a','water-brush','set-up'),key('learner-a','water-brush','moisture'));
 assert.notEqual(key('learner-a','water-brush','set-up'),key('learner-a','three-values','set-up'));
 assert.notEqual(key('a:b','c','d'),key('a','b:c','d'),'untrusted delimiters cannot collide');
 assert.equal(key(undefined,'water-brush','set-up'),null);
});
test('session reading position stores only an existing unit ID and cannot alter progress or player intent',()=>{
 const map=new Map(),store={getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v)};
 const key=focusSession.teachingFocusKey('learner','water-brush','set-up'),allowed=unitsForStep('water-brush','set-up').map(u=>u.id);
 focusSession.writeTeachingFocus(store,key,allowed,'wb-load-round');
 assert.equal(map.size,1);assert.equal(map.get(key),'wb-load-round');
 assert.equal(focusSession.readTeachingFocus(store,key,allowed),'wb-load-round');
 focusSession.writeTeachingFocus(store,key,allowed,'wb-moisture-pair');assert.equal(map.get(key),'wb-load-round');
 assert.equal(focusSession.readTeachingFocus(store,key,['wb-materials']),undefined);
 assert.equal(focusSession.readTeachingFocus(store,focusSession.teachingFocusKey('other','water-brush','set-up'),allowed),undefined);
 focusSession.writeTeachingFocus(store,null,allowed,allowed[0]);assert.equal(map.size,1);
});
test('blocked/unavailable or stale session position always falls back without touching learner progress',()=>{
 const key=focusSession.teachingFocusKey('learner','water-brush','set-up'),allowed=['wb-load-round'];
 const blocked={getItem(){throw Error('blocked')},setItem(){throw Error('quota')}};
 assert.equal(focusSession.readTeachingFocus(blocked,key,allowed),undefined);
 assert.doesNotThrow(()=>focusSession.writeTeachingFocus(blocked,key,allowed,allowed[0]));
 assert.equal(focusSession.readTeachingFocus(null,key,allowed),undefined);
 assert.equal(focusSession.readTeachingFocus({getItem:()=>'{"playing":true}',setItem(){}},key,allowed),undefined);
});
test('editorial corrections retain independent loading/dilution controls and safe conditional cleanup',()=>{
 const loading=units.find(u=>u.id==='wb-load-round'),dilution=units.find(u=>u.id==='wb-dilution-test');
 assert.match(loading.actions[0],/rinse water/);assert.match(loading.actions[2],/Lift as you finish/);
 assert.match(dilution.concept,/comparable amounts/);assert.match(dilution.actions[1],/blot off excess rinse water/);
 assert.match(units.find(u=>u.id==='wb-moisture-pair').actions[2],/unevenly dry/);
 assert.match(diagnostics.find(d=>d.id==='pooling').correction,/choosing just one change/);
 assert.match(diagnostics.find(d=>d.id==='dry-brush').correction,/separate shorter-stroke test/);
});
