import { notFound } from "next/navigation";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import * as t from "@/db/schema";
import { requireUser } from "@/lib/session";
import { fmtDateLong, fmtRange, inr } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Receipt" };

export default async function ReceiptPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const user = await requireUser();
  const db = getDb();
  const b = (await db.select().from(t.bookings).where(eq(t.bookings.code, code)).limit(1))[0];
  if (!b || b.userId !== user.id) notFound();
  const venue = (await db.select().from(t.venues).where(eq(t.venues.id, b.venueId)).limit(1))[0];
  const sport = (await db.select().from(t.sports).where(eq(t.sports.id, b.sportId)).limit(1))[0];
  const payment = (await db.select().from(t.payments).where(eq(t.payments.bookingId, b.id)).limit(1))[0];

  return (
    <div className="max-w-md mx-auto">
      <div className="flex items-center justify-between mb-4 print:hidden">
        <Link href="/bookings" className="text-sm text-brand font-semibold">← Back</Link>
        <button className="btn-outline !py-2 print-btn">Print / Save PDF</button>
      </div>
      <div className="card p-6">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div><div className="font-extrabold text-xl"><span className="text-brand">Turf</span>ast</div><div className="text-xs text-muted">Tax invoice / receipt</div></div>
          <div className="text-right text-sm"><div className="font-bold">{b.code}</div><div className="text-muted text-xs">{fmtDateLong(new Date(+b.createdAt))}</div></div>
        </div>
        <div className="py-4 space-y-1 text-sm">
          <div className="font-semibold">{venue.name}</div>
          <div className="text-muted">{venue.address}</div>
          <div className="text-muted">{sport.name} · {fmtDateLong(new Date(+b.startsAt))} · {fmtRange(new Date(+b.startsAt), new Date(+b.endsAt))}</div>
        </div>
        <table className="w-full text-sm border-t border-border pt-2">
          <tbody>
            <Row label="Slot price" value={inr(b.basePrice)} />
            {b.discount > 0 && <Row label={`Discount ${b.couponCode ? "(" + b.couponCode + ")" : ""}`} value={"– " + inr(b.discount)} />}
            <Row label="Platform fee" value={inr(b.platformFee)} />
            {b.tax > 0 && <Row label="Taxes" value={inr(b.tax)} />}
            {b.walletUsed > 0 && <Row label="Wallet used" value={"– " + inr(b.walletUsed)} />}
          </tbody>
        </table>
        <div className="flex justify-between font-extrabold text-base border-t border-border mt-2 pt-2"><span>Total paid</span><span>{inr(b.totalAmount)}</span></div>
        <div className="text-xs text-muted mt-4">Payment: {payment ? `${payment.method.toUpperCase()} · ${payment.gateway} · ${payment.gatewayRef}` : "—"}</div>
        <div className="text-xs text-muted mt-1">Thank you for playing with Turfast.</div>
      </div>
      <script dangerouslySetInnerHTML={{ __html: `document.querySelector('.print-btn')?.addEventListener('click',()=>window.print())` }} />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return <tr><td className="py-1 text-muted">{label}</td><td className="py-1 text-right font-semibold">{value}</td></tr>;
}
