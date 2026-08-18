import { redirect } from "next/navigation";
import { requireUser } from "@/lib/session";
import { getStaffContext } from "@/lib/staff";
import { DashShell, type NavItem } from "@/components/dash-shell";

const NAV: NavItem[] = [
  { href: "/staff", label: "Today's schedule", icon: "CalendarDays" },
  { href: "/staff/checkin", label: "Check-in", icon: "ScanLine" },
  { href: "/staff/walkins", label: "Walk-in booking", icon: "Footprints" },
  { href: "/staff/slots", label: "Slot management", icon: "LayoutGrid" },
];

export default async function StaffLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  if (!["staff", "owner", "admin"].includes(user.role)) redirect("/");
  const ctx = await getStaffContext(user.id);
  return <DashShell title="Staff Console" brand={ctx?.owner?.businessName ?? "Venue Staff"} nav={NAV}>{children}</DashShell>;
}
