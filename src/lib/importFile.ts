import * as XLSX from "xlsx";
import type { TimeOffEntry, TimeOffType } from "../types";
import { toYmd, wholeHours } from "./dates";

export type ImportResult =
  | { ok: true; entries: TimeOffEntry[] }
  | { ok: false; message: string };

function normalizeHeader(value: unknown): string {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

function findColumn(headers: string[], candidates: string[]): number {
  for (const candidate of candidates) {
    const exact = headers.findIndex((header) => header === candidate);
    if (exact >= 0) return exact;
  }
  for (const candidate of candidates) {
    const partial = headers.findIndex((header) => header.includes(candidate));
    if (partial >= 0) return partial;
  }
  return -1;
}

function parseDateCell(value: unknown): string | null {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    if (value.getHours() === 0 && value.getMinutes() === 0) {
      return toYmd(value);
    }
    return `${value.getUTCFullYear()}-${String(value.getUTCMonth() + 1).padStart(2, "0")}-${String(value.getUTCDate()).padStart(2, "0")}`;
  }
  if (typeof value === "number" && value > 20000 && value < 80000) {
    const utc = new Date(Math.round((value - 25569) * 86400 * 1000));
    return `${utc.getUTCFullYear()}-${String(utc.getUTCMonth() + 1).padStart(2, "0")}-${String(utc.getUTCDate()).padStart(2, "0")}`;
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) return trimmed.slice(0, 10);
    const slash = trimmed.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
    if (slash) {
      let year = Number(slash[3]);
      if (year < 100) year += 2000;
      return toYmd(new Date(year, Number(slash[1]) - 1, Number(slash[2])));
    }
  }
  return null;
}

function parseHoursCell(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const match = value.replace(/,/g, "").match(/-?\d+(\.\d+)?/);
    if (!match) return null;
    const hours = Number(match[0]);
    return Number.isFinite(hours) ? hours : null;
  }
  return null;
}

function matchType(raw: string, types: TimeOffType[]): string | null {
  const text = raw.trim().toLowerCase();
  if (!text) return null;
  for (const type of types) {
    if (type.id === text || type.name.toLowerCase() === text) return type.id;
  }
  if (text.includes("bereave")) {
    return types.find((type) => type.id === "bereavement")?.id ?? null;
  }
  if (text.includes("sick") || text.includes("safe")) {
    return types.find((type) => type.id === "sick")?.id ?? null;
  }
  if (text.includes("unscheduled")) {
    return types.find((type) => type.id === "unscheduled")?.id ?? null;
  }
  if (
    text.includes("scheduled") ||
    text.includes("flex pto") ||
    text.includes("vacation") ||
    text.includes("holiday")
  ) {
    return types.find((type) => type.id === "scheduled")?.id ?? null;
  }
  return null;
}

function isRejected(status: string): boolean {
  const text = status.toLowerCase();
  return (
    text.includes("den") ||
    text.includes("cancel") ||
    text.includes("withdraw") ||
    text.includes("rescind")
  );
}

function isHeaderRow(cells: unknown[]): boolean {
  const headers = cells.map(normalizeHeader);
  const hasDate = headers.some(
    (header) => header.includes("date") && !header.includes("update"),
  );
  const hasType = headers.some(
    (header) => header.includes("type") || header === "timeoff",
  );
  const hasHours = headers.some(
    (header) =>
      header.includes("hour") ||
      header.includes("unit") ||
      header.includes("quantity") ||
      header.includes("requested"),
  );
  return hasDate && (hasType || hasHours);
}

export async function parseTimeOffFile(
  file: File,
  types: TimeOffType[],
): Promise<ImportResult> {
  const name = file.name.toLowerCase();
  const isCsv =
    name.endsWith(".csv") || file.type.includes("csv") || file.type === "text/plain";

  let workbook: XLSX.WorkBook;
  try {
    if (isCsv) {
      const text = await file.text();
      workbook = XLSX.read(text, { type: "string", cellDates: true });
    } else {
      const buffer = await file.arrayBuffer();
      workbook = XLSX.read(buffer, { type: "array", cellDates: true });
    }
  } catch {
    return {
      ok: false,
      message:
        "I could not read that file. Try the Excel file from My Time Off, or save it as a CSV.",
    };
  }

  const sheetName = workbook.SheetNames[0];
  const sheet = sheetName ? workbook.Sheets[sheetName] : undefined;
  if (!sheet) {
    return { ok: false, message: "That file has no spreadsheet to read." };
  }

  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    raw: true,
    defval: null,
    blankrows: false,
  });

  let headerIndex = rows.findIndex((row) => Array.isArray(row) && isHeaderRow(row));
  if (headerIndex < 0) {
    headerIndex = 0;
  }
  const headers = (rows[headerIndex] ?? []).map(normalizeHeader);
  const dateIndex = findColumn(headers, [
    "timeoffdate",
    "date",
    "effectivedate",
  ]);
  const typeIndex = findColumn(headers, [
    "timeofftype",
    "absencetype",
    "type",
    "timeoff",
    "plan",
  ]);
  const hoursIndex = findColumn(headers, [
    "hours",
    "hrs",
    "unitsrequested",
    "quantityperday",
    "quantity",
    "units",
    "requested",
    "amount",
  ]);
  const statusIndex = findColumn(headers, ["status", "requeststatus"]);

  if (dateIndex < 0 || hoursIndex < 0) {
    return {
      ok: false,
      message:
        "I didn't find date and hours columns. Use the Excel file from the My Time Off report.",
    };
  }

  const totals = new Map<string, { typeId: string; hours: number }>();
  for (const row of rows.slice(headerIndex + 1)) {
    if (!Array.isArray(row)) continue;
    const date = parseDateCell(row[dateIndex]);
    if (!date) continue;
    if (statusIndex >= 0 && isRejected(String(row[statusIndex] ?? ""))) continue;
    const hours = parseHoursCell(row[hoursIndex]);
    if (hours == null) continue;
    const typeRaw =
      typeIndex >= 0 ? String(row[typeIndex] ?? "") : types[0]?.name ?? "";
    const typeId = matchType(typeRaw, types) ?? types[0]?.id;
    if (!typeId) continue;
    const key = `${date}|${typeId}`;
    const current = totals.get(key);
    totals.set(key, {
      typeId,
      hours: (current?.hours ?? 0) + hours,
    });
  }

  const entries: TimeOffEntry[] = [...totals.entries()]
    .map(([key, value]) => {
      const date = key.split("|")[0];
      const hours = wholeHours(value.hours);
      return {
        id: crypto.randomUUID(),
        date,
        typeId: value.typeId,
        hours,
        reason: "",
      };
    })
    .filter((entry) => entry.hours > 0)
    .sort((a, b) => a.date.localeCompare(b.date));

  if (entries.length === 0) {
    return {
      ok: false,
      message:
        "I didn't find any time-off days in that file. Use the Excel export from My Time Off.",
    };
  }

  return { ok: true, entries };
}
