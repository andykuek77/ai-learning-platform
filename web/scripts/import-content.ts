import fs from "node:fs/promises";
import process from "node:process";
import { parseCsv } from "@/lib/contentImport/csvParser";
import {
  applyImport,
  createCanonicalConfirmationPayload,
  createImportPreview,
  diffConfirmationPayloads,
  verifyConfirmationAgainstPreview,
  verifyImportConfirmation,
} from "@/lib/contentImport/importService";
import { createContentAdminClient } from "@/lib/contentImport/supabaseAdminClient";
import { validateContentImport } from "@/lib/contentImport/validator";

async function main() {
  const args = process.argv.slice(2);
  const file = args.find((argument) => !argument.startsWith("--"));
  const apply = args.includes("--apply");
  const confirmIndex = args.indexOf("--confirm");
  const confirmationToken = confirmIndex >= 0 ? args[confirmIndex + 1] : undefined;
  const diagnosticIndex = args.indexOf("--diagnostic-payload");
  const diagnosticPath = diagnosticIndex >= 0 ? args[diagnosticIndex + 1] : undefined;
  const verifyIndex = args.indexOf("--verify-confirmation");
  const verificationToken = verifyIndex >= 0 ? args[verifyIndex + 1] : undefined;

  if (!file) throw new Error("Usage: npm run content:import -- <file.csv> [--apply --confirm <dry-run-token>]");
  const parsed = parseCsv(await fs.readFile(file, "utf8"));
  if (!parsed.ok) return failValidation(parsed.errors);
  const validated = validateContentImport(parsed.headers, parsed.records);
  if (!validated.ok) return failValidation(validated.errors);

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabase = url && serviceRoleKey
    ? createContentAdminClient(url, serviceRoleKey)
    : undefined;

  if (verificationToken) {
    if (!supabase) throw new Error("Confirmation verification requires server-only Supabase credentials");
    if (!diagnosticPath) throw new Error("Confirmation verification requires --diagnostic-payload <receipt.json>");
    const prior = JSON.parse(await fs.readFile(diagnosticPath, "utf8")) as {
      confirmationToken: string;
      payload: unknown;
    };
    const verification = await verifyImportConfirmation(validated.plan, verificationToken, supabase);
    const { preview } = verification;
    const payload = createCanonicalConfirmationPayload(validated.plan, preview.actions);
    const receiptVerification = verifyConfirmationAgainstPreview(
      validated.plan,
      prior.confirmationToken,
      preview
    );
    console.log(JSON.stringify({
      verifiedWithoutWrites: true,
      suppliedTokenMatchesReceipt: verification.suppliedToken === receiptVerification.suppliedToken,
      suppliedTokenMatchesCurrent: verification.matches,
      receiptTokenMatchesCurrent: receiptVerification.matches,
      differences: diffConfirmationPayloads(prior.payload, payload),
    }, null, 2));
    return;
  }

  if (apply) {
    if (!supabase) throw new Error("Actual import requires NEXT_PUBLIC_SUPABASE_URL and server-only SUPABASE_SERVICE_ROLE_KEY");
    if (!confirmationToken) throw new Error("Actual import requires --confirm <token> from a successful database-aware dry run");
    const result = await applyImport(validated.plan, confirmationToken, supabase);
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  const preview = await createImportPreview(validated.plan, supabase);
  console.log(JSON.stringify(preview, null, 2));
  if (diagnosticPath && preview.confirmationToken) {
    const payload = createCanonicalConfirmationPayload(validated.plan, preview.actions);
    await fs.writeFile(
      diagnosticPath,
      JSON.stringify({ confirmationToken: preview.confirmationToken, payload }, null, 2),
      { encoding: "utf8", flag: "wx" }
    );
    console.warn(`Wrote non-secret confirmation diagnostic receipt to ${diagnosticPath}`);
  }
  if (!preview.databaseChecked) {
    console.warn("Offline dry-run only: set server-only SUPABASE_SERVICE_ROLE_KEY for database create/update classification and an applicable confirmation token.");
  }
}

function failValidation(errors: Array<{ row: number; field: string; message: string }>): never {
  for (const error of errors) console.error(`Row ${error.row}, ${error.field}: ${error.message}`);
  throw new Error(`Validation failed with ${errors.length} error(s). No database changes were made.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
