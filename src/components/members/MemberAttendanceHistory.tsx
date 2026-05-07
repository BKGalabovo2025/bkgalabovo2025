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
} from "lucide-react";

interface MemberAttendanceHistoryProps {
  memberId: string;
}

const eventTypeDetails: Record<
  ScheduleEventType,
  { translation: string; icon: React.ElementType; color: string }
> = {
  training: {
    translation: "Тренировки",
    icon: Dumbbell,
    color: "text-blue-500",
  },
  competition: {
    translation: "Състезания",
    icon: Trophy,
    color: "text-amber-500",
  },
  camp: { translation: "Лагери", icon: Tent, color: "text-green-500" },
  event: {
    translation: "Събития",
    icon: PartyPopper,
    color: "text-purple-500",
  },
  other: { translation: "Други", icon: HelpCircle, color: "text-slate-500" },
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

      if (!acc[monthKey].events[event.type]) {
        acc[monthKey].events[event.type] = [];
      }

      acc[monthKey].events[event.type]?.push(event);
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
      <div className="p-16 text-center bg-white border border-zinc-100 rounded-[2.5rem]">
        <div className="h-16 w-16 bg-zinc-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <CalendarX className="h-8 w-8 text-zinc-200" strokeWidth={1} />
        </div>
        <h3 className="text-[11px] font-medium text-zinc-400 uppercase tracking-[0.3em] mb-3">
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
    <div className="space-y-8">
      <div className="p-8 bg-zinc-50/50 rounded-[2rem] border border-zinc-100/50 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-light tracking-tighter text-zinc-950">
            {totalEvents} посещения
          </h2>
          <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-zinc-400 mt-2">
            Пълна хронология на активността
          </p>
        </div>
        <div className="h-12 w-12 bg-white rounded-xl border border-zinc-100 flex items-center justify-center">
          <Trophy className="h-5 w-5 text-zinc-300" strokeWidth={1.5} />
        </div>
      </div>

      {Object.entries(groupedEvents).map(([monthKey, monthData]) => (
        <div
          key={monthKey}
          className="bg-white border border-zinc-100 rounded-[2.5rem] overflow-hidden shadow-none"
        >
          <div className="p-8 border-b border-zinc-50 flex justify-between items-center bg-zinc-50/20">
            <h3 className="text-[11px] font-medium uppercase tracking-[0.4em] text-zinc-400">
              <span className="text-zinc-950">{monthData.monthName}</span>{" "}
              {monthData.year}
            </h3>
            <Badge
              variant="outline"
              className="rounded-full px-4 py-1 text-[10px] font-medium uppercase tracking-widest border-zinc-100 text-zinc-400"
            >
              {monthData.total} записа
            </Badge>
          </div>
          <div className="p-8 space-y-12">
            {Object.entries(monthData.events).map(([type, events]) => {
              const details = eventTypeDetails[type as ScheduleEventType];
              if (!details || events.length === 0) return null;

              return (
                <div key={type}>
                  <div className="flex items-center gap-4 mb-6">
                    <div
                      className={`p-2.5 rounded-xl bg-zinc-50 ${details.color.replace("text-", "text-opacity-70 text-")}`}
                    >
                      <details.icon className="h-5 w-5" strokeWidth={1.5} />
                    </div>
                    <h3 className="text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-400">
                      {details.translation}{" "}
                      <span className="text-zinc-300 ml-1">
                        ({events.length})
                      </span>
                    </h3>
                  </div>
                  <div className="space-y-6 ml-4 border-l border-zinc-100 pl-8">
                    {events.map((event) => (
                      <div key={event.id} className="relative group">
                        <div className="absolute -left-[37px] top-1.5 h-2 w-2 rounded-full bg-zinc-100 ring-4 ring-white group-hover:bg-zinc-900 transition-colors" />
                        <p className="text-sm font-medium text-zinc-950">
                          {event.title}
                        </p>
                        <div className="flex items-center gap-6 text-[10px] font-light text-zinc-400 uppercase tracking-widest mt-2">
                          <div className="flex items-center gap-2">
                            <CalendarIcon size={12} strokeWidth={1.5} />
                            <span>
                              {format(
                                new Date(event.startDate),
                                "dd MMM yyyy",
                                { locale: bg }
                              )}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span>
                              {formatTimeRange(event.startDate, event.endDate)}
                            </span>
                          </div>
                        </div>
                        {event.description && type !== "training" && (
                          <div className="mt-3 text-xs font-light text-zinc-400 leading-relaxed max-w-lg">
                            {event.description}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
