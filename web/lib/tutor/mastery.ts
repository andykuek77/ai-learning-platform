import type { CoreMasteryResult, EvidenceCategory, TutorAttempt } from "@/types/tutor";

const categories: EvidenceCategory[] = ["BASIC_RELATIONSHIP", "REVERSED_RELATIONSHIP", "TRANSFER"];

export function calculateCoreMastery(attempts: TutorAttempt[]): CoreMasteryResult {
  const demonstrated = Object.fromEntries(categories.map((category) => [
    category,
    attempts.some((attempt) =>
      attempt.correct &&
      attempt.masteryEligible &&
      attempt.assistance === "INDEPENDENT" &&
      attempt.purpose !== "CHALLENGE" &&
      attempt.evidenceCategory === category
    ),
  ])) as Record<EvidenceCategory, boolean>;
  return { demonstrated: categories.every((category) => demonstrated[category]), categories: demonstrated };
}
