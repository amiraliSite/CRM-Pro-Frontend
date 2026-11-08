export type CustomerStatus = "lead" | "active" | "vip" | "inactive";
export type DealStage = "new" | "contacted" | "negotiation" | "won" | "lost";
export type TaskPriority = "low" | "medium" | "high" | "urgent";
export type TaskStatus = "open" | "in_progress" | "done";
export type ActivityType = "call" | "meeting" | "email" | "note";
export type CallResult = "answered" | "no_answer" | "followup" | "canceled";

export interface Customer {
  id: string;
  /** آیدی مخصوص عضو باشگاه (M-1001 ...) — خودکار ساخته می‌شود */
  memberCode?: string | null;
  name: string;
  company?: string | null;
  email?: string | null;
  phone?: string | null;
  status: CustomerStatus;
  source: string;
  address?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  deals?: { value: number; stage: DealStage }[];
  tasks?: { id: string; status: TaskStatus }[];
  activities?: { id: string; title: string; createdAt: string }[];
  callLogs?: { id: string; callDate?: string }[];
}

export interface CustomerDetail extends Customer {
  deals: Deal[];
  tasks: Task[];
  activities: Activity[];
}

export interface Deal {
  id: string;
  title: string;
  value: number;
  stage: DealStage;
  probability: number;
  customerId?: string | null;
  customer?: { id: string; name: string; company?: string | null } | null;
  expectedClose?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string | null;
  details?: string | null;
  batchId?: string | null;
  /** نام و نام خانوادگی شخصِ مرتبط با تسک (مدیر هنگام تسک‌دهی می‌نویسد) */
  personName?: string | null;
  /** سمت آن شخص */
  personPosition?: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate?: string | null;
  durationMinutes?: number | null;
  customerId?: string | null;
  assigneeId?: string | null;
  /** قفل فوروارد مجدد (تسک ۴۳) — بعد از اولین ارسال پر می‌شود */
  forwardedAt?: string | null;
  forwardedToId?: string | null;
  assignee?: { id: string; fullName: string; color: string } | null;
  createdById?: string | null;
  createdBy?: { id: string; fullName: string; color: string } | null;
  customer?: { id: string; name: string; company?: string | null } | null;
  createdAt: string;
  updatedAt: string;
}

/** Lightweight teammate row for team pickers (assignment / forwarding). */
export interface Colleague {
  id: string;
  username: string;
  fullName: string;
  role: string;
  color: string;
}

export interface Activity {
  id: string;
  type: ActivityType;
  title: string;
  description?: string | null;
  customerId?: string | null;
  customer?: { id: string; name: string; company?: string | null } | null;
  createdAt: string;
}

export interface Stats {
  kpis: {
    totalCustomers: number;
    newCustomersThisMonth: number;
    openDealsCount: number;
    openPipelineValue: number;
    wonDealsCount: number;
    wonValue: number;
    winRate: number;
    openTasksCount: number;
    overdueTasks: number;
    totalDeals: number;
  };
  customersByStatus: { key: string; label: string; count: number }[];
  customersBySource: { source: string; label: string; count: number }[];
  pipeline: { key: string; label: string; count: number; value: number }[];
  monthlyRevenue: {
    month: string;
    revenue: number;
    dealsCount: number;
    newCustomers: number;
  }[];
  topOpportunities: Deal[];
  upcomingTasks: Task[];
  recentActivities: Activity[];
}

export const DEAL_STAGES: { key: DealStage; label: string; color: string }[] = [
  { key: "new", label: "جدید", color: "#8b5cf6" },
  { key: "contacted", label: "در تماس", color: "#14b8a6" },
  { key: "negotiation", label: "مذاکره", color: "#f59e0b" },
  { key: "won", label: "برنده", color: "#10b981" },
  { key: "lost", label: "باخته", color: "#f43f5e" },
];

export const CUSTOMER_STATUS: Record<
  CustomerStatus,
  { label: string; className: string }
> = {
  lead: {
    label: "سرنخ",
    className:
      "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300 border-violet-200 dark:border-violet-500/25",
  },
  active: {
    label: "فعال",
    className:
      "bg-teal-100 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300 border-teal-200 dark:border-teal-500/25",
  },
  vip: {
    label: "ویژه",
    className:
      "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300 border-amber-200 dark:border-amber-500/25",
  },
  inactive: {
    label: "غیرفعال",
    className:
      "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300 border-rose-200 dark:border-rose-500/25",
  },
};

export const TASK_PRIORITY: Record<
  TaskPriority,
  { label: string; className: string; dot: string }
> = {
  low: {
    label: "کم",
    className:
      "bg-slate-100 text-slate-600 dark:bg-slate-500/15 dark:text-slate-300 border-slate-200 dark:border-slate-500/25",
    dot: "bg-slate-400",
  },
  medium: {
    label: "متوسط",
    className:
      "bg-teal-100 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300 border-teal-200 dark:border-teal-500/25",
    dot: "bg-teal-500",
  },
  high: {
    label: "زیاد",
    className:
      "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300 border-amber-200 dark:border-amber-500/25",
    dot: "bg-amber-500",
  },
  urgent: {
    label: "فوری",
    className:
      "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300 border-rose-200 dark:border-rose-500/25",
    dot: "bg-rose-500",
  },
};

export const TASK_STATUS: Record<TaskStatus, { label: string }> = {
  open: { label: "باز" },
  in_progress: { label: "در حال انجام" },
  done: { label: "انجام شد" },
};

export const ACTIVITY_TYPES: Record<
  ActivityType,
  { label: string; icon: string }
> = {
  call: { label: "تماس", icon: "Phone" },
  meeting: { label: "جلسه", icon: "Calendar" },
  email: { label: "ایمیل", icon: "Mail" },
  note: { label: "یادداشت", icon: "StickyNote" },
};

/* ---------------- Call log (ثبت تماس) ---------------- */

export interface CallLog {
  id: string;
  userId: string;
  user?: { id: string; fullName: string; color: string } | null;
  contactName: string;
  phone?: string | null;
  /** اگر مخاطب عضو باشگاه مشتریان باشد — پروفایلش اینجا لینک می‌شود */
  customerId?: string | null;
  customer?: {
    id: string;
    name: string;
    memberCode?: string | null;
    phone?: string | null;
    status?: string;
  } | null;
  callDate: string;
  durationMinutes?: number | null;
  result: CallResult;
  /** کانال ارتباطی تماس — تلفن، تلگرام، ایمیل و... (تسک ۴۲) */
  channel: string;
  notes?: string | null;
  createdAt: string;
}

export const CALL_RESULTS: Record<
  CallResult,
  { label: string; className: string }
> = {
  answered: {
    label: "پاسخ داد",
    className:
      "bg-teal-100 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300 border-teal-200 dark:border-teal-500/25",
  },
  no_answer: {
    label: "پاسخ نداد",
    className:
      "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300 border-rose-200 dark:border-rose-500/25",
  },
  followup: {
    label: "نیاز به پیگیری",
    className:
      "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300 border-amber-200 dark:border-amber-500/25",
  },
  canceled: {
    label: "لغو شد",
    className:
      "bg-slate-100 text-slate-600 dark:bg-slate-500/15 dark:text-slate-300 border-slate-200 dark:border-slate-500/25",
  },
};

/* ---------------- Call channels (کانال تماس — تسک ۴۲) ---------------- */

export type CallChannel =
  | "phone"
  | "telegram"
  | "email"
  | "whatsapp"
  | "instagram"
  | "sms"
  | "inperson"
  | "other";

/** کانال ارتباطی تماس — با بج رنگی برای هر کانال */
export const CALL_CHANNELS: Record<
  CallChannel,
  { label: string; className: string }
> = {
  phone: {
    label: "تلفن",
    className:
      "bg-teal-100 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300 border-teal-200 dark:border-teal-500/25",
  },
  telegram: {
    label: "تلگرام",
    className:
      "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300 border-sky-200 dark:border-sky-500/25",
  },
  email: {
    label: "ایمیل",
    className:
      "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300 border-violet-200 dark:border-violet-500/25",
  },
  whatsapp: {
    label: "واتساپ",
    className:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/25",
  },
  instagram: {
    label: "اینستاگرام",
    className:
      "bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-500/15 dark:text-fuchsia-300 border-fuchsia-200 dark:border-fuchsia-500/25",
  },
  sms: {
    label: "پیامک",
    className:
      "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300 border-amber-200 dark:border-amber-500/25",
  },
  inperson: {
    label: "حضوری",
    className:
      "bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300 border-orange-200 dark:border-orange-500/25",
  },
  other: {
    label: "سایر",
    className:
      "bg-slate-100 text-slate-600 dark:bg-slate-500/15 dark:text-slate-300 border-slate-200 dark:border-slate-500/25",
  },
};

export const CALL_CHANNEL_KEYS = Object.keys(CALL_CHANNELS) as CallChannel[];

/* ---------------- Meetings (جلسات) ---------------- */

export interface Meeting {
  id: string;
  subject: string;
  meetingDate: string;
  /** ساعت برگزاری به شکل "14:30" */
  time: string;
  quality: string;
  company?: string | null;
  customerId?: string | null;
  customer?: {
    id: string;
    name: string;
    company?: string | null;
    phone?: string | null;
    status?: string;
  } | null;
  notes?: string | null;
  createdById?: string | null;
  createdBy?: { id: string; fullName: string; color: string } | null;
  createdAt: string;
  updatedAt: string;
}

export const MEETING_QUALITY: Record<string, { label: string; className: string }> = {
  عالی: {
    label: "عالی",
    className:
      "bg-teal-100 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300 border-teal-200 dark:border-teal-500/25",
  },
  خوب: {
    label: "خوب",
    className:
      "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300 border-sky-200 dark:border-sky-500/25",
  },
  متوسط: {
    label: "متوسط",
    className:
      "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300 border-amber-200 dark:border-amber-500/25",
  },
  ضعیف: {
    label: "ضعیف",
    className:
      "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300 border-rose-200 dark:border-rose-500/25",
  },
};

export const MEETING_QUALITY_KEYS = Object.keys(MEETING_QUALITY);

/* ---------------- Staff roles ---------------- */

export type StaffRole =
  | "admin"
  | "manager"
  | "agent"
  | "it"
  | "support"
  | "insta";

export const ROLE_LABELS: Record<StaffRole, string> = {
  admin: "مدیریت شرکت",
  manager: "مدیر بخش",
  agent: "مسئول فروش",
  it: "مسئول IT",
  support: "پشتیبان",
  insta: "ادمین اینستاگرام",
};

export const ROLES = Object.keys(ROLE_LABELS) as StaffRole[];

export function roleLabel(role: string | undefined | null): string {
  if (!role) return "";
  return ROLE_LABELS[role as StaffRole] ?? role;
}

/* ---------------- Attendance (ورود/خروج) ---------------- */

export interface AttendanceRow {
  id: string;
  userId: string;
  checkIn: string;
  checkOut?: string | null;
  user?: { id: string; fullName: string; username: string; role: string; color: string };
}

/* ---------------- Internal chat ---------------- */

export interface ChatMessage {
  id: string;
  fromId: string;
  toId: string;
  body: string;
  createdAt: string;
  readAt?: string | null;
}

export interface ChatThread {
  user: { id: string; fullName: string; username: string; role: string; color: string };
  lastBody: string;
  lastAt: string;
  unread: number;
}

/* ---------------- Personal box (باکس شخصی) ---------------- */

export type NoteColor = "teal" | "amber" | "violet" | "rose" | "sky";

export interface PersonalNote {
  id: string;
  userId: string;
  title: string;
  content?: string | null;
  color: NoteColor | string;
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
}

export const SOURCE_LABELS: Record<string, string> = {
  website: "وبسایت",
  referral: "معرفی",
  social: "شبکه اجتماعی",
  cold_call: "تماس سرد",
  other: "سایر",
};
