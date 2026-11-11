"use client";

import {
  Briefcase,
  Calendar,
  Check,
  CheckCircle2,
  ExternalLink,
  FileText,
  MapPin,
  PenTool,
  Repeat,
  Shield,
  Sparkles,
  Trash2,
  User,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { SignaturePadDialog } from "@/components/business-trips/SignaturePadDialog";
import { BentoCard } from "@/components/ui/bento-card";
import { Button } from "@/components/ui/button";
import {
  batchApplyAthleteSignatureToTripsAction,
  clearMemberStoredSignatureAction,
  saveDirectAthleteSignatureAction,
  saveMemberStoredSignatureAction,
  syncMemberSignatureFromTripsAction,
} from "@/lib/actions/trip-signatures";
import {
  getTripDecisionNumber,
  getTripOrderNumber,
} from "@/lib/business-trip-numbers";
import { formatDateShort } from "@/lib/date-utils";
import { businessTripService } from "@/services/business-trip-service";
import { BusinessTrip } from "@/types/business-trip.types";

import { useMemberProfileContext } from "../MemberProfileContext";

export function MemberTripsTabView() {
  const { memberId, member, fullName, refetch } = useMemberProfileContext();
  const [trips, setTrips] = useState<BusinessTrip[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPadOpen, setIsPadOpen] = useState(false);
  const [targetTripId, setTargetTripId] = useState<string | null>(null);
  const [isBatchApplying, setIsBatchApplying] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [isSyncingFromTrip, setIsSyncingFromTrip] = useState(false);
  const hasAutoSyncedRef = useRef(false);

  const loadTrips = useCallback(async () => {
    try {
      const data = await businessTripService.getTripsByMemberId(
        memberId,
        member.siteId || "bkgalabovo"
      );
      setTrips(data);
    } catch (err) {
      console.error("Грешка при зареждане на командировките на члена:", err);
    } finally {
      setLoading(false);
    }
  }, [memberId, member.siteId]);

  useEffect(() => {
    setLoading(true);
    loadTrips();
  }, [loadTrips]);

  const handleSaveSignature = async (base64: string) => {
    try {
      if (targetTripId) {
        // Direct sign from trip card
        const res = await saveDirectAthleteSignatureAction({
          tripId: targetTripId,
          memberId,
          signatureBase64: base64,
          siteId: member.siteId,
          propagateAll: true,
        });
        if (res.success) {
          toast.success(
            res.message || "Подписът е запазен и приложен към командировките!"
          );
        } else {
          toast.error(res.error || "Грешка при запазване на подписа.");
        }
      } else {
        // Global signature for member profile
        const res = await saveMemberStoredSignatureAction({
          memberId,
          signatureBase64: base64,
          siteId: member.siteId,
        });
        if (res.success) {
          toast.success(
            res.message || "Подписът е запазен в профила на състезателя!"
          );
        } else {
          toast.error(res.error || "Грешка при запазване на подписа.");
        }
      }

      setIsPadOpen(false);
      setTargetTripId(null);
      await Promise.all([refetch(), loadTrips()]);
    } catch (err) {
      console.error(err);
      toast.error("Възникна грешка при обработка на подписа.");
    }
  };

  const handleBatchApply = async () => {
    if (!member.signature) {
      toast.error("Състезателят няма съхранен подпис в профила.");
      return;
    }
    try {
      setIsBatchApplying(true);
      const res = await batchApplyAthleteSignatureToTripsAction({
        memberId,
        siteId: member.siteId,
      });
      if (res.success) {
        toast.success(
          res.message || "Подписът беше приложен към всички командировки!"
        );
        await loadTrips();
      } else {
        toast.error(res.error || "Грешка при прилагане на подписа.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Възникна грешка при синхронизацията.");
    } finally {
      setIsBatchApplying(false);
    }
  };

  const handleApplySingleTrip = async (tripId: string) => {
    if (!member.signature) return;
    try {
      const res = await saveDirectAthleteSignatureAction({
        tripId,
        memberId,
        signatureBase64: member.signature,
        siteId: member.siteId,
        propagateAll: true,
      });
      if (res.success) {
        toast.success("Подписът беше успешно приложен към тази ведомост!");
        await loadTrips();
      } else {
        toast.error(res.error || "Грешка при прилагане на подписа.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Грешка при прилагане на подписа.");
    }
  };

  const handleClearStoredSignature = async () => {
    if (
      !confirm(
        "Сигурни ли сте, че искате да премахнете съхранения подпис от профила на състезателя?"
      )
    ) {
      return;
    }
    try {
      setIsClearing(true);
      const res = await clearMemberStoredSignatureAction({ memberId });
      if (res.success) {
        toast.success(res.message || "Подписът беше премахнат от профила.");
        await refetch();
      } else {
        toast.error(res.error || "Грешка при премахване на подписа.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Грешка при изчистване на подписа.");
    } finally {
      setIsClearing(false);
    }
  };

  const asAthleteTrips = trips.filter(
    (t) =>
      Array.isArray(t.participantsIds) && t.participantsIds.includes(memberId)
  );
  const asCoachTrips = trips.filter((t) => t.coachId === memberId);
  const signedTrip = asAthleteTrips.find(
    (t) =>
      Boolean(t.signatures?.athletes?.[memberId]) ||
      Boolean((t.signatures as Record<string, string> | undefined)?.[memberId])
  );
  const clientSignature =
    signedTrip?.signatures?.athletes?.[memberId] ||
    (signedTrip?.signatures as Record<string, string> | undefined)?.[memberId];

  const signedCount = asAthleteTrips.filter(
    (t) =>
      (t.signatures?.athletes && Boolean(t.signatures.athletes[memberId])) ||
      Boolean((t.signatures as Record<string, string> | undefined)?.[memberId])
  ).length;
  const unsignedCount = asAthleteTrips.length - signedCount;

  const handleSyncFromTrip = useCallback(
    async (tripId: string, sigBase64?: string) => {
      try {
        setIsSyncingFromTrip(true);
        const res = await syncMemberSignatureFromTripsAction({
          memberId,
          tripId,
          signatureBase64: sigBase64 || clientSignature,
          siteId: member.siteId,
        });
        if (res.success) {
          toast.success(
            res.message ||
              "Подписът беше успешно запазен в профила на състезателя!"
          );
          await Promise.all([refetch(), loadTrips()]);
        } else {
          toast.error(res.error || "Грешка при синхронизиране на подписа.");
        }
      } catch (err) {
        console.error(err);
        toast.error("Възникна непредвидена грешка при синхронизацията.");
      } finally {
        setIsSyncingFromTrip(false);
      }
    },
    [memberId, member.siteId, clientSignature, refetch, loadTrips]
  );

  // Auto-sync: If member has no signature in profile, but has an existing signature in one of their trips, auto-migrate it!
  useEffect(() => {
    if (
      !loading &&
      !member.signature &&
      signedTrip?.id &&
      clientSignature &&
      !isSyncingFromTrip &&
      !hasAutoSyncedRef.current
    ) {
      hasAutoSyncedRef.current = true;
      void handleSyncFromTrip(signedTrip.id, clientSignature);
    }
  }, [
    loading,
    member.signature,
    signedTrip?.id,
    clientSignature,
    isSyncingFromTrip,
    handleSyncFromTrip,
  ]);

  if (loading) {
    return (
      <div className="py-16 text-center text-xs text-zinc-400">
        <div className="mx-auto mb-2 size-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
        Зареждане на командировките и участията...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Metrics Row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <BentoCard className="flex flex-col justify-between rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-none dark:border-zinc-800 dark:bg-zinc-950">
          <span className="text-xs font-medium text-zinc-500">
            Общо пътувания
          </span>
          <p className="mt-2 text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
            {trips.length}
          </p>
        </BentoCard>

        <BentoCard className="flex flex-col justify-between rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-none dark:border-zinc-800 dark:bg-zinc-950">
          <span className="text-xs font-medium text-zinc-500">
            Като състезател
          </span>
          <p className="mt-2 text-2xl font-bold tracking-tight text-blue-600 dark:text-blue-400">
            {asAthleteTrips.length}
          </p>
        </BentoCard>

        <BentoCard className="flex flex-col justify-between rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-none dark:border-zinc-800 dark:bg-zinc-950">
          <span className="text-xs font-medium text-zinc-500">
            Като ръководител
          </span>
          <p className="mt-2 text-2xl font-bold tracking-tight text-purple-600 dark:text-purple-400">
            {asCoachTrips.length}
          </p>
        </BentoCard>

        <BentoCard className="flex flex-col justify-between rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-none dark:border-zinc-800 dark:bg-zinc-950">
          <span className="text-xs font-medium text-zinc-500">
            Подписани ведомости
          </span>
          <p className="mt-2 text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
            {signedCount} / {asAthleteTrips.length}
          </p>
        </BentoCard>
      </div>

      {/* Official Stored Signature Panel */}
      <BentoCard className="rounded-2xl border border-zinc-200/80 bg-white p-4 sm:p-5 shadow-none dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="flex size-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
                <PenTool className="size-4" />
              </div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-white">
                Електронен подпис за командировки и ведомости
              </h3>
              {member.signature ? (
                <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                  <CheckCircle2 className="size-3" />
                  Активен в профила
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-md bg-zinc-100 px-2 py-0.5 text-[10px] font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                  <XCircle className="size-3 text-zinc-400" />
                  Няма съхранен подпис
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {member.signature
                ? `Подписът на ${fullName} се прилага автоматично във всяка ведомост за състезания. Последно обновен: ${member.signatureUpdatedAt ? formatDateShort(member.signatureUpdatedAt) : "Наскоро"}.`
                : signedTrip
                  ? `Открит е положен подпис във ведомостта за „${signedTrip.title}“! Можете директно да го запазите в профила и да го приложите към всички командировки.`
                  : `Когато ${fullName} положи подпис тук веднъж, програмата ще го съхрани и ще го постави автоматично във всяка минала и бъдеща командировка.`}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {member.signature ? (
              <>
                <div
                  title="Съхранен официален подпис"
                  className="flex h-12 w-28 shrink-0 items-center justify-center rounded-xl border border-zinc-200 bg-white p-1 shadow-sm dark:border-zinc-700 dark:bg-white"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={member.signature}
                    alt={`Подпис на ${fullName}`}
                    className="max-h-full max-w-full object-contain"
                  />
                </div>

                {unsignedCount > 0 && (
                  <Button
                    type="button"
                    size="sm"
                    disabled={isBatchApplying}
                    onClick={handleBatchApply}
                    className="rounded-xl bg-emerald-600 text-xs font-bold text-white hover:bg-emerald-700"
                  >
                    <Sparkles className="mr-1.5 size-3.5" />
                    {isBatchApplying
                      ? "Прилагане..."
                      : `Приложи към всички неподписани (${unsignedCount})`}
                  </Button>
                )}

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setTargetTripId(null);
                    setIsPadOpen(true);
                  }}
                  className="rounded-xl text-xs font-semibold"
                >
                  <PenTool className="mr-1.5 size-3.5 text-zinc-500" />
                  Нов подпис
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={isClearing}
                  onClick={handleClearStoredSignature}
                  className="rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
                  title="Премахни съхранения подпис от профила"
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                {signedTrip && (
                  <Button
                    type="button"
                    size="sm"
                    disabled={isSyncingFromTrip}
                    onClick={() =>
                      handleSyncFromTrip(signedTrip.id!, clientSignature)
                    }
                    className="rounded-xl bg-emerald-600 text-xs font-bold text-white hover:bg-emerald-700 shadow-sm"
                  >
                    <Sparkles className="mr-1.5 size-3.5" />
                    {isSyncingFromTrip
                      ? "Синхронизиране..."
                      : `Запази подписа от „${signedTrip.title}“`}
                  </Button>
                )}

                <Button
                  type="button"
                  size="sm"
                  variant={signedTrip ? "outline" : "default"}
                  onClick={() => {
                    setTargetTripId(null);
                    setIsPadOpen(true);
                  }}
                  className={`rounded-xl text-xs font-bold ${
                    signedTrip
                      ? "border-zinc-300 dark:border-zinc-700"
                      : "bg-blue-600 text-white hover:bg-blue-700"
                  }`}
                >
                  <PenTool className="mr-1.5 size-3.5" />
                  {signedTrip
                    ? "Положи нов подпис"
                    : "Положи подпис за всички командировки"}
                </Button>
              </div>
            )}
          </div>
        </div>
      </BentoCard>

      {/* Trips List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider dark:text-white">
            Хронология на командировките ({trips.length})
          </h3>
          <Button
            asChild
            variant="outline"
            size="sm"
            className="h-8 text-xs rounded-xl"
          >
            <Link href="/accounting">Към модул Счетоводство →</Link>
          </Button>
        </div>

        {trips.length === 0 ? (
          <BentoCard className="rounded-2xl border border-zinc-200/80 bg-white p-12 text-center text-xs text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950">
            <Briefcase className="mx-auto mb-2.5 size-8 text-zinc-300 dark:text-zinc-700" />
            <p className="font-semibold text-zinc-800 dark:text-zinc-200">
              Няма регистрирани командировки
            </p>
            <p className="mt-1 text-zinc-500">
              {fullName} все още няма участия в командировки или състезания с
              официална заповед.
            </p>
          </BentoCard>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {trips.map((trip) => {
              const isCoach = trip.coachId === memberId;
              const isAthlete =
                Array.isArray(trip.participantsIds) &&
                trip.participantsIds.includes(memberId);
              const isSigned = Boolean(trip.signatures?.athletes?.[memberId]);
              const isDaily = trip.vehicle?.commuteMode === "daily_commute";

              return (
                <BentoCard
                  key={trip.id}
                  className="space-y-3 rounded-2xl border border-zinc-200/80 bg-white p-4.5 shadow-none transition-all hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-700"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          href={`/accounting/trips/${trip.id}`}
                          className="text-sm font-bold text-zinc-900 hover:text-blue-600 dark:text-white dark:hover:text-blue-400"
                        >
                          {trip.title}
                        </Link>
                        {isCoach && (
                          <span className="inline-flex items-center gap-1 rounded-md bg-purple-50 px-2 py-0.5 text-[10px] font-bold text-purple-700 dark:bg-purple-950/50 dark:text-purple-300">
                            <User className="size-3" />
                            Ръководител
                          </span>
                        )}
                        {isAthlete && (
                          <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
                            Състезател
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-500">
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="size-3.5 text-zinc-400" />
                          {trip.destination}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="size-3.5 text-zinc-400" />
                          {formatDateShort(trip.startDate)} –{" "}
                          {formatDateShort(trip.endDate)}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="h-8 rounded-xl text-xs font-semibold"
                      >
                        <Link href={`/accounting/trips/${trip.id}`}>
                          Преглед
                          <ExternalLink className="ml-1.5 size-3 opacity-60" />
                        </Link>
                      </Button>

                      {isAthlete && (
                        <Button
                          asChild
                          variant="ghost"
                          size="sm"
                          className="h-8 rounded-xl text-xs font-semibold text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/40"
                        >
                          <Link
                            href={`/accounting/trips/${trip.id}/athletes?id=${memberId}`}
                          >
                            Към ведомост
                          </Link>
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Badges / Document Numbers row */}
                  <div className="flex flex-wrap items-center gap-2 border-t border-zinc-100 pt-2.5 text-[11px] dark:border-zinc-800">
                    <span className="inline-flex items-center gap-1 rounded bg-zinc-100 px-2 py-0.5 font-mono text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                      <FileText className="size-3" />
                      Заповед: {getTripOrderNumber(trip)}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded bg-zinc-100 px-2 py-0.5 font-mono text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                      <Shield className="size-3" />
                      Решение: {getTripDecisionNumber(trip)}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded bg-zinc-100 px-2 py-0.5 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                      <Repeat className="size-3 text-indigo-500" />
                      {isDaily
                        ? "Ежедневно (без нощувка)"
                        : "С престой / нощувка"}
                    </span>

                    {isAthlete && (
                      <span className="ml-auto inline-flex items-center gap-2">
                        {isSigned ? (
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                              <CheckCircle2 className="size-3.5" />
                              Ведомостта е подписана
                            </span>
                            {!member.signature && (
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  const sig =
                                    trip.signatures?.athletes?.[memberId] ||
                                    (
                                      trip.signatures as
                                        Record<string, string> | undefined
                                    )?.[memberId];
                                  handleSyncFromTrip(trip.id!, sig);
                                }}
                                className="h-6 rounded-lg border-emerald-300 bg-emerald-50 px-2 text-[10px] font-semibold text-emerald-800 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                                title="Запази този подпис като официален в профила на състезателя"
                              >
                                <Sparkles className="mr-1 size-3 text-emerald-600 dark:text-emerald-400" />
                                Запази в профила
                              </Button>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400 mr-1">
                              <XCircle className="size-3.5" />
                              Чака подпис
                            </span>

                            {member.signature ? (
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => handleApplySingleTrip(trip.id!)}
                                className="h-6 rounded-lg border-emerald-300 bg-emerald-50 px-2 text-[10px] font-semibold text-emerald-800 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                                title="Приложи съхранения подпис към тази командировка"
                              >
                                <Check className="mr-1 size-3 text-emerald-600 dark:text-emerald-400" />
                                Приложи подпис
                              </Button>
                            ) : (
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setTargetTripId(trip.id!);
                                  setIsPadOpen(true);
                                }}
                                className="h-6 rounded-lg border-blue-200 px-2 text-[10px] font-semibold text-blue-700 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-300"
                              >
                                <PenTool className="mr-1 size-3" />
                                Подпиши
                              </Button>
                            )}
                          </div>
                        )}
                      </span>
                    )}
                  </div>
                </BentoCard>
              );
            })}
          </div>
        )}
      </div>

      {isPadOpen && (
        <SignaturePadDialog
          open={isPadOpen}
          onOpenChange={(op) => {
            if (!op) setTargetTripId(null);
            setIsPadOpen(op);
          }}
          title={
            targetTripId
              ? `Електронен подпис за командировка: ${fullName}`
              : `Официален подпис за всички командировки: ${fullName}`
          }
          onSave={handleSaveSignature}
        />
      )}
    </div>
  );
}
