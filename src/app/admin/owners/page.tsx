import { inArray } from "drizzle-orm";
import { getDb } from "@/db";
import * as t from "@/db/schema";
import { Badge } from "@/components/ui";
import { ActionBtn } from "../action-btn";

export const dynamic = "force-dynamic";

export default async function AdminOwnersPage() {
  const db = getDb();
  const owners = await db.select().from(t.owners);
  const venues = await db.select().from(t.venues);
  const countByOwner = venues.reduce((m, v) => { m[v.ownerId] = (m[v.ownerId] ?? 0) + 1; return m; }, {} as Record<string, number>);
  return (
    <div>
      <h1 className="text-xl font-bold mb-4">Venue owners ({owners.length})</h1>
      <div className="card overflow-x-auto">
        <table className="w-full text-sm min-w-[680px]">
          <thead className="text-left text-muted border-b border-border"><tr>{["Business", "Contact", "Venues", "Status", ""].map((h) => <th key={h} className="px-4 py-2.5 font-medium">{h}</th>)}</tr></thead>
          <tbody className="divide-y divide-border">
            {owners.map((o) => (
              <tr key={o.id} className="hover:bg-surface-2">
                <td className="px-4 py-2.5 font-medium">{o.businessName}</td>
                <td className="px-4 py-2.5 text-muted">{o.contactName}<div className="text-xs">{o.contactPhone}</div></td>
                <td className="px-4 py-2.5">{countByOwner[o.id] ?? 0}</td>
                <td className="px-4 py-2.5"><Badge tone={o.status === "approved" ? "success" : o.status === "pending" ? "warning" : "danger"}>{o.status}</Badge></td>
                <td className="px-4 py-2.5">{o.status !== "approved" ? <ActionBtn kind="owner" id={o.id} arg="approved" label="Approve" tone="success" small /> : <ActionBtn kind="owner" id={o.id} arg="suspended" label="Suspend" tone="danger" small />}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
