"use client";

import {
  Briefcase,
  Calendar,
  CheckCircle2,
  ExternalLink,
  FileText,
  MapPin,
  Repeat,
  Shield,
  User,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import React, { useEffect, useState } from "react";

import { BentoCard } from "@/components/ui/bento-card";
import { Button } from "@/components/ui/button";
import {
  getTripDecisionNumber,
  getTripOrderNumber,
} from "@/lib/business-trip-numbers";
import { formatDateShort } from "@/lib/date-utils";
import { businessTripService } from "@/services/business-trip-service";
import { BusinessTrip } from "@/types/business-trip.types";

import { useMemberProfileContext } from "../MemberProfileContext";

export function MemberTripsTabView() {
  const { memberId, member, fullName } = useMemberProfileContext();
  const [trips, setTrips] = useState<BusinessTrip[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadTrips() {
      try {
        setLoading(true);
        const data = await businessTripService.getTripsByMemberId(
          memberId,
          member.siteId || "bkgalabovo"
        );
        if (isMounted) {
          setTrips(data);
        }
      } catch (err) {
        console.error("Грешка при зареждане на командировките на члена:", err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }
    loadTrips();
    return () => {
      isMounted = false;
    };
  }, [memberId, member.siteId]);

  if (loading) {
    return (
      <div className="py-16 text-center text-xs text-zinc-400">
        <div className="mx-auto mb-2 size-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
        Зареждане на командировките и участията...
      </div>
    );
  }

  const asAthleteTrips = trips.filter(
    (t) =>
      Array.isArray(t.participantsIds) && t.participantsIds.includes(memberId)
  );
  const asCoachTrips = trips.filter((t) => t.coachId === memberId);
  const signedCount = asAthleteTrips.filter(
    (t) => t.signatures?.athletes && Boolean(t.signatures.athletes[memberId])
  ).length;

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
                      <span className="ml-auto inline-flex items-center gap-1">
                        {isSigned ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="size-3.5" />
                            Ведомостта е подписана
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                            <XCircle className="size-3.5" />
                            Чака подпис във ведомостта
                          </span>
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
    </div>
  );
}
