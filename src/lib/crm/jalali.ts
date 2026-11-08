/** تبدیل تقویم جلالی (شمسی) ↔ میلادی — الگوریتم استاندارد jalaali (بدون وابستگی خارجی)
 *  (تسک ۵۱ بخش ۳) فیلدهای تاریخ همه‌ی فرم‌ها شمسی شدند؛ مقدار ذخیره‌شده همچنان ISO میلادی
 *  می‌ماند تا قرارداد بک‌اند و داده‌های قبلی دست‌نخورده بماند. */

const JALALI_MONTHS = [
  "فروردین",
  "اردیبهشت",
  "خرداد",
  "تیر",
  "مرداد",
  "شهریور",
  "مهر",
  "آبان",
  "آذر",
  "دی",
  "بهمن",
  "اسفند",
] as const;

/** نام کامل روزهای هفته — ایندکس ۰ = شنبه */
const JALALI_WEEKDAYS = [
  "شنبه",
  "یکشنبه",
  "دوشنبه",
  "سه‌شنبه",
  "چهارشنبه",
  "پنجشنبه",
  "جمعه",
] as const;

/** حروف کوتاه روزهای هفته برای سرستون تقویم — شنبه اول */
const JALALI_WEEKDAYS_SHORT = ["ش", "ی", "د", "س", "چ", "پ", "ج"] as const;

function div(a: number, b: number): number {
  return ~~(a / b);
}
function mod(a: number, b: number): number {
  return a - ~~(a / b) * b;
}

/** محاسبه‌ی سال کبیسه و روزِ اول مارسِ سال میلادی متناظر */
function jalCal(jy: number): { leap: number; gy: number; march: number } {
  const breaks = [
    -61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181, 1210, 1635, 2060, 2097,
    2192, 2262, 2324, 2394, 2456, 3178,
  ];
  const bl = breaks.length;
  const gy = jy + 621;
  let leapJ = -14;
  let jp = breaks[0];
  let jump = 0;
  if (jy < jp || jy >= breaks[bl - 1]) {
    throw new Error("سال جلالی نامعتبر: " + jy);
  }
  for (let i = 1; i < bl; i += 1) {
    const jm = breaks[i];
    jump = jm - jp;
    if (jy < jm) break;
    leapJ = leapJ + div(jump, 33) * 8 + div(mod(jump, 33), 4);
    jp = jm;
  }
  let n = jy - jp;
  leapJ = leapJ + div(n, 33) * 8 + div(mod(n, 33) + 3, 4);
  if (mod(jump, 33) === 4 && jump - n === 4) leapJ += 1;
  const leapG = div(gy, 4) - div((div(gy, 100) + 1) * 3, 4) - 150;
  const march = 20 + leapJ - leapG;
  if (jump - n < 6) n = n - jump + div(jump + 4, 33) * 33;
  let leap = mod(mod(n + 1, 33) - 1, 4);
  if (leap === -1) leap = 4;
  return { leap, gy, march };
}

/** تاریخ جلالی → عدد روز ژولینی */
function j2d(jy: number, jm: number, jd: number): number {
  const r = jalCal(jy);
  return (
    g2d(r.gy, 3, r.march) + (jm - 1) * 31 - div(jm, 7) * (jm - 7) + jd - 1
  );
}

/** عدد روز ژولینی → تاریخ جلالی */
function d2j(jdn: number): { jy: number; jm: number; jd: number } {
  const gy = d2g(jdn).gy;
  let jy = gy - 621;
  const r = jalCal(jy);
  const jdn1f = g2d(gy, 3, r.march);
  let k = jdn - jdn1f;
  if (k >= 0) {
    if (k <= 185) {
      return { jy, jm: 1 + div(k, 31), jd: mod(k, 31) + 1 };
    }
    k -= 186;
  } else {
    jy -= 1;
    k += 179;
    if (r.leap === 1) k += 1;
  }
  return { jy, jm: 7 + div(k, 30), jd: mod(k, 30) + 1 };
}

/** تاریخ میلادی → عدد روز ژولینی */
function g2d(gy: number, gm: number, gd: number): number {
  let d =
    div((gy + div(gm - 8, 6) + 100100) * 1461, 4) +
    div(153 * mod(gm + 9, 12) + 2, 5) +
    gd -
    34840408;
  d = d - div(div(gy + 100100 + div(gm - 8, 6), 100) * 3, 4) + 752;
  return d;
}

/** عدد روز ژولینی → تاریخ میلادی */
function d2g(jdn: number): { gy: number; gm: number; gd: number } {
  let j = 4 * jdn + 139361631;
  j = j + div(div(4 * jdn + 183187720, 146097) * 3, 4) * 4 - 3908;
  const i = div(mod(j, 1461), 4) * 5 + 308;
  const gd = div(mod(i, 153), 5) + 1;
  const gm = mod(div(i, 153), 12) + 1;
  const gy = div(j, 1461) - 100100 + div(8 - gm, 6);
  return { gy, gm, gd };
}

export type JalaliDate = { jy: number; jm: number; jd: number };

/** میلادی → جلالی */
export function toJalali(gy: number, gm: number, gd: number): JalaliDate {
  return d2j(g2d(gy, gm, gd));
}

/** جلالی → میلادی */
export function toGregorian(
  jy: number,
  jm: number,
  jd: number
): { gy: number; gm: number; gd: number } {
  return d2g(j2d(jy, jm, jd));
}

/** آیا سال جلالی کبیسه است؟ */
export function isLeapJalaliYear(jy: number): boolean {
  return jalCal(jy).leap === 0;
}

/** طول ماه جلالی (روز) */
export function jalaliMonthLength(jy: number, jm: number): number {
  if (jm <= 6) return 31;
  if (jm <= 11) return 30;
  return isLeapJalaliYear(jy) ? 30 : 29;
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/** رشته‌ی ISO میلادی «2026-10-29» → جلالی */
export function isoToJalali(iso: string): JalaliDate | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso.trim());
  if (!m) return null;
  return toJalali(Number(m[1]), Number(m[2]), Number(m[3]));
}

/** جلالی → رشته‌ی ISO میلادی «2026-10-29» (همان قرارداد قبلی فرم‌ها) */
export function jalaliToISO(jy: number, jm: number, jd: number): string {
  const g = toGregorian(jy, jm, jd);
  return `${g.gy}-${pad2(g.gm)}-${pad2(g.gd)}`;
}

/** ایندکس روز هفته به سبک ایرانی (۰ = شنبه) از تاریخ میلادی */
export function jalaliWeekdayIndex(gy: number, gm: number, gd: number): number {
  return (new Date(gy, gm - 1, gd).getDay() + 1) % 7;
}

/** متن فارسی تاریخ انتخاب‌شده: «دوشنبه، ۷ آبان ۱۴۰۵» */
export function formatJalaliLong(iso: string): string {
  const j = isoToJalali(iso);
  if (!j) return "";
  const gy = toGregorian(j.jy, j.jm, j.jd);
  const wd = jalaliWeekdayIndex(gy.gy, gy.gm, gy.gd);
  const fa = (n: number) => String(n).replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[Number(d)]);
  return `${JALALI_WEEKDAYS[wd]}، ${fa(j.jd)} ${JALALI_MONTHS[j.jm - 1]} ${fa(j.jy)}`;
}

/** «آبان ۱۴۰۵» برای سرستون تقویم */
export function formatJalaliMonthYear(jy: number, jm: number): string {
  const fa = (n: number) => String(n).replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[Number(d)]);
  return `${JALALI_MONTHS[jm - 1]} ${fa(jy)}`;
}

/** ISO امروز به وقت محلی (همان رفتار قبلی todayInputValue فرم‌ها) */
export function todayISO(): string {
  const now = new Date();
  return `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`;
}

export { JALALI_MONTHS, JALALI_WEEKDAYS, JALALI_WEEKDAYS_SHORT };
