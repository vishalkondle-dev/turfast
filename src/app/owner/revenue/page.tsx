import { eq, desc } from "drizzle-orm";
import { requireUser } from "@/lib/session";
import { getOwnerForUser, getOwnerBookings, ownerStats } from "@/lib/owner";
import { getDb } from "@/db";
import * as t from "@/db/schema";
import { Stat, Badge } from "@/components/ui";
import { PayoutButton } from "./payout-button";
import { fmtDate, inr } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function RevenuePage() {
  const user = await requireUser();
  const owner = await getOwnerForUser(user.id);
  const { bookings } = owner ? await getOwnerBookings(owner.id) : { bookings: [] };
  const s = ownerStats(bookings);
  const payouts = owner ? await getDb().select().from(t.payouts).where(eq(t.payouts.ownerId, owner.id)).orderBy(desc(t.payouts.createdAt)) : [];
  const paidOut = payouts.filter((p) => p.status === "paid").reduce((a, p) => a + p.amount, 0);
  const available = Math.max(0, s.net - paidOut);

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">Revenue & Payouts</h1>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <Stat label="Gross revenue" value={inr(s.gross)} />
        <Stat label="Commission (12%)" value={inr(s.commission)} tone="warning" />
        <Stat label="Net earnings" value={inr(s.net)} tone="success" />
        <Stat label="Available to withdraw" value={inr(available)} tone="brand" />
      </div>

      <div className="card p-5 mb-6 flex flex-wrap items-center justify-between gap-3">
        <div><div className="text-sm text-muted">Available balance</div><div className="text-2xl font-extrabold">{inr(available)}</div></div>
        <PayoutButton available={available} />
      </div>

      <h2 className="font-bold mb-3">Payout history</h2>
      <div className="card overflow-x-auto">
        <table className="w-full text-sm min-w-[560px]">
          <thead className="text-left text-muted border-b border-border"><tr>{["Reference", "Amount", "Period", "Status"].map((h) => <th key={h} className="px-4 py-2.5 font-medium">{h}</th>)}</tr></thead>
          <tbody className="divide-y divide-border">
            {payouts.map((p) => (
              <tr key={p.id}>
                <td className="px-4 py-2.5 font-mono text-xs">{p.reference}</td>
                <td className="px-4 py-2.5 font-semibold">{inr(p.amount)}</td>
                <td className="px-4 py-2.5 text-muted">{p.periodEnd ? fmtDate(new Date(+p.periodEnd)) : "—"}</td>
                <td className="px-4 py-2.5"><Badge tone={p.status === "paid" ? "success" : p.status === "pending" ? "warning" : "muted"}>{p.status}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
        {payouts.length === 0 && <div className="p-8 text-center text-muted text-sm">No payouts yet.</div>}
      </div>
    </div>
  );
}
