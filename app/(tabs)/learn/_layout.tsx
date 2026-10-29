import { Stack } from "expo-router";
import { colors } from "../../../components/theme";
export default function LearnLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.ink,
        headerShadowVisible: false,
        headerBackTitle: "Learn",
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="index" options={{ title: "Learn watercolour" }} />
      <Stack.Screen name="path" options={{ title: "My learning path" }} />
      <Stack.Screen
        name="curriculum"
        options={{ title: "Explore curriculum" }}
      />
      <Stack.Screen name="styles" options={{ title: "Style explorer" }} />
      <Stack.Screen
        name="onboarding"
        options={{ title: "Your learning preferences" }}
      />
      <Stack.Screen name="lesson" options={{ title: "Learning studio" }} />
      <Stack.Screen name="progress" options={{ title: "Learning progress" }} />
      <Stack.Screen name="videos" options={{ title: "Video Library — Preview" }} />
    </Stack>
  );
}
