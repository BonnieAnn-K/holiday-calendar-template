import { DEFAULT_STATE } from "../data/seed";
import { getFont, getTheme } from "./appearance";
import type { AppState, Settings, TimeOffEntry } from "../types";

const STORAGE_KEY = "holiday-pto-calendar-v1";

function applyThemeColors(settings: Settings): Settings {
  const theme = getTheme(settings.themeId);
  return {
    ...settings,
    types: settings.types.map((type) => ({
      ...type,
      color: theme.typeColors[type.id] ?? type.color,
    })),
  };
}

export function normalizeSettings(settings: Partial<Settings> | undefined): Settings {
  const merged: Settings = {
    ...DEFAULT_STATE.settings,
    ...settings,
    types: settings?.types?.length
      ? settings.types
      : DEFAULT_STATE.settings.types,
    themeId: getTheme(settings?.themeId ?? DEFAULT_STATE.settings.themeId).id,
    fontId: getFont(settings?.fontId ?? DEFAULT_STATE.settings.fontId).id,
  };
  return applyThemeColors(merged);
}

function normalizeEntry(entry: TimeOffEntry): TimeOffEntry {
  return {
    ...entry,
    reason: entry.reason ?? "",
  };
}

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(DEFAULT_STATE);
    const parsed = JSON.parse(raw) as AppState;
    if (!parsed?.settings || !Array.isArray(parsed.entries)) {
      return structuredClone(DEFAULT_STATE);
    }
    return {
      settings: normalizeSettings(parsed.settings),
      entries: parsed.entries.map(normalizeEntry),
      importedEntries:
        Array.isArray(parsed.importedEntries) && parsed.importedEntries.length > 0
          ? parsed.importedEntries.map(normalizeEntry)
          : structuredClone(DEFAULT_STATE.importedEntries),
    };
  } catch {
    return structuredClone(DEFAULT_STATE);
  }
}

export function saveState(state: AppState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function resetImportedEntries(state: AppState): AppState {
  return {
    ...state,
    entries: structuredClone(state.importedEntries),
  };
}

export function applyImportedEntries(
  state: AppState,
  entries: TimeOffEntry[],
): AppState {
  const imported = entries.map(normalizeEntry);
  return {
    ...state,
    entries: structuredClone(imported),
    importedEntries: structuredClone(imported),
  };
}

export function clearAllEntries(state: AppState): AppState {
  return {
    ...state,
    entries: [],
  };
}
