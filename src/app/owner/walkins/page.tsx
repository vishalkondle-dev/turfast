import { eq, inArray } from "drizzle-orm";
import { requireUser } from "@/lib/session";
import { getOwnerForUser, getOwnerVenues } from "@/lib/owner";
import { getDb } from "@/db";
import * as t from "@/db/schema";
import { WalkinForm } from "./walkin-form";

export const dynamic = "force-dynamic";

export default async function WalkinsPage() {
  const user = await requireUser();
  const owner = await getOwnerForUser(user.id);
  const venues = owner ? await getOwnerVenues(owner.id) : [];
  const venueIds = venues.map((v) => v.id);
  const resources = venueIds.length ? await getDb().select().from(t.resources).where(inArray(t.resources.venueId, venueIds)) : [];
  return (
    <div className="max-w-lg">
      <h1 className="text-xl font-bold mb-1">Walk-in booking</h1>
      <p className="text-muted text-sm mb-5">Create a counter booking for a customer paying in person.</p>
      <WalkinForm
        venues={venues.map((v) => ({ id: v.id, name: v.name }))}
        resources={resources.map((r) => ({ id: r.id, venueId: r.venueId, name: r.name, basePrice: r.basePrice, allowedDurations: r.allowedDurations as number[] }))}
      />
    </div>
  );
}
