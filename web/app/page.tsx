import QuizEngine from "@/components/QuizEngine";
import { getQuizQuestions } from "@/lib/questionBank";
import type { Quiz } from "@/types/quiz";

const mt7Quiz: Quiz = {
  id: "MT7",
  subject: "MATHEMATICS",
  title: "Mock Test 7",
  completionTitle: "Mathematics Mock Test 7",
  questions: getQuizQuestions("MT7"),
};

export default function Home() {
  return <QuizEngine quiz={mt7Quiz} />;
}
