/** Reschedule price-difference logic. */

export type RescheduleResult = {
  newPrice: number;
  oldPrice: number;
  difference: number;          // positive => customer pays; negative => credit due
  action: "pay_difference" | "wallet_credit" | "no_change";
  creditAmount: number;
  payableAmount: number;
};

export function rescheduleDiff(oldPrice: number, newPrice: number): RescheduleResult {
  const difference = newPrice - oldPrice;
  if (difference > 0)
    return { newPrice, oldPrice, difference, action: "pay_difference", creditAmount: 0, payableAmount: difference };
  if (difference < 0)
    return { newPrice, oldPrice, difference, action: "wallet_credit", creditAmount: -difference, payableAmount: 0 };
  return { newPrice, oldPrice, difference: 0, action: "no_change", creditAmount: 0, payableAmount: 0 };
}
