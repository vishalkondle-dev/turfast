"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Compass, CalendarCheck, Users, User, Bell } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Home", icon: Home, exact: true },
  { href: "/explore", label: "Explore", icon: Compass },
  { href: "/bookings", label: "Bookings", icon: CalendarCheck },
  { href: "/games", label: "Games", icon: Users },
  { href: "/profile", label: "Profile", icon: User },
];

export function CustomerShell({ children, user, unread = 0 }: { children: React.ReactNode; user?: { name: string; role: string } | null; unread?: number }) {
  const path = usePathname();
  const active = (n: (typeof NAV)[number]) => (n.exact ? path === n.href : path.startsWith(n.href));
  return (
    <div className="min-h-screen pb-20 md:pb-0">
      {/* top bar */}
      <header className="sticky top-0 z-40 backdrop-blur bg-bg/80 border-b border-border">
        <div className="mx-auto max-w-6xl px-4 h-14 flex items-center justify-between gap-4">
          <Link href="/" className="font-extrabold text-xl tracking-tight">
            <span className="text-brand">Turf</span>ast
          </Link>
          <nav className="hidden md:flex items-center gap-1">
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} className={cn("px-3 py-2 rounded-lg text-sm font-semibold hover:bg-surface-2", active(n) && "text-brand bg-brand/10")}>
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-1">
            <Link href="/notifications" className="btn-ghost h-9 w-9 !px-0 relative" aria-label="Notifications">
              <Bell size={18} />
              {unread > 0 && <span className="absolute top-1 right-1 h-4 min-w-4 px-1 rounded-full bg-danger text-white text-[10px] grid place-items-center font-bold">{unread}</span>}
            </Link>
            <ThemeToggle />
            {user ? (
              <Link href="/profile" className="ml-1 h-9 w-9 rounded-full bg-brand/15 text-brand grid place-items-center font-bold text-sm">{user.name[0]}</Link>
            ) : (
              <Link href="/login" className="btn-brand !py-1.5 ml-1">Sign in</Link>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-5 animate-fade-in">{children}</main>

      {/* mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-surface/95 backdrop-blur border-t border-border">
        <div className="grid grid-cols-5 h-16">
          {NAV.map((n) => {
            const Icon = n.icon;
            return (
              <Link key={n.href} href={n.href} className={cn("flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium", active(n) ? "text-brand" : "text-muted")}>
                <Icon size={21} strokeWidth={active(n) ? 2.5 : 2} />
                {n.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
