"use client";

import { Clock, Lock, Pencil, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { BlockedSlot } from "@/types/reservation";

import { BlockSlotDialog } from "./block-slot-dialog";

interface AgendaBlockedItemProps {
  slot: BlockedSlot;
  effectiveBranch: string;
  courtCount: number;
  onDelete: (id: string) => void;
}

export function AgendaBlockedItem({
  slot,
  effectiveBranch,
  courtCount,
  onDelete,
}: AgendaBlockedItemProps) {
  const startTime = slot.startTime.toDate();
  const endTime = slot.endTime.toDate();

  return (
    <div className="group relative flex flex-col gap-6 rounded-4xl border border-dashed border-zinc-200/50 bg-zinc-50/50 p-6 transition-all duration-300 md:flex-row md:items-center dark:border-zinc-800/50 dark:bg-zinc-900/50">
      {/* Time Column */}
      <div className="flex shrink-0 flex-row items-center gap-3 md:w-32 md:flex-col md:items-start">
        <div className="flex items-center gap-2 text-primary">
          <Clock className="size-4" strokeWidth={2.5} />
          <span className="text-sm font-black tracking-tight">
            {startTime.toLocaleTimeString("bg-BG", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>
        <div className="h-px w-4 bg-zinc-200 md:hidden dark:bg-zinc-800" />
        <span className="text-[10px] font-bold tracking-widest text-zinc-400 uppercase">
          до{" "}
          {endTime.toLocaleTimeString("bg-BG", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>

      {/* Content Column */}
      <div className="flex flex-1 flex-col gap-6 md:flex-row md:items-center">
        {/* Court Badge */}
        <div className="flex items-center gap-3">
          <div className="flex min-h-12 max-w-50 min-w-12 flex-col items-center justify-center rounded-2xl bg-zinc-900 px-3 py-2 text-center text-white shadow-lg shadow-black/10 dark:bg-white dark:text-zinc-900">
            <span className="mb-0.5 text-[8px] font-black tracking-tighter uppercase opacity-50">
              {effectiveBranch === "bkgalabovo" ? "Корт" : "Услуга"}
            </span>
            <span
              className={cn(
                "leading-tight font-bold",
                effectiveBranch === "bkgalabovo"
                  ? "text-sm whitespace-nowrap"
                  : "text-[11px]"
              )}
            >
              {slot.courtIds.length > 0
                ? `Корт ${slot.courtIds.join(", ")}`
                : "Всички кортове"}
            </span>
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <Lock className="size-4 text-zinc-400" />
              <h4 className="font-bold text-zinc-900 transition-colors group-hover:text-primary dark:text-white">
                {slot.title}
              </h4>
            </div>
          </div>
        </div>

        {/* Status */}
        <div className="flex items-center gap-6 md:ml-auto">
          <div className="rounded-2xl bg-zinc-100 px-4 py-2 text-[10px] font-black tracking-[0.2em] text-zinc-500 uppercase dark:bg-zinc-800">
            Блокиран период
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 border-t border-zinc-100 pt-4 md:border-t-0 md:pt-0 dark:border-zinc-900">
        <BlockSlotDialog slot={slot} courtCount={courtCount} onSave={() => {}}>
          <Button
            variant="ghost"
            size="icon"
            className="size-11 rounded-2xl transition-all hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <Pencil className="size-4 text-zinc-400" />
          </Button>
        </BlockSlotDialog>

        <Button
          variant="ghost"
          size="icon"
          className="size-11 rounded-2xl transition-all hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/20"
          onClick={() => onDelete(slot.id)}
        >
          <Trash2 className="size-4" />
        </Button>
      </div>
    </div>
  );
}
