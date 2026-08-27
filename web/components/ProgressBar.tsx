type ProgressBarProps = {
  current: number;
  total: number;
};

export default function ProgressBar({
  current,
  total,
}: ProgressBarProps) {
  const percentage = (current / total) * 100;

  return (
    <div
      style={{
        height: "6px",
        background: "#e5e7ea",
        borderRadius: "999px",
        overflow: "hidden",
        marginBottom: "28px",
      }}
    >
      <div
        style={{
          width: `${percentage}%`,
          height: "100%",
          background: "#222",
          borderRadius: "999px",
          transition: "width 0.25s ease",
        }}
      />
    </div>
  );
}