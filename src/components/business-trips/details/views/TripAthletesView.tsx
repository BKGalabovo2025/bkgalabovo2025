"use client";

import {
  Check,
  CheckCircle2,
  Pencil,
  PenTool,
  Sparkles,
  Users,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import React, { useState } from "react";
import { toast } from "sonner";

import { useTripDetails } from "@/components/business-trips/details/TripDetailsContext";
import { SignaturePadDialog } from "@/components/business-trips/SignaturePadDialog";
import { TripAthletesSignaturesDialog } from "@/components/business-trips/TripAthletesSignaturesDialog";
import { TripStatementEditDialog } from "@/components/business-trips/TripStatementEditDialog";
import { BentoCard } from "@/components/ui/bento-card";
import { Button } from "@/components/ui/button";
import { useDeepLinkHighlight } from "@/hooks/useDeepLinkHighlight";
import { saveDirectAthleteSignatureAction } from "@/lib/actions/trip-signatures";
import { businessTripService } from "@/services/business-trip-service";

export function TripAthletesView() {
  const { trip, membersDict, refreshData } = useTripDetails();
  const [isSignaturesDialogOpen, setIsSignaturesDialogOpen] = useState(false);
  const [isStatementDialogOpen, setIsStatementDialogOpen] = useState(false);
  const [isApplyingStored, setIsApplyingStored] = useState(false);
  const [directSignMember, setDirectSignMember] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const participantIds = trip.participantsIds || [];
  useDeepLinkHighlight("athlete", participantIds.length > 0, "memberId");
  const athleteSignatures = trip.signatures?.athletes || {};

  const missingAthletesWithStoredSig = participantIds.filter(
    (id) => !athleteSignatures[id] && Boolean(membersDict[id]?.signature)
  );

  const handleSaveAthleteSignature = async (base64: string) => {
    if (!directSignMember || !trip.id) return;
    try {
      const res = await saveDirectAthleteSignatureAction({
        tripId: trip.id,
        memberId: directSignMember.id,
        signatureBase64: base64,
        siteId: trip.siteId,
        propagateAll: true,
      });

      if (res.success) {
        toast.success(
          res.message ||
            `Подписът за ${directSignMember.name} е запазен успешно!`
        );
      } else {
        const currentAthletes = trip.signatures?.athletes || {};
        const newSignatures = {
          ...trip.signatures,
          athletes: {
            ...currentAthletes,
            [directSignMember.id]: base64,
          },
        };
        await businessTripService.updateTrip(trip.id, {
          signatures: newSignatures,
        });
        toast.success(
          `Подписът за ${directSignMember.name} е запазен за тази командировка!`
        );
      }
      setDirectSignMember(null);
      await refreshData();
    } catch (e) {
      console.error(e);
      toast.error("Грешка при запазване на подписа.");
    }
  };

  const handleApplyStoredSignature = async (
    memberId: string,
    memberName: string,
    signatureBase64: string
  ) => {
    if (!trip.id) return;
    try {
      const res = await saveDirectAthleteSignatureAction({
        tripId: trip.id,
        memberId,
        signatureBase64,
        siteId: trip.siteId,
        propagateAll: true,
      });
      if (res.success) {
        toast.success(`Съхраненият подпис за ${memberName} беше приложен!`);
        await refreshData();
      } else {
        toast.error(res.error || "Грешка при прилагане на подписа.");
      }
    } catch (e) {
      console.error(e);
      toast.error("Грешка при прилагане на подписа.");
    }
  };

  const handleBatchApplyStoredSignatures = async () => {
    if (!trip.id || missingAthletesWithStoredSig.length === 0) return;
    try {
      setIsApplyingStored(true);
      let successCount = 0;
      for (const id of missingAthletesWithStoredSig) {
        const m = membersDict[id];
        if (m?.signature) {
          const res = await saveDirectAthleteSignatureAction({
            tripId: trip.id,
            memberId: id,
            signatureBase64: m.signature,
            siteId: trip.siteId,
            propagateAll: true,
          });
          if (res.success) {
            successCount++;
          }
        }
      }
      toast.success(
        `Успешно бяха приложени ${successCount} съхранени подписа!`
      );
      await refreshData();
    } catch (err) {
      console.error(err);
      toast.error("Грешка при прилагане на съхранените подписи.");
    } finally {
      setIsApplyingStored(false);
    }
  };

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

        <div className="flex flex-wrap items-center gap-2">
          {missingAthletesWithStoredSig.length > 0 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isApplyingStored}
              onClick={handleBatchApplyStoredSignatures}
              className="rounded-xl border-emerald-300 bg-emerald-50 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-950/60"
              title="Приложи съхранените подписи от профилите на състезателите"
            >
              <Sparkles className="mr-1.5 size-3.5 text-emerald-600 dark:text-emerald-400" />
              {isApplyingStored
                ? "Прилагане..."
                : `Приложи съхранени (${missingAthletesWithStoredSig.length})`}
            </Button>
          )}

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsStatementDialogOpen(true)}
            className="rounded-xl border-zinc-200 text-xs font-semibold dark:border-zinc-800"
            title="Корекция на присъствени дни или отпадане на състезатели от ведомостта"
          >
            <Pencil className="mr-1.5 size-3.5 text-zinc-600 dark:text-zinc-400" />
            Корекция дни / ведомост
          </Button>

          <Button
            onClick={() => setIsSignaturesDialogOpen(true)}
            className="rounded-xl bg-blue-600 text-xs font-bold text-white hover:bg-blue-700"
          >
            <PenTool className="mr-1.5 size-3.5" />
            Управление на подписи
          </Button>
        </div>
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
                id={`athlete-${id}`}
                className="flex items-center justify-between rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-none dark:border-zinc-800 dark:bg-zinc-950"
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-xs font-bold text-zinc-900 dark:text-white">
                      {member ? (
                        <Link
                          href={`/members/${id}`}
                          title="Профил на състезателя"
                          className="hover:text-blue-600 hover:underline dark:hover:text-blue-400"
                        >
                          {name}
                        </Link>
                      ) : (
                        name
                      )}
                    </h4>
                    <Link
                      href={`/accounting/trips/${trip.id}/athletes?id=${id}`}
                      title="Директен линк към картата на състезателя"
                      className="text-[11px] font-mono text-zinc-300 hover:text-blue-500 dark:text-zinc-600 dark:hover:text-blue-400"
                    >
                      #
                    </Link>
                  </div>
                  <p className="text-[11px] text-zinc-400">
                    {member?.ageGroup
                      ? `Възраст: ${member.ageGroup}`
                      : "Състезател"}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {isSigned ? (
                    <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                      <CheckCircle2 className="size-3" />
                      Подписан
                    </span>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      {Boolean(member?.signature) && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleApplyStoredSignature(
                              id,
                              name,
                              member!.signature!
                            )
                          }
                          className="h-7 px-2 text-[10px] font-semibold text-emerald-700 border-emerald-200 bg-emerald-50/50 hover:bg-emerald-100 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300"
                          title="Приложи съхранения подпис от профила на състезателя"
                        >
                          <Check className="mr-1 size-3 text-emerald-600 dark:text-emerald-400" />
                          От профила
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDirectSignMember({ id, name })}
                        className="h-7 px-2 text-[10px] text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/40"
                        title="Положи подпис на екрана"
                      >
                        <XCircle className="mr-1 size-3 text-zinc-400" />
                        Подпиши
                      </Button>
                    </div>
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
          onOpenDirectSign={(_tripId, memberId, memberName) => {
            setIsSignaturesDialogOpen(false);
            setDirectSignMember({ id: memberId, name: memberName });
          }}
        />
      )}

      {isStatementDialogOpen && (
        <TripStatementEditDialog
          open={isStatementDialogOpen}
          onOpenChange={setIsStatementDialogOpen}
          trip={trip}
          onSuccess={() => {
            setIsStatementDialogOpen(false);
            refreshData();
          }}
        />
      )}

      {directSignMember && (
        <SignaturePadDialog
          open={Boolean(directSignMember)}
          onOpenChange={(open) => {
            if (!open) setDirectSignMember(null);
          }}
          title={`Електронен подпис: ${directSignMember.name}`}
          onSave={handleSaveAthleteSignature}
        />
      )}
    </div>
  );
}
