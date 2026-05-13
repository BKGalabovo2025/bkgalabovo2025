"use client";

import { Service } from "@/app/(protected)/finances/services/service.types";
import { BentoCard } from "@/components/ui/bento-card";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/currency";
import {
  CreditCard,
  Zap,
  Calendar,
  UserCheck,
  Shirt,
  Users,
  MoreHorizontal,
  Edit,
  Trash2,
  Clock,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { deleteClubService } from "@/lib/actions/services";
import { toast } from "sonner";

interface ServiceMenuProps {
  services: Service[];
}

export function ServiceMenu({ services }: ServiceMenuProps) {
  const router = useRouter();
  const { idToken } = useAuth();

  const subscriptions = services.filter((s) => s.type === "Абонамент");
  const oneTime = services.filter((s) => s.type !== "Абонамент");

  const handleDelete = async (id: string, name: string) => {
    if (!idToken) return;
    if (confirm(`Сигурни ли сте, че искате да изтриете "${name}"?`)) {
      const result = await deleteClubService(idToken, id);
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    }
  };

  return (
    <div className="space-y-16">
      {/* Subscriptions Section */}
      {subscriptions.length > 0 && (
        <section className="space-y-8">
          <div className="flex items-center gap-4">
            <div className="h-px flex-1 bg-zinc-100" />
            <h3 className="text-xs uppercase tracking-[0.3em] font-medium text-zinc-400">
              Абонаментни Планове
            </h3>
            <div className="h-px flex-1 bg-zinc-100" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {subscriptions.map((service) => (
              <ServiceCard
                key={service.id}
                service={service}
                onEdit={() =>
                  router.push(`/finances/services/${service.id}/edit`)
                }
                onDelete={() => handleDelete(service.id, service.name)}
              />
            ))}
          </div>
        </section>
      )}

      {/* One-time Section */}
      {oneTime.length > 0 && (
        <section className="space-y-8">
          <div className="flex items-center gap-4">
            <div className="h-px flex-1 bg-zinc-100" />
            <h3 className="text-xs uppercase tracking-[0.3em] font-medium text-zinc-400">
              Еднократни Посещения
            </h3>
            <div className="h-px flex-1 bg-zinc-100" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {oneTime.map((service) => (
              <ServiceCard
                key={service.id}
                service={service}
                onEdit={() =>
                  router.push(`/finances/services/${service.id}/edit`)
                }
                onDelete={() => handleDelete(service.id, service.name)}
              />
            ))}
          </div>
        </section>
      )}

      {services.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-zinc-400 border-2 border-dashed border-zinc-100 rounded-5xl">
          <p className="font-light">Все още няма добавени услуги в каталога.</p>
        </div>
      )}
    </div>
  );
}

function ServiceCard({
  service,
  onEdit,
  onDelete,
}: {
  service: Service;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const isSubscription = service.type === "Абонамент";

  return (
    <BentoCard className="group relative overflow-hidden bg-white border border-zinc-100 shadow-none hover:border-zinc-300 transition-all duration-500 rounded-5xl p-8 flex flex-col h-full">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div
          className={`p-3 rounded-2xl ${isSubscription ? "bg-zinc-950 text-white" : "bg-zinc-50 text-zinc-900"}`}
        >
          {isSubscription ? (
            <Calendar className="h-5 w-5" strokeWidth={1.5} />
          ) : (
            <Zap className="h-5 w-5" strokeWidth={1.5} />
          )}
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

      {/* Title & Description */}
      <div className="space-y-2 flex-1">
        <h4 className="text-xl font-medium tracking-tight text-zinc-900">
          {service.name}
        </h4>
        <p className="text-sm text-zinc-400 font-light leading-relaxed line-clamp-3">
          {service.description}
        </p>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-2 my-6">
        {service.targetGroups?.map((group) => (
          <span
            key={group}
            className="px-3 py-1 bg-zinc-50 border border-zinc-100 rounded-full text-[10px] uppercase tracking-wider text-zinc-500 font-medium"
          >
            {group}
          </span>
        ))}
      </div>

      {/* Features */}
      <div className="space-y-3 mb-8 pt-6 border-t border-zinc-50">
        {isSubscription ? (
          <>
            <div className="flex items-center gap-3 text-xs text-zinc-500">
              <CreditCard className="h-4 w-4 text-zinc-300" strokeWidth={1.5} />
              <span>{service.billingPeriod || "Месечен"} период</span>
            </div>
            {service.grantsLicense && (
              <div className="flex items-center gap-3 text-xs text-zinc-500">
                <UserCheck
                  className="h-4 w-4 text-emerald-400"
                  strokeWidth={1.5}
                />
                <span>Право на картотека</span>
              </div>
            )}
            {service.grantsApparel && (
              <div className="flex items-center gap-3 text-xs text-zinc-500">
                <Shirt className="h-4 w-4 text-blue-400" strokeWidth={1.5} />
                <span>Право на екипировка</span>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="flex items-center gap-3 text-xs text-zinc-500">
              <Clock className="h-4 w-4 text-zinc-300" strokeWidth={1.5} />
              <span>{service.durationMinutes || 90} минути</span>
            </div>
            {service.requiresBooking && (
              <div className="flex items-center gap-3 text-xs text-zinc-500">
                <Calendar
                  className="h-4 w-4 text-amber-400"
                  strokeWidth={1.5}
                />
                <span>Изисква резервация</span>
              </div>
            )}
          </>
        )}
        <div className="flex items-center gap-3 text-xs text-zinc-500">
          <Users className="h-4 w-4 text-zinc-300" strokeWidth={1.5} />
          <span>
            {service.minMembers || 1} - {service.maxMembers || 1} участници
          </span>
        </div>
      </div>

      {/* Price */}
      <div className="flex items-baseline gap-1 mt-auto pt-6 border-t border-zinc-50">
        <span className="text-3xl font-light tracking-tighter text-zinc-950">
          {formatPrice(service.price).replace(" EUR", "")}
        </span>
        <span className="text-sm font-medium text-zinc-400 uppercase tracking-widest ml-1">
          EUR
        </span>
        {isSubscription && (
          <span className="text-xs text-zinc-300 lowercase ml-2 font-light">
            /{" "}
            {service.billingPeriod?.toLowerCase().replace("ен", "ца") ||
              "месец"}
          </span>
        )}
      </div>
    </BentoCard>
  );
}
