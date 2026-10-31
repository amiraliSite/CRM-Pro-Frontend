"use client";

import * as React from "react";
import { Bell, AlertTriangle, CalendarClock, CalendarDays } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTasks } from "@/hooks/use-crm-data";
import { useCrmStore, usePermissions, type CrmView } from "@/lib/crm/store";
import { cn } from "@/lib/utils";
import { formatFaDate } from "@/lib/crm/utils";
import type { Task } from "@/lib/crm/types";

/** Header reminder bell — surfaces overdue / due-today / due-tomorrow tasks. */
export function NotificationsBell() {
  const { data: tasks } = useTasks();
  const setView = useCrmStore((s) => s.setView);
  const { isLeader } = usePermissions();
  // مدیریت که منوی «تسک‌ها» ندارد (تسک ۳۸) — کلیک اعلان‌هایش می‌رود به «گزارش تسک‌ها»؛
  // گیرنده‌ها (IT/کارمند) همان‌طور به تابلوی تسک‌های خودشان می‌روند.
  const taskTarget: CrmView = isLeader ? "task-reports" : "tasks";

  const groups = React.useMemo(() => {
    const open = (tasks ?? []).filter((t) => t.status !== "done");
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const day = 24 * 60 * 60 * 1000;

    const startOfTomorrow = new Date(startOfToday.getTime() + day);
    const startOfAfterTomorrow = new Date(startOfToday.getTime() + 2 * day);

    const byDue = (t: Task) => (t.dueDate ? new Date(t.dueDate).getTime() : null);

    const overdue = open
      .filter((t) => {
        const d = byDue(t);
        return d !== null && d < startOfToday.getTime();
      })
      .sort((a, b) => (byDue(a) ?? 0) - (byDue(b) ?? 0));
    const today = open
      .filter((t) => {
        const d = byDue(t);
        return d !== null && d >= startOfToday.getTime() && d < startOfTomorrow.getTime();
      })
      .sort((a, b) => (byDue(a) ?? 0) - (byDue(b) ?? 0));
    const tomorrow = open
      .filter((t) => {
        const d = byDue(t);
        return (
          d !== null && d >= startOfTomorrow.getTime() && d < startOfAfterTomorrow.getTime()
        );
      })
      .sort((a, b) => (byDue(a) ?? 0) - (byDue(b) ?? 0));

    return { open, overdue, today, tomorrow };
  }, [tasks]);

  const urgentCount = groups.overdue.length + groups.today.length;
  const restCount = Math.max(
    0,
    groups.open.length - urgentCount - groups.tomorrow.length
  );

  const renderItem = (t: Task, tone: "rose" | "amber" | "sky") => (
    <DropdownMenuItem
      key={t.id}
      onClick={() => setView(taskTarget)}
      className="cursor-pointer gap-2"
    >
      {tone === "rose" ? (
        <AlertTriangle className="h-4 w-4 shrink-0 text-rose-500" />
      ) : tone === "amber" ? (
        <CalendarClock className="h-4 w-4 shrink-0 text-amber-500" />
      ) : (
        <CalendarDays className="h-4 w-4 shrink-0 text-sky-500" />
      )}
      <span className="min-w-0 flex-1 truncate">{t.title}</span>
      {t.dueDate && (
        <span
          className={cn(
            "shrink-0 text-[10px]",
            tone === "rose"
              ? "text-rose-500"
              : tone === "amber"
                ? "text-amber-500"
                : "text-sky-500"
          )}
        >
          {formatFaDate(t.dueDate)}
        </span>
      )}
    </DropdownMenuItem>
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label="یادآوری وظایف"
          title="یادآوری وظایف"
        >
          <Bell className="h-5 w-5" />
          {urgentCount > 0 && (
            <span className="absolute -left-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white">
              {urgentCount > 9 ? "۹+" : String(urgentCount).replace(/\d/g, (d) =>
                "۰۱۲۳۴۵۶۷۸۹"[Number(d)]
              )}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          یادآوری وظایف
          {urgentCount > 0 && (
            <Badge className="bg-rose-500/15 text-rose-600 dark:text-rose-400" variant="outline">
              {urgentCount.toLocaleString("fa-IR")} فوری
            </Badge>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {groups.open.length === 0 ? (
          <div className="px-3 py-6 text-center text-xs text-muted-foreground">
            🎉 هیچ وظیفه بازی وجود ندارد — همه‌چیز مرتب است!
          </div>
        ) : (
          <div className="max-h-80 overflow-y-auto">
            {groups.overdue.length > 0 && (
              <>
                <div className="px-3 py-1.5 text-[10px] font-bold text-rose-500">
                  عقب‌افتاده
                </div>
                {groups.overdue.slice(0, 4).map((t) => renderItem(t, "rose"))}
              </>
            )}
            {groups.today.length > 0 && (
              <>
                <div className="px-3 py-1.5 text-[10px] font-bold text-amber-500">
                  امروز
                </div>
                {groups.today.slice(0, 4).map((t) => renderItem(t, "amber"))}
              </>
            )}
            {groups.tomorrow.length > 0 && (
              <>
                <div className="px-3 py-1.5 text-[10px] font-bold text-sky-500">
                  فردا
                </div>
                {groups.tomorrow.slice(0, 4).map((t) => renderItem(t, "sky"))}
              </>
            )}
            {restCount > 0 && (
              <div className="px-3 py-2 text-center text-[10px] text-muted-foreground">
                و {restCount.toLocaleString("fa-IR")} وظیفه باز دیگر…
              </div>
            )}
          </div>
        )}

        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => setView(taskTarget)}
          className="cursor-pointer justify-center text-teal-600 dark:text-teal-400"
        >
          {isLeader ? "مشاهده گزارش تسک‌ها" : "مشاهده همه وظایف"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
