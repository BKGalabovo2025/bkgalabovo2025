"use client";

import {
  ArrowLeft,
  ArrowRightLeft,
  Check,
  GripVertical,
  Link2,
  Maximize2,
  Plus,
  UserMinus,
} from "lucide-react";
import React, { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  CourtSlot,
  ShadowPlayer,
  VisualPhase,
} from "@/hooks/shadow-trainer/types";
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
  editable?: boolean;
  onSwapPlayers?: (playerAId: string, playerBId: string) => void;
  onMovePlayerToCourt?: (
    playerId: string,
    targetCourtNumber: number,
    targetHalf: "A" | "B"
  ) => void;
  onMovePlayerToBench?: (playerId: string) => void;
  highContrast?: boolean;
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
  editable = false,
  onSwapPlayers,
  onMovePlayerToCourt,
  onMovePlayerToBench,
  highContrast = false,
}: MultiCourtGridProps) {
  const [copiedCourt, setCopiedCourt] = useState<number | null>(null);
  const [draggedPlayerId, setDraggedPlayerId] = useState<string | null>(null);
  const [dragOverKey, setDragOverKey] = useState<string | null>(null);

  const allCourtNumbers = slots.map((s) => s.courtNumber);

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

  const parseDraggedPlayerId = (e: React.DragEvent): string | null => {
    try {
      const jsonData = e.dataTransfer.getData("application/json");
      if (jsonData) {
        const parsed = JSON.parse(jsonData);
        if (parsed?.playerId) return parsed.playerId;
      }
    } catch {
      // fallback
    }
    const plain = e.dataTransfer.getData("text/plain");
    return plain || draggedPlayerId || null;
  };

  const handleDragStart = (playerId: string, e: React.DragEvent) => {
    setDraggedPlayerId(playerId);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("application/json", JSON.stringify({ playerId }));
    e.dataTransfer.setData("text/plain", playerId);
  };

  const handleDragEnd = () => {
    setDraggedPlayerId(null);
    setDragOverKey(null);
  };

  const handleDropOnPlayer = (targetPlayerId: string, e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverKey(null);
    const sourceId = parseDraggedPlayerId(e);
    if (!sourceId || sourceId === targetPlayerId) return;
    onSwapPlayers?.(sourceId, targetPlayerId);
  };

  const handleDropOnSlot = (
    courtNumber: number,
    half: "A" | "B",
    e: React.DragEvent
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverKey(null);
    const sourceId = parseDraggedPlayerId(e);
    if (!sourceId) return;
    onMovePlayerToCourt?.(sourceId, courtNumber, half);
  };

  const renderPlayerRow = (
    player: ShadowPlayer | null,
    half: "A" | "B",
    courtNumber: number,
    isFullCourt: boolean
  ) => {
    const isHalfB = half === "B";
    const slotKey = `court-${courtNumber}-half-${half}`;
    const label = isHalfB ? "Поле 2 (Горе)" : "Поле 1 (Долу)";
    const labelColor = isHalfB ? "text-blue-400" : "text-emerald-400";
    const badgeColor = isHalfB ? "text-blue-300" : "text-emerald-300";

    if (!player) {
      if (!editable) return null;
      const isOver = dragOverKey === slotKey;
      return (
        <div
          key={slotKey}
          onDragOver={(e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = "move";
            setDragOverKey(slotKey);
          }}
          onDragLeave={() => {
            if (dragOverKey === slotKey) setDragOverKey(null);
          }}
          onDrop={(e) => handleDropOnSlot(courtNumber, half, e)}
          className={`flex items-center justify-center gap-1.5 rounded-lg border border-dashed py-1.5 text-[11px] font-semibold transition-all ${
            isOver
              ? "border-blue-400 bg-blue-500/20 text-blue-200 shadow-xs"
              : "border-zinc-800 bg-zinc-900/30 text-zinc-500 hover:border-zinc-700 hover:text-zinc-400"
          }`}
        >
          <Plus size={11} />
          <span>Плъзнете играч в {label}</span>
        </div>
      );
    }

    const isDraggingThis = draggedPlayerId === player.id;
    const isOverThis = dragOverKey === player.id;

    return (
      <div
        key={player.id}
        draggable={editable}
        onDragStart={(e) => handleDragStart(player.id, e)}
        onDragEnd={handleDragEnd}
        onDragOver={(e) => {
          if (editable) {
            e.preventDefault();
            e.dataTransfer.dropEffect = "move";
            setDragOverKey(player.id);
          }
        }}
        onDragLeave={() => {
          if (dragOverKey === player.id) setDragOverKey(null);
        }}
        onDrop={(e) => handleDropOnPlayer(player.id, e)}
        className={`group/player flex items-center justify-between gap-1.5 rounded-lg border px-2 py-1 text-xs transition-all ${badgeColor} ${
          isDraggingThis
            ? "border-dashed border-blue-400 bg-blue-500/10 opacity-40"
            : isOverThis
              ? "border-amber-400 bg-amber-500/20 ring-2 ring-amber-400/50"
              : "border-zinc-800/80 bg-zinc-900/80 hover:border-zinc-700 hover:bg-zinc-850"
        } ${editable ? "cursor-grab active:cursor-grabbing" : ""}`}
      >
        <div className="flex min-w-0 items-center gap-1.5">
          {editable && (
            <GripVertical
              size={12}
              className="shrink-0 text-zinc-500 transition-colors group-hover/player:text-zinc-300"
            />
          )}
          <span
            className={`shrink-0 text-[10px] font-black tracking-wider uppercase ${labelColor}`}
          >
            {isFullCourt ? label : "Корт"}:
          </span>
          <span className="truncate font-semibold text-zinc-200">
            {player.displayName ||
              `${player.firstName || ""} ${player.lastName || ""}`.trim() ||
              "Състезател"}
          </span>
        </div>

        {editable && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex size-6 shrink-0 items-center justify-center rounded-md text-zinc-400 hover:bg-zinc-800 hover:text-white"
                title="Премести състезател"
                aria-label="Премести състезател"
              >
                <ArrowRightLeft size={11} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-52 border-zinc-800 bg-zinc-950 text-xs text-zinc-200"
            >
              <DropdownMenuLabel className="text-[11px] text-zinc-400">
                Премести {player.displayName || "играча"}
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-zinc-800" />
              <DropdownMenuGroup>
                {allCourtNumbers.map((c) => (
                  <React.Fragment key={c}>
                    {c !== courtNumber && (
                      <>
                        <DropdownMenuItem
                          onClick={() =>
                            onMovePlayerToCourt?.(player.id, c, "A")
                          }
                          className="cursor-pointer gap-2 hover:bg-zinc-800 hover:text-white"
                        >
                          <ArrowRightLeft
                            size={12}
                            className="text-emerald-400"
                          />
                          <span>Корт {c} (Поле 1 - Долу)</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            onMovePlayerToCourt?.(player.id, c, "B")
                          }
                          className="cursor-pointer gap-2 hover:bg-zinc-800 hover:text-white"
                        >
                          <ArrowRightLeft size={12} className="text-blue-400" />
                          <span>Корт {c} (Поле 2 - Горе)</span>
                        </DropdownMenuItem>
                      </>
                    )}
                    {c === courtNumber && isFullCourt && (
                      <DropdownMenuItem
                        onClick={() =>
                          onMovePlayerToCourt?.(
                            player.id,
                            c,
                            half === "A" ? "B" : "A"
                          )
                        }
                        className="cursor-pointer gap-2 hover:bg-zinc-800 hover:text-white"
                      >
                        <ArrowRightLeft size={12} className="text-zinc-400" />
                        <span>
                          Смени в{" "}
                          {half === "A" ? "Поле 2 (Горе)" : "Поле 1 (Долу)"}
                        </span>
                      </DropdownMenuItem>
                    )}
                  </React.Fragment>
                ))}
              </DropdownMenuGroup>
              {onMovePlayerToBench && (
                <>
                  <DropdownMenuSeparator className="bg-zinc-800" />
                  <DropdownMenuItem
                    onClick={() => onMovePlayerToBench(player.id)}
                    className="cursor-pointer gap-2 text-amber-400 hover:bg-amber-500/10 hover:text-amber-300"
                  >
                    <UserMinus size={12} />
                    <span>Премести на пейката ⏸️</span>
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    );
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
            highContrast={highContrast}
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
                  highContrast={highContrast}
                  className={`mx-auto w-auto border-zinc-800/60 shadow-inner ${
                    slot.isFullCourt
                      ? "aspect-710/1440 max-h-72"
                      : "aspect-710/770 max-h-56"
                  }`}
                />
              </div>

              {/* Assigned Players Footer */}
              {(assignedCount > 0 || editable) && (
                <div className="mt-2 flex flex-col gap-1.5 rounded-xl border border-zinc-800/70 bg-zinc-900/60 p-2 text-xs">
                  {slot.isFullCourt ? (
                    <>
                      {renderPlayerRow(slot.halfB, "B", slot.courtNumber, true)}
                      {renderPlayerRow(slot.halfA, "A", slot.courtNumber, true)}
                    </>
                  ) : (
                    renderPlayerRow(slot.halfA, "A", slot.courtNumber, false)
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
                    highContrast={highContrast}
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
