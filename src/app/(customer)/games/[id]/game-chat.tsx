"use client";
import { useEffect, useRef, useState, useTransition } from "react";
import { Send } from "lucide-react";
import { Avatar } from "@/components/ui";
import { sendGameMessage } from "@/app/actions/games";
import { cn } from "@/lib/utils";

type Msg = { id: string; body: string; kind: string; userId: string; name: string; image: string | null; at: number };

export function GameChat({ gameId, initial, meId, loggedIn }: { gameId: string; initial: Msg[]; meId: string | null; loggedIn: boolean }) {
  const [messages, setMessages] = useState<Msg[]>(initial);
  const [text, setText] = useState("");
  const [pending, start] = useTransition();
  const endRef = useRef<HTMLDivElement>(null);

  // lightweight polling (Durable Object WS on Cloudflare; polling keeps local dev simple)
  useEffect(() => {
    const iv = setInterval(async () => {
      try {
        const r = await fetch(`/api/games/${gameId}/messages`);
        const d = await r.json();
        if (d.messages) setMessages(d.messages);
      } catch {}
    }, 4000);
    return () => clearInterval(iv);
  }, [gameId]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages.length]);

  function send() {
    if (!text.trim()) return;
    const body = text; setText("");
    start(async () => { await sendGameMessage(gameId, body); const r = await fetch(`/api/games/${gameId}/messages`); const d = await r.json(); if (d.messages) setMessages(d.messages); });
  }

  return (
    <div>
      <div className="max-h-80 overflow-y-auto no-scrollbar p-4 space-y-3">
        {messages.map((m) => m.kind !== "message" ? (
          <div key={m.id} className="text-center"><span className="text-xs text-muted bg-surface-2 rounded-full px-3 py-1">{m.body}</span></div>
        ) : (
          <div key={m.id} className={cn("flex gap-2", m.userId === meId && "flex-row-reverse")}>
            <Avatar name={m.name} src={m.image} size={30} />
            <div className={cn("max-w-[75%]", m.userId === meId && "items-end flex flex-col")}>
              <div className="text-[11px] text-muted px-1">{m.userId === meId ? "You" : m.name.split(" ")[0]}</div>
              <div className={cn("rounded-2xl px-3 py-2 text-sm", m.userId === meId ? "bg-brand text-brand-fg rounded-tr-sm" : "bg-surface-2 rounded-tl-sm")}>{m.body}</div>
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>
      {loggedIn ? (
        <div className="flex items-center gap-2 border-t border-border p-3">
          <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder="Message the squad…" className="input" />
          <button onClick={send} disabled={pending || !text.trim()} className="btn-brand !px-3"><Send size={16} /></button>
        </div>
      ) : (
        <div className="border-t border-border p-3 text-center text-sm text-muted">Sign in to chat with players.</div>
      )}
    </div>
  );
}
