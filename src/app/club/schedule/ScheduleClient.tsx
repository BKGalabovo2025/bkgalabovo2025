"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  ChevronRight,
  Share2,
  Printer,
  Info,
  ChevronDown,
  Mail,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { formatEventDateRange } from "@/lib/date-utils";
import { PublicEventCard } from "@/components/shared/schedule/PublicEventCard";

interface EventSlot {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  isCancelled?: boolean;
  description?: string;
  location?: string;
}

interface Props {
  schedule: EventSlot[];
}

// Group events by date label
function groupByDate(events: EventSlot[]): Record<string, EventSlot[]> {
  return events.reduce(
    (acc, event) => {
      const date = new Date(event.startTime);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);

      let label: string;
      if (date >= today && date < tomorrow) {
        label = "Днес";
      } else if (
        date >= tomorrow &&
        date < new Date(tomorrow.getTime() + 86400000)
      ) {
        label = "Утре";
      } else {
        label = date.toLocaleDateString("bg-BG", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        });
        // Capitalize first letter
        label = label.charAt(0).toUpperCase() + label.slice(1);
      }

      if (!acc[label]) acc[label] = [];
      acc[label].push(event);
      return acc;
    },
    {} as Record<string, EventSlot[]>
  );
}

// EventCard extracted to src/components/shared/schedule/PublicEventCard.tsx

export default function ScheduleClient({ schedule }: Props) {
  const grouped = groupByDate(schedule);
  const groups = Object.entries(grouped);

  const handleShare = async () => {
    const shareData = {
      title: "График - БК Гълъбово",
      text: "Вижте предстоящите тренировки и събития на Бадминтон клуб Гълъбово.",
      url: window.location.href,
    };

    if (
      navigator.share &&
      navigator.canShare &&
      navigator.canShare(shareData)
    ) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.error("Error sharing:", err);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Връзката е копирана!", {
        description: "Можете да я поставите и споделите навсякъде.",
      });
    }
  };

  // Detect "Днес" / "Утре" for badge
  const isSpecialLabel = (label: string) =>
    label === "Днес" || label === "Утре";

  return (
    <div className="min-h-screen bg-zinc-950 font-sans text-white">
      {/* Nav */}
      <nav className="fixed inset-x-0 top-0 z-50 flex items-center justify-between border-b border-blue-900/30 bg-black/80 px-6 py-4 backdrop-blur-xl">
        <Link
          href="/club"
          className="flex items-center gap-2 text-sm font-medium text-zinc-300 transition-all hover:text-blue-400"
        >
          <ArrowLeft size={16} />
          Назад към клуба
        </Link>
        <span className="text-sm font-bold tracking-widest text-blue-400 uppercase">
          Календар
        </span>
        <div className="w-24" />
      </nav>

      <main className="px-6 pt-28 pb-32">
        <div className="mx-auto max-w-4xl">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-12 w-full"
          >
            <div className="flex w-full flex-col items-start justify-between gap-5 sm:flex-row sm:items-center">
              <div className="flex items-center gap-5">
                <div className="flex size-16 shrink-0 items-center justify-center rounded-2xl border border-blue-800/50 bg-black text-blue-400 shadow-[0_0_20px_rgba(30,58,138,0.25)]">
                  <CalendarIcon size={30} />
                </div>
                <div>
                  <p className="mb-1 text-[11px] font-bold tracking-[0.4em] text-blue-400 uppercase">
                    График
                  </p>
                  <h1 className="text-4xl font-black tracking-tight">
                    Предстоящи Тренировки
                  </h1>
                  <p className="mt-1 text-sm text-zinc-400">
                    Вижте всички предстоящи събития на клуба.
                  </p>
                </div>
              </div>
              <button
                onClick={handleShare}
                className="flex shrink-0 items-center gap-2 rounded-xl border border-blue-800/30 bg-blue-600/10 px-5 py-2.5 text-sm font-semibold text-blue-400 transition-all hover:border-blue-500/50 hover:bg-blue-600/20"
              >
                <Share2 size={16} />
                Сподели Графика
              </button>
            </div>
          </motion.div>

          {/* Content */}
          {schedule.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="rounded-3xl border border-zinc-800 bg-black/60 p-16 text-center"
            >
              <CalendarIcon size={56} className="mx-auto mb-6 text-zinc-700" />
              <p className="mb-2 text-2xl font-light text-white">
                Няма предстоящи тренировки
              </p>
              <p className="text-zinc-400">
                Проверете по-късно за актуалния график.
              </p>
            </motion.div>
          ) : (
            <div className="space-y-10">
              {groups.map(([dateLabel, events], groupIdx) => (
                <motion.div
                  key={dateLabel}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: groupIdx * 0.07 }}
                >
                  {/* Date Header */}
                  <div className="mb-4 flex items-center gap-4">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold tracking-[0.35em] uppercase ${
                        isSpecialLabel(dateLabel)
                          ? "border border-blue-600/40 bg-blue-600/20 text-blue-300"
                          : "text-zinc-400"
                      }`}
                    >
                      {dateLabel}
                    </span>
                    <div className="h-px flex-1 bg-zinc-800" />
                  </div>

                  {/* Events for this date */}
                  <div className="space-y-3">
                    {events.map((event, i) => (
                      <PublicEventCard
                        key={event.id}
                        event={event as any}
                        groupIdx={groupIdx}
                        i={i}
                        showAdminLinks={true}
                      />
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Footer CTA */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-16 text-center"
          >
            <p className="mb-4 text-sm text-zinc-500">
              Имате въпроси за графика?
            </p>
            <Link
              href="/club#contacts"
              className="inline-flex items-center gap-2 rounded-2xl border border-blue-700/40 bg-blue-600/10 px-8 py-4 text-sm font-bold tracking-widest text-blue-300 uppercase transition-all hover:border-blue-500/60 hover:bg-blue-600/20 hover:text-blue-200"
            >
              Свържете се с нас <ChevronRight size={16} />
            </Link>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
