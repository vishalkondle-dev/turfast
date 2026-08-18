import { requireUser } from "@/lib/session";
import { getOwnerForUser, getOwnerBookings } from "@/lib/owner";
import { OwnerBookingsTable } from "./table";
import { EmptyState } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function OwnerBookingsPage() {
  const user = await requireUser();
  const owner = await getOwnerForUser(user.id);
  const { bookings } = owner ? await getOwnerBookings(owner.id) : { bookings: [] };
  const rows = bookings.map((b: any) => ({
    id: b.id, code: b.code, status: b.status, start: +b.startsAt, total: b.totalAmount, source: b.source,
    customer: b.customer?.name ?? b.walkinName ?? "Guest", phone: b.customer?.phone ?? b.walkinPhone ?? "",
    sport: b.sport?.name ?? "", resource: b.resource?.name ?? "", venue: b.venue?.name ?? "",
  }));
  return (
    <div>
      {rows.length === 0 ? <EmptyState icon="🎫" title="No bookings yet" hint="Bookings across your venues will appear here." /> : <OwnerBookingsTable rows={rows} />}
    </div>
  );
}
