"use client";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { createGame } from "@/app/actions/games";
import { pricePerPlayer } from "@/lib/core/split";
import { inr } from "@/lib/format";
import { cn } from "@/lib/utils";

type V = { id: string; name: string };
type R = { id: string; venueId: string; sportId: string; name: string; basePrice: number; allowedDurations: number[] };
type S = { id: string; name: string };

export function CreateGameForm({ venues, resources, sports }: { venues: V[]; resources: R[]; sports: S[] }) {
  const router = useRouter();
  const [venueId, setVenueId] = useState(venues[0]?.id ?? "");
  const venueResources = useMemo(() => resources.filter((r) => r.venueId === venueId), [resources, venueId]);
  const [resourceId, setResourceId] = useState(venueResources[0]?.id ?? "");
  const resource = resources.find((r) => r.id === resourceId) ?? venueResources[0];
  const [date, setDate] = useState(new Date(Date.now() + 86400000).toISOString().slice(0, 10));
  const [time, setTime] = useState("20:00");
  const [duration, setDuration] = useState(90);
  const [players, setPlayers] = useState(10);
  const [skill, setSkill] = useState("any");
  const [gameType, setGameType] = useState("friendly");
  const [visibility, setVisibility] = useState("public");
  const [notes, setNotes] = useState("");
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  const slotPrice = resource ? Math.round((resource.basePrice * duration) / 60) : 0;
  const perPlayer = pricePerPlayer(slotPrice, players);
  const sportName = sports.find((s) => s.id === resource?.sportId)?.name ?? "Game";

  function submit() {
    if (!resource) return;
    setErr(null);
    const [y, m, d] = date.split("-").map(Number);
    const [h, min] = time.split(":").map(Number);
    const startMs = new Date(y, m - 1, d, h, min).getTime();
    start(async () => {
      try {
        const { id } = await createGame({
          venueId, resourceId, sportId: resource.sportId, startMs, durationMins: duration,
          playersNeeded: players, pricePerPlayer: perPlayer, skillLevel: skill, gameType, visibility, notes,
          title: `${sportName} at ${venues.find((v) => v.id === venueId)?.name}`,
        });
        router.push(`/games/${id}`);
      } catch (e) { setErr((e as Error).message); }
    });
  }

  const Seg = ({ value, cur, set, opts }: { value: string; cur: string; set: (v: string) => void; opts: [string, string][] }) => (
    <div className="flex gap-1.5 flex-wrap mt-1">
      {opts.map(([v, label]) => <button key={v} onClick={() => set(v)} className={cn("chip !py-1 capitalize", cur === v && "!bg-brand !text-brand-fg !border-brand")}>{label}</button>)}
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="card p-4 space-y-3">
        <div><label className="label">Venue</label><select value={venueId} onChange={(e) => { setVenueId(e.target.value); const r = resources.find((x) => x.venueId === e.target.value); setResourceId(r?.id ?? ""); }} className="input mt-1">{venues.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}</select></div>
        <div><label className="label">Court / Turf</label><select value={resourceId} onChange={(e) => setResourceId(e.target.value)} className="input mt-1">{venueResources.map((r) => <option key={r.id} value={r.id}>{r.name} · {inr(r.basePrice)}/hr</option>)}</select></div>
        <div className="grid grid-cols-3 gap-2">
          <div><label className="label">Date</label><input type="date" value={date} min={new Date().toISOString().slice(0, 10)} onChange={(e) => setDate(e.target.value)} className="input mt-1" /></div>
          <div><label className="label">Time</label><input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="input mt-1" /></div>
          <div><label className="label">Duration</label><select value={duration} onChange={(e) => setDuration(Number(e.target.value))} className="input mt-1">{(resource?.allowedDurations ?? [60, 90]).map((d) => <option key={d} value={d}>{d}m</option>)}</select></div>
        </div>
      </div>

      <div className="card p-4 space-y-3">
        <div><label className="label">Players needed: {players}</label><input type="range" min={2} max={22} value={players} onChange={(e) => setPlayers(Number(e.target.value))} className="w-full accent-brand" /></div>
        <div><label className="label">Skill level</label><Seg value="" cur={skill} set={setSkill} opts={[["any", "Any"], ["beginner", "Beginner"], ["intermediate", "Intermediate"], ["advanced", "Advanced"]]} /></div>
        <div><label className="label">Game type</label><Seg value="" cur={gameType} set={setGameType} opts={[["friendly", "Friendly"], ["competitive", "Competitive"], ["practice", "Practice"], ["tournament", "Tournament"]]} /></div>
        <div><label className="label">Visibility</label><Seg value="" cur={visibility} set={setVisibility} opts={[["public", "Public"], ["friends", "Friends"], ["private", "Private"]]} /></div>
        <div><label className="label">Notes</label><textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Bring your own shoes, bibs provided…" className="input mt-1 h-16 resize-none" /></div>
      </div>

      <div className="card p-4 flex items-center justify-between">
        <div><div className="text-sm text-muted">Slot {inr(slotPrice)} · split {players} ways</div><div className="text-xl font-extrabold">{inr(perPlayer)}<span className="text-sm text-muted font-normal">/player</span></div></div>
        <button onClick={submit} disabled={pending} className="btn-brand">{pending ? <Loader2 className="animate-spin" size={18} /> : "Create & host"}</button>
      </div>
      {err && <div className="text-sm text-danger">{err}</div>}
    </div>
  );
}
