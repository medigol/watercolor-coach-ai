import FeedbackSection from "./FeedbackSection";
export default function CompositionSuggestionCard({
  text,
  title = "Composition suggestion",
}: {
  text: string;
  title?: string;
}) {
  return <FeedbackSection title={title} text={text} tone="blue" />;
}
