"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  ChevronRight,
  Share2,
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

interface EventSlot {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  isCancelled?: boolean;
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
                    {events.map((event, i) => {
                      const start = new Date(event.startTime);
                      const end = new Date(event.endTime);
                      const startStr = start.toLocaleTimeString("bg-BG", {
                        hour: "2-digit",
                        minute: "2-digit",
                      });
                      const endStr = end.toLocaleTimeString("bg-BG", {
                        hour: "2-digit",
                        minute: "2-digit",
                      });

                      return (
                        <motion.div
                          key={event.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{
                            duration: 0.3,
                            delay: groupIdx * 0.05 + i * 0.04,
                          }}
                          className={`group border rounded-2xl px-6 py-5 flex items-center justify-between gap-4 transition-all duration-300 ${
                            event.isCancelled
                              ? "bg-black/40 border-rose-900/30 opacity-80"
                              : "bg-black/70 border-zinc-800 hover:border-blue-700/50 hover:bg-black hover:shadow-[0_0_20px_rgba(30,58,138,0.12)]"
                          }`}
                        >
                          {/* Left side: colored bar + info */}
                          <div className="flex items-center gap-5">
                            <div className={`w-1 h-12 rounded-full shrink-0 ${event.isCancelled ? "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]" : "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]"}`} />
                            <div>
                              <div className="flex items-center gap-3">
                                <p className={`text-white font-bold text-base tracking-tight ${event.isCancelled ? "line-through text-zinc-400" : ""}`}>
                                  {event.title}
                                </p>
                                {event.isCancelled && (
                                  <span className="text-[10px] font-bold uppercase tracking-widest bg-rose-500/20 text-rose-400 px-2.5 py-1 rounded-md border border-rose-500/30">
                                    Отменена
                                  </span>
                                )}
                              </div>
                              <div className="flex flex-wrap items-center gap-3 mt-1.5">
                                <span className="flex items-center gap-1.5 text-zinc-300 text-sm">
                                  <Clock size={13} className="text-blue-400" />
                                  {startStr} – {endStr}
                                </span>
                                <span className="flex items-center gap-1.5 text-zinc-400 text-sm">
                                  <MapPin size={13} className="text-blue-400" />
                                  Спортна зала „Енергетик&quot;
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Right side: CTA or Cancelled State */}
                          {event.isCancelled ? (
                            <div className="flex items-center gap-2 text-rose-500 shrink-0 text-sm font-medium">
                              {/* Option to show something else, empty for now as requested */}
                            </div>
                          ) : (
                            <Link
                              href="/club#contacts"
                              className="flex items-center gap-1.5 text-blue-400 text-sm font-semibold hover:text-blue-300 transition-colors shrink-0 group-hover:gap-2"
                            >
                              Запиши се
                              <ChevronRight
                                size={15}
                                className="transition-transform group-hover:translate-x-0.5"
                              />
                            </Link>
                          )}
                        </motion.div>
                      );
                    })}
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
