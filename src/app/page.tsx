"use client";

import * as React from "react";
import { AppShell } from "@/components/crm/app-shell";
import { CrmQueryProvider } from "@/components/crm/query-provider";
import { useCrmStore } from "@/lib/crm/store";
import { useAuthBoot, getToken } from "@/lib/auth-client";
import { LoginView } from "@/components/crm/auth/login-view";
import { OnboardingView } from "@/components/crm/onboarding/onboarding-view";
import { DashboardView } from "@/components/crm/dashboard/dashboard-view";
import { CustomersView } from "@/components/crm/customers/customers-view";
import { CallsTodayView } from "@/components/crm/calls/calls-today-view";
import { CallsMonthView } from "@/components/crm/calls/calls-month-view";
import { MeetingsView } from "@/components/crm/meetings/meetings-view";
import { TasksView } from "@/components/crm/tasks/tasks-view";
import { TaskAssignmentView } from "@/components/crm/task-assignment/task-assignment-view";
import { TaskReportsView } from "@/components/crm/task-reports/task-reports-view";
import { CallsView } from "@/components/crm/calls/calls-view";
import { ActivitiesView } from "@/components/crm/activities/activities-view";
import { ChatView } from "@/components/crm/chat/chat-view";
import { AttendanceView } from "@/components/crm/attendance/attendance-view";
import { MyBoxView } from "@/components/crm/mybox/my-box-view";
import { ReportsView } from "@/components/crm/reports/reports-view";
import { UsersView } from "@/components/crm/users/users-view";
import { SettingsView } from "@/components/crm/settings/settings-view";
import { RulesView } from "@/components/crm/rules/rules-view";
import { ProcurementView } from "@/components/crm/procurement/procurement-view";

/**
 * تسک ۵۷ — لودینگ شروع سایت: همان صحنه‌ی سه‌بعدی سینمایی لودینگ ورود (تسک ۵۶)
 * با حلقه‌های مداری + مکعب چرخان؛ متن طبق درخواست مدیر: «در حال بارگذاری دوست عزیز»
 * (قبلاً «در حال بررسی نشست...» بود). فقط استایل/متن — منطق auth دست نخورده.
 */
function Splash() {
  return (
    <div className="login3d-loader" role="status" aria-live="polite">
      <div className="login3d-loader-box">
        <div className="login3d-orbit" aria-hidden>
          <i />
          <i />
          <i />
          <div className="login3d-cube3d">
            <i />
            <i />
            <i />
            <i />
            <i />
            <i />
          </div>
        </div>
        <p className="login3d-loader-title login3d-display">
          در حال بارگذاری دوست عزیز
        </p>
        <p className="login3d-loader-sub">
          هلدینگ مهر — داریم محیط کار رو برات آماده می‌کنیم...
        </p>
        <div className="login3d-bar">
          <i />
        </div>
      </div>
    </div>
  );
}

/**
 * Guest flow: welcome slides first, then the login page.
 * Runs for ANY visitor without a valid session — a fresh browser/copy
 * AND every time a user (admin or agent) logs out — exactly as requested.
 * The internal state resets on remount, so after each logout the slides
 * are shown from the beginning again.
 */
function GuestFlow() {
  const [showLogin, setShowLogin] = React.useState(false);
  return showLogin ? (
    <LoginView />
  ) : (
    <OnboardingView onFinish={() => setShowLogin(true)} />
  );
}

function CrmContent() {
  const { view, authState, user, logout } = useCrmStore();
  useAuthBoot();

  // React to session expiry triggered anywhere in the app
  React.useEffect(() => {
    const onExpired = () => logout();
    window.addEventListener("crm-session-expired", onExpired);
    return () => window.removeEventListener("crm-session-expired", onExpired);
  }, [logout]);

  if (authState === "loading") return <Splash />;
  if (authState === "guest" || !getToken()) return <GuestFlow />;

  return (
    <AppShell>
      <div key={view} className="crm-fade-up mx-auto max-w-7xl">
        {view === "dashboard" && <DashboardView />}
        {view === "customers" && <CustomersView />}
        {view === "calls-today" && <CallsTodayView />}
        {view === "calls-month" && <CallsMonthView />}
        {view === "meetings" && <MeetingsView />}
        {view === "tasks" && <TasksView />}
        {view === "task-assignment" && <TaskAssignmentView />}
        {view === "task-reports" && <TaskReportsView />}
        {view === "calls" && <CallsView />}
        {view === "chat" && <ChatView />}
        {view === "attendance" && <AttendanceView />}
        {view === "mybox" && <MyBoxView />}
        {view === "activities" && <ActivitiesView />}
        {view === "reports" && <ReportsView />}
        {view === "users" && user?.role === "admin" && <UsersView />}
        {view === "settings" && <SettingsView />}
        {view === "rules" && <RulesView />}
        {view === "procurement" && <ProcurementView />}
      </div>
    </AppShell>
  );
}

export default function Home() {
  return (
    <CrmQueryProvider>
      <CrmContent />
    </CrmQueryProvider>
  );
}
