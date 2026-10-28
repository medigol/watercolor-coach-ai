import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AuthProvider, useAuth } from "../providers/AuthProvider";
import { LearningProvider } from "../providers/LearningProvider";
import { supabase } from "../lib/supabase";
import { Screen, styles, colors } from "../components/ui";
export const unstable_settings = { initialRouteName: "(tabs)" };
function AppRoutes() {
  const { session, loading } = useAuth();
  if (!supabase)
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <Screen>
          <Text style={styles.title}>Account setup needed</Text>
          <Text style={styles.body}>
            This preview is waiting for its account connection. Set
            EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY, then
            restart or rebuild the app.
          </Text>
          <Text style={styles.caption}>
            The repository README explains the setup. No private key is needed.
          </Text>
        </Screen>
      </SafeAreaView>
    );
  if (loading)
    return (
      <SafeAreaView
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors.background,
        }}
      >
        <ActivityIndicator color={colors.accent} />
        <Text style={styles.caption}>Opening your account…</Text>
      </SafeAreaView>
    );
  return (
    <Stack
      key={session?.user.id ?? "signed-out"}
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.ink,
        headerBackTitle: "Back",
        headerShadowVisible: false,
        headerTitleAlign: "center",
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Protected guard={!session}>
        <Stack.Screen name="auth/sign-in" options={{ title: "Sign in" }} />
        <Stack.Screen name="auth/sign-up" options={{ title: "Sign up" }} />
      </Stack.Protected>
      <Stack.Protected guard={!!session}>
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
          options={{ title: "Assessment", headerTitleStyle: { fontSize: 16 } }}
        />
        <Stack.Screen
          name="result/create-reference"
          options={{ title: "Painting reference" }}
        />
        <Stack.Screen name="account" options={{ title: "Account" }} />
      </Stack.Protected>
    </Stack>
  );
}
export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="dark" />
      <LearningProvider><AppRoutes /></LearningProvider>
    </AuthProvider>
  );
}
