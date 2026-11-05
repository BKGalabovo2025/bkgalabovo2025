/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import {
  Activity,
  Calendar,
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  Edit,
  Link2,
  MoreHorizontal,
  ShoppingCart,
  Trash2,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { toast } from "sonner";

import { ImageGallery } from "@/components/shared/images/ImageGallery";
import { BentoCard } from "@/components/ui/bento-card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/context/auth-context";
import { deleteRecoverySession } from "@/lib/actions/services";
import { formatPrice } from "@/lib/currency";
import { cn } from "@/lib/utils";
import { ClubService } from "@/types";

interface RecoveryMenuProps {
  services: ClubService[];
  onSale?: (service: ClubService) => void;
  selectedItemId?: string | null;
  copiedItemId?: string | null;
  onCopyLink?: (service: ClubService) => void;
}

export function RecoveryMenu({
  services,
  onSale,
  selectedItemId,
  copiedItemId,
  onCopyLink,
}: RecoveryMenuProps) {
  const router = useRouter();
  const { idToken } = useAuth();

  const grouped = services.reduce(
    (acc, s) => {
      const cat = s.category || "Други";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(s);
      return acc;
    },
    {} as Record<string, ClubService[]>
  );

  const handleDelete = async (id: string, name: string) => {
    if (!idToken) return;
    if (confirm(`Сигурни ли сте, че искате да изтриете "${name}"?`)) {
      const result = await deleteRecoverySession(idToken, id);
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    }
  };

  return (
    <div className="space-y-8 sm:space-y-10">
      {Object.entries(grouped).map(([category, catServices]) => (
        <section key={category} className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-zinc-200/80 dark:bg-zinc-800" />
            <h3 className="text-xs font-semibold tracking-wider text-zinc-500 uppercase dark:text-zinc-400">
              {category} ({catServices.length})
            </h3>
            <div className="h-px flex-1 bg-zinc-200/80 dark:bg-zinc-800" />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {catServices.map((service) => (
              <RecoveryCard
                key={service.id}
                service={service}
                isSelected={selectedItemId === service.id}
                isCopied={copiedItemId === service.id}
                onEdit={() =>
                  router.push(`/catalogs/recovery/${service.id}/edit`)
                }
                onSale={() => onSale?.(service)}
                onDelete={() => handleDelete(service.id, service.name)}
                onCopyLink={() => onCopyLink?.(service)}
              />
            ))}
          </div>
        </section>
      ))}

      {services.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-zinc-200/80 bg-zinc-50/30 py-10 sm:py-14 text-center text-zinc-400 dark:border-zinc-800 dark:bg-zinc-900/10">
          <p className="text-xs sm:text-sm font-light">
            Все още няма добавени процедури в каталога.
          </p>
        </div>
      )}
    </div>
  );
}

const RecoveryCard = ({
  service,
  onEdit,
  onSale,
  onDelete,
  isSelected,
  isCopied,
  onCopyLink,
}: {
  service: ClubService;
  onEdit: () => void;
  onSale: () => void;
  onDelete: () => void;
  isSelected?: boolean;
  isCopied?: boolean;
  onCopyLink?: () => void;
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasLongDesc = (service.description?.length || 0) > 130;

  const images = (service as any).imageUrl
    ? (service as any).imageUrl
        .split(",")
        .filter(Boolean)
        .map((img: string) =>
          img.startsWith("/") && !img.startsWith("/zones")
            ? `/zones${img}`
            : img
        )
    : [];

  const displayMode = (service as any).imageDisplayMode || "collage";

  const res = service.requiredResources;
  const zones = (service.zones || []).map((z) => z.toUpperCase());

  const hasCompressor = (res?.compressors || 0) > 0;
  const hasMatchingAttachment =
    res &&
    ((zones.includes("КРАКА") && (res.attachments?.legs || 0) > 0) ||
      (zones.includes("РЪЦЕ") && (res.attachments?.arms || 0) > 0) ||
      (zones.includes("ТАЗ") && (res.attachments?.hips || 0) > 0));

  const isReady = hasCompressor && hasMatchingAttachment;

  const renderImages = () => {
    return (
      <ImageGallery
        images={images}
        displayMode={displayMode}
        altName={service.name}
        fallbackIcon={
          <Activity
            className="size-10 text-cyan-500 opacity-30"
            strokeWidth={1.5}
          />
        }
        fallbackText="ПРОЦЕДУРА"
      />
    );
  };

  return (
    <BentoCard
      id={`item-${service.id}`}
      className={cn(
        "group relative flex flex-col justify-between overflow-hidden rounded-2xl border bg-white p-0 shadow-xs transition-all duration-300 hover:shadow-md dark:bg-zinc-950",
        isSelected
          ? "border-blue-500 ring-2 ring-blue-500/60 shadow-lg bg-blue-50/15 dark:border-blue-400 dark:ring-blue-400/60 dark:bg-blue-950/20"
          : "border-zinc-200/80 hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700"
      )}
    >
      {/* Top Header / Media */}
      {images.length > 0 ? (
        <div className="relative h-28 sm:h-32 w-full overflow-hidden border-b border-zinc-100 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
          {renderImages()}

          {/* Status badge & Selected badge on image */}
          <div className="absolute bottom-2 left-2 z-10 flex items-center gap-1.5">
            {isReady ? (
              <span className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50/90 px-2 py-0.5 text-[9px] font-bold tracking-wider text-emerald-700 uppercase backdrop-blur-md dark:border-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300">
                <span className="size-1.5 rounded-full bg-emerald-500" />
                Готова
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-md border border-amber-200 bg-amber-50/90 px-2 py-0.5 text-[9px] font-bold tracking-wider text-amber-700 uppercase backdrop-blur-md dark:border-amber-800 dark:bg-amber-950/70 dark:text-amber-300">
                <span className="size-1.5 animate-pulse rounded-full bg-amber-500" />
                Поддръжка
              </span>
            )}

            {isSelected && (
              <span className="inline-flex items-center rounded-md border border-blue-300 bg-blue-600 px-1.5 py-0.5 text-[9px] font-bold text-white shadow-xs">
                Избрана
              </span>
            )}
          </div>

          {/* Quick Actions (Link & Menu) */}
          <div className="absolute top-2 right-2 z-10 flex items-center gap-1">
            {onCopyLink && (
              <button
                type="button"
                onClick={onCopyLink}
                className="inline-flex size-7 items-center justify-center rounded-lg border border-zinc-200/80 bg-white/90 text-zinc-600 shadow-2xs backdrop-blur-md transition-all hover:bg-white hover:text-cyan-600 dark:border-zinc-800 dark:bg-zinc-900/90 dark:text-zinc-300 cursor-pointer"
                title={`Копирай директен линк към ${service.name}`}
                aria-label={`Копирай директен линк към ${service.name}`}
              >
                {isCopied ? (
                  <Check
                    size={13}
                    className="text-emerald-600 dark:text-emerald-400"
                  />
                ) : (
                  <Link2 size={13} />
                )}
              </button>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Опции за процедурата"
                  className="size-7 rounded-lg border border-zinc-200/80 bg-white/90 text-zinc-600 shadow-2xs backdrop-blur-md hover:bg-white dark:border-zinc-800 dark:bg-zinc-900/90 dark:text-zinc-300 cursor-pointer"
                >
                  <MoreHorizontal className="size-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="min-w-40 rounded-xl p-1.5"
              >
                {onCopyLink && (
                  <DropdownMenuItem
                    onClick={onCopyLink}
                    className="gap-2 rounded-lg py-1.5 text-xs cursor-pointer"
                  >
                    <Link2 className="size-3.5 text-zinc-400" /> Копирай линк
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  onClick={onEdit}
                  className="gap-2 rounded-lg py-1.5 text-xs cursor-pointer"
                >
                  <Edit className="size-3.5 text-zinc-400" /> Редактиране
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={onDelete}
                  className="gap-2 rounded-lg py-1.5 text-xs text-red-600 focus:bg-red-50 dark:text-red-400 dark:focus:bg-red-950/30 cursor-pointer"
                >
                  <Trash2 className="size-3.5" /> Изтриване
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      ) : (
        /* Compact Header when NO Image (High density, 38px) */
        <div className="flex items-center justify-between border-b border-zinc-100 bg-zinc-50/70 px-3.5 py-2.5 dark:border-zinc-800/80 dark:bg-zinc-900/50">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="inline-flex items-center gap-1.5 rounded-md border border-cyan-200/80 bg-cyan-50 px-2 py-0.5 text-[10px] font-semibold text-cyan-700 dark:border-cyan-800 dark:bg-cyan-950/40 dark:text-cyan-300">
              <Activity className="size-3 text-cyan-600 dark:text-cyan-400 shrink-0" />
              <span>{service.sessionType || "Процедура"}</span>
            </span>

            {isReady ? (
              <span className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[9px] font-bold text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                <span className="size-1.5 rounded-full bg-emerald-500" />
                Готова
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-md border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[9px] font-bold text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
                <span className="size-1.5 animate-pulse rounded-full bg-amber-500" />
                Поддръжка
              </span>
            )}

            {isSelected && (
              <span className="inline-flex items-center rounded-md border border-blue-200 bg-blue-100 px-1.5 py-0.5 text-[9px] font-bold text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300">
                Избрана
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            {onCopyLink && (
              <button
                type="button"
                onClick={onCopyLink}
                className="inline-flex size-7 items-center justify-center rounded-lg border border-zinc-200/80 bg-white text-zinc-600 shadow-2xs transition-all hover:border-cyan-300 hover:bg-cyan-50 hover:text-cyan-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:border-cyan-700 dark:hover:text-cyan-300 cursor-pointer"
                title={`Копирай директен линк към ${service.name}`}
                aria-label={`Копирай директен линк към ${service.name}`}
              >
                {isCopied ? (
                  <Check
                    size={13}
                    className="text-emerald-600 dark:text-emerald-400"
                  />
                ) : (
                  <Link2 size={13} />
                )}
              </button>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Опции за процедурата"
                  className="size-7 rounded-lg border border-zinc-200/80 bg-white text-zinc-600 shadow-2xs hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 cursor-pointer"
                >
                  <MoreHorizontal className="size-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="min-w-40 rounded-xl p-1.5"
              >
                {onCopyLink && (
                  <DropdownMenuItem
                    onClick={onCopyLink}
                    className="gap-2 rounded-lg py-1.5 text-xs cursor-pointer"
                  >
                    <Link2 className="size-3.5 text-zinc-400" /> Копирай линк
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  onClick={onEdit}
                  className="gap-2 rounded-lg py-1.5 text-xs cursor-pointer"
                >
                  <Edit className="size-3.5 text-zinc-400" /> Редактиране
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={onDelete}
                  className="gap-2 rounded-lg py-1.5 text-xs text-red-600 focus:bg-red-50 dark:text-red-400 dark:focus:bg-red-950/30 cursor-pointer"
                >
                  <Trash2 className="size-3.5" /> Изтриване
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      )}

      {/* Content Area */}
      <div className="flex flex-1 flex-col justify-between p-3.5 sm:p-4">
        <div className="space-y-2.5">
          {/* Category & Session Type tags */}
          <div className="flex flex-wrap items-center gap-1.5">
            {service.category && (
              <span className="rounded-md border border-zinc-200/80 bg-zinc-100/80 px-1.5 py-0.5 text-[9px] font-semibold tracking-wide text-zinc-600 uppercase dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
                {service.category}
              </span>
            )}
            {service.sessionType &&
              service.sessionType !== "Възстановяване" && (
                <span className="rounded-md border border-cyan-200/80 bg-cyan-50 px-1.5 py-0.5 text-[9px] font-semibold tracking-wide text-cyan-700 uppercase dark:border-cyan-800 dark:bg-cyan-950/40 dark:text-cyan-300">
                  {service.sessionType}
                </span>
              )}
          </div>

          {/* Title - Fully readable, no clipping */}
          <div>
            <h4 className="text-sm font-bold text-zinc-900 transition-colors group-hover:text-cyan-600 sm:text-base leading-snug dark:text-zinc-100 dark:group-hover:text-cyan-400">
              {service.name}
            </h4>
          </div>

          {/* Description - readable without truncation */}
          {service.description && (
            <div className="space-y-1">
              <p
                className={cn(
                  "text-xs leading-relaxed text-zinc-600 dark:text-zinc-300",
                  !isExpanded && hasLongDesc && "line-clamp-3"
                )}
              >
                {service.description}
              </p>
              {hasLongDesc && (
                <button
                  type="button"
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-cyan-600 hover:text-cyan-700 dark:text-cyan-400 cursor-pointer"
                >
                  <span>
                    {isExpanded ? "Свий описанието" : "Виж цялото описание"}
                  </span>
                  {isExpanded ? (
                    <ChevronUp size={12} />
                  ) : (
                    <ChevronDown size={12} />
                  )}
                </button>
              )}
            </div>
          )}

          {/* Zones */}
          {service.zones && service.zones.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-0.5">
              {(() => {
                const uniqueZones = Array.from(
                  new Set(Array.isArray(service.zones) ? service.zones : [])
                );
                if (uniqueZones.length === 3) {
                  return (
                    <span className="rounded-md border border-cyan-150 bg-cyan-50/80 px-1.5 py-0.5 text-[9px] font-medium text-cyan-700 dark:border-cyan-900/40 dark:bg-cyan-950/40 dark:text-cyan-300">
                      Зона по избор ({uniqueZones.join(", ")})
                    </span>
                  );
                }
                return uniqueZones.map((zone) => (
                  <span
                    key={zone}
                    className="rounded-md border border-cyan-150 bg-cyan-50/80 px-1.5 py-0.5 text-[9px] font-medium text-cyan-700 dark:border-cyan-900/40 dark:bg-cyan-950/40 dark:text-cyan-300"
                  >
                    {zone}
                  </span>
                ));
              })()}
            </div>
          )}

          {/* Key Parameters Grid */}
          <div className="grid grid-cols-2 gap-1.5 border-t border-zinc-100 pt-2.5 dark:border-zinc-800/80">
            <div className="flex items-center gap-1.5 text-[11px] text-zinc-600 dark:text-zinc-400">
              <Clock
                className="size-3 shrink-0 text-zinc-400"
                strokeWidth={1.5}
              />
              <span className="truncate">
                {service.durationMinutes === 45 &&
                service.category === "VIP СЕСИИ"
                  ? "15 + 30 мин."
                  : `${service.durationMinutes} мин.`}
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-[11px] text-zinc-600 dark:text-zinc-400">
              <Users
                className="size-3 shrink-0 text-zinc-400"
                strokeWidth={1.5}
              />
              <span className="truncate">{service.athleteCount} спортисти</span>
            </div>

            {(service.numberOfDays || 1) > 1 && (
              <div className="col-span-2 flex items-center gap-1.5 text-[11px] text-zinc-600 dark:text-zinc-400">
                <Calendar
                  className="size-3 shrink-0 text-zinc-400"
                  strokeWidth={1.5}
                />
                <span className="truncate">
                  {service.numberOfDays} дни / {service.proceduresPerDay || 1}{" "}
                  проц./ден
                </span>
              </div>
            )}
          </div>

          {/* Required Resources pills */}
          {service.requiredResources && (
            <div className="flex flex-wrap gap-1 pt-1 text-[10px] text-zinc-500">
              {(service.requiredResources.compressors ?? 0) > 0 && (
                <span className="inline-flex items-center gap-1 rounded bg-zinc-100 px-1.5 py-0.5 dark:bg-zinc-800">
                  <span className="size-1 rounded-full bg-emerald-500" />
                  {service.requiredResources.compressors} компресора
                </span>
              )}
              {(service.requiredResources.attachments?.legs ?? 0) > 0 && (
                <span className="inline-flex items-center gap-1 rounded bg-zinc-100 px-1.5 py-0.5 dark:bg-zinc-800">
                  <span className="size-1 rounded-full bg-cyan-500" />
                  {service.requiredResources.attachments?.legs} КРАКА
                </span>
              )}
              {(service.requiredResources.attachments?.arms ?? 0) > 0 && (
                <span className="inline-flex items-center gap-1 rounded bg-zinc-100 px-1.5 py-0.5 dark:bg-zinc-800">
                  <span className="size-1 rounded-full bg-blue-500" />
                  {service.requiredResources.attachments?.arms} РЪЦЕ
                </span>
              )}
              {(service.requiredResources.attachments?.hips ?? 0) > 0 && (
                <span className="inline-flex items-center gap-1 rounded bg-zinc-100 px-1.5 py-0.5 dark:bg-zinc-800">
                  <span className="size-1 rounded-full bg-purple-500" />
                  {service.requiredResources.attachments?.hips} ТАЗ
                </span>
              )}
            </div>
          )}
        </div>

        {/* Bottom Area: Price and Actions */}
        <div className="mt-3.5 border-t border-zinc-100 pt-3 dark:border-zinc-800/80">
          <div className="mb-3 flex items-baseline justify-between">
            <div>
              <span className="text-xl font-bold tracking-tight text-zinc-950 sm:text-2xl dark:text-white">
                {formatPrice(service.price)}
              </span>
              <span className="ml-1 text-[11px] font-medium text-zinc-400 dark:text-zinc-500">
                / процедура
              </span>
            </div>
          </div>

          {/* Action Buttons: 1-click Direct Sale + Edit */}
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={onSale}
              className="h-8.5 rounded-xl bg-cyan-600 text-[11px] font-semibold tracking-wide text-white shadow-xs transition-colors hover:bg-cyan-700 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <ShoppingCart size={13} />
              <span>Продажба</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onEdit}
              className="h-8.5 rounded-xl border-zinc-200 text-[11px] font-medium tracking-wide text-zinc-700 shadow-none transition-colors hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Edit size={13} />
              <span>Редакция</span>
            </Button>
          </div>
        </div>
      </div>
    </BentoCard>
  );
};
