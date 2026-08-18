import { desc } from "drizzle-orm";
import { getDb } from "@/db";
import * as t from "@/db/schema";
import { Badge, Stat } from "@/components/ui";
import { fmtDate, inr } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminPaymentsPage() {
  const payments = await getDb().select().from(t.payments).orderBy(desc(t.payments.createdAt)).limit(200);
  const total = payments.filter((p) => p.status === "successful").reduce((a, p) => a + p.amount, 0);
  return (
    <div>
      <h1 className="text-xl font-bold mb-4">Payments</h1>
      <div className="grid grid-cols-3 gap-3 mb-4">
        <Stat label="Successful volume" value={inr(total)} tone="success" />
        <Stat label="Transactions" value={payments.length} />
        <Stat label="Refunded" value={payments.filter((p) => p.status === "refunded").length} tone="warning" />
      </div>
      <div className="card overflow-x-auto">
        <table className="w-full text-sm min-w-[720px]">
          <thead className="text-left text-muted border-b border-border"><tr>{["Reference", "Amount", "Method", "Gateway", "Kind", "Status", "Date"].map((h) => <th key={h} className="px-4 py-2.5 font-medium">{h}</th>)}</tr></thead>
          <tbody className="divide-y divide-border">
            {payments.map((p) => (
              <tr key={p.id} className="hover:bg-surface-2">
                <td className="px-4 py-2.5 font-mono text-xs">{p.gatewayRef ?? p.id.slice(0, 10)}</td>
                <td className="px-4 py-2.5 font-semibold">{inr(p.amount)}</td>
                <td className="px-4 py-2.5 uppercase text-xs">{p.method}</td>
                <td className="px-4 py-2.5 text-muted">{p.gateway}</td>
                <td className="px-4 py-2.5 text-muted capitalize">{p.kind.replace("_", " ")}</td>
                <td className="px-4 py-2.5"><Badge tone={p.status === "successful" ? "success" : p.status === "refunded" ? "warning" : "muted"}>{p.status}</Badge></td>
                <td className="px-4 py-2.5 text-muted">{fmtDate(new Date(+p.createdAt))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
