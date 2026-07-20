 
 
 
"use client";

import { GeneralService } from "@/types";
import { BentoCard } from "@/components/ui/bento-card";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/currency";
import {
  Wrench,
  User,
  Clock,
  MoreHorizontal,
  Edit,
  Trash2,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/context/auth-context";
import { deleteGeneralService } from "@/lib/actions/general-services";
import { toast } from "sonner";

interface GeneralServiceMenuProps {
  services: GeneralService[];
  onEdit: (service: GeneralService) => void;
}

export function GeneralServiceMenu({
  services,
  onEdit,
}: GeneralServiceMenuProps) {
  const { idToken } = useAuth();

  const handleDelete = async (id: string, name: string) => {
    if (!idToken) return;
    if (confirm(`Сигурни ли сте, че искате да изтриете "${name}"?`)) {
      const result = await deleteGeneralService(idToken, id);
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    }
  };

  return (
    <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
      {services.map((service) => (
        <BentoCard
          key={service.id}
          className="group relative flex h-full flex-col overflow-hidden rounded-5xl border border-zinc-100 bg-white p-8 shadow-none transition-all duration-500 hover:border-zinc-300"
        >
          {/* Header */}
          <div className="mb-6 flex items-start justify-between">
            <div className="rounded-2xl bg-zinc-950 p-3 text-white shadow-xl shadow-zinc-200">
              <Wrench className="size-5" strokeWidth={1.5} />
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 rounded-full opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <MoreHorizontal className="size-4 text-zinc-400" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="min-w-40 rounded-2xl border-zinc-100 p-2"
              >
                <DropdownMenuItem
                  onClick={() => onEdit(service)}
                  className="gap-2 rounded-xl py-3 focus:bg-zinc-50"
                >
                  <Edit className="size-4 text-zinc-400" /> Редактиране
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleDelete(service.id, service.name)}
                  className="gap-2 rounded-xl py-3 text-red-600 focus:bg-red-50"
                >
                  <Trash2 className="size-4" /> Изтриване
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Title & Description */}
          <div className="flex-1 space-y-2">
            <div className="mb-1 flex items-center gap-2">
              <span
                className={`rounded-md px-2 py-0.5 text-[10px] font-medium tracking-widest uppercase ${
                  service.performerType === "internal"
                    ? "border border-emerald-100 bg-emerald-50 text-emerald-600"
                    : "border border-blue-100 bg-blue-50 text-blue-600"
                }`}
              >
                {service.performerType === "internal" ? "Клубна" : "Външна"}
              </span>
            </div>
            <h4 className="text-xl font-medium tracking-tight text-zinc-900">
              {service.name}
            </h4>
            <p className="line-clamp-3 text-sm leading-relaxed font-light text-zinc-400">
              {service.description || "Няма описание за тази услуга."}
            </p>
          </div>

          {/* Features */}
          <div className="mt-6 mb-8 space-y-3 border-t border-zinc-50 pt-6">
            <div className="flex items-center gap-3 text-xs text-zinc-500">
              <User className="size-4 text-zinc-300" strokeWidth={1.5} />
              <span className="font-medium text-zinc-700">
                {service.performerName}
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-zinc-500">
              <Clock className="size-4 text-zinc-300" strokeWidth={1.5} />
              <span>
                {service.pricingUnit === "fixed" && "Фиксирана цена"}
                {service.pricingUnit === "per_hour" && "Цена на час"}
                {service.pricingUnit === "per_session" && "Цена на сесия"}
              </span>
            </div>
            {service.performerType === "internal" ? (
              <div className="flex items-center gap-3 text-xs text-zinc-500">
                <ShieldCheck
                  className="size-4 text-emerald-400"
                  strokeWidth={1.5}
                />
                <span>Гарантирано от клуба</span>
              </div>
            ) : (
              <div className="flex items-center gap-3 text-xs text-zinc-500">
                <ExternalLink
                  className="size-4 text-blue-400"
                  strokeWidth={1.5}
                />
                <span>Външен изпълнител</span>
              </div>
            )}
          </div>

          {/* Price */}
          <div className="mt-auto flex items-baseline gap-1 border-t border-zinc-50 pt-6">
            <span className="text-3xl font-light tracking-tighter text-zinc-950">
              {formatPrice(service.price).replace(" EUR", "")}
            </span>
            <span className="ml-1 text-sm font-medium tracking-widest text-zinc-400 uppercase">
              EUR
            </span>
            <span className="ml-2 text-xs font-light text-zinc-300 lowercase">
              / {{ fixed: "услуга", per_hour: "час", per_session: "сесия" }[service.pricingUnit] || "услуга"}
            </span>
          </div>
        </BentoCard>
      ))}

      {services.length === 0 && (
        <div className="col-span-full flex flex-col items-center justify-center rounded-5xl border-2 border-dashed border-zinc-100 bg-zinc-50/30 py-24 text-zinc-400">
          <Wrench className="mb-4 size-12 text-zinc-200" strokeWidth={1} />
          <p className="font-light">
            Все още няма добавени услуги в този каталог.
          </p>
        </div>
      )}
    </div>
  );
}
