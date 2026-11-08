"use client";

import * as React from "react";
import {
  Settings,
  User,
  KeyRound,
  Moon,
  Sun,
  LogOut,
  ShieldCheck,
  Info,
  Crown,
  BriefcaseBusiness,
  Eye,
} from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useCrmStore } from "@/lib/crm/store";
import { authedFetch, requestLogout } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

export function SettingsView() {
  const { user } = useCrmStore();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  // change-password form state
  const [current, setCurrent] = React.useState("");
  const [next, setNext] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [msg, setMsg] = React.useState<{ ok: boolean; text: string } | null>(null);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

  const submitPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);

    if (next.length < 6) {
      setMsg({ ok: false, text: "رمز جدید باید حداقل ۶ کاراکتر باشد" });
      return;
    }
    if (next !== confirm) {
      setMsg({ ok: false, text: "تکرار رمز جدید با خودش یکسان نیست" });
      return;
    }

    setSaving(true);
    try {
      const res = await authedFetch("/api/auth/changepassword", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: current, newPassword: next }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setMsg({ ok: false, text: data.error || "خطا در تغییر رمز" });
        return;
      }
      setMsg({ ok: true, text: "رمز عبور با موفقیت عوض شد ✅" });
      setCurrent("");
      setNext("");
      setConfirm("");
    } catch {
      setMsg({ ok: false, text: "ارتباط با سرور برقرار نشد" });
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  const isAdmin = user.role === "admin";

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <div>
        <h2 className="flex items-center gap-2 text-xl font-black">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-slate-500 to-slate-700 text-white shadow-md shadow-slate-500/25">
            <Settings className="h-5 w-5" />
          </span>
          تنظیمات
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          حساب کاربری، ظاهر برنامه و امنیت
        </p>
      </div>

      {/* Profile card */}
      <div className="rounded-3xl border bg-card p-6">
        <div className="flex items-center gap-4">
          <div
            className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-xl font-black text-white shadow-lg"
            style={{ backgroundColor: user.color }}
          >
            {user.fullName.trim().charAt(0)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-lg font-black">{user.fullName}</p>
            <p dir="ltr" className="mt-0.5 text-right font-mono text-xs text-muted-foreground">
              @{user.username}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Badge
                variant="outline"
                className={cn(
                  "gap-1.5",
                  isAdmin
                    ? "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300"
                    : "border-teal-500/40 bg-teal-500/10 text-teal-700 dark:text-teal-300"
                )}
              >
                {isAdmin ? <Crown className="h-3 w-3" /> : <BriefcaseBusiness className="h-3 w-3" />}
                {isAdmin ? "مدیر سیستم" : "کارشناس فروش"}
              </Badge>
              {isAdmin && (
                <Badge
                  variant="outline"
                  className="gap-1.5 border-sky-600/30 bg-sky-500/10 text-sky-700 dark:text-sky-300"
                >
                  <Eye className="h-3 w-3" />
                  دسترسی مشاهده‌ای
                </Badge>
              )}
            </div>
          </div>
        </div>

        {!isAdmin && (
          <p className="mt-4 flex items-start gap-2 rounded-xl border border-teal-600/20 bg-teal-500/10 px-4 py-3 text-xs leading-6 text-teal-700 dark:text-teal-300">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
            تو به‌عنوان کارشناس فروش می‌تونی مشتری ثبت کنی، سرنخ‌ها رو تبدیل کنی و معامله و وظیفه بسازی.
          </p>
        )}
      </div>

      {/* Appearance */}
      <div className="rounded-3xl border bg-card p-6">
        <h3 className="flex items-center gap-2 font-bold">
          <Sun className="h-4 w-4 text-amber-500" />
          ظاهر برنامه
        </h3>
        <p className="mt-1 text-xs text-muted-foreground">
          حالت روشن یا تیره رو انتخاب کن
        </p>
        {mounted && (
          <div className="mt-4 grid grid-cols-2 gap-2">
            {[
              { key: "light", label: "روشن", icon: Sun },
              { key: "dark", label: "تیره", icon: Moon },
            ].map((opt) => {
              const Icon = opt.icon;
              const active = (resolvedTheme ?? theme) === opt.key;
              return (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setTheme(opt.key)}
                  className={cn(
                    "flex items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-bold transition-all active:scale-[0.98]",
                    active
                      ? "border-teal-500/40 bg-teal-500/10 text-teal-700 dark:text-teal-300"
                      : "bg-muted/40 text-muted-foreground hover:bg-muted"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {opt.label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Change password */}
      <div className="rounded-3xl border bg-card p-6">
        <h3 className="flex items-center gap-2 font-bold">
          <KeyRound className="h-4 w-4 text-teal-500" />
          تغییر رمز عبور
        </h3>
        <form onSubmit={submitPassword} className="mt-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cur-pass">رمز عبور فعلی</Label>
            <div className="relative">
              <User className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="cur-pass"
                dir="ltr"
                type="password"
                className="pr-9 text-left"
                placeholder="••••••••"
                value={current}
                onChange={(e) => setCurrent(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="new-pass">رمز جدید</Label>
              <Input
                id="new-pass"
                dir="ltr"
                type="password"
                className="text-left"
                placeholder="حداقل ۶ کاراکتر"
                value={next}
                onChange={(e) => setNext(e.target.value)}
                autoComplete="new-password"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="conf-pass">تکرار رمز جدید</Label>
              <Input
                id="conf-pass"
                dir="ltr"
                type="password"
                className="text-left"
                placeholder="••••••••"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                autoComplete="new-password"
                required
              />
            </div>
          </div>

          {msg && (
            <div
              className={cn(
                "crm-shake rounded-xl border px-4 py-3 text-sm leading-6",
                msg.ok
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                  : "border-destructive/30 bg-destructive/10 text-destructive"
              )}
            >
              {msg.text}
            </div>
          )}

          <Button
            type="submit"
            disabled={saving}
            className="w-full gap-2 bg-gradient-to-l from-teal-600 to-emerald-600 text-white shadow-md shadow-teal-500/20 hover:shadow-lg sm:w-auto"
          >
            <KeyRound className="h-4 w-4" />
            {saving ? "در حال ذخیره..." : "ذخیره رمز جدید"}
          </Button>
        </form>
      </div>

      {/* About */}
      <div className="rounded-3xl border bg-card p-6">
        <h3 className="flex items-center gap-2 font-bold">
          <Info className="h-4 w-4 text-muted-foreground" />
          درباره CRM Pro
        </h3>
        <p className="mt-2 text-xs leading-6 text-muted-foreground">
          نسخه حرفه‌ای سیستم مدیریت ارتباط با باشگاه مشتریان — داشبورد زنده،
          باشگاه مشتریان با ورود اکسل، سرنخ‌ها، کانبان معاملات، وظایف،
          فعالیت‌ها، گزارش‌ها و مدیریت کاربران با دو نقش مدیر و کارشناس.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {["داشبورد", "باشگاه مشتریان", "سرنخ‌ها", "معاملات", "وظایف", "گزارش‌ها", "کاربران"].map(
            (f) => (
              <Badge key={f} variant="outline" className="border-border bg-muted/40 text-[11px]">
                {f}
              </Badge>
            )
          )}
        </div>
      </div>

      {/* Logout — closes the attendance session on the server first,
          then the guest flow (welcome slides → login) takes over */}
      <Button
        variant="outline"
        onClick={() => void requestLogout()}
        className="w-full gap-2 border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
      >
        <LogOut className="h-4 w-4" />
        خروج از حساب
      </Button>
      <p className="-mt-4 text-center text-[11px] text-muted-foreground/60">
        بعد از خروج، صفحه معرفی برنامه (اسلایدها) دوباره نمایش داده می‌شه
      </p>
    </div>
  );
}
