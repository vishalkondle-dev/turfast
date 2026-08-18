"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Check, X, Ban, Star, Search } from "lucide-react";
import { Badge, Rating } from "@/components/ui";
import { setVenueStatus, toggleVenueFlag } from "@/app/actions/admin";
import { cn } from "@/lib/utils";

type V = { id: string; name: string; slug: string; status: string; owner: string; rating: number; reviewCount: number; featured: boolean; sponsored: boolean; trending: boolean };
const TONE: Record<string, string> = { approved: "success", submitted: "warning", under_review: "warning", rejected: "danger", suspended: "danger", draft: "muted" };

export function AdminVenuesTable({ venues }: { venues: V[] }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("all");
  const [pending, start] = useTransition();

  const filtered = venues.filter((v) => (filter === "all" || v.status === filter) && v.name.toLowerCase().includes(q.toLowerCase()));
  const act = (fn: () => Promise<any>) => start(async () => { await fn(); router.refresh(); });

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-4">
        <div className="flex items-center gap-2 input max-w-xs"><Search size={16} className="text-muted" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search venues" className="bg-transparent outline-none w-full text-sm" /></div>
        {["all", "approved", "submitted", "suspended"].map((f) => <button key={f} onClick={() => setFilter(f)} className={cn("chip !py-1 capitalize", filter === f && "!bg-brand !text-brand-fg !border-brand")}>{f}</button>)}
      </div>
      <div className="card overflow-x-auto">
        <table className="w-full text-sm min-w-[820px]">
          <thead className="text-left text-muted border-b border-border"><tr>{["Venue", "Owner", "Rating", "Status", "Flags", "Actions"].map((h) => <th key={h} className="px-4 py-2.5 font-medium">{h}</th>)}</tr></thead>
          <tbody className="divide-y divide-border">
            {filtered.map((v) => (
              <tr key={v.id} className="hover:bg-surface-2">
                <td className="px-4 py-2.5"><Link href={`/venue/${v.slug}`} className="font-medium hover:text-brand">{v.name}</Link></td>
                <td className="px-4 py-2.5 text-muted">{v.owner}</td>
                <td className="px-4 py-2.5"><Rating value={v.rating} count={v.reviewCount} /></td>
                <td className="px-4 py-2.5"><Badge tone={TONE[v.status] as any}>{v.status}</Badge></td>
                <td className="px-4 py-2.5">
                  <button onClick={() => act(() => toggleVenueFlag(v.id, "featured", !v.featured))} className={cn("chip !py-0.5 !px-2 !text-[11px]", v.featured && "!bg-brand/10 !text-brand !border-brand/30")}><Star size={11} /> Feature</button>
                </td>
                <td className="px-4 py-2.5">
                  <div className="flex gap-1">
                    {v.status !== "approved" && <button onClick={() => act(() => setVenueStatus(v.id, "approved"))} disabled={pending} className="btn-ghost !p-1.5 text-success" title="Approve"><Check size={15} /></button>}
                    {v.status === "submitted" && <button onClick={() => act(() => setVenueStatus(v.id, "rejected"))} disabled={pending} className="btn-ghost !p-1.5 text-danger" title="Reject"><X size={15} /></button>}
                    {v.status === "approved" && <button onClick={() => act(() => setVenueStatus(v.id, "suspended"))} disabled={pending} className="btn-ghost !p-1.5 text-warning" title="Suspend"><Ban size={15} /></button>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
