"use client";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle2 } from "lucide-react";
import { createWalkin } from "@/app/actions/owner";
import { inr } from "@/lib/format";
import { cn } from "@/lib/utils";

type V = { id: string; name: string };
type R = { id: string; venueId: string; name: string; basePrice: number; allowedDurations: number[] };

export function WalkinForm({ venues, resources }: { venues: V[]; resources: R[] }) {
  const router = useRouter();
  const [venueId, setVenueId] = useState(venues[0]?.id ?? "");
  const vr = useMemo(() => resources.filter((r) => r.venueId === venueId), [resources, venueId]);
  const [resourceId, setResourceId] = useState(vr[0]?.id ?? "");
  const resource = resources.find((r) => r.id === resourceId) ?? vr[0];
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState("18:00");
  const [duration, setDuration] = useState(60);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [method, setMethod] = useState("cash");
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  const amount = resource ? Math.round((resource.basePrice * duration) / 60) : 0;

  function submit() {
    if (!resource) return;
    setErr(null);
    const [y, m, d] = date.split("-").map(Number);
    const [h, min] = time.split(":").map(Number);
    const startMs = new Date(y, m - 1, d, h, min).getTime();
    start(async () => {
      try { const r = await createWalkin({ venueId, resourceId, startMs, durationMins: duration, name, phone, amount, method }); setDone(r.code); setName(""); setPhone(""); router.refresh(); }
      catch (e) { setErr((e as Error).message); }
    });
  }

  return (
    <div className="card p-4 space-y-3">
      {done && <div className="bg-success/10 text-success rounded-lg px-3 py-2 text-sm flex items-center gap-2"><CheckCircle2 size={16} /> Walk-in {done} booked & marked paid.</div>}
      <div className="grid grid-cols-2 gap-3">
        <div><label className="label">Venue</label><select value={venueId} onChange={(e) => { setVenueId(e.target.value); const r = resources.find((x) => x.venueId === e.target.value); setResourceId(r?.id ?? ""); }} className="input mt-1">{venues.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}</select></div>
        <div><label className="label">Court</label><select value={resourceId} onChange={(e) => setResourceId(e.target.value)} className="input mt-1">{vr.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}</select></div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div><label className="label">Date</label><input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input mt-1" /></div>
        <div><label className="label">Time</label><input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="input mt-1" /></div>
        <div><label className="label">Duration</label><select value={duration} onChange={(e) => setDuration(Number(e.target.value))} className="input mt-1">{(resource?.allowedDurations ?? [60]).map((d) => <option key={d} value={d}>{d}m</option>)}</select></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className="label">Customer name</label><input value={name} onChange={(e) => setName(e.target.value)} className="input mt-1" /></div>
        <div><label className="label">Phone</label><input value={phone} onChange={(e) => setPhone(e.target.value)} className="input mt-1" /></div>
      </div>
      <div><label className="label">Payment method</label>
        <div className="flex gap-1.5 mt-1">{["cash", "upi", "card", "other"].map((m) => <button key={m} onClick={() => setMethod(m)} className={cn("chip !py-1 capitalize", method === m && "!bg-brand !text-brand-fg !border-brand")}>{m}</button>)}</div>
      </div>
      {err && <div className="text-sm text-danger">{err}</div>}
      <div className="flex items-center justify-between pt-2 border-t border-border">
        <div className="text-lg font-extrabold">{inr(amount)}</div>
        <button onClick={submit} disabled={pending || !name} className="btn-brand">{pending ? <Loader2 className="animate-spin" size={18} /> : "Create walk-in"}</button>
      </div>
    </div>
  );
}
