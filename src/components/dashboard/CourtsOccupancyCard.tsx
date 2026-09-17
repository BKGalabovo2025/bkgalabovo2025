"use client";

import { Activity, ArrowRight, CheckCircle2, Clock } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import {
  subscribeToBlockedSlotsForDay,
  subscribeToReservationsForDay,
} from "@/lib/reservations";
import { useAppStore } from "@/store/use-app-store";
import { BlockedSlot, Reservation } from "@/types/reservation";

export function CourtsOccupancyCard() {
  const { activeBranch } = useAppStore();
  const isRecovery = activeBranch === "recoveryzone";
  const siteId = isRecovery ? "recoveryzone" : activeBranch || "bkgalabovo";

  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [blockedSlots, setBlockedSlots] = useState<BlockedSlot[]>([]);

  const today = useMemo(() => new Date(), []);

  useEffect(() => {
    const unsubReservations = subscribeToReservationsForDay(
      today,
      (data) => {
        setReservations(data || []);
      },
      siteId
    );

    const unsubBlocked = subscribeToBlockedSlotsForDay(
      today,
      (data) => {
        setBlockedSlots(data || []);
      },
      siteId
    );

    return () => {
      unsubReservations();
      unsubBlocked();
    };
  }, [today, siteId]);

  const sortedReservations = useMemo(() => {
    return [...reservations].sort((a, b) => {
      const aTime = a.startTime?.toDate?.()?.getTime() || 0;
      const bTime = b.startTime?.toDate?.()?.getTime() || 0;
      return aTime - bTime;
    });
  }, [reservations]);

  const totalBookings = reservations.length + blockedSlots.length;

  const courtNamesOccupied = useMemo(() => {
    const occupied = new Set<string>();
    reservations.forEach((r) => {
      if (r.courtId) occupied.add(`Корт ${r.courtId}`);
      if (r.serviceName) occupied.add(r.serviceName);
    });
    blockedSlots.forEach((b) => {
      if (Array.isArray(b.courtIds)) {
        b.courtIds.forEach((cId) => occupied.add(`Корт ${cId}`));
      }
    });
    return Array.from(occupied);
  }, [reservations, blockedSlots]);

  const formattedDate = useMemo(() => {
    return today.toLocaleDateString("bg-BG", {
      day: "numeric",
      month: "long",
    });
  }, [today]);

  const title = isRecovery ? "Заетост Релакс Зона" : "Заетост на Кортовете";

  const subtitle = isRecovery
    ? `Сауна, ботуши и масажи • Днес, ${formattedDate}`
    : `Кортове 1 – 6 • Днес, ${formattedDate}`;

  const targetLink = isRecovery
    ? "/schedule?tab=recovery"
    : "/schedule?tab=courts";

  return (
    <div className="flex h-full flex-col justify-between rounded-3xl border border-zinc-200/70 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
      <div>
        {/* Header */}
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
              <Activity className="size-4.5" strokeWidth={2.2} />
            </div>
            <div>
              <h2 className="text-xs font-bold text-zinc-900 uppercase dark:text-zinc-100">
                {title}
              </h2>
              <p className="text-[11px] text-zinc-400">{subtitle}</p>
            </div>
          </div>

          <div>
            {totalBookings > 0 ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                <span className="size-1.5 rounded-full bg-emerald-500" />
                {totalBookings}{" "}
                {totalBookings === 1 ? "резервация" : "резервации"}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2.5 py-1 text-[11px] font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                Свободен график
              </span>
            )}
          </div>
        </div>

        {/* Quick summary chips if bookings exist */}
        {courtNamesOccupied.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-1.5">
            {courtNamesOccupied.map((name) => (
              <span
                key={name}
                className="rounded-lg border border-zinc-200/60 bg-zinc-50 px-2 py-0.5 text-[11px] font-semibold text-zinc-700 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-200"
              >
                {name}: Зает
              </span>
            ))}
          </div>
        )}

        {/* Body content */}
        {sortedReservations.length > 0 ? (
          <div className="custom-scrollbar max-h-64 space-y-2 overflow-y-auto pr-1">
            {sortedReservations.map((res) => {
              const startDate = res.startTime?.toDate?.() || new Date();
              const endDate = res.endTime?.toDate?.() || new Date();
              const startTimeStr = startDate.toLocaleTimeString("bg-BG", {
                hour: "2-digit",
                minute: "2-digit",
              });
              const endTimeStr = endDate.toLocaleTimeString("bg-BG", {
                hour: "2-digit",
                minute: "2-digit",
              });

              return (
                <div
                  key={res.id}
                  className="flex items-center justify-between rounded-xl border border-zinc-100 bg-zinc-50/70 p-3 transition-colors hover:border-emerald-200 dark:border-zinc-800 dark:bg-zinc-800/40"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white text-xs font-bold text-emerald-700 shadow-2xs dark:bg-zinc-800 dark:text-emerald-300">
                      {res.courtId ? `К${res.courtId}` : "Р"}
                    </div>

                    <div>
                      <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                        {res.clientName || "Гост"}
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-zinc-500">
                        <Clock className="size-3 text-zinc-400" />
                        <span>
                          {startTimeStr} – {endTimeStr} ч.
                        </span>
                        {res.serviceName && (
                          <span className="font-medium text-emerald-600 dark:text-emerald-400">
                            • {res.serviceName}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div>
                    {res.status === "paid" ? (
                      <Badge
                        variant="secondary"
                        className="border-none bg-emerald-100 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                      >
                        Платено
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="border-amber-200 bg-amber-50 text-[10px] font-bold text-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
                      >
                        Неплатено
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex items-center gap-3 rounded-2xl border border-zinc-100 bg-zinc-50/60 p-4 dark:border-zinc-800 dark:bg-zinc-800/30">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
              <CheckCircle2 className="size-4.5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                {isRecovery
                  ? "Всички процедури и зони са свободни днес"
                  : "Всички кортове са свободни за игра днес"}
              </p>
              <p className="text-[11px] text-zinc-400">
                {isRecovery
                  ? "Няма регистрирани часове за релакс и възстановяване"
                  : "Няма регистрирани почасови резервации за деня"}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-5 border-t border-zinc-100 pt-3 dark:border-zinc-800">
        <Link
          href={targetLink}
          className="group flex items-center justify-between text-xs font-semibold text-zinc-600 transition-colors hover:text-emerald-600 dark:text-zinc-400 dark:hover:text-white"
        >
          <span>
            {isRecovery
              ? "График на процедурите & релакс"
              : "Пълен график на кортовете"}
          </span>
          <ArrowRight className="size-4 text-zinc-400 transition-transform group-hover:translate-x-1 group-hover:text-emerald-600" />
        </Link>
      </div>
    </div>
  );
}
