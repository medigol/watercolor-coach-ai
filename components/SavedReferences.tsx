import { useCallback, useState } from "react";
import { Text, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { useAuth } from "../providers/AuthProvider";
import { listReferences } from "../lib/referenceStudioClient";
import { intentions, type ReferenceRecord } from "../shared/referenceStudio";
import { Button, styles } from "./ui";
export default function SavedReferences() {
  const { session } = useAuth(), owner = session?.user.id;
  const [rows, setRows] = useState<ReferenceRecord[]>([]),
    [attempt, setAttempt] = useState(0),
    [error, setError] = useState(""),
    [loaded, setLoaded] = useState("");
  const key = `${owner}/${attempt}`;
  useFocusEffect(useCallback(() => {
    let active = true;
    setRows([]);
    setError("");
    if (owner) {
      listReferences(owner).then((r) => {
        if (active) setRows(r);
      }).catch(() => {
        if (active) {
          setError(
            "Image-reference storage is not enabled or could not be loaded. Existing artwork and text-plan results above are unaffected.",
          );
        }
      }).finally(() => {
        if (active) setLoaded(key);
      });
    }
    return () => {
      active = false;
    };
  }, [owner, attempt, key]));
  return (
    <View style={{ gap: 12 }}>
      <Text style={styles.heading}>Image references</Text>
      {loaded !== key
        ? <Text style={styles.caption}>Loading saved image references…</Text>
        : error
        ? (
          <>
            <Text style={styles.caption}>{error}</Text>
            <Button
              title="Check saved image references"
              onPress={() => setAttempt((x) => x + 1)}
            />
          </>
        )
        : rows.length
        ? rows.map((r) => (
          <Button
            key={r.id}
            title={`${
              intentions[r.request_json.direction.goal]
            } · ${r.status} · ${new Date(r.created_at).toLocaleDateString()}`}
            onPress={() =>
              router.push({
                pathname: "/result/create-reference",
                params: { generation: r.id },
              })}
          />
        ))
        : (
          <Text style={styles.caption}>
            No generated references saved yet.
          </Text>
        )}
    </View>
  );
}
