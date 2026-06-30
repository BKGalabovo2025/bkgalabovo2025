 
 
 
"use client";

import { useMemo } from "react";
import useSWR from "swr";
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
  CheckCircle2,
  XCircle,
  CreditCard,
  Receipt,
} from "lucide-react";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
  const { data: memberEvents, isLoading: loading } = useSWR(
    memberId ? `events_${memberId}` : null,
    () => getEventsByMemberId(memberId)
  );

  const attendedEvents = useMemo(() => {
    if (!memberEvents) return [];
    return memberEvents
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
  }, [memberEvents, memberId]);

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
    <div className="bg-white border border-zinc-100 rounded-3xl sm:rounded-4xl lg:rounded-5xl p-4 sm:p-8 lg:p-10 space-y-12">
      {/* Header Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="p-6 sm:p-8 bg-zinc-950 rounded-3xl sm:rounded-5xl text-white flex flex-col justify-between h-32 sm:h-40 shadow-xl shadow-zinc-950/10">
          <p className="text-[9px] sm:text-[10px] font-medium uppercase tracking-widest2 text-zinc-400">
            Общо посещения
          </p>
          <div className="flex items-end justify-between">
            <h2 className="text-3xl sm:text-5xl font-light tracking-tighter">
              {totalEvents}
            </h2>
            <div className="h-9 w-9 sm:h-12 sm:w-12 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <Dumbbell
                className="h-4 w-4 sm:h-5 sm:w-5 text-white"
                strokeWidth={1.5}
              />
            </div>
          </div>
        </div>

        <div className="p-6 sm:p-8 bg-white border border-zinc-100 rounded-3xl sm:rounded-5xl flex flex-col justify-between h-32 sm:h-40">
          <p className="text-[9px] sm:text-[10px] font-medium uppercase tracking-widest2 text-zinc-400">
            Последна активност
          </p>
          <div className="flex items-end justify-between">
            <h2 className="text-base sm:text-xl font-light text-zinc-950">
              {attendedEvents.length > 0
                ? format(new Date(attendedEvents[0].startDate), "dd MMM", {
                    locale: bg,
                  })
                : "—"}
            </h2>
            <div className="h-9 w-9 sm:h-12 sm:w-12 bg-zinc-50 rounded-xl flex items-center justify-center">
              <CalendarIcon
                className="h-4 w-4 sm:h-5 sm:w-5 text-zinc-300"
                strokeWidth={1.5}
              />
            </div>
          </div>
        </div>

        <div className="p-6 sm:p-8 bg-white border border-zinc-100 rounded-3xl sm:rounded-5xl flex flex-col justify-between h-32 sm:h-40 sm:col-span-2 lg:col-span-1">
          <p className="text-[9px] sm:text-[10px] font-medium uppercase tracking-widest2 text-zinc-400">
            Месечен статус
          </p>
          <div className="flex items-end justify-between">
            <Badge
              variant="outline"
              className="bg-green-50 text-green-600 border-green-100 rounded-full px-3 py-0.5 text-[9px] sm:text-[10px] font-medium uppercase tracking-widest"
            >
              Активен
            </Badge>
            <div className="h-9 w-9 sm:h-12 sm:w-12 bg-zinc-50 rounded-xl flex items-center justify-center">
              <Trophy
                className="h-4 w-4 sm:h-5 sm:w-5 text-zinc-300"
                strokeWidth={1.5}
              />
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
                        <MemberAttendanceEventCard
                          key={event.id}
                          event={event}
                          memberId={memberId}
                          details={details}
                          router={router}
                        />
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

function MemberAttendanceEventCard({
  event,
  memberId,
  details,
  router,
}: {
  event: ScheduleEvent;
  memberId: string;
  details: {
    translation: string;
    icon: React.ElementType;
    color: string;
    bgColor: string;
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  router: any;
}) {
  const attendeeRecord = event.attendees?.find(
    (a: Attendee) => a.memberId === memberId
  );
  const payStatus = attendeeRecord?.paymentStatus;
  const payType = attendeeRecord?.paymentType;
  const payDate = attendeeRecord?.paymentDate;
  const saleId = attendeeRecord?.saleId;

  return (
    <div
      onClick={() => router.push(`/schedule?eventId=${event.id}`)}
      className="group relative bg-white border border-zinc-100 rounded-3xl p-6 hover:border-zinc-900 transition-all duration-500 hover:shadow-2xl hover:shadow-zinc-950/5 cursor-pointer"
    >
      <div className="flex justify-between items-start mb-4">
        <div className="space-y-1">
          <p className="text-xs font-medium text-zinc-950 group-hover:text-zinc-900 transition-colors">
            {event.title}
          </p>
          <p className="text-[10px] font-light text-zinc-400 uppercase tracking-widest">
            {format(new Date(event.startDate), "dd MMMM", { locale: bg })}
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

      {/* Payment Status Badge */}
      {event.type !== "competition" && (
        <div
          className={cn(
            "mb-3",
            payStatus === "paid" &&
              saleId &&
              "cursor-pointer hover:opacity-80 transition-opacity"
          )}
          title={
            payStatus === "paid" && saleId ? "Към разписката" : undefined
          }
          onClick={(e) => {
            if (payStatus === "paid" && saleId) {
              e.stopPropagation();
              router.push(`/sales/${saleId}/receipt`);
            }
          }}
        >
          {payStatus === "paid" && payType === "subscription" && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-100 rounded-full w-fit">
              <CheckCircle2
                className="h-3 w-3 text-emerald-500"
                strokeWidth={2}
              />
              <span className="text-[9px] font-semibold uppercase tracking-widest text-emerald-700">
                Платено – Абонамент
              </span>
            </div>
          )}
          {payStatus === "paid" && payType === "individual" && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 border border-blue-100 rounded-full w-fit">
              <CreditCard
                className="h-3 w-3 text-blue-500"
                strokeWidth={2}
              />
              <span className="text-[9px] font-semibold uppercase tracking-widest text-blue-700">
                Платено – Еднократно
              </span>
            </div>
          )}
          {payStatus === "paid" && !payType && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-100 rounded-full w-fit">
              <CheckCircle2
                className="h-3 w-3 text-emerald-500"
                strokeWidth={2}
              />
              <span className="text-[9px] font-semibold uppercase tracking-widest text-emerald-700">
                Платено
              </span>
            </div>
          )}
          {(payStatus === "unpaid" || !payStatus) && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-rose-50 border border-rose-100 rounded-full w-fit">
              <XCircle
                className="h-3 w-3 text-rose-500"
                strokeWidth={2}
              />
              <span className="text-[9px] font-semibold uppercase tracking-widest text-rose-700">
                {payStatus === "unpaid" ? "Неплатено (Дълг)" : "Неплатено"}
              </span>
            </div>
          )}
          {payDate && payStatus === "paid" && (
            <div className="flex items-center gap-1 mt-1">
              <Receipt
                className="h-2.5 w-2.5 text-zinc-300"
                strokeWidth={1.5}
              />
              <span className="text-[8px] text-zinc-400 font-light">
                Платено на: {new Date(payDate).toLocaleDateString("bg-BG")}
                {saleId && (
                  <span className="ml-1 text-zinc-300">
                    #{saleId.substring(0, 6).toUpperCase()}
                  </span>
                )}
              </span>
            </div>
          )}
        </div>
      )}

      <div className="flex items-center gap-4 mt-auto pt-4 border-t border-zinc-50">
        <div className="flex items-center gap-1.5">
          <Clock className="h-3 w-3 text-zinc-300" />
          <span className="text-[10px] font-light text-zinc-400 uppercase tracking-widest">
            {formatTimeRange(event.startDate, event.endDate)}
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
    </div>
  );
}
