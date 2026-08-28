import type {
  CurriculumCategory,
  CurriculumLevel,
  CurriculumProgramme,
  CurriculumReference,
  CurriculumSubject,
  GovernedContent,
  LessonDifficulty,
  LessonPracticePlan,
  LessonTaxonomyReference,
} from "@/types/curriculum";

export type LessonExplanationSection = {
  id: string;
  title: string;
  paragraphs: string[];
};

export type WorkedExample = {
  id: string;
  title: string;
  problem: string;
  steps: string[];
  answer: string;
};

export type Lesson = GovernedContent & {
  id: string;
  title: string;
  description: string;
  taxonomy: LessonTaxonomyReference;
  learningObjectives: string[];
  explanationSections: LessonExplanationSection[];
  workedExamples: WorkedExample[];
  keyPoints?: string[];
  practice: LessonPracticePlan;
  prerequisiteLessonIds?: string[];
  difficulty?: LessonDifficulty;
  estimatedDurationMinutes?: number;
  media?: {
    videoUrl?: string;
  };
};

export type CourseModule = GovernedContent & {
  id: string;
  title: string;
  description: string;
  lessons: Lesson[];
};

export type Course = GovernedContent & {
  id: string;
  title: string;
  description: string;
  level?: CurriculumLevel;
  subject: CurriculumSubject;
  programme?: CurriculumProgramme;
  category?: CurriculumCategory;
  curriculum: CurriculumReference;
  modules: CourseModule[];
};
