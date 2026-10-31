"use client";

import * as React from "react";
import { Search, User, Loader2, ArrowLeft } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { useCustomers } from "@/hooks/use-crm-data";
import { CUSTOMER_STATUS, type CustomerStatus } from "@/lib/crm/types";
import { useCrmStore } from "@/lib/crm/store";
import { avatarColor, getInitials } from "@/lib/crm/utils";
import { cn } from "@/lib/utils";

export function GlobalSearch() {
  const [open, setOpen] = React.useState(false);
  const [q, setQ] = React.useState("");
  const setView = useCrmStore((s) => s.setView);
  const debounced = useDebounce(q, 250);
  const { data: customers, isFetching } = useCustomers(
    debounced.length > 0 ? debounced : undefined
  );

  const results = (customers ?? []).slice(0, 6);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className="flex h-9 w-9 items-center justify-center rounded-xl border bg-muted/40 text-muted-foreground transition-colors hover:bg-muted sm:w-56 sm:justify-start sm:gap-2 sm:px-3"
          aria-label="جستجوی مشتریان"
        >
          <Search className="h-4 w-4 shrink-0" />
          <span className="hidden text-xs text-muted-foreground sm:inline">
            جستجوی مشتری...
          </span>
          <kbd className="mr-auto hidden rounded border bg-background px-1.5 py-0.5 text-[10px] text-muted-foreground md:inline">
            /
          </kbd>
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0" onOpenAutoFocus={(e) => e.preventDefault()}>
        <Command>
          <CommandInput
            placeholder="نام، شرکت، ایمیل یا شماره..."
            value={q}
            onValueChange={setQ}
          />
          <CommandList className="min-h-40">
            {isFetching && results.length === 0 ? (
              <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                در حال جستجو...
              </div>
            ) : results.length === 0 ? (
              <CommandEmpty>مشتری‌ای یافت نشد.</CommandEmpty>
            ) : (
              <CommandGroup heading="مشتریان">
                {results.map((c) => {
                  const st = CUSTOMER_STATUS[c.status as CustomerStatus];
                  return (
                    <CommandItem
                      key={c.id}
                      value={c.id}
                      onSelect={() => {
                        setOpen(false);
                        setView("customers");
                      }}
                      className="cursor-pointer"
                    >
                      <span
                        className={cn(
                          "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold text-white",
                          avatarColor(c.id)
                        )}
                      >
                        {getInitials(c.name)}
                      </span>
                      <div className="flex min-w-0 flex-1 flex-col">
                        <span className="truncate text-sm font-medium">{c.name}</span>
                        <span className="truncate text-xs text-muted-foreground">
                          {c.company || c.email || "—"}
                        </span>
                      </div>
                      {st && (
                        <Badge variant="outline" className="text-[10px]">
                          {st.label}
                        </Badge>
                      )}
                      <ArrowLeft className="h-3.5 w-3.5 text-muted-foreground" />
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = React.useState(value);
  React.useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export function CustomerIconFallback() {
  return <User className="h-4 w-4" />;
}
