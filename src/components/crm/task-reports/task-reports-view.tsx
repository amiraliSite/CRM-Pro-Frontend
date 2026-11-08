"use client";

import * as React from "react";
import {
  CheckCircle2,
  Circle,
  Clock,
  Inbox,
  AlertTriangle,
  CalendarCheck,
  CalendarX2,
  Printer,
  Eye,
  X,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/crm/shared/empty-state";
import { useTasks, useColleagues } from "@/hooks/use-crm-data";
import { useCrmStore, usePermissions } from "@/lib/crm/store";
import {
  TASK_STATUS,
  ROLE_LABELS,
  type Task,
  type TaskStatus,
  type StaffRole,
} from "@/lib/crm/types";
import {
  avatarColor,
  daysUntil,
  formatFaDate,
  getInitials,
  toFaDigits,
} from "@/lib/crm/utils";
import { printSheet } from "@/lib/crm/print";
import { cn } from "@/lib/utils";

const STATUS_DOT: Record<TaskStatus, string> = {
  open: "bg-slate-400",
  in_progress: "bg-amber-500",
  done: "bg-teal-500",
};

type EmployeeReport = {
  id: string;
  name: string;
  color: string;
  role?: string;
  tasks: Task[];
  todayTasks: Task[];
  todayDone: number;
};

/** آیا این تسک امروز ثبت شده است؟ (تاریخ ثبت = dueDate خودکار سرور) */
function isToday(iso: string | null | undefined): boolean {
  if (!iso) return false;
  const d = new Date(iso);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

/**
 * آیا این تسک واقعاً کارِ خودِ IT است؟ (خواسته‌ی مدیر — تسک ۳۹ و ۴۳)
 * معیار: «سمت» ردیف در تسک‌دهی. فقط اگر سمتِ شخص IT باشد (مسئول IT / کارشناس IT)
 * کار در باکس گزارشِ خودِ IT حساب می‌شود؛ تسک‌هایی که فقط برای توزیع از دستش رد
 * می‌شوند (سمتِ غیر-IT) کارِ او نیستند و بعد از توزیع زیر کارتِ همان همکار می‌آیند.
 * سمتِ خالی مثل قبل کارِ خودش حساب می‌شود (تا کارهای بدون سمت گم نشوند).
 */
function isItOwnWork(t: Task): boolean {
  const pos = (t.personPosition ?? "").replace(/\u200c/g, " ").trim();
  if (!pos) return true;
  const tokens = pos
    .toLowerCase()
    .split(/[^a-z0-9\u0600-\u06FF]+/)
    .filter(Boolean);
  return tokens.some(
    (w) => w === "it" || w === "ایتی" || w === "آیتی" || w === "ایت"
  );
}

/**
 * گزارش تسک‌ها — برای هر کارمند یک باکس: چه کارهایی انجام شده / نشده.
 * بالای صفحه: وضعیت «امروز» هر نفر — تسک‌های امروزش را انجام داده یا نه.
 * مدیر: همه همکاران | مسئول IT: خودش + همکارانی که به آن‌ها توزیع کرده.
 * (تسک ۴۳) کارِ در حال عبور (سمتِ غیر-IT روی دستِ مسئول IT) برای «هیچ»
 * بیننده‌ای در باکسِ IT ثبت نمی‌شود — نه برای خود IT، نه برای مدیریت؛
 * بعد از توزیع، رونوشتش زیر کارتِ گیرنده‌ی واقعی می‌نشیند.
 * (تسک ۴۳) هر باکس دکمه‌ی «مشاهده» دارد (پاپ‌آپ جزئیات کامل) و مدیریت
 * می‌تواند کل گزارش را با «پرینت گزارش» روی A4 رسمی چاپ کند.
 */
export function TaskReportsView() {
  const { isLeader, canForwardTasks } = usePermissions();
  const { user: me } = useCrmStore();
  const { data: tasks, isLoading } = useTasks();
  const { data: colleagues } = useColleagues();
  const [detailEmp, setDetailEmp] = React.useState<EmployeeReport | null>(null);

  const reports = React.useMemo<EmployeeReport[]>(() => {
    const map = new Map<string, EmployeeReport>();
    const roleOf = (id: string | null | undefined) =>
      (colleagues ?? []).find((c) => c.id === id)?.role;
    for (const t of tasks ?? []) {
      // خواسته‌ی مدیر (تسک ۳۹ + ۴۳): تسکی که سمتِش غیر-IT است و روی دستِ
      // مسئول IT نشسته فقط «در حال عبور» است — در باکسِ IT برای هیچ‌کس
      // (نه خودش، نه مدیریت) ثبت نمی‌شود؛ رونوشتِ توزیع‌شده جای اصلی را می‌گیرد.
      if (roleOf(t.assigneeId) === "it" && !isItOwnWork(t)) continue;
      const key = t.assignee?.id ?? t.assigneeId ?? "unassigned";
      const known = (colleagues ?? []).find((c) => c.id === key);
      const entry = map.get(key) ?? {
        id: key,
        name: t.assignee?.fullName ?? known?.fullName ?? "بدون مسئول مشخص",
        color: t.assignee?.color ?? known?.color ?? avatarColor(key),
        role: known?.role,
        tasks: [],
        todayTasks: [],
        todayDone: 0,
      };
      entry.tasks.push(t);
      if (isToday(t.dueDate)) {
        entry.todayTasks.push(t);
        if (t.status === "done") entry.todayDone += 1;
      }
      map.set(key, entry);
    }
    const list = [...map.values()];
    // کسانی که امروز تسک دارند اول — بعد بقیه
    return list.sort((a, b) => {
      if (a.todayTasks.length !== b.todayTasks.length)
        return b.todayTasks.length - a.todayTasks.length;
      return b.tasks.length - a.tasks.length;
    });
  }, [tasks, colleagues]);

  const todayPeople = reports.filter((r) => r.todayTasks.length > 0);

  /** شمسی‌سازی وضعیت برای چاپ و پاپ‌آپ */
  const statusLabel = (t: Task) =>
    TASK_STATUS[t.status as TaskStatus]?.label ?? t.status;

  /** چاپ رسمی A4 گزارش — خلاصه‌ی نفرات + جزئیات هر تسک (تسک ۴۳) */
  const printReport = () => {
    const summaryRows = reports.map((emp) => {
      const done = emp.tasks.filter((t) => t.status === "done").length;
      const notDone = emp.tasks.length - done;
      const todayState =
        emp.todayTasks.length === 0
          ? "—"
          : emp.todayDone === emp.todayTasks.length
            ? "انجام داد"
            : emp.todayDone === 0
              ? "نداده"
              : "در جریان";
      return [
        emp.name,
        toFaDigits(emp.todayTasks.length),
        toFaDigits(emp.todayDone),
        toFaDigits(emp.tasks.length),
        toFaDigits(done),
        toFaDigits(notDone),
        todayState,
      ];
    });
    const detailRows = reports.flatMap((emp) =>
      emp.tasks.map((t) => [
        emp.name,
        t.title,
        t.personPosition || "—",
        statusLabel(t),
        t.dueDate ? formatFaDate(t.dueDate) : "—",
        t.durationMinutes ? `${toFaDigits(t.durationMinutes)} دقیقه` : "—",
      ])
    );
    printSheet({
      title: "گزارش تسک‌ها",
      subtitle: `تعداد نفرات: ${toFaDigits(reports.length)} — تعداد تسک‌ها: ${toFaDigits(
        reports.reduce((s, e) => s + e.tasks.length, 0)
      )}`,
      issuedBy: me?.fullName,
      signatures: ["امضای مدیریت", "امضای گیرنده"],
      sections: [
        {
          heading: "خلاصه وضعیت نفرات",
          columns: [
            { header: "نفر", width: "24%" },
            { header: "تسک امروز" },
            { header: "انجام‌شده امروز" },
            { header: "کل تسک" },
            { header: "انجام‌شده" },
            { header: "انجام‌نشده" },
            { header: "وضعیت امروز" },
          ],
          rows: summaryRows,
        },
        {
          heading: "جزئیات تسک‌ها",
          columns: [
            { header: "نفر", width: "16%" },
            { header: "عنوان تسک", width: "30%" },
            { header: "سمت" },
            { header: "وضعیت" },
            { header: "تاریخ ثبت" },
            { header: "مدت" },
          ],
          rows: detailRows,
        },
      ],
    });
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">گزارش تسک‌ها</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {isLeader
              ? "برای هر همکار یک باکس — چه تسک‌هایی انجام شده و چه تسک‌هایی انجام نشده + وضعیت امروز هر نفر."
              : canForwardTasks
                ? "گزارش کارهای IT خودت و همکارانی که تسک‌ها را برایشان توزیع کرده‌ای — تسک‌هایی که فقط برای توزیع به دستت رسیده (سمتِ غیر-IT) کارِ تو حساب نمی‌شوند."
                : "فقط گزارش تسک‌های خودت اینجاست — گزارش بقیه‌ی همکاران را فقط مدیریت می‌بیند."}
          </p>
        </div>
        {/* پرینت رسمی گزارش — خواسته‌ی مدیر (تسک ۴۳) */}
        {isLeader && reports.length > 0 && (
          <Button
            onClick={printReport}
            className="gap-2 bg-gradient-to-l from-teal-600 to-emerald-600 text-white"
          >
            <Printer className="h-4 w-4" />
            پرینت گزارش
          </Button>
        )}
      </div>

      {/* وضعیت امروز — هر کس تسک‌های امروزش را انجام داده یا نه */}
      {!isLoading && todayPeople.length > 0 && (
        <Card className="border-teal-500/25 bg-teal-500/5 py-0">
          <CardContent className="p-4">
            <h3 className="flex items-center gap-2 text-sm font-bold">
              <CalendarCheck className="h-4 w-4 text-teal-600 dark:text-teal-400" />
              امروز — وضعیت انجام هر نفر
              <Badge variant="outline" className="text-[10px]">
                {toFaDigits(todayPeople.length)} نفر
              </Badge>
            </h3>
            <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {todayPeople.map((emp) => {
                const allDone =
                  emp.todayDone === emp.todayTasks.length;
                const noneDone = emp.todayDone === 0;
                return (
                  <div
                    key={emp.id}
                    className={cn(
                      "flex items-center gap-2.5 rounded-xl border bg-background p-2.5",
                      allDone
                        ? "border-teal-500/40"
                        : noneDone
                          ? "border-rose-500/40"
                          : "border-amber-500/40"
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white",
                        emp.color
                      )}
                    >
                      {getInitials(emp.name)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-bold">{emp.name}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {toFaDigits(emp.todayDone)} از{" "}
                        {toFaDigits(emp.todayTasks.length)} تسک امروز
                      </p>
                    </div>
                    {allDone ? (
                      <Badge className="gap-1 border-0 bg-teal-500 text-[10px] text-white hover:bg-teal-500">
                        <CheckCircle2 className="h-3 w-3" />
                        انجام داد
                      </Badge>
                    ) : noneDone ? (
                      <Badge className="gap-1 border-0 bg-rose-500 text-[10px] text-white hover:bg-rose-500">
                        <CalendarX2 className="h-3 w-3" />
                        نداده
                      </Badge>
                    ) : (
                      <Badge className="gap-1 border-0 bg-amber-500 text-[10px] text-white hover:bg-amber-500">
                        <Clock className="h-3 w-3" />
                        در جریان
                      </Badge>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="grid gap-3 md:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </div>
      ) : reports.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="هنوز تسکی ثبت نشده"
          description={
            isLeader
              ? "از صفحه تسک‌دهی چند رکورد برای همکاران بفرست تا گزارش اینجا ساخته شود."
              : "وقتی تسکی برایت ارسال یا توزیع شود، گزارشش اینجا نمایش داده می‌شود."
          }
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {reports.map((emp, i) => {
            const done = emp.tasks.filter((t) => t.status === "done").length;
            const inProgress = emp.tasks.filter(
              (t) => t.status === "in_progress"
            ).length;
            const open = emp.tasks.filter((t) => t.status === "open").length;
            const isMe = emp.id === me?.id;
            const allTodayDone =
              emp.todayTasks.length > 0 &&
              emp.todayDone === emp.todayTasks.length;
            return (
              <Card
                key={emp.id}
                className={cn(
                  "crm-fade-up py-0",
                  emp.todayTasks.length > 0 &&
                    (allTodayDone
                      ? "border-teal-500/50"
                      : emp.todayDone === 0
                        ? "border-rose-500/50"
                        : "border-amber-500/50")
                )}
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <CardContent className="p-4">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span
                      className={cn(
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white",
                        emp.color
                      )}
                    >
                      {getInitials(emp.name)}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold">
                        {emp.name}
                        {isMe && (
                          <span className="mr-1.5 text-[10px] font-medium text-teal-600 dark:text-teal-400">
                            (خودم)
                          </span>
                        )}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {toFaDigits(emp.tasks.length)} تسک کل
                        {emp.todayTasks.length > 0 &&
                          ` • امروز ${toFaDigits(emp.todayTasks.length)} تسک`}
                      </p>
                    </div>
                    <div className="mr-auto flex flex-wrap items-center gap-1">
                      {/* مشاهده‌ی سریع گزارش این نفر — پاپ‌آپ جزئیات (تسک ۴۳) */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDetailEmp(emp)}
                        title="مشاهده‌ی کامل گزارش این نفر"
                        className="h-7 gap-1 border-sky-500/40 bg-sky-500/10 px-2 text-[11px] text-sky-700 hover:bg-sky-500/20 dark:text-sky-300"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        مشاهده
                      </Button>
                      {emp.todayTasks.length > 0 && (
                        <Badge
                          variant="outline"
                          className={cn(
                            "gap-1 text-[10px]",
                            allTodayDone
                              ? "border-teal-500/30 bg-teal-500/10 text-teal-700 dark:text-teal-300"
                              : "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300"
                          )}
                        >
                          <CalendarCheck className="h-3 w-3" />
                          {allTodayDone ? "امروز کامل" : "امروز ناتمام"}
                        </Badge>
                      )}
                      <Badge
                        variant="outline"
                        className="gap-1 border-teal-500/30 bg-teal-500/10 text-[10px] text-teal-700 dark:text-teal-300"
                      >
                        <CheckCircle2 className="h-3 w-3" />
                        {toFaDigits(done)} انجام شد
                      </Badge>
                      <Badge
                        variant="outline"
                        className="gap-1 border-rose-500/30 bg-rose-500/10 text-[10px] text-rose-700 dark:text-rose-300"
                      >
                        <Circle className="h-3 w-3" />
                        {toFaDigits(open + inProgress)} انجام نشده
                      </Badge>
                    </div>
                  </div>

                  <ul className="mt-3 max-h-56 space-y-1.5 overflow-y-auto pl-1">
                    {emp.tasks.map((t) => {
                      const days = daysUntil(t.dueDate);
                      const overdue =
                        days !== null && days < 0 && t.status !== "done";
                      const today = isToday(t.dueDate);
                      return (
                        <li
                          key={t.id}
                          className={cn(
                            "flex items-center gap-2 rounded-lg px-2.5 py-1.5",
                            today ? "bg-teal-500/10 ring-1 ring-teal-500/25" : "bg-muted/40"
                          )}
                        >
                          {t.status === "done" ? (
                            <CheckCircle2 className="h-4 w-4 shrink-0 text-teal-500" />
                          ) : t.status === "in_progress" ? (
                            <Clock className="h-4 w-4 shrink-0 text-amber-500" />
                          ) : (
                            <Circle className="h-4 w-4 shrink-0 text-slate-400" />
                          )}
                          <span
                            className={cn(
                              "min-w-0 flex-1 truncate text-xs",
                              t.status === "done" &&
                                "text-muted-foreground line-through"
                            )}
                          >
                            {t.title}
                          </span>
                          {today && (
                            <Badge
                              variant="outline"
                              className="shrink-0 border-0 bg-teal-500/15 px-1.5 text-[9px] text-teal-700 dark:text-teal-300"
                            >
                              امروز
                            </Badge>
                          )}
                          {t.durationMinutes ? (
                            <span className="shrink-0 text-[9px] text-muted-foreground">
                              {toFaDigits(t.durationMinutes)} دقیقه
                            </span>
                          ) : null}
                          {t.dueDate && (
                            <span
                              className={cn(
                                "flex shrink-0 items-center gap-0.5 text-[9px]",
                                overdue ? "text-rose-500" : "text-muted-foreground"
                              )}
                            >
                              {overdue && <AlertTriangle className="h-3 w-3" />}
                              {formatFaDate(t.dueDate)}
                            </span>
                          )}
                          <span
                            className={cn(
                              "h-1.5 w-1.5 shrink-0 rounded-full",
                              STATUS_DOT[t.status as TaskStatus]
                            )}
                            title={TASK_STATUS[t.status as TaskStatus].label}
                          />
                        </li>
                      );
                    })}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {canForwardTasks && (
        <p className="text-xs text-muted-foreground">
          نکته: برای تغییر وضعیت یا توزیع تسک‌ها به صفحه «تسک‌ها» برو.
        </p>
      )}

      {/* پاپ‌آپ مشاهده‌ی گزارش یک نفر — لیست کامل با شرح و جزئیات (تسک ۴۳) */}
      <Dialog
        open={!!detailEmp}
        onOpenChange={(o) => !o && setDetailEmp(null)}
      >
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
          {detailEmp && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <span
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white",
                      detailEmp.color
                    )}
                  >
                    {getInitials(detailEmp.name)}
                  </span>
                  گزارش {detailEmp.name}
                  {detailEmp.role && (
                    <Badge variant="outline" className="text-[10px]">
                      {ROLE_LABELS[detailEmp.role as StaffRole] ??
                        detailEmp.role}
                    </Badge>
                  )}
                </DialogTitle>
                <DialogDescription>
                  همه‌ی تسک‌های ثبت‌شده برای این نفر — با شرح کامل، سمت، تاریخ و
                  مدت هر کار.
                </DialogDescription>
              </DialogHeader>

              <div className="flex flex-wrap gap-1.5">
                <Badge
                  variant="outline"
                  className="gap-1 border-teal-500/30 bg-teal-500/10 text-[10px] text-teal-700 dark:text-teal-300"
                >
                  <CheckCircle2 className="h-3 w-3" />
                  {toFaDigits(detailEmp.tasks.filter((t) => t.status === "done").length)}{" "}
                  انجام شد
                </Badge>
                <Badge
                  variant="outline"
                  className="gap-1 border-rose-500/30 bg-rose-500/10 text-[10px] text-rose-700 dark:text-rose-300"
                >
                  <Circle className="h-3 w-3" />
                  {toFaDigits(
                    detailEmp.tasks.filter((t) => t.status !== "done").length
                  )}{" "}
                  انجام نشده
                </Badge>
                {detailEmp.todayTasks.length > 0 && (
                  <Badge
                    variant="outline"
                    className="gap-1 border-amber-500/30 bg-amber-500/10 text-[10px] text-amber-700 dark:text-amber-300"
                  >
                    <CalendarCheck className="h-3 w-3" />
                    امروز {toFaDigits(detailEmp.todayDone)} از{" "}
                    {toFaDigits(detailEmp.todayTasks.length)}
                  </Badge>
                )}
              </div>

              <div className="space-y-2.5">
                {detailEmp.tasks.map((t) => {
                  const days = daysUntil(t.dueDate);
                  const overdue =
                    days !== null && days < 0 && t.status !== "done";
                  const today = isToday(t.dueDate);
                  return (
                    <div
                      key={t.id}
                      className={cn(
                        "rounded-xl border bg-background p-3",
                        today && "border-teal-500/40 bg-teal-500/5",
                        t.status === "done" && "opacity-70"
                      )}
                    >
                      <div className="flex flex-wrap items-center gap-1.5">
                        {t.status === "done" ? (
                          <CheckCircle2 className="h-4 w-4 shrink-0 text-teal-500" />
                        ) : t.status === "in_progress" ? (
                          <Clock className="h-4 w-4 shrink-0 text-amber-500" />
                        ) : (
                          <Circle className="h-4 w-4 shrink-0 text-slate-400" />
                        )}
                        <p
                          className={cn(
                            "min-w-0 flex-1 text-sm font-semibold",
                            t.status === "done" &&
                              "text-muted-foreground line-through"
                          )}
                        >
                          {t.title}
                        </p>
                        <Badge
                          variant="outline"
                          className="shrink-0 text-[10px]"
                        >
                          {statusLabel(t)}
                        </Badge>
                        {today && (
                          <Badge className="shrink-0 border-0 bg-teal-500 text-[9px] text-white hover:bg-teal-500">
                            امروز
                          </Badge>
                        )}
                      </div>
                      {t.personName && (
                        <p className="mt-1.5 text-[11px] text-muted-foreground">
                          شخص: {t.personName}
                          {t.personPosition ? ` — ${t.personPosition}` : ""}
                        </p>
                      )}
                      {t.description && (
                        <p className="mt-1 whitespace-pre-line text-xs leading-6 text-muted-foreground">
                          {t.description}
                        </p>
                      )}
                      {t.details && (
                        <p className="mt-1 whitespace-pre-line rounded-lg bg-muted/50 p-2 text-xs leading-6 text-muted-foreground">
                          {t.details}
                        </p>
                      )}
                      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-muted-foreground">
                        {t.dueDate && (
                          <span
                            className={cn(
                              "flex items-center gap-1",
                              overdue && "font-medium text-rose-500"
                            )}
                          >
                            {overdue && <AlertTriangle className="h-3 w-3" />}
                            ثبت: {formatFaDate(t.dueDate)}
                          </span>
                        )}
                        {t.durationMinutes ? (
                          <span>{toFaDigits(t.durationMinutes)} دقیقه</span>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>

              <Button
                variant="outline"
                onClick={() => setDetailEmp(null)}
                className="w-full gap-1.5"
              >
                <X className="h-4 w-4" />
                بستن
              </Button>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
