"use client";

import { create } from "zustand";
import type { StaffRole } from "@/lib/crm/types";

export type CrmView =
  | "dashboard"
  | "customers"
  | "calls-today"
  | "calls-month"
  | "meetings"
  | "tasks"
  | "task-assignment"
  | "task-reports"
  | "calls"
  | "activities"
  | "chat"
  | "attendance"
  | "mybox"
  | "reports"
  | "users"
  | "settings"
  | "rules";

export type AuthUser = {
  id: string;
  username: string;
  fullName: string;
  role: StaffRole | (string & {});
  color: string;
};

export type AuthState = "loading" | "authed" | "guest";

interface CrmState {
  view: CrmView;
  setView: (view: CrmView) => void;
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  closeSidebar: () => void;
  user: AuthUser | null;
  authState: AuthState;
  setUser: (user: AuthUser | null) => void;
  setAuthState: (state: AuthState) => void;
  logout: () => void;
}

export const useCrmStore = create<CrmState>((set) => ({
  view: "dashboard",
  setView: (view) => set({ view }),
  sidebarOpen: false,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  closeSidebar: () => set({ sidebarOpen: false }),
  user: null,
  authState: "loading",
  setUser: (user) => set({ user }),
  setAuthState: (authState) => set({ authState }),
  logout: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("crm_token");
    }
    set({ user: null, authState: "guest", view: "dashboard", sidebarOpen: false });
  },
}));

/* ---------------- Role permissions ---------------- */

/** Roles that oversee the team (see everything, manage staff). */
export const LEADER_ROLES = ["admin", "manager"];
/** Roles that can create brand-new tasks and send them (مدیریت شرکت / مدیر بخش). */
export const TASK_CREATOR_ROLES = ["admin", "manager"];
/** ویرایش محتوای تسک — فقط مدیران (شرکت/بخش)؛ حالت ویرایش از مسئول IT برداشته شد (خواسته‌ی مدیر) */
export const TASK_EDITOR_ROLES = ["admin", "manager"];
/** IT forwards received tasks to employees (without editing them). */
export const TASK_FORWARD_ROLES = ["it"];
/** Roles that can open the تسک‌دهی page (multi-row batch → مسئول IT). */
export const TASK_ASSIGNER_ROLES = ["admin", "manager"];
/** Roles that see the گزارش تسک‌ها board — همه منو را دارند، ولی هر کس فقط اسکوپ خودش را
 *  (مدیران: کل تیم | IT: تسک‌های خودش + توزیع‌شده‌ها | کارمند: فقط تسک‌های خودش).
 *  اسکوپ واقعی را سرور در GET /api/tasks تعیین می‌کند. */
export const TASK_REPORT_ROLES = ["admin", "manager", "it", "agent", "support", "insta"];
/** Roles that can log calls (ثبت تماس جدید). */
export const CALL_LOG_ROLES = ["admin", "manager", "insta"];

/**
 * Which menu items each role sees (per-role channel).
 * - مدیران (admin/manager): تسک‌دهی برای ارسال + گزارش تسک‌ها برای نظارت — تابلوی
 *   «تسک‌ها» صفحه‌ی گیرنده‌هاست (IT/کارمند) و از منوی مدیریت حذف شد (خواسته‌ی مدیر).
 *   منوهای تماس‌های روز / تماس‌های ماه / جلسات هم فقط برای مدیران است
 *   (خواسته‌ی مدیر: «فعلا فقط مدیریتی و مدیر بخش قابل نمایش باشه»؛
 *   منوهای «سرنخ‌ها» و «معاملات» حذف شدند).
 * - کارمندان (it/sales/support/insta): their tasks + personal tools only
 *   (chat, attendance, personal box, settings) — no business menus.
 */
const LEADER_VIEWS: CrmView[] = [
  "dashboard",
  "customers",
  "calls-today",
  "calls-month",
  "meetings",
  "task-assignment",
  "task-reports",
  "calls",
  "chat",
  "attendance",
  "mybox",
  "activities",
  "reports",
  "users",
  "settings",
  "rules", // قوانین و مقررات شرکت — برای همه‌ی نقش‌ها (تسک ۵۲)
];

const EMPLOYEE_VIEWS: CrmView[] = [
  "tasks",
  "task-reports", // گزارش تسک‌ها برای همه — هر کس فقط گزارش خودش را می‌بیند (اسکوپ سرور)
  "chat",
  "attendance",
  "mybox",
  "settings",
  "rules", // قوانین و مقررات شرکت — برای همه‌ی نقش‌ها، از مدیریت تا مسئولان (تسک ۵۲)
];

const ROLE_VIEWS: Record<string, CrmView[]> = {
  admin: LEADER_VIEWS,
  manager: LEADER_VIEWS,
  // مسئول IT: تسک‌های دریافتی (فقط توزیع) + گزارش تسک‌ها + ابزارهای شخصی
  it: [...EMPLOYEE_VIEWS],
  agent: EMPLOYEE_VIEWS,
  support: EMPLOYEE_VIEWS,
  // ادمین اینستاگرام: تسک‌های خودش + ثبت تماس + ابزارهای شخصی
  insta: [...EMPLOYEE_VIEWS, "calls"],
};

export function viewsForRole(role: string | undefined | null): CrmView[] {
  return ROLE_VIEWS[role ?? "agent"] ?? EMPLOYEE_VIEWS;
}

/** The page each role lands on right after login. */
export function defaultViewForRole(role: string | undefined | null): CrmView {
  return LEADER_ROLES.includes(role ?? "") ? "dashboard" : "tasks";
}

export type Permissions = {
  role: string;
  /** باشگاه مشتریان: ورود اکسل + ثبت/ویرایش دستی — فقط مدیر شرکت و مدیر بخش */
  canManageCustomers: boolean;
  /** create/update/delete deals, tasks, activities (فروش) */
  canWriteBusiness: boolean;
  /** delete customers (reserved for admin) */
  canDeleteCustomer: boolean;
  /** users management section */
  canManageUsers: boolean;
  /** admin/manager see everything read-only */
  viewOnly: boolean;
  /** company management + department head */
  isLeader: boolean;
  /** can create brand-new tasks (مدیریت شرکت / مدیر بخش) */
  canCreateTasks: boolean;
  /** can open تسک‌دهی page — multi-row batch sent only to مسئول IT */
  canAssignTaskBatches: boolean;
  /** can see the گزارش تسک‌ها board (همه دارند — هر کس فقط اسکوپ خودش: مدیران کل تیم،
   *  IT تسک‌های خودش+توزیع‌شده‌ها، کارمند فقط خودش) */
  canViewTaskReports: boolean;
  /** can log calls — ثبت تماس جدید (admin/manager/insta) */
  canLogCalls: boolean;
  /** IT forwards received tasks to employees (no editing) */
  canForwardTasks: boolean;
  /** ویرایش تسک — فقط مدیران (شرکت/بخش)؛ مسئول IT فقط تیک تسک خودش را می‌زند */
  canEditTasks: boolean;
};

export function usePermissions(): Permissions {
  const user = useCrmStore((s) => s.user);
  const role = user?.role ?? "agent";
  return {
    role,
    canManageCustomers: LEADER_ROLES.includes(role),
    canWriteBusiness: role === "agent",
    canDeleteCustomer: role === "admin",
    canManageUsers: role === "admin",
    viewOnly: LEADER_ROLES.includes(role),
    isLeader: LEADER_ROLES.includes(role),
    canCreateTasks: TASK_CREATOR_ROLES.includes(role),
    canAssignTaskBatches: TASK_ASSIGNER_ROLES.includes(role),
    canViewTaskReports: TASK_REPORT_ROLES.includes(role),
    canLogCalls: CALL_LOG_ROLES.includes(role),
    canForwardTasks: TASK_FORWARD_ROLES.includes(role),
    canEditTasks: TASK_EDITOR_ROLES.includes(role),
  };
}
