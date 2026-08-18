"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Search, XCircle } from "lucide-react";
import { Badge } from "@/components/ui";
import { ownerCancelBooking } from "@/app/actions/owner";
import { fmtDate, fmtTime, inr } from "@/lib/format";
import { BOOKING_STATUS, cn } from "@/lib/utils";

type Row = { id: string; code: string; status: string; start: number; total: number; source: string; customer: string; phone: string; sport: string; resource: string; venue: string };
const FILTERS = ["all", "confirmed", "completed", "cancelled", "payment_pending"];

export function OwnerBookingsTable({ rows }: { rows: Row[] }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("all");
  const [pending, start] = useTransition();

  const filtered = rows.filter((r) =>
    (filter === "all" || r.status === filter) &&
    (r.customer.toLowerCase().includes(q.toLowerCase()) || r.code.toLowerCase().includes(q.toLowerCase()) || r.venue.toLowerCase().includes(q.toLowerCase())));

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="flex items-center gap-2 input max-w-xs"><Search size={16} className="text-muted" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search customer, code, venue" className="bg-transparent outline-none w-full text-sm" /></div>
        <div className="flex gap-1.5 flex-wrap">
          {FILTERS.map((f) => <button key={f} onClick={() => setFilter(f)} className={cn("chip !py-1 capitalize", filter === f && "!bg-brand !text-brand-fg !border-brand")}>{f.replace("_", " ")}</button>)}
        </div>
      </div>
      <div className="card overflow-x-auto">
        <table className="w-full text-sm min-w-[720px]">
          <thead className="text-left text-muted border-b border-border">
            <tr>{["Code", "Customer", "Venue / Court", "When", "Amount", "Status", ""].map((h) => <th key={h} className="px-4 py-2.5 font-medium">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((r) => {
              const st = BOOKING_STATUS[r.status];
              return (
                <tr key={r.id} className="hover:bg-surface-2">
                  <td className="px-4 py-2.5 font-mono text-xs">{r.code}{r.source === "walkin" && <Badge tone="muted" className="ml-1 !text-[9px]">walk-in</Badge>}</td>
                  <td className="px-4 py-2.5"><div className="font-medium">{r.customer}</div><div className="text-xs text-muted">{r.phone}</div></td>
                  <td className="px-4 py-2.5"><div>{r.venue}</div><div className="text-xs text-muted">{r.sport} · {r.resource}</div></td>
                  <td className="px-4 py-2.5 whitespace-nowrap">{fmtDate(new Date(r.start))}<div className="text-xs text-muted">{fmtTime(new Date(r.start))}</div></td>
                  <td className="px-4 py-2.5 font-semibold">{inr(r.total)}</td>
                  <td className="px-4 py-2.5"><Badge tone={st?.tone as any}>{st?.label}</Badge></td>
                  <td className="px-4 py-2.5">{["confirmed", "payment_pending"].includes(r.status) && <button onClick={() => start(async () => { await ownerCancelBooking(r.id); router.refresh(); })} disabled={pending} className="text-danger" title="Cancel"><XCircle size={16} /></button>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && <div className="p-8 text-center text-muted text-sm">No bookings match.</div>}
      </div>
    </div>
  );
}
