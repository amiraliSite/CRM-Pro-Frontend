import { formatFaDate } from "@/lib/crm/utils";

/** One column of the printable table. */
export type PrintColumn = {
  header: string;
  /** CSS width, e.g. "28%" — optional */
  width?: string;
};

export type PrintSheetInput = {
  /** Big title at the top, e.g. «برگه تخصیص تسک‌ها» */
  title: string;
  /** Small info line, e.g. «تعداد تسک‌ها: ۳» */
  subtitle?: string;
  /** Who issued the sheet (shown in the meta line) */
  issuedBy?: string;
  /** جدول تکی (وقتی sections خالی است) */
  columns?: PrintColumn[];
  /** Plain-text cells — already formatted (Persian digits / fa dates) */
  rows?: string[][];
  /** Signature captions, e.g. ["امضای مدیر", "امضای گیرنده"] */
  signatures?: string[];
  /** چندبخشی (تسک ۴۳): هر بخش هدر + جدول خودش را دارد —
   *  اگر پرت شود، جدولِ تکیِ بالا (columns/rows) چاپ می‌شود */
  sections?: PrintSection[];
};

/** One titled table inside a multi-section sheet. */
export type PrintSection = {
  heading?: string;
  columns: PrintColumn[];
  rows: string[][];
};

const esc = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/** Font lives in /public/fonts — resolve relative to the current page
 *  (works on user-site root and /CRM-Pro-Frontend/ base alike). */
const fontUrls = () => {
  try {
    // directory-like base so relative resolution keeps the app path
    // (works on user-site root and /CRM-Pro-Frontend/ base alike)
    const href = window.location.href;
    const base = href.endsWith("/") ? href : href.replace(/[^/]*$/, "");
    return {
      regular: new URL("fonts/Vazirmatn-Regular.woff2", base).href,
      bold: new URL("fonts/Vazirmatn-Bold.woff2", base).href,
    };
  } catch {
    return { regular: "", bold: "" };
  }
};

function buildHtml(input: PrintSheetInput): string {
  const fonts = fontUrls();
  const today = formatFaDate(new Date());

  const renderTable = (columns: PrintColumn[], rows: string[][]) => {
    const head = columns
      .map(
        (c) =>
          `<th${c.width ? ` style="width:${esc(c.width)}"` : ""}>${esc(c.header)}</th>`
      )
      .join("");
    const body = rows
      .map(
        (row) =>
          `<tr>${row
            .map((cell, i) => {
              const center = i === 0 || cell.length <= 12;
              const cls = i === 0 ? "c num" : center ? "c" : "desc";
              return `<td class="${cls}">${esc(cell)}</td>`;
            })
            .join("")}</tr>`
      )
      .join("");
    return `<table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
  };

  const tables = input.sections?.length
    ? input.sections
        .map(
          (s) =>
            `${s.heading ? `<h2 class="sec">${esc(s.heading)}</h2>` : ""}${renderTable(s.columns, s.rows)}`
        )
        .join("")
    : renderTable(input.columns ?? [], input.rows ?? []);

  const signs = (input.signatures ?? [])
    .map(
      (s) =>
        `<div class="sign"><div class="line"></div>${esc(s)}</div>`
    )
    .join("");

  return `<!doctype html>
<html dir="rtl" lang="fa">
<head>
<meta charset="utf-8">
<title>${esc(input.title)}</title>
<style>
  @font-face { font-family:'Vazirmatn'; src:url('${fonts.regular}') format('woff2'); font-weight:400; font-display:swap; }
  @font-face { font-family:'Vazirmatn'; src:url('${fonts.bold}') format('woff2'); font-weight:700; font-display:swap; }
  @page { size:A4 portrait; margin:13mm 12mm; }
  * { box-sizing:border-box; }
  html,body { margin:0; padding:0; }
  body { font-family:'Vazirmatn',Tahoma,'Segoe UI',sans-serif; color:#0f172a; }
  .sheet-head { display:flex; align-items:flex-end; justify-content:space-between; gap:12px; border-bottom:3px solid #0d9488; padding-bottom:10px; }
  h1 { font-size:18px; font-weight:700; margin:0; }
  .brand { font-size:10px; color:#64748b; margin-top:3px; }
  .today { font-size:11px; color:#334155; white-space:nowrap; }
  .meta { display:flex; flex-wrap:wrap; gap:4px 28px; font-size:11px; color:#475569; margin:10px 0 12px; }
  .meta b { color:#0f172a; }
  h2.sec { font-size:13px; font-weight:700; color:#0f766e; margin:16px 0 8px; padding-right:8px; border-right:3px solid #0d9488; }
  h2.sec:not(:first-of-type) { margin-top:22px; }
  table { width:100%; border-collapse:collapse; font-size:11.5px; margin-bottom:4px; }
  th { background:#f0fdfa; color:#0f766e; border:1px solid #99f6e4; padding:6px 8px; text-align:right; font-weight:700; white-space:nowrap; }
  td { border:1px solid #cbd5e1; padding:6px 8px; vertical-align:top; text-align:right; }
  td.c { text-align:center; white-space:nowrap; }
  td.desc { line-height:1.9; }
  .signs { display:flex; gap:48px; margin-top:30px; padding:0 12px; }
  .sign { flex:1; text-align:center; font-size:11px; color:#334155; }
  .sign .line { margin-bottom:6px; border-top:1.5px dotted #94a3b8; }
  .foot { margin-top:16px; font-size:9.5px; color:#94a3b8; text-align:center; }
</style>
</head>
<body>
  <div class="sheet-head">
    <div>
      <h1>${esc(input.title)}</h1>
      <div class="brand">CRM Pro — سامانه مدیریت ارتباط با مشتریان</div>
    </div>
    <div class="today">${esc(today)}</div>
  </div>
  <div class="meta">
    ${input.issuedBy ? `<span>صادرکننده: <b>${esc(input.issuedBy)}</b></span>` : ""}
    ${input.subtitle ? `<span>${esc(input.subtitle)}</span>` : ""}
    <span>تاریخ چاپ: <b>${esc(today)}</b></span>
  </div>
  ${tables}
  ${signs ? `<div class="signs">${signs}</div>` : ""}
  <div class="foot">چاپ‌شده از CRM Pro</div>
  <script>window.onload=function(){setTimeout(function(){window.print()},250)}<\/script>
</body>
</html>`;
}

/**
 * Print a formal RTL/A4 sheet: opens a new tab with the document
 * (auto-triggers the print dialog). If popups are blocked, falls back to a
 * hidden iframe. Only called from user-gesture handlers.
 */
export function printSheet(input: PrintSheetInput): void {
  if (typeof window === "undefined") return;
  const html = buildHtml(input);

  const win = window.open("", "_blank", "width=900,height=700");
  if (win) {
    win.document.open();
    win.document.write(html);
    win.document.close();
    return;
  }

  // Popup blocked → hidden iframe fallback (no popup permission needed)
  const frame = document.createElement("iframe");
  frame.setAttribute("aria-hidden", "true");
  frame.style.cssText =
    "position:fixed;inset:0;width:0;height:0;border:0;visibility:hidden;";
  frame.srcdoc = html;
  document.body.appendChild(frame);
  window.setTimeout(() => frame.remove(), 60000);
}
