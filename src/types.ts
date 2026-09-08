export type TimeOffType = {
  id: string;
  name: string;
  countsTowardPto: boolean;
  color: string;
};

export type TimeOffEntry = {
  id: string;
  date: string;
  typeId: string;
  hours: number;
  reason: string;
};

export type Settings = {
  name: string;
  startDate: string;
  startingBalance: number;
  hoursPerMonth: number;
  themeId: string;
  fontId: string;
  types: TimeOffType[];
};

export type AppState = {
  settings: Settings;
  entries: TimeOffEntry[];
  importedEntries: TimeOffEntry[];
};

export type BalanceSnapshot = {
  asOf: string;
  balance: number;
  startingBalance: number;
  accruedHours: number;
  accrualMonths: number;
  usedHours: number;
  bereavementHours: number;
};

export type Projection = {
  today: BalanceSnapshot;
  selected: BalanceSnapshot;
  extraAccrualHours: number;
  scheduledHours: number;
  last12Months: {
    scheduled: number;
    sick: number;
    unscheduled: number;
  };
};
