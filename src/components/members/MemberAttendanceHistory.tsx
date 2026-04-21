"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { ScheduleEvent, Attendee } from "@/types";
import { getEventsByMemberId } from "@/services/schedule-service";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format, getYear, getMonth } from "date-fns";
import { bg } from "date-fns/locale";
import {
  CalendarIcon,
  MapPinIcon,
  InfoIcon,
  FilterIcon,
  CheckCheck,
} from "lucide-react";

interface MemberAttendanceHistoryProps {
  memberId: string;
}

const StatCard = ({
  title,
  value,
}: {
  title: string;
  value: string | number;
}) => (
  <Card>
    <CardHeader className="pb-2">
      <CardDescription>{title}</CardDescription>
      <CardTitle className="text-3xl">{value}</CardTitle>
    </CardHeader>
  </Card>
);

const eventTypeTranslations: { [key: string]: string } = {
  training: "Тренировка",
  sastezanie: "Състезание",
  lager: "Лагер",
  sabitie: "Събитие",
};

const getBulgarianEventType = (type: string) =>
  eventTypeTranslations[type] || type;

export function MemberAttendanceHistory({
  memberId,
}: MemberAttendanceHistoryProps) {
  const [attendedEvents, setAttendedEvents] = useState<ScheduleEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedMonth, setSelectedMonth] = useState("all");
  const [selectedType, setSelectedType] = useState("all");

  const fetchAttendance = useCallback(async () => {
    if (!memberId) return;
    setLoading(true);
    try {
      const memberEvents = await getEventsByMemberId(memberId);
      const attendedOnlyEvents = memberEvents.filter((event) => {
        const attendeeRecord = event.attendees?.find(
          (a: Attendee) => a.memberId === memberId
        );
        return attendeeRecord?.attended === true;
      });
      setAttendedEvents(attendedOnlyEvents);
    } catch (error) {
      console.error("Error fetching attendance history:", error);
    } finally {
      setLoading(false);
    }
  }, [memberId]);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  const filteredEvents = useMemo(() => {
    let events = [...attendedEvents];
    if (selectedMonth !== "all") {
      const [year, month] = selectedMonth.split("-").map(Number);
      events = events.filter((event) => {
        if (!event.startDate) return false;
        const eventDate = new Date(event.startDate);
        return getYear(eventDate) === year && getMonth(eventDate) === month;
      });
    }
    if (selectedType !== "all") {
      events = events.filter((event) => event.type === selectedType);
    }
    return events;
  }, [attendedEvents, selectedMonth, selectedType]);

  const monthOptions = useMemo(() => {
    const months = new Set<string>();
    attendedEvents.forEach((event) => {
      if (!event.startDate) return;
      const eventDate = new Date(event.startDate);
      const monthKey = `${getYear(eventDate)}-${getMonth(eventDate)}`;
      months.add(monthKey);
    });
    return Array.from(months).map((monthKey) => {
      const [year, month] = monthKey.split("-");
      const date = new Date(parseInt(year), parseInt(month));
      return {
        value: monthKey,
        label: format(date, "MMMM yyyy", { locale: bg }),
      };
    });
  }, [attendedEvents]);

  const currentMonthAttendances = useMemo(() => {
    return attendedEvents.filter((event) => {
      if (!event.startDate) return false;
      const eventDate = new Date(event.startDate);
      const currentDate = new Date();
      return (
        eventDate.getFullYear() === currentDate.getFullYear() &&
        eventDate.getMonth() === currentDate.getMonth()
      );
    }).length;
  }, [attendedEvents]);

  const formatEventDate = (
    startDate?: string | null,
    endDate?: string | null
  ) => {
    if (!startDate || !endDate) return "Няма данни за дата";
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return "Невалидна дата";

    if (format(start, "ddMMyyyy") === format(end, "ddMMyyyy")) {
      return `${format(start, "dd MMM yyyy, HH:mm", { locale: bg })} - ${format(
        end,
        "HH:mm",
        { locale: bg }
      )} ч.`;
    }
    return `${format(start, "dd MMM yyyy, HH:mm", {
      locale: bg,
    })} ч. - ${format(end, "dd MMM yyyy, HH:mm", { locale: bg })} ч.`;
  };

  if (loading) return <p>Зареждане на историята...</p>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Статистика и история на присъствията</CardTitle>
        <CardDescription>
          Преглед и филтриране на всички събития, на които членът е присъствал.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4 mb-6">
          <StatCard title="Общо посещения" value={attendedEvents.length} />
          <StatCard
            title="Посещения (текущ месец)"
            value={currentMonthAttendances}
          />
          <StatCard
            title="Резултати от филтъра"
            value={filteredEvents.length}
          />
        </div>

        <div className="flex gap-4 mb-6 p-4 border rounded-lg bg-muted/30">
          <FilterIcon className="h-5 w-5 text-muted-foreground mt-2" />
          <div className="grid md:grid-cols-2 gap-4 flex-1">
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger>
                <SelectValue placeholder="Филтрирай по месец..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Всички месеци</SelectItem>
                {monthOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger>
                <SelectValue placeholder="Филтрирай по тип..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Всички типове</SelectItem>
                {Object.entries(eventTypeTranslations).map(([key, value]) => (
                  <SelectItem key={key} value={key}>
                    {value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-4">
          {filteredEvents.length > 0 ? (
            filteredEvents.map((event) => (
              <div key={event.id} className="border p-4 rounded-lg bg-muted/20">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-lg">{event.title}</h3>
                  <Badge variant="secondary">
                    {getBulgarianEventType(event.type)}
                  </Badge>
                </div>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    <span>
                      {formatEventDate(event.startDate, event.endDate)}
                    </span>
                  </div>
                  {event.location && (
                    <div className="flex items-center">
                      <MapPinIcon className="mr-2 h-4 w-4" />
                      <span>{event.location}</span>
                    </div>
                  )}
                  {event.description && (
                    <div className="flex items-start">
                      <InfoIcon className="mr-2 h-4 w-4 mt-0.5" />
                      <p className="flex-1">{event.description}</p>
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-10 border rounded-lg">
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <CheckCheck className="h-10 w-10" />
                <h3 className="text-lg font-semibold">
                  Няма регистрирани присъствия
                </h3>
                <p className="text-sm">
                  За избраните филтри няма данни за реално посетени събития.
                </p>
              </div>
            </div>
          )}
        </div>
      </CradContent>
    </Card>
  );
}
