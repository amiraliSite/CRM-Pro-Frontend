"use client";

import * as React from "react";
import { Sparkles, Moon, Sun, Plus, Eye, LogOut, ChevronDown } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCrmStore, usePermissions, viewsForRole, defaultViewForRole, type CrmView } from "@/lib/crm/store";
import { roleLabel } from "@/lib/crm/types";
import { useTasks } from "@/hooks/use-crm-data";
import { cn } from "@/lib/utils";
import { QuickAddDialog } from "@/components/crm/shared/quick-add-dialog";
import { GlobalSearch } from "@/components/crm/shared/global-search";
import { NotificationsBell } from "@/components/crm/shared/notifications-bell";
import { MobileBottomNav } from "@/components/crm/layout/mobile-bottom-nav";

type TopNavEntry =
  | { type: "link"; key: CrmView; label: string }
  | { type: "group"; label: string; items: { key: CrmView; label: string }[] };

/**
 * نوبار بالای صفحه در لپ‌تاپ (تسک ۴۷) — منوهای مرتبط گروه‌بندی شده‌اند و
 * سایدبار کناری حذف شده تا محتوای صفحه پهن‌تر شود و هیچ منویی اسکرول نخورد.
 * تسک ۴۸: دکمه‌ها سه‌بعدی شدند (کی‌کپ) و زیرمنوها با هاور باز می‌شوند
 * با انیمیشن سه‌بعدی تا خوردن از لبه‌ی نوبار (کلاس‌های nav3d-* در globals.css).
 * موبایل دست‌نخورده: نوار پایین + شیت «بیشتر» همان قبلی است.
 */
const TOP_NAV: TopNavEntry[] = [
  { type: "link", key: "dashboard", label: "داشبورد" },
  {
    type: "group",
    label: "مشتریان",
    items: [
      { key: "customers", label: "باشگاه مشتریان" },
      { key: "activities", label: "فعالیت‌ها" },
    ],
  },
  {
    type: "group",
    label: "تماس‌ها",
    items: [
      { key: "calls-today", label: "تماس‌های روز" },
      { key: "calls-month", label: "تماس‌های ماه" },
      { key: "calls", label: "ثبت تماس" },
    ],
  },
  { type: "link", key: "meetings", label: "جلسات" },
  {
    type: "group",
    label: "تسک‌ها",
    items: [
      { key: "tasks", label: "تسک‌ها" },
      { key: "task-assignment", label: "تسک‌دهی" },
      { key: "task-reports", label: "گزارش تسک‌ها" },
    ],
  },
  { type: "link", key: "chat", label: "چت کارمندان" },
  { type: "link", key: "attendance", label: "حضور و غیاب" },
  { type: "link", key: "mybox", label: "باکس شخصی" },
  { type: "link", key: "reports", label: "گزارش‌ها" },
  {
    type: "group",
    label: "مدیریت",
    items: [
      { key: "users", label: "ویرایش کاربران" },
      { key: "settings", label: "تنظیمات" },
    ],
  },
  // قوانین و مقررات شرکت هلدینگ مهر — برای همه‌ی نقش‌ها (تسک ۵۲)
  { type: "link", key: "rules", label: "قوانین و مقررات" },
];

/** برچسب هر ویو برای عنوان صفحه — از روی TOP_NAV ساخته می‌شود */
const TOP_NAV_LABELS: Record<string, string> = {};
for (const entry of TOP_NAV) {
  if (entry.type === "link") TOP_NAV_LABELS[entry.key] = entry.label;
  else for (const it of entry.items) TOP_NAV_LABELS[it.key] = it.label;
}

type VisibleNavEntry =
  | { label: string; key: CrmView }
  | { label: string; items: { key: CrmView; label: string }[] };

/**
 * دکمه‌ی گروهی سه‌بعدی (تسک ۴۸) — با هاور باز می‌شود، با کلیک هم باز/بسته می‌شود
 * (برای لپ‌تاپ‌های تاچ)، با Escape/کلیک بیرون/جابه‌جایی صفحه بسته می‌شود.
 * پنل با انیمیشن nav3d-unfold سه‌بعدی از لبه‌ی نوبار تا می‌خورد.
 */
function Nav3DGroup({
  label,
  items,
  active,
  alignLeft,
}: {
  label: string;
  items: { key: CrmView; label: string }[];
  active: boolean;
  alignLeft?: boolean;
}) {
  const { view, setView } = useCrmStore();
  const [open, setOpen] = React.useState(false);
  const rootRef = React.useRef<HTMLDivElement | null>(null);
  const closeTimer = React.useRef<number | null>(null);

  const openNow = React.useCallback(() => {
    if (closeTimer.current !== null) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
    setOpen(true);
  }, []);

  const closeNow = React.useCallback(() => {
    if (closeTimer.current !== null) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
    setOpen(false);
  }, []);

  // تأخیر بستن در leave تا مسیر ماوس از دکمه به پنل قطع نشود
  const closeSoon = React.useCallback(() => {
    if (closeTimer.current !== null) window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => setOpen(false), 130);
  }, []);

  // بستن با کلیک بیرون / Escape
  React.useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) closeNow();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeNow();
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, closeNow]);

  // با جابه‌جایی صفحه (مثلاً از سرچ سراسری) پنل بسته شود
  React.useEffect(() => {
    closeNow();
  }, [view, closeNow]);

  return (
    <div
      ref={rootRef}
      className="nav3d-cell relative shrink-0"
      onMouseEnter={openNow}
      onMouseLeave={closeSoon}
    >
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => (open ? closeNow() : openNow())}
        onFocus={openNow}
        className={cn(
          "nav3d-btn flex h-8 items-center gap-1 rounded-xl px-2.5 text-[12px] font-bold xl:px-3 xl:text-[13px]",
          active
            ? "nav3d-btn-active"
            : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
        )}
      >
        {label}
        <ChevronDown
          className={cn(
            "h-3 w-3 opacity-70 transition-transform duration-200",
            open && "rotate-180"
          )}
        />
      </button>

      {open && (
        <div className={cn("absolute top-full z-50 pt-2", alignLeft ? "left-0" : "right-0")}>
          <div
            role="menu"
            aria-label={label}
            className="nav3d-panel min-w-44 rounded-2xl border border-border/70 bg-popover/95 p-1.5 ring-1 ring-teal-500/20 backdrop-blur-xl"
          >
            {items.map((it) => {
              const isActive = view === it.key;
              return (
                <button
                  key={it.key}
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setView(it.key);
                    window.scrollTo({ top: 0 });
                    closeNow();
                  }}
                  className={cn(
                    "nav3d-item flex w-full items-center gap-2 rounded-xl px-3 py-2 text-right text-[13px] font-semibold",
                    isActive
                      ? "bg-teal-500/10 text-teal-700 dark:text-teal-300"
                      : "text-foreground/80 hover:bg-muted"
                  )}
                >
                  <span
                    aria-hidden
                    className={cn(
                      "nav3d-dot h-1.5 w-1.5 shrink-0 rounded-full",
                      isActive ? "nav3d-dot-live bg-teal-500" : "bg-border"
                    )}
                  />
                  {it.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function DesktopTopNav() {
  const { view, setView, user } = useCrmStore();
  const allowed = viewsForRole(user?.role);

  const navigate = React.useCallback(
    (key: CrmView) => {
      setView(key);
      window.scrollTo({ top: 0 });
    },
    [setView]
  );

  // فیلتر بر اساس نقش؛ گروهی که فقط یک آیتم مجاز بماند دکمه‌ی ساده می‌شود
  const visible: VisibleNavEntry[] = [];
  for (const entry of TOP_NAV) {
    if (entry.type === "link") {
      if (allowed.includes(entry.key)) visible.push({ key: entry.key, label: entry.label });
    } else {
      const items = entry.items.filter((it) => allowed.includes(it.key));
      if (items.length === 0) continue;
      if (items.length === 1) visible.push({ key: items[0].key, label: items[0].label });
      else visible.push({ label: entry.label, items });
    }
  }

  return (
    <nav className="hidden lg:block" aria-label="نوبار اصلی">
      {/* داک شیشه‌ای وسط‌چین (تسک ۴۹) + شفق قطبی و تیلت سه‌بعدی (تسک ۵۰) — بدون overflow تا پنل زیرمنو بریده نشود */}
      <div className="nav3d-row flex h-14 items-center justify-center px-3 sm:px-5 xl:px-6">
        <div className="nav3d-dock">
          {visible.map((entry, idx) =>
            "items" in entry ? (
              <Nav3DGroup
                key={entry.label}
                label={entry.label}
                items={entry.items}
                active={entry.items.some((it) => it.key === view)}
                alignLeft={idx >= visible.length - 2}
              />
            ) : (
              <button
                key={entry.key}
                type="button"
                onClick={() => navigate(entry.key)}
                aria-current={view === entry.key ? "page" : undefined}
                className={cn(
                  "nav3d-btn flex h-8 shrink-0 items-center rounded-xl px-2.5 text-[12px] font-bold xl:px-3 xl:text-[13px]",
                  view === entry.key
                    ? "nav3d-btn-active"
                    : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {entry.label}
              </button>
            )
          )}
        </div>
      </div>
      {/* خط نورانی زیر نوبار با پالس مسافر (تسک ۵۰) */}
      <div aria-hidden className="nav3d-neonline" />
    </nav>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { view, user, logout, setView } = useCrmStore();
  const { canWriteBusiness } = usePermissions();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  const [quickAddOpen, setQuickAddOpen] = React.useState(false);
  const { data: tasks } = useTasks();

  React.useEffect(() => setMounted(true), []);

  // Per-role channels: if the current page is not allowed for this role,
  // bounce to the role's default page (e.g. employees land on تسک‌ها).
  React.useEffect(() => {
    if (!user) return;
    if (!viewsForRole(user.role).includes(view)) {
      setView(defaultViewForRole(user.role));
    }
  }, [user, view, setView]);

  const openTasks = tasks?.filter((t) => t.status !== "done") ?? [];
  const currentLabel = TOP_NAV_LABELS[view] ?? "داشبورد";

  return (
    <div className="crm-ambient flex min-h-screen w-full bg-background">
      {/* Main content — در لپ‌تاپ سایدبار حذف شده و نوبار بالای صفحه هست (تسک ۴۷) */}
      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        {/* Header */}
        <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur-lg">
          <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
            {/* لوگوی کوچک دسکتاپ — جای لوگوی سایدبار حذف‌شده (تسک ۴۷) */}
            <div className="hidden items-center gap-2 lg:flex">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-teal-400 to-emerald-600 shadow-md shadow-teal-500/25">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <span className="text-base font-black leading-none">CRM Pro</span>
            </div>
            <span className="hidden h-6 w-px bg-sidebar-border lg:block" />

            <h1 className="hidden text-lg font-bold sm:block">{currentLabel}</h1>

            {/* Mobile: compact page title (sidebar title is hidden) */}
            <h1 className="text-base font-bold sm:hidden">CRM Pro</h1>

            <div className="flex flex-1 items-center justify-end gap-2">
              {/* User chip */}
              {user && (
                <div className="flex items-center gap-2 rounded-full border bg-card/60 py-1 pl-1 pr-2">
                  <div
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                    style={{ backgroundColor: user.color }}
                    aria-hidden
                  >
                    {user.fullName.trim().charAt(0)}
                  </div>
                  <div className="hidden text-right leading-tight md:block">
                    <div className="text-xs font-bold">{user.fullName}</div>
                    <div className="text-[10px] text-muted-foreground">
                      {roleLabel(user.role)}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={logout}
                    aria-label="خروج از حساب"
                    title="خروج از حساب"
                  >
                    <LogOut className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
              )}

              <GlobalSearch />

              <NotificationsBell />

              {mounted && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  aria-label="تغییر تم"
                >
                  {theme === "dark" ? (
                    <Sun className="h-5 w-5" />
                  ) : (
                    <Moon className="h-5 w-5" />
                  )}
                </Button>
              )}

              {canWriteBusiness ? (
                <Button
                  onClick={() => setQuickAddOpen(true)}
                  className="gap-2 bg-gradient-to-l from-teal-600 to-emerald-600 text-white shadow-md shadow-teal-500/20 hover:shadow-lg hover:shadow-teal-500/30"
                >
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">ثبت سریع</span>
                </Button>
              ) : (
                <Badge
                  variant="outline"
                  className="hidden gap-1.5 border-sky-600/30 bg-sky-500/10 px-3 py-1.5 text-sky-700 dark:text-sky-300 md:flex"
                  title="ادمین فقط مشاهده می‌کند — ثبت و ویرایش با کارشناس است"
                >
                  <Eye className="h-3.5 w-3.5" />
                  حالت نمایش
                </Badge>
              )}

              <Badge
                variant="outline"
                className="hidden gap-1.5 border-teal-600/30 bg-teal-500/10 px-3 py-1.5 text-teal-700 dark:text-teal-300 md:flex"
              >
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-500 opacity-60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-teal-500" />
                </span>
                {openTasks.length > 0
                  ? `${openTasks.length} وظیفه باز`
                  : "همه وظایف انجام شد"}
              </Badge>
            </div>
          </div>

          {/* نوبار سه‌بعدی گروهی لپ‌تاپ — زیر هدر، فقط lg به بالا؛ هاور = باز شدن زیرمنو (تسک ۴۸) */}
          <DesktopTopNav />
        </header>

        {/* pb-24 keeps content clear of the mobile bottom nav bar */}
        <main className="flex-1 px-4 pb-24 pt-6 sm:px-6 lg:px-8 lg:pb-6">{children}</main>
      </div>

      {/* Mobile bottom navigation (replaces the old drawer menu) */}
      <MobileBottomNav />

      <QuickAddDialog open={quickAddOpen} onOpenChange={setQuickAddOpen} />
    </div>
  );
}
