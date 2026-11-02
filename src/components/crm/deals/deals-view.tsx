"use client";

import * as React from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { Plus, MoreHorizontal, Trash2, Pencil, GripVertical } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { DealFormFields } from "@/components/crm/deals/deal-form-fields";
import {
  useDeals,
  useUpdateDeal,
  useCreateDeal,
  useDeleteDeal,
} from "@/hooks/use-crm-data";
import { DEAL_STAGES, type Deal, type DealStage } from "@/lib/crm/types";
import { formatFaDate, formatShortToman, toFaDigits } from "@/lib/crm/utils";
import { useCrmStore, usePermissions } from "@/lib/crm/store";
import { cn } from "@/lib/utils";

/* Rendered left→right inside an LTR scroll container so that the funnel
   reads right→left (جدید on the far right) while dnd-kit stays in LTR
   coordinate space. */
const REVERSED_STAGES = [...DEAL_STAGES].reverse();

/* ---------- Deal Card ---------- */

function DealCard({
  deal,
  onDragStart,
  overlay,
  onEdit,
  onDelete,
  canWrite = true,
}: {
  deal: Deal;
  onDragStart?: () => void;
  overlay?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  canWrite?: boolean;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: deal.id,
    data: { deal },
    disabled: !canWrite,
  });

  const stage = DEAL_STAGES.find((s) => s.key === deal.stage);

  return (
    <div
      ref={overlay ? undefined : setNodeRef}
      {...(overlay || !canWrite ? {} : attributes)}
      {...(overlay || !canWrite ? {} : listeners)}
      className={cn(
        "group relative rounded-xl border bg-card p-3 shadow-sm transition-all",
        !overlay && canWrite && "cursor-grab active:cursor-grabbing hover:shadow-md",
        !overlay && !canWrite && "hover:shadow-md",
        isDragging && "kanban-card-dragging",
        overlay && "rotate-2 shadow-2xl ring-2 ring-teal-500/40"
      )}
      onClick={overlay ? undefined : undefined}
    >
      <div className="flex items-start gap-2">
        {canWrite && (
          <GripVertical className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/40" />
        )}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold leading-6">{deal.title}</p>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {deal.customer?.name || "بدون مشتری"}
          </p>
        </div>
        {!overlay && canWrite && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="rounded p-1 opacity-0 transition-opacity hover:bg-muted group-hover:opacity-100"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
                aria-label="عملیات معامله"
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit?.();
                }}
              >
                <Pencil className="h-4 w-4" />
                ویرایش
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete?.();
                }}
              >
                <Trash2 className="h-4 w-4" />
                حذف
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <div className="mt-2.5 flex items-center justify-between gap-2">
        <span className="text-xs font-bold text-teal-700 dark:text-teal-300">
          {formatShortToman(deal.value)}
        </span>
        <Badge
          variant="outline"
          className="text-[10px]"
          style={{ color: stage?.color, borderColor: `${stage?.color}55` }}
        >
          {toFaDigits(deal.probability)}٪
        </Badge>
      </div>

      {deal.expectedClose && (
        <p className="mt-1.5 text-[11px] text-muted-foreground">
          بستن: {formatFaDate(deal.expectedClose)}
        </p>
      )}
    </div>
  );
}

/* ---------- Column ---------- */

function KanbanColumn({
  stage,
  deals,
  onAdd,
  onEdit,
  onDelete,
  canWrite,
}: {
  stage: (typeof DEAL_STAGES)[number];
  deals: Deal[];
  onAdd: () => void;
  onEdit: (d: Deal) => void;
  onDelete: (d: Deal) => void;
  canWrite: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.key });
  const totalValue = deals.reduce((s, d) => s + d.value, 0);

  return (
    <div dir="rtl" className="flex w-[280px] shrink-0 flex-col rounded-2xl bg-muted/50 border">
      <div className="flex items-center justify-between px-3.5 pb-2 pt-3.5">
        <div className="flex items-center gap-2">
          <span
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: stage.color }}
          />
          <span className="text-sm font-bold">{stage.label}</span>
          <span className="rounded-full bg-background px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
            {toFaDigits(deals.length)}
          </span>
        </div>
        {canWrite && (
          <button
            onClick={onAdd}
            className="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
            aria-label={`افزودن معامله به ${stage.label}`}
          >
            <Plus className="h-4 w-4" />
          </button>
        )}
      </div>
      <p className="px-3.5 pb-2 text-[11px] text-muted-foreground">
        {formatShortToman(totalValue)}
      </p>

      <div className="h-[calc(100vh-320px)] min-h-40 overflow-y-auto">
        <div
          ref={setNodeRef}
          className={cn(
            "flex min-h-24 flex-col gap-2.5 px-3 pb-3 pt-1 transition-colors",
            isOver && "kanban-column-drop"
          )}
        >
          {deals.map((d) => (
            <DealCard
              key={d.id}
              deal={d}
              canWrite={canWrite}
              onEdit={() => onEdit(d)}
              onDelete={() => onDelete(d)}
            />
          ))}
          {deals.length === 0 && (
            <div className="flex h-20 items-center justify-center rounded-xl border border-dashed text-xs text-muted-foreground">
              {canWrite ? "معامله‌ای نیست — بکشید اینجا" : "معامله‌ای در این مرحله نیست"}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------- Main View ---------- */

export function DealsView() {
  const { canWriteBusiness: canWrite } = usePermissions();
  const { data: deals, isLoading } = useDeals();
  const updateDeal = useUpdateDeal();
  const createDeal = useCreateDeal();
  const deleteDeal = useDeleteDeal();

  const [activeDeal, setActiveDeal] = React.useState<Deal | null>(null);
  const [addStage, setAddStage] = React.useState<DealStage | null>(null);
  const [editDeal, setEditDeal] = React.useState<Deal | null>(null);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  // Kanban is LTR with reversed stages so the first funnel stage (جدید)
  // appears at the visual right (RTL reading order) and dnd-kit works
  // correctly. Auto-scroll to the right end on mount to show it.
  React.useEffect(() => {
    if (scrollRef.current && !isLoading) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
    }
  }, [isLoading]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  const byStage = React.useMemo(() => {
    const map = new Map<DealStage, Deal[]>();
    DEAL_STAGES.forEach((s) => map.set(s.key, []));
    (deals ?? []).forEach((d) => {
      const list = map.get(d.stage as DealStage);
      if (list) list.push(d);
      else map.set(d.stage as DealStage, [d]);
    });
    return map;
  }, [deals]);

  const handleDragStart = (e: DragStartEvent) => {
    setActiveDeal((e.active.data.current?.deal as Deal) ?? null);
  };

  const handleDragEnd = (e: DragEndEvent) => {
    setActiveDeal(null);
    const overId = e.over?.id as DealStage | undefined;
    const deal = e.active.data.current?.deal as Deal | undefined;
    if (!overId || !deal) return;
    if (deal.stage !== overId) {
      const probability =
        overId === "won" ? 100 : overId === "lost" ? 0 : deal.probability;
      updateDeal.mutate({
        id: deal.id,
        data: { stage: overId, probability },
      });
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">معاملات</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {canWrite
              ? "کانبان فروش — کارت‌ها را بین مراحل بکشید و رها کنید"
              : "حالت نمایش — پیشرفت معاملات را دنبال کنید"}
          </p>
        </div>
        {canWrite && (
          <Button
            onClick={() => setAddStage("new")}
            className="gap-2 bg-gradient-to-l from-teal-600 to-emerald-600 text-white"
          >
            <Plus className="h-4 w-4" />
            معامله جدید
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex gap-4 overflow-x-auto pb-2">
          {DEAL_STAGES.map((s) => (
            <div key={s.key} className="w-[280px] shrink-0 space-y-2.5 rounded-2xl bg-muted/50 p-3">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ))}
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div
            ref={scrollRef}
            dir="ltr"
            className="overflow-x-auto pb-2"
          >
            <div className="flex flex-row gap-4">
              {REVERSED_STAGES.map((stage) => (
                <KanbanColumn
                  key={stage.key}
                  stage={stage}
                  deals={byStage.get(stage.key) ?? []}
                  canWrite={canWrite}
                  onAdd={() => setAddStage(stage.key)}
                  onEdit={setEditDeal}
                  onDelete={(d) => deleteDeal.mutate(d.id)}
                />
              ))}
            </div>
          </div>

          <DragOverlay>
            {activeDeal && (
              <div className="w-[264px]">
                <DealCard deal={activeDeal} overlay />
              </div>
            )}
          </DragOverlay>
        </DndContext>
      )}

      {/* Add deal dialog */}
      <Dialog
        open={!!addStage}
        onOpenChange={(o) => !o && setAddStage(null)}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>معامله جدید</DialogTitle>
            <DialogDescription>
              در مرحله «{DEAL_STAGES.find((s) => s.key === addStage)?.label}» ثبت
              می‌شود.
            </DialogDescription>
          </DialogHeader>
          {addStage && (
            <DealFormFields
              fixedStage={addStage}
              onDone={() => setAddStage(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Edit deal dialog */}
      <Dialog open={!!editDeal} onOpenChange={(o) => !o && setEditDeal(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>ویرایش معامله</DialogTitle>
            <DialogDescription>تغییرات را ذخیره کنید.</DialogDescription>
          </DialogHeader>
          {editDeal && (
            <DealFormFields
              initial={{
                title: editDeal.title,
                value: editDeal.value,
                stage: editDeal.stage,
                probability: editDeal.probability,
                customerId: editDeal.customerId,
                expectedClose: editDeal.expectedClose
                  ? editDeal.expectedClose.slice(0, 10)
                  : null,
                notes: editDeal.notes ?? "",
              }}
              allowStageSelect
              submitting={updateDeal.isPending}
              onSubmitData={(data) => {
                updateDeal.mutate(
                  { id: editDeal.id, data },
                  { onSuccess: () => setEditDeal(null) }
                );
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
