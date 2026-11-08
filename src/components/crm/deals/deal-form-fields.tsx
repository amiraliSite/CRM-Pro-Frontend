"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { JalaliDatePicker } from "@/components/ui/jalali-date-picker";
import { useCreateDeal, useCustomers, type DealInput } from "@/hooks/use-crm-data";
import { DEAL_STAGES } from "@/lib/crm/types";

interface DealFormFieldsProps {
  initial?: Partial<DealInput>;
  onDone?: () => void;
  fixedStage?: string;
  allowStageSelect?: boolean;
  submitLabel?: string;
  hideButtons?: boolean;
  onSubmitData?: (data: DealInput) => void;
  submitting?: boolean;
}

export function DealFormFields({
  initial,
  onDone,
  fixedStage,
  allowStageSelect = false,
  submitLabel = "ثبت معامله",
  hideButtons = false,
  onSubmitData,
  submitting,
}: DealFormFieldsProps) {
  const { data: customers } = useCustomers();
  const [form, setForm] = React.useState<DealInput>({
    title: "",
    value: undefined as unknown as number,
    stage: fixedStage || "new",
    probability: 30,
    customerId: null,
    expectedClose: null,
    notes: "",
    ...initial,
  });
  const createDeal = useCreateDeal();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title?.trim()) return;
    const payload: DealInput = {
      ...form,
      value: Number(form.value) || 0,
      expectedClose: form.expectedClose || null,
    };
    if (onSubmitData) {
      onSubmitData(payload);
      return;
    }
    createDeal.mutate(payload, { onSuccess: onDone });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="deal-title">
            عنوان معامله <span className="text-rose-500">*</span>
          </Label>
          <Input
            id="deal-title"
            placeholder="مثلاً قرارداد پکیج سازمانی"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="deal-value">ارزش معامله (تومان)</Label>
          <Input
            id="deal-value"
            dir="ltr"
            className="text-right"
            type="number"
            min={0}
            placeholder="450000000"
            value={form.value ?? ""}
            onChange={(e) =>
              setForm((f) => ({ ...f, value: Number(e.target.value) }))
            }
          />
        </div>
        <div className="space-y-2">
          <Label>مشتری مرتبط</Label>
          <Select
            value={form.customerId ?? "none"}
            onValueChange={(v) =>
              setForm((f) => ({ ...f, customerId: v === "none" ? null : v }))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="انتخاب مشتری" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">بدون مشتری</SelectItem>
              {(customers ?? []).map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name} {c.company ? `— ${c.company}` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {allowStageSelect && (
          <div className="space-y-2">
            <Label>مرحله فروش</Label>
            <Select
              value={form.stage}
              onValueChange={(v) => setForm((f) => ({ ...f, stage: v }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="انتخاب مرحله" />
              </SelectTrigger>
              <SelectContent>
                {DEAL_STAGES.map((s) => (
                  <SelectItem key={s.key} value={s.key}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor="deal-date">تاریخ پیش‌بینی بستن</Label>
          {/* (تسک ۵۱ بخش ۳) تقویم شمسی — مقدار همچنان ISO میلادی ذخیره می‌شود */}
          <JalaliDatePicker
            id="deal-date"
            value={form.expectedClose ?? ""}
            onChange={(iso) =>
              setForm((f) => ({ ...f, expectedClose: iso || null }))
            }
          />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>احتمال موفقیت</Label>
          <span className="text-sm font-semibold text-teal-600 dark:text-teal-400">
            {form.probability}٪
          </span>
        </div>
        <Slider
          value={[form.probability ?? 30]}
          onValueChange={([v]) => setForm((f) => ({ ...f, probability: v }))}
          max={100}
          step={5}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="deal-notes">توضیحات</Label>
        <Textarea
          id="deal-notes"
          placeholder="جزئیات معامله..."
          rows={3}
          value={form.notes}
          onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
        />
      </div>

      {!hideButtons && (
        <div className="flex justify-start gap-2 pt-1">
          <Button
            type="submit"
            disabled={submitting || createDeal.isPending}
            className="gap-2 bg-teal-600 hover:bg-teal-700"
          >
            {(submitting || createDeal.isPending) && (
              <Loader2 className="h-4 w-4 animate-spin" />
            )}
            {submitLabel}
          </Button>
          {onDone && (
            <Button type="button" variant="outline" onClick={onDone}>
              انصراف
            </Button>
          )}
        </div>
      )}
    </form>
  );
}
