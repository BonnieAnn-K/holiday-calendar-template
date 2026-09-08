import type { AppState } from "../types";
import {
  MONTHS,
  WEEKDAYS,
  daysInMonth,
  formatHours,
  toYmd,
} from "../lib/dates";
import { entriesOnDate } from "../lib/balance";

type Props = {
  year: number;
  month: number;
  today: string;
  selectedDates: string[];
  state: AppState;
  onSelectDate: (date: string, additive: boolean) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
  onJump: (year: number, month: number) => void;
  onDelete: (id: string) => void;
};

export function CalendarMonth({
  year,
  month,
  today,
  selectedDates,
  state,
  onSelectDate,
  onPrevMonth,
  onNextMonth,
  onToday,
  onJump,
  onDelete,
}: Props) {
  const firstWeekday = new Date(year, month, 1).getDay();
  const totalDays = daysInMonth(year, month);
  const cells: Array<{ date: string; inMonth: boolean; day: number }> = [];

  const prevMonth = month === 0 ? 11 : month - 1;
  const prevYear = month === 0 ? year - 1 : year;
  const prevDays = daysInMonth(prevYear, prevMonth);

  for (let i = firstWeekday - 1; i >= 0; i -= 1) {
    const day = prevDays - i;
    cells.push({
      date: toYmd(new Date(prevYear, prevMonth, day)),
      inMonth: false,
      day,
    });
  }

  for (let day = 1; day <= totalDays; day += 1) {
    cells.push({
      date: toYmd(new Date(year, month, day)),
      inMonth: true,
      day,
    });
  }

  let nextDay = 1;
  while (cells.length % 7 !== 0) {
    cells.push({
      date: toYmd(new Date(year, month + 1, nextDay)),
      inMonth: false,
      day: nextDay,
    });
    nextDay += 1;
  }

  return (
    <section className="calendar-card">
      <div className="calendar-head">
        <div className="month-nav">
          <button
            type="button"
            className="icon-btn"
            aria-label="Previous month"
            onClick={onPrevMonth}
          >
            ‹
          </button>
          <h2 className="month-title">
            <select
              aria-label="Month"
              value={month}
              onChange={(event) => onJump(year, Number(event.target.value))}
            >
              {MONTHS.map((name, index) => (
                <option key={name} value={index}>
                  {name}
                </option>
              ))}
            </select>
            <select
              aria-label="Year"
              value={year}
              onChange={(event) => onJump(Number(event.target.value), month)}
            >
              {Array.from({ length: 8 }, (_, index) => 2025 + index).map(
                (value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ),
              )}
            </select>
          </h2>
          <button
            type="button"
            className="icon-btn"
            aria-label="Next month"
            onClick={onNextMonth}
          >
            ›
          </button>
        </div>
        <p className="calendar-hint">
          CTRL + click to select date span.
        </p>
        <button type="button" className="btn" onClick={onToday}>
          Today
        </button>
      </div>
      <div className="weekdays">
        {WEEKDAYS.map((day) => (
          <span key={day}>{day}</span>
        ))}
      </div>
      <div className="grid">
        {cells.map((cell) => {
          const dayEntries = entriesOnDate(state.entries, cell.date);
          const classNames = [
            "day",
            cell.inMonth ? "" : "outside",
            cell.date === today ? "today" : "",
            selectedDates.includes(cell.date) ? "selected" : "",
          ]
            .filter(Boolean)
            .join(" ");

          return (
            <div
              key={cell.date}
              role="button"
              tabIndex={0}
              className={classNames}
              onClick={(event) =>
                onSelectDate(cell.date, event.ctrlKey || event.metaKey)
              }
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onSelectDate(cell.date, event.ctrlKey || event.metaKey);
                }
              }}
            >
              <span className="day-num">{cell.day}</span>
              <span className="day-hours">
                {dayEntries.map((entry) => {
                  const type = state.settings.types.find(
                    (item) => item.id === entry.typeId,
                  );
                  const reason = entry.reason?.trim() ?? "";
                  return (
                    <span key={entry.id} className="pto-chip">
                      <span className="pill">
                        <i
                          className="pill-dot"
                          style={{ background: type?.color ?? "#666" }}
                        />
                        {formatHours(entry.hours)}h
                        <button
                          type="button"
                          className="pill-remove"
                          aria-label={`Remove ${formatHours(entry.hours)} hours of ${type?.name ?? "time off"}`}
                          onClick={(event) => {
                            event.stopPropagation();
                            onDelete(entry.id);
                          }}
                        >
                          ×
                        </button>
                      </span>
                      {reason ? (
                        <span className="pill-reason" title={reason}>
                          {reason}
                        </span>
                      ) : null}
                    </span>
                  );
                })}
              </span>
            </div>
          );
        })}
      </div>
      <div className="legend">
        {state.settings.types.map((type) => (
          <span key={type.id}>
            <i style={{ background: type.color }} />
            {type.name}
            {type.countsTowardPto ? "" : " (does not use PTO)"}
          </span>
        ))}
      </div>
    </section>
  );
}
