const FA_DIGITS = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];

export function toFaDigits(input: string | number): string {
  return String(input).replace(/\d/g, (d) => FA_DIGITS[Number(d)]);
}

/** Format currency in Toman with Persian digits: ۴۵۰٬۰۰۰٬۰۰۰ تومان */
export function formatToman(value: number, short = false): string {
  if (short) return formatShortToman(value);
  return `${toFaDigits(Math.round(value).toLocaleString("en-US")).replace(/,/g, "٬")} تومان`;
}

/** Short form: ۴۵۰ میلیون / ۲٫۵ میلیارد */
export function formatShortToman(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000) {
    const n = value / 1_000_000_000;
    return `${toFaDigits(trimZero(n))} میلیارد تومان`;
  }
  if (abs >= 1_000_000) {
    const n = value / 1_000_000;
    return `${toFaDigits(trimZero(n))} میلیون تومان`;
  }
  if (abs >= 1_000) {
    return `${toFaDigits(trimZero(value / 1_000))} هزار تومان`;
  }
  return `${toFaDigits(value)} تومان`;
}

function trimZero(n: number): string {
  const rounded = Math.round(n * 10) / 10;
  return String(rounded).replace(".", "٫");
}

/** Persian date like ۲۵ مهر ۱۴۰۴ */
export function formatFaDate(date: string | Date | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("fa-IR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(d);
}

/** Persian date + time */
export function formatFaDateTime(date: string | Date | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("fa-IR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

/** Relative time in Persian: ۲ ساعت پیش */
export function timeAgo(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const seconds = Math.floor((Date.now() - d.getTime()) / 1000);
  if (seconds < 60) return "چند لحظه پیش";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${toFaDigits(minutes)} دقیقه پیش`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${toFaDigits(hours)} ساعت پیش`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${toFaDigits(days)} روز پیش`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${toFaDigits(months)} ماه پیش`;
  return formatFaDate(d);
}

/** Days remaining (can be negative = overdue) */
export function daysUntil(date: string | Date | null | undefined): number | null {
  if (!date) return null;
  const d = typeof date === "string" ? new Date(date) : date;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(d);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / 86400000);
}

/** Get initials for avatar */
export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`;
  return name.slice(0, 2);
}

const AVATAR_COLORS = [
  "bg-teal-500",
  "bg-violet-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-cyan-600",
  "bg-emerald-600",
  "bg-fuchsia-500",
  "bg-lime-600",
];

export function avatarColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}
