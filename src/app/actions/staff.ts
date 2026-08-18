"use server";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db";
import * as t from "@/db/schema";
import { requireRole } from "@/lib/session";
import { audit, notify } from "@/lib/mutations";

export async function lookupBooking(codeOrToken: string) {
  await requireRole(["staff", "owner", "admin"]);
  const db = getDb();
  const term = codeOrToken.trim();
  let b = (await db.select().from(t.bookings).where(eq(t.bookings.code, term.toUpperCase())).limit(1))[0];
  if (!b) b = (await db.select().from(t.bookings).where(eq(t.bookings.qrToken, term)).limit(1))[0];
  if (!b) {
    // maybe a QR JSON payload
    try { const j = JSON.parse(term); if (j.code) b = (await db.select().from(t.bookings).where(eq(t.bookings.code, j.code)).limit(1))[0]; } catch {}
  }
  if (!b) return null;
  const venue = (await db.select().from(t.venues).where(eq(t.venues.id, b.venueId)).limit(1))[0];
  const sport = (await db.select().from(t.sports).where(eq(t.sports.id, b.sportId)).limit(1))[0];
  const resource = (await db.select().from(t.resources).where(eq(t.resources.id, b.resourceId)).limit(1))[0];
  const customer = (await db.select().from(t.users).where(eq(t.users.id, b.userId)).limit(1))[0];
  return {
    id: b.id, code: b.code, status: b.status, start: +b.startsAt, end: +b.endsAt,
    customer: customer?.name ?? b.walkinName ?? "Guest", venue: venue?.name, sport: sport?.name, resource: resource?.name,
  };
}

export async function checkInBooking(bookingId: string, action: "checkin" | "reject" | "no_show") {
  const user = await requireRole(["staff", "owner", "admin"]);
  const db = getDb();
  const b = (await db.select().from(t.bookings).where(eq(t.bookings.id, bookingId)).limit(1))[0];
  if (!b) throw new Error("Booking not found.");
  if (b.status === "checked_in") throw new Error("This booking is already checked in.");
  if (action === "checkin") {
    if (!["confirmed", "rescheduled"].includes(b.status)) throw new Error(`Can't check in a ${b.status} booking.`);
    await db.update(t.bookings).set({ status: "checked_in", checkedInAt: new Date() }).where(eq(t.bookings.id, bookingId));
    await notify(b.userId, "Checked in ✅", `You're checked in at your slot. Enjoy the game!`, "booking", "/bookings");
  } else if (action === "no_show") {
    await db.update(t.bookings).set({ status: "no_show" }).where(eq(t.bookings.id, bookingId));
  } else {
    await db.update(t.bookings).set({ status: "cancelled" }).where(eq(t.bookings.id, bookingId));
  }
  await audit({ actorId: user.id, actorRole: user.role, action: `booking.${action}`, entity: "booking", entityId: bookingId });
  revalidatePath("/staff");
  revalidatePath("/staff/checkin");
  return { ok: true, status: action === "checkin" ? "checked_in" : action === "no_show" ? "no_show" : "cancelled" };
}
