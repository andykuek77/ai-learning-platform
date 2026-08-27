type QuizControlsProps = {
  isFirstQuestion: boolean;
  isLastQuestion: boolean;
  hasSelection: boolean;
  hasFeedback: boolean;
  saving: boolean;
  onPrevious: () => void;
  onContinue: () => void;
};

export default function QuizControls(props: QuizControlsProps) {
  const disabled = !props.hasSelection || props.saving;
  return (
    <div style={styles.controls}>
      <button
        type="button"
        onClick={props.onPrevious}
        disabled={props.isFirstQuestion || props.saving}
        style={{ ...styles.secondaryButton, opacity: props.isFirstQuestion || props.saving ? 0.4 : 1 }}
      >
        ← Previous
      </button>
      <button
        type="button"
        onClick={props.onContinue}
        disabled={disabled}
        style={{ ...styles.primaryButton, opacity: disabled ? 0.45 : 1 }}
      >
        {props.saving
          ? "Saving..."
          : !props.hasFeedback
            ? "Check answer"
            : props.isLastQuestion
              ? "Finish"
              : "Continue"}
      </button>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  controls: { display: "flex", justifyContent: "space-between", marginTop: 24 },
  primaryButton: {
    background: "#202124", color: "#fff", border: "none", borderRadius: 10,
    padding: "14px 25px", fontSize: 15, fontWeight: 600, cursor: "pointer",
  },
  secondaryButton: {
    background: "transparent", color: "#444", border: "1px solid #d9dcdf",
    borderRadius: 10, padding: "14px 22px", fontSize: 15, cursor: "pointer",
  },
};
