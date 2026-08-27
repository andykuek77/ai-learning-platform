export type Question = {
  id: string;
  sourceQuizId: string;
  sourceQuizTitle: string;
  sourceQuestionId: number;
  type: string;
  question: string;
  options: string[];
  correctOption: number;
  correctAnswer: string;
  marks: number;

  topic?: string | null;
  skill?: string | null;
};

export type Quiz = {
  id: string;
  subject: string;
  title: string;
  completionTitle: string;
  questions: Question[];
};

export type QuizAnswers = Record<string, number>;

export type AnswerFeedback = "correct" | "incorrect" | null;
