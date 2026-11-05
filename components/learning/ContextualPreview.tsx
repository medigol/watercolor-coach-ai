import { useEffect, useRef, useState } from "react";
import { Linking, Platform, View } from "react-native";
import type { InstructionalUnit, InstructionVideoLink } from "../../learning/instructionTypes";
import { resolveInstructionVideo } from "../../learning/instruction";
import { videoLearningGuides } from "../../learning/videoLearning";
import { displayTime } from "../../learning/media";
import { Action, Copy, Disclosure, Heading, TextLink } from "./LearningUI";
import PreviewVideoPlayer from "./PreviewVideoPlayer";
import { studio } from "./design";

function questions(candidate:string):[string,string] {
  if(candidate==="paul-values")return ["Can you identify how the larger value families are grouped?","Where, if anywhere, does a small contrast change the first point of attention?"];
  if(candidate==="tim-perspective")return ["Which visible edges appear to share a direction in space?","Can you follow a large proportion or plane decision before smaller details?"];
  if(candidate==="cafe-cloud-tips")return ["What surface condition, if any, is visible before colour is added?","Can you identify a light passage that is left rather than repeatedly corrected?"];
  if(candidate==="louise-blend")return ["What can you actually see of the surface condition before the mark arrives?","Is the resulting boundary definite, gradual or genuinely disappearing?"];
  return ["Can you see how the brush is loaded or unloaded before a mark?","What, if any, liquid collects at the end or advancing edge?"];
}

/** Public, evidence-bound preview pathway. Never an approved MediaResource. */
export default function ContextualPreview({unit,link,active,onWatch,onPractice,onStop}:{unit:InstructionalUnit;link:InstructionVideoLink;active:boolean;onWatch:()=>void;onPractice:()=>void;onStop:()=>void}) {
  const target=useRef<View>(null),[linkError,setLinkError]=useState(false);
  useEffect(()=>{if(active&&Platform.OS==="web")requestAnimationFrame(()=>(target.current as unknown as HTMLElement|null)?.focus({preventScroll:true}));},[active]);
  const resolved=resolveInstructionVideo(link,unit);
  if(!resolved)return <Copy muted>This related preview is unavailable. Continue with the painted study and written exercise.</Copy>;
  const {candidate,window}=resolved;
  const scope=link.scope==="long-proposal"?"Longer overview; not a new short clip":link.scope==="chapter-hint"?"Publisher chapter hint":link.scope==="start-only"?"Proposed start; endpoint unknown":"Full original; exact timestamps pending";
  const time=window?`${displayTime(window.start)}${window.end===undefined?" onwards":`–${displayTime(window.end)}`}`:"Original video";
  const repeated=["wb-wash-steve","ql-steve-wash","ql-paul-values"].includes(link.id);
  async function original(){onStop();try{await Linking.openURL(candidate.url);}catch{setLinkError(true);}}
  return <View testID={`inline-reference-${link.id}`} style={{gap:10,paddingVertical:16,borderTopWidth:1,borderBottomWidth:1,borderColor:studio.colors.rule}}>
    <Heading level={3}>See a related approach</Heading>
    <Copy>{candidate.creator} · {videoLearningGuides[candidate.id].level}</Copy>
    <Copy muted>Proposed viewing: {time} · {scope}</Copy>
    <Copy muted>Related preview — exact action matching is still being reviewed.</Copy>
    <Copy>Questions to investigate</Copy>
    {questions(candidate.id).map(q=><Copy key={q}>• {q}</Copy>)}
    {repeated&&<Copy muted>This is the same broader overview referenced elsewhere, not a separately verified demonstration of this project.</Copy>}
    {!active&&<>
      <Action title={link.watchLabel} label="Watch related demonstration" testID={`watch-inline-${link.id}`} onPress={onWatch} />
      <Copy muted>Watch connects to YouTube. Viewing is optional and additional to painting and drying time.</Copy>
    </>}
    {active&&<View ref={target} tabIndex={-1} accessibilityLabel={`${candidate.creator} related preview`}>
      <PreviewVideoPlayer key={link.id} candidate={candidate} context={{lesson:unit.lessonId,step:unit.stepId}} initialWindowId={link.windowId} contextual initiallyRequested onWindowChange={()=>{}} onPractice={onPractice} />
    </View>}
    <View style={{flexDirection:"row",flexWrap:"wrap",gap:14}}>
      {!active&&<TextLink title="View original on YouTube" onPress={()=>void original()} />}
      <TextLink title="Go to this experiment" onPress={onPractice} />
    </View>
    {linkError&&<Copy muted>The original link could not open. The written exercise remains available here.</Copy>}
    <Disclosure title="Playback help and privacy">
      <Copy muted>The official player may still require Play. Use its CC, speed and fullscreen controls; caption availability depends on the source. Replay restores the proposed absolute boundaries, with approximate seeking. Watching never records painting practice.</Copy>
      <Copy muted>YouTube receives connection information when you choose Watch, including through its privacy-enhanced domain. No footage is downloaded or rehosted.</Copy>
      <TextLink title="YouTube privacy policy" onPress={()=>void Linking.openURL("https://policies.google.com/privacy")} />
      <TextLink title="YouTube terms" onPress={()=>void Linking.openURL("https://www.youtube.com/t/terms")} />
    </Disclosure>
  </View>;
}
