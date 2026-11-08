/**
 * ورود/خروجی اکسل «کارتابل تامین اجناس» — تسک ۵۷
 * ------------------------------------------------------------------
 * همه‌چیز کلاینت‌ساید است (کتابخانه‌ی xlsx که از قبل در پروژه هست) و به
 * بک‌اند وصل نمی‌شود — هیچ رکوردی در دیتابیس ساخته نمی‌شود.
 *
 * نکته‌ها:
 *  - import داینامیک (`await import("xlsx")`) تا حجم xlsx فقط زمان استفاده
 *    دانلود شود و لود اول صفحه سنگین نشود.
 *  - تاریخ هم میلادی (2026-10-28) و هم شمسی (1405/08/06) قبول می‌شود؛
 *    خروجی اکسل تاریخ را شمسی می‌نویسد و هنگام ورود دوباره برمی‌گردد.
 *  - ارقام فارسی/عربی در ستون‌های عددی و تاریخ خودکار انگلیسی می‌شوند.
 */

import {
  jalaliToISO,
  isoToJalali,
  todayISO,
} from "@/lib/crm/jalali";
import {
  PRIORITY_META,
  PROCUREMENT_STATUS,
  type ProcurementItem,
  type ProcurementStatus,
} from "@/lib/crm/procurement-sample";

/** سرستون‌های استاندارد فایل اکسل — قالب و خروجی و ورود همگی با همین کار می‌کنند */
export const PROCUREMENT_EXCEL_HEADERS = [
  "کد",
  "اجناس",
  "دسته",
  "درخواست‌دهنده",
  "بخش",
  "تعداد",
  "واحد",
  "اولویت",
  "وضعیت",
  "تاریخ درخواست",
  "یادداشت",
] as const;

/** نام فایل‌های دانلودی */
export const TEMPLATE_FILE_NAME = "قالب-ورود-کارتابل-تامین-اجناس.xlsx";
export const EXPORT_FILE_NAME = "کارتابل-تامین-اجناس.xlsx";

type Row = Record<string, unknown>;

/* ------------------------- ابزارهای کوچک ------------------------- */

/** «۴۰» → 40 — ارقام فارسی/عربی به انگلیسی */
const enDigits = (s: string) =>
  s.replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));

const pad2 = (n: number) => String(n).padStart(2, "0");

/** متن ستون‌ها را برای مقایسه تمیز می‌کند */
const norm = (s: unknown) =>
  String(s ?? "")
    .replace(/\u200c/g, " ")
    .replace(/\s+/g, " ")
    .trim();

/** تاریخ شمسی «1405/08/06» برای نوشتن در اکسل */
const isoToJalaliText = (iso: string) => {
  const j = isoToJalali(iso);
  return j ? `${j.jy}/${pad2(j.jm)}/${pad2(j.jd)}` : iso;
};

/**
 * تبدیل هر ورودی احتمالی تاریخ به ISO میلادی:
 *  - شیء Date (وقتی اکسل خودش تاریخ شناخته — cellDates)
 *  - عدد سریال اکسل
 *  - رشته‌ی میلادی 2026-10-28 یا 2026/10/28
 *  - رشته‌ی شمسی 1405/08/06 (با ارقام فارسی هم کار می‌کند)
 */
function parseAnyDate(v: unknown): string {
  if (v instanceof Date && !isNaN(v.getTime())) {
    return `${v.getUTCFullYear()}-${pad2(v.getUTCMonth() + 1)}-${pad2(v.getUTCDate())}`;
  }
  if (typeof v === "number" && isFinite(v) && v > 0) {
    // سریال اکسل = روز از 1899-12-30 → تبدیل به UTC
    const d = new Date(Math.round((v - 25569) * 86400000));
    if (!isNaN(d.getTime())) {
      return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`;
    }
  }
  const s = enDigits(String(v ?? "")).trim();
  if (!s) return "";
  if (/^\d{4}-\d{1,2}-\d{1,2}/.test(s)) {
    const [y, m, d] = s.slice(0, 10).split("-").map(Number);
    if (m >= 1 && m <= 12 && d >= 1 && d <= 31) return `${y}-${pad2(m)}-${pad2(d)}`;
  }
  const m = s.match(/(\d{3,4})\s*[\/\-.]\s*(\d{1,2})\s*[\/\-.]\s*(\d{1,2})/);
  if (m) {
    const y = Number(m[1]);
    const mo = Number(m[2]);
    const d = Number(m[3]);
    if (y >= 1300 && y <= 1500) {
      // سال شمسی — مثلاً 1405/08/06
      const iso = jalaliToISO(y, mo, d);
      if (iso) return iso;
    }
    if (y >= 1900 && y <= 2200) return `${y}-${pad2(mo)}-${pad2(d)}`;
  }
  const dt = new Date(s);
  return isNaN(dt.getTime()) ? "" : dt.toISOString().slice(0, 10);
}

const STATUS_BY_TEXT: Record<string, ProcurementStatus> = (() => {
  const map: Record<string, ProcurementStatus> = {
    pending: "pending",
    supplying: "supplying",
    done: "done",
    canceled: "canceled",
  };
  for (const key of Object.keys(PROCUREMENT_STATUS) as ProcurementStatus[]) {
    map[norm(PROCUREMENT_STATUS[key].label)] = key;
  }
  return map;
})();

/** «فوری»/«urgent» → urgent؛ بقیه → عادی */
function parsePriority(v: unknown): "urgent" | "normal" {
  const t = norm(v).toLowerCase();
  return t === "فوری" || t === "urgent" || t === "high" ? "urgent" : "normal";
}

/* ------------------- نگاشت سرستون‌های فارسی ------------------- */

const FIELD_ALIASES: Record<string, string[]> = {
  code: ["کد", "کد درخواست", "code"],
  title: ["اجناس", "عنوان", "نام اجناس", "عنوان اجناس", "اجناس درخواستی", "title"],
  category: ["دسته", "دسته بندی", "category"],
  requesterName: ["درخواست دهنده", "نام درخواست دهنده", "درخواست کننده", "requester"],
  department: ["بخش", "واحد سازمانی", "department"],
  qty: ["تعداد", "qty"],
  unit: ["واحد شمارش", "واحد", "unit"],
  priority: ["اولویت", "priority"],
  status: ["وضعیت", "status"],
  requestedISO: ["تاریخ درخواست", "تاریخ", "date"],
  note: ["یادداشت", "توضیحات", "توضیح", "note"],
};

/** پیدا کردن مقدار هر فیلد از یک ردیف اکسل با پذیرش چند نام مختلف */
function pickField(row: Row, keys: Record<string, unknown>, field: string): unknown {
  for (const alias of FIELD_ALIASES[field] ?? []) {
    if (alias in keys) return keys[alias];
  }
  return undefined;
}

/* ------------------------- ورود از اکسل ------------------------- */

export type ProcurementImportResult = {
  imported: ProcurementItem[];
  importedCount: number;
  skippedCount: number;
  errors: string[];
};

const faNum = (n: number | string) =>
  String(n).replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[Number(d)]);

/**
 * پارس فایل اکسل کارتابل → رکوردهای آماده‌ی افزودن.
 * ردیف‌های بدون «اجناس» رد می‌شوند؛ کد تکراری هم رد می‌شود (پیغام می‌گیرد).
 */
export async function parseProcurementExcel(
  file: File,
  existingCodes: string[],
  nextCodeSeed: string
): Promise<ProcurementImportResult> {
  const XLSX = await import("xlsx");
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { cellDates: true });
  const ws = wb.Sheets[wb.SheetNames[0]];
  if (!ws) {
    return { imported: [], importedCount: 0, skippedCount: 0, errors: ["فایل اکسل خالی است."] };
  }
  const rows = XLSX.utils.sheet_to_json<Row>(ws, { defval: "" });

  const imported: ProcurementItem[] = [];
  const errors: string[] = [];
  let skipped = 0;

  const seen = new Set<string>(existingCodes.map((c) => c.trim().toUpperCase()));
  // شمارش از همان کد پیشنهادی بعدی شروع می‌شود (TA-1049، TA-1050، ...)
  let seedNum = Number((nextCodeSeed.match(/(\d+)$/) ?? [])[1] ?? 1001);

  rows.forEach((row, idx) => {
    const rowNo = faNum(idx + 2); // خط ۱ سرستون است
    // کلیدهای تمیزشده‌ی همین ردیف
    const keys: Record<string, unknown> = {};
    for (const k of Object.keys(row)) keys[norm(k)] = row[k];

    const title = norm(pickField(row, keys, "title"));
    if (!title) {
      skipped += 1;
      errors.push(`ردیف ${rowNo}: ستون «اجناس» خالی است — رد شد.`);
      return;
    }

    let code = norm(pickField(row, keys, "code"));
    if (code) {
      if (seen.has(code.toUpperCase())) {
        skipped += 1;
        errors.push(`ردیف ${rowNo}: کد «${code}» تکراری است — رد شد.`);
        return;
      }
    } else {
      code = `TA-${seedNum}`;
      while (seen.has(code.toUpperCase())) {
        seedNum += 1;
        code = `TA-${seedNum}`;
      }
      seedNum += 1;
    }
    seen.add(code.toUpperCase());

    const qtyRaw = enDigits(String(pickField(row, keys, "qty") ?? "")).replace(/[^\d.]/g, "");
    const qty = Number(qtyRaw);
    const statusText = norm(pickField(row, keys, "status"));
    const iso = parseAnyDate(pickField(row, keys, "requestedISO")) || todayISO();

    imported.push({
      id: `u${Date.now().toString(36)}-${idx}`,
      code,
      title,
      category: norm(pickField(row, keys, "category")) || "—",
      requesterName: norm(pickField(row, keys, "requesterName")) || "—",
      department: norm(pickField(row, keys, "department")) || "—",
      qty: qty > 0 ? qty : 1,
      unit: norm(pickField(row, keys, "unit")) || "عدد",
      priority: parsePriority(pickField(row, keys, "priority")),
      status: STATUS_BY_TEXT[statusText] ?? "pending",
      requestedISO: iso,
      note: norm(pickField(row, keys, "note")),
    });
  });

  return {
    imported,
    importedCount: imported.length,
    skippedCount: skipped,
    errors: errors.slice(0, 8),
  };
}

/* ------------------------- قالب نمونه ------------------------- */

/** دانلود فایل قالب با یک ردیف مثال برای راهنمایی پر کردن */
export async function downloadProcurementTemplate(): Promise<void> {
  const XLSX = await import("xlsx");
  const example = [
    "TA-1050",
    "مثال: کاغذ A4 و لوازم التحریر",
    "لوازم اداری",
    "مثلاً سارا احمدی",
    "پشتیبانی",
    10,
    "بسته",
    "عادی",
    PROCUREMENT_STATUS.pending.label,
    "1405/08/10",
    "این ردیف مثال است — قبل از ورود، متن خودتان را بنویسید.",
  ];
  const ws = XLSX.utils.aoa_to_sheet([
    [...PROCUREMENT_EXCEL_HEADERS],
    example,
  ]);
  ws["!cols"] = [
    { wch: 10 }, { wch: 34 }, { wch: 16 }, { wch: 18 }, { wch: 14 },
    { wch: 8 }, { wch: 10 }, { wch: 9 }, { wch: 16 }, { wch: 14 }, { wch: 44 },
  ];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "کارتابل");
  XLSX.writeFile(wb, TEMPLATE_FILE_NAME);
}

/* ------------------------- خروجی اکسل ------------------------- */

/** خروجی همه‌ی رکوردهای فعلی کارتابل (تاریخ‌ها شمسی — با همین فایل می‌شود ورود داد) */
export async function exportProcurementExcel(items: ProcurementItem[]): Promise<void> {
  const XLSX = await import("xlsx");
  const aoa: (string | number)[][] = [[...PROCUREMENT_EXCEL_HEADERS]];
  for (const it of items) {
    aoa.push([
      it.code,
      it.title,
      it.category,
      it.requesterName,
      it.department,
      it.qty,
      it.unit,
      PRIORITY_META[it.priority].label,
      PROCUREMENT_STATUS[it.status].label,
      isoToJalaliText(it.requestedISO),
      it.note,
    ]);
  }
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws["!cols"] = [
    { wch: 10 }, { wch: 34 }, { wch: 16 }, { wch: 18 }, { wch: 14 },
    { wch: 8 }, { wch: 10 }, { wch: 9 }, { wch: 16 }, { wch: 14 }, { wch: 44 },
  ];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "کارتابل");
  XLSX.writeFile(wb, EXPORT_FILE_NAME);
}
