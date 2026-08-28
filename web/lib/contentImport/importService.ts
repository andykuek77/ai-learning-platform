import { createHash } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { ContentImportPlan } from "@/types/contentImport";

export type ImportAction = {
  table: "courses" | "course_modules" | "lessons";
  id: string;
  action: "create" | "update_draft" | "reuse_existing_parent" | "blocked" | "upsert_unchecked";
  reason?: string;
};

export type ImportPreview = {
  dryRun: true;
  confirmationToken: string | null;
  counts: { courses: number; modules: number; lessons: number };
  actions: ImportAction[];
  canApply: boolean;
  databaseChecked: boolean;
};

export type CanonicalConfirmationPayload = ReturnType<typeof createCanonicalConfirmationPayload>;

export type ImportConfirmationVerification = {
  preview: ImportPreview;
  expectedToken: string;
  suppliedToken: string;
  matches: boolean;
};

export async function createImportPreview(
  plan: ContentImportPlan,
  supabase?: SupabaseClient
): Promise<ImportPreview> {
  const counts = {
    courses: plan.courses.length,
    modules: plan.modules.length,
    lessons: plan.lessons.length,
  };

  if (!supabase) {
    return {
      dryRun: true,
      confirmationToken: null,
      counts,
      databaseChecked: false,
      canApply: false,
      actions: [
        ...plan.courses.map((record) => unchecked("courses", record.id)),
        ...plan.modules.map((record) => unchecked("course_modules", `${record.course_id}:${record.id}`)),
        ...plan.lessons.map((record) => unchecked("lessons", `${record.course_id}:${record.id}`)),
      ],
    };
  }

  const courseIds = plan.courses.map((record) => record.id);
  const coursesResult = await supabase
    .from("courses")
    .select("id,status,title,subject_id,curriculum_id")
    .in("id", courseIds);
  assertPreflightSucceeded("courses", coursesResult.error);

  const modulesResult = await supabase
    .from("course_modules")
    .select("course_id,id,status,title")
    .in("course_id", courseIds);
  assertPreflightSucceeded("course_modules", modulesResult.error);

  const lessonsResult = await supabase
    .from("lessons")
    .select("course_id,id,status,title,topic_id,skill_id")
    .in("course_id", courseIds);
  assertPreflightSucceeded("lessons", lessonsResult.error);

  const existingCourses = new Map((coursesResult.data ?? []).map((row) => [row.id, row]));
  const existingModules = new Map((modulesResult.data ?? []).map((row) => [`${row.course_id}:${row.id}`, row]));
  const existingLessons = new Map((lessonsResult.data ?? []).map((row) => [`${row.course_id}:${row.id}`, row]));
  const actions: ImportAction[] = [];

  for (const record of plan.courses) {
    const existing = existingCourses.get(record.id);
    if (!existing) actions.push(action("courses", record.id, "create"));
    else if (existing.status === "draft") actions.push(action("courses", record.id, "update_draft"));
    else if (existing.title === record.title && existing.subject_id === record.subject_id && existing.curriculum_id === record.curriculum_id) {
      actions.push(action("courses", record.id, "reuse_existing_parent", `Existing ${existing.status} course is not modified`));
    } else actions.push(action("courses", record.id, "blocked", `Conflicts with existing ${existing.status} course`));
  }

  for (const record of plan.modules) {
    const id = `${record.course_id}:${record.id}`;
    const existing = existingModules.get(id);
    if (!existing) actions.push(action("course_modules", id, "create"));
    else if (existing.status === "draft") actions.push(action("course_modules", id, "update_draft"));
    else if (existing.title === record.title) actions.push(action("course_modules", id, "reuse_existing_parent", `Existing ${existing.status} module is not modified`));
    else actions.push(action("course_modules", id, "blocked", `Conflicts with existing ${existing.status} module`));
  }

  for (const record of plan.lessons) {
    const id = `${record.course_id}:${record.id}`;
    const existing = existingLessons.get(id);
    if (!existing) actions.push(action("lessons", id, "create"));
    else if (existing.status === "draft") actions.push(action("lessons", id, "update_draft"));
    else if (existing.title === record.title && existing.topic_id === record.topic_id && existing.skill_id === record.skill_id) {
      actions.push(action("lessons", id, "blocked", `Existing ${existing.status} lesson is protected; use a new lesson ID or a future revision workflow`));
    } else actions.push(action("lessons", id, "blocked", `Conflicts with existing ${existing.status} lesson`));
  }

  const canApply = !actions.some((item) => item.action === "blocked");
  return {
    dryRun: true,
    confirmationToken: canApply ? createConfirmationToken(plan, actions) : null,
    counts,
    actions,
    databaseChecked: true,
    canApply,
  };
}

export async function applyImport(
  plan: ContentImportPlan,
  confirmationToken: string,
  supabase: SupabaseClient
) {
  const verification = await verifyImportConfirmation(plan, confirmationToken, supabase);
  const { preview } = verification;
  if (!verification.matches) {
    throw new Error("Confirmation token does not match the current validated plan and database preflight. Run the database-aware dry run again.");
  }

  const writable = (table: ImportAction["table"]) => new Set(
    preview.actions.filter((item) => item.table === table && (item.action === "create" || item.action === "update_draft")).map((item) => item.id)
  );
  const courseIds = writable("courses");
  const moduleIds = writable("course_modules");
  const lessonIds = writable("lessons");
  const courses = plan.courses.filter((row) => courseIds.has(row.id));
  const modules = plan.modules.filter((row) => moduleIds.has(`${row.course_id}:${row.id}`));
  const lessons = plan.lessons.filter((row) => lessonIds.has(`${row.course_id}:${row.id}`));

  if (courses.length > 0) await upsertOrThrow(supabase, "courses", courses, "id");
  if (modules.length > 0) await upsertOrThrow(supabase, "course_modules", modules, "course_id,id");
  if (lessons.length > 0) await upsertOrThrow(supabase, "lessons", lessons, "course_id,id");

  return { applied: true, counts: { courses: courses.length, modules: modules.length, lessons: lessons.length } };
}

export async function verifyImportConfirmation(
  plan: ContentImportPlan,
  confirmationToken: string,
  supabase: SupabaseClient
): Promise<ImportConfirmationVerification> {
  const preview = await createImportPreview(plan, supabase);
  return verifyConfirmationAgainstPreview(plan, confirmationToken, preview);
}

export function verifyConfirmationAgainstPreview(
  plan: ContentImportPlan,
  confirmationToken: string,
  preview: ImportPreview
): ImportConfirmationVerification {
  if (!preview.databaseChecked) {
    throw new Error("Confirmation requires a database-aware preflight. No writes were made.");
  }
  if (!preview.canApply) {
    throw new Error("Import is blocked by database preflight. No writes were made.");
  }

  const suppliedToken = normalizeConfirmationToken(confirmationToken);
  const expectedToken = createConfirmationToken(plan, preview.actions);
  return {
    preview,
    suppliedToken,
    expectedToken,
    matches: suppliedToken === expectedToken,
  };
}

function normalizeConfirmationToken(token: string) {
  const normalized = token.trim().toLowerCase();
  if (!/^[a-f0-9]{64}$/.test(normalized)) {
    throw new Error("Confirmation token must be a 64-character SHA-256 hexadecimal value. No writes were made.");
  }
  return normalized;
}

export function createConfirmationToken(plan: ContentImportPlan, actions: ImportAction[]) {
  return createHash("sha256")
    .update(stableStringify(createCanonicalConfirmationPayload(plan, actions)))
    .digest("hex");
}

export function createCanonicalConfirmationPayload(plan: ContentImportPlan, actions: ImportAction[]) {
  const canonicalPlan = {
    courses: [...plan.courses].sort((a, b) => a.id.localeCompare(b.id)),
    modules: [...plan.modules].sort((a, b) =>
      `${a.course_id}:${a.id}`.localeCompare(`${b.course_id}:${b.id}`)
    ),
    lessons: [...plan.lessons].sort((a, b) =>
      `${a.course_id}:${a.id}`.localeCompare(`${b.course_id}:${b.id}`)
    ),
  };
  const canonicalActions = actions
    .map(({ table, id, action: actionValue }) => ({ table, id, action: actionValue }))
    .sort((a, b) =>
      `${a.table}:${a.id}:${a.action}`.localeCompare(`${b.table}:${b.id}:${b.action}`)
    );
  const payload = {
    version: 1,
    plan: canonicalPlan,
    actions: canonicalActions,
  };
  return payload;
}

export function diffConfirmationPayloads(expected: unknown, actual: unknown) {
  const differences: Array<{ field: string; expected: unknown; actual: unknown }> = [];
  compareValues(expected, actual, "$", differences);
  return differences;
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record)
    .filter((key) => record[key] !== undefined)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`)
    .join(",")}}`;
}

function compareValues(
  expected: unknown,
  actual: unknown,
  field: string,
  differences: Array<{ field: string; expected: unknown; actual: unknown }>
) {
  if (Object.is(expected, actual)) return;
  if (Array.isArray(expected) && Array.isArray(actual)) {
    const length = Math.max(expected.length, actual.length);
    for (let index = 0; index < length; index += 1) {
      compareValues(expected[index], actual[index], `${field}[${index}]`, differences);
    }
    return;
  }
  if (isRecord(expected) && isRecord(actual)) {
    const keys = new Set([...Object.keys(expected), ...Object.keys(actual)]);
    for (const key of Array.from(keys).sort()) {
      compareValues(expected[key], actual[key], `${field}.${key}`, differences);
    }
    return;
  }
  differences.push({ field, expected: expected ?? null, actual: actual ?? null });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

async function upsertOrThrow(supabase: SupabaseClient, table: ImportAction["table"], rows: object[], onConflict: string) {
  const { error } = await supabase.from(table).upsert(rows, { onConflict });
  if (error) throw new Error(`Import failed while writing ${table}: ${error.message}. Earlier parent writes may have succeeded.`);
}

function action(table: ImportAction["table"], id: string, value: ImportAction["action"], reason?: string): ImportAction {
  return { table, id, action: value, ...(reason ? { reason } : {}) };
}

function unchecked(table: ImportAction["table"], id: string): ImportAction {
  return action(table, id, "upsert_unchecked", "Provide server credentials for create/update classification");
}

function assertPreflightSucceeded(table: ImportAction["table"], error: { message: string; code?: string } | null) {
  if (!error) return;
  const code = error.code ? ` [${error.code}]` : "";
  throw new Error(`Database preflight failed for ${table}${code}: ${error.message}`);
}
