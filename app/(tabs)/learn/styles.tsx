import { router } from "expo-router";
import { useLearning } from "../../../providers/LearningProvider";
import {
  defaultProfile,
  withStylePreferences,
} from "../../../learning/catalogue";
import StylePicker from "../../../components/learning/StylePicker";
import {
  Action,
  Heading,
  LearnScreen,
} from "../../../components/learning/LearningUI";
export default function Styles() {
  const { state, update } = useLearning();
  const p = state.draft ?? state.profile ?? defaultProfile;
  return (
    <LearnScreen>
      <Heading level={1}>Find a direction that moves you</Heading>
      <StylePicker
        profile={p}
        onChange={(draft) => update((s) => ({ ...s, draft }))}
      />
      <Action
        title="Use these styles in my path"
        onPress={() => {
          update((s) => ({
            ...s,
            profile: withStylePreferences(s.profile ?? defaultProfile, p),
            mode: "personal",
          }));
          router.push("/learn/path");
        }}
      />
      <Action
        title="Edit all learning preferences"
        secondary
        onPress={() => router.push("/learn/onboarding")}
      />
    </LearnScreen>
  );
}
