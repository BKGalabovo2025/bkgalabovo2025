"use client";

import { ArrowLeft, Calendar, Download, Loader2, Printer } from "lucide-react";
import React, { useState } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/layout/page-header";
import { useMemberBackNavigation } from "@/components/members/documents/useMemberBackNavigation";
import { Button } from "@/components/ui/button";
import { generatePdfFromElement } from "@/lib/html-to-pdf";
import { cn } from "@/lib/utils";

interface PrintableDocumentShellProps {
  memberId: string;
  memberName: string;
  documentTitle: string;
  backFallbackHref?: string;
  onBack?: () => void;
  toolbarActions?: React.ReactNode;
  dateValue?: string;
  onDateChange?: (value: string) => void;
  dateLabel?: string;
  screenHint?: React.ReactNode;
  printButtonLabel?: string;
  pdfElementRef?: React.RefObject<HTMLElement | null>;
  pdfFileName?: string;
  pdfOrientation?: "portrait" | "landscape";
  printPageMargin?: string;
  printFontSize?: string;
  printLineHeight?: string;
  printAreaClassName?: string;
  children: React.ReactNode;
}

export function PrintableDocumentShell({
  memberId,
  memberName,
  documentTitle,
  backFallbackHref,
  onBack,
  toolbarActions,
  dateValue,
  onDateChange,
  dateLabel = "Дата:",
  screenHint,
  printButtonLabel = "Принтирай",
  pdfElementRef,
  pdfFileName,
  pdfOrientation = "portrait",
  printPageMargin = "10mm 15mm 10mm 15mm",
  printFontSize = "10.5pt",
  printLineHeight = "1.35",
  printAreaClassName,
  children,
}: PrintableDocumentShellProps) {
  const defaultBack = useMemberBackNavigation(memberId, backFallbackHref);
  const handleBack = onBack ?? defaultBack;
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const handleDownloadPdf = async () => {
    const el = pdfElementRef?.current;
    if (!el || !pdfFileName) return;

    setIsExportingPdf(true);
    try {
      await generatePdfFromElement(el, pdfFileName, pdfOrientation);
    } catch (err) {
      console.error("PDF export error:", err);
      toast.error("Грешка при генериране на PDF файла.");
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-100 dark:bg-zinc-950 print:min-h-0 print:bg-white print:p-0">
      {/* Compact non-printable header & toolbar */}
      <div className="sticky top-0 z-20 border-b border-zinc-200 bg-white/95 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/95 print:hidden">
        <div className="mx-auto max-w-4xl px-4 py-3 md:px-8">
          <PageHeader
            title={documentTitle}
            className="mb-2 sm:mb-2.5"
            breadcrumbs={[
              { label: "Начало", href: "/dashboard" },
              { label: "Членове", href: "/members" },
              { label: memberName, href: `/members/${memberId}` },
              { label: "Документи", href: `/members/${memberId}/documents` },
              { label: documentTitle },
            ]}
          />

          <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
            <Button
              type="button"
              variant="outline"
              onClick={handleBack}
              className="h-9 rounded-xl border-zinc-200 bg-white text-zinc-800 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
            >
              <ArrowLeft className="mr-2 size-4" /> Назад
            </Button>

            <div className="flex flex-wrap items-center gap-2">
              {onDateChange && (
                <label className="flex h-9 items-center gap-1.5 rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-xs text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300">
                  <Calendar className="size-3.5 text-zinc-500 dark:text-zinc-400" />
                  <span className="font-medium text-zinc-600 dark:text-zinc-400">
                    {dateLabel}
                  </span>
                  <input
                    type="date"
                    value={dateValue ?? ""}
                    onChange={(e) => onDateChange(e.target.value)}
                    className="cursor-pointer bg-transparent text-xs font-semibold text-zinc-900 focus:outline-none dark:text-zinc-100 dark:scheme-dark"
                    title="Редактирай датата на документа"
                  />
                </label>
              )}

              {toolbarActions}

              {pdfElementRef && pdfFileName && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleDownloadPdf}
                  disabled={isExportingPdf}
                  className="h-9 rounded-xl border-zinc-200 bg-white text-zinc-800 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
                >
                  {isExportingPdf ? (
                    <Loader2 className="mr-2 size-4 animate-spin" />
                  ) : (
                    <Download className="mr-2 size-4" />
                  )}
                  Изтегли PDF
                </Button>
              )}

              <Button
                type="button"
                onClick={() => window.print()}
                className="h-9 rounded-xl bg-zinc-950 text-white shadow-sm hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
              >
                <Printer className="mr-2 size-4" /> {printButtonLabel}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Document container */}
      <div className="mx-auto max-w-4xl p-4 md:p-8 print:max-w-none print:p-0">
        {screenHint && (
          <div className="mb-4 text-xs text-zinc-500 dark:text-zinc-400 print:hidden">
            {screenHint}
          </div>
        )}

        <div
          className={cn(
            "print-area relative rounded-xl border border-zinc-200/80 bg-white p-6 text-slate-900 shadow-sm md:p-10 dark:border-zinc-800 print:rounded-none print:border-0 print:p-0 print:shadow-none",
            printAreaClassName
          )}
        >
          {children}
        </div>
      </div>

      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: ${printPageMargin};
          }
          html,
          body {
            margin: 0 !important;
            padding: 0 !important;
            background: #fff !important;
            color: #0f172a !important;
          }
          body * {
            visibility: hidden;
          }
          .print-area,
          .print-area * {
            visibility: visible;
          }
          .print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
            background: #fff !important;
            color: #0f172a !important;
            font-size: ${printFontSize} !important;
            line-height: ${printLineHeight} !important;
          }
        }
      `}</style>
    </div>
  );
}
