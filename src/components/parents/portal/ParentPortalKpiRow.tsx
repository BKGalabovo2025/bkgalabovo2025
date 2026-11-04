"use client";

import {
  CalendarDays,
  CreditCard,
  Dumbbell,
  FileCheck2,
  FileSignature,
  HeartPulse,
  MapPin,
} from "lucide-react";
import React from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/currency";
import { cn } from "@/lib/utils";

import { useParentPortalContext } from "./ParentPortalContext";

function getProgressBarWidthClass(rate: number) {
  if (rate >= 100) return "w-full";
  if (rate >= 90) return "w-[90%]";
  if (rate >= 80) return "w-[80%]";
  if (rate >= 70) return "w-[70%]";
  if (rate >= 60) return "w-[60%]";
  if (rate >= 50) return "w-[50%]";
  if (rate >= 40) return "w-[40%]";
  if (rate >= 30) return "w-[30%]";
  if (rate >= 20) return "w-[20%]";
  if (rate >= 10) return "w-[10%]";
  return "w-0";
}

export function ParentPortalKpiRow() {
  const {
    portal,
    setActiveTab,
    attendanceStats,
    handlePreviewSentDocument,
    handleOpenSignDocument,
  } = useParentPortalContext();

  const { selectedChild, nextTraining, feeStatus, documentsData } = portal;

  const pendingDocs = (documentsData?.sentDocuments || []).filter(
    (d) => d.status === "pending"
  );
  const topPendingDoc = pendingDocs[0];

  return (
    <div className="space-y-4">
      {/* ── PRIORITY BANNER: If official document requires signature ────── */}
      {topPendingDoc && (
        <div className="rounded-3xl border-2 border-indigo-400/90 bg-linear-to-r from-indigo-600 via-indigo-700 to-blue-700 p-4 sm:p-5 text-white shadow-md">
          <div className="flex flex-col gap-3.5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3.5">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-xs text-white shadow-inner">
                <FileSignature className="size-6 animate-pulse" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-black tracking-wider text-amber-950 uppercase">
                    Изисква се подпис
                  </span>
                  <span className="text-[11px] text-indigo-100 font-medium">
                    за {topPendingDoc.memberName || selectedChild?.fullName}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-white sm:text-base leading-snug">
                  Официален документ за електронно подписване: „
                  {topPendingDoc.documentTitle}“
                </h3>
                <p className="text-xs text-indigo-100/90">
                  Можете да го прегледате и подпишете онлайн директно от Вашия
                  телефон или компютър.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => handlePreviewSentDocument(topPendingDoc)}
                className="h-9 rounded-xl border-white/30 bg-white/10 text-xs font-bold text-white hover:bg-white/20"
              >
                Преглед
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => handleOpenSignDocument(topPendingDoc)}
                className="h-9 rounded-xl bg-white px-4 text-xs font-bold text-indigo-900 shadow-sm hover:bg-indigo-50 cursor-pointer"
              >
                ✍️ Подпиши онлайн
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── 4 Clean Bento KPI Cards ────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Следваща тренировка */}
        <div
          onClick={() => setActiveTab("attendance")}
          className={cn(
            "group relative flex flex-col justify-between rounded-3xl border p-4.5 shadow-2xs transition-all cursor-pointer hover:shadow-md",
            nextTraining?.isToday
              ? "border-emerald-300 bg-emerald-50/50 hover:bg-emerald-50/80 dark:border-emerald-800/50 dark:bg-emerald-950/20"
              : "border-zinc-200/80 bg-white hover:border-blue-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
          )}
        >
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-bold tracking-wider text-zinc-500 uppercase">
                Следваща тренировка
              </span>
              <div
                className={cn(
                  "flex size-7 items-center justify-center rounded-xl text-white shadow-2xs",
                  nextTraining?.isToday ? "bg-emerald-600" : "bg-blue-600"
                )}
              >
                <Dumbbell size={13} />
              </div>
            </div>

            <div className="mt-2.5">
              {nextTraining ? (
                <>
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-bold text-zinc-900 dark:text-white leading-tight truncate">
                      {nextTraining.title}
                    </p>
                    {nextTraining.isToday && (
                      <span className="rounded-md bg-emerald-600 px-1.5 py-0.2 text-[9px] font-bold text-white uppercase animate-pulse">
                        Днес
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                    {nextTraining.dateText}, {nextTraining.timeText}
                  </p>
                  <div className="mt-1 flex items-center gap-1 text-[11px] text-zinc-500 truncate">
                    <MapPin size={11} className="text-zinc-400 shrink-0" />
                    <span className="truncate">{nextTraining.location}</span>
                  </div>
                </>
              ) : (
                <p className="text-xs text-zinc-500 font-medium">
                  Няма насрочена предстояща тренировка за периода.
                </p>
              )}
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-zinc-100 dark:border-zinc-800 text-[10px] font-semibold text-blue-600 group-hover:underline dark:text-blue-400">
            Виж тренировъчния график →
          </div>
        </div>

        {/* Card 2: Присъствия този месец */}
        <div
          onClick={() => setActiveTab("attendance")}
          className="group relative flex flex-col justify-between rounded-3xl border border-zinc-200/80 bg-white p-4.5 shadow-2xs transition-all cursor-pointer hover:border-blue-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
        >
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-bold tracking-wider text-zinc-500 uppercase">
                Присъствия
              </span>
              <div className="flex size-7 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-2xs">
                <CalendarDays size={13} />
              </div>
            </div>

            <div className="mt-2.5">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">
                  {attendanceStats.attended}
                </span>
                <span className="text-xs text-zinc-500 font-semibold">
                  / {attendanceStats.total} тренировки
                </span>
              </div>

              {/* Progress bar */}
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                <div
                  className={cn(
                    "h-full rounded-full bg-emerald-500 transition-all duration-500",
                    getProgressBarWidthClass(attendanceStats.rate)
                  )}
                />
              </div>

              <div className="mt-1.5 flex items-center justify-between text-[11px] text-zinc-500 font-medium">
                <span>Посещаемост:</span>
                <strong className="text-emerald-600 dark:text-emerald-400 font-bold">
                  {attendanceStats.rate}%
                </strong>
              </div>
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-zinc-100 dark:border-zinc-800 text-[10px] font-semibold text-blue-600 group-hover:underline dark:text-blue-400">
            Пълен месечен календар →
          </div>
        </div>

        {/* Card 3: Членски внос / Такси */}
        <div
          onClick={() => setActiveTab("finances")}
          className="group relative flex flex-col justify-between rounded-3xl border border-zinc-200/80 bg-white p-4.5 shadow-2xs transition-all cursor-pointer hover:border-blue-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
        >
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-bold tracking-wider text-zinc-500 uppercase">
                Членски внос &amp; Такси
              </span>
              <div
                className={cn(
                  "flex size-7 items-center justify-center rounded-xl text-white shadow-2xs",
                  feeStatus?.currentMonthStatus === "paid"
                    ? "bg-emerald-600"
                    : feeStatus?.currentMonthStatus === "unpaid"
                      ? "bg-amber-500"
                      : "bg-blue-600"
                )}
              >
                <CreditCard size={13} />
              </div>
            </div>

            <div className="mt-2.5">
              <div className="flex items-center gap-1.5">
                {feeStatus?.currentMonthStatus === "paid" ? (
                  <Badge className="bg-emerald-600 text-white text-[10px] font-bold">
                    ✓ Редовен членски внос
                  </Badge>
                ) : feeStatus?.currentMonthStatus === "unpaid" ? (
                  <Badge className="bg-amber-500 text-white text-[10px] font-bold">
                    ⏳ Очаква плащане
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-[10px] font-bold">
                    {feeStatus?.currentMonthLabel || "Текущ месец"}
                  </Badge>
                )}
              </div>

              <div className="mt-2 text-xs text-zinc-500 space-y-0.5">
                {feeStatus?.unpaidSalesCount &&
                feeStatus.unpaidSalesCount > 0 ? (
                  <p className="font-bold text-amber-600 dark:text-amber-400">
                    Дължимо: {formatPrice(feeStatus.unpaidSalesAmount)}
                  </p>
                ) : (
                  <p className="text-emerald-600 dark:text-emerald-400 font-semibold">
                    Няма непокрити задължения
                  </p>
                )}
                <p className="text-[11px] text-zinc-400 truncate">
                  Записи: {feeStatus?.transactions?.length || 0} бележки
                </p>
              </div>
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-zinc-100 dark:border-zinc-800 text-[10px] font-semibold text-blue-600 group-hover:underline dark:text-blue-400">
            Финансова история и бележки →
          </div>
        </div>

        {/* Card 4: Документи & Картотека */}
        <div
          onClick={() => setActiveTab("documents")}
          className="group relative flex flex-col justify-between rounded-3xl border border-zinc-200/80 bg-white p-4.5 shadow-2xs transition-all cursor-pointer hover:border-blue-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
        >
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-bold tracking-wider text-zinc-500 uppercase">
                Документи &amp; Здраве
              </span>
              <div className="flex size-7 items-center justify-center rounded-xl bg-purple-600 text-white shadow-2xs">
                <FileCheck2 size={13} />
              </div>
            </div>

            <div className="mt-2.5 space-y-1.5">
              <div className="flex items-center gap-1.5">
                {pendingDocs.length > 0 ? (
                  <span className="rounded-md bg-indigo-600 px-2 py-0.5 text-[10px] font-bold text-white">
                    {pendingDocs.length} за подпис
                  </span>
                ) : (
                  <span className="rounded-md bg-emerald-100 text-emerald-800 px-2 py-0.5 text-[10px] font-bold dark:bg-emerald-950/60 dark:text-emerald-300">
                    Всички документи подписани
                  </span>
                )}
              </div>

              <div className="text-[11px] text-zinc-500">
                <span className="flex items-center gap-1">
                  <HeartPulse size={12} className="text-rose-500" />
                  Медицинско:{" "}
                  <strong className="text-zinc-700 dark:text-zinc-300">
                    {documentsData?.medicalCertificate?.hasCertificate &&
                    !documentsData?.medicalCertificate?.isExpired
                      ? "Валидно"
                      : "Липсва / Изтекло"}
                  </strong>
                </span>
              </div>
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-zinc-100 dark:border-zinc-800 text-[10px] font-semibold text-blue-600 group-hover:underline dark:text-blue-400">
            Управление на документи →
          </div>
        </div>
      </div>
    </div>
  );
}
