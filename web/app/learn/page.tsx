import Link from "next/link";
import AuthenticatedLearningShell from "@/components/AuthenticatedLearningShell";
import { registeredCourses, type RegisteredCourse } from "@/lib/courseRegistry";

export default function LearnPage() {
  const catalogueGroups = groupCoursesForCatalogue(registeredCourses);

  return (
    <AuthenticatedLearningShell>
      <section style={styles.content}>
        <p style={styles.eyebrow}>LEARN</p>
        <h1 style={styles.title}>Courses</h1>
        <p style={styles.subtitle}>
          Learn one idea at a time, then practise it with questions from LearnAI.
        </p>

        <div style={styles.groups}>
          {catalogueGroups.map((group) => (
            <section key={group.id}>
              <div style={styles.groupHeading}>
                <h2 style={styles.groupTitle}>{group.label}</h2>
                <p style={styles.groupMeta}>{group.courses.length} {group.courses.length === 1 ? "course" : "courses"}</p>
              </div>
              <div style={styles.grid}>
                {group.courses.map((course) => (
                  <article key={course.id} style={styles.card}>
                    <p style={styles.cardEyebrow}>
                      {[course.level, course.subject, course.programme].filter(Boolean).join(" · ")}
                    </p>
                    <h3 style={styles.courseTitle}>{course.title}</h3>
                    <p style={styles.description}>{course.description}</p>
                    <p style={styles.curriculum}>{course.curriculum}</p>
                    <p style={styles.meta}>
                      {course.moduleCount} {course.moduleCount === 1 ? "module" : "modules"} · {course.lessonCount} {course.lessonCount === 1 ? "lesson" : "lessons"}
                    </p>
                    <Link href={`/learn/${course.id}`} style={styles.button}>
                      View course
                    </Link>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      </section>
    </AuthenticatedLearningShell>
  );
}

function groupCoursesForCatalogue(courses: RegisteredCourse[]) {
  const groups = new Map<string, { id: string; label: string; courses: RegisteredCourse[] }>();

  for (const course of courses) {
    const id = course.programmeId ?? course.levelId ?? "other";
    const label = course.programme ?? course.level ?? "Other courses";
    const group = groups.get(id) ?? { id, label, courses: [] };
    group.courses.push(course);
    groups.set(id, group);
  }

  return Array.from(groups.values());
}

const styles: Record<string, React.CSSProperties> = {
  content: { maxWidth: 960, margin: "0 auto", padding: "56px 24px 100px" },
  eyebrow: { margin: 0, color: "#888", fontSize: 12, fontWeight: 700, letterSpacing: "1.5px" },
  title: { margin: "7px 0 8px", fontSize: 30, fontWeight: 600 },
  subtitle: { maxWidth: 640, margin: "0 0 30px", color: "#666", lineHeight: 1.6 },
  groups: { display: "flex", flexDirection: "column", gap: 36 },
  groupHeading: { display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 16, marginBottom: 15 },
  groupTitle: { margin: 0, fontSize: 21, fontWeight: 600 },
  groupMeta: { margin: 0, color: "#888", fontSize: 13 },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 22 },
  card: { display: "flex", flexDirection: "column", alignItems: "flex-start", minHeight: 280, padding: 32, border: "1px solid #eceef1", borderRadius: 18, background: "#fff", boxShadow: "0 10px 30px rgba(0,0,0,0.035)" },
  cardEyebrow: { margin: 0, color: "#7b8290", fontSize: 11, fontWeight: 700, letterSpacing: "1.2px", textTransform: "uppercase" },
  courseTitle: { margin: "12px 0 10px", fontSize: 23, fontWeight: 600 },
  description: { margin: 0, color: "#666", lineHeight: 1.6 },
  curriculum: { margin: "16px 0 0", color: "#7b8290", fontSize: 12 },
  meta: { margin: "20px 0", color: "#888", fontSize: 13 },
  button: { marginTop: "auto", padding: "12px 18px", borderRadius: 10, background: "#202124", color: "#fff", textDecoration: "none", fontWeight: 600 },
};
