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

function EventCard({
  event,
  groupIdx,
  i,
}: {
  event: EventSlot;
  groupIdx: number;
  i: number;
}) {
  const [expanded, setExpanded] = useState(false);

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>Принтиране на събитие - ${event.title}</title>
          <style>
            body { font-family: sans-serif; padding: 2rem; color: #333; }
            h1 { color: #000; }
            .meta { color: #666; margin-bottom: 2rem; }
            .desc { white-space: pre-wrap; line-height: 1.6; }
          </style>
        </head>
        <body>
          <h1>${event.title}</h1>
          <div class="meta">
            <p><strong>Дата и час:</strong> ${formatEventDateRange(event.startTime, event.endTime)}</p>
            <p><strong>Локация:</strong> ${event.location || 'Спортна зала „Енергетик"'}</p>
          </div>
          <div class="desc">${event.description || "Няма допълнителна информация."}</div>
          <script>window.print(); window.setTimeout(() => window.close(), 500);</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const displayTime = formatEventDateRange(event.startTime, event.endTime);

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: groupIdx * 0.05 + i * 0.04 }}
      className={`group border rounded-2xl overflow-hidden transition-all duration-300 ${
        event.isCancelled
          ? "bg-black/40 border-rose-900/30 opacity-80"
          : "bg-black/70 border-zinc-800 hover:border-blue-700/50 hover:bg-black hover:shadow-[0_0_20px_rgba(30,58,138,0.12)]"
      }`}
    >
      <div className="px-6 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Left side */}
        <div className="flex items-start gap-5">
          <div
            className={`w-1 h-12 mt-1 sm:mt-0 rounded-full shrink-0 ${event.isCancelled ? "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]" : "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]"}`}
          />
          <div>
            <div className="flex items-center gap-3">
              <p
                className={`text-white font-bold text-base tracking-tight ${event.isCancelled ? "line-through text-zinc-400" : ""}`}
              >
                {event.title}
              </p>
              {event.isCancelled && (
                <span className="text-[10px] font-bold uppercase tracking-widest bg-rose-500/20 text-rose-400 px-2.5 py-1 rounded-md border border-rose-500/30">
                  Отменена
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-4 mt-2">
              <span className="flex items-center gap-1.5 text-zinc-300 text-[13px]">
                <Clock size={14} className="text-blue-400" />
                {displayTime}
              </span>
              <span className="flex items-center gap-1.5 text-zinc-400 text-[13px]">
                <MapPin size={14} className="text-blue-400" />
                {event.location || 'Спортна зала „Енергетик"'}
              </span>
            </div>
          </div>
        </div>

        {/* Right side */}
        <div className="flex flex-wrap items-center gap-3 sm:gap-5 mt-4 sm:mt-0 ml-6 sm:ml-0">
          <button
            onClick={handlePrint}
            className="text-zinc-500 hover:text-zinc-300 transition-colors p-2"
            title="Принтирай"
          >
            <Printer size={18} />
          </button>

          <Link
            href={`/marketing?template=reservationConfirmation&date=${new Date(event.startTime).toISOString()}&end=${new Date(event.endTime).toISOString()}&loc=${encodeURIComponent(event.location || "")}`}
            className="flex items-center gap-1.5 text-zinc-500 hover:text-emerald-400 text-[13px] font-medium transition-colors"
            title="Изпрати потвърждение (Админ)"
          >
            <Mail size={16} />
            Потвърждение
          </Link>

          {event.description && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1.5 text-blue-400/80 hover:text-blue-300 text-[13px] font-medium transition-colors"
            >
              <Info size={16} />
              Бележка
              <ChevronDown
                size={14}
                className={`transition-transform duration-300 ${expanded ? "rotate-180" : ""}`}
              />
            </button>
          )}

          {!event.isCancelled &&
            (() => {
              const eventDateStr = new Date(event.startTime).toLocaleDateString(
                "bg-BG",
                {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                }
              );
              return (
                <a
                  href={`https://wa.me/359899829923?text=${encodeURIComponent(
                    `Здравейте, интересувам се да се запиша за: ${event.title} - ${eventDateStr} (${displayTime}) в ${event.location || 'Спортна зала „Енергетик"'}. Моля, свържете се с мен.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-green-400 text-sm font-semibold hover:text-green-300 transition-colors group-hover:gap-2 ml-2"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-3.5 h-3.5"
                  >
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                  Запиши се
                  <ChevronRight
                    size={15}
                    className="transition-transform group-hover:translate-x-0.5"
                  />
                </a>
              );
            })()}
        </div>
      </div>

      <AnimatePresence>
        {expanded && event.description && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-5 pt-2 ml-6 sm:ml-10">
              <div className="p-4 rounded-xl bg-blue-900/10 border border-blue-900/20">
                <p className="text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed">
                  {event.description}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
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
                    {events.map((event, i) => (
                      <EventCard
                        key={event.id}
                        event={event}
                        groupIdx={groupIdx}
                        i={i}
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
