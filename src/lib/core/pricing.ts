/** Pure pricing engine. All money in whole ₹. */

export type PricingRule = {
  id: string;
  label: string;
  dayType: "all" | "weekday" | "weekend" | "holiday";
  startHour: number;
  endHour: number;
  price: number; // ₹ per hour
  priority: number;
};

export type PriceContext = {
  basePrice: number; // ₹/hour fallback
  rules: PricingRule[];
  start: Date;
  durationMins: number;
  isHoliday?: boolean;
};

function isWeekend(d: Date) {
  const g = d.getDay();
  return g === 0 || g === 6;
}

/** Resolve the ₹/hour rate that applies at a given moment. */
export function resolveHourlyRate(ctx: Omit<PriceContext, "durationMins">): { rate: number; ruleLabel: string } {
  const hour = ctx.start.getHours();
  const weekend = isWeekend(ctx.start);
  const candidates = ctx.rules
    .filter((r) => hour >= r.startHour && hour < r.endHour)
    .filter((r) => {
      if (r.dayType === "all") return true;
      if (r.dayType === "holiday") return !!ctx.isHoliday;
      if (r.dayType === "weekend") return weekend;
      if (r.dayType === "weekday") return !weekend;
      return false;
    })
    .sort((a, b) => b.priority - a.priority || b.price - a.price);
  if (candidates.length) return { rate: candidates[0].price, ruleLabel: candidates[0].label };
  return { rate: ctx.basePrice, ruleLabel: "Base price" };
}

/**
 * Total slot price. Rate can change across the hours a slot spans, so we
 * integrate per-hour segments.
 */
export function slotPrice(ctx: PriceContext): { total: number; segments: { rate: number; mins: number; label: string }[] } {
  const segments: { rate: number; mins: number; label: string }[] = [];
  let remaining = ctx.durationMins;
  let cursor = new Date(ctx.start);
  let total = 0;
  // cap loop for safety
  let guard = 0;
  while (remaining > 0 && guard++ < 48) {
    const { rate, ruleLabel } = resolveHourlyRate({ basePrice: ctx.basePrice, rules: ctx.rules, start: cursor, isHoliday: ctx.isHoliday });
    const minsToNextHour = 60 - cursor.getMinutes();
    const chunk = Math.min(remaining, minsToNextHour, 60);
    total += (rate * chunk) / 60;
    const existing = segments.find((s) => s.rate === rate && s.label === ruleLabel);
    if (existing) existing.mins += chunk;
    else segments.push({ rate, mins: chunk, label: ruleLabel });
    remaining -= chunk;
    cursor = new Date(cursor.getTime() + chunk * 60000);
  }
  return { total: Math.round(total), segments };
}

export const PLATFORM_FEE_PCT = 4; // 4% platform fee
export const TAX_PCT = 0; // GST handled by venue; platform fee tax kept 0 for demo

export function checkoutBreakdown(base: number, discount: number, walletUsed: number) {
  const afterDiscount = Math.max(0, base - discount);
  const platformFee = Math.round((afterDiscount * PLATFORM_FEE_PCT) / 100);
  const tax = Math.round((platformFee * TAX_PCT) / 100);
  const beforeWallet = afterDiscount + platformFee + tax;
  const wallet = Math.min(walletUsed, beforeWallet);
  const total = Math.max(0, beforeWallet - wallet);
  return { afterDiscount, platformFee, tax, walletUsed: wallet, total };
}
