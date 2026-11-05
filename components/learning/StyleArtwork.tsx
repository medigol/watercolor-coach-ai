import type { StyleId } from "../../learning/types";
import { styleArtwork } from "../../learning/artwork";
import ArtworkStudy from "./ArtworkStudy";
/** Original generated studies, individually authored for distinct visual decisions. */
export default function StyleArtwork({styleId}:{styleId:StyleId}) {
  return <ArtworkStudy id={styleArtwork[styleId]} caption={false} />;
}
