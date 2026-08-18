import { desc, inArray } from "drizzle-orm";
import { getDb } from "@/db";
import * as t from "@/db/schema";
import { Badge, EmptyState } from "@/components/ui";
import { ActionBtn } from "../action-btn";
import { fmtDate, inr } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminPayoutsPage() {
  const db = getDb();
  const payouts = await db.select().from(t.payouts).orderBy(desc(t.payouts.createdAt));
  const ownerIds = [...new Set(payouts.map((p) => p.ownerId))];
  const owners = ownerIds.length ? await db.select().from(t.owners).where(inArray(t.owners.id, ownerIds)) : [];
  const om = Object.fromEntries(owners.map((o) => [o.id, o.businessName]));
  return (
    <div>
      <h1 className="text-xl font-bold mb-4">Payouts</h1>
      {payouts.length === 0 ? <EmptyState icon="💰" title="No payouts" /> : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm min-w-[680px]">
            <thead className="text-left text-muted border-b border-border"><tr>{["Reference", "Owner", "Amount", "Date", "Status", ""].map((h) => <th key={h} className="px-4 py-2.5 font-medium">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-border">
              {payouts.map((p) => (
                <tr key={p.id} className="hover:bg-surface-2">
                  <td className="px-4 py-2.5 font-mono text-xs">{p.reference}</td>
                  <td className="px-4 py-2.5">{om[p.ownerId]}</td>
                  <td className="px-4 py-2.5 font-semibold">{inr(p.amount)}</td>
                  <td className="px-4 py-2.5 text-muted">{p.periodEnd ? fmtDate(new Date(+p.periodEnd)) : "—"}</td>
                  <td className="px-4 py-2.5"><Badge tone={p.status === "paid" ? "success" : p.status === "pending" ? "warning" : "muted"}>{p.status}</Badge></td>
                  <td className="px-4 py-2.5">{p.status === "pending" && <ActionBtn kind="payout" id={p.id} label="Mark paid" tone="success" small />}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
