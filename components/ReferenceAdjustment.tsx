import { Text } from "react-native";
import { styles } from "./ui";

export type ReferenceAdjustmentProps = {
  label: string;
  value: number;
  min: number;
  max: number;
  disabled?: boolean;
  onChange: (value: number) => void;
};

export default function ReferenceAdjustment(_: ReferenceAdjustmentProps) {
  return <Text style={styles.caption}>Available in browser preview</Text>;
}
