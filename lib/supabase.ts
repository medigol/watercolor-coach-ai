import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import { Platform } from "react-native";

const url = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim();
const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim();
const runtime = Platform.OS !== "web" || typeof window !== "undefined";
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
  if (!url || !key) return null;
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
