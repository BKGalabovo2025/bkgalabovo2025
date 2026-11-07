"use client";

import { Download, Eye, Loader2, Pencil } from "lucide-react";
import Link from "next/link";
import React, { useState } from "react";
import { toast } from "sonner";

import { BusinessTripPdfTemplates } from "@/components/business-trips/BusinessTripPdfTemplates";
import { useTripDetails } from "@/components/business-trips/details/TripDetailsContext";
import { TripReportDialog } from "@/components/business-trips/TripReportDialog";
import { BentoCard } from "@/components/ui/bento-card";
import { Button } from "@/components/ui/button";
import { formatDateShort } from "@/lib/date-utils";

export function TripReportView() {
  const { trip, event, expenses, membersDict, refreshData } = useTripDetails();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);

  const total = expenses.reduce((sum, e) => sum + (e.amountEUR || 0), 0);

  const handlePrintOrDownload = (
    action: "download" | "preview" = "download"
  ) => {
    setIsGenerating(true);
    setTimeout(() => {
      const el = document.getElementById("pdf-report-template");
      if (el) {
        import("@/lib/html-to-pdf").then((m) => {
          const promise =
            action === "preview"
              ? m.previewPdfFromElement(el, "portrait")
              : m.generatePdfFromElement(
                  el,
                  `Доклад_Командировка_${trip.title}`,
                  "portrait"
                );

          promise
            .then(() => {
              if (action === "download") {
                toast.success("Докладът е генериран успешно.");
              }
            })
            .catch((e) => {
              console.error(e);
              toast.error("Грешка при генериране на доклада.");
            })
            .finally(() => {
              setIsGenerating(false);
            });
        });
      } else {
        setIsGenerating(false);
        toast.error("Шаблонът на доклада не бе намерен.");
      }
    }, 150);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
            Финансов & спортно-технически доклад
          </h2>
          <p className="text-xs text-zinc-500">
            Обобщен отчет за постигнати резултати и разходвани средства
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsReportDialogOpen(true)}
            className="rounded-xl border-zinc-200 text-xs font-semibold dark:border-zinc-800"
            title="Редактирай текста на доклада, резултати и класирания"
          >
            <Pencil className="mr-1.5 size-3.5 text-zinc-600 dark:text-zinc-400" />
            Редактирай доклад
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePrintOrDownload("preview")}
            disabled={isGenerating}
            className="rounded-xl border-zinc-200 text-xs font-semibold dark:border-zinc-800"
            title="Преглед в нов прозорец за печат"
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
            Изтегли Доклад (PDF)
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <BentoCard className="space-y-4 rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-none dark:border-zinc-800 dark:bg-zinc-950">
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-white">
            Финансово обобщение
          </h3>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between border-b border-zinc-100 py-1.5 dark:border-zinc-800">
              <span className="text-zinc-500">Общо разходи:</span>
              <span className="font-bold text-zinc-900 dark:text-white">
                <Link
                  href={`/accounting/trips/${trip.id}/expenses`}
                  title="Към детайлните разходи"
                  className="hover:underline hover:text-blue-600 dark:hover:text-blue-400"
                >
                  €{total.toFixed(2)} ({(total * 1.95583).toFixed(2)} лв.)
                </Link>
              </span>
            </div>
            <div className="flex justify-between border-b border-zinc-100 py-1.5 dark:border-zinc-800">
              <span className="text-zinc-500">Брой фактури:</span>
              <span className="font-medium text-zinc-900 dark:text-white">
                <Link
                  href={`/accounting/trips/${trip.id}/expenses`}
                  title="Към детайлните разходи"
                  className="hover:underline hover:text-blue-600 dark:hover:text-blue-400"
                >
                  {expenses.length} бр.
                </Link>
              </span>
            </div>
            <div className="flex justify-between border-b border-zinc-100 py-1.5 dark:border-zinc-800">
              <span className="text-zinc-500">Статус на отчитане:</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                {trip.status === "completed"
                  ? "Окончателно отчетена"
                  : "В процес на отчитане"}
              </span>
            </div>
          </div>
        </BentoCard>

        <BentoCard className="space-y-4 rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-none dark:border-zinc-800 dark:bg-zinc-950">
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-white">
            Параметри на пътуването
          </h3>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between border-b border-zinc-100 py-1.5 dark:border-zinc-800">
              <span className="text-zinc-500">Място:</span>
              <span className="font-semibold text-zinc-900 dark:text-white">
                {trip.destination}
              </span>
            </div>
            <div className="flex justify-between border-b border-zinc-100 py-1.5 dark:border-zinc-800">
              <span className="text-zinc-500">Период:</span>
              <span className="text-zinc-700 dark:text-zinc-300">
                {formatDateShort(trip.startDate)} –{" "}
                {formatDateShort(trip.endDate)}
              </span>
            </div>
            <div className="flex justify-between border-b border-zinc-100 py-1.5 dark:border-zinc-800">
              <span className="text-zinc-500">Участници:</span>
              <span className="text-zinc-700 dark:text-zinc-300">
                <Link
                  href={`/accounting/trips/${trip.id}/athletes`}
                  title="Към списъка със състезатели"
                  className="hover:underline hover:text-blue-600 dark:hover:text-blue-400"
                >
                  {trip.participantsIds?.length || 0} състезатели
                </Link>
              </span>
            </div>
          </div>
        </BentoCard>
      </div>

      {/* PDF template (positioned off-screen for clean capture) */}
      <BusinessTripPdfTemplates
        trip={trip}
        event={event || undefined}
        membersDict={membersDict}
        expenses={expenses}
      />

      {isReportDialogOpen && (
        <TripReportDialog
          open={isReportDialogOpen}
          onOpenChange={setIsReportDialogOpen}
          trip={trip}
          event={event}
          expenses={expenses}
          membersDict={membersDict}
          onSuccess={() => {
            setIsReportDialogOpen(false);
            refreshData();
          }}
        />
      )}
    </div>
  );
}
