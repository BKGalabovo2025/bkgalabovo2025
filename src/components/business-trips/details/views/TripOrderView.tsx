"use client";

import { Download, Loader2 } from "lucide-react";
import React, { useState } from "react";
import { toast } from "sonner";

import { BusinessTripPdfTemplates } from "@/components/business-trips/BusinessTripPdfTemplates";
import { useTripDetails } from "@/components/business-trips/details/TripDetailsContext";
import { BentoCard } from "@/components/ui/bento-card";
import { Button } from "@/components/ui/button";
import { getTripOrderNumber } from "@/lib/business-trip-numbers";
import { formatDateShort } from "@/lib/date-utils";
import { businessTripService } from "@/services/business-trip-service";

export function TripOrderView() {
  const { trip, event, expenses, membersDict, refreshData } = useTripDetails();
  const [isGenerating, setIsGenerating] = useState(false);

  const num = getTripOrderNumber(trip);

  const handlePrintOrDownload = () => {
    setIsGenerating(true);
    setTimeout(() => {
      const el = document.getElementById("pdf-order-template");
      if (el) {
        import("@/lib/html-to-pdf").then((m) => {
          m.generatePdfFromElement(
            el,
            `Заповед_${num}_${trip.title}`,
            "portrait"
          )
            .then(() => {
              toast.success("Заповедта е генерирана успешно.");
              if (trip.id) {
                businessTripService
                  .updateTrip(trip.id, {
                    orderDownloadedAt: new Date().toISOString(),
                  })
                  .then(refreshData)
                  .catch(console.error);
              }
            })
            .catch((e) => {
              console.error(e);
              toast.error("Грешка при генериране на PDF документ.");
            })
            .finally(() => {
              setIsGenerating(false);
            });
        });
      } else {
        setIsGenerating(false);
        toast.error("Шаблонът не бе намерен.");
      }
    }, 150);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
            Заповед за командировка № {num}
          </h2>
          <p className="text-xs text-zinc-500">
            Официален документ, издаден от Председателя на Бадминтон клуб
            Гълъбово
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => handlePrintOrDownload()}
            disabled={isGenerating}
            className="rounded-xl bg-blue-600 text-xs font-bold text-white hover:bg-blue-700"
          >
            {isGenerating ? (
              <Loader2 className="mr-1.5 size-3.5 animate-spin" />
            ) : (
              <Download className="mr-1.5 size-3.5" />
            )}
            Изтегли Заповед (PDF)
          </Button>
        </div>
      </div>

      <BentoCard className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-none dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mx-auto max-w-2xl space-y-4 text-xs">
          <div className="border-b border-zinc-100 pb-4 dark:border-zinc-800">
            <span className="font-semibold text-zinc-400 uppercase tracking-wider text-[10px]">
              Клубен издател:
            </span>
            <p className="font-bold text-zinc-900 dark:text-white">
              Сдружение „Бадминтон клуб Гълъбово“
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-zinc-500">Командировано лице:</span>
              <p className="font-bold text-zinc-900 dark:text-white">
                {trip.coachName || "—"}
              </p>
            </div>
            <div>
              <span className="text-zinc-500">Длъжност:</span>
              <p className="font-bold text-zinc-900 dark:text-white">
                {trip.coachRole || "Треньор / Ръководител"}
              </p>
            </div>
            <div>
              <span className="text-zinc-500">Дестинация:</span>
              <p className="font-bold text-zinc-900 dark:text-white">
                {trip.destination}
              </p>
            </div>
            <div>
              <span className="text-zinc-500">Период:</span>
              <p className="font-bold text-zinc-900 dark:text-white">
                {formatDateShort(trip.startDate)} –{" "}
                {formatDateShort(trip.endDate)}
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-zinc-100 bg-zinc-50/60 p-4 dark:border-zinc-800 dark:bg-zinc-900/40">
            <span className="text-zinc-500">Основание / Събитие:</span>
            <p className="font-semibold text-zinc-900 dark:text-white">
              {trip.title}
            </p>
            {trip.orderDownloadedAt && (
              <p className="mt-2 text-[10px] text-emerald-600 dark:text-emerald-400">
                ✓ Последно изтеглена:{" "}
                {new Date(trip.orderDownloadedAt).toLocaleString("bg-BG")}
              </p>
            )}
          </div>
        </div>
      </BentoCard>

      {/* Hidden PDF template for direct download/export */}
      <div className="hidden">
        <BusinessTripPdfTemplates
          trip={trip}
          event={event || undefined}
          membersDict={membersDict}
          expenses={expenses}
        />
      </div>
    </div>
  );
}
