import { requireUser } from "@/lib/session";
import { getUserBookings } from "@/lib/queries";
import { EmptyState, LinkButton } from "@/components/ui";
import { BookingsView } from "./bookings-view";

export const dynamic = "force-dynamic";
export const metadata = { title: "My Bookings" };

export default async function BookingsPage() {
  const user = await requireUser();
  const bookings = await getUserBookings(user.id);
  const serial = bookings.map((b) => ({
    id: b.id, code: b.code, status: b.status, start: +b.startsAt, end: +b.endsAt, durationMins: b.durationMins,
    total: b.totalAmount, venueName: b.venue?.name ?? "", venueSlug: b.venue?.slug ?? "", venueId: b.venueId,
    sportName: b.sport?.name ?? "", resourceName: b.resource?.name ?? "", resourceId: b.resourceId,
    cover: b.venue?.coverImage ?? "", lat: b.venue?.lat, lng: b.venue?.lng, phone: b.venue?.phone,
  }));

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-extrabold tracking-tight mb-1">My Bookings</h1>
      <p className="text-muted text-sm mb-5">Manage your upcoming games and revisit past ones.</p>
      {serial.length === 0 ? (
        <EmptyState icon="🗓️" title="No bookings yet" hint="Find a turf near you and lock in your next game." action={<LinkButton href="/explore">Explore venues</LinkButton>} />
      ) : (
        <BookingsView bookings={serial} />
      )}
    </div>
  );
}
