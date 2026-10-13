import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { colors } from "../components/ui";
export const unstable_settings = { initialRouteName: "(tabs)" };
export default function RootLayout() {
  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.ink,
          headerBackTitle: "Back",
          headerShadowVisible: false,
          headerTitleAlign: "center",
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="upload/improve-painting"
          options={{ title: "Improve Painting" }}
        />
        <Stack.Screen
          name="upload/create-reference"
          options={{ title: "Create Painting Reference" }}
        />
        <Stack.Screen
          name="result/improve-painting"
          options={{ title: "Painting feedback" }}
        />
        <Stack.Screen
          name="result/create-reference"
          options={{ title: "Painting reference" }}
        />
      </Stack>
    </>
  );
}
