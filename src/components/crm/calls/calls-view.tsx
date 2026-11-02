"use client";

import * as React from "react";
import {
  PhoneCall,
  Plus,
  Phone,
  PhoneOff,
  Repeat,
  Ban,
  Trash2,
  Crown,
} from "lucide-react";
import { CHANNEL_ICON } from "./channel-icons";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "@/components/crm/shared/empty-state";
import { JalaliDatePicker } from "@/components/ui/jalali-date-picker";
import { CustomerDetailSheet } from "@/components/crm/customers/customer-detail-sheet";
import {
  useCallLogs,
  useCreateCallLog,
  useDeleteCall,
} from "@/hooks/use-crm-data";
import { usePermissions } from "@/lib/crm/store";
import {
  CALL_RESULTS,
  CALL_CHANNELS,
  CALL_CHANNEL_KEYS,
  type CallResult,
  type CallChannel,
} from "@/lib/crm/types";
import { formatFaDate, getInitials, toFaDigits } from "@/lib/crm/utils";
import { cn } from "@/lib/utils";

const RESULT_ICON: Record<CallResult, React.ElementType> = {
  answered: Phone,
  no_answer: PhoneOff,
  followup: Repeat,
  canceled: Ban,
};

/** آیکون هر کانال تماس — تعریف مشترک در ./channel-icons */

/** تاریخ محلی به شکل YYYY-MM-DD برای input[type=date] */
function toLocalDateStr(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

/** ساعت محلی به شکل HH:MM برای input[type=time] */
function toLocalTimeStr(d: Date): string {
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

/** صفحه ثبت تماس — دکمه «ثبت تماس جدید» صفحه‌ی اینفیلدها را باز می‌کند.
 *  اگر شماره‌ی مخاطب در باشگاه مشتریان ثبت باشد، پروفایلش کنار تماس لینک می‌شود. */
export function CallsView() {
  const { isLeader } = usePermissions();
  const { data: calls, isLoading } = useCallLogs();
  const deleteCall = useDeleteCall();
  const [open, setOpen] = React.useState(false);
  const [profileId, setProfileId] = React.useState<string | null>(null);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">گزارش تماس‌ها</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            تماس‌های ثبت‌شده — با دکمه «ثبت تماس جدید» تماس تازه را ثبت کن.
          </p>
        </div>
        <Button
          onClick={() => setOpen(true)}
          className="gap-2 bg-gradient-to-l from-teal-600 to-emerald-600 text-white"
        >
          <Plus className="h-4 w-4" />
          ثبت تماس جدید
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : (calls ?? []).length === 0 ? (
        <EmptyState
          icon={PhoneCall}
          title="هنوز تماسی ثبت نشده"
          description="اولین تماس را با دکمه «ثبت تماس جدید» ثبت کن."
          action={
            <Button
              onClick={() => setOpen(true)}
              className="gap-2 bg-teal-600 hover:bg-teal-700"
            >
              <Plus className="h-4 w-4" />
              ثبت تماس جدید
            </Button>
          }
        />
      ) : (
        <div className="space-y-2.5">
          {(calls ?? []).map((c, i) => {
            const res = CALL_RESULTS[c.result as CallResult];
            const Icon = RESULT_ICON[c.result as CallResult] ?? Phone;
            return (
              <Card
                key={c.id}
                className="crm-fade-up py-0"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <CardContent className="flex items-start gap-3 p-4">
                  <span
                    className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white",
                      c.user?.color ?? "#14b8a6"
                    )}
                  >
                    {getInitials(c.contactName)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <p className="text-sm font-semibold">{c.contactName}</p>
                      <Badge
                        variant="outline"
                        className={cn("gap-1 text-[10px]", res.className)}
                      >
                        <Icon className="h-3 w-3" />
                        {res.label}
                      </Badge>
                      {/* کانال تماس — تلفن/تلگرام/ایمیل و... (تسک ۴۲) */}
                      {CALL_CHANNELS[c.channel as CallChannel] && (
                        <Badge
                          variant="outline"
                          className={cn(
                            "gap-1 text-[10px]",
                            CALL_CHANNELS[c.channel as CallChannel].className
                          )}
                        >
                          {(() => {
                            const ChIcon =
                              CHANNEL_ICON[c.channel as CallChannel] ?? Phone;
                            return <ChIcon className="h-3 w-3" />;
                          })()}
                          {CALL_CHANNELS[c.channel as CallChannel].label}
                        </Badge>
                      )}
                      {/* عضو باشگاه مشتریان — پروفایلش لینک شده */}
                      {c.customer && (
                        <button
                          onClick={() => setProfileId(c.customer!.id)}
                          title="مشاهده پروفایل در باشگاه مشتریان"
                          className="inline-flex shrink-0 items-center gap-1 rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-700 transition-colors hover:bg-amber-500/20 dark:text-amber-300"
                        >
                          <Crown className="h-3 w-3" />
                          عضو باشگاه — {c.customer.name}
                        </button>
                      )}
                    </div>
                    <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                      {c.phone && <span dir="ltr">{c.phone}</span>}
                      <span>{formatFaDate(c.callDate)}</span>
                      {c.durationMinutes ? (
                        <span>{toFaDigits(c.durationMinutes)} دقیقه مکالمه</span>
                      ) : null}
                      {isLeader && c.user && (
                        <span className="inline-flex items-center gap-1">
                          <span
                            className={cn(
                              "inline-block h-1.5 w-1.5 rounded-full",
                              c.user.color
                            )}
                          />
                          ثبت توسط {c.user.fullName}
                        </span>
                      )}
                    </p>
                    {c.notes && (
                      <p className="mt-1.5 whitespace-pre-line text-xs leading-6 text-muted-foreground">
                        {c.notes}
                      </p>
                    )}
                  </div>
                  {isLeader && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteCall.mutate(c.id)}
                      aria-label="حذف تماس"
                      className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <NewCallDialog open={open} onOpenChange={setOpen} />

      {/* پروفایل عضو باشگاه — با کلیک روی بج لینک‌شده */}
      <CustomerDetailSheet
        customerId={profileId}
        onOpenChange={(o) => !o && setProfileId(null)}
      />
    </div>
  );
}

function NewCallDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const createCall = useCreateCallLog();
  const [form, setForm] = React.useState({
    contactName: "",
    phone: "",
    callDate: "",
    callTime: "",
    duration: "",
    result: "answered",
    channel: "phone" as CallChannel,
    notes: "",
  });

  React.useEffect(() => {
    if (open) {
      // تاریخ و ساعت پیش‌فرض = همین حالا — قابل تغییر (تسک ۴۲)
      const now = new Date();
      setForm({
        contactName: "",
        phone: "",
        callDate: toLocalDateStr(now),
        callTime: toLocalTimeStr(now),
        duration: "",
        result: "answered",
        channel: "phone" as CallChannel,
        notes: "",
      });
    }
  }, [open]);

  const set = (patch: Partial<typeof form>) =>
    setForm((f) => ({ ...f, ...patch }));

  const submit = () => {
    if (!form.contactName.trim()) return;
    // تاریخ + ساعت محلی (بدون Z) — سرور همین را با زمان محلی ذخیره می‌کند؛
    // اگر ساعت خالی بود ظهرِ همان روز گرفته می‌شود تا تاریخ یک روز شیفت نخورد.
    const callDate = form.callDate
      ? `${form.callDate}T${form.callTime || "12:00"}`
      : null;
    createCall.mutate(
      {
        contactName: form.contactName.trim(),
        phone: form.phone.trim() || undefined,
        callDate,
        durationMinutes: form.duration ? Number(form.duration) : null,
        result: form.result,
        channel: form.channel,
        notes: form.notes.trim() || undefined,
      },
      { onSuccess: () => onOpenChange(false) }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PhoneCall className="h-5 w-5 text-teal-500" />
            ثبت تماس جدید
          </DialogTitle>
          <DialogDescription>
            اطلاعات تماس را پر کن — در گزارش تماس‌ها ذخیره می‌شود.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="call-contact">نام مخاطب *</Label>
            <Input
              id="call-contact"
              value={form.contactName}
              onChange={(e) => set({ contactName: e.target.value })}
              placeholder="مثلاً: علی کریمی"
            />
          </div>
          {/* کانال تماس — تلگرام، ایمیل و... (تسک ۴۲) */}
          <div className="space-y-1.5 sm:col-span-2">
            <Label>کانال تماس</Label>
            <div className="grid grid-cols-4 gap-1.5">
              {CALL_CHANNEL_KEYS.map((key) => {
                const ch = CALL_CHANNELS[key];
                const ChIcon = CHANNEL_ICON[key];
                const active = form.channel === key;
                return (
                  <button
                    type="button"
                    key={key}
                    onClick={() => set({ channel: key })}
                    aria-pressed={active}
                    className={cn(
                      "flex flex-col items-center gap-1 rounded-xl border px-1 py-2 text-[10px] font-medium transition-colors",
                      active
                        ? "border-teal-500 bg-teal-500/10 text-teal-700 dark:text-teal-300"
                        : "border-border text-muted-foreground hover:bg-muted/60"
                    )}
                  >
                    <ChIcon className="h-4 w-4" />
                    {ch.label}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="call-phone">شماره تماس (شناسه مشتری)</Label>
            <Input
              id="call-phone"
              dir="ltr"
              value={form.phone}
              onChange={(e) => set({ phone: e.target.value })}
              placeholder="0912..."
            />
            <p className="text-[10px] leading-5 text-muted-foreground">
              اگر این شماره در باشگاه مشتریان ثبت باشد، پروفایل عضو خودکار به
              این تماس وصل می‌شود — با ارقام فارسی هم جواب می‌دهد.
            </p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="call-duration">مدت مکالمه (دقیقه)</Label>
            <Input
              id="call-duration"
              type="number"
              min="1"
              value={form.duration}
              onChange={(e) => set({ duration: e.target.value })}
              placeholder="مثلاً: ۵"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="call-date">تاریخ تماس</Label>
            {/* (تسک ۵۱ بخش ۳) تقویم شمسی — مقدار همچنان ISO میلادی ذخیره می‌شود */}
            <JalaliDatePicker
              id="call-date"
              value={form.callDate}
              onChange={(iso) => set({ callDate: iso })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="call-time">ساعت تماس</Label>
            <Input
              id="call-time"
              type="time"
              value={form.callTime}
              onChange={(e) => set({ callTime: e.target.value })}
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>نتیجه تماس</Label>
            <Select value={form.result} onValueChange={(v) => set({ result: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(CALL_RESULTS) as CallResult[]).map((key) => (
                  <SelectItem key={key} value={key}>
                    {CALL_RESULTS[key].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="call-notes">توضیحات</Label>
            <Textarea
              id="call-notes"
              rows={3}
              value={form.notes}
              onChange={(e) => set({ notes: e.target.value })}
              placeholder="خلاصه صحبت، توافق‌ها و کارهای بعدی..."
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            انصراف
          </Button>
          <Button
            onClick={submit}
            disabled={!form.contactName.trim() || createCall.isPending}
            className="gap-2 bg-gradient-to-l from-teal-600 to-emerald-600 text-white"
          >
            <PhoneCall className="h-4 w-4" />
            ثبت تماس
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
