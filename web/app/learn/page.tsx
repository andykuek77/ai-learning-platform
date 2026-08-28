import AuthenticatedLearningShell from "@/components/AuthenticatedLearningShell";
import LearnCatalogue from "@/components/learning/LearnCatalogue";

export default function LearnPage() {
  return (
    <AuthenticatedLearningShell>
      <LearnCatalogue />
    </AuthenticatedLearningShell>
  );
}
