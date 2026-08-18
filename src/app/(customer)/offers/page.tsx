import Link from "next/link";
import { getOffers } from "@/lib/queries";
import { getDb } from "@/db";
import * as t from "@/db/schema";
import { eq } from "drizzle-orm";
import { EmptyState } from "@/components/ui";

export const dynamic = "force-dynamic";
export const metadata = { title: "Offers & Coupons" };

export default async function OffersPage() {
  const [offers, coupons] = await Promise.all([getOffers(), getDb().select().from(t.coupons).where(eq(t.coupons.active, true))]);
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-extrabold tracking-tight mb-4">Offers & Coupons</h1>
      {offers.length === 0 && coupons.length === 0 ? (
        <EmptyState icon="🏷️" title="No active offers right now" hint="Check back soon for deals." />
      ) : (
        <>
          <div className="grid sm:grid-cols-2 gap-4 mb-6">
            {offers.map((o) => (
              <div key={o.id} className="card overflow-hidden">
                <div className="p-4 bg-gradient-to-br from-brand/15 to-accent/10">
                  <div className="text-xs font-bold text-brand uppercase">Featured offer</div>
                  <div className="font-bold text-lg mt-1">{o.title}</div>
                  <div className="text-sm text-muted mt-1">{o.description}</div>
                  {o.couponCode && <div className="mt-3 inline-block border border-dashed border-brand rounded-lg px-3 py-1 font-mono font-bold text-brand">{o.couponCode}</div>}
                </div>
              </div>
            ))}
          </div>
          <h2 className="font-bold mb-3">All coupons</h2>
          <div className="space-y-2">
            {coupons.map((c) => (
              <div key={c.id} className="card p-4 flex items-center justify-between">
                <div>
                  <div className="font-mono font-bold text-brand">{c.code}</div>
                  <div className="text-sm text-muted">{c.description}</div>
                </div>
                <div className="text-right text-sm">
                  <div className="font-bold">{c.type === "percent" ? `${c.value}% off` : `₹${c.value} off`}</div>
                  {c.minAmount > 0 && <div className="text-xs text-muted">Min ₹{c.minAmount}</div>}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
      <div className="mt-6 text-center"><Link href="/explore" className="btn-brand">Book & apply a coupon</Link></div>
    </div>
  );
}
