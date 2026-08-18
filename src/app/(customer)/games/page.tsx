import Link from "next/link";
import { Plus, Users, Clock, MapPin } from "lucide-react";
import { listGames } from "@/lib/queries";
import { Badge, Avatar, EmptyState, LinkButton } from "@/components/ui";
import { fmtDate, fmtTime, inr } from "@/lib/format";
import { SPORT_EMOJI } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata = { title: "Open Games" };

export default async function GamesPage() {
  const games = await listGames();
  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Open games near you</h1>
          <p className="text-muted text-sm">Join a game or start your own and invite players.</p>
        </div>
        <LinkButton href="/games/create"><Plus size={18} /> Create game</LinkButton>
      </div>

      {games.length === 0 ? (
        <EmptyState icon="⚽" title="No open games yet" hint="Be the first to start one and rally your squad." action={<LinkButton href="/games/create">Create a game</LinkButton>} />
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {games.map((g) => {
            const spotsLeft = g.playersNeeded - g.joined;
            return (
              <Link key={g.id} href={`/games/${g.id}`} className="card p-4 hover:border-brand transition">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{SPORT_EMOJI[g.sport?.slug ?? ""] ?? "🎯"}</span>
                    <div>
                      <div className="font-bold leading-tight">{g.sport?.name}</div>
                      <div className="text-xs text-muted flex items-center gap-1"><MapPin size={11} /> {g.venue?.name}</div>
                    </div>
                  </div>
                  <Badge tone={spotsLeft <= 2 ? "danger" : "success"}>{spotsLeft > 0 ? `${spotsLeft} spots left` : "Full"}</Badge>
                </div>
                <div className="flex items-center gap-3 text-sm mt-3 text-muted">
                  <span className="flex items-center gap-1"><Clock size={13} /> {fmtDate(new Date(+g.startsAt))}, {fmtTime(new Date(+g.startsAt))}</span>
                  <span className="flex items-center gap-1"><Users size={13} /> {g.joined}/{g.playersNeeded}</span>
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                  <div className="flex items-center gap-2">
                    <Avatar name={g.host?.name ?? "Host"} src={g.host?.image} size={26} />
                    <span className="text-xs text-muted">Hosted by {g.host?.name?.split(" ")[0]}</span>
                  </div>
                  <div className="text-right"><div className="font-bold">{inr(g.pricePerPlayer)}</div><div className="text-[10px] text-muted">per player</div></div>
                </div>
                <div className="flex gap-1 mt-2">
                  <Badge tone="muted" className="capitalize">{g.skillLevel}</Badge>
                  <Badge tone="accent" className="capitalize">{g.gameType}</Badge>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
