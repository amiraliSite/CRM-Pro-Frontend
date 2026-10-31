"use client";

import * as React from "react";
import {
  Check,
  X,
  Send,
  ListChecks,
  Plus,
  Users,
  Printer,
  CalendarClock,
  LayoutTemplate,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useColleagues,
  useCreateTaskBatch,
  type TaskBatchRow,
} from "@/hooks/use-crm-data";
import { roleLabel } from "@/lib/crm/types";
import { toFaDigits } from "@/lib/crm/utils";
import { printSheet } from "@/lib/crm/print";
import { useCrmStore } from "@/lib/crm/store";

/** یک تسک داخل قالب — فقط عنوان + شرح + مدت زمان */
type RowDraft = {
  key: string;
  title: string;
  description: string;
  duration: string;
};

/**
 * یک قالب = برای یک نفر.
 * نام و نام خانوادگی + سمت + گیرنده یک بار بالای قالب نوشته می‌شود و
 * تسک‌هایش (فقط عنوان/شرح/مدت) زیرش اضافه می‌شوند.
 */
type TemplateDraft = {
  key: string;
  /** نام و نام خانوادگی شخص این قالب — اجباری */
  personName: string;
  /** سمت آن شخص — اختیاری */
  personPosition: string;
  /** گیرنده همه‌ی تسک‌های این قالب — خالی = پیش‌فرض (مسئول IT) */
  assigneeId: string;
  rows: RowDraft[];
};

const newRow = (): RowDraft => ({
  key: Math.random().toString(36).slice(2, 10),
  title: "",
  description: "",
  duration: "",
});

const newTemplate = (): TemplateDraft => ({
  key: Math.random().toString(36).slice(2, 10),
  personName: "",
  personPosition: "",
  assigneeId: "",
  rows: [newRow()],
});

/** ساعت زنده‌ی سیستم — تاریخ شمسی + ساعت با ثانیه */
const FA_CLOCK = new Intl.DateTimeFormat("fa-IR", {
  dateStyle: "full",
  timeStyle: "medium",
});

function useFaNow(): string {
  const [now, setNow] = React.useState("");
  React.useEffect(() => {
    const tick = () => setNow(FA_CLOCK.format(new Date()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

/**
 * تسک‌دهی (فقط مدیر شرکت / مدیر بخش):
 * چند قالب — هر قالب برای «یک نفر» است: نام و نام خانوادگی + سمت + گیرنده
 * یک بار بالای قالب، بعد هر چند عنوان خواستی با دکمه‌ی «افزودن عنوان» زیر همان
 * قالب اضافه می‌شود — هر عنوان فقط عنوان + شرح + مدت زمان دارد.
 * تاریخِ ثبت خودکار است — همان روز، همان ساعت، همان ثانیه‌ی ارسال.
 */
export function TaskAssignmentView() {
  const { data: colleagues, isLoading: colleaguesLoading } = useColleagues();
  const createBatch = useCreateTaskBatch();
  const { user: me } = useCrmStore();

  const [templates, setTemplates] = React.useState<TemplateDraft[]>([
    newTemplate(),
  ]);
  const [sendingKey, setSendingKey] = React.useState<string | null>(null);
  const [sentMsg, setSentMsg] = React.useState<string | null>(null);
  const [pendingFocus, setPendingFocus] = React.useState<string | null>(null);

  const faNow = useFaNow();

  // گیرنده پیش‌فرض = مسئول IT
  const itUser = React.useMemo(
    () => (colleagues ?? []).find((u) => u.role === "it") ?? null,
    [colleagues]
  );

  const updateTpl = (tKey: string, patch: Partial<TemplateDraft>) =>
    setTemplates((ts) =>
      ts.map((t) => (t.key === tKey ? { ...t, ...patch } : t))
    );

  const updateRow = (
    tKey: string,
    rKey: string,
    patch: Partial<RowDraft>
  ) =>
    setTemplates((ts) =>
      ts.map((t) =>
        t.key !== tKey
          ? t
          : {
              ...t,
              rows: t.rows.map((r) =>
                r.key === rKey ? { ...r, ...patch } : r
              ),
            }
      )
    );

  /** حذف یک تسک از قالب — اگر تنها تسک باشد، قالب یک ردیف خالی می‌گیرد */
  const removeRow = (tKey: string, rKey: string) => {
    setSentMsg(null);
    setTemplates((ts) =>
      ts.map((t) => {
        if (t.key !== tKey) return t;
        const rest = t.rows.filter((r) => r.key !== rKey);
        return { ...t, rows: rest.length ? rest : [newRow()] };
      })
    );
  };

  /** افزودن عنوان (تسک) جدید — درست زیر تسک‌های همان قالب، فقط عنوان/شرح/مدت */
  const addRow = (tKey: string) => {
    setSentMsg(null);
    const row = newRow();
    setTemplates((ts) =>
      ts.map((t) =>
        t.key !== tKey ? t : { ...t, rows: [...t.rows, row] }
      )
    );
    setPendingFocus(row.key);
  };

  React.useEffect(() => {
    if (!pendingFocus) return;
    const el = document.getElementById(`ta-title-${pendingFocus}`);
    if (el) {
      el.focus();
      setPendingFocus(null);
    }
  }, [pendingFocus, templates]);

  /** قالب جدید — یک بلوک جدا با وقتِ ثبت خودش */
  const addTemplate = () => {
    setSentMsg(null);
    setTemplates((ts) => [...ts, newTemplate()]);
  };

  /** حذف کل قالب (وقتی بیش از یک قالب باشد) */
  const removeTemplate = (tKey: string) => {
    setSentMsg(null);
    setTemplates((ts) =>
      ts.length <= 1 ? ts : ts.filter((t) => t.key !== tKey)
    );
  };

  const resolveAssignee = (t: TemplateDraft) =>
    t.assigneeId || itUser?.id || "";
  const allRowsCount = templates.reduce((n, t) => n + t.rows.length, 0);

  /** همه‌ی تسک‌های پرشده با قالبِ خودشان — برای پرینت */
  const filledItems = templates.flatMap((t, ti) =>
    t.rows
      .filter((r) => r.title.trim())
      .map((r) => ({ t, r, ti }))
  );
  const filledCount = filledItems.length;

  /** تسک‌های پرشده‌ی «یک» قالب */
  const tplFilledRows = (t: TemplateDraft) =>
    t.rows.filter((r) => r.title.trim());
  /** آمادگی ارسال «یک» قالب: حداقل یک عنوان پر + نام و نام خانوادگی + گیرنده */
  const tplReady = (t: TemplateDraft) =>
    tplFilledRows(t).length > 0 &&
    !!t.personName.trim() &&
    !!resolveAssignee(t);

  /** ارسال «همین یک قالب» — همه‌ی تسک‌هایش با یک کلیک، یک‌جا (یک بچ) برای
   *  گیرنده‌ی همان قالب می‌رود؛ قالب‌های دیگر دست‌نخورده می‌مانند.
   *  تاریخ فرستاده نمی‌شود — سرور همان روز/ساعت/ثانیه‌ی ارسال را ثبت می‌کند. */
  const sendTemplate = (tpl: TemplateDraft) => {
    if (sendingKey || createBatch.isPending) return;
    const rows = tplFilledRows(tpl);
    const assigneeId = resolveAssignee(tpl);
    if (!rows.length || !tpl.personName.trim() || !assigneeId) return;
    setSentMsg(null);
    setSendingKey(tpl.key);
    const items: TaskBatchRow[] = rows.map((r) => ({
      title: r.title.trim(),
      description: r.description.trim() || undefined,
      personName: tpl.personName.trim(),
      personPosition: tpl.personPosition.trim() || undefined,
      durationMinutes: r.duration ? Number(r.duration) : null,
      assigneeId,
    }));
    createBatch.mutate(
      { items },
      {
        onSuccess: (res) => {
          setSendingKey(null);
          setSentMsg(
            `قالب «${tpl.personName.trim()}» با ${toFaDigits(res.count)} تسک یک‌جا برای گیرنده‌اش ارسال شد.`
          );
          // قالبِ ارسال‌شده حذف می‌شود؛ بقیه‌ی قالب‌ها سرِ جایشان می‌مانند
          setTemplates((ts) => {
            const rest = ts.filter((t) => t.key !== tpl.key);
            return rest.length ? rest : [newTemplate()];
          });
        },
        onSettled: () => setSendingKey(null),
      }
    );
  };

  const assigneeName = (id: string) =>
    (colleagues ?? []).find((u) => u.id === id)?.fullName ?? "—";

  /** پرینت همه‌ی تسک‌های همه‌ی قالب‌ها — فقط مدیران این صفحه را می‌بینند */
  const handlePrint = () => {
    if (!filledCount) return;
    printSheet({
      title: "برگه تخصیص تسک‌ها",
      subtitle: `تعداد قالب‌ها: ${toFaDigits(templates.length)} — تعداد تسک‌ها: ${toFaDigits(filledCount)}`,
      issuedBy: me?.fullName,
      columns: [
        { header: "#", width: "5%" },
        { header: "قالب", width: "8%" },
        { header: "عنوان تسک", width: "16%" },
        { header: "نام و سمت", width: "17%" },
        { header: "گیرنده", width: "13%" },
        { header: "مدت (دقیقه)", width: "9%" },
        { header: "شرح تسک", width: "32%" },
      ],
      rows: filledItems.map(({ t, r, ti }, i) => [
        toFaDigits(i + 1),
        toFaDigits(ti + 1),
        r.title.trim() || "—",
        t.personName.trim()
          ? t.personPosition.trim()
            ? `${t.personName.trim()} — ${t.personPosition.trim()}`
            : t.personName.trim()
          : "—",
        assigneeName(resolveAssignee(t)),
        r.duration ? toFaDigits(r.duration) : "—",
        r.description.trim() || "—",
      ]),
      signatures: ["امضای مدیر", "امضای گیرنده"],
    });
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold">تسک‌دهی</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          هر قالب برای «یک نفر» است — نام و نام خانوادگی، سمت و گیرنده را
          <span className="font-medium"> یک بار بالای قالب </span>
          بنویس؛ بعد هر چند عنوان خواستی با دکمه‌ی «افزودن عنوان» زیر همان
          قالب اضافه کن — هر عنوان فقط عنوان + شرح + مدت زمان دارد. هر قالب
          دکمه‌ی «ارسال این قالب» خودش را دارد: با یک کلیک، کل قالب با همه‌ی
          تسک‌هایش یک‌جا برای گیرنده‌ی همان قالب می‌رود. تاریخِ ثبت خودکار است
          — همان روز، همان ساعت، همان ثانیه‌ی ارسال.
        </p>
      </div>

      {/* گیرنده پیش‌فرض + تاریخ خودکار */}
      <Card className="border-sky-500/25 bg-sky-500/5 py-0">
        <CardContent className="flex flex-wrap items-center gap-3 p-4">
          <Users className="h-5 w-5 shrink-0 text-sky-600 dark:text-sky-400" />
          {colleaguesLoading ? (
            <Skeleton className="h-5 w-40" />
          ) : itUser ? (
            <p className="text-sm">
              گیرنده پیش‌فرض:{" "}
              <span className="font-bold">{itUser.fullName}</span>
              <span className="mr-2 text-xs text-muted-foreground">
                (مسئول IT — اگر برای قالبی گیرنده انتخاب نکنی، همه‌ی تسک‌های
                همان قالب برای او می‌رود و او می‌تواند بین همکاران توزیع کند)
              </span>
            </p>
          ) : (
            <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
              کاربر «مسئول IT» پیدا نشد — برای هر قالب دستی گیرنده انتخاب کن یا
              اول از بخش کاربران مسئول IT را اضافه کن.
            </p>
          )}
          <span className="mr-auto inline-flex items-center gap-1.5 rounded-full bg-sky-500/10 px-2.5 py-1 text-[11px] font-medium text-sky-700 dark:text-sky-300">
            <CalendarClock className="h-3.5 w-3.5" />
            تاریخ ثبت: خودکار
          </span>
        </CardContent>
      </Card>

      {/* هدر بخش قالب‌ها */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 text-sm font-bold">
          <ListChecks className="h-4 w-4 text-teal-600 dark:text-teal-400" />
          قالب‌های تسک
          <Badge variant="outline" className="text-[10px]">
            {toFaDigits(templates.length)} قالب • {toFaDigits(allRowsCount)} تسک
          </Badge>
        </h3>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            disabled={filledCount === 0}
            className="h-8 gap-1.5 border-sky-500/40 bg-sky-500/10 px-3 text-xs text-sky-700 hover:bg-sky-500/20 dark:text-sky-300"
          >
            <Printer className="h-3.5 w-3.5" />
            پرینت قالب‌ها
          </Button>
          <span className="text-xs text-muted-foreground">
            هر قالب دکمه‌ی ارسال خودش را دارد — کل قالب یک‌جا می‌رود
          </span>
        </div>
      </div>

      {/* قالب‌ها — هر کدام برای یک نفر */}
      {templates.map((tpl, ti) => (
        <Card
          key={tpl.key}
          className="crm-fade-up border-teal-500/30 py-0 shadow-sm shadow-teal-500/5"
        >
          <CardContent className="space-y-4 p-4 sm:p-5">
            {/* هدر قالب — اسم قالب + وقتِ ثبت خودکار + حذف قالب */}
            <div className="flex flex-wrap items-center gap-2 border-b border-teal-500/20 pb-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-teal-500/15 text-xs font-bold text-teal-700 dark:text-teal-300">
                <LayoutTemplate className="h-4 w-4" />
              </span>
              <span className="text-sm font-bold text-teal-700 dark:text-teal-300">
                قالب {toFaDigits(ti + 1)}
              </span>
              <Badge variant="outline" className="text-[10px]">
                {toFaDigits(tpl.rows.length)} تسک
              </Badge>
              {/* وقتِ ثبت این قالب — خودکار، همان ثانیه */}
              <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-500/10 px-2.5 py-1 text-[11px] font-medium text-sky-700 dark:text-sky-300">
                <CalendarClock className="h-3 w-3" />
                <span className="tabular-nums">{faNow || "..."}</span>
              </span>
              {/* ارسال همین قالب — همه‌ی تسک‌هایش یک‌جا، جدا از قالب‌های دیگر */}
              <Button
                size="sm"
                onClick={() => sendTemplate(tpl)}
                disabled={!tplReady(tpl) || createBatch.isPending}
                title={
                  tplFilledRows(tpl).length === 0
                    ? "اول حداقل یک عنوان در همین قالب پر کن"
                    : tplReady(tpl)
                      ? "همه‌ی تسک‌های همین قالب یک‌جا برای گیرنده‌اش ارسال می‌شود"
                      : !tpl.personName.trim()
                        ? "نام و نام خانوادگی این قالب را بنویس"
                        : "گیرنده را انتخاب کن"
                }
                className="mr-auto h-8 gap-1.5 bg-gradient-to-l from-teal-600 to-emerald-600 px-3 text-xs text-white shadow-sm shadow-teal-500/20"
              >
                {sendingKey === tpl.key ? (
                  "در حال ارسال..."
                ) : (
                  <>
                    <Send className="h-3.5 w-3.5" />
                    ارسال این قالب
                    {tplFilledRows(tpl).length > 0
                      ? ` (${toFaDigits(tplFilledRows(tpl).length)} تسک)`
                      : ""}
                  </>
                )}
              </Button>
              {templates.length > 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeTemplate(tpl.key)}
                  aria-label="حذف این قالب"
                  className="mr-auto h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* اطلاعات شخص این قالب — یک بار، بالای فرم */}
            <div className="grid gap-3 rounded-xl border border-teal-500/20 bg-teal-500/5 p-3 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor={`ta-name-${tpl.key}`}>
                  نام و نام خانوادگی *
                </Label>
                <Input
                  id={`ta-name-${tpl.key}`}
                  value={tpl.personName}
                  onChange={(e) =>
                    updateTpl(tpl.key, { personName: e.target.value })
                  }
                  placeholder="مثلاً: علی رضایی"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`ta-pos-${tpl.key}`}>سمت</Label>
                <Input
                  id={`ta-pos-${tpl.key}`}
                  value={tpl.personPosition}
                  onChange={(e) =>
                    updateTpl(tpl.key, { personPosition: e.target.value })
                  }
                  placeholder="مثلاً: کارشناس فروش (اختیاری)"
                />
              </div>
              <div className="space-y-1.5">
                <Label
                  htmlFor={`ta-assignee-${tpl.key}`}
                  className="text-muted-foreground"
                >
                  گیرنده تسک‌های این قالب
                </Label>
                <Select
                  value={resolveAssignee(tpl)}
                  onValueChange={(v) => updateTpl(tpl.key, { assigneeId: v })}
                >
                  <SelectTrigger
                    id={`ta-assignee-${tpl.key}`}
                    className="bg-background text-xs"
                  >
                    <SelectValue placeholder="انتخاب گیرنده..." />
                  </SelectTrigger>
                  <SelectContent>
                    {(colleagues ?? []).map((u) => (
                      <SelectItem key={u.id} value={u.id} className="text-xs">
                        {u.fullName}
                        <span className="mr-1 text-[10px] text-muted-foreground">
                          ({roleLabel(u.role)})
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {tplFilledRows(tpl).length > 0 && !tpl.personName.trim() && (
                <p className="text-[11px] font-medium text-amber-600 dark:text-amber-400 sm:col-span-3">
                  برای ارسال این قالب، «نام و نام خانوادگی» را بالای همین قالب بنویس (سمت اختیاری است).
                </p>
              )}
              {tplFilledRows(tpl).length > 0 &&
                !!tpl.personName.trim() &&
                !resolveAssignee(tpl) && (
                  <p className="text-[11px] font-medium text-amber-600 dark:text-amber-400 sm:col-span-3">
                    برای ارسال این قالب، «گیرنده» را انتخاب کن.
                  </p>
                )}
              <p className="text-[11px] text-muted-foreground sm:col-span-3">
                این قالب برای یک نفر ثبت می‌شود — اسم، سمت و گیرنده همین یک بار
                نوشته می‌شود و روی همه‌ی تسک‌های زیر اعمال می‌شود؛ با دکمه‌ی
                «ارسال این قالب» همه‌ی تسک‌هایش یک‌جا می‌رود، نه جدا جدا.
              </p>
            </div>

            {/* تسک‌های این قالب — فقط عنوان + شرح + مدت، زیر هم */}
            <div className="space-y-3">
              {tpl.rows.map((r, ri) => (
                <div
                  key={r.key}
                  className="space-y-3 rounded-xl border bg-muted/20 p-3 sm:p-4"
                >
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal-500/15 text-[11px] font-bold text-teal-700 dark:text-teal-300">
                      {toFaDigits(ri + 1)}
                    </span>
                    <span className="text-xs font-medium text-muted-foreground">
                      عنوان {toFaDigits(ri + 1)}
                    </span>
                    {tpl.rows.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeRow(tpl.key, r.key)}
                        aria-label="حذف این عنوان"
                        className="mr-auto h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label htmlFor={`ta-title-${r.key}`}>عنوان تسک *</Label>
                      <Input
                        id={`ta-title-${r.key}`}
                        value={r.title}
                        onChange={(e) =>
                          updateRow(tpl.key, r.key, { title: e.target.value })
                        }
                        placeholder="مثلاً: رفع خطای سرور چت"
                      />
                    </div>
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label htmlFor={`ta-desc-${r.key}`}>شرح تسک</Label>
                      <Textarea
                        id={`ta-desc-${r.key}`}
                        rows={2}
                        value={r.description}
                        onChange={(e) =>
                          updateRow(tpl.key, r.key, {
                            description: e.target.value,
                          })
                        }
                        placeholder="شرح کاری که باید انجام شود..."
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor={`ta-dur-${r.key}`}>
                        مدت زمان (دقیقه)
                      </Label>
                      <Input
                        id={`ta-dur-${r.key}`}
                        type="number"
                        min="1"
                        value={r.duration}
                        onChange={(e) =>
                          updateRow(tpl.key, r.key, {
                            duration: e.target.value,
                          })
                        }
                        placeholder="مثلاً: ۹۰"
                      />
                    </div>
                  </div>
                </div>
              ))}

              {/* افزودن عنوان جدید — فقط عنوان + شرح + مدت، زیر همین قالب */}
              <button
                type="button"
                onClick={() => addRow(tpl.key)}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-teal-600/40 py-3 text-sm font-medium text-teal-700 transition-colors hover:bg-teal-500/5 dark:text-teal-300"
              >
                <Plus className="h-4 w-4" />
                افزودن عنوان در همین قالب
              </button>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* افزودن قالب جدید — بلوک جدا (برای یک نفر دیگر) با وقتِ خودش */}
      <button
        type="button"
        onClick={addTemplate}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-violet-500/50 py-3.5 text-sm font-bold text-violet-700 transition-colors hover:bg-violet-500/5 dark:text-violet-300"
      >
        <LayoutTemplate className="h-4 w-4" />
        افزودن قالب جدید
        <span className="text-xs font-normal text-muted-foreground">
          (برای یک نفر دیگر — با وقتِ ثبت خودش)
        </span>
      </button>

      {sentMsg !== null && (
        <Card className="border-teal-500/25 bg-teal-500/5 py-0">
          <CardContent className="flex items-center gap-3 p-4">
            <Check className="h-5 w-5 shrink-0 text-teal-600 dark:text-teal-400" />
            <p className="text-sm">{sentMsg}</p>
          </CardContent>
        </Card>
      )}

      {/* نکته‌ی ریز پایین صفحه (خواسته‌ی مدیر) */}
      <p className="text-[11px] leading-5 text-muted-foreground">
        نکته: تسک‌های انجام‌شده هر روز پرسنل به‌صورت خودکار در یک قالب گزارش کار
        به‌صورت پی‌دی‌اف ذخیره و قابل دانلود می‌باشد.
      </p>
    </div>
  );
}
