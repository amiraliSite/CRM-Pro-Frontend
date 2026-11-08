"use client";

import * as React from "react";
import {
  Mail,
  MapPin,
  Building2,
  StickyNote,
  CalendarDays,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useCustomerDetail,
  useCreateActivity,
  type ActivityInput,
} from "@/hooks/use-crm-data";
import { ActivityFormFields } from "@/components/crm/activities/activity-form-fields";
import { ActivityTypeIcon } from "@/components/crm/dashboard/recent-feed";
import { CUSTOMER_STATUS, SOURCE_LABELS, type CustomerStatus } from "@/lib/crm/types";
import {
  avatarColor,
  formatFaDate,
  getInitials,
  timeAgo,
  toFaDigits,
} from "@/lib/crm/utils";
import { usePermissions } from "@/lib/crm/store";
import { cn } from "@/lib/utils";

interface CustomerDetailSheetProps {
  customerId: string | null;
  onOpenChange: (open: boolean) => void;
}

export function CustomerDetailSheet({
  customerId,
  onOpenChange,
}: CustomerDetailSheetProps) {
  const { canWriteBusiness } = usePermissions();
  const { data: customer, isLoading } = useCustomerDetail(customerId);
  const createActivity = useCreateActivity();

  const handleAddActivity = (data: ActivityInput) => {
    if (!customerId) return;
    createActivity.mutate(
      { ...data, customerId },
      {
        onSuccess: () => {
          // refetch handled by query invalidation
        },
      }
    );
  };

  return (
    <Sheet open={!!customerId} onOpenChange={onOpenChange}>
      <SheetContent
        className="w-full overflow-y-auto p-0 sm:max-w-lg"
        side="left"
        aria-describedby={undefined}
      >
        {isLoading || !customer ? (
          <div className="flex h-full flex-col">
            <SheetHeader className="sr-only">
              <SheetTitle>جزئیات مشتری</SheetTitle>
            </SheetHeader>
            <div className="flex flex-1 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-teal-500 border-t-transparent" />
            </div>
          </div>
        ) : (
          <div className="flex h-full flex-col">
            <SheetHeader className="p-0 pb-4">
              <div className="bg-gradient-to-l from-teal-500/10 to-emerald-500/5 px-6 pt-6 pb-5">
                <div className="flex items-start gap-4">
                  <span
                    className={cn(
                      "flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-lg font-bold text-white shadow-lg",
                      avatarColor(customer.id)
                    )}
                  >
                    {getInitials(customer.name)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <SheetTitle className="flex flex-wrap items-center gap-2 text-lg">
                      {customer.name}
                      {customer.phone && (
                        <Badge
                          variant="outline"
                          dir="ltr"
                          className="border-teal-500/40 bg-teal-500/10 font-mono text-[11px] text-teal-700 dark:text-teal-300"
                        >
                          {toFaDigits(customer.phone)}
                        </Badge>
                      )}
                    </SheetTitle>
                    <SheetDescription className="mt-0.5 flex items-center gap-1">
                      <Building2 className="h-3.5 w-3.5" />
                      {customer.company || "بدون شرکت"}
                    </SheetDescription>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {CUSTOMER_STATUS[customer.status as CustomerStatus] && (
                        <Badge
                          variant="outline"
                          className={
                            CUSTOMER_STATUS[customer.status as CustomerStatus].className
                          }
                        >
                          {CUSTOMER_STATUS[customer.status as CustomerStatus].label}
                        </Badge>
                      )}
                      <Badge variant="outline" className="bg-background">
                        منبع: {SOURCE_LABELS[customer.source] || customer.source}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <StatBox
                    label="وظایف باز"
                    value={toFaDigits(
                      customer.tasks?.filter((t) => t.status !== "done").length ?? 0
                    )}
                  />
                  <StatBox
                    label="تماس‌ها"
                    value={toFaDigits(customer.callLogs?.length ?? 0)}
                  />
                </div>
              </div>
            </SheetHeader>

            <ScrollArea className="flex-1 px-6 pb-6">
              {/* Contact info */}
              <div className="space-y-2.5 text-sm">
                {customer.email && (
                  <InfoRow icon={Mail} label="ایمیل" value={customer.email} ltr />
                )}
                {customer.address && (
                  <InfoRow icon={MapPin} label="آدرس" value={customer.address} />
                )}
                <InfoRow
                  icon={CalendarDays}
                  label="عضویت از"
                  value={formatFaDate(customer.createdAt)}
                />
                {customer.notes && (
                  <div className="mt-3 flex gap-2 rounded-xl bg-muted/60 p-3 text-xs leading-6 text-muted-foreground">
                    <StickyNote className="h-4 w-4 shrink-0" />
                    {customer.notes}
                  </div>
                )}
              </div>

              <Separator className="my-5" />

              <Tabs defaultValue="tasks">
                <TabsList className="w-full">
                  <TabsTrigger value="tasks" className="flex-1">
                    وظایف ({toFaDigits(customer.tasks?.length ?? 0)})
                  </TabsTrigger>
                  <TabsTrigger value="activities" className="flex-1">
                    فعالیت‌ها ({toFaDigits(customer.activities?.length ?? 0)})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="tasks" className="mt-4 space-y-2.5">
                  {(customer.tasks ?? []).length === 0 && (
                    <p className="py-6 text-center text-sm text-muted-foreground">
                      وظیفه‌ای ثبت نشده.
                    </p>
                  )}
                  {(customer.tasks ?? []).map((t) => (
                    <div key={t.id} className="rounded-xl border p-3">
                      <p className="text-sm font-medium">{t.title}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {t.dueDate ? `ددلاین: ${formatFaDate(t.dueDate)}` : "بدون ددلاین"}
                      </p>
                    </div>
                  ))}
                </TabsContent>

                <TabsContent value="activities" className="mt-4">
                  <div className="relative space-y-4 before:absolute before:right-[15px] before:top-2 before:h-[calc(100%-16px)] before:w-px before:bg-border">
                    {(customer.activities ?? []).length === 0 && (
                      <p className="py-4 text-center text-sm text-muted-foreground">
                        فعالیتی ثبت نشده.
                      </p>
                    )}
                    {(customer.activities ?? []).map((a) => (
                      <div key={a.id} className="flex items-start gap-3">
                        <ActivityTypeIcon type={a.type} className="relative z-10 bg-background" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium">{a.title}</p>
                          {a.description && (
                            <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
                              {a.description}
                            </p>
                          )}
                          <p className="mt-0.5 text-[11px] text-muted-foreground">
                            {timeAgo(a.createdAt)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Separator className="my-4" />
                  {canWriteBusiness ? (
                    <>
                      <p className="mb-3 text-sm font-semibold">ثبت فعالیت جدید</p>
                      <ActivityFormFields
                        hideButtons={false}
                        submitLabel="ثبت"
                        submitting={createActivity.isPending}
                        onSubmitData={handleAddActivity}
                      />
                    </>
                  ) : (
                    <p className="rounded-xl border bg-muted/40 px-4 py-3 text-center text-xs text-muted-foreground">
                      حالت نمایش — ثبت فعالیت جدید با کارشناس فروش است.
                    </p>
                  )}
                </TabsContent>
              </Tabs>
            </ScrollArea>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-background p-2.5 text-center">
      <p className="truncate text-sm font-bold">{value}</p>
      <p className="mt-0.5 text-[10px] text-muted-foreground">{label}</p>
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
  ltr,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  ltr?: boolean;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </span>
      <div className="min-w-0">
        <p className="text-[11px] text-muted-foreground">{label}</p>
        <p
          className="truncate text-sm font-medium"
          dir={ltr ? "ltr" : undefined}
          style={ltr ? { textAlign: "right" } : undefined}
        >
          {value}
        </p>
      </div>
    </div>
  );
}
