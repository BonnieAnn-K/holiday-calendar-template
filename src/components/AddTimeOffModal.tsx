import { useMemo, useState } from "react";
import type { TimeOffType } from "../types";
import { eachDate, addDays, formatHours, formatShortDate, isWeekend, wholeHours } from "../lib/dates";

type DraftDay = { date: string; hours: number; reason: string };

type Props = {
  initialDate: string;
  initialEndDate: string;
  startInRange: boolean;
  skipWeekendsDefault: boolean;
  types: TimeOffType[];
  onClose: () => void;
  onSave: (entries: Array<DraftDay & { typeId: string }>) => void;
};

export function AddTimeOffModal({
  initialDate,
  initialEndDate,
  startInRange,
  skipWeekendsDefault,
  types,
  onClose,
  onSave,
}: Props) {
  const [mode, setMode] = useState<"single" | "range">(
    startInRange ? "range" : "single",
  );
  const [typeId, setTypeId] = useState(types[0]?.id ?? "");
  const [startDate, setStartDate] = useState(initialDate);
  const [endDate, setEndDate] = useState(initialEndDate);
  const [defaultHours, setDefaultHours] = useState(8);
  const [skipWeekends, setSkipWeekends] = useState(skipWeekendsDefault);
  const [dayHours, setDayHours] = useState<Record<string, number>>({});
  const [reason, setReason] = useState("");

  function setFirstDay(nextStart: string) {
    setStartDate(nextStart);
    setEndDate(addDays(nextStart, 1));
  }

  const days = useMemo(() => {
    const span = mode === "single" ? [startDate] : eachDate(startDate, endDate);
    return span.filter((date) => !(skipWeekends && isWeekend(date)));
  }, [mode, startDate, endDate, skipWeekends]);

  function hoursFor(date: string) {
    return dayHours[date] ?? defaultHours;
  }

  const totalHours = days.reduce((sum, date) => {
    const hours = Number(hoursFor(date));
    return sum + (Number.isFinite(hours) ? hours : 0);
  }, 0);

  function save() {
    const trimmedReason = reason.trim();
    const entries = days
      .map((date) => ({
        date,
        typeId,
        hours: wholeHours(Number(hoursFor(date))),
        reason: trimmedReason,
      }))
      .filter((entry) => entry.hours > 0);
    if (entries.length === 0) return;
    onSave(entries);
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(event) => event.stopPropagation()}>
        <h2>Add time off</h2>
        <p className="meta">
          Choose one day or a span of days. You can keep the same hours for
          every day, or change any day in the list.
        </p>

        <div className="form-grid">
          <div className="field wide">
            <label htmlFor="pto-type">Type</label>
            <select
              id="pto-type"
              value={typeId}
              onChange={(event) => setTypeId(event.target.value)}
            >
              {types.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                  {type.countsTowardPto ? "" : " — does not use PTO"}
                </option>
              ))}
            </select>
          </div>

          <div className="field wide">
            <label>How many days?</label>
            <div className="actions">
              <button
                type="button"
                className={mode === "single" ? "btn primary" : "btn"}
                onClick={() => setMode("single")}
              >
                One day
              </button>
              <button
                type="button"
                className={mode === "range" ? "btn primary" : "btn"}
                onClick={() => {
                  setMode("range");
                  setEndDate((current) =>
                    current > startDate ? current : addDays(startDate, 1),
                  );
                }}
              >
                Date span
              </button>
            </div>
          </div>

          <div className={mode === "single" ? "field wide" : "field"}>
            <label htmlFor="start-date">
              {mode === "single" ? "Date" : "First day"}
            </label>
            <input
              id="start-date"
              type="date"
              value={startDate}
              onChange={(event) => setFirstDay(event.target.value)}
            />
          </div>

          {mode === "range" && (
            <div className="field">
              <label htmlFor="end-date">Last day</label>
              <input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
              />
            </div>
          )}

          <div className="field">
            <label htmlFor="hours">Hours per day</label>
            <input
              id="hours"
              type="number"
              min="0"
              step="1"
              value={defaultHours}
              onChange={(event) => {
                setDefaultHours(wholeHours(Number(event.target.value)));
                setDayHours({});
              }}
            />
          </div>

          <div className="field">
            <label htmlFor="total-hours">Total hours requested</label>
            <p id="total-hours" className="total-hours">
              {formatHours(totalHours)}
            </p>
          </div>

          <div className="field wide">
            <label htmlFor="pto-reason">Reason</label>
            <textarea
              id="pto-reason"
              rows={2}
              value={reason}
              placeholder="Optional — shown on the calendar"
              onChange={(event) => setReason(event.target.value)}
            />
            {mode === "range" ? (
              <p className="meta">
                This reason is saved on every day in this request. You can
                change one day later if you need to.
              </p>
            ) : null}
          </div>
        </div>

        {mode === "range" && (
          <label className="check">
            <input
              type="checkbox"
              checked={skipWeekends}
              onChange={(event) => setSkipWeekends(event.target.checked)}
            />
            Skip weekends
          </label>
        )}

        {days.length > 1 && (
          <div className="day-editor">
            {days.map((date) => (
              <div className="day-row" key={date}>
                <span>{formatShortDate(date)}</span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={hoursFor(date)}
                  onChange={(event) =>
                    setDayHours((current) => ({
                      ...current,
                      [date]: wholeHours(Number(event.target.value)),
                    }))
                  }
                />
              </div>
            ))}
          </div>
        )}

        <div className="modal-actions">
          <button type="button" className="btn ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="btn primary" onClick={save}>
            Save {days.length} {days.length === 1 ? "day" : "days"}
          </button>
        </div>
      </div>
    </div>
  );
}
