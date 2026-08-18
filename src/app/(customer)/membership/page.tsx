import { eq } from "drizzle-orm";
import { Check, Crown } from "lucide-react";
import { requireUser } from "@/lib/session";
import { getDb } from "@/db";
import * as t from "@/db/schema";
import { Badge } from "@/components/ui";
import { inr } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Membership" };

export default async function MembershipPage() {
  const user = await requireUser();
  const db = getDb();
  const [plans, subs] = await Promise.all([
    db.select().from(t.memberships).where(eq(t.memberships.active, true)),
    db.select().from(t.membershipSubscriptions).where(eq(t.membershipSubscriptions.userId, user.id)),
  ]);
  const activeSub = subs.find((s) => s.status === "active");

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-6">
        <div className="inline-grid place-items-center h-14 w-14 rounded-2xl bg-warning/15 text-warning mb-2"><Crown size={30} /></div>
        <h1 className="text-2xl font-extrabold tracking-tight">Membership</h1>
        <p className="text-muted">Play more, pay less. Priority booking and exclusive perks.</p>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        {plans.map((p) => {
          const isActive = activeSub?.membershipId === p.id;
          return (
            <div key={p.id} className={`card p-5 ${isActive ? "border-brand ring-2 ring-brand/30" : ""}`}>
              <div className="flex items-center justify-between">
                <div className="font-extrabold text-lg">{p.name}</div>
                {isActive && <Badge tone="success">Active</Badge>}
              </div>
              <div className="text-3xl font-extrabold mt-1">{inr(p.price)}<span className="text-sm text-muted font-normal">/{p.durationDays}d</span></div>
              <div className="text-sm text-brand font-semibold mt-1">{p.discountPct}% off every booking</div>
              <ul className="mt-4 space-y-2">
                {(p.perks as string[]).map((perk) => <li key={perk} className="flex items-center gap-2 text-sm"><Check size={16} className="text-brand shrink-0" /> {perk}</li>)}
              </ul>
              <button disabled={isActive} className="btn-brand w-full mt-4">{isActive ? "Your current plan" : "Get " + p.name}</button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
