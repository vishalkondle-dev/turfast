import { eq, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { getDb } from "@/db";
import * as t from "@/db/schema";

/** Shared write helpers (server-side, not server actions themselves). */

export async function notify(userId: string, title: string, body: string, type = "general", href?: string) {
  await getDb().insert(t.notifications).values({ id: nanoid(), userId, title, body, type, href, read: false });
}

export async function audit(a: { actorId?: string; actorRole?: string; action: string; entity: string; entityId?: string; prev?: string; next?: string; meta?: string }) {
  await getDb().insert(t.auditLogs).values({
    id: nanoid(), actorId: a.actorId, actorRole: a.actorRole, action: a.action, entity: a.entity, entityId: a.entityId,
    prevValue: a.prev, newValue: a.next, meta: a.meta,
  });
}

export async function addReward(userId: string, points: number, reason: typeof t.rewardsLedger.$inferInsert["reason"], note?: string) {
  const db = getDb();
  await db.insert(t.rewardsLedger).values({ id: nanoid(), userId, points, reason, note });
  await db.update(t.users).set({ loyaltyPoints: sql`${t.users.loyaltyPoints} + ${points}` }).where(eq(t.users.id, userId));
}

export async function walletAdjust(userId: string, amount: number, type: typeof t.walletTransactions.$inferInsert["type"], note?: string, refId?: string) {
  const db = getDb();
  let w = (await db.select().from(t.wallets).where(eq(t.wallets.userId, userId)).limit(1))[0];
  if (!w) {
    w = { id: nanoid(), userId, balance: 0, updatedAt: new Date() } as typeof t.wallets.$inferSelect;
    await db.insert(t.wallets).values(w);
  }
  const balanceAfter = w.balance + amount;
  await db.update(t.wallets).set({ balance: balanceAfter, updatedAt: new Date() }).where(eq(t.wallets.id, w.id));
  await db.insert(t.walletTransactions).values({ id: nanoid(), walletId: w.id, amount, balanceAfter, type, note, refId });
  return balanceAfter;
}

export async function recalcVenueRating(venueId: string) {
  const db = getDb();
  const rows = await db.select().from(t.reviews).where(eq(t.reviews.venueId, venueId));
  const published = rows.filter((r) => r.status === "published");
  const avg = published.length ? published.reduce((a, r) => a + r.overall, 0) / published.length : 0;
  await db.update(t.venues).set({ rating: Math.round(avg * 10) / 10, reviewCount: published.length }).where(eq(t.venues.id, venueId));
}

export function bookingCode() {
  return "TRF-" + Math.floor(100000 + Math.random() * 900000);
}
