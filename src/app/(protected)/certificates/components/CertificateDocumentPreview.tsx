/* eslint-disable sonarjs/cognitive-complexity, sonarjs/no-nested-conditional, sonarjs/no-all-duplicated-branches */
"use client";

import {
  Award,
  Calendar,
  MapPin,
  Phone,
  QrCode as QrCodeIcon,
  Sparkles,
  Trophy,
} from "lucide-react";
import Image from "next/image";
import React, { useMemo } from "react";

import {
  AwardRank,
  CertificateType,
  FrameStyle,
  getRankLabel,
  LayoutTemplate,
  SponsorPartner,
  VisualConfig,
} from "@/types/certificates";

import {
  BadmintonShuttlecockSvg,
  CrossedRacketsSvg,
  KidsSportsDynamicSvg,
  LaurelWreathCrestSvg,
  ZenWellnessLotusSvg,
} from "./CertificateVectorIllustrations";

export interface CertificatePreviewData {
  siteId: "bkgalabovo" | "recoveryzone";
  type: CertificateType;
  title: string;
  visualConfig: VisualConfig;
  serialNumber?: string;
  qrCodeDataUrl?: string;

  // Recipient info
  recipientName?: string;
  recipientInstitution?: string;

  // Type specific details
  rank?: AwardRank;
  nomination?: string;
  eventTitle?: string;
  eventDate?: string;
  eventLocation?: string;

  // Voucher details
  totalSessions?: number;
  remainingSessions?: number;
  validUntil?: string;

  // Certificate details
  skillsSummary?: string;
  hoursTrained?: number;

  // Sponsors
  sponsors?: SponsorPartner[];
}

interface CertificateDocumentPreviewProps {
  data: CertificatePreviewData;
  className?: string;
}

export function CertificateDocumentPreview({
  data,
  className = "",
}: CertificateDocumentPreviewProps) {
  const {
    siteId,
    type,
    title,
    visualConfig,
    serialNumber = "BKG-2026-DEMO",
    qrCodeDataUrl,
    recipientName = "Иван Петров Димитров",
    recipientInstitution = "СУ „Васил Левски“ • Гълъбово",
    rank = "1st",
    nomination,
    eventTitle = "Общински Турнир по Бадминтон „Гълъбово 2026“",
    eventDate = new Date().toLocaleDateString("bg-BG"),
    eventLocation = "Спортен Комплекс „Енергетик“, гр. Гълъбово",
    totalSessions = 5,
    validUntil,
    skillsSummary,
    sponsors = [],
  } = data;

  const isRecoveryZone = siteId === "recoveryzone";
  const isLandscape = visualConfig.orientation !== "portrait";
  const frameStyle: FrameStyle = visualConfig.frameStyle || "classic_gold";
  const isLuxuryDark =
    frameStyle === "luxury_dark" ||
    visualConfig.layoutTemplate === "recovery_voucher";

  // AI Background Detection
  const isAiBackground =
    visualConfig.layoutMode === "custom_ai_background" &&
    Boolean(visualConfig.aiBackgroundUrl);

  const textColorMode = visualConfig.textColorMode || "auto";
  const isLightText =
    textColorMode === "light" ||
    (textColorMode === "auto" && isAiBackground) ||
    isLuxuryDark;

  const scrimOpacityClass = useMemo(() => {
    const op = visualConfig.overlayOpacity ?? 20;
    if (op <= 15) return isLightText ? "bg-black/10" : "bg-white/10";
    if (op <= 25) return isLightText ? "bg-black/20" : "bg-white/20";
    if (op <= 35) return isLightText ? "bg-black/30" : "bg-white/30";
    if (op <= 45) return isLightText ? "bg-black/45" : "bg-white/45";
    if (op <= 60) return isLightText ? "bg-black/60" : "bg-white/60";
    return isLightText ? "bg-black/75" : "bg-white/75";
  }, [visualConfig.overlayOpacity, isLightText]);

  // Layout Template Resolution
  const layoutTemplate: LayoutTemplate =
    visualConfig.layoutTemplate ||
    (type === "voucher"
      ? isRecoveryZone
        ? "recovery_voucher"
        : "sports_voucher"
      : type === "award"
        ? "official_award"
        : "classic_certificate");

  // Filter sponsors that are selected in the visualConfig, or show active ones
  const activeSponsors = sponsors.filter((s) => {
    if (
      visualConfig.selectedSponsorIds &&
      visualConfig.selectedSponsorIds.length > 0
    ) {
      return visualConfig.selectedSponsorIds.includes(s.id);
    }
    return s.isActive;
  });

  // Club brand identity
  const orgName = isRecoveryZone ? "RECOVERY ZONE" : "БАДМИНТОН КЛУБ ГЪЛЪБОВО";
  const orgSubtitle = isRecoveryZone
    ? "СПОРТНО ВЪЗСТАНОВЯВАНЕ & РЕХАБИЛИТАЦИЯ • BY ZM"
    : "СПОРТЕН КОМПЛЕКС „ЕНЕРГЕТИК“ • ОБЩИНА ГЪЛЪБОВО";
  const orgLogo = isRecoveryZone
    ? "/recovery-zone/rz-icon-square.png"
    : "/icons/badge-option-3-light-squircle.png";

  const freeSessionsCount =
    visualConfig.extraFreeSessions ?? totalSessions ?? 2;

  const verifyDomain = "bkgalabovo2025.vercel.app";
  const verifyPath =
    isRecoveryZone || type === "voucher"
      ? `/recovery-zone?verify=${encodeURIComponent(serialNumber)}`
      : `/club?verify=${encodeURIComponent(serialNumber)}`;

  return (
    <div
      className={`relative overflow-hidden transition-all duration-300 select-none ${
        isLandscape
          ? "aspect-[1.414/1] w-full max-w-4xl"
          : "aspect-[1/1.414] w-full max-w-2xl"
      } ${
        isAiBackground
          ? "bg-zinc-950 text-white"
          : isLuxuryDark
            ? "bg-[#09090b] text-zinc-100"
            : "bg-white text-zinc-900"
      } rounded-2xl shadow-2xl ${className}`}
    >
      {/* ========================================================================= */}
      {/* LAYER 1: BACKGROUND (AI Canvas OR Standard HTML Frames) */}
      {/* ========================================================================= */}
      {isAiBackground ? (
        <div className="absolute inset-0 z-0">
          <Image
            src={visualConfig.aiBackgroundUrl!}
            alt="AI Generated Background"
            fill
            sizes="(max-width: 1024px) 100vw, 1200px"
            className="pointer-events-none size-full object-cover"
            unoptimized
            priority
          />

          {/* Dynamic Scrim Layer for Readability */}
          <div
            className={`pointer-events-none absolute inset-0 backdrop-blur-[0.2px] ${scrimOpacityClass}`}
          />

          {/* Fine-Art Inner Border Line */}
          <div className="pointer-events-none absolute inset-3 rounded-xl border border-white/20 shadow-[inset_0_0_25px_rgba(0,0,0,0.3)]" />
          <div className="pointer-events-none absolute inset-4 rounded-lg border border-amber-400/30" />
        </div>
      ) : (
        <>
          {/* Frame 1: Classic Gold */}
          {frameStyle === "classic_gold" && (
            <>
              <div className="pointer-events-none absolute inset-3 rounded-xl border-2 border-amber-600/70" />
              <div className="pointer-events-none absolute inset-4 rounded-lg border border-amber-500/40" />
              <div className="pointer-events-none absolute inset-6 border border-amber-400/20" />
              <div className="absolute top-3 left-3 size-10 rounded-tl-lg border-t-4 border-l-4 border-amber-500" />
              <div className="absolute top-3 right-3 size-10 rounded-tr-lg border-t-4 border-r-4 border-amber-500" />
              <div className="absolute bottom-3 left-3 size-10 rounded-bl-lg border-b-4 border-l-4 border-amber-500" />
              <div className="absolute right-3 bottom-3 size-10 rounded-br-lg border-r-4 border-b-4 border-amber-500" />
            </>
          )}

          {/* Frame 2: Luxury Dark */}
          {frameStyle === "luxury_dark" && (
            <>
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-amber-500/5 via-transparent to-amber-500/10" />
              <div className="pointer-events-none absolute inset-3.5 rounded-xl border border-amber-500/30" />
              <div className="pointer-events-none absolute inset-5 rounded-lg border border-amber-400/20" />
              <div className="absolute top-4 left-4 size-6 border-t-2 border-l-2 border-amber-400" />
              <div className="absolute top-4 right-4 size-6 border-t-2 border-r-2 border-amber-400" />
              <div className="absolute bottom-4 left-4 size-6 border-b-2 border-l-2 border-amber-400" />
              <div className="absolute right-4 bottom-4 size-6 border-r-2 border-b-2 border-amber-400" />
            </>
          )}

          {/* Frame 3: Sport Champion */}
          {frameStyle === "sport_champion" && (
            <>
              <div className="pointer-events-none absolute inset-3 rounded-xl border-2 border-blue-600/80" />
              <div className="pointer-events-none absolute top-0 right-0 size-36 bg-gradient-to-bl from-blue-600/15 via-blue-500/5 to-transparent" />
              <div className="pointer-events-none absolute bottom-0 left-0 size-36 bg-gradient-to-tr from-amber-500/15 via-amber-500/5 to-transparent" />
              <div className="absolute top-3 left-3 h-1 w-16 bg-gradient-to-r from-blue-600 to-amber-500" />
              <div className="absolute right-3 bottom-3 h-1 w-16 bg-gradient-to-l from-blue-600 to-amber-500" />
            </>
          )}

          {/* Frame 4: Modern Minimal */}
          {frameStyle === "modern_minimal" && (
            <>
              <div className="pointer-events-none absolute inset-4 rounded-xl border border-zinc-200/90 dark:border-zinc-800" />
              <div className="pointer-events-none absolute inset-x-12 top-4 h-1 bg-gradient-to-r from-transparent via-blue-600 to-transparent" />
            </>
          )}

          {/* Frame 5: Voucher Ticket */}
          {frameStyle === "voucher_ticket" && (
            <>
              <div className="pointer-events-none absolute inset-3 rounded-2xl border-2 border-dashed border-amber-400/80" />
              <div className="absolute top-1/2 -left-3 size-6 -translate-y-1/2 rounded-full border border-amber-400/60 bg-zinc-100 dark:bg-zinc-950" />
              <div className="absolute top-1/2 -right-3 size-6 -translate-y-1/2 rounded-full border border-amber-400/60 bg-zinc-100 dark:bg-zinc-950" />
            </>
          )}
        </>
      )}

      {/* Decorative SVG Watermarks (Non-obstructive Canva-style art layers) */}
      <div className="pointer-events-none absolute inset-0 z-1 overflow-hidden opacity-10">
        {layoutTemplate === "sports_voucher" && (
          <>
            <div className="absolute -top-6 -right-6">
              <KidsSportsDynamicSvg
                className="size-52"
                primaryColor="#F59E0B"
                secondaryColor="#3B82F6"
              />
            </div>
            <div className="absolute -bottom-8 -left-8">
              <CrossedRacketsSvg
                className="size-48"
                primaryColor="#3B82F6"
                secondaryColor="#F59E0B"
              />
            </div>
          </>
        )}
        {layoutTemplate === "official_award" && (
          <div className="absolute top-1/2 left-1/2 -translate-1/2">
            <LaurelWreathCrestSvg className="size-80" primaryColor="#D97706" />
          </div>
        )}
        {layoutTemplate === "recovery_voucher" && (
          <div className="absolute top-1/2 left-1/2 -translate-1/2">
            <ZenWellnessLotusSvg
              className="size-72"
              primaryColor="#10B981"
              secondaryColor="#D97706"
            />
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* LAYER 2: VECTOR DYNAMIC OVERLAY (High Contrast Canva-style Typography) */}
      {/* ========================================================================= */}
      <div className="relative z-10 flex h-full flex-col justify-between p-5 sm:p-7 md:p-8">
        {/* Top Header: Logo + Club Title + Serial Number */}
        <div
          className={`flex items-start justify-between border-b pb-2.5 ${
            isAiBackground && isLightText
              ? "border-white/20"
              : "border-zinc-200/60 dark:border-zinc-800/80"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="relative flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/60 bg-white p-1 shadow-md sm:size-12">
              <div className="relative size-9 sm:size-10">
                <Image
                  src={orgLogo}
                  alt={orgName}
                  fill
                  sizes="40px"
                  className="object-contain"
                  unoptimized
                />
              </div>
            </div>
            <div>
              <span
                className={`block text-xs font-black tracking-wider uppercase sm:text-sm ${
                  isAiBackground && isLightText
                    ? "text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.85)]"
                    : isLuxuryDark
                      ? "text-amber-400"
                      : "text-zinc-900 dark:text-white"
                }`}
              >
                {orgName}
              </span>
              <p
                className={`text-[9px] font-semibold tracking-wide uppercase sm:text-[10px] ${
                  isAiBackground && isLightText
                    ? "text-white/80 drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]"
                    : isLuxuryDark
                      ? "text-zinc-400"
                      : "text-zinc-500"
                }`}
              >
                {orgSubtitle}
              </p>
            </div>
          </div>

          {/* Serial Number & Official Badge */}
          <div className="flex flex-col items-end text-right">
            <div
              className={`rounded-xl border px-2.5 py-1 font-mono text-xs font-black shadow-xs ${
                isAiBackground && isLightText
                  ? "border-amber-400/50 bg-black/60 text-amber-300 backdrop-blur-sm"
                  : isLuxuryDark
                    ? "border-amber-500/40 bg-zinc-900 text-amber-400"
                    : "border-blue-200 bg-white text-blue-900 dark:bg-zinc-900 dark:text-blue-300"
              }`}
            >
              № {serialNumber}
            </div>
            <span
              className={`mt-0.5 text-[9px] font-bold tracking-tighter uppercase ${
                isAiBackground && isLightText
                  ? "text-white/70"
                  : isLuxuryDark
                    ? "text-zinc-400"
                    : "text-zinc-400"
              }`}
            >
              Дигитално удостоверен
            </span>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* CENTERPIECE LAYOUTS (Switch based on layoutTemplate) */}
        {/* ========================================================================= */}

        {/* LAYOUT A: SPORTS VOUCHER / FLYER */}
        {layoutTemplate === "sports_voucher" && (
          <div className="space-y-2 py-1 text-center">
            {/* Highlight Banner: + [ X ] FREE SESSIONS */}
            <div className="inline-flex animate-pulse items-center gap-2 rounded-2xl border border-amber-300/40 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 px-5 py-2 text-white shadow-lg">
              <BadmintonShuttlecockSvg
                className="size-6 text-white"
                primaryColor="#FFFFFF"
                secondaryColor="#FEF08A"
              />
              <span className="text-sm font-black tracking-wider uppercase sm:text-base">
                + {freeSessionsCount} БЕЗПЛАТНИ ТРЕНИРОВКИ
              </span>
              <Sparkles className="size-4" />
            </div>

            <h1
              className={`text-xl font-black tracking-wide uppercase sm:text-2xl md:text-3xl ${
                isAiBackground && isLightText
                  ? "text-amber-300 drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]"
                  : "text-blue-950 dark:text-blue-200"
              }`}
            >
              {title}
            </h1>

            {/* Recipient Card */}
            <div
              className={`mx-auto max-w-md rounded-2xl border p-3 shadow-sm ${
                isAiBackground && isLightText
                  ? "border-white/20 bg-black/50 backdrop-blur-md"
                  : "border-blue-100 bg-white/80 dark:border-zinc-800 dark:bg-zinc-900/80"
              }`}
            >
              <p className="text-[11px] font-semibold tracking-wider text-amber-500 uppercase">
                Връчва се на бъдещия шампион:
              </p>
              <h2
                className={`text-xl font-black tracking-wide sm:text-2xl ${
                  isAiBackground && isLightText
                    ? "text-white"
                    : "text-zinc-950 dark:text-white"
                }`}
              >
                {recipientName}
              </h2>
              {recipientInstitution && (
                <p className="mt-0.5 text-xs font-medium text-zinc-400">
                  {recipientInstitution}
                </p>
              )}
            </div>

            {/* Contact & Venue Details */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-1 text-xs">
              <span
                className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1 font-bold ${
                  isAiBackground && isLightText
                    ? "border-white/20 bg-white/10 text-white"
                    : "border-blue-200 bg-blue-50 text-blue-900 dark:bg-zinc-800 dark:text-blue-200"
                }`}
              >
                <Phone className="size-3 text-amber-500" />
                {visualConfig.contactPhone || "0899 38 83 38 / 0899 82 99 23"}
              </span>
              <span
                className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1 font-medium ${
                  isAiBackground && isLightText
                    ? "border-white/20 bg-white/10 text-white/90"
                    : "border-zinc-200 bg-zinc-50 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                }`}
              >
                <MapPin className="size-3 text-red-500" />
                {eventLocation}
              </span>
            </div>
          </div>
        )}

        {/* LAYOUT B: OFFICIAL AWARD */}
        {layoutTemplate === "official_award" && (
          <div className="space-y-2 py-1 text-center">
            {/* Main Award Title */}
            <div>
              <h1
                className={`text-xl font-black tracking-wider uppercase sm:text-2xl md:text-3xl ${
                  isAiBackground && isLightText
                    ? "text-amber-300 drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]"
                    : isLuxuryDark
                      ? "text-amber-400"
                      : "text-blue-950 dark:text-blue-200"
                }`}
              >
                {title}
              </h1>

              {/* Rank Badge */}
              {visualConfig.showBadge && (
                <div className="flex justify-center pt-1">
                  <div className="inline-flex items-center gap-1.5 rounded-full border border-yellow-200 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 px-4 py-1 text-xs font-black text-zinc-950 shadow-md">
                    <Trophy className="size-3.5 shrink-0" />
                    <span>{getRankLabel(rank)}</span>
                  </div>
                </div>
              )}
            </div>

            <p
              className={`font-serif text-xs italic ${
                isAiBackground && isLightText
                  ? "text-white/80 drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]"
                  : "text-zinc-500"
              }`}
            >
              се присъжда с гордост и признателност на:
            </p>

            {/* Recipient Name */}
            <div className="space-y-0.5">
              <h2
                className={`font-serif text-2xl font-extrabold tracking-wide sm:text-3xl md:text-4xl ${
                  isAiBackground && isLightText
                    ? "text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.95)]"
                    : isLuxuryDark
                      ? "text-white"
                      : "text-zinc-950 dark:text-white"
                }`}
              >
                {recipientName}
              </h2>
              {recipientInstitution && (
                <p
                  className={`text-xs font-bold ${
                    isAiBackground && isLightText
                      ? "text-amber-200"
                      : "text-zinc-600 dark:text-zinc-400"
                  }`}
                >
                  {recipientInstitution}
                </p>
              )}
            </div>

            {/* Award Reason */}
            <div className="mx-auto max-w-xl space-y-1 px-4">
              <p
                className={`text-xs leading-relaxed sm:text-sm ${
                  isAiBackground && isLightText
                    ? "text-white/90 drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)]"
                    : "text-zinc-600 dark:text-zinc-300"
                }`}
              >
                {nomination ||
                  visualConfig.customNotes ||
                  "За отлично спортно представяне, високи постижения и спортсменство на корта."}
              </p>
              {eventTitle && (
                <p
                  className={`text-xs font-bold sm:text-sm ${
                    isAiBackground && isLightText
                      ? "text-amber-300"
                      : "text-blue-700 dark:text-blue-300"
                  }`}
                >
                  « {eventTitle} »
                </p>
              )}
            </div>

            {/* Date & Location */}
            <div
              className={`flex flex-wrap items-center justify-center gap-4 pt-0.5 text-[11px] ${
                isAiBackground && isLightText
                  ? "text-white/80"
                  : "text-zinc-500"
              }`}
            >
              {eventDate && (
                <span className="inline-flex items-center gap-1 font-medium">
                  <Calendar className="size-3 text-amber-500" />
                  {eventDate}
                </span>
              )}
              {eventLocation && (
                <span className="inline-flex items-center gap-1 font-medium">
                  <MapPin className="size-3 text-red-500" />
                  {eventLocation}
                </span>
              )}
            </div>
          </div>
        )}

        {/* LAYOUT C: RECOVERY ZONE LUXURY VOUCHER */}
        {layoutTemplate === "recovery_voucher" && (
          <div className="space-y-2 py-1 text-center">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/20 px-3.5 py-0.5 text-[11px] font-bold tracking-wider text-emerald-300 uppercase">
              <ZenWellnessLotusSvg
                className="size-4"
                primaryColor="#34D399"
                secondaryColor="#F59E0B"
              />
              <span>{visualConfig.badgeText || "RECOVERY ZONE BY ZM"}</span>
            </div>

            <h1
              className={`text-xl font-black tracking-wider uppercase sm:text-2xl md:text-3xl ${
                isAiBackground && isLightText
                  ? "text-amber-300"
                  : "text-amber-400"
              }`}
            >
              {title}
            </h1>

            <p className="font-serif text-xs text-zinc-400 italic">
              се издава в полза на:
            </p>

            <h2 className="font-serif text-2xl font-extrabold tracking-wide text-white sm:text-3xl">
              {recipientName}
            </h2>

            {/* Luxury Box with Session Count */}
            <div
              className={`mx-auto max-w-lg rounded-2xl border p-3 shadow-md ${
                isAiBackground && isLightText
                  ? "border-amber-400/40 bg-black/60 backdrop-blur-md"
                  : "border-amber-500/40 bg-zinc-900/90"
              }`}
            >
              <div className="text-base font-black text-amber-300 sm:text-lg">
                {totalSessions > 1
                  ? `Пакет от ${totalSessions} Специализирани Процедури`
                  : "1 Брой Процедура за Възстановяване"}
              </div>
              <p className="mt-0.5 text-xs text-zinc-300">
                {visualConfig.customNotes ||
                  "Инфрачервена сауна, компресионни ботуши Normatec 3 или специализиран масаж."}
              </p>
              {validUntil && (
                <p className="mt-1 text-[11px] font-semibold text-amber-200">
                  Срок на валидност до:{" "}
                  {new Date(validUntil).toLocaleDateString("bg-BG")}
                </p>
              )}
            </div>
          </div>
        )}

        {/* LAYOUT D: CLASSIC CERTIFICATE */}
        {layoutTemplate === "classic_certificate" && (
          <div className="space-y-2 py-1 text-center">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3.5 py-0.5 text-[11px] font-bold tracking-wider text-blue-700 uppercase dark:bg-blue-950/60 dark:text-blue-300">
              <Sparkles className="size-3" />
              <span>{visualConfig.badgeText || "ОФИЦИАЛНА СЕРТИФИКАЦИЯ"}</span>
            </div>

            <h1
              className={`text-xl font-black tracking-wider uppercase sm:text-2xl md:text-3xl ${
                isAiBackground && isLightText
                  ? "text-amber-300"
                  : "text-blue-950 dark:text-blue-200"
              }`}
            >
              {title}
            </h1>

            <p className="font-serif text-xs text-zinc-500 italic dark:text-zinc-400">
              удостоверява, че:
            </p>

            <h2
              className={`font-serif text-2xl font-extrabold tracking-wide sm:text-3xl ${
                isAiBackground && isLightText
                  ? "text-white"
                  : "text-zinc-950 dark:text-white"
              }`}
            >
              {recipientName}
            </h2>

            <div className="mx-auto max-w-lg space-y-1 px-4">
              <p
                className={`text-xs leading-relaxed sm:text-sm ${
                  isAiBackground && isLightText
                    ? "text-white/90"
                    : "text-zinc-600 dark:text-zinc-300"
                }`}
              >
                {skillsSummary ||
                  visualConfig.customNotes ||
                  "За успешно преминаване на структурирана тренировъчна програма и клубни нормативи."}
              </p>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* BOTTOM SECTION: QR Code + Dual Signatures + Club Seal */}
        {/* ========================================================================= */}
        <div
          className={`flex items-end justify-between border-t pt-2.5 ${
            isAiBackground && isLightText
              ? "border-white/20"
              : "border-zinc-200/60 dark:border-zinc-800/80"
          }`}
        >
          {/* Left: QR Code Verification Block */}
          <div className="flex items-center gap-2.5">
            <div className="relative flex size-13 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white bg-white p-1 shadow-md sm:size-14">
              {qrCodeDataUrl ? (
                <div className="relative size-11 sm:size-12">
                  <Image
                    src={qrCodeDataUrl}
                    alt="QR код за верификация"
                    fill
                    sizes="48px"
                    className="object-contain"
                    unoptimized
                  />
                </div>
              ) : (
                <QrCodeIcon className="size-9 text-zinc-900" />
              )}
            </div>
            <div className="text-left">
              <span
                className={`block text-[8px] font-bold tracking-wider uppercase sm:text-[9px] ${
                  isAiBackground && isLightText
                    ? "text-white/80"
                    : "text-zinc-400"
                }`}
              >
                Сканирай за валидация
              </span>
              <p
                className={`font-mono text-[9px] font-bold sm:text-[10px] ${
                  isAiBackground && isLightText
                    ? "text-amber-300"
                    : "text-zinc-700 dark:text-zinc-300"
                }`}
              >
                {verifyDomain}
                <span className="block text-[8px] font-normal opacity-75">
                  {verifyPath}
                </span>
              </p>
            </div>
          </div>

          {/* Center: Digital Official Golden Stamp */}
          <div className="hidden flex-col items-center justify-center sm:flex">
            <div
              className={`flex size-14 items-center justify-center rounded-full border-2 p-1 text-center shadow-md sm:size-15 ${
                isAiBackground && isLightText
                  ? "border-amber-400 bg-black/40 text-amber-300 backdrop-blur-sm"
                  : isLuxuryDark
                    ? "border-amber-400 text-amber-400"
                    : "border-amber-600 text-amber-700 dark:border-amber-400 dark:text-amber-400"
              }`}
            >
              <div className="flex size-full flex-col items-center justify-center rounded-full border border-dashed border-current p-0.5">
                <Award className="mb-0.5 size-3.5" />
                <span className="text-[7px] leading-none font-black tracking-tighter uppercase">
                  ОФИЦИАЛЕН
                </span>
                <span className="text-[6px] leading-none font-bold tracking-tighter">
                  ПЕЧАТ • 2026
                </span>
              </div>
            </div>
          </div>

          {/* Right: Signatures (Dual support if coSignatory present) */}
          <div className="flex items-end gap-4 text-right">
            {visualConfig.coSignatoryName && (
              <div className="space-y-0.5">
                <div
                  className={`font-serif text-xs font-semibold italic ${
                    isAiBackground && isLightText
                      ? "text-white"
                      : "text-zinc-700 dark:text-zinc-300"
                  }`}
                >
                  {visualConfig.coSignatoryName}
                </div>
                <div
                  className={`ml-auto h-0.5 w-24 ${
                    isAiBackground && isLightText
                      ? "border-b border-amber-300/80"
                      : "border-b border-zinc-400/80"
                  }`}
                />
                <p
                  className={`text-[9px] font-medium ${
                    isAiBackground && isLightText
                      ? "text-white/80"
                      : "text-zinc-500"
                  }`}
                >
                  {visualConfig.coSignatoryTitle || "Директор"}
                </p>
              </div>
            )}

            <div className="space-y-0.5">
              <div
                className={`font-serif text-xs font-semibold italic sm:text-sm ${
                  isAiBackground && isLightText
                    ? "text-white"
                    : "text-zinc-700 dark:text-zinc-300"
                }`}
              >
                {visualConfig.signatoryName || "Димитър Иванов"}
              </div>
              <div
                className={`ml-auto h-0.5 w-28 ${
                  isAiBackground && isLightText
                    ? "border-b border-amber-300/80"
                    : "border-b border-zinc-400/80"
                }`}
              />
              <p
                className={`text-[9px] font-medium sm:text-[10px] ${
                  isAiBackground && isLightText
                    ? "text-white/80"
                    : "text-zinc-500"
                }`}
              >
                {visualConfig.signatoryTitle || "Председател на УС"}
              </p>
            </div>
          </div>
        </div>

        {/* Footer Sponsor Logos Strip */}
        {activeSponsors.length > 0 && (
          <div
            className={`mt-1.5 flex flex-col items-center gap-1 border-t pt-1.5 ${
              isAiBackground && isLightText
                ? "border-white/15"
                : "border-zinc-100 dark:border-zinc-800/60"
            }`}
          >
            <span
              className={`text-[8px] font-bold tracking-wider uppercase sm:text-[9px] ${
                isAiBackground && isLightText
                  ? "text-white/70"
                  : "text-zinc-400"
              }`}
            >
              Партньори & Спонсори
            </span>
            <div
              className={`flex flex-wrap items-center justify-center gap-3 sm:gap-5 ${
                isAiBackground && isLightText
                  ? "rounded-full border border-white/10 bg-black/30 px-3 py-0.5 backdrop-blur-md"
                  : ""
              }`}
            >
              {activeSponsors
                .filter((sp) => Boolean(sp.logoUrl))
                .slice(0, 6)
                .map((sp) => (
                  <div
                    key={sp.id}
                    className="relative flex h-5 w-16 items-center justify-center opacity-90 transition-opacity hover:opacity-100 sm:h-6 sm:w-20"
                    title={sp.name}
                  >
                    <Image
                      src={sp.logoUrl}
                      alt={sp.name}
                      fill
                      sizes="80px"
                      className={`object-contain filter ${
                        isAiBackground && isLightText
                          ? "brightness-200 contrast-125 drop-shadow-xs"
                          : "contrast-125 grayscale dark:brightness-200"
                      }`}
                      unoptimized
                    />
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
