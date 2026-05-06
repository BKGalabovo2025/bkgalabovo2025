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

  return (
    <div className="bg-white dark:bg-zinc-900/50 rounded-2xl shadow-sm hover:shadow-lg transition-shadow duration-300 border border-slate-100 dark:border-zinc-800">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-4 flex-grow">
          <div className={`w-2.5 h-16 rounded-full ${color}`}></div>
          <div className="flex-grow">
            <div className="font-black text-slate-800 dark:text-slate-100 tracking-tight text-lg">
              {event.title}
            </div>
            <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400 mt-1 flex-wrap">
              <div className="flex items-center gap-1.5">
                <CalendarIcon size={14} />
                <span>{formatDate(event.startDate)}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock size={14} />
                <span>
                  {formatTime(event.startDate)} - {formatTime(event.endDate)}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Tag size={14} />
                <span className="font-medium">{translation}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onManageAttendees(event)}
                >
                  <Users className="h-5 w-5 text-slate-500" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Управление на присъстващи</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onPrint(event)}
                >
                  <Printer className="h-5 w-5 text-slate-500" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Принтирай</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onEdit(event)}
                >
                  <Edit className="h-5 w-5 text-slate-500" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Редактирай</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDelete(event.id)}
                >
                  <Trash2 className="h-5 w-5 text-rose-500" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Изтрий</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
      {attendees.length > 0 && (
        <div
          className="px-4 pb-3 pt-2 border-t border-slate-100 dark:border-zinc-800 mt-2 flex items-center gap-4 cursor-pointer rounded-b-2xl hover:bg-slate-50 dark:hover:bg-zinc-800/50"
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
          <strong className="text-sm font-bold uppercase tracking-wider text-slate-400 flex-shrink-0">
            Присъствали:
          </strong>
          <div className="flex items-center">
            <TooltipProvider delayDuration={100}>
              <div className="flex -space-x-3">
                {visibleAttendees.map((member) => (
                  <Tooltip key={member.id}>
                    <TooltipTrigger asChild>
                      <Avatar className="border-2 border-white dark:border-zinc-900 transition-transform hover:scale-110 hover:z-10 h-9 w-9">
                        <AvatarImage
                          src={member.avatarUrl ?? undefined}
                          alt={formatFullName(member)}
                        />
                        <AvatarFallback className="font-bold text-xs">
                          {getInitials(formatFullName(member))}
                        </AvatarFallback>
                      </Avatar>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{formatFullName(member)}</p>
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>
            </TooltipProvider>
            {hiddenAttendeesCount > 0 && (
              <div className="ml-1 h-9 w-9 rounded-full bg-slate-100 dark:bg-zinc-700 flex items-center justify-center text-xs font-bold text-slate-500 dark:text-slate-300 border-2 border-white dark:border-zinc-900 z-0">
                +{hiddenAttendeesCount}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
