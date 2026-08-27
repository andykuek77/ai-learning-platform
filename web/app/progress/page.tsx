"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppHeader from "@/components/AppHeader";
import {
  calculateMastery,
  type MasteryArea,
  type QuestionAttemptForAnalytics,
} from "@/lib/analytics";
import { supabase } from "@/lib/supabase";
import type { AiLearningAnalysis } from "@/types/aiAnalysis";

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
  const [aiAnalysis, setAiAnalysis] = useState<AiLearningAnalysis | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");

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

        if (attempts.length === 0) return;

        setAiLoading(true);

        try {
          const {
            data: { session },
            error: sessionError,
          } = await supabase.auth.getSession();

          if (!session || sessionError) {
            throw new Error("Your session is no longer valid. Please log in again.");
          }

          const response = await fetch("/api/ai-analysis", {
            method: "POST",
            headers: { Authorization: `Bearer ${session.access_token}` },
          });
          const result = (await response.json()) as AiLearningAnalysis & {
            error?: string;
          };

          if (!response.ok) {
            throw new Error(result.error || "Could not generate AI analysis.");
          }

          if (active) setAiAnalysis(result);
        } catch (error) {
          if (!active) return;
          const message =
            error instanceof Error ? error.message : "Unknown AI analysis error.";
          setAiError(message);
        } finally {
          if (active) setAiLoading(false);
        }
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
            <RecommendedPractice skills={progress.skills} />
            <AiAnalysisCard
              analysis={aiAnalysis}
              loading={aiLoading}
              error={aiError}
            />
          </div>
        )}
      </section>
    </main>
  );
}

function RecommendedPractice({ skills }: { skills: MasteryArea[] }) {
  const weakestSkill = skills.find(
    (skill) => skill.attempted > 0 && skill.name !== "Uncategorised"
  );

  return (
    <section style={styles.card}>
      <h2 style={styles.sectionTitle}>Recommended Practice</h2>
      {weakestSkill ? (
        <>
          <p style={styles.recommendationText}>
            Focus next on <strong>{weakestSkill.name}</strong>, your lowest-accuracy
            attempted skill at {weakestSkill.accuracy}%.
          </p>
          <Link
            href={`/practice/${encodeURIComponent(weakestSkill.name)}`}
            style={styles.practiceButton}
          >
            Practise {weakestSkill.name}
          </Link>
        </>
      ) : (
        <p style={styles.analysisState}>
          Complete a categorised quiz question to get a targeted recommendation.
        </p>
      )}
    </section>
  );
}

function AiAnalysisCard({
  analysis,
  loading,
  error,
}: {
  analysis: AiLearningAnalysis | null;
  loading: boolean;
  error: string;
}) {
  return (
    <section style={styles.card}>
      <h2 style={styles.sectionTitle}>AI Learning Analysis</h2>
      <p style={styles.analysisNote}>
        Recommendations are generated from the objective results shown above.
      </p>

      {loading ? (
        <div style={styles.analysisState}>Generating your learning analysis...</div>
      ) : error ? (
        <div style={styles.analysisError}>{error}</div>
      ) : analysis ? (
        <div style={styles.analysisContent}>
          <p style={styles.summary}>{analysis.summary}</p>
          <AnalysisList title="Strengths" items={analysis.strengths} />
          <AnalysisList title="Areas to improve" items={analysis.areasToImprove} />
          <AnalysisList
            title="Recommended next steps"
            items={analysis.recommendedNextSteps}
          />
        </div>
      ) : (
        <div style={styles.analysisState}>Analysis is not available yet.</div>
      )}
    </section>
  );
}

function AnalysisList({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h3 style={styles.analysisHeading}>{title}</h3>
      {items.length > 0 ? (
        <ul style={styles.analysisList}>
          {items.map((item, index) => (
            <li key={`${title}-${index}`}>{item}</li>
          ))}
        </ul>
      ) : (
        <p style={styles.analysisState}>No items identified yet.</p>
      )}
    </div>
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
  analysisNote: { margin: "-10px 0 22px", color: "#777", fontSize: 14 },
  analysisState: { color: "#666", lineHeight: 1.5 },
  analysisError: { padding: "16px 18px", background: "#fff3f1", borderRadius: 12, color: "#9c4039", lineHeight: 1.5 },
  analysisContent: { display: "flex", flexDirection: "column", gap: 20 },
  summary: { margin: 0, lineHeight: 1.65, color: "#444" },
  analysisHeading: { margin: "0 0 8px", fontSize: 15, fontWeight: 700 },
  analysisList: { margin: 0, paddingLeft: 22, color: "#555", lineHeight: 1.65 },
  recommendationText: { margin: "-8px 0 20px", color: "#555", lineHeight: 1.6 },
  practiceButton: { display: "inline-block", padding: "12px 18px", borderRadius: 10, background: "#202124", color: "#fff", textDecoration: "none", fontWeight: 600 },
};
