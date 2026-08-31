"use client";

import {
  Laptop,
  Mail,
  MessageCircle,
  MessageSquare,
  Phone,
  Smartphone,
} from "lucide-react";
import React, { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MarketingChannel, MarketingRecipient } from "@/types/marketing.types";

interface Props {
  channel: MarketingChannel;
  messageText: string;
  emailSubject?: string;
  sampleRecipient?: MarketingRecipient | null;
  eventTitle?: string;
  eventDate?: string;
  surveyLink?: string;
}

function getChannelLabel(channel: MarketingChannel) {
  switch (channel) {
    case "whatsapp":
      return "WhatsApp Preview";
    case "viber":
      return "Viber Preview";
    case "sms":
      return "SMS Preview";
    default:
      return "Email Preview";
  }
}

function getBubbleStyle(channel: MarketingChannel) {
  switch (channel) {
    case "whatsapp":
      return "rounded-tl-xs border border-emerald-700/50 bg-emerald-900/90 text-emerald-50";
    case "viber":
      return "rounded-tl-xs border border-purple-700/50 bg-purple-900/90 text-purple-50";
    default:
      return "rounded-tl-xs border border-blue-700/50 bg-blue-900/90 text-blue-50";
  }
}

export function LiveDevicePreview({
  channel,
  messageText,
  emailSubject = "Известие от БК Гълъбово",
  sampleRecipient,
  eventTitle = "Летен Лагер Приморско 2026",
  eventDate = "15.07 - 22.07.2026",
  surveyLink = "https://bkgalabovo2025.vercel.app/feedback/sample",
}: Props) {
  const [deviceMode, setDeviceMode] = useState<"mobile" | "desktop">(
    channel === "email" ? "desktop" : "mobile"
  );

  // Substitute variables with sample or real recipient data
  const renderResolvedText = () => {
    if (!messageText)
      return "Въведете текст на съобщението, за да видите предварителен преглед...";

    const recipientName =
      sampleRecipient?.name || sampleRecipient?.parentName || "Мария Иванова";
    const childName =
      sampleRecipient?.childName ||
      (sampleRecipient?.role === "athlete"
        ? sampleRecipient.name
        : "Александър");

    return messageText
      .replace(/{ИМЕ}/g, recipientName)
      .replace(/{ДЕТЕ}/g, childName)
      .replace(/{СЪБИТИЕ}/g, eventTitle)
      .replace(/{ДАТА}/g, eventDate)
      .replace(/{ЧАС}/g, "18:00 ч.")
      .replace(/{ЛОКАЦИЯ}/g, "Спортна зала Гълъбово")
      .replace(/{ЛИНК}/g, "https://bkgalabovo.bg/events/1")
      .replace(/{ЛИНК_АНКЕТА}/g, surveyLink);
  };

  const resolvedText = renderResolvedText();
  const recipientDisplayName =
    sampleRecipient?.name || "Мария Иванова (Родител)";

  return (
    <div className="flex h-full flex-col space-y-3">
      {/* Top Preview Controls */}
      <div className="flex items-center justify-between border-b border-zinc-200/80 pb-2.5 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="flex items-center gap-1.5 rounded-lg border-indigo-200 bg-indigo-50/70 px-2.5 py-1 text-[11px] font-bold text-indigo-700 dark:border-indigo-900/50 dark:bg-indigo-950/40 dark:text-indigo-300"
          >
            {channel === "whatsapp" && (
              <MessageCircle className="size-3.5 text-emerald-600" />
            )}
            {channel === "viber" && (
              <Phone className="size-3.5 text-purple-600" />
            )}
            {channel === "sms" && (
              <MessageSquare className="size-3.5 text-blue-600" />
            )}
            {channel === "email" && <Mail className="size-3.5 text-rose-600" />}
            <span>{getChannelLabel(channel)}</span>
          </Badge>
          <span className="text-[11px] text-zinc-400">
            За:{" "}
            <strong className="text-zinc-600 dark:text-zinc-300">
              {recipientDisplayName}
            </strong>
          </span>
        </div>

        {/* Device Switcher */}
        <div className="flex items-center gap-1 rounded-xl border border-zinc-200 bg-zinc-100/80 p-1 dark:border-zinc-800 dark:bg-zinc-900">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setDeviceMode("mobile")}
            className={`h-7 rounded-lg px-2 text-xs font-semibold ${
              deviceMode === "mobile"
                ? "bg-white text-zinc-900 shadow-xs dark:bg-zinc-800 dark:text-white"
                : "text-zinc-500 hover:text-zinc-900"
            }`}
          >
            <Smartphone className="mr-1 size-3.5" />
            Мобилен
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setDeviceMode("desktop")}
            className={`h-7 rounded-lg px-2 text-xs font-semibold ${
              deviceMode === "desktop"
                ? "bg-white text-zinc-900 shadow-xs dark:bg-zinc-800 dark:text-white"
                : "text-zinc-500 hover:text-zinc-900"
            }`}
          >
            <Laptop className="mr-1 size-3.5" />
            Десктоп
          </Button>
        </div>
      </div>

      {/* Device Frame */}
      <div className="flex flex-1 items-center justify-center rounded-2xl border border-zinc-200/80 bg-zinc-100/50 p-4 dark:border-zinc-800 dark:bg-zinc-950/40">
        {deviceMode === "mobile" ? (
          /* Smartphone Mockup */
          <div className="relative mx-auto w-full max-w-80 rounded-[36px] border-4 border-zinc-800 bg-zinc-900 p-3 shadow-2xl ring-1 ring-zinc-700/50 sm:max-w-85">
            {/* Speaker & Camera Notch */}
            <div className="mx-auto mb-3 h-4 w-28 rounded-full bg-zinc-800" />

            {/* Mobile Screen Container */}
            <div className="min-h-95 overflow-hidden rounded-[24px] bg-zinc-950 text-white">
              {/* Mobile App Header */}
              <div className="flex items-center gap-2.5 border-b border-zinc-800 bg-zinc-900/90 px-3.5 py-2.5">
                <div className="flex size-7 items-center justify-center rounded-full bg-indigo-600 text-xs font-black text-white">
                  БК
                </div>
                <div className="flex-1 truncate">
                  <div className="truncate text-xs font-bold text-white">
                    Бадминтон клуб Гълъбово
                  </div>
                  <div className="text-[10px] text-emerald-400">онлайн</div>
                </div>
              </div>

              {/* Chat Canvas */}
              <div className="flex flex-col justify-end space-y-2 p-3.5">
                {/* Bubble Container */}
                <div
                  className={`relative max-w-[90%] rounded-2xl p-3 text-xs leading-relaxed shadow-sm ${getBubbleStyle(channel)}`}
                >
                  <div className="font-sans text-[11px] whitespace-pre-wrap sm:text-xs">
                    {resolvedText}
                  </div>
                  <div className="mt-1.5 flex items-center justify-end gap-1 text-[9px] text-zinc-400">
                    <span>18:30</span>
                    <span>✓✓</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Home Indicator */}
            <div className="mx-auto mt-3 h-1 w-24 rounded-full bg-zinc-700" />
          </div>
        ) : (
          /* Desktop / Email Mockup */
          <div className="w-full rounded-2xl border border-zinc-300 bg-white p-4 shadow-xl sm:p-6 dark:border-zinc-800 dark:bg-zinc-900">
            {/* Email Header bar */}
            <div className="space-y-2 border-b border-zinc-100 pb-3 dark:border-zinc-800">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-900 dark:text-white">
                  {emailSubject || "Официално известие"}
                </span>
                <span className="text-[11px] text-zinc-400">
                  Днес, 18:30 ч.
                </span>
              </div>
              <div className="text-[11px] text-zinc-500">
                От:{" "}
                <strong>
                  Бадминтон клуб Гълъбово &lt;info@bkgalabovo.bg&gt;
                </strong>
              </div>
              <div className="text-[11px] text-zinc-500">
                До:{" "}
                <strong>
                  {sampleRecipient?.email || "parent@example.com"}
                </strong>
              </div>
            </div>

            {/* Email Body Card */}
            <div className="mt-4 rounded-xl border border-indigo-100 bg-indigo-50/30 p-4 dark:border-zinc-800 dark:bg-zinc-950/60">
              <div className="mb-3 flex items-center gap-2 border-b border-indigo-100 pb-2 dark:border-zinc-800">
                <span className="text-sm font-black text-indigo-900 dark:text-indigo-400">
                  🏸 БК ГЪЛЪБОВО
                </span>
              </div>
              <div className="text-xs leading-relaxed whitespace-pre-wrap text-zinc-800 dark:text-zinc-200">
                {resolvedText}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
