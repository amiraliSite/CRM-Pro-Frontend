"use client";

import * as React from "react";
import {
  PhoneCall,
  Phone,
  PhoneOff,
  Repeat,
  Ban,
  ChevronRight,
  ChevronLeft,
  CircleCheck,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/crm/shared/empty-state";
import { CustomerDetailSheet } from "@/components/crm/customers/customer-detail-sheet";
import { useCallLogs } from "@/hooks/use-crm-data";
import {
  CALL_RESULTS,
  CALL_CHANNELS,
  CALL_CHANNEL_KEYS,
  type CallLog,
  type CallResult,
  type CallChannel,
} from "@/lib/crm/types";
import { CHANNEL_ICON } from "./channel-icons";
import { avatarColor, getInitials, toFaDigits } from "@/lib/crm/utils";
import { cn } from "@/lib/utils";

/** برقرارشده = پاسخ داد + نیاز به پیگیری (تماسی که وصل شده) */
const CONNECTED: CallResult[] = ["answered", "followup"];

function faTime(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return toFaDigits(
    new Intl.DateTimeFormat("fa-IR", { hour: "2-digit", minute: "2-digit" }).format(d)
  );
}

function faDayShort(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("fa-IR", { day: "numeric", month: "short" }).format(d);
}

/** صفحه «تعداد تماس‌های برقرارشده در ماه» — فقط برای مدیریت شرکت و مدیر بخش.
 *  شمارنده‌ی بزرگ تماس‌های برقرارشده‌ی ماه + تفکیک + نمودار روزانه + لیست. */
export function CallsMonthView() {
  const { data: calls, isLoading } = useCallLogs();
  const [profileId, setProfileId] = React.useState<string | null>(null);
  const [monthOffset, setMonthOffset] = React.useState(0);

  // بازه‌ی ماه انتخاب‌شده (0 = ماه جاری) — بر اساس زمان محلی مرورگر
  const { range, monthLabel } = React.useMemo(() => {
    const now = new Date();
    const anchor = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
    const start = new Date(anchor.getFullYear(), anchor.getMonth(), 1, 0, 0, 0, 0);
    const end = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 1, 0, 0, 0, 0);
    const label = new Intl.DateTimeFormat("fa-IR", {
      month: "long",
      year: "numeric",
    }).format(anchor);
    return { range: { start, end }, monthLabel: label };
  }, [monthOffset]);

  const monthCalls = React.useMemo(() => {
    if (!calls) return [];
    return calls.filter((c) => {
      const t = new Date(c.callDate).getTime();
      return t >= range.start.getTime() && t < range.end.getTime();
    });
  }, [calls, range]);

  const connectedCount = monthCalls.filter((c) =>
    CONNECTED.includes(c.result as CallResult)
  ).length;

  const byResult = (key: CallResult) =>
    monthCalls.filter((c) => c.result === key).length;

  // نمودار روزانه — تعداد تماس هر روزِ ماه (تفکیک برقرارشده/نشده)
  const dayBars = React.useMemo(() => {
    const map = new Map<number, { day: number; total: number; connected: number; label: string }>();
    for (const c of monthCalls) {
      const d = new Date(c.callDate);
      const day = d.getDate();
      const row = map.get(day) ?? {
        day,
        total: 0,
        connected: 0,
        label: faDayShort(d),
      };
      row.total += 1;
      if (CONNECTED.includes(c.result as CallResult)) row.connected += 1;
      map.set(day, row);
    }
    return [...map.values()].sort((a, b) => a.day - b.day);
  }, [monthCalls]);

  const maxDay = dayBars.reduce((m, d) => Math.max(m, d.total), 0);

  // تفکیک کانال‌های ماه — چند تماس از هر کانال (تسک ۴۲)
  const channelCounts = React.useMemo(() => {
    const map = new Map<CallChannel, number>();
    for (const c of monthCalls) {
      const key = c.channel as CallChannel;
      if (!CALL_CHANNELS[key]) continue;
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return CALL_CHANNEL_KEYS.filter((k) => map.has(k)).map((k) => ({
      key: k,
      count: map.get(k) ?? 0,
    }));
  }, [monthCalls]);

  const tiles = [
    {
      key: "all",
      label: "کل تماس‌های ماه",
      count: monthCalls.length,
      icon: PhoneCall,
      cls: "bg-gradient-to-br from-teal-400 to-emerald-600 text-white shadow-md shadow-teal-500/25",
    },
    {
      key: "answered",
      label: "پاسخ داد",
      count: byResult("answered"),
      icon: Phone,
      cls: "bg-teal-100 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300",
    },
    {
      key: "followup",
      label: "نیاز به پیگیری",
      count: byResult("followup"),
      icon: Repeat,
      cls: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
    },
    {
      key: "no_answer",
      label: "پاسخ نداد",
      count: byResult("no_answer"),
      icon: PhoneOff,
      cls: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
    },
    {
      key: "canceled",
      label: "لغو شد",
      count: byResult("canceled"),
      icon: Ban,
      cls: "bg-slate-100 text-slate-600 dark:bg-slate-500/15 dark:text-slate-300",
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">تعداد تماس‌های برقرارشده در ماه</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            برقرارشده = «پاسخ داد» + «نیاز به پیگیری» — تماسی که وصل شده است.
          </p>
        </div>
        {/* Month navigation */}
        <div className="flex items-center gap-1.5 rounded-xl border bg-card px-2 py-1.5">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setMonthOffset((v) => Math.min(0, v + 1))}
            disabled={monthOffset >= 0}
            aria-label="ماه بعد"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <span className="min-w-24 text-center text-sm font-bold">{monthLabel}</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setMonthOffset((v) => v - 1)}
            aria-label="ماه قبل"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Hero stat — تعداد برقرارشده */}
      <Card className="crm-fade-up border-teal-500/25 bg-gradient-to-l from-teal-500/10 to-emerald-500/5 py-0">
        <CardContent className="flex items-center gap-4 p-5">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-400 to-emerald-600 text-white shadow-lg shadow-teal-500/25">
            <CircleCheck className="h-7 w-7" />
          </span>
          <div>
            <div className="text-4xl font-black tabular-nums leading-none text-teal-700 dark:text-teal-300">
              {toFaDigits(connectedCount)}
            </div>
            <p className="mt-1.5 text-sm font-medium text-muted-foreground">
              تماس برقرارشده در {monthLabel}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Tiles */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {tiles.map((t) => {
          const Icon = t.icon;
          return (
            <Card key={t.key} className="crm-fade-up py-0">
              <CardContent className="flex items-center gap-3 p-4">
                <span
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                    t.cls
                  )}
                >
                  <Icon className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <div className="text-lg font-bold tabular-nums leading-tight">
                    {toFaDigits(t.count)}
                  </div>
                  <div className="truncate text-[11px] text-muted-foreground">
                    {t.label}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Per-day bars */}
      {dayBars.length > 0 && (
        <Card className="crm-fade-up py-0">
          <CardContent className="p-5">
            <h3 className="text-sm font-bold">تماس‌های روزانه — {monthLabel}</h3>
            <div className="mt-4 space-y-2.5">
              {dayBars.map((d) => (
                <div key={d.day} className="flex items-center gap-3">
                  <span className="w-16 shrink-0 text-[11px] text-muted-foreground">
                    {d.label}
                  </span>
                  <div className="h-5 flex-1 overflow-hidden rounded-md bg-muted/60">
                    <div
                      className="flex h-full items-center justify-end rounded-md bg-gradient-to-l from-teal-500 to-emerald-500 px-2 text-[10px] font-bold text-white"
                      style={{
                        width: `${Math.max(12, (d.total / Math.max(maxDay, 1)) * 100)}%`,
                      }}
                    >
                      {toFaDigits(d.total)}
                    </div>
                  </div>
                  <span className="w-14 shrink-0 text-left text-[10px] text-muted-foreground">
                    {toFaDigits(d.connected)} برقرار
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Channel breakdown chips (تسک ۴۲) */}
      {channelCounts.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-medium text-muted-foreground">
            تفکیک کانال‌ها در {monthLabel}:
          </span>
          {channelCounts.map(({ key, count }) => {
            const ch = CALL_CHANNELS[key];
            const ChIcon = CHANNEL_ICON[key];
            return (
              <Badge
                key={key}
                variant="outline"
                className={cn("gap-1 text-[11px]", ch.className)}
              >
                <ChIcon className="h-3 w-3" />
                {ch.label} {toFaDigits(count)}
              </Badge>
            );
          })}
        </div>
      )}

      {/* Month's call list */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : monthCalls.length === 0 ? (
        <EmptyState
          icon={PhoneCall}
          title={`در ${monthLabel} تماسی ثبت نشده`}
          description="از منوی «ثبت تماس» تماس‌های تازه را ثبت کن تا آمار این ماه ساخته شود."
        />
      ) : (
        <div className="space-y-2.5">
          {monthCalls.map((c, i) => (
            <MonthCallRow key={c.id} call={c} index={i} onOpenProfile={setProfileId} />
          ))}
        </div>
      )}

      <CustomerDetailSheet
        customerId={profileId}
        onClose={() => setProfileId(null)}
      />
    </div>
  );
}

function MonthCallRow({
  call,
  index,
  onOpenProfile,
}: {
  call: CallLog;
  index: number;
  onOpenProfile: (id: string) => void;
}) {
  const res = CALL_RESULTS[call.result as CallResult];
  const connected = CONNECTED.includes(call.result as CallResult);
  return (
    <Card
      className="crm-fade-up py-0"
      style={{ animationDelay: `${index * 40}ms` }}
    >
      <CardContent className="flex items-start gap-3 p-4">
        <span
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white",
            avatarColor(call.user?.id ?? call.id)
          )}
          aria-hidden
        >
          {getInitials(call.user?.fullName || call.contactName)}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-bold">{call.contactName}</span>
            <Badge
              variant="outline"
              className={cn("border px-2 py-0.5 text-[11px]", res?.className)}
            >
              {res?.label ?? call.result}
            </Badge>
            {/* کانال تماس — تلفن/تلگرام/ایمیل و... (تسک ۴۲) */}
            {CALL_CHANNELS[call.channel as CallChannel] && (
              <Badge
                variant="outline"
                className={cn(
                  "gap-1 border px-2 py-0.5 text-[11px]",
                  CALL_CHANNELS[call.channel as CallChannel].className
                )}
              >
                {(() => {
                  const ChIcon = CHANNEL_ICON[call.channel as CallChannel];
                  return ChIcon ? <ChIcon className="h-3 w-3" /> : null;
                })()}
                {CALL_CHANNELS[call.channel as CallChannel].label}
              </Badge>
            )}
            {call.customerId && call.customer && (
              <button
                type="button"
                onClick={() => onOpenProfile(call.customer!.id)}
                className="text-[11px] font-medium text-teal-600 underline-offset-4 hover:underline dark:text-teal-300"
              >
                عضو باشگاه — {call.customer.name}
              </button>
            )}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
            <span className="tabular-nums">
              {faDayShort(call.callDate)} — ساعت {faTime(call.callDate)}
            </span>
            {call.durationMinutes ? (
              <span className="tabular-nums">
                مدت {toFaDigits(call.durationMinutes)} دقیقه
              </span>
            ) : null}
            {call.user && <span>ثبت‌کننده: {call.user.fullName}</span>}
          </div>
          {call.notes && (
            <p className="mt-1.5 line-clamp-2 text-xs text-muted-foreground">
              {call.notes}
            </p>
          )}
        </div>
        <span
          className={cn(
            "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold",
            connected
              ? "bg-teal-500/15 text-teal-700 dark:text-teal-300"
              : "bg-slate-500/15 text-slate-600 dark:text-slate-300"
          )}
        >
          {connected ? "برقرار شد" : "برقرار نشد"}
        </span>
      </CardContent>
    </Card>
  );
}
