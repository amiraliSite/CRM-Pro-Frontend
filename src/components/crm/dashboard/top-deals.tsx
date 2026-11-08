"use client";

import * as React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatShortToman, toFaDigits } from "@/lib/crm/utils";
import { DEAL_STAGES } from "@/lib/crm/types";
import type { Deal } from "@/lib/crm/types";

interface TopDealsProps {
  deals?: Deal[];
  loading: boolean;
}

export function TopDeals({ deals, loading }: TopDealsProps) {
  if (loading || !deals) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-36" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="crm-fade-up">
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">فرصت‌های برتر</CardTitle>
        <span className="text-xs text-muted-foreground">بزرگ‌ترین معاملات باز</span>
      </CardHeader>
      <CardContent className="space-y-2.5">
        {deals.length === 0 && (
          <p className="py-6 text-center text-sm text-muted-foreground">
            معامله بازی وجود ندارد.
          </p>
        )}
        {deals.map((d, i) => {
          const stage = DEAL_STAGES.find((s) => s.key === d.stage);
          return (
            <div
              key={d.id}
              className="flex items-center gap-3 rounded-xl border p-3 transition-colors hover:bg-muted/50"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-teal-500/15 to-emerald-500/15 text-xs font-bold text-teal-700 dark:text-teal-300">
                {toFaDigits(i + 1)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{d.title}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {d.customer?.name || "بدون مشتری"} • احتمال {toFaDigits(d.probability)}٪
                </p>
              </div>
              <div className="text-left shrink-0">
                <p className="text-sm font-bold">{formatShortToman(d.value)}</p>
                <p
                  className="text-[11px] font-medium"
                  style={{ color: stage?.color }}
                >
                  {stage?.label}
                </p>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
