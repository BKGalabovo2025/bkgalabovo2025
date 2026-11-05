"use client";

import {
  Calendar,
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  CreditCard,
  Edit,
  Link2,
  MoreHorizontal,
  Shirt,
  ShoppingCart,
  Sparkles,
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
import { cn } from "@/lib/utils";

interface ServiceMenuProps {
  services: Service[];
  onEdit: (service: Service) => void;
  onSale: (service: Service) => void;
  onDeleteSuccess?: () => void;
  selectedItemId?: string | null;
  copiedItemId?: string | null;
  onCopyLink?: (service: Service) => void;
}

export function ServiceMenu({
  services,
  onEdit,
  onSale,
  onDeleteSuccess,
  selectedItemId,
  copiedItemId,
  onCopyLink,
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

  const displayedIds = new Set([
    ...monthlySubs.map((s) => s.id),
    ...annualSubs.map((s) => s.id),
    ...amateurSubs.map((s) => s.id),
    ...membershipFees.map((s) => s.id),
    ...oneTime.map((s) => s.id),
  ]);
  const otherServices = services.filter((s) => !displayedIds.has(s.id));

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
    <div className="space-y-8 sm:space-y-10">
      {/* Monthly Subscriptions Section */}
      {monthlySubs.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-zinc-200/80 dark:bg-zinc-800" />
            <h3 className="text-xs font-semibold tracking-wider text-zinc-500 uppercase dark:text-zinc-400">
              Месечни Абонаменти за Деца ({monthlySubs.length})
            </h3>
            <div className="h-px flex-1 bg-zinc-200/80 dark:bg-zinc-800" />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {monthlySubs.map((service) => (
              <ServiceCard
                key={service.id}
                service={service}
                isSelected={selectedItemId === service.id}
                isCopied={copiedItemId === service.id}
                onEdit={() => onEdit(service)}
                onSale={() => onSale(service)}
                onDelete={() => handleDelete(service.id, service.name)}
                onCopyLink={() => onCopyLink?.(service)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Annual Subscriptions Section */}
      {annualSubs.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-zinc-200/80 dark:bg-zinc-800" />
            <h3 className="text-xs font-semibold tracking-wider text-zinc-500 uppercase dark:text-zinc-400">
              Годишни Абонаменти ({annualSubs.length})
            </h3>
            <div className="h-px flex-1 bg-zinc-200/80 dark:bg-zinc-800" />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {annualSubs.map((service) => (
              <ServiceCard
                key={service.id}
                service={service}
                isSelected={selectedItemId === service.id}
                isCopied={copiedItemId === service.id}
                onEdit={() => onEdit(service)}
                onSale={() => onSale(service)}
                onDelete={() => handleDelete(service.id, service.name)}
                onCopyLink={() => onCopyLink?.(service)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Amateur Subscriptions Section */}
      {amateurSubs.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-zinc-200/80 dark:bg-zinc-800" />
            <h3 className="text-xs font-semibold tracking-wider text-zinc-500 uppercase dark:text-zinc-400">
              Абонаменти за Любители ({amateurSubs.length})
            </h3>
            <div className="h-px flex-1 bg-zinc-200/80 dark:bg-zinc-800" />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {amateurSubs.map((service) => (
              <ServiceCard
                key={service.id}
                service={service}
                isSelected={selectedItemId === service.id}
                isCopied={copiedItemId === service.id}
                onEdit={() => onEdit(service)}
                onSale={() => onSale(service)}
                onDelete={() => handleDelete(service.id, service.name)}
                onCopyLink={() => onCopyLink?.(service)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Membership Fees Section */}
      {membershipFees.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-zinc-200/80 dark:bg-zinc-800" />
            <h3 className="text-xs font-semibold tracking-wider text-zinc-500 uppercase dark:text-zinc-400">
              Членски Внос ({membershipFees.length})
            </h3>
            <div className="h-px flex-1 bg-zinc-200/80 dark:bg-zinc-800" />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {membershipFees.map((service) => (
              <ServiceCard
                key={service.id}
                service={service}
                isSelected={selectedItemId === service.id}
                isCopied={copiedItemId === service.id}
                onEdit={() => onEdit(service)}
                onSale={() => onSale(service)}
                onDelete={() => handleDelete(service.id, service.name)}
                onCopyLink={() => onCopyLink?.(service)}
              />
            ))}
          </div>
        </section>
      )}

      {/* One-time Section */}
      {oneTime.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-zinc-200/80 dark:bg-zinc-800" />
            <h3 className="text-xs font-semibold tracking-wider text-zinc-500 uppercase dark:text-zinc-400">
              Еднократни Посещения и Персонални Тренировки ({oneTime.length})
            </h3>
            <div className="h-px flex-1 bg-zinc-200/80 dark:bg-zinc-800" />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {oneTime.map((service) => (
              <ServiceCard
                key={service.id}
                service={service}
                isSelected={selectedItemId === service.id}
                isCopied={copiedItemId === service.id}
                onEdit={() => onEdit(service)}
                onSale={() => onSale(service)}
                onDelete={() => handleDelete(service.id, service.name)}
                onCopyLink={() => onCopyLink?.(service)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Fallback for other service categories */}
      {otherServices.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-zinc-200/80 dark:bg-zinc-800" />
            <h3 className="text-xs font-semibold tracking-wider text-zinc-500 uppercase dark:text-zinc-400">
              Други Услуги и Програми ({otherServices.length})
            </h3>
            <div className="h-px flex-1 bg-zinc-200/80 dark:bg-zinc-800" />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {otherServices.map((service) => (
              <ServiceCard
                key={service.id}
                service={service}
                isSelected={selectedItemId === service.id}
                isCopied={copiedItemId === service.id}
                onEdit={() => onEdit(service)}
                onSale={() => onSale(service)}
                onDelete={() => handleDelete(service.id, service.name)}
                onCopyLink={() => onCopyLink?.(service)}
              />
            ))}
          </div>
        </section>
      )}

      {services.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-zinc-200/80 bg-zinc-50/30 py-10 sm:py-14 text-center text-zinc-400 dark:border-zinc-800 dark:bg-zinc-900/10">
          <Zap
            className="mb-2 size-8 text-zinc-300 dark:text-zinc-700"
            strokeWidth={1.5}
          />
          <p className="text-xs sm:text-sm font-light">Няма намерени услуги.</p>
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
  isSelected,
  isCopied,
  onCopyLink,
}: {
  service: Service;
  onEdit: () => void;
  onSale: () => void;
  onDelete: () => void;
  isSelected?: boolean;
  isCopied?: boolean;
  onCopyLink?: () => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isSubscription = [
    "Абонамент",
    "Годишен абонамент",
    "Членски внос",
  ].includes(service.type);

  const images = service.imageUrl
    ? service.imageUrl
        .split(",")
        .map((img) => img.trim())
        .filter(Boolean)
    : [];
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  useEffect(() => {
    if (images.length <= 1) return;
    const interval = setInterval(() => {
      setActiveImageIndex((prev) => (prev + 1) % images.length);
    }, 3500);
    return () => clearInterval(interval);
  }, [images.length]);

  const hasLongDesc = (service.description?.length || 0) > 130;

  // Type styling badge
  const getTypeBadge = () => {
    switch (service.type) {
      case "Членски внос":
        return {
          bg: "bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
          icon: (
            <UserCheck className="size-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          ),
        };
      case "Годишен абонамент":
        return {
          bg: "bg-purple-50 text-purple-700 border-purple-200/80 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800",
          icon: (
            <Sparkles className="size-3.5 text-purple-600 dark:text-purple-400 shrink-0" />
          ),
        };
      case "Абонамент":
        return {
          bg: "bg-blue-50 text-blue-700 border-blue-200/80 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800",
          icon: (
            <Calendar className="size-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
          ),
        };
      case "Еднократно плащане":
        return {
          bg: "bg-amber-50 text-amber-700 border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
          icon: (
            <Zap className="size-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
          ),
        };
      default:
        return {
          bg: "bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700",
          icon: <Zap className="size-3.5 text-zinc-500 shrink-0" />,
        };
    }
  };

  const typeBadge = getTypeBadge();

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
      {/* Top Media or Sleek Compact Header */}
      {images.length > 0 ? (
        <div className="relative h-28 sm:h-32 w-full overflow-hidden border-b border-zinc-100 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
          {images.map((imgUrl, idx) => (
            <Image
              key={imgUrl}
              src={imgUrl}
              alt={`${service.name} - ${idx + 1}`}
              priority={idx === 0}
              fill
              unoptimized={
                imgUrl.startsWith("/api/") ||
                imgUrl.includes("/api/upload") ||
                imgUrl.startsWith("data:")
              }
              sizes="(max-width: 768px) 100vw, 33vw"
              className={`absolute inset-0 object-contain p-2 transition-all duration-700 group-hover:scale-105 ${
                idx === activeImageIndex
                  ? "z-0 scale-100 opacity-100"
                  : "-z-10 scale-95 opacity-0"
              }`}
            />
          ))}

          {/* Type Badge & Selected Badge on Image */}
          <div className="absolute bottom-2 left-2 z-10 flex items-center gap-1.5">
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-semibold backdrop-blur-md shadow-2xs",
                typeBadge.bg
              )}
            >
              {typeBadge.icon}
              <span>{service.type}</span>
            </span>
            {isSelected && (
              <span className="inline-flex items-center rounded-md border border-blue-300 bg-blue-600 px-1.5 py-0.5 text-[9px] font-bold text-white shadow-xs">
                Избрана
              </span>
            )}
          </div>

          {/* Quick Actions (Copy Link & Dropdown) */}
          <div className="absolute top-2 right-2 z-10 flex items-center gap-1">
            {onCopyLink && (
              <button
                type="button"
                onClick={onCopyLink}
                className="inline-flex size-7 items-center justify-center rounded-lg border border-zinc-200/80 bg-white/90 text-zinc-600 shadow-2xs backdrop-blur-md transition-all hover:bg-white hover:text-blue-600 dark:border-zinc-800 dark:bg-zinc-900/90 dark:text-zinc-300 cursor-pointer"
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
                  aria-label="Опции за тренировката"
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
        /* Compact Header when NO Image: high density, elegant */
        <div className="flex items-center justify-between border-b border-zinc-100 bg-zinc-50/70 px-3.5 py-2.5 dark:border-zinc-800/80 dark:bg-zinc-900/50">
          <div className="flex flex-wrap items-center gap-1.5">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[10px] font-semibold",
                typeBadge.bg
              )}
            >
              {typeBadge.icon}
              <span>{service.type}</span>
            </span>

            {isSelected && (
              <span className="inline-flex items-center rounded-md border border-blue-200 bg-blue-100 px-1.5 py-0.5 text-[9px] font-bold text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300">
                Избрана
              </span>
            )}
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-1">
            {onCopyLink && (
              <button
                type="button"
                onClick={onCopyLink}
                className="inline-flex size-7 items-center justify-center rounded-lg border border-zinc-200/80 bg-white text-zinc-600 shadow-2xs transition-all hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:border-blue-700 dark:hover:text-blue-300 cursor-pointer"
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
                  aria-label="Опции за тренировката"
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
          {/* Title - Fully readable without clipping */}
          <div>
            <h4 className="text-sm font-bold text-zinc-900 transition-colors group-hover:text-blue-600 sm:text-base leading-snug dark:text-zinc-100 dark:group-hover:text-blue-400">
              {service.name}
            </h4>

            {/* Target Groups tags */}
            {service.targetGroups && service.targetGroups.length > 0 && (
              <div className="mt-1.5 flex flex-wrap gap-1">
                {service.targetGroups.map((group) => (
                  <span
                    key={group}
                    className="rounded-md border border-zinc-200/80 bg-zinc-100/80 px-1.5 py-0.5 text-[9px] font-medium tracking-wide text-zinc-600 uppercase dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400"
                  >
                    {group}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Description - readable without truncation, expandable if very long */}
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
                  className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 cursor-pointer"
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

          {/* Features & Parameters Grid */}
          <div className="grid grid-cols-2 gap-1.5 border-t border-zinc-100 pt-2.5 dark:border-zinc-800/80">
            {isSubscription ? (
              <div className="flex items-center gap-1.5 text-[11px] text-zinc-600 dark:text-zinc-400">
                <CreditCard
                  className="size-3 shrink-0 text-zinc-400"
                  strokeWidth={1.5}
                />
                <span className="truncate">
                  {service.billingPeriod || "Месечен"} период
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-[11px] text-zinc-600 dark:text-zinc-400">
                <Clock
                  className="size-3 shrink-0 text-zinc-400"
                  strokeWidth={1.5}
                />
                <span>{service.durationMinutes || 90} мин.</span>
              </div>
            )}

            <div className="flex items-center gap-1.5 text-[11px] text-zinc-600 dark:text-zinc-400">
              <Users
                className="size-3 shrink-0 text-zinc-400"
                strokeWidth={1.5}
              />
              <span className="truncate">
                {service.minMembers || 1} - {service.maxMembers || 1} души
              </span>
            </div>

            {service.grantsLicense && (
              <div className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                <UserCheck className="size-3 shrink-0" strokeWidth={1.5} />
                <span className="truncate">С картотека</span>
              </div>
            )}

            {service.grantsApparel && (
              <div className="flex items-center gap-1.5 text-[11px] font-medium text-blue-600 dark:text-blue-400">
                <Shirt className="size-3 shrink-0" strokeWidth={1.5} />
                <span className="truncate">С екипировка</span>
              </div>
            )}

            {service.requiresBooking && (
              <div className="flex items-center gap-1.5 text-[11px] font-medium text-amber-600 dark:text-amber-400">
                <Calendar className="size-3 shrink-0" strokeWidth={1.5} />
                <span className="truncate">С резервация</span>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Area: Price and Actions */}
        <div className="mt-3.5 border-t border-zinc-100 pt-3 dark:border-zinc-800/80">
          <div className="mb-3 flex items-baseline justify-between">
            <div>
              <span className="text-xl font-bold tracking-tight text-zinc-950 sm:text-2xl dark:text-white">
                {formatPrice(service.price)}
              </span>
              <span className="ml-1 text-[11px] font-medium text-zinc-400 dark:text-zinc-500">
                {isSubscription
                  ? `/ ${service.billingPeriod?.toLowerCase().replace("ен", "ца") || "месец"}`
                  : "/ еднократно"}
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
              className="h-8.5 rounded-xl bg-blue-600 text-[11px] font-semibold tracking-wide text-white shadow-xs transition-colors hover:bg-blue-700 flex items-center justify-center gap-1.5 cursor-pointer"
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
}
