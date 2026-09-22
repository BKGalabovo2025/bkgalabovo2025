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

import { EventInquiryDialog } from "./EventInquiryDialog";

interface PublicEventSlot {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  type?: string;
  isTournament?: boolean;
  isCancelled?: boolean;
  description?: string;
  location?: string;
  tournamentUrl?: string | null;
  attachmentUrl?: string | null;
  attachmentName?: string | null;
  attachmentType?: DocumentAttachmentType | null;
}

interface EventTypeConfig {
  label: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  barBg: string;
  barShadow: string;
  cardBorderHover: string;
  cardShadowHover: string;
  icon: string;
}

const EVENT_TYPE_STYLES: Record<string, EventTypeConfig> = {
  training: {
    label: "Тренировка",
    badgeBg: "bg-blue-500/15",
    badgeText: "text-blue-300",
    badgeBorder: "border-blue-500/30",
    barBg: "bg-blue-500",
    barShadow: "shadow-[0_0_8px_rgba(59,130,246,0.6)]",
    cardBorderHover: "hover:border-blue-500/50",
    cardShadowHover: "hover:shadow-[0_0_20px_rgba(59,130,246,0.15)]",
    icon: "🏸",
  },
  competition: {
    label: "Състезание / Турнир",
    badgeBg: "bg-amber-500/15",
    badgeText: "text-amber-300",
    badgeBorder: "border-amber-500/40",
    barBg: "bg-amber-500",
    barShadow: "shadow-[0_0_8px_rgba(245,158,11,0.6)]",
    cardBorderHover: "hover:border-amber-500/50",
    cardShadowHover: "hover:shadow-[0_0_20px_rgba(245,158,11,0.15)]",
    icon: "🏆",
  },
  camp: {
    label: "Спортен лагер",
    badgeBg: "bg-emerald-500/15",
    badgeText: "text-emerald-300",
    badgeBorder: "border-emerald-500/40",
    barBg: "bg-emerald-500",
    barShadow: "shadow-[0_0_8px_rgba(16,185,129,0.6)]",
    cardBorderHover: "hover:border-emerald-500/50",
    cardShadowHover: "hover:shadow-[0_0_20px_rgba(16,185,129,0.15)]",
    icon: "⛺",
  },
  event: {
    label: "Клубно събитие",
    badgeBg: "bg-purple-500/15",
    badgeText: "text-purple-300",
    badgeBorder: "border-purple-500/40",
    barBg: "bg-purple-500",
    barShadow: "shadow-[0_0_8px_rgba(168,85,247,0.6)]",
    cardBorderHover: "hover:border-purple-500/50",
    cardShadowHover: "hover:shadow-[0_0_20px_rgba(168,85,247,0.15)]",
    icon: "🎉",
  },
  other: {
    label: "Друго събитие",
    badgeBg: "bg-cyan-500/15",
    badgeText: "text-cyan-300",
    badgeBorder: "border-cyan-500/40",
    barBg: "bg-cyan-500",
    barShadow: "shadow-[0_0_8px_rgba(6,182,212,0.6)]",
    cardBorderHover: "hover:border-cyan-500/50",
    cardShadowHover: "hover:shadow-[0_0_20px_rgba(6,182,212,0.15)]",
    icon: "📋",
  },
};

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
  const [isInquiryOpen, setIsInquiryOpen] = useState(false);

  const displayTime = formatEventDateRange(event.startTime, event.endTime);

  // Event styling config
  const rawType = event.isTournament ? "competition" : event.type || "training";
  const typeConfig = EVENT_TYPE_STYLES[rawType] || EVENT_TYPE_STYLES.training;

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: groupIdx * 0.05 + i * 0.04 }}
      className={`group overflow-hidden rounded-2xl border transition-all duration-300 ${
        event.isCancelled
          ? "border-rose-900/30 bg-black/40 opacity-80"
          : `border-zinc-800 bg-black/70 ${typeConfig.cardBorderHover} hover:bg-black ${typeConfig.cardShadowHover}`
      }`}
    >
      <div className="flex flex-col justify-between gap-4 px-6 py-5 sm:flex-row sm:items-center">
        {/* Left side */}
        <div className="flex items-start gap-5">
          <div
            className={`mt-1 h-12 w-1 shrink-0 rounded-full sm:mt-0 ${
              event.isCancelled
                ? "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]"
                : `${typeConfig.barBg} ${typeConfig.barShadow}`
            }`}
          />
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <p
                className={`text-base font-bold tracking-tight text-white ${
                  event.isCancelled ? "text-zinc-400 line-through" : ""
                }`}
              >
                {event.title}
              </p>

              {/* Event Type Badge */}
              {!event.isCancelled && (
                <span
                  className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-semibold tracking-wide ${typeConfig.badgeBorder} ${typeConfig.badgeBg} ${typeConfig.badgeText}`}
                >
                  <span>{typeConfig.icon}</span>
                  <span>{typeConfig.label}</span>
                </span>
              )}

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
            <button
              type="button"
              onClick={() => setIsInquiryOpen(true)}
              className="ml-2 inline-flex items-center gap-1.5 rounded-xl border border-blue-500/40 bg-blue-600/20 px-3.5 py-1.5 text-xs font-bold text-blue-300 shadow-[0_0_12px_rgba(59,130,246,0.2)] transition-all hover:border-blue-400 hover:bg-blue-600/30 hover:text-white"
            >
              <span>Запиши се</span>
              <ChevronRight
                size={14}
                className="transition-transform group-hover:translate-x-0.5"
              />
            </button>
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

      <EventInquiryDialog
        isOpen={isInquiryOpen}
        onClose={() => setIsInquiryOpen(false)}
        event={event}
      />
    </motion.div>
  );
}
