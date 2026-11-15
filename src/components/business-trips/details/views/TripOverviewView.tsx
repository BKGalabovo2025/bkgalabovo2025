"use client";

import {
  Calendar,
  Car,
  CheckCircle2,
  Euro,
  FileText,
  MapPin,
  Pencil,
  Repeat,
  Shield,
  SlidersHorizontal,
  Sparkles,
  User,
  Users,
} from "lucide-react";
import Link from "next/link";
import React from "react";

import { useTripDetails } from "@/components/business-trips/details/TripDetailsContext";
import { Badge } from "@/components/ui/badge";
import { BentoCard } from "@/components/ui/bento-card";
import { Button } from "@/components/ui/button";
import {
  calculateTripExpensesSummary,
  calculateTripTransportTotals,
  EUR_TO_BGN_RATE,
  getEffectiveTripRates,
} from "@/lib/business-trip-calc";
import { formatDateShort } from "@/lib/date-utils";

export function TripOverviewView() {
  const { trip, event, expenses, membersDict, openDialog } = useTripDetails();

  const coach = trip.coachId ? membersDict[trip.coachId] : null;
  const coachName = coach
    ? `${coach.firstName} ${coach.lastName}`
    : trip.coachName || "Не е избран";

  const expenseSummary = calculateTripExpensesSummary(trip, expenses);
  const transportCalc = calculateTripTransportTotals(trip);

  const coverage = trip.expensesCoverage || "transport_food_sleep";
  const hasFoodCoverage = coverage !== "transport_only";
  const basePerDiemEUR = hasFoodCoverage
    ? (trip.financials.perDiemOverrideEUR ??
      trip.financials.perDiemRateEUR ??
      0)
    : 0;
  const effectiveRates = getEffectiveTripRates(basePerDiemEUR);

  const isDailyCommute = trip.vehicle?.commuteMode === "daily_commute";
  const displayPerDiemEUR = isDailyCommute
    ? effectiveRates.noStayRate
    : effectiveRates.fullRate;
  const displayPerDiemBGN = displayPerDiemEUR * EUR_TO_BGN_RATE;

  const getCoverageInfo = (cov?: string) => {
    switch (cov) {
      case "transport_only":
        return {
          badge: "Само транспорт",
          desc: "Клубът поема единствено транспорт / гориво. Дневни и квартирни пари НЕ се изплащат (еднодневен турнир наблизо).",
          icon: "🚗",
        };
      case "food_only":
        return {
          badge: "Само дневни пари",
          desc: "Клубът поема дневните пари за храна. Транспортът и нощувките са без разход за клуба (организиран или федерационен превоз).",
          icon: "🍽️",
        };
      case "food_and_sleep":
        return {
          badge: "Дневни + Нощувки",
          desc: "Клубът поема дневните пари и квартирните разходи срещу фактура. Транспортът е осигурен безплатно.",
          icon: "🛏️",
        };
      case "transport_and_food":
        return {
          badge: "Транспорт + Дневни пари",
          desc: "Клубът поема гориво/пътни и дневни пари. Нощувки не се поемат (еднодневно пътуване или настаняване без хотелски разход).",
          icon: "🚗🍽️",
        };
      case "transport_food_sleep":
      default:
        return {
          badge: "Пълен пакет",
          desc: "Клубът поема всички командировъчни разходи: транспорт, дневни пари и квартирни (нощувки).",
          icon: "✅",
        };
    }
  };

  const covInfo = getCoverageInfo(trip.expensesCoverage);

  return (
    <div className="space-y-6">
      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <BentoCard className="flex flex-col justify-between rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-none dark:border-zinc-800 dark:bg-zinc-950">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Общо разходи
            </span>
            <div className="rounded-xl bg-blue-50 p-2 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
              <Euro className="size-4" />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
              <Link
                href={`/accounting/trips/${trip.id}/expenses`}
                title="Към финансовите разходи"
                className="hover:text-blue-600 dark:hover:text-blue-400"
              >
                €{expenseSummary.totalEstimatedCostEUR.toFixed(2)}
              </Link>
            </p>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              {expenseSummary.totalEstimatedCostBGN.toFixed(2)} лв.
              {expenseSummary.calcPerDiemEUR > 0
                ? ` • Дневни: €${expenseSummary.calcPerDiemEUR.toFixed(2)}`
                : ""}
              {!expenseSummary.hasFuelReceipts &&
              expenseSummary.effectiveFuelEUR > 0
                ? ` • Гориво: €${expenseSummary.effectiveFuelEUR.toFixed(2)}`
                : ""}
              {" • "}
              {expenses.length} фактури
              {expenseSummary.invoicedPlusFuelEUR > 0
                ? ` (€${expenseSummary.invoicedPlusFuelEUR.toFixed(2)})`
                : ""}
            </p>
          </div>
        </BentoCard>

        <BentoCard className="flex flex-col justify-between rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-none dark:border-zinc-800 dark:bg-zinc-950">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Ръководител
            </span>
            <div className="rounded-xl bg-purple-50 p-2 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400">
              <User className="size-4" />
            </div>
          </div>
          <div className="mt-2">
            <p className="truncate text-base font-bold text-zinc-900 dark:text-white">
              {coach && trip.coachId ? (
                <Link
                  href={`/members/${trip.coachId}`}
                  title="Профил на ръководителя"
                  className="hover:text-blue-600 hover:underline dark:hover:text-blue-400"
                >
                  {coachName}
                </Link>
              ) : (
                coachName
              )}
            </p>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              {coach?.phone || "Няма телефон"}
            </p>
          </div>
        </BentoCard>

        <BentoCard className="flex flex-col justify-between rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-none dark:border-zinc-800 dark:bg-zinc-950">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Състезатели
            </span>
            <div className="rounded-xl bg-emerald-50 p-2 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
              <Users className="size-4" />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
              <Link
                href={`/accounting/trips/${trip.id}/athletes`}
                title="Към списъка със състезатели"
                className="hover:text-blue-600 dark:hover:text-blue-400"
              >
                {trip.participantsIds?.length || 0}
              </Link>
            </p>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              {Object.keys(trip.signatures?.athletes || {}).length} подписани
            </p>
          </div>
        </BentoCard>

        <BentoCard className="flex flex-col justify-between rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-none dark:border-zinc-800 dark:bg-zinc-950">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Заповед №
            </span>
            <div className="rounded-xl bg-amber-50 p-2 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400">
              <FileText className="size-4" />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
              <Link
                href={`/accounting/trips/${trip.id}/order`}
                title="Преглед на официалната заповед"
                className="hover:text-amber-600 dark:hover:text-amber-400"
              >
                № {trip.orderNumber || "—"}
              </Link>
            </p>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              Решение УС:{" "}
              {trip.usDecision ? (
                <Link
                  href={`/accounting/trips/${trip.id}/protocol`}
                  title="Към протокола на УС"
                  className="hover:underline hover:text-emerald-600 dark:hover:text-emerald-400"
                >
                  {trip.usDecision}
                </Link>
              ) : (
                "—"
              )}
            </p>
          </div>
        </BentoCard>
      </div>

      {/* ── Travel Parameters & Expense Coverage Bento Card ── */}
      <BentoCard className="space-y-4 rounded-2xl border border-blue-200/70 bg-linear-to-br from-blue-50/40 via-white to-indigo-50/20 p-5 shadow-none dark:border-blue-900/40 dark:from-blue-950/20 dark:via-zinc-950 dark:to-indigo-950/10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 pb-3 dark:border-zinc-800">
          <div className="space-y-0.5">
            <h3 className="text-sm font-bold tracking-wider text-blue-950 uppercase dark:text-blue-300 flex items-center gap-2">
              <Sparkles className="size-4 text-blue-600 dark:text-blue-400" />
              Параметри на пътуването & Покритие на разходи от клуба
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Точният режим на пътуване, видовете поети разходи и финансовите
              ставки за състезанието
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => openDialog("statement")}
              className="h-8 rounded-xl border-blue-300 bg-white text-xs font-semibold text-blue-700 hover:bg-blue-50 dark:border-blue-800 dark:bg-zinc-900 dark:text-blue-300 dark:hover:bg-blue-950/50"
              title="Корекция на присъствени дни, курсове на пътуване или отпадане на състезатели"
            >
              <Pencil className="mr-1.5 size-3.5 text-blue-600 dark:text-blue-400" />
              Корекция дни / курсове
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => openDialog("edit")}
              className="h-8 rounded-xl border-zinc-200 text-xs font-semibold dark:border-zinc-800"
              title="Редактирай покритие на разходи, автомобил или ставки"
            >
              <Pencil className="mr-1.5 size-3.5 text-zinc-600 dark:text-zinc-400" />
              Редактирай параметри
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 text-xs">
          {/* Режим на пътуване */}
          <div className="rounded-xl border border-zinc-100 bg-white/80 p-3.5 space-y-1.5 dark:border-zinc-800 dark:bg-zinc-900/60">
            <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
              <Repeat className="size-3.5 text-indigo-500" />
              Режим на пътуване:
            </span>
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className={
                  isDailyCommute
                    ? "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-300"
                    : "border-blue-300 bg-blue-50 text-blue-800 dark:border-blue-800 dark:bg-blue-950/50 dark:text-blue-300"
                }
              >
                <span aria-hidden="true">{isDailyCommute ? "🔄 " : "🏨 "}</span>
                {isDailyCommute
                  ? "Ежедневно пътуване (без нощувка)"
                  : "Еднократно пътуване с престой"}
              </Badge>
            </div>
            <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-relaxed">
              {isDailyCommute
                ? `Отборът пътува всеки състезателен ден и се прибира в гр. Гълъбово без преспиване. Курсове: ${transportCalc.plannedTripsCount} план. (${transportCalc.actualTripsCount} реализирани) • ${transportCalc.effectiveDistanceKm} км.`
                : `Отборът пътува еднократно и преспива на място (${trip.actualNights ?? 0} нощувки).`}
            </p>
          </div>

          {/* Покритие на разходи */}
          <div className="rounded-xl border border-zinc-100 bg-white/80 p-3.5 space-y-1.5 dark:border-zinc-800 dark:bg-zinc-900/60">
            <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
              <Shield className="size-3.5 text-emerald-500" />
              Какво поема клубът като разход:
            </span>
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className="border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 font-bold"
              >
                <span aria-hidden="true">{covInfo.icon} </span>
                {covInfo.badge}
              </Badge>
            </div>
            <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-relaxed">
              {covInfo.desc}
            </p>
          </div>

          {/* Ставки & Финанси */}
          <div className="rounded-xl border border-zinc-100 bg-white/80 p-3.5 space-y-1.5 dark:border-zinc-800 dark:bg-zinc-900/60">
            <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
              <Euro className="size-3.5 text-blue-500" />
              Ставки и лимити (на лице):
            </span>
            <div className="space-y-1 text-[11px] font-medium text-zinc-700 dark:text-zinc-300">
              <p>
                <span aria-hidden="true">🍽️ </span>Дневни пари:{" "}
                <strong>
                  €{displayPerDiemEUR.toFixed(2)} / ден (
                  {displayPerDiemBGN.toFixed(2)} лв.)
                </strong>
              </p>
              <p>
                <span aria-hidden="true">🛏️ </span>Квартирни пари:{" "}
                <strong>
                  €{(trip.financials.accommodationRateEUR ?? 0).toFixed(2)} /
                  нощувка (
                  {(
                    (trip.financials.accommodationRateEUR ?? 0) *
                    EUR_TO_BGN_RATE
                  ).toFixed(2)}{" "}
                  лв.)
                </strong>
              </p>
              <p>
                <span aria-hidden="true">🎟️ </span>Такса участие:{" "}
                <strong>
                  {trip.financials.entryFeeEUR
                    ? `€${trip.financials.entryFeeEUR}`
                    : "Поета от клуба / без такса"}
                </strong>
              </p>
            </div>
          </div>
        </div>
      </BentoCard>

      {/* Main Details Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <BentoCard className="space-y-4 rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-none lg:col-span-2 dark:border-zinc-800 dark:bg-zinc-950">
          <h3 className="text-sm font-bold tracking-wider text-zinc-900 uppercase dark:text-white">
            Информация за командировката
          </h3>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 text-xs">
            <div className="flex items-start gap-2.5">
              <MapPin className="mt-0.5 size-4 text-zinc-500 dark:text-zinc-400" />
              <div>
                <span className="font-semibold text-zinc-500 dark:text-zinc-400">
                  Дестинация:
                </span>
                <p className="text-sm font-bold text-zinc-900 dark:text-white">
                  {trip.destination}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <Calendar className="mt-0.5 size-4 text-zinc-500 dark:text-zinc-400" />
              <div>
                <span className="font-semibold text-zinc-500 dark:text-zinc-400">
                  Период:
                </span>
                <p className="text-sm font-bold text-zinc-900 dark:text-white">
                  {formatDateShort(trip.startDate)} –{" "}
                  {formatDateShort(trip.endDate)}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <Car className="mt-0.5 size-4 text-zinc-500 dark:text-zinc-400" />
              <div>
                <span className="font-semibold text-zinc-500 dark:text-zinc-400">
                  Транспорт:
                </span>
                <p className="text-sm font-bold text-zinc-900 dark:text-white">
                  {trip.transportType === "fuel_only"
                    ? `Личен автомобил (${trip.vehicle?.brand || "—"}, ${trip.vehicle?.regNumber || "—"})`
                    : trip.transportType === "club_paid"
                      ? "Клубен транспорт"
                      : "Обществен транспорт"}
                </p>
                {trip.vehicle?.fuelType && (
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    Гориво: {trip.vehicle.fuelType} • Норма:{" "}
                    {trip.vehicle.fuelNorm || "—"} л/100км
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <Shield className="mt-0.5 size-4 text-zinc-500 dark:text-zinc-400" />
              <div>
                <span className="font-semibold text-zinc-500 dark:text-zinc-400">
                  Дейност:
                </span>
                <p className="text-sm font-bold text-zinc-900 dark:text-white">
                  {trip.financials.isCommercialActivity
                    ? "Стопанска дейност"
                    : "Нестопанска дейност"}
                </p>
              </div>
            </div>
          </div>

          {event && (
            <div className="rounded-xl border border-zinc-100 bg-zinc-50/70 p-3.5 text-xs dark:border-zinc-800 dark:bg-zinc-900/40">
              <span className="font-semibold text-zinc-500 dark:text-zinc-400">
                Свързано събитие:
              </span>
              <div className="mt-1 flex items-center justify-between">
                <span className="font-bold text-zinc-900 dark:text-white">
                  {event.title}
                </span>
                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                >
                  <Link href={`/schedule?eventId=${event.id}`}>
                    Към графика
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </BentoCard>

        {/* Quick actions box */}
        <BentoCard className="flex flex-col justify-between space-y-4 rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-none dark:border-zinc-800 dark:bg-zinc-950">
          <div className="space-y-3">
            <h3 className="text-sm font-bold tracking-wider text-zinc-900 uppercase dark:text-white">
              Бързи действия
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Всички документи, корекции и мениджъри на един клик разстояние:
            </p>

            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start text-xs rounded-xl border-blue-200 bg-blue-50/50 text-blue-800 hover:bg-blue-100 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-300 font-semibold"
                onClick={() => openDialog("manager")}
              >
                <SlidersHorizontal className="mr-2 size-3.5 text-blue-600" />
                Пълен мениджър (всички бланки)
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start text-xs rounded-xl"
                onClick={() => openDialog("statement")}
              >
                <Pencil className="mr-2 size-3.5 text-amber-600" />
                Корекция дни / курсове / ведомост
              </Button>
              <Button
                asChild
                variant="outline"
                className="w-full justify-start text-xs rounded-xl"
              >
                <Link href={`/accounting/trips/${trip.id}/expenses`}>
                  <Euro className="mr-2 size-3.5 text-blue-600" />
                  Управление на разходите ({expenses.length})
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="w-full justify-start text-xs rounded-xl"
              >
                <Link href={`/accounting/trips/${trip.id}/order`}>
                  <FileText className="mr-2 size-3.5 text-indigo-600" />
                  Официална заповед за командировка
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="w-full justify-start text-xs rounded-xl"
              >
                <Link href={`/accounting/trips/${trip.id}/protocol`}>
                  <CheckCircle2 className="mr-2 size-3.5 text-emerald-600" />
                  Решение на УС и Протокол
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="w-full justify-start text-xs rounded-xl"
              >
                <Link href={`/accounting/trips/${trip.id}/athletes`}>
                  <Users className="mr-2 size-3.5 text-amber-600" />
                  Състезатели & електронни подписи
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="w-full justify-start text-xs rounded-xl"
              >
                <Link href={`/accounting/trips/${trip.id}/report`}>
                  <FileText className="mr-2 size-3.5 text-rose-600" />
                  Финансов & технически доклад
                </Link>
              </Button>
            </div>
          </div>
        </BentoCard>
      </div>
    </div>
  );
}
