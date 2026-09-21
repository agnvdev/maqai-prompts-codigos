// Plan catalog for the MaqDesk subscription offer. No database table for
// plans on purpose - only 2 fixed plans exist today, so a table would be
// pure overhead. subscriptions.plan just stores this id as text.
export type PlanId = "monthly" | "annual";

export interface Plan {
  id: PlanId;
  label: string;
  priceLabel: string;
  amount: number;
  frequency: number;
  frequencyType: "months";
  billingNote: string;
  badge?: string;
}

export const PLANS: Record<PlanId, Plan> = {
  monthly: {
    id: "monthly",
    label: "Mensal",
    priceLabel: "R$ 29,90",
    amount: 29.9,
    frequency: 1,
    frequencyType: "months",
    billingNote: "Renovação mensal.",
  },
  annual: {
    id: "annual",
    label: "Anual",
    priceLabel: "R$ 299",
    amount: 299,
    frequency: 12,
    frequencyType: "months",
    billingNote: "Equivale a R$ 24,92/mês · economia de R$ 59,80 no ano.",
    badge: "Melhor valor",
  },
};

export function isPlanId(value: string | null | undefined): value is PlanId {
  return value === "monthly" || value === "annual";
}
