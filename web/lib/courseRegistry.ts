import { primary3Mathematics } from "@/data/courses/primary3Mathematics";
import {
  primaryMathematicsSkills,
  primaryMathematicsTopics,
} from "@/data/curriculum/primaryMathematicsTaxonomy";
import type { ContentStatus, CurriculumSkill, CurriculumTopic } from "@/types/curriculum";
import type { Course, CourseModule, Lesson } from "@/types/course";

export type RegisteredCourse = {
  id: string;
  title: string;
  description: string;
  level: string | null;
  levelId: string | null;
  subject: string;
  subjectId: string;
  programme: string | null;
  programmeId: string | null;
  category: string | null;
  curriculum: string;
  status: ContentStatus;
  moduleCount: number;
  lessonCount: number;
  firstLessonId: string | null;
};

export type CourseRegistryFilters = {
  levelId?: string;
  subjectId?: string;
  programmeId?: string;
  status?: ContentStatus;
};

export type RegisteredLesson = {
  course: Course;
  module: CourseModule;
  lesson: Lesson;
  topic: CurriculumTopic;
  skill: CurriculumSkill;
  practiceSkill: CurriculumSkill;
};

const courseSources: Course[] = [primary3Mathematics];
const topicsById = new Map<string, CurriculumTopic>(
  primaryMathematicsTopics.map((topic) => [topic.id, topic])
);
const skillsById = new Map<string, CurriculumSkill>(
  primaryMathematicsSkills.map((skill) => [skill.id, skill])
);

validateRegistry();

export const registeredCourses: RegisteredCourse[] = discoverCourses();

export function discoverCourses(
  filters: CourseRegistryFilters = {},
  options: { includeUnpublished?: boolean } = {}
): RegisteredCourse[] {
  return courseSources
    .filter((course) => options.includeUnpublished || course.status === "published")
    .filter((course) => !filters.status || course.status === filters.status)
    .filter((course) => !filters.levelId || course.level?.id === filters.levelId)
    .filter((course) => !filters.subjectId || course.subject.id === filters.subjectId)
    .filter((course) => !filters.programmeId || course.programme?.id === filters.programmeId)
    .map(toRegisteredCourse);
}

export function getCourse(courseId: string): Course | undefined {
  const course = courseSources.find(
    (candidate) => candidate.id === courseId && candidate.status === "published"
  );
  if (!course) return undefined;

  return {
    ...course,
    modules: course.modules
      .filter((courseModule) => courseModule.status === "published")
      .map((courseModule) => ({
        ...courseModule,
        lessons: courseModule.lessons.filter(
          (lesson) => lesson.status === "published"
        ),
      })),
  };
}

export function getLesson(
  courseId: string,
  lessonId: string
): RegisteredLesson | undefined {
  const course = getCourse(courseId);
  if (!course) return undefined;

  for (const courseModule of course.modules) {
    const lesson = courseModule.lessons.find(
      (candidate) => candidate.id === lessonId
    );
    if (!lesson) continue;

    const topic = getTopic(lesson.taxonomy.topicId);
    const skill = getSkill(lesson.taxonomy.skillId);
    const practiceSkill = getSkill(lesson.practice.targetedPracticeSkillId);
    if (!topic || !skill || !practiceSkill) return undefined;

    return { course, module: courseModule, lesson, topic, skill, practiceSkill };
  }

  return undefined;
}

export function getLessonTaxonomy(lesson: Lesson) {
  const topic = getTopic(lesson.taxonomy.topicId);
  const skill = getSkill(lesson.taxonomy.skillId);
  if (!topic || !skill) throw new Error(`Unknown taxonomy on lesson ${lesson.id}`);
  return { topic, skill };
}

export function getTopic(topicId: string): CurriculumTopic | undefined {
  return topicsById.get(topicId);
}

export function getSkill(skillId: string): CurriculumSkill | undefined {
  return skillsById.get(skillId);
}

function toRegisteredCourse(course: Course): RegisteredCourse {
  const publishedModules = course.modules.filter(
    (courseModule) => courseModule.status === "published"
  );
  const lessons = publishedModules.flatMap((courseModule) =>
    courseModule.lessons.filter((lesson) => lesson.status === "published")
  );

  return {
    id: course.id,
    title: course.title,
    description: course.description,
    level: course.level?.label ?? null,
    levelId: course.level?.id ?? null,
    subject: course.subject.label,
    subjectId: course.subject.id,
    programme: course.programme?.label ?? null,
    programmeId: course.programme?.id ?? null,
    category: course.category?.label ?? null,
    curriculum: course.curriculum.title,
    status: course.status,
    moduleCount: publishedModules.length,
    lessonCount: lessons.length,
    firstLessonId: lessons[0]?.id ?? null,
  };
}

function validateRegistry() {
  const courseIds = new Set<string>();

  for (const course of courseSources) {
    assertUniqueUrlSafeId(course.id, "course", courseIds);
    const moduleIds = new Set<string>();
    const lessonIds = new Set<string>();

    for (const courseModule of course.modules) {
      assertUniqueUrlSafeId(courseModule.id, `module in ${course.id}`, moduleIds);

      for (const lesson of courseModule.lessons) {
        assertUniqueUrlSafeId(lesson.id, `lesson in ${course.id}`, lessonIds);
        const topic = getTopic(lesson.taxonomy.topicId);
        const skill = getSkill(lesson.taxonomy.skillId);
        const practiceSkill = getSkill(lesson.practice.targetedPracticeSkillId);

        if (!topic || !skill || !practiceSkill) {
          throw new Error(`Unknown taxonomy reference on lesson ${course.id}/${lesson.id}`);
        }
        if (skill.topicId !== topic.id) {
          throw new Error(`Skill/topic mismatch on lesson ${course.id}/${lesson.id}`);
        }
      }
    }
  }
}

function assertUniqueUrlSafeId(id: string, kind: string, ids: Set<string>) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)) {
    throw new Error(`Invalid ${kind} ID: ${id}`);
  }
  if (ids.has(id)) throw new Error(`Duplicate ${kind} ID: ${id}`);
  ids.add(id);
}
