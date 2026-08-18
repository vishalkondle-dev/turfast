import { requireUser } from "@/lib/session";
import { getOwnerForUser, getOwnerBookings } from "@/lib/owner";
import { Avatar, EmptyState } from "@/components/ui";
import { inr, fmtDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function OwnerCustomersPage() {
  const user = await requireUser();
  const owner = await getOwnerForUser(user.id);
  const { bookings } = owner ? await getOwnerBookings(owner.id) : { bookings: [] };
  const map = new Map<string, { name: string; image?: string | null; phone?: string; count: number; spend: number; last: number }>();
  for (const b of bookings as any[]) {
    if (b.status === "cancelled") continue;
    const key = b.customer?.id ?? b.walkinPhone ?? b.id;
    const name = b.customer?.name ?? b.walkinName ?? "Guest";
    const cur = map.get(key) ?? { name, image: b.customer?.image, phone: b.customer?.phone ?? b.walkinPhone, count: 0, spend: 0, last: 0 };
    cur.count++; cur.spend += b.totalAmount; cur.last = Math.max(cur.last, +b.startsAt);
    map.set(key, cur);
  }
  const customers = [...map.values()].sort((a, b) => b.spend - a.spend);

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">Customers <span className="text-muted font-normal text-base">({customers.length})</span></h1>
      {customers.length === 0 ? <EmptyState icon="👥" title="No customers yet" /> : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm min-w-[560px]">
            <thead className="text-left text-muted border-b border-border"><tr>{["Customer", "Bookings", "Total spend", "Last visit"].map((h) => <th key={h} className="px-4 py-2.5 font-medium">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-border">
              {customers.map((c, i) => (
                <tr key={i} className="hover:bg-surface-2">
                  <td className="px-4 py-2.5"><div className="flex items-center gap-2.5"><Avatar name={c.name} src={c.image} size={32} /><div><div className="font-medium">{c.name}</div><div className="text-xs text-muted">{c.phone}</div></div></div></td>
                  <td className="px-4 py-2.5">{c.count}</td>
                  <td className="px-4 py-2.5 font-semibold">{inr(c.spend)}</td>
                  <td className="px-4 py-2.5 text-muted">{fmtDate(new Date(c.last))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
