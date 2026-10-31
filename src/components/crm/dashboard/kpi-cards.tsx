"use client";

import * as React from "react";
import {
  Users,
  Flame,
  Wallet,
  Trophy,
  TrendingUp,
  CalendarClock,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatShortToman, toFaDigits } from "@/lib/crm/utils";
import type { Stats } from "@/lib/crm/types";

interface KpiCardsProps {
  stats?: Stats;
  loading: boolean;
}

export function KpiCards({ stats, loading }: KpiCardsProps) {
  if (loading || !stats) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-5">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="mt-3 h-8 w-36" />
              <Skeleton className="mt-3 h-3 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const k = stats.kpis;
  const cards = [
    {
      label: "کل مشتریان",
      value: toFaDigits(k.totalCustomers),
      unit: "نفر",
      sub: `${toFaDigits(k.newCustomersThisMonth)} مشتری جدید این ماه`,
      icon: Users,
      gradient: "from-teal-500 to-emerald-600",
      shadow: "shadow-teal-500/20",
    },
    {
      label: "پایپ‌لاین فعال",
      value: formatShortToman(k.openPipelineValue),
      sub: `${toFaDigits(k.openDealsCount)} معامله در جریان`,
      icon: Wallet,
      gradient: "from-violet-500 to-purple-600",
      shadow: "shadow-violet-500/20",
    },
    {
      label: "فروش موفق",
      value: formatShortToman(k.wonValue),
      sub: `${toFaDigits(k.wonDealsCount)} معامله برنده شده`,
      icon: Trophy,
      gradient: "from-amber-500 to-orange-600",
      shadow: "shadow-amber-500/20",
    },
    {
      label: "نرخ برد",
      value: `${toFaDigits(k.winRate)}٪`,
      sub: `${toFaDigits(k.openTasksCount)} وظیفه باز${k.overdueTasks > 0 ? ` • ${toFaDigits(k.overdueTasks)} عقب‌افتاده` : ""}`,
      icon: Flame,
      gradient: "from-rose-500 to-pink-600",
      shadow: "shadow-rose-500/20",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((c, i) => {
        const Icon = c.icon;
        return (
          <Card
            key={c.label}
            className="crm-fade-up overflow-hidden border-0 shadow-sm transition-all hover:shadow-lg hover:-translate-y-0.5"
            style={{ animationDelay: `${i * 70}ms` }}
          >
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{c.label}</p>
                  <p className="mt-2 text-2xl font-bold tracking-tight">
                    {c.value}
                  </p>
                  <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                    <TrendingUp className="h-3.5 w-3.5 text-teal-500" />
                    {c.sub}
                  </p>
                </div>
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${c.gradient} shadow-lg ${c.shadow}`}
                >
                  <Icon className="h-5 w-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

export function OverdueHint({ stats }: { stats?: Stats }) {
  if (!stats || stats.kpis.overdueTasks === 0) return null;
  return (
    <div className="flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2.5 text-sm text-rose-600 dark:text-rose-300">
      <CalendarClock className="h-4 w-4" />
      {toFaDigits(stats.kpis.overdueTasks)} وظیفه عقب‌افتاده دارید — اولویت رسیدگی
      بدید!
    </div>
  );
}
