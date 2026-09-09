export type AccrualTier = {
  id: string;
  name: string;
  annualHours: number;
  days: number;
};

export const ACCRUAL_TIERS: AccrualTier[] = [
  {
    id: "0-5",
    name: "0 to 5 years",
    annualHours: 160,
    days: 20,
  },
  {
    id: "6-10",
    name: "6 to 10 years",
    annualHours: 200,
    days: 25,
  },
  {
    id: "10-plus",
    name: "More than 10 years",
    annualHours: 240,
    days: 30,
  },
];

export function monthlyHoursForAnnual(annualHours: number): number {
  return annualHours / 12;
}

export function formatMonthlyHours(annualHours: number): string {
  const monthly = monthlyHoursForAnnual(annualHours);
  if (Number.isInteger(monthly)) return String(monthly);
  return monthly.toFixed(2);
}

export function getAccrualTier(id: string | undefined): AccrualTier {
  return ACCRUAL_TIERS.find((tier) => tier.id === id) ?? inferAccrualTier(undefined);
}

export function inferAccrualTier(hoursPerMonth: number | undefined): AccrualTier {
  if (!Number.isFinite(hoursPerMonth) || hoursPerMonth == null) {
    return ACCRUAL_TIERS[0];
  }
  let closest = ACCRUAL_TIERS[0];
  let best = Number.POSITIVE_INFINITY;
  for (const tier of ACCRUAL_TIERS) {
    const monthly = monthlyHoursForAnnual(tier.annualHours);
    const gap = Math.abs(monthly - hoursPerMonth);
    if (gap < best) {
      best = gap;
      closest = tier;
    }
  }
  return closest;
}
