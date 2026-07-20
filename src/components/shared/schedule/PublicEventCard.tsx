"use client";

/**
 * Shared PublicEventCard component used in both ClubClient and ScheduleClient.
 * Those had 89%+ identical EventCard implementations — extracted here to avoid duplication.
 */

import { useState } from "react";
import Link from "next/link";
import {
  Clock,
  MapPin,
  ChevronRight,
  Printer,
  Info,
  ChevronDown,
  Mail,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatEventDateRange } from "@/lib/date-utils";

export interface PublicEventSlot {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  isCancelled?: boolean;
  description?: string;
  location?: string;
}

interface PublicEventCardProps {
  event: PublicEventSlot;
  groupIdx: number;
  i: number;
  /**
   * When true, shows the admin "Потвърждение" mail link (ScheduleClient variant).
   * When false, shows the basic public WhatsApp link (ClubClient variant).
   */
  showAdminLinks?: boolean;
}

export function PublicEventCard({
  event,
  groupIdx,
  i,
  showAdminLinks = false,
}: PublicEventCardProps) {
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

  // WhatsApp message — admin version includes full date/time/location context
  const eventDateStr = new Date(event.startTime).toLocaleDateString("bg-BG", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const whatsappMessage = showAdminLinks
    ? `Здравейте, интересувам се да се запиша за: ${event.title} - ${eventDateStr} (${displayTime}) в ${event.location || 'Спортна зала „Енергетик"'}. Моля, свържете се с мен.`
    : `Здравейте, интересувам се да се запиша за: ${event.title}. Моля, свържете се с мен.`;

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: groupIdx * 0.05 + i * 0.04 }}
      className={`group overflow-hidden rounded-2xl border transition-all duration-300 ${
        event.isCancelled
          ? "border-rose-900/30 bg-black/40 opacity-80"
          : "border-zinc-800 bg-black/70 hover:border-blue-700/50 hover:bg-black hover:shadow-[0_0_20px_rgba(30,58,138,0.12)]"
      }`}
    >
      <div className="flex flex-col justify-between gap-4 px-6 py-5 sm:flex-row sm:items-center">
        {/* Left side */}
        <div className="flex items-start gap-5">
          <div
            className={`mt-1 h-12 w-1 shrink-0 rounded-full sm:mt-0 ${
              event.isCancelled
                ? "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]"
                : "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]"
            }`}
          />
          <div>
            <div className="flex items-center gap-3">
              <p
                className={`text-base font-bold tracking-tight text-white ${
                  event.isCancelled ? "text-zinc-400 line-through" : ""
                }`}
              >
                {event.title}
              </p>
              {event.isCancelled && (
                <span className="rounded-md border border-rose-500/30 bg-rose-500/20 px-2.5 py-1 text-[10px] font-bold tracking-widest text-rose-400 uppercase">
                  Отменена
                </span>
              )}
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-4">
              <span className="flex items-center gap-1.5 text-[13px] text-zinc-300">
                <Clock size={14} className="text-blue-400" />
                {displayTime}
              </span>
              <span className="flex items-center gap-1.5 text-[13px] text-zinc-400">
                <MapPin size={14} className="text-blue-400" />
                {event.location || 'Спортна зала „Енергетик"'}
              </span>
            </div>
          </div>
        </div>

        {/* Right side */}
        <div className="mt-4 ml-6 flex flex-wrap items-center gap-3 sm:mt-0 sm:ml-0 sm:gap-5">
          <button
            onClick={handlePrint}
            className="p-2 text-zinc-500 transition-colors hover:text-zinc-300"
            title="Принтирай"
          >
            <Printer size={18} />
          </button>

          {/* Admin-only: email confirmation link */}
          {showAdminLinks && (
            <Link
              href={`/marketing?template=reservationConfirmation&date=${new Date(event.startTime).toISOString()}&end=${new Date(event.endTime).toISOString()}&loc=${encodeURIComponent(event.location || "")}`}
              className="flex items-center gap-1.5 text-[13px] font-medium text-zinc-500 transition-colors hover:text-emerald-400"
              title="Изпрати потвърждение (Админ)"
            >
              <Mail size={16} />
              Потвърждение
            </Link>
          )}

          {event.description && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1.5 text-[13px] font-medium text-blue-400/80 transition-colors hover:text-blue-300"
            >
              <Info size={16} />
              Бележка
              <ChevronDown
                size={14}
                className={`transition-transform duration-300 ${expanded ? "rotate-180" : ""}`}
              />
            </button>
          )}

          {!event.isCancelled && (
            <a
              href={`https://wa.me/359899829923?text=${encodeURIComponent(whatsappMessage)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-2 flex items-center gap-1.5 text-sm font-semibold text-green-400 transition-colors group-hover:gap-2 hover:text-green-300"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="size-3.5"
              >
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              Запиши се
              <ChevronRight
                size={15}
                className="transition-transform group-hover:translate-x-0.5"
              />
            </a>
          )}
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
            <div className="ml-6 px-6 pt-2 pb-5 sm:ml-10">
              <div className="rounded-xl border border-blue-900/20 bg-blue-900/10 p-4">
                <p className="text-sm leading-relaxed whitespace-pre-wrap text-zinc-300">
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
