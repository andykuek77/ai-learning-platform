import AuthenticatedLearningShell from "@/components/AuthenticatedLearningShell";
import CourseContent from "@/components/learning/CourseContent";

type CoursePageProps = {
  params: Promise<{ courseId: string }>;
};

export default async function CoursePage({ params }: CoursePageProps) {
  const { courseId } = await params;
  return (
    <AuthenticatedLearningShell>
      <CourseContent courseId={courseId} />
    </AuthenticatedLearningShell>
  );
}
