/* eslint-disable react/forbid-dom-props, sonarjs/no-nested-conditional, sonarjs/cognitive-complexity, @next/next/no-img-element */
"use client";

import confetti from "canvas-confetti";
import {
  Check,
  Copy,
  Download,
  ExternalLink,
  FileText,
  MapPin,
  Printer,
  School,
  Share2,
  ShieldCheck,
  Ticket,
  UserCheck,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";

import { CertificateDocumentPreview } from "@/app/(protected)/certificates/components/CertificateDocumentPreview";
import { RedeemVoucherDialog } from "@/app/(protected)/certificates/components/RedeemVoucherDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { certificateIssuanceService } from "@/services/certificate-issuance-service";
import { IssuedCertificate } from "@/types/certificates";

interface PublicCertificateClientProps {
  certificate: IssuedCertificate;
}

export function PublicCertificateClient({
  certificate: initialCertificate,
}: PublicCertificateClientProps) {
  const [cert, setCert] = useState<IssuedCertificate>(initialCertificate);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showRedeemDialog, setShowRedeemDialog] = useState(false);

  useEffect(() => {
    try {
      confetti({
        particleCount: 70,
        spread: 70,
        origin: { y: 0.4 },
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
    toast.success("Линкът към документа е копиран!");
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleWebShare = async () => {
    if (navigator.share && currentUrl) {
      try {
        await navigator.share({
          title: `${cert.visualSnapshot?.templateTitle || "Клубен Ваучер"} - ${cert.recipient.name}`,
          text: `Официален документ № ${cert.serialNumber} на ${cert.recipient.name}`,
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

  const uploadedDoc = cert.uploadedDocument;

  return (
    <div className="min-h-screen bg-linear-to-b from-zinc-50 via-zinc-100/60 to-zinc-50 px-4 py-8 sm:px-6 lg:px-8 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* 1. Official Verification Status Banner */}
        <div className="flex flex-col items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/90 px-4 py-3 shadow-xs sm:flex-row dark:border-emerald-800/80 dark:bg-emerald-950/50">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs">
              <ShieldCheck className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black tracking-wider text-emerald-800 uppercase dark:text-emerald-300">
                  Автентичен клубен документ
                </span>
                <Badge
                  variant="outline"
                  className="rounded-lg border-emerald-300 bg-white px-2 py-0 font-mono text-[10px] font-bold text-emerald-800 dark:bg-zinc-900 dark:text-emerald-300"
                >
                  {cert.serialNumber}
                </Badge>
              </div>
              <p className="text-[11px] text-emerald-700/90 dark:text-emerald-400">
                Заверен и валидиран в дигиталния регистър на{" "}
                {isRecoveryZone ? "Recovery Zone by ZM" : "БК Гълъбово 2025"}.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleCopyLink}
              className="h-8 rounded-xl border-emerald-300 bg-white text-[11px] font-bold text-emerald-800 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-zinc-900 dark:text-emerald-300"
            >
              {copiedLink ? (
                <>
                  <Check className="mr-1 size-3 text-emerald-600" />
                  Копиран
                </>
              ) : (
                <>
                  <Copy className="mr-1 size-3" />
                  Копирай
                </>
              )}
            </Button>

            <Button
              size="sm"
              onClick={() => window.print()}
              className="h-8 rounded-xl bg-zinc-900 text-[11px] font-bold text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900"
            >
              <Printer className="mr-1 size-3" />
              Принтирай
            </Button>
          </div>
        </div>

        {/* 2. Attendance & Voucher Status Callout (For Vouchers) */}
        {isVoucher && (
          <Card className="rounded-3xl border-amber-200/80 bg-linear-to-r from-amber-50 to-orange-50/50 p-5 shadow-xs dark:border-amber-900/60 dark:from-amber-950/40 dark:to-zinc-900">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-md shadow-amber-500/20">
                  <Ticket className="size-6" />
                </div>
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-amber-900 dark:text-amber-200">
                    Статус на Ваучера & Отчитане на присъствия
                  </div>
                  <div className="text-lg font-black text-amber-900 dark:text-amber-300">
                    {isFullyUsed
                      ? "Всички тренировки са използвани"
                      : `${remaining} от общо ${total} тренировки оставащи`}
                  </div>
                  <p className="text-[11px] text-amber-700 dark:text-amber-400">
                    {cert.details.voucherServiceType ||
                      cert.visualSnapshot?.templateTitle}
                  </p>
                </div>
              </div>

              {/* Action Button: Redeem / Mark Attendance */}
              <div className="flex flex-col items-end gap-2">
                <Button
                  onClick={() => setShowRedeemDialog(true)}
                  disabled={isFullyUsed}
                  className="rounded-2xl bg-amber-600 px-4 text-xs font-bold text-white shadow-md shadow-amber-600/25 hover:bg-amber-700"
                >
                  <UserCheck className="mr-1.5 size-4" />
                  Отчети присъствие / тренировка
                </Button>

                {cert.details.validUntil && (
                  <div className="text-xs font-medium text-amber-900/80 dark:text-amber-400">
                    Валиден до:{" "}
                    <strong>
                      {new Date(cert.details.validUntil).toLocaleDateString(
                        "bg-BG"
                      )}
                    </strong>
                  </div>
                )}
              </div>
            </div>

            {/* Attendance Progress bar */}
            <div className="mt-4 space-y-1.5">
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-amber-200/80 dark:bg-amber-950">
                <div
                  className="h-full rounded-full bg-linear-to-r from-amber-500 to-emerald-500 transition-all duration-300"
                  style={{ width: `${Math.min(100, (used / total) * 100)}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-amber-800/80 dark:text-amber-400">
                <span>Използвани: {used}</span>
                <span>Оставащи: {remaining}</span>
                <span>Общо: {total}</span>
              </div>
            </div>

            {/* Attendance Log History (if any) */}
            {cert.details.usageLog && cert.details.usageLog.length > 0 && (
              <div className="mt-4 border-t border-amber-200/60 pt-3 dark:border-amber-900/50">
                <div className="mb-2 text-[11px] font-bold tracking-wider text-amber-900 uppercase dark:text-amber-300">
                  📋 Дневник на отчетените тренировки (
                  {cert.details.usageLog.length})
                </div>
                <div className="max-h-36 space-y-1.5 overflow-y-auto pr-1">
                  {cert.details.usageLog.map((log, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between rounded-xl bg-white/80 p-2 text-xs shadow-2xs dark:bg-zinc-900/80"
                    >
                      <div className="space-y-0.5">
                        <span className="font-bold text-zinc-900 dark:text-white">
                          Тренировка #{log.sessionNumber}
                        </span>
                        {log.note && (
                          <p className="text-[11px] text-zinc-500">
                            {log.note}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="font-mono text-[10px] text-zinc-400">
                          {new Date(log.date).toLocaleDateString("bg-BG")}
                        </span>
                        {log.markedByName && (
                          <div className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                            ✓ {log.markedByName}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        )}

        {/* 3. MAIN DOCUMENT VIEW: Uploaded PDF/Image OR Legacy Template Preview */}
        {uploadedDoc ? (
          <Card className="overflow-hidden rounded-3xl border border-zinc-200/90 bg-white p-6 shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
            {/* Header: Logos & Branding */}
            <div className="flex flex-col gap-4 border-b border-zinc-100 pb-5 sm:flex-row sm:items-center sm:justify-between dark:border-zinc-800">
              {/* Club Logo */}
              <div className="flex items-center gap-3">
                <div className="relative size-12 shrink-0 overflow-hidden rounded-2xl border border-zinc-200 bg-white p-1 shadow-xs dark:border-zinc-800">
                  <Image
                    src={clubLogo}
                    alt="Club Logo"
                    width={44}
                    height={44}
                    className="size-full object-contain"
                    unoptimized
                  />
                </div>
                <div>
                  <h3 className="text-sm font-black text-zinc-900 dark:text-white">
                    {isRecoveryZone
                      ? "Recovery Zone by ZM"
                      : "БК Гълъбово 2025"}
                  </h3>
                  <p className="text-[11px] text-zinc-400">
                    Официален клубен издател
                  </p>
                </div>
              </div>

              {/* Institution Logo & Details */}
              {cert.branding?.institutionLogoUrl ? (
                <div className="flex items-center gap-2.5 sm:text-right">
                  <div>
                    <h4 className="text-xs font-bold text-zinc-900 dark:text-white">
                      {cert.recipient.institution || "Партньорска институция"}
                    </h4>
                    <p className="text-[10px] text-zinc-400">
                      Образователен партньор
                    </p>
                  </div>
                  <div className="relative size-11 shrink-0 overflow-hidden rounded-2xl border border-zinc-200 bg-white p-1 shadow-xs dark:border-zinc-800">
                    <Image
                      src={cert.branding.institutionLogoUrl}
                      alt="Institution Logo"
                      width={40}
                      height={40}
                      className="size-full object-contain"
                      unoptimized
                    />
                  </div>
                </div>
              ) : cert.recipient.institution ? (
                <div className="flex items-center gap-2 rounded-xl bg-zinc-50 px-3 py-1.5 dark:bg-zinc-800">
                  <School className="size-4 text-zinc-400" />
                  <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                    {cert.recipient.institution}
                  </span>
                </div>
              ) : null}
            </div>

            {/* Recipient & Document Metadata Row */}
            <div className="grid grid-cols-1 gap-4 py-5 sm:grid-cols-3">
              <div className="space-y-1">
                <span className="text-[10px] font-bold tracking-wider text-zinc-400 uppercase">
                  Получател / Дете
                </span>
                <div className="text-base font-black text-zinc-900 dark:text-white">
                  {cert.recipient.name}
                </div>
                {cert.recipient.institution && (
                  <p className="text-xs text-zinc-500">
                    {cert.recipient.institution}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-bold tracking-wider text-zinc-400 uppercase">
                  Предназначение
                </span>
                <div className="text-sm font-bold text-blue-600 dark:text-blue-400">
                  {cert.details.voucherServiceType ||
                    cert.visualSnapshot?.templateTitle}
                </div>
                <div className="text-xs text-zinc-500">
                  {isVoucher
                    ? `Пакет от ${total} тренировки`
                    : "Официален документ"}
                </div>
              </div>

              <div className="space-y-1 sm:text-right">
                <span className="text-[10px] font-bold tracking-wider text-zinc-400 uppercase">
                  Електронна Валидация
                </span>
                <div className="font-mono text-sm font-black text-zinc-900 dark:text-white">
                  № {cert.serialNumber}
                </div>
                <div className="text-xs text-emerald-600 dark:text-emerald-400">
                  ✓ Официално заверен
                </div>
              </div>
            </div>

            {/* Uploaded File Viewer Container */}
            <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-950 dark:border-zinc-800">
              {uploadedDoc.fileType === "pdf" ? (
                <div className="space-y-3 p-4">
                  <div className="flex items-center justify-between text-xs text-zinc-300">
                    <div className="flex items-center gap-2">
                      <FileText className="size-4 text-red-400" />
                      <span className="font-bold">
                        {uploadedDoc.fileName || "Ваучер_Документ.pdf"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <a
                        href={uploadedDoc.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 rounded-lg bg-zinc-800 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-zinc-700"
                      >
                        <ExternalLink className="size-3" />
                        Цял екран
                      </a>
                      <a
                        href={uploadedDoc.fileUrl}
                        download={uploadedDoc.fileName || "voucher.pdf"}
                        className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-blue-700"
                      >
                        <Download className="size-3" />
                        Свали PDF
                      </a>
                    </div>
                  </div>

                  {/* Embedded PDF iframe / object */}
                  <div className="h-150 w-full overflow-hidden rounded-xl bg-white">
                    <iframe
                      src={uploadedDoc.fileUrl}
                      title="PDF Документ"
                      className="size-full border-0"
                    />
                  </div>
                </div>
              ) : (
                <div className="relative flex min-h-100 w-full items-center justify-center p-4">
                  <div className="relative max-h-175 w-full overflow-hidden rounded-xl">
                    <img
                      src={uploadedDoc.fileUrl}
                      alt="Uploaded Document"
                      className="mx-auto max-h-[650px] w-auto rounded-xl object-contain shadow-2xl"
                    />
                  </div>

                  {/* Action Bar on Image */}
                  <div className="absolute top-6 right-6 flex items-center gap-2">
                    <a
                      href={uploadedDoc.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-xl bg-zinc-900/80 px-3 py-1.5 text-xs font-bold text-white backdrop-blur-md hover:bg-zinc-900"
                    >
                      <ExternalLink className="size-3" />
                      Оригинален размер
                    </a>
                    <a
                      href={uploadedDoc.fileUrl}
                      download={uploadedDoc.fileName || "voucher.png"}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600/90 px-3 py-1.5 text-xs font-bold text-white backdrop-blur-md hover:bg-blue-600"
                    >
                      <Download className="size-3" />
                      Свали
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* Partners & Sponsors Footer Bar */}
            {cert.branding?.partnerLogos &&
              cert.branding.partnerLogos.length > 0 && (
                <div className="mt-5 border-t border-zinc-100 pt-4 dark:border-zinc-800">
                  <span className="text-[10px] font-bold tracking-wider text-zinc-400 uppercase">
                    Партньори & Подкрепа
                  </span>
                  <div className="mt-2 flex flex-wrap items-center gap-4">
                    {cert.branding.partnerLogos.map((p, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 rounded-xl border border-zinc-100 bg-zinc-50 px-2.5 py-1.5 dark:border-zinc-800 dark:bg-zinc-950"
                      >
                        <div className="relative size-6 shrink-0">
                          <Image
                            src={p.logoUrl}
                            alt={p.name}
                            width={24}
                            height={24}
                            className="size-full object-contain"
                            unoptimized
                          />
                        </div>
                        <span className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">
                          {p.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
          </Card>
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

        {/* 4. Social Sharing & Verification Footer */}
        <Card className="space-y-4 rounded-3xl border-zinc-200/80 bg-white p-6 text-center shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-zinc-900 dark:text-white">
              Споделете този ваучер / документ
            </h4>
            <p className="text-xs text-zinc-500">
              Всеки документ разполага с персонален адрес за валидация и
              отчитане на присъствия.
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
              href={`viber://forward?text=${encodeURIComponent("Официален клубен документ: " + currentUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-purple-50 px-3.5 text-xs font-bold text-purple-700 hover:bg-purple-100 dark:bg-purple-950/60 dark:text-purple-300"
            >
              <span>📱 Viber</span>
            </a>

            <a
              href={`https://api.whatsapp.com/send?text=${encodeURIComponent("Официален клубен документ: " + currentUrl)}`}
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

          {/* Verification info block */}
          <div className="space-y-1 border-t border-zinc-100 pt-4 text-[11px] text-zinc-500 dark:border-zinc-800">
            <div className="font-semibold text-zinc-700 dark:text-zinc-300">
              Бадминтон Клуб Гълъбово & Recovery Zone by ZM
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 text-zinc-400">
              <span className="flex items-center gap-1">
                <MapPin className="size-3 text-red-500" />
                Спортен Комплекс „Енергетик“, гр. Гълъбово
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

      {/* Redeem Voucher Dialog */}
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
