"use client";

import * as React from "react";
import { CalendarClock, FileUp, LogIn, LogOut, Clock, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
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
import { useAttendance, useDeleteAttendance } from "@/hooks/use-crm-data";
import { roleLabel, type AttendanceRow } from "@/lib/crm/types";
import { useCrmStore } from "@/lib/crm/store";
import { avatarColor, formatFaDateTime, getInitials } from "@/lib/crm/utils";
import { cn } from "@/lib/utils";
import { ImportAttendanceDialog } from "./import-attendance-dialog";

function durationFa(from: string, to?: string | null): string {
  if (!to) return "در حال کار";
  const mins = Math.max(0, Math.round((new Date(to).getTime() - new Date(from).getTime()) / 60000));
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h} ساعت و ${m} دقیقه` : `${m} دقیقه`;
}

export function AttendanceView() {
  const { user: me } = useCrmStore();
  const isLeader = me ? ["admin", "manager"].includes(me.role) : false;
  const { data: rows, isLoading } = useAttendance();

  const myOpen = (rows ?? []).find((r) => r.userId === me?.id && !r.checkOut);
  const visible = (rows ?? []).filter((r) => isLeader || r.userId === me?.id);

  const [importOpen, setImportOpen] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<AttendanceRow | null>(null);
  const deleteAttendance = useDeleteAttendance();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-bold">
            <CalendarClock className="h-5 w-5 text-teal-500" />
            حضور و غیاب
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            ورود و خروج هر کارمند{isLeader ? " — ثبت ورود و خروج‌ها با فایل اکسل" : ""}
          </p>
        </div>
        {isLeader && (
          <Button
            onClick={() => setImportOpen(true)}
            className="gap-2 bg-teal-600 hover:bg-teal-700"
          >
            <FileUp className="h-4 w-4" />
            ورودی اکسل
          </Button>
        )}
      </div>

      <ImportAttendanceDialog open={importOpen} onOpenChange={setImportOpen} />

      {/* Current open session */}
      {myOpen && (
        <Card className="border-teal-500/40 bg-teal-500/5 py-0">
          <CardContent className="flex flex-wrap items-center gap-3 p-4">
            <span className="relative flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-400 opacity-60" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-teal-500" />
            </span>
            <p className="text-sm font-medium">
              نشست فعال — از {formatFaDateTime(myOpen.checkIn)} وارد هستی
            </p>
            <Badge variant="outline" className="border-teal-500/40 bg-teal-500/10 text-teal-700 dark:text-teal-300">
              <Clock className="ml-1 h-3 w-3" />
              {durationFa(myOpen.checkIn, new Date().toISOString())}
            </Badge>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        [...Array(4)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)
      ) : visible.length === 0 ? (
        <EmptyState
          icon={LogIn}
          title="هنوز سابقه‌ای نیست"
          description="با هر بار ورود به حساب، یک رکورد ورود اینجا ثبت می‌شود و با خروج کامل می‌گردد."
        />
      ) : (
        <Card className="py-0">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  {isLeader && <TableHead className="text-right">کارمند</TableHead>}
                  <TableHead className="text-right">ورود</TableHead>
                  <TableHead className="text-right">خروج</TableHead>
                  <TableHead className="text-right">مدت حضور</TableHead>
                  {isLeader && <TableHead className="w-10" aria-label="حذف" />}
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.map((r: AttendanceRow) => (
                  <TableRow key={r.id}>
                    {isLeader && (
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              "flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold text-white",
                              avatarColor(r.userId)
                            )}
                          >
                            {getInitials(r.user?.fullName ?? "?")}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-xs font-medium">{r.user?.fullName}</p>
                            <p className="text-[10px] text-muted-foreground">{roleLabel(r.user?.role)}</p>
                          </div>
                        </div>
                      </TableCell>
                    )}
                    <TableCell className="text-xs">
                      <span className="flex items-center gap-1 text-teal-600 dark:text-teal-400">
                        <LogIn className="h-3 w-3" />
                        {formatFaDateTime(r.checkIn)}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs">
                      {r.checkOut ? (
                        <span className="flex items-center gap-1 text-rose-500">
                          <LogOut className="h-3 w-3" />
                          {formatFaDateTime(r.checkOut)}
                        </span>
                      ) : (
                        <Badge className="border-0 bg-teal-500/15 text-[10px] text-teal-700 dark:text-teal-300">
                          در حال کار
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {r.checkOut ? durationFa(r.checkIn, r.checkOut) : "—"}
                    </TableCell>
                    {isLeader && (
                      <TableCell className="w-10">
                        {/* حذف رکورد غلط (مثلاً بعد از ایمپورت اشتباه) — تسک ۴۵ */}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-rose-600"
                          onClick={() => setDeleteTarget(r)}
                          aria-label="حذف رکورد"
                          title="حذف رکورد"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* تأیید حذف رکورد حضور و غیاب — تسک ۴۵ */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف رکورد حضور و غیاب؟</AlertDialogTitle>
            <AlertDialogDescription>
              رکورد «{deleteTarget?.user?.fullName ?? "—"}» از{" "}
              {deleteTarget ? formatFaDateTime(deleteTarget.checkIn) : ""} حذف می‌شود —
              اگر خروجی نداشته باشد، نشستِ فعال او هم بسته می‌شود. این کار برگشت‌پذیر نیست.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel>انصراف</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={() => {
                if (deleteTarget) deleteAttendance.mutate(deleteTarget.id);
                setDeleteTarget(null);
              }}
            >
              حذف کن
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
