type ResultCardProps = {
  completionTitle: string;
  score: number;
  totalMarks: number;
  saveMessage: string;
  onRestart: () => void;
};

export default function ResultCard({ completionTitle, score, totalMarks, saveMessage, onRestart }: ResultCardProps) {
  const percentage = Math.round((score / totalMarks) * 100);
  return (
    <section style={styles.resultCard}>
      <div style={styles.badge}>Practice completed</div>
      <h1 style={styles.resultTitle}>Nice work.</h1>
      <p style={styles.subtitle}>You completed {completionTitle}.</p>
      <div style={styles.scoreCircle}>
        <div style={styles.scorePercent}>{percentage}%</div>
        <div style={styles.scoreText}>{score} / {totalMarks}</div>
      </div>
      {saveMessage && <p style={styles.saveMessage}>{saveMessage}</p>}
      <button onClick={onRestart} style={styles.primaryButton}>Practise again</button>
    </section>
  );
}

const styles: Record<string, React.CSSProperties> = {
  resultCard: { maxWidth: 650, margin: "80px auto", background: "#fff", border: "1px solid #eceef1", borderRadius: 20, padding: 60, textAlign: "center" },
  badge: { display: "inline-block", background: "#eef3ff", padding: "8px 14px", borderRadius: 999, fontSize: 13, marginBottom: 20 },
  resultTitle: { fontSize: 34, marginBottom: 10 },
  subtitle: { color: "#666" },
  scoreCircle: { width: 160, height: 160, borderRadius: "50%", border: "8px solid #f0f1f3", margin: "36px auto", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" },
  scorePercent: { fontSize: 38, fontWeight: 700 },
  scoreText: { color: "#777", marginTop: 4 },
  saveMessage: { color: "#666", marginBottom: 20 },
  primaryButton: { background: "#202124", color: "#fff", border: "none", borderRadius: 10, padding: "14px 25px", fontSize: 15, fontWeight: 600, cursor: "pointer" },
};
