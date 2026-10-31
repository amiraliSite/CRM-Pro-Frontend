"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatFaDate, toFaDigits, daysUntil } from "@/lib/crm/utils";
import { TASK_PRIORITY, type Task } from "@/lib/crm/types";

interface UpcomingTasksProps {
  tasks?: Task[];
  loading: boolean;
}

export function UpcomingTasks({ tasks, loading }: UpcomingTasksProps) {
  if (loading || !tasks) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="crm-fade-up">
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">وظایف پیش‌رو</CardTitle>
        <span className="text-xs text-muted-foreground">نزدیک‌ترین ددلاین‌ها</span>
      </CardHeader>
      <CardContent className="space-y-2.5">
        {tasks.length === 0 && (
          <p className="py-6 text-center text-sm text-muted-foreground">
            وظیفه بازی وجود ندارد. 🎉
          </p>
        )}
        {tasks.map((t) => {
          const pr = TASK_PRIORITY[t.priority];
          const days = daysUntil(t.dueDate);
          return (
            <div
              key={t.id}
              className="flex items-center gap-3 rounded-xl border p-3 transition-colors hover:bg-muted/50"
            >
              <span className={`h-2 w-2 shrink-0 rounded-full ${pr.dot}`} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{t.title}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {t.customer ? `${t.customer.name} • ` : ""}
                  {t.dueDate ? formatFaDate(t.dueDate) : "بدون ددلاین"}
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <Badge variant="outline" className={`text-[10px] ${pr.className}`}>
                  {pr.label}
                </Badge>
                {days !== null && (
                  <span
                    className={`text-[11px] font-medium ${
                      days < 0
                        ? "text-rose-500"
                        : days <= 2
                          ? "text-amber-500"
                          : "text-muted-foreground"
                    }`}
                  >
                    {days < 0
                      ? `${toFaDigits(Math.abs(days))} روز عقب‌افتاده`
                      : days === 0
                        ? "امروز"
                        : `${toFaDigits(days)} روز مانده`}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
