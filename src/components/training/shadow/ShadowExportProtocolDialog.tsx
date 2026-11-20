"use client";

import { Download, FileText, Loader2, Printer } from "lucide-react";
import React, { useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { generatePdfFromElement } from "@/lib/html-to-pdf";

import {
  ShadowOfficialProtocol,
  ShadowOfficialProtocolProps,
} from "./ShadowOfficialProtocol";

export interface ShadowExportProtocolDialogProps extends ShadowOfficialProtocolProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ShadowExportProtocolDialog({
  open,
  onOpenChange,
  ...protocolProps
}: ShadowExportProtocolDialogProps) {
  const protocolRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  const handleDownloadPdf = async () => {
    const el = protocolRef.current;
    if (!el) {
      toast.error("Неуспешно намиране на бланката за печат.");
      return;
    }

    setIsExporting(true);
    try {
      const modeSuffix =
        protocolProps.mode === "agility_test" ? "Agility-Test" : "Footwork";
      const fileName = `Protokol-${modeSuffix}-${new Date().toISOString().slice(0, 10)}.pdf`;
      await generatePdfFromElement(el, fileName, "portrait");
      toast.success("Официалният протокол е свален като PDF!");
    } catch (err) {
      console.error("PDF generation failed:", err);
      toast.error("Възникна грешка при генерирането на PDF файла.");
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-4xl overflow-y-auto border-zinc-200 bg-white p-4 sm:p-6 dark:border-zinc-800 dark:bg-zinc-950">
        <DialogHeader className="border-b border-zinc-200 pb-3 dark:border-zinc-800">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <DialogTitle className="flex items-center gap-2 text-base font-black tracking-tight text-zinc-900 sm:text-lg dark:text-white">
                <FileText className="size-5 text-blue-600 dark:text-blue-400" />
                Официален Клубен Протокол за Печат &amp; PDF
              </DialogTitle>
              <DialogDescription className="text-xs text-zinc-500 dark:text-zinc-400">
                Генерира официална бланка на БК Гълъбово с емблема, резултати и
                подписи
              </DialogDescription>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handlePrint}
                className="h-8.5 rounded-xl border-zinc-300 text-xs font-bold dark:border-zinc-700"
              >
                <Printer className="mr-1.5 size-3.5" />
                Принтирай
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleDownloadPdf}
                disabled={isExporting}
                className="h-8.5 rounded-xl bg-blue-600 px-3.5 text-xs font-bold text-white hover:bg-blue-700"
              >
                {isExporting ? (
                  <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                ) : (
                  <Download className="mr-1.5 size-3.5" />
                )}
                {isExporting ? "Генериране..." : "Свали PDF"}
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Scrollable Printable Document Container */}
        <div className="my-2 flex justify-center overflow-x-auto rounded-xl bg-zinc-100 p-3 dark:bg-zinc-900">
          <ShadowOfficialProtocol ref={protocolRef} {...protocolProps} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
