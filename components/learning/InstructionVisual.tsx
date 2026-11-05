import { useId } from "react";
import { Text, View } from "react-native";
import Svg, { Defs, LinearGradient, Stop, Rect, Path, Line, Text as Label } from "react-native-svg";
import StudyVisual, { PerspectiveConstruction } from "./StudyVisual";
import type { LessonStep } from "../../learning/types";
import { learnStyles } from "./LearningUI";
import type { InstructionVisual as Kind } from "../../learning/instructionTypes";
const descriptions: Partial<Record<Kind,string>> = {
  variables: "Three independent controls: pigment concentration in the palette, liquid load held in the brush, and moisture already in the paper. In a comparison, change one and keep the other two similar.",
  brush: "The pointed tip makes a narrow contact; the fuller belly carries liquid and can make a broad contact. A lightly loaded mark differs from a large end pool. Contact diagrams do not prescribe a universal angle or pressure.",
  wash: "Three successive passes overlap at their still-wet advancing edge. A small bead sits at the edge; an excessive pool is removed only while the whole passage remains workable. Arrows indicate order, not scrubbing.",
  moisture: "Dry paper can hold a definite boundary; evenly damp paper permits a gradual spread. Standing water is a separate surface condition. These are conceptual comparisons, not measured timings or photographs.",
};
export default function InstructionVisual({kind}:{kind:Kind}) {
  const id=useId().replace(/:/g,"");
  if(kind==="drawing") return <PerspectiveConstruction />;
  if (["water","values","edges","drawing","landscape"].includes(kind)) return <StudyVisual kind={kind as LessonStep["visual"]} />;
  return <View style={{gap:8}}>
    <View accessibilityRole="image" accessibilityLabel={descriptions[kind]} style={{width:"100%",aspectRatio:1.8,backgroundColor:"#F8F2E2",borderRadius:10,overflow:"hidden"}}>
      <Svg width="100%" height="100%" viewBox="0 0 600 330" aria-hidden accessible={false}>
        <Defs><LinearGradient id={id} x1="0" y1="0" x2="1" y2="0"><Stop offset="0" stopColor="#286760"/><Stop offset=".65" stopColor="#5A8D83"/><Stop offset="1" stopColor="#F8F2E2"/></LinearGradient></Defs>
        {kind==="variables" && <>
          {[0,1,2].map(n=><Rect key={n} x={35+n*64} y={65} width={47} height={100} rx={8} fill="#286760" opacity={1-n*.32}/>)}
          <Path d="M285 55L310 155L330 155L355 55Z" fill="#B38A50"/><Path d="M310 155Q300 207 320 237Q340 207 330 155" fill="#286760"/>
          <Rect x={404} y={66} width={153} height={165} rx={9} fill="#B3CCCA"/><Path d="M418 130Q457 110 493 130T550 128" stroke="#FFF" strokeWidth={8} fill="none"/>
          <Label x={35} y={270} fontSize={21} fill="#253C3C">Mixture</Label><Label x={271} y={270} fontSize={21} fill="#253C3C">Brush load</Label><Label x={408} y={270} fontSize={21} fill="#253C3C">Paper</Label>
          <Label x={35} y={304} fontSize={17} fill="#253C3C">Change ONE control; compare after drying.</Label>
        </>}
        {kind==="brush" && <>
          <Path d="M100 35L140 40L170 157L134 170Z" fill="#B38A50"/><Path d="M134 170Q118 222 163 261Q188 216 170 157Z" fill="#286760"/>
          <Line x1={164} y1={260} x2={210} y2={280} stroke="#253C3C"/><Label x={215} y={288} fontSize={20} fill="#253C3C">tip</Label>
          <Line x1={144} y1={203} x2={225} y2={191} stroke="#253C3C"/><Label x={232} y={196} fontSize={20} fill="#253C3C">belly</Label>
          <Path d="M370 88H543" stroke="#286760" strokeWidth={5}/><Label x={365} y={65} fontSize={18} fill="#253C3C">Light tip contact</Label>
          <Path d="M370 155Q450 145 545 154" stroke="#286760" strokeWidth={28}/><Label x={365} y={126} fontSize={18} fill="#253C3C">More belly contact</Label>
          <Path d="M370 252H510" stroke="#5A8D83" strokeWidth={18}/><Path d="M512 238Q551 232 554 255Q549 280 511 268Z" fill="#286760"/>
          <Label x={365} y={303} fontSize={18} fill="#253C3C">End pool: reduce load</Label>
        </>}
        {kind==="wash" && <>
          {[0,1,2].map(n=><Rect key={n} x={65} y={48+n*66} width={355} height={75} fill="#669B91" opacity={.62}/>)}
          {[0,1,2].map(n=><Label key={n} x={30} y={88+n*66} fontSize={24} fill="#253C3C">{n+1}</Label>)}
          <Path d="M65 251H420" stroke="#286760" strokeWidth={9}/><Line x1={398} y1={190} x2={458} y2={166} stroke="#253C3C"/>
          <Label x={437} y={147} fontSize={18} fill="#253C3C">Wet join</Label><Label x={435} y={256} fontSize={18} fill="#253C3C">Small bead</Label>
          <Label x={65} y={300} fontSize={19} fill="#253C3C">Join the next pass before the edge sets.</Label>
        </>}
        {kind==="moisture" && <>
          <Rect x={35} y={75} width={155} height={150} fill="#286760"/>
          <Rect x={226} y={75} width={155} height={150} fill={`url(#${id})`}/>
          <Rect x={418} y={75} width={145} height={150} fill="#B3CCCA"/><Path d="M437 130Q471 103 540 131M438 169Q477 146 540 167" stroke="#FFF" strokeWidth={9} fill="none"/>
          <Label x={35} y={264} fontSize={19} fill="#253C3C">Dry: definite</Label><Label x={223} y={264} fontSize={19} fill="#253C3C">Damp: spread</Label><Label x={415} y={264} fontSize={19} fill="#253C3C">Standing water</Label>
          <Label x={35} y={307} fontSize={17} fill="#253C3C">Little sheen does not prove the sheet is fully dry.</Label>
        </>}
      </Svg>
    </View>
    <Text style={learnStyles.muted}>{descriptions[kind]} Original teaching diagram.</Text>
  </View>;
}
