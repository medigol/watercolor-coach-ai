import { Pressable, Text, View } from "react-native";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { colors } from "../theme";
import { studio } from "./design";
export default function DesktopLearnNavigation({
  state,
  navigation,
}: BottomTabBarProps) {
  return (
    <View
      testID="desktop-learn-nav"
      style={{
        backgroundColor: colors.paper,
        borderBottomWidth: 1,
        borderColor: studio.colors.rule,
        paddingHorizontal: 32,
      }}
    >
      <View
        style={{
          width: "100%",
          maxWidth: studio.measure,
          alignSelf: "center",
          minHeight: 68,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 24,
        }}
      >
        <Text
          style={{
            fontFamily: studio.type.display,
            fontSize: 22,
            color: colors.ink,
          }}
        >
          Watercolour studio
        </Text>
        <View
          role="tablist"
          accessibilityLabel="Main application"
          style={{ flexDirection: "row", gap: 28 }}
        >
          {state.routes
            .filter((r) => ["index", "learn", "artworks"].includes(r.name))
            .map((route) => {
              const selected = state.routes[state.index].key === route.key,
                title =
                  route.name === "index"
                    ? "Home"
                    : route.name === "learn"
                      ? "Learn"
                      : "My Artworks";
              return (
                <Pressable
                  key={route.key}
                  accessibilityRole="tab"
                  accessibilityLabel={title}
                  accessibilityState={{ selected }}
                  onPress={() => {
                    const e = navigation.emit({
                      type: "tabPress",
                      target: route.key,
                      canPreventDefault: true,
                    });
                    if (!e.defaultPrevented) navigation.navigate(route.name);
                  }}
                  style={{
                    minHeight: 64,
                    justifyContent: "center",
                    paddingHorizontal: 12,
                    borderBottomWidth: 3,
                    borderColor: selected ? colors.accent : "transparent",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 15,
                      fontWeight: selected ? "700" : "500",
                      color: colors.ink,
                    }}
                  >
                    {title}
                  </Text>
                </Pressable>
              );
            })}
        </View>
      </View>
    </View>
  );
}
