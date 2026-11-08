"use client";

import * as React from "react";
import {
  PhoneCall,
  Phone,
  PhoneOff,
  Repeat,
  Ban,
  Plus,
  ArrowLeft,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/crm/shared/empty-state";
import { CustomerDetailSheet } from "@/components/crm/customers/customer-detail-sheet";
import { useCallLogs } from "@/hooks/use-crm-data";
import { useCrmStore } from "@/lib/crm/store";
import {
  CALL_RESULTS,
  CALL_CHANNELS,
  type CallLog,
  type CallResult,
  type CallChannel,
} from "@/lib/crm/types";
import { CHANNEL_ICON } from "./channel-icons";
import { getInitials, toFaDigits } from "@/lib/crm/utils";
import { avatarColor } from "@/lib/crm/utils";
import { cn } from "@/lib/utils";

const RESULT_ICON: Record<CallResult, React.ElementType> = {
  answered: Phone,
  no_answer: PhoneOff,
  followup: Repeat,
  canceled: Ban,
};

const RESULT_TILE: { keys: CallResult[]; label: string; icon: React.ElementType; cls: string }[] = [
  {
    keys: ["answered"],
    label: "پاسخ داد",
    icon: Phone,
    cls: "bg-teal-100 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300",
  },
  {
    keys: ["no_answer"],
    label: "پاسخ نداد",
    icon: PhoneOff,
    cls: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
  },
  {
    keys: ["followup"],
    label: "نیاز به پیگیری",
    icon: Repeat,
    cls: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  },
  {
    keys: ["canceled"],
    label: "لغو شد",
    icon: Ban,
    cls: "bg-slate-100 text-slate-600 dark:bg-slate-500/15 dark:text-slate-300",
  },
];

/** زمان تماس به شکل ۱۴:۳۰ */
function faTime(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return toFaDigits(
    new Intl.DateTimeFormat("fa-IR", { hour: "2-digit", minute: "2-digit" }).format(d)
  );
}

/** صفحه «تعداد تماس‌های روز» — فقط برای مدیریت شرکت و مدیر بخش.
 *  شمارنده‌ی کل تماس‌های امروز + تفکیک نتیجه + لیست تماس‌های همین امروز. */
export function CallsTodayView() {
  const setView = useCrmStore((s) => s.setView);
  const { data: calls, isLoading } = useCallLogs();
  const [profileId, setProfileId] = React.useState<string | null>(null);

  const today = React.useMemo(() => {
    const all = calls ?? [];
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    return all.filter((c) => {
      const t = new Date(c.callDate).getTime();
      return t >= start.getTime() && t <= end.getTime();
    });
  }, [calls]);

  const countBy = (keys: CallResult[]) =>
    today.filter((c) => keys.includes(c.result as CallResult)).length;

  const tiles = [
    {
      key: "all",
      label: "کل تماس‌های امروز",
      count: today.length,
      icon: PhoneCall,
      cls: "bg-gradient-to-br from-teal-400 to-emerald-600 text-white shadow-md shadow-teal-500/25",
    },
    ...RESULT_TILE.map((t) => ({
      key: t.keys[0],
      label: t.label,
      count: countBy(t.keys),
      icon: t.icon,
      cls: t.cls,
    })),
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">تعداد تماس‌های روز</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            آمار تماس‌های ثبت‌شده‌ی امروز — برای ثبت تماس تازه به «ثبت تماس» برو.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => setView("calls")}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          ثبت تماس جدید
          <ArrowLeft className="h-3.5 w-3.5 text-muted-foreground" />
        </Button>
      </div>

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

      {/* Today's call list */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : today.length === 0 ? (
        <EmptyState
          icon={PhoneCall}
          title="امروز هنوز تماسی ثبت نشده"
          description="با دکمه‌ی «ثبت تماس جدید» (در همین صفحه یا از منوی ثبت تماس) اولین تماس امروز را ثبت کن."
          action={
            <Button
              onClick={() => setView("calls")}
              className="gap-2 bg-teal-600 hover:bg-teal-700"
            >
              <Plus className="h-4 w-4" />
              ثبت تماس جدید
            </Button>
          }
        />
      ) : (
        <div className="space-y-2.5">
          {today.map((c, i) => (
            <CallRow key={c.id} call={c} index={i} onOpenProfile={setProfileId} />
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

function CallRow({
  call,
  index,
  onOpenProfile,
}: {
  call: CallLog;
  index: number;
  onOpenProfile: (id: string) => void;
}) {
  const res = CALL_RESULTS[call.result as CallResult];
  const Icon = RESULT_ICON[call.result as CallResult] ?? Phone;
  return (
    <Card
      className="crm-fade-up py-0"
      style={{ animationDelay: `${index * 50}ms` }}
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
              className={cn("gap-1 border px-2 py-0.5 text-[11px]", res?.className)}
            >
              <Icon className="h-3 w-3" />
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
            <span className="tabular-nums">ساعت {faTime(call.callDate)}</span>
            {call.phone && (
              <span dir="ltr" className="font-mono">
                {toFaDigits(call.phone)}
              </span>
            )}
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
      </CardContent>
    </Card>
  );
}
