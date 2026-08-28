import Link from "next/link";

type AppHeaderProps = {
  activeSection?: "practice" | "learn" | "progress";
  userEmail: string;
};

export default function AppHeader({
  activeSection,
  userEmail,
}: AppHeaderProps) {
  return (
    <header style={styles.header}>
      <div style={styles.brand}>LearnAI</div>
      <nav style={styles.nav}>
        <Link
          href="/"
          style={{
            ...styles.navLink,
            ...(activeSection === "practice" ? styles.activeNav : {}),
          }}
        >
          Dashboard
        </Link>
        <Link
          href="/learn"
          style={{
            ...styles.navLink,
            ...(activeSection === "learn" ? styles.activeNav : {}),
          }}
        >
          Learn
        </Link>
        <Link
          href="/progress"
          style={{
            ...styles.navLink,
            ...(activeSection === "progress" ? styles.activeNav : {}),
          }}
        >
          Progress
        </Link>
        <span>Profile</span>
        <span style={styles.signedIn}>Signed in as {userEmail}</span>
      </nav>
    </header>
  );
}

const styles: Record<string, React.CSSProperties> = {
  header: {
    minHeight: 72,
    background: "#ffffff",
    borderBottom: "1px solid #eceef1",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 16,
    padding: "16px clamp(20px, 4vw, 48px)",
  },
  brand: { fontSize: 22, fontWeight: 700 },
  nav: { display: "flex", flexWrap: "wrap", justifyContent: "flex-end", gap: "12px clamp(16px, 3vw, 32px)", color: "#666", fontSize: 15 },
  navLink: { color: "inherit", textDecoration: "none" },
  activeNav: { color: "#111", fontWeight: 600 },
  signedIn: { color: "#777", fontSize: 13 },
};
