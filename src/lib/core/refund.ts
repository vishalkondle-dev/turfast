/** Cancellation / refund policy math. */

export type PolicyTier = { hours: number; refundPct: number };

/**
 * Given a policy (tiers sorted or unsorted) and how long before start the
 * cancellation happens, return the refundable percentage.
 * Tiers mean: "if >= `hours` before start, refund `refundPct`%".
 */
export function refundPercent(policy: PolicyTier[], hoursBeforeStart: number): number {
  const sorted = [...policy].sort((a, b) => b.hours - a.hours);
  for (const tier of sorted) {
    if (hoursBeforeStart >= tier.hours) return tier.refundPct;
  }
  // less than the smallest tier threshold
  const smallest = sorted[sorted.length - 1];
  return smallest ? smallest.refundPct : 0;
}

export function refundAmount(paidAmount: number, policy: PolicyTier[], startsAt: number, now = Date.now()): {
  pct: number;
  amount: number;
  hoursBeforeStart: number;
} {
  const hoursBeforeStart = Math.max(0, (startsAt - now) / 3600000);
  const pct = refundPercent(policy, hoursBeforeStart);
  return { pct, amount: Math.round((paidAmount * pct) / 100), hoursBeforeStart };
}
