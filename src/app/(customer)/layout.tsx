import { CustomerShell } from "@/components/customer-shell";
import { getCurrentUser } from "@/lib/session";
import { getDb } from "@/db";
import { notifications } from "@/db/schema";
import { and, eq } from "drizzle-orm";

export default async function CustomerLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  let unread = 0;
  if (user) {
    const rows = await getDb().select().from(notifications).where(and(eq(notifications.userId, user.id), eq(notifications.read, false)));
    unread = rows.length;
  }
  return (
    <CustomerShell user={user ? { name: user.name, role: user.role } : null} unread={unread}>
      {children}
    </CustomerShell>
  );
}
