import { useRef, type ReactNode } from "react";
import { Platform, Text, View, useWindowDimensions } from "react-native";
import type { InstructionalUnit as Unit } from "../../learning/instructionTypes";
import type { LearningProfile } from "../../learning/types";
import { contextualVideoLinks, instructionDiagnostics } from "../../learning/instruction";
import { subjectLabels } from "../../learning/catalogue";
import { Action, Copy, Disclosure, Heading, TextLink, learnStyles } from "./LearningUI";
import InstructionVisual from "./InstructionVisual";
import ArtworkStudy from "./ArtworkStudy";
import ContextualPreview from "./ContextualPreview";
import LandscapeSequence from "./LandscapeSequence";
import { artworkForUnit, supportingArtwork } from "../../learning/artwork";
import { studio } from "./design";

export function InstructionalUnitContent({ unit, group, onSelect, profile, activePreview, onPreview, practiceRecord, approvedMedia }: {
  unit: Unit; group: Unit[]; onSelect: (id:string)=>void; profile:LearningProfile|null;
  activePreview:string|null; onPreview:(id:string|null)=>void; practiceRecord:ReactNode; approvedMedia?:ReactNode;
}) {
  const exercise=useRef<View>(null), video=useRef<View>(null), explanation=useRef<View>(null);
  const wide=useWindowDimensions().width>=studio.desktop;
  const n=group.findIndex(u=>u.id===unit.id), experienced=profile?.experience==="intermediate"||profile?.experience==="advanced";
  const links=contextualVideoLinks.filter(l=>l.unitId===unit.id);
  function mediaPosition(){if(Platform.OS==="web"){const node=video.current as unknown as HTMLElement|null;node?.scrollIntoView({block:"start",behavior:"instant"});node?.focus({preventScroll:true});}}
  function returnToExplanation() {
    onPreview(null);
    if (Platform.OS === "web") {
      const node = explanation.current as unknown as HTMLElement | null;
      node?.scrollIntoView({block:"start",behavior:"instant"});
      node?.focus({preventScroll:true});
    } else onSelect(unit.id);
  }
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
    <View ref={explanation} nativeID="teaching-focus-start" testID="unit-goal" tabIndex={-1} accessibilityLabel={unit.title} style={{gap:6}}>
      {group.length > 1 && <>
        <Text style={learnStyles.label}>Focus {n+1} of {group.length} · {unit.minutes.reading+unit.minutes.practice} active minutes</Text>
        <Heading level={3}>{unit.title}</Heading>
      </>}
      <Copy>{unit.outcome}</Copy>
    </View>
    <View testID="concept-and-painting" style={{flexDirection:wide?"row":"column",alignItems:"flex-start",gap:wide?28:16}}>
      <View testID="unit-concept" style={{gap:12,flex:wide?1:undefined,width:wide?undefined:"100%",minWidth:0}}>
        <Copy>{unit.concept}</Copy>
        {experienced ? <Disclosure title="Review the basic terms"><Copy>{unit.beginnerTerm}</Copy></Disclosure> : <Copy muted>{unit.beginnerTerm}</Copy>}
        {Platform.OS==="web"&&(!!approvedMedia||!!links.length)&&<TextLink title="Go to the related demonstration" onPress={mediaPosition} />}
      </View>
      <View style={{flex:wide?1:undefined,width:wide?undefined:"100%",minWidth:0}}>
        <ArtworkStudy key={unit.id} id={artworkForUnit[unit.id]} eager />
        {supportingArtwork[unit.id]&&<Disclosure title="Compare the related study"><ArtworkStudy id={supportingArtwork[unit.id]} /></Disclosure>}
        {unit.lessonId==="quiet-landscape"&&["intention","finish"].includes(unit.stepId)&&<Disclosure title="Compare the landscape sequence"><LandscapeSequence /></Disclosure>}
      </View>
    </View>
    <View style={{width:"100%",maxWidth:780,alignSelf:"center",gap:18}}>
    <View testID="unit-preparation"><Copy><Text style={{fontWeight:"600"}}>Prepare: </Text>{unit.setup}</Copy></View>
    <View testID="current-practical-action" style={{gap:10}}>
      <Heading level={3}>At the paper</Heading>
      {unit.actions.map((a,i)=><Copy key={a}>{i+1}. {a}</Copy>)}
    </View>
    {(!!approvedMedia||!!links.length)&&<View ref={video} tabIndex={-1} accessibilityLabel="Contextual demonstration" testID="contextual-video" style={{gap:14}}>
      {approvedMedia?<View testID="approved-demonstration">{approvedMedia}</View>:links.map(link=><ContextualPreview key={link.id} unit={unit} link={link} active={activePreview===link.id} onWatch={()=>onPreview(link.id)} onPractice={practise} onStop={()=>onPreview(null)} />)}
    </View>}
    <View testID="studio-observation" style={{gap:6,borderLeftWidth:3,borderColor:studio.colors.clay,paddingLeft:14}}>
      <Text style={learnStyles.label}>Observe</Text><Copy>{unit.observe}</Copy>
    </View>
    <View ref={exercise} testID="unit-exercise" tabIndex={-1} accessibilityLabel="Current controlled experiment" style={{gap:10,paddingVertical:12}}>
      <Heading level={3}>Try it on paper</Heading>
      <Copy>{unit.exercise.action}</Copy>
      <Copy muted>Change: {unit.exercise.variable}. Keep similar: {unit.exercise.constants.join(" · ")}.</Copy>
      {unit.exercise.success.map(s=><Copy key={s}>Look for: {s}</Copy>)}
      <Copy muted>{unit.drying}</Copy>
      <Copy>{unit.exercise.transfer}</Copy>
      {profile && <Copy muted>For your {subjectLabels[profile.subject].toLowerCase()} study, begin with one small shape.</Copy>}
    </View>
    {experienced && <View style={{gap:6}}><Heading level={3}>Decision to explore</Heading><Copy>{unit.advanced}</Copy></View>}
    {!!unit.diagnosticIds.length && <View testID="inline-diagnostics" style={{gap:10}}>
      <Heading level={3}>{unit.topic === "diagnosis" ? "Diagnose a result" : "If the result differs"}</Heading>
      <TroubleshootingGuide ids={unit.diagnosticIds} />
    </View>}
    <InstructionalUnitReference unit={unit} profile={profile} />
    <View testID="unit-practice-record" style={{gap:8}}>
      <Heading level={3}>Step practice record</Heading>
      <Copy muted>Tick the activities you have actually done across this step.</Copy>
      {practiceRecord}
    </View>
    <View testID="unit-focus-navigation" style={{gap:8}}>
      {n<group.length-1&&<Copy muted>Next: {group[n+1].transition}</Copy>}
      <View style={{flexDirection:"row",flexWrap:"wrap",gap:12}}>
        {n>0&&<TextLink title="Previous teaching focus" onPress={()=>onSelect(group[n-1].id)} />}
        {n<group.length-1&&<Action title="Next teaching focus" label={`Next: ${group[n+1].title}`} secondary onPress={()=>onSelect(group[n+1].id)} />}
        <TextLink title="Back to explanation" onPress={returnToExplanation} />
      </View>
      {group.length>1 && <Disclosure title="Teaching focuses in this step">
        {group.map((u,i)=><TextLink key={u.id} title={`Focus ${i+1}: ${u.title}`} onPress={()=>onSelect(u.id)} />)}
      </Disclosure>}
      <Copy muted>{(profile?.minutes??15)<unit.minutes.reading+unit.minutes.practice ? "Pause and return rather than rushing a wet passage." : "One focus can be enough for a short visit."}</Copy>
    </View>
    </View>
  </View>;
}
export function InstructionalUnitReference({unit,profile}:{unit:Unit;profile:LearningProfile|null}) {
  return <View style={{gap:16}}>
    <Disclosure title="Why this works and instructor’s tip"><Copy>{unit.why}</Copy><Copy>{unit.tip}</Copy>
      {!(profile?.experience==="intermediate"||profile?.experience==="advanced")&&<><Copy muted>Optional variation</Copy><Copy>{unit.advanced}</Copy></>}
    </Disclosure>
    {unit.illustration&&["variables","brush","wash","moisture","drawing"].includes(unit.illustration)&&<Disclosure title="Secondary technical aid"><InstructionVisual kind={unit.illustration} /></Disclosure>}
  </View>;
}

/** Optional per-symptom depth; the diagnosis focus exposes this directly. */
function TroubleshootingGuide({ids}:{ids:readonly string[]}) {
  return <View style={{gap:8}}>{ids.map(id=>{
    const d=instructionDiagnostics.find(d=>d.id===id)!;
    return <Disclosure key={id} title={d.symptom}>
      <Copy>Possible causes: {d.causes.join("; ")}.</Copy><Copy>Check: {d.check}</Copy>
      <Copy>Safest next action: {d.correction}</Copy><Copy>Stop and start fresh: {d.stop}</Copy><Copy muted>{d.normalVariation}</Copy>
    </Disclosure>;
  })}</View>;
}
