import type { CsvRecord, ImportValidationError } from "@/types/contentImport";

export function parseCsv(input: string):
  | { ok: true; headers: string[]; records: CsvRecord[] }
  | { ok: false; errors: ImportValidationError[] } {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;

  for (let index = 0; index < input.length; index += 1) {
    const character = input[index];
    if (quoted) {
      if (character === '"' && input[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (character === '"') {
        quoted = false;
      } else {
        field += character;
      }
    } else if (character === '"') {
      if (field.length > 0) return csvError(rows.length + 1, "Malformed quoted field");
      quoted = true;
    } else if (character === ",") {
      row.push(field);
      field = "";
    } else if (character === "\n") {
      row.push(field.replace(/\r$/, ""));
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += character;
    }
  }

  if (quoted) return csvError(rows.length + 1, "Unclosed quoted field");
  if (field.length > 0 || row.length > 0) {
    row.push(field.replace(/\r$/, ""));
    rows.push(row);
  }
  if (rows.length < 2) return csvError(1, "CSV must contain a header and at least one data row");

  const headers = rows[0].map((value) => value.trim().replace(/^\uFEFF/, ""));
  if (new Set(headers).size !== headers.length) return csvError(1, "CSV contains duplicate headers");

  const errors: ImportValidationError[] = [];
  const records = rows.slice(1).flatMap((values, index) => {
    const rowNumber = index + 2;
    if (values.every((value) => value.trim() === "")) return [];
    if (values.length !== headers.length) {
      errors.push({ row: rowNumber, field: "csv", message: `Expected ${headers.length} columns but found ${values.length}` });
      return [];
    }
    return [Object.fromEntries(headers.map((header, column) => [header, values[column].trim()]))];
  });

  return errors.length > 0 ? { ok: false, errors } : { ok: true, headers, records };
}

function csvError(row: number, message: string) {
  return { ok: false as const, errors: [{ row, field: "csv", message }] };
}
