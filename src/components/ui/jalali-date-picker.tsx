"use client";

import * as React from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toFaDigits } from "@/lib/crm/utils";
import { setJalaliPanelOpen } from "@/components/ui/jalali-panel-state";
import {
  JALALI_MONTHS,
  JALALI_WEEKDAYS_SHORT,
  formatJalaliLong,
  formatJalaliMonthYear,
  isoToJalali,
  jalaliMonthLength,
  jalaliToISO,
  jalaliWeekdayIndex,
  toGregorian,
  todayISO,
} from "@/lib/crm/jalali";

/** ارتفاع تقریبی پنل برای تصمیمِ بازشدن به بالا/پایین */
const PANEL_H = 348;

type Props = {
  /** مقدار ISO میلادی «2026-10-29» یا «» برای خالی */
  value: string;
  /** ISO جدید برمی‌گردد — «» یعنی پاک‌شده */
  onChange: (iso: string) => void;
  id?: string;
  placeholder?: string;
  className?: string;
  /** دکمه‌ی «پاک کردن» نمایش داده شود؟ (پیش‌فرض: بله) */
  clearable?: boolean;
};

/** تقویم شمسی سبک پروژه (تسک ۵۱ بخش ۳) — جایگزین input[type=date] میلادی.
 *  ظاهر تریگر عین فیلد Input پروژه است تا همه‌ی فیلدها هم‌قواره و هم‌راستا باشند؛
 *  پنل تقویم با قاب گرادیانی گرم و ورود فلیپ سه‌بعدی مثل دیالوگ‌ها باز می‌شود.
 *  مقدار داخلی همچنان ISO میلادی است تا قرارداد بک‌اند عوض نشود. */
export function JalaliDatePicker({
  value,
  onChange,
  id,
  placeholder = "انتخاب تاریخ",
  className,
  clearable = true,
}: Props) {
  const [open, setOpen] = React.useState(false);
  const [up, setUp] = React.useState(false);
  const btnRef = React.useRef<HTMLButtonElement>(null);

  // ماه/سالی که الان در پنل دیده می‌شود — با باز شدن پنل روی مقدار فعلی می‌نشیند
  const [view, setView] = React.useState(() => {
    const j = isoToJalali(value) ?? isoToJalali(todayISO());
    return { jy: j!.jy, jm: j!.jm };
  });

  const openPanel = () => {
    const j = isoToJalali(value) ?? isoToJalali(todayISO());
    setView({ jy: j!.jy, jm: j!.jm });
    const r = btnRef.current?.getBoundingClientRect();
    setUp(!!r && window.innerHeight - r.bottom < PANEL_H && r.top > PANEL_H);
    setOpen(true);
  };

  // Esc پنل را می‌بندد — capture-phase؛ جلوگیری از بستن دیالوگ با فلگ سراسری
  // (ui/dialog.tsx هنگام باز بودن پنل، preventDefault می‌کند) + stopImmediate محض احتیاط
  React.useEffect(() => {
    setJalaliPanelOpen(open);
    return () => setJalaliPanelOpen(false);
  }, [open]);
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopImmediatePropagation();
        setOpen(false);
      }
    };
    document.addEventListener("keydown", onKey, true);
    return () => document.removeEventListener("keydown", onKey, true);
  }, [open]);

  const pick = (iso: string) => {
    onChange(iso);
    setOpen(false);
  };

  const shiftMonth = (delta: number) => {
    setView((v) => {
      let jm = v.jm + delta;
      let jy = v.jy;
      if (jm < 1) {
        jm = 12;
        jy -= 1;
      } else if (jm > 12) {
        jm = 1;
        jy += 1;
      }
      return { jy, jm };
    });
  };

  const shiftYear = (delta: number) => {
    setView((v) => ({ ...v, jy: v.jy + delta }));
  };

  // گرید روزها
  const firstG = toGregorian(view.jy, view.jm, 1);
  const startCol = jalaliWeekdayIndex(firstG.gy, firstG.gm, firstG.gd); // ۰ = شنبه
  const daysInMonth = jalaliMonthLength(view.jy, view.jm);
  const today = todayISO();
  const display = value ? formatJalaliLong(value) : "";

  return (
    <div className={cn("relative", className)}>
      {/* تریگر — هم‌قواره‌ی Input پروژه تا با فیلدهای دیگر در یک راستا بنشیند */}
      <button
        ref={btnRef}
        id={id}
        type="button"
        onClick={() => (open ? setOpen(false) : openPanel())}
        aria-haspopup="dialog"
        aria-expanded={open}
        data-jalali-trigger={open ? "open" : "closed"}
        className={cn(
          "border-input dark:bg-input/30 flex h-9 w-full min-w-0 items-center justify-between gap-2 rounded-md border bg-transparent px-3 py-1 text-right shadow-xs transition-[color,box-shadow] outline-none md:text-sm",
          "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
          open && "border-ring ring-ring/50 ring-[3px]"
        )}
      >
        <span
          className={cn(
            "truncate text-sm",
            display
              ? "font-medium tabular-nums text-foreground"
              : "text-muted-foreground"
          )}
        >
          {display || placeholder}
        </span>
        <CalendarDays
          className="h-4 w-4 shrink-0 text-teal-600 dark:text-teal-300"
          aria-hidden
        />
      </button>

      {open && (
        <>
          {/* لایه‌ی بستن با کلیک بیرون — داخل دیالوگ است، دیالوگ را نمی‌بندد */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div
            role="dialog"
            aria-label="تقویم شمسی"
            dir="rtl"
            className={cn(
              "jalali-panel absolute right-0 z-50 w-[19rem] max-w-[calc(100vw-2.5rem)] rounded-xl p-3",
              up ? "bottom-full mb-2" : "top-full mt-2"
            )}
            style={{ transformOrigin: up ? "center bottom" : "center top" }}
          >
            {/* سرستون: سال و ماه */}
            <div className="mb-2 flex items-center justify-between gap-1">
              <div className="flex items-center gap-0.5">
                <button
                  type="button"
                  onClick={() => shiftYear(1)}
                  title="سال بعد"
                  aria-label="سال بعد"
                  className="jalali-nav-btn"
                >
                  <ChevronsLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => shiftMonth(1)}
                  title="ماه بعد"
                  aria-label="ماه بعد"
                  className="jalali-nav-btn"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
              </div>
              <p className="select-none text-sm font-bold tabular-nums">
                {formatJalaliMonthYear(view.jy, view.jm)}
              </p>
              <div className="flex items-center gap-0.5">
                <button
                  type="button"
                  onClick={() => shiftMonth(-1)}
                  title="ماه قبل"
                  aria-label="ماه قبل"
                  className="jalali-nav-btn"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => shiftYear(-1)}
                  title="سال قبل"
                  aria-label="سال قبل"
                  className="jalali-nav-btn"
                >
                  <ChevronsRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* روزهای هفته */}
            <div className="grid grid-cols-7 gap-1">
              {JALALI_WEEKDAYS_SHORT.map((d) => (
                <span
                  key={d}
                  className="flex h-6 items-center justify-center text-[11px] font-semibold text-muted-foreground"
                >
                  {d}
                </span>
              ))}
              {/* خانه‌های خالی اول ماه */}
              {Array.from({ length: startCol }).map((_, i) => (
                <span key={`b${i}`} aria-hidden />
              ))}
              {/* روزها */}
              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
                const iso = jalaliToISO(view.jy, view.jm, day);
                const isSel = iso === value;
                const isToday = iso === today;
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => pick(iso)}
                    className={cn(
                      "jalali-day relative flex h-8 items-center justify-center rounded-lg text-[13px] font-medium tabular-nums transition-[background-color,box-shadow,color] duration-150",
                      isSel
                        ? "jalali-day-sel bg-gradient-to-l from-teal-600 to-emerald-600 text-white shadow-md"
                        : "text-foreground hover:bg-teal-500/15 hover:shadow-sm",
                      !isSel && isToday &&
                        "ring-1 ring-inset ring-teal-500/60 text-teal-700 dark:text-teal-300"
                    )}
                  >
                    {toFaDigits(day)}
                  </button>
                );
              })}
            </div>

            {/* پانوشت */}
            <div className="mt-2 flex items-center justify-between gap-2 border-t pt-2">
              <button
                type="button"
                onClick={() => pick(today)}
                className="rounded-md px-2 py-1 text-xs font-semibold text-teal-700 transition-colors hover:bg-teal-500/15 dark:text-teal-300"
              >
                امروز
              </button>
              {clearable && value && (
                <button
                  type="button"
                  onClick={() => pick("")}
                  className="rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  پاک کردن
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
