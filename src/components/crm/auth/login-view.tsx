"use client";

import * as React from "react";
import {
  Sparkles,
  User,
  Lock,
  LogIn,
  Eye,
  EyeOff,
  Crown,
  BriefcaseBusiness,
  WandSparkles,
  KeyRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { completeLogin } from "@/lib/auth-client";
import { apiUrl } from "@/lib/api-base";
import type { AuthUser } from "@/lib/crm/store";
import { ROLE_LABELS } from "@/lib/crm/types";
import { cn } from "@/lib/utils";

type LoginMode =
  | "admin"
  | "manager"
  | "it"
  | "agent"
  | "support"
  | "insta";

type ModeConfig = {
  label: string;
  submitLabel: string;
  desc: string;
  demo: { username: string; password: string };
  group: "leaders" | "staff";
  /** gradient for logo tile + active chip + submit button */
  gradient: string;
  shadow: string;
  ring: string;
  hintClass: string;
};

const MODES: Record<LoginMode, ModeConfig> = {
  admin: {
    label: "مدیریت شرکت",
    submitLabel: "ورود مدیریت",
    desc: "دسترسی کامل به همه بخش‌ها، مدیریت کاربران و نظارت بر تیم",
    demo: { username: "admin", password: "admin123" },
    group: "leaders",
    gradient: "from-amber-400 to-orange-600",
    shadow: "shadow-amber-500/30 hover:shadow-amber-500/40",
    ring: "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300",
    hintClass:
      "border-amber-600/20 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  },
  manager: {
    label: "مدیر بخش",
    submitLabel: "ورود مدیر بخش",
    desc: "نظارت بر گزارش‌ها، تسک‌دهی به کارمندان و حضور و غیاب",
    demo: { username: "manager", password: "manager123" },
    group: "leaders",
    gradient: "from-violet-400 to-purple-600",
    shadow: "shadow-violet-500/30 hover:shadow-violet-500/40",
    ring: "border-violet-500/40 bg-violet-500/10 text-violet-700 dark:text-violet-300",
    hintClass:
      "border-violet-600/20 bg-violet-500/10 text-violet-700 dark:text-violet-300",
  },
  it: {
    label: "مسئول IT",
    submitLabel: "ورود مسئول IT",
    desc: "تسک‌دهی به کارمندان، پیگیری انجام کار و چت با تیم",
    demo: { username: "it", password: "it123456" },
    group: "staff",
    gradient: "from-cyan-400 to-teal-600",
    shadow: "shadow-cyan-500/25 hover:shadow-cyan-500/30",
    ring: "border-cyan-500/40 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300",
    hintClass:
      "border-cyan-600/20 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300",
  },
  agent: {
    label: "مسئول فروش",
    submitLabel: "ورود مسئول فروش",
    desc: "باشگاه مشتریان، سرنخ‌ها، معاملات و فعالیت‌های فروش",
    demo: { username: "sales", password: "123456" },
    group: "staff",
    gradient: "from-teal-400 to-emerald-600",
    shadow: "shadow-teal-500/25 hover:shadow-teal-500/30",
    ring: "border-teal-500/40 bg-teal-500/10 text-teal-700 dark:text-teal-300",
    hintClass:
      "border-teal-600/20 bg-teal-500/10 text-teal-700 dark:text-teal-300",
  },
  support: {
    label: "پشتیبان",
    submitLabel: "ورود پشتیبان",
    desc: "وظایف روزانه، چت با تیم و گزارش کارهای انجام‌شده",
    demo: { username: "support", password: "support123" },
    group: "staff",
    gradient: "from-emerald-400 to-green-600",
    shadow: "shadow-emerald-500/25 hover:shadow-emerald-500/30",
    ring: "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    hintClass:
      "border-emerald-600/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  },
  insta: {
    label: "ادمین اینستاگرام",
    submitLabel: "ورود ادمین اینستاگرام",
    desc: "وظایف محتوایی، پیگیری کارهای روزانه و هماهنگی با تیم",
    demo: { username: "insta", password: "insta1234" },
    group: "staff",
    gradient: "from-pink-400 to-rose-600",
    shadow: "shadow-pink-500/25 hover:shadow-pink-500/30",
    ring: "border-pink-500/40 bg-pink-500/10 text-pink-700 dark:text-pink-300",
    hintClass:
      "border-pink-600/20 bg-pink-500/10 text-pink-700 dark:text-pink-300",
  },
};

const LEADER_MODES: LoginMode[] = ["admin", "manager"];
const STAFF_MODES: LoginMode[] = ["it", "agent", "support", "insta"];

function RoleChip({
  m,
  cfg,
  active,
  onSelect,
}: {
  m: LoginMode;
  cfg: ModeConfig;
  active: boolean;
  onSelect: (m: LoginMode) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(m)}
      aria-pressed={active}
      className={cn(
        "rounded-xl px-2 py-2.5 text-xs font-bold transition-all",
        active
          ? cn("bg-gradient-to-l text-white shadow-lg", cfg.gradient, cfg.shadow)
          : "border bg-muted/40 text-muted-foreground hover:bg-background hover:text-foreground"
      )}
    >
      {cfg.label}
    </button>
  );
}

export function LoginView() {
  const [mode, setMode] = React.useState<LoginMode>("admin");
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [error, setError] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const cfg = MODES[mode];

  const switchMode = (m: LoginMode) => {
    if (m === mode) return;
    setMode(m);
    setError("");
    setPassword("");
  };

  const fillDemo = () => {
    setUsername(cfg.demo.username);
    setPassword(cfg.demo.password);
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(apiUrl("/api/auth/login"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      let data: { error?: string; token?: string; user?: AuthUser } = {};
      try {
        data = await res.json();
      } catch {
        /* non-JSON response — fall through with empty data */
      }

      if (!res.ok) {
        // Show the server's specific message (e.g. stale Prisma client guide)
        // and fall back to a generic one only when there is none.
        setError(
          data.error ||
            (res.status >= 500
              ? "خطای سرور — چند لحظه بعد دوباره تلاش کن. اگر روی سیستم خودت هستی، برنامه را ببند و RUN را دوباره اجرا کن."
              : "خطا در ورود")
        );
        return;
      }

      const user = data.user as AuthUser;
      if (!data.token || !user) {
        setError("پاسخ نامعتبر از سرور — دوباره تلاش کن");
        return;
      }
      if (user.role !== mode) {
        setError(
          `این حساب «${
            ROLE_LABELS[user.role as LoginMode] ?? user.role
          }» است — از بخش مربوطه وارد شو`
        );
        return;
      }

      completeLogin(data.token, user);
    } catch {
      setError("ارتباط با سرور برقرار نشد — مطمئن شو برنامه در حال اجراست");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4">
      {/* Decorative background blobs */}
      <div
        className={cn(
          "pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full blur-3xl transition-colors duration-700",
          mode === "admin" || mode === "manager" ? "bg-amber-500/15" : "bg-teal-500/15"
        )}
      />
      <div className="pointer-events-none absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-violet-500/15 blur-3xl" />
      <div className="pointer-events-none absolute left-1/3 top-1/4 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />

      <div className="crm-fade-up relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <div
            key={mode}
            className={cn(
              "crm-fade-up flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br shadow-xl",
              cfg.gradient,
              cfg.shadow
            )}
          >
            <Crown
              className={cn(
                "h-8 w-8 text-white",
                cfg.group !== "leaders" && "hidden"
              )}
            />
            <Sparkles
              className={cn(
                "h-8 w-8 text-white",
                cfg.group === "leaders" && "hidden"
              )}
            />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight">CRM Pro</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              سیستم مدیریت ارتباط با باشگاه مشتریان
            </p>
          </div>
        </div>

        {/* Login card */}
        <div className="rounded-3xl border bg-card/80 p-8 shadow-2xl shadow-black/5 backdrop-blur-xl">
          {/* ── Role sections: مدیران / کارمندان ── */}
          <div className="space-y-3">
            <div>
              <p className="mb-1.5 flex items-center gap-1.5 px-1 text-[11px] font-bold text-muted-foreground">
                <Crown className="h-3.5 w-3.5 text-amber-500" />
                مدیران
              </p>
              <div className="grid grid-cols-2 gap-2">
                {LEADER_MODES.map((m) => (
                  <RoleChip
                    key={m}
                    m={m}
                    cfg={MODES[m]}
                    active={mode === m}
                    onSelect={switchMode}
                  />
                ))}
              </div>
            </div>
            <div>
              <p className="mb-1.5 flex items-center gap-1.5 px-1 text-[11px] font-bold text-muted-foreground">
                <BriefcaseBusiness className="h-3.5 w-3.5 text-teal-500" />
                کارمندان
              </p>
              <div className="grid grid-cols-2 gap-2">
                {STAFF_MODES.map((m) => (
                  <RoleChip
                    key={m}
                    m={m}
                    cfg={MODES[m]}
                    active={mode === m}
                    onSelect={switchMode}
                  />
                ))}
              </div>
            </div>
          </div>

          <div key={mode} className="crm-fade-up">
            <h2 className="mt-6 text-lg font-bold">ورود {cfg.label}</h2>
            <p className="mt-1 text-xs text-muted-foreground">{cfg.desc}</p>

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">نام کاربری</Label>
                <div className="relative">
                  <User className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="username"
                    dir="ltr"
                    className="pr-9 text-left"
                    placeholder={cfg.demo.username}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    autoComplete="username"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">رمز عبور</Label>
                <div className="relative">
                  <Lock className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    dir="ltr"
                    className="pr-9 pl-9 text-left"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label="نمایش رمز"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <div className="crm-shake rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm leading-6 text-destructive">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className={cn(
                  "w-full gap-2 bg-gradient-to-l py-6 text-base text-white shadow-lg transition-all hover:shadow-xl disabled:opacity-60",
                  cfg.gradient,
                  cfg.shadow
                )}
              >
                {/* Both nodes always mounted — toggled via CSS only, so React
                    never inserts/removes DOM nodes here. This keeps the button
                    safe against DOM-tampering (e.g. browser extensions) that
                    causes "insertBefore" NotFoundError crashes. */}
                <span
                  aria-hidden
                  className={cn(
                    "h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white",
                    !loading && "hidden"
                  )}
                />
                <LogIn className={cn("h-5 w-5", loading && "hidden")} />
                {cfg.submitLabel}
              </Button>
            </form>

            {/* Quick-fill demo */}
            <button
              type="button"
              onClick={fillDemo}
              className={cn(
                "mt-4 flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-3 text-xs font-bold transition-all hover:brightness-105",
                cfg.ring
              )}
            >
              <WandSparkles className="h-4 w-4" />
              پرکردن سریع حساب نمونه {cfg.label}
            </button>

            <div
              className={cn(
                "mt-3 rounded-xl border px-4 py-3 text-center text-xs leading-6",
                cfg.hintClass
              )}
            >
              <span className="font-bold">حساب نمونه {cfg.label}:</span>
              <span dir="ltr" className="ms-2 font-mono text-[11px]">
                {cfg.demo.username} / {cfg.demo.password}
              </span>
            </div>

            <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-[11px] text-muted-foreground/70">
              <KeyRound className="h-3 w-3" />
              رمز عبورت را فراموش کردی؟ از مدیر سیستم بخواه از بخش «کاربران» ریستش کند
            </p>
          </div>
        </div>

        <p className="mt-6 text-center text-[11px] text-muted-foreground/60">
          CRM Pro — نسخه حرفه‌ای با احراز هویت امن
        </p>
      </div>
    </div>
  );
}
