import { redirect } from "next/navigation";
import { requireUser } from "@/lib/session";
import { getOwnerForUser } from "@/lib/owner";
import { DashShell, type NavItem } from "@/components/dash-shell";

const NAV: NavItem[] = [
  { href: "/owner", label: "Dashboard", icon: "LayoutDashboard" },
  { href: "/owner/calendar", label: "Calendar", icon: "CalendarRange" },
  { href: "/owner/bookings", label: "Bookings", icon: "Ticket" },
  { href: "/owner/walkins", label: "Walk-ins", icon: "Footprints" },
  { href: "/owner/venues", label: "Venues & courts", icon: "Building2" },
  { href: "/owner/pricing", label: "Pricing", icon: "IndianRupee" },
  { href: "/owner/offers", label: "Offers & coupons", icon: "BadgePercent" },
  { href: "/owner/customers", label: "Customers", icon: "Users" },
  { href: "/owner/reviews", label: "Reviews", icon: "Star" },
  { href: "/owner/revenue", label: "Revenue & payouts", icon: "Wallet" },
  { href: "/owner/analytics", label: "Analytics", icon: "BarChart3" },
  { href: "/owner/staff", label: "Staff", icon: "UserCog" },
];

export default async function OwnerLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  if (user.role !== "owner" && user.role !== "admin") redirect("/");
  const owner = await getOwnerForUser(user.id);
  if (!owner && user.role !== "admin") redirect("/onboarding");
  return <DashShell title="Business Console" brand={owner?.businessName ?? "Owner"} nav={NAV}>{children}</DashShell>;
}
