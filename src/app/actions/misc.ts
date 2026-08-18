"use server";
import { and, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db";
import * as t from "@/db/schema";
import { requireUser } from "@/lib/session";
import { notify, audit, addReward, recalcVenueRating } from "@/lib/mutations";

export async function toggleFavorite(venueId: string) {
  const user = await requireUser();
  const db = getDb();
  const existing = (await db.select().from(t.favorites).where(and(eq(t.favorites.userId, user.id), eq(t.favorites.venueId, venueId))).limit(1))[0];
  if (existing) {
    await db.delete(t.favorites).where(eq(t.favorites.id, existing.id));
    revalidatePath("/favorites");
    return { favorited: false };
  }
  await db.insert(t.favorites).values({ id: nanoid(), userId: user.id, venueId });
  revalidatePath("/favorites");
  return { favorited: true };
}

export async function markAllNotificationsRead() {
  const user = await requireUser();
  await getDb().update(t.notifications).set({ read: true }).where(eq(t.notifications.userId, user.id));
  revalidatePath("/notifications");
}

export async function submitReview(input: { venueId: string; bookingId?: string; overall: number; quality: number; cleanliness: number; staffRating: number; facilities: number; valueForMoney: number; body: string }) {
  const user = await requireUser();
  const db = getDb();
  await db.insert(t.reviews).values({
    id: nanoid(), venueId: input.venueId, userId: user.id, bookingId: input.bookingId,
    overall: input.overall, quality: input.quality, cleanliness: input.cleanliness, staffRating: input.staffRating,
    facilities: input.facilities, valueForMoney: input.valueForMoney, body: input.body, status: "published",
  });
  await recalcVenueRating(input.venueId);
  await addReward(user.id, 50, "review", "Thanks for reviewing!");
  await audit({ actorId: user.id, actorRole: "customer", action: "review.create", entity: "venue", entityId: input.venueId });
  revalidatePath("/bookings");
  return { ok: true };
}

export async function raiseDispute(input: { bookingId: string; venueId: string; reason: string; detail: string }) {
  const user = await requireUser();
  const db = getDb();
  const code = "DSP-" + Math.floor(1000 + Math.random() * 9000);
  await db.insert(t.disputes).values({ id: nanoid(), code, bookingId: input.bookingId, userId: user.id, venueId: input.venueId, reason: input.reason as any, detail: input.detail, status: "open" });
  await notify(user.id, "Dispute raised", `We've logged your dispute ${code}. Our team will review it.`, "dispute", "/support");
  return { code };
}

export async function createSupportTicket(input: { category: string; subject: string; body: string }) {
  const user = await requireUser();
  const db = getDb();
  const code = "TKT-" + Math.floor(1000 + Math.random() * 9000);
  await db.insert(t.supportTickets).values({ id: nanoid(), code, userId: user.id, category: input.category as any, subject: input.subject, body: input.body, status: "open" });
  revalidatePath("/support");
  return { code };
}

export async function updateProfile(input: { name: string; phone?: string; favoriteSports?: string[]; preferredTimes?: string[] }) {
  const user = await requireUser();
  const db = getDb();
  await db.update(t.users).set({ name: input.name, phone: input.phone, updatedAt: new Date() }).where(eq(t.users.id, user.id));
  const existing = (await db.select().from(t.userProfiles).where(eq(t.userProfiles.userId, user.id)).limit(1))[0];
  if (existing) await db.update(t.userProfiles).set({ favoriteSports: input.favoriteSports ?? existing.favoriteSports, preferredTimes: input.preferredTimes ?? existing.preferredTimes, updatedAt: new Date() }).where(eq(t.userProfiles.userId, user.id));
  else await db.insert(t.userProfiles).values({ id: nanoid(), userId: user.id, favoriteSports: input.favoriteSports ?? [], preferredTimes: input.preferredTimes ?? [] });
  revalidatePath("/profile");
  return { ok: true };
}
