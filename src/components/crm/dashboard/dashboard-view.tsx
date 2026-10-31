"use client";

import { useStats } from "@/hooks/use-crm-data";
import { KpiCards, OverdueHint } from "@/components/crm/dashboard/kpi-cards";
import { RevenueChart } from "@/components/crm/dashboard/revenue-chart";
import { PipelineFunnel } from "@/components/crm/dashboard/pipeline-funnel";
import { TopDeals } from "@/components/crm/dashboard/top-deals";
import { RecentFeed } from "@/components/crm/dashboard/recent-feed";
import { StatusDonut } from "@/components/crm/dashboard/status-donut";
import { UpcomingTasks } from "@/components/crm/dashboard/upcoming-tasks";

export function DashboardView() {
  const { data: stats, isLoading } = useStats();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">سلام! 👋 خوش برگشتی</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          خلاصه وضعیت فروش و مشتریان شرکت در یک نگاه
        </p>
      </div>

      <KpiCards stats={stats} loading={isLoading} />
      <OverdueHint stats={stats} />

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="space-y-4 xl:col-span-2">
          <RevenueChart data={stats?.monthlyRevenue} loading={isLoading} />
          <div className="grid gap-4 md:grid-cols-2">
            <TopDeals deals={stats?.topOpportunities} loading={isLoading} />
            <UpcomingTasks tasks={stats?.upcomingTasks} loading={isLoading} />
          </div>
        </div>
        <div className="space-y-4">
          <PipelineFunnel pipeline={stats?.pipeline} loading={isLoading} />
          <StatusDonut data={stats?.customersByStatus} loading={isLoading} />
          <RecentFeed activities={stats?.recentActivities} loading={isLoading} />
        </div>
      </div>
    </div>
  );
}
