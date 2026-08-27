import mt7Questions from "@/data/MT7.json";
import mt8Questions from "@/data/MT8.json";
import type { Question, Quiz } from "@/types/quiz";

type SourceQuestion = Omit<
  Question,
  "id" | "sourceQuizId" | "sourceQuizTitle" | "sourceQuestionId"
> & {
  id: number;
};

type QuizSource = {
  id: string;
  subject: string;
  title: string;
  completionTitle: string;
  questions: SourceQuestion[];
};

export type RegisteredQuiz = Pick<Quiz, "id" | "subject" | "title"> & {
  questionCount: number;
};

// Add a quiz here only after its answer key and classifications are complete
// and verified.
const verifiedQuizSources: QuizSource[] = [
  {
    id: "MT7",
    subject: "MATHEMATICS",
    title: "Mock Test 7",
    completionTitle: "Mathematics Mock Test 7",
    questions: mt7Questions,
  },
  {
    id: "MT8",
    subject: "MATHEMATICS",
    title: "Mock Test 8",
    completionTitle: "Mathematics Mock Test 8",
    questions: mt8Questions,
  },
];

function normalizeQuestion(source: QuizSource, question: SourceQuestion): Question {
  return {
    ...question,
    id: `${source.id}:${question.id}`,
    sourceQuizId: source.id,
    sourceQuizTitle: source.title,
    sourceQuestionId: question.id,
  };
}

const questionsByQuiz = new Map<string, Question[]>();
const questionIds = new Set<string>();

for (const source of verifiedQuizSources) {
  if (questionsByQuiz.has(source.id)) {
    throw new Error(`Duplicate quiz ID in question bank: ${source.id}`);
  }

  const normalizedQuestions = source.questions.map((question) => {
    const normalized = normalizeQuestion(source, question);

    if (questionIds.has(normalized.id)) {
      throw new Error(`Duplicate question ID in question bank: ${normalized.id}`);
    }

    questionIds.add(normalized.id);
    return normalized;
  });

  questionsByQuiz.set(source.id, normalizedQuestions);
}

export const questionBank: Question[] = Array.from(questionsByQuiz.values()).flat();

export const registeredQuizzes: RegisteredQuiz[] = verifiedQuizSources.map(
  (source) => ({
    id: source.id,
    subject: source.subject,
    title: source.title,
    questionCount: source.questions.length,
  })
);

export function getQuiz(quizId: string): Quiz | undefined {
  const source = verifiedQuizSources.find((quiz) => quiz.id === quizId);
  if (!source) return undefined;

  return {
    id: source.id,
    subject: source.subject,
    title: source.title,
    completionTitle: source.completionTitle,
    questions: getQuizQuestions(source.id),
  };
}

export function getQuizQuestions(quizId: string): Question[] {
  return questionsByQuiz.get(quizId) ?? [];
}

export function getQuestionsBySkill(skill: string): Question[] {
  const normalizedSkill = skill.trim();
  return questionBank.filter(
    (question) => question.skill?.trim() === normalizedSkill
  );
}
