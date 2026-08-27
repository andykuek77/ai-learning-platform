import QuizEngine from "@/components/QuizEngine";
import questions from "@/data/MT7.json";
import type { Quiz } from "@/types/quiz";

const mt7Quiz: Quiz = {
  id: "MT7",
  subject: "MATHEMATICS",
  title: "Mock Test 7",
  completionTitle: "Mathematics Mock Test 7",
  questions,
};

export default function Home() {
  return <QuizEngine quiz={mt7Quiz} />;
}
