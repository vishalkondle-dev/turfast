/**
 * ResourceLock Durable Object — the authoritative slot-lock for a single bookable
 * resource on Cloudflare. Because a DO is single-threaded per id, overlap checks
 * and reservation writes are serialised, guaranteeing no double-booking races.
 *
 * On Cloudflare, the API routes reservation/confirm calls to
 *   env.RESOURCE_LOCK.idFromName(resourceId)
 * so all contention for one resource funnels through one instance.
 *
 * In local Node dev the equivalent guarantee is provided by the D1/SQLite unique
 * partial index on (resource_id, starts_at) — see src/db/schema.ts (bk_slot_guard),
 * verified by src/db/concurrency-check.ts.
 */

type Hold = { id: string; start: number; end: number; expiresAt: number; userId: string };

export class ResourceLock {
  private holds: Hold[] = [];
  private confirmed: { start: number; end: number }[] = [];
  state: DurableObjectState;

  constructor(state: DurableObjectState) {
    this.state = state;
    this.state.blockConcurrencyWhile(async () => {
      this.holds = (await this.state.storage.get<Hold[]>("holds")) ?? [];
      this.confirmed = (await this.state.storage.get<{ start: number; end: number }[]>("confirmed")) ?? [];
    });
  }

  private overlaps(start: number, end: number) {
    const now = Date.now();
    this.holds = this.holds.filter((h) => h.expiresAt > now); // reap expired holds
    return [...this.confirmed, ...this.holds].some((i) => start < i.end && end > i.start);
  }

  async fetch(req: Request): Promise<Response> {
    const url = new URL(req.url);
    const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    const { action, start, end, holdId, userId, ttlMs } = body as any;

    if (action === "reserve") {
      if (this.overlaps(start, end)) return Response.json({ ok: false, reason: "slot_taken" });
      const hold: Hold = { id: crypto.randomUUID(), start, end, expiresAt: Date.now() + (ttlMs ?? 8 * 60000), userId };
      this.holds.push(hold);
      await this.state.storage.put("holds", this.holds);
      await this.state.storage.setAlarm(hold.expiresAt);
      return Response.json({ ok: true, holdId: hold.id });
    }
    if (action === "confirm") {
      const hold = this.holds.find((h) => h.id === holdId);
      if (!hold) return Response.json({ ok: false, reason: "hold_expired" });
      this.confirmed.push({ start: hold.start, end: hold.end });
      this.holds = this.holds.filter((h) => h.id !== holdId);
      await this.state.storage.put("holds", this.holds);
      await this.state.storage.put("confirmed", this.confirmed);
      return Response.json({ ok: true });
    }
    if (action === "release") {
      this.holds = this.holds.filter((h) => h.id !== holdId);
      await this.state.storage.put("holds", this.holds);
      return Response.json({ ok: true });
    }
    return Response.json({ ok: false, reason: "unknown_action" }, { status: 400 });
  }

  async alarm() {
    const now = Date.now();
    this.holds = this.holds.filter((h) => h.expiresAt > now);
    await this.state.storage.put("holds", this.holds);
  }
}
