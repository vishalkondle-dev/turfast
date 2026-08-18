export function cn(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}

export function slugify(str: string): string {
  return str.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

export const SPORT_EMOJI: Record<string, string> = {
  football: "🥅", cricket: "🏏", "box-cricket": "📦", badminton: "🏸", pickleball: "🎾",
  basketball: "🏀", volleyball: "🏐", tennis: "🎾", "table-tennis": "🏓", swimming: "🏊", squash: "🎯",
};

export const BOOKING_STATUS: Record<string, { label: string; tone: string }> = {
  pending: { label: "Pending", tone: "muted" },
  payment_pending: { label: "Payment pending", tone: "warning" },
  confirmed: { label: "Confirmed", tone: "success" },
  checked_in: { label: "Checked in", tone: "accent" },
  completed: { label: "Completed", tone: "muted" },
  cancelled: { label: "Cancelled", tone: "danger" },
  rescheduled: { label: "Rescheduled", tone: "accent" },
  refund_pending: { label: "Refund pending", tone: "warning" },
  refunded: { label: "Refunded", tone: "muted" },
  no_show: { label: "No-show", tone: "danger" },
  disputed: { label: "Disputed", tone: "danger" },
};
