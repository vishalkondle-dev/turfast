"use client";
import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, UserPlus, LogOut } from "lucide-react";
import { joinGame, leaveGame } from "@/app/actions/games";
import { inr } from "@/lib/format";

export function GameActions({ gameId, joined, isHost, full, loggedIn, pricePerPlayer }: { gameId: string; joined: boolean; isHost: boolean; full: boolean; loggedIn: boolean; pricePerPlayer: number }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  function join() {
    if (!loggedIn) return router.push("/login");
    setErr(null);
    start(async () => { try { await joinGame(gameId); router.refresh(); } catch (e) { setErr((e as Error).message); } });
  }
  function leave() { start(async () => { await leaveGame(gameId); router.refresh(); }); }

  return (
    <div className="mt-5">
      {joined ? (
        <div className="flex items-center gap-3">
          <div className="flex-1 bg-success/10 text-success rounded-xl px-4 py-3 text-sm font-semibold">✓ You're in this game{isHost ? " (host)" : ""}</div>
          {!isHost && <button onClick={leave} disabled={pending} className="btn-outline text-danger"><LogOut size={16} /> Leave</button>}
        </div>
      ) : full ? (
        <button disabled className="btn-outline w-full">Game is full</button>
      ) : (
        <button onClick={join} disabled={pending} className="btn-brand w-full">
          {pending ? <Loader2 className="animate-spin" size={18} /> : <><UserPlus size={18} /> Join game · pay {inr(pricePerPlayer)}</>}
        </button>
      )}
      {err && <div className="text-sm text-danger mt-2">{err}</div>}
    </div>
  );
}
