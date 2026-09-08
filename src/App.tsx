import { useEffect, useMemo, useState } from "react";
import "./App.css";
import { AddTimeOffModal } from "./components/AddTimeOffModal";
import { CalendarMonth } from "./components/CalendarMonth";
import { DayPanel } from "./components/DayPanel";
import { SettingsModal } from "./components/SettingsModal";
import { SummaryCards } from "./components/SummaryCards";
import { applyAppearance } from "./lib/appearance";
import { projectionForDate } from "./lib/balance";
import {
  addDays,
  addMonths,
  fromYmd,
  isWeekend,
  startOfMonth,
  toYmd,
  todayYmd,
  wholeHours,
} from "./lib/dates";
import {
  loadState,
  normalizeSettings,
  applyImportedEntries,
  resetImportedEntries,
  clearAllEntries,
  saveState,
} from "./lib/storage";
import type { AppState, Settings, TimeOffEntry } from "./types";

export default function App() {
  const [state, setState] = useState<AppState>(() => {
    const loaded = loadState();
    applyAppearance(loaded.settings.themeId, loaded.settings.fontId);
    return loaded;
  });
  const today = todayYmd();
  const [monthCursor, setMonthCursor] = useState(startOfMonth(today));
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    saveState(state);
  }, [state]);

  useEffect(() => {
    applyAppearance(state.settings.themeId, state.settings.fontId);
  }, [state.settings.themeId, state.settings.fontId]);

  const monthDate = fromYmd(monthCursor);
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const primaryDate = selectedDates[selectedDates.length - 1] ?? null;
  const sortedSelected = [...selectedDates].sort();
  const addInitialDate = sortedSelected[0] ?? monthCursor;
  const addInitialEnd =
    sortedSelected.length > 1
      ? sortedSelected[sortedSelected.length - 1]
      : addDays(addInitialDate, 1);

  const projection = useMemo(
    () =>
      projectionForDate(
        today,
        primaryDate ?? today,
        state.settings,
        state.entries,
      ),
    [today, primaryDate, state],
  );

  function selectDate(date: string, additive: boolean) {
    if (additive) {
      setSelectedDates((current) =>
        current.includes(date)
          ? current.filter((item) => item !== date)
          : [...current, date],
      );
      return;
    }
    setSelectedDates([date]);
    setMonthCursor(startOfMonth(date));
  }

  function addEntries(
    drafts: { date: string; typeId: string; hours: number; reason: string }[],
  ) {
    const next: TimeOffEntry[] = drafts.map((draft) => ({
      ...draft,
      hours: wholeHours(draft.hours),
      id: crypto.randomUUID(),
    }));
    setState((current) => ({
      ...current,
      entries: [...current.entries, ...next],
    }));
    setSelectedDates(next.map((entry) => entry.date));
    setShowAdd(false);
  }

  function updateEntry(entry: TimeOffEntry) {
    const next = { ...entry, hours: wholeHours(entry.hours) };
    setState((current) => ({
      ...current,
      entries: current.entries.map((item) =>
        item.id === next.id ? next : item,
      ),
    }));
    setSelectedDates([next.date]);
    setMonthCursor(startOfMonth(next.date));
  }

  function deleteEntry(id: string) {
    const entry = state.entries.find((item) => item.id === id);
    if (!entry) return;
    const type = state.settings.types.find((item) => item.id === entry.typeId);
    const ok = window.confirm(
      `Remove ${entry.hours} hours of ${type?.name ?? "time off"} on ${entry.date}? This also works for past days.`,
    );
    if (!ok) return;
    setState((current) => ({
      ...current,
      entries: current.entries.filter((item) => item.id !== id),
    }));
  }

  function saveSettings(settings: Settings) {
    setState((current) => ({
      ...current,
      settings: normalizeSettings(settings),
    }));
    setShowSettings(false);
  }

  return (
    <div className="app">
      <header className="topbar">
        <div>
          <p className="eyebrow">Paid Time Off (Exempt/Salary)</p>
          <h1>Holiday Planner</h1>
          <p className="person">{state.settings.name}</p>
        </div>
        <div className="actions">
          <button type="button" className="btn" onClick={() => setShowSettings(true)}>
            Setup
          </button>
        </div>
      </header>

      <SummaryCards
        projection={projection}
        selectedDate={primaryDate}
      />

      <div className="layout">
        <CalendarMonth
          year={year}
          month={month}
          today={today}
          selectedDates={selectedDates}
          state={state}
          onSelectDate={selectDate}
          onPrevMonth={() => setMonthCursor(addMonths(monthCursor, -1))}
          onNextMonth={() => setMonthCursor(addMonths(monthCursor, 1))}
          onToday={() => {
            setMonthCursor(startOfMonth(today));
            setSelectedDates([today]);
          }}
          onJump={(nextYear, nextMonth) =>
            setMonthCursor(toYmd(new Date(nextYear, nextMonth, 1)))
          }
          onDelete={deleteEntry}
        />
        {primaryDate ? (
          <DayPanel
            date={primaryDate}
            selectedCount={selectedDates.length}
            state={state}
            onAdd={() => setShowAdd(true)}
            onUpdate={updateEntry}
            onDelete={deleteEntry}
          />
        ) : (
          <aside className="side-card">
            <h2>Pick a day</h2>
            <p className="empty">
              Click any date to see the projected balance and add or edit time
              off. Hold Ctrl and click to pick more than one day.
            </p>
          </aside>
        )}
      </div>

      {showAdd && (
        <AddTimeOffModal
          initialDate={addInitialDate}
          initialEndDate={addInitialEnd}
          startInRange={sortedSelected.length > 1}
          skipWeekendsDefault={!sortedSelected.some((date) => isWeekend(date))}
          types={state.settings.types}
          onClose={() => setShowAdd(false)}
          onSave={addEntries}
        />
      )}
      {showSettings && (
        <SettingsModal
          settings={state.settings}
          hasImported={state.importedEntries.length > 0}
          hasEntries={state.entries.length > 0}
          onClose={() => setShowSettings(false)}
          onSave={saveSettings}
          onImportEntries={(entries) => {
            setState((current) => applyImportedEntries(current, entries));
            setShowSettings(false);
          }}
          onResetTimeOff={() => {
            setState((current) =>
              current.importedEntries.length > 0
                ? resetImportedEntries(current)
                : clearAllEntries(current),
            );
            setShowSettings(false);
          }}
        />
      )}
    </div>
  );
}
