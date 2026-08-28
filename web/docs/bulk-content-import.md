# Bulk Content Import V1

This developer-only importer turns one CSV row per lesson into normalized `courses`, `course_modules`, and `lessons` records. It never publishes content. MT7/MT8 and question data are outside its scope.

## CSV convention

Start with `content-import/lesson-content-template.csv`. The sample is `content-import/primary-3-mathematics-sample.csv`.

- Save as UTF-8 CSV with the header unchanged.
- Quote fields containing commas, quotes, or line breaks. Inside a quoted field, represent `"` as `""`.
- Use `|` between items in `objectives`, `explanation` paragraphs, worked-example steps, key points, and prerequisites.
- Do not use leading/trailing `|` or `||`; empty list items are errors.
- Leave optional scalar/list fields blank. Do not write placeholders such as `N/A`.
- Positions start at `1` and must be unique within their parent.
- `course_id`, `module_id`, `lesson_id`, and prerequisite IDs use lowercase URL-safe slugs.
- `status` may be blank or `draft`. V1 rejects every non-draft value even though it recognizes the full lifecycle.

Supported classification values in V1:

- Levels: `Primary 1` through `Primary 6`, or blank for a cross-level programme.
- Subjects: `Mathematics`, `English`.
- Programmes: blank, `HAL`, `HAG`, or `Mathematics Olympiad`.
- Difficulty: blank, `foundation`, `standard`, `advanced`, or `challenge`.

Topic and skill IDs must already exist in `data/curriculum/primaryMathematicsTaxonomy.ts`. A skill must belong to the selected topic. The targeted-practice skill must also be canonical.

## Dry run

Offline parse/validation makes no network request and no database change. It deliberately does not issue an apply token:

```powershell
npm.cmd run content:import -- content-import/primary-3-mathematics-sample.csv
```

For an accurate create/update/reuse/block plan, supply the project URL and service role key only in the trusted terminal process:

```powershell
$env:NEXT_PUBLIC_SUPABASE_URL = "your-project-url"
$env:SUPABASE_SERVICE_ROLE_KEY = "your-server-only-service-role-key"
npm.cmd run content:import -- content-import/your-lessons.csv
```

Never prefix the service-role variable with `NEXT_PUBLIC_`, put it in a CSV, commit it, or use this importer in browser code. A database-aware dry run prints a SHA-256 confirmation token. It performs SELECT only.

## Apply

Review every action. Resolve all `blocked` items. Then rerun the exact same file with the dry-run token:

```powershell
npm.cmd run content:import -- content-import/your-lessons.csv --apply --confirm <token>
```

The file is parsed and validated again, its hash must match, and database preflight runs again before writes. New records and draft updates are upserted by stable keys. Existing reviewed/approved/published courses and modules can be reused when identifying metadata agrees, but they are not modified. Existing non-draft lessons are protected and block the import.

The service-role key intentionally bypasses learner RLS from this trusted local script only. Learner policies remain unchanged. The script contains no embedded key.

## Preparing 50–100 lessons

1. Repeat course and module metadata on every lesson row.
2. Keep repeated metadata exactly identical; conflicting parent definitions fail validation.
3. Give each lesson a unique ID within its course and position within its module.
4. Split large batches by course when practical, then dry-run each file.
5. Correct every row/field error before requesting a database-aware dry run.
6. Review create/update/reuse actions and archive the reviewed CSV outside the public application.
7. Apply with the matching token.
8. Review imported drafts through the future editorial workflow; this importer cannot publish them.

## Safety notes

- Validation completes before writes begin.
- Invalid rows are never skipped.
- Writes are parent-first and deterministic, but the three REST upserts are not one database transaction. A network failure can leave an explicitly reported partial draft import; rerunning the same validated file is idempotent.
- The included sample describes content that is already published. A database-aware dry run will protect/block the existing published lesson rather than overwrite it. Use the sample to verify parsing, or use new lesson IDs for a real import.
