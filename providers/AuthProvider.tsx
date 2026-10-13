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
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, next) => {
      if (alive) {
        setSession(next);
        setLoading(false);
      }
    });
    supabase.auth
      .getSession()
      .then(({ data, error: problem }) => {
        if (alive) {
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
        if (alive) {
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
    return () => {
      alive = false;
      subscription.unsubscribe();
      appState?.remove();
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
