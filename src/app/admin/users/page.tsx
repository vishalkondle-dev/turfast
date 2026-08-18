import { desc } from "drizzle-orm";
import { getDb } from "@/db";
import * as t from "@/db/schema";
import { Avatar, Badge } from "@/components/ui";
import { ActionBtn } from "../action-btn";
import { fmtDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const users = await getDb().select().from(t.users).orderBy(desc(t.users.createdAt));
  return (
    <div>
      <h1 className="text-xl font-bold mb-4">Users <span className="text-muted font-normal text-base">({users.length})</span></h1>
      <div className="card overflow-x-auto">
        <table className="w-full text-sm min-w-[720px]">
          <thead className="text-left text-muted border-b border-border"><tr>{["User", "Role", "Points", "Joined", "Status", ""].map((h) => <th key={h} className="px-4 py-2.5 font-medium">{h}</th>)}</tr></thead>
          <tbody className="divide-y divide-border">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-surface-2">
                <td className="px-4 py-2.5"><div className="flex items-center gap-2.5"><Avatar name={u.name} src={u.image} size={32} /><div><div className="font-medium">{u.name}</div><div className="text-xs text-muted">{u.email}</div></div></div></td>
                <td className="px-4 py-2.5"><Badge tone={u.role === "admin" ? "danger" : u.role === "owner" ? "accent" : u.role === "staff" ? "warning" : "muted"} className="capitalize">{u.role}</Badge></td>
                <td className="px-4 py-2.5">{u.loyaltyPoints}</td>
                <td className="px-4 py-2.5 text-muted">{fmtDate(new Date(+u.createdAt))}</td>
                <td className="px-4 py-2.5"><Badge tone={u.status === "active" ? "success" : "danger"}>{u.status}</Badge></td>
                <td className="px-4 py-2.5">{u.status === "active" ? <ActionBtn kind="user" id={u.id} arg="suspended" label="Suspend" tone="danger" small /> : <ActionBtn kind="user" id={u.id} arg="active" label="Activate" tone="success" small />}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
