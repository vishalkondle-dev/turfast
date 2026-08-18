import { desc, inArray } from "drizzle-orm";
import { getDb } from "@/db";
import * as t from "@/db/schema";
import { Badge } from "@/components/ui";
import { fmtDate, fmtTime, inr } from "@/lib/format";
import { BOOKING_STATUS } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminBookingsPage() {
  const db = getDb();
  const bookings = await db.select().from(t.bookings).orderBy(desc(t.bookings.createdAt)).limit(200);
  const venueIds = [...new Set(bookings.map((b) => b.venueId))];
  const venues = venueIds.length ? await db.select().from(t.venues).where(inArray(t.venues.id, venueIds)) : [];
  const vm = Object.fromEntries(venues.map((v) => [v.id, v.name]));
  return (
    <div>
      <h1 className="text-xl font-bold mb-4">Bookings <span className="text-muted font-normal text-base">(latest 200)</span></h1>
      <div className="card overflow-x-auto">
        <table className="w-full text-sm min-w-[760px]">
          <thead className="text-left text-muted border-b border-border"><tr>{["Code", "Venue", "When", "Amount", "Source", "Status"].map((h) => <th key={h} className="px-4 py-2.5 font-medium">{h}</th>)}</tr></thead>
          <tbody className="divide-y divide-border">
            {bookings.map((b) => {
              const st = BOOKING_STATUS[b.status];
              return (
                <tr key={b.id} className="hover:bg-surface-2">
                  <td className="px-4 py-2.5 font-mono text-xs">{b.code}</td>
                  <td className="px-4 py-2.5">{vm[b.venueId]}</td>
                  <td className="px-4 py-2.5 whitespace-nowrap">{fmtDate(new Date(+b.startsAt))} · {fmtTime(new Date(+b.startsAt))}</td>
                  <td className="px-4 py-2.5 font-semibold">{inr(b.totalAmount)}</td>
                  <td className="px-4 py-2.5"><Badge tone="muted">{b.source}</Badge></td>
                  <td className="px-4 py-2.5"><Badge tone={st?.tone as any}>{st?.label}</Badge></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
