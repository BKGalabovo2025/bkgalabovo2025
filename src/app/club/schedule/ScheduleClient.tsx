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
    <div className="min-h-screen bg-zinc-950 text-white font-sans">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 bg-black/80 backdrop-blur-xl border-b border-blue-900/30">
        <Link
          href="/club"
          className="flex items-center gap-2 text-zinc-300 hover:text-blue-400 transition-all text-sm font-medium"
        >
          <ArrowLeft size={16} />
          Назад към клуба
        </Link>
        <span className="font-bold text-sm text-blue-400 uppercase tracking-widest">
          Календар
        </span>
        <div className="w-24" />
      </nav>

      <main className="pt-28 px-6 pb-32">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-12 w-full"
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 w-full">
              <div className="flex items-center gap-5">
                <div className="h-16 w-16 bg-black border border-blue-800/50 rounded-2xl flex items-center justify-center text-blue-400 shadow-[0_0_20px_rgba(30,58,138,0.25)] shrink-0">
                  <CalendarIcon size={30} />
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.4em] text-blue-400 mb-1">
                    График
                  </p>
                  <h1 className="text-4xl font-black tracking-tight">
                    Предстоящи Тренировки
                  </h1>
                  <p className="text-zinc-400 text-sm mt-1">
                    Вижте всички предстоящи събития на клуба.
                  </p>
                </div>
              </div>
              <button
                onClick={handleShare}
                className="shrink-0 flex items-center gap-2 px-5 py-2.5 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 rounded-xl border border-blue-800/30 hover:border-blue-500/50 font-semibold text-sm transition-all"
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
              className="bg-black/60 border border-zinc-800 rounded-3xl p-16 text-center"
            >
              <CalendarIcon size={56} className="text-zinc-700 mx-auto mb-6" />
              <p className="text-2xl font-light text-white mb-2">
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
                  <div className="flex items-center gap-4 mb-4">
                    <span
                      className={`text-xs font-bold uppercase tracking-[0.35em] px-3 py-1 rounded-full ${
                        isSpecialLabel(dateLabel)
                          ? "bg-blue-600/20 text-blue-300 border border-blue-600/40"
                          : "text-zinc-400"
                      }`}
                    >
                      {dateLabel}
                    </span>
                    <div className="flex-1 h-px bg-zinc-800" />
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
            <p className="text-zinc-500 text-sm mb-4">
              Имате въпроси за графика?
            </p>
            <Link
              href="/club#contacts"
              className="inline-flex items-center gap-2 px-8 py-4 bg-blue-600/10 hover:bg-blue-600/20 border border-blue-700/40 hover:border-blue-500/60 text-blue-300 hover:text-blue-200 rounded-2xl text-sm font-bold uppercase tracking-widest transition-all"
            >
              Свържете се с нас <ChevronRight size={16} />
            </Link>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
