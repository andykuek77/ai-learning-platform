import Link from "next/link";
import { notFound } from "next/navigation";
import AuthenticatedLearningShell from "@/components/AuthenticatedLearningShell";
import { getLesson } from "@/lib/courseRegistry";

type LessonPageProps = {
  params: Promise<{ courseId: string; lessonId: string }>;
};

export default async function LessonPage({ params }: LessonPageProps) {
  const { courseId, lessonId } = await params;
  const result = getLesson(courseId, lessonId);
  if (!result) notFound();

  const { course, module, lesson, topic, skill, practiceSkill } = result;

  return (
    <AuthenticatedLearningShell>
      <article style={styles.content}>
        <Link href={`/learn/${course.id}`} style={styles.backLink}>
          ← {course.title}
        </Link>

        <header style={styles.lessonHeader}>
          <p style={styles.eyebrow}>{module.title}</p>
          <h1 style={styles.title}>{lesson.title}</h1>
          <p style={styles.description}>{lesson.description}</p>
          <div style={styles.tags}>
            <span style={styles.tag}>{topic.label}</span>
            <span style={styles.tag}>{skill.label}</span>
          </div>
        </header>

        <section style={styles.card}>
          <h2 style={styles.sectionTitle}>What you will learn</h2>
          <ul style={styles.list}>
            {lesson.learningObjectives.map((objective) => (
              <li key={objective}>{objective}</li>
            ))}
          </ul>
        </section>

        {lesson.explanationSections.map((section) => (
          <section key={section.id} style={styles.readingSection}>
            <h2 style={styles.sectionTitle}>{section.title}</h2>
            {section.paragraphs.map((paragraph) => (
              <p key={paragraph} style={styles.paragraph}>{paragraph}</p>
            ))}
          </section>
        ))}

        {lesson.workedExamples.map((example) => (
          <section key={example.id} style={styles.exampleCard}>
            <p style={styles.exampleLabel}>WORKED EXAMPLE</p>
            <h2 style={styles.sectionTitle}>{example.title}</h2>
            <p style={styles.problem}>{example.problem}</p>
            <ol style={styles.steps}>
              {example.steps.map((step) => <li key={step}>{step}</li>)}
            </ol>
            <p style={styles.answer}><strong>Answer:</strong> {example.answer}</p>
          </section>
        ))}

        {lesson.keyPoints && lesson.keyPoints.length > 0 ? (
          <section style={styles.tipCard}>
            <h2 style={styles.sectionTitle}>Key points</h2>
            <ul style={styles.list}>
              {lesson.keyPoints.map((point) => <li key={point}>{point}</li>)}
            </ul>
          </section>
        ) : null}

        <section style={styles.practiceCard}>
          <div>
            <p style={styles.practiceLabel}>READY TO TRY?</p>
            <h2 style={styles.practiceTitle}>Practise {skill.label}</h2>
            <p style={styles.practiceText}>
              Use questions from the existing LearnAI question bank.
            </p>
          </div>
          <Link
            href={`/practice/${encodeURIComponent(practiceSkill.id)}`}
            style={styles.practiceButton}
          >
            Practice This Skill
          </Link>
        </section>
      </article>
    </AuthenticatedLearningShell>
  );
}

const styles: Record<string, React.CSSProperties> = {
  content: { maxWidth: 780, margin: "0 auto", padding: "44px 24px 100px" },
  backLink: { display: "inline-block", marginBottom: 28, color: "#555", textDecoration: "none", fontWeight: 600 },
  lessonHeader: { marginBottom: 30 },
  eyebrow: { margin: 0, color: "#777f90", fontSize: 12, fontWeight: 700, letterSpacing: "1.4px", textTransform: "uppercase" },
  title: { margin: "9px 0 12px", fontSize: 34, fontWeight: 600, lineHeight: 1.2 },
  description: { margin: 0, color: "#60646b", fontSize: 17, lineHeight: 1.65 },
  tags: { display: "flex", flexWrap: "wrap", gap: 8, marginTop: 20 },
  tag: { padding: "7px 10px", borderRadius: 999, background: "#eef1ff", color: "#4c5fbd", fontSize: 12, fontWeight: 600 },
  card: { marginBottom: 24, padding: 28, border: "1px solid #e6e9f7", borderRadius: 17, background: "#f8f9ff" },
  readingSection: { padding: "22px 4px" },
  sectionTitle: { margin: "0 0 14px", fontSize: 21, fontWeight: 600 },
  paragraph: { margin: 0, color: "#51555c", fontSize: 16, lineHeight: 1.75 },
  list: { margin: 0, paddingLeft: 22, color: "#51555c", lineHeight: 1.75 },
  exampleCard: { margin: "20px 0", padding: 30, borderRadius: 18, background: "#fff", border: "1px solid #e7e9ed", boxShadow: "0 10px 30px rgba(0,0,0,0.035)" },
  exampleLabel: { margin: "0 0 9px", color: "#536dfe", fontSize: 11, fontWeight: 700, letterSpacing: "1.3px" },
  problem: { margin: "0 0 18px", padding: 18, borderRadius: 12, background: "#f7f8fa", color: "#393c42", fontWeight: 600, lineHeight: 1.6 },
  steps: { margin: "0 0 20px", paddingLeft: 24, color: "#51555c", lineHeight: 1.75 },
  answer: { margin: 0, padding: "14px 16px", borderRadius: 10, background: "#eef9f2", color: "#24693c" },
  tipCard: { margin: "24px 0", padding: 28, borderRadius: 17, background: "#fff8e6", border: "1px solid #f2e4b9" },
  practiceCard: { display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 26, marginTop: 34, padding: 30, borderRadius: 18, background: "#202124", color: "#fff" },
  practiceLabel: { margin: 0, color: "#aeb5c2", fontSize: 11, fontWeight: 700, letterSpacing: "1.3px" },
  practiceTitle: { margin: "8px 0 0", fontSize: 22, fontWeight: 600 },
  practiceText: { margin: "8px 0 0", color: "#d4d7dc", lineHeight: 1.5 },
  practiceButton: { display: "inline-block", flexShrink: 0, padding: "12px 18px", borderRadius: 10, background: "#fff", color: "#202124", textDecoration: "none", fontWeight: 700 },
};
