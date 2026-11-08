"use client";

/**
 * دیالوگ ورود کارتابل تامین اجناس از فایل اکسل — تسک ۵۷
 * ------------------------------------------------------------------
 * همان زبان طراحی دیالوگ ورود مشتریان (کشیدن فایل + قالب نمونه + خلاصه‌ی
 * نتیجه)؛ ولی کاملاً کلاینت‌ساید — پارس با کتابخانه‌ی xlsx و افزودن به
 * لیست محلی مرورگر، بدون ساخت هیچ رکوردی در بک‌اند.
 */

import * as React from "react";
import { FileUp, Download, FileSpreadsheet, AlertCircle, CheckCircle2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toFaDigits } from "@/lib/crm/utils";
import {
  downloadProcurementTemplate,
  parseProcurementExcel,
  type ProcurementImportResult,
} from "@/lib/crm/procurement-excel";
import type { ProcurementItem } from "@/lib/crm/procurement-sample";

interface ProcurementImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** کدهای موجود — برای جلوگیری از کد تکراری */
  existingCodes: string[];
  /** کد پیشنهادی بعدی برای ردیف‌های بدون کد */
  nextCode: string;
  /** بعد از پارس موفق، رکوردها را به والد می‌دهد */
  onImported: (items: ProcurementItem[]) => void;
}

export function ProcurementImportDialog({
  open,
  onOpenChange,
  existingCodes,
  nextCode,
  onImported,
}: ProcurementImportDialogProps) {
  const [file, setFile] = React.useState<File | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [result, setResult] = React.useState<ProcurementImportResult | null>(null);
  const [fatal, setFatal] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const reset = () => {
    setFile(null);
    setResult(null);
    setFatal(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleImport = async () => {
    if (!file) return;
    setBusy(true);
    setFatal(null);
    try {
      const res = await parseProcurementExcel(file, existingCodes, nextCode);
      setResult(res);
      if (res.importedCount > 0) onImported(res.imported);
    } catch {
      setFatal("خواندن فایل ممکن نشد — مطمئن شو فایل اکسل معتبر (.xlsx/.xls) است.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) setTimeout(reset, 200);
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-right">
            <FileSpreadsheet className="h-5 w-5 text-teal-600" />
            ورود اجناس از فایل اکسل
          </DialogTitle>
          <DialogDescription className="text-right">
            فایل اکسل (.xlsx) را انتخاب کنید — رکوردها به کارتابل اضافه می‌شوند
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* قالب نمونه */}
          <div className="flex items-center justify-between gap-3 rounded-xl border border-teal-600/20 bg-teal-500/5 px-4 py-3">
            <div className="text-xs leading-5">
              <span className="font-bold">ستون‌های لازم:</span> کد، اجناس (الزامی)، دسته،
              درخواست‌دهنده، بخش، تعداد، واحد، اولویت، وضعیت، تاریخ درخواست، یادداشت
              <br />
              <span className="text-muted-foreground">
                تاریخ شمسی (۱۴۰۵/۰۸/۰۶) یا میلادی هر دو قبول است.
              </span>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void downloadProcurementTemplate()}
              className="shrink-0 gap-1.5"
            >
              <Download className="h-3.5 w-3.5" />
              قالب نمونه
            </Button>
          </div>

          {/* انتخاب فایل */}
          <label
            className="flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-muted-foreground/25 bg-muted/30 px-4 py-8 text-center transition-colors hover:border-teal-500/50 hover:bg-teal-500/5"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const dropped = e.dataTransfer.files?.[0];
              if (dropped) {
                setFile(dropped);
                setResult(null);
                setFatal(null);
              }
            }}
          >
            <FileUp className="h-8 w-8 text-muted-foreground" />
            <span className="text-sm font-medium">
              {file ? file.name : "فایل اکسل را اینجا بکشید یا کلیک کنید"}
            </span>
            <span className="text-xs text-muted-foreground">
              فرمت‌های مجاز: xlsx ،xls
            </span>
            <input
              ref={inputRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={(e) => {
                const selected = e.target.files?.[0];
                setFile(selected || null);
                setResult(null);
                setFatal(null);
              }}
            />
          </label>

          {/* خطای کلی */}
          {fatal && (
            <div className="flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs font-bold text-rose-700 dark:text-rose-300">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {fatal}
            </div>
          )}

          {/* خلاصه‌ی نتیجه */}
          {result && (
            <div className="space-y-2 rounded-xl border bg-card p-4 text-sm">
              <div className="flex flex-wrap gap-x-5 gap-y-1">
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="h-4 w-4" />
                  {toFaDigits(result.importedCount)} رکورد وارد شد
                </span>
                <span className="text-amber-600 dark:text-amber-400">
                  ⚠ {toFaDigits(result.skippedCount)} ردیف رد شد
                </span>
              </div>
              {result.errors.length > 0 && (
                <div className="space-y-1 rounded-lg bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-300">
                  {result.errors.map((err, i) => (
                    <div key={i} className="flex items-start gap-1.5">
                      <AlertCircle className="mt-0.5 h-3 w-3 shrink-0" />
                      {err}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            بستن
          </Button>
          <Button
            onClick={() => void handleImport()}
            disabled={!file || busy}
            className="gap-2 bg-gradient-to-l from-teal-600 to-emerald-600 text-white"
          >
            {busy ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                در حال خواندن فایل...
              </>
            ) : (
              <>
                <FileUp className="h-4 w-4" />
                ورود اجناس
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
