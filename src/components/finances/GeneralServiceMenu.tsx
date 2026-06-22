 
 
 
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {services.map((service) => (
        <BentoCard
          key={service.id}
          className="group relative overflow-hidden bg-white border border-zinc-100 shadow-none hover:border-zinc-300 transition-all duration-500 rounded-5xl p-8 flex flex-col h-full"
        >
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div className="p-3 rounded-2xl bg-zinc-950 text-white shadow-xl shadow-zinc-200">
              <Wrench className="h-5 w-5" strokeWidth={1.5} />
            </div>

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
                  onClick={() => onEdit(service)}
                  className="rounded-xl gap-2 focus:bg-zinc-50 py-3"
                >
                  <Edit className="h-4 w-4 text-zinc-400" /> Редактиране
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleDelete(service.id, service.name)}
                  className="rounded-xl gap-2 focus:bg-red-50 text-red-600 py-3"
                >
                  <Trash2 className="h-4 w-4" /> Изтриване
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Title & Description */}
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span
                className={`text-[10px] font-medium uppercase tracking-widest px-2 py-0.5 rounded-md ${
                  service.performerType === "internal"
                    ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                    : "bg-blue-50 text-blue-600 border border-blue-100"
                }`}
              >
                {service.performerType === "internal" ? "Клубна" : "Външна"}
              </span>
            </div>
            <h4 className="text-xl font-medium tracking-tight text-zinc-900">
              {service.name}
            </h4>
            <p className="text-sm text-zinc-400 font-light leading-relaxed line-clamp-3">
              {service.description || "Няма описание за тази услуга."}
            </p>
          </div>

          {/* Features */}
          <div className="space-y-3 mb-8 pt-6 border-t border-zinc-50 mt-6">
            <div className="flex items-center gap-3 text-xs text-zinc-500">
              <User className="h-4 w-4 text-zinc-300" strokeWidth={1.5} />
              <span className="font-medium text-zinc-700">
                {service.performerName}
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-zinc-500">
              <Clock className="h-4 w-4 text-zinc-300" strokeWidth={1.5} />
              <span>
                {service.pricingUnit === "fixed" && "Фиксирана цена"}
                {service.pricingUnit === "per_hour" && "Цена на час"}
                {service.pricingUnit === "per_session" && "Цена на сесия"}
              </span>
            </div>
            {service.performerType === "internal" ? (
              <div className="flex items-center gap-3 text-xs text-zinc-500">
                <ShieldCheck
                  className="h-4 w-4 text-emerald-400"
                  strokeWidth={1.5}
                />
                <span>Гарантирано от клуба</span>
              </div>
            ) : (
              <div className="flex items-center gap-3 text-xs text-zinc-500">
                <ExternalLink
                  className="h-4 w-4 text-blue-400"
                  strokeWidth={1.5}
                />
                <span>Външен изпълнител</span>
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
            <span className="text-xs text-zinc-300 lowercase ml-2 font-light">
              / {{ fixed: "услуга", per_hour: "час", per_session: "сесия" }[service.pricingUnit] || "услуга"}
            </span>
          </div>
        </BentoCard>
      ))}

      {services.length === 0 && (
        <div className="col-span-full flex flex-col items-center justify-center py-24 text-zinc-400 border-2 border-dashed border-zinc-100 rounded-5xl bg-zinc-50/30">
          <Wrench className="h-12 w-12 text-zinc-200 mb-4" strokeWidth={1} />
          <p className="font-light">
            Все още няма добавени услуги в този каталог.
          </p>
        </div>
      )}
    </div>
  );
}
