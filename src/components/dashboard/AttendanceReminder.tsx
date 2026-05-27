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
    const activeEvents = !clientLoading ? events : (initialEvents || events);

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
      <BentoCard className="p-8 flex items-center justify-center border border-zinc-100 bg-white shadow-none rounded-4xl h-full">
        <Loader2 className="h-6 w-6 animate-spin text-zinc-200" />
      </BentoCard>
    );
  }

  if (todayTrainings.length === 0) return null;

  return (
    <BentoCard className="p-5 sm:p-8 border border-zinc-100 bg-white shadow-none rounded-4xl flex flex-col gap-6 group hover:border-emerald-100 transition-all duration-500 overflow-hidden relative">
      <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:opacity-[0.06] transition-all duration-700 pointer-events-none transform translate-x-1/4 -translate-y-1/4 group-hover:scale-110">
        <CalendarCheck2 size={240} strokeWidth={1} />
      </div>

      <div>
        <h3 className="text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-400 mb-6 flex items-center gap-3">
          <CalendarCheck2
            className="h-4 w-4 text-emerald-500"
            strokeWidth={1.5}
          />
          Напомняне за присъствия
        </h3>

        <div className="space-y-4">
          {todayTrainings.map((training) => (
            <div
              key={training.id}
              className="relative z-10 p-4 rounded-2xl border border-zinc-100/80 bg-zinc-50/20 hover:bg-zinc-50/50 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-1 min-w-0 flex-1">
                <p className="text-sm font-bold text-zinc-900 leading-tight truncate">
                  {training.title}
                </p>
                <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 font-light flex-wrap">
                  <span className="text-zinc-700 font-medium">
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
                className="w-full sm:w-auto h-8 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white shadow-none text-[9px] font-extrabold uppercase tracking-wider shrink-0 px-3 flex items-center justify-center gap-1.5 transition-all group/btn"
              >
                <span>Отбележи</span>
                <ArrowRight
                  className="h-3 w-3 transform group-hover/btn:translate-x-0.5 transition-all"
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
