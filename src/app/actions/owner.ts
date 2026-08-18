"use server";
import { and, eq, inArray } from "drizzle-orm";
import { nanoid } from "nanoid";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db";
import * as t from "@/db/schema";
import { requireRole } from "@/lib/session";
import { audit, bookingCode, notify } from "@/lib/mutations";
import { isSlotFree } from "@/lib/core/availability";

async function ownerOf(userId: string) {
  return (await getDb().select().from(t.owners).where(eq(t.owners.userId, userId)).limit(1))[0];
}

export async function blockSlot(input: { resourceId: string; startMs: number; endMs: number; reason: string; note?: string }) {
  const user = await requireRole(["owner", "admin"]);
  const db = getDb();
  await db.insert(t.maintenanceBlocks).values({
    id: nanoid(), resourceId: input.resourceId, reason: input.reason as any,
    startsAt: new Date(input.startMs), endsAt: new Date(input.endMs), note: input.note, createdBy: user.id,
  });
  await audit({ actorId: user.id, actorRole: user.role, action: "slot.block", entity: "resource", entityId: input.resourceId, meta: input.reason });
  revalidatePath("/owner/calendar");
  return { ok: true };
}

export async function unblockSlot(blockId: string) {
  const user = await requireRole(["owner", "admin"]);
  await getDb().delete(t.maintenanceBlocks).where(eq(t.maintenanceBlocks.id, blockId));
  revalidatePath("/owner/calendar");
  return { ok: true };
}

export async function createWalkin(input: { venueId: string; resourceId: string; startMs: number; durationMins: number; name: string; phone: string; amount: number; method: string }) {
  const user = await requireRole(["owner", "admin", "staff"]);
  const db = getDb();
  const resource = (await db.select().from(t.resources).where(eq(t.resources.id, input.resourceId)).limit(1))[0];
  const end = input.startMs + input.durationMins * 60000;
  // overlap check
  const active = ["pending", "payment_pending", "confirmed", "checked_in", "completed", "rescheduled"];
  const existing = await db.select().from(t.bookings).where(and(eq(t.bookings.resourceId, input.resourceId), inArray(t.bookings.status, active as any)));
  if (!isSlotFree(input.startMs, end, existing.map((b) => ({ start: +b.startsAt, end: +b.endsAt })))) throw new Error("That slot is already booked.");

  const code = bookingCode();
  const id = nanoid();
  await db.insert(t.bookings).values({
    id, code, userId: user.id, venueId: input.venueId, resourceId: input.resourceId, sportId: resource.sportId,
    startsAt: new Date(input.startMs), endsAt: new Date(end), durationMins: input.durationMins, status: "confirmed", source: "walkin",
    basePrice: input.amount, discount: 0, walletUsed: 0, platformFee: 0, tax: 0, totalAmount: input.amount, qrToken: nanoid(),
    walkinName: input.name, walkinPhone: input.phone,
  });
  await db.insert(t.payments).values({ id: nanoid(), bookingId: id, userId: user.id, amount: input.amount, method: input.method as any, gateway: "counter", status: "successful", kind: "booking" });
  await audit({ actorId: user.id, actorRole: user.role, action: "booking.walkin", entity: "booking", entityId: id, next: code });
  revalidatePath("/owner/bookings");
  revalidatePath("/owner/calendar");
  return { code };
}

export async function createCoupon(input: { code: string; description: string; type: string; value: number; minAmount: number; maxDiscount?: number; scope: string; scopeRef?: string }) {
  const user = await requireRole(["owner", "admin"]);
  const owner = await ownerOf(user.id);
  await getDb().insert(t.coupons).values({
    id: nanoid(), code: input.code.toUpperCase(), description: input.description, type: input.type as any, value: input.value,
    minAmount: input.minAmount, maxDiscount: input.maxDiscount, scope: input.scope as any, scopeRef: input.scopeRef,
    ownerId: owner?.id, active: true, usedCount: 0,
  });
  revalidatePath("/owner/offers");
  return { ok: true };
}

export async function toggleCoupon(couponId: string, active: boolean) {
  await requireRole(["owner", "admin"]);
  await getDb().update(t.coupons).set({ active }).where(eq(t.coupons.id, couponId));
  revalidatePath("/owner/offers");
}

export async function replyToReview(reviewId: string, reply: string) {
  const user = await requireRole(["owner", "admin"]);
  await getDb().update(t.reviews).set({ ownerReply: reply }).where(eq(t.reviews.id, reviewId));
  await audit({ actorId: user.id, actorRole: user.role, action: "review.reply", entity: "review", entityId: reviewId });
  revalidatePath("/owner/reviews");
  return { ok: true };
}

export async function updateResourcePrice(resourceId: string, basePrice: number) {
  const user = await requireRole(["owner", "admin"]);
  const db = getDb();
  const prev = (await db.select().from(t.resources).where(eq(t.resources.id, resourceId)).limit(1))[0];
  await db.update(t.resources).set({ basePrice }).where(eq(t.resources.id, resourceId));
  await audit({ actorId: user.id, actorRole: user.role, action: "price.update", entity: "resource", entityId: resourceId, prev: `₹${prev?.basePrice}`, next: `₹${basePrice}` });
  revalidatePath("/owner/pricing");
  return { ok: true };
}

export async function requestPayout(amount: number) {
  const user = await requireRole(["owner", "admin"]);
  const owner = await ownerOf(user.id);
  if (!owner) throw new Error("Owner not found.");
  await getDb().insert(t.payouts).values({ id: nanoid(), ownerId: owner.id, amount, reference: "PO-" + Math.floor(100000 + Math.random() * 900000), status: "pending", periodEnd: new Date() });
  revalidatePath("/owner/revenue");
  return { ok: true };
}

export async function ownerCancelBooking(bookingId: string) {
  const user = await requireRole(["owner", "admin", "staff"]);
  await getDb().update(t.bookings).set({ status: "cancelled", updatedAt: new Date() }).where(eq(t.bookings.id, bookingId));
  await audit({ actorId: user.id, actorRole: user.role, action: "booking.cancel", entity: "booking", entityId: bookingId });
  revalidatePath("/owner/bookings");
  revalidatePath("/owner/calendar");
  return { ok: true };
}

export async function submitOnboarding(input: {
  businessName: string; contactName: string; contactPhone: string; contactEmail: string; gstin?: string; panNumber?: string;
  venueName: string; cityId: string; localityId?: string; address: string; description: string; isIndoor: boolean;
  sportSlugs: string[]; amenitySlugs: string[]; coverImage: string;
  bankAccount?: string; bankIfsc?: string; resourceName: string; basePrice: number; sportId: string;
}) {
  const user = await requireRole(["owner", "admin", "customer"]);
  const db = getDb();
  // promote to owner role
  await db.update(t.users).set({ role: "owner" }).where(eq(t.users.id, user.id));
  let owner = (await db.select().from(t.owners).where(eq(t.owners.userId, user.id)).limit(1))[0];
  if (!owner) {
    const oid = nanoid();
    await db.insert(t.owners).values({ id: oid, userId: user.id, businessName: input.businessName, contactName: input.contactName, contactPhone: input.contactPhone, contactEmail: input.contactEmail, gstin: input.gstin, panNumber: input.panNumber, bankAccount: input.bankAccount, bankIfsc: input.bankIfsc, status: "approved" });
    owner = (await db.select().from(t.owners).where(eq(t.owners.id, oid)).limit(1))[0];
  }
  const vid = nanoid();
  const slug = input.venueName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") + "-" + nanoid(4).toLowerCase();
  await db.insert(t.venues).values({ id: vid, ownerId: owner.id, name: input.venueName, slug, description: input.description, cityId: input.cityId, localityId: input.localityId, address: input.address, coverImage: input.coverImage, isIndoor: input.isIndoor, status: "submitted", rating: 0, reviewCount: 0 });
  // sports + amenities
  const sports = await db.select().from(t.sports).where(inArray(t.sports.slug, input.sportSlugs.length ? input.sportSlugs : ["football"]));
  for (const s of sports) await db.insert(t.venueSports).values({ venueId: vid, sportId: s.id });
  if (input.amenitySlugs.length) {
    const ams = await db.select().from(t.amenities).where(inArray(t.amenities.slug, input.amenitySlugs));
    for (const a of ams) await db.insert(t.venueAmenities).values({ venueId: vid, amenityId: a.id });
  }
  for (let d = 0; d < 7; d++) await db.insert(t.operatingHours).values({ id: nanoid(), venueId: vid, dayOfWeek: d, openHour: 6, closeHour: 23, isClosed: false });
  // first resource
  const rid = nanoid();
  const sportId = input.sportId || sports[0]?.id;
  await db.insert(t.resources).values({ id: rid, venueId: vid, sportId, name: input.resourceName, capacity: 10, allowedDurations: [60, 90, 120], openHour: 6, closeHour: 23, basePrice: input.basePrice, isActive: true });
  await db.insert(t.pricingRules).values([
    { id: nanoid(), resourceId: rid, label: "Weekday Off-Peak", dayType: "weekday", startHour: 6, endHour: 16, price: Math.round(input.basePrice * 0.6), priority: 2 },
    { id: nanoid(), resourceId: rid, label: "Weekday Peak", dayType: "weekday", startHour: 16, endHour: 23, price: input.basePrice, priority: 2 },
    { id: nanoid(), resourceId: rid, label: "Weekend Peak", dayType: "weekend", startHour: 16, endHour: 23, price: Math.round(input.basePrice * 1.25), priority: 3 },
  ]);
  await audit({ actorId: user.id, actorRole: "owner", action: "venue.submit", entity: "venue", entityId: vid, next: "submitted" });
  revalidatePath("/owner");
  return { ok: true, venueId: vid };
}
