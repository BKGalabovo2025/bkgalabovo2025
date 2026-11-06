"use client";

import { CheckCircle2, PenTool, Users, XCircle } from "lucide-react";
import React, { useState } from "react";

import { useTripDetails } from "@/components/business-trips/details/TripDetailsContext";
import { TripAthletesSignaturesDialog } from "@/components/business-trips/TripAthletesSignaturesDialog";
import { BentoCard } from "@/components/ui/bento-card";
import { Button } from "@/components/ui/button";

export function TripAthletesView() {
  const { trip, membersDict, refreshData } = useTripDetails();
  const [isSignaturesDialogOpen, setIsSignaturesDialogOpen] = useState(false);

  const participantIds = trip.participantsIds || [];
  const athleteSignatures = trip.signatures?.athletes || {};

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
            Участващи състезатели и подписи ({participantIds.length})
          </h2>
          <p className="text-xs text-zinc-500">
            Списък на картотекираните състезатели и статус на електронните им
            подписи за пътуването
          </p>
        </div>

        <Button
          onClick={() => setIsSignaturesDialogOpen(true)}
          className="rounded-xl bg-blue-600 text-xs font-bold text-white hover:bg-blue-700"
        >
          <PenTool className="mr-1.5 size-3.5" />
          Управление на подписи
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {participantIds.length === 0 ? (
          <div className="col-span-full rounded-2xl border border-zinc-200 bg-white p-12 text-center text-xs text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950">
            <Users className="mx-auto mb-2 size-8 text-zinc-300 dark:text-zinc-700" />
            Няма избрани състезатели за тази командировка.
          </div>
        ) : (
          participantIds.map((id) => {
            const member = membersDict[id];
            const name = member
              ? `${member.firstName} ${member.lastName}`
              : "Неизвестен състезател";
            const isSigned = Boolean(athleteSignatures[id]);

            return (
              <BentoCard
                key={id}
                className="flex items-center justify-between rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-none dark:border-zinc-800 dark:bg-zinc-950"
              >
                <div>
                  <h4 className="text-xs font-bold text-zinc-900 dark:text-white">
                    {name}
                  </h4>
                  <p className="text-[11px] text-zinc-400">
                    {member?.ageGroup
                      ? `Възраст: ${member.ageGroup}`
                      : "Състезател"}
                  </p>
                </div>

                <div>
                  {isSigned ? (
                    <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                      <CheckCircle2 className="size-3" />
                      Подписан
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-md bg-zinc-100 px-2 py-1 text-[10px] font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                      <XCircle className="size-3" />
                      Неподписан
                    </span>
                  )}
                </div>
              </BentoCard>
            );
          })
        )}
      </div>

      {isSignaturesDialogOpen && (
        <TripAthletesSignaturesDialog
          open={isSignaturesDialogOpen}
          onOpenChange={setIsSignaturesDialogOpen}
          trip={trip}
          membersDict={membersDict}
          onRefresh={refreshData}
          onOpenDirectSign={() => {}}
        />
      )}
    </div>
  );
}
