import { inArray } from "drizzle-orm";
import { requireUser } from "@/lib/session";
import { getStaffContext } from "@/lib/staff";
import { getDb } from "@/db";
import * as t from "@/db/schema";
import { WalkinForm } from "@/app/owner/walkins/walkin-form";
import { EmptyState } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function StaffWalkinsPage() {
  const user = await requireUser();
  const ctx = await getStaffContext(user.id);
  const venues = ctx?.venues ?? [];
  const venueIds = venues.map((v) => v.id);
  const resources = venueIds.length ? await getDb().select().from(t.resources).where(inArray(t.resources.venueId, venueIds)) : [];
  if (!venues.length) return <EmptyState icon="🏟️" title="No venue assigned" hint="Ask the owner to assign you to a venue." />;
  return (
    <div className="max-w-lg">
      <h1 className="text-xl font-bold mb-1">Walk-in booking</h1>
      <p className="text-muted text-sm mb-5">Book a slot for a customer paying at the counter.</p>
      <WalkinForm venues={venues.map((v) => ({ id: v.id, name: v.name }))} resources={resources.map((r) => ({ id: r.id, venueId: r.venueId, name: r.name, basePrice: r.basePrice, allowedDurations: r.allowedDurations as number[] }))} />
    </div>
  );
}
