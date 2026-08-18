import { requireUser } from "@/lib/session";
import { getStaffContext, getTodayBookings } from "@/lib/staff";
import { CheckinLookup } from "./lookup";
import { CheckinRow } from "./checkin-row";

export const dynamic = "force-dynamic";

export default async function CheckinPage() {
  const user = await requireUser();
  const ctx = await getStaffContext(user.id);
  const venueIds = ctx?.venues.map((v) => v.id) ?? [];
  const bookings = await getTodayBookings(venueIds);
  const actionable = bookings.filter((b) => ["confirmed", "rescheduled"].includes(b.status));

  return (
    <div className="max-w-xl">
      <h1 className="text-xl font-bold mb-1">Check-in</h1>
      <p className="text-muted text-sm mb-5">Scan a QR or enter a booking code to verify and check in a player.</p>
      <CheckinLookup />
      <h2 className="font-bold mt-8 mb-3">Awaiting check-in today ({actionable.length})</h2>
      <div className="space-y-2">
        {actionable.map((b) => (
          <CheckinRow key={b.id} b={{ id: b.id, code: b.code, status: b.status, start: +b.startsAt, end: +b.endsAt, customer: b.customerName, sport: b.sportName, resource: b.resourceName }} />
        ))}
        {actionable.length === 0 && <div className="text-sm text-muted">Everyone's checked in 🎉</div>}
      </div>
    </div>
  );
}
