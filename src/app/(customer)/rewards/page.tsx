import { eq, desc } from "drizzle-orm";
import { requireUser } from "@/lib/session";
import { getDb } from "@/db";
import * as t from "@/db/schema";
import { Stat } from "@/components/ui";
import { Copy, Gift, Users } from "lucide-react";
import { fmtDate } from "@/lib/format";
import { CopyReferral } from "./copy-referral";

export const dynamic = "force-dynamic";
export const metadata = { title: "Rewards & Referrals" };

export default async function RewardsPage() {
  const user = await requireUser();
  const db = getDb();
  const [ledger, referrals] = await Promise.all([
    db.select().from(t.rewardsLedger).where(eq(t.rewardsLedger.userId, user.id)).orderBy(desc(t.rewardsLedger.createdAt)),
    db.select().from(t.referrals).where(eq(t.referrals.referrerId, user.id)),
  ]);
  const successful = referrals.filter((r) => r.status === "completed");
  const pending = referrals.filter((r) => r.status === "pending");

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-2xl font-extrabold tracking-tight mb-4">Rewards & Referrals</h1>
      <div className="card p-6 bg-gradient-to-br from-warning to-brand text-white">
        <div className="text-white/85 text-sm">Your reward points</div>
        <div className="text-4xl font-extrabold">{user.loyaltyPoints}</div>
        <div className="text-white/80 text-sm mt-1">Earn on every booking, review, referral and game.</div>
      </div>

      <div className="card p-5 mt-4">
        <div className="flex items-center gap-2 font-bold"><Gift size={18} className="text-brand" /> Refer & earn</div>
        <p className="text-sm text-muted mt-1">Share your code — you both earn 500 points when a friend completes their first booking.</p>
        <CopyReferral code={user.referralCode ?? ""} />
        <div className="grid grid-cols-3 gap-3 mt-4">
          <Stat label="Invited" value={referrals.length} />
          <Stat label="Successful" value={successful.length} tone="success" />
          <Stat label="Pending" value={pending.length} tone="warning" />
        </div>
      </div>

      <h2 className="font-bold mt-6 mb-3">Points history</h2>
      <div className="card divide-y divide-border overflow-hidden">
        {ledger.map((l) => (
          <div key={l.id} className="flex items-center justify-between px-4 py-3">
            <div><div className="text-sm font-medium capitalize">{l.reason.replace("_", " ")}</div><div className="text-xs text-muted">{l.note} · {fmtDate(new Date(+l.createdAt))}</div></div>
            <div className={`font-bold ${l.points >= 0 ? "text-success" : "text-danger"}`}>{l.points >= 0 ? "+" : ""}{l.points}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
