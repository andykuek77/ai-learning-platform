import { getSkill, getTopic } from "@/lib/courseRegistry";
import {
  CONTENT_IMPORT_COLUMNS,
  type ContentImportPlan,
  type ContentImportValidationResult,
  type CsvRecord,
  type ImportValidationError,
  type LessonImportRecord,
} from "@/types/contentImport";

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const lifecycleValues = ["draft", "reviewed", "approved", "published"];
const difficulties = ["foundation", "standard", "advanced", "challenge"] as const;
const subjects = new Map([
  ["Mathematics", "mathematics"],
  ["English", "english"],
]);
const programmes = new Map([
  ["HAL", "hal"],
  ["HAG", "hag"],
  ["Mathematics Olympiad", "mathematics-olympiad"],
]);

const requiredValues = [
  "course_id", "course_title", "course_description", "subject", "curriculum",
  "module_id", "module_title", "module_description", "module_position",
  "lesson_id", "lesson_title", "lesson_position", "topic_id", "skill_id",
  "summary", "objectives", "explanation", "worked_example_question",
  "worked_example_steps", "worked_example_answer", "targeted_practice_skill_id",
];

export function validateContentImport(headers: string[], records: CsvRecord[]): ContentImportValidationResult {
  const errors: ImportValidationError[] = [];
  for (const column of CONTENT_IMPORT_COLUMNS) {
    if (!headers.includes(column)) errors.push({ row: 1, field: column, message: "Missing required template column" });
  }
  if (errors.length > 0) return { ok: false, errors };

  const courses = new Map<string, ContentImportPlan["courses"][number]>();
  const modules = new Map<string, ContentImportPlan["modules"][number]>();
  const lessons: LessonImportRecord[] = [];
  const lessonIds = new Set<string>();
  const modulePositions = new Map<string, string>();
  const lessonPositions = new Set<string>();

  records.forEach((record, index) => {
    const row = index + 2;
    for (const field of requiredValues) {
      if (!record[field]) addError(errors, row, field, "Required value is missing");
    }
    for (const field of ["course_id", "module_id", "lesson_id"]) validateSlug(record[field], row, field, errors);

    const status = record.status || "draft";
    if (!lifecycleValues.includes(status)) addError(errors, row, "status", "Must be draft, reviewed, approved, or published");
    else if (status !== "draft") addError(errors, row, "status", "Bulk Content Import V1 only accepts draft content");

    const subjectId = subjects.get(record.subject);
    if (!subjectId) addError(errors, row, "subject", `Unsupported subject. Allowed: ${Array.from(subjects.keys()).join(", ")}`);

    const programmeId = record.programme ? programmes.get(record.programme) : undefined;
    if (record.programme && !programmeId) addError(errors, row, "programme", `Unsupported programme. Allowed: ${Array.from(programmes.keys()).join(", ")}`);

    const levelMatch = /^Primary ([1-6])$/.exec(record.level);
    if (record.level && !levelMatch) addError(errors, row, "level", "Use Primary 1 through Primary 6, or leave blank for a cross-level programme");
    if (!record.level && !record.programme) addError(errors, row, "level", "Level may be blank only when a programme is provided");

    const modulePosition = parsePositiveInteger(record.module_position, row, "module_position", errors);
    const lessonPosition = parsePositiveInteger(record.lesson_position, row, "lesson_position", errors);
    const duration = record.duration_minutes
      ? parsePositiveInteger(record.duration_minutes, row, "duration_minutes", errors)
      : null;

    const difficulty = record.difficulty || null;
    if (difficulty && !difficulties.includes(difficulty as (typeof difficulties)[number])) {
      addError(errors, row, "difficulty", `Must be ${difficulties.join(", ")}, or blank`);
    }

    const topic = getTopic(record.topic_id);
    const skill = getSkill(record.skill_id);
    const practiceSkill = getSkill(record.targeted_practice_skill_id);
    if (!topic) addError(errors, row, "topic_id", "Unknown canonical topic ID");
    else if (subjectId && topic.subjectId !== subjectId) addError(errors, row, "topic_id", "Topic does not belong to the selected subject");
    if (!skill) addError(errors, row, "skill_id", "Unknown canonical skill ID");
    else if (topic && skill.topicId !== topic.id) addError(errors, row, "skill_id", "Skill does not belong to topic_id");
    if (!practiceSkill) addError(errors, row, "targeted_practice_skill_id", "Unknown canonical skill ID");

    const objectives = parseList(record.objectives, row, "objectives", errors, true);
    const explanation = parseList(record.explanation, row, "explanation", errors, true);
    const steps = parseList(record.worked_example_steps, row, "worked_example_steps", errors, true);
    const keyPoints = parseList(record.key_points, row, "key_points", errors, false);
    const prerequisites = parseList(record.prerequisites, row, "prerequisites", errors, false);
    prerequisites.forEach((id) => validateSlug(id, row, "prerequisites", errors));

    const course = {
      id: record.course_id,
      title: record.course_title,
      description: record.course_description,
      level_id: levelMatch ? `primary-${levelMatch[1]}` : null,
      level_label: levelMatch ? record.level : null,
      level_kind: levelMatch ? "primary" as const : null,
      subject_id: subjectId ?? slugify(record.subject),
      subject_label: record.subject,
      programme_id: programmeId ?? null,
      programme_label: record.programme || null,
      curriculum_id: slugify(record.curriculum),
      curriculum_title: record.curriculum,
      status: "draft" as const,
      content_origin: "original" as const,
      authors: ["LearnAI bulk import"],
      curriculum_references: [record.curriculum],
      ai_assisted: false as const,
    };
    addOrValidateParent(courses, course.id, course, row, "course_id", errors);

    const moduleKey = `${record.course_id}:${record.module_id}`;
    const courseModule = {
      course_id: record.course_id,
      id: record.module_id,
      title: record.module_title,
      description: record.module_description,
      position: modulePosition ?? 1,
      status: "draft" as const,
      content_origin: "original" as const,
      authors: ["LearnAI bulk import"],
      curriculum_references: [record.curriculum],
      ai_assisted: false as const,
    };
    addOrValidateParent(modules, moduleKey, courseModule, row, "module_id", errors);

    const modulePositionKey = `${record.course_id}:${modulePosition}`;
    const moduleAtPosition = modulePositions.get(modulePositionKey);
    if (modulePosition && moduleAtPosition && moduleAtPosition !== moduleKey) {
      addError(errors, row, "module_position", "Duplicate module position within course");
    }
    modulePositions.set(modulePositionKey, moduleKey);

    const lessonKey = `${record.course_id}:${record.lesson_id}`;
    if (lessonIds.has(lessonKey)) addError(errors, row, "lesson_id", "Duplicate lesson ID within course");
    lessonIds.add(lessonKey);
    const lessonPositionKey = `${moduleKey}:${lessonPosition}`;
    if (lessonPosition && lessonPositions.has(lessonPositionKey)) addError(errors, row, "lesson_position", "Duplicate lesson position within module");
    lessonPositions.add(lessonPositionKey);

    lessons.push({
      course_id: record.course_id,
      module_id: record.module_id,
      id: record.lesson_id,
      title: record.lesson_title,
      description: record.summary,
      position: lessonPosition ?? 1,
      topic_id: record.topic_id,
      skill_id: record.skill_id,
      targeted_practice_skill_id: record.targeted_practice_skill_id,
      status: "draft",
      content_origin: "original",
      authors: ["LearnAI bulk import"],
      curriculum_references: [record.curriculum],
      ai_assisted: false,
      learning_objectives: objectives,
      explanation_sections: [{ id: `${record.lesson_id}-explanation`, title: "Explanation", paragraphs: explanation }],
      worked_examples: [{ id: `${record.lesson_id}-worked-example`, title: "Worked example", problem: record.worked_example_question, steps, answer: record.worked_example_answer }],
      key_points: keyPoints.length > 0 ? keyPoints : null,
      prerequisite_lesson_ids: prerequisites.length > 0 ? prerequisites : null,
      difficulty: difficulty as LessonImportRecord["difficulty"],
      estimated_duration_minutes: duration,
    });
  });

  return errors.length > 0
    ? { ok: false, errors }
    : { ok: true, plan: { courses: Array.from(courses.values()), modules: Array.from(modules.values()), lessons } };
}

function addOrValidateParent<T extends object>(map: Map<string, T>, key: string, value: T, row: number, field: string, errors: ImportValidationError[]) {
  const existing = map.get(key);
  if (!existing) map.set(key, value);
  else if (JSON.stringify(existing) !== JSON.stringify(value)) addError(errors, row, field, "Repeated ID has conflicting metadata");
}

function parsePositiveInteger(value: string, row: number, field: string, errors: ImportValidationError[]) {
  if (!/^\d+$/.test(value) || Number(value) < 1) {
    addError(errors, row, field, "Must be a positive integer");
    return null;
  }
  return Number(value);
}

function parseList(value: string, row: number, field: string, errors: ImportValidationError[], required: boolean) {
  if (!value) {
    if (required) addError(errors, row, field, "At least one value is required");
    return [];
  }
  const items = value.split("|").map((item) => item.trim());
  if (items.some((item) => item === "")) addError(errors, row, field, "Malformed list: empty values around | are not allowed");
  return items.filter(Boolean);
}

function validateSlug(value: string, row: number, field: string, errors: ImportValidationError[]) {
  if (value && !slugPattern.test(value)) addError(errors, row, field, "Must be a stable lowercase URL-safe ID");
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function addError(errors: ImportValidationError[], row: number, field: string, message: string) {
  errors.push({ row, field, message });
}
