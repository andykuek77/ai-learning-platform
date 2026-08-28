import assert from "node:assert/strict";
import test from "node:test";
import {
  applyImport,
  createCanonicalConfirmationPayload,
  createConfirmationToken,
  diffConfirmationPayloads,
  type ImportAction,
} from "@/lib/contentImport/importService";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { ContentImportPlan } from "@/types/contentImport";

const course = {
  id: "course-a", title: "Course A", description: "Description", level_id: "primary-3",
  level_label: "Primary 3", level_kind: "primary" as const, subject_id: "mathematics",
  subject_label: "Mathematics", programme_id: null, programme_label: null,
  curriculum_id: "curriculum", curriculum_title: "Curriculum", status: "draft" as const,
  content_origin: "original" as const, authors: ["Author"], curriculum_references: ["Reference"],
  ai_assisted: false as const,
};
const moduleRecord = {
  course_id: "course-a", id: "module-a", title: "Module A", description: "Description",
  position: 1, status: "draft" as const, content_origin: "original" as const,
  authors: ["Author"], curriculum_references: ["Reference"], ai_assisted: false as const,
};
const lesson = {
  course_id: "course-a", module_id: "module-a", id: "lesson-a", title: "Lesson A",
  description: "Description", position: 1, topic_id: "whole-numbers",
  skill_id: "two-quantity-problems", targeted_practice_skill_id: "two-quantity-problems",
  status: "draft" as const, content_origin: "original" as const, authors: ["Author"],
  curriculum_references: ["Reference"], ai_assisted: false as const,
  learning_objectives: ["First", "Second"],
  explanation_sections: [{ id: "explanation", title: "Explanation", paragraphs: ["One", "Two"] }],
  worked_examples: [{ id: "example", title: "Example", problem: "Problem", steps: ["One", "Two"], answer: "Answer" }],
  key_points: ["Point"], prerequisite_lesson_ids: null, difficulty: "foundation" as const,
  estimated_duration_minutes: 5,
};

test("confirmation token is stable across semantic ordering differences", () => {
  const secondCourse = { ...course, id: "course-b", title: "Course B" };
  const secondModule = { ...moduleRecord, course_id: "course-b", id: "module-b", title: "Module B" };
  const secondLesson = { ...lesson, course_id: "course-b", module_id: "module-b", id: "lesson-b", title: "Lesson B" };
  const plan: ContentImportPlan = {
    courses: [course, secondCourse],
    modules: [moduleRecord, secondModule],
    lessons: [lesson, secondLesson],
  };
  const actions: ImportAction[] = [
    { table: "lessons", id: "course-a:lesson-a", action: "create", reason: "human wording one" },
    { table: "courses", id: "course-a", action: "create" },
  ];
  const reorderedPlan = reverseObjectKeys({
    lessons: [reverseObjectKeys(secondLesson), reverseObjectKeys(lesson)],
    modules: [reverseObjectKeys(secondModule), reverseObjectKeys(moduleRecord)],
    courses: [reverseObjectKeys(secondCourse), reverseObjectKeys(course)],
  }) as unknown as ContentImportPlan;
  const reorderedActions: ImportAction[] = [
    { action: "create", id: "course-a", table: "courses", reason: "different diagnostic wording" },
    { id: "course-a:lesson-a", table: "lessons", action: "create" },
  ];

  assert.equal(createConfirmationToken(plan, actions), createConfirmationToken(reorderedPlan, reorderedActions));
});

test("confirmation token changes for content or relevant preflight changes", () => {
  const plan: ContentImportPlan = { courses: [course], modules: [moduleRecord], lessons: [lesson] };
  const actions: ImportAction[] = [{ table: "lessons", id: "course-a:lesson-a", action: "create" }];
  const token = createConfirmationToken(plan, actions);
  const changedPlan: ContentImportPlan = {
    ...plan,
    lessons: [{ ...lesson, title: "Changed lesson" }],
  };
  const changedActions: ImportAction[] = [{ ...actions[0], action: "update_draft" }];

  assert.notEqual(token, createConfirmationToken(changedPlan, actions));
  assert.notEqual(token, createConfirmationToken(plan, changedActions));
});

test("diagnostic receipt round-trips and identifies an action transition", () => {
  const plan: ContentImportPlan = { courses: [course], modules: [moduleRecord], lessons: [lesson] };
  const dryRunActions: ImportAction[] = [
    { table: "courses", id: "course-a", action: "create" },
  ];
  const receiptPayload = JSON.parse(JSON.stringify(
    createCanonicalConfirmationPayload(plan, dryRunActions)
  ));
  assert.deepEqual(
    diffConfirmationPayloads(receiptPayload, createCanonicalConfirmationPayload(plan, dryRunActions)),
    []
  );

  const applyActions: ImportAction[] = [
    { table: "courses", id: "course-a", action: "update_draft" },
  ];
  assert.deepEqual(
    diffConfirmationPayloads(receiptPayload, createCanonicalConfirmationPayload(plan, applyActions)),
    [{ field: "$.actions[0].action", expected: "create", actual: "update_draft" }]
  );
  assert.notEqual(
    createConfirmationToken(plan, dryRunActions),
    createConfirmationToken(plan, applyActions)
  );
});

test("normal apply accepts an existing-draft confirmation and rejects relevant changes", async () => {
  const plan: ContentImportPlan = { courses: [course], modules: [moduleRecord], lessons: [lesson] };
  const updateActions: ImportAction[] = [
    { table: "courses", id: "course-a", action: "update_draft" },
    { table: "course_modules", id: "course-a:module-a", action: "update_draft" },
    { table: "lessons", id: "course-a:lesson-a", action: "update_draft" },
  ];
  const token = createConfirmationToken(plan, updateActions);
  const accepted = createExistingDraftClient();

  const result = await applyImport(plan, `  ${token.toUpperCase()}\r\n`, accepted.client);
  assert.deepEqual(result.counts, { courses: 1, modules: 1, lessons: 1 });
  assert.deepEqual(accepted.writes, ["courses", "course_modules", "lessons"]);

  const changedPlan: ContentImportPlan = {
    ...plan,
    lessons: [{ ...lesson, title: "Materially changed lesson" }],
  };
  const rejected = createExistingDraftClient();
  await assert.rejects(
    applyImport(changedPlan, token, rejected.client),
    /Confirmation token does not match/
  );
  assert.deepEqual(rejected.writes, []);
});

function createExistingDraftClient() {
  const writes: string[] = [];
  const rows = {
    courses: [{ id: course.id, status: "draft", title: course.title, subject_id: course.subject_id, curriculum_id: course.curriculum_id }],
    course_modules: [{ course_id: moduleRecord.course_id, id: moduleRecord.id, status: "draft", title: moduleRecord.title }],
    lessons: [{ course_id: lesson.course_id, id: lesson.id, status: "draft", title: lesson.title, topic_id: lesson.topic_id, skill_id: lesson.skill_id }],
  };
  const client = {
    from(table: keyof typeof rows) {
      return {
        select() {
          return { in: async () => ({ data: rows[table], error: null }) };
        },
        async upsert() {
          writes.push(table);
          return { error: null };
        },
      };
    },
  } as unknown as SupabaseClient;
  return { client, writes };
}

function reverseObjectKeys(value: object): object {
  return Object.fromEntries(Object.entries(value).reverse());
}
