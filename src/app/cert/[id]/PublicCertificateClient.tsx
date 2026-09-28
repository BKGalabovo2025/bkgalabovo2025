/* eslint-disable sonarjs/cognitive-complexity, @next/next/no-img-element */
"use client";

import confetti from "canvas-confetti";
import {
  Award,
  Check,
  CheckCircle2,
  Copy,
  Download,
  ExternalLink,
  Gift,
  MapPin,
  Maximize2,
  Printer,
  QrCode as QrCodeIcon,
  School,
  Share2,
  ShieldCheck,
  Sparkles,
  Ticket,
  UserCheck,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { PDFDocument } from "pdf-lib";
import QRCode from "qrcode";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";

import { CertificateDocumentPreview } from "@/app/(protected)/certificates/components/CertificateDocumentPreview";
import { RedeemVoucherDialog } from "@/app/(protected)/certificates/components/RedeemVoucherDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/context/auth-context";
import { certificateIssuanceService } from "@/services/certificate-issuance-service";
import { IssuedCertificate } from "@/types/certificates";

import { PdfToImageCanvas } from "./PdfToImageCanvas";

interface PublicCertificateClientProps {
  certificate: IssuedCertificate;
}

export function PublicCertificateClient({
  certificate: initialCertificate,
}: PublicCertificateClientProps) {
  const { user } = useAuth();
  const [cert, setCert] = useState<IssuedCertificate>(initialCertificate);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showRedeemDialog, setShowRedeemDialog] = useState(false);
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const [pdfAspectRatio, setPdfAspectRatio] = useState<number>(1260 / 708);

  useEffect(() => {
    try {
      confetti({
        particleCount: 70,
        spread: 70,
        origin: { y: 0.35 },
      });
    } catch {
      // Ignored if unavailable
    }
  }, []);

  const isVoucher = cert.type === "voucher";
  const isRecoveryZone = cert.siteId === "recoveryzone";

  const total = cert.details.totalSessions || 1;
  const used = cert.details.usedSessions || 0;
  const remaining = Math.max(0, total - used);
  const isFullyUsed =
    cert.details.voucherStatus === "fully_used" || remaining === 0;

  const currentUrl = typeof window !== "undefined" ? window.location.href : "";

  const handleCopyLink = () => {
    if (!currentUrl) return;
    navigator.clipboard.writeText(currentUrl);
    setCopiedLink(true);
    toast.success("Линкът към ваучера е копиран!");
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleWebShare = async () => {
    if (navigator.share && currentUrl) {
      try {
        await navigator.share({
          title: `${cert.visualSnapshot?.templateTitle || "Клубен Ваучер"} - ${cert.recipient.name}`,
          text: `Официален клубен ваучер на ${cert.recipient.name} (№ ${cert.serialNumber})`,
          url: currentUrl,
        });
      } catch {
        // User cancelled
      }
    } else {
      handleCopyLink();
    }
  };

  const handleRefreshCert = async () => {
    try {
      const refreshed = await certificateIssuanceService.getCertificateById(
        cert.id
      );
      if (refreshed) {
        setCert(refreshed);
      }
    } catch (e) {
      console.error("Грешка при обновяване на документа:", e);
    }
  };

  const clubLogo =
    cert.branding?.clubLogoUrl ||
    (isRecoveryZone
      ? "/recovery-zone/rz-icon-square.png"
      : "/icons/badge-option-3-light-squircle.png");

  const clubName = isRecoveryZone
    ? "Recovery Zone by ZM"
    : "БАДМИНТОН КЛУБ ГЪЛЪБОВО";

  const [dynamicQrUrl, setDynamicQrUrl] = useState<string>("");

  useEffect(() => {
    const targetUrl =
      typeof window !== "undefined" && window.location.href
        ? window.location.href
        : cert.qrCodeDataUrl || "";

    if (targetUrl) {
      QRCode.toDataURL(targetUrl, {
        margin: 1,
        width: 320,
        color: {
          dark: "#09090b",
          light: "#ffffff",
        },
      })
        .then((url) => setDynamicQrUrl(url))
        .catch((err) => {
          console.warn("Could not generate client QR code:", err);
        });
    }
  }, [cert.qrCodeDataUrl]);

  // Deduplicate and enrich partner logos
  const rawPartners =
    cert.branding?.partnerLogos && cert.branding.partnerLogos.length > 0
      ? cert.branding.partnerLogos
      : [
          {
            name: "Община Гълъбово",
            logoUrl:
              "https://upload.wikimedia.org/wikipedia/commons/e/e0/Coat_of_arms_of_Galabovo.png",
          },
          {
            name: "Be Active",
            logoUrl: "",
          },
        ];

  const uniquePartners = Array.from(
    new Map(
      rawPartners
        .filter((p) => {
          if (!p?.name?.trim()) return false;
          if (
            cert.recipient.institution &&
            p.name.trim().toLowerCase() ===
              cert.recipient.institution.trim().toLowerCase()
          ) {
            return false;
          }
          return true;
        })
        .map((p) => {
          const trimmedName = p.name.trim();
          let logo = p.logoUrl || "";
          if (!logo && trimmedName.toLowerCase().includes("гълъбово")) {
            logo =
              "https://upload.wikimedia.org/wikipedia/commons/e/e0/Coat_of_arms_of_Galabovo.png";
          }
          return [
            trimmedName.toLowerCase(),
            {
              name: trimmedName,
              logoUrl: logo,
              websiteUrl: p.websiteUrl,
            },
          ];
        })
    ).values()
  );

  const uploadedDoc = cert.uploadedDocument;

  useEffect(() => {
    if (uploadedDoc?.fileType === "pdf" && uploadedDoc.fileUrl) {
      fetch(uploadedDoc.fileUrl)
        .then((res) => res.arrayBuffer())
        .then(async (buf) => {
          const doc = await PDFDocument.load(buf, { ignoreEncryption: true });
          const firstPage = doc.getPages()[0];
          if (firstPage) {
            const { width, height } = firstPage.getSize();
            if (width > 0 && height > 0) {
              setPdfAspectRatio(width / height);
            }
          }
        })
        .catch((err) => {
          console.warn("Could not determine PDF aspect ratio:", err);
        });
    }
  }, [uploadedDoc]);

  const formattedValidUntil = cert.details.validUntil
    ? new Date(cert.details.validUntil).toLocaleDateString("bg-BG", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  const formattedIssuedAt = cert.issuedAt
    ? (() => {
        const d = new Date(cert.issuedAt);
        const dateStr = d.toLocaleDateString("bg-BG", {
          day: "numeric",
          month: "long",
          year: "numeric",
        });
        const timeStr = d.toLocaleTimeString("bg-BG", {
          hour: "2-digit",
          minute: "2-digit",
        });
        return `${dateStr}, ${timeStr} ч.`;
      })()
    : null;

  return (
    <div className="min-h-screen bg-linear-to-b from-amber-50/40 via-zinc-100/50 to-zinc-50 px-3 py-6 sm:px-6 lg:px-8 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950">
      {/* Explicit Print CSS so the voucher document prints with full color and no blank pages */}
      <style>{`
        @media print {
          body, html {
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          body * {
            visibility: hidden !important;
          }
          .printable-voucher,
          .printable-voucher * {
            visibility: visible !important;
          }
          .printable-voucher {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            border: none !important;
            background: white !important;
          }
          .no-print,
          .print\\:hidden {
            display: none !important;
          }
          @page {
            size: auto;
            margin: 8mm;
          }
        }
      `}</style>

      <div className="mx-auto max-w-4xl space-y-6">
        {/* ================================================================= */}
        {/* 1. COACH / ADMIN PRIVATE PANEL (ONLY VISIBLE IF USER IS LOGGED IN) */}
        {/* ================================================================= */}
        {user && isVoucher && (
          <div className="no-print print:hidden rounded-2xl border border-amber-300 bg-amber-500/10 p-4 shadow-sm backdrop-blur-sm dark:border-amber-800 dark:bg-amber-950/40">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-600 text-white shadow-xs">
                  <UserCheck className="size-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black tracking-wider text-amber-900 uppercase dark:text-amber-200">
                      🔒 Треньорски контролен панел
                    </span>
                    <Badge
                      variant="outline"
                      className="border-amber-400 bg-amber-100 font-mono text-[10px] font-bold text-amber-900 dark:bg-amber-900/60 dark:text-amber-200"
                    >
                      <Ticket className="mr-1 size-3 text-amber-700" />
                      Пакет: {remaining} от {total} оставащи
                    </Badge>
                    <Badge
                      variant="outline"
                      className="border-emerald-400 bg-emerald-100 font-mono text-[10px] font-bold text-emerald-900 dark:bg-emerald-900/60 dark:text-emerald-200"
                    >
                      <CheckCircle2 className="mr-1 size-3 text-emerald-600" />
                      Заверен & Валиден
                    </Badge>
                  </div>
                  <p className="text-[11px] text-amber-800/80 dark:text-amber-400">
                    Този панел е видим само за вас, тъй като сте влезли в
                    системата. Детето вижда само официалния документ по-долу.
                  </p>
                </div>
              </div>

              <Button
                onClick={() => setShowRedeemDialog(true)}
                disabled={isFullyUsed}
                className="h-9 rounded-xl bg-amber-600 px-4 text-xs font-bold text-white shadow-sm hover:bg-amber-700"
              >
                <UserCheck className="mr-1.5 size-4" />
                Отчети тренировка / присъствие
              </Button>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* 2. TOP ACTION & AUTHENTICITY BAR (Public & Discreet)              */}
        {/* ================================================================= */}
        <div className="no-print print:hidden flex flex-col items-center justify-between gap-3 rounded-2xl border border-zinc-200/80 bg-white/90 px-4 py-2.5 shadow-xs backdrop-blur-md sm:flex-row dark:border-zinc-800 dark:bg-zinc-900/90">
          <div className="flex items-center gap-2.5">
            <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white">
              <ShieldCheck className="size-4" />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-zinc-900 dark:text-white">
                Официален клубен документ
              </span>
              <Badge
                variant="outline"
                className="rounded-md border-emerald-300 bg-emerald-50 px-2 py-0 font-mono text-[10px] font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
              >
                {cert.serialNumber}
              </Badge>
              <span className="hidden text-xs text-zinc-400 sm:inline">•</span>
              <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Заверен в клубния регистър
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleCopyLink}
              className="h-8 rounded-xl border-zinc-300 bg-zinc-50 text-[11px] font-bold text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
            >
              {copiedLink ? (
                <>
                  <Check className="mr-1.5 size-3.5 text-emerald-600" />
                  Копиран
                </>
              ) : (
                <>
                  <Copy className="mr-1.5 size-3.5" />
                  Копирай линк
                </>
              )}
            </Button>

            <Button
              size="sm"
              onClick={() => window.print()}
              className="h-8 rounded-xl bg-zinc-900 text-[11px] font-bold text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900"
            >
              <Printer className="mr-1.5 size-3.5" />
              Принтирай
            </Button>
          </div>
        </div>

        {/* ================================================================= */}
        {/* 3. MAIN UNIFIED OFFICIAL CERTIFICATE / VOUCHER DOCUMENT CARD       */}
        {/* ================================================================= */}
        {uploadedDoc ? (
          <div
            id="official-voucher-certificate"
            className="printable-voucher relative overflow-hidden rounded-3xl border-2 border-amber-300/80 bg-white p-5 shadow-2xl transition-all sm:p-8 md:p-10 dark:border-amber-500/30 dark:bg-zinc-900 print:rounded-none print:border-none print:p-0 print:shadow-none"
          >
            {/* Top Royal Gradient Line */}
            <div className="absolute top-0 inset-x-0 h-2.5 bg-linear-to-r from-blue-700 via-amber-400 to-indigo-700" />

            {/* Subtle luxury watermark accent */}
            <div className="pointer-events-none absolute -top-12 -right-12 size-52 rounded-full bg-amber-400/5 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-12 -left-12 size-52 rounded-full bg-blue-500/5 blur-3xl" />

            {/* Document Header: Club crest & official voucher stamp badge */}
            <div className="flex flex-col gap-4 border-b border-amber-100 pb-5 sm:flex-row sm:items-center sm:justify-between dark:border-zinc-800">
              {/* Club Emblem & Title */}
              <div className="flex items-center gap-3.5">
                <div className="relative size-14 shrink-0 overflow-hidden rounded-2xl border-2 border-amber-200/90 bg-white p-1.5 shadow-sm dark:border-zinc-800">
                  <Image
                    src={clubLogo}
                    alt="Club Crest"
                    width={48}
                    height={48}
                    className="size-full object-contain"
                    unoptimized
                  />
                </div>
                <div>
                  <h2 className="text-base font-black tracking-tight text-zinc-900 sm:text-lg dark:text-white">
                    {clubName}
                  </h2>
                  <p className="text-xs font-bold text-amber-700 dark:text-amber-400">
                    Официален клубен издател
                  </p>
                </div>
              </div>

              {/* Official Voucher Badge on the Right */}
              <div className="flex items-center sm:justify-end">
                <div className="inline-flex items-center gap-2 rounded-2xl border-2 border-amber-300 bg-amber-50/95 px-4 py-2 text-xs font-black tracking-wider text-amber-950 uppercase shadow-xs dark:border-amber-700 dark:bg-amber-950/70 dark:text-amber-200">
                  <Sparkles className="size-4 text-amber-600" />
                  <span>★ Официален Ваучер ★</span>
                </div>
              </div>
            </div>

            {/* Recipient & Honor Banner */}
            <div className="my-6 rounded-3xl bg-linear-to-b from-amber-500/10 via-amber-400/5 to-blue-500/10 p-5 text-center sm:p-7 shadow-xs">
              <span className="text-xs font-black tracking-widest text-amber-900 uppercase sm:text-sm dark:text-amber-300">
                Настоящият ваучер се предоставя на
              </span>

              <h1 className="mt-1.5 text-2xl font-black tracking-tight text-zinc-900 sm:text-3xl md:text-4xl dark:text-white">
                {cert.recipient.name}
              </h1>

              {cert.recipient.institution && (
                <p className="mt-1 text-sm font-bold text-zinc-600 sm:text-base dark:text-zinc-300">
                  {cert.recipient.institution}
                </p>
              )}

              {/* HIGH-IMPACT SPOTLIGHT: Service Purpose & Validity Date */}
              <div className="mt-6 flex flex-col items-center justify-center gap-3">
                {/* 1. Primary Service Title - Large, bold, attracts attention immediately */}
                <div className="inline-flex items-center gap-2.5 rounded-2xl border-2 border-blue-400/90 bg-linear-to-r from-blue-600 via-indigo-600 to-blue-700 px-6 py-3 text-white shadow-md sm:px-8 sm:py-3.5">
                  <Gift className="size-5 sm:size-6 text-amber-300 shrink-0" />
                  <span className="text-base sm:text-lg md:text-xl font-black tracking-tight uppercase">
                    {cert.details.voucherServiceType ||
                      cert.visualSnapshot?.templateTitle ||
                      "2 безплатни тренировки по бадминтон"}
                  </span>
                </div>

                {/* 2. Prominent Validity Badge - Highly visible validity date */}
                {formattedValidUntil && (
                  <div className="inline-flex items-center gap-2 rounded-xl border-2 border-amber-300/90 bg-white/95 px-4 py-1.5 shadow-xs dark:border-amber-600 dark:bg-zinc-800">
                    <span className="text-xs sm:text-sm font-bold text-zinc-700 dark:text-zinc-200">
                      Срок на валидност:{" "}
                      <span className="font-black text-amber-950 dark:text-amber-300 underline decoration-amber-400 decoration-2 underline-offset-2">
                        до {formattedValidUntil}
                      </span>
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* ============================================================= */}
            {/* THE EMBEDDED VOUCHER DOCUMENT (PDF OR IMAGE)                   */}
            {/* Cleanly framed as the centerpiece of the document             */}
            {/* ============================================================= */}
            <div className="relative group my-4 w-full overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
              {/* Floating controls in top right (hidden when printing) */}
              <div className="print:hidden absolute top-3 right-3 z-10 flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsZoomOpen(true)}
                  className="h-8 rounded-xl border-zinc-200/80 bg-white/90 px-3 text-xs font-bold text-zinc-800 shadow-md backdrop-blur-md hover:bg-white dark:border-zinc-700 dark:bg-zinc-900/90 dark:text-white"
                >
                  <Maximize2 className="mr-1.5 size-3.5 text-blue-600" />
                  Увеличи
                </Button>

                <a
                  href={uploadedDoc.fileUrl}
                  download={
                    uploadedDoc.fileName ||
                    (uploadedDoc.fileType === "pdf"
                      ? "vaucher.pdf"
                      : "vaucher.png")
                  }
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-8 items-center gap-1.5 rounded-xl bg-blue-600 px-3 text-xs font-bold text-white shadow-md hover:bg-blue-700"
                >
                  <Download className="size-3.5" />
                  {uploadedDoc.fileType === "pdf" ? "Свали PDF" : "Свали"}
                </a>
              </div>

              {/* Native flush presentation: exact aspect ratio, zero black bars, zero margins */}
              {uploadedDoc.fileType === "pdf" ? (
                <PdfToImageCanvas
                  fileUrl={uploadedDoc.fileUrl}
                  fallbackAspect={pdfAspectRatio}
                />
              ) : (
                <img
                  src={uploadedDoc.fileUrl}
                  alt="Официален клубен ваучер"
                  className="block h-auto w-full rounded-2xl object-contain shadow-xs"
                />
              )}
            </div>

            {/* ============================================================= */}
            {/* 1. OFFICIAL PARTNERS & SPONSORS SHOWCASE                     */}
            {/* Prominent, Centered, Large Logos & Clear Importance           */}
            {/* ============================================================= */}
            <div className="mt-8 rounded-2xl border-2 border-amber-200/80 bg-linear-to-b from-amber-50/60 via-white to-amber-50/30 p-5 text-center shadow-xs sm:p-6 dark:border-zinc-800 dark:from-zinc-900/60 dark:to-zinc-950">
              <div className="mb-3.5 inline-flex items-center gap-2">
                <span className="text-xs font-black tracking-widest text-amber-900 uppercase dark:text-amber-300">
                  Партньори & Подкрепа
                </span>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
                {/* Educational Institution Card (with logo or school icon) */}
                {cert.recipient.institution && (
                  <div className="flex items-center gap-3.5 rounded-2xl border-2 border-zinc-200/90 bg-white px-5 py-3 shadow-sm hover:border-blue-400 hover:shadow-md transition-all dark:border-zinc-700 dark:bg-zinc-800">
                    {cert.branding?.institutionLogoUrl ? (
                      <div className="relative size-12 sm:size-14 shrink-0 overflow-hidden rounded-xl bg-white p-1">
                        <Image
                          src={cert.branding.institutionLogoUrl}
                          alt={cert.recipient.institution}
                          width={56}
                          height={56}
                          className="size-full object-contain"
                          unoptimized
                        />
                      </div>
                    ) : (
                      <div className="flex size-12 sm:size-14 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-blue-600 to-indigo-700 text-white shadow-inner">
                        <School className="size-6 sm:size-7 text-white" />
                      </div>
                    )}
                    <div className="text-left">
                      <span className="block text-sm sm:text-base font-black tracking-tight text-zinc-900 dark:text-white">
                        {cert.recipient.institution}
                      </span>
                      <span className="text-[11px] font-bold text-blue-700 dark:text-blue-400">
                        Образователна институция
                      </span>
                    </div>
                  </div>
                )}

                {uniquePartners.map((p, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3.5 rounded-2xl border-2 border-zinc-200/90 bg-white px-5 py-3 shadow-sm hover:border-amber-400 hover:shadow-md transition-all dark:border-zinc-700 dark:bg-zinc-800"
                  >
                    {p.logoUrl ? (
                      <div className="relative size-12 sm:size-14 shrink-0 overflow-hidden rounded-xl bg-white p-1">
                        <Image
                          src={p.logoUrl}
                          alt={p.name}
                          width={56}
                          height={56}
                          className="size-full object-contain"
                          unoptimized
                        />
                      </div>
                    ) : (
                      <div className="flex size-12 sm:size-14 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-amber-500 to-amber-600 text-white font-black text-lg shadow-inner">
                        {p.name.charAt(0)}
                      </div>
                    )}
                    <div className="text-left">
                      <span className="block text-sm sm:text-base font-black tracking-tight text-zinc-900 dark:text-white">
                        {p.name}
                      </span>
                      <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400">
                        Официален партньор
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ============================================================= */}
            {/* 2. DOCUMENT AUTHENTICITY BAR: Seal & Electronic QR Validator */}
            {/* ============================================================= */}
            <div className="mt-6 border-t-2 border-amber-100 pt-6 dark:border-zinc-800">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                {/* Official Seal & Club Full Name */}
                <div className="space-y-1.5 text-center sm:text-left">
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-100/90 px-3.5 py-1 text-xs font-bold text-amber-900 shadow-2xs dark:bg-amber-950/80 dark:text-amber-300">
                    <Award className="size-4 text-amber-600" />
                    <span>Заверен в клубния регистър</span>
                  </div>
                  {formattedIssuedAt && (
                    <p className="text-xs text-zinc-600 dark:text-zinc-400">
                      Издаден на:{" "}
                      <span className="font-semibold text-zinc-900 dark:text-white">
                        {formattedIssuedAt}
                      </span>
                    </p>
                  )}
                  <p className="text-sm font-black tracking-wide text-zinc-900 dark:text-zinc-100">
                    {clubName}
                  </p>
                </div>

                {/* Electronic QR Verification & Serial Number (Clickable & Scannable) */}
                <a
                  href={currentUrl || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center justify-between sm:justify-end gap-4 rounded-2xl border-2 border-emerald-300/90 bg-emerald-50/60 p-3 shadow-xs transition-all hover:bg-emerald-100/70 hover:shadow-md dark:border-emerald-800/80 dark:bg-emerald-950/40"
                  title="Кликни или сканирай с камера за електронна валидация"
                >
                  <div className="text-right">
                    <span className="text-[10px] font-black tracking-wider text-emerald-800 uppercase dark:text-emerald-300">
                      Електронна валидация
                    </span>
                    <div className="font-mono text-xs font-black text-zinc-900 sm:text-sm dark:text-white">
                      № {cert.serialNumber}
                    </div>
                    <div className="inline-flex items-center gap-1 text-[11px] font-extrabold text-emerald-700 underline underline-offset-2 dark:text-emerald-400">
                      <CheckCircle2 className="size-3.5 text-emerald-600" />
                      <span>Сканирай или кликни</span>
                      <ExternalLink className="size-3 opacity-70 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>

                  <div className="relative size-18 sm:size-20 shrink-0 overflow-hidden rounded-xl border-2 border-emerald-400 bg-white p-1 shadow-xs transition-transform group-hover:scale-105 dark:border-emerald-700">
                    {dynamicQrUrl || cert.qrCodeDataUrl ? (
                      <img
                        src={dynamicQrUrl || cert.qrCodeDataUrl}
                        alt="QR код за проверка"
                        className="size-full object-contain"
                      />
                    ) : (
                      <div className="flex size-full items-center justify-center bg-zinc-100 text-zinc-400">
                        <QrCodeIcon className="size-8" />
                      </div>
                    )}
                  </div>
                </a>
              </div>
            </div>
          </div>
        ) : (
          /* Legacy Template Document Preview */
          <div className="flex justify-center py-2">
            <CertificateDocumentPreview
              data={{
                siteId: cert.siteId,
                type: cert.type,
                title: cert.visualSnapshot?.templateTitle || "Документ",
                visualConfig: cert.visualSnapshot,
                serialNumber: cert.serialNumber,
                qrCodeDataUrl: cert.qrCodeDataUrl,
                recipientName: cert.recipient.name,
                recipientInstitution: cert.recipient.institution,
                rank: cert.details.rank,
                nomination: cert.details.nomination,
                eventTitle: cert.details.eventTitle,
                eventDate: cert.details.eventDate,
                eventLocation: cert.details.eventLocation,
                totalSessions: cert.details.totalSessions,
                remainingSessions: cert.details.remainingSessions,
                validUntil: cert.details.validUntil,
                skillsSummary: cert.details.skillsSummary,
                hoursTrained: cert.details.hoursTrained,
                sponsors: (cert.visualSnapshot?.sponsors || []).map(
                  (s, idx) => ({
                    id: `public_${idx}`,
                    siteId: cert.siteId,
                    name: s.name,
                    category: "general",
                    logoUrl: s.logoUrl,
                    websiteUrl: s.websiteUrl,
                    isActive: true,
                    order: idx,
                    createdAt: cert.issuedAt,
                  })
                ),
              }}
            />
          </div>
        )}

        {/* ================================================================= */}
        {/* 4. SOCIAL SHARING & VERIFICATION FOOTER (Print Hidden)           */}
        {/* ================================================================= */}
        <Card className="no-print print:hidden space-y-4 rounded-3xl border-zinc-200/80 bg-white p-6 text-center shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-zinc-900 dark:text-white">
              Споделете този ваучер
            </h4>
            <p className="text-xs text-zinc-500">
              Ваучерът може да бъде отворен, принтиран или представен директно
              от мобилен телефон.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
            <Button
              onClick={handleWebShare}
              className="h-9 rounded-xl bg-zinc-900 text-xs font-bold text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900"
            >
              <Share2 className="mr-1.5 size-3.5" />
              Сподели (Share)
            </Button>

            <a
              href={`viber://forward?text=${encodeURIComponent("Официален клубен ваучер: " + currentUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-purple-50 px-3.5 text-xs font-bold text-purple-700 hover:bg-purple-100 dark:bg-purple-950/60 dark:text-purple-300"
            >
              <span>📱 Viber</span>
            </a>

            <a
              href={`https://api.whatsapp.com/send?text=${encodeURIComponent("Официален клубен ваучер: " + currentUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-emerald-50 px-3.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300"
            >
              <span>💬 WhatsApp</span>
            </a>

            <a
              href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-blue-50 px-3.5 text-xs font-bold text-blue-700 hover:bg-blue-100 dark:bg-blue-950/60 dark:text-blue-300"
            >
              <span>📘 Facebook</span>
            </a>
          </div>

          {/* Club Info & Location */}
          <div className="space-y-1 border-t border-zinc-100 pt-4 text-[11px] text-zinc-500 dark:border-zinc-800">
            <div className="font-semibold text-zinc-700 dark:text-zinc-300">
              Бадминтон Клуб Гълъбово & Recovery Zone by ZM
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 text-zinc-400">
              <span className="flex items-center gap-1">
                <MapPin className="size-3 text-red-500" />
                гр. Гълъбово
              </span>
              <span>•</span>
              <a
                href="https://galabovo.bg"
                target="_blank"
                rel="noreferrer"
                className="hover:underline"
              >
                Община Гълъбово
              </a>
              <span>•</span>
              <Link
                href="/"
                className="text-blue-600 hover:underline dark:text-blue-400"
              >
                Официален уебсайт
              </Link>
            </div>
          </div>
        </Card>
      </div>

      {/* ================================================================= */}
      {/* 5. FULLSCREEN ZOOM MODAL (For mobile & desktop inspection)         */}
      {/* ================================================================= */}
      {uploadedDoc && (
        <Dialog open={isZoomOpen} onOpenChange={setIsZoomOpen}>
          <DialogContent className="max-w-5xl p-4 sm:p-6">
            <DialogHeader className="mb-2">
              <DialogTitle className="flex items-center justify-between text-base">
                <span>{uploadedDoc.fileName || "Ваучер за подарък"}</span>
                <a
                  href={uploadedDoc.fileUrl}
                  download={uploadedDoc.fileName || "vaucher.pdf"}
                  className="mr-6 inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:underline"
                >
                  <Download className="size-3.5" />
                  Свали
                </a>
              </DialogTitle>
            </DialogHeader>

            <div className="max-h-[85vh] w-full overflow-y-auto rounded-xl bg-white p-2 dark:bg-zinc-900">
              {uploadedDoc.fileType === "pdf" ? (
                <PdfToImageCanvas
                  fileUrl={uploadedDoc.fileUrl}
                  fallbackAspect={pdfAspectRatio}
                />
              ) : (
                <div className="flex size-full items-center justify-center p-2">
                  <img
                    src={uploadedDoc.fileUrl}
                    alt="Ваучер пълен екран"
                    className="max-h-[80vh] max-w-full object-contain rounded-lg"
                  />
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* ================================================================= */}
      {/* 6. REDEEM / ATTENDANCE MODAL (Coaches only)                       */}
      {/* ================================================================= */}
      {showRedeemDialog && (
        <RedeemVoucherDialog
          open={showRedeemDialog}
          onOpenChange={setShowRedeemDialog}
          certificate={cert}
          onRedeemed={handleRefreshCert}
        />
      )}
    </div>
  );
}
