import type { MasteryArea } from "@/lib/analytics";

export type LearnerAnalytics = {
  topics: MasteryArea[];
  skills: MasteryArea[];
};

export type AiLearningAnalysis = {
  summary: string;
  strengths: string[];
  areasToImprove: string[];
  recommendedNextSteps: string[];
};

export type AiLearningAnalysisResponse = AiLearningAnalysis & {
  source: "cache" | "fresh";
};
