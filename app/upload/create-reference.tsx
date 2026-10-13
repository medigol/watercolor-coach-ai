import { Text } from "react-native";
import { router } from "expo-router";
import ImageSelector from "../../components/ImageSelector";
import { Button, Screen, styles } from "../../components/ui";
export default function CreateReference() {
  return (
    <Screen>
      <Text style={styles.title}>Create painting reference</Text>
      <Text style={styles.body}>
        Choose a photo, or try our coastal town sample.
      </Text>
      <ImageSelector
        sample="Coastal Town — sample photo placeholder"
        label="Choose photo"
      />
      <Button
        title="Create Reference"
        onPress={() => router.push("/result/create-reference")}
      />
      <Text style={styles.caption}>
        Sample guide only. Your photo is not processed yet.
      </Text>
    </Screen>
  );
}
