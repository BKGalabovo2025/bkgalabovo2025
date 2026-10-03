/* eslint-disable react/forbid-dom-props, sonarjs/no-nested-conditional, sonarjs/cognitive-complexity, @next/next/no-img-element, @typescript-eslint/no-unused-vars, sonarjs/no-unused-vars, sonarjs/no-dead-store */
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
  Share2,
  Sparkles,
  Ticket,
  Trash2,
  User,
  UserCheck,
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
  exportBatchMultiCertificatePdf,
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
import { ShareCertificateDialog } from "./ShareCertificateDialog";

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
  const [shareCert, setShareCert] = useState<IssuedCertificate | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingPng, setIsExportingPng] = useState(false);

  // Multi-select for Batch Printing
  const [selectedCertIds, setSelectedCertIds] = useState<string[]>([]);
  const [isBatchPrinting, setIsBatchPrinting] = useState(false);

  // Quick Voucher Scanner input
  const [voucherScanQuery, setVoucherScanQuery] = useState("");

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
      setSelectedCertIds((prev) => prev.filter((id) => id !== cert.id));
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

  // Selection logic
  const handleToggleSelectAll = () => {
    if (selectedCertIds.length === filteredCertificates.length) {
      setSelectedCertIds([]);
    } else {
      setSelectedCertIds(filteredCertificates.map((c) => c.id));
    }
  };

  const handleToggleCert = (id: string) => {
    setSelectedCertIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // Batch Print Selected
  const handleBatchPrint = async () => {
    if (selectedCertIds.length === 0) {
      toast.error("Моля, изберете поне един сертификат за печат.");
      return;
    }

    setIsBatchPrinting(true);
    const toastId = toast.loading("Подготовка на документите за печат...");
    try {
      const elements: HTMLElement[] = [];
      for (const id of selectedCertIds) {
        const el = document.getElementById(`batch-cert-${id}`);
        if (el) elements.push(el);
      }

      if (elements.length === 0) {
        toast.error("Грешка при зареждане на шаблоните за печат.", {
          id: toastId,
        });
        return;
      }

      const ok = await exportBatchMultiCertificatePdf(
        elements,
        `грамоти_пакет_${new Date().toISOString().slice(0, 10)}.pdf`,
        "landscape",
        (curr, tot) => {
          toast.loading(`Генериране на страница ${curr} от ${tot}...`, {
            id: toastId,
          });
        }
      );

      if (ok) {
        toast.success(
          `Успешно генериран общ PDF с ${elements.length} страници!`,
          { id: toastId }
        );
      } else {
        toast.error("Възникна грешка при създаването на PDF.", { id: toastId });
      }
    } catch (e) {
      console.error(e);
      toast.error("Грешка при масов печат.", { id: toastId });
    } finally {
      setIsBatchPrinting(false);
    }
  };

  // Quick Voucher Redeem Search
  const handleVoucherScanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!voucherScanQuery.trim()) return;
    const clean = voucherScanQuery.trim().toLowerCase();
    const found = certificates.find(
      (c) =>
        c.type === "voucher" &&
        (c.serialNumber.toLowerCase() === clean ||
          c.details.voucherPromoCode?.toLowerCase() === clean)
    );

    if (found) {
      setRedeemCert(found);
      setVoucherScanQuery("");
    } else {
      toast.error(`Не е намерен активен ваучер с код/№ "${voucherScanQuery}".`);
    }
  };

  return (
    <div className="space-y-3 sm:space-y-3.5">
      {/* 1. Header KPI Cards */}
      <div className="grid grid-cols-2 gap-2 sm:gap-2.5 lg:grid-cols-4">
        <Card className="rounded-xl sm:rounded-2xl border-zinc-200/80 bg-white p-2.5 sm:p-3 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold tracking-wider text-zinc-400 uppercase">
                Общо издадени
              </span>
              <div className="text-base sm:text-lg font-black text-zinc-900 dark:text-white">
                {stats.total}
              </div>
            </div>
            <div className="flex size-7.5 sm:size-8 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
              <FileCheck2 className="size-3.5 sm:size-4" />
            </div>
          </div>
        </Card>

        <Card className="rounded-xl sm:rounded-2xl border-zinc-200/80 bg-white p-2.5 sm:p-3 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold tracking-wider text-zinc-400 uppercase">
                Издадени грамоти
              </span>
              <div className="text-base sm:text-lg font-black text-blue-600 dark:text-blue-400">
                {stats.awards}
              </div>
            </div>
            <div className="flex size-7.5 sm:size-8 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
              <Award className="size-3.5 sm:size-4" />
            </div>
          </div>
        </Card>

        <Card className="rounded-xl sm:rounded-2xl border-zinc-200/80 bg-white p-2.5 sm:p-3 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold tracking-wider text-zinc-400 uppercase">
                Активни ваучери
              </span>
              <div className="text-base sm:text-lg font-black text-emerald-600 dark:text-emerald-400">
                {stats.activeVouchers}
              </div>
            </div>
            <div className="flex size-7.5 sm:size-8 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
              <Ticket className="size-3.5 sm:size-4" />
            </div>
          </div>
        </Card>

        <Card className="rounded-xl sm:rounded-2xl border-zinc-200/80 bg-white p-2.5 sm:p-3 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold tracking-wider text-zinc-400 uppercase">
                Общо ваучери
              </span>
              <div className="text-base sm:text-lg font-black text-amber-600 dark:text-amber-400">
                {stats.vouchers}
              </div>
            </div>
            <div className="flex size-7.5 sm:size-8 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
              <Sparkles className="size-3.5 sm:size-4" />
            </div>
          </div>
        </Card>
      </div>

      {/* 2. Filter Bar, Quick Scanner and Actions */}
      <Card className="space-y-2.5 rounded-xl sm:rounded-2xl border-zinc-200/80 bg-white p-2.5 sm:p-3 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-col gap-2.5 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
            {/* Search */}
            <div className="relative w-full max-w-xs sm:max-w-sm">
              <Search className="absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-zinc-400" />
              <Input
                placeholder="Търсене по сериен номер или име..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8.5 w-full rounded-xl border-zinc-200 bg-zinc-50/50 pl-9 text-xs dark:border-zinc-800 dark:bg-zinc-950"
              />
            </div>

            {/* Type Filter Pills */}
            <div className="flex flex-wrap items-center gap-1">
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
                  className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
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
          <div className="flex w-full sm:w-auto items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={isLoading}
              className="h-8.5 flex-1 sm:flex-initial rounded-xl border-zinc-200 text-xs font-semibold dark:border-zinc-800"
            >
              <RefreshCw
                className={`mr-1.5 size-3.5 ${isLoading ? "animate-spin" : ""}`}
              />
              Обнови
            </Button>

            <Button
              onClick={onSwitchToIssue}
              className="h-8.5 flex-1 sm:flex-initial rounded-xl bg-linear-to-r from-blue-600 to-indigo-600 px-3 text-xs font-bold text-white shadow-xs hover:from-blue-700 hover:to-indigo-700"
            >
              <Plus className="mr-1.5 size-3.5" />
              Издай нов
            </Button>
          </div>
        </div>

        {/* Quick Voucher Scanner Sub-bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-zinc-100 pt-2 dark:border-zinc-800/80">
          <form
            onSubmit={handleVoucherScanSubmit}
            className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto"
          >
            <div className="relative w-full sm:w-64">
              <QrCode className="absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-amber-500" />
              <Input
                placeholder="🎟️ Сканирай код или въведи №..."
                value={voucherScanQuery}
                onChange={(e) => setVoucherScanQuery(e.target.value)}
                className="h-8 w-full rounded-lg border-amber-200/70 bg-amber-50/30 pl-7 text-xs font-mono dark:border-amber-900/40 dark:bg-amber-950/20"
              />
            </div>
            <Button
              type="submit"
              size="sm"
              variant="outline"
              className="h-8 w-full sm:w-auto rounded-lg border-amber-300 text-xs font-bold text-amber-800 hover:bg-amber-100 dark:border-amber-800 dark:text-amber-300"
            >
              Осребри бързо
            </Button>
          </form>

          {/* Batch Print Action when items selected */}
          {selectedCertIds.length > 0 && (
            <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2 w-full sm:w-auto">
              <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                Избрани {selectedCertIds.length} от{" "}
                {filteredCertificates.length}
              </span>
              <Button
                onClick={handleBatchPrint}
                disabled={isBatchPrinting}
                size="sm"
                className="h-8 gap-1.5 rounded-lg bg-linear-to-r from-blue-600 to-indigo-600 px-3 text-xs font-bold text-white shadow-xs hover:from-blue-700 hover:to-indigo-700"
              >
                {isBatchPrinting ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <FileDown className="size-3.5" />
                )}
                Масов PDF печат ({selectedCertIds.length})
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedCertIds([])}
                className="h-8 rounded-lg text-xs text-zinc-500"
              >
                Отмаркирай
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* 3. Document Registry Table */}
      {isLoading ? (
        <div className="flex min-h-60 flex-col items-center justify-center gap-2.5 rounded-2xl border border-dashed border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <Loader2 className="size-7 animate-spin text-blue-600" />
          <p className="text-xs font-semibold text-zinc-500">
            Зареждане на регистъра...
          </p>
        </div>
      ) : filteredCertificates.length === 0 ? (
        <div className="flex min-h-60 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-zinc-200 bg-white p-6 text-center dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
            <FileCheck2 className="size-6" />
          </div>
          <div className="max-w-md space-y-1">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-white">
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
            className="h-8.5 rounded-xl bg-blue-600 px-3 text-xs font-bold text-white shadow-xs hover:bg-blue-700"
          >
            <Plus className="mr-1.5 size-3.5" />
            Издай първи документ
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Mobile Select-all Bar */}
          <div className="flex md:hidden items-center justify-between rounded-xl border border-zinc-200/80 bg-white px-3 py-2 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900">
            <label className="flex items-center gap-2 text-xs font-bold text-zinc-700 dark:text-zinc-300 cursor-pointer">
              <input
                type="checkbox"
                checked={
                  filteredCertificates.length > 0 &&
                  selectedCertIds.length === filteredCertificates.length
                }
                onChange={handleToggleSelectAll}
                className="size-3.5 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
              />
              <span>Избери всички ({filteredCertificates.length})</span>
            </label>
            {selectedCertIds.length > 0 && (
              <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                Избрани: {selectedCertIds.length}
              </span>
            )}
          </div>

          {/* 1. Mobile Cards View (Phones & Small screens) */}
          <div className="grid grid-cols-1 gap-2.5 md:hidden">
            {filteredCertificates.map((cert) => {
              const isVoucher = cert.type === "voucher";
              const total = cert.details.totalSessions || 1;
              const used = cert.details.usedSessions || 0;
              const remaining = Math.max(0, total - used);
              const isFullyUsed =
                cert.details.voucherStatus === "fully_used" || remaining === 0;
              const isSelected = selectedCertIds.includes(cert.id);

              return (
                <div
                  key={`mobile-${cert.id}`}
                  className={`rounded-2xl border p-2.5 sm:p-3 transition-all shadow-xs space-y-2 ${
                    isSelected
                      ? "border-blue-300 bg-blue-50/40 dark:border-blue-800 dark:bg-blue-950/20"
                      : "border-zinc-200/90 bg-white dark:border-zinc-800 dark:bg-zinc-900"
                  }`}
                >
                  {/* Top Bar: Checkbox + Serial Number + Type Badge */}
                  <div className="flex items-center justify-between gap-2 border-b border-zinc-100 pb-2 dark:border-zinc-800">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleCert(cert.id)}
                        className="size-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => setPreviewCert(cert)}
                        className="flex items-center gap-1 text-left group"
                      >
                        <span className="font-mono text-xs font-black text-blue-600 group-hover:underline dark:text-blue-400">
                          {cert.serialNumber}
                        </span>
                        {cert.uploadedDocument && (
                          <Badge
                            variant="outline"
                            className="rounded-md border-blue-200 bg-blue-50/70 px-1 py-0 text-[8px] font-bold text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-300"
                          >
                            📎{" "}
                            {cert.uploadedDocument.fileType === "pdf"
                              ? "PDF"
                              : "Снимка"}
                          </Badge>
                        )}
                      </button>
                    </div>

                    <Badge
                      variant="outline"
                      className={`rounded-lg border px-1.5 py-0.5 text-[9px] font-bold ${
                        cert.type === "award"
                          ? "border-amber-300 bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                          : cert.type === "voucher"
                            ? "border-teal-300 bg-teal-50 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300"
                            : "border-blue-300 bg-blue-50 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300"
                      }`}
                    >
                      {getCertificateTypeLabel(cert.type)}
                    </Badge>
                  </div>

                  {/* Recipient & Institution - 100% full text visible */}
                  <div className="space-y-0.5">
                    <div className="flex items-start gap-1.5 text-xs sm:text-sm font-bold text-zinc-900 dark:text-white wrap-break-word">
                      <User className="size-3.5 text-zinc-400 shrink-0 mt-0.5" />
                      <span className="wrap-break-word">
                        {cert.recipient.name}
                      </span>
                    </div>
                    {cert.recipient.institution && (
                      <p className="text-[11px] text-blue-700 dark:text-blue-400 font-semibold pl-5 wrap-break-word">
                        {cert.recipient.institution}
                      </p>
                    )}
                    <div className="text-[10px] text-zinc-400 pl-5 pt-0.5 wrap-break-word">
                      Издаден на{" "}
                      {new Date(cert.issuedAt).toLocaleDateString("bg-BG")} •{" "}
                      {cert.details.voucherServiceType ||
                        cert.visualSnapshot?.templateTitle ||
                        "Официален документ"}
                    </div>
                  </div>

                  {/* Voucher Sessions and Quick Redeem (if voucher) */}
                  {isVoucher && (
                    <div className="rounded-xl border border-amber-200/70 bg-amber-50/40 p-2 space-y-1.5 dark:border-amber-900/40 dark:bg-amber-950/20">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-amber-900 dark:text-amber-300 text-[11px]">
                          {isFullyUsed
                            ? "Всички тренировки са отчетени"
                            : `${remaining} от ${total} оставащи тренировки`}
                        </span>
                        <span className="text-[10px] font-semibold text-zinc-500">
                          {Math.round((used / total) * 100)}%
                        </span>
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

                      <Button
                        size="sm"
                        onClick={() => setRedeemCert(cert)}
                        disabled={isFullyUsed}
                        className="h-7.5 w-full rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs"
                      >
                        <UserCheck className="mr-1.5 size-3.5" />
                        {isFullyUsed
                          ? "Напълно изразходен"
                          : "Отчети тренировка / присъствие"}
                      </Button>
                    </div>
                  )}

                  {/* Action Bar */}
                  <div className="grid grid-cols-4 gap-1 pt-1 border-t border-zinc-100 dark:border-zinc-800">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShareCert(cert)}
                      className="h-7.5 rounded-lg text-blue-600 border-zinc-200 hover:bg-blue-50 text-[10px] font-bold dark:border-zinc-800"
                      title="Сподели"
                    >
                      <Share2 className="mr-1 size-3" />
                      Сподели
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPreviewCert(cert)}
                      className="h-7.5 rounded-lg text-zinc-700 border-zinc-200 hover:bg-zinc-100 text-[10px] font-bold dark:border-zinc-800 dark:text-zinc-300"
                      title="Преглед"
                    >
                      <Eye className="mr-1 size-3" />
                      Преглед
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopyLink(cert)}
                      className="h-7.5 rounded-lg text-zinc-700 border-zinc-200 hover:bg-zinc-100 text-[10px] font-bold dark:border-zinc-800 dark:text-zinc-300"
                      title="Копирай линк"
                    >
                      {copiedId === cert.id ? (
                        <>
                          <Check className="mr-1 size-3 text-emerald-600" />
                          ОК
                        </>
                      ) : (
                        <>
                          <Copy className="mr-1 size-3" />
                          Линк
                        </>
                      )}
                    </Button>

                    <a
                      href={`/cert/${cert.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-7.5 items-center justify-center gap-1 rounded-lg border border-zinc-200 bg-white text-[10px] font-bold text-zinc-700 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
                      title="Отвори публично"
                    >
                      <ExternalLink className="size-3" />
                      Отвори
                    </a>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 2. Desktop Table View (>= md) */}
          <Card className="hidden md:block overflow-hidden rounded-2xl border-zinc-200/80 bg-white shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-zinc-200 bg-zinc-50/70 text-[10px] sm:text-[11px] font-bold tracking-wider text-zinc-500 uppercase dark:border-zinc-800 dark:bg-zinc-950">
                  <tr>
                    <th className="py-2.5 pr-2 pl-3 w-8 text-center">
                      <input
                        type="checkbox"
                        checked={
                          filteredCertificates.length > 0 &&
                          selectedCertIds.length === filteredCertificates.length
                        }
                        onChange={handleToggleSelectAll}
                        className="size-3.5 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                      />
                    </th>
                    <th className="min-w-35 p-2.5">Сериен № & QR</th>
                    <th className="min-w-45 p-2.5">Получател & Институция</th>
                    <th className="min-w-30 p-2.5">Тип & Отличие</th>
                    <th className="min-w-[105px] p-2.5">Дата на издаване</th>
                    <th className="min-w-[130px] p-2.5">Статус / Процедури</th>
                    <th className="py-2.5 pr-3 pl-2 text-right min-w-[105px]">
                      Действия
                    </th>
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
                    const isSelected = selectedCertIds.includes(cert.id);

                    return (
                      <tr
                        key={cert.id}
                        className={`transition-colors ${
                          isSelected
                            ? "bg-blue-50/50 dark:bg-blue-950/20"
                            : "hover:bg-zinc-50/80 dark:hover:bg-zinc-800/50"
                        }`}
                      >
                        {/* Checkbox */}
                        <td className="py-2 pr-2 pl-3 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleCert(cert.id)}
                            className="size-3.5 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                          />
                        </td>

                        {/* Serial Number & QR Icon */}
                        <td className="px-2.5 py-2">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setPreviewCert(cert)}
                              className="relative flex size-8 shrink-0 items-center justify-center rounded-lg border border-zinc-200 bg-white p-0.5 shadow-xs hover:border-blue-400 dark:border-zinc-800 dark:bg-zinc-950"
                              title="Кликнете за предварителен преглед"
                            >
                              {cert.qrCodeDataUrl ? (
                                <Image
                                  src={cert.qrCodeDataUrl}
                                  alt="QR"
                                  width={28}
                                  height={28}
                                  className="size-full object-contain"
                                  style={{ width: "auto", height: "auto" }}
                                  unoptimized
                                />
                              ) : (
                                <QrCode className="size-4 text-zinc-400" />
                              )}
                            </button>
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-1">
                                <span className="font-mono text-xs font-bold text-zinc-900 dark:text-white whitespace-nowrap">
                                  {cert.serialNumber}
                                </span>
                                {cert.uploadedDocument && (
                                  <Badge
                                    variant="outline"
                                    className="rounded border-blue-200 bg-blue-50/70 px-1 py-0 text-[8px] font-bold text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-300"
                                  >
                                    📎{" "}
                                    {cert.uploadedDocument.fileType === "pdf"
                                      ? "PDF"
                                      : "Снимка"}
                                  </Badge>
                                )}
                              </div>
                              <div className="text-[10px] text-zinc-400 wrap-break-word">
                                {cert.visualSnapshot?.templateTitle}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Recipient & School - 100% full text visible */}
                        <td className="px-2.5 py-2">
                          <div className="space-y-0.5">
                            <div className="flex items-start gap-1 font-bold text-zinc-900 dark:text-white wrap-break-word">
                              <User className="size-3 text-zinc-400 shrink-0 mt-0.5" />
                              <span className="wrap-break-word">
                                {cert.recipient.name}
                              </span>
                            </div>
                            {cert.recipient.institution && (
                              <div className="text-[10px] sm:text-[11px] font-semibold text-blue-700 dark:text-blue-400 wrap-break-word pl-4">
                                {cert.recipient.institution}
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Type & Award Rank */}
                        <td className="px-2.5 py-2">
                          <div className="space-y-0.5">
                            <Badge
                              variant="outline"
                              className={`rounded-lg border px-1.5 py-0 text-[9px] font-bold ${
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
                              <div className="text-[10px] font-bold text-zinc-700 dark:text-zinc-300">
                                {getRankLabel(cert.details.rank)}
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Date */}
                        <td className="px-2.5 py-2">
                          <div className="text-[11px] text-zinc-700 dark:text-zinc-300 whitespace-nowrap">
                            {new Date(cert.issuedAt).toLocaleDateString(
                              "bg-BG"
                            )}
                          </div>
                          <div className="text-[10px] text-zinc-400 wrap-break-word">
                            {cert.issuedByName || "Администратор"}
                          </div>
                        </td>

                        {/* Voucher Sessions / Status */}
                        <td className="px-2.5 py-2">
                          {isVoucher ? (
                            <div className="min-w-30 space-y-1">
                              <div className="flex items-center justify-between text-[10px]">
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
                                  className="h-5 rounded-md border-amber-300/80 px-1.5 text-[9px] font-bold text-amber-700 hover:bg-amber-50 dark:border-amber-800 dark:text-amber-300"
                                >
                                  Отчети
                                </Button>
                              </div>

                              {/* Mini progress bar */}
                              <div className="h-1 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
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
                              className="rounded-lg border-emerald-200 bg-emerald-50 px-1.5 py-0 text-[9px] font-bold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                            >
                              <CheckCircle2 className="mr-0.5 size-2.5" />
                              Валиден
                            </Badge>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-2 pr-3 pl-2 text-right">
                          <div className="flex items-center justify-end gap-0.5">
                            {/* Share Button */}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setShareCert(cert)}
                              className="size-7 rounded-lg text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/50"
                              title="Дигитално споделяне (Viber, WhatsApp, Email)"
                            >
                              <Share2 className="size-3" />
                            </Button>

                            {/* Preview Modal Button */}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setPreviewCert(cert)}
                              className="size-7 rounded-lg text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-white"
                              title="Преглед на документа"
                            >
                              <Eye className="size-3" />
                            </Button>

                            {/* Copy Link Button */}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleCopyLink(cert)}
                              className="size-7 rounded-lg text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-white"
                              title="Копирай публичен линк"
                            >
                              {copiedId === cert.id ? (
                                <Check className="size-3 text-emerald-600" />
                              ) : (
                                <Copy className="size-3" />
                              )}
                            </Button>

                            {/* Public Page Link */}
                            <a
                              href={`/cert/${cert.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex size-7 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-white"
                              title="Отвори страница за проверка"
                            >
                              <ExternalLink className="size-3" />
                            </a>

                            {/* Delete Button */}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(cert)}
                              disabled={deletingId === cert.id}
                              className="size-7 rounded-lg text-zinc-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/50"
                              title="Изтриване от регистъра"
                            >
                              {deletingId === cert.id ? (
                                <Loader2 className="size-3 animate-spin" />
                              ) : (
                                <Trash2 className="size-3" />
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
        </div>
      )}

      {/* Hidden batch render container for multi-page PDF generation */}
      <div className="fixed left-[-9999px] top-0 pointer-events-none opacity-0">
        {selectedCertIds.map((id) => {
          const cert = certificates.find((c) => c.id === id);
          if (!cert) return null;
          return (
            <div key={`render_${id}`} id={`batch-cert-${id}`}>
              <CertificateDocumentPreview
                data={{
                  siteId: cert.siteId,
                  type: cert.type,
                  title: cert.visualSnapshot?.templateTitle || "Грамота",
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
                  sponsors: cert.visualSnapshot.sponsors.map((s, idx) => ({
                    id: `snap_${idx}`,
                    siteId: cert.siteId,
                    name: s.name,
                    category: "general",
                    logoUrl: s.logoUrl,
                    websiteUrl: s.websiteUrl,
                    isActive: true,
                    order: idx,
                    createdAt: cert.issuedAt,
                  })),
                }}
              />
            </div>
          );
        })}
      </div>

      {/* Full Document Preview Modal */}
      <Dialog
        open={Boolean(previewCert)}
        onOpenChange={(open) => !open && setPreviewCert(null)}
      >
        <DialogContent className="max-h-[92vh] max-w-5xl overflow-y-auto rounded-2xl border-zinc-200 p-3.5 sm:p-5 dark:border-zinc-800">
          <DialogHeader>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <DialogTitle className="flex items-center gap-2 text-base sm:text-lg font-bold text-zinc-900 dark:text-white">
                <FileCheck2 className="size-4.5 text-blue-600" />
                <span className="wrap-break-word">
                  Документ № {previewCert?.serialNumber}
                </span>
              </DialogTitle>
              {previewCert && (
                <div className="flex flex-wrap items-center gap-1.5">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => printCertificate()}
                    className="h-8 gap-1 rounded-lg border-zinc-200 text-xs font-bold dark:border-zinc-800"
                  >
                    <Printer className="size-3" />
                    Принтирай
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleExportPdf(previewCert)}
                    disabled={isExportingPdf}
                    className="h-8 gap-1 rounded-lg border-zinc-200 text-xs font-bold dark:border-zinc-800"
                  >
                    {isExportingPdf ? (
                      <Loader2 className="size-3 animate-spin" />
                    ) : (
                      <FileDown className="size-3" />
                    )}
                    PDF
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleExportPng(previewCert)}
                    disabled={isExportingPng}
                    className="h-8 gap-1 rounded-lg bg-zinc-900 text-xs font-bold text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900"
                  >
                    {isExportingPng ? (
                      <Loader2 className="size-3 animate-spin" />
                    ) : (
                      <Download className="size-3" />
                    )}
                    PNG
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShareCert(previewCert)}
                    className="h-8 gap-1 rounded-lg border-blue-200 text-xs font-bold text-blue-700 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-300"
                  >
                    <Share2 className="size-3" />
                    Сподели
                  </Button>
                </div>
              )}
            </div>
          </DialogHeader>

          {previewCert && (
            <div className="flex flex-col items-center justify-center py-2">
              {previewCert.uploadedDocument ? (
                <div className="w-full space-y-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-950">
                  {/* Branding Header in Preview */}
                  <div className="flex flex-col gap-3 border-b border-zinc-100 pb-3 sm:flex-row sm:items-center sm:justify-between dark:border-zinc-800">
                    <div className="flex items-center gap-2.5">
                      <div className="relative size-10 shrink-0 overflow-hidden rounded-xl border border-zinc-200 bg-white p-1 dark:border-zinc-800">
                        <Image
                          src={
                            previewCert.branding?.clubLogoUrl ||
                            (previewCert.siteId === "recoveryzone"
                              ? "/recovery-zone/rz-icon-square.png"
                              : "/icons/badge-option-3-light-squircle.png")
                          }
                          alt="Club"
                          width={36}
                          height={36}
                          className="size-full object-contain"
                          unoptimized
                        />
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-zinc-900 dark:text-white">
                          {previewCert.siteId === "recoveryzone"
                            ? "Recovery Zone by ZM"
                            : "БАДМИНТОН КЛУБ ГЪЛЪБОВО"}
                        </h4>
                        <p className="text-[10px] text-zinc-400">
                          {previewCert.recipient.institution ||
                            "Клубен партньор"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <a
                        href={previewCert.uploadedDocument.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 rounded-xl bg-zinc-100 px-3 py-1.5 text-xs font-bold text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-200"
                      >
                        <ExternalLink className="size-3" />
                        Отвори файл
                      </a>
                      <a
                        href={previewCert.uploadedDocument.fileUrl}
                        download={
                          previewCert.uploadedDocument.fileName || "document"
                        }
                        className="inline-flex items-center gap-1 rounded-xl bg-blue-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-700"
                      >
                        <Download className="size-3" />
                        Свали
                      </a>
                    </div>
                  </div>

                  {/* Recipient & Metadata */}
                  <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div>
                      <span className="text-[10px] font-bold text-zinc-400 uppercase">
                        Получател:{" "}
                      </span>
                      <span className="font-bold text-zinc-900 dark:text-white">
                        {previewCert.recipient.name}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-zinc-400 uppercase">
                        Предназначение:{" "}
                      </span>
                      <span className="font-bold text-blue-600 dark:text-blue-400">
                        {previewCert.details.voucherServiceType ||
                          previewCert.visualSnapshot.templateTitle}
                      </span>
                    </div>
                    {previewCert.type === "voucher" && (
                      <div>
                        <span className="text-[10px] font-bold text-zinc-400 uppercase">
                          Оставащи:{" "}
                        </span>
                        <span className="font-bold text-amber-600 dark:text-amber-400">
                          {Math.max(
                            0,
                            (previewCert.details.totalSessions || 1) -
                              (previewCert.details.usedSessions || 0)
                          )}{" "}
                          от {previewCert.details.totalSessions || 1}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Document Viewer Frame */}
                  <div className="overflow-hidden rounded-xl border border-zinc-200 bg-zinc-950 dark:border-zinc-800">
                    {previewCert.uploadedDocument.fileType === "pdf" ? (
                      <iframe
                        src={previewCert.uploadedDocument.fileUrl}
                        title="PDF Документ"
                        className="h-125 w-full border-0 bg-white"
                      />
                    ) : (
                      <div className="flex max-h-[550px] w-full items-center justify-center p-3">
                        <img
                          src={previewCert.uploadedDocument.fileUrl}
                          alt="Документ"
                          className="max-h-125 w-auto rounded-lg object-contain"
                        />
                      </div>
                    )}
                  </div>
                </div>
              ) : (
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
              )}
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

      {/* Digital Share Modal */}
      <ShareCertificateDialog
        open={Boolean(shareCert)}
        onOpenChange={(open) => !open && setShareCert(null)}
        certificate={shareCert}
      />
    </div>
  );
}
