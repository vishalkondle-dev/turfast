import { desc, inArray } from "drizzle-orm";
import { getDb } from "@/db";
import * as t from "@/db/schema";
import { Avatar, Badge } from "@/components/ui";
import { ActionBtn } from "../action-btn";
import { fmtDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminReviewsPage() {
  const db = getDb();
  const reviews = await db.select().from(t.reviews).orderBy(desc(t.reviews.createdAt)).limit(100);
  const userIds = [...new Set(reviews.map((r) => r.userId))];
  const venueIds = [...new Set(reviews.map((r) => r.venueId))];
  const [users, venues] = await Promise.all([
    userIds.length ? db.select().from(t.users).where(inArray(t.users.id, userIds)) : [],
    venueIds.length ? db.select().from(t.venues).where(inArray(t.venues.id, venueIds)) : [],
  ]);
  const um = Object.fromEntries(users.map((u) => [u.id, u]));
  const vm = Object.fromEntries(venues.map((v) => [v.id, v.name]));
  return (
    <div className="max-w-3xl">
      <h1 className="text-xl font-bold mb-4">Review moderation</h1>
      <div className="space-y-3">
        {reviews.map((r) => (
          <div key={r.id} className="card p-4">
            <div className="flex items-center gap-2.5">
              <Avatar name={um[r.userId]?.name ?? "User"} src={um[r.userId]?.image} size={34} />
              <div className="flex-1"><div className="font-semibold text-sm">{um[r.userId]?.name} · <span className="text-muted font-normal">{vm[r.venueId]}</span></div><div className="text-xs text-muted">{fmtDate(new Date(+r.createdAt))}</div></div>
              <Badge tone="warning">{r.overall}★</Badge>
              <Badge tone={r.status === "published" ? "success" : "muted"}>{r.status}</Badge>
            </div>
            {r.body && <p className="text-sm text-muted mt-2">{r.body}</p>}
            <div className="mt-2">{r.status === "published" ? <ActionBtn kind="review" id={r.id} arg="hidden" label="Hide" tone="danger" small /> : <ActionBtn kind="review" id={r.id} arg="published" label="Publish" tone="success" small />}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
