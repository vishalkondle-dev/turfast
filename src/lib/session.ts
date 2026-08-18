import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { getDb } from "@/db";
import { users } from "@/db/schema";

export type CurrentUser = typeof users.$inferSelect;

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.email) return null;
  const db = getDb();
  const row = (await db.select().from(users).where(eq(users.email, session.user.email)).limit(1))[0];
  return row ?? null;
}

export async function requireUser(): Promise<CurrentUser> {
  const u = await getCurrentUser();
  if (!u) redirect("/login");
  return u;
}

export async function requireRole(role: CurrentUser["role"] | CurrentUser["role"][]): Promise<CurrentUser> {
  const u = await requireUser();
  const roles = Array.isArray(role) ? role : [role];
  if (!roles.includes(u.role) && u.role !== "admin") redirect("/");
  return u;
}
