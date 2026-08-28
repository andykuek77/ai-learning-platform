import type { SupabaseClient } from "@supabase/supabase-js";
import {
  getCourse as getStaticCourse,
  getLesson as getStaticLesson,
  getSkill,
  getTopic,
  registeredCourses,
} from "@/lib/courseRegistry";
import type { ContentRepository, PublishedLesson } from "@/types/contentRepository";
import type { Course, CourseModule, Lesson, LessonExplanationSection, WorkedExample } from "@/types/course";
import type { ContentOrigin, ContentStatus, CurriculumLevelKind, LessonDifficulty } from "@/types/curriculum";

type CourseRow = {
  id: string;
  title: string;
  description: string;
  level_id: string | null;
  level_label: string | null;
  level_kind: string | null;
  subject_id: string;
  subject_label: string;
  programme_id: string | null;
  programme_label: string | null;
  category_id: string | null;
  category_label: string | null;
  curriculum_id: string;
  curriculum_title: string;
  curriculum_jurisdiction: string | null;
  curriculum_version: string | null;
  status: string;
  content_origin: string;
  authors: string[];
  curriculum_references: string[];
  ai_assisted: boolean;
  reviewer: string | null;
  reviewed_at: string | null;
  internal_notes: string | null;
};

type ModuleRow = {
  course_id: string;
  id: string;
  title: string;
  description: string;
  position: number;
  status: string;
  content_origin: string;
  authors: string[];
  curriculum_references: string[];
  ai_assisted: boolean;
  reviewer: string | null;
  reviewed_at: string | null;
  internal_notes: string | null;
};

type LessonRow = ModuleRow & {
  module_id: string;
  topic_id: string;
  skill_id: string;
  targeted_practice_skill_id: string;
  guided_practice_skill_id: string | null;
  independent_practice_skill_id: string | null;
  learning_objectives: string[];
  explanation_sections: unknown;
  worked_examples: unknown;
  key_points: string[] | null;
  prerequisite_lesson_ids: string[] | null;
  difficulty: string | null;
  estimated_duration_minutes: number | null;
  media: unknown;
};

export function createSupabaseContentRepository(
  supabase: SupabaseClient
): ContentRepository {
  return {
    async getPublishedCourses() {
      return loadCourses(supabase);
    },

    async getPublishedCourse(courseId) {
      const courses = await loadCourses(supabase, courseId);
      return courses[0];
    },

    async getPublishedLesson(courseId, lessonId) {
      const courses = await loadCourses(supabase, courseId);
      const course = courses[0];
      if (!course) return undefined;
      return findPublishedLesson(course, lessonId);
    },
  };
}

export const staticContentRepository: ContentRepository = {
  async getPublishedCourses() {
    return registeredCourses.flatMap((registered) => {
      const course = getStaticCourse(registered.id);
      return course ? [course] : [];
    });
  },

  async getPublishedCourse(courseId) {
    return getStaticCourse(courseId);
  },

  async getPublishedLesson(courseId, lessonId) {
    return getStaticLesson(courseId, lessonId);
  },
};

export function createHybridContentRepository(
  supabase: SupabaseClient
): ContentRepository {
  const database = createSupabaseContentRepository(supabase);

  return {
    async getPublishedCourses() {
      const fallbackCourses = await staticContentRepository.getPublishedCourses();
      try {
        const databaseCourses = await database.getPublishedCourses();
        return mergeCourses(databaseCourses, fallbackCourses);
      } catch {
        return fallbackCourses;
      }
    },

    async getPublishedCourse(courseId) {
      try {
        const course = await database.getPublishedCourse(courseId);
        if (course) return course;
      } catch {
        // The fallback keeps learning available before the migration is applied.
      }
      return staticContentRepository.getPublishedCourse(courseId);
    },

    async getPublishedLesson(courseId, lessonId) {
      try {
        const lesson = await database.getPublishedLesson(courseId, lessonId);
        if (lesson) return lesson;
      } catch {
        // The fallback keeps learning available before the migration is applied.
      }
      return staticContentRepository.getPublishedLesson(courseId, lessonId);
    },
  };
}

async function loadCourses(supabase: SupabaseClient, courseId?: string) {
  let courseQuery = supabase.from("courses").select("*").eq("status", "published");
  let moduleQuery = supabase.from("course_modules").select("*").eq("status", "published").order("position");
  let lessonQuery = supabase.from("lessons").select("*").eq("status", "published").order("position");

  if (courseId) {
    courseQuery = courseQuery.eq("id", courseId);
    moduleQuery = moduleQuery.eq("course_id", courseId);
    lessonQuery = lessonQuery.eq("course_id", courseId);
  }

  const [courseResult, moduleResult, lessonResult] = await Promise.all([
    courseQuery,
    moduleQuery,
    lessonQuery,
  ]);

  const error = courseResult.error ?? moduleResult.error ?? lessonResult.error;
  if (error) throw new Error(`Could not load published curriculum: ${error.message}`);

  const courseRows = (courseResult.data ?? []) as CourseRow[];
  const moduleRows = (moduleResult.data ?? []) as ModuleRow[];
  const lessonRows = (lessonResult.data ?? []) as LessonRow[];

  return courseRows.map((row) => convertCourse(row, moduleRows, lessonRows));
}

function convertCourse(
  row: CourseRow,
  moduleRows: ModuleRow[],
  lessonRows: LessonRow[]
): Course {
  const status = parseStatus(row.status);
  if (status !== "published") throw new Error(`Course ${row.id} is not published`);

  return {
    id: row.id,
    title: row.title,
    description: row.description,
    ...(row.level_id && row.level_label && row.level_kind
      ? { level: { id: row.level_id, label: row.level_label, kind: parseLevelKind(row.level_kind) } }
      : {}),
    subject: { id: row.subject_id, label: row.subject_label },
    ...(row.programme_id && row.programme_label
      ? { programme: { id: row.programme_id, label: row.programme_label } }
      : {}),
    ...(row.category_id && row.category_label
      ? { category: { id: row.category_id, label: row.category_label } }
      : {}),
    curriculum: {
      id: row.curriculum_id,
      title: row.curriculum_title,
      ...(row.curriculum_jurisdiction ? { jurisdiction: row.curriculum_jurisdiction } : {}),
      ...(row.curriculum_version ? { version: row.curriculum_version } : {}),
    },
    status,
    provenance: convertProvenance(row),
    modules: moduleRows
      .filter((moduleRow) => moduleRow.course_id === row.id)
      .sort((a, b) => a.position - b.position)
      .map((moduleRow) => convertModule(moduleRow, lessonRows)),
  };
}

function convertModule(row: ModuleRow, lessonRows: LessonRow[]): CourseModule {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    status: parseStatus(row.status),
    provenance: convertProvenance(row),
    lessons: lessonRows
      .filter((lessonRow) => lessonRow.course_id === row.course_id && lessonRow.module_id === row.id)
      .sort((a, b) => a.position - b.position)
      .map(convertLesson),
  };
}

function convertLesson(row: LessonRow): Lesson {
  const topic = getTopic(row.topic_id);
  const skill = getSkill(row.skill_id);
  const practiceSkill = getSkill(row.targeted_practice_skill_id);
  if (!topic || !skill || !practiceSkill || skill.topicId !== topic.id) {
    throw new Error(`Lesson ${row.course_id}/${row.id} has invalid canonical taxonomy IDs`);
  }

  return {
    id: row.id,
    title: row.title,
    description: row.description,
    taxonomy: { topicId: topic.id, skillId: skill.id },
    status: parseStatus(row.status),
    provenance: convertProvenance(row),
    learningObjectives: parseStringArray(row.learning_objectives, "learning objectives", row.id),
    explanationSections: parseExplanationSections(row.explanation_sections, row.id),
    workedExamples: parseWorkedExamples(row.worked_examples, row.id),
    ...(row.key_points ? { keyPoints: parseStringArray(row.key_points, "key points", row.id) } : {}),
    practice: {
      targetedPracticeSkillId: practiceSkill.id,
      ...(row.guided_practice_skill_id ? { guidedPracticeSkillId: requireSkill(row.guided_practice_skill_id, row.id) } : {}),
      ...(row.independent_practice_skill_id ? { independentPracticeSkillId: requireSkill(row.independent_practice_skill_id, row.id) } : {}),
    },
    ...(row.prerequisite_lesson_ids ? { prerequisiteLessonIds: row.prerequisite_lesson_ids } : {}),
    ...(row.difficulty ? { difficulty: parseDifficulty(row.difficulty) } : {}),
    ...(row.estimated_duration_minutes ? { estimatedDurationMinutes: row.estimated_duration_minutes } : {}),
    ...(isMedia(row.media) ? { media: row.media } : {}),
  };
}

function findPublishedLesson(course: Course, lessonId: string): PublishedLesson | undefined {
  for (const courseModule of course.modules) {
    const lesson = courseModule.lessons.find((candidate) => candidate.id === lessonId);
    if (!lesson) continue;
    const topic = getTopic(lesson.taxonomy.topicId);
    const skill = getSkill(lesson.taxonomy.skillId);
    const practiceSkill = getSkill(lesson.practice.targetedPracticeSkillId);
    if (!topic || !skill || !practiceSkill) return undefined;
    return { course, module: courseModule, lesson, topic, skill, practiceSkill };
  }
  return undefined;
}

function mergeCourses(primary: Course[], fallback: Course[]) {
  const courses = new Map(fallback.map((course) => [course.id, course]));
  for (const course of primary) courses.set(course.id, course);
  return Array.from(courses.values());
}

function convertProvenance(row: CourseRow | ModuleRow) {
  return {
    origin: parseOrigin(row.content_origin),
    authors: parseStringArray(row.authors, "authors", row.id),
    curriculumReferences: parseStringArray(row.curriculum_references, "curriculum references", row.id),
    aiAssisted: row.ai_assisted,
    ...(row.reviewer ? { reviewer: row.reviewer } : {}),
    ...(row.reviewed_at ? { reviewedAt: row.reviewed_at } : {}),
    ...(row.internal_notes ? { internalNotes: row.internal_notes } : {}),
  };
}

function parseStatus(value: string): ContentStatus {
  if (["draft", "reviewed", "approved", "published"].includes(value)) return value as ContentStatus;
  throw new Error(`Invalid content status: ${value}`);
}

function parseOrigin(value: string): ContentOrigin {
  if (["original", "adapted", "licensed", "commissioned"].includes(value)) return value as ContentOrigin;
  throw new Error(`Invalid content origin: ${value}`);
}

function parseLevelKind(value: string): CurriculumLevelKind {
  if (["primary", "secondary", "programme", "open"].includes(value)) return value as CurriculumLevelKind;
  throw new Error(`Invalid curriculum level kind: ${value}`);
}

function parseDifficulty(value: string): LessonDifficulty {
  if (["foundation", "standard", "advanced", "challenge"].includes(value)) return value as LessonDifficulty;
  throw new Error(`Invalid lesson difficulty: ${value}`);
}

function requireSkill(skillId: string, lessonId: string) {
  const skill = getSkill(skillId);
  if (!skill) throw new Error(`Lesson ${lessonId} has unknown practice skill ${skillId}`);
  return skill.id;
}

function parseStringArray(value: unknown, field: string, id: string): string[] {
  if (Array.isArray(value) && value.every((item) => typeof item === "string")) return value;
  throw new Error(`Invalid ${field} on content ${id}`);
}

function parseExplanationSections(value: unknown, lessonId: string): LessonExplanationSection[] {
  if (!Array.isArray(value) || !value.every(isExplanationSection)) {
    throw new Error(`Invalid explanation sections on lesson ${lessonId}`);
  }
  return value;
}

function isExplanationSection(value: unknown): value is LessonExplanationSection {
  if (!value || typeof value !== "object") return false;
  const section = value as Record<string, unknown>;
  return typeof section.id === "string" && typeof section.title === "string" &&
    Array.isArray(section.paragraphs) && section.paragraphs.every((item) => typeof item === "string");
}

function parseWorkedExamples(value: unknown, lessonId: string): WorkedExample[] {
  if (!Array.isArray(value) || !value.every(isWorkedExample)) {
    throw new Error(`Invalid worked examples on lesson ${lessonId}`);
  }
  return value;
}

function isWorkedExample(value: unknown): value is WorkedExample {
  if (!value || typeof value !== "object") return false;
  const example = value as Record<string, unknown>;
  return typeof example.id === "string" && typeof example.title === "string" &&
    typeof example.problem === "string" && typeof example.answer === "string" &&
    Array.isArray(example.steps) && example.steps.every((item) => typeof item === "string");
}

function isMedia(value: unknown): value is { videoUrl?: string } {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const media = value as Record<string, unknown>;
  return media.videoUrl === undefined || typeof media.videoUrl === "string";
}
