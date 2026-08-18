import Link from "next/link";
import { Users, Building2, Ticket, IndianRupee, AlertTriangle, Clock } from "lucide-react";
import { getDb } from "@/db";
import * as t from "@/db/schema";
import { eq } from "drizzle-orm";
import { Stat, Badge } from "@/components/ui";
import { RevenueChart } from "@/components/revenue-chart";
import { inr } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const db = getDb();
  const [users, venues, bookings, payments, disputes] = await Promise.all([
    db.select().from(t.users), db.select().from(t.venues), db.select().from(t.bookings),
    db.select().from(t.payments), db.select().from(t.disputes),
  ]);
  const gbv = bookings.filter((b) => b.status !== "cancelled").reduce((a, b) => a + b.totalAmount, 0);
  const platformRev = Math.round(gbv * 0.12);
  const refundVal = payments.filter((p) => p.status === "refunded").reduce((a, p) => a + p.amount, 0);
  const pendingApprovals = venues.filter((v) => v.status === "submitted" || v.status === "under_review").length;
  const openDisputes = disputes.filter((d) => d.status !== "resolved" && d.status !== "closed").length;
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
  const todayBookings = bookings.filter((b) => +b.createdAt >= +todayStart).length;

  // 14-day booking trend
  const days = Array.from({ length: 14 }, (_, i) => { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - (13 - i)); return d; });
  const trend = days.map((d) => ({ label: d.getDate().toString(), value: bookings.filter((b) => +b.createdAt >= +d && +b.createdAt < +d + 86400000).length }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label="Total users" value={users.length} icon={<Users size={16} />} />
        <Stat label="Active venues" value={venues.filter((v) => v.status === "approved").length} sub={`${venues.length} total`} tone="accent" icon={<Building2 size={16} />} />
        <Stat label="Total bookings" value={bookings.length} sub={`${todayBookings} today`} tone="brand" icon={<Ticket size={16} />} />
        <Stat label="Gross booking value" value={inr(gbv)} tone="success" icon={<IndianRupee size={16} />} />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label="Platform revenue" value={inr(platformRev)} icon={<IndianRupee size={16} />} />
        <Stat label="Refund value" value={inr(refundVal)} tone="warning" />
        <Stat label="Pending approvals" value={pendingApprovals} tone="warning" icon={<Clock size={16} />} />
        <Stat label="Open disputes" value={openDisputes} tone="danger" icon={<AlertTriangle size={16} />} />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 card p-5">
          <h2 className="font-bold mb-4">Bookings · last 14 days</h2>
          <RevenueChart data={trend} />
        </div>
        <div className="card p-5">
          <h2 className="font-bold mb-3">Needs attention</h2>
          <div className="space-y-2">
            <Link href="/admin/venues" className="flex items-center justify-between p-3 rounded-lg bg-surface-2 hover:bg-brand/10"><span className="text-sm">Venue approvals</span><Badge tone={pendingApprovals ? "warning" : "muted"}>{pendingApprovals}</Badge></Link>
            <Link href="/admin/disputes" className="flex items-center justify-between p-3 rounded-lg bg-surface-2 hover:bg-brand/10"><span className="text-sm">Open disputes</span><Badge tone={openDisputes ? "danger" : "muted"}>{openDisputes}</Badge></Link>
            <Link href="/admin/payouts" className="flex items-center justify-between p-3 rounded-lg bg-surface-2 hover:bg-brand/10"><span className="text-sm">Payout requests</span><Badge tone="accent">→</Badge></Link>
          </div>
        </div>
      </div>
    </div>
  );
}
