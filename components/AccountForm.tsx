import { useState } from "react";
import { Link } from "expo-router";
import { Text, TextInput, View } from "react-native";
import { useAuth } from "../providers/AuthProvider";
import { requireSupabase } from "../lib/supabase";
import { Button, Screen, styles, colors } from "./ui";
export default function AccountForm({ signup = false }: { signup?: boolean }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const { error } = useAuth();
  async function submit() {
    if (busy) return;
    if (!email.trim() || !password || (signup && password.length < 8)) {
      setMessage(
        signup
          ? "Enter your email and a password of at least 8 characters."
          : "Enter your email and password.",
      );
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      const client = requireSupabase();
      const result = signup
        ? await client.auth.signUp({
            email: email.trim(),
            password,
            options: { data: { display_name: name.trim() } },
          })
        : await client.auth.signInWithPassword({
            email: email.trim(),
            password,
          });
      if (result.error) {
        setMessage(
          signup
            ? "We could not create your account. Check your details and try again."
            : "We could not sign you in. Check your email and password, or confirm your email first.",
        );
      } else if (signup && !result.data.session)
        setMessage(
          "Check your email to confirm your account. Then return here to sign in.",
        );
    } catch {
      setMessage("We could not connect. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }
  const input = {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 16,
    color: colors.ink,
    backgroundColor: colors.paper,
    fontSize: 16,
  };
  return (
    <Screen>
      <Text style={styles.title}>
        {signup ? "Create your account" : "Welcome back"}
      </Text>
      <Text style={styles.body}>
        Keep your paintings and feedback together.
      </Text>
      <View style={styles.card}>
        {signup && (
          <>
            <Text style={styles.caption}>Name (optional)</Text>
            <TextInput
              accessibilityLabel="Name"
              value={name}
              onChangeText={setName}
              maxLength={100}
              style={input}
              autoComplete="name"
            />
          </>
        )}
        <Text style={styles.caption}>Email</Text>
        <TextInput
          accessibilityLabel="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          style={input}
        />
        <Text style={styles.caption}>Password</Text>
        <TextInput
          accessibilityLabel="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
          autoComplete={signup ? "new-password" : "current-password"}
          style={input}
        />
        <Button
          title={busy ? "Please wait…" : signup ? "Sign up" : "Sign in"}
          onPress={submit}
          disabled={busy}
        />
        {(message || error) && (
          <Text accessibilityRole="alert" style={styles.body}>
            {message || error}
          </Text>
        )}
      </View>
      <Link
        href={signup ? "/auth/sign-in" : "/auth/sign-up"}
        style={{ color: colors.accent, fontSize: 16, paddingVertical: 12 }}
      >
        {signup
          ? "Already have an account? Sign in"
          : "New here? Create an account"}
      </Link>
    </Screen>
  );
}
