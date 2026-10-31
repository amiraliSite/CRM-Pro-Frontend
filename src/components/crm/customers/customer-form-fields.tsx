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
import { CUSTOMER_STATUS } from "@/lib/crm/types";
import type { CustomerInput } from "@/hooks/use-crm-data";

interface CustomerFormFieldsProps {
  initial?: Partial<CustomerInput>;
  onSubmit: (data: CustomerInput) => void;
  onCancel?: () => void;
  submitLabel?: string;
  submitting?: boolean;
}

export function CustomerFormFields({
  initial,
  onSubmit,
  onCancel,
  submitLabel = "ثبت مشتری",
  submitting,
}: CustomerFormFieldsProps) {
  const [form, setForm] = React.useState<CustomerInput>({
    name: "",
    company: "",
    email: "",
    phone: "",
    status: "lead",
    source: "other",
    address: "",
    notes: "",
    ...initial,
  });

  const set = (key: keyof CustomerInput) => (v: string) =>
    setForm((f) => ({ ...f, [key]: v }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name?.trim()) return;
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="cust-name">
            نام و نام خانوادگی <span className="text-rose-500">*</span>
          </Label>
          <Input
            id="cust-name"
            placeholder="مثلاً سارا احمدی"
            value={form.name}
            onChange={(e) => set("name")(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cust-company">شرکت / سازمان</Label>
          <Input
            id="cust-company"
            placeholder="مثلاً فناوری پویا"
            value={form.company}
            onChange={(e) => set("company")(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cust-phone">شماره تماس</Label>
          <Input
            id="cust-phone"
            dir="ltr"
            className="text-right"
            placeholder="0912..."
            value={form.phone}
            onChange={(e) => set("phone")(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cust-email">ایمیل</Label>
          <Input
            id="cust-email"
            dir="ltr"
            className="text-right"
            type="email"
            placeholder="name@company.com"
            value={form.email}
            onChange={(e) => set("email")(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>وضعیت</Label>
          <Select value={form.status} onValueChange={set("status")}>
            <SelectTrigger>
              <SelectValue placeholder="انتخاب وضعیت" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(CUSTOMER_STATUS).map(([key, v]) => (
                <SelectItem key={key} value={key}>
                  {v.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>منبع آشنایی</Label>
          <Select value={form.source} onValueChange={set("source")}>
            <SelectTrigger>
              <SelectValue placeholder="انتخاب منبع" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="website">وبسایت</SelectItem>
              <SelectItem value="referral">معرفی</SelectItem>
              <SelectItem value="social">شبکه اجتماعی</SelectItem>
              <SelectItem value="cold_call">تماس سرد</SelectItem>
              <SelectItem value="other">سایر</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="cust-address">آدرس</Label>
        <Input
          id="cust-address"
          placeholder="شهر، خیابان..."
          value={form.address}
          onChange={(e) => set("address")(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="cust-notes">یادداشت</Label>
        <Textarea
          id="cust-notes"
          placeholder="اطلاعات تکمیلی درباره مشتری..."
          rows={3}
          value={form.notes}
          onChange={(e) => set("notes")(e.target.value)}
        />
      </div>

      <div className="flex justify-start gap-2 pt-1">
        <Button
          type="submit"
          disabled={submitting}
          className="gap-2 bg-teal-600 hover:bg-teal-700"
        >
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {submitLabel}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            انصراف
          </Button>
        )}
      </div>
    </form>
  );
}
