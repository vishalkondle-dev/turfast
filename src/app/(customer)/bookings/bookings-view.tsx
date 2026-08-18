"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { MapPin, RefreshCw, XCircle, Download, RotateCcw, Star, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui";
import { cancelBooking, rescheduleBooking } from "@/app/actions/booking";
import { submitReview } from "@/app/actions/misc";
import { fmtDate, fmtRange, inr } from "@/lib/format";
import { BOOKING_STATUS, cn } from "@/lib/utils";

type B = {
  id: string; code: string; status: string; start: number; end: number; durationMins: number; total: number;
  venueName: string; venueSlug: string; venueId: string; sportName: string; resourceName: string; resourceId: string;
  cover: string; lat?: number | null; lng?: number | null; phone?: string | null;
};
const TABS = ["Upcoming", "Completed", "Cancelled"] as const;

export function BookingsView({ bookings }: { bookings: B[] }) {
  const [tab, setTab] = useState<(typeof TABS)[number]>("Upcoming");
  const now = Date.now();
  const filtered = bookings.filter((b) => {
    if (tab === "Upcoming") return ["confirmed", "payment_pending", "rescheduled", "checked_in"].includes(b.status) && b.end > now;
    if (tab === "Completed") return b.status === "completed" || (b.status === "checked_in" && b.end < now);
    return ["cancelled", "refunded", "refund_pending", "no_show"].includes(b.status);
  });

  return (
    <div>
      <div className="flex gap-1 p-1 bg-surface-2 rounded-xl w-fit mb-4">
        {TABS.map((tName) => (
          <button key={tName} onClick={() => setTab(tName)} className={cn("px-4 py-1.5 rounded-lg text-sm font-semibold transition", tab === tName ? "bg-surface shadow-card" : "text-muted")}>{tName}</button>
        ))}
      </div>
      {filtered.length === 0 ? (
        <div className="text-center py-14 text-muted">No {tab.toLowerCase()} bookings.</div>
      ) : (
        <div className="space-y-3">{filtered.map((b) => <BookingCard key={b.id} b={b} tab={tab} />)}</div>
      )}
    </div>
  );
}

function BookingCard({ b, tab }: { b: B; tab: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [modal, setModal] = useState<null | "cancel" | "reschedule" | "review">(null);
  const st = BOOKING_STATUS[b.status];

  return (
    <div className="card overflow-hidden">
      <div className="flex gap-3 p-3">
        <Link href={`/venue/${b.venueSlug}`} className="relative h-20 w-24 rounded-xl overflow-hidden shrink-0"><Image src={b.cover} alt={b.venueName} fill sizes="96px" className="object-cover" /></Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="font-bold leading-tight">{b.venueName}</div>
              <div className="text-sm text-muted">{b.sportName} · {b.resourceName}</div>
            </div>
            <Badge tone={st?.tone as any}>{st?.label}</Badge>
          </div>
          <div className="text-sm mt-1.5">{fmtDate(new Date(b.start))} · {fmtRange(new Date(b.start), new Date(b.end))}</div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs text-muted">{b.code}</span>
            <span className="font-bold">{inr(b.total)}</span>
          </div>
        </div>
      </div>
      <div className="flex flex-wrap gap-1 border-t border-border px-2 py-1.5 text-xs">
        <a href={`https://maps.google.com/?q=${b.lat},${b.lng}`} target="_blank" rel="noreferrer" className="btn-ghost !py-1.5 !text-xs"><MapPin size={14} /> Directions</a>
        <Link href={`/booking/${b.code}/receipt`} className="btn-ghost !py-1.5 !text-xs"><Download size={14} /> Receipt</Link>
        {tab === "Upcoming" && (
          <>
            <button onClick={() => setModal("reschedule")} className="btn-ghost !py-1.5 !text-xs"><RefreshCw size={14} /> Reschedule</button>
            <button onClick={() => setModal("cancel")} className="btn-ghost !py-1.5 !text-xs text-danger"><XCircle size={14} /> Cancel</button>
            <Link href={`/booking/${b.code}`} className="btn-ghost !py-1.5 !text-xs ml-auto">View QR →</Link>
          </>
        )}
        {tab === "Completed" && (
          <>
            <button onClick={() => setModal("review")} className="btn-ghost !py-1.5 !text-xs text-brand"><Star size={14} /> Write review</button>
            <Link href={`/venue/${b.venueSlug}`} className="btn-ghost !py-1.5 !text-xs ml-auto"><RotateCcw size={14} /> Book again</Link>
          </>
        )}
      </div>

      {modal === "cancel" && <CancelModal b={b} onClose={() => setModal(null)} onDone={() => { setModal(null); router.refresh(); }} />}
      {modal === "reschedule" && <RescheduleModal b={b} onClose={() => setModal(null)} onDone={() => { setModal(null); router.refresh(); }} />}
      {modal === "review" && <ReviewModal b={b} onClose={() => setModal(null)} onDone={() => { setModal(null); router.refresh(); }} />}
    </div>
  );
}

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={onClose}>
      <div className="card p-5 w-full max-w-sm animate-fade-in" onClick={(e) => e.stopPropagation()}>
        <div className="font-bold text-lg mb-3">{title}</div>
        {children}
      </div>
    </div>
  );
}

function CancelModal({ b, onClose, onDone }: { b: B; onClose: () => void; onDone: () => void }) {
  const [pending, start] = useTransition();
  const [result, setResult] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  function confirm() {
    start(async () => {
      try { const r = await cancelBooking(b.id); setResult(r.refunded > 0 ? `${inr(r.refunded)} (${r.pct}%) credited to your wallet.` : "No refund per venue policy."); setTimeout(onDone, 1400); }
      catch (e) { setErr((e as Error).message); }
    });
  }
  return (
    <Modal title="Cancel booking" onClose={onClose}>
      {result ? <div className="text-sm bg-success/10 text-success rounded-lg p-3">Cancelled. {result}</div> : (
        <>
          <p className="text-sm text-muted">Refund follows the venue's cancellation policy based on how far away your slot is. Continue?</p>
          {err && <div className="text-sm text-danger mt-2">{err}</div>}
          <div className="flex gap-2 mt-4">
            <button onClick={onClose} className="btn-outline flex-1">Keep it</button>
            <button onClick={confirm} disabled={pending} className="btn-brand flex-1 !bg-danger">{pending ? <Loader2 className="animate-spin" size={16} /> : "Cancel booking"}</button>
          </div>
        </>
      )}
    </Modal>
  );
}

function RescheduleModal({ b, onClose, onDone }: { b: B; onClose: () => void; onDone: () => void }) {
  const [date, setDate] = useState(new Date(b.start).toISOString().slice(0, 10));
  const [slots, setSlots] = useState<{ start: number; end: number; state: string }[]>([]);
  const [sel, setSel] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  async function load(d: string) {
    setLoading(true);
    const r = await fetch(`/api/availability?resourceId=${b.resourceId}&date=${d}&duration=${b.durationMins}`);
    const data = await r.json(); setSlots(data.slots || []); setLoading(false);
  }
  function confirm() {
    if (sel == null) return;
    start(async () => {
      try { await rescheduleBooking(b.id, sel); onDone(); }
      catch (e) { setErr((e as Error).message); }
    });
  }
  return (
    <Modal title="Reschedule booking" onClose={onClose}>
      <input type="date" value={date} min={new Date().toISOString().slice(0, 10)} onChange={(e) => { setDate(e.target.value); load(e.target.value); }} className="input mb-3" />
      {!slots.length && <button onClick={() => load(date)} className="btn-outline w-full mb-3">Load slots for this date</button>}
      {loading ? <div className="grid grid-cols-3 gap-2">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton h-9" />)}</div> : (
        <div className="grid grid-cols-3 gap-2 max-h-48 overflow-auto no-scrollbar">
          {slots.map((s) => (
            <button key={s.start} disabled={s.state !== "available"} onClick={() => setSel(s.start)}
              className={cn("rounded-lg border py-2 text-xs font-semibold", s.state !== "available" ? "opacity-30 line-through" : sel === s.start ? "bg-brand text-brand-fg border-brand" : "border-border")}>
              {new Date(s.start).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })}
            </button>
          ))}
        </div>
      )}
      {err && <div className="text-sm text-danger mt-2">{err}</div>}
      <button onClick={confirm} disabled={sel == null || pending} className="btn-brand w-full mt-4">{pending ? <Loader2 className="animate-spin" size={16} /> : "Confirm new slot"}</button>
    </Modal>
  );
}

function ReviewModal({ b, onClose, onDone }: { b: B; onClose: () => void; onDone: () => void }) {
  const [scores, setScores] = useState({ overall: 5, quality: 5, cleanliness: 5, staffRating: 5, facilities: 5, valueForMoney: 5 });
  const [body, setBody] = useState("");
  const [pending, start] = useTransition();
  function set(k: keyof typeof scores, v: number) { setScores((s) => ({ ...s, [k]: v })); }
  function confirm() {
    start(async () => { await submitReview({ venueId: b.venueId, bookingId: b.id, ...scores, body }); onDone(); });
  }
  const cats: [keyof typeof scores, string][] = [["overall", "Overall"], ["quality", "Court quality"], ["cleanliness", "Cleanliness"], ["staffRating", "Staff"], ["facilities", "Facilities"], ["valueForMoney", "Value"]];
  return (
    <Modal title={`Review ${b.venueName}`} onClose={onClose}>
      <div className="space-y-2">
        {cats.map(([k, label]) => (
          <div key={k} className="flex items-center justify-between">
            <span className="text-sm text-muted">{label}</span>
            <div className="flex gap-0.5">{[1, 2, 3, 4, 5].map((n) => <button key={n} onClick={() => set(k, n)} className={n <= scores[k] ? "text-warning" : "text-border"}>★</button>)}</div>
          </div>
        ))}
      </div>
      <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Share your experience…" className="input mt-3 h-20 resize-none" />
      <button onClick={confirm} disabled={pending} className="btn-brand w-full mt-3">{pending ? <Loader2 className="animate-spin" size={16} /> : "Submit review"}</button>
    </Modal>
  );
}
