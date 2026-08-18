/**
 * GameRoom Durable Object — real-time chat + join state for a single game on
 * Cloudflare, backed by WebSockets. All participants for one game connect to the
 * same instance (env.GAME_ROOM.idFromName(gameId)) and receive broadcasts.
 *
 * In local Node dev the game chat falls back to short-interval polling of
 *   GET /api/games/[id]/messages
 * (see src/app/(customer)/games/[id]/game-chat.tsx) so the feature works without
 * the Workers runtime.
 */

type ChatMessage = { id: string; userId: string; name: string; body: string; at: number; kind: string };

export class GameRoom {
  private sockets = new Set<WebSocket>();
  private messages: ChatMessage[] = [];
  state: DurableObjectState;

  constructor(state: DurableObjectState) {
    this.state = state;
    this.state.blockConcurrencyWhile(async () => {
      this.messages = (await this.state.storage.get<ChatMessage[]>("messages")) ?? [];
    });
  }

  async fetch(req: Request): Promise<Response> {
    const url = new URL(req.url);
    if (req.headers.get("Upgrade") === "websocket") {
      const pair = new WebSocketPair();
      const [client, server] = [pair[0], pair[1]];
      (server as any).accept();
      this.sockets.add(server);
      server.send(JSON.stringify({ type: "history", messages: this.messages }));

      server.addEventListener("message", async (evt: MessageEvent) => {
        const data = JSON.parse(typeof evt.data === "string" ? evt.data : "{}");
        if (data.type === "message") {
          const msg: ChatMessage = { id: crypto.randomUUID(), userId: data.userId, name: data.name, body: data.body, at: Date.now(), kind: "message" };
          this.messages.push(msg);
          if (this.messages.length > 200) this.messages = this.messages.slice(-200);
          await this.state.storage.put("messages", this.messages);
          this.broadcast({ type: "message", message: msg });
        }
      });
      server.addEventListener("close", () => this.sockets.delete(server));
      return new Response(null, { status: 101, webSocket: client });
    }
    // REST fallback
    if (url.pathname.endsWith("/messages")) return Response.json({ messages: this.messages });
    return new Response("GameRoom", { status: 200 });
  }

  private broadcast(payload: unknown) {
    const s = JSON.stringify(payload);
    for (const ws of this.sockets) { try { ws.send(s); } catch { this.sockets.delete(ws); } }
  }
}
