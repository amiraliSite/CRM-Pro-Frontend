"use client";

import * as React from "react";
import { User, KanbanSquare, CheckSquare, History } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CustomerFormFields } from "@/components/crm/customers/customer-form-fields";
import { DealFormFields } from "@/components/crm/deals/deal-form-fields";
import { TaskFormFields } from "@/components/crm/tasks/task-form-fields";
import { ActivityFormFields } from "@/components/crm/activities/activity-form-fields";
import type { CustomerInput } from "@/hooks/use-crm-data";
import { useCreateCustomer } from "@/hooks/use-crm-data";

interface QuickAddDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function QuickAddDialog({ open, onOpenChange }: QuickAddDialogProps) {
  const [tab, setTab] = React.useState("customer");
  const createCustomer = useCreateCustomer();

  const handleCustomerSubmit = (data: CustomerInput) => {
    createCustomer.mutate(data, {
      onSuccess: () => onOpenChange(false),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>ثبت سریع</DialogTitle>
          <DialogDescription>
            مشتری، معامله، وظیفه یا فعالیت جدید اضافه کنید.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={tab} onValueChange={setTab} className="mt-2">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="customer" className="gap-1.5">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">مشتری</span>
            </TabsTrigger>
            <TabsTrigger value="deal" className="gap-1.5">
              <KanbanSquare className="h-4 w-4" />
              <span className="hidden sm:inline">معامله</span>
            </TabsTrigger>
            <TabsTrigger value="task" className="gap-1.5">
              <CheckSquare className="h-4 w-4" />
              <span className="hidden sm:inline">وظیفه</span>
            </TabsTrigger>
            <TabsTrigger value="activity" className="gap-1.5">
              <History className="h-4 w-4" />
              <span className="hidden sm:inline">فعالیت</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="customer" className="mt-4">
            <CustomerFormFields onSubmit={handleCustomerSubmit} submitLabel="ثبت مشتری" />
          </TabsContent>
          <TabsContent value="deal" className="mt-4">
            <DealFormFields
              onDone={() => onOpenChange(false)}
              allowStageSelect
            />
          </TabsContent>
          <TabsContent value="task" className="mt-4">
            <TaskFormFields onDone={() => onOpenChange(false)} />
          </TabsContent>
          <TabsContent value="activity" className="mt-4">
            <ActivityFormFields onDone={() => onOpenChange(false)} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
