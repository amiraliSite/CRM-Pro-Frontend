"use client";

import * as React from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useStats } from "@/hooks/use-crm-data";
import { formatShortToman, toFaDigits } from "@/lib/crm/utils";

const CHART_COLORS = ["#14b8a6", "#8b5cf6", "#f59e0b", "#f43f5e", "#06b6d4", "#84cc16"];

function ChartTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: { name?: string; value?: number; color?: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div dir="rtl" className="rounded-xl border bg-popover px-3 py-2 shadow-lg">
      {label && <p className="mb-1 text-sm font-semibold">{label}</p>}
      {payload.map((p, i) => (
        <p key={i} className="text-xs" style={{ color: p.color }}>
          {p.name}: {typeof p.value === "number" ? formatShortToman(p.value) : toFaDigits(p.value ?? 0)}
        </p>
      ))}
    </div>
  );
}

export function ReportsView() {
  const { data: stats, isLoading } = useStats();

  if (isLoading || !stats) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-8 w-40" />
        <div className="grid gap-4 md:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-56 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const k = stats.kpis;
  const summaryCards = [
    { label: "مجموع فروش موفق", value: formatShortToman(k.wonValue), tone: "text-teal-600 dark:text-teal-400" },
    { label: "ارزش پایپ‌لاین", value: formatShortToman(k.openPipelineValue), tone: "text-violet-600 dark:text-violet-400" },
    { label: "نرخ برد", value: `${toFaDigits(k.winRate)}٪`, tone: "text-amber-600 dark:text-amber-400" },
    { label: "میانگین معامله برنده", value: k.wonDealsCount > 0 ? formatShortToman(Math.round(k.wonValue / k.wonDealsCount)) : "—", tone: "text-rose-600 dark:text-rose-400" },
  ];

  const sourceData = stats.customersBySource.map((s) => ({
    name: s.label,
    value: s.count,
  }));

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold">گزارش‌ها</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          تحلیل عملکرد فروش، منابع مشتری و قیف معاملات
        </p>
      </div>

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((c, i) => (
          <Card key={c.label} className="crm-fade-up" style={{ animationDelay: `${i * 60}ms` }}>
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">{c.label}</p>
              <p className={`mt-2 text-xl font-bold ${c.tone}`}>{c.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {/* Revenue by month */}
        <Card className="crm-fade-up">
          <CardHeader>
            <CardTitle className="text-base">فروش ماهانه (معاملات برنده)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.monthlyRevenue} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#88888822" />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 12, fontFamily: "Vazirmatn" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    width={50}
                    tick={{ fontSize: 11, fontFamily: "Vazirmatn" }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v: number) =>
                      v >= 1_000_000 ? `${v / 1_000_000}M` : String(v)
                    }
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="revenue" name="فروش" radius={[6, 6, 0, 0]} fill="#14b8a6" maxBarSize={44} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Pipeline value by stage */}
        <Card className="crm-fade-up">
          <CardHeader>
            <CardTitle className="text-base">ارزش هر مرحله فروش</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.pipeline} layout="vertical" margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#88888822" />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 11, fontFamily: "Vazirmatn" }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v: number) =>
                      v >= 1_000_000 ? `${v / 1_000_000}M` : String(v)
                    }
                  />
                  <YAxis
                    type="category"
                    dataKey="label"
                    width={60}
                    tick={{ fontSize: 12, fontFamily: "Vazirmatn" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="value" name="ارزش" radius={[0, 6, 6, 0]} maxBarSize={22}>
                    {stats.pipeline.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Sources pie */}
        <Card className="crm-fade-up">
          <CardHeader>
            <CardTitle className="text-base">منابع جذب مشتری</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sourceData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={40}
                    outerRadius={80}
                    paddingAngle={3}
                    strokeWidth={0}
                  >
                    {sourceData.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                  <Legend
                    formatter={(v) => <span style={{ fontFamily: "Vazirmatn", fontSize: 12 }}>{v}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Monthly summary table-like */}
        <Card className="crm-fade-up">
          <CardHeader>
            <CardTitle className="text-base">خلاصه ماهانه</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-hidden rounded-xl border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/60 text-xs text-muted-foreground">
                    <th className="px-4 py-2.5 text-right font-medium">ماه</th>
                    <th className="px-4 py-2.5 text-right font-medium">فروش</th>
                    <th className="px-4 py-2.5 text-right font-medium">معاملات موفق</th>
                    <th className="px-4 py-2.5 text-right font-medium">مشتری جدید</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.monthlyRevenue.map((m, i) => (
                    <tr key={i} className="border-t">
                      <td className="px-4 py-3 font-medium">{m.month}</td>
                      <td className="px-4 py-3">{formatShortToman(m.revenue)}</td>
                      <td className="px-4 py-3">{toFaDigits(m.dealsCount)}</td>
                      <td className="px-4 py-3">{toFaDigits(m.newCustomers)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
