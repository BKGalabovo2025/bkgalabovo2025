/* eslint-disable sonarjs/no-nested-conditional */
"use client";

import {
  Ban,
  Calendar as CalendarIcon,
  Car,
  Edit,
  Printer,
  RotateCcw,
  Sparkles,
  Tag,
  Trash2,
  Users,
} from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";

import { WorkoutDayPreviewModal } from "@/components/schedule/WorkoutDayPreviewModal";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ActiveWorkoutScheduleDay,
  getActiveWorkoutsMapForScheduleAction,
} from "@/lib/actions/trainings";
import { formatEventDateRange } from "@/lib/date-utils";
import { formatFullName, getInitials } from "@/lib/utils";
import { Attendee, Member, ScheduleEvent, ScheduleEventType } from "@/types";

interface EventListItemProps {
  event: ScheduleEvent;
  members: Member[];
  onEdit: (event: ScheduleEvent) => void;
  onDelete: (eventId: string) => void;
  onManageAttendees: (event: ScheduleEvent) => void;
  onPrint: (event: ScheduleEvent) => void;
  onToggleCancel: (eventId: string, currentStatus: boolean) => void;
  onManageTrips?: (event: ScheduleEvent) => void;
  membersMap?: Record<string, Member>;
}

const eventTypeDetails: Record<
  ScheduleEventType,
  { translation: string; color: string }
> = {
  training: { translation: "Тренировка", color: "bg-blue-500" },
  competition: { translation: "Състезание", color: "bg-red-500" },
  camp: { translation: "Лагер", color: "bg-green-500" },
  event: { translation: "Събитие", color: "bg-yellow-500" },
  other: { translation: "Друго", color: "bg-gray-500" },
};

export const EventListItem = React.memo<EventListItemProps>(
  ({
    event,
    members,
    onEdit,
    onDelete,
    onManageAttendees,
    onPrint,
    onToggleCancel,
    onManageTrips,
    membersMap,
  }) => {
    const { translation, color } = eventTypeDetails[event.type] || {
      translation: "Събитие",
      color: "bg-gray-500",
    };

    const formattedDates = React.useMemo(() => {
      const d = new Date(event.startDate);
      const de = new Date(event.endDate);

      return {
        displayStr: formatEventDateRange(event.startDate, event.endDate),
        isCurrent: new Date() >= d && new Date() <= de,
      };
    }, [event.startDate, event.endDate]);

    const attendeesData = React.useMemo(() => {
      const allAttendees = (event.attendees || [])
        .map((attendee: Attendee) => {
          const member = membersMap
            ? membersMap[attendee.memberId]
            : members.find((m) => m.id === attendee.memberId);
          return member && attendee.attended
            ? { ...member, attended: true }
            : null;
        })
        .filter(Boolean) as (Member & { attended: boolean })[];

      const totalCount = event.attendees?.length || 0;
      const attendedCount =
        event.attendees?.filter((a) => a.attended).length || 0;

      return {
        list: allAttendees,
        total: totalCount,
        attended: attendedCount,
      };
    }, [event.attendees, members, membersMap]);

    const [activeWorkouts, setActiveWorkouts] = useState<
      Record<string, ActiveWorkoutScheduleDay>
    >({});
    const [selectedPreviewWorkout, setSelectedPreviewWorkout] = useState<{
      memberName: string;
      workout: ActiveWorkoutScheduleDay;
    } | null>(null);

    useEffect(() => {
      const memberIds = Array.from(
        new Set([
          ...attendeesData.list.map((m) => m.id),
          ...(event.attendees || []).map((a) => a.memberId),
        ])
      );
      if (memberIds.length === 0) return;

      let isMounted = true;
      const d = new Date(event.startDate);
      const targetDateStr = !isNaN(d.getTime())
        ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
        : String(event.startDate).split("T")[0];

      getActiveWorkoutsMapForScheduleAction(targetDateStr, memberIds).then(
        (res) => {
          if (isMounted && res.success && res.data) {
            setActiveWorkouts(res.data);
          }
        }
      );

      return () => {
        isMounted = false;
      };
    }, [event.id, event.startDate, attendeesData.list, event.attendees]);

    const activeAttendeesWorkouts = useMemo(() => {
      const attendedWithWorkout = attendeesData.list
        .map((m) => {
          const workout = activeWorkouts[m.id];
          if (!workout) return null;
          return { member: m, workout };
        })
        .filter(Boolean) as {
        member: Member;
        workout: ActiveWorkoutScheduleDay;
      }[];

      if (attendedWithWorkout.length > 0) return attendedWithWorkout;

      const allEventAttendeesWithWorkout = (event.attendees || [])
        .map((a) => {
          const workout = activeWorkouts[a.memberId];
          if (!workout) return null;
          const member = membersMap
            ? membersMap[a.memberId]
            : members.find((m) => m.id === a.memberId);
          if (!member) return null;
          return { member, workout };
        })
        .filter(Boolean) as {
        member: Member;
        workout: ActiveWorkoutScheduleDay;
      }[];

      return allEventAttendeesWithWorkout;
    }, [
      attendeesData.list,
      activeWorkouts,
      event.attendees,
      members,
      membersMap,
    ]);

    const MAX_VISIBLE_AVATARS = 6;
    const visibleAttendees = attendeesData.list.slice(0, MAX_VISIBLE_AVATARS);
    const hiddenAttendeesCount =
      attendeesData.list.length - visibleAttendees.length;

    let cardClasses =
      "bg-white dark:bg-zinc-950 border-zinc-100 dark:border-zinc-900 hover:border-zinc-200 dark:hover:border-zinc-800";
    if (event.isCancelled) {
      cardClasses =
        "bg-rose-50/30 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900/30 opacity-80";
    } else if (formattedDates.isCurrent) {
      cardClasses =
        "bg-white dark:bg-zinc-950 border-zinc-950 dark:border-white ring-1 ring-zinc-950 dark:ring-white";
    }

    return (
      <div
        className={`group overflow-hidden rounded-4xl border shadow-none transition-all duration-500 ${cardClasses}`}
      >
        <div className="flex flex-col items-start justify-between gap-6 p-8 sm:flex-row sm:items-center">
          <div className="flex w-full grow items-start gap-6 sm:items-center">
            <div
              className={`h-14 w-1.5 rounded-full ${
                event.isCancelled
                  ? "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]"
                  : color
              } hidden opacity-40 transition-opacity group-hover:opacity-100 sm:block`}
            ></div>
            <div className="grow space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 rounded-full border border-zinc-100 bg-zinc-50 px-3 py-1 dark:border-zinc-800 dark:bg-zinc-900">
                  <Tag size={12} strokeWidth={2} className="text-zinc-400" />
                  <span className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase">
                    {translation}
                  </span>
                </div>
                {attendeesData.total > 0 && (
                  <div className="flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 dark:border-emerald-900/30 dark:bg-emerald-900/20">
                    <Users
                      size={12}
                      strokeWidth={2}
                      className="text-emerald-600 dark:text-emerald-400"
                    />
                    <span className="text-[10px] font-bold tracking-widest text-emerald-800 uppercase dark:text-emerald-400">
                      {attendeesData.attended} / {members.length} присъствали
                    </span>
                  </div>
                )}
                {(activeAttendeesWorkouts.length > 0 ||
                  attendeesData.list.some((m) => !!m.activeWorkoutProgram)) && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (activeAttendeesWorkouts.length > 0) {
                        setSelectedPreviewWorkout({
                          memberName: formatFullName(
                            activeAttendeesWorkouts[0].member
                          ),
                          workout: activeAttendeesWorkouts[0].workout,
                        });
                      }
                    }}
                    className="flex cursor-pointer items-center gap-1.5 rounded-full border border-purple-200 bg-purple-100/90 px-3 py-1 text-purple-800 shadow-xs transition-colors hover:bg-purple-200 dark:border-purple-800/60 dark:bg-purple-950/60 dark:text-purple-200"
                  >
                    <Sparkles
                      size={12}
                      className="animate-pulse text-purple-600 dark:text-purple-400"
                    />
                    <span className="text-[10px] font-bold tracking-widest uppercase">
                      ✨ AI Програма ({activeAttendeesWorkouts.length || 1})
                    </span>
                  </button>
                )}
                {formattedDates.isCurrent && (
                  <div className="flex items-center gap-2 rounded-full bg-zinc-950 px-3 py-1 dark:bg-white">
                    <span className="relative flex size-2">
                      <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex size-2 rounded-full bg-emerald-500"></span>
                    </span>
                    <span className="text-[10px] font-bold tracking-widest text-white uppercase dark:text-zinc-950">
                      В ход
                    </span>
                  </div>
                )}
                {event.isCancelled && (
                  <div className="flex items-center gap-2 rounded-full border border-rose-100 bg-rose-50 px-3 py-1 dark:border-rose-900/30 dark:bg-rose-900/20">
                    <Ban
                      size={12}
                      strokeWidth={2}
                      className="text-rose-600 dark:text-rose-400"
                    />
                    <span className="text-[10px] font-bold tracking-widest text-rose-600 uppercase dark:text-rose-400">
                      Отменена
                    </span>
                  </div>
                )}
              </div>

              <h3
                className={`text-2xl leading-tight font-light tracking-tight text-zinc-950 dark:text-white ${event.isCancelled ? "text-zinc-500 line-through dark:text-zinc-500" : ""}`}
              >
                {event.title}
              </h3>

              <div className="flex flex-wrap items-center gap-6 text-[11px] font-medium tracking-wider text-zinc-600 dark:text-zinc-400">
                <div className="flex items-center gap-2">
                  <CalendarIcon size={14} strokeWidth={1.5} />
                  <span>{formattedDates.displayStr}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Tag size={14} strokeWidth={1.5} />
                  <span>{event.location}</span>
                </div>
              </div>

              {activeAttendeesWorkouts.length > 0 && !event.isCancelled && (
                <div className="mt-2 rounded-2xl border border-purple-200/90 bg-gradient-to-r from-purple-50 via-indigo-50/40 to-purple-50/30 p-3.5 shadow-xs dark:border-purple-900/50 dark:from-purple-950/40 dark:via-zinc-900 dark:to-purple-950/20">
                  <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="relative flex size-2">
                          <span className="absolute inline-flex size-full animate-ping rounded-full bg-purple-400 opacity-75"></span>
                          <span className="relative inline-flex size-2 rounded-full bg-purple-600"></span>
                        </span>
                        <span className="flex items-center gap-1.5 text-[11px] font-bold tracking-wider text-purple-900 uppercase dark:text-purple-200">
                          <Sparkles
                            size={13}
                            className="text-purple-600 dark:text-purple-400"
                          />
                          Индивидуален AI Тренировъчен План за днес:
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        {activeAttendeesWorkouts.map(({ member, workout }) => (
                          <div
                            key={member.id}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-purple-200/70 bg-white/90 px-2.5 py-1 shadow-2xs dark:border-purple-900/40 dark:bg-zinc-900"
                          >
                            <span className="font-semibold text-purple-950 dark:text-purple-100">
                              {formatFullName(member)}:
                            </span>
                            <span className="text-zinc-600 dark:text-zinc-400">
                              {workout.focus || workout.dayName}
                            </span>
                            <span className="rounded bg-purple-100 px-1.5 py-0.5 text-[10px] font-medium text-purple-800 dark:bg-purple-900/40 dark:text-purple-300">
                              {workout.intensity === "high"
                                ? "🔥 Висока"
                                : workout.intensity === "medium"
                                  ? "⚡ Умерена"
                                  : "🌿 Лека"}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedPreviewWorkout({
                          memberName: formatFullName(
                            activeAttendeesWorkouts[0].member
                          ),
                          workout: activeAttendeesWorkouts[0].workout,
                        });
                      }}
                      className="shrink-0 cursor-pointer rounded-xl border-purple-300 bg-white text-xs font-semibold text-purple-800 shadow-xs hover:bg-purple-100 hover:text-purple-900 dark:border-purple-700 dark:bg-purple-950/60 dark:text-purple-200"
                    >
                      <Sparkles
                        size={13}
                        className="mr-1.5 text-purple-600 dark:text-purple-400"
                      />
                      Виж предписания AI план
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex w-full items-center justify-end gap-2 border-t pt-4 sm:w-auto sm:border-none sm:pt-0">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="group/btn size-12 rounded-2xl transition-all hover:bg-zinc-50 dark:hover:bg-zinc-900"
                    onClick={() => onManageAttendees(event)}
                    aria-label={`Присъствия за ${event.title}`}
                  >
                    <Users
                      className="size-5 text-zinc-400 transition-colors group-hover/btn:text-zinc-950 dark:group-hover/btn:text-white"
                      strokeWidth={1.5}
                    />
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="rounded-xl border-zinc-100 bg-white px-4 py-2 dark:border-zinc-800 dark:bg-zinc-950">
                  <p className="text-[10px] font-bold tracking-widest uppercase">
                    Присъствия
                  </p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="group/btn size-12 rounded-2xl transition-all hover:bg-zinc-50 dark:hover:bg-zinc-900"
                    onClick={() => onPrint(event)}
                    aria-label={`Принтирай списък за ${event.title}`}
                  >
                    <Printer
                      className="size-5 text-zinc-400 transition-colors group-hover/btn:text-zinc-950 dark:group-hover/btn:text-white"
                      strokeWidth={1.5}
                    />
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="rounded-xl border-zinc-100 bg-white px-4 py-2 dark:border-zinc-800 dark:bg-zinc-950">
                  <p className="text-[10px] font-bold tracking-widest uppercase">
                    Принтирай списък
                  </p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="group/btn size-12 rounded-2xl transition-all hover:bg-zinc-50 dark:hover:bg-zinc-900"
                    onClick={() => onEdit(event)}
                    aria-label={`Редактирай ${event.title}`}
                  >
                    <Edit
                      className="size-5 text-zinc-400 transition-colors group-hover/btn:text-zinc-950 dark:group-hover/btn:text-white"
                      strokeWidth={1.5}
                    />
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="rounded-xl border-zinc-100 bg-white px-4 py-2 dark:border-zinc-800 dark:bg-zinc-950">
                  <p className="text-[10px] font-bold tracking-widest uppercase">
                    Редактирай
                  </p>
                </TooltipContent>
              </Tooltip>

              {(event.type === "competition" || event.type === "camp") &&
                onManageTrips && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="group/btn size-12 rounded-2xl transition-all hover:bg-blue-50 dark:hover:bg-blue-900/20"
                        onClick={(e) => {
                          e.stopPropagation();
                          onManageTrips(event);
                        }}
                        aria-label={`Управление на командировки за ${event.title}`}
                      >
                        <Car
                          className="size-5 text-zinc-400 transition-colors group-hover/btn:text-blue-600"
                          strokeWidth={1.5}
                        />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent className="rounded-xl border-zinc-100 bg-white px-4 py-2 dark:border-zinc-800 dark:bg-zinc-950">
                      <p className="text-[10px] font-bold tracking-widest text-blue-600 uppercase">
                        Командировки
                      </p>
                    </TooltipContent>
                  </Tooltip>
                )}

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="group/btn size-12 rounded-2xl transition-all hover:bg-orange-50 dark:hover:bg-orange-900/20"
                    onClick={() =>
                      onToggleCancel(event.id, !!event.isCancelled)
                    }
                    aria-label={
                      event.isCancelled
                        ? `Възстанови ${event.title}`
                        : `Отмени ${event.title}`
                    }
                  >
                    {event.isCancelled ? (
                      <RotateCcw
                        className="size-5 text-orange-400 transition-colors group-hover/btn:text-orange-600"
                        strokeWidth={1.5}
                      />
                    ) : (
                      <Ban
                        className="size-5 text-orange-400 transition-colors group-hover/btn:text-orange-600"
                        strokeWidth={1.5}
                      />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="rounded-xl border-orange-100 bg-white px-4 py-2 text-orange-600 dark:border-orange-900/30 dark:bg-zinc-950">
                  <p className="text-[10px] font-bold tracking-widest uppercase">
                    {event.isCancelled ? "Възстанови" : "Отмени"}
                  </p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="group/btn size-12 rounded-2xl transition-all hover:bg-rose-50 dark:hover:bg-rose-900/20"
                    onClick={() => onDelete(event.id)}
                    aria-label={`Изтрий ${event.title}`}
                  >
                    <Trash2
                      className="size-5 text-rose-400 transition-colors group-hover/btn:text-rose-600"
                      strokeWidth={1.5}
                    />
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="rounded-xl border-rose-100 bg-white px-4 py-2 text-rose-600 dark:border-rose-900/30 dark:bg-zinc-950">
                  <p className="text-[10px] font-bold tracking-widest uppercase">
                    Изтрий
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
        {attendeesData.list.length > 0 && !event.isCancelled && (
          <div
            className="flex cursor-pointer items-center gap-6 rounded-b-2xl border-t border-zinc-100 px-6 py-4 transition-colors hover:bg-zinc-50 dark:border-zinc-900 dark:hover:bg-zinc-900/50"
            onClick={() => onManageAttendees(event)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                onManageAttendees(event);
              }
            }}
            role="button"
            tabIndex={0}
            aria-label={`Управление на ${attendeesData.list.length} присъстващи`}
          >
            <strong className="shrink-0 text-[10px] font-medium tracking-[0.2em] text-zinc-600 uppercase dark:text-zinc-400">
              Присъствали:
            </strong>
            <div className="flex items-center">
              <TooltipProvider delayDuration={100}>
                <div className="flex -space-x-3">
                  {visibleAttendees.map((member) => {
                    const memberWorkout = activeWorkouts[member.id];
                    const hasActiveWorkout = !!memberWorkout;

                    return (
                      <Tooltip key={member.id}>
                        <TooltipTrigger asChild>
                          <div
                            className="relative cursor-pointer"
                            onClick={(e) => {
                              if (hasActiveWorkout) {
                                e.stopPropagation();
                                setSelectedPreviewWorkout({
                                  memberName: formatFullName(member),
                                  workout: memberWorkout,
                                });
                              }
                            }}
                          >
                            <Avatar
                              className={`size-10 border-2 transition-transform hover:z-10 hover:scale-110 ${
                                hasActiveWorkout
                                  ? "border-purple-500 ring-2 ring-purple-300 dark:ring-purple-700"
                                  : "border-white dark:border-zinc-950"
                              }`}
                            >
                              <AvatarImage
                                src={member.avatarUrl ?? undefined}
                                alt={formatFullName(member)}
                              />
                              <AvatarFallback className="bg-zinc-100 text-xs font-medium text-zinc-400 dark:bg-zinc-800">
                                {getInitials(formatFullName(member))}
                              </AvatarFallback>
                            </Avatar>
                            {hasActiveWorkout && (
                              <span
                                title="Активна AI тренировъчна програма"
                                className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-purple-600 text-[9px] text-white shadow-xs"
                              >
                                ✨
                              </span>
                            )}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent className="rounded-lg border-zinc-100 text-[10px] font-medium tracking-widest uppercase dark:border-zinc-800">
                          <p>
                            {formatFullName(member)}
                            {hasActiveWorkout
                              ? " • ✨ AI Програма (кликни за преглед)"
                              : ""}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                </div>
              </TooltipProvider>
              {hiddenAttendeesCount > 0 && (
                <div className="z-0 ml-2 flex size-10 items-center justify-center rounded-full border-2 border-white bg-zinc-50 text-[10px] font-medium text-zinc-400 dark:border-zinc-950 dark:bg-zinc-900">
                  +{hiddenAttendeesCount}
                </div>
              )}
            </div>
          </div>
        )}

        <WorkoutDayPreviewModal
          open={!!selectedPreviewWorkout}
          onClose={() => setSelectedPreviewWorkout(null)}
          data={selectedPreviewWorkout}
        />
      </div>
    );
  }
);

EventListItem.displayName = "EventListItem";
