"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatShortToman, toFaDigits } from "@/lib/crm/utils";
import { DEAL_STAGES, type Stats } from "@/lib/crm/types";

interface PipelineFunnelProps {
  pipeline?: Stats["pipeline"];
  loading: boolean;
}

export function PipelineFunnel({ pipeline, loading }: PipelineFunnelProps) {
  if (loading || !pipeline) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-56 w-full" />
        </CardContent>
      </Card>
    );
  }

  const maxValue = Math.max(...pipeline.map((p) => p.value), 1);

  return (
    <Card className="crm-fade-up">
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">قیف فروش</CardTitle>
        <span className="text-xs text-muted-foreground">
          ارزش هر مرحله از کل پایپ‌لاین
        </span>
      </CardHeader>
      <CardContent className="space-y-4">
        {pipeline.map((stage) => {
          const color =
            DEAL_STAGES.find((s) => s.key === stage.key)?.color ?? "#14b8a6";
          const pct = Math.round((stage.value / maxValue) * 100);
          return (
            <div key={stage.key}>
              <div className="mb-1.5 flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 font-medium">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                  {stage.label}
                  <span className="text-xs text-muted-foreground">
                    ({toFaDigits(stage.count)} معامله)
                  </span>
                </span>
                <span className="text-xs font-semibold text-muted-foreground">
                  {formatShortToman(stage.value)}
                </span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${Math.max(pct, stage.value > 0 ? 4 : 0)}%`,
                    backgroundColor: color,
                  }}
                />
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
