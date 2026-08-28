import AuthenticatedLearningShell from "@/components/AuthenticatedLearningShell";
import LessonContent from "@/components/learning/LessonContent";

type LessonPageProps = {
  params: Promise<{ courseId: string; lessonId: string }>;
};

export default async function LessonPage({ params }: LessonPageProps) {
  const { courseId, lessonId } = await params;
  return (
    <AuthenticatedLearningShell>
      <LessonContent courseId={courseId} lessonId={lessonId} />
    </AuthenticatedLearningShell>
  );
}
