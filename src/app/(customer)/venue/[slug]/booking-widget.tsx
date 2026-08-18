"use client";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, CalendarDays } from "lucide-react";
import { reserveSlot } from "@/app/actions/booking";
import { fmtTime, inr } from "@/lib/format";
import { cn } from "@/lib/utils";

type Sport = { id: string; slug: string; name: string };
type Resource = { id: string; venueId: string; sportId: string; name: string; basePrice: number; allowedDurations: number[] };
type Slot = { start: number; end: number; state: string };

export function BookingWidget({ venueName, sports, resources, loggedIn }: { venueName: string; sports: Sport[]; resources: Resource[]; loggedIn: boolean }) {
  const router = useRouter();
  const [sportId, setSportId] = useState(sports[0]?.id ?? "");
  const sportResources = useMemo(() => resources.filter((r) => r.sportId === sportId), [resources, sportId]);
  const [resourceId, setResourceId] = useState(sportResources[0]?.id ?? "");
  const resource = resources.find((r) => r.id === resourceId) ?? sportResources[0];
  const durations = resource?.allowedDurations ?? [60, 90];
  const [duration, setDuration] = useState(durations[0] ?? 60);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Slot | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();

  // keep resource/duration valid when sport changes
  useEffect(() => {
    const first = resources.find((r) => r.sportId === sportId);
    if (first && !resources.find((r) => r.id === resourceId && r.sportId === sportId)) {
      setResourceId(first.id);
      setDuration(first.allowedDurations[0] ?? 60);
    }
  }, [sportId, resources, resourceId]);

  useEffect(() => {
    if (!resourceId) return;
    setLoading(true); setSelected(null);
    fetch(`/api/availability?resourceId=${resourceId}&date=${date}&duration=${duration}`)
      .then((r) => r.json())
      .then((d) => setSlots(d.slots || []))
      .finally(() => setLoading(false));
  }, [resourceId, date, duration]);

  function book() {
    if (!selected) return;
    if (!loggedIn) { router.push("/login"); return; }
    setErr(null);
    start(async () => {
      try {
        const id = await reserveSlot(resourceId, selected.start, duration);
        router.push(`/checkout/${id}`);
      } catch (e) { setErr((e as Error).message); }
    });
  }

  const available = slots.filter((s) => s.state === "available");

  return (
    <div className="card p-4">
      <div className="font-bold text-lg mb-3">Book a slot</div>

      <label className="label">Sport</label>
      <div className="flex flex-wrap gap-1.5 mt-1 mb-3">
        {sports.map((s) => (
          <button key={s.id} onClick={() => setSportId(s.id)} className={cn("chip !py-1", sportId === s.id && "!bg-brand !text-brand-fg !border-brand")}>{s.name}</button>
        ))}
      </div>

      <label className="label">Court / Turf</label>
      <select value={resourceId} onChange={(e) => setResourceId(e.target.value)} className="input mt-1 mb-3">
        {sportResources.map((r) => <option key={r.id} value={r.id}>{r.name} · {inr(r.basePrice)}/hr</option>)}
      </select>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <label className="label">Date</label>
          <div className="flex items-center gap-2 input mt-1"><CalendarDays size={15} className="text-muted" /><input type="date" value={date} min={new Date().toISOString().slice(0, 10)} onChange={(e) => setDate(e.target.value)} className="bg-transparent outline-none w-full text-sm" /></div>
        </div>
        <div>
          <label className="label">Duration</label>
          <select value={duration} onChange={(e) => setDuration(Number(e.target.value))} className="input mt-1">
            {durations.map((d) => <option key={d} value={d}>{d} min</option>)}
          </select>
        </div>
      </div>

      <label className="label">Available slots</label>
      {loading ? (
        <div className="grid grid-cols-3 gap-2 mt-2">{Array.from({ length: 9 }).map((_, i) => <div key={i} className="skeleton h-10" />)}</div>
      ) : available.length === 0 ? (
        <div className="text-sm text-muted py-6 text-center">No open slots for this day. Try another date or duration.</div>
      ) : (
        <div className="grid grid-cols-3 gap-2 mt-2 max-h-56 overflow-auto no-scrollbar">
          {slots.map((s) => {
            const disabled = s.state !== "available";
            const sel = selected?.start === s.start;
            return (
              <button key={s.start} disabled={disabled} onClick={() => setSelected(s)}
                className={cn("rounded-lg border py-2 text-xs font-semibold transition",
                  disabled ? "opacity-35 line-through cursor-not-allowed border-border" : sel ? "bg-brand text-brand-fg border-brand" : "border-border hover:border-brand")}>
                {fmtTime(new Date(s.start))}
              </button>
            );
          })}
        </div>
      )}

      <div className="mt-3 flex items-center gap-3 text-[11px] text-muted">
        <span className="flex items-center gap-1"><i className="h-2.5 w-2.5 rounded-sm border border-border inline-block" /> Available</span>
        <span className="flex items-center gap-1"><i className="h-2.5 w-2.5 rounded-sm bg-brand inline-block" /> Selected</span>
        <span className="flex items-center gap-1"><i className="h-2.5 w-2.5 rounded-sm bg-surface-2 inline-block" /> Booked/Blocked</span>
      </div>

      {selected && (
        <div className="mt-3 p-3 rounded-xl bg-surface-2 flex items-center justify-between">
          <div className="text-sm">
            <div className="font-semibold">{fmtTime(new Date(selected.start))} – {fmtTime(new Date(selected.end))}</div>
            <div className="text-muted text-xs">{resource?.name} · {duration} min</div>
          </div>
          <div className="text-right"><div className="text-xs text-muted">from</div><div className="font-bold">{inr(Math.round((resource?.basePrice ?? 0) * duration / 60))}</div></div>
        </div>
      )}

      {err && <div className="mt-3 text-sm bg-danger/10 text-danger border border-danger/20 rounded-lg px-3 py-2">{err}</div>}

      <button onClick={book} disabled={!selected || pending} className="btn-brand w-full mt-3">
        {pending ? <Loader2 className="animate-spin" size={18} /> : selected ? "Book Now →" : "Select a slot"}
      </button>
      {!loggedIn && <p className="text-xs text-muted text-center mt-2">You'll be asked to sign in to confirm.</p>}
    </div>
  );
}
