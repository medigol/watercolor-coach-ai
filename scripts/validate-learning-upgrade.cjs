const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const load=require('../tests/helpers/learning-loader.cjs');
function validate(manifest=JSON.parse(fs.readFileSync(path.join(__dirname,'../docs/review/watercolour-visual-assets.json')))){
 const errors=[];const check=(ok,message)=>{if(!ok)errors.push(message);};
 const a=load('learning/artwork.ts'),i=load('learning/instruction.ts'),{items}=load('learning/content.ts');
 errors.push(...i.allInstructionErrors());
 check(i.instructionUnits.length===32,'Expected 32 additive teaching units');
 for(const item of items)for(const step of item.steps)check(i.unitsForStep(item.id,step.id).length>0,'Uncovered canonical step '+item.id+':'+step.id);
 check(new Set(manifest.sources.map(s=>s.id)).size===22,'Missing or duplicated artwork source');
 check(manifest.sources.every(s=>s.synthetic&&!s.physicalPainting&&!s.ownerApproved&&s.visuallyInspected),'Unsupported artwork approval or provenance');
 for(const id of a.artworkSourceIds)check(manifest.sources.some(s=>s.id===id),'Missing source '+id);
 const hashes=new Set();for(const s of manifest.sources)for(const v of s.variants){const f=path.join(__dirname,'..',v.path);if(!fs.existsSync(f)){check(false,'Missing raster '+v.path);continue;}const b=fs.readFileSync(f);check(b.toString('ascii',0,4)==='RIFF'&&b.toString('ascii',8,12)==='WEBP','Not WebP '+v.path);const hash=crypto.createHash('sha256').update(b).digest('hex');check(hash===v.sha256&&b.length===v.bytes,'Changed raster metadata '+v.path);check(!hashes.has(hash),'Duplicate raster bytes '+v.path);hashes.add(hash);check(b.length<500000&&v.width<=1440&&v.height===v.width*2/3,'Raster budget/dimensions '+v.path);}
 for(const [id,v]of Object.entries(a.paintedStudies)){check(!!v.alt&&!!v.caption&&!!v.teaches,'Incomplete teaching description '+id);check(manifest.views.some(x=>x.id===id&&x.sourceId===v.sourceId),'View mismatch '+id);if(v.crop){check(v.sourceId==='quiet-landscape-finished','Project detail must use identical finished master');const c=v.crop;check(c.width>0&&c.height>0&&c.x>=0&&c.y>=0&&c.x+c.width<=1&&c.y+c.height<=1,'Invalid crop '+id);}}
 for(const u of i.instructionUnits){check(!!a.paintedStudies[a.artworkForUnit[u.id]],'Missing unit artwork '+u.id);check(manifest.placements.some(p=>p.unitId===u.id&&p.viewId===a.artworkForUnit[u.id]),'Missing placement '+u.id);}
 const reachable=new Set([...Object.values(a.artworkForUnit),...Object.values(a.supportingArtwork),...Object.values(a.styleArtwork)]);for(const id of Object.keys(a.paintedStudies))check(reachable.has(id),'Unreachable study '+id);
 check(load('learning/media.ts').mediaResources.length===0,'Approved catalogue must remain empty');
 check(load('learning/videoPreviewCatalogue.ts').previewCandidates.length===17,'All 17 preview identities required');
 const crosswalk=i.instructionUnits.map(u=>({lessonId:u.lessonId,stepId:u.stepId,unitId:u.id,objective:u.outcome,exercise:u.exercise,artworkId:a.artworkForUnit[u.id],activeMinutes:u.minutes,noVideo:!i.contextualVideoLinks.some(l=>l.unitId===u.id),previews:i.contextualVideoLinks.filter(l=>l.unitId===u.id).map(l=>{const r=i.resolveInstructionVideo(l,u);check(!!r,'Unresolvable preview '+l.id);return r?{referenceId:l.id,candidateId:r.candidate.id,videoId:r.candidate.videoId,url:r.candidate.url,windowId:l.windowId,startSeconds:r.window?.start??0,endSeconds:r.window?.end??null,provenance:r.window?.source??'unknown',scope:l.scope,believedTopic:l.suggestedRelevance,requiresDirectVerification:l.verify,independentlyInspected:false,productionApproved:false}:{};})}));
 return {status:errors.length?'FAIL':'PASS',units:i.instructionUnits.length,canonicalSteps:items.reduce((n,x)=>n+x.steps.length,0),diagnostics:i.instructionDiagnostics.length,previews:i.contextualVideoLinks.length,sources:manifest.sources.length,views:Object.keys(a.paintedStudies).length,errors,crosswalk};
}
if(require.main===module){const result=validate();if(process.argv.includes('--write')&&!result.errors.length)fs.writeFileSync('docs/review/visual-video-learning-crosswalk.json',JSON.stringify({schema:'visual-video-learning-crosswalk/v1',units:result.crosswalk},null,2)+'\n');const {crosswalk,...summary}=result;console.log(JSON.stringify(summary,null,2));if(result.errors.length)process.exitCode=1;}
module.exports=validate;
