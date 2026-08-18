import Link from "next/link";
import { CalendarPlus, Ban, ScanLine, IndianRupee, Users, Ticket, Star, TrendingUp } from "lucide-react";
import { requireUser } from "@/lib/session";
import { getOwnerForUser, getOwnerBookings, ownerStats } from "@/lib/owner";
import { Stat, Badge } from "@/components/ui";
import { RevenueChart } from "@/components/revenue-chart";
import { fmtTime, inr } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function OwnerDashboard() {
  const user = await requireUser();
  const owner = await getOwnerForUser(user.id);
  const { venues, bookings } = owner ? await getOwnerBookings(owner.id) : { venues: [], bookings: [] };
  const s = ownerStats(bookings);
  const avgRating = venues.length ? (venues.reduce((a, v) => a + v.rating, 0) / venues.length).toFixed(1) : "—";

  // last 7 days revenue series
  const days = Array.from({ length: 7 }, (_, i) => { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - (6 - i)); return d; });
  const series = days.map((d) => {
    const rev = bookings.filter((b) => +b.createdAt >= +d && +b.createdAt < +d + 86400000 && b.status !== "cancelled").reduce((a, b) => a + b.totalAmount, 0);
    return { label: d.toLocaleDateString("en-IN", { weekday: "short" }), value: rev };
  });

  return (
    <div className="space-y-6">
      {/* quick actions */}
      <div className="flex flex-wrap gap-2">
        <Link href="/owner/walkins" className="btn-brand"><CalendarPlus size={18} /> New booking</Link>
        <Link href="/owner/calendar" className="btn-outline"><Ban size={18} /> Block slot</Link>
        <Link href="/staff" className="btn-outline"><ScanLine size={18} /> Check-in</Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label="Today's revenue" value={inr(s.todayRevenue)} sub={`${s.todayBookings.length} bookings`} icon={<IndianRupee size={16} />} />
        <Stat label="This month" value={inr(s.monthRevenue)} tone="accent" icon={<TrendingUp size={16} />} />
        <Stat label="Upcoming" value={s.upcoming.length} sub="confirmed" tone="warning" icon={<Ticket size={16} />} />
        <Stat label="Customers" value={s.customers} tone="brand" icon={<Users size={16} />} />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 card p-5">
          <div className="flex items-center justify-between mb-4"><h2 className="font-bold">Revenue · last 7 days</h2><span className="text-sm text-muted">Net {inr(s.net)}</span></div>
          <RevenueChart data={series} />
        </div>
        <div className="card p-5">
          <h2 className="font-bold mb-3">Business health</h2>
          <div className="space-y-3 text-sm">
            <Row label="Gross booking value" value={inr(s.gross)} />
            <Row label="Platform commission (12%)" value={"– " + inr(s.commission)} />
            <Row label="Refunds" value={"– " + inr(s.refunds)} />
            <div className="border-t border-border pt-2 flex justify-between font-bold"><span>Net earnings</span><span className="text-success">{inr(s.net)}</span></div>
            <Row label="Total bookings" value={String(s.totalBookings)} />
            <Row label="Avg rating" value={`${avgRating} ★`} />
            <Row label="Active venues" value={String(venues.length)} />
          </div>
        </div>
      </div>

      {/* today's bookings */}
      <div className="card overflow-hidden">
        <div className="px-5 py-3 border-b border-border flex items-center justify-between"><h2 className="font-bold">Today's schedule</h2><Link href="/owner/bookings" className="text-sm text-brand font-semibold">All bookings →</Link></div>
        {s.todayBookings.length === 0 ? <div className="p-8 text-center text-muted text-sm">No bookings scheduled for today.</div> : (
          <div className="divide-y divide-border">
            {s.todayBookings.slice(0, 8).map((b: any) => (
              <div key={b.id} className="flex items-center gap-3 px-5 py-3">
                <div className="text-sm font-bold w-20">{fmtTime(new Date(+b.startsAt))}</div>
                <div className="flex-1"><div className="font-medium text-sm">{b.customer?.name ?? b.walkinName ?? "Guest"}</div><div className="text-xs text-muted">{b.sport?.name} · {b.resource?.name}</div></div>
                <Badge tone={b.status === "confirmed" ? "success" : b.status === "checked_in" ? "accent" : "muted"}>{b.status.replace("_", " ")}</Badge>
                <div className="font-semibold text-sm w-16 text-right">{inr(b.totalAmount)}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between"><span className="text-muted">{label}</span><span className="font-semibold">{value}</span></div>;
}
