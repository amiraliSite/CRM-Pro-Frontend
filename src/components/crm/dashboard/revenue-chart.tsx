"use client";

import * as React from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatShortToman, toFaDigits } from "@/lib/crm/utils";
import type { Stats } from "@/lib/crm/types";

interface RevenueChartProps {
  data?: Stats["monthlyRevenue"];
  loading: boolean;
}

export function RevenueChart({ data, loading }: RevenueChartProps) {
  if (loading || !data) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="crm-fade-up">
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">روند فروش ۶ ماه اخیر</CardTitle>
        <span className="rounded-full bg-teal-500/10 px-3 py-1 text-xs font-medium text-teal-700 dark:text-teal-300">
          مجموع: {formatShortToman(data.reduce((s, m) => s + m.revenue, 0))}
        </span>
      </CardHeader>
      <CardContent>
        <div className="h-64 w-full" dir="ltr">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
              <defs>
                <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#14b8a6" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#14b8a6" stopOpacity={0.02} />
                </linearGradient>
              </defs>
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
                tickFormatter={(v: number) => {
                  if (v >= 1_000_000_000) return `${v / 1_000_000_000}B`;
                  if (v >= 1_000_000) return `${v / 1_000_000}M`;
                  return String(v);
                }}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  const row = payload[0].payload as Stats["monthlyRevenue"][number];
                  return (
                    <div
                      dir="rtl"
                      className="rounded-xl border bg-popover px-3 py-2 shadow-lg"
                    >
                      <p className="text-sm font-semibold">{label}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        فروش: {formatShortToman(row.revenue)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {toFaDigits(row.dealsCount)} معامله موفق •{" "}
                        {toFaDigits(row.newCustomers)} مشتری جدید
                      </p>
                    </div>
                  );
                }}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#14b8a6"
                strokeWidth={2.5}
                fill="url(#revenueFill)"
                dot={{ r: 4, fill: "#14b8a6", strokeWidth: 2, stroke: "#fff" }}
                activeDot={{ r: 6 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
