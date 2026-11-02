/**
 * داده‌ی نمونه‌ی «کارتابل تامین اجناس» — تسک ۵۳
 * ------------------------------------------------------------------
 * مدیر خواسته یه UI پیش‌فرض خفن برای کارتابل باشد و فیلدها را بعداً
 * شخصی‌سازی کنیم. پس کل دیتای این صفحه از همین فایل می‌آید و به
 * بک‌اند (Render) وصل نیست — هیچ رکوردی در دیتابیس واقعی ساخته نمی‌شود.
 *
 * برای شخصی‌سازی بعدی:
 *  1) فیلدهای ProcurementItem را همین‌جا کم/زیاد کن (UI خودش دنبالش می‌آید
 *     یا در آن مرحله ستون‌ها را با هم جابه‌جا می‌کنیم)
 *  2) رکوردهای SAMPLE_PROCUREMENT را حذف/جایگزین کن
 *  3) بعداً این فایل با API واقعی جایگزین می‌شود (قراردادش همان‌جا مشخص می‌شود)
 */

import type { LucideIcon } from "lucide-react";
import { PackageSearch, PackagePlus, PackageCheck, Ban, Hourglass } from "lucide-react";

/** وضعیت‌های کارتابل — آیکن و رنگ هر وضعیت این‌جاست */
export const PROCUREMENT_STATUS = {
  pending: {
    label: "در انتظار بررسی",
    icon: Hourglass,
    badge:
      "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300",
    stat: "from-amber-500 to-orange-600 shadow-amber-500/25",
  },
  supplying: {
    label: "در حال تامین",
    icon: PackagePlus,
    badge:
      "border-sky-500/40 bg-sky-500/10 text-sky-700 dark:text-sky-300",
    stat: "from-sky-500 to-blue-600 shadow-sky-500/25",
  },
  done: {
    label: "تحویل شد",
    icon: PackageCheck,
    badge:
      "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    stat: "from-emerald-500 to-teal-600 shadow-emerald-500/25",
  },
  canceled: {
    label: "لغو شد",
    icon: Ban,
    badge:
      "border-rose-500/40 bg-rose-500/10 text-rose-700 dark:text-rose-300",
    stat: "from-rose-500 to-pink-600 shadow-rose-500/25",
  },
} as const;

export type ProcurementStatus = keyof typeof PROCUREMENT_STATUS;

export type ProcurementItem = {
  id: string;
  /** کد درخواست — مثل TA-1042 */
  code: string;
  /** عنوان اجناس درخواستی */
  title: string;
  category: string;
  requesterName: string;
  department: string;
  qty: number;
  unit: string;
  priority: "urgent" | "normal";
  status: ProcurementStatus;
  /** تاریخ درخواست (ISO میلادی — نمایش شمسی است) */
  requestedISO: string;
  note: string;
};

export const PRIORITY_META = {
  urgent: {
    label: "فوری",
    badge:
      "border-rose-500/40 bg-rose-500/10 text-rose-700 dark:text-rose-300",
  },
  normal: {
    label: "عادی",
    badge:
      "border-slate-500/40 bg-slate-500/10 text-slate-600 dark:text-slate-300",
  },
} as const;

/** رکوردهای نمونه‌ی پیش‌فرض — تا قبل از شخصی‌سازی و اتصال به بک‌اند */
export const SAMPLE_PROCUREMENT: ProcurementItem[] = [
  {
    id: "p1",
    code: "TA-1042",
    title: "کاغذ A4 و لوازم التحریر اداری",
    category: "لوازم اداری",
    requesterName: "سمیرا احمدی",
    department: "پشتیبانی",
    qty: 40,
    unit: "بسته",
    priority: "normal",
    status: "pending",
    requestedISO: "2026-10-28",
    note: "برای بسته‌های خوش‌آمدگویی مشتریان جدید بخش فروش هم درخواست داده.",
  },
  {
    id: "p2",
    code: "TA-1043",
    title: "هارد اکسترنال ۲ ترابایت",
    category: "تجهیزات IT",
    requesterName: "امیر رضایی",
    department: "مسئول IT",
    qty: 3,
    unit: "دستگاه",
    priority: "urgent",
    status: "supplying",
    requestedISO: "2026-10-26",
    note: "برای بکاپ ماهانه‌ی دیتابیس CRM؛ تحویل تا آخر هفته الزامی است.",
  },
  {
    id: "p3",
    code: "TA-1044",
    title: "کارت ویزیت جدید لوگوی هلدینگ",
    category: "چاپ و تبلیغات",
    requesterName: "مریم کریمی",
    department: "مدیریت فروش",
    qty: 500,
    unit: "عدد",
    priority: "normal",
    status: "supplying",
    requestedISO: "2026-10-24",
    note: "طرح نهایی از سوی مدیریت تایید شده؛ چاپخانه تحویل ۵ روز کاری داده.",
  },
  {
    id: "p4",
    code: "TA-1045",
    title: "هدایای باشگاه مشتریان (جاکلیدی و تقویم)",
    category: "هدایای تبلیغاتی",
    requesterName: "علی محمدی",
    department: "باشگاه مشتریان",
    qty: 200,
    unit: "دست",
    priority: "normal",
    status: "done",
    requestedISO: "2026-10-18",
    note: "تحویل انبار شرکت شد؛ رسید امضا شده در باکس شخصی نگهداری می‌شود.",
  },
  {
    id: "p5",
    code: "TA-1046",
    title: "شارژر و کابل شارژ میز کارشناسان",
    category: "تجهیزات IT",
    requesterName: "امیر رضایی",
    department: "مسئول IT",
    qty: 12,
    unit: "ست",
    priority: "normal",
    status: "done",
    requestedISO: "2026-10-15",
    note: "بین کارشناسان فروش و پشتیبانی توزیع شد.",
  },
  {
    id: "p6",
    code: "TA-1047",
    title: "پک پذیرایی جلسه‌ی هیئت‌مدیره",
    category: "پذیرایی",
    requesterName: "نرگس حسینی",
    department: "مدیریت شرکت",
    qty: 1,
    unit: "بسته",
    priority: "urgent",
    status: "pending",
    requestedISO: "2026-10-30",
    note: "جلسه‌ی هفته‌ی آینده؛ هماهنگی با پذیرایی انجام شد.",
  },
  {
    id: "p7",
    code: "TA-1048",
    title: "تابلو لایت‌باکس ورودی دفتر",
    category: "چاپ و تبلیغات",
    requesterName: "علی محمدی",
    department: "باشگاه مشتریان",
    qty: 1,
    unit: "دستگاه",
    priority: "normal",
    status: "canceled",
    requestedISO: "2026-10-12",
    note: "با تغییر دکوراسیون جدید دفتر، این درخواست لغو شد.",
  },
];

/** آیکن سربرگ کارتابل */
export const PROCUREMENT_HERO_ICON: LucideIcon = PackageSearch;
