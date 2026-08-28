import Link from "next/link";

type AppHeaderProps = {
  activeSection?: "practice" | "progress";
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
  navLink: { color: "inherit", textDecoration: "none" },
  activeNav: { color: "#111", fontWeight: 600 },
  signedIn: { color: "#777", fontSize: 13 },
};
