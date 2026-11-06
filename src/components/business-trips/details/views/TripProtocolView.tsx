"use client";

import { Download, Loader2 } from "lucide-react";
import React, { useState } from "react";
import { toast } from "sonner";

import { BusinessTripPdfTemplates } from "@/components/business-trips/BusinessTripPdfTemplates";
import { useTripDetails } from "@/components/business-trips/details/TripDetailsContext";
import { BentoCard } from "@/components/ui/bento-card";
import { Button } from "@/components/ui/button";
import { getTripProtocolNumber } from "@/lib/business-trip-numbers";
import { businessTripService } from "@/services/business-trip-service";

export function TripProtocolView() {
  const { trip, event, expenses, membersDict, refreshData } = useTripDetails();
  const [isGenerating, setIsGenerating] = useState(false);

  const num = getTripProtocolNumber(trip);

  const handleDownload = () => {
    setIsGenerating(true);
    setTimeout(() => {
      const el = document.getElementById("pdf-board-protocol-template");
      if (el) {
        import("@/lib/html-to-pdf").then((m) => {
          m.generatePdfFromElement(
            el,
            `Протокол_УС_${num}_${trip.title}`,
            "portrait"
          )
            .then(() => {
              toast.success("Протоколът на УС е генериран успешно.");
              if (trip.id) {
                businessTripService
                  .updateTrip(trip.id, {
                    protocolDownloadedAt: new Date().toISOString(),
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
        toast.error("Шаблонът на протокола не бе намерен.");
      }
    }, 150);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
            Решение и Протокол на Управителния съвет № {num}
          </h2>
          <p className="text-xs text-zinc-500">
            Официален протокол за гласуване и одобрение на командировъчните
            разходи
          </p>
        </div>

        <Button
          onClick={handleDownload}
          disabled={isGenerating}
          className="rounded-xl bg-blue-600 text-xs font-bold text-white hover:bg-blue-700"
        >
          {isGenerating ? (
            <Loader2 className="mr-1.5 size-3.5 animate-spin" />
          ) : (
            <Download className="mr-1.5 size-3.5" />
          )}
          Изтегли Протокол (PDF)
        </Button>
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

      {/* Hidden PDF template */}
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
