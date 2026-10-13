import { View } from "react-native";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "../../components/ui";
export default function TabLayout() {
  const insets = useSafeAreaInsets();
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerShadowVisible: false,
        headerTitleAlign: "center",
        headerTintColor: colors.ink,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: colors.paper,
          width: "100%",
          maxWidth: 430,
          alignSelf: "center",
          height: 66 + Math.max(insets.bottom, 12),
          paddingTop: 8,
          paddingBottom: Math.max(insets.bottom, 12),
        },
        tabBarLabelStyle: { fontSize: 12, fontWeight: "600" },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size, focused }) => (
            <View
              style={{
                backgroundColor: focused ? colors.pale : "transparent",
                paddingHorizontal: 14,
                paddingVertical: 4,
                borderRadius: 12,
              }}
            >
              <Ionicons
                name={focused ? "home" : "home-outline"}
                color={color}
                size={size}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="artworks"
        options={{
          title: "My Artworks",
          tabBarIcon: ({ color, size, focused }) => (
            <View
              style={{
                backgroundColor: focused ? colors.pale : "transparent",
                paddingHorizontal: 14,
                paddingVertical: 4,
                borderRadius: 12,
              }}
            >
              <Ionicons
                name={focused ? "images" : "images-outline"}
                color={color}
                size={size}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="practice"
        options={{
          title: "Practice",
          tabBarIcon: ({ color, size, focused }) => (
            <View
              style={{
                backgroundColor: focused ? colors.pale : "transparent",
                paddingHorizontal: 14,
                paddingVertical: 4,
                borderRadius: 12,
              }}
            >
              <Ionicons
                name={focused ? "brush" : "brush-outline"}
                color={color}
                size={size}
              />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}
