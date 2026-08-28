"use client";

import {
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  CloudRain,
  Coins,
  HeartPulse,
  MapPin,
  RefreshCw,
  Tent,
  Users,
  Waves,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatEventDateRange } from "@/lib/date-utils";
import { cn } from "@/lib/utils";
import { getEventById } from "@/services/schedule-service";
import {
  fetchLiveCampForecast,
  getEstimatedWeather,
  LocationWeatherForecast,
} from "@/services/weather-service";
import { ScheduleEvent } from "@/types";

import { CampItineraryClient } from "./CampItineraryClient";

interface CampDetailsClientProps {
  campId: string;
}

export default function CampDetailsClient({ campId }: CampDetailsClientProps) {
  const [camp, setCamp] = useState<ScheduleEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [liveWeatherMap, setLiveWeatherMap] = useState<
    Record<string, LocationWeatherForecast>
  >({});
  const [weatherLoading, setWeatherLoading] = useState(false);

  const loadWeather = useCallback(async (locationName?: string) => {
    if (!locationName) return;
    setWeatherLoading(true);
    try {
      const forecast = await fetchLiveCampForecast(locationName);
      setLiveWeatherMap(forecast);
    } catch (err) {
      console.warn("Could not load live weather:", err);
    } finally {
      setWeatherLoading(false);
    }
  }, []);

  useEffect(() => {
    async function loadCamp() {
      try {
        const data = await getEventById(campId);
        setCamp(data);
        if (data?.location) {
          void loadWeather(data.location);
        }
      } catch (err) {
        console.error("Failed to load camp", err);
      } finally {
        setLoading(false);
      }
    }
    loadCamp();
  }, [campId, loadWeather]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!camp) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <Tent className="mb-4 size-12 text-zinc-300 dark:text-zinc-700" />
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Лагерът не е намерен
        </h3>
        <p className="mt-1 text-sm text-zinc-500">
          Възможно е да е изтрит или да нямате достъп.
        </p>
        <Link
          href="/training/camps"
          className="mt-4 text-primary hover:underline"
        >
          Върни се към списъка
        </Link>
      </div>
    );
  }

  const startDateObj = new Date(camp.startDate);
  const endDateObj = new Date(camp.endDate);
  const attendeesCount = camp.attendees?.length || 0;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <div className="flex items-center gap-4">
        <Link
          href="/training/camps"
          className="flex size-10 items-center justify-center rounded-full bg-zinc-100 text-zinc-600 transition-colors hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
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
        <Card className="md:col-span-1">
          <CardHeader className="bg-primary/5 pb-4">
            <CardTitle className="text-lg font-semibold">
              Обща информация
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div className="flex items-start gap-3">
              <CalendarDays className="mt-0.5 text-zinc-400" size={18} />
              <div>
                <p className="text-sm font-medium">Период</p>
                <p className="text-sm text-zinc-500">
                  {formatEventDateRange(startDateObj, endDateObj)}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <MapPin className="mt-0.5 text-zinc-400" size={18} />
              <div>
                <p className="text-sm font-medium">Локация</p>
                <p className="text-sm text-zinc-500">
                  {camp.location || "Не е посочена"}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Users className="mt-0.5 text-zinc-400" size={18} />
              <div>
                <p className="text-sm font-medium">Участници</p>
                <p className="text-sm text-zinc-500">
                  {attendeesCount} записани
                </p>
              </div>
            </div>

            {(camp.totalCampPrice || camp.campInsurancePrice) && (
              <div className="flex items-start gap-3 border-t pt-4">
                <Coins className="mt-0.5 text-amber-500" size={18} />
                <div>
                  <p className="text-sm font-medium">Финанси</p>
                  <p className="text-sm text-zinc-500">
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
              const startDateStr = camp.startDate
                ? camp.startDate.split("T")[0]
                : new Date().toISOString().split("T")[0];
              const overviewWeather = getEstimatedWeather(
                camp.location,
                startDateStr,
                "14:00",
                liveWeatherMap
              );

              return (
                <div className="rounded-2xl border border-sky-200/80 bg-linear-to-br from-amber-50/70 via-sky-50/60 to-cyan-50/70 p-4 shadow-xs dark:border-sky-900/40 dark:from-amber-950/20 dark:via-sky-950/20 dark:to-cyan-950/20">
                  <div className="flex items-center justify-between border-b border-sky-100/80 pb-2.5 dark:border-sky-900/40">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                        Климатични условия
                      </span>
                      {overviewWeather.isLive ? (
                        <Badge
                          variant="outline"
                          className="border-emerald-300 bg-emerald-100/80 text-[9px] font-bold text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300"
                        >
                          🟢 На живо
                        </Badge>
                      ) : (
                        <span className="text-[10px] text-zinc-500">
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
                      <span className="text-[10px] font-medium text-zinc-500">
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
                        <span className="text-[10px] font-medium text-zinc-500">
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
                      <span className="text-[10px] font-medium text-zinc-500">
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
                          className="text-[10px] font-medium text-zinc-500"
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

        <div className="md:col-span-2">
          <Tabs defaultValue="attendees" className="w-full">
            <TabsList className="mb-4 grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="attendees">Списък с участници</TabsTrigger>
              <TabsTrigger value="itinerary">Дневен график</TabsTrigger>
            </TabsList>

            <TabsContent
              value="attendees"
              className="mt-0 focus-visible:outline-none"
            >
              <Card>
                <CardHeader className="border-b bg-zinc-50/50 pb-4 dark:bg-zinc-900/50">
                  <CardTitle className="text-lg font-semibold">
                    Списък с участници
                  </CardTitle>
                  <CardDescription>
                    Таблица с всички записани и статуса им.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  {attendeesCount === 0 ? (
                    <div className="p-8 text-center text-sm text-zinc-500">
                      Няма записани участници.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="whitespace-nowrap">
                              Име
                            </TableHead>
                            <TableHead>Тип</TableHead>
                            <TableHead>Стая</TableHead>
                            <TableHead className="text-center">
                              Капаро
                            </TableHead>
                            <TableHead className="text-center">
                              Доплащане
                            </TableHead>
                            <TableHead className="text-center">
                              Застрах.
                            </TableHead>
                            <TableHead className="text-center">Мед.</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {camp.attendees?.map((att, index) => {
                            const isAllGood =
                              att.campDepositPaid &&
                              att.campRemainderPaid &&
                              att.campInsurancePaid &&
                              att.campMedicalProvided;

                            const displayName = att.isGuest
                              ? att.guestName || "Гост"
                              : att.name;

                            return (
                              <TableRow
                                key={att.memberId || index}
                                className={
                                  isAllGood
                                    ? "bg-emerald-50/50 hover:bg-emerald-50 dark:bg-emerald-900/10 dark:hover:bg-emerald-900/20"
                                    : ""
                                }
                              >
                                <TableCell className="font-medium">
                                  {att.memberId && !att.isGuest ? (
                                    <Link
                                      href={`/members/${att.memberId}`}
                                      className="text-primary hover:underline"
                                    >
                                      {displayName}
                                    </Link>
                                  ) : (
                                    displayName
                                  )}
                                </TableCell>
                                <TableCell>
                                  {att.isGuest ? (
                                    <Badge
                                      variant="outline"
                                      className="bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                                    >
                                      Гост
                                    </Badge>
                                  ) : (
                                    <Badge
                                      variant="secondary"
                                      className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                                    >
                                      Член
                                    </Badge>
                                  )}
                                  {att.isCampLeader && (
                                    <Badge
                                      variant="default"
                                      className="ml-1 bg-primary"
                                    >
                                      Ръководител
                                    </Badge>
                                  )}
                                </TableCell>
                                <TableCell>{att.campRoom || "-"}</TableCell>
                                <TableCell className="text-center">
                                  {att.campDepositPaid ? (
                                    <CheckCircle2
                                      className="mx-auto text-green-500"
                                      size={18}
                                    />
                                  ) : (
                                    <span className="text-zinc-400">-</span>
                                  )}
                                </TableCell>
                                <TableCell className="text-center">
                                  {att.campRemainderPaid ? (
                                    <CheckCircle2
                                      className="mx-auto text-green-500"
                                      size={18}
                                    />
                                  ) : (
                                    <span className="text-zinc-400">-</span>
                                  )}
                                </TableCell>
                                <TableCell className="text-center">
                                  {att.campInsurancePaid ? (
                                    <CheckCircle2
                                      className="mx-auto text-green-500"
                                      size={18}
                                    />
                                  ) : (
                                    <span className="text-zinc-400">-</span>
                                  )}
                                </TableCell>
                                <TableCell className="text-center">
                                  {att.campMedicalProvided ? (
                                    <HeartPulse
                                      className="mx-auto text-green-500"
                                      size={18}
                                    />
                                  ) : (
                                    <span className="text-zinc-400">-</span>
                                  )}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent
              value="itinerary"
              className="mt-0 focus-visible:outline-none"
            >
              <CampItineraryClient
                camp={camp}
                liveWeatherMap={liveWeatherMap}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
