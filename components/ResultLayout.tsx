import type { ReactNode, Ref } from "react";
import { Platform, ScrollView, useWindowDimensions, View } from "react-native";
import { colors } from "./ui";

export default function ResultLayout({
  header,
  image,
  guidance,
  planning,
  painting,
  explore,
  imageRef,
  exploreRef,
}: {
  header: ReactNode;
  image: ReactNode;
  guidance: ReactNode;
  planning?: ReactNode;
  painting?: ReactNode;
  explore?: ReactNode;
  imageRef?: Ref<View>;
  exploreRef?: Ref<View>;
}) {
  const { width } = useWindowDimensions();
  const wide = Platform.OS === "web" && width >= 960;
  const column = { gap: 20, minWidth: 0, flex: 1 } as const;
  return (
    <ScrollView
      style={{ flex: 1, width: "100%", backgroundColor: colors.background }}
      contentContainerStyle={{
        alignItems: "center",
        padding: 20,
        paddingTop: 24,
        paddingBottom: 40,
      }}
    >
      <View
        testID="result-container"
        style={{ width: "100%", maxWidth: wide ? 1200 : 430, gap: 20 }}
      >
        <View style={{ gap: 14 }}>{header}</View>
        {wide ? (
          <View
            testID="result-columns"
            style={{ flexDirection: "row", alignItems: "flex-start", gap: 28 }}
          >
            <View testID="result-visual-column" style={column}>
              <View ref={imageRef}>{image}</View>
              {planning}
            </View>
            <View testID="result-advice-column" style={column}>
              {guidance}
              <View ref={exploreRef}>{explore}</View>
              {painting}
            </View>
          </View>
        ) : (
          <View style={{ gap: 20 }}>
            <View ref={imageRef}>{image}</View>
            {guidance}
            <View ref={exploreRef}>{explore}</View>
            {planning}
            {painting}
          </View>
        )}
      </View>
    </ScrollView>
  );
}
