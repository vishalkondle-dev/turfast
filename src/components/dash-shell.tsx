"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import * as Icons from "lucide-react";
import { ThemeToggle } from "./theme-toggle";
import { cn } from "@/lib/utils";

export type NavItem = { href: string; label: string; icon: string };

export function DashShell({ title, brand, nav, children, footer }: { title: string; brand: string; nav: NavItem[]; children: React.ReactNode; footer?: React.ReactNode }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const isActive = (href: string) => path === href || (href !== nav[0].href && path.startsWith(href));

  const SidebarContent = (
    <>
      <div className="px-4 py-4">
        <Link href="/" className="font-extrabold text-xl"><span className="text-brand">Turf</span>ast</Link>
        <div className="text-[11px] text-muted mt-0.5 uppercase tracking-wide">{brand}</div>
      </div>
      <nav className="px-2 space-y-0.5 flex-1 overflow-y-auto no-scrollbar">
        {nav.map((n) => {
          const Icon = (Icons as any)[n.icon] ?? Icons.Circle;
          return (
            <Link key={n.href} href={n.href} onClick={() => setOpen(false)}
              className={cn("flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium", isActive(n.href) ? "bg-brand/10 text-brand" : "text-muted hover:bg-surface-2 hover:text-fg")}>
              <Icon size={18} /> {n.label}
            </Link>
          );
        })}
      </nav>
      {footer && <div className="p-3 border-t border-border">{footer}</div>}
    </>
  );

  return (
    <div className="min-h-screen flex bg-bg">
      {/* desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-60 border-r border-border bg-surface sticky top-0 h-screen">{SidebarContent}</aside>

      {/* mobile drawer */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="w-64 bg-surface flex flex-col animate-fade-in">{SidebarContent}</div>
          <div className="flex-1 bg-black/50" onClick={() => setOpen(false)} />
        </div>
      )}

      <div className="flex-1 min-w-0">
        <header className="sticky top-0 z-30 h-14 border-b border-border bg-surface/90 backdrop-blur flex items-center gap-3 px-4">
          <button onClick={() => setOpen(true)} className="lg:hidden btn-ghost !px-2"><Icons.Menu size={20} /></button>
          <h1 className="font-bold text-lg">{title}</h1>
          <div className="ml-auto flex items-center gap-2"><ThemeToggle /></div>
        </header>
        <main className="p-4 md:p-6 max-w-7xl mx-auto animate-fade-in">{children}</main>
      </div>
    </div>
  );
}
