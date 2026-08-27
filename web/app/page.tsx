import PracticeHome from "@/components/PracticeHome";
import { registeredQuizzes } from "@/lib/questionBank";

export default function Home() {
  return <PracticeHome quizzes={registeredQuizzes} />;
}
