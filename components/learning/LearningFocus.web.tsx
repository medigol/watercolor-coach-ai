export default function LearningFocus() {
  return (
    <style>{`[data-testid="desktop-learn-nav"] :focus-visible, [data-testid="learning-page"] :focus-visible { outline: 3px solid #236963; outline-offset: 3px; } [data-testid="learning-page"] button, [data-testid="learning-page"] input, [data-testid="learning-page"] textarea, [data-testid="learning-page"] [role="checkbox"] { scroll-margin-block: 100px; } @media (prefers-reduced-motion: reduce) { [data-testid="learning-page"] * { scroll-behavior: auto !important; } }`}</style>
  );
}
