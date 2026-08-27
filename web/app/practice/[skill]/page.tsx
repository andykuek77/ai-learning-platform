import Link from "next/link";
import QuizEngine from "@/components/QuizEngine";
import { getQuestionsBySkill } from "@/lib/questionBank";
import type { Quiz } from "@/types/quiz";

type TargetedPracticePageProps = {
  params: Promise<{ skill: string }>;
};

export default async function TargetedPracticePage({
  params,
}: TargetedPracticePageProps) {
  const { skill } = await params;
  const matchingQuestions = getQuestionsBySkill(skill);

  if (matchingQuestions.length === 0) {
    return (
      <main style={styles.page}>
        <section style={styles.emptyCard}>
          <h1 style={styles.title}>No matching practice questions</h1>
          <p style={styles.message}>
            There are no existing questions for &quot;{skill}&quot; yet. No AI questions have
            been generated.
          </p>
          <Link href="/progress" style={styles.backLink}>
            Return to progress
          </Link>
        </section>
      </main>
    );
  }

  const quiz: Quiz = {
    id: `targeted-practice:${skill}`,
    subject: "TARGETED PRACTICE",
    title: skill,
    completionTitle: `${skill} Practice`,
    questions: matchingQuestions,
  };

  const notice =
    matchingQuestions.length < 3
      ? `This is a shorter session because only ${matchingQuestions.length} matching ${matchingQuestions.length === 1 ? "question is" : "questions are"} currently available.`
      : undefined;

  return <QuizEngine quiz={quiz} notice={notice} />;
}

const styles: Record<string, React.CSSProperties> = {
  page: { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, background: "#f7f8fa", color: "#202124", fontFamily: "Arial, Helvetica, sans-serif" },
  emptyCard: { maxWidth: 560, padding: 32, border: "1px solid #eceef1", borderRadius: 18, background: "#fff", boxShadow: "0 10px 30px rgba(0,0,0,0.035)" },
  title: { margin: "0 0 12px", fontSize: 24 },
  message: { margin: "0 0 22px", color: "#666", lineHeight: 1.6 },
  backLink: { color: "#202124", fontWeight: 600 },
};
