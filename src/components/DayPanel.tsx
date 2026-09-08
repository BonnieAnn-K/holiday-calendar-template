import type { AppState, TimeOffEntry } from "../types";
import { formatLongDate, HOURS_PER_DAY, wholeHours } from "../lib/dates";
import { entriesOnDate } from "../lib/balance";

type Props = {
  date: string;
  selectedCount: number;
  state: AppState;
  onAdd: () => void;
  onUpdate: (entry: TimeOffEntry) => void;
  onDelete: (id: string) => void;
};

export function DayPanel({
  date,
  selectedCount,
  state,
  onAdd,
  onUpdate,
  onDelete,
}: Props) {
  const entries = entriesOnDate(state.entries, date);

  return (
    <aside className="side-card">
      <p className="eyebrow">
        {selectedCount > 1
          ? `${selectedCount} days selected · ${selectedCount * HOURS_PER_DAY} hours`
          : "Selected day"}
      </p>
      <h2>{formatLongDate(date)}</h2>
      {entries.length === 0 ? (
        <p className="empty">No time off on this day yet.</p>
      ) : (
        <div className="entry-list">
          {entries.map((entry) => {
            const type = state.settings.types.find(
              (item) => item.id === entry.typeId,
            );
            return (
              <div className="entry" key={entry.id}>
                <div className="field">
                  <label htmlFor={`type-${entry.id}`}>Type</label>
                  <select
                    id={`type-${entry.id}`}
                    value={entry.typeId}
                    onChange={(event) =>
                      onUpdate({ ...entry, typeId: event.target.value })
                    }
                  >
                    {state.settings.types.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label htmlFor={`date-${entry.id}`}>Date</label>
                  <input
                    id={`date-${entry.id}`}
                    type="date"
                    value={entry.date}
                    onChange={(event) =>
                      onUpdate({ ...entry, date: event.target.value })
                    }
                  />
                </div>
                <div className="field">
                  <label htmlFor={`hours-${entry.id}`}>Hours</label>
                  <input
                    id={`hours-${entry.id}`}
                    type="number"
                    min="0"
                    step="1"
                    value={entry.hours}
                    onChange={(event) =>
                      onUpdate({
                        ...entry,
                        hours: wholeHours(Number(event.target.value)),
                      })
                    }
                  />
                </div>
                <div className="field">
                  <label htmlFor={`reason-${entry.id}`}>Reason</label>
                  <textarea
                    id={`reason-${entry.id}`}
                    rows={2}
                    value={entry.reason ?? ""}
                    placeholder="Optional"
                    onChange={(event) =>
                      onUpdate({ ...entry, reason: event.target.value })
                    }
                  />
                </div>
                <p className="meta">
                  {type?.countsTowardPto
                    ? "This uses PTO."
                    : "This does not use PTO."}
                </p>
              </div>
            );
          })}
        </div>
      )}
      <div className="side-actions">
        {entries.length > 0 ? (
          <>
            <button
              type="button"
              className="btn danger"
              onClick={() => onDelete(entries[0].id)}
            >
              Remove
            </button>
            <button type="button" className="btn primary" onClick={onAdd}>
              Update
            </button>
          </>
        ) : (
          <button type="button" className="btn primary" onClick={onAdd}>
            Add Time Off
          </button>
        )}
      </div>
    </aside>
  );
}
