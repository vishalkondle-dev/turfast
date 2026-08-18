"use server";
import { eq, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db";
import * as t from "@/db/schema";
import { requireRole } from "@/lib/session";
import { audit, notify } from "@/lib/mutations";

export async function setVenueStatus(venueId: string, status: "approved" | "rejected" | "suspended") {
  const user = await requireRole("admin");
  const db = getDb();
  const v = (await db.select().from(t.venues).where(eq(t.venues.id, venueId)).limit(1))[0];
  await db.update(t.venues).set({ status }).where(eq(t.venues.id, venueId));
  await audit({ actorId: user.id, actorRole: "admin", action: `venue.${status}`, entity: "venue", entityId: venueId, prev: v?.status, next: status });
  revalidatePath("/admin/venues");
  return { ok: true };
}

export async function toggleVenueFlag(venueId: string, flag: "featured" | "sponsored" | "trending", value: boolean) {
  await requireRole("admin");
  await getDb().update(t.venues).set({ [flag]: value } as any).where(eq(t.venues.id, venueId));
  revalidatePath("/admin/venues");
  return { ok: true };
}

export async function setUserStatus(userId: string, status: "active" | "suspended") {
  const user = await requireRole("admin");
  await getDb().update(t.users).set({ status }).where(eq(t.users.id, userId));
  await audit({ actorId: user.id, actorRole: "admin", action: `user.${status}`, entity: "user", entityId: userId, next: status });
  revalidatePath("/admin/users");
  return { ok: true };
}

export async function approveOwner(ownerId: string, status: "approved" | "suspended") {
  const user = await requireRole("admin");
  await getDb().update(t.owners).set({ status }).where(eq(t.owners.id, ownerId));
  await audit({ actorId: user.id, actorRole: "admin", action: `owner.${status}`, entity: "owner", entityId: ownerId });
  revalidatePath("/admin/owners");
  return { ok: true };
}

export async function moderateReview(reviewId: string, status: "published" | "hidden") {
  await requireRole("admin");
  await getDb().update(t.reviews).set({ status }).where(eq(t.reviews.id, reviewId));
  revalidatePath("/admin/reviews");
  return { ok: true };
}

export async function resolveDispute(disputeId: string, resolution: string, status: "resolved" | "closed" | "under_investigation") {
  const user = await requireRole("admin");
  const db = getDb();
  const d = (await db.select().from(t.disputes).where(eq(t.disputes.id, disputeId)).limit(1))[0];
  await db.update(t.disputes).set({ resolution, status }).where(eq(t.disputes.id, disputeId));
  if (d) await notify(d.userId, "Dispute update", `Your dispute ${d.code} is now ${status.replace("_", " ")}.`, "dispute", "/support");
  await audit({ actorId: user.id, actorRole: "admin", action: `dispute.${status}`, entity: "dispute", entityId: disputeId });
  revalidatePath("/admin/disputes");
  return { ok: true };
}

export async function markPayoutPaid(payoutId: string) {
  const user = await requireRole("admin");
  await getDb().update(t.payouts).set({ status: "paid" }).where(eq(t.payouts.id, payoutId));
  await audit({ actorId: user.id, actorRole: "admin", action: "payout.paid", entity: "payout", entityId: payoutId });
  revalidatePath("/admin/payouts");
  return { ok: true };
}

export async function updateSupportTicket(ticketId: string, status: "open" | "in_progress" | "resolved" | "closed") {
  await requireRole("admin");
  await getDb().update(t.supportTickets).set({ status }).where(eq(t.supportTickets.id, ticketId));
  revalidatePath("/admin/support");
  return { ok: true };
}
