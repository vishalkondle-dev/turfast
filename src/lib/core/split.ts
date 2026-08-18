/** Payment split computation for group bookings / games. */

export type SplitMode = "equal" | "custom" | "host_all" | "invite_only";

export function computeShares(total: number, players: number, mode: SplitMode, custom?: number[]): number[] {
  if (players <= 0) return [];
  if (mode === "host_all") {
    return [total, ...Array(players - 1).fill(0)];
  }
  if (mode === "custom" && custom && custom.length === players) {
    return custom.slice();
  }
  // equal (also invite_only default) — distribute remainder to earliest players
  const base = Math.floor(total / players);
  const remainder = total - base * players;
  return Array.from({ length: players }, (_, i) => base + (i < remainder ? 1 : 0));
}

export function pricePerPlayer(total: number, players: number): number {
  return players > 0 ? Math.ceil(total / players) : total;
}

/** Booking is confirmable only once all required shares are paid. */
export function isFullyPaid(shares: { share: number; paid: boolean }[]): boolean {
  return shares.filter((s) => s.share > 0).every((s) => s.paid);
}

export function collected(shares: { share: number; paid: boolean }[]): number {
  return shares.filter((s) => s.paid).reduce((a, s) => a + s.share, 0);
}
