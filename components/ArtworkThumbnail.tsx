import { View } from "react-native";
import MiniWatercolorScene from "./MiniWatercolorScene";
import { colors } from "./theme";
export default function ArtworkThumbnail({
  harbour = true,
  small = false,
}: {
  harbour?: boolean;
  small?: boolean;
}) {
  return (
    <View
      style={{
        backgroundColor: colors.paper,
        padding: small ? 4 : 8,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 16,
        width: small ? 86 : "100%",
        overflow: "hidden",
      }}
    >
      <MiniWatercolorScene harbour={harbour} height={small ? 82 : 140} />
    </View>
  );
}
