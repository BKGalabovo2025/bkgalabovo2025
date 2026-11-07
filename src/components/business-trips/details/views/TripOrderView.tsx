"use client";

import { Download, Eye, Loader2, Pencil } from "lucide-react";
import React, { useState } from "react";
import { toast } from "sonner";

import { BusinessTripPdfTemplates } from "@/components/business-trips/BusinessTripPdfTemplates";
import { CreateBusinessTripDialog } from "@/components/business-trips/CreateBusinessTripDialog";
import { useTripDetails } from "@/components/business-trips/details/TripDetailsContext";
import { Badge } from "@/components/ui/badge";
import { BentoCard } from "@/components/ui/bento-card";
import { Button } from "@/components/ui/button";
import { getTripOrderNumber } from "@/lib/business-trip-numbers";
import { formatDateShort } from "@/lib/date-utils";
import { businessTripService } from "@/services/business-trip-service";
import { ScheduleEvent } from "@/types";

export function TripOrderView() {
  const { trip, event, expenses, membersDict, refreshData } = useTripDetails();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const effectiveEvent: ScheduleEvent =
    event ||
    ({
      id: trip.eventId || trip.id || "event",
      title: trip.title,
      startDate: trip.startDate,
      endDate: trip.endDate,
      type: "competition",
      siteId: trip.siteId,
      description: trip.destination,
      location: trip.destination || "",
      attendees: [],
      attendeeMemberIds: [],
    } as unknown as ScheduleEvent);

  const num = getTripOrderNumber(trip);
  const isDailyCommute = trip.vehicle?.commuteMode === "daily_commute";

  const handlePrintOrDownload = (
    action: "download" | "preview" = "download"
  ) => {
    setIsGenerating(true);
    setTimeout(() => {
      const el = document.getElementById("pdf-order-template");
      if (el) {
        import("@/lib/html-to-pdf").then((m) => {
          const promise =
            action === "preview"
              ? m.previewPdfFromElement(el, "portrait")
              : m.generatePdfFromElement(
                  el,
                  `Заповед_${num}_${trip.title}`,
                  "portrait"
                );

          promise
            .then(() => {
              if (action === "download") {
                toast.success("Заповедта е генерирана успешно.");
                if (trip.id) {
                  businessTripService
                    .updateTrip(trip.id, {
                      orderDownloadedAt: new Date().toISOString(),
                    })
                    .then(refreshData)
                    .catch(console.error);
                }
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

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditDialogOpen(true)}
            className="rounded-xl border-zinc-200 text-xs font-semibold dark:border-zinc-800"
            title="Редактирай параметри на нареждането"
          >
            <Pencil className="mr-1.5 size-3.5 text-zinc-600 dark:text-zinc-400" />
            Редактирай нареждане
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePrintOrDownload("preview")}
            disabled={isGenerating}
            className="rounded-xl border-zinc-200 text-xs font-semibold dark:border-zinc-800"
            title="Преглед на заповедта в нов прозорец за печат"
          >
            <Eye className="mr-1.5 size-3.5 text-blue-600 dark:text-blue-400" />
            Преглед
          </Button>

          <Button
            onClick={() => handlePrintOrDownload("download")}
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
          <div className="border-b border-zinc-100 pb-4 dark:border-zinc-800 flex items-center justify-between">
            <div>
              <span className="font-semibold text-zinc-400 uppercase tracking-wider text-[10px]">
                Клубен издател:
              </span>
              <p className="font-bold text-zinc-900 dark:text-white">
                Сдружение „Бадминтон клуб Гълъбово“
              </p>
            </div>
            <Badge
              variant="outline"
              className={
                isDailyCommute
                  ? "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-300"
                  : "border-blue-300 bg-blue-50 text-blue-800 dark:border-blue-800 dark:bg-blue-950/50 dark:text-blue-300"
              }
            >
              {isDailyCommute
                ? "🔄 Ежедневно пътуване (без нощувка)"
                : "🏨 Еднократно пътуване (с престой)"}
            </Badge>
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
            <div>
              <span className="text-zinc-500">Транспорт:</span>
              <p className="font-semibold text-zinc-900 dark:text-white">
                {trip.transportType === "fuel_only"
                  ? `Личен автомобил (${trip.vehicle?.brand || "—"}, ${trip.vehicle?.regNumber || "—"})`
                  : trip.transportType === "club_paid"
                    ? "Клубен транспорт"
                    : "Обществен транспорт"}
              </p>
            </div>
            <div>
              <span className="text-zinc-500">Покрити разходи:</span>
              <p className="font-semibold text-zinc-900 dark:text-white">
                {trip.expensesCoverage === "transport_only" &&
                  "Само транспорт (гориво)"}
                {trip.expensesCoverage === "food_only" && "Само дневни пари"}
                {trip.expensesCoverage === "food_and_sleep" &&
                  "Дневни + Нощувки"}
                {trip.expensesCoverage === "transport_and_food" &&
                  "Транспорт + Дневни пари"}
                {(!trip.expensesCoverage ||
                  trip.expensesCoverage === "transport_food_sleep") &&
                  "Пълен пакет (Транспорт + Храна + Нощувки)"}
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

      {/* PDF template (positioned off-screen for clean capture) */}
      <BusinessTripPdfTemplates
        trip={trip}
        event={event || undefined}
        membersDict={membersDict}
        expenses={expenses}
      />

      {isEditDialogOpen && (
        <CreateBusinessTripDialog
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          event={effectiveEvent}
          initialData={trip}
          membersDict={membersDict}
          onSuccess={() => {
            setIsEditDialogOpen(false);
            refreshData();
          }}
        />
      )}
    </div>
  );
}
