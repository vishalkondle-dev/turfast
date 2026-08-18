import { requireUser } from "@/lib/session";
import { getOwnerForUser, getOwnerBookings } from "@/lib/owner";
import { RevenueChart } from "@/components/revenue-chart";
import { Stat } from "@/components/ui";
import { inr } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const user = await requireUser();
  const owner = await getOwnerForUser(user.id);
  const { bookings } = owner ? await getOwnerBookings(owner.id) : { bookings: [] };
  const paid = (bookings as any[]).filter((b) => b.status !== "cancelled");

  // sport popularity
  const bySport = new Map<string, number>();
  const byHour = new Array(24).fill(0);
  const byDow = new Array(7).fill(0);
  for (const b of paid) {
    bySport.set(b.sport?.name ?? "Other", (bySport.get(b.sport?.name ?? "Other") ?? 0) + 1);
    byHour[new Date(+b.startsAt).getHours()]++;
    byDow[new Date(+b.startsAt).getDay()]++;
  }
  const sportData = [...bySport.entries()].sort((a, b) => b[1] - a[1]).map(([label, value]) => ({ label, value }));
  const peakData = Array.from({ length: 17 }, (_, i) => ({ label: `${6 + i}`, value: byHour[6 + i] }));
  const dowNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const dowData = byDow.map((v, i) => ({ label: dowNames[i], value: v }));
  const topSport = sportData[0]?.label ?? "—";
  const peakHour = peakData.reduce((m, d) => (d.value > m.value ? d : m), peakData[0] ?? { label: "—", value: 0 });

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">Analytics</h1>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label="Total bookings" value={paid.length} />
        <Stat label="Most popular sport" value={topSport} tone="accent" />
        <Stat label="Peak hour" value={`${peakHour.label}:00`} tone="warning" />
        <Stat label="Avg booking value" value={inr(paid.length ? Math.round(paid.reduce((a, b) => a + b.totalAmount, 0) / paid.length) : 0)} tone="brand" />
      </div>
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="card p-5"><h2 className="font-bold mb-4">Bookings by hour</h2><RevenueChart data={peakData} /></div>
        <div className="card p-5"><h2 className="font-bold mb-4">Bookings by day of week</h2><RevenueChart data={dowData} /></div>
      </div>
      <div className="card p-5">
        <h2 className="font-bold mb-4">Sport popularity</h2>
        <div className="space-y-2">
          {sportData.map((s) => {
            const max = sportData[0].value || 1;
            return (
              <div key={s.label} className="flex items-center gap-3">
                <div className="w-28 text-sm">{s.label}</div>
                <div className="flex-1 h-3 rounded-full bg-surface-2 overflow-hidden"><div className="h-full bg-gradient-to-r from-brand to-accent" style={{ width: `${(s.value / max) * 100}%` }} /></div>
                <div className="w-8 text-sm text-right font-semibold">{s.value}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
