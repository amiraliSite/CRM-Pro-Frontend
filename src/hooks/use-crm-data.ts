"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
  UseMutationResult,
} from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { apiUrl } from "@/lib/api-base";
import type {
  Activity,
  AttendanceRow,
  CallLog,
  ChatMessage,
  ChatThread,
  Colleague,
  Customer,
  CustomerDetail,
  Deal,
  Meeting,
  PersonalNote,
  Stats,
  Task,
} from "@/lib/crm/types";

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("crm_token") || "" : "";
  const res = await fetch(apiUrl(url), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  });
  if (res.status === 401 && typeof window !== "undefined") {
    localStorage.removeItem("crm_token");
    window.dispatchEvent(new CustomEvent("crm-session-expired"));
    throw new Error("نشست شما منقضی شده — دوباره وارد شوید");
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as { error?: string }).error || "خطای ناشناخته");
  }
  return data as T;
}

/* ---------------- Customers ---------------- */

export function useCustomers(q?: string, status?: string) {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (status) params.set("status", status);
  const qs = params.toString();
  return useQuery<Customer[]>({
    queryKey: ["customers", q ?? "", status ?? ""],
    queryFn: () => fetchJson(`/api/customers${qs ? `?${qs}` : ""}`),
  });
}

export function useCustomerDetail(id: string | null) {
  return useQuery<CustomerDetail>({
    queryKey: ["customer", id],
    queryFn: () => fetchJson(`/api/customers/${id}`),
    enabled: !!id,
  });
}

export type CustomerInput = {
  name: string;
  company?: string;
  email?: string;
  phone?: string;
  status?: string;
  source?: string;
  address?: string;
  notes?: string;
};

export function useCreateCustomer(): UseMutationResult<
  Customer,
  Error,
  CustomerInput
> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CustomerInput) =>
      fetchJson<Customer>("/api/customers", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["customers"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
      toast({ title: "مشتری جدید ثبت شد", description: "مشتری با موفقیت اضافه شد." });
    },
    onError: (e: Error) =>
      toast({ title: "خطا", description: e.message, variant: "destructive" }),
  });
}

export function useUpdateCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CustomerInput> }) =>
      fetchJson<Customer>(`/api/customers/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["customers"] });
      qc.invalidateQueries({ queryKey: ["customer", vars.id] });
      qc.invalidateQueries({ queryKey: ["stats"] });
      toast({ title: "ذخیره شد", description: "اطلاعات مشتری به‌روزرسانی شد." });
    },
    onError: (e: Error) =>
      toast({ title: "خطا", description: e.message, variant: "destructive" }),
  });
}

export function useDeleteCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      fetchJson(`/api/customers/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["customers"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
      toast({ title: "حذف شد", description: "مشتری حذف شد." });
    },
    onError: (e: Error) =>
      toast({ title: "خطا", description: e.message, variant: "destructive" }),
  });
}

/* ---------------- Deals ---------------- */

export function useDeals() {
  return useQuery<Deal[]>({
    queryKey: ["deals"],
    queryFn: () => fetchJson("/api/deals"),
  });
}

export type DealInput = {
  title: string;
  value?: number;
  stage?: string;
  probability?: number;
  customerId?: string | null;
  expectedClose?: string | null;
  notes?: string;
};

export function useCreateDeal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: DealInput) =>
      fetchJson<Deal>("/api/deals", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["deals"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
      toast({ title: "معامله ثبت شد", description: "معامله جدید اضافه شد." });
    },
    onError: (e: Error) =>
      toast({ title: "خطا", description: e.message, variant: "destructive" }),
  });
}

export function useUpdateDeal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<DealInput> }) =>
      fetchJson<Deal>(`/api/deals/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["deals"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
    },
    onError: (e: Error) =>
      toast({ title: "خطا", description: e.message, variant: "destructive" }),
  });
}

export function useDeleteDeal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => fetchJson(`/api/deals/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["deals"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
      toast({ title: "حذف شد", description: "معامله حذف شد." });
    },
    onError: (e: Error) =>
      toast({ title: "خطا", description: e.message, variant: "destructive" }),
  });
}

/* ---------------- Tasks ---------------- */

export function useTasks(status?: string) {
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  const qs = params.toString();
  return useQuery<Task[]>({
    queryKey: ["tasks", status ?? ""],
    queryFn: () => fetchJson(`/api/tasks${qs ? `?${qs}` : ""}`),
  });
}

export type TaskInput = {
  title: string;
  description?: string;
  details?: string;
  /** نام و نام خانوادگی شخصِ مرتبط با تسک */
  personName?: string;
  /** سمت آن شخص */
  personPosition?: string;
  priority?: string;
  status?: string;
  dueDate?: string | null;
  customerId?: string | null;
  assigneeId?: string | null;
  durationMinutes?: number | null;
};

/** One row of the تسک‌دهی page (multi-record submission — per-row recipient). */
export type TaskBatchRow = {
  title: string;
  description?: string;
  details?: string;
  /** نام و نام خانوادگی شخصِ مرتبط با تسک */
  personName?: string;
  /** سمت آن شخص */
  personPosition?: string;
  /** خالی = خودکار — سرور همین روز/ساعت/ثانیه‌ی ارسال را ثبت می‌کند */
  dueDate?: string | null;
  durationMinutes?: number | null;
  /** گیرنده‌ی همین ردیف — پیش‌فرض: مسئول IT */
  assigneeId?: string;
};

export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: TaskInput) =>
      fetchJson<Task>("/api/tasks", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
      toast({ title: "تسک ثبت شد", description: "تسک جدید برای گیرنده ارسال شد." });
    },
    onError: (e: Error) =>
      toast({ title: "خطا", description: e.message, variant: "destructive" }),
  });
}

/** تسک‌دهی — manager submits several rows at once; each row can have its own recipient. */
export function useCreateTaskBatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ items, assigneeId }: { items: TaskBatchRow[]; assigneeId?: string }) =>
      fetchJson<{ batchId: string; count: number; tasks: Task[] }>("/api/tasks", {
        method: "POST",
        body: JSON.stringify({ items, assigneeId }),
      }),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
      toast({
        title: "تسک‌ها ارسال شد",
        description: `${res.count} تسک برای گیرنده‌ها فرستاده شد.`,
      });
    },
    onError: (e: Error) =>
      toast({ title: "خطا", description: e.message, variant: "destructive" }),
  });
}

/** IT forwards a task it received (from management) to an employee. */
export function useForwardTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ sourceId, assigneeId }: { sourceId: string; assigneeId: string }) =>
      fetchJson<Task>("/api/tasks", {
        method: "POST",
        body: JSON.stringify({ forwardOf: sourceId, assigneeId }),
      }),
    onSuccess: (task) => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
      toast({
        title: "تسک ارسال شد",
        description: `برای ${task.assignee?.fullName ?? "کارمند"} فرستاده شد.`,
      });
    },
    onError: (e: Error) =>
      toast({ title: "خطا", description: e.message, variant: "destructive" }),
  });
}

/** ارسال کلِ یک قالب (batch) با یک کلیک برای فرد مورد نظر —
 *  همه‌ی تسک‌های قالب یک‌جا کپی می‌شوند و برای گیرنده یک قالبِ یکپارچه دیده می‌شود. */
export function useForwardTaskBatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      sourceBatchId,
      assigneeId,
    }: {
      sourceBatchId: string;
      assigneeId: string;
    }) =>
      fetchJson<{ batchId: string; count: number; tasks: Task[] }>("/api/tasks", {
        method: "POST",
        body: JSON.stringify({ forwardBatchOf: sourceBatchId, assigneeId }),
      }),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
      toast({
        title: "کل قالب ارسال شد",
        description: `${res.count} تسکِ این قالب یک‌جا برای گیرنده فرستاده شد.`,
      });
    },
    onError: (e: Error) =>
      toast({ title: "خطا", description: e.message, variant: "destructive" }),
  });
}

/** Active teammates — usable by every role (task pickers, forwarding). */
export function useColleagues() {
  return useQuery<Colleague[]>({
    queryKey: ["colleagues"],
    queryFn: () => fetchJson("/api/colleagues"),
    staleTime: 60_000,
  });
}

export function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<TaskInput> }) =>
      fetchJson<Task>(`/api/tasks/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
    },
    onError: (e: Error) =>
      toast({ title: "خطا", description: e.message, variant: "destructive" }),
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => fetchJson(`/api/tasks/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
      toast({ title: "حذف شد", description: "وظیفه حذف شد." });
    },
    onError: (e: Error) =>
      toast({ title: "خطا", description: e.message, variant: "destructive" }),
  });
}

/* ---------------- Call log (ثبت تماس) ---------------- */

export function useCallLogs() {
  return useQuery<CallLog[]>({
    queryKey: ["calls"],
    queryFn: () => fetchJson("/api/calls"),
  });
}

export type CallInput = {
  contactName: string;
  phone?: string;
  callDate?: string | null;
  durationMinutes?: number | null;
  result?: string;
  /** کانال ارتباطی — تلفن، تلگرام، ایمیل و... (تسک ۴۲) */
  channel?: string;
  notes?: string;
};

export function useCreateCallLog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CallInput) =>
      fetchJson<CallLog>("/api/calls", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["calls"] });
      toast({ title: "تماس ثبت شد", description: "گزارش تماس جدید ذخیره شد." });
    },
    onError: (e: Error) =>
      toast({ title: "خطا", description: e.message, variant: "destructive" }),
  });
}

export function useDeleteCall() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      fetchJson(`/api/calls?id=${encodeURIComponent(id)}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["calls"] });
      toast({ title: "حذف شد", description: "تماس حذف شد." });
    },
    onError: (e: Error) =>
      toast({ title: "خطا", description: e.message, variant: "destructive" }),
  });
}

/* ---------------- Meetings (جلسات) ---------------- */

export function useMeetings() {
  return useQuery<Meeting[]>({
    queryKey: ["meetings"],
    queryFn: () => fetchJson("/api/meetings"),
  });
}

export type MeetingInput = {
  subject: string;
  meetingDate: string;
  time?: string;
  quality?: string;
  company?: string;
  customerId?: string | null;
  notes?: string;
};

export function useCreateMeeting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: MeetingInput) =>
      fetchJson<Meeting>("/api/meetings", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["meetings"] });
      toast({ title: "جلسه ثبت شد", description: "جلسه‌ی برگزارشده ذخیره شد." });
    },
    onError: (e: Error) =>
      toast({ title: "خطا", description: e.message, variant: "destructive" }),
  });
}

export function useDeleteMeeting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      fetchJson(`/api/meetings?id=${encodeURIComponent(id)}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["meetings"] });
      toast({ title: "حذف شد", description: "جلسه حذف شد." });
    },
    onError: (e: Error) =>
      toast({ title: "خطا", description: e.message, variant: "destructive" }),
  });
}

/* ---------------- Activities ---------------- */

export function useActivities(type?: string) {
  const params = new URLSearchParams();
  if (type) params.set("type", type);
  const qs = params.toString();
  return useQuery<Activity[]>({
    queryKey: ["activities", type ?? ""],
    queryFn: () => fetchJson(`/api/activities${qs ? `?${qs}` : ""}`),
  });
}

export type ActivityInput = {
  type?: string;
  title: string;
  description?: string;
  customerId?: string | null;
};

export function useCreateActivity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: ActivityInput) =>
      fetchJson<Activity>("/api/activities", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["activities"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
      toast({ title: "فعالیت ثبت شد", description: "فعالیت جدید اضافه شد." });
    },
    onError: (e: Error) =>
      toast({ title: "خطا", description: e.message, variant: "destructive" }),
  });
}

/* ---------------- Stats ---------------- */

export function useStats() {
  return useQuery<Stats>({
    queryKey: ["stats"],
    queryFn: () => fetchJson("/api/stats"),
  });
}

/* ---------------- Users (admin) ---------------- */

export interface CrmUser {
  id: string;
  username: string;
  fullName: string;
  role: "admin" | "agent";
  color: string;
  active: boolean;
  createdAt: string;
}

export function useUsers() {
  return useQuery<CrmUser[]>({
    queryKey: ["users"],
    queryFn: () => fetchJson("/api/users"),
  });
}

/* ---------------- Attendance (ورود/خروج) ---------------- */

export function useAttendance() {
  return useQuery<AttendanceRow[]>({
    queryKey: ["attendance"],
    queryFn: () => fetchJson("/api/attendance"),
  });
}

/** حذف رکورد حضور و غیاب — فقط مدیریت شرکت و مدیر بخش (تسک ۴۵) */
export function useDeleteAttendance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      fetchJson(`/api/attendance?id=${encodeURIComponent(id)}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["attendance"] });
      toast({ title: "حذف شد", description: "رکورد حضور و غیاب حذف شد." });
    },
    onError: (e: Error) =>
      toast({ title: "خطا", description: e.message, variant: "destructive" }),
  });
}

/* ---------------- Internal chat ---------------- */

export function useChatThreads() {
  return useQuery<ChatThread[]>({
    queryKey: ["chat-threads"],
    queryFn: () => fetchJson("/api/chat"),
    refetchInterval: 4000,
  });
}

export function useChatMessages(withId: string | null) {
  return useQuery<ChatMessage[]>({
    queryKey: ["chat", withId],
    queryFn: () => fetchJson(`/api/chat?with=${withId}`),
    enabled: !!withId,
    refetchInterval: 3000,
  });
}

export function useSendChat() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ toId, body }: { toId: string; body: string }) =>
      fetchJson<ChatMessage>("/api/chat", {
        method: "POST",
        body: JSON.stringify({ toId, body }),
      }),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["chat", vars.toId] });
      qc.invalidateQueries({ queryKey: ["chat-threads"] });
    },
  });
}

/* ---------------- Personal box (باکس شخصی) ---------------- */

export function useNotes() {
  return useQuery<PersonalNote[]>({
    queryKey: ["notes"],
    queryFn: () => fetchJson("/api/notes"),
  });
}

export type NoteInput = {
  title: string;
  content?: string;
  color?: string;
  pinned?: boolean;
};

export function useCreateNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: NoteInput) =>
      fetchJson<PersonalNote>("/api/notes", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notes"] });
      toast({ title: "یادداشت ثبت شد", description: "به باکس شخصی شما اضافه شد." });
    },
    onError: (e: Error) =>
      toast({ title: "خطا", description: e.message, variant: "destructive" }),
  });
}

export function useUpdateNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<NoteInput> }) =>
      fetchJson<PersonalNote>(`/api/notes/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notes"] });
    },
    onError: (e: Error) =>
      toast({ title: "خطا", description: e.message, variant: "destructive" }),
  });
}

export function useDeleteNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => fetchJson(`/api/notes/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notes"] });
      toast({ title: "حذف شد", description: "یادداشت از باکس شخصی پاک شد." });
    },
    onError: (e: Error) =>
      toast({ title: "خطا", description: e.message, variant: "destructive" }),
  });
}

export type NewUserInput = {
  username: string;
  fullName: string;
  password: string;
  role: "admin" | "agent";
};

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: NewUserInput) =>
      fetchJson<CrmUser>("/api/users", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
      toast({ title: "کاربر ساخته شد", description: "کاربر جدید اضافه شد." });
    },
    onError: (e: Error) =>
      toast({ title: "خطا", description: e.message, variant: "destructive" }),
  });
}

export type UpdateUserInput = {
  fullName?: string;
  role?: "admin" | "agent";
  active?: boolean;
  password?: string;
};

export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateUserInput }) =>
      fetchJson<CrmUser>(`/api/users/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
      toast({ title: "ذخیره شد", description: "اطلاعات کاربر به‌روزرسانی شد." });
    },
    onError: (e: Error) =>
      toast({ title: "خطا", description: e.message, variant: "destructive" }),
  });
}

export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      fetchJson(`/api/users/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
      toast({ title: "حذف شد", description: "کاربر حذف شد." });
    },
    onError: (e: Error) =>
      toast({ title: "خطا", description: e.message, variant: "destructive" }),
  });
}

/* ---------------- Customer Club Excel ---------------- */

export interface ImportResult {
  created: number;
  updated: number;
  skipped: number;
  errors: string[];
}

export function useImportCustomers() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (file: File): Promise<ImportResult> => {
      const form = new FormData();
      form.append("file", file);
      const token =
        typeof window !== "undefined" ? localStorage.getItem("crm_token") || "" : "";
      const res = await fetch(apiUrl("/api/customers/import"), {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: form,
      });
      if (res.status === 401 && typeof window !== "undefined") {
        localStorage.removeItem("crm_token");
        window.dispatchEvent(new CustomEvent("crm-session-expired"));
        throw new Error("نشست شما منقضی شده — دوباره وارد شوید");
      }
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error((data as { error?: string }).error || "خطا در ورود اطلاعات");
      }
      return data as ImportResult;
    },
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: ["customers"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
      toast({
        title: "ورود اکسل انجام شد",
        description: `${result.created} مشتری جدید · ${result.updated} به‌روزرسانی · ${result.skipped} رد صرف‌شده`,
      });
    },
    onError: (e: Error) =>
      toast({ title: "خطا", description: e.message, variant: "destructive" }),
  });
}

export function useImportAttendance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (file: File): Promise<ImportResult> => {
      const form = new FormData();
      form.append("file", file);
      const token =
        typeof window !== "undefined" ? localStorage.getItem("crm_token") || "" : "";
      const res = await fetch(apiUrl("/api/attendance/import"), {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: form,
      });
      if (res.status === 401 && typeof window !== "undefined") {
        localStorage.removeItem("crm_token");
        window.dispatchEvent(new CustomEvent("crm-session-expired"));
        throw new Error("نشست شما منقضی شده — دوباره وارد شوید");
      }
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error((data as { error?: string }).error || "خطا در ورود اطلاعات");
      }
      return data as ImportResult;
    },
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: ["attendance"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
      toast({
        title: "ورود اکسل انجام شد",
        description: `${result.created} رکورد جدید · ${result.updated} تکمیل خروج · ${result.skipped} رد صرف‌شده`,
      });
    },
    onError: (e: Error) =>
      toast({ title: "خطا", description: e.message, variant: "destructive" }),
  });
}

export async function downloadCustomersExcel(template: boolean) {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("crm_token") || "" : "";
  const res = await fetch(
    `/api/customers/export${template ? "?template=1" : ""}`,
    { headers: token ? { Authorization: `Bearer ${token}` } : {} }
  );
  if (!res.ok) throw new Error("خطا در دریافت فایل");
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = template ? "customer-template.xlsx" : "customers.xlsx";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
