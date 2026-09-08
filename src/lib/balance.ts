import type {
  AppState,
  BalanceSnapshot,
  Projection,
  Settings,
  TimeOffEntry,
} from "../types";
import { addMonths, fromYmd, toYmd } from "./dates";

function typeById(settings: Settings, typeId: string) {
  return settings.types.find((type) => type.id === typeId);
}

export function countAccrualMonths(startDate: string, asOf: string): number {
  if (asOf < startDate) return 0;

  const start = fromYmd(startDate);
  let year = start.getFullYear();
  let month = start.getMonth() + 1;
  let count = 0;

  while (true) {
    if (month > 11) {
      month = 0;
      year += 1;
    }
    const accrualDay = toYmd(new Date(year, month, 1));
    if (accrualDay > asOf) break;
    count += 1;
    month += 1;
  }

  return count;
}

export function snapshotAsOf(
  asOf: string,
  settings: Settings,
  entries: TimeOffEntry[],
): BalanceSnapshot {
  const accrualMonths = countAccrualMonths(settings.startDate, asOf);
  const accruedHours = accrualMonths * settings.hoursPerMonth;

  let usedHours = 0;
  let bereavementHours = 0;

  for (const entry of entries) {
    if (entry.date > asOf) continue;
    const type = typeById(settings, entry.typeId);
    if (!type) continue;
    if (type.countsTowardPto) {
      usedHours += entry.hours;
    } else {
      bereavementHours += entry.hours;
    }
  }

  return {
    asOf,
    startingBalance: settings.startingBalance,
    accruedHours,
    accrualMonths,
    usedHours,
    bereavementHours,
    balance: settings.startingBalance + accruedHours - usedHours,
  };
}

export function usageLast12Months(
  asOf: string,
  entries: TimeOffEntry[],
): { scheduled: number; sick: number; unscheduled: number } {
  const start = addMonths(asOf, -12);
  const totals = { scheduled: 0, sick: 0, unscheduled: 0 };
  for (const entry of entries) {
    if (entry.date < start || entry.date > asOf) continue;
    if (entry.typeId === "scheduled") totals.scheduled += entry.hours;
    else if (entry.typeId === "sick") totals.sick += entry.hours;
    else if (entry.typeId === "unscheduled") totals.unscheduled += entry.hours;
  }
  return totals;
}

export function projectionForDate(
  today: string,
  selected: string,
  settings: Settings,
  entries: TimeOffEntry[],
): Projection {
  const todaySnap = snapshotAsOf(today, settings, entries);
  const selectedSnap = snapshotAsOf(selected, settings, entries);
  const [from, to] = today < selected ? [today, selected] : [selected, today];

  let scheduledHours = 0;
  for (const entry of entries) {
    if (entry.date <= from || entry.date > to) continue;
    const type = typeById(settings, entry.typeId);
    if (type?.countsTowardPto) scheduledHours += entry.hours;
  }

  return {
    today: todaySnap,
    selected: selectedSnap,
    extraAccrualHours: selectedSnap.accruedHours - todaySnap.accruedHours,
    scheduledHours: today <= selected ? scheduledHours : -scheduledHours,
    last12Months: usageLast12Months(today, entries),
  };
}

export function entriesOnDate(entries: TimeOffEntry[], date: string) {
  return entries
    .filter((entry) => entry.date === date)
    .sort((a, b) => a.typeId.localeCompare(b.typeId));
}

export function hoursOnDate(state: AppState, date: string) {
  return entriesOnDate(state.entries, date).reduce((sum, entry) => {
    const type = state.settings.types.find((item) => item.id === entry.typeId);
    return {
      pto: sum.pto + (type?.countsTowardPto ? entry.hours : 0),
      other: sum.other + (type && !type.countsTowardPto ? entry.hours : 0),
    };
  }, { pto: 0, other: 0 });
}
