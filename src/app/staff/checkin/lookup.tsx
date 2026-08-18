"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Search, CheckCircle2, XCircle, UserX, Loader2, ScanLine } from "lucide-react";
import { Badge } from "@/components/ui";
import { lookupBooking, checkInBooking } from "@/app/actions/staff";
import { fmtDateLong, fmtRange } from "@/lib/format";
import { BOOKING_STATUS } from "@/lib/utils";

export function CheckinLookup() {
  const router = useRouter();
  const [term, setTerm] = useState("");
  const [result, setResult] = useState<any>(null);
  const [notFound, setNotFound] = useState(false);
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  function find() {
    setNotFound(false); setMsg(null); setResult(null);
    start(async () => { const r = await lookupBooking(term); if (!r) setNotFound(true); else setResult(r); });
  }
  function act(action: "checkin" | "reject" | "no_show") {
    start(async () => {
      try { const r = await checkInBooking(result.id, action); setResult({ ...result, status: r.status }); setMsg(action === "checkin" ? "✅ Checked in successfully" : action === "no_show" ? "Marked as no-show" : "Booking rejected"); router.refresh(); }
      catch (e) { setMsg((e as Error).message); }
    });
  }
  const st = result ? BOOKING_STATUS[result.status] : null;

  return (
    <div className="card p-4">
      <div className="flex gap-2">
        <div className="flex items-center gap-2 input"><ScanLine size={18} className="text-muted" /><input value={term} onChange={(e) => setTerm(e.target.value)} onKeyDown={(e) => e.key === "Enter" && find()} placeholder="TRF-123456 or scan QR" className="bg-transparent outline-none w-full font-mono" /></div>
        <button onClick={find} disabled={pending || !term} className="btn-brand !px-4">{pending ? <Loader2 className="animate-spin" size={18} /> : <Search size={18} />}</button>
      </div>
      {notFound && <div className="text-sm text-danger mt-3">No booking found for “{term}”.</div>}
      {result && (
        <div className="mt-4 border-t border-border pt-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="font-bold text-lg">{result.customer}</div>
              <div className="text-sm text-muted">{result.venue} · {result.sport} · {result.resource}</div>
              <div className="text-sm mt-1">{fmtDateLong(new Date(result.start))}</div>
              <div className="text-sm font-semibold">{fmtRange(new Date(result.start), new Date(result.end))}</div>
              <div className="text-xs font-mono text-muted mt-1">{result.code}</div>
            </div>
            <Badge tone={st?.tone as any}>{st?.label}</Badge>
          </div>
          {["confirmed", "rescheduled"].includes(result.status) ? (
            <div className="flex gap-2 mt-4">
              <button onClick={() => act("checkin")} disabled={pending} className="btn-brand flex-1"><CheckCircle2 size={16} /> Check in</button>
              <button onClick={() => act("no_show")} disabled={pending} className="btn-outline text-warning"><UserX size={16} /> No-show</button>
              <button onClick={() => act("reject")} disabled={pending} className="btn-outline text-danger"><XCircle size={16} /></button>
            </div>
          ) : (
            <div className="mt-3 text-sm bg-surface-2 rounded-lg px-3 py-2">This booking is <b>{st?.label}</b> — no action needed.</div>
          )}
          {msg && <div className="mt-3 text-sm bg-success/10 text-success rounded-lg px-3 py-2">{msg}</div>}
        </div>
      )}
    </div>
  );
}
