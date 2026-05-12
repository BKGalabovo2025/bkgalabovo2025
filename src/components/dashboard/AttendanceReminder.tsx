"use client";

import { useMemo } from "react";
import { BentoCard } from "@/components/ui/bento-card";
import { Button } from "@/components/ui/button";
import { CalendarCheck2, ArrowRight, Loader2 } from "lucide-react";
import { useEvents } from "@/hooks/useEvents";
import { useRouter } from "next/navigation";

export const AttendanceReminder = () => {
  const { events, isLoading } = useEvents();
  const router = useRouter();

  const todayTrainings = useMemo(() => {
    if (!events) return [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return events.filter((event) => {
      const eventDate = new Date(event.startDate);
      return (
        event.type === "training" && eventDate >= today && eventDate < tomorrow
      );
    });
  }, [events]);

  if (isLoading) {
    return (
      <BentoCard className="p-8 flex items-center justify-center border border-zinc-100 bg-white shadow-none rounded-4xl h-full">
        <Loader2 className="h-6 w-6 animate-spin text-zinc-200" />
      </BentoCard>
    );
  }

  if (todayTrainings.length === 0) return null;

  return (
    <BentoCard className="p-8 border border-zinc-100 bg-white shadow-none rounded-4xl h-full flex flex-col justify-between group hover:border-emerald-100 transition-all duration-500 overflow-hidden relative">
      <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:opacity-[0.06] transition-all duration-700 pointer-events-none transform translate-x-1/4 -translate-y-1/4 group-hover:scale-110">
        <CalendarCheck2 size={240} strokeWidth={1} />
      </div>

      <div>
        <h3 className="text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-400 mb-8 flex items-center gap-3">
          <CalendarCheck2
            className="h-4 w-4 text-emerald-500"
            strokeWidth={1.5}
          />
          Напомняне за присъствия
        </h3>

        <div className="space-y-6">
          {todayTrainings.map((training) => (
            <div key={training.id} className="relative z-10">
              <p className="text-2xl font-light text-zinc-900 leading-tight">
                {training.title}
              </p>
              <p className="text-zinc-400 text-sm mt-2 font-light">
                {new Date(training.startDate).toLocaleTimeString("bg-BG", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}{" "}
                ч. • {training.location}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-10 relative z-10">
        <Button
          onClick={() =>
            router.push(
              todayTrainings.length > 0
                ? `/schedule?eventId=${todayTrainings[0].id}`
                : "/schedule"
            )
          }
          className="w-full h-14 rounded-2xl bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg shadow-emerald-500/20 flex items-center justify-between px-6 transition-all group/btn"
        >
          <span className="font-medium text-[11px] uppercase tracking-widest">
            Отбележи присъствие
          </span>
          <ArrowRight
            className="h-4 w-4 transform group-hover/btn:translate-x-1 transition-all"
            strokeWidth={2}
          />
        </Button>
      </div>
    </BentoCard>
  );
};
