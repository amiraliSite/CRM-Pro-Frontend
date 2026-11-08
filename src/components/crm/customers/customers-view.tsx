"use client";

import * as React from "react";
import {
  Mail,
  Phone,
  MoreHorizontal,
  Pencil,
  Trash2,
  Eye,
  UserPlus,
  Building2,
  FileUp,
  Download,
  Crown,
  Users,
  Sparkles,
  UserCheck,
  Star,
  UserX,
} from "lucide-react";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { EmptyState } from "@/components/crm/shared/empty-state";
import { CustomerFormFields } from "@/components/crm/customers/customer-form-fields";
import { CustomerDetailSheet } from "@/components/crm/customers/customer-detail-sheet";
import { ImportDialog } from "@/components/crm/customers/import-dialog";
import {
  useCustomers,
  useCreateCustomer,
  useUpdateCustomer,
  useDeleteCustomer,
  downloadCustomersExcel,
  type CustomerInput,
} from "@/hooks/use-crm-data";
import { CUSTOMER_STATUS, type Customer, type CustomerStatus } from "@/lib/crm/types";
import { avatarColor, getInitials, timeAgo, toFaDigits } from "@/lib/crm/utils";
import { usePermissions } from "@/lib/crm/store";
import { cn } from "@/lib/utils";

export function CustomersView() {
  const { canManageCustomers: canManage, canDeleteCustomer } = usePermissions();
  const [q, setQ] = React.useState("");
  const [status, setStatus] = React.useState("");
  const [addOpen, setAddOpen] = React.useState(false);
  const [editCustomer, setEditCustomer] = React.useState<Customer | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<Customer | null>(null);
  const [detailId, setDetailId] = React.useState<string | null>(null);
  const [importOpen, setImportOpen] = React.useState(false);
  const [exporting, setExporting] = React.useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      await downloadCustomersExcel(false);
    } catch {
      /* errors surfaced by browser */
    } finally {
      setExporting(false);
    }
  };

  // وضعیت سمت کلاینت فیلتر می‌شود تا شمارنده‌ی تایل‌ها همیشه کل اعضای نتیجه‌ی جستجو را نشان دهد
  const { data: fetchedCustomers, isLoading } = useCustomers(q || undefined);
  const customers = React.useMemo(
    () => (fetchedCustomers ?? []).filter((c) => !status || c.status === status),
    [fetchedCustomers, status]
  );
  const createCustomer = useCreateCustomer();
  const updateCustomer = useUpdateCustomer();
  const deleteCustomer = useDeleteCustomer();

  const handleCreate = (data: CustomerInput) => {
    createCustomer.mutate(data, { onSuccess: () => setAddOpen(false) });
  };

  const handleUpdate = (data: CustomerInput) => {
    if (!editCustomer) return;
    updateCustomer.mutate(
      { id: editCustomer.id, data },
      { onSuccess: () => setEditCustomer(null) }
    );
  };

  const statusCount = (key: string) =>
    (fetchedCustomers ?? []).filter((c) => c.status === key).length;

  // تایل‌های وضعیت — شمارنده‌ها از کل نتیجه‌ی جستجو، نه لیست فیلترشده
  const statusTiles = [
    {
      key: "",
      label: "همه",
      icon: Users,
      count: (fetchedCustomers ?? []).length,
      iconCls: "bg-teal-100 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300",
    },
    ...Object.entries(CUSTOMER_STATUS).map(([key, v]) => ({
      key,
      label: v.label,
      icon:
        key === "lead" ? Sparkles : key === "active" ? UserCheck : key === "vip" ? Star : UserX,
      count: statusCount(key),
      iconCls: v.className,
    })),
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-bold">
            <Crown className="h-6 w-6 text-amber-500" />
            باشگاه مشتریان
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {canManage
              ? "مدیریت اعضای باشگاه — ثبت دستی یا ورود گروهی از فایل اکسل (فقط مدیر شرکت و مدیر بخش)"
              : "حالت نمایش — اعضای باشگاه را مرور کنید"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {canManage && (
            <Button
              variant="outline"
              onClick={() => setImportOpen(true)}
              className="gap-2 border-teal-600/30 text-teal-700 hover:bg-teal-500/10 dark:text-teal-300"
            >
              <FileUp className="h-4 w-4" />
              ورود از اکسل
            </Button>
          )}
          <Button
            variant="outline"
            onClick={handleExport}
            disabled={exporting}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            {exporting ? "در حال آماده‌سازی..." : "خروجی اکسل"}
          </Button>
          {canManage && (
            <Button
              onClick={() => setAddOpen(true)}
              className="gap-2 bg-gradient-to-l from-teal-600 to-emerald-600 text-white"
            >
              <UserPlus className="h-4 w-4" />
              عضو جدید
            </Button>
          )}
        </div>
      </div>

      {/* Status tiles — چیدمان یکنواخت با مارجین استاندارد */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5 [&>button:last-child]:col-span-2 lg:[&>button:last-child]:col-span-1">
        {statusTiles.map((t) => {
          const Icon = t.icon;
          const active = status === t.key;
          return (
            <button
              key={t.key || "all"}
              type="button"
              onClick={() => setStatus(t.key)}
              className={cn(
                "group flex items-center gap-3 rounded-xl border bg-card p-3 text-right shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md",
                active
                  ? "border-teal-500/60 ring-2 ring-teal-500/25"
                  : "hover:border-teal-500/30"
              )}
            >
              <span
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-transform group-hover:scale-105",
                  t.iconCls
                )}
              >
                <Icon className="h-5 w-5" />
              </span>
              <span className="min-w-0">
                <span className="block text-lg font-bold leading-none tabular-nums">
                  {isLoading ? "…" : toFaDigits(t.count)}
                </span>
                <span className="mt-1 block truncate text-xs text-muted-foreground">
                  {t.label}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative w-full sm:max-w-xs">
        <Input
          placeholder="جستجو با شماره تلفن، نام یا شرکت..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="pr-9"
        />
        <svg
          className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
      </div>

      {/* Table (desktop) */}
      {isLoading ? (
        <Card>
          <CardContent className="p-4 space-y-3">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </CardContent>
        </Card>
      ) : (customers ?? []).length === 0 ? (
        <EmptyState
          title="مشتری‌ای پیدا نشد"
          description="با تغییر فیلترها جستجو کنید یا اولین مشتری را ثبت کنید."
          action={
            canManage ? (
              <Button onClick={() => setAddOpen(true)} className="gap-2 bg-teal-600 hover:bg-teal-700">
                <UserPlus className="h-4 w-4" />
                ثبت مشتری جدید
              </Button>
            ) : undefined
          }
        />
      ) : (
        <>
          <Card className="crm-fade-up hidden overflow-hidden py-0 md:block">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead className="w-[36%] min-w-52">مشتری</TableHead>
                    <TableHead className="w-[28%]">شماره تلفن</TableHead>
                    <TableHead className="w-[13%] whitespace-nowrap">وضعیت</TableHead>
                    <TableHead className="w-[15%] whitespace-nowrap">عضویت</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(customers ?? []).map((c) => {
                    const st = CUSTOMER_STATUS[c.status as CustomerStatus];
                    return (
                      <TableRow
                        key={c.id}
                        className="cursor-pointer"
                        onClick={() => setDetailId(c.id)}
                      >
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <span
                              className={cn(
                                "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xs font-bold text-white",
                                avatarColor(c.id)
                              )}
                            >
                              {getInitials(c.name)}
                            </span>
                            <div className="min-w-0">
                              <p className="truncate font-semibold">{c.name}</p>
                              <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                                <Building2 className="h-3 w-3" />
                                {c.company || "—"}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {c.phone ? (
                              <p
                                className="flex items-center gap-1.5 font-semibold"
                                title="شماره تلفن — شناسه‌ی جستجو"
                              >
                                <Phone className="h-3.5 w-3.5 shrink-0 text-teal-600 dark:text-teal-400" />
                                <span className="font-mono text-[13px]" dir="ltr">{toFaDigits(c.phone)}</span>
                              </p>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                            {c.email && (
                              <p className="flex items-center gap-1.5 truncate text-[11px] text-muted-foreground">
                                <Mail className="h-3 w-3 shrink-0" />
                                <span dir="ltr" className="truncate">{c.email}</span>
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {st && (
                            <Badge variant="outline" className={st.className}>
                              {st.label}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                          {timeAgo(c.createdAt)}
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" aria-label="عملیات">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start">
                              <DropdownMenuItem onClick={() => setDetailId(c.id)}>
                                <Eye className="h-4 w-4" />
                                مشاهده جزئیات
                              </DropdownMenuItem>
                              {canManage && (
                                <DropdownMenuItem onClick={() => setEditCustomer(c)}>
                                  <Pencil className="h-4 w-4" />
                                  ویرایش
                                </DropdownMenuItem>
                              )}
                              {canDeleteCustomer && (
                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive"
                                  onClick={() => setDeleteTarget(c)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                  حذف
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </Card>

          {/* Cards (mobile) — جای جدولی که در عرض کم می‌شکست */}
          <div className="space-y-3 md:hidden">
            {(customers ?? []).map((c) => {
              const st = CUSTOMER_STATUS[c.status as CustomerStatus];
              return (
                <Card
                  key={c.id}
                  className="crm-fade-up cursor-pointer py-0 transition-shadow hover:shadow-md"
                  onClick={() => setDetailId(c.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <span
                        className={cn(
                          "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xs font-bold text-white",
                          avatarColor(c.id)
                        )}
                      >
                        {getInitials(c.name)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate font-semibold">{c.name}</p>
                          {st && (
                            <Badge variant="outline" className={cn("shrink-0", st.className)}>
                              {st.label}
                            </Badge>
                          )}
                        </div>
                        {c.company && (
                          <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted-foreground">
                            <Building2 className="h-3 w-3" />
                            {c.company}
                          </p>
                        )}
                        <div className="mt-2 space-y-1">
                          {c.phone ? (
                            <p className="flex items-center gap-1.5 font-semibold" title="شماره تلفن — شناسه‌ی جستجو">
                              <Phone className="h-3.5 w-3.5 shrink-0 text-teal-600 dark:text-teal-400" />
                              <span className="font-mono text-[13px]" dir="ltr">{toFaDigits(c.phone)}</span>
                            </p>
                          ) : (
                            <p className="text-xs text-muted-foreground">بدون شماره تلفن</p>
                          )}
                          {c.email && (
                            <p className="flex items-center gap-1.5 truncate text-[11px] text-muted-foreground">
                              <Mail className="h-3 w-3 shrink-0" />
                              <span dir="ltr" className="truncate">{c.email}</span>
                            </p>
                          )}
                        </div>
                        <div className="mt-2.5 flex items-center justify-between border-t pt-2">
                          <span className="text-xs text-muted-foreground">
                            عضویت: {timeAgo(c.createdAt)}
                          </span>
                          <span onClick={(e) => e.stopPropagation()}>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" aria-label="عملیات">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="start">
                                <DropdownMenuItem onClick={() => setDetailId(c.id)}>
                                  <Eye className="h-4 w-4" />
                                  مشاهده جزئیات
                                </DropdownMenuItem>
                                {canManage && (
                                  <DropdownMenuItem onClick={() => setEditCustomer(c)}>
                                    <Pencil className="h-4 w-4" />
                                    ویرایش
                                  </DropdownMenuItem>
                                )}
                                {canDeleteCustomer && (
                                  <DropdownMenuItem
                                    className="text-destructive focus:text-destructive"
                                    onClick={() => setDeleteTarget(c)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                    حذف
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}

      {/* Add dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>ثبت مشتری جدید</DialogTitle>
            <DialogDescription>
              اطلاعات مشتری را وارد کنید؛ می‌توانید بعداً کاملش کنید.
            </DialogDescription>
          </DialogHeader>
          <CustomerFormFields
            onSubmit={handleCreate}
            onCancel={() => setAddOpen(false)}
            submitting={createCustomer.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={!!editCustomer} onOpenChange={(o) => !o && setEditCustomer(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>ویرایش مشتری</DialogTitle>
            <DialogDescription>تغییرات را ذخیره کنید.</DialogDescription>
          </DialogHeader>
          {editCustomer && (
            <CustomerFormFields
              initial={{
                name: editCustomer.name,
                company: editCustomer.company ?? "",
                email: editCustomer.email ?? "",
                phone: editCustomer.phone ?? "",
                status: editCustomer.status,
                source: editCustomer.source,
                address: editCustomer.address ?? "",
                notes: editCustomer.notes ?? "",
              }}
              onSubmit={handleUpdate}
              onCancel={() => setEditCustomer(null)}
              submitLabel="ذخیره تغییرات"
              submitting={updateCustomer.isPending}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف مشتری</AlertDialogTitle>
            <AlertDialogDescription>
              آیا از حذف «{deleteTarget?.name}» مطمئن هستید؟ وظایف و تماس‌های مرتبط
              حفظ می‌شوند اما ارتباطشان قطع می‌شود.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel>انصراف</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={() => {
                if (deleteTarget) deleteCustomer.mutate(deleteTarget.id);
                setDeleteTarget(null);
              }}
            >
              حذف کن
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Detail sheet */}
      <CustomerDetailSheet
        customerId={detailId}
        onOpenChange={(o) => !o && setDetailId(null)}
      />

      {/* Excel import */}
      <ImportDialog open={importOpen} onOpenChange={setImportOpen} />
    </div>
  );
}
