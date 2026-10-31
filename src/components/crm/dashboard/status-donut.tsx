"use client";

import * as React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toFaDigits } from "@/lib/crm/utils";
import type { Stats } from "@/lib/crm/types";

const COLORS: Record<string, string> = {
  lead: "#8b5cf6",
  active: "#14b8a6",
  vip: "#f59e0b",
  inactive: "#f43f5e",
};

interface StatusDonutProps {
  data?: Stats["customersByStatus"];
  loading: boolean;
}

export function StatusDonut({ data, loading }: StatusDonutProps) {
  if (loading || !data) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-36" />
        </CardHeader>
        <CardContent>
          <Skeleton className="mx-auto h-44 w-44 rounded-full" />
        </CardContent>
      </Card>
    );
  }

  const total = data.reduce((s, d) => s + d.count, 0);
  const filtered = data.filter((d) => d.count > 0);

  return (
    <Card className="crm-fade-up">
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">ترکیب مشتریان</CardTitle>
        <span className="text-xs text-muted-foreground">
          {toFaDigits(total)} نفر
        </span>
      </CardHeader>
      <CardContent>
        <div className="relative mx-auto h-44 w-44" dir="ltr">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={filtered}
                dataKey="count"
                nameKey="label"
                innerRadius={52}
                outerRadius={78}
                paddingAngle={3}
                strokeWidth={0}
              >
                {filtered.map((d) => (
                  <Cell key={d.key} fill={COLORS[d.key] ?? "#14b8a6"} />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const row = payload[0].payload as Stats["customersByStatus"][number];
                  return (
                    <div
                      dir="rtl"
                      className="rounded-xl border bg-popover px-3 py-2 text-sm shadow-lg"
                    >
                      {row.label}: {toFaDigits(row.count)} نفر
                    </div>
                  );
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center" dir="rtl">
            <span className="text-xl font-bold">{toFaDigits(total)}</span>
            <span className="text-[11px] text-muted-foreground">مشتری</span>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap justify-center gap-x-4 gap-y-2">
          {data.map((d) => (
            <span
              key={d.key}
              className="flex items-center gap-1.5 text-xs text-muted-foreground"
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: COLORS[d.key] ?? "#14b8a6" }}
              />
              {d.label} ({toFaDigits(d.count)})
            </span>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
