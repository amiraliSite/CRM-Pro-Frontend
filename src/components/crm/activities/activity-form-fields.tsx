"use client";

import * as React from "react";
import { Loader2, Phone, Calendar, Mail, StickyNote } from "lucide-react";
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
import { cn } from "@/lib/utils";
import { useCreateActivity, useCustomers, type ActivityInput } from "@/hooks/use-crm-data";

const TYPES = [
  { key: "call", label: "تماس", icon: Phone },
  { key: "meeting", label: "جلسه", icon: Calendar },
  { key: "email", label: "ایمیل", icon: Mail },
  { key: "note", label: "یادداشت", icon: StickyNote },
] as const;

interface ActivityFormFieldsProps {
  initial?: Partial<ActivityInput>;
  onDone?: () => void;
  hideButtons?: boolean;
  onSubmitData?: (data: ActivityInput) => void;
  submitting?: boolean;
  submitLabel?: string;
}

export function ActivityFormFields({
  initial,
  onDone,
  hideButtons = false,
  onSubmitData,
  submitting,
  submitLabel = "ثبت فعالیت",
}: ActivityFormFieldsProps) {
  const { data: customers } = useCustomers();
  const [form, setForm] = React.useState<ActivityInput>({
    type: "call",
    title: "",
    description: "",
    customerId: null,
    ...initial,
  });
  const createActivity = useCreateActivity();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title?.trim()) return;
    if (onSubmitData) {
      onSubmitData(form);
      return;
    }
    createActivity.mutate(form, { onSuccess: onDone });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>نوع فعالیت</Label>
        <div className="grid grid-cols-4 gap-2">
          {TYPES.map((t) => {
            const Icon = t.icon;
            const active = form.type === t.key;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setForm((f) => ({ ...f, type: t.key }))}
                className={cn(
                  "flex flex-col items-center gap-1.5 rounded-xl border p-3 text-xs font-medium transition-all",
                  active
                    ? "border-teal-600 bg-teal-50 text-teal-700 shadow-sm dark:bg-teal-500/10 dark:text-teal-300"
                    : "bg-background hover:bg-muted"
                )}
              >
                <Icon className="h-4 w-4" />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="act-title">
          عنوان <span className="text-rose-500">*</span>
        </Label>
        <Input
          id="act-title"
          placeholder="مثلاً تماس پیگیری با سارا احمدی"
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          required
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

      <div className="space-y-2">
        <Label htmlFor="act-desc">توضیحات</Label>
        <Textarea
          id="act-desc"
          placeholder="نتیجه تماس، صورت‌جلسه و..."
          rows={3}
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
        />
      </div>

      {!hideButtons && (
        <div className="flex justify-start gap-2 pt-1">
          <Button
            type="submit"
            disabled={submitting || createActivity.isPending}
            className="gap-2 bg-teal-600 hover:bg-teal-700"
          >
            {(submitting || createActivity.isPending) && (
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
