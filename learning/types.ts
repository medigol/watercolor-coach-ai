export const experiences = [
  "beginner",
  "developing",
  "intermediate",
  "advanced",
] as const;
export type Experience = (typeof experiences)[number];
export const goals = [
  "start",
  "technique",
  "atmosphere",
  "realism",
  "expression",
  "composition",
  "colour",
  "urban",
  "independence",
] as const;
export type LearningGoal = (typeof goals)[number];
export const subjects = [
  "landscape",
  "urban",
  "water",
  "mountains",
  "boats",
  "botanical",
  "animals",
  "figures",
  "still-life",
  "abstract",
] as const;
export type Subject = (typeof subjects)[number];
export const confidenceLevels = [
  "new",
  "developing",
  "comfortable",
  "confident",
] as const;
export type Confidence = (typeof confidenceLevels)[number];
export type Difficulty = "foundation" | "developing" | "intermediate";
export type StyleId = "atmospheric" | "urban" | "botanical" | "expressive";
export interface LearningProfile {
  experience: Experience;
  goal: LearningGoal;
  subject: Subject;
  primaryStyle: StyleId;
  secondaryStyles: StyleId[];
  minutes: 10 | 15 | 30 | 45 | 60;
  diagnostic: Partial<Record<string, Confidence>>;
  format: "mixed" | "reading" | "video";
  weeklySessions?: number;
}
export interface WatercolourStyle {
  id: StyleId;
  title: string;
  description: string;
  decisions: string[];
  skillIds: string[];
  subjects: Subject[];
  exercise: string;
  related: StyleId[];
}
export interface Skill {
  id: string;
  moduleId: string;
  title: string;
  description: string;
  objectives: string[];
  prerequisites: string[];
  difficulty: Difficulty;
  subjectTags: Subject[];
  styleTags: StyleId[];
  version: number;
  instructionMinutes: number | null;
  practiceMinutes: number | null;
  materials: string[];
  resourceIds: string[];
  editorialStatus: "outline";
}
export interface CurriculumModule {
  id: string;
  title: string;
  description: string;
  topics: string[];
  skillIds: string[];
  lessonIds: string[];
  version: number;
  objectives: string[];
  editorialStatus: "framework";
}
export interface Exercise {
  target: string;
  technique: string;
  variable: string;
  constants: string[];
  comparison: string;
  success: string[];
  recovery: string;
  shortVersion: string;
  extension: string;
}
export interface LessonStep {
  id: string;
  title: string;
  minutes: number;
  explanation: string;
  actions: string[];
  checklist: string[];
  observe: string;
  pitfall: string;
  visual: "water" | "values" | "edges" | "drawing" | "landscape";
}
export interface LearningItem {
  id: string;
  kind: "lesson" | "project";
  moduleId: string;
  title: string;
  description: string;
  objectives: string[];
  skillIds: string[];
  prerequisiteSkillIds: string[];
  difficulty: Difficulty;
  instructionMinutes: number;
  practiceMinutes: number;
  materials: string[];
  why: string;
  exercise: Exercise;
  steps: LessonStep[];
  reflectionPrompt: string;
  subjectTags: Subject[];
  styleTags: StyleId[];
  resourceIds: string[];
  version: number;
  editorialStatus: "internally-reviewed";
  availability: "available";
}
export type Lesson = LearningItem & { kind: "lesson" };
export type GuidedProject = LearningItem & { kind: "project" };
export type { MediaResource } from "./videoTypes";
export interface ExerciseReflection {
  text: string;
  difficulty: "easy" | "useful" | "challenging";
  confidence: Confidence;
  recordedAt: string;
}
export interface LessonProgress {
  itemId: string;
  contentVersion: number;
  stepId: string;
  checked: Record<string, string[]>;
  completedSteps: string[];
  notes: Record<string, string>;
  reflection?: ExerciseReflection;
  viewedAt: string;
  updatedAt: string;
}
export interface LearnerProgress {
  schemaVersion: 1;
  mode: "structured" | "personal";
  profile: LearningProfile | null;
  draft: LearningProfile | null;
  onboardingStep: number;
  entries: Record<string, LessonProgress>;
  currentItemId: string | null;
  updatedAt: string;
}
export interface PathRecommendation {
  itemId: string;
  reason: string;
  refresher: boolean;
  prerequisiteNotes: string[];
  application: string;
  sessionPlan: string;
}
export interface LearningPath {
  mode: "structured" | "personal";
  title: string;
  recommendations: PathRecommendation[];
  revisionIds: string[];
  refresherIds: string[];
  weeklySuggestion: string;
  limitations: string[];
}
