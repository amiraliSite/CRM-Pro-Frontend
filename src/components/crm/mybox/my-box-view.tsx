"use client";

import * as React from "react";
import {
  StickyNote,
  Plus,
  Pin,
  PinOff,
  Pencil,
  Trash2,
  Search,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
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
import { EmptyState } from "@/components/crm/shared/empty-state";
import {
  useNotes,
  useCreateNote,
  useUpdateNote,
  useDeleteNote,
  type NoteInput,
} from "@/hooks/use-crm-data";
import type { PersonalNote } from "@/lib/crm/types";
import { formatFaDateTime } from "@/lib/crm/utils";
import { cn } from "@/lib/utils";

/* ---------------- Note color themes ---------------- */

const NOTE_COLORS: {
  key: string;
  label: string;
  swatch: string;
  card: string;
  pin: string;
}[] = [
  {
    key: "teal",
    label: "سبز آبی",
    swatch: "bg-teal-500",
    card: "border-teal-300/60 bg-teal-50 dark:border-teal-500/30 dark:bg-teal-500/10",
    pin: "text-teal-600 dark:text-teal-300",
  },
  {
    key: "amber",
    label: "کهربایی",
    swatch: "bg-amber-500",
    card: "border-amber-300/60 bg-amber-50 dark:border-amber-500/30 dark:bg-amber-500/10",
    pin: "text-amber-600 dark:text-amber-300",
  },
  {
    key: "violet",
    label: "بنفش",
    swatch: "bg-violet-500",
    card: "border-violet-300/60 bg-violet-50 dark:border-violet-500/30 dark:bg-violet-500/10",
    pin: "text-violet-600 dark:text-violet-300",
  },
  {
    key: "rose",
    label: "صورتی",
    swatch: "bg-rose-500",
    card: "border-rose-300/60 bg-rose-50 dark:border-rose-500/30 dark:bg-rose-500/10",
    pin: "text-rose-600 dark:text-rose-300",
  },
  {
    key: "sky",
    label: "آبی",
    swatch: "bg-sky-500",
    card: "border-sky-300/60 bg-sky-50 dark:border-sky-500/30 dark:bg-sky-500/10",
    pin: "text-sky-600 dark:text-sky-300",
  },
];

function colorTheme(color: string) {
  return NOTE_COLORS.find((c) => c.key === color) ?? NOTE_COLORS[0];
}

/* ---------------- Note dialog (add / edit) ---------------- */

type NoteFormState = {
  id?: string;
  title: string;
  content: string;
  color: string;
  pinned: boolean;
};

const EMPTY_FORM: NoteFormState = {
  title: "",
  content: "",
  color: "teal",
  pinned: false,
};

function NoteDialog({
  open,
  onOpenChange,
  form,
  onSave,
  saving,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  form: NoteFormState;
  onSave: (data: NoteInput & { id?: string }) => void;
  saving: boolean;
}) {
  const [state, setState] = React.useState<NoteFormState>(form);

  // Re-sync when the dialog opens with a different note
  React.useEffect(() => {
    if (open) setState(form);
  }, [open, form]);

  const isEdit = !!state.id;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <StickyNote className="h-5 w-5 text-teal-500" />
            {isEdit ? "ویرایش یادداشت" : "یادداشت جدید"}
          </DialogTitle>
          <DialogDescription>
            این یادداشت فقط در باکس شخصی خودت دیده می‌شود.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <div className="space-y-2">
            <Label htmlFor="note-title">عنوان</Label>
            <Input
              id="note-title"
              placeholder="مثلاً: یادآوری تماس با مشتری"
              value={state.title}
              onChange={(e) => setState((s) => ({ ...s, title: e.target.value }))}
              maxLength={120}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="note-content">متن یادداشت</Label>
            <Textarea
              id="note-content"
              placeholder="هر چیزی که می‌خوای یادت نره بنویس..."
              rows={5}
              value={state.content}
              onChange={(e) => setState((s) => ({ ...s, content: e.target.value }))}
              maxLength={4000}
              className="resize-none"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Label className="text-sm text-muted-foreground">رنگ:</Label>
              {NOTE_COLORS.map((c) => (
                <button
                  key={c.key}
                  type="button"
                  title={c.label}
                  aria-label={c.label}
                  onClick={() => setState((s) => ({ ...s, color: c.key }))}
                  className={cn(
                    "h-7 w-7 rounded-full transition-transform",
                    c.swatch,
                    state.color === c.key
                      ? "scale-110 ring-2 ring-offset-2 ring-foreground/40 ring-offset-background"
                      : "opacity-70 hover:opacity-100"
                  )}
                />
              ))}
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="note-pinned"
                checked={state.pinned}
                onCheckedChange={(v) => setState((s) => ({ ...s, pinned: v }))}
              />
              <Label htmlFor="note-pinned" className="text-sm">
                سنجاق به بالا
              </Label>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            انصراف
          </Button>
          <Button
            onClick={() => {
              if (!state.title.trim()) return;
              onSave({
                id: state.id,
                title: state.title.trim(),
                content: state.content.trim(),
                color: state.color,
                pinned: state.pinned,
              });
            }}
            disabled={saving || !state.title.trim()}
            className="bg-gradient-to-l from-teal-500 to-emerald-600 text-white shadow-md shadow-teal-500/25 hover:opacity-90"
          >
            {isEdit ? "ذخیره تغییرات" : "ثبت یادداشت"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ---------------- Main view ---------------- */

export function MyBoxView() {
  const { data: notes, isLoading } = useNotes();
  const createNote = useCreateNote();
  const updateNote = useUpdateNote();
  const deleteNote = useDeleteNote();

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [dialogForm, setDialogForm] = React.useState<NoteFormState>(EMPTY_FORM);
  const [deleteId, setDeleteId] = React.useState<string | null>(null);
  const [q, setQ] = React.useState("");

  const openAdd = () => {
    setDialogForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (note: PersonalNote) => {
    setDialogForm({
      id: note.id,
      title: note.title,
      content: note.content ?? "",
      color: note.color,
      pinned: note.pinned,
    });
    setDialogOpen(true);
  };

  const handleSave = (data: NoteInput & { id?: string }) => {
    const { id, ...payload } = data;
    if (id) {
      updateNote.mutate(
        { id, data: payload },
        { onSuccess: () => setDialogOpen(false) }
      );
    } else {
      createNote.mutate(payload, { onSuccess: () => setDialogOpen(false) });
    }
  };

  const togglePin = (note: PersonalNote) => {
    updateNote.mutate({ id: note.id, data: { pinned: !note.pinned } });
  };

  const filtered = (notes ?? []).filter((n) => {
    if (!q.trim()) return true;
    const needle = q.trim().toLowerCase();
    return (
      n.title.toLowerCase().includes(needle) ||
      (n.content ?? "").toLowerCase().includes(needle)
    );
  });

  const pinnedCount = (notes ?? []).filter((n) => n.pinned).length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-teal-400 to-emerald-600 text-white shadow-md shadow-teal-500/25">
              <StickyNote className="h-5 w-5" />
            </span>
            باکس شخصی
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            یادداشت‌های خصوصی خودت — فقط خودت این‌ها را می‌بینی.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="جستجو در یادداشت‌ها..."
              className="w-44 pr-9 sm:w-56"
            />
          </div>
          <Button
            onClick={openAdd}
            className="bg-gradient-to-l from-teal-500 to-emerald-600 text-white shadow-md shadow-teal-500/25 hover:opacity-90"
          >
            <Plus className="ml-1 h-4 w-4" />
            یادداشت جدید
          </Button>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-2xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={StickyNote}
          title={q ? "یادداشتی پیدا نشد" : "باکس شخصی‌ات خالیه"}
          description={
            q
              ? "عبارت دیگری را جستجو کن."
              : "اولین یادداشت خصوصی‌ات را بساز — لیست کارها، ایده‌ها یا هر چیزی که باید یادت بمونه."
          }
          action={
            <Button
              onClick={openAdd}
              className="bg-gradient-to-l from-teal-500 to-emerald-600 text-white shadow-md shadow-teal-500/25 hover:opacity-90"
            >
              <Plus className="ml-1 h-4 w-4" />
              یادداشت جدید
            </Button>
          }
        />
      ) : (
        <>
          {pinnedCount > 0 && (
            <p className="text-xs text-muted-foreground">
              {pinnedCount} یادداشت سنجاق‌شده در بالای باکس.
            </p>
          )}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((note) => {
              const theme = colorTheme(note.color);
              return (
                <Card
                  key={note.id}
                  className={cn(
                    "group relative border-2 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg crm-fade-up",
                    theme.card
                  )}
                >
                  <CardContent className="flex h-full flex-col gap-2 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm font-bold leading-6 line-clamp-2">
                        {note.title}
                      </h3>
                      <button
                        onClick={() => togglePin(note)}
                        title={note.pinned ? "برداشتن سنجاق" : "سنجاق به بالا"}
                        className={cn(
                          "shrink-0 rounded-lg p-1 transition-colors hover:bg-black/5 dark:hover:bg-white/10",
                          note.pinned ? theme.pin : "text-muted-foreground/50"
                        )}
                      >
                        {note.pinned ? (
                          <Pin className="h-4 w-4 fill-current" />
                        ) : (
                          <PinOff className="h-4 w-4" />
                        )}
                      </button>
                    </div>

                    {note.content && (
                      <p className="flex-1 whitespace-pre-wrap text-xs leading-6 text-foreground/80 line-clamp-6">
                        {note.content}
                      </p>
                    )}

                    <div className="mt-auto flex items-center justify-between gap-2 pt-2">
                      <span className="text-[10px] text-muted-foreground">
                        {formatFaDateTime(note.updatedAt)}
                      </span>
                      <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                        <button
                          onClick={() => openEdit(note)}
                          title="ویرایش"
                          className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-black/5 hover:text-foreground dark:hover:bg-white/10"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteId(note.id)}
                          title="حذف"
                          className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-400"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}

      {/* Add / Edit dialog */}
      <NoteDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        form={dialogForm}
        onSave={handleSave}
        saving={createNote.isPending || updateNote.isPending}
      />

      {/* Delete confirm */}
      <AlertDialog open={!!deleteId} onOpenChange={(v) => !v && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف یادداشت؟</AlertDialogTitle>
            <AlertDialogDescription>
              این یادداشت برای همیشه از باکس شخصی‌ات پاک می‌شود و قابل بازگشت نیست.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>انصراف</AlertDialogCancel>
            <AlertDialogAction
              className="bg-rose-600 text-white hover:bg-rose-700"
              onClick={() => {
                if (deleteId) deleteNote.mutate(deleteId);
                setDeleteId(null);
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
