"use client";

import { Mail, Phone, PhoneCall, RotateCcw, Trash2 } from "lucide-react";
import React from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ContactCommunicationStatus,
  MarketingRecipient,
} from "@/types/marketing.types";

interface ContactCardProps {
  contact: MarketingRecipient;
  onCallLog: (contact: MarketingRecipient) => void;
  onEmail: (contact: MarketingRecipient) => void;
  onStatusChange: (
    contactId: string,
    newStatus: ContactCommunicationStatus
  ) => Promise<void>;
  onDelete?: (contactId: string) => void;
}

const statusConfig: Record<
  ContactCommunicationStatus,
  { label: string; bg: string; text: string; border: string }
> = {
  pending: {
    label: "За контакт",
    bg: "bg-blue-500/10",
    text: "text-blue-600 dark:text-blue-400",
    border: "border-blue-500/20",
  },
  contacted: {
    label: "Свързан по тел.",
    bg: "bg-amber-500/10",
    text: "text-amber-600 dark:text-amber-400",
    border: "border-amber-500/20",
  },
  emailed: {
    label: "Изпратен имейл",
    bg: "bg-emerald-500/10",
    text: "text-emerald-600 dark:text-emerald-400",
    border: "border-emerald-500/20",
  },
  archived: {
    label: "Архив",
    bg: "bg-zinc-500/10",
    text: "text-zinc-500 dark:text-zinc-400",
    border: "border-zinc-500/20",
  },
};

export function ContactCard({
  contact,
  onCallLog,
  onEmail,
  onStatusChange,
  onDelete,
}: ContactCardProps) {
  const currentStatus: ContactCommunicationStatus =
    contact.communicationStatus || "pending";
  const badge = statusConfig[currentStatus] || statusConfig.pending;
  const isRecovery = contact.siteId === "recoveryzone";

  return (
    <Card className="overflow-hidden rounded-3xl border-zinc-200 bg-white transition-all hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950">
      <CardContent className="p-6">
        {/* Header: Name + Badges */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-extrabold tracking-wider uppercase ${
                  isRecovery
                    ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                    : "border border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-400"
                }`}
              >
                {isRecovery ? "🌿 Recovery Zone" : "🏸 БК Гълъбово"}
              </span>

              {contact.group && (
                <span className="text-[10px] font-semibold text-zinc-400 uppercase">
                  {contact.group}
                </span>
              )}
            </div>

            <h4 className="mt-1.5 text-base font-bold text-zinc-900 dark:text-white">
              {contact.name}
            </h4>

            {contact.parentName && (
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Родител: {contact.parentName}
                {contact.childName && ` (на ${contact.childName})`}
              </p>
            )}
          </div>

          <Badge
            className={`shrink-0 rounded-lg border px-2.5 py-1 text-[11px] font-semibold ${badge.bg} ${badge.text} ${badge.border}`}
          >
            {badge.label}
          </Badge>
        </div>

        {/* Contact Info Grid */}
        <div className="mt-4 grid grid-cols-1 gap-3 rounded-2xl border border-zinc-100 bg-zinc-50/70 p-4 text-xs sm:grid-cols-2 dark:border-zinc-900 dark:bg-zinc-900/50">
          {/* Phone block */}
          <div>
            <span className="text-[10px] font-semibold text-zinc-400 uppercase">
              Телефон
            </span>
            <div className="mt-0.5">
              {contact.phone ? (
                <a
                  href={`tel:${contact.phone.replace(/\s+/g, "")}`}
                  className="font-bold text-blue-600 hover:underline dark:text-blue-400"
                >
                  {contact.phone}
                </a>
              ) : (
                <span className="text-zinc-400 italic">
                  Няма въведен телефон
                </span>
              )}
            </div>
            <p className="mt-0.5 text-[11px] text-zinc-500">
              {contact.parentName ? "Номер на родител" : "Личен номер"}
            </p>
          </div>

          {/* Email block */}
          <div>
            <span className="text-[10px] font-semibold text-zinc-400 uppercase">
              Имейл
            </span>
            <div className="mt-0.5">
              {contact.email ? (
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                  {contact.email}
                </span>
              ) : (
                <span className="text-zinc-400 italic">Няма въведен имейл</span>
              )}
            </div>
            <p className="mt-0.5 text-[11px] text-zinc-500">
              {contact.email ? "Валиден за кампании" : "Не е въведен"}
            </p>
          </div>
        </div>

        {/* Notes / Last contact info if present */}
        {contact.notes && (
          <div className="mt-3 rounded-xl bg-zinc-100/70 p-3 text-xs text-zinc-700 italic dark:bg-zinc-900 dark:text-zinc-300">
            <span className="font-semibold text-zinc-500 not-italic">
              Последна бележка:{" "}
            </span>
            &quot;{contact.notes}&quot;
          </div>
        )}

        {/* Action Buttons Footer */}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-zinc-100 pt-4 dark:border-zinc-900">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            {/* Phone Call button */}
            {contact.phone && (
              <a
                href={`tel:${contact.phone.replace(/\s+/g, "")}`}
                className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 text-xs font-semibold text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
                title="Набиране на телефон"
              >
                <Phone className="size-3.5 text-emerald-500" />
                <span>Обади се</span>
              </a>
            )}

            {/* Log Call Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => onCallLog(contact)}
              className="h-9 gap-1.5 rounded-xl text-xs font-semibold text-amber-600 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-950/30"
              title="Запиши резултат от разговор"
            >
              <PhoneCall className="size-3.5" />
              <span>Лог разговор</span>
            </Button>

            {/* Quick Email button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEmail(contact)}
              className="h-9 gap-1.5 rounded-xl text-xs font-semibold text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/30"
              title="Изпрати имейл"
            >
              <Mail className="size-3.5" />
              <span>Имейл</span>
            </Button>
          </div>

          {/* Status quick switchers */}
          <div className="flex items-center gap-1">
            {currentStatus !== "archived" ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onStatusChange(contact.id, "archived")}
                className="h-9 rounded-xl text-xs text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                title="Премести в архив"
              >
                Архив
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onStatusChange(contact.id, "pending")}
                className="h-9 rounded-xl text-xs text-blue-600 hover:bg-blue-50 dark:text-blue-400"
                title="Върни в активни за контакт"
              >
                <RotateCcw className="mr-1 size-3.5" />
                Върни
              </Button>
            )}

            {onDelete && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDelete(contact.id)}
                className="size-9 rounded-xl text-zinc-400 hover:bg-rose-500/10 hover:text-rose-600"
                title="Изтрий от списъка"
              >
                <Trash2 className="size-3.5" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
