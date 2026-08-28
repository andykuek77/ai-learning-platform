"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import AppHeader from "@/components/AppHeader";
import { supabase } from "@/lib/supabase";

export default function AuthenticatedLearningShell({
  children,
}: {
  children: ReactNode;
}) {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function requireAuthenticatedUser() {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (!active) return;
      if (error || !user) {
        router.replace("/login");
        return;
      }

      setUserEmail(user.email ?? "Authenticated user");
    }

    void requireAuthenticatedUser();
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
      <AppHeader activeSection="learn" userEmail={userEmail} />
      {children}
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { minHeight: "100vh", background: "#f7f8fa", color: "#202124", fontFamily: "Arial, Helvetica, sans-serif" },
  loading: { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#666" },
};
