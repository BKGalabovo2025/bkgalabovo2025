"use client";

import { Loader2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { formatDateTimeDisplay } from "@/lib/date-utils";

/* eslint-disable @typescript-eslint/no-explicit-any */
interface GenericMovementsTabProps {
  loading: boolean;
  movements: any[];
  emptyMessage?: string;
  getEventLabel: (type: string) => string;
  getEventBadgeClass: (type: string) => string;
  renderDetails?: (move: any) => React.ReactNode;
}

export const GenericMovementsTab = ({
  loading,
  movements,
  emptyMessage = "Няма записани движения.",
  getEventLabel,
  getEventBadgeClass,
  renderDetails,
}: GenericMovementsTabProps) => {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 py-20">
        <Loader2 className="size-8 animate-spin text-amber-500 opacity-35" />
        <p className="text-xs font-light text-zinc-400">
          Зареждане на движения...
        </p>
      </div>
    );
  }

  if (movements.length === 0) {
    return (
      <div className="py-20 text-center text-xs font-light text-zinc-400">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {movements.map((move) => (
        <div
          key={move.id}
          className="space-y-2 rounded-2xl border border-zinc-100/50 bg-zinc-50 p-4 text-xs dark:border-zinc-900 dark:bg-zinc-900/30"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-zinc-400">
              {formatDateTimeDisplay(move.createdAt)}
            </span>
            <Badge
              className={`rounded border-none px-2 py-0.5 text-[9px] font-bold tracking-wider uppercase shadow-none ${getEventBadgeClass(
                move.type
              )}`}
            >
              {getEventLabel(move.type)}
            </Badge>
          </div>

          {renderDetails && renderDetails(move)}

          <div className="mt-1 text-right text-[10px] text-zinc-400/80">
            Оператор: {move.userName}
          </div>
        </div>
      ))}
    </div>
  );
};
