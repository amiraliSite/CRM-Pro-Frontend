"use client";

import * as React from "react";
import {
  CheckCircle2,
  Circle,
  Clock,
  Plus,
  Trash2,
  AlertTriangle,
  ClipboardList,
  ChevronDown,
  UserCheck,
  UserRound,
  Send,
  Inbox,
  Printer,
  Pencil,
  Eye,
  Layers,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "@/components/crm/shared/empty-state";
import { TaskFormFields } from "@/components/crm/tasks/task-form-fields";
import {
  useTasks,
  useCreateTask,
  useUpdateTask,
  useDeleteTask,
  useForwardTask,
  useForwardTaskBatch,
  useColleagues,
  type TaskInput,
} from "@/hooks/use-crm-data";
import {
  TASK_PRIORITY,
  TASK_STATUS,
  roleLabel,
  type Task,
  type TaskPriority,
  type TaskStatus,
} from "@/lib/crm/types";
import {
  avatarColor,
  daysUntil,
  formatFaDate,
  formatFaDateTime,
  getInitials,
  toFaDigits,
} from "@/lib/crm/utils";
import { printSheet } from "@/lib/crm/print";
import { useCrmStore, usePermissions } from "@/lib/crm/store";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const STATUS_DOT: Record<TaskStatus, string> = {
  open: "bg-slate-400",
  in_progress: "bg-amber-500",
  done: "bg-teal-500",
};

/** «گزارش کارها» — باکس گزارش تمام کارهای تاریخ‌خورده؛ برای مدیریت و هر گیرنده‌ی تسک. */
function DailyWorkReport({
  tasks,
  onDetails,
}: {
  tasks: Task[];
  onDetails: (t: Task) => void;
}) {
  const [open, setOpen] = React.useState(true);
  const byEmployee = new Map<string, { name: string; color: string; days: Map<string, Task[]> }>();
  for (const t of tasks) {
    if (!t.dueDate) continue;
    const key = t.assignee?.id ?? t.assigneeId ?? "unassigned";
    const name = t.assignee?.fullName ?? "بدون مسئول مشخص";
    const entry = byEmployee.get(key) ?? {
      name,
      color: t.assignee?.color ?? avatarColor(key),
      days: new Map(),
    };
    const day = formatFaDate(t.dueDate);
    entry.days.set(day, [...(entry.days.get(day) ?? []), t]);
    byEmployee.set(key, entry);
  }
  const people = [...byEmployee.entries()].slice(0, 12);

  return (
    <Card className="border-teal-500/25 bg-teal-500/5 py-0">
      <CardContent className="p-4">
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex w-full items-center gap-2"
          aria-expanded={open}
        >
          <ClipboardList className="h-5 w-5 text-teal-600 dark:text-teal-400" />
          <h3 className="text-sm font-bold">گزارش کارها</h3>
          <Badge variant="outline" className="border-teal-500/30 bg-teal-500/10 text-[10px] text-teal-700 dark:text-teal-300">
            {toFaDigits(tasks.length)} کار با تاریخ ثبت
          </Badge>
          <ChevronDown
            className={cn(
              "mr-auto h-4 w-4 text-muted-foreground transition-transform",
              open && "rotate-180"
            )}
          />
        </button>

        {open && (
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {people.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                هنوز وظیفه‌ای با تاریخ ثبت نشده — با ثبت وظیفه، کارهای روزانه هر نفر اینجا دسته‌بندی می‌شود.
              </p>
            ) : (
              people.map(([id, emp]) => (
                <div key={id} className="rounded-xl border bg-background p-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold text-white",
                        emp.color
                      )}
                    >
                      {getInitials(emp.name)}
                    </span>
                    <p className="text-xs font-semibold">{emp.name}</p>
                    <Badge variant="outline" className="mr-auto border-0 bg-muted px-1.5 text-[10px] text-muted-foreground">
                      {toFaDigits([...emp.days.values()].flat().length)} کار
                    </Badge>
                  </div>
                  <div className="mt-2.5 space-y-2">
                    {[...emp.days.entries()].map(([day, dayTasks]) => (
                      <div key={day}>
                        <p className="text-[10px] font-medium text-muted-foreground">{day}</p>
                        <ul className="mt-1 space-y-1">
                          {dayTasks.map((t) => (
                            <li key={t.id} className="flex items-center gap-1.5 text-[11px]">
                              <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", STATUS_DOT[t.status as TaskStatus])} />
                              <span className={cn("truncate", t.status === "done" && "line-through text-muted-foreground")}>
                                {t.title}
                              </span>
                              {t.durationMinutes ? (
                                <span className="shrink-0 text-[9px] text-muted-foreground">
                                  {toFaDigits(t.durationMinutes)} دقیقه
                                </span>
                              ) : null}
                              <button
                                onClick={() => onDetails(t)}
                                className="mr-auto inline-flex shrink-0 items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[9px] font-medium text-teal-700 transition-colors hover:bg-teal-500/10 dark:text-teal-300"
                                aria-label="مشاهده جزئیات"
                              >
                                <Eye className="h-3 w-3" />
                                مشاهده جزئیات
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/** بلوک «قالب تسک» — تسک‌های هم‌قالب (batchId مشترک) یک‌جا زیر هم نمایش داده می‌شوند؛
 *  با یک دکمه‌ی «ارسال قالب» کل قالب یک‌جا برای فرد مورد نظر فرستاده می‌شود */
function BatchTaskBlock({
  tasks,
  renderRow,
  canForward,
  onForward,
  forwardedToName,
}: {
  tasks: Task[];
  renderRow: (t: Task) => React.ReactNode;
  canForward?: boolean;
  onForward?: () => void;
  /** اگر قالب یک‌بار ارسال شده باشد: نام گیرنده برای بج «ارسال شد» (تسک ۴۳) */
  forwardedToName?: string | null;
}) {
  const [open, setOpen] = React.useState(true);
  const first = tasks[0];
  const totalMin = tasks.reduce((s, t) => s + (t.durationMinutes ?? 0), 0);
  const doneCount = tasks.filter((t) => t.status === "done").length;
  const overdue = tasks.some((t) => {
    const d = daysUntil(t.dueDate);
    return d !== null && d < 0 && t.status !== "done";
  });
  const person = first?.personName
    ? `${first.personName}${first.personPosition ? ` — ${first.personPosition}` : ""}`
    : null;
  const assigneeNames = [
    ...new Set(tasks.map((t) => t.assignee?.fullName).filter(Boolean)),
  ] as string[];

  return (
    <Card
      className={cn(
        "crm-fade-up border-teal-500/30 py-0 shadow-sm transition-all hover:shadow-md",
        overdue && "border-rose-500/40"
      )}
    >
      <CardContent className="p-0">
        <div className="flex w-full flex-wrap items-center gap-2 border-b border-teal-500/20 bg-teal-500/5 p-4 text-right">
          <button
            onClick={() => setOpen((o) => !o)}
            className="flex min-w-0 flex-1 flex-wrap items-center gap-2 text-right"
            aria-expanded={open}
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal-500/15 text-teal-600 dark:text-teal-300">
              <Layers className="h-4 w-4" />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-bold text-teal-800 dark:text-teal-200">
                قالب تسک
              </span>
              {person && (
                <span className="mt-0.5 flex items-center gap-1 truncate text-[11px] text-muted-foreground">
                  <UserRound className="h-3 w-3 shrink-0" />
                  {person}
                </span>
              )}
            </span>
            <Badge
              variant="outline"
              className="shrink-0 border-teal-500/30 bg-teal-500/10 text-[10px] text-teal-700 dark:text-teal-300"
            >
              {toFaDigits(tasks.length)} تسک
              {doneCount > 0 ? ` • ${toFaDigits(doneCount)} انجام‌شده` : ""}
            </Badge>
            {totalMin > 0 && (
              <Badge variant="outline" className="shrink-0 text-[10px]">
                جمع مدت: {toFaDigits(totalMin)} دقیقه
              </Badge>
            )}
            {assigneeNames.length > 0 && (
              <Badge variant="outline" className="shrink-0 bg-muted text-[10px]">
                گیرنده: {assigneeNames.join("، ")}
              </Badge>
            )}
            {/* بج «ارسال شد» — قالب یک‌بار توزیع شده و دکمه‌ی ارسال دیگر ندارد (تسک ۴۳) */}
            {forwardedToName && (
              <Badge
                variant="outline"
                className="shrink-0 gap-1 border-sky-500/30 bg-sky-500/10 text-[10px] font-medium text-sky-700 dark:text-sky-300"
              >
                <Send className="h-3 w-3" />
                ارسال شد به {forwardedToName}
              </Badge>
            )}
            {first?.dueDate && (
              <Badge
                variant="outline"
                className="hidden shrink-0 text-[10px] sm:inline-flex"
              >
                ثبت: {formatFaDate(first.dueDate)}
              </Badge>
            )}
          </button>
          {/* ارسال کل قالب — همه‌ی تسک‌های قالب با یک کلیک برای فرد مورد نظر */}
          {canForward && onForward && tasks.length > 0 && (
            <Button
              size="sm"
              onClick={onForward}
              title="همه‌ی تسک‌های این قالب یک‌جا برای فرد مورد نظر ارسال می‌شود"
              className="h-8 shrink-0 gap-1.5 bg-gradient-to-l from-teal-600 to-emerald-600 px-3 text-xs text-white shadow-sm shadow-teal-500/20"
            >
              <Send className="h-3.5 w-3.5" />
              ارسال قالب ({toFaDigits(tasks.length)} تسک)
            </Button>
          )}
          <button
            onClick={() => setOpen((o) => !o)}
            aria-label="باز و بسته کردن قالب"
            className="shrink-0"
          >
            <ChevronDown
              className={cn(
                "h-4 w-4 text-muted-foreground transition-transform",
                open && "rotate-180"
              )}
            />
          </button>
        </div>
        {open && (
          <div className="divide-y">
            {tasks.map((t) => (
              <div key={t.id} className="px-4 py-3">
                {renderRow(t)}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/** «مشاهده جزئیات» — پاپ‌آپ گزارش کامل یک کار ثبت‌شده (برای مدیریت و هر گیرنده) */
function TaskDetailsDialog({
  task,
  onClose,
}: {
  task: Task | null;
  onClose: () => void;
}) {
  const pr = task ? TASK_PRIORITY[task.priority as TaskPriority] : null;
  return (
    <Dialog open={!!task} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-teal-500" />
            مشاهده جزئیات کار
          </DialogTitle>
          <DialogDescription>
            گزارش کامل کار ثبت‌شده با تاریخ دقیق — فقط برای مشاهده است.
          </DialogDescription>
        </DialogHeader>

        {task && (
          <div className="space-y-4">
            <div className="rounded-xl border bg-muted/40 p-3">
              <p className="text-sm font-bold leading-6">{task.title}</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <Badge variant="outline" className={cn("text-[10px]", pr?.className)}>
                  {pr?.label}
                </Badge>
                <Badge variant="outline" className="bg-muted text-[10px]">
                  {TASK_STATUS[task.status as TaskStatus]?.label}
                </Badge>
                {task.durationMinutes ? (
                  <Badge
                    variant="outline"
                    className="border-teal-500/30 bg-teal-500/10 text-[10px] text-teal-700 dark:text-teal-300"
                  >
                    مدت: {toFaDigits(task.durationMinutes)} دقیقه
                  </Badge>
                ) : null}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>شرح تسک</Label>
              <p className="whitespace-pre-wrap rounded-lg border bg-background p-3 text-xs leading-6 text-muted-foreground">
                {task.description || "بدون شرح"}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-2 text-xs sm:grid-cols-2">
              <div className="rounded-lg border p-2.5">
                <p className="text-[10px] text-muted-foreground">نام و سمت شخص</p>
                <p className="mt-0.5 font-semibold">
                  {task.personName
                    ? `${task.personName}${task.personPosition ? ` — ${task.personPosition}` : ""}`
                    : "—"}
                </p>
              </div>
              <div className="rounded-lg border p-2.5">
                <p className="text-[10px] text-muted-foreground">گیرنده‌ی تسک</p>
                <p className="mt-0.5 flex items-center gap-1.5 font-semibold">
                  {task.assignee ? (
                    <>
                      <span className={cn("h-2 w-2 rounded-full", task.assignee.color)} />
                      {task.assignee.fullName}
                    </>
                  ) : (
                    "—"
                  )}
                </p>
              </div>
              <div className="rounded-lg border p-2.5">
                <p className="text-[10px] text-muted-foreground">ثبت‌کننده</p>
                <p className="mt-0.5 font-semibold">{task.createdBy?.fullName ?? "—"}</p>
              </div>
              <div className="rounded-lg border p-2.5">
                <p className="text-[10px] text-muted-foreground">تاریخ ثبت (خودکار)</p>
                <p className="mt-0.5 font-semibold">
                  {task.dueDate ? formatFaDateTime(task.dueDate) : "—"}
                </p>
              </div>
              {task.customer && (
                <div className="rounded-lg border p-2.5 sm:col-span-2">
                  <p className="text-[10px] text-muted-foreground">مشتری مرتبط</p>
                  <p className="mt-0.5 font-semibold">{task.customer.name}</p>
                </div>
              )}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            بستن
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function TasksView() {
  const { canCreateTasks, canForwardTasks, isLeader, canEditTasks } =
    usePermissions();
  const { user: me } = useCrmStore();
  const [status, setStatus] = React.useState("");
  const [addOpen, setAddOpen] = React.useState(false);
  const [forwardTask, setForwardTask] = React.useState<Task | null>(null);
  const [forwardBatchTasks, setForwardBatchTasks] = React.useState<Task[] | null>(null);
  const [editTask, setEditTask] = React.useState<Task | null>(null);
  const [detailsTask, setDetailsTask] = React.useState<Task | null>(null);
  const { data: tasks, isLoading } = useTasks(status || undefined);
  const { data: colleagues } = useColleagues();
  /** نام گیرنده‌ی ارسالِ قبلی — برای بج «ارسال شد به X» (تسک ۴۳) */
  const forwardedToName = React.useCallback(
    (id?: string | null) =>
      id ? (colleagues ?? []).find((c) => c.id === id)?.fullName ?? null : null,
    [colleagues]
  );
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();

  /** محدودیت اساسی: فقط گیرنده‌ی تسک یا مدیریت می‌تواند وضعیت را عوض کند
   *  (مسئول IT هم برای تسک‌های دریافتی خودش — نه محتوای دیگران) */
  const canCycle = (t: Task) => isLeader || t.assigneeId === me?.id;

  const counts = {
    open: (tasks ?? []).filter((t) => t.status === "open").length,
    in_progress: (tasks ?? []).filter((t) => t.status === "in_progress").length,
    done: (tasks ?? []).filter((t) => t.status === "done").length,
  };

  /** تغییر وضعیت با انتخاب از منوی دایره — فقط گیرنده‌ی تسک یا مدیریت */
  const changeStatus = (t: Task, next: TaskStatus) => {
    if (next === t.status) return;
    updateTask.mutate(
      { id: t.id, data: { status: next } },
      {
        onSuccess: () =>
          toast({
            title: "وضعیت تسک عوض شد",
            description: `«${t.title}» — ${TASK_STATUS[next].label}`,
          }),
      }
    );
  };

  const isOverdue = (t: Task) => {
    const d = daysUntil(t.dueDate);
    return d !== null && d < 0 && t.status !== "done";
  };

  const statusIcon = (t: Task, size = "h-6 w-6") =>
    t.status === "done" ? (
      <CheckCircle2 className={cn(size, "text-teal-500")} />
    ) : t.status === "in_progress" ? (
      <Clock className={cn(size, "text-amber-500")} />
    ) : (
      <Circle className={cn(size, "text-muted-foreground/50")} />
    );

  /** محتوای یک ردیف تسک — هم در کارت تکی و هم داخل بلوک «قالب تسک»؛
   *  داخل قالب دکمه‌ی ارسالِ تکیِ ردیف حذف شده — ارسال فقط برای کل قالب است */
  const renderTaskInner = (t: Task, inBatch = false) => {
    const pr = TASK_PRIORITY[t.priority as TaskPriority];
    const days = daysUntil(t.dueDate);
    const overdue = isOverdue(t);
    const isDone = t.status === "done";
    const receivedFromBoss = !isLeader && !!t.createdBy && t.assigneeId === me?.id;
    // قفل فوروارد مجدد (تسک ۴۳) — تسک/قالبی که یک‌بار ارسال شده دیگر قابل ارسال نیست
    const canForwardThis =
      canForwardTasks && t.assigneeId === me?.id && !inBatch && !t.forwardedAt;
    return (
      <div className="flex items-center gap-3">
        {/* دایره‌ی وضعیت — کاربر کلیک می‌کند و وضعیت را انتخاب می‌کند */}
        {canCycle(t) ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                aria-label="تغییر وضعیت تسک — کلیک کن و وضعیت را انتخاب کن"
                title="کلیک کن و وضعیت را انتخاب کن"
                className="shrink-0 cursor-pointer rounded-full transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2"
              >
                {statusIcon(t)}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuLabel className="text-[10px] font-normal text-muted-foreground">
                وضعیت این تسک را انتخاب کن
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {(Object.keys(TASK_STATUS) as TaskStatus[]).map((key) => (
                <DropdownMenuItem
                  key={key}
                  onClick={() => changeStatus(t, key)}
                  className="gap-2 text-xs"
                >
                  {key === t.status ? (
                    <CheckCircle2 className="h-4 w-4 text-teal-500" />
                  ) : (
                    <Circle className="h-4 w-4 text-muted-foreground/40" />
                  )}
                  <span
                    className={cn(
                      key === t.status && "font-bold text-teal-700 dark:text-teal-300"
                    )}
                  >
                    {TASK_STATUS[key].label}
                  </span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <span
            title="فقط گیرنده‌ی تسک یا مدیریت می‌تواند وضعیت را عوض کند"
            className="shrink-0 cursor-not-allowed"
          >
            {statusIcon(t)}
          </span>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p
              className={cn(
                "truncate text-sm font-semibold",
                isDone && "line-through text-muted-foreground"
              )}
            >
              {t.title}
            </p>
            {t.assignee && (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                <span
                  className={cn(
                    "h-1.5 w-1.5 rounded-full",
                    t.assignee.color
                  )}
                />
                {t.assignee.fullName}
              </span>
            )}
            {t.personName && (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-sky-500/10 px-1.5 py-0.5 text-[10px] font-medium text-sky-700 dark:text-sky-300">
                <UserRound className="h-3 w-3" />
                {t.personName}
                {t.personPosition ? ` — ${t.personPosition}` : ""}
              </span>
            )}
          </div>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {t.customer ? (
              <span className="inline-flex items-center gap-1">
                <span
                  className={cn(
                    "inline-block h-2 w-2 rounded-full",
                    avatarColor(t.customer.id)
                  )}
                />
                {t.customer.name}
                {" • "}
              </span>
            ) : null}
            {t.description || "بدون توضیح"}
          </p>
          {(receivedFromBoss || (canForwardTasks && !!t.createdBy)) && (
            <p className="mt-1 inline-flex items-center gap-1 rounded-full bg-teal-500/10 px-1.5 py-0.5 text-[10px] text-teal-700 dark:text-teal-300">
              <UserCheck className="h-3 w-3" />
              {t.assigneeId === me?.id
                ? `دریافتی از ${t.createdBy?.fullName ?? "مدیریت"}`
                : `ارسال‌شده به ${t.assignee?.fullName ?? "کارمند"}`}
            </p>
          )}
          {/* بج «ارسال شد» — این تسک یک‌بار ارسال شده و دیگر قابل ارسال مجدد نیست (تسک ۴۳) */}
          {canForwardTasks && t.forwardedAt && (
            <p className="mt-1 inline-flex items-center gap-1 rounded-full bg-sky-500/10 px-1.5 py-0.5 text-[10px] font-medium text-sky-700 dark:text-sky-300">
              <Send className="h-3 w-3" />
              {forwardedToName(t.forwardedToId)
                ? `ارسال شد به ${forwardedToName(t.forwardedToId)} — تسکِ او شد`
                : "ارسال شد — دیگر قابل ارسال مجدد نیست"}
            </p>
          )}
        </div>

        <div className="flex shrink-0 flex-col items-end gap-1.5 sm:flex-row sm:items-center sm:gap-2">
          {t.dueDate && (
            <span
              className={cn(
                "flex items-center gap-1 text-xs font-medium",
                overdue
                  ? "text-rose-500"
                  : days !== null && days <= 2 && !isDone
                    ? "text-amber-500"
                    : "text-muted-foreground"
              )}
            >
              {overdue && <AlertTriangle className="h-3.5 w-3.5" />}
              {formatFaDate(t.dueDate)}
            </span>
          )}
          <Badge variant="outline" className={cn("text-[10px]", pr.className)}>
            {pr.label}
          </Badge>
          {t.durationMinutes ? (
            <Badge
              variant="outline"
              className="hidden text-[10px] border-teal-500/30 bg-teal-500/10 text-teal-700 dark:text-teal-300 sm:inline-flex"
            >
              {toFaDigits(t.durationMinutes)} دقیقه
            </Badge>
          ) : null}
          <Badge
            variant="outline"
            className="hidden text-[10px] bg-muted sm:inline-flex"
          >
            {TASK_STATUS[t.status as TaskStatus].label}
          </Badge>
          {canForwardThis && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setForwardTask(t)}
              className="h-8 gap-1.5 border-teal-500/40 bg-teal-500/10 px-2.5 text-xs text-teal-700 hover:bg-teal-500/20 dark:text-teal-300"
            >
              <Send className="h-3.5 w-3.5" />
              ارسال
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDetailsTask(t)}
            aria-label="مشاهده جزئیات تسک"
            title="مشاهده جزئیات این تسک"
            className="h-8 gap-1.5 px-2.5 text-xs text-muted-foreground hover:bg-sky-500/10 hover:text-sky-600"
          >
            <Eye className="h-3.5 w-3.5" />
            مشاهده
          </Button>
          {canEditTasks && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setEditTask(t)}
              aria-label="ویرایش تسک"
              className="h-8 w-8 text-muted-foreground hover:text-teal-600"
            >
              <Pencil className="h-4 w-4" />
            </Button>
          )}
          {canCreateTasks && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => deleteTask.mutate(t.id)}
              aria-label="حذف تسک"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    );
  };

  const list = tasks ?? [];

  /**
   * گروه‌بندی: تسک‌های هم‌قالب (batchId مشترک) یک بلوک می‌شوند + کارت‌های تکی.
   * بعد همه بر اساس تاریخِ ثبت مرتب می‌شوند — «جدیدترین‌ها بالای لیست» می‌آیند،
   * نه پایین؛ آخرین قالبی که برای گیرنده (مثل مسئول IT) ارسال شده، اول دیده می‌شود.
   */
  const seenBatches = new Set<string>();
  const items: { key: string; date: number; node: React.ReactNode }[] = [];
  list.forEach((t, i) => {
    if (t.batchId) {
      if (seenBatches.has(t.batchId)) return;
      seenBatches.add(t.batchId);
      const group = list.filter((x) => x.batchId === t.batchId);
      items.push({
        key: `batch-${t.batchId}`,
        date: new Date(group[0]?.dueDate ?? group[0]?.createdAt ?? 0).getTime(),
        node: (
          <BatchTaskBlock
            key={`batch-${t.batchId}`}
            tasks={group}
            renderRow={(x) => renderTaskInner(x, true)}
            forwardedToName={
              group.every((x) => x.forwardedAt)
                ? forwardedToName(group[0]?.forwardedToId)
                : null
            }
            canForward={
              isLeader ||
              (canForwardTasks &&
                group.every((x) => x.assigneeId === me?.id) &&
                // قفل فوروارد مجدد (تسک ۴۳) — قالبِ ارسال‌شده دیگر دکمه ندارد
                group.every((x) => !x.forwardedAt))
            }
            onForward={() => setForwardBatchTasks(group)}
          />
        ),
      });
    } else {
      items.push({
        key: t.id,
        date: new Date(t.dueDate ?? t.createdAt ?? 0).getTime(),
        node: (
          <Card
            key={t.id}
            className={cn(
              "crm-fade-up py-0 transition-all hover:shadow-md",
              isOverdue(t) && "border-rose-500/40",
              t.status === "done" && "opacity-65"
            )}
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <CardContent className="p-4">{renderTaskInner(t)}</CardContent>
          </Card>
        ),
      });
    }
  });
  items.sort((a, b) => b.date - a.date);
  const listNodes = items.map((it) => it.node);

  /** پرینت لیست تسک‌ها — فقط مسئول IT (مسئول و مدیر، نه کارمندان عادی) */
  const handlePrintTasks = () => {
    const list = tasks ?? [];
    if (!list.length) return;
    printSheet({
      title: "لیست تسک‌ها",
      subtitle: `تعداد تسک‌ها: ${toFaDigits(list.length)}`,
      issuedBy: me?.fullName,
      columns: [
        { header: "#", width: "4%" },
        { header: "عنوان", width: "16%" },
        { header: "شرح تسک", width: "20%" },
        { header: "نام و سمت", width: "14%" },
        { header: "گیرنده", width: "12%" },
        { header: "تاریخ", width: "10%" },
        { header: "مدت (دقیقه)", width: "8%" },
        { header: "وضعیت", width: "16%" },
      ],
      rows: list.map((t, i) => [
        toFaDigits(i + 1),
        t.title,
        t.description || "—",
        t.personName
          ? t.personPosition
            ? `${t.personName} — ${t.personPosition}`
            : t.personName
          : "—",
        t.assignee?.fullName ?? "—",
        t.dueDate ? formatFaDate(t.dueDate) : "—",
        t.durationMinutes ? toFaDigits(t.durationMinutes) : "—",
        TASK_STATUS[t.status as TaskStatus]?.label ?? "—",
      ]),
      signatures: ["امضای مسئول", "امضای مدیر"],
    });
  };

  const subtitle = canCreateTasks
    ? "تسک جدید بساز و برای گیرنده بفرست — با کلیک روی دایره، وضعیت عوض می‌شود"
    : canForwardTasks
      ? "تسک‌های دریافتی از مدیریت — هر قالب یک‌جا با همه‌ی تسک‌هایش نمایش داده می‌شود"
      : "تسک‌های ارسالی برای تو — با کلیک روی دایره، وضعیت را تغییر بده";

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">تسک‌ها</h2>
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        </div>
        {canCreateTasks && (
          <Button
            onClick={() => setAddOpen(true)}
            className="gap-2 bg-gradient-to-l from-teal-600 to-emerald-600 text-white"
          >
            <Plus className="h-4 w-4" />
            تسک جدید
          </Button>
        )}
        {canForwardTasks && !isLoading && (tasks ?? []).length > 0 && (
          <Button
            variant="outline"
            onClick={handlePrintTasks}
            className="gap-2 border-teal-500/40 bg-teal-500/10 text-teal-700 hover:bg-teal-500/20 dark:text-teal-300"
          >
            <Printer className="h-4 w-4" />
            پرینت تسک‌ها
          </Button>
        )}
      </div>

      <Tabs value={status} onValueChange={setStatus} className="w-fit">
        <TabsList>
          <TabsTrigger value="">همه</TabsTrigger>
          {(Object.keys(TASK_STATUS) as TaskStatus[]).map((key) => (
            <TabsTrigger key={key} value={key} className="gap-1.5">
              {TASK_STATUS[key].label}
              {!isLoading && (
                <span className="rounded-full bg-muted px-1.5 text-[10px]">
                  {toFaDigits(counts[key])}
                </span>
              )}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {!isLoading && (tasks ?? []).length > 0 && (
        <DailyWorkReport tasks={tasks ?? []} onDetails={(t) => setDetailsTask(t)} />
      )}

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : (tasks ?? []).length === 0 ? (
        <EmptyState
          icon={canForwardTasks ? Inbox : CheckCircle2}
          title={canForwardTasks ? "هنوز تسکی دریافت نکردی" : "تسکی نیست"}
          description={
            canForwardTasks
              ? "وقتی مدیریت شرکت تسکی برایت بفرستد، اینجا نمایش داده می‌شود."
              : "همه چیز مرتب است! اولین تسک را ثبت کنید."
          }
          action={
            canCreateTasks ? (
              <Button onClick={() => setAddOpen(true)} className="gap-2 bg-teal-600 hover:bg-teal-700">
                <Plus className="h-4 w-4" />
                تسک جدید
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-2.5">{listNodes}</div>
      )}

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>تسک جدید</DialogTitle>
            <DialogDescription>
              گیرنده، عنوان و شرح تسک را پر کن — تسک برای گیرنده انتخابی ارسال می‌شود.
            </DialogDescription>
          </DialogHeader>
          <TaskFormFieldsWrapper onDone={() => setAddOpen(false)} />
        </DialogContent>
      </Dialog>

      <ForwardDialog task={forwardTask} onClose={() => setForwardTask(null)} />

      {/* ارسال کل قالب — همه‌ی تسک‌های قالب یک‌جا برای فرد مورد نظر */}
      <ForwardBatchDialog
        tasks={forwardBatchTasks}
        onClose={() => setForwardBatchTasks(null)}
      />

      {/* ویرایش تسک — فقط مدیران و مسئول IT دکمه‌اش را می‌بینند */}
      <EditTaskDialog task={editTask} onClose={() => setEditTask(null)} />

      {/* «مشاهده جزئیات» — پاپ‌آپ گزارش کامل کار */}
      <TaskDetailsDialog task={detailsTask} onClose={() => setDetailsTask(null)} />
    </div>
  );
}

/** ویرایش محتوای تسک — admin/manager همه‌چیز، IT محتوای تسک‌های حوزه‌ی خودش */
function EditTaskDialog({ task, onClose }: { task: Task | null; onClose: () => void }) {
  const updateTask = useUpdateTask();
  const { data: colleagues } = useColleagues();
  const [form, setForm] = React.useState({
    title: "",
    personName: "",
    personPosition: "",
    description: "",
    duration: "",
    assigneeId: "",
    status: "open",
  });

  React.useEffect(() => {
    if (task) {
      setForm({
        title: task.title,
        personName: task.personName ?? "",
        personPosition: task.personPosition ?? "",
        description: task.description ?? "",
        duration: task.durationMinutes ? String(task.durationMinutes) : "",
        assigneeId: task.assigneeId ?? "",
        status: task.status,
      });
    }
  }, [task]);

  const save = () => {
    if (!task || !form.title.trim()) return;
    updateTask.mutate(
      {
        id: task.id,
        data: {
          title: form.title.trim(),
          personName: form.personName.trim() || undefined,
          personPosition: form.personPosition.trim() || undefined,
          description: form.description.trim() || undefined,
          durationMinutes: form.duration ? Number(form.duration) : null,
          assigneeId: form.assigneeId || undefined,
          status: form.status,
        },
      },
      {
        onSuccess: () => {
          toast({
            title: "تسک ویرایش شد",
            description: "تغییرات ذخیره و برای گیرنده اعمال شد.",
          });
          onClose();
        },
      }
    );
  };

  return (
    <Dialog open={!!task} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="h-5 w-5 text-teal-500" />
            ویرایش تسک
          </DialogTitle>
          <DialogDescription>
            فقط مدیر و مسئول اجازه‌ی ویرایش دارند — تاریخ ثبت خودکار است و دستی
            تغییر نمی‌کند.
          </DialogDescription>
        </DialogHeader>

        {task && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="ed-title">عنوان تسک *</Label>
              <Input
                id="ed-title"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="مثلاً: رفع خطای سرور چت"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ed-name">نام و نام خانوادگی</Label>
              <Input
                id="ed-name"
                value={form.personName}
                onChange={(e) =>
                  setForm((f) => ({ ...f, personName: e.target.value }))
                }
                placeholder="مثلاً: علی رضایی"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ed-position">سمت</Label>
              <Input
                id="ed-position"
                value={form.personPosition}
                onChange={(e) =>
                  setForm((f) => ({ ...f, personPosition: e.target.value }))
                }
                placeholder="مثلاً: کارشناس فروش (اختیاری)"
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="ed-desc">شرح تسک</Label>
              <Textarea
                id="ed-desc"
                rows={3}
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
                placeholder="شرح کامل کاری که باید انجام شود..."
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ed-duration">مدت زمان (دقیقه)</Label>
              <Input
                id="ed-duration"
                type="number"
                min="1"
                value={form.duration}
                onChange={(e) =>
                  setForm((f) => ({ ...f, duration: e.target.value }))
                }
                placeholder="مثلاً: ۹۰"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ed-status">وضعیت</Label>
              <Select
                value={form.status}
                onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}
              >
                <SelectTrigger id="ed-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(TASK_STATUS) as TaskStatus[]).map((key) => (
                    <SelectItem key={key} value={key}>
                      {TASK_STATUS[key].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="ed-assignee">گیرنده</Label>
              <Select
                value={form.assigneeId}
                onValueChange={(v) => setForm((f) => ({ ...f, assigneeId: v }))}
              >
                <SelectTrigger id="ed-assignee">
                  <SelectValue placeholder="انتخاب گیرنده..." />
                </SelectTrigger>
                <SelectContent>
                  {(colleagues ?? []).map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      <span className="inline-flex items-center gap-2">
                        <span
                          className={cn(
                            "inline-block h-2 w-2 rounded-full",
                            u.color
                          )}
                        />
                        {u.fullName}
                        <span className="text-[10px] text-muted-foreground">
                          ({roleLabel(u.role)})
                        </span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            انصراف
          </Button>
          <Button
            onClick={save}
            disabled={!form.title.trim() || updateTask.isPending}
            className="gap-2 bg-gradient-to-l from-teal-600 to-emerald-600 text-white"
          >
            <Pencil className="h-4 w-4" />
            {updateTask.isPending ? "در حال ذخیره..." : "ذخیره تغییرات"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** IT picks an employee and re-sends the received task (read-only copy). */
function ForwardDialog({ task, onClose }: { task: Task | null; onClose: () => void }) {
  const forwardTask = useForwardTask();
  const { data: colleagues } = useColleagues();
  const { user: me } = useCrmStore();
  const [targetId, setTargetId] = React.useState("");

  React.useEffect(() => {
    if (task) setTargetId("");
  }, [task]);

  const staff = (colleagues ?? []).filter((u) => u.id !== me?.id);

  const handleForward = () => {
    if (!task || !targetId) return;
    forwardTask.mutate(
      { sourceId: task.id, assigneeId: targetId },
      { onSuccess: () => onClose() }
    );
  };

  return (
    <Dialog open={!!task} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5 text-teal-500" />
            ارسال تسک برای کارمند
          </DialogTitle>
          <DialogDescription>
            متن تسک بدون تغییر برای کارمند انتخابی فرستاده می‌شود.
          </DialogDescription>
        </DialogHeader>

        {task && (
          <div className="space-y-4">
            <div className="rounded-xl border bg-muted/40 p-3">
              <p className="text-sm font-semibold">{task.title}</p>
              {task.description && (
                <p className="mt-1 text-xs leading-6 text-muted-foreground">
                  {task.description}
                </p>
              )}
              <div className="mt-2 flex flex-wrap gap-1.5">
                {task.dueDate && (
                  <Badge variant="outline" className="text-[10px]">
                    {formatFaDate(task.dueDate)}
                  </Badge>
                )}
                {task.durationMinutes ? (
                  <Badge variant="outline" className="text-[10px]">
                    {toFaDigits(task.durationMinutes)} دقیقه
                  </Badge>
                ) : null}
              </div>
            </div>

            <div className="space-y-2">
              <Label>کارمند گیرنده</Label>
              <Select value={targetId} onValueChange={setTargetId}>
                <SelectTrigger>
                  <SelectValue placeholder="اسم کارمند را انتخاب کن" />
                </SelectTrigger>
                <SelectContent>
                  {staff.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      <span className="inline-flex items-center gap-2">
                        <span className={cn("inline-block h-2 w-2 rounded-full", u.color)} />
                        {u.fullName}
                        <span className="text-[10px] text-muted-foreground">
                          ({roleLabel(u.role)})
                        </span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            انصراف
          </Button>
          <Button
            onClick={handleForward}
            disabled={!targetId || forwardTask.isPending}
            className="gap-2 bg-gradient-to-l from-teal-600 to-emerald-600 text-white"
          >
            <Send className="h-4 w-4" />
            ارسال تسک
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function TaskFormFieldsWrapper({ onDone }: { onDone: () => void }) {
  const createTask = useCreateTask();
  const handleSubmit = (data: TaskInput) => {
    createTask.mutate(data, { onSuccess: onDone });
  };
  return <TaskFormFields onSubmitData={handleSubmit} submitting={createTask.isPending} />;
}

/** ارسال کل قالب — همه‌ی تسک‌های قالب با یک کلیک برای «فرد مورد نظر» فرستاده
 *  می‌شود؛ گیرنده قالب را یکپارچه (همان ساختار قالب) با دکمه‌ی مشاهده می‌بیند. */
function ForwardBatchDialog({
  tasks,
  onClose,
}: {
  tasks: Task[] | null;
  onClose: () => void;
}) {
  const forwardBatch = useForwardTaskBatch();
  const { data: colleagues } = useColleagues();
  const { user: me } = useCrmStore();
  const [targetId, setTargetId] = React.useState("");

  const batchId = tasks?.[0]?.batchId ?? null;

  React.useEffect(() => {
    if (tasks) setTargetId("");
  }, [tasks]);

  const staff = (colleagues ?? []).filter((u) => u.id !== me?.id);
  const first = tasks?.[0];
  const person = first?.personName
    ? `${first.personName}${first.personPosition ? ` — ${first.personPosition}` : ""}`
    : null;
  const totalMin = (tasks ?? []).reduce((s, t) => s + (t.durationMinutes ?? 0), 0);

  const handleForward = () => {
    if (!batchId || !targetId) return;
    forwardBatch.mutate(
      { sourceBatchId: batchId, assigneeId: targetId },
      { onSuccess: () => onClose() }
    );
  };

  return (
    <Dialog open={!!tasks} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5 text-teal-500" />
            ارسال کل قالب برای فرد مورد نظر
          </DialogTitle>
          <DialogDescription>
            همه‌ی تسک‌های این قالب یک‌جا و بدون تغییر برای فرد انتخابی فرستاده
            می‌شود — گیرنده همان قالب را یکپارچه با دکمه‌ی مشاهده می‌بیند.
          </DialogDescription>
        </DialogHeader>

        {tasks && (
          <div className="space-y-4">
            <div className="rounded-xl border border-teal-500/25 bg-teal-500/5 p-3">
              <p className="flex items-center gap-1.5 text-sm font-semibold">
                <Layers className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                قالب تسک {person ? `— ${person}` : ""}
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <Badge
                  variant="outline"
                  className="border-teal-500/30 bg-teal-500/10 text-[10px] text-teal-700 dark:text-teal-300"
                >
                  {toFaDigits(tasks.length)} تسک
                </Badge>
                {totalMin > 0 && (
                  <Badge variant="outline" className="text-[10px]">
                    جمع مدت: {toFaDigits(totalMin)} دقیقه
                  </Badge>
                )}
                {first?.dueDate && (
                  <Badge variant="outline" className="text-[10px]">
                    ثبت: {formatFaDate(first.dueDate)}
                  </Badge>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>فرد مورد نظر (گیرنده‌ی کل قالب)</Label>
              <Select value={targetId} onValueChange={setTargetId}>
                <SelectTrigger>
                  <SelectValue placeholder="اسم فرد مورد نظر را انتخاب کن" />
                </SelectTrigger>
                <SelectContent>
                  {staff.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      <span className="inline-flex items-center gap-2">
                        <span className={cn("inline-block h-2 w-2 rounded-full", u.color)} />
                        {u.fullName}
                        <span className="text-[10px] text-muted-foreground">
                          ({roleLabel(u.role)})
                        </span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            انصراف
          </Button>
          <Button
            onClick={handleForward}
            disabled={!targetId || forwardBatch.isPending}
            className="gap-2 bg-gradient-to-l from-teal-600 to-emerald-600 text-white"
          >
            <Send className="h-4 w-4" />
            {forwardBatch.isPending
              ? "در حال ارسال..."
              : `ارسال کل قالب${tasks ? ` (${toFaDigits(tasks.length)} تسک)` : ""}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
