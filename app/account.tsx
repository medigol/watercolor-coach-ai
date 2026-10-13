import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { useAuth } from "../providers/AuthProvider";
import { requireSupabase } from "../lib/supabase";
import { Button, Screen, styles } from "../components/ui";
export default function Account() {
  const { session } = useAuth();
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const userId = session?.user.id;
  useEffect(() => {
    let alive = true;
    setName("");
    async function loadName() {
      if (!userId) return;
      try {
        const { data, error: problem } = await requireSupabase()
          .from("profiles")
          .select("display_name")
          .eq("id", userId)
          .maybeSingle();
        if (alive && !problem && typeof data?.display_name === "string")
          setName(data.display_name);
      } catch {
        // The account and sign-out remain usable when the profile is unavailable.
      }
    }
    void loadName();
    return () => {
      alive = false;
    };
  }, [userId]);
  async function signout() {
    setBusy(true);
    setError("");
    try {
      const { error } = await requireSupabase().auth.signOut({
        scope: "local",
      });
      if (error) setError("We could not sign you out. Please try again.");
    } catch {
      setError("We could not sign you out. Please try again.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <Screen>
      <Text style={styles.title}>Your account</Text>
      <View style={styles.card}>
        {!!name && <Text style={styles.heading}>{name}</Text>}
        <Text style={styles.body}>{session?.user.email}</Text>
        <Text style={styles.caption}>
          Your artwork images are stored privately in your account.
        </Text>
      </View>
      <Button
        title={busy ? "Signing out…" : "Sign out"}
        onPress={signout}
        disabled={busy}
      />
      {!!error && (
        <Text accessibilityRole="alert" style={styles.body}>
          {error}
        </Text>
      )}
    </Screen>
  );
}
