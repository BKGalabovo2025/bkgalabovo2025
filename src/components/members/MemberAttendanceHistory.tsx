"use client";

import { useState, useEffect, useMemo } from "react";
import { ScheduleEvent, Attendee, ScheduleEventType } from "@/types";
import { getEventsByMemberId } from "@/services/schedule-service";
import { Badge } from "@/components/ui/badge";
import { format, getYear } from "date-fns";
import { bg } from "date-fns/locale";
import { formatTimeRange } from "@/lib/date-utils";
import {
  CalendarIcon,
  Trophy,
  Dumbbell,
  Tent,
  PartyPopper,
  HelpCircle,
  CalendarX,
  Loader2,
  Clock,
  MapPin,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface MemberAttendanceHistoryProps {
  memberId: string;
}

const eventTypeDetails: Record<
  ScheduleEventType,
  {
    translation: string;
    icon: React.ElementType;
    color: string;
    bgColor: string;
  }
> = {
  training: {
    translation: "Тренировки",
    icon: Dumbbell,
    color: "text-blue-500",
    bgColor: "bg-blue-50",
  },
  competition: {
    translation: "Състезания",
    icon: Trophy,
    color: "text-amber-500",
    bgColor: "bg-amber-50",
  },
  camp: {
    translation: "Лагери",
    icon: Tent,
    color: "text-green-500",
    bgColor: "bg-green-50",
  },
  event: {
    translation: "Събития",
    icon: PartyPopper,
    color: "text-purple-500",
    bgColor: "bg-purple-50",
  },
  other: {
    translation: "Други",
    icon: HelpCircle,
    color: "text-zinc-400",
    bgColor: "bg-zinc-50",
  },
};

interface GroupedEvents {
  [monthKey: string]: {
    monthName: string;
    year: number;
    events: Partial<Record<ScheduleEventType, ScheduleEvent[]>>;
    total: number;
  };
}

export function MemberAttendanceHistory({
  memberId,
}: MemberAttendanceHistoryProps) {
  const [attendedEvents, setAttendedEvents] = useState<ScheduleEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAttendance = async () => {
      if (!memberId) return;
      setLoading(true);
      try {
        const memberEvents = await getEventsByMemberId(memberId);
        const attendedOnlyEvents = memberEvents
          .filter((event) => {
            const attendeeRecord = event.attendees?.find(
              (a: Attendee) => a.memberId === memberId
            );
            return attendeeRecord?.attended === true;
          })
          .sort(
            (a, b) =>
              new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
          );
        setAttendedEvents(attendedOnlyEvents);
      } catch (error) {
        console.error("Error fetching attendance history:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAttendance();
  }, [memberId]);

  const groupedEvents = useMemo(() => {
    return attendedEvents.reduce((acc, event) => {
      const eventDate = new Date(event.startDate);
      const monthKey = format(eventDate, "yyyy-MM");

      if (!acc[monthKey]) {
        acc[monthKey] = {
          monthName: format(eventDate, "LLLL", { locale: bg }),
          year: getYear(eventDate),
          events: {},
          total: 0,
        };
      }

      // Logic to unify training sessions:
      // If type is 'other' but title contains 'Тренировка', treat it as 'training'
      let effectiveType = event.type;
      if (
        effectiveType === "other" &&
        event.title.toLowerCase().includes("тренировка")
      ) {
        effectiveType = "training";
      }

      if (!acc[monthKey].events[effectiveType]) {
        acc[monthKey].events[effectiveType] = [];
      }

      acc[monthKey].events[effectiveType]?.push(event);
      acc[monthKey].total++;

      return acc;
    }, {} as GroupedEvents);
  }, [attendedEvents]);

  const totalEvents = attendedEvents.length;

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2
          className="h-8 w-8 animate-spin text-zinc-200"
          strokeWidth={1.5}
        />
      </div>
    );
  }

  if (totalEvents === 0) {
    return (
      <div className="p-16 text-center bg-white border border-zinc-100 rounded-5xl">
        <div className="h-16 w-16 bg-zinc-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <CalendarX className="h-8 w-8 text-zinc-200" strokeWidth={1} />
        </div>
        <h3 className="text-[11px] font-medium text-zinc-400 uppercase tracking-widest3 mb-3">
          Няма регистрирани присъствия
        </h3>
        <p className="max-w-md mx-auto text-sm font-light text-zinc-400 leading-relaxed">
          Когато този член бъде маркиран като присъствал на събитие, записите ще
          се появят тук.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-8 bg-zinc-950 rounded-5xl text-white flex flex-col justify-between h-40 shadow-xl shadow-zinc-950/10">
          <p className="text-[10px] font-medium uppercase tracking-widest2 text-zinc-400">
            Общо посещения
          </p>
          <div className="flex items-end justify-between">
            <h2 className="text-5xl font-light tracking-tighter">
              {totalEvents}
            </h2>
            <div className="h-12 w-12 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <Dumbbell className="h-5 w-5 text-white" strokeWidth={1.5} />
            </div>
          </div>
        </div>

        <div className="p-8 bg-white border border-zinc-100 rounded-5xl flex flex-col justify-between h-40">
          <p className="text-[10px] font-medium uppercase tracking-widest2 text-zinc-400">
            Последна активност
          </p>
          <div className="flex items-end justify-between">
            <h2 className="text-xl font-light text-zinc-950">
              {attendedEvents.length > 0
                ? format(new Date(attendedEvents[0].startDate), "dd MMM", {
                    locale: bg,
                  })
                : "—"}
            </h2>
            <div className="h-12 w-12 bg-zinc-50 rounded-xl flex items-center justify-center">
              <CalendarIcon
                className="h-5 w-5 text-zinc-300"
                strokeWidth={1.5}
              />
            </div>
          </div>
        </div>

        <div className="p-8 bg-white border border-zinc-100 rounded-5xl flex flex-col justify-between h-40">
          <p className="text-[10px] font-medium uppercase tracking-widest2 text-zinc-400">
            Месечен статус
          </p>
          <div className="flex items-end justify-between">
            <Badge
              variant="outline"
              className="bg-green-50 text-green-600 border-green-100 rounded-full px-4 py-1 text-[10px] font-medium uppercase tracking-widest"
            >
              Активен
            </Badge>
            <div className="h-12 w-12 bg-zinc-50 rounded-xl flex items-center justify-center">
              <Trophy className="h-5 w-5 text-zinc-300" strokeWidth={1.5} />
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-16">
        {Object.entries(groupedEvents).map(([monthKey, monthData]) => (
          <div key={monthKey} className="relative">
            <div className="flex items-center gap-6 mb-8">
              <h3 className="text-sm font-medium text-zinc-950 uppercase tracking-widest2 shrink-0">
                {monthData.monthName}{" "}
                <span className="text-zinc-300 ml-1">{monthData.year}</span>
              </h3>
              <div className="h-px bg-zinc-100 grow" />
              <Badge
                variant="outline"
                className="rounded-full px-4 py-1 text-[10px] font-medium uppercase tracking-widest border-zinc-100 text-zinc-400 bg-zinc-50/50"
              >
                {monthData.total} посещения
              </Badge>
            </div>

            <div className="grid grid-cols-1 gap-8">
              {Object.entries(monthData.events).map(([type, events]) => {
                const details =
                  eventTypeDetails[type as ScheduleEventType] ||
                  eventTypeDetails.other;
                if (events.length === 0) return null;

                return (
                  <div key={type} className="group/section">
                    <div className="flex items-center gap-4 mb-6">
                      <div className={cn("p-2 rounded-xl", details.bgColor)}>
                        <details.icon
                          className={cn("h-4 w-4", details.color)}
                          strokeWidth={1.5}
                        />
                      </div>
                      <h4 className="text-[10px] font-medium uppercase tracking-widest2 text-zinc-400">
                        {details.translation}{" "}
                        <span className="text-zinc-200 ml-1">
                          / {events.length}
                        </span>
                      </h4>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {events.map((event) => (
                        <Link
                          key={event.id}
                          href={`/schedule/${event.id}`}
                          className="group relative bg-white border border-zinc-100 rounded-3xl p-6 hover:border-zinc-900 transition-all duration-500 hover:shadow-2xl hover:shadow-zinc-950/5"
                        >
                          <div className="flex justify-between items-start mb-4">
                            <div className="space-y-1">
                              <p className="text-xs font-medium text-zinc-950 group-hover:text-zinc-900 transition-colors">
                                {event.title}
                              </p>
                              <p className="text-[10px] font-light text-zinc-400 uppercase tracking-widest">
                                {format(new Date(event.startDate), "dd MMMM", {
                                  locale: bg,
                                })}
                              </p>
                            </div>
                            <div
                              className={cn(
                                "p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-500",
                                details.bgColor
                              )}
                            >
                              <details.icon
                                className={cn("h-3 w-3", details.color)}
                                strokeWidth={2}
                              />
                            </div>
                          </div>

                          <div className="flex items-center gap-4 mt-auto pt-4 border-t border-zinc-50">
                            <div className="flex items-center gap-1.5">
                              <Clock className="h-3 w-3 text-zinc-300" />
                              <span className="text-[10px] font-light text-zinc-400 uppercase tracking-widest">
                                {formatTimeRange(
                                  event.startDate,
                                  event.endDate
                                )}
                              </span>
                            </div>
                            {event.location && (
                              <div className="flex items-center gap-1.5 ml-auto">
                                <MapPin className="h-3 w-3 text-zinc-300" />
                                <span className="text-[10px] font-light text-zinc-400 truncate max-w-[80px]">
                                  {event.location}
                                </span>
                              </div>
                            )}
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
