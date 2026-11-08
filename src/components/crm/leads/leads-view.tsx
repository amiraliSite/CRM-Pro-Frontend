"use client";

import * as React from "react";
import {
  Target,
  Phone,
  Mail,
  Building2,
  ArrowUpCircle,
  Eye,
  SearchX,
  Flame,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useCustomers, useUpdateCustomer } from "@/hooks/use-crm-data";
import { CustomerDetailSheet } from "@/components/crm/customers/customer-detail-sheet";
import { SOURCE_LABELS, type Customer } from "@/lib/crm/types";
import { usePermissions } from "@/lib/crm/store";
import { avatarColor, toFaDigits, timeAgo } from "@/lib/crm/utils";
import { getInitials } from "@/lib/crm/utils";
import { cn } from "@/lib/utils";

export function LeadsView() {
  const { canWriteBusiness } = usePermissions();
  const { data: leads, isLoading } = useCustomers(undefined, "lead");
  const updateCustomer = useUpdateCustomer();
  const [openId, setOpenId] = React.useState<string | null>(null);

  const total = leads?.length ?? 0;
  const withPhone = leads?.filter((c) => c.phone).length ?? 0;
  const thisWeek = leads?.filter((c) => {
    const created = new Date(c.createdAt).getTime();
    return Date.now() - created < 7 * 86400000;
  }).length ?? 0;

  const convert = (c: Customer) => {
    if (!canWriteBusiness) return;
    updateCustomer.mutate({ id: c.id, data: { status: "active" } });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-black">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-400 to-fuchsia-600 text-white shadow-md shadow-violet-500/25">
              <Target className="h-5 w-5" />
            </span>
            سرنخ‌های فروش
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            مشتری‌های بالقوه‌ای که باید با آن‌ها تماس بگیری و به مشتری فعال تبدیل کنی
          </p>
        </div>
        <Badge
          variant="outline"
          className="gap-1.5 border-violet-600/30 bg-violet-500/10 px-3 py-1.5 text-violet-700 dark:text-violet-300"
        >
          <Flame className="h-3.5 w-3.5" />
          {toFaDigits(total)} سرنخ فعال
        </Badge>
      </div>

      {/* Mini stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          {
            label: "کل سرنخ‌ها",
            value: toFaDigits(total),
            cls: "from-violet-400 to-fuchsia-600 shadow-violet-500/20",
          },
          {
            label: "دارای شماره تماس",
            value: toFaDigits(withPhone),
            cls: "from-teal-400 to-emerald-600 shadow-teal-500/20",
          },
          {
            label: "سرنخ این هفته",
            value: toFaDigits(thisWeek),
            cls: "from-amber-400 to-orange-600 shadow-amber-500/20",
          },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-2xl border bg-card p-4 text-center"
          >
            <div
              className={cn(
                "mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br text-base font-black text-white shadow-lg",
                s.cls
              )}
            >
              {s.value}
            </div>
            <div className="mt-2 text-xs font-medium text-muted-foreground">
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-36 rounded-2xl" />
          ))}
        </div>
      ) : !leads || leads.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed py-16 text-center">
          <SearchX className="h-10 w-10 text-muted-foreground/40" />
          <div>
            <p className="font-bold">هنوز سرنخی نداری</p>
            <p className="mt-1 text-sm text-muted-foreground">
              مشتری‌های جدیدی که با وضعیت «سرنخ» ثبت بشن، اینجا نمایش داده می‌شن.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {leads.map((c) => (
            <div
              key={c.id}
              className="group relative flex flex-col rounded-2xl border bg-card p-4 transition-all hover:shadow-lg hover:shadow-violet-500/5"
            >
              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white",
                    avatarColor(c.id)
                  )}
                >
                  {getInitials(c.name)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold">{c.name}</p>
                  {c.company && (
                    <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted-foreground">
                      <Building2 className="h-3 w-3 shrink-0" />
                      {c.company}
                    </p>
                  )}
                </div>
                <Badge
                  variant="outline"
                  className="shrink-0 border-violet-200 bg-violet-500/10 text-[10px] text-violet-700 dark:border-violet-500/25 dark:bg-violet-500/15 dark:text-violet-300"
                >
                  سرنخ
                </Badge>
              </div>

              <div className="mt-3 space-y-1.5 text-xs text-muted-foreground">
                {c.phone && (
                  <p className="flex items-center gap-1.5" dir="ltr">
                    <Phone className="h-3 w-3 shrink-0" />
                    <span className="font-mono">{toFaDigits(c.phone)}</span>
                  </p>
                )}
                {c.email && (
                  <p className="flex items-center gap-1.5 truncate">
                    <Mail className="h-3 w-3 shrink-0" />
                    <span dir="ltr">{c.email}</span>
                  </p>
                )}
                <p className="flex items-center justify-between pt-0.5">
                  <span>
                    منبع: {SOURCE_LABELS[c.source] ?? c.source}
                  </span>
                  <span className="text-[10px]">
                    {timeAgo(c.createdAt)}
                  </span>
                </p>
              </div>

              {/* Actions */}
              <div className="mt-3 flex items-center gap-2 border-t pt-3">
                {c.phone && (
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="h-8 flex-1 gap-1.5 text-xs"
                  >
                    <a href={`tel:${c.phone}`} aria-label={`تماس با ${c.name}`}>
                      <Phone className="h-3.5 w-3.5" />
                      تماس
                    </a>
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 flex-1 gap-1.5 text-xs"
                  onClick={() => setOpenId(c.id)}
                >
                  <Eye className="h-3.5 w-3.5" />
                  جزئیات
                </Button>
                {canWriteBusiness && (
                  <Button
                    size="sm"
                    disabled={updateCustomer.isPending}
                    onClick={() => convert(c)}
                    className="h-8 flex-1 gap-1.5 bg-gradient-to-l from-violet-500 to-fuchsia-600 text-xs text-white shadow-md shadow-violet-500/20 hover:shadow-lg"
                    title="تبدیل به مشتری فعال"
                  >
                    <ArrowUpCircle className="h-3.5 w-3.5" />
                    تبدیل
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <CustomerDetailSheet customerId={openId} onOpenChange={(o) => !o && setOpenId(null)} />
    </div>
  );
}
