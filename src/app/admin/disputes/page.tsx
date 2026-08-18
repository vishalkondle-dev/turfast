import { desc, inArray } from "drizzle-orm";
import { getDb } from "@/db";
import * as t from "@/db/schema";
import { Badge, EmptyState } from "@/components/ui";
import { DisputeCard } from "./dispute-card";
import { fmtDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminDisputesPage() {
  const db = getDb();
  const disputes = await db.select().from(t.disputes).orderBy(desc(t.disputes.createdAt));
  const userIds = [...new Set(disputes.map((d) => d.userId))];
  const users = userIds.length ? await db.select().from(t.users).where(inArray(t.users.id, userIds)) : [];
  const um = Object.fromEntries(users.map((u) => [u.id, u.name]));
  return (
    <div className="max-w-3xl">
      <h1 className="text-xl font-bold mb-4">Disputes</h1>
      {disputes.length === 0 ? <EmptyState icon="⚖️" title="No disputes" hint="Customer disputes will appear here." /> : (
        <div className="space-y-3">
          {disputes.map((d) => (
            <DisputeCard key={d.id} d={{ id: d.id, code: d.code, reason: d.reason, detail: d.detail, status: d.status, resolution: d.resolution, user: um[d.userId] ?? "User", created: +d.createdAt }} />
          ))}
        </div>
      )}
    </div>
  );
}
