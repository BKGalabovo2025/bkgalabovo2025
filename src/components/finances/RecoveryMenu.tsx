"use client";

import React from "react";

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
}

export function RecoveryMenu({ services }: RecoveryMenuProps) {
  const router = useRouter();
  const { idToken } = useAuth();

  const grouped = services.reduce((acc, s) => {
    const cat = s.category || "Други";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(s);
    return acc;
  }, {} as Record<string, ClubService[]>);

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
                onEdit={() =>
                  router.push(`/finances/recovery/${service.id}`)
                }
                onDelete={() => handleDelete(service.id, service.name)}
              />
            ))}
          </div>
        </section>
      ))}

      {services.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-zinc-400 border-2 border-dashed border-zinc-100 rounded-5xl">
          <p className="font-light">Все още няма добавени процедури в каталога.</p>
        </div>
      )}
    </div>
  );
}

const RecoveryCard = ({
  service,
  onEdit,
  onDelete,
}: {
  service: ClubService;
  onEdit: () => void;
  onDelete: () => void;
}) => {
  const [imgError, setImgError] = React.useState(false);

  // Logic for dynamic collage icons based on zones
  const getServiceIcons = (zones: string[]) => {
    const images: string[] = [];
    if (!zones) return images;
    const normalized = zones.map((z) => z.toUpperCase());

    if (normalized.includes("КРАКА")) images.push("/legs.webp");
    if (normalized.includes("РЪЦЕ")) images.push("/arm.png");
    if (normalized.includes("ТАЗ")) images.push("/pelvis.webp");

    return images;
  };

  const icons = getServiceIcons(service.zones || []);

  return (
    <BentoCard className="group relative overflow-hidden bg-white border border-zinc-100 shadow-none hover:border-cyan-200/50 hover:shadow-2xl hover:shadow-cyan-500/5 transition-all duration-500 rounded-5xl p-8 pt-16 flex flex-col h-full">
      {/* Status Badge at the absolute top */}
      <div className="absolute top-5 left-0 right-0 flex justify-center px-8 pointer-events-none">
        {(() => {
          const res = service.requiredResources;
          const zones = (service.zones || []).map(z => z.toUpperCase());
          
          const hasCompressor = (res?.compressors || 0) > 0;
          const hasMatchingAttachment = res && (
            (zones.includes("КРАКА") && (res.attachments?.legs || 0) > 0) ||
            (zones.includes("РЪЦЕ") && (res.attachments?.arms || 0) > 0) ||
            (zones.includes("ТАЗ") && (res.attachments?.hips || 0) > 0)
          );

          const isUpdated = hasCompressor && hasMatchingAttachment;

          if (!isUpdated) {
            return (
              <span className="px-4 py-1.5 bg-amber-50/80 backdrop-blur-sm text-amber-600 text-[10px] font-bold uppercase tracking-[0.2em] rounded-full border border-amber-100/50 flex items-center gap-2 shadow-sm transition-all">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                За поддръжка
              </span>
            );
          }
          return (
            <span className="px-4 py-1.5 bg-emerald-50/80 backdrop-blur-sm text-emerald-600 text-[10px] font-bold uppercase tracking-[0.2em] rounded-full border border-emerald-100/50 flex items-center gap-2 shadow-sm transition-all">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Готова
            </span>
          );
        })()}
      </div>

      {/* Header with Icon and Actions */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-2">
          {icons.length > 0 && !imgError ? (
            <div className="flex items-center gap-2">
              {icons.map((src, idx) => (
                <React.Fragment key={src}>
                  <div className="w-11 h-11 rounded-xl bg-white border border-zinc-100 flex items-center justify-center overflow-hidden shadow-sm">
                    <img 
                      src={src} 
                      alt="" 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      onError={() => setImgError(true)}
                    />
                  </div>
                  {idx < icons.length - 1 && (
                    <span className="text-zinc-300 font-light">+</span>
                  )}
                </React.Fragment>
              ))}
            </div>
          ) : (
            <div className="w-11 h-11 rounded-xl bg-cyan-50 flex items-center justify-center text-cyan-600">
              <Activity className="h-5 w-5" strokeWidth={1.5} />
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreHorizontal className="h-4 w-4 text-zinc-400" />
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
                className="rounded-xl gap-2 focus:bg-red-50 text-red-600 py-3"
              >
                <Trash2 className="h-4 w-4" /> Изтриване
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Title & Description */}
      <div className="space-y-3 flex-1">
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
        <h4 className="text-xl font-medium tracking-tight text-zinc-900">
          {service.name}
        </h4>
        <p className="text-sm text-zinc-400 font-light leading-relaxed line-clamp-3">
          {service.description}
        </p>
      </div>

      {/* Zones */}
      <div className="flex flex-wrap gap-2 my-6">
        {Array.from(new Set(Array.isArray(service.zones) ? service.zones : [])).map((zone) => (
          <span
            key={zone}
            className="px-3 py-1 bg-cyan-50 border border-cyan-100 rounded-full text-[10px] uppercase tracking-wider text-cyan-600 font-medium"
          >
            {zone}
          </span>
        ))}
      </div>

      {/* Features */}
      <div className="space-y-3 mb-8 pt-6 border-t border-zinc-50">
        <div className="flex items-center gap-3 text-xs text-zinc-500">
          <Clock className="h-4 w-4 text-zinc-300" strokeWidth={1.5} />
          <span>
            {service.durationMinutes === 45 && service.category === "VIP СЕСИИ" ? (
              <span className="font-medium text-cyan-600">15 минути + 30 минути</span>
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
            <span>{service.numberOfDays} дни / {service.proceduresPerDay} процедури на ден</span>
          </div>
        )}
        {service.requiredResources && (
          <div className="pt-4 mt-4 border-t border-zinc-50 space-y-2">
            <p className="text-[10px] text-zinc-400 uppercase tracking-widest font-medium">Ресурси</p>
            <div className="flex flex-wrap gap-x-4 gap-y-2">
              {(service.requiredResources.compressors ?? 0) > 0 && (
                <div className="flex items-center gap-1.5 text-xs text-zinc-600">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  {service.requiredResources.compressors} компресора
                </div>
              )}
              {(service.requiredResources.attachments?.arms ?? 0) > 0 && (
                <div className="flex items-center gap-1.5 text-xs text-zinc-600">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                  {service.requiredResources.attachments?.arms} маншета РЪЦЕ
                </div>
              )}
              {(service.requiredResources.attachments?.legs ?? 0) > 0 && (
                <div className="flex items-center gap-1.5 text-xs text-zinc-600">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                  {service.requiredResources.attachments?.legs} маншета КРАКА
                </div>
              )}
              {(service.requiredResources.attachments?.hips ?? 0) > 0 && (
                <div className="flex items-center gap-1.5 text-xs text-zinc-600">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                  {service.requiredResources.attachments?.hips} маншета ТАЗ
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Price */}
      <div className="flex items-baseline gap-1 mt-auto pt-6 border-t border-zinc-50">
        <span className="text-3xl font-light tracking-tighter text-zinc-950">
          {formatPrice(service.price).replace(" EUR", "")}
        </span>
        <span className="text-sm font-medium text-zinc-400 uppercase tracking-widest ml-1">
          EUR
        </span>
      </div>
    </BentoCard>
  );
}
