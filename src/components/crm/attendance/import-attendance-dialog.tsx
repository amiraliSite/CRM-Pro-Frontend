"use client";

import * as React from "react";
import { FileUp, Download, FileSpreadsheet, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useImportAttendance, type ImportResult } from "@/hooks/use-crm-data";
import { toFaDigits } from "@/lib/crm/utils";

interface ImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Client-side CSV template (UTF-8 BOM so Excel shows Persian correctly). */
function downloadTemplate() {
  const csv =
    "\uFEFF" +
    "کارمند,تاریخ ورود,ساعت ورود,تاریخ خروج,ساعت خروج\n" +
    "admin,1404/08/01,09:00,1404/08/01,17:30\n" +
    "manager,1404/08/02,08:45,1404/08/02,16:45\n" +
    "sales,1404/08/03,10:15,1404/08/03,18:00\n";
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "attendance-template.csv";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function ImportAttendanceDialog({ open, onOpenChange }: ImportDialogProps) {
  const importAttendance = useImportAttendance();
  const [file, setFile] = React.useState<File | null>(null);
  const [result, setResult] = React.useState<ImportResult | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const reset = () => {
    setFile(null);
    setResult(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleImport = () => {
    if (!file) return;
    importAttendance.mutate(file, {
      onSuccess: (res) => setResult(res),
    });
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
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-teal-600" />
            ورود ورود و خروج‌ها از اکسل
          </DialogTitle>
          <DialogDescription>
            فایل اکسل (.xlsx) یا CSV را انتخاب کنید — رکوردهای ورود و خروج کارمندان
            اضافه می‌شوند
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Template download */}
          <div className="flex items-center justify-between gap-3 rounded-xl border border-teal-600/20 bg-teal-500/5 px-4 py-3">
            <div className="text-xs leading-5">
              <span className="font-bold">ستون‌های لازم:</span> کارمند
              (یوزرنیم یا نام کامل — الزامی)، تاریخ ورود، ساعت ورود، تاریخ خروج،
              ساعت خروج
              <br />
              <span className="text-muted-foreground">
                تاریخ شمسی مثل 1404/08/04 یا میلادی مثل 2026-10-26 — ردیف تکراری
                دوباره ثبت نمی‌شود
              </span>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={downloadTemplate}
              className="shrink-0 gap-1.5"
            >
              <Download className="h-3.5 w-3.5" />
              فایل نمونه
            </Button>
          </div>

          {/* File input */}
          <label
            className="flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-muted-foreground/25 bg-muted/30 px-4 py-8 text-center transition-colors hover:border-teal-500/50 hover:bg-teal-500/5"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const dropped = e.dataTransfer.files?.[0];
              if (dropped) {
                setFile(dropped);
                setResult(null);
              }
            }}
          >
            <FileUp className="h-8 w-8 text-muted-foreground" />
            <span className="text-sm font-medium">
              {file ? file.name : "فایل اکسل را اینجا بکشید یا کلیک کنید"}
            </span>
            <span className="text-xs text-muted-foreground">
              فرمت‌های مجاز: xlsx ،xls ،csv
            </span>
            <input
              ref={inputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={(e) => {
                const selected = e.target.files?.[0];
                setFile(selected || null);
                setResult(null);
              }}
            />
          </label>

          {/* Result */}
          {result && (
            <div className="space-y-2 rounded-xl border bg-card p-4 text-sm">
              <div className="flex flex-wrap gap-x-5 gap-y-1">
                <span className="text-emerald-600 dark:text-emerald-400">
                  ✓ {toFaDigits(result.created)} رکورد جدید
                </span>
                {result.updated > 0 && (
                  <span className="text-teal-600 dark:text-teal-400">
                    ↻ {toFaDigits(result.updated)} تکمیل خروج
                  </span>
                )}
                <span className="text-amber-600 dark:text-amber-400">
                  ⚠ {toFaDigits(result.skipped)} رد صرف‌شده
                </span>
              </div>
              {result.errors.length > 0 && (
                <div className="space-y-1 rounded-lg bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-300">
                  {result.errors.map((err, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                      <AlertCircle className="h-3 w-3 shrink-0" />
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
            onClick={handleImport}
            disabled={!file || importAttendance.isPending}
            className="gap-2 bg-gradient-to-l from-teal-600 to-emerald-600 text-white"
          >
            {importAttendance.isPending ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                در حال ورود اطلاعات...
              </>
            ) : (
              <>
                <FileUp className="h-4 w-4" />
                ورود ورود و خروج‌ها
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
