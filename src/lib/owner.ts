import { and, desc, eq, gte, inArray, lt } from "drizzle-orm";
import { getDb } from "@/db";
import * as t from "@/db/schema";

export async function getOwnerForUser(userId: string) {
  return (await getDb().select().from(t.owners).where(eq(t.owners.userId, userId)).limit(1))[0] ?? null;
}

export async function getOwnerVenues(ownerId: string) {
  return getDb().select().from(t.venues).where(eq(t.venues.ownerId, ownerId));
}

export async function getOwnerBookings(ownerId: string) {
  const db = getDb();
  const venues = await getOwnerVenues(ownerId);
  const venueIds = venues.map((v) => v.id);
  if (!venueIds.length) return { venues, bookings: [] as any[] };
  const bookings = await db.select().from(t.bookings).where(inArray(t.bookings.venueId, venueIds)).orderBy(desc(t.bookings.startsAt));
  const userIds = [...new Set(bookings.map((b) => b.userId))];
  const resIds = [...new Set(bookings.map((b) => b.resourceId))];
  const sportIds = [...new Set(bookings.map((b) => b.sportId))];
  const [users, resources, sports] = await Promise.all([
    userIds.length ? db.select().from(t.users).where(inArray(t.users.id, userIds)) : [],
    resIds.length ? db.select().from(t.resources).where(inArray(t.resources.id, resIds)) : [],
    sportIds.length ? db.select().from(t.sports).where(inArray(t.sports.id, sportIds)) : [],
  ]);
  const um = Object.fromEntries(users.map((u) => [u.id, u]));
  const rm = Object.fromEntries(resources.map((r) => [r.id, r]));
  const sm = Object.fromEntries(sports.map((s) => [s.id, s]));
  const vm = Object.fromEntries(venues.map((v) => [v.id, v]));
  return { venues, bookings: bookings.map((b) => ({ ...b, customer: um[b.userId], resource: rm[b.resourceId], sport: sm[b.sportId], venue: vm[b.venueId] })) };
}

export function ownerStats(bookings: any[]) {
  const now = Date.now();
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
  const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
  const paid = bookings.filter((b) => !["cancelled", "refunded"].includes(b.status));
  const gross = paid.reduce((a, b) => a + b.totalAmount, 0);
  const commission = Math.round(gross * 0.12);
  const refunds = bookings.filter((b) => b.status === "refunded" || b.status === "refund_pending").reduce((a, b) => a + b.totalAmount, 0);
  const todayBookings = bookings.filter((b) => +b.startsAt >= +todayStart && +b.startsAt < +todayStart + 86400000 && b.status !== "cancelled");
  const todayRevenue = todayBookings.reduce((a, b) => a + b.totalAmount, 0);
  const monthRevenue = paid.filter((b) => +b.createdAt >= +monthStart).reduce((a, b) => a + b.totalAmount, 0);
  const upcoming = bookings.filter((b) => +b.startsAt > now && ["confirmed", "rescheduled"].includes(b.status));
  const customers = new Set(paid.map((b) => b.userId)).size;
  return { gross, commission, net: gross - commission - refunds, refunds, todayBookings, todayRevenue, monthRevenue, upcoming, customers, totalBookings: bookings.length };
}
