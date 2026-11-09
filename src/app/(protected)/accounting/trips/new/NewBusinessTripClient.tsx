"use client";

import { format, parseISO } from "date-fns";
import { bg } from "date-fns/locale";
import { getDocs } from "firebase/firestore";
import { ArrowLeft, Calendar, Search, Trophy, X } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useMemo, useState } from "react";

import { BusinessTripManagerDialog } from "@/components/business-trips/BusinessTripManagerDialog";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getEventsQuery } from "@/lib/firebase-collections";
import { businessTripService } from "@/services/business-trip-service";
import { docToScheduleEvent } from "@/services/schedule-service";
import { useAppStore } from "@/store/use-app-store";
import { BusinessTrip } from "@/types/business-trip.types";
import { ScheduleEvent } from "@/types/index";

export function NewBusinessTripClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { activeBranch } = useAppStore();
  const siteId = activeBranch || "bkgalabovo";

  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [trips, setTrips] = useState<BusinessTrip[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEvent, setSelectedEvent] = useState<ScheduleEvent | null>(
    null
  );
  const [isTripManagerOpen, setIsTripManagerOpen] = useState(false);

  const preselectedEventId = searchParams.get("eventId");

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [tripsData, snapshot] = await Promise.all([
          businessTripService.getTrips(siteId),
          getDocs(getEventsQuery()),
        ]);
        const evts = snapshot.docs
          .map(docToScheduleEvent)
          .filter(Boolean) as ScheduleEvent[];

        setTrips(tripsData);
        setEvents(evts);

        if (preselectedEventId) {
          const match = evts.find((e) => e.id === preselectedEventId);
          if (match) {
            setSelectedEvent(match);
            setIsTripManagerOpen(true);
          }
        }
      } catch (err) {
        console.error(
          "Грешка при зареждане на събития за нова командировка:",
          err
        );
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [siteId, preselectedEventId]);

  const existingTripEventIds = useMemo(() => {
    return new Set(trips.map((t) => t.eventId).filter(Boolean));
  }, [trips]);

  const relevantEvents = useMemo(() => {
    return events
      .filter(
        (ev) =>
          ev.type === "competition" ||
          ev.type === "camp" ||
          ev.type === "training"
      )
      .filter((ev) => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return (
          ev.title.toLowerCase().includes(q) ||
          (ev.location && ev.location.toLowerCase().includes(q))
        );
      })
      .sort((a, b) => b.startDate.localeCompare(a.startDate));
  }, [events, searchQuery]);

  return (
    <div className="space-y-4 pb-8">
      <PageHeader
        title="Създаване / Управление на командировка"
        description="Изберете събитие от спортния календар (турнир, шампионат или лагер) за издаване на Решение на УС, Заповед и финансова ведомост."
        breadcrumbs={[
          { label: "Начало", href: "/dashboard" },
          { label: "Счетоводство", href: "/accounting" },
          { label: "Нова командировка" },
        ]}
      >
        <Button
          asChild
          variant="outline"
          size="sm"
          className="rounded-xl border-zinc-200 text-xs font-semibold dark:border-zinc-800"
        >
          <Link href="/accounting">
            <ArrowLeft className="mr-1.5 size-3.5" />
            Назад към отчетите
          </Link>
        </Button>
      </PageHeader>

      <div className="space-y-3">
        {/* Search Bar */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Търсене по събитие или град..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-10 rounded-xl px-9 text-xs"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="Изчисти търсенето"
            >
              <X className="size-4" />
            </button>
          )}
        </div>

        {/* Events Grid */}
        {loading ? (
          <div className="p-8 text-center text-xs text-muted-foreground">
            Зареждане на календарни събития...
          </div>
        ) : relevantEvents.length === 0 ? (
          <Card className="p-8 text-center text-xs text-muted-foreground">
            Няма намерени събития.
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {relevantEvents.map((ev) => {
              const hasTrip = existingTripEventIds.has(ev.id);
              const trip = hasTrip
                ? trips.find((t) => t.eventId === ev.id)
                : null;

              return (
                <div
                  key={ev.id}
                  onClick={() => {
                    setSelectedEvent(ev);
                    setIsTripManagerOpen(true);
                  }}
                  className="group flex flex-col justify-between rounded-xl border border-zinc-200/80 bg-white p-3.5 shadow-2xs transition-all hover:border-blue-400 hover:shadow-xs cursor-pointer dark:border-zinc-800 dark:bg-zinc-900/60 dark:hover:border-blue-500"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <Trophy className="size-4 text-amber-500 shrink-0" />
                        <h4 className="text-xs font-bold text-zinc-900 line-clamp-2 dark:text-white">
                          {ev.title}
                        </h4>
                      </div>
                      {hasTrip ? (
                        <Badge
                          variant="secondary"
                          className="shrink-0 bg-blue-50 text-[10px] text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                        >
                          № {trip?.orderNumber || "Има"}
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="shrink-0 border-emerald-300 bg-emerald-50 text-[10px] text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                        >
                          + Нова
                        </Badge>
                      )}
                    </div>

                    <div className="space-y-1 text-[11px] text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="size-3" />
                        <span>
                          {format(parseISO(ev.startDate), "dd.MM.yyyy", {
                            locale: bg,
                          })}
                          {ev.endDate && ev.endDate !== ev.startDate && (
                            <>
                              {" "}
                              -{" "}
                              {format(parseISO(ev.endDate), "dd.MM.yyyy", {
                                locale: bg,
                              })}
                            </>
                          )}
                        </span>
                      </div>
                      {ev.location && <div>📍 {ev.location}</div>}
                      <div>
                        👥 {ev.attendeeMemberIds?.length || 0} участници
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 flex justify-end pt-2 border-t border-zinc-100 dark:border-zinc-800">
                    <Button
                      size="sm"
                      variant={hasTrip ? "outline" : "default"}
                      className="h-7 text-xs font-semibold"
                    >
                      {hasTrip ? "Управление" : "Създай командировка"}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {selectedEvent && (
        <BusinessTripManagerDialog
          event={selectedEvent}
          open={isTripManagerOpen}
          onOpenChange={(open) => {
            setIsTripManagerOpen(open);
            if (!open) {
              router.push("/accounting");
            }
          }}
        />
      )}
    </div>
  );
}
