import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import { Platform } from "react-native";

const url = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim();
const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim();
const runtime = Platform.OS !== "web" || typeof window !== "undefined";
// Catch a privileged key accidentally placed in the public client setting.
// This only checks the JWT's declared role; it does not verify a signature.
function isPrivilegedKey(value: string) {
  if (/^sb_secret_/i.test(value)) return true;
  const parts = value.split(".");
  if (parts.length !== 3) return false;
  try {
    const alphabet =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    let payload = "";
    let bits = 0;
    let buffer = 0;
    const encoded = parts[1]
      .replace(/-/g, "+")
      .replace(/_/g, "/")
      .replace(/=+$/, "");
    for (const character of encoded) {
      const digit = alphabet.indexOf(character);
      if (digit < 0) return false;
      buffer = (buffer << 6) | digit;
      bits += 6;
      if (bits >= 8) {
        bits -= 8;
        payload += String.fromCharCode((buffer >> bits) & 255);
        buffer &= (1 << bits) - 1;
      }
    }
    const claims = JSON.parse(payload);
    return (
      claims !== null &&
      typeof claims === "object" &&
      "role" in claims &&
      claims.role !== "anon"
    );
  } catch {
    return false;
  }
}
const memory = new Map<string, string | null>();
const webStorage = {
  getItem: (name: string) => {
    if (memory.has(name)) return memory.get(name) ?? null;
    try {
      return globalThis.localStorage.getItem(name);
    } catch {
      return memory.get(name) ?? null;
    }
  },
  setItem: (name: string, value: string) => {
    try {
      globalThis.localStorage.setItem(name, value);
      memory.delete(name);
    } catch {
      memory.set(name, value);
    }
  },
  removeItem: (name: string) => {
    try {
      globalThis.localStorage.removeItem(name);
      memory.delete(name);
    } catch {
      memory.set(name, null);
    }
  },
};
function makeClient() {
  if (!url || !key || isPrivilegedKey(key)) return null;
  try {
    if (!["http:", "https:"].includes(new URL(url).protocol)) return null;
    return createClient(url, key, {
      auth: {
        storage: Platform.OS === "web" ? webStorage : AsyncStorage,
        persistSession: runtime,
        autoRefreshToken: runtime,
        detectSessionInUrl: Platform.OS === "web" && runtime,
      },
    });
  } catch {
    return null;
  }
}
export const supabase = makeClient();
export function requireSupabase() {
  if (!supabase) throw new Error("Account setup is not available yet.");
  return supabase;
}
