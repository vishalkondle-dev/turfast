import Link from "next/link";
import { requireUser } from "@/lib/session";
import { getNotifications } from "@/lib/queries";
import { EmptyState } from "@/components/ui";
import { relativeTime } from "@/lib/format";
import { markAllNotificationsRead } from "@/app/actions/misc";
import { MarkReadButton } from "./mark-read";

export const dynamic = "force-dynamic";
export const metadata = { title: "Notifications" };

const ICON: Record<string, string> = { booking: "🎉", offer: "🏷️", reminder: "⏰", cancellation: "❌", rescheduling: "🔄", refund: "💸", game: "⚽", dispute: "⚖️", general: "🔔" };

export default async function NotificationsPage() {
  const user = await requireUser();
  const items = await getNotifications(user.id);
  return (
    <div className="max-w-xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-extrabold tracking-tight">Notifications</h1>
        {items.some((i) => !i.read) && <MarkReadButton />}
      </div>
      {items.length === 0 ? (
        <EmptyState icon="🔔" title="You're all caught up" hint="Booking updates, offers and game invites will appear here." />
      ) : (
        <div className="space-y-2">
          {items.map((n) => (
            <Link key={n.id} href={n.href || "#"} className={`card p-3.5 flex gap-3 ${!n.read ? "border-brand/40" : ""}`}>
              <span className="text-2xl">{ICON[n.type] ?? "🔔"}</span>
              <div className="flex-1">
                <div className="font-semibold text-sm flex items-center gap-2">{n.title}{!n.read && <span className="h-2 w-2 rounded-full bg-brand" />}</div>
                <div className="text-sm text-muted">{n.body}</div>
                <div className="text-xs text-muted mt-0.5">{relativeTime(new Date(+n.createdAt))}</div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
