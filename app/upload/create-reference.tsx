import { useLocalSearchParams } from "expo-router";
import ReferenceStudio from "../../components/ReferenceStudio";
import LegacyReferenceUpload from "../../components/LegacyReferenceUpload";
export default function CreateReference() {
  const { legacy } = useLocalSearchParams<{ legacy?: string }>();
  return legacy === "1" ? <LegacyReferenceUpload /> : <ReferenceStudio />;
}
