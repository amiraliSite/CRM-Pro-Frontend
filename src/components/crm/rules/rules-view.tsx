"use client";

/**
 * صفحه‌ی «قوانین و مقررات شرکت هلدینگ مهر» — تسک ۵۲
 * ------------------------------------------------------------------
 * منوی این صفحه برای «همه‌ی نقش‌ها» (مدیریت و مسئولان) در store.ts اضافه شده.
 * محتوا از src/lib/crm/company-rules.ts خوانده می‌شود — برای تغییر متن‌ها فقط
 * همان فایل را ویرایش کن؛ این کامپوننت نیازی به تغییر ندارد.
 *
 * طراحی: هم‌زبان استایل سه‌بعدی پروژه (تسک‌های ۴۹–۵۱) — قاب گرادیانی، هاله‌ی
 * تنفس‌دار پشت سربرگ، ورود آبشاری کارت‌ها با فلیپ سه‌بعدی و بلندشدن در هاور
 * با property مستقل translate (تا با انیمیشن ورود تداخل نکند — درس تسک ۴۸).
 */

import {
  Landmark,
  ScrollText,
  CalendarClock,
  Users,
  Handshake,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatJalaliLong } from "@/lib/crm/jalali";
import {
  COMPANY_NAME,
  DOC_TITLE,
  INTRO,
  LAST_UPDATED_ISO,
  RULE_SECTIONS,
  CLOSING,
} from "@/lib/crm/company-rules";

/** ارقام فارسی برای شماره‌ی بندها */
const faNum = (n: number) =>
  String(n).replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[Number(d)]);

export function RulesView() {
  const updated = formatJalaliLong(LAST_UPDATED_ISO);

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      {/* ---------- سربرگ سند: قاب گرادیانی + هاله‌ی تنفس‌دار پشت متن ---------- */}
      <section className="rules-hero overflow-hidden rounded-3xl p-6 text-center sm:p-8">
        <div className="relative z-10">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-400 to-emerald-600 text-white shadow-lg shadow-teal-500/30">
            <Landmark className="h-7 w-7" aria-hidden />
          </div>
          <p className="mt-3 text-sm font-black text-teal-700 dark:text-teal-300">
            {COMPANY_NAME}
          </p>
          <h2 className="mt-1 text-2xl font-black sm:text-3xl">{DOC_TITLE}</h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
            {INTRO}
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            <Badge
              variant="outline"
              className="gap-1.5 border-teal-600/30 bg-teal-500/10 text-teal-700 dark:text-teal-300"
            >
              <ScrollText className="h-3.5 w-3.5" aria-hidden />
              نسخه‌ی ۱٫۰
            </Badge>
            <Badge
              variant="outline"
              className="gap-1.5 border-amber-600/30 bg-amber-500/10 text-amber-700 dark:text-amber-300"
            >
              <CalendarClock className="h-3.5 w-3.5" aria-hidden />
              آخرین بازنگری: {updated}
            </Badge>
            <Badge
              variant="outline"
              className="gap-1.5 border-sky-600/30 bg-sky-500/10 text-sky-700 dark:text-sky-300"
            >
              <Users className="h-3.5 w-3.5" aria-hidden />
              لازم‌الاجرا برای همه‌ی همکاران
            </Badge>
          </div>
        </div>
      </section>

      {/* ---------- بخش‌های قوانین: کارت‌های سه‌بعدی با ورود آبشاری ---------- */}
      <div className="grid gap-4 md:grid-cols-2">
        {RULE_SECTIONS.map((section, i) => {
          const Icon = section.icon;
          return (
            <section
              key={section.title}
              className="rules-card rounded-3xl p-5 sm:p-6"
              style={{ animationDelay: `${0.08 + i * 0.06}s` }}
            >
              <h3 className="flex items-center gap-2.5 font-black">
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white shadow-md ${section.accent}`}
                  aria-hidden
                >
                  <Icon className="h-5 w-5" />
                </span>
                {section.title}
              </h3>
              <ol className="mt-3.5 space-y-2.5">
                {section.items.map((item, j) => (
                  <li key={j} className="flex items-start gap-2.5">
                    <span
                      aria-hidden
                      className="mt-1 flex h-5.5 w-5.5 shrink-0 items-center justify-center rounded-full border border-teal-600/30 bg-teal-500/10 text-[10px] font-black text-teal-700 dark:border-teal-400/30 dark:bg-teal-400/10 dark:text-teal-300"
                    >
                      {faNum(j + 1)}
                    </span>
                    <span className="text-sm leading-7 text-foreground/90">
                      {item}
                    </span>
                  </li>
                ))}
              </ol>
            </section>
          );
        })}
      </div>

      {/* ---------- کارت پایانی: تعهد مشترک ---------- */}
      <section
        className="rules-closing rounded-3xl p-6 text-center sm:p-7"
        style={{ animationDelay: `${0.08 + RULE_SECTIONS.length * 0.06}s` }}
      >
        <div className="relative z-10">
          <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-600 text-white shadow-lg shadow-amber-500/30">
            <Handshake className="h-5.5 w-5.5" aria-hidden />
          </span>
          <h3 className="mt-3 font-black">تعهد مشترک ما</h3>
          <p className="mx-auto mt-2 max-w-2xl text-sm leading-7 text-muted-foreground">
            {CLOSING}
          </p>
        </div>
      </section>
    </div>
  );
}
