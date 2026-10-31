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
import { useCreateTask, useCustomers, useColleagues, type TaskInput } from "@/hooks/use-crm-data";
import { JalaliDatePicker } from "@/components/ui/jalali-date-picker";
import { TASK_PRIORITY, roleLabel } from "@/lib/crm/types";
import { usePermissions } from "@/lib/crm/store";
import { cn } from "@/lib/utils";

interface TaskFormFieldsProps {
  initial?: Partial<TaskInput>;
  onDone?: () => void;
  hideButtons?: boolean;
  onSubmitData?: (data: TaskInput) => void;
  submitting?: boolean;
  submitLabel?: string;
}

export function TaskFormFields({
  initial,
  onDone,
  hideButtons = false,
  onSubmitData,
  submitting,
  submitLabel = "ثبت وظیفه",
}: TaskFormFieldsProps) {
  const { data: customers } = useCustomers();
  const { data: colleagues } = useColleagues();
  const { canCreateTasks } = usePermissions();
  const [form, setForm] = React.useState<TaskInput>({
    title: "",
    description: "",
    priority: "medium",
    status: "open",
    dueDate: null,
    customerId: null,
    ...initial,
  });
  const createTask = useCreateTask();

  // پیش‌فرضِ گیرنده: مسئول IT (مدیر شرکت تسک را برای IT می‌فرستد)
  const defaultPicked = React.useRef(initial?.assigneeId !== undefined);
  React.useEffect(() => {
    if (defaultPicked.current || !canCreateTasks) return;
    if (!colleagues?.length) return;
    const itUser = colleagues.find((u) => u.role === "it");
    if (itUser) {
      setForm((f) => ({ ...f, assigneeId: itUser.id }));
    }
    defaultPicked.current = true;
  }, [colleagues, canCreateTasks]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title?.trim()) return;
    const payload: TaskInput = {
      ...form,
      dueDate: form.dueDate || null,
    };
    if (onSubmitData) {
      onSubmitData(payload);
      return;
    }
    createTask.mutate(payload, { onSuccess: onDone });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="task-title">
          عنوان وظیفه <span className="text-rose-500">*</span>
        </Label>
        <Input
          id="task-title"
          placeholder="مثلاً تماس پیگیری با مشتری"
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          required
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {canCreateTasks && (
          <div className="space-y-2">
            <Label>گیرنده تسک</Label>
            <Select
              value={form.assigneeId ?? "me"}
              onValueChange={(v) =>
                setForm((f) => ({ ...f, assigneeId: v === "me" ? undefined : v }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="انتخاب گیرنده" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="me">خودم</SelectItem>
                {(colleagues ?? [])
                  .filter((u) => u.id !== undefined)
                  .map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      <span className="inline-flex items-center gap-2">
                        <span
                          className={cn(
                            "inline-block h-2 w-2 rounded-full",
                            u.color
                          )}
                        />
                        {u.fullName}
                        <span className="text-[10px] text-muted-foreground">
                          ({roleLabel(u.role)})
                        </span>
                      </span>
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor="task-duration">مدت زمان (دقیقه)</Label>
          <Input
            id="task-duration"
            dir="ltr"
            type="number"
            min={1}
            placeholder="مثلاً 45"
            className="text-right"
            value={form.durationMinutes ?? ""}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                durationMinutes: e.target.value ? Number(e.target.value) : null,
              }))
            }
          />
        </div>
        <div className="space-y-2">
          <Label>اولویت</Label>
          <Select
            value={form.priority}
            onValueChange={(v) => setForm((f) => ({ ...f, priority: v }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="انتخاب اولویت" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(TASK_PRIORITY).map(([key, v]) => (
                <SelectItem key={key} value={key}>
                  {v.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="task-due">ددلاین</Label>
          {/* (تسک ۵۱ بخش ۳) تقویم شمسی — مقدار همچنان ISO میلادی ذخیره می‌شود */}
          <JalaliDatePicker
            value={form.dueDate ?? ""}
            onChange={(iso) =>
              setForm((f) => ({ ...f, dueDate: iso || null }))
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
      </div>

      <div className="space-y-2">
        <Label htmlFor="task-desc">توضیحات</Label>
        <Textarea
          id="task-desc"
          placeholder="جزئیات وظیفه..."
          rows={3}
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
        />
      </div>

      {!hideButtons && (
        <div className="flex justify-start gap-2 pt-1">
          <Button
            type="submit"
            disabled={submitting || createTask.isPending}
            className="gap-2 bg-teal-600 hover:bg-teal-700"
          >
            {(submitting || createTask.isPending) && (
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
