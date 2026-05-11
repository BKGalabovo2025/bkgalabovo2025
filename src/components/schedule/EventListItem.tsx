"use client";

import React from "react";
import { ScheduleEvent, Member, ScheduleEventType, Attendee } from "@/types";
import { Button } from "@/components/ui/button";
import {
  Edit,
  Trash2,
  Users,
  Printer,
  Calendar as CalendarIcon,
  Clock,
  Tag,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatFullName, getInitials } from "@/lib/utils";

interface EventListItemProps {
  event: ScheduleEvent;
  members: Member[];
  onEdit: (event: ScheduleEvent) => void;
  onDelete: (eventId: string) => void;
  onManageAttendees: (event: ScheduleEvent) => void;
  onPrint: (event: ScheduleEvent) => void;
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

export const EventListItem: React.FC<EventListItemProps> = ({
  event,
  members,
  onEdit,
  onDelete,
  onManageAttendees,
  onPrint,
}) => {
  const { translation, color } = eventTypeDetails[event.type] || {
    translation: "Събитие",
    color: "bg-gray-500",
  };

  const formatDate = (date: string) => {
    const d = new Date(date);
    const day = d.getDate().toString().padStart(2, "0");
    const month = (d.getMonth() + 1).toString().padStart(2, "0");
    const year = d.getFullYear();
    const dayOfWeek = d.toLocaleDateString("bg-BG", { weekday: "short" });
    return `${day}.${month}.${year} (${dayOfWeek})`;
  };

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString("bg-BG", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const attendees: (Member & { attended: boolean })[] = (event.attendees || [])
    .map((attendee: Attendee) => {
      const member = members.find((m) => m.id === attendee.memberId);
      // We only care about those who actually attended
      return member && attendee.attended ? { ...member, attended: true } : null;
    })
    .filter(Boolean) as (Member & { attended: boolean })[];

  const MAX_VISIBLE_AVATARS = 6;
  const visibleAttendees = attendees.slice(0, MAX_VISIBLE_AVATARS);
  const hiddenAttendeesCount = attendees.length - visibleAttendees.length;

  const now = new Date();
  const start = new Date(event.startDate);
  const end = new Date(event.endDate);
  const isCurrent = now >= start && now <= end;

  const attendedCount = event.attendees?.filter((a) => a.attended).length || 0;
  const totalCount = event.attendees?.length || 0;

  return (
    <div
      className={`bg-white dark:bg-zinc-950 rounded-4xl shadow-none transition-all duration-500 border group overflow-hidden ${
        isCurrent
          ? "border-zinc-950 dark:border-white ring-1 ring-zinc-950 dark:ring-white"
          : "border-zinc-100 dark:border-zinc-900 hover:border-zinc-200 dark:hover:border-zinc-800"
      }`}
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-8 gap-6">
        <div className="flex items-start sm:items-center gap-6 grow w-full">
          <div
            className={`w-1.5 h-14 rounded-full ${color} opacity-40 group-hover:opacity-100 transition-opacity hidden sm:block`}
          ></div>
          <div className="grow space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800">
                <Tag size={12} strokeWidth={2} className="text-zinc-400" />
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                  {translation}
                </span>
              </div>
              {totalCount > 0 && (
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-900/30">
                  <Users
                    size={12}
                    strokeWidth={2}
                    className="text-emerald-600 dark:text-emerald-400"
                  />
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
                    {attendedCount} / {totalCount} присъствали
                  </span>
                </div>
              )}
              {isCurrent && (
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-950 dark:bg-white">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span className="text-[10px] font-bold text-white dark:text-zinc-950 uppercase tracking-widest">
                    В ход
                  </span>
                </div>
              )}
            </div>

            <h3 className="text-2xl font-light text-zinc-950 dark:text-white tracking-tight leading-tight">
              {event.title}
            </h3>

            <div className="flex flex-wrap items-center gap-6 text-[11px] font-medium text-zinc-400 tracking-wider">
              <div className="flex items-center gap-2">
                <CalendarIcon size={14} strokeWidth={1.5} />
                <span>{formatDate(event.startDate)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock size={14} strokeWidth={1.5} />
                <span>
                  {formatTime(event.startDate)} — {formatTime(event.endDate)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Tag size={14} strokeWidth={1.5} />
                <span>{event.location}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end border-t sm:border-none pt-4 sm:pt-0">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-12 w-12 rounded-2xl hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-all group/btn"
                  onClick={() => onManageAttendees(event)}
                >
                  <Users
                    className="h-5 w-5 text-zinc-400 group-hover/btn:text-zinc-950 dark:group-hover/btn:text-white transition-colors"
                    strokeWidth={1.5}
                  />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="rounded-xl border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-4 py-2">
                <p className="text-[10px] font-bold uppercase tracking-widest">
                  Присъствия
                </p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-12 w-12 rounded-2xl hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-all group/btn"
                  onClick={() => onPrint(event)}
                >
                  <Printer
                    className="h-5 w-5 text-zinc-400 group-hover/btn:text-zinc-950 dark:group-hover/btn:text-white transition-colors"
                    strokeWidth={1.5}
                  />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="rounded-xl border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-4 py-2">
                <p className="text-[10px] font-bold uppercase tracking-widest">
                  Принтирай списък
                </p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-12 w-12 rounded-2xl hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-all group/btn"
                  onClick={() => onEdit(event)}
                >
                  <Edit
                    className="h-5 w-5 text-zinc-400 group-hover/btn:text-zinc-950 dark:group-hover/btn:text-white transition-colors"
                    strokeWidth={1.5}
                  />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="rounded-xl border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-4 py-2">
                <p className="text-[10px] font-bold uppercase tracking-widest">
                  Редактирай
                </p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-12 w-12 rounded-2xl hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all group/btn"
                  onClick={() => onDelete(event.id)}
                >
                  <Trash2
                    className="h-5 w-5 text-rose-400 group-hover/btn:text-rose-600 transition-colors"
                    strokeWidth={1.5}
                  />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="rounded-xl border-rose-100 dark:border-rose-900/30 bg-white dark:bg-zinc-950 px-4 py-2 text-rose-600">
                <p className="text-[10px] font-bold uppercase tracking-widest">
                  Изтрий
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
      {attendees.length > 0 && (
        <div
          className="px-6 py-4 border-t border-zinc-100 dark:border-zinc-900 flex items-center gap-6 cursor-pointer rounded-b-2xl hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors"
          onClick={() => onManageAttendees(event)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              onManageAttendees(event);
            }
          }}
          role="button"
          tabIndex={0}
          aria-label={`Управление на ${attendees.length} присъстващи`}
        >
          <strong className="text-[10px] font-medium uppercase tracking-[0.2em] text-zinc-400 shrink-0">
            Присъствали:
          </strong>
          <div className="flex items-center">
            <TooltipProvider delayDuration={100}>
              <div className="flex -space-x-3">
                {visibleAttendees.map((member) => (
                  <Tooltip key={member.id}>
                    <TooltipTrigger asChild>
                      <Avatar className="border-2 border-white dark:border-zinc-950 transition-transform hover:scale-110 hover:z-10 h-10 w-10 shadow-none">
                        <AvatarImage
                          src={member.avatarUrl ?? undefined}
                          alt={formatFullName(member)}
                        />
                        <AvatarFallback className="font-medium text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-400">
                          {getInitials(formatFullName(member))}
                        </AvatarFallback>
                      </Avatar>
                    </TooltipTrigger>
                    <TooltipContent className="rounded-lg text-[10px] uppercase tracking-widest font-medium border-zinc-100 dark:border-zinc-800">
                      <p>{formatFullName(member)}</p>
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>
            </TooltipProvider>
            {hiddenAttendeesCount > 0 && (
              <div className="ml-2 h-10 w-10 rounded-full bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center text-[10px] font-medium text-zinc-400 border-2 border-white dark:border-zinc-950 z-0">
                +{hiddenAttendeesCount}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
