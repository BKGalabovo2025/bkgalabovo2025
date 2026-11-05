"use client";

import {
  Check,
  ChevronDown,
  ChevronUp,
  Edit,
  Link2,
  MoreHorizontal,
  Search,
  ShoppingCart,
  Trash2,
  User,
  Wrench,
} from "lucide-react";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { BentoCard } from "@/components/ui/bento-card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { useGeneralServices } from "@/hooks/useGeneralServices";
import { deleteGeneralServiceAction } from "@/lib/actions/general-services-server";
import { formatPrice } from "@/lib/currency";
import { cn } from "@/lib/utils";
import { GeneralService } from "@/types";

const EditGeneralServiceDialog = dynamic(
  () =>
    import("./EditGeneralServiceDialog").then(
      (m) => m.EditGeneralServiceDialog
    ),
  { ssr: false }
);
const UnifiedSaleWizardDialog = dynamic(
  () =>
    import("@/components/shared/wizard-v2/UnifiedSaleWizardDialog").then(
      (m) => m.UnifiedSaleWizardDialog
    ),
  { ssr: false }
);
const ReservationDialog = dynamic(
  () =>
    import("@/components/reservations/reservation-dialog").then(
      (m) => m.ReservationDialog
    ),
  { ssr: false }
);

export function GeneralServiceList() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const saleId = searchParams.get("sale");
  const qParam = searchParams.get("q") || "";
  const itemParam = searchParams.get("item");

  const { services, isLoading, refetch } = useGeneralServices();
  const [searchTerm, setSearchTerm] = useState(qParam);
  const [copiedItemId, setCopiedItemId] = useState<string | null>(null);
  const [selectedService, setSelectedService] = useState<GeneralService | null>(
    null
  );

  useEffect(() => {
    setSearchTerm(qParam);
  }, [qParam]);

  useEffect(() => {
    if (itemParam) {
      const el = document.getElementById(`item-${itemParam}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [itemParam, services]);

  // Synchronize sale wizard with URL query parameter ?sale=<id>
  useEffect(() => {
    if (saleId && services.length > 0) {
      const found = services.find((s) => s.id === saleId);
      if (found) {
        setSelectedService(found);
        setIsSaleOpen(true);
      }
    }
  }, [saleId, services]);

  const updateUrlParams = (updater: (params: URLSearchParams) => void) => {
    const params = new URLSearchParams(searchParams.toString());
    updater(params);
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  const handleSearchChange = (val: string) => {
    setSearchTerm(val);
    updateUrlParams((params) => {
      if (val.trim()) params.set("q", val);
      else params.delete("q");
    });
  };

  const handleCopyLink = (service: GeneralService) => {
    if (typeof window === "undefined") return;
    const url = `${window.location.origin}/catalogs/club-services?item=${service.id}`;
    if (navigator.clipboard?.writeText) {
      navigator.clipboard
        .writeText(url)
        .then(() => {
          setCopiedItemId(service.id);
          toast.success(`Директният линк за "${service.name}" е копиран!`);
          setTimeout(() => setCopiedItemId(null), 2500);
        })
        .catch(() => {
          toast.error("Неуспешно копиране на линк.");
        });
    } else {
      setCopiedItemId(service.id);
      toast.success(`Линк: ${url}`);
      setTimeout(() => setCopiedItemId(null), 2500);
    }
  };

  const openSale = (service: GeneralService) => {
    setSelectedService(service);
    setIsSaleOpen(true);
    updateUrlParams((params) => {
      params.set("sale", service.id);
    });
  };

  const closeSale = () => {
    setIsSaleOpen(false);
    setSelectedService(null);
    updateUrlParams((params) => {
      params.delete("sale");
    });
  };

  // Dialog states
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isSaleOpen, setIsSaleOpen] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState<GeneralService | null>(
    null
  );
  const [isDeleting, setIsDeleting] = useState(false);

  const filteredServices = services.filter((service) =>
    service.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDeleteConfirm = async () => {
    if (!serviceToDelete) return;
    setIsDeleting(true);
    try {
      const result = await deleteGeneralServiceAction(serviceToDelete.id);
      if (result.success) {
        toast.success("Услугата е изтрита успешно");
        refetch();
      } else {
        toast.error(result.error);
      }
    } catch (err) {
      console.error("Delete general service error:", err);
      toast.error("Възникна грешка при изтриване");
    } finally {
      setIsDeleting(false);
      setServiceToDelete(null);
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-48 animate-pulse rounded-2xl bg-zinc-100 dark:bg-zinc-900/50"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="group relative max-w-md">
        <Search
          className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-zinc-400"
          strokeWidth={1.5}
        />
        <Input
          placeholder="Търсене на клубна услуга или наем..."
          value={searchTerm}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="h-9 rounded-xl border border-zinc-200 bg-white pl-9 text-xs shadow-none dark:border-zinc-800 dark:bg-zinc-900"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredServices.length > 0 ? (
          filteredServices.map((service) => {
            const isSelected = itemParam === service.id;
            const isCopied = copiedItemId === service.id;

            return (
              <ClubServiceCard
                key={service.id}
                service={service}
                isSelected={isSelected}
                isCopied={isCopied}
                onCopyLink={() => handleCopyLink(service)}
                onSale={() => openSale(service)}
                onDelete={() => setServiceToDelete(service)}
                refetch={refetch}
              />
            );
          })
        ) : (
          <div className="col-span-full rounded-2xl border-2 border-dashed border-zinc-200/80 bg-zinc-50/30 py-10 sm:py-14 text-center dark:border-zinc-800 dark:bg-zinc-900/10">
            <Wrench
              className="mx-auto mb-2 size-8 text-zinc-300 dark:text-zinc-700"
              strokeWidth={1.5}
            />
            <p className="text-xs sm:text-sm font-light text-zinc-400">
              Няма намерени клубни услуги
            </p>
            {searchTerm && (
              <Button
                variant="link"
                onClick={() => setSearchTerm("")}
                className="mt-1 text-xs text-blue-600 dark:text-blue-400 cursor-pointer"
              >
                Изчисти търсенето
              </Button>
            )}
          </div>
        )}
      </div>

      <AlertDialog
        open={!!serviceToDelete}
        onOpenChange={(open) => !open && setServiceToDelete(null)}
      >
        <AlertDialogContent className="max-h-[90dvh] w-[calc(100%-1.25rem)] sm:w-full sm:max-w-md rounded-2xl border border-zinc-200/80 bg-white p-4 sm:p-5 shadow-2xl dark:border-zinc-800 dark:bg-zinc-950">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white">
              Изтриване на услуга
            </AlertDialogTitle>
            <AlertDialogDescription className="mt-1 text-xs sm:text-sm leading-relaxed text-zinc-500">
              Сигурни ли сте, че искате да изтриете &quot;
              {serviceToDelete?.name}&quot;? Това действие не може да бъде
              отменено.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4 gap-2">
            <AlertDialogCancel
              disabled={isDeleting}
              className="rounded-xl border-zinc-200 text-xs dark:border-zinc-800"
            >
              Отказ
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="rounded-xl bg-red-600 text-xs text-white hover:bg-red-700"
            >
              {isDeleting ? "Изтриване..." : "Изтрий"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Dialog */}
      {selectedService && (
        <EditGeneralServiceDialog
          isOpen={isEditOpen}
          onClose={() => {
            setIsEditOpen(false);
            setSelectedService(null);
          }}
          service={selectedService}
          onServiceUpdate={() => {
            setIsEditOpen(false);
            setSelectedService(null);
            refetch();
          }}
        />
      )}

      {/* Sale Wizard Dialog */}
      {selectedService && (
        <UnifiedSaleWizardDialog
          isOpen={isSaleOpen}
          onClose={closeSale}
          item={selectedService}
          mode="general"
          onSaleSuccess={() => {
            closeSale();
            refetch();
          }}
        />
      )}
    </div>
  );
}

function ClubServiceCard({
  service,
  isSelected,
  isCopied,
  onCopyLink,
  onSale,
  onDelete,
  refetch,
}: {
  service: GeneralService;
  isSelected?: boolean;
  isCopied?: boolean;
  onCopyLink: () => void;
  onSale: () => void;
  onDelete: () => void;
  refetch: () => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasLongDesc = (service.description?.length || 0) > 120;

  const getPricingUnitLabel = (unit: string) => {
    switch (unit) {
      case "per_hour":
        return "На час";
      case "per_session":
        return "На сесия";
      case "fixed":
      default:
        return "Фиксирана";
    }
  };

  const getPricingUnitSuffix = (unit: string) => {
    switch (unit) {
      case "per_hour":
        return "/ час";
      case "per_session":
        return "/ сесия";
      case "fixed":
      default:
        return "/ еднократно";
    }
  };

  const isCourtRental =
    service.name.toLowerCase().includes("наем на корт") ||
    service.id.startsWith("court_rental");

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
      {service.imageUrl ? (
        <div className="relative h-28 sm:h-32 w-full overflow-hidden border-b border-zinc-100 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
          <Image
            src={service.imageUrl}
            alt={service.name}
            fill
            unoptimized={
              service.imageUrl.startsWith("/api/") ||
              service.imageUrl.includes("/api/upload") ||
              service.imageUrl.startsWith("data:")
            }
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-contain p-2 transition-transform duration-700 group-hover:scale-105"
          />

          {/* Pricing unit badge in bottom-left */}
          <div className="absolute bottom-2 left-2 z-10 flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 rounded-md border border-zinc-200/80 bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-zinc-700 shadow-2xs backdrop-blur-md dark:border-zinc-700 dark:bg-zinc-900/90 dark:text-zinc-200">
              <Wrench className="size-3 text-blue-600 dark:text-blue-400" />
              <span>{getPricingUnitLabel(service.pricingUnit)}</span>
            </span>
            {isSelected && (
              <span className="inline-flex items-center rounded-md border border-blue-300 bg-blue-600 px-1.5 py-0.5 text-[9px] font-bold text-white shadow-xs">
                Избрана
              </span>
            )}
          </div>

          {/* Quick Actions (Link & Menu) */}
          <div className="absolute top-2 right-2 z-10 flex items-center gap-1">
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

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Опции за клубната услуга"
                  className="size-7 rounded-lg border border-zinc-200/80 bg-white/90 text-zinc-600 shadow-2xs backdrop-blur-md hover:bg-white dark:border-zinc-800 dark:bg-zinc-900/90 dark:text-zinc-300 cursor-pointer"
                >
                  <MoreHorizontal className="size-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="min-w-40 rounded-xl p-1.5"
              >
                <DropdownMenuItem
                  onClick={onCopyLink}
                  className="gap-2 rounded-lg py-1.5 text-xs cursor-pointer"
                >
                  <Link2 className="size-3.5 text-zinc-400" /> Копирай линк
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link
                    href={`/catalogs/club-services/${service.id}/edit`}
                    className="flex w-full items-center gap-2 rounded-lg py-1.5 text-xs cursor-pointer"
                  >
                    <Edit className="size-3.5 text-zinc-400" /> Редактиране
                  </Link>
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
            <span className="inline-flex items-center gap-1.5 rounded-md border border-blue-200/80 bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300">
              <Wrench className="size-3 text-blue-600 dark:text-blue-400 shrink-0" />
              <span>{getPricingUnitLabel(service.pricingUnit)}</span>
            </span>

            {isSelected && (
              <span className="inline-flex items-center rounded-md border border-blue-200 bg-blue-100 px-1.5 py-0.5 text-[9px] font-bold text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300">
                Избрана
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
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

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Опции за клубната услуга"
                  className="size-7 rounded-lg border border-zinc-200/80 bg-white text-zinc-600 shadow-2xs hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 cursor-pointer"
                >
                  <MoreHorizontal className="size-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="min-w-40 rounded-xl p-1.5"
              >
                <DropdownMenuItem
                  onClick={onCopyLink}
                  className="gap-2 rounded-lg py-1.5 text-xs cursor-pointer"
                >
                  <Link2 className="size-3.5 text-zinc-400" /> Копирай линк
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link
                    href={`/catalogs/club-services/${service.id}/edit`}
                    className="flex w-full items-center gap-2 rounded-lg py-1.5 text-xs cursor-pointer"
                  >
                    <Edit className="size-3.5 text-zinc-400" /> Редактиране
                  </Link>
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
          {/* Title - Fully readable, no clipping */}
          <div>
            <h4 className="text-sm font-bold text-zinc-900 transition-colors group-hover:text-blue-600 sm:text-base leading-snug dark:text-zinc-100 dark:group-hover:text-blue-400">
              {service.name}
            </h4>

            {/* Performer info pill */}
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                <User size={12} className="text-zinc-400" />
                <span>Изпълнител: {service.performerName || "Клубът"}</span>
              </span>
              {service.performerType === "external" ? (
                <span className="rounded-md border border-amber-200 bg-amber-50 px-1.5 py-0.2 text-[9px] font-medium text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
                  Външен
                </span>
              ) : (
                <span className="rounded-md border border-emerald-200 bg-emerald-50 px-1.5 py-0.2 text-[9px] font-medium text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                  Клубен
                </span>
              )}
            </div>
          </div>

          {/* Description - fully readable with optional expander */}
          {service.description ? (
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
          ) : (
            <p className="text-xs italic text-zinc-400 dark:text-zinc-500">
              Няма добавено подробно описание.
            </p>
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
                {getPricingUnitSuffix(service.pricingUnit)}
              </span>
            </div>
          </div>

          {/* Action Buttons: 1-click Direct Sale + Details/Edit */}
          <div className="grid grid-cols-2 gap-2">
            {isCourtRental ? (
              <ReservationDialog
                onSave={refetch}
                initialData={{
                  courtId: 1,
                }}
              >
                <Button
                  type="button"
                  variant="default"
                  size="sm"
                  className="h-8.5 rounded-xl bg-blue-600 text-[11px] font-semibold tracking-wide text-white shadow-xs transition-colors hover:bg-blue-700 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <ShoppingCart size={13} />
                  <span>Резервирай</span>
                </Button>
              </ReservationDialog>
            ) : (
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
            )}

            <Button
              type="button"
              variant="outline"
              size="sm"
              asChild
              className="h-8.5 rounded-xl border-zinc-200 text-[11px] font-medium tracking-wide text-zinc-700 shadow-none transition-colors hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Link href={`/catalogs/club-services/${service.id}/edit`}>
                <Edit size={13} />
                <span>Редакция</span>
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </BentoCard>
  );
}
