"use client";

import {
  Calendar,
  Car,
  CheckCircle2,
  Euro,
  FileText,
  MapPin,
  Shield,
  User,
  Users,
} from "lucide-react";
import Link from "next/link";
import React from "react";

import { useTripDetails } from "@/components/business-trips/details/TripDetailsContext";
import { BentoCard } from "@/components/ui/bento-card";
import { Button } from "@/components/ui/button";
import { formatDateShort } from "@/lib/date-utils";

export function TripOverviewView() {
  const { trip, event, expenses, membersDict } = useTripDetails();

  const coach = trip.coachId ? membersDict[trip.coachId] : null;
  const coachName = coach
    ? `${coach.firstName} ${coach.lastName}`
    : trip.coachName || "Не е избран";

  const totalExpenses = expenses.reduce(
    (sum, exp) => sum + (exp.amountEUR || 0),
    0
  );

  return (
    <div className="space-y-6">
      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <BentoCard className="flex flex-col justify-between rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-none dark:border-zinc-800 dark:bg-zinc-950">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500">
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
                €{totalExpenses.toFixed(2)}
              </Link>
            </p>
            <p className="text-[11px] text-zinc-400">
              {(totalExpenses * 1.95583).toFixed(2)} лв. • {expenses.length}{" "}
              фактури
            </p>
          </div>
        </BentoCard>

        <BentoCard className="flex flex-col justify-between rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-none dark:border-zinc-800 dark:bg-zinc-950">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500">
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
            <p className="text-[11px] text-zinc-400">
              {coach?.phone || "Няма телефон"}
            </p>
          </div>
        </BentoCard>

        <BentoCard className="flex flex-col justify-between rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-none dark:border-zinc-800 dark:bg-zinc-950">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500">
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
            <p className="text-[11px] text-zinc-400">
              {Object.keys(trip.signatures?.athletes || {}).length} подписани
            </p>
          </div>
        </BentoCard>

        <BentoCard className="flex flex-col justify-between rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-none dark:border-zinc-800 dark:bg-zinc-950">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500">Заповед №</span>
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
            <p className="text-[11px] text-zinc-400">
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

      {/* Main Details Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <BentoCard className="space-y-4 rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-none lg:col-span-2 dark:border-zinc-800 dark:bg-zinc-950">
          <h3 className="text-sm font-bold tracking-wider text-zinc-900 uppercase dark:text-white">
            Информация за командировката
          </h3>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 text-xs">
            <div className="flex items-start gap-2.5">
              <MapPin className="mt-0.5 size-4 text-zinc-400" />
              <div>
                <span className="font-semibold text-zinc-500">Дестинация:</span>
                <p className="text-sm font-bold text-zinc-900 dark:text-white">
                  {trip.destination}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <Calendar className="mt-0.5 size-4 text-zinc-400" />
              <div>
                <span className="font-semibold text-zinc-500">Период:</span>
                <p className="text-sm font-bold text-zinc-900 dark:text-white">
                  {formatDateShort(trip.startDate)} –{" "}
                  {formatDateShort(trip.endDate)}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <Car className="mt-0.5 size-4 text-zinc-400" />
              <div>
                <span className="font-semibold text-zinc-500">Транспорт:</span>
                <p className="text-sm font-bold text-zinc-900 dark:text-white">
                  {trip.transportType === "fuel_only"
                    ? `Личен автомобил (${trip.vehicle?.brand || "—"}, ${trip.vehicle?.regNumber || "—"})`
                    : trip.transportType === "club_paid"
                      ? "Клубен транспорт"
                      : "Обществен транспорт"}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <Shield className="mt-0.5 size-4 text-zinc-400" />
              <div>
                <span className="font-semibold text-zinc-500">Дейност:</span>
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
              <span className="font-semibold text-zinc-500">
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
            <p className="text-xs text-zinc-500">
              Всички документи и подстраници са на един клик разстояние:
            </p>

            <div className="space-y-2">
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
