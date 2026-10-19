const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),ts=require('typescript');
const theme={};new Function('exports',ts.transpileModule(fs.readFileSync(path.join(__dirname,'../components/theme.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText)(theme);
// WCAG relative luminance for solid sRGB colors; independent of app rendering.
function luminance(hex){const rgb=hex.slice(1).match(/../g).map(h=>parseInt(h,16)/255).map(c=>c<=.04045?c/12.92:((c+.055)/1.055)**2.4);return rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722;}
function ratio(a,b){const x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);}
for(const surface of ['background','paper','pale','blue'])test('normal muted body/caption text has 4.5:1 contrast on '+surface,()=>assert(ratio(theme.colors.muted,theme.colors[surface])>=4.5));
test('main text has 4.5:1 contrast on paper',()=>assert(ratio(theme.colors.ink,theme.colors.paper)>=4.5));
test('enabled primary button text has 4.5:1 contrast',()=>assert(ratio('#FFFFFF',theme.colors.accent)>=4.5));
