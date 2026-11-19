"use client";

import { ArrowLeft, Check, Link2, Maximize2 } from "lucide-react";
import React, { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { CourtSlot, VisualPhase } from "@/hooks/shadow-trainer/types";
import { ZoneId } from "@/lib/shadow-training/audio-map";

import { CourtVisualizer } from "../CourtVisualizer";

interface MultiCourtGridProps {
  slots: CourtSlot[];
  activeZone?: ZoneId | null;
  visualPhase?: VisualPhase;
  previewZones?: ZoneId[];
  focusedCourtNumber?: number | null;
  onToggleFocus?: (courtNumber: number | null) => void;
  leftHanded?: boolean;
  openFocusInModal?: boolean;
  className?: string;
}

export function MultiCourtGrid({
  slots,
  activeZone,
  visualPhase = "idle",
  previewZones,
  focusedCourtNumber = null,
  onToggleFocus,
  leftHanded = false,
  openFocusInModal = false,
  className = "",
}: MultiCourtGridProps) {
  const [copiedCourt, setCopiedCourt] = useState<number | null>(null);

  const handleCopyCourtUrl = (courtNumber: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (typeof window === "undefined") return;
    try {
      const url = new URL(window.location.href);
      url.searchParams.set("court", String(courtNumber));
      url.hash = `court-${courtNumber}`;
      window.history.replaceState({}, "", url.pathname + url.search + url.hash);
      void navigator.clipboard.writeText(url.toString());
      setCopiedCourt(courtNumber);
      toast.success(`Директен линк за Корт ${courtNumber} е копиран!`);
      setTimeout(() => setCopiedCourt(null), 2000);
    } catch {
      // Ignore clipboard errors
    }
  };

  const focusedSlot =
    focusedCourtNumber !== null
      ? slots.find((s) => s.courtNumber === focusedCourtNumber) || null
      : null;

  // Inline focused view when openFocusInModal is false
  if (focusedSlot && !openFocusInModal) {
    return (
      <div className={`w-full space-y-3 ${className}`}>
        <div className="flex items-center justify-between border-b border-zinc-200/80 pb-2.5 dark:border-zinc-800/80">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onToggleFocus?.(null)}
            className="h-8 rounded-xl border-zinc-200 bg-white text-xs font-bold text-zinc-700 hover:text-zinc-950 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:text-white"
          >
            <ArrowLeft size={14} className="mr-1.5" /> Всички {slots.length}{" "}
            корта
          </Button>
          <div className="flex items-center gap-2">
            <span className="flex size-6 items-center justify-center rounded-lg border border-blue-500/30 bg-blue-500/20 text-xs font-black text-blue-600 dark:text-blue-400">
              {focusedSlot.courtNumber}
            </span>
            <span className="text-xs font-black tracking-wider text-zinc-900 uppercase dark:text-white">
              Корт {focusedSlot.courtNumber} (Детайлен изглед)
            </span>
          </div>
        </div>
        <div className="mx-auto w-full max-w-80">
          <CourtVisualizer
            activeZone={activeZone}
            visualPhase={visualPhase}
            previewZones={previewZones}
            courtNumber={focusedSlot.courtNumber}
            showCourtNumberBadge={false}
            playerBottom={focusedSlot.halfA}
            playerTop={focusedSlot.halfB}
            viewMode={focusedSlot.isFullCourt ? "full" : "half"}
            dualActive={focusedSlot.isFullCourt}
            leftHanded={leftHanded}
            allowToggleView
            className="w-full border-zinc-800/80 shadow-2xl"
          />
        </div>
      </div>
    );
  }

  // Grid layout depending on number of courts
  const count = slots.length;
  let gridColsClass = "grid-cols-1";
  if (count === 2) {
    gridColsClass = "grid-cols-1 sm:grid-cols-2";
  } else if (count >= 3) {
    gridColsClass = "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3";
  }

  return (
    <>
      <div className={`grid w-full gap-3.5 ${gridColsClass} ${className}`}>
        {slots.map((slot) => {
          const assignedCount = (slot.halfA ? 1 : 0) + (slot.halfB ? 1 : 0);
          const isCopied = copiedCourt === slot.courtNumber;

          return (
            <div
              key={slot.courtNumber}
              id={`court-${slot.courtNumber}`}
              className="group relative flex flex-col rounded-2xl border border-zinc-200/80 bg-zinc-950 p-3 shadow-xs transition-all duration-300 hover:border-blue-500/50 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950/90"
            >
              {/* Header: Court Number & Player count badge */}
              <div className="mb-2 flex items-center justify-between border-b border-zinc-800/80 pb-2">
                <div className="flex items-center gap-2">
                  <span className="flex size-6 items-center justify-center rounded-lg border border-blue-500/30 bg-blue-500/15 text-xs font-black text-blue-400">
                    {slot.courtNumber}
                  </span>
                  <span className="text-xs font-black tracking-wider text-zinc-100 uppercase">
                    Корт {slot.courtNumber}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold transition-colors ${
                      assignedCount === 2
                        ? "border border-emerald-500/30 bg-emerald-500/15 text-emerald-300"
                        : assignedCount === 1
                          ? "border border-blue-500/30 bg-blue-500/15 text-blue-300"
                          : "border border-zinc-700/50 bg-zinc-800/80 text-zinc-400"
                    }`}
                  >
                    <span
                      className={`size-1.5 rounded-full ${
                        assignedCount > 0
                          ? "animate-pulse bg-emerald-400"
                          : "bg-zinc-500"
                      }`}
                    />
                    {assignedCount === 2
                      ? "2 играчи (пълен)"
                      : assignedCount === 1
                        ? "1 играч (1/2)"
                        : "Свободен"}
                  </span>

                  <button
                    type="button"
                    onClick={(e) => handleCopyCourtUrl(slot.courtNumber, e)}
                    className="flex size-6 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
                    title={`Копирай линк за Корт ${slot.courtNumber}`}
                    aria-label={`Копирай линк за Корт ${slot.courtNumber}`}
                  >
                    {isCopied ? (
                      <Check size={12} className="text-emerald-400" />
                    ) : (
                      <Link2 size={12} />
                    )}
                  </button>

                  {onToggleFocus && (
                    <button
                      type="button"
                      onClick={() => onToggleFocus(slot.courtNumber)}
                      className="flex size-6 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
                      title={`Детайлен изглед на Корт ${slot.courtNumber}`}
                      aria-label={`Детайлен изглед на Корт ${slot.courtNumber}`}
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
                  leftHanded={leftHanded}
                  className={`mx-auto w-auto border-zinc-800/60 shadow-inner ${
                    slot.isFullCourt
                      ? "aspect-710/1440 max-h-72"
                      : "aspect-710/770 max-h-56"
                  }`}
                />
              </div>

              {/* Assigned Players Footer */}
              {assignedCount > 0 && (
                <div className="mt-2 flex flex-col gap-1 rounded-xl border border-zinc-800/70 bg-zinc-900/60 p-2 text-xs">
                  {slot.halfB && (
                    <div className="flex items-center justify-between gap-2 text-blue-300">
                      <span className="shrink-0 text-[10px] font-black tracking-wider text-blue-400 uppercase">
                        Поле 2 (Горе):
                      </span>
                      <span className="truncate font-semibold">
                        {slot.halfB.displayName ||
                          `${slot.halfB.firstName || ""} ${slot.halfB.lastName || ""}`.trim()}
                      </span>
                    </div>
                  )}
                  {slot.halfA && (
                    <div className="flex items-center justify-between gap-2 text-emerald-300">
                      <span className="shrink-0 text-[10px] font-black tracking-wider text-emerald-400 uppercase">
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

      {/* URL-Synced Court Modal when openFocusInModal is true */}
      {openFocusInModal && (
        <Dialog
          open={!!focusedSlot}
          onOpenChange={(open) => {
            if (!open) onToggleFocus?.(null);
          }}
        >
          <DialogContent className="flex max-h-[90dvh] w-[calc(100%-1.5rem)] flex-col gap-0 overflow-hidden rounded-2xl border border-zinc-200/80 bg-white p-0 shadow-2xl sm:max-w-lg dark:border-zinc-800 dark:bg-zinc-950">
            <div className="flex shrink-0 items-center justify-between border-b border-zinc-100 bg-zinc-50/70 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900/50">
              <div className="flex items-center gap-2.5 pr-8">
                <span className="flex size-7 items-center justify-center rounded-xl border border-blue-500/30 bg-blue-500/15 text-xs font-black text-blue-600 dark:text-blue-400">
                  {focusedSlot?.courtNumber}
                </span>
                <div>
                  <DialogTitle className="text-sm font-bold text-zinc-900 sm:text-base dark:text-white">
                    Корт {focusedSlot?.courtNumber} — Детайлен изглед
                  </DialogTitle>
                  <DialogDescription className="text-xs text-zinc-500 dark:text-zinc-400">
                    {focusedSlot?.isFullCourt
                      ? "Пълен корт (2 състезатели в двете полета)"
                      : "Половин корт (1 състезател)"}
                  </DialogDescription>
                </div>
              </div>
            </div>
            {focusedSlot && (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 overflow-y-auto bg-zinc-950 p-4">
                <div className="w-full max-w-72">
                  <CourtVisualizer
                    activeZone={activeZone}
                    visualPhase={visualPhase}
                    previewZones={previewZones}
                    courtNumber={focusedSlot.courtNumber}
                    showCourtNumberBadge={false}
                    playerBottom={focusedSlot.halfA}
                    playerTop={focusedSlot.halfB}
                    viewMode={focusedSlot.isFullCourt ? "full" : "half"}
                    dualActive={focusedSlot.isFullCourt}
                    leftHanded={leftHanded}
                    allowToggleView
                    className="w-full border-zinc-800/80 shadow-xl"
                  />
                </div>
              </div>
            )}
            <div className="flex shrink-0 items-center justify-between border-t border-zinc-100 bg-zinc-50/80 px-4 py-2.5 dark:border-zinc-800 dark:bg-zinc-900/60">
              {focusedSlot && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={(e) =>
                    handleCopyCourtUrl(focusedSlot.courtNumber, e)
                  }
                  className="h-8 rounded-xl text-xs font-bold"
                >
                  <Link2 size={13} className="mr-1.5" /> Копирай URL на корта
                </Button>
              )}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onToggleFocus?.(null)}
                className="ml-auto h-8 rounded-xl px-4 text-xs font-bold"
              >
                Затвори
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
