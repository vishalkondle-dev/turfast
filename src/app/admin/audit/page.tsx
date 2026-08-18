import { desc, inArray } from "drizzle-orm";
import { getDb } from "@/db";
import * as t from "@/db/schema";
import { Badge } from "@/components/ui";
import { relativeTime } from "@/lib/format";

export const dynamic = "force-dynamic";

const ICON: Record<string, string> = { "booking.create": "🎫", "booking.cancel": "❌", "booking.walkin": "🚶", "price.update": "💲", "venue.approve": "✅", "venue.reject": "🚫", "venue.suspend": "⛔", "slot.block": "🔒", "review.reply": "💬", "payout.paid": "💰", "user.suspended": "⚠️" };

export default async function AdminAuditPage() {
  const db = getDb();
  const logs = await db.select().from(t.auditLogs).orderBy(desc(t.auditLogs.createdAt)).limit(200);
  const actorIds = [...new Set(logs.map((l) => l.actorId).filter(Boolean) as string[])];
  const users = actorIds.length ? await db.select().from(t.users).where(inArray(t.users.id, actorIds)) : [];
  const um = Object.fromEntries(users.map((u) => [u.id, u.name]));

  function describe(l: typeof logs[number]) {
    if (l.action === "price.update") return `changed a court price from ${l.prevValue} to ${l.newValue}`;
    if (l.action.startsWith("venue.")) return `set venue status to ${l.newValue || l.action.split(".")[1]}`;
    if (l.action === "booking.create") return `created booking ${l.newValue}`;
    if (l.action === "booking.cancel") return "cancelled a booking";
    if (l.action === "slot.block") return `blocked a slot (${l.meta})`;
    return l.action.replace(".", " ");
  }

  return (
    <div className="max-w-3xl">
      <h1 className="text-xl font-bold mb-4">Audit log</h1>
      <div className="card divide-y divide-border overflow-hidden">
        {logs.map((l) => (
          <div key={l.id} className="flex items-start gap-3 px-4 py-3">
            <span className="text-xl">{ICON[l.action] ?? "📝"}</span>
            <div className="flex-1">
              <div className="text-sm"><span className="font-semibold">{um[l.actorId ?? ""] ?? "System"}</span> <span className="text-muted">{describe(l)}</span></div>
              <div className="text-xs text-muted mt-0.5">{l.entity} · {relativeTime(new Date(+l.createdAt))}</div>
            </div>
            <Badge tone="muted" className="capitalize">{l.actorRole ?? "system"}</Badge>
          </div>
        ))}
      </div>
    </div>
  );
}
