export const CONTENT_IMPORT_COLUMNS = [
  "course_id", "course_title", "course_description", "level", "subject",
  "programme", "curriculum", "module_id", "module_title", "module_description",
  "module_position", "lesson_id", "lesson_title", "lesson_position", "topic_id",
  "skill_id", "summary", "objectives", "explanation",
  "worked_example_question", "worked_example_steps", "worked_example_answer",
  "key_points", "prerequisites", "difficulty", "duration_minutes",
  "targeted_practice_skill_id", "status",
] as const;

export type ContentImportColumn = (typeof CONTENT_IMPORT_COLUMNS)[number];
export type CsvRecord = Record<string, string>;

export type ImportValidationError = {
  row: number;
  field: string;
  message: string;
};

export type CourseImportRecord = {
  id: string;
  title: string;
  description: string;
  level_id: string | null;
  level_label: string | null;
  level_kind: "primary" | "programme" | null;
  subject_id: string;
  subject_label: string;
  programme_id: string | null;
  programme_label: string | null;
  curriculum_id: string;
  curriculum_title: string;
  status: "draft";
  content_origin: "original";
  authors: string[];
  curriculum_references: string[];
  ai_assisted: false;
};

export type ModuleImportRecord = {
  course_id: string;
  id: string;
  title: string;
  description: string;
  position: number;
  status: "draft";
  content_origin: "original";
  authors: string[];
  curriculum_references: string[];
  ai_assisted: false;
};

export type LessonImportRecord = {
  course_id: string;
  module_id: string;
  id: string;
  title: string;
  description: string;
  position: number;
  topic_id: string;
  skill_id: string;
  targeted_practice_skill_id: string;
  status: "draft";
  content_origin: "original";
  authors: string[];
  curriculum_references: string[];
  ai_assisted: false;
  learning_objectives: string[];
  explanation_sections: Array<{ id: string; title: string; paragraphs: string[] }>;
  worked_examples: Array<{ id: string; title: string; problem: string; steps: string[]; answer: string }>;
  key_points: string[] | null;
  prerequisite_lesson_ids: string[] | null;
  difficulty: "foundation" | "standard" | "advanced" | "challenge" | null;
  estimated_duration_minutes: number | null;
};

export type ContentImportPlan = {
  courses: CourseImportRecord[];
  modules: ModuleImportRecord[];
  lessons: LessonImportRecord[];
};

export type ContentImportValidationResult =
  | { ok: true; plan: ContentImportPlan }
  | { ok: false; errors: ImportValidationError[] };

