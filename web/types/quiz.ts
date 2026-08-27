export type Question = {
  id: number;
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

export type QuizAnswers = Record<number, number>;

export type AnswerFeedback = "correct" | "incorrect" | null;
