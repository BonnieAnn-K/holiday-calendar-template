const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

export { WEEKDAYS, MONTHS };

export function todayYmd(): string {
  return toYmd(new Date());
}

export function toYmd(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function fromYmd(ymd: string): Date {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(ymd: string, days: number): string {
  const date = fromYmd(ymd);
  date.setDate(date.getDate() + days);
  return toYmd(date);
}

export function startOfMonth(ymd: string): string {
  const date = fromYmd(ymd);
  date.setDate(1);
  return toYmd(date);
}

export function addMonths(ymd: string, months: number): string {
  const date = fromYmd(ymd);
  date.setMonth(date.getMonth() + months);
  return toYmd(date);
}

export function daysInMonth(year: number, monthIndex: number): number {
  return new Date(year, monthIndex + 1, 0).getDate();
}

export function isWeekend(ymd: string): boolean {
  const day = fromYmd(ymd).getDay();
  return day === 0 || day === 6;
}

export function eachDate(start: string, end: string): string[] {
  const dates: string[] = [];
  let cursor = start <= end ? start : end;
  const last = start <= end ? end : start;
  while (cursor <= last) {
    dates.push(cursor);
    cursor = addDays(cursor, 1);
  }
  return dates;
}

export function formatLongDate(ymd: string): string {
  return fromYmd(ymd).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function formatShortDate(ymd: string): string {
  return fromYmd(ymd).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function monthTitle(year: number, monthIndex: number): string {
  return `${MONTHS[monthIndex]} ${year}`;
}

export function formatHours(hours: number): string {
  const rounded = Math.round(hours * 100) / 100;
  return Number.isInteger(rounded) ? String(rounded) : String(rounded);
}

export const HOURS_PER_DAY = 8;

export function hoursToWholeDays(hours: number): number {
  if (!Number.isFinite(hours) || hours <= 0) return 0;
  return Math.floor(hours / HOURS_PER_DAY);
}

export function wholeHours(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.round(value));
}
