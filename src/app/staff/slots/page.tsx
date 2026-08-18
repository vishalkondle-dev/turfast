import { requireUser } from "@/lib/session";
import { getStaffContext, getTodayBookings } from "@/lib/staff";
import { Badge, EmptyState } from "@/components/ui";
import { fmtTime } from "@/lib/format";
import { BOOKING_STATUS } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function StaffSlotsPage() {
  const user = await requireUser();
  const ctx = await getStaffContext(user.id);
  const venueIds = ctx?.venues.map((v) => v.id) ?? [];
  const bookings = await getTodayBookings(venueIds);
  // group by resource
  const byRes = new Map<string, typeof bookings>();
  for (const b of bookings) { const k = b.resourceName; if (!byRes.has(k)) byRes.set(k, []); byRes.get(k)!.push(b); }

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">Slot management · today</h1>
      {byRes.size === 0 ? <EmptyState icon="🗓️" title="No slots booked today" /> : (
        <div className="space-y-5">
          {[...byRes.entries()].map(([res, items]) => (
            <div key={res}>
              <h2 className="font-semibold mb-2">{res}</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {items.map((b) => {
                  const st = BOOKING_STATUS[b.status];
                  return (
                    <div key={b.id} className="card p-3 flex items-center justify-between">
                      <div><div className="font-semibold text-sm">{fmtTime(new Date(+b.startsAt))}</div><div className="text-xs text-muted">{b.customerName}</div></div>
                      <Badge tone={st?.tone as any}>{st?.label}</Badge>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
