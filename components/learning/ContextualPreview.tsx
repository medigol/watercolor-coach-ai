import { useEffect, useRef, useState } from "react";
import { Linking, Platform, Pressable, Text, View } from "react-native";
import type { InstructionalUnit, InstructionVideoLink } from "../../learning/instructionTypes";
import { contextualVideoCard } from "../../learning/contextualVideo";
import { artworkForUnit } from "../../learning/artwork";
import { Action, Copy, Disclosure, TextLink, learnStyles } from "./LearningUI";
import ArtworkStudy from "./ArtworkStudy";
import PreviewVideoPlayer from "./PreviewVideoPlayer";
import { studio } from "./design";
import Svg, { Path } from "react-native-svg";

/** Public evidence-bound preview. Local artwork is never a source-video frame. */
export default function ContextualPreview({unit,link,active,onWatch,onPractice,onStop}:{unit:InstructionalUnit;link:InstructionVideoLink;active:boolean;onWatch:()=>void;onPractice:()=>void;onStop:()=>void}) {
  const target=useRef<View>(null),[linkError,setLinkError]=useState(false);
  useEffect(()=>{if(active&&Platform.OS==="web")requestAnimationFrame(()=>(target.current as unknown as HTMLElement|null)?.focus({preventScroll:true}));},[active]);
  const card=contextualVideoCard(link,unit);
  if(!card)return <Copy muted>This related preview is unavailable. Continue with the painted study and written exercise.</Copy>;
  const {candidate}=card;
  async function original(){onStop();try{await Linking.openURL(candidate.url);}catch{setLinkError(true);}}
  return <View testID={`inline-reference-${link.id}`} style={{gap:10,paddingVertical:14,borderTopWidth:1,borderBottomWidth:1,borderColor:studio.colors.rule}}>
    <View style={{flexDirection:"row",gap:12,alignItems:"flex-start"}}>
      {!active&&<Pressable accessibilityRole="button" accessibilityLabel={`Play related preview: ${card.title}; local illustration, not a video frame`} onPress={onWatch} testID={`poster-inline-${link.id}`} style={{width:96,minHeight:64,borderRadius:6,overflow:"hidden"}}>
        <View pointerEvents="none" aria-hidden accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <ArtworkStudy id={artworkForUnit[unit.id]} caption={false} />
          <View style={{position:"absolute",top:12,left:30,width:36,height:36,borderRadius:18,backgroundColor:studio.colors.ink,alignItems:"center",justifyContent:"center"}}><Svg width={16} height={18} viewBox="0 0 16 18" accessible={false} aria-hidden><Path d="M3 2L15 9L3 16Z" fill="#fff" /></Svg></View>
          <Text style={learnStyles.muted}>Local illustration</Text>
        </View>
      </Pressable>}
      <View style={{flex:1,minWidth:0,gap:3}}>
        <Text accessibilityRole="header" aria-level={3} style={{...learnStyles.body,fontSize:18,lineHeight:24,fontWeight:"600"}}>{card.title}</Text>
        <Copy muted>{candidate.creator}</Copy>
        <Copy muted>Proposed: {card.time}</Copy>
      </View>
    </View>
    <Copy>Look for: {card.lookFor}</Copy>
    {!active&&<Action title={link.watchLabel} label="Watch related preview" testID={`watch-inline-${link.id}`} onPress={onWatch} />}
    <Copy muted>Provisional · exact action match not verified.</Copy>
    {active&&<View ref={target} tabIndex={-1} accessibilityLabel={`${candidate.creator} related preview`}>
      <PreviewVideoPlayer key={link.id} candidate={candidate} context={{lesson:unit.lessonId,step:unit.stepId}} initialWindowId={link.windowId} contextual initiallyRequested onWindowChange={()=>{}} onPractice={onPractice} />
    </View>}
    <View style={{flexDirection:"row",flexWrap:"wrap",gap:14}}>
      {!active&&<TextLink title="View original on YouTube" onPress={()=>void original()} />}
      <TextLink title="Go to this experiment" onPress={onPractice} />
    </View>
    {linkError&&<Copy muted>The original link could not open. The written exercise remains available here.</Copy>}
    <Disclosure title="Video details and privacy">
      <Copy muted>{card.scope}. {card.provenance}</Copy>
      <Copy muted>Watch connects to YouTube, which receives connection information, including through its privacy-enhanced domain. No footage is downloaded or rehosted. Viewing is optional and additional to painting and drying time.</Copy>
      <Copy muted>The official player may still require Play. Use its CC, speed and fullscreen controls; caption availability depends on the source. Replay restores the proposed absolute boundaries with approximate seeking. Watching never records painting practice.</Copy>
      <TextLink title="YouTube privacy policy" onPress={()=>void Linking.openURL("https://policies.google.com/privacy")} />
      <TextLink title="YouTube terms" onPress={()=>void Linking.openURL("https://www.youtube.com/t/terms")} />
    </Disclosure>
  </View>;
}
