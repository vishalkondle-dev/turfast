import { eq, inArray } from "drizzle-orm";
import { requireUser } from "@/lib/session";
import { getOwnerForUser } from "@/lib/owner";
import { getDb } from "@/db";
import * as t from "@/db/schema";
import { Avatar, Badge, EmptyState } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function StaffPage() {
  const user = await requireUser();
  const owner = await getOwnerForUser(user.id);
  const db = getDb();
  const staff = owner ? await db.select().from(t.staff).where(eq(t.staff.ownerId, owner.id)) : [];
  const userIds = staff.map((s) => s.userId);
  const users = userIds.length ? await db.select().from(t.users).where(inArray(t.users.id, userIds)) : [];
  const um = Object.fromEntries(users.map((u) => [u.id, u]));

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-4">
        <div><h1 className="text-xl font-bold">Staff</h1><p className="text-muted text-sm">Team members who can manage bookings and check-ins.</p></div>
        <button className="btn-brand">Invite staff</button>
      </div>
      {staff.length === 0 ? <EmptyState icon="🧑‍💼" title="No staff yet" hint="Invite team members to help run your venues." /> : (
        <div className="space-y-3">
          {staff.map((s) => (
            <div key={s.id} className="card p-4 flex items-center gap-3">
              <Avatar name={um[s.userId]?.name ?? "Staff"} src={um[s.userId]?.image} size={40} />
              <div className="flex-1"><div className="font-semibold">{um[s.userId]?.name}</div><div className="text-xs text-muted">{um[s.userId]?.email}</div></div>
              <div className="flex flex-wrap gap-1 max-w-[240px] justify-end">
                {(s.permissions as string[]).map((p) => <Badge key={p} tone="muted" className="!text-[10px] capitalize">{p.replace("_", " ")}</Badge>)}
              </div>
              <Badge tone={s.status === "active" ? "success" : "muted"}>{s.status}</Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
