"use client";

import * as React from "react";
import {
  LayoutDashboard,
  Crown,
  BarChart3,
  Settings,
  Ellipsis,
  CheckSquare,
  ListChecks,
  ClipboardList,
  PhoneCall,
  PhoneIncoming,
  PhoneOutgoing,
  CalendarCheck,
  History,
  Users,
  MessagesSquare,
  CalendarClock,
  StickyNote,
  ScrollText,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useCrmStore, viewsForRole, type CrmView } from "@/lib/crm/store";
import { cn } from "@/lib/utils";

type BottomNavItem = {
  key: CrmView;
  label: string;
  icon: React.ElementType;
};

/** The primary items requested for the mobile bottom bar */
const MAIN_ITEMS: BottomNavItem[] = [
  { key: "dashboard", label: "داشبورد", icon: LayoutDashboard },
  { key: "customers", label: "مشتریان", icon: Crown },
  { key: "reports", label: "گزارشات", icon: BarChart3 },
  { key: "settings", label: "تنظیمات", icon: Settings },
];

/** Secondary items kept reachable via the «بیشتر» sheet */
const MORE_ITEMS: (BottomNavItem & { adminOnly?: boolean })[] = [
  { key: "calls-today", label: "تماس‌های روز", icon: PhoneIncoming },
  { key: "calls-month", label: "تماس‌های ماه", icon: PhoneOutgoing },
  { key: "meetings", label: "جلسات", icon: CalendarCheck },
  { key: "tasks", label: "تسک‌ها", icon: CheckSquare },
  { key: "task-assignment", label: "تسک‌دهی", icon: ListChecks },
  { key: "task-reports", label: "گزارش تسک‌ها", icon: ClipboardList },
  { key: "calls", label: "ثبت تماس", icon: PhoneCall },
  { key: "chat", label: "چت", icon: MessagesSquare },
  { key: "attendance", label: "حضور", icon: CalendarClock },
  { key: "mybox", label: "باکس من", icon: StickyNote },
  { key: "activities", label: "فعالیت‌ها", icon: History },
  { key: "users", label: "ویرایش کاربران", icon: Users, adminOnly: true },
  // قوانین و مقررات شرکت — همه‌ی نقش‌ها (تسک ۵۲)
  { key: "rules", label: "قوانین", icon: ScrollText },
];

export function MobileBottomNav() {
  const { view, setView, user } = useCrmStore();
  const [moreOpen, setMoreOpen] = React.useState(false);
  const allowed = viewsForRole(user?.role);

  const mainVisible = MAIN_ITEMS.filter((item) => allowed.includes(item.key));
  const moreVisible = MORE_ITEMS.filter(
    (item) =>
      allowed.includes(item.key) && (!item.adminOnly || user?.role === "admin")
  );
  const moreActive = moreVisible.some((item) => item.key === view);

  const go = (key: CrmView) => {
    setView(key);
    setMoreOpen(false);
    // Scroll to top so the new page starts at the beginning on mobile
    window.scrollTo({ top: 0 });
  };

  return (
    <>
      {/* Bottom bar — mobile only (hidden from lg up, where the sidebar lives) */}
      <nav
        aria-label="ناوبری موبایل"
        className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 backdrop-blur-lg lg:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div
          className="mx-auto grid max-w-lg px-1"
          style={{ gridTemplateColumns: `repeat(${mainVisible.length + 1}, minmax(0, 1fr))` }}
        >
          {mainVisible.map((item) => {
            const Icon = item.icon;
            const active = view === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => go(item.key)}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group relative flex flex-col items-center gap-1 px-1 pb-2 pt-2.5 text-[10px] font-medium transition-colors",
                  active
                    ? "text-teal-600 dark:text-teal-400"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {/* Active pill indicator */}
                <span
                  aria-hidden
                  className={cn(
                    "absolute -top-px h-0.5 w-8 rounded-full bg-gradient-to-l from-teal-500 to-emerald-500 transition-opacity",
                    active ? "opacity-100" : "opacity-0"
                  )}
                />
                <span
                  aria-hidden
                  className={cn(
                    "pointer-events-none absolute inset-x-2 bottom-1 -z-10 h-9 rounded-xl transition-colors",
                    active && "bg-teal-500/10 dark:bg-teal-400/10"
                  )}
                />
                <Icon
                  className={cn(
                    "h-5 w-5 transition-transform",
                    active && "scale-110"
                  )}
                  strokeWidth={active ? 2.4 : 2}
                />
                {item.label}
              </button>
            );
          })}

          {/* More (بیشتر) */}
          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            aria-haspopup="dialog"
            aria-expanded={moreOpen}
            className={cn(
              "group relative flex flex-col items-center gap-1 px-1 pb-2 pt-2.5 text-[10px] font-medium transition-colors",
              moreActive
                ? "text-teal-600 dark:text-teal-400"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Ellipsis
              className={cn(
                "h-5 w-5 transition-transform",
                moreActive && "scale-110"
              )}
              strokeWidth={moreActive ? 2.4 : 2}
            />
            بیشتر
          </button>
        </div>
      </nav>

      {/* «بیشتر» bottom sheet — secondary sections */}
      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent
          side="bottom"
          className="rounded-t-3xl px-4 pb-8 pt-4 notranslate"
          translate="no"
        >
          <SheetHeader className="text-right">
            <SheetTitle>بخش‌های بیشتر</SheetTitle>
            <SheetDescription>بقیه ماژول‌های CRM</SheetDescription>
          </SheetHeader>
          {/* (تسک ۵۱) اگر تعداد تایل‌ها فرد باشد، تایل آخر تنها می‌ماند و کنارش حفره‌ی خالی
              می‌افتد — تایل آخر در این حالت col-span-2 می‌شود تا ردیف پایین کامل و مرتب باشد */}
          <div className="mt-2 grid grid-cols-2 gap-2">
            {moreVisible.map((item, idx) => {
              const Icon = item.icon;
              const active = view === item.key;
              const isOrphan =
                moreVisible.length % 2 === 1 && idx === moreVisible.length - 1;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => go(item.key)}
                  className={cn(
                    "crm-sheet-tile flex items-center gap-3 rounded-2xl border px-4 py-4 text-sm font-bold transition-all active:scale-[0.98]",
                    isOrphan && "col-span-2",
                    active
                      ? "border-teal-500/40 bg-teal-500/10 text-teal-700 dark:text-teal-300"
                      : "bg-card hover:bg-muted/60"
                  )}
                >
                  <span
                    className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                      active
                        ? "bg-gradient-to-br from-teal-400 to-emerald-600 text-white shadow-md shadow-teal-500/25"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  {item.label}
                </button>
              );
            })}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
