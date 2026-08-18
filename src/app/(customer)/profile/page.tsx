import Link from "next/link";
import { eq, desc } from "drizzle-orm";
import { Wallet, Gift, Heart, Crown, Bell, LifeBuoy, Star, ChevronRight, Trophy, Zap } from "lucide-react";
import { requireUser } from "@/lib/session";
import { getDb } from "@/db";
import * as t from "@/db/schema";
import { Avatar, Stat } from "@/components/ui";
import { SignOutButton } from "./sign-out";
import { inr } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Profile" };

export default async function ProfilePage() {
  const user = await requireUser();
  const db = getDb();
  const [wallet, bookings, referrals, profile, membership] = await Promise.all([
    db.select().from(t.wallets).where(eq(t.wallets.userId, user.id)).limit(1),
    db.select().from(t.bookings).where(eq(t.bookings.userId, user.id)),
    db.select().from(t.referrals).where(eq(t.referrals.referrerId, user.id)),
    db.select().from(t.userProfiles).where(eq(t.userProfiles.userId, user.id)).limit(1),
    db.select().from(t.membershipSubscriptions).where(eq(t.membershipSubscriptions.userId, user.id)).orderBy(desc(t.membershipSubscriptions.createdAt)).limit(1),
  ]);
  const completed = bookings.filter((b) => b.status === "completed").length;
  const links = [
    { href: "/wallet", icon: Wallet, label: "Wallet", sub: inr(wallet[0]?.balance ?? 0) },
    { href: "/rewards", icon: Gift, label: "Rewards & referrals", sub: `${user.loyaltyPoints} pts` },
    { href: "/favorites", icon: Heart, label: "Favorites" },
    { href: "/membership", icon: Crown, label: "Membership", sub: membership[0] ? "Active" : "Explore" },
    { href: "/notifications", icon: Bell, label: "Notifications" },
    { href: "/support", icon: LifeBuoy, label: "Help & support" },
  ];

  return (
    <div className="max-w-2xl mx-auto">
      <div className="card p-5 flex items-center gap-4">
        <Avatar name={user.name} src={user.image} size={64} />
        <div className="flex-1">
          <div className="text-xl font-extrabold">{user.name}</div>
          <div className="text-muted text-sm">{user.email}</div>
          <div className="text-xs text-muted mt-0.5 capitalize">{user.role} · Referral code <span className="font-mono font-bold text-brand">{user.referralCode}</span></div>
        </div>
        <Link href="/profile/edit" className="btn-outline !py-2 text-sm">Edit</Link>
      </div>

      <div className="grid grid-cols-3 gap-3 mt-4">
        <Stat label="Games played" value={completed} icon={<Trophy size={16} />} />
        <Stat label="Reward points" value={user.loyaltyPoints} tone="accent" icon={<Zap size={16} />} />
        <Stat label="Referrals" value={referrals.filter((r) => r.status === "completed").length} tone="warning" icon={<Gift size={16} />} />
      </div>

      {profile[0]?.favoriteSports?.length ? (
        <div className="card p-4 mt-4">
          <div className="label mb-2">Sports profile</div>
          <div className="flex flex-wrap gap-2">
            {profile[0].favoriteSports.map((s) => <span key={s} className="chip !py-1 capitalize">{s.replace("-", " ")}</span>)}
          </div>
        </div>
      ) : null}

      <div className="card mt-4 divide-y divide-border overflow-hidden">
        {links.map((l) => {
          const Icon = l.icon;
          return (
            <Link key={l.href} href={l.href} className="flex items-center gap-3 px-4 py-3.5 hover:bg-surface-2">
              <span className="h-9 w-9 rounded-lg bg-surface-2 grid place-items-center text-brand"><Icon size={18} /></span>
              <span className="font-medium flex-1">{l.label}</span>
              {l.sub && <span className="text-sm text-muted">{l.sub}</span>}
              <ChevronRight size={16} className="text-muted" />
            </Link>
          );
        })}
      </div>

      <div className="mt-4"><SignOutButton /></div>
    </div>
  );
}
