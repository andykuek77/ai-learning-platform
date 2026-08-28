"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type QuizPerformancePoint = {
  id: string;
  quizTitle: string;
  axisLabel: string;
  dateLabel: string;
  score: number;
  totalMarks: number;
  accuracy: number;
};

export default function RecentQuizPerformanceChart({
  attempts,
}: {
  attempts: QuizPerformancePoint[];
}) {
  return (
    <section style={styles.card} aria-labelledby="recent-performance-title">
      <h2 id="recent-performance-title" style={styles.title}>Recent Quiz Performance</h2>
      <p style={styles.subtitle}>Registered mock-test scores in chronological order.</p>

      {attempts.length > 0 ? (
        <>
          <div style={styles.chart}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={attempts}
                margin={{ top: 14, right: 18, bottom: 8, left: 0 }}
                accessibilityLayer
              >
                <CartesianGrid stroke="#eceef1" strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="axisLabel"
                  tick={{ fill: "#777", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, 100]}
                  tickFormatter={(value) => `${value}%`}
                  tick={{ fill: "#777", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={42}
                />
                <Tooltip
                  formatter={(value, _, item) => {
                    const point = item.payload as QuizPerformancePoint;
                    return [
                      `${value}% (${point.score}/${point.totalMarks})`,
                      "Score",
                    ];
                  }}
                  labelFormatter={(_, payload) => {
                    const point = payload[0]?.payload as QuizPerformancePoint | undefined;
                    return point
                      ? `${point.axisLabel}: ${point.quizTitle} - ${point.dateLabel}`
                      : "Quiz result";
                  }}
                  contentStyle={styles.tooltip}
                />
                <Line
                  type="monotone"
                  dataKey="accuracy"
                  name="Score"
                  stroke="#536dfe"
                  strokeWidth={3}
                  dot={{ r: 4, fill: "#536dfe", strokeWidth: 0 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <ol style={styles.textList} aria-label="Recent mock-test score values">
            {attempts.map((attempt) => (
              <li key={attempt.id} style={styles.textItem}>
                <span>{attempt.axisLabel}: {attempt.quizTitle} - {attempt.dateLabel}</span>
                <strong>{attempt.accuracy}% ({attempt.score}/{attempt.totalMarks})</strong>
              </li>
            ))}
          </ol>
        </>
      ) : (
        <p style={styles.empty}>Complete a registered mock test to start your score trend.</p>
      )}
    </section>
  );
}

const styles: Record<string, React.CSSProperties> = {
  card: { minWidth: 0, padding: 28, border: "1px solid #eceef1", borderRadius: 18, background: "#fff", boxShadow: "0 10px 30px rgba(0,0,0,0.035)" },
  title: { margin: 0, fontSize: 20, fontWeight: 600 },
  subtitle: { margin: "7px 0 20px", color: "#777", fontSize: 14, lineHeight: 1.5 },
  chart: { width: "100%", height: 300, minWidth: 0 },
  tooltip: { border: "1px solid #e2e5e9", borderRadius: 10, boxShadow: "0 8px 24px rgba(0,0,0,0.08)" },
  textList: { display: "flex", flexDirection: "column", gap: 8, margin: "18px 0 0", padding: 0, listStyle: "none", color: "#666", fontSize: 12 },
  textItem: { display: "flex", justifyContent: "space-between", gap: 16, lineHeight: 1.4 },
  empty: { margin: "24px 0 0", color: "#777", lineHeight: 1.55 },
};
