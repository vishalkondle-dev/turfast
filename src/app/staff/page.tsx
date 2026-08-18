import { requireUser } from "@/lib/session";
import { getStaffContext, getTodayBookings } from "@/lib/staff";
import { Stat, EmptyState } from "@/components/ui";
import { CheckinRow } from "./checkin/checkin-row";
import { fmtDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function StaffTodayPage() {
  const user = await requireUser();
  const ctx = await getStaffContext(user.id);
  const venueIds = ctx?.venues.map((v) => v.id) ?? [];
  const bookings = await getTodayBookings(venueIds);
  const checkedIn = bookings.filter((b) => b.status === "checked_in").length;
  const pending = bookings.filter((b) => ["confirmed", "rescheduled"].includes(b.status)).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">Today · {fmtDate(new Date())}</h1>
      </div>
      <div className="grid grid-cols-3 gap-3 mb-6">
        <Stat label="Total slots" value={bookings.length} />
        <Stat label="Checked in" value={checkedIn} tone="success" />
        <Stat label="Awaiting" value={pending} tone="warning" />
      </div>
      {bookings.length === 0 ? <EmptyState icon="📋" title="No bookings today" hint="Check-ins will appear here as customers arrive." /> : (
        <div className="space-y-2">
          {bookings.map((b) => (
            <CheckinRow key={b.id} b={{ id: b.id, code: b.code, status: b.status, start: +b.startsAt, end: +b.endsAt, customer: b.customerName, sport: b.sportName, resource: b.resourceName }} />
          ))}
        </div>
      )}
    </div>
  );
}
