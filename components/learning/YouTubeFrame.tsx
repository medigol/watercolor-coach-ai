import { Text } from "react-native";
export interface YouTubeFrameProps {
  src: string;
  title: string;
  onError: () => void;
}
export default function YouTubeFrame(_: YouTubeFrameProps) {
  return (
    <Text>
      Embedded video is unavailable here. Use the attributed YouTube link.
    </Text>
  );
}
