import type { Course, CourseModule, Lesson } from "@/types/course";
import type { CurriculumSkill, CurriculumTopic } from "@/types/curriculum";

export type PublishedLesson = {
  course: Course;
  module: CourseModule;
  lesson: Lesson;
  topic: CurriculumTopic;
  skill: CurriculumSkill;
  practiceSkill: CurriculumSkill;
};

export interface ContentRepository {
  getPublishedCourses(): Promise<Course[]>;
  getPublishedCourse(courseId: string): Promise<Course | undefined>;
  getPublishedLesson(
    courseId: string,
    lessonId: string
  ): Promise<PublishedLesson | undefined>;
}

export type ContentRepositoryDiagnostic = {
  operation: "courses" | "course" | "lesson";
  outcome:
    | "database"
    | "fallback_empty"
    | "fallback_temporary_failure"
    | "invalid_content";
  courseId?: string;
  lessonId?: string;
};
