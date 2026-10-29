import { useEffect, useRef, useState } from "react";
import { Platform, Text, TextInput, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "../../providers/AuthProvider";
import { blankPreviewReview, decodePreviewReview, previewReviewExport, previewReviewKey, type PreviewCandidate, type PreviewReview } from "../../learning/videoPreview";
import { previewCandidates } from "../../learning/videoPreviewCatalogue";
import { Action, Choices, Copy, Disclosure, learnStyles } from "./LearningUI";

const storage = {
  get(key: string) { return Platform.OS === "web" ? Promise.resolve(window.localStorage.getItem(key)) : AsyncStorage.getItem(key); },
  set(key: string, value: string) { return Platform.OS === "web" ? Promise.resolve(window.localStorage.setItem(key, value)) : AsyncStorage.setItem(key, value); },
};
export default function PreviewReviewForm(props: { candidate: PreviewCandidate; selectedWindow: string }) {
  const { session } = useAuth();
  return session ? <LocalForm key={`${session.user.id}:${props.candidate.id}`} {...props} accountId={session.user.id} /> : null;
}
function LocalForm({ candidate, selectedWindow, accountId }: { candidate: PreviewCandidate; selectedWindow: string; accountId: string }) {
  const [draft, setDraft] = useState(() => blankPreviewReview(candidate.id));
  const [loading, setLoading] = useState(true), [blocked, setBlocked] = useState(false), [status, setStatus] = useState(""), [error, setError] = useState("");
  const [exportText, setExportText] = useState("");
  const alive = useRef(true), revision = useRef(0);
  const key = previewReviewKey(accountId, candidate.id);
  useEffect(() => {
    alive.current = true;
    Promise.resolve().then(() => storage.get(key)).then(raw => {
      if (!alive.current) return;
      if (raw) setDraft(decodePreviewReview(raw, candidate.id));
      setLoading(false);
    }).catch(() => {
      if (alive.current) { setBlocked(true); setLoading(false); setError("The local review could not be read. Existing data was preserved; no learner progress was changed."); }
    });
    return () => { alive.current = false; revision.current++; };
  }, [key, candidate.id]);
  function change(p: Partial<PreviewReview>) { revision.current++; setDraft(d => ({ ...d, ...p })); setStatus("Unsaved local changes. Save or export before leaving this video."); }
  async function save() {
    const operation = ++revision.current;
    try {
      const raw = JSON.stringify(draft); decodePreviewReview(raw, candidate.id);
      await storage.set(key, raw);
      if (alive.current && operation === revision.current) { setError(""); setStatus("Review saved in this browser for this account. Nothing was uploaded."); }
    } catch {
      if (alive.current && operation === revision.current) { setStatus(""); setError("Review was not saved. Keep this page open and export your JSON instead."); }
    }
  }
  async function exportReviews() {
    try {
      const unreadable: string[] = [];
      const saved = await Promise.all(previewCandidates.map(async c => {
        if (c.id === candidate.id) return draft;
        try { const raw = await storage.get(previewReviewKey(accountId, c.id)); return raw ? decodePreviewReview(raw, c.id) : null; }
        catch { unreadable.push(c.id); return null; }
      }));
      if (!alive.current) return;
      const payload = { ...previewReviewExport(saved.filter((v): v is PreviewReview => !!v), candidate.windows.find(w => w.id === selectedWindow)), unreadableLocalRecords: unreadable };
      const text = JSON.stringify(payload, null, 2);
      if (Platform.OS === "web") {
        const url = URL.createObjectURL(new Blob([text], { type: "application/json;charset=utf-8" }));
        const a = document.createElement("a"); a.href = url; a.download = `watercolor-video-preview-review-${new Date().toISOString().slice(0, 10)}.json`; a.click();
        setTimeout(() => URL.revokeObjectURL(url), 10000);
        setStatus("JSON download requested. Check Downloads, then attach the file to your Codex conversation. This is evidence, not release approval.");
      } else { setExportText(text); setStatus("Copy the review JSON below. Nothing was uploaded."); }
    } catch { if (alive.current) setError("The JSON export could not be created. Your review is still on this page."); }
  }
  const field = (label: string, name: "observedStart" | "observedEnd" | "captions" | "correction", multiline = false) => <View style={{ gap: 6 }}>
    <Copy>{label}</Copy><TextInput accessibilityLabel={label} value={draft[name]} editable={!loading && !blocked} onChangeText={value => change({ [name]: value })} multiline={multiline} maxLength={4000} style={[learnStyles.input, { minHeight: multiline ? 110 : 48 }]} />
  </View>;
  return <Disclosure title="Record a private playback review">
    <Copy muted>Only your own browser stores these observations, separately from learning progress. They are not synced, encrypted or sent to production records. Use a trusted device. Save before switching videos, and export for backup.</Copy>
    {loading ? <Copy>Opening local review…</Copy> : <>
      <Copy>Actual playback outcome — your observation, not an automatic player inference</Copy>
      <Choices values={[{ id: "not-tested", label: "Not tested" }, { id: "played", label: "I saw real playback" }, { id: "failed", label: "Playback failed" }, { id: "restricted", label: "Embedding restricted" }]} selected={draft.playback} onSelect={playback => { if (!blocked) change({ playback: playback as PreviewReview["playback"] }); }} />
      {field("Observed start (seconds or mm:ss; leave unknown blank)", "observedStart")}
      {field("Observed end (absolute time; leave unknown blank)", "observedEnd")}
      {field("Caption languages/type actually observed", "captions")}
      {field("Corrections, title/channel checks and playback observations", "correction", true)}
      <Copy muted>Suggested windows are not copied into observed fields. A successful preview or this export does not approve a clip or complete any exercise.</Copy>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
        <Action title="Save private preview review" secondary disabled={blocked} onPress={() => void save()} />
        <Action title="Export my video reviews as JSON" secondary onPress={() => void exportReviews()} />
      </View>
      {blocked && <Action title="Use a fresh review; replace this video's draft only on save" secondary onPress={() => { setDraft(blankPreviewReview(candidate.id)); setBlocked(false); setError(""); setStatus("Fresh draft in memory. Existing local data is replaced only if you save."); }} />}
    </>}
    {status && <Text role="status" accessibilityLiveRegion="polite" style={learnStyles.muted}>{status}</Text>}
    {error && <Text role="alert" style={learnStyles.body}>{error}</Text>}
    {!!exportText && <TextInput accessibilityLabel="Video review JSON to copy" multiline editable={false} value={exportText} style={learnStyles.input} />}
  </Disclosure>;
}
