import { and, eq, gte, inArray, lt, asc } from "drizzle-orm";
import { getDb } from "@/db";
import * as t from "@/db/schema";

export async function getStaffContext(userId: string) {
  const db = getDb();
  const staff = (await db.select().from(t.staff).where(eq(t.staff.userId, userId)).limit(1))[0];
  if (!staff) return null;
  const owner = (await db.select().from(t.owners).where(eq(t.owners.id, staff.ownerId)).limit(1))[0];
  const venues = await db.select().from(t.venues).where(eq(t.venues.ownerId, staff.ownerId));
  return { staff, owner, venues };
}

export async function getTodayBookings(venueIds: string[], dateStr?: string) {
  if (!venueIds.length) return [];
  const db = getDb();
  const base = dateStr ? new Date(dateStr + "T00:00:00") : new Date();
  base.setHours(0, 0, 0, 0);
  const dayStart = +base, dayEnd = dayStart + 86400000;
  const rows = await db.select().from(t.bookings).where(and(inArray(t.bookings.venueId, venueIds), gte(t.bookings.startsAt, new Date(dayStart)), lt(t.bookings.startsAt, new Date(dayEnd)))).orderBy(asc(t.bookings.startsAt));
  const userIds = [...new Set(rows.map((b) => b.userId))];
  const resIds = [...new Set(rows.map((b) => b.resourceId))];
  const sportIds = [...new Set(rows.map((b) => b.sportId))];
  const [users, resources, sports] = await Promise.all([
    userIds.length ? db.select().from(t.users).where(inArray(t.users.id, userIds)) : [],
    resIds.length ? db.select().from(t.resources).where(inArray(t.resources.id, resIds)) : [],
    sportIds.length ? db.select().from(t.sports).where(inArray(t.sports.id, sportIds)) : [],
  ]);
  const um = Object.fromEntries(users.map((u) => [u.id, u]));
  const rm = Object.fromEntries(resources.map((r) => [r.id, r]));
  const sm = Object.fromEntries(sports.map((s) => [s.id, s]));
  return rows.map((b) => ({ ...b, customerName: um[b.userId]?.name ?? b.walkinName ?? "Guest", resourceName: rm[b.resourceId]?.name ?? "", sportName: sm[b.sportId]?.name ?? "" }));
}
