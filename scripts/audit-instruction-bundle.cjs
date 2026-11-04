// Audit an ordinary configured export, never the deliberately synthetic QA export.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=process.argv[2];if(!root)throw Error('Usage: node scripts/audit-instruction-bundle.cjs <export-directory>');
const dir=path.join(root,'_expo/static/js/web');
const name=fs.readdirSync(dir).find(f=>f.startsWith('entry-')&&f.endsWith('.js'));if(!name)throw Error('No exported app entry found');
const bytes=fs.readFileSync(path.join(dir,name)),s=bytes.toString('utf8');
const {previewCandidates}=require('../tests/helpers/learning-loader.cjs')('learning/videoPreviewCatalogue.ts');
for(const c of previewCandidates)if(!s.includes(c.videoId))throw Error('Missing preview identity: '+c.id);
for(const marker of ['rawTimeFields','watchedRelevantPart','SYNTHETIC QA creator','abcDEF123_-'])if(s.includes(marker))throw Error('Private/QA marker in ordinary app export: '+marker);
if(!s.includes('inline-diagnostics'))throw Error('Final instructional route is absent');
console.log(JSON.stringify({status:'PASS',allCandidates:previewCandidates.length,privateAndSyntheticMediaAbsent:true,inlineInstructionPresent:true,entrySha256:crypto.createHash('sha256').update(bytes).digest('hex')},null,2));
