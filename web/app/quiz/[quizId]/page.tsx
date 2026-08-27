import { notFound } from "next/navigation";
import QuizEngine from "@/components/QuizEngine";
import { getQuiz } from "@/lib/questionBank";

type QuizPageProps = {
  params: Promise<{ quizId: string }>;
};

export default async function QuizPage({ params }: QuizPageProps) {
  const { quizId } = await params;
  const quiz = getQuiz(quizId);

  if (!quiz) notFound();

  return <QuizEngine quiz={quiz} />;
}
