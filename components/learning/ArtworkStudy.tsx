import { useEffect, useRef, useState } from "react";
import { Image, PixelRatio, Platform, Text, View } from "react-native";
import type { ImageSourcePropType } from "react-native";
import { paintedStudies, type ArtworkId, type ArtworkSourceId, type PaintedStudy } from "../../learning/artwork";
import { Action, Copy, Disclosure, learnStyles } from "./LearningUI";

/** Literal requires keep Metro/native asset packaging and Pages base paths intact. */
const sources: Record<ArtworkSourceId, [ImageSourcePropType, ImageSourcePropType]> = {
  "brush-loading":[require("../../assets/learning/brush-loading-720.webp"),require("../../assets/learning/brush-loading-1440.webp")],
  "brush-contact":[require("../../assets/learning/brush-contact-720.webp"),require("../../assets/learning/brush-contact-1440.webp")],
  "flat-wash":[require("../../assets/learning/flat-wash-720.webp"),require("../../assets/learning/flat-wash-1440.webp")],
  "wet-edge":[require("../../assets/learning/wet-edge-720.webp"),require("../../assets/learning/wet-edge-1440.webp")],
  "dilution":[require("../../assets/learning/dilution-720.webp"),require("../../assets/learning/dilution-1440.webp")],
  "dry-damp":[require("../../assets/learning/dry-damp-720.webp"),require("../../assets/learning/dry-damp-1440.webp")],
  "pool-backrun":[require("../../assets/learning/pool-backrun-720.webp"),require("../../assets/learning/pool-backrun-1440.webp")],
  "intentional-texture":[require("../../assets/learning/intentional-texture-720.webp"),require("../../assets/learning/intentional-texture-1440.webp")],
  "value-subject":[require("../../assets/learning/value-subject-720.webp"),require("../../assets/learning/value-subject-1440.webp")],
  "value-plan":[require("../../assets/learning/value-plan-720.webp"),require("../../assets/learning/value-plan-1440.webp")],
  "value-alternative":[require("../../assets/learning/value-alternative-720.webp"),require("../../assets/learning/value-alternative-1440.webp")],
  "edge-boundaries":[require("../../assets/learning/edge-boundaries-720.webp"),require("../../assets/learning/edge-boundaries-1440.webp")],
  "edge-leaves":[require("../../assets/learning/edge-leaves-720.webp"),require("../../assets/learning/edge-leaves-1440.webp")],
  "structure-painted":[require("../../assets/learning/structure-painted-720.webp"),require("../../assets/learning/structure-painted-1440.webp")],
  "structure-plan":[require("../../assets/learning/structure-plan-720.webp"),require("../../assets/learning/structure-plan-1440.webp")],
  "quiet-landscape-finished":[require("../../assets/learning/quiet-landscape-finished-720.webp"),require("../../assets/learning/quiet-landscape-finished-1440.webp")],
  "landscape-value-plan":[require("../../assets/learning/landscape-value-plan-720.webp"),require("../../assets/learning/landscape-value-plan-1440.webp")],
  "landscape-palette":[require("../../assets/learning/landscape-palette-720.webp"),require("../../assets/learning/landscape-palette-1440.webp")],
  "landscape-preparation":[require("../../assets/learning/landscape-preparation-720.webp"),require("../../assets/learning/landscape-preparation-1440.webp")],
  "landscape-sky-stage":[require("../../assets/learning/landscape-sky-stage-720.webp"),require("../../assets/learning/landscape-sky-stage-1440.webp")],
  "landscape-hill-stage":[require("../../assets/learning/landscape-hill-stage-720.webp"),require("../../assets/learning/landscape-hill-stage-1440.webp")],
  "landscape-bank-stage":[require("../../assets/learning/landscape-bank-stage-720.webp"),require("../../assets/learning/landscape-bank-stage-1440.webp")],
  "style-atmospheric":[require("../../assets/learning/style-atmospheric-720.webp"),require("../../assets/learning/style-atmospheric-1440.webp")],
  "style-urban":[require("../../assets/learning/style-urban-720.webp"),require("../../assets/learning/style-urban-1440.webp")],
  "style-botanical":[require("../../assets/learning/style-botanical-720.webp"),require("../../assets/learning/style-botanical-1440.webp")],
  "style-expressive":[require("../../assets/learning/style-expressive-720.webp"),require("../../assets/learning/style-expressive-1440.webp")],
};

export default function ArtworkStudy({ id, caption = true, eager = false }: {id:ArtworkId; caption?:boolean; eager?:boolean}) {
  const study: PaintedStudy = paintedStudies[id];
  const frame = useRef<View>(null);
  const [width,setWidth]=useState(0),[seen,setSeen]=useState(eager||Platform.OS!=="web");
  const [failed,setFailed]=useState(false),[revision,setRevision]=useState(0);
  const crop=study.crop??{x:0,y:0,width:1,height:1};
  useEffect(()=>{
    if(eager||Platform.OS!=="web"||typeof IntersectionObserver==="undefined"){setSeen(true);return;}
    const node=frame.current as unknown as HTMLElement|null;
    if(!node)return;
    const observer=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){setSeen(true);observer.disconnect();}},{rootMargin:"240px"});
    observer.observe(node);return()=>observer.disconnect();
  },[eager,id]);
  const source=sources[study.sourceId][width*PixelRatio.get()/crop.width>720?1:0];
  return <View testID={`artwork-${id}`} style={{gap:8,width:"100%",minWidth:0}}>
    <View ref={frame} testID="painted-study" accessibilityRole={failed?undefined:"image"} accessibilityLabel={study.alt}
      onLayout={e=>setWidth(Math.round(e.nativeEvent.layout.width))}
      style={{width:"100%",aspectRatio:failed?undefined:1.5*crop.width/crop.height,minHeight:failed?180:undefined,overflow:"hidden",backgroundColor:"#F7F3EB",borderRadius:6}}>
      {failed?<View role="alert" style={{padding:16,gap:12}}>
        <Text style={learnStyles.body}>This study image could not load. The written exercise is still available.</Text>
        <Action title="Retry study image" secondary onPress={()=>{setFailed(false);setRevision(v=>v+1);}} />
      </View>:seen&&width>0&&<Image key={`${id}:${revision}`} source={source} accessible={false} aria-hidden
        onError={()=>setFailed(true)} resizeMode="stretch"
        style={{position:"absolute",width:`${100/crop.width}%`,height:`${100/crop.height}%`,left:`${-100*crop.x/crop.width}%`,top:`${-100*crop.y/crop.height}%`}} />}
    </View>
    {caption&&<>
      <Text style={learnStyles.muted}>{study.caption}</Text>
      <Text style={learnStyles.label}>{study.kind==="reconstructed-stage"?"Reconstructed stage · generated":study.crop?"Finished-study detail · generated":"Generated watercolour study"}</Text>
      <Disclosure title="About this study image">
        <Copy muted>{study.kind==="reconstructed-stage"?"This is an illustrative reconstructed stage of the generated reference, not a photograph of a physical painting process.":"This is an original generated watercolour study, not a scan of a physical painting or a video frame."}</Copy>
        <Copy muted>{study.teaches}</Copy>
      </Disclosure>
    </>}
  </View>;
}
