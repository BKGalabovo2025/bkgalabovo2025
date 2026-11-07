"use client";

import { Download, Eye, FileText, Loader2, Pencil } from "lucide-react";
import React, { useState } from "react";
import { toast } from "sonner";

import { BusinessTripPdfTemplates } from "@/components/business-trips/BusinessTripPdfTemplates";
import { useTripDetails } from "@/components/business-trips/details/TripDetailsContext";
import { TripProtocolDialog } from "@/components/business-trips/TripProtocolDialog";
import { BentoCard } from "@/components/ui/bento-card";
import { Button } from "@/components/ui/button";
import {
  getTripDecisionNumber,
  getTripProtocolNumber,
} from "@/lib/business-trip-numbers";
import { businessTripService } from "@/services/business-trip-service";

export function TripProtocolView() {
  const { trip, event, expenses, membersDict, refreshData } = useTripDetails();
  const [isGenerating, setIsGenerating] = useState<string | null>(null);
  const [isProtocolDialogOpen, setIsProtocolDialogOpen] = useState(false);

  const protocolNum = getTripProtocolNumber(trip);
  const decisionNum = getTripDecisionNumber(trip);

  const handlePrintOrDownload = (
    docType: "protocol" | "decision",
    action: "download" | "preview" = "download"
  ) => {
    const key = `${docType}-${action}`;
    setIsGenerating(key);
    setTimeout(() => {
      const templateId =
        docType === "protocol"
          ? "pdf-board-protocol-template"
          : "pdf-board-decision-template";
      const el = document.getElementById(templateId);
      if (el) {
        import("@/lib/html-to-pdf").then((m) => {
          const title =
            docType === "protocol"
              ? `Протокол_УС_${protocolNum}_${trip.title}`
              : `Решение_УС_${decisionNum}_${trip.title}`;

          const promise =
            action === "preview"
              ? m.previewPdfFromElement(el, "portrait")
              : m.generatePdfFromElement(el, title, "portrait");

          promise
            .then(() => {
              if (action === "download") {
                toast.success(
                  `${docType === "protocol" ? "Протоколът" : "Решението"} на УС е генерирано успешно.`
                );
                if (trip.id) {
                  const patch =
                    docType === "protocol"
                      ? { protocolDownloadedAt: new Date().toISOString() }
                      : { decisionDownloadedAt: new Date().toISOString() };
                  businessTripService
                    .updateTrip(trip.id, patch)
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
              setIsGenerating(null);
            });
        });
      } else {
        setIsGenerating(null);
        toast.error("Шаблонът на документа не бе намерен.");
      }
    }, 150);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
            Решение и Протокол на Управителния съвет № {protocolNum}
          </h2>
          <p className="text-xs text-zinc-500">
            Официален протокол за гласуване и одобрение на командировъчните
            разходи
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsProtocolDialogOpen(true)}
            className="rounded-xl border-zinc-200 text-xs font-semibold dark:border-zinc-800"
            title="Редактирай протокола и решението (дата, членове, място, мотиви)"
          >
            <Pencil className="mr-1.5 size-3.5 text-zinc-600 dark:text-zinc-400" />
            Редактирай Протокол & Решение
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePrintOrDownload("protocol", "preview")}
            disabled={Boolean(isGenerating)}
            className="rounded-xl border-zinc-200 text-xs font-semibold dark:border-zinc-800"
            title="Преглед в нов прозорец за печат"
          >
            <Eye className="mr-1.5 size-3.5 text-blue-600 dark:text-blue-400" />
            Преглед
          </Button>

          <Button
            onClick={() => handlePrintOrDownload("decision", "download")}
            disabled={Boolean(isGenerating)}
            variant="outline"
            size="sm"
            className="rounded-xl border-emerald-300 bg-emerald-50 text-xs font-bold text-emerald-800 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
          >
            {isGenerating === "decision-download" ? (
              <Loader2 className="mr-1.5 size-3.5 animate-spin" />
            ) : (
              <FileText className="mr-1.5 size-3.5" />
            )}
            Решение {decisionNum} (PDF)
          </Button>

          <Button
            onClick={() => handlePrintOrDownload("protocol", "download")}
            disabled={Boolean(isGenerating)}
            className="rounded-xl bg-blue-600 text-xs font-bold text-white hover:bg-blue-700"
          >
            {isGenerating === "protocol-download" ? (
              <Loader2 className="mr-1.5 size-3.5 animate-spin" />
            ) : (
              <Download className="mr-1.5 size-3.5" />
            )}
            Изтегли Протокол (PDF)
          </Button>
        </div>
      </div>

      <BentoCard className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-none dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mx-auto max-w-2xl space-y-4 text-xs">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <span className="text-zinc-500">Решение на УС №:</span>
              <p className="font-bold text-zinc-900 dark:text-white">
                {trip.usDecision || "—"}
              </p>
            </div>
            <div>
              <span className="text-zinc-500">Дата на заседанието:</span>
              <p className="font-bold text-zinc-900 dark:text-white">
                {trip.usDecisionDate || "—"}
              </p>
            </div>
            <div>
              <span className="text-zinc-500">Място на провеждане:</span>
              <p className="font-bold text-zinc-900 dark:text-white">
                {trip.usMeetingLocation || "гр. Гълъбово, зала по бадминтон"}
              </p>
            </div>
            <div>
              <span className="text-zinc-500">Присъстващи членове на УС:</span>
              <p className="font-bold text-zinc-900 dark:text-white">
                {trip.usBoardMembers || "Всички членове на Управителния съвет"}
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-zinc-100 bg-zinc-50/60 p-4 dark:border-zinc-800 dark:bg-zinc-900/40">
            <span className="text-zinc-500">
              Допълнителни решения и бележки:
            </span>
            <p className="mt-1 leading-relaxed text-zinc-800 dark:text-zinc-200">
              {trip.usDecisionNotes || "Няма въведени допълнителни бележки."}
            </p>
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

      {isProtocolDialogOpen && (
        <TripProtocolDialog
          open={isProtocolDialogOpen}
          onOpenChange={setIsProtocolDialogOpen}
          trip={trip}
          membersDict={membersDict}
          onSuccess={() => {
            setIsProtocolDialogOpen(false);
            refreshData();
          }}
        />
      )}
    </div>
  );
}
