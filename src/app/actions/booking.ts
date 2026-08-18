"use server";
import { and, eq, gte, inArray, lt, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db";
import * as t from "@/db/schema";
import { requireUser } from "@/lib/session";
import { slotPrice, checkoutBreakdown } from "@/lib/core/pricing";
import { applyCoupon, type Coupon } from "@/lib/core/coupons";
import { refundAmount } from "@/lib/core/refund";
import { rescheduleDiff } from "@/lib/core/reschedule";
import { isSlotFree } from "@/lib/core/availability";
import { getGateway } from "@/lib/payments";
import { notify, audit, addReward, walletAdjust, bookingCode } from "@/lib/mutations";
import { sendMail, bookingEmail } from "@/lib/mail";
import { fmtDateLong, fmtRange, inr } from "@/lib/format";

const HOLD_MINUTES = 8;
const ACTIVE = ["pending", "payment_pending", "confirmed", "checked_in", "completed", "rescheduled", "disputed"];

async function takenIntervals(resourceId: string, aroundStart: number) {
  const db = getDb();
  const dayStart = aroundStart - 12 * 3600000, dayEnd = aroundStart + 12 * 3600000;
  const [bk, resv, mb] = await Promise.all([
    db.select().from(t.bookings).where(and(eq(t.bookings.resourceId, resourceId), inArray(t.bookings.status, ACTIVE as any))),
    db.select().from(t.reservations).where(and(eq(t.reservations.resourceId, resourceId), eq(t.reservations.status, "held"), gte(t.reservations.expiresAt, new Date()))),
    db.select().from(t.maintenanceBlocks).where(eq(t.maintenanceBlocks.resourceId, resourceId)),
  ]);
  void dayStart; void dayEnd;
  return [
    ...bk.map((b) => ({ start: +b.startsAt, end: +b.endsAt })),
    ...resv.map((r) => ({ start: +r.startsAt, end: +r.endsAt })),
    ...mb.map((m) => ({ start: +m.startsAt, end: +m.endsAt })),
  ];
}

/** Place a short-lived hold. Returns reservation id or throws a user-facing error. */
export async function reserveSlot(resourceId: string, startMs: number, durationMins: number) {
  const user = await requireUser();
  const db = getDb();
  const res = (await db.select().from(t.resources).where(eq(t.resources.id, resourceId)).limit(1))[0];
  if (!res) throw new Error("Resource not found.");
  const end = startMs + durationMins * 60000;
  if (startMs < Date.now()) throw new Error("That time is in the past.");

  const taken = await takenIntervals(resourceId, startMs);
  if (!isSlotFree(startMs, end, taken)) throw new Error("That slot was just taken. Please pick another.");

  const id = nanoid();
  await db.insert(t.reservations).values({
    id, resourceId, userId: user.id, startsAt: new Date(startMs), endsAt: new Date(end),
    expiresAt: new Date(Date.now() + HOLD_MINUTES * 60000), status: "held",
  });
  return id;
}

export type Quote = {
  base: number; discount: number; platformFee: number; tax: number; walletUsed: number; total: number;
  couponError?: string; segments: { rate: number; mins: number; label: string }[];
};

async function priceReservation(reservationId: string): Promise<{ res: any; resource: any; base: number; segments: any[] }> {
  const db = getDb();
  const res = (await db.select().from(t.reservations).where(eq(t.reservations.id, reservationId)).limit(1))[0];
  if (!res) throw new Error("Reservation expired. Please try again.");
  const resource = (await db.select().from(t.resources).where(eq(t.resources.id, res.resourceId)).limit(1))[0];
  const rules = await db.select().from(t.pricingRules).where(eq(t.pricingRules.resourceId, resource.id));
  const dur = Math.round((+res.endsAt - +res.startsAt) / 60000);
  const { total, segments } = slotPrice({ basePrice: resource.basePrice, rules: rules as any, start: new Date(+res.startsAt), durationMins: dur });
  return { res, resource, base: total, segments };
}

/** Compute a live checkout quote (coupon + wallet). Pure-ish read, safe to call from UI. */
export async function quoteCheckout(reservationId: string, couponCode?: string, useWallet?: boolean): Promise<Quote> {
  const user = await requireUser();
  const db = getDb();
  const { res, resource, base, segments } = await priceReservation(reservationId);
  let discount = 0; let couponError: string | undefined;
  if (couponCode) {
    const c = (await db.select().from(t.coupons).where(eq(t.coupons.code, couponCode.toUpperCase())).limit(1))[0];
    if (!c) couponError = "Invalid coupon code.";
    else {
      const priorBookings = await db.select().from(t.bookings).where(eq(t.bookings.userId, user.id));
      const r = applyCoupon(c as unknown as Coupon, {
        amount: base, venueId: resource.venueId, sportId: resource.sportId, slotStart: new Date(+res.startsAt),
        isFirstBooking: priorBookings.length === 0, isNewUser: priorBookings.length === 0,
      });
      if (r.ok) discount = r.discount; else couponError = r.reason;
    }
  }
  let walletBal = 0;
  if (useWallet) {
    const w = (await db.select().from(t.wallets).where(eq(t.wallets.userId, user.id)).limit(1))[0];
    walletBal = w?.balance ?? 0;
  }
  const bd = checkoutBreakdown(base, discount, walletBal);
  return { base, discount, platformFee: bd.platformFee, tax: bd.tax, walletUsed: bd.walletUsed, total: bd.total, couponError, segments };
}

/** The transactional money path. Race-safe via the unique partial index on (resource,start). */
export async function payAndConfirm(reservationId: string, opts: { method?: string; couponCode?: string; useWallet?: boolean; simulate?: "success" | "failure" | "timeout" }) {
  const user = await requireUser();
  const db = getDb();
  const { res, resource } = await priceReservation(reservationId);
  if (res.userId !== user.id) throw new Error("This reservation belongs to another user.");
  if (+res.expiresAt < Date.now()) throw new Error("Your reservation expired. Please pick the slot again.");

  const quote = await quoteCheckout(reservationId, opts.couponCode, opts.useWallet);

  // run payment
  const gateway = getGateway();
  const method = (opts.method as any) || "upi";
  const payAmount = quote.total;
  let outcome = { status: "successful" as const, gatewayRef: "wallet_only", gateway: gateway.name };
  if (payAmount > 0) {
    const intent = await gateway.createIntent(payAmount, method, { userId: user.id });
    outcome = (await gateway.capture(intent.orderId, { simulate: opts.simulate })) as any;
  }
  if (outcome.status !== "successful") {
    // release the hold so the slot frees up
    await db.update(t.reservations).set({ status: "released" }).where(eq(t.reservations.id, reservationId));
    throw new Error(outcome.status === "failed" ? "Payment failed. Your slot has been released." : "Payment is still processing. Your slot hold was released — please try again.");
  }

  const dur = Math.round((+res.endsAt - +res.startsAt) / 60000);
  const code = bookingCode();
  const bookingId = nanoid();
  const qrToken = nanoid();

  try {
    await db.insert(t.bookings).values({
      id: bookingId, code, userId: user.id, venueId: resource.venueId, resourceId: resource.id, sportId: resource.sportId,
      startsAt: new Date(+res.startsAt), endsAt: new Date(+res.endsAt), durationMins: dur, status: "confirmed", source: "online",
      basePrice: quote.base, discount: quote.discount, couponCode: opts.couponCode?.toUpperCase() || null,
      walletUsed: quote.walletUsed, platformFee: quote.platformFee, tax: quote.tax, totalAmount: quote.total, qrToken,
    });
  } catch (e) {
    // unique index tripped => someone confirmed this exact slot first
    await db.update(t.reservations).set({ status: "released" }).where(eq(t.reservations.id, reservationId));
    throw new Error("That slot was just booked by another player. Your card was not charged.");
  }

  // wallet debit
  if (quote.walletUsed > 0) await walletAdjust(user.id, -quote.walletUsed, "booking", `Applied to ${code}`, bookingId);
  // payment ledger
  await db.insert(t.payments).values({ id: nanoid(), bookingId, userId: user.id, amount: quote.total, method, gateway: outcome.gateway, gatewayRef: outcome.gatewayRef, status: "successful", kind: "booking" });
  // coupon usage
  if (opts.couponCode && quote.discount > 0) await db.update(t.coupons).set({ usedCount: sql`${t.coupons.usedCount} + 1` }).where(eq(t.coupons.code, opts.couponCode.toUpperCase()));
  // consume reservation
  await db.update(t.reservations).set({ status: "consumed" }).where(eq(t.reservations.id, reservationId));

  // side effects: notify, reward, audit, email
  const venue = (await db.select().from(t.venues).where(eq(t.venues.id, resource.venueId)).limit(1))[0];
  const sport = (await db.select().from(t.sports).where(eq(t.sports.id, resource.sportId)).limit(1))[0];
  await notify(user.id, "Booking confirmed 🎉", `${venue.name} · ${sport.name} on ${fmtDateLong(new Date(+res.startsAt))}`, "booking", `/booking/${code}`);
  await addReward(user.id, Math.max(10, Math.round(quote.total / 50)), "booking", `Reward for ${code}`);
  await audit({ actorId: user.id, actorRole: "customer", action: "booking.create", entity: "booking", entityId: bookingId, next: code });
  await sendMail({ to: user.email, subject: `Booking confirmed · ${code}`, html: bookingEmail({ name: user.name, venue: venue.name, sport: sport.name, when: `${fmtDateLong(new Date(+res.startsAt))}, ${fmtRange(new Date(+res.startsAt), new Date(+res.endsAt))}`, code, amount: inr(quote.total) }) });

  revalidatePath("/bookings");
  return { code };
}

/* ---------- cancel ---------- */
export async function cancelBooking(bookingId: string) {
  const user = await requireUser();
  const db = getDb();
  const b = (await db.select().from(t.bookings).where(eq(t.bookings.id, bookingId)).limit(1))[0];
  if (!b || b.userId !== user.id) throw new Error("Booking not found.");
  if (!["confirmed", "payment_pending", "rescheduled"].includes(b.status)) throw new Error("This booking can't be cancelled.");
  const venue = (await db.select().from(t.venues).where(eq(t.venues.id, b.venueId)).limit(1))[0];
  const policy = (venue.cancellationPolicy as any) ?? [{ hours: 24, refundPct: 100 }, { hours: 12, refundPct: 50 }, { hours: 0, refundPct: 0 }];
  const { pct, amount } = refundAmount(b.totalAmount, policy, +b.startsAt);

  await db.update(t.bookings).set({ status: amount > 0 ? "refund_pending" : "cancelled", updatedAt: new Date() }).where(eq(t.bookings.id, bookingId));
  if (amount > 0) {
    await db.insert(t.refunds).values({ id: nanoid(), bookingId, userId: user.id, amount, reason: `Cancelled (${pct}% policy)`, method: "wallet", status: "completed" });
    await walletAdjust(user.id, amount, "refund", `Refund for ${b.code}`, bookingId);
    await db.update(t.bookings).set({ status: "cancelled" }).where(eq(t.bookings.id, bookingId));
  }
  await notify(user.id, "Booking cancelled", `${b.code} cancelled. ${amount > 0 ? inr(amount) + " credited to your wallet." : "No refund per policy."}`, "cancellation", "/bookings");
  await audit({ actorId: user.id, actorRole: "customer", action: "booking.cancel", entity: "booking", entityId: bookingId, prev: "confirmed", next: "cancelled" });
  revalidatePath("/bookings");
  return { refunded: amount, pct };
}

/* ---------- reschedule ---------- */
export async function rescheduleBooking(bookingId: string, newStartMs: number) {
  const user = await requireUser();
  const db = getDb();
  const b = (await db.select().from(t.bookings).where(eq(t.bookings.id, bookingId)).limit(1))[0];
  if (!b || b.userId !== user.id) throw new Error("Booking not found.");
  const end = newStartMs + b.durationMins * 60000;
  const taken = (await takenIntervals(b.resourceId, newStartMs)).filter((i) => !(i.start === +b.startsAt && i.end === +b.endsAt));
  if (!isSlotFree(newStartMs, end, taken)) throw new Error("That new slot isn't available.");

  const resource = (await db.select().from(t.resources).where(eq(t.resources.id, b.resourceId)).limit(1))[0];
  const rules = await db.select().from(t.pricingRules).where(eq(t.pricingRules.resourceId, resource.id));
  const newPrice = slotPrice({ basePrice: resource.basePrice, rules: rules as any, start: new Date(newStartMs), durationMins: b.durationMins }).total;
  const diff = rescheduleDiff(b.basePrice, newPrice);

  await db.update(t.bookings).set({ startsAt: new Date(newStartMs), endsAt: new Date(end), basePrice: newPrice, status: "confirmed", updatedAt: new Date() }).where(eq(t.bookings.id, bookingId));
  if (diff.action === "wallet_credit" && diff.creditAmount > 0) await walletAdjust(user.id, diff.creditAmount, "adjustment", `Reschedule credit for ${b.code}`, bookingId);
  await notify(user.id, "Booking rescheduled", `${b.code} moved to ${fmtDateLong(new Date(newStartMs))}.`, "rescheduling", "/bookings");
  await audit({ actorId: user.id, actorRole: "customer", action: "booking.reschedule", entity: "booking", entityId: bookingId });
  revalidatePath("/bookings");
  return diff;
}
