import type { KnownMisconception, LearnerResponse, TutorQuestion } from "@/types/tutor";

export function detectKnownMisconception(
  question: TutorQuestion,
  response: LearnerResponse,
  misconceptions: KnownMisconception[]
) {
  return misconceptions.find((misconception) =>
    misconception.matches.some(
      (match) => match.questionId === question.id && response.answer !== undefined && match.incorrectAnswers.includes(response.answer)
    )
  );
}
