import { useEffect, useState } from "react";
import { Text, View, useWindowDimensions } from "react-native";
import { landscapeSequence } from "../../learning/artwork";
import ArtworkStudy from "./ArtworkStudy";
import { Action, Copy, Heading, learnStyles } from "./LearningUI";

/** Bounded comparison, never an asserted physical process record. No progress writes. */
export default function LandscapeSequence() {
  const wide=useWindowDimensions().width>=768;
  const [position,setPosition]=useState(0),last=landscapeSequence.length-(wide?2:1);
  useEffect(()=>setPosition(n=>Math.min(n,last)),[last]);
  const start=Math.min(position,last),visible=landscapeSequence.slice(start,start+(wide?2:1));
  return <View testID="landscape-sequence" style={{gap:14}}>
    <Copy>Compare what is added while the ridge, house and river stay in place. The early states are illustrative reconstructions, not photographs of a painting process.</Copy>
    <View style={{flexDirection:"row",flexWrap:"wrap",gap:12}}>
      <Action title="Previous comparison" secondary disabled={start===0} onPress={()=>setPosition(n=>Math.max(0,n-1))} />
      <Action title="Next comparison" secondary disabled={start===last} onPress={()=>setPosition(n=>Math.min(last,n+1))} />
    </View>
    <Text role="status" accessibilityLiveRegion="polite" style={learnStyles.muted}>{start+1}{wide?`–${start+2}`:""} of {landscapeSequence.length} · {landscapeSequence[start].title}</Text>
    <View style={{flexDirection:wide?"row":"column",gap:16,alignItems:"flex-start"}}>
      {visible.map((stage,n)=><View key={`${start+n}:${stage.id}`} testID={`landscape-sequence-${start+n}`} style={{flex:wide?1:undefined,width:wide?undefined:"100%",gap:8,minWidth:0}}>
        <Heading level={3}>{stage.title}</Heading>
        <ArtworkStudy id={stage.id} />
      </View>)}
    </View>
    {start===last&&<Copy>Stop when your chosen relationships read. The final reference suggests selective description; it does not require every tree, reflection or grass mark.</Copy>}
  </View>;
}
