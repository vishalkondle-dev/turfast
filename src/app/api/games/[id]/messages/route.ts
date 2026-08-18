import { NextRequest, NextResponse } from "next/server";
import { eq, inArray, asc } from "drizzle-orm";
import { getDb } from "@/db";
import * as t from "@/db/schema";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();
  const messages = await db.select().from(t.gameMessages).where(eq(t.gameMessages.gameId, id)).orderBy(asc(t.gameMessages.createdAt));
  const uids = [...new Set(messages.map((m) => m.userId))];
  const users = uids.length ? await db.select().from(t.users).where(inArray(t.users.id, uids)) : [];
  const um = Object.fromEntries(users.map((u) => [u.id, u]));
  return NextResponse.json({ messages: messages.map((m) => ({ id: m.id, body: m.body, kind: m.kind, userId: m.userId, name: um[m.userId]?.name ?? "Player", image: um[m.userId]?.image ?? null, at: +m.createdAt })) });
}
