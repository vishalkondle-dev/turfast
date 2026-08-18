import { and, eq, gte, inArray, lt } from "drizzle-orm";
import { requireUser } from "@/lib/session";
import { getOwnerForUser, getOwnerVenues } from "@/lib/owner";
import { getDb } from "@/db";
import * as t from "@/db/schema";
import { CalendarClient } from "./calendar-client";
import { EmptyState } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function CalendarPage({ searchParams }: { searchParams: Promise<{ date?: string; venue?: string }> }) {
  const sp = await searchParams;
  const user = await requireUser();
  const owner = await getOwnerForUser(user.id);
  const venues = owner ? await getOwnerVenues(owner.id) : [];
  if (!venues.length) return <EmptyState icon="🗓️" title="No venues yet" hint="Add a venue to manage its calendar." />;
  const venue = venues.find((v) => v.id === sp.venue) ?? venues[0];
  const dateStr = sp.date || new Date().toISOString().slice(0, 10);
  const [y, m, d] = dateStr.split("-").map(Number);
  const dayStart = new Date(y, m - 1, d, 0, 0, 0).getTime();
  const dayEnd = dayStart + 86400000;

  const db = getDb();
  const resources = await db.select().from(t.resources).where(and(eq(t.resources.venueId, venue.id), eq(t.resources.isActive, true)));
  const resIds = resources.map((r) => r.id);
  const active = ["pending", "payment_pending", "confirmed", "checked_in", "completed", "rescheduled"];
  const [bookings, blocks] = resIds.length ? await Promise.all([
    db.select().from(t.bookings).where(and(inArray(t.bookings.resourceId, resIds), inArray(t.bookings.status, active as any), gte(t.bookings.startsAt, new Date(dayStart)), lt(t.bookings.startsAt, new Date(dayEnd)))),
    db.select().from(t.maintenanceBlocks).where(and(inArray(t.maintenanceBlocks.resourceId, resIds), lt(t.maintenanceBlocks.startsAt, new Date(dayEnd)), gte(t.maintenanceBlocks.endsAt, new Date(dayStart)))),
  ]) : [[], []];
  const userIds = [...new Set(bookings.map((b) => b.userId))];
  const users = userIds.length ? await db.select().from(t.users).where(inArray(t.users.id, userIds)) : [];
  const um = Object.fromEntries(users.map((u) => [u.id, u]));

  return (
    <CalendarClient
      venues={venues.map((v) => ({ id: v.id, name: v.name }))}
      activeVenue={venue.id}
      date={dateStr}
      resources={resources.map((r) => ({ id: r.id, name: r.name, open: r.openHour, close: r.closeHour, basePrice: r.basePrice }))}
      bookings={bookings.map((b) => ({ id: b.id, resourceId: b.resourceId, start: +b.startsAt, end: +b.endsAt, name: um[b.userId]?.name ?? b.walkinName ?? "Guest", status: b.status, code: b.code }))}
      blocks={blocks.map((b) => ({ id: b.id, resourceId: b.resourceId, start: +b.startsAt, end: +b.endsAt, reason: b.reason }))}
    />
  );
}
