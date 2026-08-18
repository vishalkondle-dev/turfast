"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, XCircle, UserX, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui";
import { checkInBooking } from "@/app/actions/staff";
import { fmtTime } from "@/lib/format";
import { BOOKING_STATUS } from "@/lib/utils";

type B = { id: string; code: string; status: string; start: number; end: number; customer: string; sport: string; resource: string };

export function CheckinRow({ b: initial }: { b: B }) {
  const router = useRouter();
  const [b, setB] = useState(initial);
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const st = BOOKING_STATUS[b.status];
  const canAct = ["confirmed", "rescheduled"].includes(b.status);

  function act(action: "checkin" | "reject" | "no_show") {
    setErr(null);
    start(async () => {
      try { const r = await checkInBooking(b.id, action); setB({ ...b, status: r.status }); router.refresh(); }
      catch (e) { setErr((e as Error).message); }
    });
  }
  return (
    <div className="card p-3.5">
      <div className="flex items-center gap-3">
        <div className="text-sm font-bold w-16">{fmtTime(new Date(b.start))}</div>
        <div className="flex-1"><div className="font-semibold">{b.customer}</div><div className="text-xs text-muted">{b.sport} · {b.resource} · <span className="font-mono">{b.code}</span></div></div>
        <Badge tone={st?.tone as any}>{st?.label}</Badge>
      </div>
      {canAct && (
        <div className="flex gap-2 mt-3">
          <button onClick={() => act("checkin")} disabled={pending} className="btn-brand !py-1.5 !text-sm flex-1">{pending ? <Loader2 className="animate-spin" size={15} /> : <><CheckCircle2 size={15} /> Check in</>}</button>
          <button onClick={() => act("no_show")} disabled={pending} className="btn-outline !py-1.5 !text-sm text-warning"><UserX size={15} /> No-show</button>
          <button onClick={() => act("reject")} disabled={pending} className="btn-outline !py-1.5 !text-sm text-danger"><XCircle size={15} /></button>
        </div>
      )}
      {err && <div className="text-xs text-danger mt-2">{err}</div>}
    </div>
  );
}
