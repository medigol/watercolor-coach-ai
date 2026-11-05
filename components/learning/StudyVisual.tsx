import { Text, View } from "react-native";
import Svg, { Circle, G, Line, Path, Text as SvgText } from "react-native-svg";
import type { LessonStep } from "../../learning/types";
import { representativeArtwork } from "../../learning/artwork";
import { perspectiveGuide as p, planeCorners as c } from "../../learning/visualGuides";
import { learnStyles } from "./LearningUI";
import ArtworkStudy from "./ArtworkStudy";
export { default as StyleVisual } from "./StyleArtwork";

/** The normal learner example is painted raster artwork; no SVG scenery fallback. */
export default function StudyVisual({kind,caption=true}:{kind:LessonStep["visual"];caption?:boolean}) {
  return <ArtworkStudy id={representativeArtwork[kind]} caption={caption} />;
}

/** Secondary idealised construction only; never presented as the observed building. */
export function PerspectiveConstruction() {
  return <View style={{gap:8}}>
    <View accessibilityRole="image" accessibilityLabel="Technical two-point perspective construction: two edges on each plane converge toward that plane's own point. These coordinates do not measure the generated building." style={{width:"100%",aspectRatio:1.8,backgroundColor:"#F8F2E2",borderRadius:6,overflow:"hidden"}}>
      <Svg width="100%" height="100%" viewBox="0 0 600 330" aria-hidden accessible={false}>
        <Line x1={12} y1={p.horizon} x2={588} y2={p.horizon} stroke="#9AA79B" />
        {[p.left,p.right].map((vp,n)=><G key={n}>
          <Line x1={vp.x} y1={vp.y} x2={p.top.x} y2={p.top.y} stroke="#9A9A85" strokeDasharray="6 5" />
          <Line x1={vp.x} y1={vp.y} x2={p.bottom.x} y2={p.bottom.y} stroke="#9A9A85" strokeDasharray="6 5" />
          <Circle cx={vp.x} cy={vp.y} r={4} fill="#8E573F" />
          <SvgText x={vp.x} y={51} textAnchor="middle" fill="#253C3C" fontSize={16}>{n===0?"A":"B"}</SvgText>
        </G>)}
        <Path d={`M${c.leftTop.x} ${c.leftTop.y}L${p.top.x} ${p.top.y}V${p.bottom.y}L${c.leftBottom.x} ${c.leftBottom.y}Z`} fill="#D6C59E" fillOpacity={.55} stroke="#416961" strokeWidth={2} />
        <Path d={`M${p.top.x} ${p.top.y}L${c.rightTop.x} ${c.rightTop.y}L${c.rightBottom.x} ${c.rightBottom.y}L${p.bottom.x} ${p.bottom.y}Z`} fill="#89A49A" fillOpacity={.55} stroke="#416961" strokeWidth={2} />
        <SvgText x={300} y={307} textAnchor="middle" fill="#253C3C" fontSize={17}>One viewpoint · two receding directions</SvgText>
      </Svg>
    </View>
    <Text style={learnStyles.muted}>Idealised construction aid. Observe your own subject; these points are not measurements from the painted example.</Text>
  </View>;
}
