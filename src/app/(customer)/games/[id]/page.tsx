import { notFound } from "next/navigation";
import Link from "next/link";
import { eq, inArray, asc } from "drizzle-orm";
import { Users, Clock, MapPin, Trophy } from "lucide-react";
import { getDb } from "@/db";
import * as t from "@/db/schema";
import { getCurrentUser } from "@/lib/session";
import { Badge, Avatar } from "@/components/ui";
import { fmtDateLong, fmtRange, inr } from "@/lib/format";
import { SPORT_EMOJI } from "@/lib/utils";
import { GameActions } from "./game-actions";
import { GameChat } from "./game-chat";

export const dynamic = "force-dynamic";

export default async function GamePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();
  const game = (await db.select().from(t.games).where(eq(t.games.id, id)).limit(1))[0];
  if (!game) notFound();
  const [venue, sport, host, parts, messages] = await Promise.all([
    db.select().from(t.venues).where(eq(t.venues.id, game.venueId)).limit(1),
    db.select().from(t.sports).where(eq(t.sports.id, game.sportId)).limit(1),
    db.select().from(t.users).where(eq(t.users.id, game.hostId)).limit(1),
    db.select().from(t.gameParticipants).where(eq(t.gameParticipants.gameId, id)),
    db.select().from(t.gameMessages).where(eq(t.gameMessages.gameId, id)).orderBy(asc(t.gameMessages.createdAt)),
  ]);
  const userIds = [...new Set([...parts.map((p) => p.userId), ...messages.map((m) => m.userId)])];
  const users = userIds.length ? await db.select().from(t.users).where(inArray(t.users.id, userIds)) : [];
  const um = Object.fromEntries(users.map((u) => [u.id, u]));
  const me = await getCurrentUser();
  const joined = me ? parts.some((p) => p.userId === me.id) : false;
  const isHost = me?.id === game.hostId;
  const spotsLeft = game.playersNeeded - parts.length;

  return (
    <div className="max-w-3xl mx-auto">
      <Link href="/games" className="text-sm text-brand font-semibold">← All games</Link>
      <div className="card overflow-hidden mt-3">
        <div className="bg-gradient-to-br from-brand to-accent text-white p-5">
          <div className="flex items-center gap-3">
            <span className="text-4xl">{SPORT_EMOJI[sport[0]?.slug ?? ""] ?? "🎯"}</span>
            <div>
              <h1 className="text-2xl font-extrabold">{game.title}</h1>
              <div className="text-white/85 text-sm flex items-center gap-1"><MapPin size={13} /> {venue[0]?.name}</div>
            </div>
          </div>
          <div className="flex flex-wrap gap-4 mt-4 text-sm">
            <span className="flex items-center gap-1.5"><Clock size={15} /> {fmtDateLong(new Date(+game.startsAt))}, {fmtRange(new Date(+game.startsAt), new Date(+game.endsAt))}</span>
            <span className="flex items-center gap-1.5"><Users size={15} /> {parts.length}/{game.playersNeeded} players</span>
            <span className="flex items-center gap-1.5"><Trophy size={15} /> {inr(game.pricePerPlayer)}/player</span>
          </div>
        </div>

        <div className="p-5">
          <div className="flex flex-wrap gap-2">
            <Badge tone="muted" className="capitalize">{game.skillLevel} level</Badge>
            <Badge tone="accent" className="capitalize">{game.gameType}</Badge>
            <Badge tone={spotsLeft > 0 ? "success" : "danger"}>{spotsLeft > 0 ? `${spotsLeft} spots left` : "Full"}</Badge>
            <Badge tone="brand" className="capitalize">{game.visibility}</Badge>
          </div>
          {game.notes && <p className="text-muted text-sm mt-3">{game.notes}</p>}

          <div className="mt-4">
            <div className="label mb-2">Players ({parts.length})</div>
            <div className="flex flex-wrap gap-3">
              {parts.map((p) => (
                <div key={p.id} className="flex flex-col items-center gap-1 w-16">
                  <Avatar name={um[p.userId]?.name ?? "Player"} src={um[p.userId]?.image} size={40} />
                  <span className="text-[11px] text-center line-clamp-1">{um[p.userId]?.name?.split(" ")[0]}</span>
                  {p.isHost && <Badge tone="brand" className="!text-[9px] !px-1.5 !py-0">Host</Badge>}
                </div>
              ))}
              {Array.from({ length: Math.max(0, spotsLeft) }).map((_, i) => (
                <div key={i} className="flex flex-col items-center gap-1 w-16">
                  <div className="h-10 w-10 rounded-full border-2 border-dashed border-border grid place-items-center text-muted text-lg">+</div>
                  <span className="text-[11px] text-muted">Open</span>
                </div>
              ))}
            </div>
          </div>

          <GameActions gameId={game.id} joined={joined} isHost={isHost} full={spotsLeft <= 0} loggedIn={!!me} pricePerPlayer={game.pricePerPlayer} />
        </div>
      </div>

      <div className="card mt-4 overflow-hidden">
        <div className="px-4 py-3 border-b border-border font-bold">Game chat</div>
        <GameChat gameId={game.id} initial={messages.map((m) => ({ id: m.id, body: m.body, kind: m.kind, userId: m.userId, name: um[m.userId]?.name ?? "Player", image: um[m.userId]?.image ?? null, at: +m.createdAt }))} meId={me?.id ?? null} loggedIn={!!me} />
      </div>
    </div>
  );
}
