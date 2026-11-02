"use client";

import * as React from "react";
import { UserPlus, Pencil, Trash2, ShieldCheck } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useUsers,
  useCreateUser,
  useUpdateUser,
  useDeleteUser,
  type CrmUser,
} from "@/hooks/use-crm-data";
import { useCrmStore } from "@/lib/crm/store";
import { ROLE_LABELS, ROLES, roleLabel } from "@/lib/crm/types";
import { toFaDigits } from "@/lib/crm/utils";
import { cn } from "@/lib/utils";

export function UsersView() {
  const { user: me } = useCrmStore();
  const { data: users, isLoading } = useUsers();
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();

  const [addOpen, setAddOpen] = React.useState(false);
  const [editUser, setEditUser] = React.useState<CrmUser | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<CrmUser | null>(null);

  // Add form state
  const [username, setUsername] = React.useState("");
  const [fullName, setFullName] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [role, setRole] = React.useState<string>("agent");

  // Edit form state
  const [editFullName, setEditFullName] = React.useState("");
  const [editRole, setEditRole] = React.useState<string>("agent");
  const [editActive, setEditActive] = React.useState(true);
  const [editPassword, setEditPassword] = React.useState("");

  const openAdd = () => {
    setUsername("");
    setFullName("");
    setPassword("");
    setRole("agent");
    setAddOpen(true);
  };

  const openEdit = (u: CrmUser) => {
    setEditUser(u);
    setEditFullName(u.fullName);
    setEditRole(u.role);
    setEditActive(u.active);
    setEditPassword("");
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createUser.mutate(
      { username, fullName, password, role },
      { onSuccess: () => setAddOpen(false) }
    );
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUser) return;
    updateUser.mutate(
      {
        id: editUser.id,
        data: {
          fullName: editFullName,
          role: editRole,
          active: editActive,
          ...(editPassword ? { password: editPassword } : {}),
        },
      },
      { onSuccess: () => setEditUser(null) }
    );
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteUser.mutate(deleteTarget.id, {
      onSettled: () => setDeleteTarget(null),
    });
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-black">مدیریت کاربران</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            ساخت حساب برای همکاران، تعیین نقش و مدیریت دسترسی‌ها
          </p>
        </div>
        <Button
          onClick={openAdd}
          className="gap-2 bg-gradient-to-l from-teal-600 to-emerald-600 text-white shadow-md shadow-teal-500/20"
        >
          <UserPlus className="h-4 w-4" />
          کاربر جدید
        </Button>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">کاربران سیستم</CardTitle>
          <CardDescription>
            {isLoading
              ? "در حال بارگذاری..."
              : `${toFaDigits(users?.length ?? 0)} کاربر ثبت شده است`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <>
            {/* جدول لپ‌تاپ و دسکتاپ */}
            <div className="hidden sm:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>کاربر</TableHead>
                  <TableHead>نام کاربری</TableHead>
                  <TableHead>نقش</TableHead>
                  <TableHead>وضعیت</TableHead>
                  <TableHead className="text-left">عملیات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(users ?? []).map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div
                          className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold text-white"
                          style={{ backgroundColor: u.color }}
                        >
                          {u.fullName.trim().charAt(0)}
                        </div>
                        <span className="font-medium">{u.fullName}</span>
                        {u.id === me?.id && (
                          <Badge variant="outline" className="text-[10px]">
                            شما
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    {/* dir=ltr برای یوزرنیم لاتین؛ text-right تا زیر هدر راست‌چینِ «نام کاربری» بنشیند (فیکس چینش) */}
                    <TableCell dir="ltr" className="text-right font-mono text-xs">
                      {u.username}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={cn(
                          "gap-1 border-0",
                          u.role === "admin"
                            ? "bg-violet-500/15 text-violet-700 dark:text-violet-300"
                            : u.role === "manager"
                              ? "bg-amber-500/15 text-amber-700 dark:text-amber-300"
                              : "bg-teal-500/15 text-teal-700 dark:text-teal-300"
                        )}
                      >
                        <ShieldCheck className="h-3 w-3" />
                        {roleLabel(u.role)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {u.active ? (
                        <Badge className="border-emerald-200 bg-emerald-100 text-emerald-700 dark:border-emerald-500/25 dark:bg-emerald-500/15 dark:text-emerald-300">
                          فعال
                        </Badge>
                      ) : (
                        <Badge variant="secondary">غیرفعال</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEdit(u)}
                          aria-label={`ویرایش ${u.fullName}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={u.id === me?.id}
                          onClick={() => setDeleteTarget(u)}
                          aria-label={`حذف ${u.fullName}`}
                          className="text-destructive disabled:opacity-30"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>

            {/* کارت‌های موبایل (تسک ۵۱) — جدول در موبایل ستون‌های وضعیت/عملیات را از دست می‌داد؛
                همه‌ی اطلاعات هر کاربر حالا در یک کادر جمع‌وجور سه‌بعدی است — بدون حذف هیچ متنی */}
            <ul className="space-y-2.5 sm:hidden">
              {(users ?? []).map((u) => (
                <li key={u.id}>
                  <Card className="gap-3 py-4">
                    <CardContent className="space-y-3 px-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                          style={{ backgroundColor: u.color }}
                        >
                          {u.fullName.trim().charAt(0)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-sm font-bold">{u.fullName}</span>
                            {u.id === me?.id && (
                              <Badge variant="outline" className="text-[10px]">
                                شما
                              </Badge>
                            )}
                          </div>
                          {/* dir=ltr برای یوزرنیم لاتین؛ text-right تا مثل جدول راست‌چین بجنبد */}
                          <div
                            dir="ltr"
                            className="text-right font-mono text-xs text-muted-foreground"
                          >
                            {u.username}
                          </div>
                        </div>
                        {u.active ? (
                          <Badge className="border-emerald-200 bg-emerald-100 text-emerald-700 dark:border-emerald-500/25 dark:bg-emerald-500/15 dark:text-emerald-300">
                            فعال
                          </Badge>
                        ) : (
                          <Badge variant="secondary">غیرفعال</Badge>
                        )}
                      </div>
                      <div className="flex items-center justify-between gap-2 border-t pt-2.5">
                        <Badge
                          className={cn(
                            "gap-1 border-0",
                            u.role === "admin"
                              ? "bg-violet-500/15 text-violet-700 dark:text-violet-300"
                              : u.role === "manager"
                                ? "bg-amber-500/15 text-amber-700 dark:text-amber-300"
                                : "bg-teal-500/15 text-teal-700 dark:text-teal-300"
                          )}
                        >
                          <ShieldCheck className="h-3 w-3" />
                          {roleLabel(u.role)}
                        </Badge>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEdit(u)}
                            aria-label={`ویرایش ${u.fullName}`}
                            className="h-8 w-8"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled={u.id === me?.id}
                            onClick={() => setDeleteTarget(u)}
                            aria-label={`حذف ${u.fullName}`}
                            className="h-8 w-8 text-destructive disabled:opacity-30"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </li>
              ))}
            </ul>
            </>
          )}
        </CardContent>
      </Card>

      {/* Add dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>کاربر جدید</DialogTitle>
            <DialogDescription>
              حساب کاربری برای همکار جدید بسازید
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="u-username">نام کاربری (انگلیسی)</Label>
              <Input
                id="u-username"
                dir="ltr"
                className="text-left font-mono"
                placeholder="ali.rezaei"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="u-fullname">نام کامل</Label>
              <Input
                id="u-fullname"
                placeholder="علی رضایی"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="u-password">رمز عبور (حداقل ۶ کاراکتر)</Label>
              <Input
                id="u-password"
                dir="ltr"
                className="text-left"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <div className="space-y-2">
              <Label>نقش</Label>
              <Select value={role} onValueChange={(v) => setRole(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => (
                    <SelectItem key={r} value={r}>
                      {ROLE_LABELS[r]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>
                انصراف
              </Button>
              <Button
                type="submit"
                disabled={createUser.isPending}
                className="bg-gradient-to-l from-teal-600 to-emerald-600 text-white"
              >
                {createUser.isPending ? "در حال ساخت..." : "ساخت کاربر"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={!!editUser} onOpenChange={(open) => !open && setEditUser(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>ویرایش کاربر</DialogTitle>
            <DialogDescription dir="ltr" className="text-right font-mono text-xs">
              {editUser?.username}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="e-fullname">نام کامل</Label>
              <Input
                id="e-fullname"
                value={editFullName}
                onChange={(e) => setEditFullName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>نقش</Label>
              <Select value={editRole} onValueChange={(v) => setEditRole(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => (
                    <SelectItem key={r} value={r}>
                      {ROLE_LABELS[r]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between rounded-xl border p-3">
              <Label htmlFor="e-active" className="cursor-pointer">
                حساب فعال باشد
              </Label>
              <Switch
                id="e-active"
                checked={editActive}
                onCheckedChange={setEditActive}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="e-password">رمز جدید (اختیاری)</Label>
              <Input
                id="e-password"
                dir="ltr"
                className="text-left"
                type="password"
                placeholder="برای عدم تغییر خالی بگذارید"
                value={editPassword}
                onChange={(e) => setEditPassword(e.target.value)}
                minLength={6}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditUser(null)}>
                انصراف
              </Button>
              <Button
                type="submit"
                disabled={updateUser.isPending}
                className="bg-gradient-to-l from-teal-600 to-emerald-600 text-white"
              >
                {updateUser.isPending ? "در حال ذخیره..." : "ذخیره تغییرات"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف کاربر</AlertDialogTitle>
            <AlertDialogDescription>
              آیا از حذف «{deleteTarget?.fullName}» مطمئن هستید؟ این عمل قابل بازگشت نیست.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>انصراف</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              حذف کاربر
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
