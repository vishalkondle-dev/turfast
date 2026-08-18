import { eq, inArray, desc } from "drizzle-orm";
import { requireUser } from "@/lib/session";
import { getOwnerForUser, getOwnerVenues } from "@/lib/owner";
import { getDb } from "@/db";
import * as t from "@/db/schema";
import { ReviewReply } from "./review-reply";
import { EmptyState, Avatar, Badge } from "@/components/ui";
import { fmtDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function OwnerReviewsPage() {
  const user = await requireUser();
  const owner = await getOwnerForUser(user.id);
  const venues = owner ? await getOwnerVenues(owner.id) : [];
  const venueIds = venues.map((v) => v.id);
  const db = getDb();
  const reviews = venueIds.length ? await db.select().from(t.reviews).where(inArray(t.reviews.venueId, venueIds)).orderBy(desc(t.reviews.createdAt)) : [];
  const userIds = [...new Set(reviews.map((r) => r.userId))];
  const users = userIds.length ? await db.select().from(t.users).where(inArray(t.users.id, userIds)) : [];
  const um = Object.fromEntries(users.map((u) => [u.id, u]));
  const vm = Object.fromEntries(venues.map((v) => [v.id, v.name]));

  return (
    <div className="max-w-3xl">
      <h1 className="text-xl font-bold mb-1">Reviews</h1>
      <p className="text-muted text-sm mb-5">Respond to customer feedback to build trust.</p>
      {reviews.length === 0 ? <EmptyState icon="⭐" title="No reviews yet" hint="Reviews from completed bookings will appear here." /> : (
        <div className="space-y-3">
          {reviews.map((r) => (
            <div key={r.id} className="card p-4">
              <div className="flex items-center gap-2.5">
                <Avatar name={um[r.userId]?.name ?? "Player"} src={um[r.userId]?.image} size={36} />
                <div className="flex-1"><div className="font-semibold text-sm">{um[r.userId]?.name}</div><div className="text-xs text-muted">{vm[r.venueId]} · {fmtDate(new Date(+r.createdAt))}</div></div>
                <Badge tone="warning">{r.overall}★</Badge>
              </div>
              {r.body && <p className="text-sm text-muted mt-2">{r.body}</p>}
              <ReviewReply reviewId={r.id} existing={r.ownerReply} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
