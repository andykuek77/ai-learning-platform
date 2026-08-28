import type { LearnerObservation, LearnerResponse, ReasoningMilestone, TutorQuestion } from "@/types/tutor";

export type AnswerEvaluation = {
  correct: boolean;
  milestones: ReasoningMilestone[];
  observation: LearnerObservation;
  madeProgress: boolean;
};

export function evaluateAnswer(
  question: TutorQuestion,
  response: LearnerResponse,
  previousResponses: LearnerResponse[] = []
): AnswerEvaluation {
  const supplied = unique(response.milestones ?? []);
  const correct = response.answer === question.answer;
  const milestones = correct
    ? unique<ReasoningMilestone>([...supplied, "FINAL_RESULT_CORRECT"])
    : supplied;
  const previousBest = Math.max(0, ...previousResponses.map((item) => item.milestones?.length ?? 0));
  const madeProgress = correct || milestones.length > previousBest;

  let observation: LearnerObservation = "UNCLEAR";
  if (correct) observation = "CORRECT";
  else if (milestones.includes("OPERATION_SELECTED") || milestones.includes("INTERMEDIATE_RESULT_CORRECT")) {
    observation = "COMPUTATION_ERROR";
  } else if (madeProgress) observation = "PRODUCTIVE_STRUGGLE";

  return { correct, milestones, observation, madeProgress };
}

function unique<T>(values: T[]) {
  return Array.from(new Set(values));
}
