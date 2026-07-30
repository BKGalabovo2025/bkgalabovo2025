"use client";

import {
  Calendar,
  Clock,
  CreditCard,
  Edit,
  MoreHorizontal,
  Shirt,
  Trash2,
  UserCheck,
  Users,
  Zap,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Service } from "@/app/(protected)/finances/services/service.types";
import { BentoCard } from "@/components/ui/bento-card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/context/auth-context";
import { deleteClubService } from "@/lib/actions/services";
import { formatPrice } from "@/lib/currency";

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
            <h3 className="text-xs font-medium tracking-[0.3em] text-zinc-400 uppercase">
              Месечни Абонаменти за Деца
            </h3>
            <div className="h-px flex-1 bg-zinc-100" />
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
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
            <h3 className="text-xs font-medium tracking-[0.3em] text-zinc-400 uppercase">
              Годишни Абонаменти
            </h3>
            <div className="h-px flex-1 bg-zinc-100" />
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
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
            <h3 className="text-xs font-medium tracking-[0.3em] text-zinc-400 uppercase">
              Абонаменти за Любители
            </h3>
            <div className="h-px flex-1 bg-zinc-100" />
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
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
            <h3 className="text-xs font-medium tracking-[0.3em] text-zinc-400 uppercase">
              Членски Внос
            </h3>
            <div className="h-px flex-1 bg-zinc-100" />
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
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
            <h3 className="text-xs font-medium tracking-[0.3em] text-zinc-400 uppercase">
              Еднократни Посещения и Персонални Тренировки
            </h3>
            <div className="h-px flex-1 bg-zinc-100" />
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
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
        <div className="flex flex-col items-center justify-center rounded-[32px] border-2 border-dashed border-zinc-100 bg-zinc-50/50 py-24 text-zinc-400">
          <Zap className="mb-3 size-10 text-zinc-300" strokeWidth={1} />
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

  const renderIcon = () => {
    if (service.type === "Членски внос") {
      return <UserCheck className="size-12 opacity-30" strokeWidth={1} />;
    }
    if (isSubscription) {
      return <Calendar className="size-12 opacity-30" strokeWidth={1} />;
    }
    return <Zap className="size-12 opacity-30" strokeWidth={1} />;
  };

  return (
    <BentoCard className="group relative flex h-full flex-col overflow-hidden rounded-5xl border border-zinc-100 bg-white shadow-none transition-all duration-500 hover:border-zinc-300 hover:shadow-xl hover:shadow-zinc-100/20">
      {/* Cover Image or Icon Header */}
      <div className="relative flex h-48 items-center justify-center overflow-hidden border-b border-zinc-50 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
        {images.length > 0 ? (
          <>
            {images.map((imgUrl, idx) => (
              <Image
                key={imgUrl}
                src={imgUrl}
                alt={`${service.name} - ${idx + 1}`}
                fill
                sizes="(max-w-768px) 100vw, 33vw"
                className={`absolute inset-0 object-contain p-4 transition-all duration-1000 group-hover:scale-110 ${
                  idx === activeImageIndex
                    ? "z-0 scale-100 opacity-100"
                    : "-z-10 scale-95 opacity-0"
                }`}
              />
            ))}

            {images.length > 1 && (
              <div className="absolute right-4 bottom-4 z-10 flex gap-1 rounded-full bg-black/20 px-2 py-1.5 backdrop-blur-md dark:bg-black/40">
                {images.map((_, idx) => (
                  <div
                    key={idx}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      idx === activeImageIndex
                        ? "w-3 bg-white"
                        : "w-1.5 bg-white/50"
                    }`}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="flex size-full flex-col items-center justify-center bg-zinc-50 text-zinc-300 dark:bg-zinc-900 dark:text-zinc-800">
            {renderIcon()}
            <span className="mt-2 text-[9px] font-semibold tracking-[0.2em] uppercase opacity-40">
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
                className="dark:border-zinc-850 size-8 rounded-full border border-zinc-100/50 bg-white/90 backdrop-blur-md hover:bg-white dark:bg-zinc-900/90"
              >
                <MoreHorizontal className="size-4 text-zinc-500" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="min-w-40 rounded-2xl border-zinc-100 p-2"
            >
              <DropdownMenuItem
                onClick={onEdit}
                className="gap-2 rounded-xl py-3 focus:bg-zinc-50"
              >
                <Edit className="size-4 text-zinc-400" /> Редактиране
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={onDelete}
                className="text-red-650 gap-2 rounded-xl py-3 focus:bg-red-50"
              >
                <Trash2 className="size-4" /> Изтриване
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Badge in corner */}
        <div className="absolute bottom-4 left-4">
          <div className="rounded-lg border border-zinc-100 bg-white/80 px-3 py-1.5 text-[9px] font-semibold tracking-widest text-zinc-900 uppercase backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/80 dark:text-white">
            {service.type}
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex flex-1 flex-col justify-between p-8">
        <div className="space-y-4">
          <h4 className="line-clamp-1 text-xl font-medium tracking-tight text-zinc-900 transition-colors group-hover:text-primary">
            {service.name}
          </h4>
          <p className="line-clamp-3 min-h-18 text-sm leading-relaxed font-light text-zinc-400">
            {service.description}
          </p>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 pt-2">
            {service.targetGroups?.map((group) => (
              <span
                key={group}
                className="rounded-full border border-zinc-100 bg-zinc-50 px-3 py-1 text-[10px] font-medium tracking-wider text-zinc-500 uppercase"
              >
                {group}
              </span>
            ))}
          </div>

          {/* Features */}
          <div className="space-y-3 border-t border-zinc-50 pt-4">
            {isSubscription ? (
              <>
                <div className="flex items-center gap-3 text-xs text-zinc-500">
                  <CreditCard
                    className="size-4 text-zinc-300"
                    strokeWidth={1.5}
                  />
                  <span>{service.billingPeriod || "Месечен"} период</span>
                </div>
                {service.grantsLicense && (
                  <div className="flex items-center gap-3 text-xs text-zinc-500">
                    <UserCheck
                      className="size-4 text-emerald-400"
                      strokeWidth={1.5}
                    />
                    <span>Право на картотека</span>
                  </div>
                )}
                {service.grantsApparel && (
                  <div className="flex items-center gap-3 text-xs text-zinc-500">
                    <Shirt className="size-4 text-blue-400" strokeWidth={1.5} />
                    <span>Право на екипировка</span>
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="flex items-center gap-3 text-xs text-zinc-500">
                  <Clock className="size-4 text-zinc-300" strokeWidth={1.5} />
                  <span>{service.durationMinutes || 90} минути</span>
                </div>
                {service.requiresBooking && (
                  <div className="flex items-center gap-3 text-xs text-zinc-500">
                    <Calendar
                      className="size-4 text-amber-400"
                      strokeWidth={1.5}
                    />
                    <span>Изисква резервация</span>
                  </div>
                )}
              </>
            )}
            <div className="flex items-center gap-3 text-xs text-zinc-500">
              <Users className="size-4 text-zinc-300" strokeWidth={1.5} />
              <span>
                {service.minMembers || 1} - {service.maxMembers || 1} участници
              </span>
            </div>
          </div>
        </div>

        <div>
          {/* Price */}
          <div className="my-6 flex items-baseline gap-1 border-t border-zinc-50 pt-6">
            <span className="text-3xl font-light tracking-tighter text-zinc-950">
              {formatPrice(service.price).replace(" EUR", "")}
            </span>
            <span className="ml-1 text-sm font-medium tracking-widest text-zinc-400 uppercase">
              EUR
            </span>
            {isSubscription && (
              <span className="ml-2 text-xs font-light text-zinc-300 lowercase">
                /{" "}
                {service.billingPeriod?.toLowerCase().replace("ен", "ца") ||
                  "месец"}
              </span>
            )}
          </div>

          {/* Actions */}
          <div className="grid w-full grid-cols-2 gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={onSale}
              className="h-11 w-full rounded-xl border-zinc-200 text-[10px] font-medium tracking-widest text-zinc-700 uppercase shadow-none transition-all hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900"
            >
              Продажба
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={onEdit}
              className="h-11 w-full rounded-xl border-none bg-zinc-950 text-[10px] font-medium tracking-widest text-white uppercase shadow-none transition-all hover:bg-zinc-800"
            >
              Редактиране
            </Button>
          </div>
        </div>
      </div>
    </BentoCard>
  );
}
