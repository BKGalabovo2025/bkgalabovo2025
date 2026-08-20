"use client";

import { CalendarDays, ExternalLink, MapPin, Tent, Users } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatEventDateRange } from "@/lib/date-utils";
import { getCamps } from "@/services/schedule-service";
import { ScheduleEvent } from "@/types";

export default function CampsClient() {
  const [camps, setCamps] = useState<ScheduleEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCamps() {
      try {
        const data = await getCamps();
        setCamps(data);
      } catch (err) {
        console.error("Failed to load camps", err);
      } finally {
        setLoading(false);
      }
    }
    loadCamps();
  }, []);

  const now = new Date();

  const upcomingCamps = camps.filter((camp) => new Date(camp.endDate) >= now);

  const pastCamps = camps.filter((camp) => new Date(camp.endDate) < now);

  const renderCampCards = (items: ScheduleEvent[]) => {
    if (items.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center p-12 text-center">
          <Tent className="mb-4 size-12 text-zinc-300 dark:text-zinc-700" />
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Няма намерени лагери
          </h3>
          <p className="mt-1 text-sm text-zinc-500">
            В тази категория все още няма планирани лагери.
          </p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {items.map((camp) => {
          const startDateObj = new Date(camp.startDate);
          const endDateObj = new Date(camp.endDate);
          const attendeesCount = camp.attendees?.length || 0;

          return (
            <Card
              key={camp.id}
              className="flex h-full flex-col overflow-hidden transition-all hover:shadow-md dark:hover:border-zinc-700"
            >
              <CardHeader className="bg-primary/5 pb-4">
                <CardTitle className="text-xl font-bold">
                  {camp.title}
                </CardTitle>
                <CardDescription className="flex items-center gap-1.5 pt-2 text-zinc-600 dark:text-zinc-300">
                  <MapPin size={16} />
                  <span>{camp.location || "Без локация"}</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 space-y-4 pt-6">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 rounded-full bg-blue-100 p-1.5 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                    <CalendarDays size={16} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      Период на провеждане
                    </p>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                      {formatEventDateRange(startDateObj, endDateObj)}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="mt-0.5 rounded-full bg-green-100 p-1.5 text-green-600 dark:bg-green-900/30 dark:text-green-400">
                    <Users size={16} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      Участници
                    </p>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                      {attendeesCount}{" "}
                      {attendeesCount === 1 ? "записан" : "записани"}
                    </p>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="border-t bg-zinc-50 pt-4 dark:bg-zinc-900/50">
                <Link
                  href={`/training/camps/${camp.id}`}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-zinc-900 shadow-sm transition-colors hover:bg-zinc-50 hover:text-primary dark:bg-zinc-950 dark:text-white dark:hover:bg-zinc-900 dark:hover:text-primary"
                >
                  <span>Детайли за лагера</span>
                  <ExternalLink size={16} />
                </Link>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    );
  };

  return (
    <div className="flex flex-1 flex-col p-6">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
            Планирани лагери
          </h1>
          <p className="mt-2 text-zinc-500 dark:text-zinc-400">
            Управление на предстоящи и минали тренировъчни лагери
          </p>
        </div>
      </div>

      <Tabs defaultValue="upcoming" className="w-full">
        <TabsList className="mb-6 grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="upcoming">Предстоящи</TabsTrigger>
          <TabsTrigger value="past">Минали</TabsTrigger>
        </TabsList>
        <TabsContent
          value="upcoming"
          className="mt-0 focus-visible:outline-none"
        >
          {loading ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-64 w-full rounded-xl" />
              ))}
            </div>
          ) : (
            renderCampCards(upcomingCamps)
          )}
        </TabsContent>
        <TabsContent value="past" className="mt-0 focus-visible:outline-none">
          {loading ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-64 w-full rounded-xl" />
              ))}
            </div>
          ) : (
            renderCampCards(pastCamps)
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
