import type { Projection } from "../types";
import {
  formatHours,
  formatShortDate,
  hoursToWholeDays,
} from "../lib/dates";

type Props = {
  projection: Projection;
  selectedDate: string | null;
};

function HoursAndDays({
  hours,
  hoverText,
}: {
  hours: number;
  hoverText?: string;
}) {
  const days = hoursToWholeDays(hours);
  return (
    <div className="hours-stack">
      <p className={hoverText ? "big-hours hours-hover" : "big-hours"}>
        {formatHours(hours)}
        <span>hours</span>
        {hoverText ? <span className="hours-hover-tip">{hoverText}</span> : null}
      </p>
      <p className="big-days">
        {days}
        <span>days</span>
      </p>
    </div>
  );
}

export function SummaryCards({ projection, selectedDate }: Props) {
  const today = projection.today;

  return (
    <section className="summary">
      <article className="card">
        <h2>Available as of today, {formatShortDate(today.asOf)}</h2>
        <HoursAndDays
          hours={today.balance}
          hoverText={`Banked hours: ${formatHours(today.startingBalance)} · Accrued hours: ${formatHours(today.accruedHours)}`}
        />
        <div className="usage-row">
          <span className="usage-label">Last 12 months:</span>
          <span className="chip">
            Scheduled: {formatHours(projection.last12Months.scheduled)}
          </span>
          <span className="chip">
            Sick: {formatHours(projection.last12Months.sick)}
          </span>
          <span className="chip">
            Unscheduled: {formatHours(projection.last12Months.unscheduled)}
          </span>
        </div>
      </article>

      {selectedDate ? (
        <article className="card">
          <h2>
            {selectedDate > today.asOf
              ? `Projected as of ${formatShortDate(selectedDate)} (selected date below)`
              : selectedDate < today.asOf
                ? `Available on ${formatShortDate(selectedDate)}`
                : `As of today, ${formatShortDate(today.asOf)}`}
          </h2>
          <HoursAndDays hours={projection.selected.balance} />
          {selectedDate === today.asOf ? (
            <p className="meta">This is the same as your current balance.</p>
          ) : selectedDate < today.asOf ? (
            <p className="meta">
              This is the balance you had at the end of that day.
            </p>
          ) : null}
          {selectedDate > today.asOf && (
            <div className="chips">
              <span
                className={
                  projection.extraAccrualHours >= 0 ? "chip plus" : "chip minus"
                }
              >
                {projection.extraAccrualHours >= 0 ? "+" : ""}
                {formatHours(projection.extraAccrualHours)} accrued
              </span>
              <span
                className={projection.scheduledHours > 0 ? "chip minus" : "chip"}
              >
                {projection.scheduledHours > 0 ? "−" : ""}
                {formatHours(Math.abs(projection.scheduledHours))} scheduled PTO
              </span>
            </div>
          )}
        </article>
      ) : (
        <article className="card placeholder">
          <h2>Projected balance</h2>
          <p>
            Click a date on the calendar to see what you would have left that
            day, after scheduled PTO and extra monthly accruals.
          </p>
        </article>
      )}
    </section>
  );
}
