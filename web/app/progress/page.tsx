"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppHeader from "@/components/AppHeader";
import {
  calculateMastery,
  type MasteryArea,
  type QuestionAttemptForAnalytics,
} from "@/lib/analytics";
import { supabase } from "@/lib/supabase";

type ProgressData = {
  topics: MasteryArea[];
  skills: MasteryArea[];
  totalAttempts: number;
};

export default function ProgressPage() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let active = true;

    async function loadProgress() {
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

        setUserEmail(user.email ?? "Authenticated user");

        const { data, error } = await supabase
          .from("question_attempts")
          .select("topic, skill, is_correct")
          .eq("user_id", user.id);

        if (!active) return;

        if (error) {
          setErrorMessage("Could not load progress: " + error.message);
          return;
        }

        const attempts = (data ?? []) as QuestionAttemptForAnalytics[];
        setProgress({
          topics: calculateMastery(attempts, "topic"),
          skills: calculateMastery(attempts, "skill"),
          totalAttempts: attempts.length,
        });
      } catch (error) {
        if (!active) return;
        const message =
          error instanceof Error ? error.message : "Unknown progress error.";
        setErrorMessage("Could not load progress: " + message);
      }
    }

    void loadProgress();

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
      <AppHeader activeSection="progress" userEmail={userEmail} />
      <section style={styles.content}>
        <p style={styles.eyebrow}>YOUR LEARNING</p>
        <h1 style={styles.title}>Progress</h1>
        <p style={styles.subtitle}>
          Accuracy by topic and skill, with areas needing the most practice shown first.
        </p>

        {errorMessage ? (
          <div style={styles.messageCard}>{errorMessage}</div>
        ) : !progress ? (
          <div style={styles.messageCard}>Loading progress...</div>
        ) : progress.totalAttempts === 0 ? (
          <div style={styles.messageCard}>
            No quiz results yet. Complete a quiz to see your progress.
          </div>
        ) : (
          <div style={styles.sections}>
            <MasteryTable title="Topics" areas={progress.topics} />
            <MasteryTable title="Skills" areas={progress.skills} />
          </div>
        )}
      </section>
    </main>
  );
}

function MasteryTable({ title, areas }: { title: string; areas: MasteryArea[] }) {
  return (
    <section style={styles.card}>
      <h2 style={styles.sectionTitle}>{title}</h2>
      <div style={styles.tableWrapper}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.nameHeader}>{title.slice(0, -1)}</th>
              <th style={styles.numberHeader}>Attempted</th>
              <th style={styles.numberHeader}>Correct</th>
              <th style={styles.numberHeader}>Accuracy</th>
            </tr>
          </thead>
          <tbody>
            {areas.map((area) => (
              <tr key={area.name}>
                <td style={styles.nameCell}>{area.name}</td>
                <td style={styles.numberCell}>{area.attempted}</td>
                <td style={styles.numberCell}>{area.correct}</td>
                <td style={styles.accuracyCell}>{area.accuracy}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { minHeight: "100vh", background: "#f7f8fa", color: "#202124", fontFamily: "Arial, Helvetica, sans-serif" },
  loading: { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#666" },
  content: { maxWidth: 960, margin: "0 auto", padding: "56px 24px 100px" },
  eyebrow: { margin: 0, fontSize: 12, fontWeight: 700, letterSpacing: "1.5px", color: "#888" },
  title: { margin: "7px 0 8px", fontSize: 28, fontWeight: 600 },
  subtitle: { margin: "0 0 30px", color: "#666", lineHeight: 1.5 },
  sections: { display: "flex", flexDirection: "column", gap: 24 },
  card: { background: "#fff", border: "1px solid #eceef1", borderRadius: 18, padding: 32, boxShadow: "0 10px 30px rgba(0,0,0,0.035)" },
  sectionTitle: { margin: "0 0 22px", fontSize: 21, fontWeight: 600 },
  messageCard: { background: "#fff", border: "1px solid #eceef1", borderRadius: 18, padding: 32, color: "#666" },
  tableWrapper: { overflowX: "auto" },
  table: { width: "100%", borderCollapse: "collapse" },
  nameHeader: { padding: "0 12px 12px 0", textAlign: "left", color: "#777", fontSize: 12, letterSpacing: "0.8px", textTransform: "uppercase", borderBottom: "1px solid #eceef1" },
  numberHeader: { padding: "0 0 12px 12px", textAlign: "right", color: "#777", fontSize: 12, letterSpacing: "0.8px", textTransform: "uppercase", borderBottom: "1px solid #eceef1" },
  nameCell: { padding: "17px 12px 17px 0", borderBottom: "1px solid #f0f1f3", fontWeight: 500 },
  numberCell: { padding: "17px 0 17px 12px", borderBottom: "1px solid #f0f1f3", textAlign: "right", color: "#666" },
  accuracyCell: { padding: "17px 0 17px 12px", borderBottom: "1px solid #f0f1f3", textAlign: "right", fontWeight: 700 },
};
