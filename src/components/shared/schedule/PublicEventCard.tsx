"use client";

/**
 * Shared PublicEventCard component used in both ClubClient and ScheduleClient.
 * Those had 89%+ identical EventCard implementations — extracted here to avoid duplication.
 */

import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronDown,
  ChevronRight,
  Clock,
  Download,
  ExternalLink,
  Eye,
  Info,
  Mail,
  MapPin,
  Trophy,
} from "lucide-react";
import Link from "next/link";
import React, { useState } from "react";

import {
  DocumentAttachmentType,
  DocumentViewerDialog,
  getDocumentIcon,
} from "@/components/schedule/DocumentViewerDialog";
import { formatEventDateRange } from "@/lib/date-utils";

interface PublicEventSlot {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  isCancelled?: boolean;
  description?: string;
  location?: string;
  tournamentUrl?: string | null;
  attachmentUrl?: string | null;
  attachmentName?: string | null;
  attachmentType?: DocumentAttachmentType | null;
}

const URL_OR_ROUTE_REGEX = /(https?:\/\/[^\s]+|\/tournaments\/[a-zA-Z0-9_-]+)/g;

const renderPublicTextWithLinks = (text: string) => {
  const parts = text.split(URL_OR_ROUTE_REGEX);
  return parts.map((part, index) => {
    if (part.startsWith("http://") || part.startsWith("https://")) {
      return (
        <a
          key={`ext-link-${index}`}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center gap-1 font-medium text-blue-400 underline underline-offset-2 hover:text-blue-300"
        >
          <span>{part}</span>
          <ExternalLink className="inline size-3 shrink-0 opacity-70" />
        </a>
      );
    }
    if (part.startsWith("/tournaments/")) {
      return (
        <a
          key={`int-link-${index}`}
          href={part}
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center gap-1 font-medium text-amber-400 underline underline-offset-2 hover:text-amber-300"
        >
          <span>{part}</span>
          <ExternalLink className="inline size-3 shrink-0 opacity-70" />
        </a>
      );
    }
    return part;
  });
};

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
  const [isDocViewerOpen, setIsDocViewerOpen] = useState(false);

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

            {event.tournamentUrl && (
              <div className="mt-2.5">
                <a
                  href={event.tournamentUrl}
                  target={
                    event.tournamentUrl.startsWith("http")
                      ? "_blank"
                      : undefined
                  }
                  rel={
                    event.tournamentUrl.startsWith("http")
                      ? "noopener noreferrer"
                      : undefined
                  }
                  className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-300 transition-colors hover:bg-amber-500/20"
                >
                  <Trophy size={13} className="text-amber-400" />
                  <span>Страница на състезанието / Схема</span>
                  <ExternalLink size={12} className="opacity-70" />
                </a>
              </div>
            )}

            {event.attachmentUrl && (
              <div className="mt-2.5 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsDocViewerOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-blue-500/40 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-300 transition-colors hover:bg-blue-500/20"
                >
                  {getDocumentIcon(event.attachmentType, "size-3.5")}
                  <span className="max-w-50 truncate sm:max-w-75">
                    {event.attachmentName || "Наредба за състезанието"}
                  </span>
                  <Eye size={12} className="opacity-70" />
                </button>
                <a
                  href={event.attachmentUrl}
                  download={event.attachmentName || "document"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-lg border border-zinc-700 bg-zinc-800/80 p-1 text-zinc-400 transition-colors hover:text-white"
                  title="Изтегли файла"
                >
                  <Download size={13} />
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Right side */}
        <div className="mt-4 ml-6 flex flex-wrap items-center gap-3 sm:mt-0 sm:ml-0 sm:gap-5">
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
              type="button"
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1.5 text-[13px] font-medium text-blue-400/80 transition-colors hover:text-blue-300"
            >
              <Info size={16} />
              <span>{expanded ? "Свий описанието" : "Виж бележките"}</span>
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
              <div className="rounded-xl border border-blue-900/30 bg-blue-950/20 p-4">
                <div className="text-sm leading-relaxed whitespace-pre-wrap text-zinc-300">
                  {renderPublicTextWithLinks(event.description)}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {event.attachmentUrl && (
        <DocumentViewerDialog
          isOpen={isDocViewerOpen}
          onClose={() => setIsDocViewerOpen(false)}
          documentUrl={event.attachmentUrl}
          documentName={event.attachmentName || "Наредба за състезанието"}
          documentType={event.attachmentType}
        />
      )}
    </motion.div>
  );
}
