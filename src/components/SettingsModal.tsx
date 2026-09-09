import { useEffect, useRef, useState } from "react";
import {
  ACCRUAL_TIERS,
  formatMonthlyHours,
  monthlyHoursForAnnual,
} from "../lib/accrual";
import { FONTS, THEMES, applyAppearance, getTheme } from "../lib/appearance";
import { parseTimeOffFile } from "../lib/importFile";
import type { Settings, TimeOffEntry } from "../types";

type ImportMode = "first" | "updated";

type Props = {
  settings: Settings;
  hasImported: boolean;
  hasEntries: boolean;
  onClose: () => void;
  onSave: (settings: Settings) => void;
  onImportEntries: (entries: TimeOffEntry[]) => void;
  onResetTimeOff: () => void;
};

export function SettingsModal({
  settings,
  hasImported,
  hasEntries,
  onClose,
  onSave,
  onImportEntries,
  onResetTimeOff,
}: Props) {
  const [draft, setDraft] = useState<Settings>(settings);
  const savedRef = useRef(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [showWorkdayHelp, setShowWorkdayHelp] = useState(false);
  const [importMode, setImportMode] = useState<ImportMode>("first");
  const [showImport, setShowImport] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [importMessage, setImportMessage] = useState("");
  const [importBusy, setImportBusy] = useState(false);
  const isFirstTime = !hasImported && !hasEntries;

  useEffect(() => {
    applyAppearance(draft.themeId, draft.fontId);
    return () => {
      if (!savedRef.current) {
        applyAppearance(settings.themeId, settings.fontId);
      }
    };
  }, [draft.themeId, draft.fontId, settings.themeId, settings.fontId]);

  async function importFile(file: File | undefined) {
    if (!file || importBusy) return;
    setImportBusy(true);
    setImportMessage("");
    const result = await parseTimeOffFile(file, draft.types);
    setImportBusy(false);
    if (!result.ok) {
      setImportMessage(result.message);
      return;
    }
    const ok = window.confirm(
      `Import ${result.entries.length} day${result.entries.length === 1 ? "" : "s"} from this file? This replaces the days currently on the calendar. Your name and setup numbers stay.`,
    );
    if (!ok) return;
    onImportEntries(result.entries);
  }

  function openImport(mode: ImportMode) {
    setImportMode(mode);
    setImportMessage("");
    setDragging(false);
    setShowImport(true);
  }

  const importTitle =
    importMode === "updated" ? "Import Updated PTO" : "Import PTO";

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(event) => event.stopPropagation()}>
        <h2>Setup</h2>
        <p className="meta">
          Anyone can use this calendar. These numbers are yours, and they can
          be changed without touching the days already entered.
        </p>

        <div className="form-grid">
          <div className="field">
            <label htmlFor="person-name">Name</label>
            <input
              id="person-name"
              value={draft.name}
              onChange={(event) =>
                setDraft({ ...draft, name: event.target.value })
              }
            />
          </div>
          <div className="field">
            <label htmlFor="start-date">Calendar start date</label>
            <input
              id="start-date"
              type="date"
              value={draft.startDate}
              onChange={(event) =>
                setDraft({ ...draft, startDate: event.target.value })
              }
            />
          </div>
          <div className="field">
            <label htmlFor="start-balance">Starting Hours</label>
            <input
              id="start-balance"
              type="number"
              min="0"
              step="1"
              value={draft.startingBalance}
              onChange={(event) =>
                setDraft({
                  ...draft,
                  startingBalance: Math.max(
                    0,
                    Math.round(Number(event.target.value) || 0),
                  ),
                })
              }
            />
          </div>
        </div>

        <div className="field wide" style={{ marginTop: 18 }}>
          <label>Accrual rate</label>
          <div className="choice-grid">
            {ACCRUAL_TIERS.map((tier) => (
              <button
                key={tier.id}
                type="button"
                className={
                  draft.accrualTierId === tier.id ? "choice selected" : "choice"
                }
                onClick={() =>
                  setDraft({
                    ...draft,
                    accrualTierId: tier.id,
                    hoursPerMonth: monthlyHoursForAnnual(tier.annualHours),
                  })
                }
              >
                <strong>
                  {tier.annualHours} hours · {tier.days} days
                </strong>
                <small>{tier.name}</small>
                <small>
                  {formatMonthlyHours(tier.annualHours)} hours each month
                </small>
              </button>
            ))}
          </div>
          <p className="meta" style={{ marginTop: 10 }}>
            You move to the next rate in the month after your 5th anniversary
            (160 → 200 hours) and after your 10th (200 → 240). Accrual is earned
            monthly, not all at once at the start of the year.
          </p>
        </div>

        <div className="field wide" style={{ marginTop: 18 }}>
          <label>Color scheme</label>
          <div className="choice-grid">
            {THEMES.map((theme) => (
              <button
                key={theme.id}
                type="button"
                className={draft.themeId === theme.id ? "choice selected" : "choice"}
                onClick={() => setDraft({ ...draft, themeId: theme.id })}
              >
                <span className="swatches">
                  {theme.swatches.map((color) => (
                    <span key={color} style={{ background: color }} />
                  ))}
                </span>
                <strong>{theme.name}</strong>
                <small>{theme.note}</small>
              </button>
            ))}
          </div>
        </div>

        <div className="field wide" style={{ marginTop: 16 }}>
          <label>Font</label>
          <div className="choice-grid font-choice-grid">
            {FONTS.map((font) => (
              <button
                key={font.id}
                type="button"
                className={
                  draft.fontId === font.id
                    ? "choice font-choice selected"
                    : "choice font-choice"
                }
                onClick={() => setDraft({ ...draft, fontId: font.id })}
              >
                <span
                  className="font-preview"
                  style={{ fontFamily: font.previewFamily }}
                >
                  246 - {font.name}
                </span>
              </button>
            ))}
          </div>
        </div>

        <p className="meta" style={{ marginTop: 16 }}>
          Accrual is added on the 1st of each month. Time
          off types that do not count toward PTO stay visible, but they do not
          change the balance.
        </p>

        <div className="settings-types" style={{ marginTop: 12 }}>
          {draft.types.map((type) => (
            <label className="type-row" key={type.id}>
              <span
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: 99,
                  background: getTheme(draft.themeId).typeColors[type.id] ?? type.color,
                }}
              />
              <span>{type.name}</span>
              <span className="check">
                <input
                  type="checkbox"
                  checked={type.countsTowardPto}
                  onChange={(event) =>
                    setDraft({
                      ...draft,
                      types: draft.types.map((item) =>
                        item.id === type.id
                          ? { ...item, countsTowardPto: event.target.checked }
                          : item,
                      ),
                    })
                  }
                />
                Uses PTO
              </span>
            </label>
          ))}
        </div>

        <div className="danger-zone">
          {isFirstTime ? (
            <>
              <p className="meta">
                You can start from scratch by adding days on the calendar, or
                import your Workday report.
              </p>
              <div className="import-with-help">
                <button
                  type="button"
                  className="btn ghost"
                  onClick={() => openImport("first")}
                >
                  Import PTO
                </button>
                <button
                  type="button"
                  className="help-btn"
                  aria-label="Instructions to pull from Workday"
                  onClick={() => setShowWorkdayHelp(true)}
                >
                  ?
                  <span className="help-tip">Instructions to pull from Workday</span>
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="meta">
                {hasImported
                  ? "Reset puts the calendar back to your imported report. Import Updated PTO replaces it with a newer file."
                  : "Reset removes all PTO you added by hand. Import Updated PTO loads a Workday report instead."}
              </p>
              <button
                type="button"
                className="btn danger"
                onClick={() => {
                  const ok = window.confirm(
                    hasImported
                      ? "Put the calendar back to the days from your imported report? Later adds and edits will be removed."
                      : "Remove every PTO day from the calendar? These were added by hand, so there is no report to put back.",
                  );
                  if (ok) onResetTimeOff();
                }}
              >
                Reset PTO
              </button>
              <div className="import-with-help">
                <button
                  type="button"
                  className="btn ghost"
                  onClick={() => openImport("updated")}
                >
                  Import Updated PTO
                </button>
                <button
                  type="button"
                  className="help-btn"
                  aria-label="Instructions to pull from Workday"
                  onClick={() => setShowWorkdayHelp(true)}
                >
                  ?
                  <span className="help-tip">Instructions to pull from Workday</span>
                </button>
              </div>
            </>
          )}
        </div>

        <div className="modal-actions">
          <button type="button" className="btn" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="btn primary"
            onClick={() => {
              savedRef.current = true;
              onSave(draft);
            }}
          >
            Save setup
          </button>
        </div>
      </div>
      {showWorkdayHelp ? (
        <div
          className="modal-backdrop help-overlay"
          onClick={(event) => {
            event.stopPropagation();
            setShowWorkdayHelp(false);
          }}
        >
          <div
            className="modal"
            role="dialog"
            aria-labelledby="workday-help-title"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id="workday-help-title">Pull your days from Workday</h2>
            <ol className="help-steps">
              <li>Sign in to Workday.</li>
              <li>
                Click the search bar at the top and type{" "}
                <strong>My Time Off</strong>. Open that report.
              </li>
              <li>
                When the list of days appears, click the <strong>Excel</strong>{" "}
                icon, usually in the upper right, and download the file.
              </li>
              <li>
                Come back here and use <strong>Import PTO</strong> or{" "}
                <strong>Import Updated PTO</strong> to load that Excel or CSV
                file.
              </li>
            </ol>
            <div className="modal-actions">
              <button
                type="button"
                className="btn primary"
                onClick={() => setShowWorkdayHelp(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}
      {showImport ? (
        <div
          className="modal-backdrop help-overlay"
          onClick={(event) => {
            event.stopPropagation();
            setShowImport(false);
          }}
        >
          <div
            className="modal"
            role="dialog"
            aria-labelledby="import-title"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id="import-title">{importTitle}</h2>
            <p className="meta">
              Use the Excel or CSV file you downloaded from Workday My Time
              Off.
            </p>
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls,.csv,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
              hidden
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.target.value = "";
                void importFile(file);
              }}
            />
            <button
              type="button"
              className={dragging ? "drop-zone dragging" : "drop-zone"}
              onDragEnter={(event) => {
                event.preventDefault();
                setDragging(true);
              }}
              onDragOver={(event) => {
                event.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(event) => {
                event.preventDefault();
                setDragging(false);
                void importFile(event.dataTransfer.files[0]);
              }}
              onClick={() => fileRef.current?.click()}
            >
              {importBusy
                ? "Reading file…"
                : "Drop your file here, or click to browse"}
            </button>
            {importMessage ? <p className="import-error">{importMessage}</p> : null}
            <div className="modal-actions">
              <button
                type="button"
                className="btn"
                onClick={() => setShowImport(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
