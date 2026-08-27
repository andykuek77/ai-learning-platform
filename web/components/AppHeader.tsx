type AppHeaderProps = { practiceActive?: boolean };

export default function AppHeader({ practiceActive = false }: AppHeaderProps) {
  return (
    <header style={styles.header}>
      <div style={styles.brand}>LearnAI</div>
      <nav style={styles.nav}>
        <span style={practiceActive ? styles.activeNav : undefined}>Practice</span>
        <span>Progress</span>
        <span>Profile</span>
      </nav>
    </header>
  );
}

const styles: Record<string, React.CSSProperties> = {
  header: {
    height: 72,
    background: "#ffffff",
    borderBottom: "1px solid #eceef1",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 48px",
  },
  brand: { fontSize: 22, fontWeight: 700 },
  nav: { display: "flex", gap: 32, color: "#666", fontSize: 15 },
  activeNav: { color: "#111", fontWeight: 600 },
};
