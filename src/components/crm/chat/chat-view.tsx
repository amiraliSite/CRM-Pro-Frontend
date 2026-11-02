"use client";

import * as React from "react";
import { ArrowRight, MessageCircle, Send, MessagesSquare } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/crm/shared/empty-state";
import {
  useChatThreads,
  useChatMessages,
  useSendChat,
} from "@/hooks/use-crm-data";
import { roleLabel, type ChatMessage } from "@/lib/crm/types";
import { useCrmStore } from "@/lib/crm/store";
import { avatarColor, formatFaDateTime, getInitials, timeAgo } from "@/lib/crm/utils";
import { cn } from "@/lib/utils";

export function ChatView() {
  const { user: me } = useCrmStore();
  const [openId, setOpenId] = React.useState<string | null>(null);
  const { data: threads, isLoading } = useChatThreads();
  const totalUnread = (threads ?? []).reduce((s, t) => s + t.unread, 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-bold">
            <MessagesSquare className="h-5 w-5 text-teal-500" />
            چت کارمندان
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            گفتگوی خصوصی با هر هم‌کار — {totalUnread > 0 ? `${totalUnread} پیام خوانده‌نشده` : "همه پیام‌ها خوانده شده"}
          </p>
        </div>
      </div>

      <div className={cn("grid gap-4", openId && "lg:grid-cols-[320px_1fr]")}>
        {/* Thread list — one personal box per colleague */}
        <div className={cn("space-y-2", openId && "hidden lg:block")}>
          {isLoading ? (
            [...Array(4)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)
          ) : (threads ?? []).length === 0 ? (
            <EmptyState
              icon={MessageCircle}
              title="هنوز کسی نیست"
              description="بعد از ساختن کاربران، باکس گفتگوی خصوصی هر نفر اینجا نمایش داده می‌شود."
            />
          ) : (
            (threads ?? []).map((t) => (
              <button
                key={t.user.id}
                onClick={() => setOpenId(t.user.id)}
                className="crm-fade-up w-full text-right"
                aria-label={`گفتگو با ${t.user.fullName}`}
              >
                <Card className="py-0 transition-all hover:shadow-md hover:border-teal-500/40">
                  <CardContent className="flex items-center gap-3 p-3.5">
                    <span
                      className={cn(
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white",
                        avatarColor(t.user.id)
                      )}
                    >
                      {getInitials(t.user.fullName)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-semibold">{t.user.fullName}</p>
                        <Badge variant="outline" className="shrink-0 border-0 bg-muted px-1.5 text-[10px] text-muted-foreground">
                          {roleLabel(t.user.role)}
                        </Badge>
                      </div>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {t.lastBody || "شروع گفتگو..."}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      {t.lastAt && (
                        <span className="text-[10px] text-muted-foreground">{timeAgo(t.lastAt)}</span>
                      )}
                      {t.unread > 0 && (
                        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-teal-600 px-1.5 text-[10px] font-bold text-white">
                          {t.unread}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </button>
            ))
          )}
        </div>

        {openId && (
          <ChatPanel
            withId={openId}
            meId={me?.id ?? ""}
            onBack={() => setOpenId(null)}
          />
        )}
      </div>
    </div>
  );
}

function ChatPanel({
  withId,
  meId,
  onBack,
}: {
  withId: string;
  meId: string;
  onBack: () => void;
}) {
  const { data: messages, isLoading } = useChatMessages(withId);
  const send = useSendChat();
  const [text, setText] = React.useState("");
  const bottomRef = React.useRef<HTMLDivElement>(null);
  const threads = useChatThreads();
  const partner = (threads.data ?? []).find((t) => t.user.id === withId)?.user;

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages?.length]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const body = text.trim();
    if (!body || send.isPending) return;
    setText("");
    send.mutate({ toId: withId, body });
  };

  return (
    <Card className="flex h-[70vh] flex-col py-0">
      <div className="flex items-center gap-3 border-b p-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          aria-label="بازگشت به لیست"
          className="h-8 w-8 lg:hidden"
        >
          <ArrowRight className="h-4 w-4" />
        </Button>
        <span
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold text-white",
            avatarColor(withId)
          )}
        >
          {partner ? getInitials(partner.fullName) : "..."}
        </span>
        <div>
          <p className="text-sm font-semibold">{partner?.fullName ?? "..."}</p>
          <p className="text-xs text-muted-foreground">{roleLabel(partner?.role)}</p>
        </div>
      </div>

      <div className="flex-1 space-y-2.5 overflow-y-auto p-4" dir="rtl">
        {isLoading ? (
          [...Array(3)].map((_, i) => <Skeleton key={i} className="h-10 w-2/3" />)
        ) : (messages ?? []).length === 0 ? (
          <p className="pt-10 text-center text-sm text-muted-foreground">
            اولین پیام را بفرست 👋
          </p>
        ) : (
          (messages ?? []).map((m: ChatMessage) => {
            const mine = m.fromId === meId;
            return (
              <div key={m.id} className={cn("flex", mine ? "justify-start" : "justify-end")}>
                <div
                  className={cn(
                    "max-w-[75%] rounded-2xl px-3.5 py-2 text-sm",
                    mine
                      ? "rounded-br-md bg-teal-600 text-white"
                      : "rounded-bl-md bg-muted"
                  )}
                >
                  <p className="whitespace-pre-wrap break-words">{m.body}</p>
                  <p
                    className={cn(
                      "mt-1 text-[10px]",
                      mine ? "text-teal-100/80" : "text-muted-foreground"
                    )}
                  >
                    {formatFaDateTime(m.createdAt)}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={submit} className="flex items-center gap-2 border-t p-3">
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="پیام خود را بنویسید..."
          aria-label="متن پیام"
          className="flex-1"
          maxLength={2000}
        />
        <Button
          type="submit"
          size="icon"
          disabled={!text.trim() || send.isPending}
          aria-label="ارسال پیام"
          className="h-10 w-10 shrink-0 bg-teal-600 hover:bg-teal-700"
        >
          <Send className="h-4 w-4 rotate-180" />
        </Button>
      </form>
    </Card>
  );
}
