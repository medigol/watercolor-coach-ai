import { useEffect, useRef, type ReactNode } from "react";
import { Platform, Text, View } from "react-native";
import type { InstructionalUnit as Unit } from "../../learning/instructionTypes";
import type { LearningProfile } from "../../learning/types";
import { instructionVideoLinks, resolveInstructionVideo, waterDiagnostics } from "../../learning/instruction";
import { subjectLabels } from "../../learning/catalogue";
import { previewWindowSummary } from "../../learning/videoLearning";
import { Action, Copy, Disclosure, Heading, TextLink, learnStyles } from "./LearningUI";
import PreviewVideoPlayer from "./PreviewVideoPlayer";
import InstructionVisual from "./InstructionVisual";
import { studio } from "./design";

export function InstructionalUnitContent({ unit, group, onSelect, profile, activePreview, onPreview, practiceRecord }: {
  unit: Unit; group: Unit[]; onSelect: (id:string)=>void; profile:LearningProfile|null;
  activePreview:string|null; onPreview:(id:string|null)=>void; practiceRecord:ReactNode;
}) {
  const exercise=useRef<View>(null), video=useRef<View>(null);
  useEffect(() => {
    if (activePreview && Platform.OS === "web") requestAnimationFrame(() => (video.current as unknown as HTMLElement | null)?.focus({preventScroll:true}));
  }, [activePreview]);
  const n=group.findIndex(u=>u.id===unit.id), experienced=profile?.experience==="intermediate"||profile?.experience==="advanced";
  const links=instructionVideoLinks.filter(l=>l.unitId===unit.id);
  function practise() {
    onPreview(null);
    requestAnimationFrame(()=>{
      if(Platform.OS==="web") {
        const node=exercise.current as unknown as HTMLElement|null;
        node?.scrollIntoView({block:"nearest",behavior:"instant"});node?.focus({preventScroll:true});
      }
    });
  }
  return <View style={{gap:18}} testID="instructional-unit">
    <View style={{gap:6}}>
      {group.length > 1 && <>
        <Text style={learnStyles.label}>Focus {n+1} of {group.length} · {unit.minutes.reading+unit.minutes.practice} active minutes</Text>
        <Heading level={3}>{unit.title}</Heading>
      </>}
      <View testID="current-practical-action" style={{gap:8}}>
        <Text style={[learnStyles.body,{fontSize:20,lineHeight:28,fontWeight:"600"}]}>{unit.actions[0]}</Text>
      </View>
    </View>
    <View style={{gap:6}}><Copy muted>Step practice record · tick after doing these activities</Copy>{practiceRecord}</View>
    {group.length>1 && <Disclosure title="Teaching focuses in this step">
      <Copy muted>Reload resumes this step at its first teaching focus; focus navigation does not alter your checks or notes.</Copy>
      {group.map((u,i)=><TextLink key={u.id} title={`Focus ${i+1}: ${u.title}`} onPress={()=>onSelect(u.id)} />)}
    </Disclosure>}
    <Copy>{unit.outcome}</Copy>
    <Copy muted>{unit.transition}</Copy>
    <Copy><Text style={{fontWeight:"600"}}>Prepare: </Text>{unit.setup}</Copy>
    <Copy>{unit.concept}</Copy>
    {experienced ? <Disclosure title="Review the basic terms"><Copy>{unit.beginnerTerm}</Copy></Disclosure> : <Copy muted>{unit.beginnerTerm}</Copy>}
    {unit.actions.slice(1).map((a,i)=><Copy key={a}>{i+2}. {a}</Copy>)}
    {!!links.length && <View style={{gap:10,paddingVertical:12,borderTopWidth:1,borderColor:studio.colors.rule}} testID="contextual-video">
      <Copy muted>Related video preview — the exact demonstration is still being reviewed.</Copy>
      {links.map(link=>{
        const resolved=resolveInstructionVideo(link,unit);
        if(!resolved)return <Copy key={link.id} muted>This preview reference is unavailable. Continue with the written exercise.</Copy>;
        const {candidate}=resolved;
        return <View key={link.id} testID={`inline-reference-${link.id}`} style={{gap:8}}>
          <Copy>{candidate.creator}</Copy>
          <Copy muted>{link.suggestedRelevance} {activePreview !== link.id ? previewWindowSummary(candidate,link.windowId) : ""}</Copy>
          {activePreview !== link.id && <Action title={`Watch related preview: ${link.id}`} label={link.watchLabel} secondary onPress={()=>onPreview(link.id)} />}
          {activePreview===link.id && <View ref={video} tabIndex={-1} accessibilityLabel="Related video preview"><PreviewVideoPlayer key={link.id} candidate={candidate} context={{lesson:unit.lessonId,step:unit.stepId}} initialWindowId={link.windowId} contextual initiallyRequested onWindowChange={()=>{}} onPractice={practise} /></View>}
        </View>;
      })}
      <Copy muted>Watch contacts YouTube under its privacy practices. Viewing is optional and additional to the active exercise; a longer proposal may need a separate session. Your written guide is complete without it.</Copy>
    </View>}
    <View testID="studio-observation" style={{gap:6,borderLeftWidth:3,borderColor:studio.colors.clay,paddingLeft:14}}>
      <Text style={learnStyles.label}>Observe</Text><Copy>{unit.observe}</Copy>
    </View>
    {unit.topic === "diagnosis" && <View testID="inline-diagnostics" style={{gap:10}}><Heading level={3}>Diagnose a result</Heading><TroubleshootingGuide ids={unit.diagnosticIds} /></View>}
    <View ref={exercise} testID="unit-exercise" tabIndex={-1} accessibilityLabel="Current controlled experiment" style={{gap:10,paddingVertical:12}}>
      <Heading level={3}>Try it on paper</Heading>
      <Copy>{unit.exercise.action}</Copy>
      <Copy muted>Change: {unit.exercise.variable}. Keep similar: {unit.exercise.constants.join(" · ")}.</Copy>
      {unit.exercise.success.map(s=><Copy key={s}>Look for: {s}</Copy>)}
      <Copy muted>{unit.drying}</Copy>
      <Copy>{unit.exercise.transfer}</Copy>
      {profile && <Copy muted>Transfer this principle to your {subjectLabels[profile.subject].toLowerCase()} study; keep the first shape small. Your experience and confidence are self-reported.</Copy>}
    </View>
    {experienced && <View style={{gap:6}}><Heading level={3}>Decision to explore</Heading><Copy>{unit.advanced}</Copy></View>}
    <View style={{flexDirection:"row",flexWrap:"wrap",gap:12}}>
      {n>0&&<TextLink title="Previous teaching focus" onPress={()=>onSelect(group[n-1].id)} />}
      {n<group.length-1&&<Action title="Next teaching focus" secondary onPress={()=>onSelect(group[n+1].id)} />}
    </View>
    <Copy muted>{(profile?.minutes??15)<unit.minutes.reading+unit.minutes.practice ? "Pause this study and return; do not rush a wet passage." : "You can work on one focus per short visit."} The step checklist remains your practice record.</Copy>
  </View>;
}
export function InstructionalUnitReference({unit,profile}:{unit:Unit;profile:LearningProfile|null}) {
  return <View style={{gap:16}}>
    {unit.illustration&&<InstructionVisual kind={unit.illustration} />}
    <Heading level={3}>Why this works</Heading><Copy>{unit.why}</Copy>
    <Disclosure title="Instructor’s tip"><Copy>{unit.tip}</Copy></Disclosure>
    {!!unit.diagnosticIds.length && unit.topic !== "diagnosis" && <Disclosure title="Diagnose a result"><TroubleshootingGuide ids={unit.diagnosticIds} /></Disclosure>}
    {!(profile?.experience==="intermediate"||profile?.experience==="advanced")&&<Disclosure title="Explore a more deliberate variation"><Copy>{unit.advanced}</Copy></Disclosure>}
  </View>;
}

/** Optional per-symptom depth; the diagnosis focus exposes this directly. */
function TroubleshootingGuide({ids}:{ids:readonly string[]}) {
  return <View style={{gap:8}}>{ids.map(id=>{
    const d=waterDiagnostics.find(d=>d.id===id)!;
    return <Disclosure key={id} title={d.symptom}>
      <Copy>Possible causes: {d.causes.join("; ")}.</Copy><Copy>Check: {d.check}</Copy>
      <Copy>Safest next action: {d.correction}</Copy><Copy>Stop and start fresh: {d.stop}</Copy><Copy muted>{d.normalVariation}</Copy>
    </Disclosure>;
  })}</View>;
}
