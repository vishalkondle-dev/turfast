import { requireRole } from "@/lib/session";
import { DashShell, type NavItem } from "@/components/dash-shell";

const NAV: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: "LayoutDashboard" },
  { href: "/admin/venues", label: "Venues", icon: "Building2" },
  { href: "/admin/owners", label: "Owners", icon: "Briefcase" },
  { href: "/admin/users", label: "Users", icon: "Users" },
  { href: "/admin/bookings", label: "Bookings", icon: "Ticket" },
  { href: "/admin/payments", label: "Payments", icon: "CreditCard" },
  { href: "/admin/reviews", label: "Reviews", icon: "Star" },
  { href: "/admin/disputes", label: "Disputes", icon: "Scale" },
  { href: "/admin/support", label: "Support", icon: "LifeBuoy" },
  { href: "/admin/payouts", label: "Payouts", icon: "Wallet" },
  { href: "/admin/audit", label: "Audit logs", icon: "ScrollText" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireRole("admin");
  return <DashShell title="Admin Console" brand="Platform Admin" nav={NAV}>{children}</DashShell>;
}
