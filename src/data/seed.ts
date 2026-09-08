import type { AppState, TimeOffEntry, TimeOffType } from "../types";

export const DEFAULT_TYPES: TimeOffType[] = [
  {
    id: "scheduled",
    name: "Scheduled Flex PTO",
    countsTowardPto: true,
    color: "#0071BB",
  },
  {
    id: "sick",
    name: "Sick / Safe Flex PTO",
    countsTowardPto: true,
    color: "#EC1C23",
  },
  {
    id: "unscheduled",
    name: "Unscheduled Flex PTO",
    countsTowardPto: true,
    color: "#0d2b4a",
  },
  {
    id: "bereavement",
    name: "Bereavement",
    countsTowardPto: false,
    color: "#6b5b95",
  },
];

export const SEED_ENTRIES: TimeOffEntry[] = [];

export const DEFAULT_STATE: AppState = {
  settings: {
    name: "",
    startDate: "2025-01-01",
    startingBalance: 0,
    hoursPerMonth: 20,
    themeId: "company",
    fontId: "clean",
    types: DEFAULT_TYPES,
  },
  entries: SEED_ENTRIES,
  importedEntries: [],
};
