"use client";

import { BlockedSlot } from "@/types/reservation";
import { cn } from "@/lib/utils";
import { Clock, Lock, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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
    <div className="group relative flex flex-col md:flex-row md:items-center gap-6 p-6 rounded-4xl border transition-all duration-300 bg-zinc-50/50 dark:bg-zinc-900/50 border-zinc-200/50 dark:border-zinc-800/50 border-dashed">
      {/* Time Column */}
      <div className="flex flex-row md:flex-col items-center md:items-start gap-3 md:w-32 shrink-0">
        <div className="flex items-center gap-2 text-primary">
          <Clock className="w-4 h-4" strokeWidth={2.5} />
          <span className="font-black text-sm tracking-tight">
            {startTime.toLocaleTimeString("bg-BG", { hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>
        <div className="h-px w-4 bg-zinc-200 dark:bg-zinc-800 md:hidden" />
        <span className="text-zinc-400 font-bold text-[10px] uppercase tracking-widest">
          до {endTime.toLocaleTimeString("bg-BG", { hour: "2-digit", minute: "2-digit" })}
        </span>
      </div>

      {/* Content Column */}
      <div className="flex-1 flex flex-col md:flex-row md:items-center gap-6">
        {/* Court Badge */}
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-center justify-center min-w-12 min-h-12 py-2 px-3 rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-lg shadow-black/10 max-w-[200px] text-center">
            <span className="text-[8px] font-black uppercase tracking-tighter opacity-50 mb-0.5">
              {effectiveBranch === "bkgalabovo" ? "Корт" : "Услуга"}
            </span>
            <span
              className={cn(
                "font-bold leading-tight",
                effectiveBranch === "bkgalabovo" ? "text-sm whitespace-nowrap" : "text-[11px]"
              )}
            >
              {slot.courtIds.length > 0 ? `Корт ${slot.courtIds.join(", ")}` : "Всички кортове"}
            </span>
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-zinc-400" />
              <h4 className="font-bold text-zinc-900 dark:text-white group-hover:text-primary transition-colors">
                {slot.title}
              </h4>
            </div>
          </div>
        </div>

        {/* Status */}
        <div className="md:ml-auto flex items-center gap-6">
          <div className="px-4 py-2 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
            Блокиран период
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 pt-4 md:pt-0 border-t md:border-t-0 border-zinc-100 dark:border-zinc-900">
        <BlockSlotDialog slot={slot} courtCount={courtCount} onSave={() => {}}>
          <Button
            variant="ghost"
            size="icon"
            className="h-11 w-11 rounded-2xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
          >
            <Pencil className="w-4 h-4 text-zinc-400" />
          </Button>
        </BlockSlotDialog>
        
        <Button
          variant="ghost"
          size="icon"
          className="h-11 w-11 rounded-2xl hover:bg-rose-50 dark:hover:bg-rose-950/20 hover:text-rose-600 transition-all"
          onClick={() => onDelete(slot.id)}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
