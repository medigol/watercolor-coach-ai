import { Image } from "react-native";

export const supportsImageAdjustments = false;

export type ReferenceImageProps = {
  uri: string;
  label: string;
  filter: string;
  onError: () => void;
};

export default function ReferenceImage({
  uri,
  label,
  onError,
}: ReferenceImageProps) {
  return (
    <Image
      source={{ uri }}
      accessibilityLabel={label}
      onError={onError}
      resizeMode="contain"
      style={{ width: "100%", height: "100%" }}
    />
  );
}
