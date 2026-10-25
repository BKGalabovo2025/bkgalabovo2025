/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import {
  Activity,
  Calendar,
  Clock,
  Edit,
  MoreHorizontal,
  Trash2,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import React from "react";
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
import { ClubService } from "@/types";

interface RecoveryMenuProps {
  services: ClubService[];
  onSale?: (service: ClubService) => void;
}

export function RecoveryMenu({ services, onSale }: RecoveryMenuProps) {
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
    <div className="space-y-16">
      {Object.entries(grouped).map(([category, catServices]) => (
        <section key={category} className="space-y-8">
          <div className="flex items-center gap-4">
            <div className="h-px flex-1 bg-zinc-100" />
            <h3 className="text-xs font-medium tracking-[0.3em] text-zinc-400 uppercase">
              {category}
            </h3>
            <div className="h-px flex-1 bg-zinc-100" />
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {catServices.map((service) => (
              <RecoveryCard
                key={service.id}
                service={service}
                onEdit={() => router.push(`/finances/recovery/${service.id}`)}
                onSale={() => onSale?.(service)}
                onDelete={() => handleDelete(service.id, service.name)}
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
}: {
  service: ClubService;
  onEdit: () => void;
  onSale: () => void;
  onDelete: () => void;
}) => {
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
  const renderImages = () => {
    return (
      <ImageGallery
        images={images}
        displayMode={displayMode}
        altName={service.name}
        fallbackIcon={
          <Activity
            className="size-12 text-cyan-500 opacity-30"
            strokeWidth={1}
          />
        }
        fallbackText="ПРОЦЕДУРА"
      />
    );
  };

  return (
    <BentoCard className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-none transition-all duration-300 hover:border-zinc-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950">
      {/* Cover Image Header with Horizontal Scroll */}
      <div className="relative h-44 overflow-hidden border-b border-zinc-100 bg-zinc-50 sm:h-48 dark:border-zinc-800 dark:bg-zinc-900">
        {renderImages()}

        {/* Dropdown Menu on Image Hover */}
        <div className="absolute top-3 right-3 z-10 flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="dark:border-zinc-850 size-7.5 rounded-full border border-zinc-100/50 bg-white/90 backdrop-blur-md hover:bg-white dark:bg-zinc-900/90"
              >
                <MoreHorizontal className="size-4 text-zinc-500" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="min-w-40 rounded-xl border-zinc-100 p-1.5"
            >
              <DropdownMenuItem
                onClick={onEdit}
                className="gap-2 rounded-lg py-2 focus:bg-zinc-50"
              >
                <Edit className="size-4 text-zinc-400" /> Редактиране
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={onDelete}
                className="text-red-650 gap-2 rounded-lg py-2 focus:bg-red-50"
              >
                <Trash2 className="size-4" /> Изтриване
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Status badge in bottom corner */}
        <div className="absolute bottom-3 left-3 z-10">
          {(() => {
            const res = service.requiredResources;
            const zones = (service.zones || []).map((z) => z.toUpperCase());

            const hasCompressor = (res?.compressors || 0) > 0;
            const hasMatchingAttachment =
              res &&
              ((zones.includes("КРАКА") && (res.attachments?.legs || 0) > 0) ||
                (zones.includes("РЪЦЕ") && (res.attachments?.arms || 0) > 0) ||
                (zones.includes("ТАЗ") && (res.attachments?.hips || 0) > 0));

            const isUpdated = hasCompressor && hasMatchingAttachment;

            if (!isUpdated) {
              return (
                <div className="flex items-center gap-1.5 rounded-md border border-amber-200 bg-amber-50/90 px-2.5 py-1 text-[9px] font-bold tracking-widest text-amber-700 uppercase backdrop-blur-md">
                  <span className="size-1.5 animate-pulse rounded-full bg-amber-400" />
                  Поддръжка
                </div>
              );
            }
            return (
              <div className="flex items-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50/90 px-2.5 py-1 text-[9px] font-bold tracking-widest text-emerald-700 uppercase backdrop-blur-md">
                <span className="size-1.5 rounded-full bg-emerald-400" />
                Готова
              </div>
            );
          })()}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex flex-1 flex-col justify-between p-4 sm:p-5">
        <div className="space-y-3">
          <div className="mb-1 flex flex-wrap gap-1.5">
            {service.category && (
              <span className="rounded-md bg-zinc-50 px-2 py-0.5 text-[9px] font-black tracking-widest text-zinc-400 uppercase">
                {service.category}
              </span>
            )}
            {service.sessionType && (
              <span className="rounded-md bg-cyan-50 px-2 py-0.5 text-[9px] font-black tracking-widest text-cyan-500 uppercase">
                {service.sessionType}
              </span>
            )}
          </div>
          <h4 className="text-lg font-medium tracking-tight text-zinc-900 transition-colors group-hover:text-cyan-600 sm:text-xl dark:text-white">
            {service.name}
          </h4>
          <p className="line-clamp-2 min-h-10 text-xs leading-relaxed font-light text-zinc-400 sm:line-clamp-3 sm:min-h-12 sm:text-sm">
            {service.description}
          </p>

          {/* Zones */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {(() => {
              const uniqueZones = Array.from(
                new Set(Array.isArray(service.zones) ? service.zones : [])
              );
              if (uniqueZones.length === 3) {
                return (
                  <span className="rounded-full border border-cyan-100 bg-cyan-50 px-2.5 py-0.5 text-[9px] font-medium tracking-wider text-cyan-600 uppercase">
                    Зона по избор ({uniqueZones.join(", ")})
                  </span>
                );
              }
              return uniqueZones.map((zone) => (
                <span
                  key={zone}
                  className="rounded-full border border-cyan-100 bg-cyan-50 px-2.5 py-0.5 text-[9px] font-medium tracking-wider text-cyan-600 uppercase"
                >
                  {zone}
                </span>
              ));
            })()}
          </div>

          {/* Features */}
          <div className="space-y-2 border-t border-zinc-100 pt-3 dark:border-zinc-800">
            <div className="flex items-center gap-2.5 text-xs text-zinc-500">
              <Clock className="size-3.5 text-zinc-400" strokeWidth={1.5} />
              <span>
                {service.durationMinutes === 45 &&
                service.category === "VIP СЕСИИ" ? (
                  <span className="font-medium text-cyan-600">
                    15 минути + 30 минути
                  </span>
                ) : (
                  `${service.durationMinutes} минути`
                )}
              </span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-zinc-500">
              <Users className="size-3.5 text-zinc-400" strokeWidth={1.5} />
              <span>{service.athleteCount} спортисти</span>
            </div>
            {(service.numberOfDays || 1) >= 1 && (
              <div className="flex items-center gap-2.5 text-xs text-zinc-500">
                <Calendar
                  className="size-3.5 text-zinc-400"
                  strokeWidth={1.5}
                />
                <span>
                  {service.numberOfDays || 1} дни /{" "}
                  {service.proceduresPerDay || 1} процедури на ден
                </span>
              </div>
            )}

            {service.requiredResources && (
              <div className="mt-1.5 space-y-1 pt-1.5">
                <p className="mb-0.5 text-[9px] font-medium tracking-widest text-zinc-400 uppercase">
                  Ресурси
                </p>
                <div className="flex flex-wrap gap-x-2.5 gap-y-1">
                  {(service.requiredResources.compressors ?? 0) > 0 && (
                    <div className="flex items-center gap-1 text-[10px] text-zinc-500">
                      <span className="size-1 rounded-full bg-emerald-400" />
                      {service.requiredResources.compressors} компресора
                    </div>
                  )}
                  {(service.requiredResources.attachments?.arms ?? 0) > 0 && (
                    <div className="flex items-center gap-1 text-[10px] text-zinc-500">
                      <span className="size-1 rounded-full bg-blue-400" />
                      {service.requiredResources.attachments?.arms} РЪЦЕ
                    </div>
                  )}
                  {(service.requiredResources.attachments?.legs ?? 0) > 0 && (
                    <div className="flex items-center gap-1 text-[10px] text-zinc-500">
                      <span className="size-1 rounded-full bg-cyan-400" />
                      {service.requiredResources.attachments?.legs} КРАКА
                    </div>
                  )}
                  {(service.requiredResources.attachments?.hips ?? 0) > 0 && (
                    <div className="flex items-center gap-1 text-[10px] text-zinc-500">
                      <span className="size-1 rounded-full bg-purple-400" />
                      {service.requiredResources.attachments?.hips} ТАЗ
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div>
          {/* Price */}
          <div className="my-3.5 flex items-baseline gap-1 border-t border-zinc-100 pt-3.5 dark:border-zinc-800">
            <span className="text-2xl font-light tracking-tight text-zinc-950 sm:text-3xl dark:text-white">
              {formatPrice(service.price).replace(" EUR", "")}
            </span>
            <span className="ml-1 text-xs font-medium tracking-widest text-zinc-400 uppercase">
              EUR
            </span>
          </div>

          {/* Actions */}
          <div className="grid w-full grid-cols-2 gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={onSale}
              className="h-9 w-full rounded-xl border-zinc-200 text-[10px] font-medium tracking-widest text-zinc-700 uppercase shadow-none transition-all hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900"
            >
              Продажба
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={onEdit}
              className="h-9 w-full rounded-xl border-none bg-zinc-950 text-[10px] font-medium tracking-widest text-white uppercase shadow-none transition-all hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              Редактиране
            </Button>
          </div>
        </div>
      </div>
    </BentoCard>
  );
};
