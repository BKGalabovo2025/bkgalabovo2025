"use client";

import { useState, useEffect } from "react";
import { Service } from "@/app/(protected)/finances/services/service.types";
import { BentoCard } from "@/components/ui/bento-card";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/currency";
import Image from "next/image";
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
import { useAuth } from "@/context/auth-context";
import { deleteClubService } from "@/lib/actions/services";
import { toast } from "sonner";

interface ServiceMenuProps {
  services: Service[];
  onEdit: (service: Service) => void;
  onSale: (service: Service) => void;
  onDeleteSuccess?: () => void;
}

export function ServiceMenu({
  services,
  onEdit,
  onSale,
  onDeleteSuccess,
}: ServiceMenuProps) {
  const { idToken } = useAuth();

  const amateurSubs = services.filter(
    (s) =>
      (s.type === "Абонамент" || s.type === "Годишен абонамент") &&
      s.targetGroups?.includes("Любители")
  );
  const monthlySubs = services.filter(
    (s) => s.type === "Абонамент" && !s.targetGroups?.includes("Любители")
  );
  const annualSubs = services.filter(
    (s) =>
      s.type === "Годишен абонамент" && !s.targetGroups?.includes("Любители")
  );
  const membershipFees = services.filter(
    (s) => s.type === "Членски внос" && !s.targetGroups?.includes("Любители")
  );
  const oneTime = services.filter((s) => s.type === "Еднократно плащане");

  const handleDelete = async (id: string, name: string) => {
    if (!idToken) return;
    if (confirm(`Сигурни ли сте, че искате да изтриете "${name}"?`)) {
      const result = await deleteClubService(idToken, id);
      if (result.success) {
        toast.success(result.message);
        onDeleteSuccess?.();
      } else {
        toast.error(result.message);
      }
    }
  };

  return (
    <div className="space-y-16">
      {/* Monthly Subscriptions Section */}
      {monthlySubs.length > 0 && (
        <section className="space-y-8">
          <div className="flex items-center gap-4">
            <div className="h-px flex-1 bg-zinc-100" />
            <h3 className="text-xs uppercase tracking-[0.3em] font-medium text-zinc-400">
              Месечни Абонаменти за Деца
            </h3>
            <div className="h-px flex-1 bg-zinc-100" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {monthlySubs.map((service) => (
              <ServiceCard
                key={service.id}
                service={service}
                onEdit={() => onEdit(service)}
                onSale={() => onSale(service)}
                onDelete={() => handleDelete(service.id, service.name)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Annual Subscriptions Section */}
      {annualSubs.length > 0 && (
        <section className="space-y-8">
          <div className="flex items-center gap-4">
            <div className="h-px flex-1 bg-zinc-100" />
            <h3 className="text-xs uppercase tracking-[0.3em] font-medium text-zinc-400">
              Годишни Абонаменти
            </h3>
            <div className="h-px flex-1 bg-zinc-100" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {annualSubs.map((service) => (
              <ServiceCard
                key={service.id}
                service={service}
                onEdit={() => onEdit(service)}
                onSale={() => onSale(service)}
                onDelete={() => handleDelete(service.id, service.name)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Amateur Subscriptions Section */}
      {amateurSubs.length > 0 && (
        <section className="space-y-8">
          <div className="flex items-center gap-4">
            <div className="h-px flex-1 bg-zinc-100" />
            <h3 className="text-xs uppercase tracking-[0.3em] font-medium text-zinc-400">
              Абонаменти за Любители
            </h3>
            <div className="h-px flex-1 bg-zinc-100" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {amateurSubs.map((service) => (
              <ServiceCard
                key={service.id}
                service={service}
                onEdit={() => onEdit(service)}
                onSale={() => onSale(service)}
                onDelete={() => handleDelete(service.id, service.name)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Membership Fees Section */}
      {membershipFees.length > 0 && (
        <section className="space-y-8">
          <div className="flex items-center gap-4">
            <div className="h-px flex-1 bg-zinc-100" />
            <h3 className="text-xs uppercase tracking-[0.3em] font-medium text-zinc-400">
              Членски Внос
            </h3>
            <div className="h-px flex-1 bg-zinc-100" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {membershipFees.map((service) => (
              <ServiceCard
                key={service.id}
                service={service}
                onEdit={() => onEdit(service)}
                onSale={() => onSale(service)}
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
              Еднократни Посещения и Персонални Тренировки
            </h3>
            <div className="h-px flex-1 bg-zinc-100" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {oneTime.map((service) => (
              <ServiceCard
                key={service.id}
                service={service}
                onEdit={() => onEdit(service)}
                onSale={() => onSale(service)}
                onDelete={() => handleDelete(service.id, service.name)}
              />
            ))}
          </div>
        </section>
      )}

      {services.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-zinc-400 border-2 border-dashed border-zinc-100 rounded-[32px] bg-zinc-50/50">
          <Zap className="h-10 w-10 text-zinc-300 mb-3" strokeWidth={1} />
          <p className="text-sm font-light">Няма намерени услуги.</p>
        </div>
      )}
    </div>
  );
}

function ServiceCard({
  service,
  onEdit,
  onSale,
  onDelete,
}: {
  service: Service;
  onEdit: () => void;
  onSale: () => void;
  onDelete: () => void;
}) {
  const isSubscription = [
    "Абонамент",
    "Годишен абонамент",
    "Членски внос",
  ].includes(service.type);

  const images = service.imageUrl
    ? service.imageUrl.split(",").filter(Boolean)
    : [];
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  useEffect(() => {
    if (images.length <= 1) return;
    const interval = setInterval(() => {
      setActiveImageIndex((prev) => (prev + 1) % images.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [images.length]);

  return (
    <BentoCard className="group relative overflow-hidden bg-white border border-zinc-100 shadow-none hover:border-zinc-300 hover:shadow-xl hover:shadow-zinc-100/20 transition-all duration-500 rounded-5xl flex flex-col h-full">
      {/* Cover Image or Icon Header */}
      <div className="relative h-48 bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center overflow-hidden border-b border-zinc-50 dark:border-zinc-800">
        {images.length > 0 ? (
          <>
            {images.map((imgUrl, idx) => (
              <Image
                key={imgUrl}
                src={imgUrl}
                alt={`${service.name} - ${idx + 1}`}
                fill
                sizes="(max-w-768px) 100vw, 33vw"
                className={`object-cover group-hover:scale-110 absolute inset-0 transition-all duration-1000 ${
                  idx === activeImageIndex
                    ? "opacity-100 z-0 scale-100"
                    : "opacity-0 -z-10 scale-95"
                }`}
              />
            ))}

            {images.length > 1 && (
              <div className="absolute bottom-4 right-4 z-10 flex gap-1 bg-black/20 dark:bg-black/40 backdrop-blur-md px-2 py-1.5 rounded-full">
                {images.map((_, idx) => (
                  <div
                    key={idx}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      idx === activeImageIndex
                        ? "bg-white w-3"
                        : "bg-white/50 w-1.5"
                    }`}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-zinc-300 dark:text-zinc-800 bg-zinc-50 dark:bg-zinc-900">
            {service.type === "Членски внос" ? (
              <UserCheck className="h-12 w-12 opacity-30" strokeWidth={1} />
            ) : isSubscription ? (
              <Calendar className="h-12 w-12 opacity-30" strokeWidth={1} />
            ) : (
              <Zap className="h-12 w-12 opacity-30" strokeWidth={1} />
            )}
            <span className="text-[9px] font-semibold uppercase tracking-[0.2em] opacity-40 mt-2">
              {service.type}
            </span>
          </div>
        )}

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

        {/* Badge in corner */}
        <div className="absolute bottom-4 left-4">
          <div className="px-3 py-1.5 rounded-lg text-[9px] font-semibold uppercase tracking-widest border backdrop-blur-md bg-white/80 dark:bg-zinc-900/80 border-zinc-100 dark:border-zinc-800 text-zinc-900 dark:text-white">
            {service.type}
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="p-8 flex-1 flex flex-col justify-between">
        <div className="space-y-4">
          <h4 className="text-xl font-medium tracking-tight text-zinc-900 group-hover:text-primary transition-colors line-clamp-1">
            {service.name}
          </h4>
          <p className="text-sm text-zinc-400 font-light leading-relaxed line-clamp-3 min-h-18">
            {service.description}
          </p>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 pt-2">
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
          <div className="space-y-3 pt-4 border-t border-zinc-50">
            {isSubscription ? (
              <>
                <div className="flex items-center gap-3 text-xs text-zinc-500">
                  <CreditCard
                    className="h-4 w-4 text-zinc-300"
                    strokeWidth={1.5}
                  />
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
                    <Shirt
                      className="h-4 w-4 text-blue-400"
                      strokeWidth={1.5}
                    />
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
            {isSubscription && (
              <span className="text-xs text-zinc-300 lowercase ml-2 font-light">
                /{" "}
                {service.billingPeriod?.toLowerCase().replace("ен", "ца") ||
                  "месец"}
              </span>
            )}
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
}
