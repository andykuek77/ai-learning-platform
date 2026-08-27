"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppHeader from "@/components/AppHeader";
import { supabase } from "@/lib/supabase";
import type { RegisteredQuiz } from "@/lib/questionBank";

export default function PracticeHome({ quizzes }: { quizzes: RegisteredQuiz[] }) {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function requireAuthenticatedUser() {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (!active) return;

      if (error || !user) {
        router.replace("/login");
        return;
      }

      setUserEmail(user.email ?? "Authenticated user");
    }

    void requireAuthenticatedUser();

    return () => {
      active = false;
    };
  }, [router]);

  if (!userEmail) {
    return (
      <main style={styles.page}>
        <div style={styles.loading}>Checking sign-in...</div>
      </main>
    );
  }

  return (
    <main style={styles.page}>
      <AppHeader activeSection="practice" userEmail={userEmail} />
      <section style={styles.content}>
        <p style={styles.eyebrow}>PRACTICE</p>
        <h1 style={styles.title}>Choose a quiz</h1>
        <p style={styles.subtitle}>
          Build your mathematics skills and track your progress with each attempt.
        </p>

        <div style={styles.quizGrid}>
          {quizzes.map((quiz) => (
            <article key={quiz.id} style={styles.card}>
              <p style={styles.subject}>{quiz.subject}</p>
              <h2 style={styles.quizTitle}>{quiz.title}</h2>
              <p style={styles.questionCount}>
                {quiz.questionCount} {quiz.questionCount === 1 ? "question" : "questions"}
              </p>
              <Link
                href={`/quiz/${encodeURIComponent(quiz.id)}`}
                style={styles.startButton}
              >
                Start
              </Link>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { minHeight: "100vh", background: "#f7f8fa", color: "#202124", fontFamily: "Arial, Helvetica, sans-serif" },
  loading: { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#666" },
  content: { maxWidth: 960, margin: "0 auto", padding: "56px 24px 100px" },
  eyebrow: { margin: 0, fontSize: 12, fontWeight: 700, letterSpacing: "1.5px", color: "#888" },
  title: { margin: "7px 0 8px", fontSize: 28, fontWeight: 600 },
  subtitle: { margin: "0 0 30px", color: "#666", lineHeight: 1.5 },
  quizGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 24 },
  card: { display: "flex", flexDirection: "column", alignItems: "flex-start", minHeight: 230, padding: 32, border: "1px solid #eceef1", borderRadius: 18, background: "#fff", boxShadow: "0 10px 30px rgba(0,0,0,0.035)" },
  subject: { margin: 0, color: "#888", fontSize: 12, fontWeight: 700, letterSpacing: "1.2px" },
  quizTitle: { margin: "10px 0 8px", fontSize: 22, fontWeight: 600 },
  questionCount: { margin: "0 0 28px", color: "#666" },
  startButton: { marginTop: "auto", padding: "12px 24px", borderRadius: 10, background: "#202124", color: "#fff", textDecoration: "none", fontWeight: 600 },
};
