import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "./AuthProvider";
import {
  decodeProgress,
  emptyProgress,
  LearningStore,
} from "../learning/progress";
import type { LearnerProgress } from "../learning/types";
const storage = {
  async getItem(key: string) {
    return Platform.OS === "web"
      ? window.localStorage.getItem(key)
      : AsyncStorage.getItem(key);
  },
  async setItem(key: string, value: string) {
    if (Platform.OS === "web") window.localStorage.setItem(key, value);
    else await AsyncStorage.setItem(key, value);
  },
};
interface LearningContextValue {
  state: LearnerProgress;
  loading: boolean;
  loadError: string | null;
  saveError: string | null;
  saving: boolean;
  saved: boolean;
  update: (change: (state: LearnerProgress) => LearnerProgress) => void;
  retry: () => void;
  reload: () => void;
  recover: () => void;
}
const Context = createContext<LearningContextValue | null>(null);
export function LearningProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const key = session ? `watercolor:learning:v1:${session.user.id}` : null;
  const [box, setBox] = useState<{
    key: string | null;
    state: LearnerProgress;
  }>({ key: null, state: emptyProgress() });
  const current = useRef(box);
  const store = useRef<LearningStore | null>(null);
  const revision = useRef(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);
  useEffect(() => {
    let alive = true;
    revision.current++;
    const next = { key, state: emptyProgress() };
    current.current = next;
    setBox(next);
    setLoading(!!key);
    setLoadError(null);
    setSaveError(null);
    setSaving(false);
    setSaved(false);
    if (!key) {
      store.current = null;
      return;
    }
    const local = new LearningStore(storage, key);
    store.current = local;
    local
      .load()
      .then((state) => {
        if (!alive) return;
        const loaded = { key, state };
        current.current = loaded;
        setBox(loaded);
        setLoading(false);
      })
      .catch(() => {
        if (alive) {
          setLoadError(
            "Learning progress could not be loaded. Existing data has been preserved. Retry before making changes, or keep a local backup and start fresh.",
          );
          setLoading(false);
        }
      });
    return () => {
      alive = false;
    };
  }, [key, reloadToken]);
  function persist(value: LearnerProgress) {
    const local = store.current;
    if (!key || !local || local.key !== key) return;
    const operation = ++revision.current;
    setSaving(true);
    setSaveError(null);
    setSaved(false);
    local
      .save(value)
      .then(() => {
        if (operation === revision.current && current.current.key === key) {
          setSaving(false);
          setSaved(true);
        }
      })
      .catch((error) => {
        if (operation === revision.current && current.current.key === key) {
          setSaving(false);
          setSaveError(
            error instanceof Error
              ? error.message
              : "Progress could not be saved. Retry before leaving.",
          );
        }
      });
  }
  function update(change: (state: LearnerProgress) => LearnerProgress) {
    if (loading || loadError || !key || current.current.key !== key) return;
    try {
      const value = {
        ...change(current.current.state),
        updatedAt: new Date().toISOString(),
      };
      decodeProgress(JSON.stringify(value));
      current.current = { key, state: value };
      setBox(current.current);
      persist(value);
    } catch (error) {
      setSaveError(
        error instanceof Error
          ? error.message
          : "Learning changes could not be saved.",
      );
    }
  }
  async function recover() {
    const local = store.current;
    if (!local || local.key !== key) return;
    setLoading(true);
    try {
      const state = await local.recoverWithBackup();
      if (store.current !== local) return;
      current.current = { key, state };
      setBox(current.current);
      setLoadError(null);
      setSaveError(null);
      setSaved(true);
    } catch {
      if (store.current === local)
        setLoadError(
          "The backup or fresh save failed. Existing learning data was not intentionally discarded. Free local storage and retry.",
        );
    } finally {
      if (store.current === local) setLoading(false);
    }
  }
  return (
    <Context.Provider
      value={{
        state: box.key === key ? box.state : emptyProgress(),
        loading: loading || box.key !== key,
        loadError,
        saveError,
        saving,
        saved,
        update,
        retry: () => persist(current.current.state),
        reload: () => setReloadToken((v) => v + 1),
        recover,
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useLearning() {
  const value = useContext(Context);
  if (!value) throw Error("LearningProvider is required");
  return value;
}
