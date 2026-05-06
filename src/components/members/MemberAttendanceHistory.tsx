"use client";

import { useState, useEffect, useMemo } from "react";
import { ScheduleEvent, Attendee, ScheduleEventType } from "@/types";
import { getEventsByMemberId } from "@/services/schedule-service";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format, getYear } from "date-fns";
import { bg } from "date-fns/locale";
import { formatTimeRange } from "@/lib/date-utils";
import {
  CalendarIcon,
  InfoIcon,
  Trophy,
  Dumbbell,
  Tent,
  PartyPopper,
  HelpCircle,
  CalendarX,
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
      <div className="space-y-4 p-4">
        <div className="h-8 w-1/3 bg-slate-200 rounded animate-pulse"></div>
        <div className="h-40 w-full bg-slate-100 rounded-lg animate-pulse"></div>
        <div className="h-40 w-full bg-slate-100 rounded-lg animate-pulse"></div>
      </div>
    );
  }

  if (totalEvents === 0) {
    return (
      <Card className="border-none shadow-none">
        <CardContent className="p-8 text-center">
          <div className="flex flex-col items-center gap-4 text-slate-400">
            <CalendarX className="h-16 w-16" />
            <h3 className="text-xl font-bold text-slate-600">
              Няма регистрирани присъствия
            </h3>
            <p className="max-w-md mx-auto text-sm">
              Когато този член бъде маркиран като присъствал на тренировка,
              състезание или друго събитие, записите ще се появят тук.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      <Card className="border-none shadow-sm">
        <CardHeader>
          <CardTitle className="text-2xl font-black tracking-tight">
            Общо {totalEvents} посещения
          </CardTitle>
          <CardDescription>
            Пълна хронология на активността на члена, групирана по месеци.
          </CardDescription>
        </CardHeader>
      </Card>

      {Object.entries(groupedEvents).map(([monthKey, monthData]) => (
        <Card key={monthKey} className="shadow-sm border-slate-100">
          <CardHeader className="border-b border-slate-100 py-4">
            <CardTitle className="flex justify-between items-center text-xl">
              <span className="font-black tracking-tight capitalize">
                {monthData.monthName} {monthData.year}
              </span>
              <Badge variant="secondary" className="font-mono text-sm">
                {monthData.total} посещения
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            {Object.entries(monthData.events).map(([type, events]) => {
              const details = eventTypeDetails[type as ScheduleEventType];
              if (!details || events.length === 0) return null;

              return (
                <div key={type}>
                  <div className="flex items-center gap-3 mb-3">
                    <details.icon className={`h-6 w-6 ${details.color}`} />
                    <h3 className={`text-lg font-bold ${details.color}`}>
                      {details.translation} ({events.length})
                    </h3>
                  </div>
                  <div className="space-y-3 pl-9">
                    {events.map((event) => (
                      <div
                        key={event.id}
                        className="border-l-2 pl-4 border-slate-200"
                      >
                        <p className="font-semibold text-slate-800">
                          {event.title}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-slate-500 mt-1">
                          <div className="flex items-center gap-1.5">
                            <CalendarIcon size={14} />
                            <span className="font-mono">
                              {format(new Date(event.startDate), "dd.MM.yyyy")}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono">
                              {formatTimeRange(event.startDate, event.endDate)}
                            </span>
                          </div>
                        </div>
                        {event.description && type !== "training" && (
                          <div className="flex items-start gap-1.5 mt-1 text-xs text-slate-400">
                            <InfoIcon size={12} className="mt-0.5" />
                            <p>{event.description}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
