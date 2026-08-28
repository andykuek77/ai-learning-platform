import Link from "next/link";
import { notFound } from "next/navigation";
import AuthenticatedLearningShell from "@/components/AuthenticatedLearningShell";
import { getCourse, getLessonTaxonomy } from "@/lib/courseRegistry";

type CoursePageProps = {
  params: Promise<{ courseId: string }>;
};

export default async function CoursePage({ params }: CoursePageProps) {
  const { courseId } = await params;
  const course = getCourse(courseId);
  if (!course) notFound();

  return (
    <AuthenticatedLearningShell>
      <section style={styles.content}>
        <Link href="/learn" style={styles.backLink}>← All courses</Link>
        <p style={styles.eyebrow}>
          {[course.level?.label, course.subject.label, course.programme?.label].filter(Boolean).join(" · ")}
        </p>
        <h1 style={styles.title}>{course.title}</h1>
        <p style={styles.subtitle}>{course.description}</p>

        <div style={styles.modules}>
          {course.modules.map((module, moduleIndex) => (
            <section key={module.id} style={styles.moduleCard}>
              <p style={styles.moduleNumber}>MODULE {moduleIndex + 1}</p>
              <h2 style={styles.moduleTitle}>{module.title}</h2>
              <p style={styles.moduleDescription}>{module.description}</p>

              <div style={styles.lessons}>
                {module.lessons.map((lesson, lessonIndex) => {
                  const taxonomy = getLessonTaxonomy(lesson);
                  return <article key={lesson.id} style={styles.lessonRow}>
                    <div style={styles.lessonNumber}>{lessonIndex + 1}</div>
                    <div style={styles.lessonCopy}>
                      <h3 style={styles.lessonTitle}>{lesson.title}</h3>
                      <p style={styles.lessonDescription}>{lesson.description}</p>
                      <p style={styles.lessonMeta}>{taxonomy.topic.label} · {taxonomy.skill.label}</p>
                    </div>
                    <Link
                      href={`/learn/${course.id}/${lesson.id}`}
                      style={styles.lessonLink}
                    >
                      Start lesson
                    </Link>
                  </article>;
                })}
              </div>
            </section>
          ))}
        </div>
      </section>
    </AuthenticatedLearningShell>
  );
}

const styles: Record<string, React.CSSProperties> = {
  content: { maxWidth: 920, margin: "0 auto", padding: "48px 24px 100px" },
  backLink: { display: "inline-block", marginBottom: 32, color: "#555", textDecoration: "none", fontWeight: 600 },
  eyebrow: { margin: 0, color: "#888", fontSize: 12, fontWeight: 700, letterSpacing: "1.4px", textTransform: "uppercase" },
  title: { margin: "8px 0 10px", fontSize: 32, fontWeight: 600 },
  subtitle: { maxWidth: 680, margin: "0 0 36px", color: "#666", lineHeight: 1.6 },
  modules: { display: "flex", flexDirection: "column", gap: 24 },
  moduleCard: { padding: 32, border: "1px solid #eceef1", borderRadius: 18, background: "#fff", boxShadow: "0 10px 30px rgba(0,0,0,0.035)" },
  moduleNumber: { margin: 0, color: "#7d8492", fontSize: 11, fontWeight: 700, letterSpacing: "1.3px" },
  moduleTitle: { margin: "9px 0 8px", fontSize: 23, fontWeight: 600 },
  moduleDescription: { margin: "0 0 24px", color: "#666", lineHeight: 1.55 },
  lessons: { display: "flex", flexDirection: "column", borderTop: "1px solid #eceef1" },
  lessonRow: { display: "flex", flexWrap: "wrap", alignItems: "center", gap: 18, padding: "22px 0", borderBottom: "1px solid #eceef1" },
  lessonNumber: { display: "flex", alignItems: "center", justifyContent: "center", width: 36, height: 36, flexShrink: 0, borderRadius: 12, background: "#eef1ff", color: "#536dfe", fontWeight: 700 },
  lessonCopy: { minWidth: 0, flex: 1 },
  lessonTitle: { margin: 0, fontSize: 17, fontWeight: 600 },
  lessonDescription: { margin: "6px 0", color: "#666", lineHeight: 1.5 },
  lessonMeta: { margin: 0, color: "#8a8d91", fontSize: 12 },
  lessonLink: { flexShrink: 0, padding: "10px 14px", borderRadius: 9, background: "#202124", color: "#fff", textDecoration: "none", fontSize: 14, fontWeight: 600 },
};
