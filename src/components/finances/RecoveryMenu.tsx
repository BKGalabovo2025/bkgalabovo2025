"use client";
import React from "react";

import Image from "next/image";
import { ClubService } from "@/types";
import { BentoCard } from "@/components/ui/bento-card";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/currency";
import {
  Activity,
  Calendar,
  MoreHorizontal,
  Edit,
  Trash2,
  Clock,
  Users,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { deleteRecoverySession } from "@/lib/actions/services";
import { toast } from "sonner";

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
            <h3 className="text-xs uppercase tracking-[0.3em] font-medium text-zinc-400">
              {category}
            </h3>
            <div className="h-px flex-1 bg-zinc-100" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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
        <div className="flex flex-col items-center justify-center py-24 text-zinc-400 border-2 border-dashed border-zinc-100 rounded-5xl">
          <p className="font-light">
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
    ? (service as any).imageUrl.split(",").filter(Boolean)
    : [];

  const displayMode = (service as any).imageDisplayMode || "collage";
  const [activeImgIndex, setActiveImgIndex] = React.useState(0);

  // Auto-rotate for carousel
  React.useEffect(() => {
    if (displayMode !== "carousel" || images.length <= 1) return;
    const interval = setInterval(() => {
      setActiveImgIndex((prev) => (prev + 1) % images.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [displayMode, images.length]);

  const nextImg = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveImgIndex((prev) => (prev + 1) % images.length);
  };

  const prevImg = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveImgIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const renderImages = () => {
    if (images.length === 0) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center text-zinc-300 dark:text-zinc-800 bg-zinc-50 dark:bg-zinc-900">
          <Activity
            className="h-12 w-12 opacity-30 text-cyan-500"
            strokeWidth={1}
          />
          <span className="text-[9px] font-semibold uppercase tracking-[0.2em] opacity-40 mt-2">
            ПРОЦЕДУРА
          </span>
        </div>
      );
    }
    if (displayMode === "collage") {
      return (
        <div className="flex w-full h-full">
          {images.map((imgUrl: string, idx: number) => (
            <div
              key={imgUrl}
              className="h-full relative overflow-hidden"
              style={{ width: `${100 / images.length}%` }}
            >
              <Image
                src={imgUrl}
                alt={`${service.name} - ${idx + 1}`}
                fill
                sizes="(max-w-768px) 100vw, 33vw"
                className="object-cover transition-transform duration-700 hover:scale-110"
              />
              {idx > 0 && (
                <div className="absolute left-0 top-0 bottom-0 w-px bg-white/30 z-10" />
              )}
            </div>
          ))}
        </div>
      );
    }
    return (
      <>
        <Image
          src={images[activeImgIndex]}
          alt={`${service.name} - ${activeImgIndex + 1}`}
          fill
          sizes="(max-w-768px) 100vw, 33vw"
          className="object-cover transition-transform duration-700"
        />
        {images.length > 1 && (
          <>
            <button
              onClick={prevImg}
              className="absolute left-2 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full bg-white/60 backdrop-blur-sm shadow-xs border border-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white text-zinc-700"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              onClick={nextImg}
              className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full bg-white/60 backdrop-blur-sm shadow-xs border border-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white text-zinc-700"
            >
              <ChevronRight size={14} />
            </button>
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
              {images.map((_: any, i: number) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    activeImgIndex === i
                      ? "bg-white w-4"
                      : "bg-white/50 w-1.5"
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </>
    );
  };

  return (
    <BentoCard className="group relative overflow-hidden bg-white border border-zinc-100 shadow-none hover:border-zinc-300 hover:shadow-xl hover:shadow-zinc-100/20 transition-all duration-500 rounded-5xl flex flex-col h-full">
      {/* Cover Image Header with Horizontal Scroll */}
      <div className="relative h-48 bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-50 dark:border-zinc-800 overflow-hidden">
        {renderImages()}

        {/* Dropdown Menu on Image Hover */}
        <div className="absolute top-4 right-4 z-10 flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border border-zinc-100/50 dark:border-zinc-850 hover:bg-white"
              >
                <MoreHorizontal className="h-4 w-4 text-zinc-500" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="rounded-2xl border-zinc-100 p-2 min-w-[160px]"
            >
              <DropdownMenuItem
                onClick={onEdit}
                className="rounded-xl gap-2 focus:bg-zinc-50 py-3"
              >
                <Edit className="h-4 w-4 text-zinc-400" /> Редактиране
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={onDelete}
                className="rounded-xl gap-2 focus:bg-red-50 text-red-650 py-3"
              >
                <Trash2 className="h-4 w-4" /> Изтриване
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Status badge in bottom corner */}
        <div className="absolute bottom-4 left-4 z-10">
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
                <div className="px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-widest border backdrop-blur-md bg-amber-50/90 border-amber-200 text-amber-700 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                  Поддръжка
                </div>
              );
            }
            return (
              <div className="px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-widest border backdrop-blur-md bg-emerald-50/90 border-emerald-200 text-emerald-700 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Готова
              </div>
            );
          })()}
        </div>
      </div>

      {/* Content Area */}
      <div className="p-8 flex-1 flex flex-col justify-between">
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2 mb-1">
            {service.category && (
              <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400 bg-zinc-50 px-2 py-0.5 rounded-md">
                {service.category}
              </span>
            )}
            {service.sessionType && (
              <span className="text-[9px] font-black uppercase tracking-widest text-cyan-500 bg-cyan-50 px-2 py-0.5 rounded-md">
                {service.sessionType}
              </span>
            )}
          </div>
          <h4 className="text-xl font-medium tracking-tight text-zinc-900 group-hover:text-cyan-600 transition-colors line-clamp-1">
            {service.name}
          </h4>
          <p className="text-sm text-zinc-400 font-light leading-relaxed line-clamp-3 min-h-16">
            {service.description}
          </p>

          {/* Zones */}
          <div className="flex flex-wrap gap-2 pt-2">
            {Array.from(
              new Set(Array.isArray(service.zones) ? service.zones : [])
            ).map((zone) => (
              <span
                key={zone}
                className="px-3 py-1 bg-cyan-50 border border-cyan-100 rounded-full text-[10px] uppercase tracking-wider text-cyan-600 font-medium"
              >
                {zone}
              </span>
            ))}
          </div>

          {/* Features */}
          <div className="space-y-3 pt-4 border-t border-zinc-50">
            <div className="flex items-center gap-3 text-xs text-zinc-500">
              <Clock className="h-4 w-4 text-zinc-300" strokeWidth={1.5} />
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
            <div className="flex items-center gap-3 text-xs text-zinc-500">
              <Users className="h-4 w-4 text-zinc-300" strokeWidth={1.5} />
              <span>{service.athleteCount} спортисти</span>
            </div>
            {(service.numberOfDays || 0) > 1 && (
              <div className="flex items-center gap-3 text-xs text-zinc-500">
                <Calendar className="h-4 w-4 text-zinc-300" strokeWidth={1.5} />
                <span>
                  {service.numberOfDays} дни / {service.proceduresPerDay}{" "}
                  процедури на ден
                </span>
              </div>
            )}

            {service.requiredResources && (
              <div className="pt-2 mt-2 space-y-1">
                <p className="text-[9px] text-zinc-400 uppercase tracking-widest font-medium mb-1">
                  Ресурси
                </p>
                <div className="flex flex-wrap gap-x-3 gap-y-1">
                  {(service.requiredResources.compressors ?? 0) > 0 && (
                    <div className="flex items-center gap-1 text-[10px] text-zinc-500">
                      <span className="w-1 h-1 rounded-full bg-emerald-400" />
                      {service.requiredResources.compressors} компресора
                    </div>
                  )}
                  {(service.requiredResources.attachments?.arms ?? 0) > 0 && (
                    <div className="flex items-center gap-1 text-[10px] text-zinc-500">
                      <span className="w-1 h-1 rounded-full bg-blue-400" />
                      {service.requiredResources.attachments?.arms} РЪЦЕ
                    </div>
                  )}
                  {(service.requiredResources.attachments?.legs ?? 0) > 0 && (
                    <div className="flex items-center gap-1 text-[10px] text-zinc-500">
                      <span className="w-1 h-1 rounded-full bg-cyan-400" />
                      {service.requiredResources.attachments?.legs} КРАКА
                    </div>
                  )}
                  {(service.requiredResources.attachments?.hips ?? 0) > 0 && (
                    <div className="flex items-center gap-1 text-[10px] text-zinc-500">
                      <span className="w-1 h-1 rounded-full bg-purple-400" />
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
          <div className="flex items-baseline gap-1 pt-6 border-t border-zinc-50 mb-6 mt-6">
            <span className="text-3xl font-light tracking-tighter text-zinc-950">
              {formatPrice(service.price).replace(" EUR", "")}
            </span>
            <span className="text-sm font-medium text-zinc-400 uppercase tracking-widest ml-1">
              EUR
            </span>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-3 w-full">
            <Button
              variant="outline"
              size="sm"
              onClick={onSale}
              className="w-full h-11 rounded-xl font-medium text-[10px] uppercase tracking-widest border-zinc-200 text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900 transition-all shadow-none"
            >
              Продажба
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={onEdit}
              className="w-full h-11 rounded-xl font-medium text-[10px] uppercase tracking-widest bg-zinc-950 text-white hover:bg-zinc-800 transition-all shadow-none border-none"
            >
              Редактиране
            </Button>
          </div>
        </div>
      </div>
    </BentoCard>
  );
};
