/** Coupon validation + discount computation. */

export type Coupon = {
  code: string;
  type: "percent" | "flat";
  value: number;
  maxDiscount?: number | null;
  minAmount: number;
  scope: "all" | "venue" | "sport" | "first_booking" | "new_user";
  scopeRef?: string | null;
  validDays?: number[] | null; // 0..6
  startHour?: number | null;
  endHour?: number | null;
  usageLimit?: number | null;
  usedCount: number;
  active: boolean;
  expiresAt?: number | null;
};

export type CouponContext = {
  amount: number;
  venueId?: string;
  sportId?: string;
  slotStart: Date;
  isFirstBooking?: boolean;
  isNewUser?: boolean;
  now?: number;
};

export type CouponResult = { ok: true; discount: number } | { ok: false; reason: string };

export function applyCoupon(c: Coupon, ctx: CouponContext): CouponResult {
  const now = ctx.now ?? Date.now();
  if (!c.active) return { ok: false, reason: "This coupon is not active." };
  if (c.expiresAt && now > c.expiresAt) return { ok: false, reason: "This coupon has expired." };
  if (c.usageLimit != null && c.usedCount >= c.usageLimit) return { ok: false, reason: "This coupon has reached its usage limit." };
  if (ctx.amount < c.minAmount) return { ok: false, reason: `Minimum booking amount of ₹${c.minAmount} required.` };

  if (c.scope === "venue" && c.scopeRef && c.scopeRef !== ctx.venueId)
    return { ok: false, reason: "This coupon is not valid for this venue." };
  if (c.scope === "sport" && c.scopeRef && c.scopeRef !== ctx.sportId)
    return { ok: false, reason: "This coupon is not valid for this sport." };
  if (c.scope === "first_booking" && !ctx.isFirstBooking)
    return { ok: false, reason: "Valid only on your first booking." };
  if (c.scope === "new_user" && !ctx.isNewUser)
    return { ok: false, reason: "Valid for new users only." };

  if (c.validDays && c.validDays.length && !c.validDays.includes(ctx.slotStart.getDay()))
    return { ok: false, reason: "This coupon is not valid on the selected day." };
  const hour = ctx.slotStart.getHours();
  if (c.startHour != null && c.endHour != null && (hour < c.startHour || hour >= c.endHour))
    return { ok: false, reason: "This coupon is not valid for the selected time." };

  let discount = c.type === "percent" ? Math.round((ctx.amount * c.value) / 100) : c.value;
  if (c.maxDiscount != null) discount = Math.min(discount, c.maxDiscount);
  discount = Math.min(discount, ctx.amount);
  return { ok: true, discount };
}
