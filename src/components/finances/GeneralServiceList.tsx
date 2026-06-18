/* eslint-disable sonarjs/no-nested-conditional */
/* eslint-disable sonarjs/cognitive-complexity */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import Image from "next/image";
import { formatPrice } from "@/lib/currency";
import { GeneralService } from "@/types";
import {
  Wrench,
  Edit2,
  Trash2,
  ImageIcon,
  Search,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { BentoCard } from "@/components/ui/bento-card";
import { Button } from "@/components/ui/button";
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
import { useGeneralServices } from "@/hooks/useGeneralServices";
import { EditGeneralServiceDialog } from "./EditGeneralServiceDialog";
import { GeneralServiceSaleWizardDialog } from "./GeneralServiceSaleWizardDialog";
import { deleteGeneralServiceAction } from "@/lib/actions/general-services-server";
import { toast } from "sonner";
import { ReservationDialog } from "@/components/reservations/reservation-dialog";

export function GeneralServiceList() {
  const { services, isLoading, refetch } = useGeneralServices();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedService, setSelectedService] = useState<GeneralService | null>(null);
  
  // Dialog states
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isSaleOpen, setIsSaleOpen] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState<GeneralService | null>(null);
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-64 rounded-5xl bg-zinc-100 dark:bg-zinc-900/50 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="relative group max-w-md mb-8">
        <Search
          className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 group-focus-within:text-primary transition-colors"
          strokeWidth={1.5}
        />
        <Input
          placeholder="Търсене на клубна услуга..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-11 h-12 rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-none focus-visible:ring-1 focus-visible:ring-primary/30 transition-all font-light text-sm"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredServices.length > 0 ? (
          filteredServices.map((service) => (
            <BentoCard
              key={service.id}
              className="group overflow-hidden transition-all duration-500 flex flex-col border border-zinc-100 dark:border-zinc-900 shadow-none bg-white dark:bg-zinc-950 rounded-4xl hover:shadow-xl hover:shadow-zinc-100/20 dark:hover:shadow-none"
            >
              <div className="relative h-64 bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center overflow-hidden border-b border-zinc-50 dark:border-zinc-800">
                {service.imageUrl ? (
                  <Image
                    src={service.imageUrl}
                    alt={service.name}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover group-hover:scale-110 transition-transform duration-1000"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-900 text-zinc-200 dark:text-zinc-800">
                    <ImageIcon className="h-16 w-16 mb-2 opacity-20" strokeWidth={1} />
                    <span className="text-[10px] font-medium uppercase tracking-[0.3em] opacity-40">
                      No Image
                    </span>
                  </div>
                )}

                <div className="absolute top-6 right-6 flex gap-2 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                  <Button
                    variant="secondary"
                    size="icon"
                    className="h-10 w-10 rounded-xl bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md shadow-none border border-zinc-100 dark:border-zinc-800 hover:bg-white dark:hover:bg-zinc-800 transition-all"
                    onClick={() => {
                      setSelectedService(service);
                      setIsEditOpen(true);
                    }}
                  >
                    <Edit2 className="h-4 w-4 text-zinc-600 dark:text-zinc-400" strokeWidth={1.5} />
                  </Button>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="h-10 w-10 rounded-xl bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md shadow-none border border-zinc-100 dark:border-zinc-800 hover:bg-rose-50 dark:hover:bg-rose-900/20 hover:text-rose-600 transition-all"
                    onClick={() => setServiceToDelete(service)}
                  >
                    <Trash2 className="h-4 w-4 text-rose-500" strokeWidth={1.5} />
                  </Button>
                </div>

                <div className="absolute bottom-6 left-6">
                  <div className="px-4 py-2 rounded-xl text-[11px] font-medium uppercase tracking-widest backdrop-blur-md border bg-white/80 dark:bg-zinc-900/80 border-zinc-100 dark:border-zinc-800 text-zinc-900 dark:text-white">
                    {{ fixed: "Фиксирана", per_hour: "На час", per_session: "На сесия" }[service.pricingUnit] || service.pricingUnit}
                  </div>
                </div>
              </div>

              <div className="p-8 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start gap-4 mb-2">
                    <h3 className="text-lg font-medium leading-snug text-zinc-900 dark:text-zinc-50 group-hover:text-primary transition-colors line-clamp-2 min-h-14 flex items-center">
                      {service.name}
                    </h3>
                  </div>
                  <p className="text-zinc-400 text-[10px] font-medium uppercase tracking-[0.2em] mb-6 line-clamp-1">
                    Изпълнител: {service.performerName}
                  </p>
                </div>

                <div className="pt-6 border-t border-zinc-100 dark:border-zinc-900 space-y-5">
                  <div className="flex justify-between items-baseline">
                    <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-widest leading-none">
                      Цена
                    </span>
                    <span className="text-2xl font-light text-zinc-900 dark:text-white tracking-tight leading-none">
                      {formatPrice(service.price)}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 w-full">
                    {service.name.toLowerCase().includes("наем на корт") || service.id.startsWith("court_rental") ? (
                      <ReservationDialog
                        onSave={refetch}
                        initialData={{
                          courtId: 1,
                        }}
                      >
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full h-11 rounded-xl font-medium text-[10px] uppercase tracking-widest border-zinc-200 text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900 transition-all shadow-none"
                        >
                          Продажба
                        </Button>
                      </ReservationDialog>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedService(service);
                          setIsSaleOpen(true);
                        }}
                        className="w-full h-11 rounded-xl font-medium text-[10px] uppercase tracking-widest border-zinc-200 text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900 transition-all shadow-none"
                      >
                        Продажба
                      </Button>
                    )}
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => {
                        setSelectedService(service);
                        setIsEditOpen(true);
                      }}
                      className="w-full h-11 rounded-xl font-medium text-[10px] uppercase tracking-widest bg-zinc-950 text-white hover:bg-zinc-800 transition-all shadow-none border-none"
                    >
                      Детайли
                    </Button>
                  </div>
                </div>
              </div>
            </BentoCard>
          ))
        ) : (
          <div className="col-span-full py-40 text-center bg-zinc-50/30 dark:bg-zinc-900/10 rounded-4xl border-2 border-dashed border-zinc-100 dark:border-zinc-900">
            <Wrench
              className="h-16 w-16 text-zinc-200 dark:text-zinc-800 mx-auto mb-8"
              strokeWidth={1}
            />
            <p className="text-zinc-400 font-medium uppercase tracking-widest text-[11px]">
              Няма намерени услуги
            </p>
            {searchTerm && (
              <Button
                variant="link"
                onClick={() => setSearchTerm("")}
                className="mt-4 text-emerald-500 font-medium text-[11px] uppercase tracking-widest"
              >
                Изчисти търсенето
              </Button>
            )}
          </div>
        )}
      </div>

      <AlertDialog open={!!serviceToDelete} onOpenChange={(open) => !open && setServiceToDelete(null)}>
        <AlertDialogContent className="rounded-5xl border-none shadow-2xl bg-white dark:bg-zinc-950 p-10 max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-light text-zinc-900 dark:text-white leading-tight">
              Изтриване на услуга
            </AlertDialogTitle>
            <AlertDialogDescription className="font-light text-zinc-500 text-sm mt-4 leading-relaxed">
              Сигурни ли сте, че искате да изтриете услугата &quot;{serviceToDelete?.name}&quot;? Това действие не може да бъде отменено.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-10 gap-3">
            <AlertDialogCancel
              disabled={isDeleting}
              className="rounded-xl font-medium text-[11px] uppercase tracking-widest h-12 px-6 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50"
            >
              Отказ
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-rose-500 text-white hover:bg-rose-600 rounded-xl font-medium text-[11px] uppercase tracking-widest h-12 px-8 shadow-none"
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
        <GeneralServiceSaleWizardDialog
          isOpen={isSaleOpen}
          onClose={() => {
            setIsSaleOpen(false);
            setSelectedService(null);
          }}
          service={selectedService}
          onSaleSuccess={() => {
            setIsSaleOpen(false);
            setSelectedService(null);
            refetch();
          }}
        />
      )}
    </div>
  );
}
