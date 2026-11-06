import { Text } from "react-native";
import { Screen, styles } from "./ui";
export default function ReferenceStudioResult({ id }: { id: string }) {
  return (
    <Screen>
      <Text style={styles.title}>Saved image reference</Text>
      <Text style={styles.body}>
        Open this saved reference in the web application. Request{" "}
        {id}. No new generation has been started.
      </Text>
    </Screen>
  );
}
