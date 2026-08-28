"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import AppHeader from "@/components/AppHeader";
import { createHybridContentRepository } from "@/lib/contentRepository";
import { supabase } from "@/lib/supabase";
import type { ContentRepository, ContentRepositoryDiagnostic } from "@/types/contentRepository";

const LearningContentContext = createContext<ContentRepository | null>(null);

export function useLearningContentRepository() {
  const repository = useContext(LearningContentContext);
  if (!repository) {
    throw new Error("Learning content must be used inside AuthenticatedLearningShell");
  }
  return repository;
}

export default function AuthenticatedLearningShell({
  children,
}: {
  children: ReactNode;
}) {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const repository = useMemo(
    () => createHybridContentRepository(supabase, { onDiagnostic: reportContentDiagnostic }),
    []
  );

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
      <LearningContentContext.Provider value={repository}>
        {children}
      </LearningContentContext.Provider>
    </main>
  );
}

function reportContentDiagnostic(diagnostic: ContentRepositoryDiagnostic) {
  if (process.env.NODE_ENV !== "development") return;
  try {
    console.info("[LearnAI content repository]", diagnostic);
    window.sessionStorage.setItem(
      "learnai:last-content-source",
      JSON.stringify(diagnostic)
    );
  } catch {
    // Storage and console diagnostics are never part of application behavior.
  }
}

const styles: Record<string, React.CSSProperties> = {
  page: { minHeight: "100vh", background: "#f7f8fa", color: "#202124", fontFamily: "Arial, Helvetica, sans-serif" },
  loading: { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#666" },
};
