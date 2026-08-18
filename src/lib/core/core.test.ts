import { describe, it, expect } from "vitest";
import { slotPrice, checkoutBreakdown, type PricingRule } from "./pricing";
import { generateSlots, isSlotFree } from "./availability";
import { refundPercent, refundAmount } from "./refund";
import { applyCoupon, type Coupon } from "./coupons";
import { computeShares, isFullyPaid } from "./split";
import { rescheduleDiff } from "./reschedule";

const rules: PricingRule[] = [
  { id: "1", label: "Off-peak", dayType: "all", startHour: 6, endHour: 16, price: 700, priority: 1 },
  { id: "2", label: "Peak", dayType: "all", startHour: 16, endHour: 23, price: 1400, priority: 1 },
];

describe("pricing", () => {
  it("prices an off-peak 60min slot at base rate", () => {
    const start = new Date(2026, 7, 20, 8, 0, 0); // 8 AM
    expect(slotPrice({ basePrice: 700, rules, start, durationMins: 60 }).total).toBe(700);
  });
  it("prices a peak 90min slot", () => {
    const start = new Date(2026, 7, 20, 20, 0, 0); // 8 PM
    expect(slotPrice({ basePrice: 700, rules, start, durationMins: 90 }).total).toBe(2100);
  });
  it("integrates a slot spanning off-peak into peak", () => {
    const start = new Date(2026, 7, 20, 15, 30, 0); // 3:30 -> 4:30 PM
    // 30m @700 + 30m @1400 = 350 + 700 = 1050
    expect(slotPrice({ basePrice: 700, rules, start, durationMins: 60 }).total).toBe(1050);
  });
  it("computes checkout breakdown with 4% platform fee", () => {
    const b = checkoutBreakdown(1000, 100, 0);
    expect(b.afterDiscount).toBe(900);
    expect(b.platformFee).toBe(36);
    expect(b.total).toBe(936);
  });
});

describe("availability", () => {
  it("marks booked and blocked slots", () => {
    const date = new Date(2026, 7, 20, 0, 0, 0);
    const slots = generateSlots({
      date, openHour: 18, closeHour: 22, durationMins: 60,
      booked: [{ start: new Date(2026, 7, 20, 19, 0).getTime(), end: new Date(2026, 7, 20, 20, 0).getTime() }],
      blocked: [{ start: new Date(2026, 7, 20, 21, 0).getTime(), end: new Date(2026, 7, 20, 22, 0).getTime() }],
      reserved: [],
      now: new Date(2026, 7, 20, 12, 0).getTime(),
    });
    expect(slots.length).toBe(4);
    expect(slots[1].state).toBe("booked");
    expect(slots[3].state).toBe("blocked");
  });
  it("detects free slots", () => {
    expect(isSlotFree(100, 200, [{ start: 300, end: 400 }])).toBe(true);
    expect(isSlotFree(100, 200, [{ start: 150, end: 400 }])).toBe(false);
  });
});

describe("refunds", () => {
  const policy = [{ hours: 24, refundPct: 100 }, { hours: 12, refundPct: 50 }, { hours: 0, refundPct: 0 }];
  it("gives full refund >24h", () => expect(refundPercent(policy, 30)).toBe(100));
  it("gives half refund 12-24h", () => expect(refundPercent(policy, 18)).toBe(50));
  it("gives no refund <12h", () => expect(refundPercent(policy, 3)).toBe(0));
  it("computes refund amount", () => {
    const now = Date.now();
    expect(refundAmount(1000, policy, now + 30 * 3600000, now).amount).toBe(1000);
    expect(refundAmount(1000, policy, now + 18 * 3600000, now).amount).toBe(500);
  });
});

describe("coupons", () => {
  const base: Coupon = { code: "X", type: "percent", value: 20, maxDiscount: 300, minAmount: 500, scope: "all", usedCount: 0, active: true };
  it("applies percent with cap", () => {
    const r = applyCoupon(base, { amount: 2000, slotStart: new Date() });
    expect(r.ok && r.discount).toBe(300);
  });
  it("rejects below min amount", () => {
    const r = applyCoupon(base, { amount: 200, slotStart: new Date() });
    expect(r.ok).toBe(false);
  });
});

describe("split", () => {
  it("splits equally with remainder", () => {
    expect(computeShares(2000, 10, "equal")).toEqual(Array(10).fill(200));
    const s = computeShares(1000, 3, "equal");
    expect(s.reduce((a, b) => a + b)).toBe(1000);
  });
  it("host pays all", () => {
    expect(computeShares(2000, 4, "host_all")).toEqual([2000, 0, 0, 0]);
  });
  it("confirms only when fully paid", () => {
    expect(isFullyPaid([{ share: 200, paid: true }, { share: 200, paid: false }])).toBe(false);
    expect(isFullyPaid([{ share: 200, paid: true }, { share: 0, paid: false }])).toBe(true);
  });
});

describe("reschedule", () => {
  it("charges difference when new is pricier", () => {
    const r = rescheduleDiff(700, 1400);
    expect(r.action).toBe("pay_difference");
    expect(r.payableAmount).toBe(700);
  });
  it("credits wallet when new is cheaper", () => {
    const r = rescheduleDiff(1400, 700);
    expect(r.action).toBe("wallet_credit");
    expect(r.creditAmount).toBe(700);
  });
});
