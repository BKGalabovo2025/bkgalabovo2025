"use client";

import confetti from "canvas-confetti";
import {
  Check,
  Copy,
  MapPin,
  Printer,
  Share2,
  ShieldCheck,
  Ticket,
} from "lucide-react";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";

import { CertificateDocumentPreview } from "@/app/(protected)/certificates/components/CertificateDocumentPreview";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { IssuedCertificate } from "@/types/certificates";

interface PublicCertificateClientProps {
  certificate: IssuedCertificate;
}

export function PublicCertificateClient({
  certificate,
}: PublicCertificateClientProps) {
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    // Launch celebratory confetti when opening the certificate!
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

  const isVoucher = certificate.type === "voucher";
  const isRecoveryZone = certificate.siteId === "recoveryzone";

  const total = certificate.details.totalSessions || 1;
  const used = certificate.details.usedSessions || 0;
  const remaining = Math.max(0, total - used);
  const isFullyUsed =
    certificate.details.voucherStatus === "fully_used" || remaining === 0;

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
          title: `${certificate.visualSnapshot.templateTitle} - ${certificate.recipient.name}`,
          text: `Официален документ № ${certificate.serialNumber} на ${certificate.recipient.name}`,
          url: currentUrl,
        });
      } catch {
        // User cancelled
      }
    } else {
      handleCopyLink();
    }
  };

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
                  {certificate.serialNumber}
                </Badge>
              </div>
              <p className="text-[11px] text-emerald-700/90 dark:text-emerald-400">
                Заверен и валидиран в дигиталния регистър на{" "}
                {isRecoveryZone ? "Recovery Zone by ZM" : "БК Гълъбово"}.
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

        {/* 2. Voucher Status Callout (If Voucher) */}
        {isVoucher && (
          <Card className="rounded-3xl border-amber-200/80 bg-linear-to-r from-amber-50 to-orange-50/50 p-4 shadow-xs dark:border-amber-900/60 dark:from-amber-950/40 dark:to-zinc-900">
            <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
              <div className="flex items-center gap-3">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-md shadow-amber-500/20">
                  <Ticket className="size-6" />
                </div>
                <div>
                  <div className="text-xs font-bold text-amber-900 dark:text-amber-200">
                    Статус на Ваучера
                  </div>
                  <div className="text-lg font-black text-amber-800 dark:text-amber-300">
                    {isFullyUsed
                      ? "Всички процедури са използвани"
                      : `${remaining} от общо ${total} процедури оставащи`}
                  </div>
                </div>
              </div>

              {certificate.details.validUntil && (
                <div className="text-right text-xs font-medium text-amber-900 dark:text-amber-300">
                  Срок на валидност:{" "}
                  <strong>
                    {new Date(
                      certificate.details.validUntil
                    ).toLocaleDateString("bg-BG")}
                  </strong>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* 3. The Certificate Document Preview */}
        <div className="flex justify-center py-2">
          <CertificateDocumentPreview
            data={{
              siteId: certificate.siteId,
              type: certificate.type,
              title: certificate.visualSnapshot.templateTitle,
              visualConfig: certificate.visualSnapshot,
              serialNumber: certificate.serialNumber,
              qrCodeDataUrl: certificate.qrCodeDataUrl,
              recipientName: certificate.recipient.name,
              recipientInstitution: certificate.recipient.institution,
              rank: certificate.details.rank,
              nomination: certificate.details.nomination,
              eventTitle: certificate.details.eventTitle,
              eventDate: certificate.details.eventDate,
              eventLocation: certificate.details.eventLocation,
              totalSessions: certificate.details.totalSessions,
              remainingSessions: certificate.details.remainingSessions,
              validUntil: certificate.details.validUntil,
              skillsSummary: certificate.details.skillsSummary,
              hoursTrained: certificate.details.hoursTrained,
              sponsors: certificate.visualSnapshot.sponsors.map((s, idx) => ({
                id: `public_${idx}`,
                siteId: certificate.siteId,
                name: s.name,
                category: "general",
                logoUrl: s.logoUrl,
                websiteUrl: s.websiteUrl,
                isActive: true,
                order: idx,
                createdAt: certificate.issuedAt,
              })),
            }}
          />
        </div>

        {/* 4. Social Sharing & Verification Footer */}
        <Card className="space-y-4 rounded-3xl border-zinc-200/80 bg-white p-6 text-center shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-zinc-900 dark:text-white">
              Споделете това постижение
            </h4>
            <p className="text-xs text-zinc-500">
              Всеки документ разполага с персонален адрес за валидация в
              социалните мрежи.
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
              href={`viber://forward?text=${encodeURIComponent("Официален документ от БК Гълъбово: " + currentUrl)}`}
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
    </div>
  );
}
