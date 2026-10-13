import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { AppState, Platform } from "react-native";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
const AuthContext = createContext<{
  session: Session | null;
  loading: boolean;
  error: string | null;
}>({ session: null, loading: true, error: null });
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    let alive = true;
    let authRevision = 0;
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, next) => {
      if (alive) {
        // Restoring an older session must never undo a newer sign-in/sign-out.
        if (event === "INITIAL_SESSION" && authRevision > 0) return;
        if (event !== "INITIAL_SESSION") authRevision += 1;
        setSession(next);
        if (event !== "INITIAL_SESSION" || next) setError(null);
        setLoading(false);
      }
    });
    supabase.auth
      .getSession()
      .then(({ data, error: problem }) => {
        if (alive && authRevision === 0) {
          setSession(data.session);
          setError(
            problem
              ? "We could not restore your sign-in. Please sign in again."
              : null,
          );
          setLoading(false);
        }
      })
      .catch(() => {
        if (alive && authRevision === 0) {
          setSession(null);
          setError("We could not restore your sign-in. Please sign in again.");
          setLoading(false);
        }
      });
    const appState =
      Platform.OS === "web"
        ? null
        : AppState.addEventListener("change", (state) => {
            if (state === "active") supabase?.auth.startAutoRefresh();
            else supabase?.auth.stopAutoRefresh();
          });
    if (Platform.OS !== "web") {
      if (AppState.currentState === "active") supabase.auth.startAutoRefresh();
      else supabase.auth.stopAutoRefresh();
    }
    return () => {
      alive = false;
      subscription.unsubscribe();
      appState?.remove();
      if (Platform.OS !== "web") supabase?.auth.stopAutoRefresh();
    };
  }, []);
  return (
    <AuthContext.Provider value={{ session, loading, error }}>
      {children}
    </AuthContext.Provider>
  );
}
export function useAuth() {
  return useContext(AuthContext);
}
