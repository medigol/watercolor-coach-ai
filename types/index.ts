export type ArtworkMode = "Improve painting" | "Create reference";
export type FeedbackFocus =
  | "Overall feedback"
  | "Composition"
  | "Colour & contrast"
  | "Watercolor technique";
export interface Artwork {
  id: string;
  title: string;
  mode: ArtworkMode;
  summary: string;
  date: string;
}
export interface Practice {
  title: string;
  description: string;
  steps: string[];
}
export interface PaletteColour {
  name: string;
  hex: string;
  pigmentCode?: string | null;
  use?: string | null;
  temperature?: "warm" | "cool" | "neutral" | null;
  mix?: string | null;
  tag?: "main_wash" | "accent" | "use_sparingly" | null;
}
export interface CompositionDecision {
  mainIssue?: string | null;
  reason?: string | null;
  tryNow?: string | null;
  nextStudy?: string | null;
}
