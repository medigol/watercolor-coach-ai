// Public Expo values are embedded in exported JavaScript. Refuse recognizable
// privileged credentials before Expo runs, without echoing credential values.
function assertPublicSupabaseKey(value) {
  const key = value?.trim();
  if (!key) return;
  let restricted = /^sb_secret_/i.test(key);
  const parts = key.split(".");
  if (parts.length === 3) {
    try {
      const payload = JSON.parse(
        Buffer.from(parts[1], "base64url").toString("utf8"),
      );
      if (
        payload &&
        typeof payload === "object" &&
        Object.prototype.hasOwnProperty.call(payload, "role") &&
        payload.role !== "anon"
      )
        restricted = true;
    } catch {
      // Malformed or missing public configuration is handled by the app's
      // setup screen / Auth error state; this check prevents secret leakage.
    }
  }
  if (restricted) {
    throw new Error(
      "EXPO_PUBLIC_SUPABASE_ANON_KEY must contain a public anon or publishable key. Refusing to export a privileged credential.",
    );
  }
}
module.exports = { assertPublicSupabaseKey };
