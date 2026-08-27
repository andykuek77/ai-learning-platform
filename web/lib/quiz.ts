import type { Question, QuizAnswers } from "@/types/quiz";

export function calculateScore(
  questions: Question[],
  answers: QuizAnswers
) {
  return questions.reduce((score, question) => {
    return answers[question.id] === question.correctOption
      ? score + question.marks
      : score;
  }, 0);
}

export function calculateTotalMarks(questions: Question[]) {
  return questions.reduce((total, question) => total + question.marks, 0);
}
