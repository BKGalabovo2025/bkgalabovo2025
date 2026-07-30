"use client";

import { format, getYear } from "date-fns";
import { bg } from "date-fns/locale";
import {
  CalendarIcon,
  CalendarX,
  CheckCircle2,
  Clock,
  CreditCard,
  Dumbbell,
  HelpCircle,
  Loader2,
  MapPin,
  PartyPopper,
  Receipt,
  Tent,
  Trophy,
  XCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import useSWR from "swr";

import { Badge } from "@/components/ui/badge";
import { formatTimeRange } from "@/lib/date-utils";
import { cn } from "@/lib/utils";
import { getEventsByMemberId } from "@/services/schedule-service";
import { Attendee, ScheduleEvent, ScheduleEventType } from "@/types";

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
          className="size-8 animate-spin text-zinc-200"
          strokeWidth={1.5}
        />
      </div>
    );
  }

  if (totalEvents === 0) {
    return (
      <div className="rounded-5xl border border-zinc-100 bg-white p-16 text-center">
        <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-2xl bg-zinc-50">
          <CalendarX className="size-8 text-zinc-200" strokeWidth={1} />
        </div>
        <h3 className="tracking-widest3 mb-3 text-[11px] font-medium text-zinc-400 uppercase">
          Няма регистрирани присъствия
        </h3>
        <p className="mx-auto max-w-md text-sm leading-relaxed font-light text-zinc-400">
          Когато този член бъде маркиран като присъствал на събитие, записите ще
          се появят тук.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-12 rounded-3xl border border-zinc-100 bg-white p-4 sm:rounded-4xl sm:p-8 lg:rounded-5xl lg:p-10">
      {/* Header Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="flex h-32 flex-col justify-between rounded-3xl bg-zinc-950 p-6 text-white shadow-xl shadow-zinc-950/10 sm:h-40 sm:rounded-5xl sm:p-8">
          <p className="tracking-widest2 text-[9px] font-medium text-zinc-400 uppercase sm:text-[10px]">
            Общо посещения
          </p>
          <div className="flex items-end justify-between">
            <h2 className="text-3xl font-light tracking-tighter sm:text-5xl">
              {totalEvents}
            </h2>
            <div className="flex size-9 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm sm:size-12">
              <Dumbbell
                className="size-4 text-white sm:size-5"
                strokeWidth={1.5}
              />
            </div>
          </div>
        </div>

        <div className="flex h-32 flex-col justify-between rounded-3xl border border-zinc-100 bg-white p-6 sm:h-40 sm:rounded-5xl sm:p-8">
          <p className="tracking-widest2 text-[9px] font-medium text-zinc-400 uppercase sm:text-[10px]">
            Последна активност
          </p>
          <div className="flex items-end justify-between">
            <h2 className="text-base font-light text-zinc-950 sm:text-xl">
              {attendedEvents.length > 0
                ? format(new Date(attendedEvents[0].startDate), "dd MMM", {
                    locale: bg,
                  })
                : "—"}
            </h2>
            <div className="flex size-9 items-center justify-center rounded-xl bg-zinc-50 sm:size-12">
              <CalendarIcon
                className="size-4 text-zinc-300 sm:size-5"
                strokeWidth={1.5}
              />
            </div>
          </div>
        </div>

        <div className="flex h-32 flex-col justify-between rounded-3xl border border-zinc-100 bg-white p-6 sm:col-span-2 sm:h-40 sm:rounded-5xl sm:p-8 lg:col-span-1">
          <p className="tracking-widest2 text-[9px] font-medium text-zinc-400 uppercase sm:text-[10px]">
            Месечен статус
          </p>
          <div className="flex items-end justify-between">
            <Badge
              variant="outline"
              className="rounded-full border-green-100 bg-green-50 px-3 py-0.5 text-[9px] font-medium tracking-widest text-green-600 uppercase sm:text-[10px]"
            >
              Активен
            </Badge>
            <div className="flex size-9 items-center justify-center rounded-xl bg-zinc-50 sm:size-12">
              <Trophy
                className="size-4 text-zinc-300 sm:size-5"
                strokeWidth={1.5}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-16">
        {Object.entries(groupedEvents).map(([monthKey, monthData]) => (
          <div key={monthKey} className="relative">
            <div className="mb-8 flex items-center gap-6">
              <h3 className="tracking-widest2 shrink-0 text-sm font-medium text-zinc-950 uppercase">
                {monthData.monthName}{" "}
                <span className="ml-1 text-zinc-300">{monthData.year}</span>
              </h3>
              <div className="h-px grow bg-zinc-100" />
              <Badge
                variant="outline"
                className="rounded-full border-zinc-100 bg-zinc-50/50 px-4 py-1 text-[10px] font-medium tracking-widest text-zinc-400 uppercase"
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
                    <div className="mb-6 flex items-center gap-4">
                      <div className={cn("rounded-xl p-2", details.bgColor)}>
                        <details.icon
                          className={cn("size-4", details.color)}
                          strokeWidth={1.5}
                        />
                      </div>
                      <h4 className="tracking-widest2 text-[10px] font-medium text-zinc-400 uppercase">
                        {details.translation}{" "}
                        <span className="ml-1 text-zinc-200">
                          / {events.length}
                        </span>
                      </h4>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
      className="group relative cursor-pointer rounded-3xl border border-zinc-100 bg-white p-6 transition-all duration-500 hover:border-zinc-900 hover:shadow-2xl hover:shadow-zinc-950/5"
    >
      <div className="mb-4 flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium text-zinc-950 transition-colors group-hover:text-zinc-900">
            {event.title}
          </p>
          <p className="text-[10px] font-light tracking-widest text-zinc-400 uppercase">
            {format(new Date(event.startDate), "dd MMMM", { locale: bg })}
          </p>
        </div>
        <div
          className={cn(
            "rounded-lg p-1.5 opacity-0 transition-all duration-500 group-hover:opacity-100",
            details.bgColor
          )}
        >
          <details.icon
            className={cn("size-3", details.color)}
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
              "cursor-pointer transition-opacity hover:opacity-80"
          )}
          title={payStatus === "paid" && saleId ? "Към разписката" : undefined}
          onClick={(e) => {
            if (payStatus === "paid" && saleId) {
              e.stopPropagation();
              router.push(`/sales/${saleId}/receipt`);
            }
          }}
        >
          {payStatus === "paid" && payType === "subscription" && (
            <div className="flex w-fit items-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1">
              <CheckCircle2
                className="size-3 text-emerald-500"
                strokeWidth={2}
              />
              <span className="text-[9px] font-semibold tracking-widest text-emerald-700 uppercase">
                Платено – Абонамент
              </span>
            </div>
          )}
          {payStatus === "paid" && payType === "individual" && (
            <div className="flex w-fit items-center gap-1.5 rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1">
              <CreditCard className="size-3 text-blue-500" strokeWidth={2} />
              <span className="text-[9px] font-semibold tracking-widest text-blue-700 uppercase">
                Платено – Еднократно
              </span>
            </div>
          )}
          {payStatus === "paid" && !payType && (
            <div className="flex w-fit items-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1">
              <CheckCircle2
                className="size-3 text-emerald-500"
                strokeWidth={2}
              />
              <span className="text-[9px] font-semibold tracking-widest text-emerald-700 uppercase">
                Платено
              </span>
            </div>
          )}
          {(payStatus === "unpaid" || !payStatus) && (
            <div className="flex w-fit items-center gap-1.5 rounded-full border border-rose-100 bg-rose-50 px-2.5 py-1">
              <XCircle className="size-3 text-rose-500" strokeWidth={2} />
              <span className="text-[9px] font-semibold tracking-widest text-rose-700 uppercase">
                {payStatus === "unpaid" ? "Неплатено (Дълг)" : "Неплатено"}
              </span>
            </div>
          )}
          {payDate && payStatus === "paid" && (
            <div className="mt-1 flex items-center gap-1">
              <Receipt className="size-2.5 text-zinc-300" strokeWidth={1.5} />
              <span className="text-[8px] font-light text-zinc-400">
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

      <div className="mt-auto flex items-center gap-4 border-t border-zinc-50 pt-4">
        <div className="flex items-center gap-1.5">
          <Clock className="size-3 text-zinc-300" />
          <span className="text-[10px] font-light tracking-widest text-zinc-400 uppercase">
            {formatTimeRange(event.startDate, event.endDate)}
          </span>
        </div>
        {event.location && (
          <div className="ml-auto flex items-center gap-1.5">
            <MapPin className="size-3 text-zinc-300" />
            <span className="max-w-20 truncate text-[10px] font-light text-zinc-400">
              {event.location}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
