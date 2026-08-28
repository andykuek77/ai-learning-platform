"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { MasteryArea } from "@/lib/analytics";

export default function TopicPerformanceChart({
  topics,
}: {
  topics: MasteryArea[];
}) {
  return (
    <section style={styles.card} aria-labelledby="topic-performance-title">
      <h2 id="topic-performance-title" style={styles.title}>Performance by Topic</h2>
      <p style={styles.subtitle}>Accuracy for curriculum topics you have attempted.</p>

      {topics.length > 0 ? (
        <>
          <div style={{ ...styles.chart, height: Math.max(260, topics.length * 52) }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={topics}
                layout="vertical"
                margin={{ top: 8, right: 44, bottom: 8, left: 8 }}
                accessibilityLayer
              >
                <CartesianGrid stroke="#eceef1" strokeDasharray="3 3" horizontal={false} />
                <XAxis
                  type="number"
                  domain={[0, 100]}
                  tickFormatter={(value) => `${value}%`}
                  tick={{ fill: "#777", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={112}
                  tick={{ fill: "#555", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  formatter={(value) => [`${value}%`, "Accuracy"]}
                  cursor={{ fill: "#f4f5f7" }}
                  contentStyle={styles.tooltip}
                />
                <Bar dataKey="accuracy" fill="#536dfe" radius={[0, 7, 7, 0]} maxBarSize={24}>
                  <LabelList
                    dataKey="accuracy"
                    position="right"
                    formatter={(value) => `${value}%`}
                    fill="#444"
                    fontSize={12}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <ul style={styles.textList} aria-label="Topic performance values">
            {topics.map((topic) => (
              <li key={topic.name} style={styles.textItem}>
                <span>{topic.name}</span>
                <strong>{topic.accuracy}% ({topic.correct}/{topic.attempted} correct)</strong>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p style={styles.empty}>Complete categorized questions to see topic performance.</p>
      )}
    </section>
  );
}

const styles: Record<string, React.CSSProperties> = {
  card: { minWidth: 0, padding: 28, border: "1px solid #eceef1", borderRadius: 18, background: "#fff", boxShadow: "0 10px 30px rgba(0,0,0,0.035)" },
  title: { margin: 0, fontSize: 20, fontWeight: 600 },
  subtitle: { margin: "7px 0 20px", color: "#777", fontSize: 14, lineHeight: 1.5 },
  chart: { width: "100%", minWidth: 0 },
  tooltip: { border: "1px solid #e2e5e9", borderRadius: 10, boxShadow: "0 8px 24px rgba(0,0,0,0.08)" },
  textList: { display: "flex", flexDirection: "column", gap: 8, margin: "18px 0 0", padding: 0, listStyle: "none", color: "#666", fontSize: 12 },
  textItem: { display: "flex", justifyContent: "space-between", gap: 16, lineHeight: 1.4 },
  empty: { margin: "24px 0 0", color: "#777", lineHeight: 1.55 },
};
