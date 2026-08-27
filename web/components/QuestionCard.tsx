import type { AnswerFeedback, Question } from "@/types/quiz";

type QuestionCardProps = {
  question: Question;
  selectedOption: number | null;
  feedback: AnswerFeedback;
  onSelect: (option: number) => void;
};

export default function QuestionCard({
  question,
  selectedOption,
  feedback,
  onSelect,
}: QuestionCardProps) {
  return (
    <div style={styles.card}>
      <p style={styles.questionLabel}>QUESTION {question.id}</p>
      <h2 style={styles.questionText}>{question.question}</h2>
      <div style={styles.options}>
        {question.options.map((option, index) => {
          const optionNumber = index + 1;
          const selected = selectedOption === optionNumber;
          const isCorrect = feedback !== null && optionNumber === question.correctOption;
          const isWrong = feedback === "incorrect" && selected && !isCorrect;
          let optionStyle = { ...styles.option };
          if (selected) optionStyle = { ...optionStyle, ...styles.selectedOption };
          if (isCorrect) optionStyle = { ...optionStyle, ...styles.correctOption };
          if (isWrong) optionStyle = { ...optionStyle, ...styles.wrongOption };

          return (
            <label key={index} style={optionStyle}>
              <input
                type="radio"
                name="answer"
                checked={selected}
                disabled={feedback !== null}
                onChange={() => onSelect(optionNumber)}
                style={{ display: "none" }}
              />
              <span style={styles.optionNumber}>{optionNumber}</span>
              <span>{option}</span>
            </label>
          );
        })}
      </div>

      {feedback === "correct" && (
        <div style={styles.goodFeedback}>
          <strong>Correct</strong>
          <div style={{ marginTop: 6 }}>Well done. Continue when you are ready.</div>
        </div>
      )}
      {feedback === "incorrect" && (
        <div style={styles.badFeedback}>
          <strong>Not quite</strong>
          <div style={{ marginTop: 6 }}>The correct answer is {question.correctAnswer}.</div>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  card: {
    background: "#fff", border: "1px solid #eceef1", borderRadius: 18,
    padding: 42, boxShadow: "0 10px 30px rgba(0,0,0,0.035)",
  },
  questionLabel: { marginTop: 0, fontSize: 12, fontWeight: 700, letterSpacing: "1.4px", color: "#8a8d91" },
  questionText: { fontSize: 23, fontWeight: 500, lineHeight: 1.55, marginBottom: 32 },
  options: { display: "flex", flexDirection: "column", gap: 12 },
  option: {
    border: "1px solid #e0e3e7", borderRadius: 12, padding: "16px 18px",
    display: "flex", alignItems: "center", gap: 14, background: "#fff",
    cursor: "pointer", fontSize: 17,
  },
  selectedOption: { border: "2px solid #222", background: "#f8f8f8" },
  correctOption: { border: "1px solid #7abf93", background: "#eef9f2" },
  wrongOption: { border: "1px solid #d88d8d", background: "#fff2f2" },
  optionNumber: {
    width: 32, height: 32, borderRadius: "50%", border: "1px solid #d8dadd",
    display: "flex", alignItems: "center", justifyContent: "center",
    flexShrink: 0, fontSize: 14, fontWeight: 600,
  },
  goodFeedback: { marginTop: 26, padding: "18px 20px", background: "#eef9f2", borderRadius: 12, color: "#24693c" },
  badFeedback: { marginTop: 26, padding: "18px 20px", background: "#fff3f1", borderRadius: 12, color: "#9c4039" },
};
