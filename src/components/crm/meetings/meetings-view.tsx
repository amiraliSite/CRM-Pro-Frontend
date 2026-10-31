"use client";

import * as React from "react";
import {
  CalendarCheck,
  Plus,
  Trash2,
  Building2,
  CalendarDays,
  Clock,
  Star,
  Eye,
} from "lucide-react";
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
import {
  useMeetings,
  useCreateMeeting,
  useDeleteMeeting,
  useCustomers,
} from "@/hooks/use-crm-data";
import { MEETING_QUALITY, type Meeting } from "@/lib/crm/types";
import { avatarColor, formatFaDate, getInitials, toFaDigits } from "@/lib/crm/utils";
import { cn } from "@/lib/utils";

/** روز هفته‌ی تاریخ انتخابی — «دوشنبه» */
function weekdayFa(dateStr: string): string {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-").map(Number);
  if (!y || !m || !d) return "";
  const date = new Date(y, m - 1, d);
  return new Intl.DateTimeFormat("fa-IR", { weekday: "long" }).format(date);
}

/** "2026-10-27" → Date ظهرِ همان روز به وقت محلی (ضد شیفت روز در نمایش تاریخ) */
function localNoon(dateStr: string): Date | null {
  const [y, m, d] = dateStr.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d, 12, 0, 0, 0);
}

function todayInputValue(): string {
  const now = new Date();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${mm}-${dd}`;
}

/** صفحه «جلسات» — فقط برای مدیریت شرکت و مدیر بخش.
 *  دکمه‌ی «برگزاری جلسه» پاپ‌آپی با فیلدهای تاریخ/روز/موضوع/ساعت/شرکت/توضیحات باز می‌کند.
 *  (تسک ۵۱) فیلد «کیفیت جلسه» از پاپ‌آپ حذف شد — ثبت با کیفیت پیش‌فرض انجام می‌شود
 *  و نشان کیفیت فقط برای جلسات قدیمی که واقعاً ثبت شده نمایش داده می‌شود.
 *  (تسک ۴۳) هر جلسه دکمه‌ی «مشاهده» دارد — پاپ‌آپی که تاریخ و زمان جلسه را درشت
 *  نشان می‌دهد تا نیازی به گشتن نباشد.
 *  (تسک ۵۱ بخش ۳) فیلد تاریخ شمسی شد (تقویم جلالی) و چینش تاریخ/ساعت یک‌راستا شد؛
 *  روز هفته داخل خودِ فیلد تاریخ نمایش داده می‌شود. */
export function MeetingsView() {
  const { data: meetings, isLoading } = useMeetings();
  const deleteMeeting = useDeleteMeeting();
  const [open, setOpen] = React.useState(false);
  const [viewing, setViewing] = React.useState<Meeting | null>(null);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">جلسات</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            جلسات برگزارشده — ثبت با «برگزاری جلسه»، جزئیات هر جلسه را با «مشاهده» ببین.
          </p>
        </div>
        <Button
          onClick={() => setOpen(true)}
          className="gap-2 bg-gradient-to-l from-teal-600 to-emerald-600 text-white"
        >
          <Plus className="h-4 w-4" />
          برگزاری جلسه
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : (meetings ?? []).length === 0 ? (
        <EmptyState
          icon={CalendarCheck}
          title="هنوز جلسه‌ای ثبت نشده"
          description="اولین جلسه را با دکمه‌ی «برگزاری جلسه» ثبت کن."
          action={
            <Button
              onClick={() => setOpen(true)}
              className="gap-2 bg-teal-600 hover:bg-teal-700"
            >
              <Plus className="h-4 w-4" />
              برگزاری جلسه
            </Button>
          }
        />
      ) : (
        <div className="space-y-2.5">
          {(meetings ?? []).map((m, i) => (
            <MeetingRow
              key={m.id}
              meeting={m}
              index={i}
              onView={() => setViewing(m)}
              onDelete={() => deleteMeeting.mutate(m.id)}
            />
          ))}
        </div>
      )}

      <MeetingDialog open={open} onOpenChange={setOpen} />

      {/* پاپ‌آپ مشاهده‌ی جزئیات جلسه — تاریخ و زمان درشت (تسک ۴۳) */}
      <MeetingDetailDialog
        meeting={viewing}
        onOpenChange={(o) => !o && setViewing(null)}
      />
    </div>
  );
}

function MeetingRow({
  meeting,
  index,
  onView,
  onDelete,
}: {
  meeting: Meeting;
  index: number;
  onView: () => void;
  onDelete: () => void;
}) {
  const q = MEETING_QUALITY[meeting.quality];
  return (
    <Card
      className="crm-fade-up py-0"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <CardContent className="flex items-start gap-3 p-4">
        <span
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white",
            avatarColor(meeting.createdBy?.id ?? meeting.id)
          )}
          aria-hidden
        >
          {getInitials(meeting.createdBy?.fullName || "—")}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-bold">{meeting.subject}</span>
            <Badge
              variant="outline"
              className={cn("gap-1 border px-2 py-0.5 text-[11px]", q?.className)}
            >
              <Star className="h-3 w-3" />
              کیفیت: {q?.label ?? meeting.quality}
            </Badge>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1 tabular-nums">
              <CalendarDays className="h-3 w-3" />
              {weekdayFa(meeting.meetingDate.slice(0, 10))} — {formatFaDate(meeting.meetingDate)}
            </span>
            <span className="flex items-center gap-1 tabular-nums" dir="ltr">
              <Clock className="h-3 w-3" />
              {toFaDigits(meeting.time)}
            </span>
            {meeting.company && (
              <span className="flex items-center gap-1">
                <Building2 className="h-3 w-3" />
                {meeting.company}
              </span>
            )}
            {meeting.customer && (
              <span className="text-teal-600 dark:text-teal-300">
                عضو باشگاه — {meeting.customer.name}
              </span>
            )}
            {meeting.createdBy && <span>ثبت‌کننده: {meeting.createdBy.fullName}</span>}
          </div>
          {meeting.notes && (
            <p className="mt-1.5 line-clamp-2 text-xs text-muted-foreground">
              {meeting.notes}
            </p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {/* مشاهده‌ی سریع جزئیات جلسه — پاپ‌آپ تاریخ و زمان (تسک ۴۳) */}
          <Button
            variant="outline"
            size="sm"
            onClick={onView}
            title="مشاهده‌ی جزئیات جلسه"
            className="h-8 gap-1 border-teal-500/40 bg-teal-500/10 px-2.5 text-[11px] text-teal-700 hover:bg-teal-500/20 dark:text-teal-300"
          >
            <Eye className="h-3.5 w-3.5" />
            مشاهده
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-rose-600"
            onClick={onDelete}
            aria-label="حذف جلسه"
            title="حذف جلسه"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/** پاپ‌آپ «مشاهده» — جزئیات کامل جلسه با باکس درشتِ تاریخ و زمان (تسک ۴۳) */
function MeetingDetailDialog({
  meeting,
  onOpenChange,
}: {
  meeting: Meeting | null;
  onOpenChange: (v: boolean) => void;
}) {
  const q = meeting ? MEETING_QUALITY[meeting.quality] : undefined;
  const day = meeting ? weekdayFa(meeting.meetingDate.slice(0, 10)) : "";
  return (
    <Dialog open={!!meeting} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
        <DialogHeader className="text-right">
          <DialogTitle className="flex items-center gap-2">
            <CalendarCheck className="h-5 w-5 text-teal-600 dark:text-teal-300" />
            جزئیات جلسه
          </DialogTitle>
          <DialogDescription>
            مشاهده‌ی سریع جلسه‌ی ثبت‌شده — تاریخ و زمان.
          </DialogDescription>
        </DialogHeader>

        {meeting && (
          <div className="space-y-3">
            <p className="text-base font-bold leading-7">{meeting.subject}</p>

            {/* باکس درشت تاریخ و زمان */}
            <div className="rounded-xl border border-teal-200 bg-gradient-to-l from-teal-50 to-emerald-50 p-4 dark:border-teal-500/25 dark:from-teal-500/10 dark:to-emerald-500/10">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="flex items-center gap-1.5 text-[11px] font-semibold text-teal-700 dark:text-teal-300">
                    <CalendarDays className="h-3.5 w-3.5" />
                    تاریخ جلسه
                  </p>
                  <p className="mt-1.5 text-sm font-bold tabular-nums">
                    {day} — {formatFaDate(meeting.meetingDate)}
                  </p>
                </div>
                <div className="shrink-0 border-r border-teal-200/70 pr-3 dark:border-teal-500/20">
                  <p className="flex items-center gap-1.5 text-[11px] font-semibold text-teal-700 dark:text-teal-300">
                    <Clock className="h-3.5 w-3.5" />
                    ساعت
                  </p>
                  <p
                    className="mt-1 text-2xl font-black tabular-nums text-teal-700 dark:text-teal-200"
                    dir="ltr"
                  >
                    {toFaDigits(meeting.time)}
                  </p>
                </div>
              </div>
            </div>

            {/* مشخصات */}
            <div className="space-y-2 rounded-xl border bg-card p-3 text-xs">
              <div className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground">کیفیت جلسه</span>
                <Badge
                  variant="outline"
                  className={cn("gap-1 border px-2 py-0.5 text-[11px]", q?.className)}
                >
                  <Star className="h-3 w-3" />
                  {q?.label ?? meeting.quality}
                </Badge>
              </div>
              {meeting.company && (
                <div className="flex items-center justify-between gap-2">
                  <span className="text-muted-foreground">شرکت</span>
                  <span className="flex items-center gap-1 font-medium">
                    <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                    {meeting.company}
                  </span>
                </div>
              )}
              {meeting.customer && (
                <div className="flex items-center justify-between gap-2">
                  <span className="text-muted-foreground">عضو باشگاه</span>
                  <span className="font-medium text-teal-600 dark:text-teal-300">
                    {meeting.customer.name}
                  </span>
                </div>
              )}
              {meeting.createdBy && (
                <div className="flex items-center justify-between gap-2">
                  <span className="text-muted-foreground">ثبت‌کننده</span>
                  <span className="font-medium">{meeting.createdBy.fullName}</span>
                </div>
              )}
            </div>

            {meeting.notes && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground">توضیحات</p>
                <p className="mt-1 whitespace-pre-line rounded-lg bg-muted/60 p-3 text-xs leading-6">
                  {meeting.notes}
                </p>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function MeetingDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const createMeeting = useCreateMeeting();
  const { data: customers } = useCustomers();

  const [subject, setSubject] = React.useState("");
  const [date, setDate] = React.useState(todayInputValue());
  const [time, setTime] = React.useState("10:00");
  const [company, setCompany] = React.useState("");
  const [customerId, setCustomerId] = React.useState<string>("");
  const [notes, setNotes] = React.useState("");
  const [error, setError] = React.useState("");

  // هر بار باز شدن، فرم تمیز شود
  React.useEffect(() => {
    if (open) {
      setSubject("");
      setDate(todayInputValue());
      setTime("10:00");
      setCompany("");
      setCustomerId("");
      setNotes("");
      setError("");
    }
  }, [open]);

  const submit = () => {
    const trimmed = subject.trim();
    if (!trimmed) {
      setError("موضوع جلسه را بنویس");
      return;
    }
    const meetingDate = localNoon(date);
    if (!meetingDate) {
      setError("تاریخ جلسه را درست انتخاب کن");
      return;
    }
    createMeeting.mutate(
      {
        subject: trimmed,
        meetingDate: meetingDate.toISOString(),
        time,
        // (تسک ۵۱) فیلد کیفیت از فرم حذف شد — همان مقدار پیش‌فرض قبلی می‌رود تا قرارداد بک‌اند عوض نشود
        quality: "خوب",
        company: company.trim() || undefined,
        customerId: customerId || null,
        notes: notes.trim() || undefined,
      },
      {
        onSuccess: () => onOpenChange(false),
        onError: (e: Error) => setError(e.message),
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader className="text-right">
          <DialogTitle>برگزاری جلسه</DialogTitle>
          <DialogDescription>
            مشخصات جلسه را تکمیل کن — روز هفته خودکار از تاریخ ساخته می‌شود.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="meeting-subject">موضوع جلسه *</Label>
            <Input
              id="meeting-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="مثلاً جلسه با شرکت فلان درباره قرارداد"
              autoFocus
            />
          </div>

          {/* (تسک ۵۱ بخش ۳) تاریخ شمسی با تقویم جلالی — هر دو فیلد هم‌قواره و هم‌راستا:
              لیبل هم‌ارتفاع + کنترل h-9 یکسان؛ روز هفته داخل خودِ فیلد تاریخ دیده می‌شود */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="grid content-start gap-2">
              <Label htmlFor="meeting-date">تاریخ *</Label>
              <JalaliDatePicker
                id="meeting-date"
                value={date}
                onChange={setDate}
              />
            </div>
            <div className="grid content-start gap-2">
              <Label htmlFor="meeting-time">ساعت *</Label>
              <Input
                id="meeting-time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="meeting-company">نام شرکت</Label>
              <Input
                id="meeting-company"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="مثلاً آریا صنعت"
              />
            </div>
            <div className="grid gap-2">
              <Label>عضو باشگاه مشتریان</Label>
              <Select
                value={customerId}
                onValueChange={(v) => {
                  setCustomerId(v);
                  const c = (customers ?? []).find((x) => x.id === v);
                  if (c?.company) setCompany(c.company);
                }}
                dir="rtl"
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="بدون لینک" />
                </SelectTrigger>
                <SelectContent>
                  {(customers ?? []).map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                      {c.company ? ` (${c.company})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="meeting-notes">توضیحات</Label>
            <Textarea
              id="meeting-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="خلاصه‌ی جلسه، تصمیم‌ها، اقدام بعدی..."
              rows={3}
            />
          </div>

          {error && (
            <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-xs font-medium text-rose-600 dark:text-rose-300">
              {error}
            </p>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            انصراف
          </Button>
          <Button
            onClick={submit}
            disabled={createMeeting.isPending}
            className="bg-gradient-to-l from-teal-600 to-emerald-600 text-white"
          >
            {createMeeting.isPending ? "در حال ثبت..." : "ثبت جلسه"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
