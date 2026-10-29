import { Pressable, Text, View } from "react-native";
import StudyVisual from "./StudyVisual";
import { colors } from "../theme";
import Svg, { Path } from "react-native-svg";
import type { LessonStep } from "../../learning/types";

/** Local teaching illustration: no thumbnail/tracking request before consent,
 * no copied video still and no overlay on the official player itself. */
export default function VideoPlayPoster({ visual, title, onPress }: {
  visual: LessonStep["visual"]; title: string; onPress: () => void;
}) {
  return <Pressable accessibilityRole="button" accessibilityLabel={title}
    onPress={onPress} testID="watch-video-poster"
    style={({ pressed }) => ({ borderRadius: 14, overflow: "hidden", backgroundColor: colors.paper, opacity: pressed ? 0.85 : 1 })}>
    <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" aria-hidden={true}>
      <StudyVisual kind={visual} caption={false} />
      <View style={{ position: "absolute", top: "30%", alignSelf: "center", borderRadius: 36, width: 64, height: 64, backgroundColor: colors.accent, alignItems: "center", justifyContent: "center" }}>
        <Svg width={28} height={30} viewBox="0 0 28 30" aria-hidden={true} accessible={false}><Path fill="#fff" d="M5 3L25 15L5 27Z" /></Svg>
      </View>
    </View>
    <View style={{ paddingHorizontal: 16, paddingVertical: 14, gap: 3, backgroundColor: colors.accent }}>
      <Text style={{ color: "#fff", fontSize: 16, lineHeight: 24, fontWeight: "600" }}>{title}</Text>
      <Text style={{ color: "#fff", fontSize: 12, lineHeight: 18 }}>Topic illustration · not a video still</Text>
    </View>
  </Pressable>;
}
