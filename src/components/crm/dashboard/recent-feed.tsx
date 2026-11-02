"use client";

import * as React from "react";
import { Phone, Calendar, Mail, StickyNote } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { timeAgo } from "@/lib/crm/utils";
import type { Activity, ActivityType } from "@/lib/crm/types";

export function ActivityTypeIcon({
  type,
  className,
}: {
  type: ActivityType | string;
  className?: string;
}) {
  const map: Record<string, { icon: React.ElementType; bg: string }> = {
    call: { icon: Phone, bg: "bg-teal-500/15 text-teal-600 dark:text-teal-300" },
    meeting: { icon: Calendar, bg: "bg-violet-500/15 text-violet-600 dark:text-violet-300" },
    email: { icon: Mail, bg: "bg-amber-500/15 text-amber-600 dark:text-amber-300" },
    note: { icon: StickyNote, bg: "bg-rose-500/15 text-rose-600 dark:text-rose-300" },
  };
  const { icon: Icon, bg } = map[type] ?? map.note;
  return (
    <span
      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${bg}`}
    >
      <Icon className={`h-4 w-4 ${className ?? ""}`} />
    </span>
  );
}

interface RecentFeedProps {
  activities?: Activity[];
  loading: boolean;
}

export function RecentFeed({ activities, loading }: RecentFeedProps) {
  if (loading || !activities) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="crm-fade-up">
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">فعالیت‌های اخیر</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative space-y-4 before:absolute before:right-[15px] before:top-2 before:h-[calc(100%-16px)] before:w-px before:bg-border">
          {activities.length === 0 && (
            <p className="py-4 text-center text-sm text-muted-foreground">
              فعالیتی ثبت نشده است.
            </p>
          )}
          {activities.map((a) => (
            <div key={a.id} className="relative flex items-start gap-3 pr-0">
              <ActivityTypeIcon type={a.type} className="relative z-10 bg-background" />
              <div className="min-w-0 flex-1 pb-1">
                <p className="truncate text-sm font-medium">{a.title}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {a.customer ? `${a.customer.name} • ` : ""}
                  {timeAgo(a.createdAt)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
