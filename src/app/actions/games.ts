"use server";
import { and, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db";
import * as t from "@/db/schema";
import { requireUser } from "@/lib/session";
import { notify, audit } from "@/lib/mutations";

export async function createGame(input: {
  venueId: string; resourceId?: string; sportId: string; startMs: number; durationMins: number;
  playersNeeded: number; pricePerPlayer: number; skillLevel: string; gameType: string; visibility: string; notes?: string; title: string;
}) {
  const user = await requireUser();
  const db = getDb();
  const id = nanoid();
  await db.insert(t.games).values({
    id, title: input.title, hostId: user.id, venueId: input.venueId, resourceId: input.resourceId, sportId: input.sportId,
    startsAt: new Date(input.startMs), endsAt: new Date(input.startMs + input.durationMins * 60000),
    playersNeeded: input.playersNeeded, pricePerPlayer: input.pricePerPlayer, skillLevel: input.skillLevel as any,
    gameType: input.gameType as any, visibility: input.visibility as any, status: "open", notes: input.notes,
  });
  await db.insert(t.gameParticipants).values({ id: nanoid(), gameId: id, userId: user.id, paid: true, isHost: true });
  await db.insert(t.gameMessages).values({ id: nanoid(), gameId: id, userId: user.id, body: `${user.name} created this game. Who's in? 🔥`, kind: "system" });
  await audit({ actorId: user.id, actorRole: "customer", action: "game.create", entity: "game", entityId: id });
  revalidatePath("/games");
  return { id };
}

export async function joinGame(gameId: string) {
  const user = await requireUser();
  const db = getDb();
  const game = (await db.select().from(t.games).where(eq(t.games.id, gameId)).limit(1))[0];
  if (!game) throw new Error("Game not found.");
  const existing = (await db.select().from(t.gameParticipants).where(and(eq(t.gameParticipants.gameId, gameId), eq(t.gameParticipants.userId, user.id))).limit(1))[0];
  if (existing) throw new Error("You've already joined this game.");
  const parts = await db.select().from(t.gameParticipants).where(eq(t.gameParticipants.gameId, gameId));
  if (parts.length >= game.playersNeeded) throw new Error("This game is full.");
  await db.insert(t.gameParticipants).values({ id: nanoid(), gameId, userId: user.id, paid: true });
  await db.insert(t.gameMessages).values({ id: nanoid(), gameId, userId: user.id, body: `${user.name} joined the game.`, kind: "system" });
  if (parts.length + 1 >= game.playersNeeded) await db.update(t.games).set({ status: "full" }).where(eq(t.games.id, gameId));
  await notify(game.hostId, "New player joined", `${user.name} joined your game "${game.title}".`, "game", `/games/${gameId}`);
  revalidatePath(`/games/${gameId}`);
  revalidatePath("/games");
  return { ok: true };
}

export async function leaveGame(gameId: string) {
  const user = await requireUser();
  const db = getDb();
  await db.delete(t.gameParticipants).where(and(eq(t.gameParticipants.gameId, gameId), eq(t.gameParticipants.userId, user.id)));
  await db.update(t.games).set({ status: "open" }).where(eq(t.games.id, gameId));
  revalidatePath(`/games/${gameId}`);
  return { ok: true };
}

export async function sendGameMessage(gameId: string, body: string) {
  const user = await requireUser();
  if (!body.trim()) return { ok: false };
  await getDb().insert(t.gameMessages).values({ id: nanoid(), gameId, userId: user.id, body: body.trim(), kind: "message" });
  revalidatePath(`/games/${gameId}`);
  return { ok: true };
}
