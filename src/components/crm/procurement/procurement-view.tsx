"use client";

/**
 * کارتابل تامین اجناس — تسک ۵۳ + تسک ۵۷
 * ------------------------------------------------------------------
 * منوی این صفحه فقط برای رول مدیریتی (admin/manager) در store.ts اضافه شده.
 * پایه با داده‌ی نمونه‌ی محلی (src/lib/crm/procurement-sample.ts) — به بک‌اند
 * وصل نیست و هیچ رکورد واقعی ساخته نمی‌شود؛ فیلدها بعداً با نظر مدیر
 * شخصی‌سازی می‌شود.
 *
 * تسک ۵۷: افزودن رکورد دستی (فرم کامل با تقویم شمسی)، ورود از فایل اکسل،
 * خروجی اکسل و حذف رکورد — همه کلاینت‌ساید با ذخیره‌سازی در localStorage
 * مرورگر؛ منطق بک‌اند/API هیچ تغییری نکرده است.
 *
 * طراحی هم‌زبان پروژه: سربرگ قاب‌گرادیانی با هاله‌ی تنفس‌دار، کارت‌های آمار با
 * ورود آبشاری، جدول با انیمیشن ردیف‌های crm-row-in (تسک ۵۱) و دیالوگ جزئیات
 * که انیمیشن فلیپ سه‌بعدی crm-dialog-3d را از استایل سراسری می‌گیرد.
 */

import * as React from "react";
import {
  PackageSearch,
  Search,
  Boxes,
  ClipboardList,
  Plus,
  FileUp,
  FileDown,
  Trash2,
  PackagePlus,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { JalaliDatePicker } from "@/components/ui/jalali-date-picker";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { isoToJalali, JALALI_MONTHS, todayISO } from "@/lib/crm/jalali";
import { EmptyState } from "@/components/crm/shared/empty-state";
import {
  PRIORITY_META,
  PROCUREMENT_STATUS,
  SAMPLE_PROCUREMENT,
  type ProcurementItem,
  type ProcurementStatus,
} from "@/lib/crm/procurement-sample";
import { exportProcurementExcel } from "@/lib/crm/procurement-excel";
import { ProcurementImportDialog } from "./procurement-import-dialog";

/** ارقام فارسی */
const faNum = (n: number) =>
  String(n).replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[Number(d)]);

/** «۹ آبان ۱۴۰۵» — تاریخ کوتاه شمسی برای ستون جدول */
const jalaliShort = (iso: string) => {
  const j = isoToJalali(iso);
  return j ? `${faNum(j.jd)} ${JALALI_MONTHS[j.jm - 1]} ${faNum(j.jy)}` : iso;
};

const STATUS_ORDER: ProcurementStatus[] = [
  "pending",
  "supplying",
  "done",
  "canceled",
];

type StatusFilter = "all" | ProcurementStatus;

/* ---------------- تسک ۵۷ — افزودن دستی / اکسل / حذف ---------------- */

/** کلید ذخیره‌سازی محلی — رکوردها فقط در مرورگرِ همان کاربر می‌مانند */
const STORAGE_KEY = "crm-procurement-items-v1";

type StoredProcurement = { items: ProcurementItem[]; customized?: boolean };

/** فرم ثبت درخواست جدید */
type ProcurementForm = {
  code: string;
  title: string;
  category: string;
  requesterName: string;
  department: string;
  qty: string;
  unit: string;
  priority: "urgent" | "normal";
  status: ProcurementStatus;
  requestedISO: string;
  note: string;
};

const emptyForm = (code: string): ProcurementForm => ({
  code,
  title: "",
  category: "",
  requesterName: "",
  department: "",
  qty: "1",
  unit: "عدد",
  priority: "normal",
  status: "pending",
  requestedISO: todayISO(),
  note: "",
});

/** ورودی عددی که ممکن است با ارقام فارسی تایپ شده باشد */
const parseFaNumber = (s: string) =>
  Number(
    String(s)
      .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
      .replace(/[^\d.]/g, "")
  );

/** آیا لیست دقیقاً همان داده‌ی نمونه است؟ (برای برگشتن بج به حالت پیش‌فرض) */
const sameAsSample = (arr: ProcurementItem[]) =>
  arr.length === SAMPLE_PROCUREMENT.length &&
  arr.every((it, i) => {
    const s = SAMPLE_PROCUREMENT[i];
    return (
      s &&
      it.code === s.code &&
      it.title === s.title &&
      it.qty === s.qty &&
      it.status === s.status &&
      it.requestedISO === s.requestedISO
    );
  });

export function ProcurementView() {
  const [query, setQuery] = React.useState("");
  const [status, setStatus] = React.useState<StatusFilter>("all");
  const [selected, setSelected] = React.useState<ProcurementItem | null>(null);

  /* ---------- تسک ۵۷ — state رکوردها + ذخیره‌سازی مرورگر ---------- */
  const [items, setItems] = React.useState<ProcurementItem[]>(SAMPLE_PROCUREMENT);
  const [customized, setCustomized] = React.useState(false);
  const [addOpen, setAddOpen] = React.useState(false);
  const [importOpen, setImportOpen] = React.useState(false);
  const [form, setForm] = React.useState<ProcurementForm>(() => emptyForm("TA-1049"));
  const [formError, setFormError] = React.useState("");
  const [confirmDelete, setConfirmDelete] = React.useState(false);
  const [exporting, setExporting] = React.useState(false);

  // بارگذاری از حافظه‌ی مرورگر بعد از مونت — بدون مشکل SSR/hydration
  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as StoredProcurement;
      if (parsed && Array.isArray(parsed.items)) {
        setItems(parsed.items);
        setCustomized(!!parsed.customized);
      }
    } catch {
      /* حافظه‌ی مرورگر در دسترس نیست — همان داده‌ی نمونه می‌ماند */
    }
  }, []);

  // هر تغییر بلافاصله در مرورگر ذخیره می‌شود
  React.useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ items, customized } satisfies StoredProcurement)
      );
    } catch {
      /* نادیده — مثلاً حالت ناشناس/حجم پر */
    }
  }, [items, customized]);

  // کد پیشنهادی رکورد بعدی — ادامه‌ی بزرگ‌ترین شماره‌ی موجود
  const nextCode = React.useMemo(() => {
    let max = 1000;
    for (const it of items) {
      const m = it.code.match(/(\d+)\s*$/);
      if (m) max = Math.max(max, Number(m[1]));
    }
    return `TA-${max + 1}`;
  }, [items]);

  const existingCodes = React.useMemo(() => items.map((it) => it.code), [items]);

  const openAdd = () => {
    setFormError("");
    setForm(emptyForm(nextCode));
    setAddOpen(true);
  };

  const submitAdd = () => {
    const title = form.title.trim();
    if (!title) {
      setFormError("عنوان اجناس را بنویس.");
      return;
    }
    const code = form.code.trim();
    if (
      code &&
      items.some((it) => it.code.trim().toUpperCase() === code.toUpperCase())
    ) {
      setFormError("این کد قبلاً استفاده شده — کد دیگری بزن یا خالی بگذار.");
      return;
    }
    const qtyNum = parseFaNumber(form.qty);
    const newItem: ProcurementItem = {
      id: `u${Date.now().toString(36)}-${Math.floor(Math.random() * 1e4)}`,
      code: code || nextCode,
      title,
      category: form.category.trim() || "—",
      requesterName: form.requesterName.trim() || "—",
      department: form.department.trim() || "—",
      qty: qtyNum > 0 ? qtyNum : 1,
      unit: form.unit.trim() || "عدد",
      priority: form.priority,
      status: form.status,
      requestedISO: form.requestedISO || todayISO(),
      note: form.note.trim(),
    };
    setItems((prev) => [...prev, newItem]);
    setCustomized(true);
    setAddOpen(false);
  };

  // حذف دو مرحله‌ای — کلیک اول تبدیل به تایید می‌شود
  const handleDelete = () => {
    if (!selected) return;
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    const next = items.filter((it) => it.id !== selected.id);
    setItems(next);
    setCustomized(!sameAsSample(next));
    setSelected(null);
    setConfirmDelete(false);
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportProcurementExcel(items);
    } catch {
      /* دانلود ناموفق — بی‌صدا */
    }
    setExporting(false);
  };

  // آمار واقعی از روی همان دیتای نمونه
  const counts = React.useMemo(() => {
    const byStatus: Record<ProcurementStatus, number> = {
      pending: 0,
      supplying: 0,
      done: 0,
      canceled: 0,
    };
    for (const it of items) byStatus[it.status] += 1;
    return { total: items.length, ...byStatus };
  }, [items]);

  // جستجو + فیلتر وضعیت؛ تازه‌ترین‌ها اول
  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return items
      .filter((it) => (status === "all" ? true : it.status === status))
      .filter((it) =>
        q === ""
          ? true
          : [it.code, it.title, it.category, it.requesterName, it.department]
              .join(" ")
              .toLowerCase()
              .includes(q)
      )
      .sort((a, b) => (a.requestedISO < b.requestedISO ? 1 : -1));
  }, [items, query, status]);

  const statCards = [
    {
      key: "total" as const,
      label: "کل درخواست‌ها",
      value: counts.total,
      icon: Boxes,
      accent: "from-teal-500 to-emerald-600 shadow-teal-500/25",
    },
    {
      key: "pending" as const,
      label: PROCUREMENT_STATUS.pending.label,
      value: counts.pending,
      icon: PROCUREMENT_STATUS.pending.icon,
      accent: PROCUREMENT_STATUS.pending.stat,
    },
    {
      key: "supplying" as const,
      label: PROCUREMENT_STATUS.supplying.label,
      value: counts.supplying,
      icon: PROCUREMENT_STATUS.supplying.icon,
      accent: PROCUREMENT_STATUS.supplying.stat,
    },
    {
      key: "done" as const,
      label: PROCUREMENT_STATUS.done.label,
      value: counts.done,
      icon: PROCUREMENT_STATUS.done.icon,
      accent: PROCUREMENT_STATUS.done.stat,
    },
  ];

  const filterChips: { key: StatusFilter; label: string; count: number }[] = [
    { key: "all", label: "همه", count: counts.total },
    ...STATUS_ORDER.map((s) => ({
      key: s as StatusFilter,
      label: PROCUREMENT_STATUS[s].label,
      count: counts[s],
    })),
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      {/* ---------- سربرگ کارتابل ---------- */}
      <section className="proc-hero overflow-hidden rounded-3xl p-6 sm:p-7">
        <div className="relative z-10 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-400 to-emerald-600 text-white shadow-lg shadow-teal-500/30">
            <PackageSearch className="h-7 w-7" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-black sm:text-2xl">
              کارتابل تامین اجناس
            </h2>
            <p className="mt-1 text-sm leading-7 text-muted-foreground">
              چرخه‌ی درخواست و تامین اجناس شرکت — از ثبت درخواست تا تحویل. ثبت
              دستی، ورود و خروجی اکسل با تقویم شمسی؛ رکوردها در مرورگر ذخیره
              می‌شوند تا اتصال به بک‌اند.
            </p>
          </div>
          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
            <Badge
              variant="outline"
              className={cn(
                "gap-1.5",
                customized
                  ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                  : "border-violet-500/40 bg-violet-500/10 text-violet-700 dark:text-violet-300"
              )}
            >
              <Boxes className="h-3.5 w-3.5" aria-hidden />
              {customized
                ? "رکوردهای شما — ذخیره در مرورگر"
                : "داده‌ی نمونه — پیش‌فرض"}
            </Badge>
            {/* تسک ۵۷ — خروجی/ورود اکسل و ثبت دستی */}
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => void handleExport()}
              disabled={exporting}
            >
              <FileDown className="h-3.5 w-3.5" aria-hidden />
              خروجی اکسل
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => setImportOpen(true)}
            >
              <FileUp className="h-3.5 w-3.5" aria-hidden />
              ورود از اکسل
            </Button>
            <Button
              size="sm"
              className="gap-1.5 bg-gradient-to-l from-teal-600 to-emerald-600 text-white shadow-lg shadow-teal-500/25"
              onClick={openAdd}
            >
              <Plus className="h-3.5 w-3.5" aria-hidden />
              افزودن رکورد
            </Button>
          </div>
        </div>
      </section>

      {/* ---------- کارت‌های آمار ---------- */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {statCards.map((s, i) => {
          const Icon = s.icon;
          return (
            <div
              key={s.key}
              className="proc-stat flex items-center gap-3 rounded-2xl p-4"
              style={{ animationDelay: `${0.06 + i * 0.05}s` }}
            >
              <span
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white shadow-md",
                  s.accent
                )}
                aria-hidden
              >
                <Icon className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="text-xl font-black leading-none">
                  {faNum(s.value)}
                </p>
                <p className="mt-1 truncate text-xs font-medium text-muted-foreground">
                  {s.label}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* ---------- جستجو و فیلتر وضعیت ---------- */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative lg:w-72">
          <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="جستجوی کد، اجناس یا درخواست‌دهنده..."
            className="pr-9"
            aria-label="جستجو در کارتابل تامین اجناس"
          />
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {filterChips.map((chip) => (
            <button
              key={chip.key}
              type="button"
              onClick={() => setStatus(chip.key)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-bold transition-all active:scale-[0.97]",
                status === chip.key
                  ? "border-teal-500/40 bg-teal-500/10 text-teal-700 dark:text-teal-300"
                  : "border-border bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
              aria-pressed={status === chip.key}
            >
              {chip.label}
              <span className="mr-1 text-[10px] opacity-70">
                ({faNum(chip.count)})
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ---------- جدول (md به بالا) ---------- */}
      <div className="hidden md:block">
        {filtered.length === 0 ? (
          <EmptyState
            icon={PackageSearch}
            title={items.length === 0 ? "هنوز رکوردی ثبت نشده" : "چیزی پیدا نشد"}
            description={
              items.length === 0
                ? "اولین درخواست تامین را با دکمه‌ی «افزودن رکورد» ثبت کن یا از اکسل وارد کن."
                : "عبارت جستجو یا فیلتر وضعیت را تغییر بده."
            }
          />
        ) : (
          <div className="proc-table rounded-3xl">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">کد</TableHead>
                    <TableHead className="text-right">اجناس</TableHead>
                    <TableHead className="text-right">درخواست‌دهنده</TableHead>
                    <TableHead className="text-right">تعداد</TableHead>
                    <TableHead className="text-right">اولویت</TableHead>
                    <TableHead className="text-right">وضعیت</TableHead>
                    <TableHead className="text-right">تاریخ درخواست</TableHead>
                    <TableHead className="w-16" aria-label="جزئیات" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((it) => {
                    const st = PROCUREMENT_STATUS[it.status];
                    const StIcon = st.icon;
                    return (
                      <TableRow key={it.id}>
                        <TableCell
                          className="text-xs font-bold text-teal-700 dark:text-teal-300"
                          dir="ltr"
                        >
                          {it.code}
                        </TableCell>
                        <TableCell>
                          <p className="max-w-52 truncate text-xs font-bold">
                            {it.title}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {it.category}
                          </p>
                        </TableCell>
                        <TableCell>
                          <p className="text-xs font-medium">
                            {it.requesterName}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {it.department}
                          </p>
                        </TableCell>
                        <TableCell className="text-xs">
                          {faNum(it.qty)} {it.unit}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={cn(
                              "gap-1 text-[10px]",
                              PRIORITY_META[it.priority].badge
                            )}
                          >
                            {PRIORITY_META[it.priority].label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={cn("gap-1 text-[10px]", st.badge)}
                          >
                            <StIcon className="h-3 w-3" aria-hidden />
                            {st.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {jalaliShort(it.requestedISO)}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 gap-1 px-2 text-[11px]"
                            onClick={() => setSelected(it)}
                            aria-label={`جزئیات درخواست ${it.code}`}
                          >
                            جزئیات
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </div>

      {/* ---------- کارت‌های موبایل (زیر md) ---------- */}
      <div className="space-y-3 md:hidden">
        {filtered.length === 0 ? (
          <EmptyState
            icon={PackageSearch}
            title={items.length === 0 ? "هنوز رکوردی ثبت نشده" : "چیزی پیدا نشد"}
            description={
              items.length === 0
                ? "اولین درخواست تامین را با دکمه‌ی «افزودن رکورد» ثبت کن یا از اکسل وارد کن."
                : "عبارت جستجو یا فیلتر وضعیت را تغییر بده."
            }
          />
        ) : (
          filtered.map((it, i) => {
            const st = PROCUREMENT_STATUS[it.status];
            const StIcon = st.icon;
            return (
              <div
                key={it.id}
                className="proc-card rounded-2xl p-4"
                style={{ animationDelay: `${0.05 + i * 0.045}s` }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black">{it.title}</p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      {it.category} — {it.requesterName} ({it.department})
                    </p>
                  </div>
                  <span
                    className="shrink-0 text-xs font-bold text-teal-700 dark:text-teal-300"
                    dir="ltr"
                  >
                    {it.code}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  <Badge
                    variant="outline"
                    className={cn("gap-1 text-[10px]", st.badge)}
                  >
                    <StIcon className="h-3 w-3" aria-hidden />
                    {st.label}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={cn("text-[10px]", PRIORITY_META[it.priority].badge)}
                  >
                    {PRIORITY_META[it.priority].label}
                  </Badge>
                  <Badge
                    variant="outline"
                    className="border-border bg-muted/40 text-[10px] text-muted-foreground"
                  >
                    {faNum(it.qty)} {it.unit}
                  </Badge>
                  <span className="mr-auto text-[11px] text-muted-foreground">
                    {jalaliShort(it.requestedISO)}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 gap-1 px-2 text-[11px]"
                    onClick={() => setSelected(it)}
                    aria-label={`جزئیات درخواست ${it.code}`}
                  >
                    <ClipboardList className="h-3 w-3" aria-hidden />
                    جزئیات
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ---------- دیالوگ جزئیات (انیمیشن سه‌بعدی از استایل سراسری) ---------- */}
      <Dialog
        open={!!selected}
        onOpenChange={(o) => {
          if (!o) {
            setSelected(null);
            setConfirmDelete(false);
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-right">
              <span
                dir="ltr"
                className="font-mono text-sm text-teal-700 dark:text-teal-300"
              >
                {selected?.code}
              </span>
              جزئیات درخواست
            </DialogTitle>
            <DialogDescription className="text-right">
              {selected?.title}
            </DialogDescription>
          </DialogHeader>

          {selected && (
            <div className="space-y-2.5">
              {(
                [
                  {
                    label: "وضعیت",
                    value: (
                      <Badge
                        variant="outline"
                        className={cn(
                          "gap-1 text-[10px]",
                          PROCUREMENT_STATUS[selected.status].badge
                        )}
                      >
                        {React.createElement(
                          PROCUREMENT_STATUS[selected.status].icon,
                          { className: "h-3 w-3", "aria-hidden": true }
                        )}
                        {PROCUREMENT_STATUS[selected.status].label}
                      </Badge>
                    ),
                  },
                  {
                    label: "اولویت",
                    value: (
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px]",
                          PRIORITY_META[selected.priority].badge
                        )}
                      >
                        {PRIORITY_META[selected.priority].label}
                      </Badge>
                    ),
                  },
                  {
                    label: "تعداد",
                    value: `${faNum(selected.qty)} ${selected.unit}`,
                  },
                  { label: "دسته", value: selected.category },
                  { label: "درخواست‌دهنده", value: selected.requesterName },
                  { label: "بخش", value: selected.department },
                  {
                    label: "تاریخ درخواست",
                    value: jalaliShort(selected.requestedISO),
                  },
                ] as { label: string; value: React.ReactNode }[]
              ).map((row) => (
                <div
                  key={row.label}
                  className="flex items-center justify-between gap-3 rounded-xl border bg-muted/30 px-3 py-2"
                >
                  <span className="text-xs font-medium text-muted-foreground">
                    {row.label}
                  </span>
                  <span className="text-xs font-bold">{row.value}</span>
                </div>
              ))}
              {selected.note && (
                <div className="rounded-xl border border-teal-600/20 bg-teal-500/10 px-3 py-2.5 text-xs leading-6 text-teal-700 dark:text-teal-300">
                  {selected.note}
                </div>
              )}

              {/* تسک ۵۷ — حذف رکورد (دو مرحله‌ای تا پاک شدن اشتباهی نشود) */}
              <div className="flex justify-start pt-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDelete}
                  className={cn(
                    "gap-1.5 transition-all",
                    confirmDelete
                      ? "border-rose-500/50 bg-rose-500/10 text-rose-700 dark:text-rose-300"
                      : "text-muted-foreground"
                  )}
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden />
                  {confirmDelete ? "مطمئنی؟ دوباره کلیک کن تا حذف شود" : "حذف این رکورد"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ---------- دیالوگ ثبت درخواست جدید (تسک ۵۷) ---------- */}
      <Dialog
        open={addOpen}
        onOpenChange={(o) => {
          setAddOpen(o);
          if (!o) setFormError("");
        }}
      >
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-right">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-teal-400 to-emerald-600 text-white shadow-md shadow-teal-500/30">
                <PackagePlus className="h-4 w-4" aria-hidden />
              </span>
              ثبت درخواست جدید
            </DialogTitle>
            <DialogDescription className="text-right">
              رکورد به کارتابل اضافه می‌شود — فعلاً در مرورگر ذخیره می‌شود و به
              سرور ارسال نمی‌شود
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="proc-code">کد درخواست</Label>
              <Input
                id="proc-code"
                value={form.code}
                onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
                dir="ltr"
                className="font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <Label>اولویت</Label>
              <div className="flex gap-1.5">
                {(
                  [
                    ["urgent", "فوری"],
                    ["normal", "عادی"],
                  ] as const
                ).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, priority: key }))}
                    className={cn(
                      "flex-1 rounded-xl border px-3 py-2 text-xs font-bold transition-all active:scale-[0.97]",
                      form.priority === key
                        ? key === "urgent"
                          ? "border-rose-500/40 bg-rose-500/10 text-rose-700 dark:text-rose-300"
                          : "border-teal-500/40 bg-teal-500/10 text-teal-700 dark:text-teal-300"
                        : "border-border bg-muted/40 text-muted-foreground hover:bg-muted"
                    )}
                    aria-pressed={form.priority === key}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="proc-title">اجناس درخواستی *</Label>
              <Input
                id="proc-title"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="مثلاً کاغذ A4 و لوازم التحریر اداری"
              />
              {formError && (
                <p className="text-xs font-bold text-rose-600 dark:text-rose-400">
                  {formError}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="proc-category">دسته</Label>
              <Input
                id="proc-category"
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                placeholder="مثلاً تجهیزات IT"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="proc-requester">درخواست‌دهنده</Label>
              <Input
                id="proc-requester"
                value={form.requesterName}
                onChange={(e) =>
                  setForm((f) => ({ ...f, requesterName: e.target.value }))
                }
                placeholder="مثلاً امیر رضایی"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="proc-department">بخش</Label>
              <Input
                id="proc-department"
                value={form.department}
                onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))}
                placeholder="مثلاً مسئول IT"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="proc-qty">تعداد و واحد</Label>
              <div className="flex gap-2">
                <Input
                  id="proc-qty"
                  inputMode="numeric"
                  value={form.qty}
                  onChange={(e) => setForm((f) => ({ ...f, qty: e.target.value }))}
                  className="w-20 shrink-0"
                />
                <Input
                  value={form.unit}
                  onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
                  placeholder="عدد / بسته / ..."
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>وضعیت</Label>
              <Select
                value={form.status}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, status: v as ProcurementStatus }))
                }
              >
                <SelectTrigger aria-label="وضعیت درخواست">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(PROCUREMENT_STATUS) as ProcurementStatus[]).map(
                    (key) => (
                      <SelectItem key={key} value={key}>
                        {PROCUREMENT_STATUS[key].label}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>تاریخ درخواست</Label>
              {/* تسک ۵۱ — تقویم شمسی؛ مقدار همچنان ISO میلادی ذخیره می‌شود */}
              <JalaliDatePicker
                value={form.requestedISO}
                onChange={(iso) => setForm((f) => ({ ...f, requestedISO: iso }))}
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="proc-note">یادداشت</Label>
              <Textarea
                id="proc-note"
                value={form.note}
                onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
                rows={2}
                placeholder="اختیاری — مثلاً نکات تامین یا هماهنگی..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>
              انصراف
            </Button>
            <Button
              onClick={submitAdd}
              className="gap-2 bg-gradient-to-l from-teal-600 to-emerald-600 text-white"
            >
              <Plus className="h-4 w-4" aria-hidden />
              ثبت در کارتابل
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ---------- دیالوگ ورود از اکسل (تسک ۵۷) ---------- */}
      <ProcurementImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        existingCodes={existingCodes}
        nextCode={nextCode}
        onImported={(newItems) => {
          setItems((prev) => [...prev, ...newItems]);
          setCustomized(true);
        }}
      />
    </div>
  );
}
