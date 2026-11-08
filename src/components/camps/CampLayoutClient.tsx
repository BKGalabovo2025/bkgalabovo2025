"use client";

import {
  CalendarDays,
  ChevronLeft,
  CloudRain,
  Coins,
  ExternalLink,
  MapPin,
  RefreshCw,
  Users,
  Waves,
} from "lucide-react";
import Link from "next/link";
import React from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatEventDateRange } from "@/lib/date-utils";
import { cn } from "@/lib/utils";
import { getEstimatedWeather } from "@/services/weather-service";

import { useCampContext } from "./CampContext";
import { CampNav } from "./CampNav";

interface CampLayoutClientProps {
  children: React.ReactNode;
}

export function CampLayoutClient({ children }: CampLayoutClientProps) {
  const { camp, liveWeatherMap, weatherLoading, loadWeather } =
    useCampContext();

  const startDateObj = new Date(camp.startDate);
  const endDateObj = new Date(camp.endDate);
  const attendeesCount = camp.attendees?.length || 0;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 pb-12 duration-500 animate-in fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/training/camps"
          className="flex size-10 items-center justify-center rounded-full bg-zinc-100 text-zinc-600 transition-colors hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
          title="Към списъка с лагери"
        >
          <ChevronLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
            {camp.title}
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Детайлен преглед на лагера и участниците
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* Left Column: General Information Card */}
        <Card className="border border-zinc-200/80 bg-white shadow-xs md:col-span-1 dark:border-zinc-800 dark:bg-zinc-900/60">
          <CardHeader className="bg-primary/5 pb-4 dark:bg-zinc-800/40">
            <CardTitle className="text-lg font-semibold text-zinc-950 dark:text-zinc-100">
              Обща информация
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div className="flex items-start gap-3">
              <CalendarDays className="mt-0.5 text-zinc-400" size={18} />
              <div>
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  Период
                </p>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  {formatEventDateRange(startDateObj, endDateObj)}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-3">
                  <MapPin className="mt-0.5 text-rose-500" size={18} />
                  <div>
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      Локация
                    </p>
                    <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                      {camp.location || "ММЦ Приморско"}
                    </p>
                  </div>
                </div>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(camp.location || "ММЦ Приморско")}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 rounded-md border border-zinc-200 bg-white px-2 py-1 text-[11px] font-medium text-zinc-700 shadow-2xs hover:bg-zinc-50 hover:text-zinc-950 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
                  title="Отвори в Google Maps"
                >
                  <ExternalLink size={11} />
                  <span>Карта</span>
                </a>
              </div>

              {/* Interactive Mini-Map Preview */}
              <div className="group relative mt-1 h-36 w-full overflow-hidden rounded-xl border border-zinc-200 bg-zinc-100 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
                <iframe
                  title="Мини карта на локацията"
                  width="100%"
                  height="100%"
                  className="size-full border-0"
                  loading="lazy"
                  src={`https://maps.google.com/maps?q=${encodeURIComponent(camp.location || "ММЦ Приморско")}&t=&z=14&ie=UTF8&iwloc=&output=embed`}
                />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-between bg-linear-to-t from-black/80 via-black/40 to-transparent p-2 text-white">
                  <span className="flex items-center gap-1 text-[10px] font-medium text-zinc-200">
                    <MapPin size={11} className="text-rose-400" />
                    {camp.location || "ММЦ Приморско"}
                  </span>
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(camp.location || "ММЦ Приморско")}`}
                    target="_blank"
                    rel="noreferrer"
                    className="pointer-events-auto inline-flex items-center gap-1 rounded-md bg-white/90 px-2 py-0.5 text-[9px] font-bold text-zinc-900 shadow-xs hover:bg-white dark:bg-zinc-900/90 dark:text-zinc-100 dark:hover:bg-zinc-900"
                  >
                    <span>Навигация</span>
                    <ExternalLink size={8} />
                  </a>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Users className="mt-0.5 text-zinc-400" size={18} />
              <div>
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  Участници
                </p>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  {attendeesCount} записани
                </p>
              </div>
            </div>

            {(camp.totalCampPrice || camp.campInsurancePrice) && (
              <div className="flex items-start gap-3 border-t border-zinc-100 pt-4 dark:border-zinc-800">
                <Coins className="mt-0.5 text-amber-500" size={18} />
                <div>
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    Финанси
                  </p>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    {camp.totalCampPrice &&
                      `Обща цена: ${camp.totalCampPrice} EUR`}
                    {camp.totalCampPrice && camp.campInsurancePrice && <br />}
                    {camp.campInsurancePrice &&
                      `Застраховка: ${camp.campInsurancePrice} EUR`}
                  </p>
                </div>
              </div>
            )}

            {(() => {
              const todayStr = new Date().toISOString().split("T")[0];
              const campStartStr = camp.startDate
                ? camp.startDate.split("T")[0]
                : todayStr;
              const campEndStr = camp.endDate
                ? camp.endDate.split("T")[0]
                : todayStr;
              const isOngoingToday =
                todayStr >= campStartStr && todayStr <= campEndStr;
              const targetDate = isOngoingToday ? todayStr : campStartStr;

              const overviewWeather = getEstimatedWeather(
                camp.location,
                targetDate,
                "14:00",
                liveWeatherMap
              );

              return (
                <div className="rounded-2xl border border-sky-200/80 bg-linear-to-br from-amber-50/70 via-sky-50/60 to-cyan-50/70 p-4 shadow-xs dark:border-sky-900/40 dark:from-amber-950/20 dark:via-sky-950/20 dark:to-cyan-950/20">
                  <div className="flex items-center justify-between border-b border-sky-100/80 pb-2.5 dark:border-sky-900/40">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                        Климатични условия {isOngoingToday && "(Днес)"}
                      </span>
                      {overviewWeather.isLive ? (
                        <Badge
                          variant="outline"
                          className="border-emerald-300 bg-emerald-100/80 text-[9px] font-bold text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300"
                        >
                          🟢 На живо
                        </Badge>
                      ) : (
                        <span className="text-[10px] text-zinc-500 dark:text-zinc-400">
                          (Сезонна прогноза)
                        </span>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => void loadWeather(camp.location)}
                      disabled={weatherLoading}
                      className="h-7 px-2 text-[11px] text-zinc-600 hover:bg-white/80 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800"
                      title="Актуализирай прогнозата за дните на лагера"
                    >
                      <RefreshCw
                        size={12}
                        className={cn(
                          "mr-1",
                          weatherLoading && "animate-spin text-primary"
                        )}
                      />
                      {weatherLoading ? "Зареждане..." : "Обнови"}
                    </Button>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                    {/* Air Temperature */}
                    <div className="flex flex-col items-center justify-center rounded-xl bg-white/70 p-2.5 text-center shadow-2xs backdrop-blur-xs dark:bg-zinc-900/60">
                      <span className="text-xl">
                        {overviewWeather.iconEmoji}
                      </span>
                      <span className="text-sm font-black text-amber-900 dark:text-amber-200">
                        {overviewWeather.airTemp}°C
                      </span>
                      <span className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400">
                        Въздух
                      </span>
                    </div>

                    {/* Sea Temperature */}
                    {overviewWeather.waterTemp !== undefined && (
                      <div className="flex flex-col items-center justify-center rounded-xl bg-white/70 p-2.5 text-center shadow-2xs backdrop-blur-xs dark:bg-zinc-900/60">
                        <span className="text-xl">🌊</span>
                        <span className="text-sm font-black text-cyan-900 dark:text-cyan-200">
                          {overviewWeather.waterTemp}°C
                        </span>
                        <span className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400">
                          Морска вода
                        </span>
                      </div>
                    )}

                    {/* Rain Probability */}
                    <div className="flex flex-col items-center justify-center rounded-xl bg-white/70 p-2.5 text-center shadow-2xs backdrop-blur-xs dark:bg-zinc-900/60">
                      <CloudRain className="size-5 text-blue-500" />
                      <span
                        className={cn(
                          "text-sm font-black",
                          (overviewWeather.rainProbability ?? 0) > 40
                            ? "text-blue-700 dark:text-blue-300"
                            : "text-zinc-800 dark:text-zinc-200"
                        )}
                      >
                        {overviewWeather.rainProbability ?? 0}%
                      </span>
                      <span className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400">
                        Вероятност за дъжд
                      </span>
                    </div>

                    {/* Sea State / Waves */}
                    {overviewWeather.waveHeight !== undefined && (
                      <div className="flex flex-col items-center justify-center rounded-xl bg-white/70 p-2.5 text-center shadow-2xs backdrop-blur-xs dark:bg-zinc-900/60">
                        <Waves className="size-5 text-teal-600 dark:text-teal-400" />
                        <span className="text-sm font-black text-teal-900 dark:text-teal-200">
                          {overviewWeather.waveHeight} м
                        </span>
                        <span
                          className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400"
                          title={overviewWeather.seaStateLabel}
                        >
                          {overviewWeather.seaStateBalls} бала (
                          {overviewWeather.seaStateFlag})
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
          </CardContent>
        </Card>

        {/* Right Column: Sticky Navigation and Section Content */}
        <div className="space-y-3.5 md:col-span-2">
          <div className="sticky top-16 z-20 -mx-1 backdrop-blur-md sm:top-20 p-1">
            <CampNav campId={camp.id} attendeesCount={attendeesCount} />
          </div>

          <div className="duration-300 animate-in fade-in-50">{children}</div>
        </div>
      </div>
    </div>
  );
}
