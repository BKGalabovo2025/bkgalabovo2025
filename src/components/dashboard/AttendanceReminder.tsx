 
 
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useMemo } from "react";
import { BentoCard } from "@/components/ui/bento-card";
import { Button } from "@/components/ui/button";
import { CalendarCheck2, ArrowRight, Loader2 } from "lucide-react";
import { useEvents } from "@/hooks/useEvents";
import { useRouter } from "next/navigation";

interface AttendanceReminderProps {
  initialEvents?: any[];
}

export const AttendanceReminder = ({
  initialEvents,
}: AttendanceReminderProps) => {
  const { events, isLoading: clientLoading } = useEvents();
  const router = useRouter();

  const todayTrainings = useMemo(() => {
    // Prefer real-time client-side events once loaded, fallback to server-rendered initialEvents
    const activeEvents = !clientLoading ? events : initialEvents || events;

    if (!activeEvents) return [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return activeEvents
      .filter((event) => {
        const eventDate = new Date(event.startDate);
        return (
          event.type === "training" &&
          eventDate >= today &&
          eventDate < tomorrow
        );
      })
      .sort(
        (a, b) =>
          new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
      );
  }, [events, initialEvents, clientLoading]);

  const showLoading = !initialEvents && clientLoading;

  if (showLoading) {
    return (
      <BentoCard className="flex h-full items-center justify-center rounded-4xl border border-zinc-100 bg-white p-8 shadow-none">
        <Loader2 className="size-6 animate-spin text-zinc-200" />
      </BentoCard>
    );
  }

  if (todayTrainings.length === 0) return null;

  return (
    <BentoCard className="group relative flex flex-col gap-6 overflow-hidden rounded-4xl border border-zinc-100 bg-white p-5 shadow-none transition-all duration-500 hover:border-emerald-100 sm:p-8">
      <div className="opacity-0.03 group-hover:opacity-0.06 pointer-events-none absolute top-0 right-0 translate-x-1/4 -translate-y-1/4 transform p-12 transition-all duration-700 group-hover:scale-110">
        <CalendarCheck2 size={240} strokeWidth={1} />
      </div>

      <div>
        <h3 className="mb-6 flex items-center gap-3 text-[11px] font-medium tracking-[0.2em] text-zinc-600 uppercase dark:text-zinc-400">
          <CalendarCheck2
            className="size-4 text-emerald-500"
            strokeWidth={1.5}
          />
          Напомняне за присъствия
        </h3>

        <div className="space-y-4">
          {todayTrainings.map((training) => (
            <div
              key={training.id}
              className="relative z-10 flex flex-col justify-between gap-4 rounded-2xl border border-zinc-100/80 bg-zinc-50/20 p-4 transition-all hover:bg-zinc-50/50 sm:flex-row sm:items-center"
            >
              <div className="min-w-0 flex-1 space-y-1">
                <p className="truncate text-sm leading-tight font-bold text-zinc-900">
                  {training.title}
                </p>
                <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-light text-zinc-600 dark:text-zinc-400">
                  <span className="font-medium text-zinc-700">
                    {new Date(training.startDate).toLocaleTimeString("bg-BG", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}{" "}
                    ч.
                  </span>
                  <span className="opacity-40">•</span>
                  <span className="truncate">{training.location}</span>
                </div>
              </div>

              <Button
                size="sm"
                onClick={() => router.push(`/schedule?eventId=${training.id}`)}
                className="group/btn flex h-8 w-full shrink-0 items-center justify-center gap-1.5 rounded-xl bg-emerald-700 px-3 text-[10px] font-extrabold tracking-wider text-white uppercase shadow-none transition-all hover:bg-emerald-800 sm:w-auto"
              >
                <span>Отбележи</span>
                <ArrowRight
                  className="size-3 transform transition-all group-hover/btn:translate-x-0.5"
                  strokeWidth={2.5}
                />
              </Button>
            </div>
          ))}
        </div>
      </div>
    </BentoCard>
  );
};
