/* eslint-disable react/forbid-dom-props, sonarjs/cognitive-complexity, sonarjs/no-nested-conditional, sonarjs/no-all-duplicated-branches */
"use client";

import {
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
  BronzeMedal3rdSvg,
  CrossedRacketsSvg,
  EmbossedClubSealSvg,
  GoldMedal1stSvg,
  KidsSportsDynamicSvg,
  LaurelWreathCrestSvg,
  LuxuryFiligreeCornersSvg,
  SilverMedal2ndSvg,
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

function DigitalOfficialSeal({
  style,
  customSealUrl,
  isLightText,
  isLuxuryDark,
  sizeClass = "size-14 sm:size-15",
}: {
  style?: "laurel" | "rackets_crest" | "monogram" | "custom_upload";
  customSealUrl?: string;
  isLightText: boolean;
  isLuxuryDark: boolean;
  sizeClass?: string;
}) {
  if (customSealUrl) {
    return (
      <div className={`relative ${sizeClass} shrink-0 overflow-hidden`}>
        <Image
          src={customSealUrl}
          alt="Персонализиран печат"
          fill
          sizes="64px"
          className="object-contain"
          unoptimized
        />
      </div>
    );
  }

  const borderClass = isLightText
    ? "border-amber-400 bg-black/40 text-amber-300 backdrop-blur-sm"
    : isLuxuryDark
      ? "border-amber-400 text-amber-400"
      : "border-amber-600 text-amber-700 dark:border-amber-400 dark:text-amber-400";

  if (style === "rackets_crest") {
    return (
      <div
        className={`flex ${sizeClass} items-center justify-center rounded-full border-2 p-1 text-center shadow-md ${borderClass}`}
      >
        <div className="flex size-full flex-col items-center justify-center rounded-full border border-dashed border-current p-0.5">
          <CrossedRacketsSvg
            className="mb-0.5 size-3.5"
            primaryColor="currentColor"
            secondaryColor="currentColor"
          />
          <span className="text-[6.5px] leading-none font-black tracking-tighter uppercase">
            БК ГЪЛЪБОВО
          </span>
          <span className="text-[5.5px] leading-none font-bold tracking-tighter">
            ОФИЦИАЛЕН
          </span>
        </div>
      </div>
    );
  }

  if (style === "monogram") {
    return (
      <div
        className={`flex ${sizeClass} items-center justify-center rounded-full border-2 p-1 text-center shadow-md ${borderClass}`}
      >
        <div className="flex size-full flex-col items-center justify-center rounded-full border border-current p-0.5">
          <span className="font-serif text-xs font-black tracking-wider leading-none sm:text-sm">
            БКГ
          </span>
          <span className="mt-0.5 text-[6px] font-bold tracking-widest uppercase">
            2026
          </span>
        </div>
      </div>
    );
  }

  // Default: laurel / embossed gold
  return (
    <div className={`relative ${sizeClass} shrink-0`}>
      <EmbossedClubSealSvg className="size-full" />
    </div>
  );
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
  const isBlankCanvas =
    visualConfig.layoutMode === "custom_ai_background" &&
    !visualConfig.aiBackgroundUrl;

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
  const verifyPath = visualConfig.customQrUrl
    ? visualConfig.customQrUrl
    : isRecoveryZone || type === "voucher"
      ? `/recovery-zone?verify=${encodeURIComponent(serialNumber)}`
      : `/club?verify=${encodeURIComponent(serialNumber)}`;

  return (
    <div
      id="printable-certificate"
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
      {/* LAYER 1: BACKGROUND (Blank Canvas OR AI Image OR Standard HTML Frames) */}
      {/* ========================================================================= */}
      {isBlankCanvas ? (
        <div className="absolute inset-0 z-0 bg-linear-to-br from-white via-zinc-50 to-zinc-100/70 dark:from-zinc-900 dark:via-zinc-950 dark:to-zinc-900">
          {/* Subtle architect guideline frame for pristine canvas feeling */}
          <div className="pointer-events-none absolute inset-3 rounded-xl border border-dashed border-zinc-200/90 dark:border-zinc-800" />
          <div className="pointer-events-none absolute inset-5 rounded-lg border border-zinc-100/80 dark:border-zinc-850" />

          {/* Elegant subtle watermark in the center */}
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center opacity-25 select-none">
            <Sparkles className="mb-1 size-8 text-amber-500 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
              Празен лист • Задайте контекст и генерирайте с AI
            </span>
          </div>
        </div>
      ) : isAiBackground ? (
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
              <LuxuryFiligreeCornersSvg color="#D97706" />
            </>
          )}

          {/* Frame 2: Luxury Dark */}
          {frameStyle === "luxury_dark" && (
            <>
              <div className="pointer-events-none absolute inset-0 bg-linear-to-b from-amber-500/5 via-transparent to-amber-500/10" />
              <div className="pointer-events-none absolute inset-3.5 rounded-xl border border-amber-500/30" />
              <div className="pointer-events-none absolute inset-5 rounded-lg border border-amber-400/20" />
              <LuxuryFiligreeCornersSvg color="#EAB308" />
            </>
          )}

          {/* Frame 3: Sport Champion */}
          {frameStyle === "sport_champion" && (
            <>
              <div className="pointer-events-none absolute inset-3 rounded-xl border-2 border-blue-600/80" />
              <div className="pointer-events-none absolute top-0 right-0 size-36 bg-linear-to-bl from-blue-600/15 via-blue-500/5 to-transparent" />
              <div className="pointer-events-none absolute bottom-0 left-0 size-36 bg-linear-to-tr from-amber-500/15 via-amber-500/5 to-transparent" />
              <div className="absolute top-3 left-3 h-1 w-16 bg-linear-to-r from-blue-600 to-amber-500" />
              <div className="absolute right-3 bottom-3 h-1 w-16 bg-linear-to-l from-blue-600 to-amber-500" />
            </>
          )}

          {/* Frame 4: Modern Minimal */}
          {frameStyle === "modern_minimal" && (
            <>
              <div className="pointer-events-none absolute inset-4 rounded-xl border border-zinc-200/90 dark:border-zinc-800" />
              <div className="pointer-events-none absolute inset-x-12 top-4 h-1 bg-linear-to-r from-transparent via-blue-600 to-transparent" />
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

      {/* Decorative SVG Watermarks (Non-obstructive Canva-style art layers - only for non-blank canvas) */}
      {!isBlankCanvas && (
        <div
          className="pointer-events-none absolute inset-0 z-1 overflow-hidden"
          style={{ opacity: (visualConfig.watermarkOpacity ?? 10) / 100 }}
        >
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
              <LaurelWreathCrestSvg
                className="size-80"
                primaryColor="#D97706"
              />
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
      )}

      {/* ========================================================================= */}
      {/* LAYER 2: VECTOR DYNAMIC OVERLAY (High Contrast Canva-style Typography) */}
      {/* ========================================================================= */}
      <div className="relative z-10 flex h-full flex-col justify-between p-5 sm:p-7 md:p-8">
        {/* Top Header: Adaptive Layout (Landscape vs Portrait) */}
        {isLandscape ? (
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
                  style={
                    visualConfig.customTextColor
                      ? { color: visualConfig.customTextColor }
                      : undefined
                  }
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
        ) : (
          /* Portrait Header: Centered Logo + Club Title */
          <div
            className={`relative flex flex-col items-center justify-center border-b pb-3 text-center ${
              isAiBackground && isLightText
                ? "border-white/20"
                : "border-zinc-200/60 dark:border-zinc-800/80"
            }`}
          >
            <div className="absolute top-0 right-0 text-right">
              <span className="rounded-lg border border-white/20 bg-black/50 px-2 py-0.5 font-mono text-[9px] font-bold text-amber-300 backdrop-blur-sm sm:text-[10px]">
                № {serialNumber}
              </span>
            </div>

            <div className="relative mb-1.5 flex size-13 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-2 border-white/80 bg-white p-1.5 shadow-lg sm:size-15">
              <div className="relative size-10 sm:size-11">
                <Image
                  src={orgLogo}
                  alt={orgName}
                  fill
                  sizes="64px"
                  className="object-contain"
                  unoptimized
                />
              </div>
            </div>
            <span
              style={
                visualConfig.customTextColor
                  ? { color: visualConfig.customTextColor }
                  : undefined
              }
              className={`block text-xs font-black tracking-wider uppercase sm:text-sm md:text-base ${
                isAiBackground && isLightText
                  ? "text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)]"
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
            {eventDate && (
              <span className="mt-0.5 text-[8px] font-bold tracking-widest text-amber-400 uppercase sm:text-[9px]">
                {eventDate} {eventLocation ? `• ${eventLocation}` : ""}
              </span>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* CENTERPIECE LAYOUTS (Switch based on layoutTemplate) */}
        {/* ========================================================================= */}

        {/* LAYOUT A: SPORTS VOUCHER / FLYER */}
        {layoutTemplate === "sports_voucher" && (
          <div className="space-y-2 py-1 text-center">
            {/* Highlight Banner: Voucher Value or Free Sessions */}
            <div className="inline-flex animate-pulse items-center gap-2 rounded-2xl border border-amber-300/40 bg-linear-to-r from-amber-500 via-orange-500 to-amber-500 px-5 py-2 text-white shadow-lg">
              <BadmintonShuttlecockSvg
                className="size-6 text-white"
                primaryColor="#FFFFFF"
                secondaryColor="#FEF08A"
              />
              <span className="text-sm font-black tracking-wider uppercase sm:text-base">
                {visualConfig.voucherValue
                  ? visualConfig.voucherValue
                  : `+ ${freeSessionsCount} БЕЗПЛАТНИ ТРЕНИРОВКИ`}
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

            {/* Voucher Service, PromoCode & Expiry Details */}
            {(visualConfig.voucherServiceType ||
              visualConfig.voucherPromoCode ||
              visualConfig.voucherExpiryDate ||
              validUntil) && (
              <div className="mx-auto flex max-w-lg flex-wrap items-center justify-center gap-2 pt-1 text-xs">
                {visualConfig.voucherServiceType && (
                  <span
                    className={`inline-flex items-center gap-1 rounded-xl border px-3 py-1 font-bold ${
                      isAiBackground && isLightText
                        ? "border-amber-400/50 bg-amber-500/20 text-amber-200"
                        : "border-amber-400 bg-amber-50 text-amber-900 dark:bg-amber-950/60 dark:text-amber-200"
                    }`}
                  >
                    🎯 Валиден за: {visualConfig.voucherServiceType}
                  </span>
                )}
                {visualConfig.voucherPromoCode && (
                  <span
                    className={`inline-flex items-center gap-1 rounded-xl border px-3 py-1 font-mono font-black ${
                      isAiBackground && isLightText
                        ? "border-amber-400/40 bg-black/60 text-amber-300"
                        : "border-zinc-300 bg-zinc-100 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                    }`}
                  >
                    🎟️ КОД: {visualConfig.voucherPromoCode}
                  </span>
                )}
                {(visualConfig.voucherExpiryDate || validUntil) && (
                  <span
                    className={`inline-flex items-center gap-1 rounded-xl border px-3 py-1 font-semibold ${
                      isAiBackground && isLightText
                        ? "border-white/20 bg-white/10 text-white/90"
                        : "border-zinc-200 bg-zinc-50 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                    }`}
                  >
                    ⏳ Валиден до:{" "}
                    {visualConfig.voucherExpiryDate ||
                      (validUntil
                        ? new Date(validUntil).toLocaleDateString("bg-BG")
                        : "")}
                  </span>
                )}
              </div>
            )}

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

              {/* Rank Badge with Medals */}
              {visualConfig.showBadge && (
                <div className="flex flex-col items-center justify-center pt-0.5">
                  {rank === "1st" ? (
                    <GoldMedal1stSvg className="size-16 -mb-2 drop-shadow-lg" />
                  ) : rank === "2nd" ? (
                    <SilverMedal2ndSvg className="size-16 -mb-2 drop-shadow-md" />
                  ) : rank === "3rd" ? (
                    <BronzeMedal3rdSvg className="size-16 -mb-2 drop-shadow-md" />
                  ) : null}
                  <div className="inline-flex items-center gap-1.5 rounded-full border border-yellow-200 bg-linear-to-r from-amber-400 via-yellow-400 to-amber-500 px-4 py-1 text-xs font-black text-zinc-950 shadow-md">
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
        {/* BOTTOM SECTION: Adaptive for Landscape vs Portrait */}
        {/* ========================================================================= */}
        {isLandscape ? (
          /* Landscape Bottom */
          <>
            <div
              className={`flex items-end justify-between border-t pt-2.5 ${
                isAiBackground && isLightText
                  ? "border-white/20"
                  : "border-zinc-200/60 dark:border-zinc-800/80"
              }`}
            >
              {/* Left: QR Code Verification Block */}
              {visualConfig.showQrCode !== false && (
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
              )}

              {/* Center: Digital Official Golden Stamp */}
              {visualConfig.showSeal !== false && (
                <div className="hidden flex-col items-center justify-center sm:flex">
                  <DigitalOfficialSeal
                    style={visualConfig.sealStyle}
                    customSealUrl={visualConfig.customSealUrl}
                    isLightText={isLightText}
                    isLuxuryDark={isLuxuryDark}
                    sizeClass="size-14 sm:size-15"
                  />
                </div>
              )}

              {/* Right: Signatures (Dual support if coSignatory present) */}
              {visualConfig.showSignatures !== false && (
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
              )}
            </div>

            {/* Footer Sponsor Logos Strip */}
            {visualConfig.showSponsors !== false &&
              activeSponsors.length > 0 && (
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
          </>
        ) : (
          /* Portrait Bottom: Balanced Multi-Row Layout */
          <div
            className={`flex flex-col gap-2 border-t pt-2 ${
              isAiBackground && isLightText
                ? "border-white/20"
                : "border-zinc-200/60 dark:border-zinc-800/80"
            }`}
          >
            {/* Signatures across top of footer */}
            {visualConfig.showSignatures !== false && (
              <div className="flex items-end justify-between px-2 text-center">
                {visualConfig.coSignatoryName ? (
                  <div className="space-y-0.5 text-left">
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
                      className={`h-0.5 w-20 sm:w-24 ${
                        isAiBackground && isLightText
                          ? "border-b border-amber-300/80"
                          : "border-b border-zinc-400/80"
                      }`}
                    />
                    <p
                      className={`text-[8px] font-medium sm:text-[9px] ${
                        isAiBackground && isLightText
                          ? "text-white/80"
                          : "text-zinc-500"
                      }`}
                    >
                      {visualConfig.coSignatoryTitle || "Директор"}
                    </p>
                  </div>
                ) : (
                  <div />
                )}

                <div className="space-y-0.5 text-right">
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
                    className={`ml-auto h-0.5 w-24 sm:w-28 ${
                      isAiBackground && isLightText
                        ? "border-b border-amber-300/80"
                        : "border-b border-zinc-400/80"
                    }`}
                  />
                  <p
                    className={`text-[8px] font-medium sm:text-[9px] ${
                      isAiBackground && isLightText
                        ? "text-white/80"
                        : "text-zinc-500"
                    }`}
                  >
                    {visualConfig.signatoryTitle || "Председател на УС"}
                  </p>
                </div>
              </div>
            )}

            {/* QR Code and Official Golden Stamp aligned in center */}
            {(visualConfig.showQrCode !== false ||
              visualConfig.showSeal !== false) && (
              <div className="flex items-center justify-center gap-6 py-0.5">
                {visualConfig.showQrCode !== false && (
                  <div className="flex items-center gap-2">
                    <div className="relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-white bg-white p-0.5 shadow-sm">
                      {qrCodeDataUrl ? (
                        <div className="relative size-9">
                          <Image
                            src={qrCodeDataUrl}
                            alt="QR код за верификация"
                            fill
                            sizes="36px"
                            className="object-contain"
                            unoptimized
                          />
                        </div>
                      ) : (
                        <QrCodeIcon className="size-7 text-zinc-900" />
                      )}
                    </div>
                    <div className="text-left">
                      <span className="block text-[8px] font-bold text-white/80 uppercase">
                        Проверка
                      </span>
                      <span className="font-mono text-[8px] font-semibold text-amber-300">
                        № {serialNumber}
                      </span>
                    </div>
                  </div>
                )}

                {visualConfig.showSeal !== false && (
                  <DigitalOfficialSeal
                    style={visualConfig.sealStyle}
                    customSealUrl={visualConfig.customSealUrl}
                    isLightText={isLightText}
                    isLuxuryDark={isLuxuryDark}
                    sizeClass="size-10 sm:size-11"
                  />
                )}
              </div>
            )}

            {/* Sponsors in Compact Multi-column Grid */}
            {visualConfig.showSponsors !== false &&
              activeSponsors.length > 0 && (
                <div className="border-t border-white/10 pt-1 text-center">
                  <span className="block pb-0.5 text-[8px] font-bold text-white/60 uppercase">
                    Партньори
                  </span>
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    {activeSponsors
                      .filter((sp) => Boolean(sp.logoUrl))
                      .slice(0, 6)
                      .map((sp) => (
                        <div
                          key={sp.id}
                          className="relative flex h-4 w-12 items-center justify-center opacity-80 sm:h-5 sm:w-16"
                          title={sp.name}
                        >
                          <Image
                            src={sp.logoUrl}
                            alt={sp.name}
                            fill
                            sizes="60px"
                            className="object-contain brightness-200 contrast-125"
                            unoptimized
                          />
                        </div>
                      ))}
                  </div>
                </div>
              )}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * ============================================================================
 * CERTIFICATE BACKSIDE PREVIEW (Гръб на двустранната грамота / сертификат)
 * ============================================================================
 * - Стил „Треньорско послание и пожелание“ (coach_message)
 * - Стил „Турнирен протокол и статистика“ (tournament_protocol)
 */
export function CertificateBacksidePreview({
  data,
  className = "",
  elementId = "printable-certificate-back",
}: {
  data: CertificatePreviewData;
  className?: string;
  elementId?: string;
}) {
  const {
    siteId,
    visualConfig,
    serialNumber = "BKG-2026-DEMO",
    qrCodeDataUrl,
    recipientName = "Иван Петров Димитров",
    eventTitle = "Общински Турнир по Бадминтон „Гълъбово 2026“",
    eventDate = new Date().toLocaleDateString("bg-BG"),
    eventLocation = "Спортен Комплекс „Енергетик“, гр. Гълъбово",
    rank = "1st",
  } = data;

  const isLandscape = visualConfig.orientation !== "portrait";
  const backsideStyle = visualConfig.backsideStyle || "coach_message";
  const isRecoveryZone = siteId === "recoveryzone";

  return (
    <div
      id={elementId}
      className={`relative overflow-hidden rounded-2xl border-4 border-amber-500/40 bg-linear-to-br from-zinc-950 via-zinc-900 to-zinc-950 p-5 text-white shadow-2xl transition-all duration-300 sm:p-7 ${
        isLandscape ? "aspect-[1.414/1] w-full" : "aspect-[1/1.414] w-full"
      } ${className}`}
    >
      {/* Decorative Golden Corner Accents */}
      <div className="pointer-events-none absolute inset-2 rounded-xl border border-dashed border-amber-400/30 sm:inset-3" />
      <div className="pointer-events-none absolute top-4 left-4 size-6 border-t-2 border-l-2 border-amber-400" />
      <div className="pointer-events-none absolute top-4 right-4 size-6 border-t-2 border-r-2 border-amber-400" />
      <div className="pointer-events-none absolute bottom-4 left-4 size-6 border-b-2 border-l-2 border-amber-400" />
      <div className="pointer-events-none absolute bottom-4 right-4 size-6 border-b-2 border-r-2 border-amber-400" />

      {/* Subtle Central Watermark */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-5">
        <CrossedRacketsSvg
          className="size-72"
          primaryColor="#F59E0B"
          secondaryColor="#F59E0B"
        />
      </div>

      {/* Main Content Layout */}
      <div className="relative z-10 flex h-full flex-col justify-between">
        {/* Header */}
        <div className="border-b border-amber-500/30 pb-3 text-center">
          <div className="flex items-center justify-center gap-2">
            <CrossedRacketsSvg
              className="size-5 text-amber-400"
              primaryColor="#F59E0B"
              secondaryColor="#FEF08A"
            />
            <span className="text-xs font-black tracking-widest text-amber-400 uppercase sm:text-sm">
              {isRecoveryZone
                ? "RECOVERY ZONE BY ZM • ОФИЦИАЛЕН ДОКУМЕНТ"
                : "БАДМИНТОН КЛУБ ГЪЛЪБОВО • ОФИЦИАЛЕН ДОКУМЕНТ"}
            </span>
            <CrossedRacketsSvg
              className="size-5 text-amber-400"
              primaryColor="#F59E0B"
              secondaryColor="#FEF08A"
            />
          </div>
          <h3 className="mt-1 font-serif text-base font-bold text-amber-200 sm:text-lg">
            {visualConfig.backsideTitle ||
              (backsideStyle === "coach_message"
                ? "Послание от Треньорския Щаб & Клубното Ръководство"
                : "Официален Турнирен Протокол & Регламент")}
          </h3>
          <p className="text-[10px] text-zinc-400">
            Сериен номер:{" "}
            <span className="font-mono font-bold text-amber-300">
              {serialNumber}
            </span>{" "}
            • Дата на издаване: {eventDate}
          </p>
        </div>

        {/* Center: Message or Protocol */}
        {backsideStyle === "coach_message" ? (
          /* СТИЛ 1: Треньорско послание */
          <div className="my-auto space-y-4 px-4 py-2 text-center">
            <div className="mx-auto max-w-xl rounded-2xl border border-amber-400/20 bg-black/40 p-4 shadow-inner backdrop-blur-sm sm:p-5">
              <span className="block font-serif text-3xl text-amber-400">
                “
              </span>
              <p className="font-serif text-sm leading-relaxed text-zinc-200 italic sm:text-base">
                {visualConfig.backsideMessage ||
                  `Скъпи ${recipientName}, твоят устрем, спортна дисциплина и постоянство в тренировъчния процес са истинското вдъхновение за целия клуб. Продължавай да летиш високо, да преодоляваш всяко предизвикателство с достойнство и да обичаш играта!`}
              </p>
              <span className="block text-right font-serif text-3xl text-amber-400">
                ”
              </span>
            </div>

            {/* Handwritten Coach Autograph Box */}
            <div className="mx-auto max-w-md rounded-xl border border-dashed border-amber-500/40 bg-white/5 p-3 text-left">
              <p className="text-[11px] font-semibold text-amber-300">
                ✍️ Личен автограф и пожелание от треньора:
              </p>
              <div className="mt-4 border-b border-dashed border-zinc-600 pb-1" />
              <div className="mt-3 border-b border-dashed border-zinc-600 pb-1" />
            </div>
          </div>
        ) : (
          /* СТИЛ 2: Турнирен протокол */
          <div className="my-auto space-y-3 px-4 py-2">
            <div className="rounded-xl border border-amber-400/20 bg-black/40 p-3 backdrop-blur-sm sm:p-4">
              <h4 className="mb-2 text-xs font-bold text-amber-300 uppercase sm:text-sm">
                📋 Данни за състезателната изява:
              </h4>
              <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
                <div className="rounded-lg bg-zinc-800/80 p-2">
                  <span className="block text-[10px] text-zinc-400">
                    Турнир:
                  </span>
                  <span className="font-semibold text-zinc-100">
                    {eventTitle}
                  </span>
                </div>
                <div className="rounded-lg bg-zinc-800/80 p-2">
                  <span className="block text-[10px] text-zinc-400">
                    Място & Зала:
                  </span>
                  <span className="font-semibold text-zinc-100">
                    {eventLocation}
                  </span>
                </div>
                <div className="rounded-lg bg-zinc-800/80 p-2">
                  <span className="block text-[10px] text-zinc-400">
                    Отличие:
                  </span>
                  <span className="font-bold text-amber-300">
                    {getRankLabel(rank)}
                  </span>
                </div>
                <div className="rounded-lg bg-zinc-800/80 p-2">
                  <span className="block text-[10px] text-zinc-400">
                    Статут:
                  </span>
                  <span className="font-bold text-emerald-400">
                    Официално Валидиран
                  </span>
                </div>
              </div>

              <div className="mt-3 rounded-lg border border-white/10 bg-zinc-900/60 p-2.5 text-[11px] leading-relaxed text-zinc-300">
                <p className="font-semibold text-amber-200">
                  Официален правилник и верификация:
                </p>
                <p className="mt-0.5 text-zinc-400">
                  Състезанието е проведено съгласно официалните стандарти на
                  Българска Федерация Бадминтон (БФБ) и BWF. Резултатът е
                  надлежно записан в архивния регистър на клуба под номер{" "}
                  {serialNumber}.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Footer: Signatures, Seal & QR Code */}
        <div className="flex items-end justify-between border-t border-amber-500/30 pt-3">
          {/* QR Verification */}
          <div className="flex items-center gap-2">
            {qrCodeDataUrl ? (
              <div className="relative size-12 shrink-0 overflow-hidden rounded-lg border border-amber-400/40 bg-white p-0.5 shadow-md">
                <Image
                  src={qrCodeDataUrl}
                  alt="QR Код"
                  fill
                  sizes="48px"
                  className="object-contain"
                  unoptimized
                />
              </div>
            ) : (
              <div className="flex size-12 items-center justify-center rounded-lg border border-dashed border-amber-400/40 bg-white/5 text-amber-400">
                <QrCodeIcon className="size-6" />
              </div>
            )}
            <div className="text-[9px] text-zinc-400">
              <span className="block font-bold text-amber-300 uppercase">
                Дигитална проверка
              </span>
              <span>Сканирайте за верификация</span>
            </div>
          </div>

          {/* Central Digital Seal */}
          <div className="flex items-center justify-center">
            <DigitalOfficialSeal
              style={visualConfig.sealStyle}
              customSealUrl={visualConfig.customSealUrl}
              isLightText={true}
              isLuxuryDark={true}
              sizeClass="size-13 sm:size-14"
            />
          </div>

          {/* Signatures */}
          <div className="text-right">
            <p className="font-serif text-sm font-black text-amber-300">
              {visualConfig.backsideSignatory ||
                visualConfig.signatoryName ||
                "Димитър Иванов"}
            </p>
            <p className="text-[10px] text-zinc-400">
              {visualConfig.signatoryTitle || "Главен треньор / Председател"}
            </p>
            <div className="mt-1 inline-block w-28 border-b border-amber-400/50" />
          </div>
        </div>
      </div>
    </div>
  );
}
