"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { MAX_MESSAGE_LENGTH } from "@/lib/supportOptions";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Field";
import { formatTicketDate } from "./TicketBadges";

export interface ThreadMessage {
  id: string;
  authorName: string;
  authorRole: string;
  body: string;
  createdAt: string | Date;
}

interface TicketThreadProps {
  messages: ThreadMessage[];
  /** Whose side "mine" is: own messages are aligned right. */
  viewerRole: "OWNER" | "SUPPORT";
  replyUrl: string;
  replyPlaceholder?: string;
  /** Shown above the reply box, e.g. "replying reopens the ticket". */
  replyHint?: React.ReactNode;
}

export function TicketThread({ messages, viewerRole, replyUrl, replyPlaceholder, replyHint }: TicketThreadProps) {
  const router = useRouter();
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reply.trim()) return;
    setSending(true);
    setError("");
    try {
      const res = await fetch(replyUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: reply }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Mesaj gönderilemedi.");
        return;
      }
      setReply("");
      router.refresh();
    } catch {
      setError("Bağlantı hatası oluştu.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col">
      <ol className="space-y-4 p-4 sm:p-5">
        {messages.map((m) => {
          const mine = m.authorRole === viewerRole;
          const fromSupport = m.authorRole === "SUPPORT";
          return (
            <li key={m.id} className={cn("flex flex-col", mine ? "items-end" : "items-start")}>
              <div className="mb-1 flex items-center gap-2 text-xs text-ink-3">
                <span className="font-medium text-ink-2">{m.authorName}</span>
                {fromSupport && (
                  <span className="rounded-control bg-brand-soft px-1.5 py-px text-[11px] font-medium text-brand-ink">
                    Destek ekibi
                  </span>
                )}
                <time dateTime={new Date(m.createdAt).toISOString()}>{formatTicketDate(m.createdAt)}</time>
              </div>
              <div
                className={cn(
                  "max-w-[min(36rem,92%)] whitespace-pre-wrap break-words rounded-panel border px-3.5 py-2.5 text-sm leading-relaxed",
                  mine ? "border-brand-line bg-brand-soft text-ink" : "border-line bg-surface-muted text-ink"
                )}
              >
                {m.body}
              </div>
            </li>
          );
        })}
      </ol>

      <form onSubmit={handleSend} className="space-y-2 border-t border-line p-4 sm:p-5">
        {replyHint && <p className="text-xs text-ink-3">{replyHint}</p>}
        <label htmlFor="ticket-reply" className="sr-only">Yanıtınız</label>
        <Textarea
          id="ticket-reply"
          rows={4}
          maxLength={MAX_MESSAGE_LENGTH}
          placeholder={replyPlaceholder ?? "Mesajınızı yazın..."}
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          className="text-base sm:text-sm"
        />
        {error && <p className="text-xs text-danger">{error}</p>}
        <div className="flex justify-end">
          <Button type="submit" variant="primary" disabled={sending || !reply.trim()}>
            {sending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Send className="h-4 w-4" aria-hidden="true" />}
            Gönder
          </Button>
        </div>
      </form>
    </div>
  );
}
