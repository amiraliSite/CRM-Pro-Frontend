"use client";

import * as React from "react";
import {
  Sparkles,
  Crown,
  PhoneCall,
  BarChart3,
  ArrowLeft,
  LogIn,
  CalendarCheck,
  Smartphone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Slide = {
  key: string;
  title: string;
  desc: string;
  icon: React.ElementType;
  gradient: string;
  shadow: string;
  blob: string;
  deco1: React.ElementType;
  deco2: React.ElementType;
};

const SLIDES: Slide[] = [
  {
    key: "welcome",
    title: "خوش اومدی به CRM Pro",
    desc: "سیستم حرفه‌ای مدیریت ارتباط با باشگاه مشتریان؛ همه‌چیز در یک پنل جمع‌وجور و فارسی.",
    icon: Sparkles,
    gradient: "from-teal-400 to-emerald-600",
    shadow: "shadow-teal-500/30",
    blob: "bg-teal-500/20",
    deco1: CalendarCheck,
    deco2: BarChart3,
  },
  {
    key: "customers",
    title: "باشگاه مشتریان",
    desc: "مشتری‌هات رو دستی وارد کن یا با یک فایل اکسل همه رو یکجا بیار؛ با وضعیت و سابقه کامل.",
    icon: Crown,
    gradient: "from-amber-400 to-orange-600",
    shadow: "shadow-amber-500/30",
    blob: "bg-amber-500/20",
    deco1: Sparkles,
    deco2: Crown,
  },
  {
    key: "calls-meetings",
    title: "تماس‌ها و جلسات",
    desc: "تعداد تماس‌های روز و ماه را یک‌جا ببین و جلسات برگزارشده را با موضوع و کیفیت ثبت کن.",
    icon: PhoneCall,
    gradient: "from-violet-400 to-fuchsia-600",
    shadow: "shadow-violet-500/30",
    blob: "bg-violet-500/20",
    deco1: CalendarCheck,
    deco2: PhoneCall,
  },
  {
    key: "reports",
    title: "گزارش و همراهی موبایل",
    desc: "داشبورد زنده با گزارش‌های دقیق؛ و روی موبایل با نوار پایین صفحه همه‌چیز سرت دستته.",
    icon: BarChart3,
    gradient: "from-rose-400 to-rose-600",
    shadow: "shadow-rose-500/30",
    blob: "bg-rose-500/20",
    deco1: Smartphone,
    deco2: BarChart3,
  },
];

export function OnboardingView({ onFinish }: { onFinish: () => void }) {
  const [step, setStep] = React.useState(0);
  const last = step === SLIDES.length - 1;
  const slide = SLIDES[step];
  const Icon = slide.icon;
  const Deco1 = slide.deco1;
  const Deco2 = slide.deco2;

  const next = () => (last ? onFinish() : setStep((s) => s + 1));

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-background">
      {/* Decorative background blobs */}
      <div
        key={`blob-${slide.key}`}
        className={cn(
          "pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full blur-3xl transition-colors duration-700",
          slide.blob
        )}
      />
      <div className="pointer-events-none absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl" />

      {/* Skip — corner button (goes straight to login) */}
      <div className="relative z-10 flex items-center justify-between px-5 pt-5">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-teal-400 to-emerald-600 shadow-md shadow-teal-500/25">
            <Sparkles className="h-4.5 w-4.5 text-white" />
          </div>
          <span className="text-sm font-black">CRM Pro</span>
        </div>
        <button
          type="button"
          onClick={onFinish}
          className="rounded-full border bg-card/70 px-4 py-1.5 text-xs font-bold text-muted-foreground backdrop-blur transition-colors hover:text-foreground"
        >
          رد کردن
        </button>
      </div>

      {/* Slide content */}
      <div
        key={slide.key}
        className="crm-fade-up relative z-10 flex flex-1 flex-col items-center justify-center gap-8 px-6 pb-10 text-center"
      >
        {/* Big icon tile with floating decorations */}
        <div className="relative">
          <div
            className={cn(
              "pointer-events-none absolute -right-7 -top-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-card shadow-md",
              "crm-fade-up"
            )}
            style={{ animationDelay: "120ms" }}
            aria-hidden
          >
            <Deco1 className="h-5 w-5 text-muted-foreground/60" />
          </div>
          <div
            className={cn(
              "pointer-events-none absolute -bottom-5 -left-8 flex h-14 w-14 items-center justify-center rounded-2xl bg-card shadow-md",
              "crm-fade-up"
            )}
            style={{ animationDelay: "240ms" }}
            aria-hidden
          >
            <Deco2 className="h-6 w-6 text-muted-foreground/60" />
          </div>

          <div
            className={cn(
              "flex h-36 w-36 items-center justify-center rounded-[2.5rem] bg-gradient-to-br shadow-2xl transition-colors duration-500",
              slide.gradient,
              slide.shadow
            )}
          >
            <Icon className="h-16 w-16 text-white" strokeWidth={1.8} />
          </div>
        </div>

        {/* Title + description */}
        <div className="max-w-md">
          <h1 className="text-2xl font-black leading-relaxed sm:text-3xl">
            {slide.title}
          </h1>
          <p className="mt-3 text-sm leading-7 text-muted-foreground sm:text-base">
            {slide.desc}
          </p>
        </div>

        {/* Dots indicator */}
        <div className="flex items-center gap-2" role="tablist" aria-label="مرحله اسلاید">
          {SLIDES.map((s, i) => (
            <button
              key={s.key}
              type="button"
              role="tab"
              aria-selected={i === step}
              aria-label={`اسلاید ${i + 1}`}
              onClick={() => setStep(i)}
              className={cn(
                "h-2 rounded-full transition-all duration-300",
                i === step
                  ? "w-8 bg-gradient-to-l from-teal-500 to-emerald-500"
                  : "w-2 bg-muted-foreground/25 hover:bg-muted-foreground/45"
              )}
            />
          ))}
        </div>
      </div>

      {/* Bottom action bar */}
      <div
        className="relative z-10 px-6"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 1.75rem)" }}
      >
        <div className="mx-auto flex w-full max-w-md items-center gap-3">
          {/* Secondary: previous (hidden on first slide) */}
          <div className="w-28 shrink-0">
            {step > 0 && (
              <Button
                variant="ghost"
                onClick={() => setStep((s) => s - 1)}
                className="w-full gap-1.5 text-muted-foreground"
              >
                قبلی
              </Button>
            )}
          </div>

          {/* Primary: next / start */}
          <Button
            onClick={next}
            className={cn(
              "h-13 flex-1 gap-2 bg-gradient-to-l py-6 text-base font-black text-white shadow-lg transition-all hover:shadow-xl",
              slide.gradient,
              slide.shadow
            )}
          >
            {last ? (
              <>
                <LogIn className="h-5 w-5" />
                شروع و ورود به حساب
              </>
            ) : (
              <>
                بعدی
                <ArrowLeft className="h-5 w-5" />
              </>
            )}
          </Button>
        </div>

        <p className="mt-4 text-center text-[11px] text-muted-foreground/60">
          {step + 1} از {SLIDES.length} — این صفحه هر بار بعد از خروج از حساب نمایش داده می‌شه
        </p>
      </div>
    </div>
  );
}
