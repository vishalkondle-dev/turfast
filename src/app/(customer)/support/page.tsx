import { eq, desc } from "drizzle-orm";
import { requireUser } from "@/lib/session";
import { getDb } from "@/db";
import * as t from "@/db/schema";
import { Badge } from "@/components/ui";
import { SupportForm } from "./support-form";
import { fmtDate } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Support" };

const FAQS = [
  ["How do I cancel a booking?", "Go to My Bookings → Upcoming → Cancel. Refunds follow the venue's cancellation policy and land in your wallet."],
  ["When is my slot confirmed?", "Only after successful payment. Until then the slot is held for a few minutes and released if payment isn't completed."],
  ["How do refunds work?", "Eligible refunds are credited to your Turfast wallet instantly and can be used on your next booking."],
  ["Can I reschedule?", "Yes — from My Bookings. If the new slot costs more you pay the difference; if less, the difference is credited to your wallet."],
];

export default async function SupportPage() {
  const user = await requireUser();
  const tickets = await getDb().select().from(t.supportTickets).where(eq(t.supportTickets.userId, user.id)).orderBy(desc(t.supportTickets.createdAt));

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-extrabold tracking-tight mb-1">Help & Support</h1>
      <p className="text-muted text-sm mb-5">Find quick answers or raise a ticket — we usually reply within a few hours.</p>

      <div className="card divide-y divide-border overflow-hidden mb-6">
        {FAQS.map(([q, a]) => (
          <details key={q} className="px-4 py-3 group">
            <summary className="font-semibold cursor-pointer list-none flex items-center justify-between">{q}<span className="text-muted group-open:rotate-45 transition">+</span></summary>
            <p className="text-sm text-muted mt-2">{a}</p>
          </details>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <h2 className="font-bold mb-3">Raise a ticket</h2>
          <SupportForm />
        </div>
        <div>
          <h2 className="font-bold mb-3">My tickets</h2>
          {tickets.length === 0 ? <div className="text-sm text-muted card p-4">No tickets yet.</div> : (
            <div className="space-y-2">
              {tickets.map((tk) => (
                <div key={tk.id} className="card p-3">
                  <div className="flex items-center justify-between"><span className="font-semibold text-sm">{tk.subject}</span><Badge tone={tk.status === "open" ? "warning" : "success"}>{tk.status}</Badge></div>
                  <div className="text-xs text-muted mt-1">{tk.code} · {tk.category} · {fmtDate(new Date(+tk.createdAt))}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
