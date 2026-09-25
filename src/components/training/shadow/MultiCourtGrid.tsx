/* eslint-disable sonarjs/no-nested-conditional */
"use client";

import { ArrowLeft, Maximize2 } from "lucide-react";
import React from "react";

import { Button } from "@/components/ui/button";
import { VisualPhase } from "@/hooks/shadow-trainer/types";
import { CourtSlot } from "@/hooks/shadow-trainer/types";
import { ZoneId } from "@/lib/shadow-training/audio-map";

import { CourtVisualizer } from "../CourtVisualizer";

interface MultiCourtGridProps {
  slots: CourtSlot[];
  activeZone?: ZoneId | null;
  visualPhase?: VisualPhase;
  previewZones?: ZoneId[];
  focusedCourtNumber?: number | null;
  onToggleFocus?: (courtNumber: number | null) => void;
  className?: string;
}

export function MultiCourtGrid({
  slots,
  activeZone,
  visualPhase = "idle",
  previewZones,
  focusedCourtNumber = null,
  onToggleFocus,
  className = "",
}: MultiCourtGridProps) {
  // If focused on a single court
  if (focusedCourtNumber !== null) {
    const slot =
      slots.find((s) => s.courtNumber === focusedCourtNumber) || slots[0];
    if (slot) {
      return (
        <div className={`w-full space-y-3 ${className}`}>
          <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onToggleFocus?.(null)}
              className="h-8 rounded-xl border-zinc-800 bg-zinc-900 text-xs font-bold text-zinc-300 hover:text-white"
            >
              <ArrowLeft size={14} className="mr-1.5" /> Всички {slots.length}{" "}
              корта
            </Button>
            <div className="flex items-center gap-2">
              <span className="flex size-6 items-center justify-center rounded-lg bg-blue-500/20 text-xs font-black text-blue-400 border border-blue-500/30">
                {slot.courtNumber}
              </span>
              <span className="text-xs font-black uppercase tracking-wider text-white">
                Корт {slot.courtNumber} (Детайлен изглед)
              </span>
            </div>
          </div>
          <div className="mx-auto w-full max-w-96">
            <CourtVisualizer
              activeZone={activeZone}
              visualPhase={visualPhase}
              previewZones={previewZones}
              courtNumber={slot.courtNumber}
              showCourtNumberBadge={false}
              playerBottom={slot.halfA}
              playerTop={slot.halfB}
              viewMode={slot.isFullCourt ? "full" : "half"}
              dualActive={slot.isFullCourt}
              allowToggleView
              className="w-full border-zinc-800/80 shadow-2xl"
            />
          </div>
        </div>
      );
    }
  }

  // Grid layout depending on number of courts
  const count = slots.length;
  let gridColsClass = "grid-cols-1";
  if (count === 2) {
    gridColsClass = "grid-cols-1 sm:grid-cols-2";
  } else if (count === 3) {
    gridColsClass = "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3";
  } else if (count >= 4) {
    gridColsClass = "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3";
  }

  return (
    <div className={`grid w-full gap-4 ${gridColsClass} ${className}`}>
      {slots.map((slot) => {
        const assignedCount = (slot.halfA ? 1 : 0) + (slot.halfB ? 1 : 0);

        return (
          <div
            key={slot.courtNumber}
            className="group relative flex flex-col rounded-2xl border border-zinc-800/90 bg-zinc-950/80 p-3 shadow-md transition-all duration-300 hover:border-zinc-700 hover:shadow-xl dark:border-zinc-800/80"
          >
            {/* Header: Court Number & Player count badge */}
            <div className="mb-2.5 flex items-center justify-between border-b border-zinc-800/80 pb-2">
              <div className="flex items-center gap-2">
                <span className="flex size-6 items-center justify-center rounded-lg bg-blue-500/15 text-xs font-black text-blue-400 border border-blue-500/30">
                  {slot.courtNumber}
                </span>
                <span className="text-xs font-black uppercase tracking-wider text-zinc-100">
                  Корт {slot.courtNumber}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold transition-colors ${
                    assignedCount === 2
                      ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                      : assignedCount === 1
                        ? "bg-blue-500/15 text-blue-300 border border-blue-500/30"
                        : "bg-zinc-800/80 text-zinc-400 border border-zinc-700/50"
                  }`}
                >
                  <span
                    className={`size-1.5 rounded-full ${
                      assignedCount > 0
                        ? "bg-emerald-400 animate-pulse"
                        : "bg-zinc-500"
                    }`}
                  />
                  {assignedCount === 2
                    ? "2 играчи (пълен корт)"
                    : assignedCount === 1
                      ? "1 играч (1/2 корт)"
                      : "Свободен"}
                </span>
                {onToggleFocus && (
                  <button
                    type="button"
                    onClick={() => onToggleFocus(slot.courtNumber)}
                    className="flex size-6 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
                    title={`Увеличи Корт ${slot.courtNumber}`}
                  >
                    <Maximize2 size={12} />
                  </button>
                )}
              </div>
            </div>

            {/* Court SVG */}
            <div className="flex flex-1 items-center justify-center">
              <CourtVisualizer
                activeZone={activeZone}
                visualPhase={visualPhase}
                previewZones={previewZones}
                courtNumber={slot.courtNumber}
                showCourtNumberBadge={false}
                playerBottom={slot.halfA}
                playerTop={slot.halfB}
                viewMode={slot.isFullCourt ? "full" : "half"}
                dualActive={slot.isFullCourt}
                className={`mx-auto w-auto border-zinc-800/60 shadow-inner ${
                  slot.isFullCourt
                    ? "max-h-[350px] aspect-710/1440"
                    : "max-h-65 aspect-710/770"
                }`}
              />
            </div>

            {/* Assigned Players Footer */}
            {assignedCount > 0 && (
              <div className="mt-2.5 flex flex-col gap-1 rounded-xl bg-zinc-900/60 p-2 text-xs border border-zinc-800/70">
                {slot.halfB && (
                  <div className="flex items-center justify-between text-blue-300">
                    <span className="text-[10px] font-black uppercase tracking-wider text-blue-400">
                      Поле 2 (Горе):
                    </span>
                    <span className="truncate font-semibold">
                      {slot.halfB.displayName ||
                        `${slot.halfB.firstName || ""} ${slot.halfB.lastName || ""}`.trim()}
                    </span>
                  </div>
                )}
                {slot.halfA && (
                  <div className="flex items-center justify-between text-emerald-300">
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400">
                      Поле 1 (Долу):
                    </span>
                    <span className="truncate font-semibold">
                      {slot.halfA.displayName ||
                        `${slot.halfA.firstName || ""} ${slot.halfA.lastName || ""}`.trim()}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
