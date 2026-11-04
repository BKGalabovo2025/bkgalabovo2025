"use client";

import {
  Check,
  Edit2,
  ImageIcon,
  Link2,
  Search,
  Trash2,
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
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-64 animate-pulse rounded-5xl bg-zinc-100 dark:bg-zinc-900/50"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="group relative mb-8 max-w-md">
        <Search
          className="absolute top-1/2 left-4 size-4 -translate-y-1/2 text-zinc-400 transition-colors group-focus-within:text-primary"
          strokeWidth={1.5}
        />
        <Input
          placeholder="Търсене на клубна услуга..."
          value={searchTerm}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="h-12 rounded-2xl border border-zinc-100 bg-white pl-11 text-sm font-light shadow-none transition-all focus-visible:ring-1 focus-visible:ring-primary/30 dark:border-zinc-800 dark:bg-zinc-900"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filteredServices.length > 0 ? (
          filteredServices.map((service) => {
            const isSelected = itemParam === service.id;
            const isCopied = copiedItemId === service.id;

            return (
              <BentoCard
                id={`item-${service.id}`}
                key={service.id}
                className={cn(
                  "group flex flex-col overflow-hidden rounded-2xl border bg-white shadow-none transition-all duration-300 dark:bg-zinc-950",
                  isSelected
                    ? "border-blue-500 ring-2 ring-blue-500/80 shadow-lg dark:border-blue-400 dark:ring-blue-400/80 bg-blue-50/15 dark:bg-blue-950/20"
                    : "border-zinc-200/80 hover:border-zinc-300 hover:shadow-md dark:border-zinc-800"
                )}
              >
                <div className="relative flex h-44 items-center justify-center overflow-hidden border-b border-zinc-100 bg-zinc-50 sm:h-48 dark:border-zinc-800 dark:bg-zinc-900">
                  {service.imageUrl ? (
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
                      className="object-contain p-3 transition-transform duration-700 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex size-full flex-col items-center justify-center bg-zinc-50 text-zinc-200 dark:bg-zinc-900 dark:text-zinc-800">
                      <ImageIcon
                        className="mb-1.5 size-12 opacity-20"
                        strokeWidth={1}
                      />
                      <span className="text-[9px] font-medium tracking-[0.2em] uppercase opacity-40">
                        No Image
                      </span>
                    </div>
                  )}

                  <div className="absolute top-3 right-3 flex translate-y-0 sm:translate-y-1 gap-1.5 opacity-100 sm:opacity-0 transition-all duration-300 sm:group-hover:translate-y-0 sm:group-hover:opacity-100">
                    <Button
                      variant="secondary"
                      size="icon"
                      onClick={() => handleCopyLink(service)}
                      className="size-8 rounded-lg border border-zinc-100 bg-white/90 shadow-none backdrop-blur-md transition-all hover:bg-white dark:border-zinc-800 dark:bg-zinc-900/90 dark:hover:bg-zinc-800 cursor-pointer"
                      title={`Копирай директен линк към ${service.name}`}
                      aria-label={`Копирай директен линк към ${service.name}`}
                    >
                      {isCopied ? (
                        <Check className="size-3.5 text-emerald-600" />
                      ) : (
                        <Link2 className="size-3.5 text-zinc-600 dark:text-zinc-400" />
                      )}
                    </Button>
                    <Button
                      variant="secondary"
                      size="icon"
                      asChild
                      className="size-8 rounded-lg border border-zinc-100 bg-white/90 shadow-none backdrop-blur-md transition-all hover:bg-white dark:border-zinc-800 dark:bg-zinc-900/90 dark:hover:bg-zinc-800"
                      title={`Редактирай ${service.name}`}
                      aria-label={`Редактирай ${service.name}`}
                    >
                      <Link href={`/catalogs/club-services/${service.id}/edit`}>
                        <Edit2
                          className="size-3.5 text-zinc-600 dark:text-zinc-400"
                          strokeWidth={1.5}
                        />
                      </Link>
                    </Button>
                    <Button
                      variant="secondary"
                      size="icon"
                      className="size-8 rounded-lg border border-zinc-100 bg-white/90 shadow-none backdrop-blur-md transition-all hover:bg-rose-50 hover:text-rose-600 dark:border-zinc-800 dark:bg-zinc-900/90 dark:hover:bg-rose-900/20"
                      onClick={() => setServiceToDelete(service)}
                      title={`Изтрий ${service.name}`}
                      aria-label={`Изтрий ${service.name}`}
                    >
                      <Trash2
                        className="size-3.5 text-rose-500"
                        strokeWidth={1.5}
                      />
                    </Button>
                  </div>

                  <div className="absolute bottom-3 left-3">
                    <div className="rounded-md border border-zinc-200/80 bg-white/85 px-2.5 py-1 text-[9px] font-medium tracking-widest text-zinc-900 uppercase backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/85 dark:text-white">
                      {{
                        fixed: "Фиксирана",
                        per_hour: "На час",
                        per_session: "На сесия",
                      }[service.pricingUnit] || service.pricingUnit}
                    </div>
                  </div>
                </div>

                <div className="flex flex-1 flex-col justify-between p-4 sm:p-5">
                  <div>
                    <div className="mb-1.5 flex items-start justify-between gap-2">
                      <h3 className="line-clamp-2 flex min-h-10 items-center text-base leading-snug font-medium text-zinc-900 transition-colors group-hover:text-primary sm:text-lg dark:text-zinc-50">
                        {service.name}
                      </h3>
                      <button
                        type="button"
                        onClick={() => handleCopyLink(service)}
                        className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[10px] font-semibold text-zinc-600 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:border-blue-700 dark:hover:text-blue-300 transition-all cursor-pointer shrink-0 shadow-2xs mt-1"
                        title={`Копирай директен линк към ${service.name}`}
                        aria-label={`Копирай директен линк към ${service.name}`}
                      >
                        {isCopied ? (
                          <>
                            <Check
                              size={11}
                              className="text-emerald-600 dark:text-emerald-400"
                            />
                            <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                              Копирано!
                            </span>
                          </>
                        ) : (
                          <>
                            <Link2 size={11} />
                            <span>Линк</span>
                          </>
                        )}
                      </button>
                    </div>
                    <p className="mb-3 line-clamp-1 text-[10px] font-medium tracking-[0.2em] text-zinc-400 uppercase">
                      Изпълнител: {service.performerName}
                    </p>
                  </div>

                  <div className="space-y-3.5 border-t border-zinc-100 pt-3.5 dark:border-zinc-800">
                    <div className="flex items-baseline justify-between">
                      <span className="text-[10px] leading-none font-medium tracking-widest text-zinc-400 uppercase">
                        Цена
                      </span>
                      <span className="text-xl leading-none font-light tracking-tight text-zinc-900 sm:text-2xl dark:text-white">
                        {formatPrice(service.price)}
                      </span>
                    </div>
                    <div className="grid w-full grid-cols-2 gap-2.5">
                      {service.name.toLowerCase().includes("наем на корт") ||
                      service.id.startsWith("court_rental") ? (
                        <ReservationDialog
                          onSave={refetch}
                          initialData={{
                            courtId: 1,
                          }}
                        >
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-9 w-full rounded-xl border-zinc-200 text-[10px] font-medium tracking-widest text-zinc-700 uppercase shadow-none transition-all hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900"
                          >
                            Продажба
                          </Button>
                        </ReservationDialog>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openSale(service)}
                          className="h-9 w-full rounded-xl border-zinc-200 text-[10px] font-medium tracking-widest text-zinc-700 uppercase shadow-none transition-all hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900"
                        >
                          Продажба
                        </Button>
                      )}
                      <Button
                        variant="default"
                        size="sm"
                        asChild
                        className="h-9 w-full rounded-xl border-none bg-zinc-950 text-[10px] font-medium tracking-widest text-white uppercase shadow-none transition-all hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
                      >
                        <Link
                          href={`/catalogs/club-services/${service.id}/edit`}
                        >
                          Детайли
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </BentoCard>
            );
          })
        ) : (
          <div className="col-span-full rounded-2xl border-2 border-dashed border-zinc-200/80 bg-zinc-50/30 py-10 sm:py-14 text-center dark:border-zinc-800 dark:bg-zinc-900/10">
            <Wrench
              className="mx-auto mb-3 size-10 text-zinc-300 dark:text-zinc-700"
              strokeWidth={1.5}
            />
            <p className="text-[10px] sm:text-[11px] font-medium tracking-widest text-zinc-400 uppercase">
              Няма намерени услуги
            </p>
            {searchTerm && (
              <Button
                variant="link"
                onClick={() => setSearchTerm("")}
                className="mt-2 text-[10px] sm:text-[11px] font-medium tracking-widest text-emerald-500 uppercase"
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
              Сигурни ли сте, че искате да изтриете услугата &quot;
              {serviceToDelete?.name}&quot;? Това действие не може да бъде
              отменено.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4 gap-2 sm:gap-2">
            <AlertDialogCancel
              disabled={isDeleting}
              className="h-9 rounded-xl border-zinc-200 bg-white px-4 text-xs font-semibold hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900"
            >
              Отказ
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="h-9 rounded-xl bg-rose-500 px-5 text-xs font-bold text-white shadow-none hover:bg-rose-600"
            >
              {isDeleting ? "Изтриване..." : "Изтрий"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {isEditOpen && (
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

      {isSaleOpen && selectedService && (
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
