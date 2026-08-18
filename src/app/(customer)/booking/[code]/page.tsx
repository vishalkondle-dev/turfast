import { notFound } from "next/navigation";
import Link from "next/link";
import { eq } from "drizzle-orm";
import QRCode from "qrcode";
import { CheckCircle2, MapPin, Phone, Download, CalendarPlus, Share2 } from "lucide-react";
import { getDb } from "@/db";
import * as t from "@/db/schema";
import { requireUser } from "@/lib/session";
import { Badge } from "@/components/ui";
import { fmtDateLong, fmtRange, inr } from "@/lib/format";
import { BOOKING_STATUS } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata = { title: "Booking confirmed" };

export default async function BookingPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const user = await requireUser();
  const db = getDb();
  const b = (await db.select().from(t.bookings).where(eq(t.bookings.code, code)).limit(1))[0];
  if (!b || b.userId !== user.id) notFound();
  const venue = (await db.select().from(t.venues).where(eq(t.venues.id, b.venueId)).limit(1))[0];
  const sport = (await db.select().from(t.sports).where(eq(t.sports.id, b.sportId)).limit(1))[0];
  const resource = (await db.select().from(t.resources).where(eq(t.resources.id, b.resourceId)).limit(1))[0];
  const payment = (await db.select().from(t.payments).where(eq(t.payments.bookingId, b.id)).limit(1))[0];
  const qr = await QRCode.toDataURL(JSON.stringify({ code: b.code, token: b.qrToken }), { width: 240, margin: 1, color: { dark: "#0f172a", light: "#ffffff" } });
  const st = BOOKING_STATUS[b.status];

  return (
    <div className="max-w-lg mx-auto">
      <div className="text-center py-4">
        <div className="inline-grid place-items-center h-16 w-16 rounded-full bg-success/15 text-success mb-3 animate-fade-in"><CheckCircle2 size={38} /></div>
        <h1 className="text-2xl font-extrabold">Booking Confirmed!</h1>
        <p className="text-muted">Your slot is locked in. See you on the field 🏟️</p>
      </div>

      <div className="card overflow-hidden">
        <div className="bg-gradient-to-br from-brand to-accent text-white p-5 flex items-center justify-between">
          <div>
            <div className="text-white/80 text-xs">Booking ID</div>
            <div className="font-extrabold text-xl tracking-wide">{b.code}</div>
          </div>
          <Badge tone="success" className="!bg-white/20 !text-white !border-0">{st?.label}</Badge>
        </div>

        <div className="p-5 grid grid-cols-[1fr_auto] gap-4 items-center">
          <div className="space-y-2.5 text-sm">
            <Field label="Venue" value={venue.name} />
            <Field label="Sport / Court" value={`${sport.name} · ${resource.name}`} />
            <Field label="Date" value={fmtDateLong(new Date(+b.startsAt))} />
            <Field label="Time" value={`${fmtRange(new Date(+b.startsAt), new Date(+b.endsAt))} (${b.durationMins} min)`} />
            <Field label="Amount paid" value={inr(b.totalAmount)} strong />
            <Field label="Payment" value={payment ? `${payment.method.toUpperCase()} · ${payment.status}` : "—"} />
          </div>
          <div className="text-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qr} alt="Check-in QR" className="rounded-lg border border-border" width={120} height={120} />
            <div className="text-[10px] text-muted mt-1">Scan to check in</div>
          </div>
        </div>

        <div className="grid grid-cols-3 border-t border-border">
          <a href={`https://maps.google.com/?q=${venue.lat},${venue.lng}`} target="_blank" rel="noreferrer" className="py-3 flex flex-col items-center gap-1 text-xs font-medium hover:bg-surface-2"><MapPin size={17} className="text-brand" /> Directions</a>
          <a href={`tel:${venue.phone}`} className="py-3 flex flex-col items-center gap-1 text-xs font-medium hover:bg-surface-2 border-x border-border"><Phone size={17} className="text-brand" /> Call venue</a>
          <Link href={`/booking/${b.code}/receipt`} className="py-3 flex flex-col items-center gap-1 text-xs font-medium hover:bg-surface-2"><Download size={17} className="text-brand" /> Receipt</Link>
        </div>
      </div>

      <div className="flex gap-3 mt-4">
        <Link href="/bookings" className="btn-brand flex-1">My Bookings</Link>
        <Link href={`/venue/${venue.slug}`} className="btn-outline flex-1">View venue</Link>
      </div>
      <p className="text-center text-xs text-muted mt-4">Need to change plans? You can cancel or reschedule from My Bookings — cancellation refunds follow the venue policy.</p>
    </div>
  );
}

function Field({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return <div className="flex justify-between gap-4"><span className="text-muted">{label}</span><span className={strong ? "font-extrabold" : "font-semibold text-right"}>{value}</span></div>;
}
