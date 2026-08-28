import LearnerDashboard from "@/components/LearnerDashboard";
import { registeredCourses } from "@/lib/courseRegistry";
import { registeredQuizzes } from "@/lib/questionBank";

export default function Home() {
  return (
    <LearnerDashboard courses={registeredCourses} quizzes={registeredQuizzes} />
  );
}
