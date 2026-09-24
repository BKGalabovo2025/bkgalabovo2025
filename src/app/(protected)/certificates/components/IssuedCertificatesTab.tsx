/* eslint-disable react/forbid-dom-props, sonarjs/no-nested-conditional, @typescript-eslint/no-unused-vars, sonarjs/no-unused-vars, sonarjs/no-dead-store */
"use client";

import {
  Award,
  Check,
  CheckCircle2,
  Copy,
  Download,
  ExternalLink,
  Eye,
  FileCheck2,
  FileDown,
  Loader2,
  Plus,
  Printer,
  QrCode,
  RefreshCw,
  Search,
  Sparkles,
  Ticket,
  Trash2,
  User,
} from "lucide-react";
import Image from "next/image";
import React, { useMemo, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  exportCertificatePdf,
  exportCertificatePng,
  printCertificate,
} from "@/lib/certificate-export-helpers";
import { certificateIssuanceService } from "@/services/certificate-issuance-service";
import {
  getCertificateTypeLabel,
  getRankLabel,
  IssuedCertificate,
} from "@/types/certificates";

import { CertificateDocumentPreview } from "./CertificateDocumentPreview";
import { RedeemVoucherDialog } from "./RedeemVoucherDialog";

interface IssuedCertificatesTabProps {
  siteId: "bkgalabovo" | "recoveryzone";
  certificates: IssuedCertificate[];
  isLoading: boolean;
  onRefresh: () => Promise<void>;
  onSwitchToIssue: () => void;
}

export function IssuedCertificatesTab({
  certificates,
  isLoading,
  onRefresh,
  onSwitchToIssue,
}: IssuedCertificatesTabProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedVoucherStatus, setSelectedVoucherStatus] =
    useState<string>("all");
  const [previewCert, setPreviewCert] = useState<IssuedCertificate | null>(
    null
  );
  const [redeemCert, setRedeemCert] = useState<IssuedCertificate | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingPng, setIsExportingPng] = useState(false);

  const handleExportPdf = async (cert: IssuedCertificate) => {
    setIsExportingPdf(true);
    try {
      const fileName = `${cert.serialNumber}_${cert.recipient.name}.pdf`;
      const orientation = cert.visualSnapshot.orientation || "landscape";
      const ok = await exportCertificatePdf(
        "printable-certificate",
        fileName,
        orientation
      );
      if (ok) {
        toast.success("PDF документът е изтеглен успешно!");
      } else {
        toast.error("Неуспешен PDF експорт.");
      }
    } catch (e) {
      console.error(e);
      toast.error("Грешка при PDF експорт.");
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleExportPng = async (cert: IssuedCertificate) => {
    setIsExportingPng(true);
    try {
      const fileName = `${cert.serialNumber}_${cert.recipient.name}.png`;
      const ok = await exportCertificatePng("printable-certificate", fileName);
      if (ok) {
        toast.success("High-res PNG изображението е изтеглено успешно!");
      } else {
        toast.error("Неуспешен PNG експорт.");
      }
    } catch (e) {
      console.error(e);
      toast.error("Грешка при PNG експорт.");
    } finally {
      setIsExportingPng(false);
    }
  };

  const handleCopyLink = (cert: IssuedCertificate) => {
    const url = `${window.location.origin}/cert/${cert.id}`;
    navigator.clipboard.writeText(url);
    setCopiedId(cert.id);
    toast.success(`Линкът за № ${cert.serialNumber} е копиран!`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = async (cert: IssuedCertificate) => {
    if (
      !confirm(
        `Сигурни ли сте, че искате да премахнете документ № ${cert.serialNumber} на ${cert.recipient.name}?`
      )
    ) {
      return;
    }

    try {
      setDeletingId(cert.id);
      await certificateIssuanceService.deleteIssuedCertificate(cert.id);
      toast.success(`Документ № ${cert.serialNumber} беше изтрит.`);
      await onRefresh();
    } catch (error) {
      console.error("Грешка при изтриване на документ:", error);
      toast.error("Възникна грешка при изтриването.");
    } finally {
      setDeletingId(null);
    }
  };

  // Filtered Certificates
  const filteredCertificates = useMemo(() => {
    return certificates.filter((cert) => {
      const matchesType = selectedType === "all" || cert.type === selectedType;
      const matchesVoucher =
        selectedVoucherStatus === "all" ||
        (cert.type === "voucher" &&
          cert.details.voucherStatus === selectedVoucherStatus);
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        searchQuery === "" ||
        cert.serialNumber.toLowerCase().includes(q) ||
        cert.recipient.name.toLowerCase().includes(q) ||
        (cert.recipient.institution &&
          cert.recipient.institution.toLowerCase().includes(q));
      return matchesType && matchesVoucher && matchesSearch;
    });
  }, [certificates, selectedType, selectedVoucherStatus, searchQuery]);

  // Statistics
  const stats = useMemo(() => {
    const total = certificates.length;
    const awards = certificates.filter((c) => c.type === "award").length;
    const vouchers = certificates.filter((c) => c.type === "voucher").length;
    const activeVouchers = certificates.filter(
      (c) => c.type === "voucher" && c.details.voucherStatus === "active"
    ).length;
    return { total, awards, vouchers, activeVouchers };
  }, [certificates]);

  return (
    <div className="space-y-6">
      {/* 1. Header KPI Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="rounded-3xl border-zinc-200/80 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold tracking-wider text-zinc-400 uppercase">
                Общо издадени
              </span>
              <div className="text-2xl font-black text-zinc-900 dark:text-white">
                {stats.total}
              </div>
            </div>
            <div className="flex size-10 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
              <FileCheck2 className="size-5" />
            </div>
          </div>
        </Card>

        <Card className="rounded-3xl border-zinc-200/80 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold tracking-wider text-zinc-400 uppercase">
                Издадени грамоти
              </span>
              <div className="text-2xl font-black text-blue-600 dark:text-blue-400">
                {stats.awards}
              </div>
            </div>
            <div className="flex size-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
              <Award className="size-5" />
            </div>
          </div>
        </Card>

        <Card className="rounded-3xl border-zinc-200/80 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold tracking-wider text-zinc-400 uppercase">
                Активни ваучери
              </span>
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                {stats.activeVouchers}
              </div>
            </div>
            <div className="flex size-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
              <Ticket className="size-5" />
            </div>
          </div>
        </Card>

        <Card className="rounded-3xl border-zinc-200/80 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold tracking-wider text-zinc-400 uppercase">
                Общо ваучери
              </span>
              <div className="text-2xl font-black text-amber-600 dark:text-amber-400">
                {stats.vouchers}
              </div>
            </div>
            <div className="flex size-10 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
              <Sparkles className="size-5" />
            </div>
          </div>
        </Card>
      </div>

      {/* 2. Filter Bar and Actions */}
      <Card className="rounded-3xl border-zinc-200/80 bg-white p-4 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
            {/* Search */}
            <div className="relative max-w-sm flex-1">
              <Search className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-zinc-400" />
              <Input
                placeholder="Търсене по сериен номер или име..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-10 rounded-2xl border-zinc-200 bg-zinc-50/50 pl-10 text-xs dark:border-zinc-800 dark:bg-zinc-950"
              />
            </div>

            {/* Type Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { id: "all", label: "🌟 Всички" },
                { id: "award", label: "🏆 Грамоти" },
                { id: "voucher", label: "🎟️ Ваучери" },
                { id: "certificate", label: "📜 Сертификати" },
              ].map((pill) => (
                <button
                  key={pill.id}
                  type="button"
                  onClick={() => setSelectedType(pill.id)}
                  className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                    selectedType === pill.id
                      ? "bg-zinc-900 text-white shadow-xs dark:bg-zinc-100 dark:text-zinc-900"
                      : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200/70 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                  }`}
                >
                  {pill.label}
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={isLoading}
              className="h-10 rounded-2xl border-zinc-200 text-xs font-semibold dark:border-zinc-800"
            >
              <RefreshCw
                className={`mr-1.5 size-3.5 ${isLoading ? "animate-spin" : ""}`}
              />
              Обнови
            </Button>

            <Button
              onClick={onSwitchToIssue}
              className="h-10 rounded-2xl bg-linear-to-r from-blue-600 to-indigo-600 px-4 text-xs font-bold text-white shadow-md shadow-blue-500/20 hover:from-blue-700 hover:to-indigo-700"
            >
              <Plus className="mr-1.5 size-4" />
              Издай нов документ
            </Button>
          </div>
        </div>
      </Card>

      {/* 3. Document Registry Table */}
      {isLoading ? (
        <div className="flex min-h-75 flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-zinc-200 bg-white p-8 dark:border-zinc-800 dark:bg-zinc-900">
          <Loader2 className="size-8 animate-spin text-blue-600" />
          <p className="text-sm font-semibold text-zinc-500">
            Зареждане на регистъра...
          </p>
        </div>
      ) : filteredCertificates.length === 0 ? (
        <div className="flex min-h-75 flex-col items-center justify-center gap-4 rounded-3xl border border-dashed border-zinc-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex size-16 items-center justify-center rounded-3xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
            <FileCheck2 className="size-8" />
          </div>
          <div className="max-w-md space-y-1">
            <h3 className="text-base font-bold text-zinc-900 dark:text-white">
              Няма издадени документи
            </h3>
            <p className="text-xs text-zinc-500">
              {searchQuery || selectedType !== "all"
                ? "Опитайте с други критерии за търсене."
                : "Все още няма издадени персонални грамоти или ваучери. Можете да издадете първия документ от таб „Издай документ“."}
            </p>
          </div>
          <Button
            onClick={onSwitchToIssue}
            className="mt-2 rounded-2xl bg-blue-600 text-xs font-bold text-white hover:bg-blue-700"
          >
            <Plus className="mr-1.5 size-4" />
            Издай първи документ
          </Button>
        </div>
      ) : (
        <Card className="overflow-hidden rounded-3xl border-zinc-200/80 bg-white shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-zinc-200 bg-zinc-50/70 text-[11px] font-bold tracking-wider text-zinc-500 uppercase dark:border-zinc-800 dark:bg-zinc-950">
                <tr>
                  <th className="py-3.5 pr-3 pl-6">Сериен № & QR</th>
                  <th className="px-3 py-3.5">Получател & Институция</th>
                  <th className="px-3 py-3.5">Тип & Отличие</th>
                  <th className="px-3 py-3.5">Дата на издаване</th>
                  <th className="px-3 py-3.5">Статус / Процедури</th>
                  <th className="py-3.5 pr-6 pl-3 text-right">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 font-medium dark:divide-zinc-800/80">
                {filteredCertificates.map((cert) => {
                  const isVoucher = cert.type === "voucher";
                  const total = cert.details.totalSessions || 1;
                  const used = cert.details.usedSessions || 0;
                  const remaining = Math.max(0, total - used);
                  const isFullyUsed =
                    cert.details.voucherStatus === "fully_used" ||
                    remaining === 0;

                  return (
                    <tr
                      key={cert.id}
                      className="transition-colors hover:bg-zinc-50/80 dark:hover:bg-zinc-800/50"
                    >
                      {/* Serial Number & QR Icon */}
                      <td className="py-4 pr-3 pl-6">
                        <div className="flex items-center gap-2.5">
                          <button
                            type="button"
                            onClick={() => setPreviewCert(cert)}
                            className="relative flex size-10 shrink-0 items-center justify-center rounded-xl border border-zinc-200 bg-white p-0.5 shadow-xs hover:border-blue-400 dark:border-zinc-800 dark:bg-zinc-950"
                            title="Кликнете за предварителен преглед"
                          >
                            {cert.qrCodeDataUrl ? (
                              <Image
                                src={cert.qrCodeDataUrl}
                                alt="QR"
                                width={36}
                                height={36}
                                className="size-full object-contain"
                                style={{ width: "auto", height: "auto" }}
                                unoptimized
                              />
                            ) : (
                              <QrCode className="size-5 text-zinc-400" />
                            )}
                          </button>
                          <div className="space-y-0.5">
                            <span className="font-mono font-bold text-zinc-900 dark:text-white">
                              {cert.serialNumber}
                            </span>
                            <div className="text-[10px] text-zinc-400">
                              {cert.visualSnapshot?.templateTitle}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Recipient & School */}
                      <td className="px-3 py-4">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5 font-bold text-zinc-900 dark:text-white">
                            <User className="size-3.5 text-zinc-400" />
                            <span>{cert.recipient.name}</span>
                          </div>
                          {cert.recipient.institution && (
                            <div className="text-[11px] text-zinc-500">
                              {cert.recipient.institution}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Type & Award Rank */}
                      <td className="px-3 py-4">
                        <div className="space-y-1">
                          <Badge
                            variant="outline"
                            className={`rounded-xl border px-2 py-0.5 text-[10px] font-bold ${
                              cert.type === "award"
                                ? "border-amber-300 bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                                : cert.type === "voucher"
                                  ? "border-teal-300 bg-teal-50 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300"
                                  : "border-blue-300 bg-blue-50 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300"
                            }`}
                          >
                            {getCertificateTypeLabel(cert.type)}
                          </Badge>

                          {cert.type === "award" && cert.details.rank && (
                            <div className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300">
                              {getRankLabel(cert.details.rank)}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Date */}
                      <td className="px-3 py-4">
                        <div className="text-zinc-600 dark:text-zinc-300">
                          {new Date(cert.issuedAt).toLocaleDateString("bg-BG")}
                        </div>
                        <div className="text-[10px] text-zinc-400">
                          {cert.issuedByName || "Администратор"}
                        </div>
                      </td>

                      {/* Voucher Sessions / Status */}
                      <td className="px-3 py-4">
                        {isVoucher ? (
                          <div className="min-w-[130px] space-y-1.5">
                            <div className="flex items-center justify-between text-[11px]">
                              <span
                                className={`font-bold ${
                                  isFullyUsed
                                    ? "text-zinc-400"
                                    : "text-amber-600 dark:text-amber-400"
                                }`}
                              >
                                {isFullyUsed
                                  ? "Изразходен"
                                  : `${remaining} от ${total} оставащи`}
                              </span>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setRedeemCert(cert)}
                                disabled={isFullyUsed}
                                className="h-6 rounded-lg border-amber-300/80 px-2 text-[10px] font-bold text-amber-700 hover:bg-amber-50 dark:border-amber-800 dark:text-amber-300"
                              >
                                Отчети
                              </Button>
                            </div>

                            {/* Mini progress bar */}
                            <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
                              <div
                                className="h-full rounded-full bg-linear-to-r from-amber-500 to-emerald-500"
                                style={{
                                  width: `${Math.min(100, (used / total) * 100)}%`,
                                }}
                              />
                            </div>
                          </div>
                        ) : (
                          <Badge
                            variant="outline"
                            className="rounded-xl border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                          >
                            <CheckCircle2 className="mr-1 size-3" />
                            Валиден
                          </Badge>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-4 pr-6 pl-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* Preview Modal Button */}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setPreviewCert(cert)}
                            className="size-8 rounded-xl text-zinc-500 hover:bg-zinc-200/60 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-white"
                            title="Преглед на документа"
                          >
                            <Eye className="size-3.5" />
                          </Button>

                          {/* Copy Link Button */}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleCopyLink(cert)}
                            className="size-8 rounded-xl text-zinc-500 hover:bg-zinc-200/60 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-white"
                            title="Копирай линк"
                          >
                            {copiedId === cert.id ? (
                              <Check className="size-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="size-3.5" />
                            )}
                          </Button>

                          {/* Public Page Link */}
                          <a
                            href={`/cert/${cert.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex size-8 items-center justify-center rounded-xl text-zinc-500 hover:bg-zinc-200/60 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-white"
                            title="Отвори публичната страница"
                          >
                            <ExternalLink className="size-3.5" />
                          </a>

                          {/* Delete Button */}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(cert)}
                            disabled={deletingId === cert.id}
                            className="size-8 rounded-xl text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/50"
                            title="Изтриване от регистъра"
                          >
                            {deletingId === cert.id ? (
                              <Loader2 className="size-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="size-3.5" />
                            )}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Full Document Preview Modal */}
      <Dialog
        open={Boolean(previewCert)}
        onOpenChange={(open) => !open && setPreviewCert(null)}
      >
        <DialogContent className="max-w-5xl rounded-3xl border-zinc-200 p-6 dark:border-zinc-800">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2 text-lg font-bold text-zinc-900 dark:text-white">
                <FileCheck2 className="size-5 text-blue-600" />
                <span>Документ № {previewCert?.serialNumber}</span>
              </DialogTitle>
              {previewCert && (
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => printCertificate()}
                    className="gap-1.5 rounded-xl border-zinc-200 text-xs font-bold dark:border-zinc-800"
                  >
                    <Printer className="size-3.5" />
                    Принтирай
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleExportPdf(previewCert)}
                    disabled={isExportingPdf}
                    className="gap-1.5 rounded-xl border-zinc-200 text-xs font-bold dark:border-zinc-800"
                  >
                    {isExportingPdf ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <FileDown className="size-3.5" />
                    )}
                    PDF
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleExportPng(previewCert)}
                    disabled={isExportingPng}
                    className="gap-1.5 rounded-xl bg-zinc-900 text-xs font-bold text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900"
                  >
                    {isExportingPng ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Download className="size-3.5" />
                    )}
                    PNG
                  </Button>
                </div>
              )}
            </div>
          </DialogHeader>

          {previewCert && (
            <div className="flex flex-col items-center justify-center py-2">
              <div className="flex w-full items-center justify-center overflow-hidden">
                <CertificateDocumentPreview
                  data={{
                    siteId: previewCert.siteId,
                    type: previewCert.type,
                    title: previewCert.visualSnapshot.templateTitle,
                    visualConfig: previewCert.visualSnapshot,
                    serialNumber: previewCert.serialNumber,
                    qrCodeDataUrl: previewCert.qrCodeDataUrl,
                    recipientName: previewCert.recipient.name,
                    recipientInstitution: previewCert.recipient.institution,
                    rank: previewCert.details.rank,
                    nomination: previewCert.details.nomination,
                    eventTitle: previewCert.details.eventTitle,
                    eventDate: previewCert.details.eventDate,
                    eventLocation: previewCert.details.eventLocation,
                    totalSessions: previewCert.details.totalSessions,
                    remainingSessions: previewCert.details.remainingSessions,
                    validUntil: previewCert.details.validUntil,
                    skillsSummary: previewCert.details.skillsSummary,
                    hoursTrained: previewCert.details.hoursTrained,
                    sponsors: previewCert.visualSnapshot.sponsors.map(
                      (s, idx) => ({
                        id: `snap_${idx}`,
                        siteId: previewCert.siteId,
                        name: s.name,
                        category: "general",
                        logoUrl: s.logoUrl,
                        websiteUrl: s.websiteUrl,
                        isActive: true,
                        order: idx,
                        createdAt: previewCert.issuedAt,
                      })
                    ),
                  }}
                />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Redeem Voucher Modal */}
      <RedeemVoucherDialog
        open={Boolean(redeemCert)}
        onOpenChange={(open) => !open && setRedeemCert(null)}
        certificate={redeemCert}
        onRedeemed={onRefresh}
      />
    </div>
  );
}
