const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),ts=require('typescript');
const theme={};new Function('exports',ts.transpileModule(fs.readFileSync(path.join(__dirname,'../components/theme.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText)(theme);
// WCAG relative luminance for solid sRGB colors; independent of app rendering.
function luminance(hex){const rgb=hex.slice(1).match(/../g).map(h=>parseInt(h,16)/255).map(c=>c<=.04045?c/12.92:((c+.055)/1.055)**2.4);return rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722;}
function ratio(a,b){const x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);}
for(const surface of ['background','paper','pale','blue'])test('normal muted body/caption text has 4.5:1 contrast on '+surface,()=>assert(ratio(theme.colors.muted,theme.colors[surface])>=4.5));
test('main text has 4.5:1 contrast on paper',()=>assert(ratio(theme.colors.ink,theme.colors.paper)>=4.5));
test('enabled primary button text has 4.5:1 contrast',()=>assert(ratio('#FFFFFF',theme.colors.accent)>=4.5));

test('primary tab names remain readable without decorative icon glyphs',()=>{
  const exports={};
  const jsx={jsx:(type,props)=>({type,props}),jsxs:(type,props)=>({type,props})};
  const mocks={
    'react/jsx-runtime':jsx,
    'react-native':{Pressable:'Pressable',View:'View',useWindowDimensions:()=>({width:375})},
    'expo-router':{router:{push(){}},Tabs:Object.assign(()=>null,{Screen:'TabScreen'})},
    '@expo/vector-icons':{Ionicons:'Ionicons'},
    'react-native-safe-area-context':{useSafeAreaInsets:()=>({bottom:0})},
    '@react-navigation/bottom-tabs':{BottomTabBar:'BottomTabBar'},
    '../../components/learning/DesktopLearnNavigation':{default:'DesktopNavigation'},
    '../../components/ui':{colors:theme.colors},
  };
  const source=fs.readFileSync(path.join(__dirname,'../app/(tabs)/_layout.tsx'),'utf8');
  const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2020}}).outputText;
  new Function('exports','require',code)(exports,name=>{assert(name in mocks,name);return mocks[name];});
  const children=exports.default().props.children;
  for(const [route,label] of [['index','Home'],['learn','Learn'],['artworks','My Artworks']]){
    const tab=children.find(c=>c.props.name===route);
    assert.equal(tab.props.options.tabBarAccessibilityLabel,label);
  }
  assert.equal(children.find(c=>c.props.name==='practice').props.options.href,null);
});
