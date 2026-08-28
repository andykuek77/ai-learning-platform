"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AppHeader from "@/components/AppHeader";
import RecentQuizPerformanceChart, {
  type QuizPerformancePoint,
} from "@/components/charts/RecentQuizPerformanceChart";
import TopicPerformanceChart from "@/components/charts/TopicPerformanceChart";
import {
  calculateMastery,
  getCategorizedSkillExtremes,
  type QuestionAttemptForAnalytics,
} from "@/lib/analytics";
import { supabase } from "@/lib/supabase";
import type { RegisteredCourse } from "@/lib/courseRegistry";
import type { RegisteredQuiz } from "@/lib/questionBank";

type QuizAttempt = {
  quiz_name: string;
  score: number;
  total_marks: number;
  created_at: string | null;
};

type DashboardData = {
  quizAttempts: QuizAttempt[];
  mockQuizAttempts: QuizAttempt[];
  questionAttempts: QuestionAttemptForAnalytics[];
};

export default function LearnerDashboard({
  courses,
  quizzes,
}: {
  courses: RegisteredCourse[];
  quizzes: RegisteredQuiz[];
}) {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      let authenticated = false;

      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (!active) return;

        if (userError || !user) {
          router.replace("/login");
          return;
        }

        authenticated = true;
        setUserEmail(user.email ?? "Authenticated user");

        const registeredQuizIds = quizzes.map((quiz) => quiz.id);
        const mockQuizRequest = registeredQuizIds.length > 0
          ? supabase
              .from("quiz_attempts")
              .select("quiz_name, score, total_marks, created_at")
              .eq("user_id", user.id)
              .in("quiz_name", registeredQuizIds)
              .order("created_at", { ascending: false, nullsFirst: false })
              .limit(8)
          : Promise.resolve({ data: [] as QuizAttempt[], error: null });

        const [quizResult, mockQuizResult, questionResult] = await Promise.all([
          supabase
            .from("quiz_attempts")
            .select("quiz_name, score, total_marks, created_at")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false, nullsFirst: false })
            .limit(6),
          mockQuizRequest,
          supabase
            .from("question_attempts")
            .select("topic, skill, is_correct")
            .eq("user_id", user.id),
        ]);

        if (!active) return;

        const errors = [
          quizResult.error,
          mockQuizResult.error,
          questionResult.error,
        ].filter(Boolean);
        if (errors.length > 0) {
          setErrorMessage("Some learning activity could not be loaded. Please refresh to try again.");
        }

        setDashboard({
          quizAttempts: (quizResult.data ?? []) as QuizAttempt[],
          mockQuizAttempts: (mockQuizResult.data ?? []) as QuizAttempt[],
          questionAttempts: (questionResult.data ?? []) as QuestionAttemptForAnalytics[],
        });
      } catch {
        if (!active) return;
        if (!authenticated) {
          router.replace("/login");
          return;
        }
        setErrorMessage("Learning activity could not be loaded. Please refresh to try again.");
        setDashboard({ quizAttempts: [], mockQuizAttempts: [], questionAttempts: [] });
      }
    }

    void loadDashboard();

    return () => {
      active = false;
    };
  }, [quizzes, router]);

  const skillSummary = useMemo(() => {
    const skills = calculateMastery(dashboard?.questionAttempts ?? [], "skill");
    return getCategorizedSkillExtremes(skills);
  }, [dashboard]);

  const topicPerformance = useMemo(() => {
    return calculateMastery(dashboard?.questionAttempts ?? [], "topic").filter(
      (topic) => topic.name !== "Uncategorised"
    );
  }, [dashboard]);

  const mockQuizPerformance = useMemo<QuizPerformancePoint[]>(() => {
    const attemptNumbers = new Map<string, number>();

    return [...(dashboard?.mockQuizAttempts ?? [])]
      .reverse()
      .flatMap((attempt, index) => {
        const quiz = quizzes.find((registered) => registered.id === attempt.quiz_name);
        if (!quiz || attempt.total_marks <= 0) return [];

        const attemptNumber = (attemptNumbers.get(quiz.id) ?? 0) + 1;
        attemptNumbers.set(quiz.id, attemptNumber);

        return [{
          id: `${attempt.quiz_name}-${attempt.created_at ?? index}`,
          quizTitle: quiz.title,
          axisLabel: `${quiz.id} #${attemptNumber}`,
          dateLabel: formatAttemptDateTime(attempt.created_at),
          score: attempt.score,
          totalMarks: attempt.total_marks,
          accuracy: Math.round((attempt.score / attempt.total_marks) * 100),
        }];
      });
  }, [dashboard, quizzes]);

  if (!userEmail) {
    return (
      <main style={styles.page}>
        <div style={styles.loading}>Checking sign-in...</div>
      </main>
    );
  }

  const latestAttempt = dashboard?.quizAttempts[0] ?? null;
  const latestQuiz = latestAttempt
    ? describeQuizAttempt(latestAttempt.quiz_name, quizzes)
    : null;
  const hasActivity = (dashboard?.questionAttempts.length ?? 0) > 0;

  return (
    <main style={styles.page}>
      <AppHeader activeSection="practice" userEmail={userEmail} />
      <section style={styles.content}>
        <div style={styles.welcomeRow}>
          <div>
            <p style={styles.eyebrow}>LEARNER DASHBOARD</p>
            <h1 style={styles.title}>Welcome back</h1>
            <p style={styles.subtitle}>{userEmail}</p>
          </div>
          <Link href="/progress" style={styles.secondaryButton}>
            View full progress
          </Link>
        </div>

        {errorMessage ? <div style={styles.errorCard}>{errorMessage}</div> : null}

        {!dashboard ? (
          <div style={styles.messageCard}>Loading your learning activity...</div>
        ) : (
          <div style={styles.sections}>
            <section style={styles.heroCard}>
              <div>
                <p style={styles.cardEyebrow}>CONTINUE LEARNING</p>
                {latestAttempt && latestQuiz ? (
                  <>
                    <h2 style={styles.heroTitle}>{latestQuiz.title}</h2>
                    <p style={styles.heroText}>
                      Latest score: <strong>{latestAttempt.score}/{latestAttempt.total_marks}</strong>
                    </p>
                  </>
                ) : (
                  <>
                    <h2 style={styles.heroTitle}>Start your first mock test</h2>
                    <p style={styles.heroText}>
                      Choose a test below to begin building your learning profile.
                    </p>
                  </>
                )}
              </div>
              {latestQuiz?.href ? (
                <Link href={latestQuiz.href} style={styles.primaryButton}>
                  Retry {latestQuiz.title}
                </Link>
              ) : quizzes[0] ? (
                <Link href={`/quiz/${encodeURIComponent(quizzes[0].id)}`} style={styles.primaryButton}>
                  Start learning
                </Link>
              ) : null}
            </section>

            <section>
              <SectionHeading title="Progress Summary" />
              <div style={styles.summaryGrid}>
                <MetricCard label="Questions attempted" value={String(dashboard.questionAttempts.length)} />
                <MetricCard label="Latest quiz score" value={latestAttempt ? `${latestAttempt.score}/${latestAttempt.total_marks}` : "Not yet available"} />
                <MetricCard label="Strongest skill" value={skillSummary.strongest ? `${skillSummary.strongest.name} · ${skillSummary.strongest.accuracy}%` : "Not yet available"} />
                <MetricCard label="Weakest skill" value={skillSummary.weakest ? `${skillSummary.weakest.name} · ${skillSummary.weakest.accuracy}%` : "Not yet available"} />
              </div>
            </section>

            <section style={styles.learnCard}>
              <div>
                <p style={styles.cardEyebrow}>LEARN</p>
                <h2 style={styles.learnTitle}>
                  {courses[0]?.title ?? "Explore lessons"}
                </h2>
                <p style={styles.learnText}>
                  Read clear explanations and worked examples, then practise the same skill.
                </p>
              </div>
              <Link
                href={courses[0] ? `/learn/${courses[0].id}` : "/learn"}
                style={styles.learnButton}
              >
                Explore lessons
              </Link>
            </section>

            <div style={styles.chartsGrid}>
              <TopicPerformanceChart topics={topicPerformance} />
              <RecentQuizPerformanceChart attempts={mockQuizPerformance} />
            </div>

            <section style={styles.card}>
              <p style={styles.cardEyebrow}>RECOMMENDED PRACTICE</p>
              {skillSummary.weakest ? (
                <div style={styles.recommendationRow}>
                  <div>
                    <h2 style={styles.sectionTitle}>{skillSummary.weakest.name}</h2>
                    <p style={styles.cardText}>
                      Strengthen your lowest-accuracy categorized skill with focused questions from the question bank.
                    </p>
                  </div>
                  <Link href={`/practice/${encodeURIComponent(skillSummary.weakest.name)}`} style={styles.primaryButton}>
                    Start targeted practice
                  </Link>
                </div>
              ) : (
                <p style={styles.cardText}>
                  Complete a quiz and we’ll recommend a skill to practise next.
                </p>
              )}
            </section>

            <section>
              <SectionHeading title="Mock Tests" subtitle="Choose from every verified test in the LearnAI question bank." />
              <div style={styles.quizGrid}>
                {quizzes.map((quiz) => (
                  <article key={quiz.id} style={styles.quizCard}>
                    <p style={styles.cardEyebrow}>{quiz.subject}</p>
                    <h3 style={styles.quizTitle}>{quiz.title}</h3>
                    <p style={styles.cardText}>{quiz.questionCount} {quiz.questionCount === 1 ? "question" : "questions"}</p>
                    <Link href={`/quiz/${encodeURIComponent(quiz.id)}`} style={styles.cardButton}>Start</Link>
                  </article>
                ))}
              </div>
            </section>

            <section style={styles.card}>
              <SectionHeading title="Recent Activity" />
              {dashboard.quizAttempts.length > 0 ? (
                <div style={styles.activityList}>
                  {dashboard.quizAttempts.map((attempt, index) => {
                    const quiz = describeQuizAttempt(attempt.quiz_name, quizzes);
                    return (
                      <div key={`${attempt.quiz_name}-${attempt.created_at ?? index}`} style={styles.activityRow}>
                        <div>
                          <p style={styles.activityTitle}>{quiz.title}</p>
                          <p style={styles.activityDate}>{formatAttemptDate(attempt.created_at)}</p>
                        </div>
                        <strong style={styles.activityScore}>{attempt.score}/{attempt.total_marks}</strong>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p style={styles.cardText}>
                  {hasActivity ? "No completed quiz records are available yet." : "Your completed quizzes will appear here."}
                </p>
              )}
            </section>
          </div>
        )}
      </section>
    </main>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <article style={styles.metricCard}>
      <p style={styles.metricLabel}>{label}</p>
      <p style={styles.metricValue}>{value}</p>
    </article>
  );
}

function SectionHeading({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div style={styles.sectionHeading}>
      <h2 style={styles.sectionTitle}>{title}</h2>
      {subtitle ? <p style={styles.sectionSubtitle}>{subtitle}</p> : null}
    </div>
  );
}

function describeQuizAttempt(quizName: string, quizzes: RegisteredQuiz[]) {
  const registeredQuiz = quizzes.find((quiz) => quiz.id === quizName);
  if (registeredQuiz) {
    return {
      title: registeredQuiz.title,
      href: `/quiz/${encodeURIComponent(registeredQuiz.id)}`,
    };
  }

  const targetedPrefix = "targeted-practice:";
  if (quizName.startsWith(targetedPrefix)) {
    const skill = quizName.slice(targetedPrefix.length);
    return {
      title: `${skill} Practice`,
      href: `/practice/${encodeURIComponent(skill)}`,
    };
  }

  return { title: quizName, href: null };
}

function formatAttemptDate(value: string | null) {
  if (!value) return "Date unavailable";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(date);
}

function formatAttemptDateTime(value: string | null) {
  if (!value) return "Date and time unavailable";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date and time unavailable";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

const styles: Record<string, React.CSSProperties> = {
  page: { minHeight: "100vh", background: "#f7f8fa", color: "#202124", fontFamily: "Arial, Helvetica, sans-serif" },
  loading: { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#666" },
  content: { maxWidth: 1040, margin: "0 auto", padding: "56px 24px 100px" },
  welcomeRow: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24, marginBottom: 30 },
  eyebrow: { margin: 0, fontSize: 12, fontWeight: 700, letterSpacing: "1.5px", color: "#888" },
  title: { margin: "7px 0 6px", fontSize: 32, fontWeight: 600 },
  subtitle: { margin: 0, color: "#666", lineHeight: 1.5 },
  sections: { display: "flex", flexDirection: "column", gap: 30 },
  heroCard: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 28, padding: 36, borderRadius: 20, background: "linear-gradient(135deg, #202124 0%, #34373b 100%)", color: "#fff", boxShadow: "0 16px 40px rgba(18,20,24,0.15)" },
  card: { padding: 32, border: "1px solid #eceef1", borderRadius: 18, background: "#fff", boxShadow: "0 10px 30px rgba(0,0,0,0.035)" },
  messageCard: { padding: 32, border: "1px solid #eceef1", borderRadius: 18, background: "#fff", color: "#666" },
  errorCard: { marginBottom: 24, padding: "16px 18px", borderRadius: 12, background: "#fff3f1", color: "#9c4039" },
  cardEyebrow: { margin: 0, fontSize: 11, fontWeight: 700, letterSpacing: "1.3px", color: "#92969b" },
  heroTitle: { margin: "8px 0", fontSize: 25, fontWeight: 600 },
  heroText: { margin: 0, color: "#d6d8db", lineHeight: 1.55 },
  primaryButton: { display: "inline-block", flexShrink: 0, padding: "12px 18px", borderRadius: 10, background: "#fff", color: "#202124", textDecoration: "none", fontWeight: 700 },
  secondaryButton: { display: "inline-block", padding: "11px 16px", border: "1px solid #dfe1e5", borderRadius: 10, background: "#fff", color: "#333", textDecoration: "none", fontWeight: 600 },
  sectionHeading: { marginBottom: 16 },
  sectionTitle: { margin: 0, fontSize: 21, fontWeight: 600 },
  sectionSubtitle: { margin: "6px 0 0", color: "#777", lineHeight: 1.5 },
  summaryGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 16 },
  chartsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 420px), 1fr))", gap: 20, alignItems: "start" },
  metricCard: { minHeight: 128, padding: 22, border: "1px solid #eceef1", borderRadius: 16, background: "#fff" },
  metricLabel: { margin: "0 0 16px", color: "#777", fontSize: 13 },
  metricValue: { margin: 0, fontSize: 20, fontWeight: 650, lineHeight: 1.35 },
  learnCard: { display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 28, padding: 30, border: "1px solid #dfe5ff", borderRadius: 18, background: "#f2f5ff" },
  learnTitle: { margin: "8px 0 0", fontSize: 21, fontWeight: 600 },
  learnText: { maxWidth: 640, margin: "8px 0 0", color: "#5f6470", lineHeight: 1.55 },
  learnButton: { display: "inline-block", flexShrink: 0, padding: "12px 18px", borderRadius: 10, background: "#536dfe", color: "#fff", textDecoration: "none", fontWeight: 700 },
  recommendationRow: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 28 },
  cardText: { margin: "8px 0 0", color: "#666", lineHeight: 1.55 },
  quizGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 20 },
  quizCard: { display: "flex", flexDirection: "column", alignItems: "flex-start", minHeight: 210, padding: 28, border: "1px solid #eceef1", borderRadius: 18, background: "#fff", boxShadow: "0 10px 30px rgba(0,0,0,0.03)" },
  quizTitle: { margin: "10px 0 0", fontSize: 21, fontWeight: 600 },
  cardButton: { marginTop: "auto", padding: "11px 20px", borderRadius: 10, background: "#202124", color: "#fff", textDecoration: "none", fontWeight: 600 },
  activityList: { display: "flex", flexDirection: "column" },
  activityRow: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20, padding: "17px 0", borderBottom: "1px solid #f0f1f3" },
  activityTitle: { margin: 0, fontWeight: 600 },
  activityDate: { margin: "5px 0 0", color: "#888", fontSize: 13 },
  activityScore: { fontSize: 16 },
};
