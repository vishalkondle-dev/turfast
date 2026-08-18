import { cn, SPORT_EMOJI } from "@/lib/utils";
import { initials } from "@/lib/format";
import Link from "next/link";
import type { ReactNode } from "react";

const TONES: Record<string, string> = {
  muted: "bg-surface-2 text-muted border-border",
  success: "bg-success/10 text-success border-success/20",
  warning: "bg-warning/10 text-warning border-warning/20",
  danger: "bg-danger/10 text-danger border-danger/20",
  accent: "bg-accent/10 text-accent border-accent/20",
  brand: "bg-brand/10 text-brand border-brand/20",
};

export function Badge({ children, tone = "muted", className }: { children: ReactNode; tone?: keyof typeof TONES | string; className?: string }) {
  return <span className={cn("inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold", TONES[tone] ?? TONES.muted, className)}>{children}</span>;
}

export function Rating({ value, count, className }: { value: number; count?: number; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 text-sm font-semibold", className)}>
      <span className="text-warning">★</span>
      {value.toFixed(1)}
      {count != null && <span className="text-muted font-normal">({count})</span>}
    </span>
  );
}

export function SportIcon({ slug, name, className }: { slug: string; name?: string; className?: string }) {
  return <span className={cn("inline-flex items-center gap-1.5", className)}><span aria-hidden>{SPORT_EMOJI[slug] ?? "🎯"}</span>{name}</span>;
}

export function Avatar({ name, src, size = 36 }: { name: string; src?: string | null; size?: number }) {
  return src ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={name} width={size} height={size} className="rounded-full object-cover" style={{ width: size, height: size }} />
  ) : (
    <span className="rounded-full bg-brand/15 text-brand grid place-items-center font-bold" style={{ width: size, height: size, fontSize: size * 0.4 }}>{initials(name)}</span>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton", className)} />;
}

export function EmptyState({ icon = "🗓️", title, hint, action }: { icon?: string; title: string; hint?: string; action?: ReactNode }) {
  return (
    <div className="text-center py-14 px-6 animate-fade-in">
      <div className="text-5xl mb-3">{icon}</div>
      <h3 className="text-lg font-bold">{title}</h3>
      {hint && <p className="text-muted mt-1 max-w-sm mx-auto">{hint}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Section({ title, action, children, className }: { title?: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn("mb-8", className)}>
      {(title || action) && (
        <div className="flex items-center justify-between mb-3 px-1">
          {title && <h2 className="text-lg font-bold tracking-tight">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function Stat({ label, value, sub, tone = "brand", icon }: { label: string; value: ReactNode; sub?: string; tone?: string; icon?: ReactNode }) {
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between">
        <span className="label">{label}</span>
        {icon && <span className={cn("h-8 w-8 grid place-items-center rounded-lg", TONES[tone] ?? TONES.brand)}>{icon}</span>}
      </div>
      <div className="text-2xl font-extrabold mt-2 tracking-tight">{value}</div>
      {sub && <div className="text-xs text-muted mt-1">{sub}</div>}
    </div>
  );
}

export function LinkButton({ href, children, variant = "brand", className }: { href: string; children: ReactNode; variant?: "brand" | "outline" | "ghost"; className?: string }) {
  const v = variant === "brand" ? "btn-brand" : variant === "outline" ? "btn-outline" : "btn-ghost";
  return <Link href={href} className={cn(v, className)}>{children}</Link>;
}
