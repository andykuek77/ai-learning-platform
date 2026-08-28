import LearnerDashboard from "@/components/LearnerDashboard";
import { registeredQuizzes } from "@/lib/questionBank";

export default function Home() {
  return <LearnerDashboard quizzes={registeredQuizzes} />;
}
