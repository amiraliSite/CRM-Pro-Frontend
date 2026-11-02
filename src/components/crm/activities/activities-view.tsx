"use client";

import * as React from "react";
import { Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/crm/shared/empty-state";
import { ActivityFormFields } from "@/components/crm/activities/activity-form-fields";
import { ActivityTypeIcon } from "@/components/crm/dashboard/recent-feed";
import { useActivities, useCreateActivity } from "@/hooks/use-crm-data";
import type { ActivityType } from "@/lib/crm/types";
import { avatarColor, formatFaDateTime, timeAgo, toFaDigits } from "@/lib/crm/utils";
import { usePermissions } from "@/lib/crm/store";
import { cn } from "@/lib/utils";

const TYPE_LABELS: Record<ActivityType, string> = {
  call: "تماس",
  meeting: "جلسه",
  email: "ایمیل",
  note: "یادداشت",
};

export function ActivitiesView() {
  const { canWriteBusiness: canWrite } = usePermissions();
  const [type, setType] = React.useState("");
  const [addOpen, setAddOpen] = React.useState(false);
  const { data: activities, isLoading } = useActivities(type || undefined);
  const createActivity = useCreateActivity();

  // group by day
  const grouped = React.useMemo(() => {
    const map = new Map<string, typeof activities>();
    ((activities ?? []) as NonNullable<typeof activities>).forEach((a) => {
      const key = new Intl.DateTimeFormat("fa-IR", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }).format(new Date(a.createdAt));
      const list = map.get(key) ?? [];
      list.push(a);
      map.set(key, list);
    });
    return Array.from(map.entries());
  }, [activities]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">فعالیت‌ها</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {canWrite
              ? "تایم‌لاین تماس‌ها، جلسات، ایمیل‌ها و یادداشت‌ها"
              : "حالت نمایش — تایم‌لاین فعالیت‌های تیم"}
          </p>
        </div>
        {canWrite && (
          <Button
            onClick={() => setAddOpen(true)}
            className="gap-2 bg-gradient-to-l from-teal-600 to-emerald-600 text-white"
          >
            <Plus className="h-4 w-4" />
            ثبت فعالیت
          </Button>
        )}
      </div>

      <Tabs value={type} onValueChange={setType} className="w-fit">
        <TabsList>
          <TabsTrigger value="">همه</TabsTrigger>
          {(Object.keys(TYPE_LABELS) as ActivityType[]).map((key) => (
            <TabsTrigger key={key} value={key}>
              {TYPE_LABELS[key]}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : (activities ?? []).length === 0 ? (
        <EmptyState
          title="فعالیتی ثبت نشده"
          description="اولین تماس، جلسه یا یادداشت را ثبت کنید."
          action={
            canWrite ? (
              <Button onClick={() => setAddOpen(true)} className="gap-2 bg-teal-600 hover:bg-teal-700">
                <Plus className="h-4 w-4" />
                ثبت فعالیت
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-6">
          {grouped.map(([day, items]) => (
            <div key={day}>
              <div className="mb-3 flex items-center gap-3">
                <Badge variant="outline" className="bg-muted px-3 py-1 text-xs font-semibold">
                  {day}
                </Badge>
                <div className="h-px flex-1 bg-border" />
                <span className="text-[11px] text-muted-foreground">
                  {toFaDigits(items?.length ?? 0)} فعالیت
                </span>
              </div>

              <div className="relative space-y-3 before:absolute before:right-[19px] before:top-3 before:h-[calc(100%-24px)] before:w-px before:bg-border">
                {(items ?? []).map((a, i) => (
                  <Card
                    key={a.id}
                    className="crm-fade-up py-0 transition-all hover:shadow-md"
                    style={{ animationDelay: `${i * 40}ms` }}
                  >
                    <CardContent className="flex items-start gap-3 p-4">
                      <ActivityTypeIcon type={a.type} className="relative z-10 scale-125" />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold">{a.title}</p>
                          <Badge variant="outline" className="text-[10px] bg-muted">
                            {TYPE_LABELS[a.type as ActivityType]}
                          </Badge>
                        </div>
                        {a.description && (
                          <p className="mt-1 text-xs leading-6 text-muted-foreground">
                            {a.description}
                          </p>
                        )}
                        <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
                          {a.customer && (
                            <span className="inline-flex items-center gap-1.5">
                              <span
                                className={cn(
                                  "inline-block h-2.5 w-2.5 rounded-full",
                                  avatarColor(a.customer.id)
                                )}
                              />
                              {a.customer.name}
                            </span>
                          )}
                          <span>{timeAgo(a.createdAt)}</span>
                          <span className="hidden sm:inline">
                            {formatFaDateTime(a.createdAt)}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>ثبت فعالیت جدید</DialogTitle>
            <DialogDescription>
              تماس، جلسه، ایمیل یا یادداشت را ثبت کنید.
            </DialogDescription>
          </DialogHeader>
          <ActivityFormFields
            submitting={createActivity.isPending}
            onSubmitData={(data) => createActivity.mutate(data, { onSuccess: () => setAddOpen(false) })}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
