import { desc, inArray } from "drizzle-orm";
import { getDb } from "@/db";
import * as t from "@/db/schema";
import { Badge, EmptyState } from "@/components/ui";
import { ActionBtn } from "../action-btn";
import { fmtDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminSupportPage() {
  const db = getDb();
  const tickets = await db.select().from(t.supportTickets).orderBy(desc(t.supportTickets.createdAt));
  const userIds = [...new Set(tickets.map((tk) => tk.userId))];
  const users = userIds.length ? await db.select().from(t.users).where(inArray(t.users.id, userIds)) : [];
  const um = Object.fromEntries(users.map((u) => [u.id, u.name]));
  return (
    <div className="max-w-3xl">
      <h1 className="text-xl font-bold mb-4">Support tickets</h1>
      {tickets.length === 0 ? <EmptyState icon="🎫" title="No tickets" /> : (
        <div className="space-y-3">
          {tickets.map((tk) => (
            <div key={tk.id} className="card p-4">
              <div className="flex items-center justify-between">
                <div><span className="font-semibold">{tk.subject}</span> <span className="text-xs text-muted">· {tk.code} · {um[tk.userId]} · {fmtDate(new Date(+tk.createdAt))}</span></div>
                <Badge tone={tk.status === "open" ? "warning" : tk.status === "resolved" ? "success" : "muted"} className="capitalize">{tk.status.replace("_", " ")}</Badge>
              </div>
              <div className="text-xs mt-1"><Badge tone="muted" className="capitalize">{tk.category}</Badge></div>
              <p className="text-sm text-muted mt-2">{tk.body}</p>
              <div className="flex gap-1.5 mt-3">
                {tk.status !== "in_progress" && <ActionBtn kind="ticket" id={tk.id} arg="in_progress" label="In progress" tone="warning" small />}
                {tk.status !== "resolved" && <ActionBtn kind="ticket" id={tk.id} arg="resolved" label="Resolve" tone="success" small />}
                {tk.status !== "closed" && <ActionBtn kind="ticket" id={tk.id} arg="closed" label="Close" tone="brand" small />}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
